/**
 * Root Explorer View Component
 * V3.3 Feature: Browse and learn word roots, prefixes, and suffixes
 */

import EtymologyService from '../services/EtymologyService.js';

export default class RootExplorerView {
    constructor() {
        this.etymologyService = new EtymologyService();
        this.currentFilter = 'all'; // 'all', 'roots', 'prefixes', 'suffixes'
        this.searchQuery = '';
    }

    /**
     * Render the main root explorer view
     */
    async render() {
        const stats = this.etymologyService.getStatistics();

        return `
            <div class="root-explorer-container">
                <!-- Header -->
                <div class="root-explorer-header">
                    <h1>📚 词根词缀探索</h1>
                    <p class="subtitle">学习词源，掌握构词规律</p>
                </div>

                <!-- Statistics -->
                <div class="root-stats">
                    ${this.renderStatistics(stats)}
                </div>

                <!-- Filters and Search -->
                <div class="root-controls">
                    <div class="filter-tabs">
                        <button class="filter-tab active" data-filter="all">
                            全部 (${stats.totalComponents})
                        </button>
                        <button class="filter-tab" data-filter="roots">
                            词根 (${this.etymologyService.getAllRoots().length})
                        </button>
                        <button class="filter-tab" data-filter="prefixes">
                            前缀 (${this.etymologyService.getAllPrefixes().length})
                        </button>
                        <button class="filter-tab" data-filter="suffixes">
                            后缀 (${this.etymologyService.getAllSuffixes().length})
                        </button>
                    </div>

                    <div class="search-bar">
                        <input
                            type="text"
                            id="root-search"
                            placeholder="搜索词根、前缀或后缀..."
                            class="search-input"
                        >
                        <span class="search-icon">🔍</span>
                    </div>
                </div>

                <!-- Root List -->
                <div id="root-list" class="root-list">
                    ${this.renderRootList()}
                </div>

                <!-- Learning Actions -->
                <div class="learning-actions">
                    <button class="btn btn-primary" onclick="window.rootExplorerView.startLearningSession()">
                        🎯 开始学习
                    </button>
                    <button class="btn btn-secondary" onclick="window.rootExplorerView.startReview()">
                        🔄 复习已学
                    </button>
                    <button class="btn btn-accent" onclick="window.location.hash='#root-game'">
                        🎮 词根游戏
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render statistics cards
     */
    renderStatistics(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.totalComponents}</div>
                        <div class="stat-label">总词根数</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.learnedComponents}</div>
                        <div class="stat-label">已学习</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.completionRate}%</div>
                        <div class="stat-label">完成率</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.masteryLevels[5] || 0}</div>
                        <div class="stat-label">精通</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render list of roots based on current filter
     */
    renderRootList() {
        let components = [];

        switch (this.currentFilter) {
            case 'roots':
                components = this.etymologyService.getAllRoots();
                break;
            case 'prefixes':
                components = this.etymologyService.getAllPrefixes();
                break;
            case 'suffixes':
                components = this.etymologyService.getAllSuffixes();
                break;
            default:
                components = [
                    ...this.etymologyService.getAllRoots(),
                    ...this.etymologyService.getAllPrefixes(),
                    ...this.etymologyService.getAllSuffixes()
                ];
        }

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            components = components.filter(c =>
                c.id.toLowerCase().includes(query) ||
                c.meaning.toLowerCase().includes(query) ||
                c.meaning_zh.includes(query)
            );
        }

        if (components.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p class="empty-state-text">没有找到匹配的词根</p>
                </div>
            `;
        }

