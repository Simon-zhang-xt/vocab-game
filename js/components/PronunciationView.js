/**
 * Pronunciation View Component
 * V3.4 Feature: Interactive pronunciation training interface
 */

import PronunciationService from '../services/PronunciationService.js';
import CourseService from '../services/CourseService.js';

export default class PronunciationView {
    constructor() {
        this.pronunciationService = new PronunciationService();
        this.courseService = new CourseService();
        this.currentMode = 'practice'; // 'practice', 'challenge', 'review', 'statistics'
        this.currentWord = null;
        this.practiceWords = [];
        this.currentIndex = 0;
        this.isListening = false;
        this.waveformAnimationId = null;
    }

    /**
     * Main render method
     */
    async render() {
        const support = this.pronunciationService.isSupported;
        const stats = this.pronunciationService.getPronunciationStatistics();

        if (!support.isFullySupported) {
            return this.renderUnsupportedBrowser(support);
        }

        return `
            <div class="pronunciation-container">
                <!-- Header -->
                <div class="pronunciation-header">
                    <h1>🎙️ AI 发音训练</h1>
                    <p class="subtitle">智能发音评估，帮你说出标准英语</p>
                </div>

                <!-- Statistics Overview -->
                <div class="pronunciation-stats">
                    ${this.renderStatistics(stats)}
                </div>

                <!-- Mode Selection -->
                <div class="mode-selector">
                    <button class="mode-btn active" data-mode="practice">
                        📖 练习模式
                    </button>
                    <button class="mode-btn" data-mode="challenge">
                        🎯 挑战模式
                    </button>
                    <button class="mode-btn" data-mode="review">
                        🔄 复习模式
                    </button>
                    <button class="mode-btn" data-mode="statistics">
                        📊 统计分析
                    </button>
                </div>

                <!-- Content Area -->
                <div id="pronunciation-content" class="pronunciation-content">
                    ${await this.renderPracticeMode()}
                </div>
            </div>
        `;
    }

    /**
     * Render unsupported browser message
     */
    renderUnsupportedBrowser(support) {
        return `
            <div class="pronunciation-container">
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <h2>浏览器不支持</h2>
                    <p>您的浏览器不完全支持语音识别功能。</p>

                    <div class="support-details">
                        <div class="support-item ${support.recognition ? 'supported' : 'unsupported'}">
                            ${support.recognition ? '✅' : '❌'} 语音识别
                        </div>
                        <div class="support-item ${support.synthesis ? 'supported' : 'unsupported'}">
                            ${support.synthesis ? '✅' : '❌'} 语音合成
                        </div>
                        <div class="support-item ${support.audioContext ? 'supported' : 'unsupported'}">
                            ${support.audioContext ? '✅' : '❌'} 音频处理
                        </div>
                    </div>

                    <p class="recommendation">
                        推荐使用 Chrome 或 Edge 浏览器以获得最佳体验。
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Render statistics overview
     */
    renderStatistics(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.totalWords}</div>
                        <div class="stat-label">练习单词</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🎤</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.totalAttempts}</div>
                        <div class="stat-label">发音次数</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.averageScore}</div>
                        <div class="stat-label">平均分数</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.excellentWords}</div>
                        <div class="stat-label">优秀单词</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render practice mode
     */
    async renderPracticeMode() {
        // Get words from current course or all learned words
        const allWords = this.courseService.getAllWords();
        const learnedWords = allWords.filter(word => word.studied);

        if (learnedWords.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <p class="empty-state-text">还没有学习过的单词</p>
                    <p class="empty-state-hint">先去学习一些单词再来练习发音吧！</p>
                    <button class="btn btn-primary" onclick="window.location.hash='#home'">
                        前往课程
                    </button>
                </div>
            `;
        }

        // Select random words for practice
        this.practiceWords = this.selectPracticeWords(learnedWords, 20);
        this.currentIndex = 0;
        this.currentWord = this.practiceWords[this.currentIndex];

