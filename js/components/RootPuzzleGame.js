/**
 * Root Puzzle Game Component
 * V3.3 Feature: Interactive games for learning word roots
 */

import EtymologyService from '../services/EtymologyService.js';

export default class RootPuzzleGame {
    constructor() {
        this.etymologyService = new EtymologyService();
        this.currentGame = null;
        this.gameState = {
            score: 0,
            round: 1,
            totalRounds: 10,
            correctAnswers: 0,
            wrongAnswers: 0,
            startTime: Date.now()
        };
    }

    /**
     * Render main game menu
     */
    render() {
        return `
            <div class="root-game-container">
                <div class="root-game-header">
                    <button class="btn-back" onclick="window.location.hash='#etymology'">← 返回</button>
                    <h1>🎮 词根游戏</h1>
                </div>

                <div id="game-menu" class="game-menu">
                    ${this.renderGameModes()}
                </div>

                <div id="game-area" class="game-area hidden"></div>

                <div id="game-results" class="game-results hidden"></div>
            </div>
        `;
    }

    /**
     * Render game mode selection
     */
    renderGameModes() {
        return `
            <div class="game-modes-grid">
                <div class="game-mode-card">
                    <div class="game-mode-icon">🧩</div>
                    <h3>词根拼图</h3>
                    <p>根据词根组合正确的单词</p>
                    <button class="btn btn-primary" onclick="window.rootPuzzleGame.startGame('root-puzzle')">
                        开始游戏
                    </button>
                </div>

                <div class="game-mode-card">
                    <div class="game-mode-icon">🎯</div>
                    <h3>词根匹配</h3>
                    <p>将词根与正确的含义匹配</p>
                    <button class="btn btn-primary" onclick="window.rootPuzzleGame.startGame('root-match')">
                        开始游戏
                    </button>
                </div>

                <div class="game-mode-card">
                    <div class="game-mode-icon">✂️</div>
                    <h3>单词拆分</h3>
                    <p>将单词拆分成词根成分</p>
                    <button class="btn btn-primary" onclick="window.rootPuzzleGame.startGame('word-split')">
                        开始游戏
                    </button>
                </div>

                <div class="game-mode-card">
                    <div class="game-mode-icon">🔨</div>
                    <h3>造词工厂</h3>
                    <p>用词根创造新单词</p>
                    <button class="btn btn-primary" onclick="window.rootPuzzleGame.startGame('word-build')">
                        开始游戏
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Start a game mode
     */
    async startGame(mode) {
        this.currentGame = mode;
        this.resetGameState();

        // Load game data
        await this.loadGameData();

        // Hide menu, show game area
        document.getElementById('game-menu').classList.add('hidden');
        document.getElementById('game-area').classList.remove('hidden');

        // Start specific game mode
        switch (mode) {
            case 'root-puzzle':
                this.startRootPuzzle();
                break;
            case 'root-match':
                this.startRootMatch();
                break;
            case 'word-split':
                this.startWordSplit();
                break;
            case 'word-build':
                this.startWordBuild();
                break;
        }
    }

    /**
     * Reset game state
     */
    resetGameState() {
        this.gameState = {
            score: 0,
            round: 1,
            totalRounds: 10,
            correctAnswers: 0,
            wrongAnswers: 0,
            startTime: Date.now()
        };
    }

    /**
     * Load game data
     */
    async loadGameData() {
        const allComponents = [
            ...this.etymologyService.getAllRoots(),
            ...this.etymologyService.getAllPrefixes(),
            ...this.etymologyService.getAllSuffixes()
        ];

        // Shuffle and select random components
        this.gameData = allComponents
            .sort(() => Math.random() - 0.5)
            .slice(0, this.gameState.totalRounds);
    }

    /**
     * ROOT PUZZLE GAME
     */
    startRootPuzzle() {
        this.renderRootPuzzleRound();
    }

    renderRootPuzzleRound() {
        const component = this.gameData[this.gameState.round - 1];
        const word = component.examples[Math.floor(Math.random() * component.examples.length)];

        // Generate puzzle pieces
        const correctPieces = this.generatePuzzlePieces(word.word, component);
        const allPieces = this.addDistractorPieces(correctPieces);

        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = `
            <div class="game-hud">
                <div class="hud-item">
                    <span class="hud-label">得分</span>
                    <span class="hud-value">${this.gameState.score}</span>
                </div>
                <div class="hud-item">
                    <span class="hud-label">回合</span>
                    <span class="hud-value">${this.gameState.round}/${this.gameState.totalRounds}</span>
                </div>
            </div>

            <div class="puzzle-game">
                <h2>组合单词</h2>
                <p class="game-hint">使用下方的词根拼出: <strong>${word.translation}</strong></p>

                <div class="puzzle-target">
                    <div id="puzzle-slots" class="puzzle-slots">
                        ${correctPieces.map((_, i) => `
                            <div class="puzzle-slot" data-slot="${i}"></div>
                        `).join('')}
                    </div>
                    <div class="target-word-check">${word.word}</div>
                </div>

                <div class="puzzle-pieces">
                    ${allPieces.map((piece, i) => `
                        <div class="puzzle-piece" data-piece="${i}" data-value="${piece}" draggable="true">
                            ${piece}
                        </div>
                    `).join('')}
                </div>

                <div class="puzzle-actions">
                    <button class="btn btn-secondary" onclick="window.rootPuzzleGame.resetPuzzle()">
                        🔄 重置
                    </button>
                    <button class="btn btn-primary" onclick="window.rootPuzzleGame.checkPuzzle('${word.word}')">
                        ✓ 检查
                    </button>
                </div>
            </div>
        `;

        this.setupDragAndDrop();
    }

    generatePuzzlePieces(word, component) {
        // Simple split based on component
        const pieces = [];
        const rootIndex = word.toLowerCase().indexOf(component.id);

        if (rootIndex >= 0) {
            if (rootIndex > 0) pieces.push(word.substring(0, rootIndex));
            pieces.push(word.substring(rootIndex, rootIndex + component.id.length));
            if (rootIndex + component.id.length < word.length) {
                pieces.push(word.substring(rootIndex + component.id.length));
            }
        } else {
            // Fallback: split into syllables
            pieces.push(word.substring(0, word.length / 2));
            pieces.push(word.substring(word.length / 2));
        }

        return pieces;
    }

    addDistractorPieces(correctPieces) {
        const distractors = ['un', 'pre', 'ing', 'ed', 'tion', 'ly', 'ness'];
        const shuffled = [...correctPieces, ...distractors.slice(0, 2)];
        return shuffled.sort(() => Math.random() - 0.5);
    }

    setupDragAndDrop() {
        const pieces = document.querySelectorAll('.puzzle-piece');
        const slots = document.querySelectorAll('.puzzle-slot');

        pieces.forEach(piece => {
            piece.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.piece);
                e.target.classList.add('dragging');
            });

            piece.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });

            // Mobile touch support
            piece.addEventListener('click', (e) => {
                const emptySlot = document.querySelector('.puzzle-slot:not(.filled)');
                if (emptySlot) {
                    emptySlot.textContent = e.target.dataset.value;
                    emptySlot.classList.add('filled');
                    emptySlot.dataset.piece = e.target.dataset.piece;
                    e.target.style.opacity = '0.3';
                }
            });
        });

        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });

            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');

                const pieceIndex = e.dataTransfer.getData('text/plain');
                const piece = document.querySelector(`[data-piece="${pieceIndex}"]`);

                slot.textContent = piece.dataset.value;
                slot.classList.add('filled');
                slot.dataset.piece = pieceIndex;

                piece.style.opacity = '0.3';
            });

            // Click to remove
            slot.addEventListener('click', () => {
                if (slot.classList.contains('filled')) {
                    const pieceIndex = slot.dataset.piece;
                    const piece = document.querySelector(`[data-piece="${pieceIndex}"]`);
                    if (piece) piece.style.opacity = '1';

                    slot.textContent = '';
                    slot.classList.remove('filled');
                    delete slot.dataset.piece;
                }
            });
        });
    }

    resetPuzzle() {
        document.querySelectorAll('.puzzle-slot').forEach(slot => {
            slot.textContent = '';
            slot.classList.remove('filled');
        });

        document.querySelectorAll('.puzzle-piece').forEach(piece => {
            piece.style.opacity = '1';
        });
    }

    checkPuzzle(correctWord) {
        const slots = document.querySelectorAll('.puzzle-slot');
        const assembled = Array.from(slots).map(s => s.textContent).join('');

        if (assembled.toLowerCase() === correctWord.toLowerCase()) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }
    }

    /**
     * ROOT MATCH GAME
     */
    startRootMatch() {
        this.renderRootMatchRound();
    }

    renderRootMatchRound() {
        const component = this.gameData[this.gameState.round - 1];

        // Generate wrong options
        const allComponents = [...this.etymologyService.getAllRoots(), ...this.etymologyService.getAllPrefixes(), ...this.etymologyService.getAllSuffixes()];
        const wrongOptions = allComponents
            .filter(c => c.id !== component.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const options = [component, ...wrongOptions].sort(() => Math.random() - 0.5);

        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = `
            <div class="game-hud">
                <div class="hud-item">
                    <span class="hud-label">得分</span>
                    <span class="hud-value">${this.gameState.score}</span>
                </div>
                <div class="hud-item">
                    <span class="hud-label">回合</span>
                    <span class="hud-value">${this.gameState.round}/${this.gameState.totalRounds}</span>
                </div>
            </div>

            <div class="match-game">
                <h2>词根匹配</h2>

                <div class="match-question">
                    <div class="match-root-display">${component.id}</div>
                    <p>选择正确的含义:</p>
                </div>

                <div class="match-options">
                    ${options.map((opt, i) => `
                        <button class="match-option" onclick="window.rootPuzzleGame.selectMatch('${opt.id}', '${component.id}', this)">
                            <span class="option-meaning">${opt.meaning}</span>
                            <span class="option-translation">${opt.meaning_zh}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    selectMatch(selectedId, correctId, button) {
        if (selectedId === correctId) {
            button.classList.add('correct');
            this.handleCorrectAnswer();
        } else {
            button.classList.add('wrong');
            document.querySelectorAll('.match-option').forEach(opt => {
                if (opt.textContent.includes(this.etymologyService.getComponent(correctId).meaning)) {
                    opt.classList.add('correct');
                }
            });
            this.handleWrongAnswer();
        }
    }

    /**
     * WORD SPLIT GAME
     */
    startWordSplit() {
        this.renderWordSplitRound();
    }

    renderWordSplitRound() {
        const component = this.gameData[this.gameState.round - 1];
        const word = component.examples[0];

        const analysis = this.etymologyService.analyzeWord(word.word);

        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = `
            <div class="game-hud">
                <div class="hud-item">
                    <span class="hud-label">得分</span>
                    <span class="hud-value">${this.gameState.score}</span>
                </div>
                <div class="hud-item">
                    <span class="hud-label">回合</span>
                    <span class="hud-value">${this.gameState.round}/${this.gameState.totalRounds}</span>
                </div>
            </div>

            <div class="split-game">
                <h2>单词拆分</h2>
                <p class="game-hint">找出单词中的词根成分</p>

                <div class="split-word-display">${word.word}</div>
                <div class="split-translation">${word.translation}</div>

                <div class="split-question">
                    <p>这个单词包含哪个词根？</p>
                </div>

                <div class="split-options">
                    ${this.generateSplitOptions(component).map(opt => `
                        <button class="split-option" onclick="window.rootPuzzleGame.selectSplit('${opt.id}', '${component.id}', this)">
                            <span class="opt-root">${opt.id}</span>
                            <span class="opt-meaning">${opt.meaning_zh}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    generateSplitOptions(correctComponent) {
        const allComponents = [...this.etymologyService.getAllRoots()];
        const wrong = allComponents
            .filter(c => c.id !== correctComponent.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        return [correctComponent, ...wrong].sort(() => Math.random() - 0.5);
    }

    selectSplit(selectedId, correctId, button) {
        if (selectedId === correctId) {
            button.classList.add('correct');
            this.handleCorrectAnswer();
        } else {
            button.classList.add('wrong');
            this.handleWrongAnswer();
        }
    }

    /**
     * WORD BUILD GAME
     */
    startWordBuild() {
        this.renderWordBuildRound();
    }

    renderWordBuildRound() {
        // For simplicity, reuse root match logic
        this.renderRootMatchRound();
    }

    /**
     * Handle correct answer
     */
    handleCorrectAnswer() {
        this.gameState.correctAnswers++;
        this.gameState.score += 10;

        this.showFeedback('✅ 正确！', 'success');

        setTimeout(() => this.nextRound(), 1500);
    }

    /**
     * Handle wrong answer
     */
    handleWrongAnswer() {
        this.gameState.wrongAnswers++;

        this.showFeedback('❌ 错误', 'error');

        setTimeout(() => this.nextRound(), 1500);
    }

    /**
     * Move to next round
     */
    nextRound() {
        this.gameState.round++;

        if (this.gameState.round > this.gameState.totalRounds) {
            this.endGame();
        } else {
            switch (this.currentGame) {
                case 'root-puzzle':
                    this.renderRootPuzzleRound();
                    break;
                case 'root-match':
                    this.renderRootMatchRound();
                    break;
                case 'word-split':
                    this.renderWordSplitRound();
                    break;
                case 'word-build':
                    this.renderWordBuildRound();
                    break;
            }
        }
    }

    /**
     * End game and show results
     */
    endGame() {
        const accuracy = Math.round((this.gameState.correctAnswers / this.gameState.totalRounds) * 100);
        const timeSpent = Math.round((Date.now() - this.gameState.startTime) / 1000);

        document.getElementById('game-area').classList.add('hidden');
        const resultsArea = document.getElementById('game-results');
        resultsArea.classList.remove('hidden');

        resultsArea.innerHTML = `
            <div class="results-content">
                <h2>🎉 游戏结束</h2>

                <div class="final-score">${this.gameState.score}</div>

                <div class="results-stats">
                    <div class="result-stat">
                        <span class="stat-label">正确率</span>
                        <span class="stat-value">${accuracy}%</span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">正确</span>
                        <span class="stat-value">${this.gameState.correctAnswers}</span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">用时</span>
                        <span class="stat-value">${timeSpent}s</span>
                    </div>
                </div>

                <div class="results-actions">
                    <button class="btn btn-primary" onclick="window.rootPuzzleGame.restartGame()">
                        🔄 再玩一次
                    </button>
                    <button class="btn btn-secondary" onclick="window.rootPuzzleGame.backToMenu()">
                        📋 返回菜单
                    </button>
                </div>
            </div>
        `;
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
    }

    /**
     * Show feedback
     */
    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `game-feedback ${type}`;
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => feedback.classList.add('show'), 10);
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 1500);
    }
}
