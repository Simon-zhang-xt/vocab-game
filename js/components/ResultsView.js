/**
 * ResultsView Component - Display learning results
 */

import ExampleSentenceView from './ExampleSentenceView.js';

class ResultsView {
    constructor(container, record, onReturnHome) {
        this.container = container;
        this.record = record;
        this.onReturnHome = onReturnHome;
        this.exampleSentenceViews = [];
    }

    /**
     * Render results
     */
    render() {
        const stats = this.getStatistics();
        const performanceLevel = this.getPerformanceLevel(stats.accuracyPercentage);

        const html = `
            <div class="results-container fade-in">
                <div class="results-icon">${performanceLevel.icon}</div>
                <h2 class="results-title">${performanceLevel.title}</h2>
                <p class="results-subtitle">${performanceLevel.message}</p>

                <div class="results-stats">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-label">学习单词 Words Learned</div>
                            <div class="stat-value">${stats.wordCount}<span class="stat-unit">个</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">正确率 Accuracy</div>
                            <div class="stat-value">${stats.accuracyPercentage}<span class="stat-unit">%</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">答对题数 Correct Answers</div>
                            <div class="stat-value">${stats.correctCount}<span class="stat-unit">/${stats.totalQuestions}</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">学习时长 Time Spent</div>
                            <div class="stat-value">${stats.formattedTime}<span class="stat-unit">分钟</span></div>
                        </div>
                    </div>
                </div>

                ${this.renderEncouragement(stats.accuracyPercentage)}

                <div id="example-sentences-container"></div>

                <div class="results-actions">
                    <button class="btn btn-primary" id="return-home">
                        返回首页 Return Home
                    </button>
                    <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-top: var(--spacing-md);">
                        学习进度已自动保存 Progress saved automatically
                    </p>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachListeners();
        this.renderExampleSentences();
    }

    /**
     * Get statistics from record
     */
    getStatistics() {
        return {
            wordCount: this.countUniqueWords(),
            totalQuestions: this.record.totalQuestions,
            correctCount: this.record.correctCount,
            accuracyPercentage: this.record.accuracyPercentage,
            timeSpentSeconds: this.record.timeSpentSeconds,
            formattedTime: this.formatTime(this.record.timeSpentSeconds)
        };
    }

    /**
     * Count unique words in this session
     */
    countUniqueWords() {
        const uniqueWordIds = new Set(this.record.answers.map(a => a.wordId));
        return uniqueWordIds.size;
    }

    /**
     * Format time in minutes and seconds
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Get performance level based on accuracy
     */
    getPerformanceLevel(accuracy) {
        if (accuracy >= 90) {
            return {
                icon: '🏆',
                title: '优秀! Excellent!',
                message: '你的表现非常出色！继续保持！'
            };
        } else if (accuracy >= 75) {
            return {
                icon: '🎉',
                title: '很好! Great!',
                message: '做得不错！继续加油！'
            };
        } else if (accuracy >= 60) {
            return {
                icon: '👍',
                title: '不错! Good!',
                message: '稳步提升中，继续努力！'
            };
        } else {
            return {
                icon: '💪',
                title: '继续加油! Keep Going!',
                message: '学习需要过程，再试一次会更好！'
            };
        }
    }

    /**
     * Render encouragement message
     */
    renderEncouragement(accuracy) {
        let tips = [];

        if (accuracy < 75) {
            tips.push('💡 提示：多读几遍单词和例句可以加深记忆');
            tips.push('💡 Tip: Read words and examples multiple times to improve retention');
        }

        if (accuracy >= 90) {
            tips.push('🌟 你已经掌握得很好了！可以尝试其他课程');
            tips.push('🌟 You\'ve mastered this well! Try other courses');
        }

        if (tips.length === 0) return '';

        return `
            <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg); text-align: left;">
                ${tips.map(tip => `<div style="margin-bottom: var(--spacing-sm);">${tip}</div>`).join('')}
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        const returnBtn = this.container.querySelector('#return-home');
        returnBtn.addEventListener('click', () => {
            if (this.onReturnHome) {
                this.onReturnHome();
            }
        });
    }

    /**
     * Render example sentences for learned words
     */
    async renderExampleSentences() {
        // 获取本次学习的所有单词
        const uniqueWords = this.getUniqueLearnedWords();

        if (uniqueWords.length === 0) return;

        const sentencesContainer = this.container.querySelector('#example-sentences-container');
        if (!sentencesContainer) return;

        // 为每个单词创建例句视图（最多显示3个单词）
        const wordsToShow = uniqueWords.slice(0, 3);

        for (const word of wordsToShow) {
            const wordContainer = document.createElement('div');
            wordContainer.className = 'word-example-section';
            sentencesContainer.appendChild(wordContainer);

            const exampleView = new ExampleSentenceView(wordContainer, word.id, word.text);
            this.exampleSentenceViews.push(exampleView);
            await exampleView.render();
        }

        // 如果有更多单词，显示提示
        if (uniqueWords.length > 3) {
            const moreHint = document.createElement('div');
            moreHint.className = 'more-words-hint';
            moreHint.innerHTML = `
                <p style="text-align: center; color: var(--text-secondary); margin-top: var(--spacing-lg);">
                    还有 ${uniqueWords.length - 3} 个单词的例句可以在"用户中心"查看
                </p>
            `;
            sentencesContainer.appendChild(moreHint);
        }
    }

    /**
     * Get unique learned words from this session
     */
    getUniqueLearnedWords() {
        const uniqueWordsMap = new Map();

        this.record.answers.forEach(answer => {
            if (!uniqueWordsMap.has(answer.wordId)) {
                uniqueWordsMap.set(answer.wordId, {
                    id: answer.wordId,
                    text: answer.word || answer.wordId
                });
            }
        });

        return Array.from(uniqueWordsMap.values());
    }

    /**
     * Clean up resources
     */
    destroy() {
        // 清理所有例句视图
        this.exampleSentenceViews.forEach(view => {
            view.destroy();
        });
        this.exampleSentenceViews = [];
    }
}

export default ResultsView;
