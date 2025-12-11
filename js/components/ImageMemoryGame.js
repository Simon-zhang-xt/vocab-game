/**
 * Image Memory Game Component
 * V3.2 Feature: Interactive games for visual vocabulary learning
 */

import ImageMemoryService from '../services/ImageMemoryService.js';
import ProgressService from '../services/ProgressService.js';

export default class ImageMemoryGame {
    constructor() {
        this.imageMemoryService = new ImageMemoryService();
        this.progressService = new ProgressService();
        this.currentGame = null;
        this.gameState = {
            score: 0,
            lives: 3,
            streak: 0,
            round: 1,
            totalRounds: 10
        };
    }

    /**
     * Render main game menu
     */
    render() {
        return `
            <div class="image-game-container">
                <!-- Header -->
                <div class="image-game-header">
                    <button class="btn-back" onclick="window.location.hash='#image-memory'">
                        ← 返回
                    </button>
                    <h1>🎮 图像记忆游戏</h1>
                </div>

                <!-- Game Mode Selection -->
                <div id="game-menu" class="game-menu">
                    ${this.renderGameModes()}
                </div>

                <!-- Game Area (hidden initially) -->
                <div id="game-area" class="game-area hidden">
                    ${this.renderGameArea()}
                </div>

                <!-- Game Results (hidden initially) -->
                <div id="game-results" class="game-results hidden">
                    ${this.renderResults()}
                </div>
            </div>
        `;
    }

