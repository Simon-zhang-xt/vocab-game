/**
 * Course Model - Single learning unit
 * Schema defined in contracts/course-schema.json
 */

class Course {
    constructor(data) {
        this.id = data.id;
        this.seriesId = data.seriesId;
        this.title = data.title;
        this.description = data.description || '';
        this.wordIds = data.wordIds || [];
        this.questions = data.questions || [];
        this.estimatedMinutes = data.estimatedMinutes;
        this.sequenceOrder = data.sequenceOrder;
        this.createdAt = data.createdAt;
    }

    /**
     * Get word count
     * @returns {number}
     */
    getWordCount() {
        return this.wordIds.length;
    }

    /**
     * Get question count
     * @returns {number}
     */
    getQuestionCount() {
        return this.questions.length;
    }

    /**
     * Check if course meets constraints
     * @returns {boolean}
     */
    meetsConstraints() {
        const wordCount = this.getWordCount();
        const questionCount = this.getQuestionCount();

        return (
            wordCount >= 10 &&
            wordCount <= 15 &&
            questionCount >= 10 &&
            this.estimatedMinutes >= 5 &&
            this.estimatedMinutes <= 10
        );
    }

    /**
     * Validate course data
     * @returns {boolean}
     */
    isValid() {
        return !!(
            this.id &&
            this.seriesId &&
            this.title &&
            this.wordIds.length > 0 &&
            this.questions.length > 0 &&
            this.estimatedMinutes > 0 &&
            this.sequenceOrder > 0
        );
    }
}

export default Course;
