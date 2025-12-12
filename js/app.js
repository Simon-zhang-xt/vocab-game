/**
 * Application Bootstrap and Routing
 */

import StorageService from './services/StorageService.js';
import CourseList from './components/CourseList.js';
import GameView from './components/GameView.js';
import ResultsView from './components/ResultsView.js';
import AuthView from './components/AuthView.js';
import UserCenterView from './components/UserCenterView.js';
import authService from './services/AuthService.js';
import audioManager from './utils/audio.js';
import dailyGoalService from './services/DailyGoalService.js';
import { goalSettingModal } from './components/GoalSettingModal.js';
import ImageMemoryView from './components/ImageMemoryView.js';
import ImageMemoryGame from './components/ImageMemoryGame.js';
import RootExplorerView from './components/RootExplorerView.js';
import RootPuzzleGame from './components/RootPuzzleGame.js';
import PronunciationView from './components/PronunciationView.js';

class App {
    constructor() {
        this.mainContent = document.getElementById('main-content');
        this.currentView = null;
        this.currentUser = null;
        this.isGuestMode = false;
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing Vocabulary Learning Game...');

        try {
            // Check authentication status
            this.currentUser = authService.getCurrentUser();
            this.isGuestMode = localStorage.getItem('guest_mode') === 'true';

            console.log('Auth status:', {
                user: this.currentUser?.email,
                guestMode: this.isGuestMode
            });

            // If no user and not guest mode, show authentication page
            if (!this.currentUser && !this.isGuestMode) {
                this.showAuth();
                return;
            }

            // User is authenticated or in guest mode, continue normal init
            // Show loading
            this.showLoading();

            // Check and show privacy modal on first use
            this.checkPrivacyConsent();

            // Initialize storage and load seed data
            await StorageService.init();

            // Preload audio
            await audioManager.preloadSounds();

            // Show course list
            this.showCourseList();

            // Update navbar with user info
            this.updateNavbar();

            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('应用初始化失败 / App initialization failed', error.message);
        }
    }

    /**
     * Show authentication page
     */
    showAuth() {
        console.log('Showing authentication page');
        const authView = new AuthView(
            this.mainContent,
            (user) => this.handleAuthSuccess(user)
        );
        authView.render();
    }

    /**
     * Handle successful authentication
     */
    async handleAuthSuccess(user) {
        console.log('Authentication successful');

        if (user) {
            // User logged in
            this.currentUser = user;
            this.isGuestMode = false;
            localStorage.removeItem('guest_mode');
            console.log('User logged in:', user.email);
        } else {
            // Guest mode
            this.currentUser = null;
            this.isGuestMode = true;
            localStorage.setItem('guest_mode', 'true');
            console.log('Guest mode activated');
        }

        // Re-initialize the app with auth state
        await this.init();
    }

