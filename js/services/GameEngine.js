/**
 * GameEngine - Quiz game logic and state management
 * Custom implementation per research.md
 */

import StorageService from './StorageService.js';
import VocabService from './VocabService.js';
import Course from '../models/Course.js';
import InteractiveQuestion from '../models/InteractiveQuestion.js';
import LearningRecord from '../models/LearningRecord.js';
import audioManager from '../utils/audio.js';
import authService from './AuthService.js';
import userDataService from './UserDataService.js';

class GameEngine {
    constructor(courseId) {
        this.courseId = courseId;
        this.course = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.record = null;
        this.incorrectQuestions = []; // For retry logic (FR-011)
        this.inRetryPhase = false;
    }

    /**
     * Initialize game
     * @returns {Promise<void>}
     */
    async init() {
        // Load course data
        const courseData = StorageService.findById(StorageService.KEYS.COURSES, this.courseId);
        if (!courseData) {
            throw new Error(`Course not found: ${this.courseId}`);
        }

        this.course = new Course(courseData);
        this.questions = this.course.questions.map(q => new InteractiveQuestion(q));

        // Create learning record
        this.record = new LearningRecord({
            courseId: this.courseId,
            totalQuestions: this.questions.length
        });

        console.log(`GameEngine initialized for course: ${this.course.title}`);
    }

    /**
     * Get current question
     * @returns {InteractiveQuestion|null}
     */
    getCurrentQuestion() {
        if (this.inRetryPhase) {
            return this.incorrectQuestions[0] || null;
        }
        return this.questions[this.currentQuestionIndex] || null;
    }

    /**
     * Submit answer
     * @param {string|number} userAnswer
     * @returns {Object} Result object
     */
    async submitAnswer(userAnswer) {
        const question = this.getCurrentQuestion();
        if (!question) {
            throw new Error('No current question');
        }

        const isCorrect = question.isCorrect(userAnswer);
        const feedback = question.getFeedback(isCorrect);

        // Create answer record
        const answerRecord = {
            questionId: question.id,
            wordId: question.wordId,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
            attemptCount: 1,
            answeredAt: new Date().toISOString()
        };

        // Track incorrect questions for retry
        if (!isCorrect && !this.inRetryPhase) {
            this.incorrectQuestions.push(question);
        }

        // Add to learning record
        this.record.addAnswer(answerRecord);

        // Sync to cloud if user is authenticated
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            try {
                // Update word mastery using Ebbinghaus curve
                await userDataService.updateWordMastery(question.wordId, isCorrect);

                // Save mistake record if incorrect
                if (!isCorrect) {
                    await userDataService.saveMistake({
                        courseId: this.courseId,
                        wordId: question.wordId,
                        questionType: question.type,
                        userAnswer: userAnswer,
                        correctAnswer: question.correctAnswer
                    });
                }

                console.log(`Cloud sync: word ${question.wordId}, correct: ${isCorrect}`);
            } catch (error) {
                console.error('Failed to sync answer to cloud:', error);
                // Don't throw - allow game to continue even if sync fails
            }
        }

        // Play audio feedback
        if (isCorrect) {
            audioManager.play('correct');
        } else {
            audioManager.play('incorrect');
        }

        return {
            isCorrect,
            feedback,
            correctAnswer: question.correctAnswer,
            question: question
        };
    }

    /**
     * Move to next question
     * @returns {boolean} Has next question
     */
    nextQuestion() {
        if (this.inRetryPhase) {
            // Remove answered retry question
            this.incorrectQuestions.shift();

            // Check if retry phase is complete
            if (this.incorrectQuestions.length === 0) {
                this.inRetryPhase = false;
                return false; // Course complete
            }
            return true;
        }

        this.currentQuestionIndex++;

        // Check if main questions are complete
        if (this.currentQuestionIndex >= this.questions.length) {
            // Start retry phase if there are incorrect answers
            if (this.incorrectQuestions.length > 0) {
                this.inRetryPhase = true;
                return true;
            }
            return false; // Course complete
        }

        return true;
    }

    /**
     * Get progress percentage
     * @returns {number}
     */
    getProgress() {
        const totalQuestions = this.questions.length + this.incorrectQuestions.length;
        const answeredQuestions = this.record.answers.length;
        return Math.floor((answeredQuestions / totalQuestions) * 100);
    }

    /**
     * Check if course is complete
     * @returns {boolean}
     */
    isComplete() {
        return !this.inRetryPhase &&
               this.currentQuestionIndex >= this.questions.length &&
               this.incorrectQuestions.length === 0;
    }

    /**
     * Get course statistics
     * @returns {Object}
     */
    getStatistics() {
        return {
            courseTitle: this.course.title,
            wordCount: this.course.getWordCount(),
            totalQuestions: this.record.totalQuestions,
            correctCount: this.record.correctCount,
            accuracyPercentage: this.record.accuracyPercentage,
            timeSpentSeconds: this.record.timeSpentSeconds,
            formattedTime: this.record.getFormattedTime()
        };
    }

    /**
     * Complete course and save record
     * @returns {Promise<LearningRecord>}
     */
    async completeCourse() {
        this.record.complete();

        // Play completion sound
        audioManager.play('complete');

        // Save to local storage
        StorageService.add(StorageService.KEYS.LEARNING_RECORDS, this.record);

        // Sync to cloud if user is authenticated
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            try {
                const stats = this.getStatistics();

                // Save course progress
                await userDataService.saveProgress(this.courseId, {
                    status: 'completed',
                    accuracy: stats.accuracyPercentage,
                    wordsLearned: stats.wordCount,
                    timeSpent: stats.timeSpentSeconds
                });

                // Record daily statistics
                await userDataService.recordDailyStats({
                    coursesCompleted: 1,
                    questionsAnswered: stats.totalQuestions,
                    correctAnswers: stats.correctCount,
                    wordsLearned: stats.wordCount,
                    timeSpent: stats.timeSpentSeconds
                });

                console.log('Course progress synced to cloud');
            } catch (error) {
                console.error('Failed to sync course completion to cloud:', error);
                // Don't throw - user can still see local results
            }
        }

        console.log('Course completed:', this.getStatistics());
        return this.record;
    }

    /**
     * Get words for this course
     * @returns {Word[]}
     */
    getCourseWords() {
        return VocabService.getWords(this.course.wordIds);
    }

    /**
     * Get question count
     * @returns {Object}
     */
    getQuestionCount() {
        return {
            current: this.currentQuestionIndex + 1,
            total: this.questions.length,
            retry: this.incorrectQuestions.length,
            inRetryPhase: this.inRetryPhase
        };
    }
}

export default GameEngine;