        return `
            <div class="root-cards-grid">
                ${components.map(component => this.renderRootCard(component)).join('')}
            </div>
        `;
    }

    /**
     * Render individual root card
     */
    renderRootCard(component) {
        const progress = this.etymologyService.userRootProgress[component.id];
        const isLearned = !!progress;
        const masteryLevel = progress ? progress.masteryLevel : 0;

        return `
            <div class="root-card ${isLearned ? 'learned' : ''}" data-root-id="${component.id}">
                <div class="root-card-header">
                    <div class="root-type-badge ${component.type}">
                        ${component.type === 'root' ? '词根' : component.type === 'prefix' ? '前缀' : '后缀'}
                    </div>
                    ${isLearned ? `
                        <div class="mastery-badge level-${masteryLevel}">
                            ${'⭐'.repeat(masteryLevel)}
                        </div>
                    ` : ''}
                </div>

                <div class="root-card-body">
                    <div class="root-word">${component.id}</div>
                    <div class="root-origin">${component.origin || ''}</div>
                    <div class="root-meaning">
                        <span class="meaning-en">${component.meaning}</span>
                        <span class="meaning-zh">${component.meaning_zh}</span>
                    </div>
                </div>

                <div class="root-card-footer">
                    <button class="btn-text btn-sm" onclick="window.rootExplorerView.showRootDetail('${component.id}')">
                        查看详情 (${component.examples.length} 词)
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show detailed view of a specific root
     */
    showRootDetail(rootId) {
        const component = this.etymologyService.getComponent(rootId);
        if (!component) return;

        const tree = this.etymologyService.buildWordTree(rootId);
        const progress = this.etymologyService.userRootProgress[rootId];

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'root-detail-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content root-detail-content">
                <button class="modal-close" onclick="this.closest('.root-detail-modal').remove()">×</button>

                <div class="root-detail-header">
                    <div class="root-word-large">${component.id}</div>
                    <div class="root-type-badge ${component.type}">
                        ${component.type === 'root' ? '词根' : component.type === 'prefix' ? '前缀' : '后缀'}
                    </div>
                </div>

                <div class="root-detail-info">
                    <div class="info-row">
                        <span class="info-label">来源:</span>
                        <span class="info-value">${component.origin || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">含义:</span>
                        <span class="info-value">${component.meaning} / ${component.meaning_zh}</span>
                    </div>
                    ${progress ? `
                        <div class="info-row">
                            <span class="info-label">掌握度:</span>
                            <span class="info-value">
                                ${'⭐'.repeat(progress.masteryLevel)} (${progress.reviewCount} 次复习)
                            </span>
                        </div>
                    ` : ''}
                </div>

                <div class="root-examples">
                    <h3>相关单词 (${component.examples.length})</h3>
                    <div class="examples-list">
                        ${component.examples.map(ex => `
                            <div class="example-item">
                                <div class="example-word">${ex.word}</div>
                                <div class="example-meaning">${ex.meaning}</div>
                                <div class="example-translation">${ex.translation}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${tree.connections.length > 0 ? `
                    <div class="root-connections">
                        <h3>相关词根</h3>
                        <div class="connections-list">
                            ${tree.connections.map(conn => `
                                <div class="connection-item" onclick="window.rootExplorerView.showRootDetail('${conn.component.id}')">
                                    <span class="connection-root">${conn.component.id}</span>
                                    <span class="connection-meaning">${conn.component.meaning_zh}</span>
                                    <span class="connection-count">${conn.sharedWords.length} 个共同词</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="root-detail-actions">
                    ${!progress ? `
                        <button class="btn btn-primary" onclick="window.rootExplorerView.markAsLearned('${rootId}')">
                            ✅ 标记为已学
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="window.rootExplorerView.practiceRoot('${rootId}')">
                        🎯 练习
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Mark root as learned
     */
    markAsLearned(rootId) {
        this.etymologyService.markRootLearned(rootId);

        // Close modal and refresh view
        document.querySelector('.root-detail-modal')?.remove();
        this.refreshView();

        // Show success message
        this.showToast('✅ 已标记为已学！');
    }

    /**
     * Practice specific root
     */
    practiceRoot(rootId) {
        // Store root ID for practice session
        localStorage.setItem('practiceRootId', rootId);

        // Navigate to game
        window.location.hash = '#root-game';
    }

    /**
     * Start learning session
     */
    startLearningSession() {
        const session = this.etymologyService.generateLearningSession({
            sessionSize: 10,
            focusType: this.currentFilter === 'all' ? 'all' : this.currentFilter,
            includeReview: false
        });

        if (session.components.length === 0) {
            this.showToast('⚠️ 没有新的词根可以学习');
            return;
        }

        // Store session
        localStorage.setItem('etymologyLearningSession', JSON.stringify(session));

        // Navigate to learning view
        this.showLearningSession(session);
    }

    /**
     * Start review session
     */
    startReview() {
        const reviewRoots = this.etymologyService.getRootsForReview(10);

        if (reviewRoots.length === 0) {
            this.showToast('✅ 暂无需要复习的词根');
            return;
        }

        const session = {
            sessionId: `etymology-review-${Date.now()}`,
            components: reviewRoots,
            isReview: true
        };

        this.showLearningSession(session);
    }

    /**
     * Show learning session interface
     */
    showLearningSession(session) {
        const container = document.querySelector('.root-explorer-container');
        if (!container) return;

        let currentIndex = 0;

        const renderSession = () => {
            const component = session.components[currentIndex];
            const progress = ((currentIndex + 1) / session.components.length) * 100;

            container.innerHTML = `
                <div class="learning-session">
                    <div class="session-header">
                        <button class="btn-back" onclick="window.location.reload()">← 返回</button>
                        <h2>${session.isReview ? '复习模式' : '学习模式'}</h2>
                    </div>

                    <div class="session-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${currentIndex + 1} / ${session.components.length}</div>
                    </div>

                    <div class="learning-card">
                        <div class="root-type-badge ${component.type}">
                            ${component.type === 'root' ? '词根' : component.type === 'prefix' ? '前缀' : '后缀'}
                        </div>

                        <div class="learning-root">${component.id}</div>
                        <div class="learning-origin">${component.origin || ''}</div>

                        <div class="learning-meaning">
                            <div class="meaning-en">${component.meaning}</div>
                            <div class="meaning-zh">${component.meaning_zh}</div>
                        </div>

                        <div class="learning-examples">
                            <h3>相关单词:</h3>
                            ${component.examples.map(ex => `
                                <div class="learning-example">
                                    <span class="ex-word">${ex.word}</span>
                                    <span class="ex-arrow">→</span>
                                    <span class="ex-meaning">${ex.translation}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="session-actions">
                        ${currentIndex > 0 ? `
                            <button class="btn btn-secondary" onclick="this.closest('.learning-session').dispatchEvent(new CustomEvent('nav', {detail: 'prev'}))">
                                ← 上一个
                            </button>
                        ` : '<div></div>'}

                        <button class="btn btn-primary" onclick="this.closest('.learning-session').dispatchEvent(new CustomEvent('nav', {detail: 'next'}))">
                            ${currentIndex < session.components.length - 1 ? '下一个 →' : '完成 ✓'}
                        </button>
                    </div>
                </div>
            `;

            // Mark as learned when viewed
            this.etymologyService.markRootLearned(component.id);

            // Attach navigation handler
            container.querySelector('.learning-session').addEventListener('nav', (e) => {
                if (e.detail === 'next') {
                    if (currentIndex < session.components.length - 1) {
                        currentIndex++;
                        renderSession();
                    } else {
                        // Session complete
                        this.showToast('🎉 学习完成！');
                        setTimeout(() => window.location.reload(), 1000);
                    }
                } else if (e.detail === 'prev') {
                    currentIndex--;
                    renderSession();
                }
            });
        };

        renderSession();
    }

    /**
     * Setup event listeners after render
     */
    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                this.currentFilter = e.target.dataset.filter;
                this.refreshRootList();
            });
        });

        // Search input
        const searchInput = document.getElementById('root-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.refreshRootList();
            });
        }
    }

    /**
     * Refresh root list only
     */
    refreshRootList() {
        const rootList = document.getElementById('root-list');
        if (rootList) {
            rootList.innerHTML = this.renderRootList();
        }
    }

    /**
     * Refresh entire view
     */
    async refreshView() {
        const container = document.querySelector('.root-explorer-container');
        if (container) {
            container.innerHTML = await this.render();
            this.setupEventListeners();
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
}
