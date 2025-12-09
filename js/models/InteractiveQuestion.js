/**
 * InteractiveQuestion Model - Quiz question for vocabulary testing
 * Schema defined in contracts/course-schema.json
 */

class InteractiveQuestion {
    constructor(data) {
        this.id = data.id;
        this.type = data.type; // 'multiple-choice', 'matching', 'fill-blank'
        this.wordId = data.wordId;
        this.prompt = data.prompt;
        this.options = data.options || [];
        this.correctAnswer = data.correctAnswer;
        this.feedback = data.feedback || { correct: '', incorrect: '' };
        this.difficulty = data.difficulty;
    }

    /**
     * Check if answer is correct
     * @param {string|number} userAnswer
     * @returns {boolean}
     */
    isCorrect(userAnswer) {
        if (this.type === 'fill-blank') {
            // Case-insensitive comparison for fill-in-the-blank
            const correct = String(this.correctAnswer).toLowerCase().trim();
            const answer = String(userAnswer).toLowerCase().trim();
            return correct === answer;
        } else {
            // Exact match for multiple-choice and matching (index-based)
            return this.correctAnswer === userAnswer;
        }
    }

    /**
     * Get feedback message
     * @param {boolean} isCorrect
     * @returns {string}
     */
    getFeedback(isCorrect) {
        return isCorrect ? this.feedback.correct : this.feedback.incorrect;
    }

    /**
     * Validate question data
     * @returns {boolean}
     */
    isValid() {
        const hasRequiredFields = !!(
            this.id &&
            this.type &&
            this.wordId &&
            this.prompt &&
            this.correctAnswer !== undefined &&
            this.feedback
        );

        if (!hasRequiredFields) return false;

        // Type-specific validation
        if (this.type === 'multiple-choice' || this.type === 'matching') {
            return this.options.length >= 3 && this.options.length <= 4;
        }

        return true;
    }
}

export default InteractiveQuestion;
