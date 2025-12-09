/**
 * Daily Goal Service
 * 每日学习目标和连续天数追踪服务
 */

import authService from './AuthService.js';
import supabase from '../config/supabase.js';

class DailyGoalService {
    constructor() {
        this.DEFAULT_DAILY_GOAL = 20; // 默认每天学习20个单词
    }

    /**
     * 设置每日学习目标
     */
    async setDailyGoal(wordsCount) {
        const user = authService.getCurrentUser();

        if (!user) {
            // 游客模式，使用LocalStorage
            localStorage.setItem('daily_goal', wordsCount);
            return { success: true };
        }

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ daily_goal: wordsCount })
                .eq('user_id', user.id);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Set daily goal error:', error);
            return { success: false, error };
        }
    }

    /**
     * 获取每日学习目标
     */
    async getDailyGoal() {
        const user = authService.getCurrentUser();

        if (!user) {
            // 游客模式
            const goal = localStorage.getItem('daily_goal');
            return parseInt(goal) || this.DEFAULT_DAILY_GOAL;
        }

        try {
            const { profile } = await authService.getUserProfile(user.id);
            return profile?.daily_goal || this.DEFAULT_DAILY_GOAL;
        } catch (error) {
            console.error('Get daily goal error:', error);
            return this.DEFAULT_DAILY_GOAL;
        }
    }

    /**
     * 获取今日学习进度
     */
    async getTodayProgress() {
        const user = authService.getCurrentUser();
        const today = new Date().toISOString().split('T')[0];

        if (!user) {
            // 游客模式 - 从LocalStorage获取
            const todayData = localStorage.getItem(`progress_${today}`);
            if (todayData) {
                const data = JSON.parse(todayData);
                return {
                    wordsLearned: data.wordsLearned || 0,
                    coursesCompleted: data.coursesCompleted || 0,
                    timeSpent: data.timeSpent || 0
                };
            }
            return { wordsLearned: 0, coursesCompleted: 0, timeSpent: 0 };
        }

        try {
            const { data, error } = await supabase
                .from('daily_stats')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

            return {
                wordsLearned: data?.words_learned || 0,
                coursesCompleted: data?.courses_completed || 0,
                timeSpent: data?.time_spent || 0,
                accuracy: data?.accuracy || 0
            };
        } catch (error) {
            console.error('Get today progress error:', error);
            return { wordsLearned: 0, coursesCompleted: 0, timeSpent: 0 };
        }
    }

    /**
     * 更新今日学习进度
     */
    async updateTodayProgress(wordsLearned, coursesCompleted, timeSpent, accuracy) {
        const user = authService.getCurrentUser();
        const today = new Date().toISOString().split('T')[0];

        if (!user) {
            // 游客模式
            const existingData = localStorage.getItem(`progress_${today}`);
            const data = existingData ? JSON.parse(existingData) : {
                wordsLearned: 0,
                coursesCompleted: 0,
                timeSpent: 0
            };

            data.wordsLearned += wordsLearned;
            data.coursesCompleted += coursesCompleted;
            data.timeSpent += timeSpent;

            localStorage.setItem(`progress_${today}`, JSON.stringify(data));

            // 检查是否完成目标
            const goal = await this.getDailyGoal();
            if (data.wordsLearned >= goal && !data.goalCompleted) {
                data.goalCompleted = true;
                localStorage.setItem(`progress_${today}`, JSON.stringify(data));
                this.celebrateGoalCompletion();
            }

            return { success: true };
        }

        try {
            // 获取现有数据
            const currentProgress = await this.getTodayProgress();

            const newWordsLearned = currentProgress.wordsLearned + wordsLearned;
            const newCoursesCompleted = currentProgress.coursesCompleted + coursesCompleted;
            const newTimeSpent = currentProgress.timeSpent + timeSpent;
            const newAccuracy = accuracy || currentProgress.accuracy;

            const { error } = await supabase
                .from('daily_stats')
                .upsert({
                    user_id: user.id,
                    date: today,
                    words_learned: newWordsLearned,
                    courses_completed: newCoursesCompleted,
                    time_spent: newTimeSpent,
                    accuracy: newAccuracy
                }, {
                    onConflict: 'user_id,date'
                });

            if (error) throw error;

            // 检查是否完成今日目标
            const goal = await this.getDailyGoal();
            if (newWordsLearned >= goal && currentProgress.wordsLearned < goal) {
                this.celebrateGoalCompletion();
            }

            // 更新连续学习天数
            await this.updateStreakDays();

            return { success: true };
        } catch (error) {
            console.error('Update today progress error:', error);
            return { success: false, error };
        }
    }

    /**
     * 庆祝完成今日目标
     */
    celebrateGoalCompletion() {
        // 触发庆祝动画和通知
        if (typeof window !== 'undefined' && window.showGoalCompletionCelebration) {
            window.showGoalCompletionCelebration();
        }
    }

    /**
     * 获取连续学习天数
     */
    async getStreakDays() {
        const user = authService.getCurrentUser();

        if (!user) {
            // 游客模式
            return this.calculateGuestStreakDays();
        }

        try {
            const { profile } = await authService.getUserProfile(user.id);
            return profile?.streak_days || 0;
        } catch (error) {
            console.error('Get streak days error:', error);
            return 0;
        }
    }

    /**
     * 计算游客模式的连续天数
     */
    calculateGuestStreakDays() {
        const today = new Date();
        let streak = 0;
        let checkDate = new Date(today);

        // 往前检查，直到找到中断的一天
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const progressData = localStorage.getItem(`progress_${dateStr}`);

            if (!progressData) {
                break; // 这一天没有学习记录，中断
            }

            const data = JSON.parse(progressData);
            if (data.wordsLearned === 0) {
                break; // 这一天没有学习单词，中断
            }

            streak++;
            checkDate.setDate(checkDate.getDate() - 1);

            // 最多检查100天，防止无限循环
            if (streak > 100) break;
        }

        return streak;
    }

    /**
     * 更新连续学习天数
     */
    async updateStreakDays() {
        const user = authService.getCurrentUser();
        if (!user) return; // 游客模式不需要更新数据库

        try {
            const { profile } = await authService.getUserProfile(user.id);
            const lastStudyDate = profile?.last_study_date;
            const today = new Date().toISOString().split('T')[0];

            if (!lastStudyDate || lastStudyDate === today) {
                // 今天已经更新过了
                return;
            }

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let newStreakDays;

            if (lastStudyDate === yesterdayStr) {
                // 连续学习
                newStreakDays = (profile.streak_days || 0) + 1;
            } else {
                // 中断了，重新开始
                newStreakDays = 1;
            }

            // 更新数据库
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    streak_days: newStreakDays,
                    last_study_date: today
                })
                .eq('user_id', user.id);

            if (error) throw error;

            // 里程碑奖励
            this.checkStreakMilestone(newStreakDays);

        } catch (error) {
            console.error('Update streak days error:', error);
        }
    }

    /**
     * 检查连续学习天数里程碑
     */
    checkStreakMilestone(streakDays) {
        const milestones = [7, 30, 100, 365];

        if (milestones.includes(streakDays)) {
            // 触发里程碑庆祝
            if (typeof window !== 'undefined' && window.showStreakMilestone) {
                window.showStreakMilestone(streakDays);
            }
        }
    }

    /**
     * 获取学习统计摘要
     */
    async getLearningSummary() {
        const [todayProgress, dailyGoal, streakDays] = await Promise.all([
            this.getTodayProgress(),
            this.getDailyGoal(),
            this.getStreakDays()
        ]);

        const progress = todayProgress.wordsLearned / dailyGoal;
        const isGoalCompleted = progress >= 1;

        return {
            todayProgress,
            dailyGoal,
            streakDays,
            progress: Math.min(progress, 1),
            isGoalCompleted,
            remainingWords: Math.max(0, dailyGoal - todayProgress.wordsLearned)
        };
    }
}

// 创建单例
const dailyGoalService = new DailyGoalService();

export default dailyGoalService;
