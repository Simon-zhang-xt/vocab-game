/**
 * Image Memory View Component
 * V3.2 Feature: Visual learning interface with images
 */

import ImageMemoryService from '../services/ImageMemoryService.js';
import ProgressService from '../services/ProgressService.js';

export default class ImageMemoryView {
    constructor() {
        this.imageMemoryService = new ImageMemoryService();
        this.progressService = new ProgressService();
        this.currentSession = null;
        this.currentIndex = 0;
        this.sessionWords = [];
    }

    /**
     * Render the main image memory view
     */
    async render() {
        return `
            <div class="image-memory-container">
                <!-- Header -->
                <div class="image-memory-header">
                    <h1>📷 图像记忆学习</h1>
                    <p class="subtitle">通过图像建立深刻的词汇记忆</p>
                </div>

                <!-- Mode Selection -->
                <div id="mode-selection" class="mode-selection">
                    ${this.renderModeSelection()}
                </div>

                <!-- Study Area (hidden initially) -->
                <div id="study-area" class="study-area hidden">
                    ${this.renderStudyArea()}
                </div>

                <!-- Statistics -->
                <div class="image-memory-stats">
                    ${await this.renderStatistics()}
                </div>
            </div>
        `;
    }

    /**
     * Render mode selection cards
     */
    renderModeSelection() {
        return `
            <div class="mode-grid">
                <div class="mode-card" data-mode="learning">
                    <div class="mode-icon">📚</div>
                    <h3>图像学习</h3>
                    <p>为词汇匹配图像，建立视觉联想</p>
                    <button class="btn btn-primary" onclick="window.imageMemoryView.startMode('learning')">
                        开始学习
                    </button>
                </div>

                <div class="mode-card" data-mode="review">
                    <div class="mode-icon">🔄</div>
                    <h3>图像复习</h3>
                    <p>回顾已学词汇的图像记忆</p>
                    <button class="btn btn-secondary" onclick="window.imageMemoryView.startMode('review')">
                        开始复习
                    </button>
                </div>

                <div class="mode-card" data-mode="game">
                    <div class="mode-icon">🎮</div>
                    <h3>图像游戏</h3>
                    <p>通过趣味游戏巩固记忆</p>
                    <button class="btn btn-accent" onclick="window.imageMemoryView.startMode('game')">
                        开始游戏
                    </button>
                </div>

                <div class="mode-card" data-mode="browse">
                    <div class="mode-icon">🖼️</div>
                    <h3>图像浏览</h3>
                    <p>浏览已保存的词汇图像</p>
                    <button class="btn btn-text" onclick="window.imageMemoryView.startMode('browse')">
                        浏览图像
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render study area
     */
    renderStudyArea() {
        return `
            <!-- Progress Bar -->
            <div class="study-progress">
                <div class="progress-bar">
                    <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">
                    <span id="current-progress">0</span> / <span id="total-progress">0</span>
                </div>
            </div>

            <!-- Image Card -->
            <div class="image-card">
                <div class="image-wrapper" id="image-wrapper">
                    <img id="word-image" src="" alt="Loading..." class="word-image">
                    <div class="image-loading">
                        <div class="spinner"></div>
                        <p>加载图像中...</p>
                    </div>
                </div>

                <div class="image-attribution" id="image-attribution">
                    Photo by <a href="#" target="_blank" rel="noopener noreferrer">Photographer</a> on
                    <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
                </div>
            </div>

            <!-- Word Info Card -->
            <div class="word-info-card">
                <div class="word-main">
                    <h2 id="current-word" class="word-text">word</h2>
                    <button class="btn-icon" id="play-audio" title="播放发音">
                        <span>🔊</span>
                    </button>
                </div>

                <div class="word-details">
                    <p class="word-phonetic" id="word-phonetic">/wɜːrd/</p>
                    <p class="word-translation" id="word-translation">词；单词</p>
                    <p class="word-definition" id="word-definition">A single distinct meaningful element of speech or writing.</p>
                </div>

                <div class="word-example" id="word-example">
                    <p class="example-label">例句:</p>
                    <p class="example-text">"I don't know the word for that in English."</p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="study-actions">
                <button class="btn btn-secondary" id="btn-change-image">
                    🔄 更换图像
                </button>
                <button class="btn btn-primary" id="btn-remember">
                    ✅ 记住了
                </button>
                <button class="btn btn-text" id="btn-skip">
                    ⏭️ 跳过
                </button>
            </div>

            <!-- Navigation -->
            <div class="study-navigation">
                <button class="btn btn-text" id="btn-previous" disabled>
                    ← 上一个
                </button>
                <button class="btn btn-text" id="btn-exit">
                    🚪 退出学习
                </button>
                <button class="btn btn-text" id="btn-next">
                    下一个 →
                </button>
            </div>
        `;
    }

    /**
     * Render statistics section
     */
    async renderStatistics() {
        const stats = this.imageMemoryService.getStatistics();

        return `
            <h3>📊 图像记忆统计</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalWords}</div>
                    <div class="stat-label">已关联词汇</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.imagesUsed}</div>
                    <div class="stat-label">使用图像</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.oldestAssociation ? this.formatDate(stats.oldestAssociation) : 'N/A'}</div>
                    <div class="stat-label">最早记录</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.newestAssociation ? this.formatDate(stats.newestAssociation) : 'N/A'}</div>
                    <div class="stat-label">最新记录</div>
                </div>
            </div>
        `;
    }

    /**
     * Start a study mode
     */
    async startMode(mode) {
        console.log('[ImageMemoryView] Starting mode:', mode);

        if (mode === 'game') {
            // Navigate to game view
            window.location.hash = '#image-game';
            return;
        }

        if (mode === 'browse') {
            this.showBrowseMode();
            return;
        }

        // Get words for study session
        const words = await this.getWordsForMode(mode);

        if (words.length === 0) {
            alert('暂无可用词汇，请先完成一些课程学习');
            return;
        }

        // Generate study session
        const session = await this.imageMemoryService.generateImageStudySession(words, {
            sessionSize: 20,
            includeReview: mode === 'review',
            difficulty: 'medium'
        });

        this.currentSession = session;
        this.sessionWords = session.words;
        this.currentIndex = 0;

        // Hide mode selection, show study area
        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('study-area').classList.remove('hidden');

        // Load first word
        await this.loadWord(this.currentIndex);

        // Attach event listeners
        this.attachStudyEventListeners();
    }

    /**
     * Get words based on mode
     */
    async getWordsForMode(mode) {
        const progress = await this.progressService.getAllProgress();

        if (mode === 'learning') {
            // Get words not yet learned with images
            const associations = this.imageMemoryService.getImageAssociations();
            return progress.filter(p => !associations[p.wordId] && p.masteryLevel < 3);
        } else if (mode === 'review') {
            // Get words already learned with images
            const associations = this.imageMemoryService.getImageAssociations();
            return progress.filter(p => associations[p.wordId]);
        }

        return progress;
    }

    /**
     * Load a word at specific index
     */
    async loadWord(index) {
        if (index < 0 || index >= this.sessionWords.length) {
            console.error('[ImageMemoryView] Invalid word index:', index);
            return;
        }

        const wordData = this.sessionWords[index];
        this.currentIndex = index;

        // Update progress bar
        this.updateProgress();

        // Show loading state
        this.showLoadingState();

        // Load image
        const imageData = wordData.image;
        await this.displayImage(imageData);

        // Display word information
        this.displayWordInfo(wordData);

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    /**
     * Display image
     */
    async displayImage(imageData) {
        const img = document.getElementById('word-image');
        const wrapper = document.getElementById('image-wrapper');
        const attribution = document.getElementById('image-attribution');

        return new Promise((resolve) => {
            img.onload = () => {
                wrapper.classList.remove('loading');
                resolve();
            };

            img.onerror = () => {
                console.error('[ImageMemoryView] Image load failed');
                wrapper.classList.remove('loading');
                resolve();
            };

            img.src = imageData.url;
            img.alt = imageData.alt;

            // Update attribution
            attribution.innerHTML = `
                Photo by <a href="${imageData.photographerUrl}" target="_blank" rel="noopener noreferrer">
                    ${imageData.photographer}
                </a> on
                <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
            `;
        });
    }

    /**
     * Display word information
     */
    displayWordInfo(wordData) {
        document.getElementById('current-word').textContent = wordData.word;
        document.getElementById('word-phonetic').textContent = wordData.phonetic || '';
        document.getElementById('word-translation').textContent = wordData.translation || '';
        document.getElementById('word-definition').textContent = wordData.definition || '';

        const exampleContainer = document.getElementById('word-example');
        if (wordData.examples && wordData.examples.length > 0) {
            const example = wordData.examples[0];
            exampleContainer.innerHTML = `
                <p class="example-label">例句:</p>
                <p class="example-text">${example}</p>
            `;
        } else {
            exampleContainer.innerHTML = '';
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const wrapper = document.getElementById('image-wrapper');
        wrapper.classList.add('loading');
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const current = this.currentIndex + 1;
        const total = this.sessionWords.length;
        const percentage = (current / total) * 100;

        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('current-progress').textContent = current;
        document.getElementById('total-progress').textContent = total;
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const btnPrevious = document.getElementById('btn-previous');
        const btnNext = document.getElementById('btn-next');

        btnPrevious.disabled = this.currentIndex === 0;
        btnNext.disabled = this.currentIndex === this.sessionWords.length - 1;
    }

    /**
     * Attach event listeners for study mode
     */
    attachStudyEventListeners() {
        // Remember button
        document.getElementById('btn-remember').addEventListener('click', async () => {
            await this.markAsRemembered();
        });

        // Skip button
        document.getElementById('btn-skip').addEventListener('click', () => {
            this.nextWord();
        });

        // Change image button
        document.getElementById('btn-change-image').addEventListener('click', async () => {
            await this.changeImage();
        });

        // Navigation buttons
        document.getElementById('btn-previous').addEventListener('click', () => {
            this.previousWord();
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            this.nextWord();
        });

        // Exit button
        document.getElementById('btn-exit').addEventListener('click', () => {
            this.exitStudy();
        });

        // Audio button
        document.getElementById('play-audio').addEventListener('click', () => {
            this.playAudio();
        });
    }

    /**
     * Mark current word as remembered
     */
    async markAsRemembered() {
        const wordData = this.sessionWords[this.currentIndex];

        // Save image association
        await this.imageMemoryService.saveImageAssociation(
            wordData.wordId,
            wordData.image,
            this.currentSession.sessionId
        );

        // Update progress
        await this.progressService.updateMasteryLevel(wordData.wordId, 1);

        // Show success feedback
        this.showFeedback('✅ 已记住！');

        // Move to next word
        setTimeout(() => {
            this.nextWord();
        }, 500);
    }

    /**
     * Change image for current word
     */
    async changeImage() {
        const wordData = this.sessionWords[this.currentIndex];

        this.showLoadingState();

        // Fetch a new image (with different hint)
        const newImage = await this.imageMemoryService.getImageForWord(
            wordData.word,
            'alternative'
        );

        // Update session data
        wordData.image = newImage;

        // Display new image
        await this.displayImage(newImage);
    }

    /**
     * Navigate to previous word
     */
    previousWord() {
        if (this.currentIndex > 0) {
            this.loadWord(this.currentIndex - 1);
        }
    }

    /**
     * Navigate to next word
     */
    nextWord() {
        if (this.currentIndex < this.sessionWords.length - 1) {
            this.loadWord(this.currentIndex + 1);
        } else {
            this.completeSession();
        }
    }

    /**
     * Complete study session
     */
    completeSession() {
        alert('🎉 学习完成！已保存图像记忆。');
        this.exitStudy();
    }

    /**
     * Exit study mode
     */
    exitStudy() {
        // Clean up session
        if (this.currentSession) {
            this.imageMemoryService.deleteStudySession(this.currentSession.sessionId);
        }

        // Reset state
        this.currentSession = null;
        this.currentIndex = 0;
        this.sessionWords = [];

        // Show mode selection again
        document.getElementById('study-area').classList.add('hidden');
        document.getElementById('mode-selection').classList.remove('hidden');
    }

    /**
     * Play word audio
     */
    playAudio() {
        const word = document.getElementById('current-word').textContent;
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }

    /**
     * Show feedback message
     */
    showFeedback(message) {
        const toast = document.createElement('div');
        toast.className = 'feedback-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Show browse mode
     */
    async showBrowseMode() {
        const associations = this.imageMemoryService.getImageAssociations();
        const wordIds = Object.keys(associations);

        if (wordIds.length === 0) {
            alert('暂无已保存的图像记忆');
            return;
        }

        // Create browse modal (simplified implementation)
        alert(`您已保存 ${wordIds.length} 个词汇的图像记忆。\n\n完整的浏览功能正在开发中...`);
    }

    /**
     * Format date
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit'
        });
    }
}
