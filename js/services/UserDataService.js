/**
 * User Data Service
 * 处理用户学习数据的云端同步
 */

import supabase from '../config/supabase.js';
import authService from './AuthService.js';

class UserDataService {
    /**
     * 保存课程进度
     */
    async saveProgress(courseId, progressData) {
        const user = authService.getCurrentUser();
        if (!user) {
            console.warn('User not authenticated, cannot save progress');
            return { error: new Error('Not authenticated') };
        }

        try {
            const { data, error } = await supabase
                .from('user_progress')
                .upsert({
                    user_id: user.id,
                    course_id: courseId,
                    status: progressData.status || 'completed',
                    accuracy: progressData.accuracy,
                    words_learned: progressData.wordsLearned,
                    time_spent: progressData.timeSpent,
                    completed_at: progressData.status === 'completed' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,course_id'
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Save progress error:', error);
            return { data: null, error };
        }
    }

    /**
     * 获取用户所有进度
     */
    async getUserProgress() {
        const user = authService.getCurrentUser();
        if (!user) {
            return { data: [], error: null };
        }

        try {
            const { data, error } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Get progress error:', error);
            return { data: [], error };
        }
    }

    /**
     * 保存错题记录
     */
    async saveMistake(courseId, questionId, wordId, userAnswer, correctAnswer) {
        const user = authService.getCurrentUser();
        if (!user) return { error: new Error('Not authenticated') };

        try {
            const { data, error } = await supabase
                .from('mistake_records')
                .insert({
                    user_id: user.id,
                    course_id: courseId,
                    question_id: questionId,
                    word_id: wordId,
                    user_answer: userAnswer,
                    correct_answer: correctAnswer
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Save mistake error:', error);
            return { data: null, error };
        }
    }

    /**
     * 获取错题集
     */
    async getMistakes(limit = 50) {
        const user = authService.getCurrentUser();
        if (!user) return { data: [], error: null };

        try {
            const { data, error } = await supabase
                .from('mistake_records')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Get mistakes error:', error);
            return { data: [], error };
        }
    }

    /**
     * 更新单词掌握度
     */
    async updateWordMastery(wordId, isCorrect) {
        const user = authService.getCurrentUser();
        if (!user) return { error: new Error('Not authenticated') };

        try {
            // 先获取当前掌握度
            const { data: existing } = await supabase
                .from('word_mastery')
                .select('*')
                .eq('user_id', user.id)
                .eq('word_id', wordId)
                .single();

            let masteryData;
            if (existing) {
                // 更新现有记录
                const newLevel = isCorrect
                    ? Math.min(5, existing.mastery_level + 1)
                    : Math.max(0, existing.mastery_level - 1);

                const newCorrectCount = isCorrect ? existing.correct_count + 1 : existing.correct_count;
                const newIncorrectCount = isCorrect ? existing.incorrect_count : existing.incorrect_count + 1;

                // 计算下次复习时间（艾宾浩斯曲线）
                const nextReview = this.calculateNextReview(newLevel);

                const { data, error } = await supabase
                    .from('word_mastery')
                    .update({
                        mastery_level: newLevel,
                        correct_count: newCorrectCount,
                        incorrect_count: newIncorrectCount,
                        last_reviewed: new Date().toISOString(),
                        next_review: nextReview,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                masteryData = data;
            } else {
                // 创建新记录
                const nextReview = this.calculateNextReview(isCorrect ? 1 : 0);

                const { data, error } = await supabase
                    .from('word_mastery')
                    .insert({
                        user_id: user.id,
                        word_id: wordId,
                        mastery_level: isCorrect ? 1 : 0,
                        correct_count: isCorrect ? 1 : 0,
                        incorrect_count: isCorrect ? 0 : 1,
                        last_reviewed: new Date().toISOString(),
                        next_review: nextReview
                    })
                    .select()
                    .single();

                if (error) throw error;
                masteryData = data;
            }

            return { data: masteryData, error: null };
        } catch (error) {
            console.error('Update word mastery error:', error);
            return { data: null, error };
        }
    }

    /**
     * 计算下次复习时间（艾宾浩斯遗忘曲线）
     */
    calculateNextReview(masteryLevel) {
        // 间隔时间（分钟）
        const intervals = [
            1,      // Level 0: 1分钟
            10,     // Level 1: 10分钟
            60,     // Level 2: 1小时
            720,    // Level 3: 12小时
            1440,   // Level 4: 1天
            10080   // Level 5: 7天
        ];

        const minutes = intervals[Math.min(masteryLevel, intervals.length - 1)];
        const nextReview = new Date();
        nextReview.setMinutes(nextReview.getMinutes() + minutes);

        return nextReview.toISOString();
    }

    /**
     * 获取需要复习的单词
     */
    async getDueWords(limit = 20) {
        const user = authService.getCurrentUser();
        if (!user) return { data: [], error: null };

        try {
            const { data, error } = await supabase
                .from('word_mastery')
                .select('*')
                .eq('user_id', user.id)
                .lte('next_review', new Date().toISOString())
                .order('next_review', { ascending: true })
                .limit(limit);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Get due words error:', error);
            return { data: [], error };
        }
    }

    /**
     * 记录每日学习统计
     */
    async recordDailyStats(wordsLearned, coursesCompleted, timeSpent, accuracy, pointsEarned) {
        const user = authService.getCurrentUser();
        if (!user) return { error: new Error('Not authenticated') };

        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('daily_stats')
                .upsert({
                    user_id: user.id,
                    date: today,
                    words_learned: wordsLearned,
                    courses_completed: coursesCompleted,
                    time_spent: timeSpent,
                    accuracy: accuracy,
                    points_earned: pointsEarned
                }, {
                    onConflict: 'user_id,date'
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Record daily stats error:', error);
            return { data: null, error };
        }
    }

    /**
     * 获取用户统计数据
     */
    async getUserStats() {
        const user = authService.getCurrentUser();
        if (!user) return { data: null, error: null };

        try {
            // 获取总进度
            const { data: progress } = await this.getUserProgress();

            // 计算总计
            const totalCourses = progress.length;
            const completedCourses = progress.filter(p => p.status === 'completed').length;
            const totalWords = progress.reduce((sum, p) => sum + (p.words_learned || 0), 0);
            const totalTime = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
            const avgAccuracy = progress.length > 0
                ? progress.reduce((sum, p) => sum + (p.accuracy || 0), 0) / progress.length
                : 0;

            // 获取错题数
            const { data: mistakes } = await supabase
                .from('mistake_records')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id);

            // 获取成就数
            const { data: achievements } = await supabase
                .from('user_achievements')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id);

            // 获取用户profile
            const { profile } = await authService.getUserProfile(user.id);

            return {
                data: {
                    totalCourses,
                    completedCourses,
                    totalWords,
                    totalTime,
                    avgAccuracy: avgAccuracy.toFixed(2),
                    mistakeCount: mistakes?.length || 0,
                    achievementCount: achievements?.length || 0,
                    level: profile?.level || 1,
                    points: profile?.points || 0,
                    streakDays: profile?.streak_days || 0
                },
                error: null
            };
        } catch (error) {
            console.error('Get user stats error:', error);
            return { data: null, error };
        }
    }

    /**
     * 解锁成就
     */
    async unlockAchievement(achievementId) {
        const user = authService.getCurrentUser();
        if (!user) return { error: new Error('Not authenticated') };

        try {
            // 检查是否已解锁
            const { data: existing } = await supabase
                .from('user_achievements')
                .select('id')
                .eq('user_id', user.id)
                .eq('achievement_id', achievementId)
                .single();

            if (existing) {
                return { data: existing, error: null }; // 已经解锁
            }

            // 解锁新成就
            const { data, error } = await supabase
                .from('user_achievements')
                .insert({
                    user_id: user.id,
                    achievement_id: achievementId
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Unlock achievement error:', error);
            return { data: null, error };
        }
    }
}

// 创建单例
const userDataService = new UserDataService();

export default userDataService;
