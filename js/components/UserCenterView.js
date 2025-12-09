/**
 * User Center View Component
 * 用户中心界面组件
 */

import authService from '../services/AuthService.js';
import userDataService from '../services/UserDataService.js';

class UserCenterView {
    constructor(container) {
        this.container = container;
        this.userStats = null;
        this.progressList = [];
        this.mistakes = [];
    }

    /**
     * Initialize and render user center
     */
    async init() {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            this.renderGuestMode();
            return;
        }

        try {
            // Show loading
            this.showLoading();

            // Fetch user data
            const [stats, profile] = await Promise.all([
                userDataService.getUserStats(),
                authService.getUserProfile(currentUser.id)
            ]);

            this.userStats = stats;
            this.userProfile = profile.profile;

            // Render user center
            this.render();

        } catch (error) {
            console.error('Failed to load user center:', error);
            this.renderError(error.message);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>加载中... Loading...</p>
            </div>
        `;
    }

    /**
     * Render user center
     */
    render() {
        const html = `
            <div class="user-center-container fade-in">
                <h2 class="page-title">
                    👤 用户中心 User Center
                </h2>

                <!-- User Profile Card -->
                ${this.renderProfileCard()}

                <!-- Statistics Overview -->
                ${this.renderStatsOverview()}

                <!-- Course Progress -->
                ${this.renderCourseProgress()}

                <!-- Quick Actions -->
                ${this.renderQuickActions()}
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Render profile card
     */
    renderProfileCard() {
        const profile = this.userProfile || {};
        const user = authService.getCurrentUser();

        return `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${profile.avatar_url
                            ? `<img src="${profile.avatar_url}" alt="Avatar">`
                            : '<div class="avatar-placeholder">👤</div>'
                        }
                    </div>
                    <div class="profile-info">
                        <h3 class="profile-name">${profile.username || user.email}</h3>
                        <p class="profile-email">${user.email}</p>
                    </div>
                </div>

                <div class="profile-stats">
                    <div class="stat-item">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-content">
                            <div class="stat-value">Level ${profile.level || 1}</div>
                            <div class="stat-label">等级 Level</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-content">
                            <div class="stat-value">${profile.points || 0}</div>
                            <div class="stat-label">积分 Points</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-content">
                            <div class="stat-value">${profile.streak_days || 0} 天</div>
                            <div class="stat-label">连续学习 Streak</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render statistics overview
     */
    renderStatsOverview() {
        const stats = this.userStats || {};

        return `
            <div class="stats-overview">
                <h3 class="section-title">📊 学习统计 Statistics</h3>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-icon">📚</div>
                        <div class="stat-card-value">${stats.totalCourses || 0}</div>
                        <div class="stat-card-label">完成课程</div>
                        <div class="stat-card-sublabel">Completed Courses</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-icon">📝</div>
                        <div class="stat-card-value">${stats.totalQuestions || 0}</div>
                        <div class="stat-card-label">答题总数</div>
                        <div class="stat-card-sublabel">Total Questions</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-icon">✅</div>
                        <div class="stat-card-value">${stats.averageAccuracy ? stats.averageAccuracy.toFixed(1) : 0}%</div>
                        <div class="stat-card-label">平均正确率</div>
                        <div class="stat-card-sublabel">Average Accuracy</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-icon">📖</div>
                        <div class="stat-card-value">${stats.totalWords || 0}</div>
                        <div class="stat-card-label">学习单词</div>
                        <div class="stat-card-sublabel">Words Learned</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-icon">⏱️</div>
                        <div class="stat-card-value">${this.formatTime(stats.totalTime || 0)}</div>
                        <div class="stat-card-label">学习时长</div>
                        <div class="stat-card-sublabel">Study Time</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-icon">❌</div>
                        <div class="stat-card-value">${stats.totalMistakes || 0}</div>
                        <div class="stat-card-label">错题数量</div>
                        <div class="stat-card-sublabel">Mistakes</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render course progress
     */
    renderCourseProgress() {
        return `
            <div class="course-progress-section">
                <h3 class="section-title">📈 课程进度 Progress</h3>

                <div id="progress-list" class="progress-list">
                    <div class="loading-placeholder">
                        <div class="spinner-small"></div>
                        <p>加载进度数据... Loading progress data...</p>
                    </div>
                </div>

                <button id="load-progress-btn" class="btn btn-secondary" style="margin-top: var(--spacing-md);">
                    查看全部进度 View All Progress
                </button>
            </div>
        `;
    }

    /**
     * Render quick actions
     */
    renderQuickActions() {
        return `
            <div class="quick-actions">
                <h3 class="section-title">⚡ 快捷操作 Quick Actions</h3>

                <div class="action-buttons">
                    <button id="view-mistakes-btn" class="action-btn">
                        <span class="action-btn-icon">📋</span>
                        <div class="action-btn-content">
                            <div class="action-btn-title">查看错题集</div>
                            <div class="action-btn-desc">Review Mistakes</div>
                        </div>
                    </button>

                    <button id="view-review-btn" class="action-btn">
                        <span class="action-btn-icon">🔄</span>
                        <div class="action-btn-content">
                            <div class="action-btn-title">复习单词</div>
                            <div class="action-btn-desc">Review Words</div>
                        </div>
                    </button>

                    <button id="edit-profile-btn" class="action-btn">
                        <span class="action-btn-icon">✏️</span>
                        <div class="action-btn-content">
                            <div class="action-btn-title">编辑资料</div>
                            <div class="action-btn-desc">Edit Profile</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render guest mode message
     */
    renderGuestMode() {
        this.container.innerHTML = `
            <div class="user-center-container fade-in">
                <div class="empty-state">
                    <div class="empty-state-icon">🎮</div>
                    <p class="empty-state-text">您正在使用游客模式</p>
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                        You are in guest mode
                    </p>
                    <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--spacing-xl); max-width: 500px;">
                        游客模式下，您的学习数据保存在本地浏览器中。注册账号可以享受云端同步、错题集、学习统计等更多功能。
                    </p>
                    <button id="go-register-btn" class="btn btn-primary">
                        注册账号 Register
                    </button>
                </div>
            </div>
        `;

        const registerBtn = this.container.querySelector('#go-register-btn');
        registerBtn.addEventListener('click', () => {
            // Clear guest mode and show auth
            localStorage.removeItem('guest_mode');
            window.location.reload();
        });
    }

    /**
     * Render error state
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="user-center-container fade-in">
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p class="empty-state-text">加载失败</p>
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                        ${message}
                    </p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        重新加载 Reload
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Load progress button
        const loadProgressBtn = this.container.querySelector('#load-progress-btn');
        if (loadProgressBtn) {
            loadProgressBtn.addEventListener('click', () => this.loadProgress());
        }

        // View mistakes button
        const viewMistakesBtn = this.container.querySelector('#view-mistakes-btn');
        if (viewMistakesBtn) {
            viewMistakesBtn.addEventListener('click', () => this.viewMistakes());
        }

        // Review words button
        const reviewBtn = this.container.querySelector('#view-review-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => this.reviewWords());
        }

        // Edit profile button
        const editProfileBtn = this.container.querySelector('#edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.editProfile());
        }
    }

    /**
     * Load course progress
     */
    async loadProgress() {
        const progressList = this.container.querySelector('#progress-list');
        progressList.innerHTML = `
            <div class="loading-placeholder">
                <div class="spinner-small"></div>
                <p>加载中... Loading...</p>
            </div>
        `;

        try {
            const { progress, error } = await userDataService.getUserProgress();

            if (error) {
                throw new Error(error.message);
            }

            if (!progress || progress.length === 0) {
                progressList.innerHTML = `
                    <div class="empty-message">
                        <p>还没有课程进度记录</p>
                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                            No course progress yet
                        </p>
                    </div>
                `;
                return;
            }

            progressList.innerHTML = progress.map(p => `
                <div class="progress-item">
                    <div class="progress-item-header">
                        <span class="progress-item-title">${p.course_id}</span>
                        <span class="progress-item-status ${p.status}">${p.status}</span>
                    </div>
                    <div class="progress-item-stats">
                        <span>准确率: ${p.accuracy ? p.accuracy.toFixed(1) : 0}%</span>
                        <span>单词: ${p.words_learned || 0}</span>
                        <span>时长: ${this.formatTime(p.time_spent || 0)}</span>
                    </div>
                    <div class="progress-item-date">
                        ${new Date(p.completed_at || p.updated_at).toLocaleDateString('zh-CN')}
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load progress:', error);
            progressList.innerHTML = `
                <div class="empty-message" style="color: var(--error-color);">
                    <p>加载失败: ${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * View mistakes
     */
    async viewMistakes() {
        try {
            const { data: mistakes, error } = await userDataService.getMistakes();

            if (error) {
                alert('获取错题失败: ' + error.message);
                return;
            }

            if (!mistakes || mistakes.length === 0) {
                alert('太棒了！您还没有错题记录。\n\nGreat! You have no mistakes yet.');
                return;
            }

            // 显示错题列表在模态框中
            this.showMistakesModal(mistakes);
        } catch (error) {
            console.error('View mistakes error:', error);
            alert('加载错题失败');
        }
    }

    /**
     * Show mistakes modal
     */
    showMistakesModal(mistakes) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.zIndex = '10000';

        // 按课程分组
        const groupedByWord = {};
        mistakes.forEach(m => {
            if (!groupedByWord[m.word_id]) {
                groupedByWord[m.word_id] = [];
            }
            groupedByWord[m.word_id].push(m);
        });

        const mistakesList = Object.entries(groupedByWord).map(([wordId, records]) => {
            const latestRecord = records[0];
            return `
                <div style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-lg); margin-bottom: var(--spacing-md);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-sm);">
                        <div>
                            <strong style="color: var(--error-color); font-size: var(--font-size-lg);">${wordId}</strong>
                            <span style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-left: var(--spacing-sm);">
                                错误 ${records.length} 次
                            </span>
                        </div>
                        <span style="color: var(--text-tertiary); font-size: var(--font-size-xs);">
                            ${new Date(latestRecord.created_at).toLocaleDateString('zh-CN')}
                        </span>
                    </div>
                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                        <strong>题型:</strong> ${latestRecord.question_type}
                    </div>
                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                        <strong>你的答案:</strong> <span style="color: var(--error-color);">${latestRecord.user_answer || '未作答'}</span>
                    </div>
                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                        <strong>正确答案:</strong> <span style="color: var(--success-color);">${latestRecord.correct_answer}</span>
                    </div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: var(--primary-color); margin-bottom: var(--spacing-lg);">
                    📋 错题本 Mistake Review
                </h2>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl);">
                    共 ${Object.keys(groupedByWord).length} 个单词，总计 ${mistakes.length} 次错误
                </p>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${mistakesList}
                </div>
                <div style="margin-top: var(--spacing-xl); display: flex; gap: var(--spacing-md);">
                    <button class="btn btn-primary" id="practice-mistakes-btn">
                        🔄 练习这些单词
                    </button>
                    <button class="btn btn-secondary" id="close-mistakes-btn">
                        关闭
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close button
        document.getElementById('close-mistakes-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Practice button
        document.getElementById('practice-mistakes-btn').addEventListener('click', () => {
            alert('练习功能即将推出！\n\nPractice feature coming soon!');
            modal.remove();
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Review words
     */
    async reviewWords() {
        try {
            const { data: dueWords, error } = await userDataService.getDueWords();

            if (error) {
                alert('获取复习单词失败: ' + error.message);
                return;
            }

            if (!dueWords || dueWords.length === 0) {
                alert('太棒了！目前没有需要复习的单词。\n\nGreat! No words due for review right now.');
                return;
            }

            // 显示复习单词列表
            this.showReviewModal(dueWords);
        } catch (error) {
            console.error('Review words error:', error);
            alert('加载复习单词失败');
        }
    }

    /**
     * Show review modal
     */
    showReviewModal(dueWords) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.zIndex = '10000';

        // 按掌握等级分组
        const levels = {
            0: { name: '新学', color: '#FF6B7A', words: [] },
            1: { name: '初识', color: '#FFB800', words: [] },
            2: { name: '熟悉', color: '#00D68F', words: [] },
            3: { name: '掌握', color: '#4F46E5', words: [] },
            4: { name: '精通', color: '#667EEA', words: [] }
        };

        dueWords.forEach(word => {
            const level = Math.min(word.mastery_level || 0, 4);
            levels[level].words.push(word);
        });

        const wordsList = Object.entries(levels)
            .filter(([_, data]) => data.words.length > 0)
            .map(([level, data]) => {
                return `
                    <div style="margin-bottom: var(--spacing-lg);">
                        <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${data.color};"></div>
                            <strong style="color: var(--text-primary);">${data.name}</strong>
                            <span style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                                (${data.words.length} 个单词)
                            </span>
                        </div>
                        ${data.words.map(word => `
                            <div style="background: var(--bg-secondary); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-sm); display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="color: var(--text-primary);">${word.word_id}</strong>
                                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: var(--spacing-xs);">
                                        正确 ${word.correct_count || 0} 次 · 错误 ${word.incorrect_count || 0} 次
                                    </div>
                                </div>
                                <div style="text-align: right; font-size: var(--font-size-xs); color: var(--text-tertiary);">
                                    ${new Date(word.next_review).toLocaleString('zh-CN', {
                                        month: 'numeric',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }).join('');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: var(--primary-color); margin-bottom: var(--spacing-lg);">
                    🔄 智能复习 Smart Review
                </h2>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">
                    基于<strong>艾宾浩斯遗忘曲线</strong>，为您推荐 <strong>${dueWords.length}</strong> 个需要复习的单词
                </p>
                <div style="background: var(--primary-light); padding: var(--spacing-md); border-radius: var(--radius-lg); margin-bottom: var(--spacing-xl); font-size: var(--font-size-sm);">
                    <strong>复习间隔:</strong> 1分钟 → 10分钟 → 1小时 → 12小时 → 1天 → 7天
                </div>
                <div style="max-height: 350px; overflow-y: auto;">
                    ${wordsList}
                </div>
                <div style="margin-top: var(--spacing-xl); display: flex; gap: var(--spacing-md);">
                    <button class="btn btn-primary" id="start-review-btn">
                        🚀 开始复习
                    </button>
                    <button class="btn btn-secondary" id="close-review-btn">
                        关闭
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close button
        document.getElementById('close-review-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Start review button
        document.getElementById('start-review-btn').addEventListener('click', () => {
            alert(`即将开始复习 ${dueWords.length} 个单词！\n\nReview session starting soon!`);
            modal.remove();
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Edit profile
     */
    editProfile() {
        const newUsername = prompt('请输入新用户名（3-20个字符）：\nEnter new username (3-20 characters):');

        if (!newUsername) return;

        if (newUsername.length < 3 || newUsername.length > 20) {
            alert('用户名必须在3-20个字符之间\nUsername must be 3-20 characters');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
            alert('用户名只能包含字母、数字和下划线\nUsername can only contain letters, numbers, and underscores');
            return;
        }

        this.updateUsername(newUsername);
    }

    /**
     * Update username
     */
    async updateUsername(newUsername) {
        try {
            const { error } = await authService.updateUsername(newUsername);

            if (error) {
                throw new Error(error.message);
            }

            alert('用户名更新成功！\nUsername updated successfully!');
            // Reload to show new username
            this.init();

        } catch (error) {
            console.error('Failed to update username:', error);
            alert('更新失败: ' + error.message);
        }
    }

    /**
     * Format time in seconds to readable format
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}秒`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}分钟`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}小时${minutes}分钟`;
        }
    }
}

export default UserCenterView;