    /**
     * Render game mode selection
     */
    renderGameModes() {
        return `
            <div class="game-modes-grid">
                <div class="game-mode-card" data-mode="image-to-word">
                    <div class="game-mode-icon">🖼️➡️📝</div>
                    <h3>看图选词</h3>
                    <p>根据图片选择正确的单词</p>
                    <div class="game-mode-meta">
                        <span class="difficulty easy">简单</span>
                        <span class="duration">⏱️ 5分钟</span>
                    </div>
                    <button class="btn btn-primary" onclick="window.imageMemoryGame.startGame('image-to-word')">
                        开始游戏
                    </button>
                </div>

                <div class="game-mode-card" data-mode="word-to-image">
                    <div class="game-mode-icon">📝➡️🖼️</div>
                    <h3>选图配词</h3>
                    <p>根据单词选择正确的图片</p>
                    <div class="game-mode-meta">
                        <span class="difficulty medium">中等</span>
                        <span class="duration">⏱️ 5分钟</span>
                    </div>
                    <button class="btn btn-primary" onclick="window.imageMemoryGame.startGame('word-to-image')">
                        开始游戏
                    </button>
                </div>

                <div class="game-mode-card" data-mode="memory-match">
                    <div class="game-mode-icon">🃏</div>
                    <h3>记忆配对</h3>
                    <p>翻转卡片，配对单词和图片</p>
                    <div class="game-mode-meta">
                        <span class="difficulty hard">困难</span>
                        <span class="duration">⏱️ 10分钟</span>
                    </div>
                    <button class="btn btn-primary" onclick="window.imageMemoryGame.startGame('memory-match')">
                        开始游戏
                    </button>
                </div>

                <div class="game-mode-card" data-mode="speed-challenge">
                    <div class="game-mode-icon">⚡</div>
                    <h3>极速挑战</h3>
                    <p>限时快速匹配单词和图片</p>
                    <div class="game-mode-meta">
                        <span class="difficulty expert">专家</span>
                        <span class="duration">⏱️ 3分钟</span>
                    </div>
                    <button class="btn btn-primary" onclick="window.imageMemoryGame.startGame('speed-challenge')">
                        开始游戏
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render game area
     */
    renderGameArea() {
        return `
            <!-- Game HUD -->
            <div class="game-hud">
                <div class="hud-left">
                    <div class="hud-item">
                        <span class="hud-label">得分</span>
                        <span class="hud-value" id="game-score">0</span>
                    </div>
                    <div class="hud-item">
                        <span class="hud-label">连击</span>
                        <span class="hud-value streak" id="game-streak">0</span>
                    </div>
                </div>

                <div class="hud-center">
                    <div class="round-indicator">
                        第 <span id="current-round">1</span> / <span id="total-rounds">10</span> 回合
                    </div>
                </div>

                <div class="hud-right">
                    <div class="lives-container" id="lives-container">
                        ❤️❤️❤️
                    </div>
                    <div class="timer" id="game-timer">
                        ⏱️ <span id="timer-value">30</span>s
                    </div>
                </div>
            </div>

            <!-- Game Content -->
            <div class="game-content" id="game-content">
                <!-- Dynamic game content will be rendered here -->
            </div>

            <!-- Game Controls -->
            <div class="game-controls">
                <button class="btn btn-text" id="btn-pause">
                    ⏸️ 暂停
                </button>
                <button class="btn btn-text" id="btn-quit">
                    🚪 退出
                </button>
            </div>
        `;
    }

    /**
     * Render results screen
     */
    renderResults() {
        return `
            <div class="results-content">
                <div class="results-header">
                    <h2>🎉 游戏结束</h2>
                    <div class="final-score" id="final-score">0</div>
                </div>

                <div class="results-stats">
                    <div class="result-stat">
                        <span class="stat-label">正确率</span>
                        <span class="stat-value" id="accuracy-rate">0%</span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">最高连击</span>
                        <span class="stat-value" id="max-streak">0</span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">用时</span>
                        <span class="stat-value" id="time-spent">0s</span>
                    </div>
                </div>

                <div class="results-actions">
                    <button class="btn btn-primary" onclick="window.imageMemoryGame.restartGame()">
                        🔄 再玩一次
                    </button>
                    <button class="btn btn-secondary" onclick="window.imageMemoryGame.backToMenu()">
                        📋 返回菜单
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Start a game mode
     */
    async startGame(mode) {
        console.log('[ImageMemoryGame] Starting game mode:', mode);

        this.currentGame = mode;
        this.resetGameState();

        // Hide menu, show game area
        document.getElementById('game-menu').classList.add('hidden');
        document.getElementById('game-area').classList.remove('hidden');

        // Load game data
        await this.loadGameData();

        // Start the specific game mode
        switch (mode) {
            case 'image-to-word':
                this.startImageToWordGame();
                break;
            case 'word-to-image':
                this.startWordToImageGame();
                break;
            case 'memory-match':
                this.startMemoryMatchGame();
                break;
            case 'speed-challenge':
                this.startSpeedChallengeGame();
                break;
        }

        // Attach event listeners
        this.attachGameEventListeners();
    }

    /**
     * Reset game state
     */
    resetGameState() {
        this.gameState = {
            score: 0,
            lives: 3,
            streak: 0,
            round: 1,
            totalRounds: 10,
            correctAnswers: 0,
            wrongAnswers: 0,
            startTime: Date.now(),
            maxStreak: 0
        };

        this.updateHUD();
    }

    /**
     * Load game data (words and images)
     */
    async loadGameData() {
        // Get words from progress
        const progress = await this.progressService.getAllProgress();

        // Get words with image associations
        const associations = this.imageMemoryService.getImageAssociations();

        this.gameData = progress
            .filter(p => associations[p.wordId])
            .map(p => ({
                ...p,
                image: associations[p.wordId]
            }))
            .sort(() => Math.random() - 0.5) // Shuffle
            .slice(0, this.gameState.totalRounds);

        // If not enough words, get some new ones
        if (this.gameData.length < this.gameState.totalRounds) {
            const needed = this.gameState.totalRounds - this.gameData.length;
            const newWords = progress
                .filter(p => !associations[p.wordId])
                .slice(0, needed);

            for (const word of newWords) {
                const image = await this.imageMemoryService.getImageForWord(
                    word.word,
                    word.category || ''
                );
                this.gameData.push({ ...word, image });
            }
        }
    }

    /**
     * IMAGE TO WORD GAME MODE
     */
    async startImageToWordGame() {
        this.renderImageToWordRound();
    }

    renderImageToWordRound() {
        const currentWord = this.gameData[this.gameState.round - 1];

        // Generate 3 wrong answers + 1 correct answer
        const wrongWords = this.gameData
            .filter(w => w.wordId !== currentWord.wordId)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const options = [...wrongWords, currentWord]
            .sort(() => Math.random() - 0.5);

        const gameContent = document.getElementById('game-content');
        gameContent.innerHTML = `
            <div class="image-to-word-game">
                <div class="question-image">
                    <img src="${currentWord.image.url}" alt="Question image">
                </div>

                <h3 class="question-prompt">这是哪个单词？</h3>

                <div class="word-options">
                    ${options.map(option => `
                        <button class="word-option-btn" data-word-id="${option.wordId}" data-is-correct="${option.wordId === currentWord.wordId}">
                            <div class="option-word">${option.word}</div>
                            <div class="option-translation">${option.translation || ''}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Attach option click listeners
        document.querySelectorAll('.word-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAnswer(e.currentTarget.dataset.isCorrect === 'true', e.currentTarget);
            });
        });
    }

    /**
     * WORD TO IMAGE GAME MODE
     */
    async startWordToImageGame() {
        this.renderWordToImageRound();
    }

    renderWordToImageRound() {
        const currentWord = this.gameData[this.gameState.round - 1];

        // Generate 3 wrong images + 1 correct image
        const wrongWords = this.gameData
            .filter(w => w.wordId !== currentWord.wordId)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const options = [...wrongWords, currentWord]
            .sort(() => Math.random() - 0.5);

        const gameContent = document.getElementById('game-content');
        gameContent.innerHTML = `
            <div class="word-to-image-game">
                <div class="question-word-card">
                    <h2 class="question-word">${currentWord.word}</h2>
                    <p class="question-translation">${currentWord.translation || ''}</p>
                </div>

                <h3 class="question-prompt">选择正确的图片</h3>

                <div class="image-options">
                    ${options.map(option => `
                        <button class="image-option-btn" data-word-id="${option.wordId}" data-is-correct="${option.wordId === currentWord.wordId}">
                            <img src="${option.image.thumb}" alt="${option.word}">
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Attach option click listeners
        document.querySelectorAll('.image-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAnswer(e.currentTarget.dataset.isCorrect === 'true', e.currentTarget);
            });
        });
    }

    /**
     * MEMORY MATCH GAME MODE
     */
    async startMemoryMatchGame() {
        const pairs = this.gameData.slice(0, 6); // 6 pairs = 12 cards

        const cards = [];
        pairs.forEach(word => {
            cards.push({ type: 'word', data: word, id: `word-${word.wordId}` });
            cards.push({ type: 'image', data: word, id: `image-${word.wordId}` });
        });

        // Shuffle cards
        cards.sort(() => Math.random() - 0.5);

        const gameContent = document.getElementById('game-content');
        gameContent.innerHTML = `
            <div class="memory-match-game">
                <div class="memory-grid">
                    ${cards.map((card, index) => `
                        <div class="memory-card" data-index="${index}" data-pair-id="${card.data.wordId}" data-type="${card.type}">
                            <div class="card-inner">
                                <div class="card-front">?</div>
                                <div class="card-back">
                                    ${card.type === 'word'
                                        ? `<div class="card-word">${card.data.word}</div>`
                                        : `<img src="${card.data.image.thumb}" alt="${card.data.word}">`
                                    }
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.memoryGameState = {
            flippedCards: [],
            matchedPairs: 0,
            totalPairs: pairs.length
        };

        // Attach card click listeners
        document.querySelectorAll('.memory-card').forEach(card => {
            card.addEventListener('click', () => this.handleMemoryCardClick(card));
        });
    }

    handleMemoryCardClick(card) {
        if (card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        if (this.memoryGameState.flippedCards.length >= 2) {
            return;
        }

        // Flip card
        card.classList.add('flipped');
        this.memoryGameState.flippedCards.push(card);

        if (this.memoryGameState.flippedCards.length === 2) {
            setTimeout(() => this.checkMemoryMatch(), 800);
        }
    }

    checkMemoryMatch() {
        const [card1, card2] = this.memoryGameState.flippedCards;
        const pairId1 = card1.dataset.pairId;
        const pairId2 = card2.dataset.pairId;

        if (pairId1 === pairId2) {
            // Match!
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.memoryGameState.matchedPairs++;

            this.handleAnswer(true);

            if (this.memoryGameState.matchedPairs === this.memoryGameState.totalPairs) {
                setTimeout(() => this.endGame(), 1000);
            }
        } else {
            // No match
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            this.handleAnswer(false);
        }

        this.memoryGameState.flippedCards = [];
    }

    /**
     * SPEED CHALLENGE GAME MODE
     */
    async startSpeedChallengeGame() {
        this.speedChallengeState = {
            timeLimit: 30,
            timeLeft: 30,
            timerInterval: null
        };

        this.renderSpeedChallengeRound();
        this.startSpeedTimer();
    }

    renderSpeedChallengeRound() {
        // Similar to image-to-word but with timer pressure
        this.renderImageToWordRound();
    }

    startSpeedTimer() {
        this.speedChallengeState.timerInterval = setInterval(() => {
            this.speedChallengeState.timeLeft--;
            document.getElementById('timer-value').textContent = this.speedChallengeState.timeLeft;

            if (this.speedChallengeState.timeLeft <= 0) {
                clearInterval(this.speedChallengeState.timerInterval);
                this.handleAnswer(false);
                this.nextRound();
            }
        }, 1000);
    }

    /**
     * Handle answer selection
     */
    handleAnswer(isCorrect, buttonElement = null) {
        if (buttonElement) {
            if (isCorrect) {
                buttonElement.classList.add('correct');
                this.showFeedback('✅ 正确！', 'success');
            } else {
                buttonElement.classList.add('wrong');
                this.showFeedback('❌ 错误', 'error');
            }
        }

        if (isCorrect) {
            this.gameState.correctAnswers++;
            this.gameState.streak++;
            this.gameState.score += 10 * this.gameState.streak;

            if (this.gameState.streak > this.gameState.maxStreak) {
                this.gameState.maxStreak = this.gameState.streak;
            }
        } else {
            this.gameState.wrongAnswers++;
            this.gameState.streak = 0;
            this.gameState.lives--;

            if (this.gameState.lives <= 0) {
                setTimeout(() => this.endGame(), 1500);
                return;
            }
        }

        this.updateHUD();

        if (this.currentGame !== 'memory-match') {
            setTimeout(() => this.nextRound(), 1500);
        }
    }

    /**
     * Move to next round
     */
    nextRound() {
        this.gameState.round++;

        if (this.gameState.round > this.gameState.totalRounds) {
            this.endGame();
            return;
        }

        // Re-render the round based on game mode
        switch (this.currentGame) {
            case 'image-to-word':
                this.renderImageToWordRound();
                break;
            case 'word-to-image':
                this.renderWordToImageRound();
                break;
            case 'speed-challenge':
                this.renderSpeedChallengeRound();
                if (this.speedChallengeState.timerInterval) {
                    clearInterval(this.speedChallengeState.timerInterval);
                }
                this.speedChallengeState.timeLeft = this.speedChallengeState.timeLimit;
                this.startSpeedTimer();
                break;
        }

        this.updateHUD();
    }

    /**
     * Update game HUD
     */
    updateHUD() {
        document.getElementById('game-score').textContent = this.gameState.score;
        document.getElementById('game-streak').textContent = this.gameState.streak;
        document.getElementById('current-round').textContent = this.gameState.round;
        document.getElementById('total-rounds').textContent = this.gameState.totalRounds;

        // Update lives
        const livesContainer = document.getElementById('lives-container');
        livesContainer.textContent = '❤️'.repeat(this.gameState.lives) + '🖤'.repeat(3 - this.gameState.lives);
    }

    /**
     * End game and show results
     */
    endGame() {
        // Clean up timers
        if (this.speedChallengeState && this.speedChallengeState.timerInterval) {
            clearInterval(this.speedChallengeState.timerInterval);
        }

        // Calculate stats
        const totalAnswers = this.gameState.correctAnswers + this.gameState.wrongAnswers;
        const accuracy = totalAnswers > 0 ? Math.round((this.gameState.correctAnswers / totalAnswers) * 100) : 0;
        const timeSpent = Math.round((Date.now() - this.gameState.startTime) / 1000);

        // Hide game area, show results
        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('game-results').classList.remove('hidden');

        // Update results
        document.getElementById('final-score').textContent = this.gameState.score;
        document.getElementById('accuracy-rate').textContent = `${accuracy}%`;
        document.getElementById('max-streak').textContent = this.gameState.maxStreak;
        document.getElementById('time-spent').textContent = `${timeSpent}s`;

        // Save game stats (optional)
        this.saveGameStats({
            mode: this.currentGame,
            score: this.gameState.score,
            accuracy,
            timeSpent,
            maxStreak: this.gameState.maxStreak
        });
    }

    /**
     * Save game statistics
     */
    saveGameStats(stats) {
        const allStats = JSON.parse(localStorage.getItem('imageGameStats') || '[]');
        allStats.push({
            ...stats,
            timestamp: Date.now()
        });
        localStorage.setItem('imageGameStats', JSON.stringify(allStats));
    }

    /**
     * Restart current game
     */
    async restartGame() {
        document.getElementById('game-results').classList.add('hidden');
        await this.startGame(this.currentGame);
    }

    /**
     * Back to game menu
     */
    backToMenu() {
        document.getElementById('game-results').classList.add('hidden');
        document.getElementById('game-menu').classList.remove('hidden');
        this.currentGame = null;
    }

    /**
     * Show feedback toast
     */
    showFeedback(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `game-feedback ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 1500);
    }

    /**
     * Attach game event listeners
     */
    attachGameEventListeners() {
        document.getElementById('btn-pause')?.addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('btn-quit')?.addEventListener('click', () => {
            if (confirm('确定要退出游戏吗？进度将不会保存。')) {
                this.quitGame();
            }
        });
    }

    /**
     * Pause game
     */
    pauseGame() {
        if (this.speedChallengeState && this.speedChallengeState.timerInterval) {
            clearInterval(this.speedChallengeState.timerInterval);
        }
        alert('游戏已暂停');
    }

    /**
     * Quit game
     */
    quitGame() {
        if (this.speedChallengeState && this.speedChallengeState.timerInterval) {
            clearInterval(this.speedChallengeState.timerInterval);
        }
        this.backToMenu();
    }
}
