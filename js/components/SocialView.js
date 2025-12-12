/**
 * Social View Component
 * V3.5 Feature: Social learning interface with friends, groups, and leaderboards
 */

import SocialService from '../services/SocialService.js';

export default class SocialView {
    constructor() {
        this.socialService = new SocialService();
        this.currentTab = 'friends'; // 'friends', 'groups', 'leaderboard'
    }

    /**
     * Main render method
     */
    async render() {
        const stats = this.socialService.getSocialStats();

        return `
            <div class="social-container">
                <!-- Header -->
                <div class="social-header">
                    <h1>🌐 社交学习</h1>
                    <p class="subtitle">与好友一起学习，共同进步</p>
                </div>

                <!-- Stats Overview -->
                <div class="social-stats">
                    ${this.renderStats(stats)}
                </div>

                <!-- Tab Navigation -->
                <div class="social-tabs">
                    <button class="social-tab active" data-tab="friends">
                        👥 好友 (${stats.friends})
                    </button>
                    <button class="social-tab" data-tab="groups">
                        📚 学习小组 (${stats.groups})
                    </button>
                    <button class="social-tab" data-tab="leaderboard">
                        🏆 排行榜
                    </button>
                </div>

                <!-- Content Area -->
                <div id="social-content" class="social-content">
                    ${this.renderFriendsTab()}
                </div>
            </div>
        `;
    }

