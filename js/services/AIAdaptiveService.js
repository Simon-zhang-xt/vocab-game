/**
 * AI Adaptive Learning Service
 * V4.0 Phase 1: Intelligent learning path recommendation
 * Uses machine learning algorithms for personalized learning
 */

import CourseService from './CourseService.js';
import StorageService from './StorageService.js';

export default class AIAdaptiveService {
    constructor() {
        this.courseService = new CourseService();
        this.learningProfile = this.loadLearningProfile();
        this.forgettingCurve = this.initializeForgettingCurve();
    }

    /**
     * Initialize Ebbinghaus Forgetting Curve parameters
     */
    initializeForgettingCurve() {
        return {
            // Retention rates at different intervals
            intervals: [
                { days: 1, retention: 0.58 },
                { days: 2, retention: 0.44 },
                { days: 7, retention: 0.36 },
                { days: 14, retention: 0.30 },
                { days: 30, retention: 0.25 }
            ],
            // Spaced repetition intervals (days)
            spacedRepetition: [1, 2, 4, 7, 15, 30, 60, 120]
        };
    }

    /**
     * Generate personalized learning path
     */
    async generateLearningPath(userId) {
        const profile = await this.analyzeLearningProfile(userId);
        const recommendations = this.calculateRecommendations(profile);

        return {
            profile,
            recommendations,
            nextReview: this.scheduleNextReview(profile),
            suggestedCourses: this.suggestCourses(profile),
            difficultyAdjustment: this.calculateDifficultyLevel(profile)
        };
    }

    /**
     * Analyze user's learning profile
     */
    async analyzeLearningProfile(userId) {
        const allCourses = this.courseService.getAllCourses();
        const learningRecords = this.getLearningRecords();

        // Calculate performance metrics
        const totalWords = learningRecords.length;
        const masteredWords = learningRecords.filter(r => r.masteryLevel >= 4).length;
        const averageAccuracy = this.calculateAverageAccuracy(learningRecords);
        const studyTimePatterns = this.analyzeStudyTimePatterns(learningRecords);
        const weakAreas = this.identifyWeakAreas(learningRecords);
        const strengths = this.identifyStrengths(learningRecords);

        // Learning velocity (words per day)
        const learningVelocity = this.calculateLearningVelocity(learningRecords);

        // Retention rate
        const retentionRate = this.calculateRetentionRate(learningRecords);

        return {
            userId,
            totalWords,
            masteredWords,
            masteryRate: (masteredWords / totalWords * 100).toFixed(1),
            averageAccuracy,
            studyTimePatterns,
            weakAreas,
            strengths,
            learningVelocity,
            retentionRate,
            preferredDifficulty: this.inferPreferredDifficulty(learningRecords),
            learningStyle: this.inferLearningStyle(learningRecords)
        };
    }

    /**
     * Calculate average accuracy across all attempts
     */
    calculateAverageAccuracy(records) {
        if (records.length === 0) return 0;

        const totalAccuracy = records.reduce((sum, record) => {
            return sum + (record.correctAttempts / record.totalAttempts || 0);
        }, 0);

        return (totalAccuracy / records.length * 100).toFixed(1);
    }

    /**
     * Analyze when user studies most effectively
     */
    analyzeStudyTimePatterns(records) {
        const hourlyPerformance = Array(24).fill(0).map(() => ({ count: 0, accuracy: 0 }));

        records.forEach(record => {
            if (record.timestamp) {
                const hour = new Date(record.timestamp).getHours();
                const accuracy = record.correctAttempts / record.totalAttempts || 0;

                hourlyPerformance[hour].count++;
                hourlyPerformance[hour].accuracy += accuracy;
            }
        });

        // Find peak performance hours
        const peakHours = hourlyPerformance
            .map((data, hour) => ({
                hour,
                avgAccuracy: data.count > 0 ? data.accuracy / data.count : 0,
                sessionsCount: data.count
            }))
            .filter(h => h.sessionsCount > 0)
            .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
            .slice(0, 3);

        return {
            peakHours: peakHours.map(h => h.hour),
            bestPerformanceTime: peakHours[0]?.hour || 10, // Default to 10 AM
            totalSessions: records.length
        };
    }

