/**
 * Application Bootstrap and Routing
 */

import StorageService from './services/StorageService.js';
import CourseList from './components/CourseList.js';
import GameView from './components/GameView.js';
import ResultsView from './components/ResultsView.js';
import audioManager from './utils/audio.js';

class App {
    constructor() {
        this.mainContent = document.getElementById('main-content');
        this.currentView = null;
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing Vocabulary Learning Game...');

        try {
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

            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('应用初始化失败 / App initialization failed', error.message);
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
    showCourseList() {
        this.currentView = new CourseList(
            this.mainContent,
            (course) => this.startCourse(course)
        );
        this.currentView.render();

        // Update navigation
        this.updateNavigation('home');
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
    showResults(record) {
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
     * Update navigation active state
     * @param {string|null} activeLink
     */
    updateNavigation(activeLink) {
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeLink}`) {
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
            } else if (href === '#settings') {
                e.preventDefault();
                app.showSettings();
            }
        });
    });

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