    /**
     * Update navbar with user info and logout button
     */
    updateNavbar() {
        const navMenu = document.querySelector('.nav-menu');

        // Remove old user menu if exists
        const oldUserMenu = document.querySelector('.user-menu');
        if (oldUserMenu) {
            oldUserMenu.remove();
        }

        // Add user menu
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.style.cssText = 'display: flex; align-items: center; gap: var(--spacing-md);';

        if (this.currentUser) {
            // Show user email and logout
            userMenu.innerHTML = `
                <span style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                    ${this.currentUser.email}
                </span>
                <button id="logout-btn" class="btn btn-secondary" style="padding: var(--spacing-sm) var(--spacing-md); font-size: var(--font-size-sm);">
                    登出 Logout
                </button>
            `;
        } else if (this.isGuestMode) {
            // Show guest mode and login option
            userMenu.innerHTML = `
                <span style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                    🎮 游客模式
                </span>
                <button id="login-btn" class="btn btn-secondary" style="padding: var(--spacing-sm) var(--spacing-md); font-size: var(--font-size-sm);">
                    登录 Login
                </button>
            `;
        }

        navMenu.appendChild(userMenu);

        // Attach event listeners
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                localStorage.removeItem('guest_mode');
                this.isGuestMode = false;
                this.showAuth();
            });
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        if (confirm('确定要登出吗？\n\nAre you sure you want to logout?')) {
            await authService.signOut();
            this.currentUser = null;
            this.isGuestMode = false;
            localStorage.removeItem('guest_mode');

            // Clear the page and show auth
            this.showAuth();
        }
    }

    /**
     * Check privacy consent
     */
    checkPrivacyConsent() {
        const consent = localStorage.getItem('privacy_consent');
        if (!consent) {
            const modal = document.getElementById('privacy-modal');
            if (modal) {
                modal.classList.remove('hidden');

                const acceptBtn = document.getElementById('accept-privacy');
                acceptBtn.addEventListener('click', () => {
                    localStorage.setItem('privacy_consent', 'true');
                    modal.classList.add('hidden');
                });
            }
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.mainContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>加载中... Loading...</p>
            </div>
        `;
    }

    /**
     * Show course list
     */
    async showCourseList() {
        // Render daily goal widget
        await this.renderDailyGoalWidget();

        this.currentView = new CourseList(
            this.mainContent,
            (course) => this.startCourse(course)
        );
        this.currentView.render();

        // Update navigation
        this.updateNavigation('home');
    }

    /**
     * Render daily goal widget
     */
    async renderDailyGoalWidget() {
        try {
            const summary = await dailyGoalService.getLearningSummary();

            // Create or update widget
            let widget = document.querySelector('.daily-goal-widget');
            if (!widget) {
                widget = document.createElement('div');
                widget.className = 'daily-goal-widget';
                this.mainContent.insertBefore(widget, this.mainContent.firstChild);
            }

            const progressPercentage = (summary.progress * 100).toFixed(0);
            const circumference = 2 * Math.PI * 45;
            const strokeDashoffset = circumference - (summary.progress * circumference);

            widget.innerHTML = `
                <div class="goal-content">
                    <div class="goal-header">
                        <h3>📅 今日学习目标</h3>
                        <div class="goal-header-actions">
                            ${summary.streakDays > 0 ? `
                                <div class="streak-badge">
                                    🔥 ${summary.streakDays} 天
                                </div>
                            ` : ''}
                            <button class="goal-settings-btn" onclick="window.showGoalSettingModal()">
                                ⚙️
                            </button>
                        </div>
                    </div>
                    <div class="goal-body">
                        <div class="goal-progress-ring">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8"/>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="white" stroke-width="8"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${strokeDashoffset}"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"
                                    style="transition: stroke-dashoffset 0.6s ease;"/>
                            </svg>
                            <div class="progress-text">
                                <span class="progress-number">${summary.todayProgress.wordsLearned}</span>
                                <span class="progress-divider">/</span>
                                <span class="progress-total">${summary.dailyGoal}</span>
                            </div>
                        </div>
                        <div class="goal-info">
                            ${summary.isGoalCompleted ? `
                                <p class="goal-message completed">✅ 今日目标已完成！太棒了！</p>
                                <p class="goal-submessage">Goal completed! Great job!</p>
                            ` : `
                                <p class="goal-message">还需学习 ${summary.remainingWords} 个单词</p>
                                <p class="goal-submessage">${summary.remainingWords} more words to go!</p>
                            `}
                            ${summary.todayProgress.coursesCompleted > 0 ? `
                                <div class="goal-stats">
                                    <span>📚 完成 ${summary.todayProgress.coursesCompleted} 个课程</span>
                                    <span>⏱️ 学习 ${Math.floor(summary.todayProgress.timeSpent / 60)} 分钟</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Expose to window for celebration
            window.dailyGoalWidget = widget;
        } catch (error) {
            console.error('Failed to render daily goal widget:', error);
        }
    }

    /**
     * Start course
     * @param {Course} course
     */
    async startCourse(course) {
        this.showLoading();

        try {
            this.currentView = new GameView(
                this.mainContent,
                course.id,
                (record) => this.showResults(record)
            );
            await this.currentView.init();

            // Update navigation
            this.updateNavigation(null);
        } catch (error) {
            console.error('Failed to start course:', error);
            this.showError('课程加载失败 / Failed to load course', error.message);
        }
    }

    /**
     * Show results
     * @param {LearningRecord} record
     */
    async showResults(record) {
        // Update today's progress
        await this.updateTodayProgress(record);

        this.currentView = new ResultsView(
            this.mainContent,
            record,
            () => this.showCourseList()
        );
        this.currentView.render();

        // Update navigation
        this.updateNavigation(null);
    }

    /**
     * Update today's progress after completing a course
     */
    async updateTodayProgress(record) {
        try {
            const wordsLearned = record.totalQuestions || 0;
            const coursesCompleted = 1;
            const timeSpent = record.timeSpent || 0;
            const accuracy = record.accuracy || 0;

            await dailyGoalService.updateTodayProgress(
                wordsLearned,
                coursesCompleted,
                timeSpent,
                accuracy
            );

            // Refresh daily goal widget
            await this.renderDailyGoalWidget();
        } catch (error) {
            console.error('Failed to update today progress:', error);
        }
    }

    /**
     * Show user center
     */
    async showUserCenter() {
        this.currentView = new UserCenterView(this.mainContent);
        await this.currentView.init();

        // Update navigation
        this.updateNavigation('profile');
    }

    /**
     * Show image memory learning (V3.2)
     */
    async showImageMemory() {
        this.currentView = new ImageMemoryView();
        const html = await this.currentView.render();
        this.mainContent.innerHTML = html;

        // Expose to window for onclick handlers
        window.imageMemoryView = this.currentView;

        // Setup event listeners
        this.currentView.setupEventListeners();

        // Update navigation
        this.updateNavigation('image-memory');
    }

    /**
     * Show image memory game (V3.2)
     */
    async showImageMemoryGame() {
        this.currentView = new ImageMemoryGame();
        const html = this.currentView.render();
        this.mainContent.innerHTML = html;

        // Expose to window for onclick handlers
        window.imageMemoryGame = this.currentView;

        // Update navigation
        this.updateNavigation('image-game');
    }

    /**
     * Show etymology/root explorer (V3.3)
     */
    async showEtymology() {
        this.currentView = new RootExplorerView();
        const html = await this.currentView.render();
        this.mainContent.innerHTML = html;

        // Expose to window for onclick handlers
        window.rootExplorerView = this.currentView;

        // Setup event listeners
        this.currentView.setupEventListeners();

        // Update navigation
        this.updateNavigation('etymology');
    }

    /**
     * Show root puzzle game (V3.3)
     */
    async showRootGame() {
        this.currentView = new RootPuzzleGame();
        const html = this.currentView.render();
        this.mainContent.innerHTML = html;

        // Expose to window for onclick handlers
        window.rootPuzzleGame = this.currentView;

        // Update navigation
        this.updateNavigation('root-game');
    }

    /**
     * Show pronunciation training (V3.4)
     */
    async showPronunciation() {
        this.currentView = new PronunciationView();
        const html = await this.currentView.render();
        this.mainContent.innerHTML = html;

        // Expose to window for onclick handlers
        window.pronunciationView = this.currentView;

        // Setup event listeners
        this.currentView.setupEventListeners();

        // Update navigation
        this.updateNavigation('pronunciation');
    }

    /**
     * Update navigation active state
     * @param {string|null} activeLink
     */
    updateNavigation(activeLink) {
        // Update desktop navigation
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeLink}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update mobile navigation
        const mobileLinks = document.querySelectorAll('.mobile-nav-item');
        mobileLinks.forEach(link => {
            const navType = link.getAttribute('data-nav');
            if (navType === activeLink) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Show error state
     * @param {string} title
     * @param {string} message
     */
    showError(title, message) {
        this.mainContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">${title}</p>
                <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
                    ${message}
                </p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: var(--spacing-lg);">
                    重新加载 Reload
                </button>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();

    // Setup navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (href === '#home') {
                e.preventDefault();
                app.showCourseList();
            } else if (href === '#profile') {
                e.preventDefault();
                app.showUserCenter();
            } else if (href === '#settings') {
                e.preventDefault();
                app.showSettings();
            }
        });
    });

    // Setup hash-based routing for V3.2-V3.4 features
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;

        if (hash === '#image-memory') {
            app.showImageMemory();
        } else if (hash === '#image-game') {
            app.showImageMemoryGame();
        } else if (hash === '#etymology') {
            app.showEtymology();
        } else if (hash === '#root-game') {
            app.showRootGame();
        } else if (hash === '#pronunciation') {
            app.showPronunciation();
        }
    });

    // Check initial hash on load
    const initialHash = window.location.hash;
    if (initialHash === '#image-memory') {
        app.showImageMemory();
    } else if (initialHash === '#image-game') {
        app.showImageMemoryGame();
    } else if (initialHash === '#etymology') {
        app.showEtymology();
    } else if (initialHash === '#root-game') {
        app.showRootGame();
    } else if (initialHash === '#pronunciation') {
        app.showPronunciation();
    }

    // Add settings page method to app
    app.showSettings = function() {
        const storageInfo = StorageService.getStorageInfo();

        this.mainContent.innerHTML = `
            <div class="course-container fade-in">
                <h2 style="font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: var(--spacing-xl);">
                    ⚙️ 设置 Settings
                </h2>

                <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg);">
                    <h3 style="font-size: var(--font-size-xl); font-weight: 600; margin-bottom: var(--spacing-lg);">
                        📊 存储使用情况 Storage Usage
                    </h3>
                    <div style="margin-bottom: var(--spacing-md);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm); font-size: var(--font-size-sm); color: var(--text-secondary);">
                            <span>已使用 Used</span>
                            <span>${(storageInfo.used / 1024).toFixed(2)} KB / ${(storageInfo.total / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar-fill" style="width: ${storageInfo.percentage}%; background-color: ${storageInfo.percentage > 80 ? 'var(--error-color)' : 'var(--primary-color)'};"></div>
                        </div>
                    </div>
                    ${storageInfo.percentage > 80 ? `
                        <div style="background: #FEE2E2; color: #991B1B; padding: var(--spacing-md); border-radius: var(--radius-md); font-size: var(--font-size-sm);">
                            ⚠️ 存储空间即将不足，建议删除旧的学习记录
                        </div>
                    ` : ''}
                </div>

                <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--spacing-xl);">
                    <h3 style="font-size: var(--font-size-xl); font-weight: 600; margin-bottom: var(--spacing-lg);">
                        🗑️ 数据管理 Data Management
                    </h3>
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg); font-size: var(--font-size-sm);">
                        根据隐私政策，您可以随时删除所有学习数据。删除后无法恢复。
                    </p>
                    <button class="btn btn-secondary" id="delete-data-btn" style="color: var(--error-color); border-color: var(--error-color);">
                        删除所有学习记录 Delete All Learning Data
                    </button>
                </div>
            </div>
        `;

        // Attach delete button listener
        const deleteBtn = this.mainContent.querySelector('#delete-data-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm('确定要删除所有学习记录吗？此操作不可恢复。\n\nAre you sure you want to delete all learning data? This cannot be undone.')) {
                // Delete user data only, keep courses and words
                StorageService.clear(StorageService.KEYS.LEARNING_RECORDS);
                StorageService.clear(StorageService.KEYS.WORD_MASTERY);
                alert('学习记录已删除 / Learning data deleted');
                location.reload();
            }
        });

        this.updateNavigation('settings');
    };
});

// Listen for storage errors
window.addEventListener('vocab-storage-error', (event) => {
    console.error('Storage error:', event.detail);
    if (event.detail.error === 'QuotaExceededError') {
        alert('存储空间不足！请在设置中删除旧的学习记录。\n\nStorage quota exceeded! Please delete old learning records in settings.');
    }
});

export default App;

// Goal completion celebration
window.showGoalCompletionCelebration = function() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration-modal';
    celebration.innerHTML = `
        <div class="celebration-content">
            <div class="celebration-icon">🎉</div>
            <h2>恭喜完成今日目标！</h2>
            <p>Congratulations on completing today's goal!</p>
            <div class="celebration-reward">
                <span class="reward-icon">⭐</span>
                <span class="reward-text">+10 积分</span>
            </div>
        </div>
    `;
    document.body.appendChild(celebration);

    // Auto remove after 3 seconds
    setTimeout(() => {
        celebration.classList.add('fade-out');
        setTimeout(() => celebration.remove(), 500);
    }, 3000);
};

// Streak milestone celebration
window.showStreakMilestone = function(days) {
    const milestoneNames = {
        7: '坚持者',
        30: '学习达人',
        100: '学霸',
        365: '年度学者'
    };

    const milestone = document.createElement('div');
    milestone.className = 'celebration-modal milestone';
    milestone.innerHTML = `
        <div class="celebration-content">
            <div class="celebration-icon">🏆</div>
            <h2>连续学习 ${days} 天！</h2>
            <p>获得「${milestoneNames[days] || '学习者'}」成就</p>
            <div class="celebration-reward">
                <span class="reward-icon">🎖️</span>
                <span class="reward-text">特殊成就解锁</span>
            </div>
        </div>
    `;
    document.body.appendChild(milestone);

    setTimeout(() => {
        milestone.classList.add('fade-out');
        setTimeout(() => milestone.remove(), 500);
    }, 3000);
};

// Show goal setting modal (V2.2)
window.showGoalSettingModal = function() {
    goalSettingModal.show();
};
