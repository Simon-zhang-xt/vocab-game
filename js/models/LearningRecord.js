/**
 * LearningRecord Model - User learning session tracking
 * Schema defined in contracts/progress-schema.json
 */

class LearningRecord {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.userId = data.userId || 'local-user';
        this.courseId = data.courseId;
        this.startedAt = data.startedAt || new Date().toISOString();
        this.completedAt = data.completedAt || null;
        this.status = data.status || 'in-progress'; // 'in-progress', 'completed', 'abandoned'
        this.answers = data.answers || [];
        this.correctCount = data.correctCount || 0;
        this.totalQuestions = data.totalQuestions || 0;
        this.accuracyPercentage = data.accuracyPercentage || 0;
        this.timeSpentSeconds = data.timeSpentSeconds || 0;
    }

    /**
     * Generate unique ID
     * @returns {string}
     */
    generateId() {
        return `lr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add answer record
     * @param {Object} answerRecord
     */
    addAnswer(answerRecord) {
        this.answers.push(answerRecord);
        this.totalQuestions = this.answers.length;
        this.calculateStats();
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        this.correctCount = this.answers.filter(a => a.isCorrect).length;
        this.accuracyPercentage = this.totalQuestions > 0
            ? parseFloat(((this.correctCount / this.totalQuestions) * 100).toFixed(2))
            : 0;
    }

    /**
     * Mark as completed
     */
    complete() {
        this.status = 'completed';
        this.completedAt = new Date().toISOString();
        this.calculateTimeSpent();
    }

    /**
     * Mark as abandoned
     */
    abandon() {
        this.status = 'abandoned';
        this.calculateTimeSpent();
    }

    /**
     * Calculate time spent
     */
    calculateTimeSpent() {
        if (this.startedAt) {
            const start = new Date(this.startedAt);
            const end = this.completedAt ? new Date(this.completedAt) : new Date();
            this.timeSpentSeconds = Math.floor((end - start) / 1000);
        }
    }

    /**
     * Get formatted time spent
     * @returns {string}
     */
    getFormattedTime() {
        const minutes = Math.floor(this.timeSpentSeconds / 60);
        const seconds = this.timeSpentSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Validate record data
     * @returns {boolean}
     */
    isValid() {
        return !!(
            this.id &&
            this.userId &&
            this.courseId &&
            this.startedAt &&
            this.status &&
            Array.isArray(this.answers) &&
            typeof this.correctCount === 'number' &&
            typeof this.totalQuestions === 'number'
        );
    }
}

export default LearningRecord;