    /**
     * Identify weak areas that need attention
     */
    identifyWeakAreas(records) {
        const weakWords = records
            .filter(r => {
                const accuracy = r.correctAttempts / r.totalAttempts || 0;
                return accuracy < 0.6 || r.masteryLevel < 2;
            })
            .sort((a, b) => {
                const accA = a.correctAttempts / a.totalAttempts || 0;
                const accB = b.correctAttempts / b.totalAttempts || 0;
                return accA - accB;
            })
            .slice(0, 20);

        return weakWords.map(r => ({
            wordId: r.wordId,
            word: r.word,
            accuracy: ((r.correctAttempts / r.totalAttempts || 0) * 100).toFixed(1),
            masteryLevel: r.masteryLevel,
            needsReview: this.calculateNeedsReview(r)
        }));
    }

    /**
     * Identify user's strengths
     */
    identifyStrengths(records) {
        const strongWords = records
            .filter(r => {
                const accuracy = r.correctAttempts / r.totalAttempts || 0;
                return accuracy >= 0.9 && r.masteryLevel >= 4;
            })
            .sort((a, b) => b.masteryLevel - a.masteryLevel)
            .slice(0, 20);

        return strongWords.map(r => ({
            wordId: r.wordId,
            word: r.word,
            accuracy: ((r.correctAttempts / r.totalAttempts || 0) * 100).toFixed(1),
            masteryLevel: r.masteryLevel
        }));
    }

    /**
     * Calculate learning velocity (words mastered per day)
     */
    calculateLearningVelocity(records) {
        if (records.length === 0) return 0;

        const timestamps = records
            .map(r => r.timestamp)
            .filter(t => t)
            .sort((a, b) => a - b);

        if (timestamps.length < 2) return 0;

        const firstSession = timestamps[0];
        const lastSession = timestamps[timestamps.length - 1];
        const daysDiff = (lastSession - firstSession) / (1000 * 60 * 60 * 24);

        if (daysDiff === 0) return records.length;

        const masteredWords = records.filter(r => r.masteryLevel >= 4).length;
        return (masteredWords / daysDiff).toFixed(2);
    }

    /**
     * Calculate retention rate based on review performance
     */
    calculateRetentionRate(records) {
        const reviewedWords = records.filter(r => r.totalAttempts > 1);

        if (reviewedWords.length === 0) return 100;

        const retainedWords = reviewedWords.filter(r => {
            const lastAccuracy = r.correctAttempts / r.totalAttempts || 0;
            return lastAccuracy >= 0.7;
        }).length;

        return ((retainedWords / reviewedWords.length) * 100).toFixed(1);
    }

    /**
     * Infer user's preferred difficulty level
     */
    inferPreferredDifficulty(records) {
        const avgAccuracy = parseFloat(this.calculateAverageAccuracy(records));

        if (avgAccuracy >= 85) return 'hard';
        if (avgAccuracy >= 70) return 'medium';
        return 'easy';
    }

    /**
     * Infer user's learning style
     */
    inferLearningStyle(records) {
        // Analyze which features are used most
        const hasImageMemory = records.some(r => r.studyMethod === 'image-memory');
        const hasEtymology = records.some(r => r.studyMethod === 'etymology');
        const hasPronunciation = records.some(r => r.studyMethod === 'pronunciation');

        if (hasImageMemory) return 'visual';
        if (hasPronunciation) return 'auditory';
        if (hasEtymology) return 'analytical';
        return 'mixed';
    }

