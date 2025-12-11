/**
 * GoalSettingModal.js
 * V2.2 Feature: Daily Goal Setting Interface
 *
 * Provides user-friendly interface for setting daily learning goals
 * - 4 preset modes (Easy/Standard/Advanced/Challenge)
 * - Custom goal input
 * - Instant feedback and validation
 */

import dailyGoalService from '../services/DailyGoalService.js';

export default class GoalSettingModal {
    constructor() {
        this.modal = null;
        this.isVisible = false;
    }

    /**
     * Show the goal setting modal
     */
    show() {
        if (this.isVisible) return;

        // Create modal if not exists
        if (!this.modal) {
            this.createModal();
        }

        this.modal.classList.remove('hidden');
        this.modal.classList.add('show');
        this.isVisible = true;

        // Load current goal
        this.loadCurrentGoal();
    }

    /**
     * Hide the modal
     */
    hide() {
        if (!this.isVisible || !this.modal) return;

        this.modal.classList.remove('show');
        this.modal.classList.add('hidden');
        this.isVisible = false;
    }

    /**
     * Create modal DOM structure
     */
    createModal() {
        const modalHTML = `
            <div id="goal-setting-modal" class="modal hidden">
                <div class="modal-overlay" data-close-modal></div>
                <div class="modal-content goal-modal-content">
                    <button class="modal-close" data-close-modal>&times;</button>

                    <div class="goal-modal-header">
                        <h2 class="goal-modal-title">🎯 设置每日学习目标</h2>
                        <p class="goal-modal-subtitle">Set Daily Learning Goal</p>
                    </div>

                    <div class="goal-modal-body">
                        <!-- Current Goal Display -->
                        <div class="current-goal-display">
                            <span class="current-goal-label">当前目标 Current Goal:</span>
                            <span class="current-goal-value" id="current-goal-display">20</span>
                            <span class="current-goal-unit">词/天 words/day</span>
                        </div>

                        <!-- Preset Goal Options -->
                        <div class="goal-options">
                            <h3 class="goal-section-title">选择预设模式 Choose Preset Mode</h3>

                            <div class="goal-option-card" data-goal="10">
                                <div class="goal-option-icon">🌱</div>
                                <div class="goal-option-content">
                                    <div class="goal-option-title">轻松模式</div>
                                    <div class="goal-option-subtitle">Easy Mode</div>
                                    <div class="goal-option-value">10 词/天</div>
                                    <div class="goal-option-desc">适合初学者，轻松入门</div>
                                </div>
                            </div>

                            <div class="goal-option-card" data-goal="20">
                                <div class="goal-option-icon">📚</div>
                                <div class="goal-option-content">
                                    <div class="goal-option-title">标准模式</div>
                                    <div class="goal-option-subtitle">Standard Mode</div>
                                    <div class="goal-option-value">20 词/天</div>
                                    <div class="goal-option-desc">推荐选择，稳步提升</div>
                                </div>
                            </div>

                            <div class="goal-option-card" data-goal="30">
                                <div class="goal-option-icon">🚀</div>
                                <div class="goal-option-content">
                                    <div class="goal-option-title">进阶模式</div>
                                    <div class="goal-option-subtitle">Advanced Mode</div>
                                    <div class="goal-option-value">30 词/天</div>
                                    <div class="goal-option-desc">挑战自我，快速进步</div>
                                </div>
                            </div>

                            <div class="goal-option-card" data-goal="50">
                                <div class="goal-option-icon">🔥</div>
                                <div class="goal-option-content">
                                    <div class="goal-option-title">挑战模式</div>
                                    <div class="goal-option-subtitle">Challenge Mode</div>
                                    <div class="goal-option-value">50 词/天</div>
                                    <div class="goal-option-desc">高强度训练，冲刺目标</div>
                                </div>
                            </div>
                        </div>

                        <!-- Custom Goal Input -->
                        <div class="custom-goal-section">
                            <h3 class="goal-section-title">或自定义目标 Or Custom Goal</h3>
                            <div class="custom-goal-input-group">
                                <input
                                    type="number"
                                    id="custom-goal-input"
                                    class="custom-goal-input"
                                    placeholder="输入数字 Enter number"
                                    min="5"
                                    max="100"
                                    step="5"
                                >
                                <span class="custom-goal-unit">词/天 words/day</span>
                            </div>
                            <div class="custom-goal-hint">
                                建议范围: 5-100 词/天 (Recommended: 5-100 words/day)
                            </div>
                            <div id="goal-error" class="goal-error hidden"></div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="goal-modal-actions">
                            <button class="btn btn-secondary" data-close-modal>
                                取消 Cancel
                            </button>
                            <button id="save-goal-btn" class="btn btn-primary">
                                💾 保存目标 Save Goal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('goal-setting-modal');

        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * Load current goal from service
     */
    async loadCurrentGoal() {
        try {
            const currentGoal = await dailyGoalService.getDailyGoal();
            const display = document.getElementById('current-goal-display');
            if (display) {
                display.textContent = currentGoal;
            }

            // Highlight current goal option
            this.highlightCurrentGoal(currentGoal);
        } catch (error) {
            console.error('Failed to load current goal:', error);
        }
    }

    /**
     * Highlight the current goal option card
     */
    highlightCurrentGoal(goal) {
        const cards = this.modal.querySelectorAll('.goal-option-card');
        cards.forEach(card => {
            const cardGoal = parseInt(card.dataset.goal);
            if (cardGoal === goal) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal buttons
        const closeButtons = this.modal.querySelectorAll('[data-close-modal]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.hide());
        });

        // Preset goal option cards
        const goalCards = this.modal.querySelectorAll('.goal-option-card');
        goalCards.forEach(card => {
            card.addEventListener('click', () => {
                const goal = parseInt(card.dataset.goal);
                this.selectGoal(goal);
            });
        });

        // Custom goal input
        const customInput = this.modal.querySelector('#custom-goal-input');
        if (customInput) {
            customInput.addEventListener('input', () => {
                this.clearSelection();
                this.hideError();
            });

            customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveGoal();
                }
            });
        }

        // Save button
        const saveBtn = this.modal.querySelector('#save-goal-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveGoal());
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Select a preset goal
     */
    selectGoal(goal) {
        // Clear custom input
        const customInput = this.modal.querySelector('#custom-goal-input');
        if (customInput) {
            customInput.value = '';
        }

        // Highlight selected card
        const cards = this.modal.querySelectorAll('.goal-option-card');
        cards.forEach(card => {
            if (parseInt(card.dataset.goal) === goal) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        this.hideError();
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        const cards = this.modal.querySelectorAll('.goal-option-card');
        cards.forEach(card => card.classList.remove('selected'));
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = this.modal.querySelector('#goal-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorEl = this.modal.querySelector('#goal-error');
        if (errorEl) {
            errorEl.classList.add('hidden');
        }
    }

    /**
     * Validate goal value
     */
    validateGoal(goal) {
        if (!goal || isNaN(goal)) {
            return { valid: false, error: '请选择或输入一个有效的目标 Please select or enter a valid goal' };
        }

        if (goal < 5) {
            return { valid: false, error: '目标不能少于5词/天 Goal cannot be less than 5 words/day' };
        }

        if (goal > 100) {
            return { valid: false, error: '目标不能超过100词/天 Goal cannot exceed 100 words/day' };
        }

        return { valid: true };
    }

    /**
     * Save goal to service
     */
    async saveGoal() {
        // Get goal from either preset or custom input
        let goal = null;

        // Check preset selection
        const selectedCard = this.modal.querySelector('.goal-option-card.selected');
        if (selectedCard) {
            goal = parseInt(selectedCard.dataset.goal);
        }

        // Check custom input
        const customInput = this.modal.querySelector('#custom-goal-input');
        if (customInput && customInput.value) {
            goal = parseInt(customInput.value);
        }

        // Validate
        const validation = this.validateGoal(goal);
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        // Show loading state
        const saveBtn = this.modal.querySelector('#save-goal-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⏳ 保存中... Saving...';

        try {
            // Save to service
            await dailyGoalService.setDailyGoal(goal);

            // Show success message
            saveBtn.innerHTML = '✅ 保存成功! Saved!';

            // Close modal after delay
            setTimeout(() => {
                this.hide();

                // Reload page to refresh goal widget
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('Failed to save goal:', error);
            this.showError('保存失败: ' + error.message + ' Failed to save: ' + error.message);
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    /**
     * Destroy modal
     */
    destroy() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            this.isVisible = false;
        }
    }
}

// Export singleton instance
const goalSettingModal = new GoalSettingModal();
export { goalSettingModal };
