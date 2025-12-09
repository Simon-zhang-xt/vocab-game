/**
 * GameView Component - Interactive quiz interface
 */

import GameEngine from '../services/GameEngine.js';
import VocabService from '../services/VocabService.js';

class GameView {
    constructor(container, courseId, onComplete) {
        this.container = container;
        this.courseId = courseId;
        this.onComplete = onComplete;
        this.engine = null;
        this.currentAnswer = null;
        this.feedbackShown = false;
    }

    /**
     * Initialize and render game
     */
    async init() {
        try {
            this.engine = new GameEngine(this.courseId);
            await this.engine.init();
            this.renderQuestion();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.renderError(error.message);
        }
    }

    /**
     * Render current question
     */
    renderQuestion() {
        const question = this.engine.getCurrentQuestion();
        if (!question) {
            this.complete();
            return;
        }

        const progress = this.engine.getProgress();
        const questionCount = this.engine.getQuestionCount();
        const word = VocabService.getWord(question.wordId);

        const html = `
            <div class="game-container fade-in">
                ${questionCount.inRetryPhase ? this.renderRetryIndicator() : ''}

                <div class="progress-container">
                    <div class="progress-header">
                        <span>进度 Progress</span>
                        <span>${questionCount.current} / ${questionCount.total}</span>
                    </div>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    </div>
                </div>

                <div class="question-card">
                    <span class="question-type-badge">${this.getTypeName(question.type)}</span>
                    <div class="question-prompt">${question.prompt}</div>

                    ${this.renderQuestionInput(question, word)}

                    <div class="feedback-container" id="feedback"></div>

                    <div class="game-actions">
                        <button class="btn btn-primary" id="submit-btn">
                            提交答案 Submit
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachListeners(question);
        this.resetState();
    }

    /**
     * Render retry phase indicator
     */
    renderRetryIndicator() {
        return `
            <div class="retry-indicator">
                <span class="retry-indicator-icon">🔄</span>
                <div>
                    <div class="retry-indicator-text">复习模式 Retry Mode</div>
                    <div style="font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">
                        让我们再练习一下之前答错的单词
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render question input based on type
     */
    renderQuestionInput(question, word) {
        switch (question.type) {
            case 'multiple-choice':
            case 'matching':
                return this.renderMultipleChoice(question);
            case 'fill-blank':
                return this.renderFillBlank(question);
            default:
                return '<p>Unknown question type</p>';
        }
    }

    /**
     * Render multiple choice options
     */
    renderMultipleChoice(question) {
        return `
            <div class="options-grid">
                ${question.options.map((option, index) => `
                    <button class="option-button" data-option="${index}">
                        <span class="option-number">${String.fromCharCode(65 + index)}</span>
                        ${option}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render fill in the blank input
     */
    renderFillBlank(question) {
        return `
            <div class="fill-blank-container">
                <input type="text"
                       class="fill-blank-input"
                       id="blank-input"
                       placeholder="输入答案... Type your answer..."
                       autocomplete="off">
                <div class="fill-blank-hint">提示: 输入英文单词</div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachListeners(question) {
        if (question.type === 'multiple-choice' || question.type === 'matching') {
            this.attachMultipleChoiceListeners();
        } else if (question.type === 'fill-blank') {
            this.attachFillBlankListeners();
        }

        const submitBtn = this.container.querySelector('#submit-btn');
        submitBtn.addEventListener('click', () => this.handleSubmit(question));
    }

    /**
     * Attach listeners for multiple choice
     */
    attachMultipleChoiceListeners() {
        const buttons = this.container.querySelectorAll('.option-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove previous selection
                buttons.forEach(b => b.classList.remove('selected'));
                // Mark current selection
                button.classList.add('selected');
                this.currentAnswer = parseInt(button.dataset.option);
            });
        });
    }

    /**
     * Attach listeners for fill blank
     */
    attachFillBlankListeners() {
        const input = this.container.querySelector('#blank-input');
        input.addEventListener('input', (e) => {
            this.currentAnswer = e.target.value.trim();
        });

        // Submit on Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const submitBtn = this.container.querySelector('#submit-btn');
                submitBtn.click();
            }
        });

        // Focus input
        input.focus();
    }

    /**
     * Handle answer submission
     */
    handleSubmit(question) {
        if (this.feedbackShown) {
            // Move to next question
            this.nextQuestion();
            return;
        }

        if (this.currentAnswer === null || this.currentAnswer === '') {
            alert('请选择或输入答案 / Please select or enter an answer');
            return;
        }

        try {
            const result = this.engine.submitAnswer(this.currentAnswer);
            this.showFeedback(result, question);
            this.feedbackShown = true;

            // Update button text
            const submitBtn = this.container.querySelector('#submit-btn');
            submitBtn.textContent = '下一题 Next';
        } catch (error) {
            console.error('Submit error:', error);
            alert('提交失败，请重试 / Submission failed, please try again');
        }
    }

    /**
     * Show feedback
     */
    showFeedback(result, question) {
        const feedback = this.container.querySelector('#feedback');
        const isCorrect = result.isCorrect;

        feedback.className = `feedback-container ${isCorrect ? 'correct' : 'incorrect'} show ${isCorrect ? 'bounce' : 'shake'}`;
        feedback.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: var(--spacing-md);">
                <span class="feedback-icon">${isCorrect ? '✅' : '❌'}</span>
                <div style="flex: 1;">
                    <div class="feedback-message">
                        ${isCorrect ? '正确！Correct!' : '不正确 Incorrect'}
                    </div>
                    <div class="feedback-detail">${result.feedback}</div>
                </div>
            </div>
        `;

        // Disable inputs
        if (question.type === 'multiple-choice' || question.type === 'matching') {
            const buttons = this.container.querySelectorAll('.option-button');
            buttons.forEach(button => {
                button.disabled = true;
                const optionIndex = parseInt(button.dataset.option);
                if (optionIndex === result.correctAnswer) {
                    button.classList.add('correct');
                } else if (optionIndex === this.currentAnswer && !isCorrect) {
                    button.classList.add('incorrect');
                }
            });
        } else if (question.type === 'fill-blank') {
            const input = this.container.querySelector('#blank-input');
            input.disabled = true;
            if (!isCorrect) {
                input.value = `${input.value} → ${result.correctAnswer}`;
            }
        }
    }

    /**
     * Move to next question
     */
    nextQuestion() {
        const hasNext = this.engine.nextQuestion();
        if (hasNext) {
            this.renderQuestion();
        } else {
            this.complete();
        }
    }

    /**
     * Complete course
     */
    complete() {
        const record = this.engine.completeCourse();
        if (this.onComplete) {
            this.onComplete(record);
        }
    }

    /**
     * Reset component state
     */
    resetState() {
        this.currentAnswer = null;
        this.feedbackShown = false;
    }

    /**
     * Get question type display name
     */
    getTypeName(type) {
        const names = {
            'multiple-choice': '选择题 Multiple Choice',
            'matching': '匹配题 Matching',
            'fill-blank': '填空题 Fill in the Blank'
        };
        return names[type] || type;
    }

    /**
     * Render error state
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">加载失败</p>
                <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                    ${message}
                </p>
                <button class="btn btn-primary" onclick="location.reload()">
                    重新加载 Reload
                </button>
            </div>
        `;
    }
}

export default GameView;