    /**
     * Calculate recommendations based on profile
     */
    calculateRecommendations(profile) {
        const recommendations = [];

        // Accuracy-based recommendations
        if (profile.averageAccuracy < 70) {
            recommendations.push({
                type: 'warning',
                priority: 'high',
                title: '提高准确率',
                description: '您的平均准确率较低，建议放慢学习速度，多复习已学单词。',
                action: 'review',
                icon: '⚠️'
            });
        }

        // Mastery-based recommendations
        if (profile.masteryRate < 50) {
            recommendations.push({
                type: 'tip',
                priority: 'medium',
                title: '加强记忆',
                description: '尝试使用图像记忆和词根词缀方法来提高记忆效果。',
                action: 'try-methods',
                icon: '💡'
            });
        }

        // Weak areas recommendations
        if (profile.weakAreas.length > 0) {
            recommendations.push({
                type: 'action',
                priority: 'high',
                title: '针对性复习',
                description: `发现 ${profile.weakAreas.length} 个需要加强的单词，建议今天优先复习。`,
                action: 'review-weak',
                icon: '🎯',
                data: profile.weakAreas
            });
        }

        // Study time recommendations
        if (profile.studyTimePatterns.peakHours.length > 0) {
            const bestHour = profile.studyTimePatterns.bestPerformanceTime;
            recommendations.push({
                type: 'tip',
                priority: 'low',
                title: '最佳学习时间',
                description: `您在 ${bestHour}:00 左右学习效果最好，建议在此时间学习新单词。`,
                action: 'schedule',
                icon: '⏰'
            });
        }

        // Learning velocity recommendations
        if (parseFloat(profile.learningVelocity) > 10) {
            recommendations.push({
                type: 'praise',
                priority: 'low',
                title: '学习速度优秀',
                description: '您的学习速度很快！继续保持这个节奏。',
                action: 'none',
                icon: '🚀'
            });
        } else if (parseFloat(profile.learningVelocity) < 2) {
            recommendations.push({
                type: 'tip',
                priority: 'medium',
                title: '提升学习效率',
                description: '建议每天至少学习 5 个新单词，保持学习连贯性。',
                action: 'increase-pace',
                icon: '📈'
            });
        }

        return recommendations.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
        });
    }

    /**
     * Schedule next review based on spaced repetition
     */
    scheduleNextReview(profile) {
        const wordsNeedingReview = [];
        const records = this.getLearningRecords();
        const now = Date.now();

        records.forEach(record => {
            if (record.masteryLevel < 5) {
                const daysSinceLastReview = (now - (record.lastReviewed || record.timestamp)) / (1000 * 60 * 60 * 24);
                const nextInterval = this.forgettingCurve.spacedRepetition[record.masteryLevel] || 1;

                if (daysSinceLastReview >= nextInterval) {
                    wordsNeedingReview.push({
                        ...record,
                        daysSinceLastReview: Math.floor(daysSinceLastReview),
                        urgency: this.calculateUrgency(daysSinceLastReview, nextInterval)
                    });
                }
            }
        });

        // Sort by urgency
        wordsNeedingReview.sort((a, b) => b.urgency - a.urgency);

        return {
            total: wordsNeedingReview.length,
            urgent: wordsNeedingReview.filter(w => w.urgency > 1.5).length,
            words: wordsNeedingReview.slice(0, 20)
        };
    }

    /**
     * Calculate urgency score for review
     */
    calculateUrgency(daysSince, expectedInterval) {
        return daysSince / expectedInterval;
    }

    /**
     * Calculate if word needs review
     */
    calculateNeedsReview(record) {
        const daysSinceLastReview = (Date.now() - (record.lastReviewed || record.timestamp)) / (1000 * 60 * 60 * 24);
        const nextInterval = this.forgettingCurve.spacedRepetition[record.masteryLevel] || 1;

        return daysSinceLastReview >= nextInterval;
    }

    /**
     * Suggest courses based on user profile
     */
    suggestCourses(profile) {
        const allCourses = this.courseService.getAllCourses();
        const completedCourses = this.getCompletedCourses();
        const suggestions = [];

        allCourses.forEach(course => {
            if (!completedCourses.includes(course.id)) {
                // Calculate suitability score
                const difficultyMatch = this.matchDifficulty(course.difficulty, profile.preferredDifficulty);
                const categoryRelevance = this.calculateCategoryRelevance(course, profile);

                const suitabilityScore = (difficultyMatch * 0.6) + (categoryRelevance * 0.4);

                suggestions.push({
                    course,
                    suitabilityScore: (suitabilityScore * 100).toFixed(1),
                    reason: this.generateSuggestionReason(course, profile)
                });
            }
        });

        return suggestions
            .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
            .slice(0, 5);
    }

    /**
     * Match course difficulty with user preference
     */
    matchDifficulty(courseDifficulty, userPreference) {
        const difficultyMap = { easy: 1, medium: 2, hard: 3 };
        const courseLev = difficultyMap[courseDifficulty] || 2;
        const userLev = difficultyMap[userPreference] || 2;

        const difference = Math.abs(courseLev - userLev);
        return 1 - (difference * 0.3);
    }

    /**
     * Calculate category relevance
     */
    calculateCategoryRelevance(course, profile) {
        // Prioritize categories user performs well in
        const userCategories = profile.strengths.map(s => s.category || 'general');
        const courseCategory = course.category || 'general';

        return userCategories.includes(courseCategory) ? 1.0 : 0.7;
    }

    /**
     * Generate suggestion reason
     */
    generateSuggestionReason(course, profile) {
        const reasons = [];

        if (this.matchDifficulty(course.difficulty, profile.preferredDifficulty) > 0.8) {
            reasons.push('难度适中');
        }

        if (profile.learningStyle === 'visual' && course.hasImages) {
            reasons.push('包含图像学习');
        }

        if (profile.learningStyle === 'analytical' && course.hasEtymology) {
            reasons.push('包含词根词缀');
        }

        if (reasons.length === 0) {
            reasons.push('推荐学习');
        }

        return reasons.join('，');
    }

    /**
     * Calculate difficulty level adjustment
     */
    calculateDifficultyLevel(profile) {
        const avgAccuracy = parseFloat(profile.averageAccuracy);
        const retentionRate = parseFloat(profile.retentionRate);

        let recommendation = 'maintain';
        let nextDifficulty = profile.preferredDifficulty;

        if (avgAccuracy >= 90 && retentionRate >= 85) {
            recommendation = 'increase';
            nextDifficulty = profile.preferredDifficulty === 'easy' ? 'medium' : 'hard';
        } else if (avgAccuracy < 60 || retentionRate < 60) {
            recommendation = 'decrease';
            nextDifficulty = profile.preferredDifficulty === 'hard' ? 'medium' : 'easy';
        }

        return {
            current: profile.preferredDifficulty,
            recommended: nextDifficulty,
            action: recommendation,
            reason: this.getDifficultyReason(recommendation, avgAccuracy, retentionRate)
        };
    }

    /**
     * Get difficulty adjustment reason
     */
    getDifficultyReason(action, accuracy, retention) {
        if (action === 'increase') {
            return '您的表现优秀，建议尝试更高难度以加快进步';
        } else if (action === 'decrease') {
            return '建议降低难度，巩固基础后再提升';
        }
        return '当前难度合适，继续保持';
    }

    /**
     * Get learning records from storage
     */
    getLearningRecords() {
        const courses = this.courseService.getAllCourses();
        const records = [];

        courses.forEach(course => {
            course.words.forEach(word => {
                if (word.studied) {
                    records.push({
                        wordId: word.id,
                        word: word.word,
                        courseId: course.id,
                        category: course.category,
                        correctAttempts: word.correctAttempts || 0,
                        totalAttempts: word.totalAttempts || 1,
                        masteryLevel: word.masteryLevel || 1,
                        timestamp: word.lastStudied || Date.now(),
                        lastReviewed: word.lastReviewed,
                        studyMethod: word.studyMethod
                    });
                }
            });
        });

        return records;
    }

    /**
     * Get completed courses
     */
    getCompletedCourses() {
        const courses = this.courseService.getAllCourses();
        return courses
            .filter(course => course.completed)
            .map(course => course.id);
    }

    /**
     * Load learning profile
     */
    loadLearningProfile() {
        try {
            const data = localStorage.getItem('aiLearningProfile');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to load learning profile:', error);
            return {};
        }
    }

    /**
     * Save learning profile
     */
    saveLearningProfile(profile) {
        try {
            this.learningProfile = profile;
            localStorage.setItem('aiLearningProfile', JSON.stringify(profile));
        } catch (error) {
            console.error('Failed to save learning profile:', error);
        }
    }

    /**
     * Update learning profile with new data
     */
    async updateProfile(userId) {
        const profile = await this.analyzeLearningProfile(userId);
        this.saveLearningProfile(profile);
        return profile;
    }
}