        return this.renderWordPractice();
    }

    /**
     * Render word practice interface
     */
    renderWordPractice() {
        const word = this.currentWord;
        const history = this.pronunciationService.getWordPronunciationHistory(word.id);
        const progress = ((this.currentIndex + 1) / this.practiceWords.length) * 100;

        return `
            <div class="practice-interface">
                <!-- Progress Bar -->
                <div class="practice-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${this.currentIndex + 1} / ${this.practiceWords.length}</div>
                </div>

                <!-- Word Card -->
                <div class="word-card">
                    <div class="word-main">${word.word}</div>
                    <div class="word-phonetic">${word.pronunciation || ''}</div>
                    <div class="word-translation">${word.translation}</div>

                    ${history ? `
                        <div class="word-history">
                            <span class="history-label">最佳分数:</span>
                            <span class="history-score score-${this.getScoreLevel(history.bestScore)}">
                                ${history.bestScore}
                            </span>
                            <span class="history-attempts">(${history.totalAttempts} 次尝试)</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Listen Button -->
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-large" onclick="window.pronunciationView.playWord()">
                        🔊 听发音
                    </button>
                </div>

                <!-- Waveform Visualizer -->
                <div class="waveform-container">
                    <canvas id="waveform-canvas" width="800" height="150"></canvas>
                    <div class="waveform-overlay">
                        <div class="mic-status" id="mic-status">
                            ${this.isListening ? '🎤 正在录音...' : '点击按钮开始录音'}
                        </div>
                    </div>
                </div>

                <!-- Record Button -->
                <div class="record-button-container">
                    <button
                        id="record-btn"
                        class="btn-record ${this.isListening ? 'recording' : ''}"
                        onclick="window.pronunciationView.toggleRecording()"
                    >
                        <div class="record-icon"></div>
                        <span class="record-text">
                            ${this.isListening ? '停止录音' : '开始录音'}
                        </span>
                    </button>
                </div>

                <!-- Result Area -->
                <div id="result-area" class="result-area hidden">
                    <!-- Dynamic result content -->
                </div>

                <!-- Navigation -->
                <div class="navigation-buttons">
                    ${this.currentIndex > 0 ? `
                        <button class="btn btn-secondary" onclick="window.pronunciationView.previousWord()">
                            ← 上一个
                        </button>
                    ` : '<div></div>'}

                    <button class="btn btn-primary" onclick="window.pronunciationView.nextWord()">
                        ${this.currentIndex < this.practiceWords.length - 1 ? '下一个 →' : '完成 ✓'}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render challenge mode
     */
    renderChallengeMode() {
        const needsPractice = this.pronunciationService.getWordsNeedingPractice(75);

        if (needsPractice.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🎉</div>
                    <p class="empty-state-text">所有单词发音都很棒！</p>
                    <p class="empty-state-hint">继续保持，或尝试学习新单词</p>
                </div>
            `;
        }

        return `
            <div class="challenge-mode">
                <h2>🎯 发音挑战</h2>
                <p class="challenge-desc">这些单词需要更多练习，让我们一起攻克它们！</p>

                <div class="challenge-list">
                    ${needsPractice.map(item => `
                        <div class="challenge-item" data-word-id="${item.wordId}">
                            <div class="challenge-word">${item.wordId}</div>
                            <div class="challenge-score">
                                <span class="score-label">最佳分数:</span>
                                <span class="score-value score-${this.getScoreLevel(item.bestScore)}">
                                    ${item.bestScore}
                                </span>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="window.pronunciationView.practiceWord('${item.wordId}')">
                                练习
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render detailed statistics
     */
    renderStatisticsView() {
        const stats = this.pronunciationService.getPronunciationStatistics();
        const history = this.pronunciationService.pronunciationHistory;

        const wordList = Object.entries(history)
            .map(([wordId, data]) => ({
                wordId,
                ...data
            }))
            .sort((a, b) => b.bestScore - a.bestScore);

        return `
            <div class="statistics-view">
                <h2>📊 详细统计</h2>

                <!-- Overall Stats -->
                <div class="stats-overview">
                    <div class="overview-card">
                        <h3>总体表现</h3>
                        <div class="overview-items">
                            <div class="overview-item">
                                <span class="item-label">优秀单词:</span>
                                <span class="item-value">${stats.excellentWords}</span>
                            </div>
                            <div class="overview-item">
                                <span class="item-label">良好单词:</span>
                                <span class="item-value">${stats.goodWords}</span>
                            </div>
                            <div class="overview-item">
                                <span class="item-label">需要练习:</span>
                                <span class="item-value">${stats.needsPractice}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Word List -->
                <div class="word-stats-list">
                    <h3>单词列表</h3>
                    ${wordList.length > 0 ? `
                        <table class="stats-table">
                            <thead>
                                <tr>
                                    <th>单词</th>
                                    <th>最佳分数</th>
                                    <th>平均分数</th>
                                    <th>尝试次数</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${wordList.map(item => `
                                    <tr>
                                        <td class="word-cell">${item.wordId}</td>
                                        <td class="score-cell">
                                            <span class="score-badge score-${this.getScoreLevel(item.bestScore)}">
                                                ${item.bestScore}
                                            </span>
                                        </td>
                                        <td>${item.averageScore}</td>
                                        <td>${item.totalAttempts}</td>
                                        <td>
                                            <button class="btn-text btn-sm" onclick="window.pronunciationView.viewWordHistory('${item.wordId}')">
                                                查看详情
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <p class="empty-hint">还没有练习记录</p>
                    `}
                </div>

                <!-- Actions -->
                <div class="stats-actions">
                    <button class="btn btn-danger" onclick="window.pronunciationView.confirmClearHistory()">
                        清除所有记录
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Play word pronunciation
     */
    async playWord() {
        if (!this.currentWord) return;

        try {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '🔊 播放中...';

            await this.pronunciationService.speak(this.currentWord.word);

            btn.disabled = false;
            btn.innerHTML = '🔊 听发音';
        } catch (error) {
            console.error('Failed to play pronunciation:', error);
            this.showToast('播放失败，请检查浏览器设置');
        }
    }

    /**
     * Toggle recording
     */
    async toggleRecording() {
        if (this.isListening) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    /**
     * Start recording user pronunciation
     */
    async startRecording() {
        if (!this.currentWord) return;

        try {
            this.isListening = true;
            this.updateRecordButton();
            this.startWaveformAnimation();

            const result = await this.pronunciationService.startRecording(this.currentWord.word);

            this.isListening = false;
            this.updateRecordButton();
            this.stopWaveformAnimation();

            // Save result
            this.pronunciationService.savePronunciationAttempt(this.currentWord.id, result);

            // Show result
            this.showResult(result);

        } catch (error) {
            console.error('Recording error:', error);
            this.isListening = false;
            this.updateRecordButton();
            this.stopWaveformAnimation();
            this.showToast('录音失败: ' + error.message);
        }
    }

    /**
     * Stop recording
     */
    stopRecording() {
        this.pronunciationService.stopRecording();
        this.isListening = false;
        this.updateRecordButton();
        this.stopWaveformAnimation();
    }

    /**
     * Update record button state
     */
    updateRecordButton() {
        const btn = document.getElementById('record-btn');
        const status = document.getElementById('mic-status');

        if (btn) {
            if (this.isListening) {
                btn.classList.add('recording');
                btn.querySelector('.record-text').textContent = '停止录音';
            } else {
                btn.classList.remove('recording');
                btn.querySelector('.record-text').textContent = '开始录音';
            }
        }

        if (status) {
            status.textContent = this.isListening ? '🎤 正在录音...' : '点击按钮开始录音';
        }
    }

    /**
     * Start waveform animation
     */
    startWaveformAnimation() {
        const canvas = document.getElementById('waveform-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const animate = () => {
            if (!this.isListening) return;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Get waveform data
            const data = this.pronunciationService.getWaveformData();

            if (data) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#4F46E5';
                ctx.beginPath();

                const sliceWidth = width / data.length;
                let x = 0;

                for (let i = 0; i < data.length; i++) {
                    const v = data[i] / 128.0;
                    const y = (v * height) / 2;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                ctx.lineTo(width, height / 2);
                ctx.stroke();
            }

            this.waveformAnimationId = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop waveform animation
     */
    stopWaveformAnimation() {
        if (this.waveformAnimationId) {
            cancelAnimationFrame(this.waveformAnimationId);
            this.waveformAnimationId = null;
        }

        // Clear canvas
        const canvas = document.getElementById('waveform-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    /**
     * Show pronunciation result
     */
    showResult(result) {
        const resultArea = document.getElementById('result-area');
        if (!resultArea) return;

        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
            <div class="result-content result-${result.score.level}">
                <div class="result-score">
                    <div class="score-circle">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="8"
                                stroke-dasharray="${result.score.score * 2.827}, 282.7"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div class="score-text">${result.score.score}</div>
                    </div>
                </div>

                <div class="result-details">
                    <div class="result-feedback">
                        <div class="feedback-icon">${this.getFeedbackIcon(result.score.level)}</div>
                        <div class="feedback-text">${result.score.feedback}</div>
                    </div>

                    <div class="result-info">
                        <div class="info-row">
                            <span class="info-label">目标单词:</span>
                            <span class="info-value">${result.targetWord}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">识别结果:</span>
                            <span class="info-value">${result.score.spokenWord}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">准确度:</span>
                            <span class="info-value">${result.score.accuracy}%</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">置信度:</span>
                            <span class="info-value">${result.score.confidence}%</span>
                        </div>
                    </div>
                </div>

                <div class="result-actions">
                    <button class="btn btn-secondary" onclick="window.pronunciationView.playWord()">
                        🔊 再听一遍
                    </button>
                    <button class="btn btn-primary" onclick="window.pronunciationView.tryAgain()">
                        🎤 再试一次
                    </button>
                </div>
            </div>
        `;

        // Scroll to result
        resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Get feedback icon based on level
     */
    getFeedbackIcon(level) {
        const icons = {
            excellent: '🎉',
            good: '👍',
            fair: '💪',
            poor: '📚'
        };
        return icons[level] || '👍';
    }

    /**
     * Get score level for styling
     */
    getScoreLevel(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'fair';
        return 'poor';
    }

    /**
     * Try again (clear result and allow new recording)
     */
    tryAgain() {
        const resultArea = document.getElementById('result-area');
        if (resultArea) {
            resultArea.classList.add('hidden');
        }
    }

    /**
     * Go to previous word
     */
    previousWord() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.currentWord = this.practiceWords[this.currentIndex];
            this.refreshPracticeInterface();
        }
    }

    /**
     * Go to next word
     */
    nextWord() {
        if (this.currentIndex < this.practiceWords.length - 1) {
            this.currentIndex++;
            this.currentWord = this.practiceWords[this.currentIndex];
            this.refreshPracticeInterface();
        } else {
            this.completePractice();
        }
    }

    /**
     * Complete practice session
     */
    completePractice() {
        this.showToast('🎉 练习完成！');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    /**
     * Refresh practice interface
     */
    refreshPracticeInterface() {
        const content = document.getElementById('pronunciation-content');
        if (content) {
            content.innerHTML = this.renderWordPractice();
        }
    }

    /**
     * Select words for practice
     */
    selectPracticeWords(words, count) {
        // Shuffle and select random words
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, words.length));
    }

    /**
     * Switch mode
     */
    async switchMode(mode) {
        this.currentMode = mode;

        const content = document.getElementById('pronunciation-content');
        if (!content) return;

        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Render new mode content
        let html = '';
        switch (mode) {
            case 'practice':
                html = await this.renderPracticeMode();
                break;
            case 'challenge':
                html = this.renderChallengeMode();
                break;
            case 'statistics':
                html = this.renderStatisticsView();
                break;
        }

        content.innerHTML = html;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.switchMode(mode);
            });
        });

        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.pronunciationService.audioContext) {
                this.pronunciationService.initializeAudioContext();
            }
        }, { once: true });
    }

    /**
     * Confirm clear history
     */
    confirmClearHistory() {
        if (confirm('确定要清除所有发音记录吗？此操作无法撤销。')) {
            this.pronunciationService.clearAllHistory();
            this.showToast('✅ 已清除所有记录');
            setTimeout(() => window.location.reload(), 1000);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        this.stopWaveformAnimation();
        this.pronunciationService.cleanup();
    }
}