    /**
     * Render stats overview
     */
    renderStats(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.friends}</div>
                        <div class="stat-label">好友数</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.groups}</div>
                        <div class="stat-label">学习小组</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🌍</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.globalRank || '-'}</div>
                        <div class="stat-label">全球排名</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🏅</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.friendsRank || '-'}</div>
                        <div class="stat-label">好友排名</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render friends tab
     */
    renderFriendsTab() {
        const friends = this.socialService.getFriends();
        const pendingRequests = this.socialService.getPendingRequests();
        const sentRequests = this.socialService.getSentRequests();

        return `
            <div class="friends-container">
                <!-- Add Friend Section -->
                <div class="add-friend-section">
                    <h3>添加好友</h3>
                    <div class="search-bar">
                        <input
                            type="text"
                            id="friend-search"
                            placeholder="搜索用户名..."
                            class="search-input"
                        >
                        <button class="btn btn-primary" onclick="window.socialView.searchFriends()">
                            🔍 搜索
                        </button>
                    </div>
                    <div id="search-results" class="search-results"></div>
                </div>

                <!-- Pending Requests -->
                ${pendingRequests.length > 0 ? `
                    <div class="requests-section">
                        <h3>好友请求 (${pendingRequests.length})</h3>
                        <div class="requests-list">
                            ${pendingRequests.map(req => this.renderFriendRequest(req)).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Sent Requests -->
                ${sentRequests.length > 0 ? `
                    <div class="sent-requests-section">
                        <h3>已发送的请求 (${sentRequests.length})</h3>
                        <div class="sent-requests-list">
                            ${sentRequests.map(req => `
                                <div class="request-item">
                                    <div class="user-avatar">${req.toUser.avatar}</div>
                                    <div class="user-info">
                                        <div class="user-name">${req.toUser.username}</div>
                                        <div class="request-time">${this.formatTime(req.createdAt)}</div>
                                    </div>
                                    <span class="status-badge pending">待接受</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Friends List -->
                <div class="friends-section">
                    <h3>我的好友 (${friends.length})</h3>
                    ${friends.length > 0 ? `
                        <div class="friends-list">
                            ${friends.map(friend => this.renderFriendCard(friend)).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>还没有好友，快去添加吧！</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Render friend request
     */
    renderFriendRequest(request) {
        return `
            <div class="request-item">
                <div class="user-avatar">${request.fromUser.avatar}</div>
                <div class="user-info">
                    <div class="user-name">${request.fromUser.username}</div>
                    <div class="request-time">${this.formatTime(request.createdAt)}</div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-primary btn-sm" onclick="window.socialView.acceptRequest('${request.id}')">
                        接受
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="window.socialView.rejectRequest('${request.id}')">
                        拒绝
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render friend card
     */
    renderFriendCard(friend) {
        const stats = friend.friendData.stats;

        return `
            <div class="friend-card">
                <div class="friend-header">
                    <div class="user-avatar large">${friend.friendData.avatar}</div>
                    <div class="friend-info">
                        <div class="friend-name">${friend.friendData.username}</div>
                        <div class="friend-stats">
                            <span>📚 ${stats.totalWords} 词</span>
                            <span>⭐ ${stats.totalScore} 分</span>
                        </div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="btn-text btn-sm" onclick="window.socialView.viewFriendProfile('${friend.friendId}')">
                        查看详情
                    </button>
                    <button class="btn-text btn-sm text-danger" onclick="window.socialView.removeFriend('${friend.friendId}')">
                        删除好友
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render groups tab
     */
    renderGroupsTab() {
        const userGroups = this.socialService.getUserStudyGroups();
        const publicGroups = this.socialService.getPublicStudyGroups()
            .filter(g => !g.isMember);

        return `
            <div class="groups-container">
                <!-- Create Group Button -->
                <div class="create-group-section">
                    <button class="btn btn-primary btn-large" onclick="window.socialView.showCreateGroupModal()">
                        ➕ 创建学习小组
                    </button>
                </div>

                <!-- My Groups -->
                <div class="my-groups-section">
                    <h3>我的学习小组 (${userGroups.length})</h3>
                    ${userGroups.length > 0 ? `
                        <div class="groups-list">
                            ${userGroups.map(group => this.renderGroupCard(group, true)).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>还没有加入任何小组</p>
                        </div>
                    `}
                </div>

                <!-- Public Groups -->
                ${publicGroups.length > 0 ? `
                    <div class="public-groups-section">
                        <h3>公开小组</h3>
                        <div class="groups-list">
                            ${publicGroups.map(group => this.renderGroupCard(group, false)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render group card
     */
    renderGroupCard(group, isMember) {
        return `
            <div class="group-card">
                <div class="group-header">
                    <h4 class="group-name">${group.name}</h4>
                    ${group.isOwner ? '<span class="owner-badge">拥有者</span>' : ''}
                </div>

                <div class="group-description">${group.description || '暂无描述'}</div>

                <div class="group-stats">
                    <div class="group-stat">
                        <span class="stat-icon">👥</span>
                        <span>${group.members.length}/${group.settings.maxMembers} 成员</span>
                    </div>
                    <div class="group-stat">
                        <span class="stat-icon">📚</span>
                        <span>${group.stats.totalWords} 单词</span>
                    </div>
                    <div class="group-stat">
                        <span class="stat-icon">⭐</span>
                        <span>${group.stats.avgScore.toFixed(1)} 平均分</span>
                    </div>
                </div>

                <div class="group-actions">
                    ${isMember ? `
                        <button class="btn btn-primary btn-sm" onclick="window.socialView.viewGroup('${group.id}')">
                            查看详情
                        </button>
                        ${!group.isOwner ? `
                            <button class="btn btn-secondary btn-sm" onclick="window.socialView.leaveGroup('${group.id}')">
                                退出小组
                            </button>
                        ` : ''}
                    ` : `
                        <button class="btn btn-primary btn-sm" onclick="window.socialView.joinGroup('${group.id}')">
                            加入小组
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Render leaderboard tab
     */
    renderLeaderboardTab() {
        return `
            <div class="leaderboard-container">
                <!-- Leaderboard Type Selector -->
                <div class="leaderboard-type-selector">
                    <button class="type-btn active" data-type="global">
                        🌍 全球排行
                    </button>
                    <button class="type-btn" data-type="friends">
                        👥 好友排行
                    </button>
                    <button class="type-btn" data-type="metric">
                        📊 指标选择
                    </button>
                </div>

                <!-- Metric Selector (hidden by default) -->
                <div id="metric-selector" class="metric-selector hidden">
                    <select id="leaderboard-metric" class="metric-select">
                        <option value="totalScore">总分数</option>
                        <option value="totalWords">学习单词数</option>
                        <option value="avgAccuracy">平均准确率</option>
                        <option value="studyDays">学习天数</option>
                    </select>
                </div>

                <!-- Leaderboard Content -->
                <div id="leaderboard-content" class="leaderboard-content">
                    ${this.renderGlobalLeaderboard()}
                </div>
            </div>
        `;
    }

    /**
     * Render global leaderboard
     */
    renderGlobalLeaderboard(metric = 'totalScore') {
        const leaderboard = this.socialService.getGlobalLeaderboard(metric, 100);

        if (leaderboard.length === 0) {
            return `
                <div class="empty-state">
                    <p>暂无排行数据</p>
                </div>
            `;
        }

        return `
            <div class="leaderboard-list">
                ${leaderboard.map(user => this.renderLeaderboardItem(user, metric)).join('')}
            </div>
        `;
    }

    /**
     * Render friends leaderboard
     */
    renderFriendsLeaderboard(metric = 'totalScore') {
        const leaderboard = this.socialService.getFriendsLeaderboard(metric);

        if (leaderboard.length === 0) {
            return `
                <div class="empty-state">
                    <p>暂无好友排行数据</p>
                </div>
            `;
        }

        return `
            <div class="leaderboard-list">
                ${leaderboard.map(user => this.renderLeaderboardItem(user, metric)).join('')}
            </div>
        `;
    }

    /**
     * Render leaderboard item
     */
    renderLeaderboardItem(user, metric) {
        const metricValue = user.stats[metric];
        const metricLabel = this.getMetricLabel(metric);

        return `
            <div class="leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}">
                <div class="rank-badge rank-${user.rank}">
                    ${user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : `#${user.rank}`}
                </div>

                <div class="user-avatar">${user.avatar}</div>

                <div class="user-info">
                    <div class="user-name">
                        ${user.username}
                        ${user.isCurrentUser ? '<span class="you-badge">你</span>' : ''}
                    </div>
                    <div class="user-metric">
                        ${metricLabel}: ${metricValue}
                    </div>
                </div>

                <div class="user-stats-mini">
                    <div class="stat-mini">📚 ${user.stats.totalWords}</div>
                    <div class="stat-mini">⭐ ${user.stats.totalScore}</div>
                </div>
            </div>
        `;
    }

    /**
     * Event Handlers
     */

    async searchFriends() {
        const query = document.getElementById('friend-search')?.value;
        const resultsContainer = document.getElementById('search-results');

        if (!query || !resultsContainer) return;

        const users = this.socialService.searchUsers(query);

        if (users.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">未找到用户</p>';
            return;
        }

        resultsContainer.innerHTML = `
            <div class="search-results-list">
                ${users.map(user => `
                    <div class="search-result-item">
                        <div class="user-avatar">${user.avatar}</div>
                        <div class="user-info">
                            <div class="user-name">${user.username}</div>
                            <div class="user-stats-mini">
                                📚 ${user.stats.totalWords} | ⭐ ${user.stats.totalScore}
                            </div>
                        </div>
                        <button
                            class="btn btn-primary btn-sm"
                            onclick="window.socialView.sendFriendRequest('${user.userId}')"
                            ${this.socialService.isFriend(user.userId) || this.socialService.hasPendingRequest(user.userId) ? 'disabled' : ''}
                        >
                            ${this.socialService.isFriend(user.userId) ? '已是好友' :
                              this.socialService.hasPendingRequest(user.userId) ? '已发送' : '添加好友'}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async sendFriendRequest(userId) {
        try {
            await this.socialService.sendFriendRequest(userId);
            this.showToast('✅ 好友请求已发送');
            this.refreshCurrentTab();
        } catch (error) {
            this.showToast('❌ ' + error.message);
        }
    }

    async acceptRequest(requestId) {
        try {
            await this.socialService.acceptFriendRequest(requestId);
            this.showToast('✅ 已接受好友请求');
            this.refreshCurrentTab();
        } catch (error) {
            this.showToast('❌ ' + error.message);
        }
    }

    async rejectRequest(requestId) {
        try {
            await this.socialService.rejectFriendRequest(requestId);
            this.showToast('✅ 已拒绝好友请求');
            this.refreshCurrentTab();
        } catch (error) {
            this.showToast('❌ ' + error.message);
        }
    }

    async removeFriend(userId) {
        if (!confirm('确定要删除这个好友吗？')) return;

        try {
            await this.socialService.removeFriend(userId);
            this.showToast('✅ 已删除好友');
            this.refreshCurrentTab();
        } catch (error) {
            this.showToast('❌ ' + error.message);
        }
    }

    showCreateGroupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>创建学习小组</h2>
                <form id="create-group-form">
                    <div class="form-group">
                        <label>小组名称</label>
                        <input type="text" id="group-name" required>
                    </div>
                    <div class="form-group">
                        <label>小组描述</label>
                        <textarea id="group-description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="group-public" checked>
                            公开小组
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">取消</button>
                        <button type="submit" class="btn btn-primary">创建</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#create-group-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createGroup();
            modal.remove();
        });
    }

    async createGroup() {
        const name = document.getElementById('group-name')?.value;
        const description = document.getElementById('group-description')?.value;
        const isPublic = document.getElementById('group-public')?.checked;

        if (!name) return;

        try {
            await this.socialService.createStudyGroup({ name, description, isPublic });
            this.showToast('✅ 学习小组创建成功');
            this.switchTab('groups');
        } catch (error) {
            this.showToast('❌ ' + error.message);
        }
    }

    async joinGroup(groupId) {
        try {
            await this.socialService.joinStudyGroup(groupId);
            this.showToast('✅ 已加入学习小组');
            this.refreshCurrentTab();
        } catch (error) {
            this.showToast('❌ ' + error.message);
        }
    }

    async leaveGroup(groupId) {
        if (!confirm('确定要退出这个学习小组吗？')) return;

        try {
            await this.socialService.leaveStudyGroup(groupId);
            this.showToast('✅ 已退出学习小组');
            this.refreshCurrentTab();
        } catch (error) {
            this.showToast('❌ ' + error.message);
        }
    }

    viewGroup(groupId) {
        // TODO: Implement group detail view
        console.log('View group:', groupId);
    }

    viewFriendProfile(userId) {
        // TODO: Implement friend profile view
        console.log('View friend profile:', userId);
    }

    /**
     * Tab Management
     */

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.social-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Render content
        const content = document.getElementById('social-content');
        if (!content) return;

        switch (tab) {
            case 'friends':
                content.innerHTML = this.renderFriendsTab();
                break;
            case 'groups':
                content.innerHTML = this.renderGroupsTab();
                break;
            case 'leaderboard':
                content.innerHTML = this.renderLeaderboardTab();
                this.setupLeaderboardListeners();
                break;
        }
    }

    refreshCurrentTab() {
        this.switchTab(this.currentTab);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab buttons
        document.querySelectorAll('.social-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    setupLeaderboardListeners() {
        // Type buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const type = e.target.dataset.type;
                const content = document.getElementById('leaderboard-content');
                const metricSelector = document.getElementById('metric-selector');

                if (type === 'metric') {
                    metricSelector?.classList.remove('hidden');
                } else {
                    metricSelector?.classList.add('hidden');

                    if (type === 'global') {
                        content.innerHTML = this.renderGlobalLeaderboard();
                    } else if (type === 'friends') {
                        content.innerHTML = this.renderFriendsLeaderboard();
                    }
                }
            });
        });

        // Metric selector
        const metricSelect = document.getElementById('leaderboard-metric');
        if (metricSelect) {
            metricSelect.addEventListener('change', (e) => {
                const metric = e.target.value;
                const content = document.getElementById('leaderboard-content');
                content.innerHTML = this.renderGlobalLeaderboard(metric);
            });
        }
    }

    /**
     * Helper methods
     */

    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        return `${days}天前`;
    }

    getMetricLabel(metric) {
        const labels = {
            totalScore: '总分数',
            totalWords: '学习单词',
            avgAccuracy: '准确率',
            studyDays: '学习天数'
        };
        return labels[metric] || metric;
    }

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
