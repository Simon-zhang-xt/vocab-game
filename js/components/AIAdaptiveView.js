/**
 * AI Adaptive Learning View
 * V4.0 Phase 1: Intelligent learning dashboard
 */

import AIAdaptiveService from '../services/AIAdaptiveService.js';

export default class AIAdaptiveView {
    constructor() {
        this.aiService = new AIAdaptiveService();
        this.currentTab = 'dashboard';
        this.learningPath = null;
    }

    /**
     * Render main view
     */
    async render() {
        // Generate learning path
        this.learningPath = await this.aiService.generateLearningPath('current_user');

        return `
            <div class="ai-adaptive-container">
                <div class="ai-header">
                    <div class="ai-title">
                        <h1>🤖 AI 学习助手</h1>
                        <p class="ai-subtitle">基于您的学习数据，为您量身定制学习计划</p>
                    </div>
                    <div class="ai-stats-summary">
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-value">${this.learningPath.profile.totalWords}</div>
                            <div class="stat-label">学习单词</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">✅</div>
                            <div class="stat-value">${this.learningPath.profile.masteryRate}%</div>
                            <div class="stat-label">掌握率</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-value">${this.learningPath.profile.averageAccuracy}%</div>
                            <div class="stat-label">准确率</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⚡</div>
                            <div class="stat-value">${this.learningPath.profile.learningVelocity}</div>
                            <div class="stat-label">学习速度</div>
                        </div>
                    </div>
                </div>

                <div class="ai-tabs">
                    <button class="ai-tab ${this.currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
                        📊 学习仪表盘
                    </button>
                    <button class="ai-tab ${this.currentTab === 'recommendations' ? 'active' : ''}" data-tab="recommendations">
                        💡 智能推荐
                    </button>
                    <button class="ai-tab ${this.currentTab === 'schedule' ? 'active' : ''}" data-tab="schedule">
                        📅 复习计划
                    </button>
                    <button class="ai-tab ${this.currentTab === 'analysis' ? 'active' : ''}" data-tab="analysis">
                        📈 学习分析
                    </button>
                </div>

                <div class="ai-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    }

    /**
     * Render tab content based on current tab
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'dashboard':
                return this.renderDashboard();
            case 'recommendations':
                return this.renderRecommendations();
            case 'schedule':
                return this.renderSchedule();
            case 'analysis':
                return this.renderAnalysis();
            default:
                return this.renderDashboard();
        }
    }

    /**
     * Render learning dashboard
     */
    renderDashboard() {
        const { profile } = this.learningPath;

        return `
            <div class="dashboard-container">
                <div class="dashboard-row">
                    <div class="dashboard-card learning-style">
                        <h3>🎨 您的学习风格</h3>
                        <div class="learning-style-content">
                            <div class="style-badge ${profile.learningStyle.primary}">
                                ${this.getLearningStyleIcon(profile.learningStyle.primary)}
                                ${this.getLearningStyleName(profile.learningStyle.primary)}
                            </div>
                            <p class="style-description">
                                ${this.getLearningStyleDescription(profile.learningStyle.primary)}
                            </p>
                            <div class="style-recommendations">
                                <h4>💡 推荐学习方式：</h4>
                                <ul>
                                    ${profile.learningStyle.recommendations.map(rec =>
                                        `<li>${rec}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-card difficulty-level">
                        <h3>🎯 难度偏好</h3>
                        <div class="difficulty-content">
                            <div class="difficulty-indicator">
                                <div class="difficulty-bar">
                                    <div class="difficulty-fill" style="width: ${profile.preferredDifficulty * 20}%"></div>
                                </div>
                                <div class="difficulty-labels">
                                    <span>简单</span>
                                    <span>中等</span>
                                    <span>困难</span>
                                </div>
                            </div>
                            <p class="difficulty-text">
                                当前难度级别: <strong>${this.getDifficultyLabel(profile.preferredDifficulty)}</strong>
                            </p>
                            <button class="btn-adjust-difficulty" onclick="window.aiAdaptiveView.adjustDifficulty()">
                                ⚙️ 调整难度
                            </button>
                        </div>
                    </div>
                </div>

                <div class="dashboard-row">
                    <div class="dashboard-card strengths">
                        <h3>💪 您的强项</h3>
                        <div class="strengths-list">
                            ${profile.strengths.map(strength => `
                                <div class="strength-item">
                                    <div class="strength-icon">✨</div>
                                    <div class="strength-details">
                                        <div class="strength-name">${strength.area}</div>
                                        <div class="strength-bar">
                                            <div class="strength-fill" style="width: ${strength.score}%"></div>
                                        </div>
                                        <div class="strength-score">${strength.score}%</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="dashboard-card weak-areas">
                        <h3>📝 需要加强</h3>
                        <div class="weak-areas-list">
                            ${profile.weakAreas.map(area => `
                                <div class="weak-area-item">
                                    <div class="weak-icon">⚠️</div>
                                    <div class="weak-details">
                                        <div class="weak-name">${area.area}</div>
                                        <div class="weak-description">${area.description}</div>
                                        <button class="btn-practice-weak" onclick="window.aiAdaptiveView.practiceWeakArea('${area.area}')">
                                            开始练习
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="dashboard-card study-patterns">
                    <h3>⏰ 学习时间分析</h3>
                    <div class="study-patterns-content">
                        <div class="pattern-visualization">
                            <canvas id="study-pattern-chart" width="800" height="300"></canvas>
                        </div>
                        <div class="pattern-insights">
                            <h4>📊 学习习惯洞察：</h4>
                            <ul>
                                <li>最活跃时段: <strong>${profile.studyTimePatterns.peakHours.join(', ')}</strong></li>
                                <li>平均每日学习: <strong>${profile.studyTimePatterns.avgDailyMinutes} 分钟</strong></li>
                                <li>学习连续性: <strong>${profile.studyTimePatterns.consistency}/10</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render AI recommendations
     */
    renderRecommendations() {
        const { recommendations, suggestedCourses, difficultyAdjustment } = this.learningPath;

        return `
            <div class="recommendations-container">
                <div class="recommendations-header">
                    <h2>💡 智能学习建议</h2>
                    <p>基于您的学习数据和 AI 分析</p>
                </div>

                <div class="recommendations-section priority-recommendations">
                    <h3>🎯 优先建议</h3>
                    <div class="recommendations-list">
                        ${recommendations.filter(r => r.priority === 'high').map(rec => `
                            <div class="recommendation-card priority-${rec.priority}">
                                <div class="rec-badge">
                                    ${this.getRecommendationIcon(rec.type)}
                                </div>
                                <div class="rec-content">
                                    <h4>${rec.title}</h4>
                                    <p>${rec.description}</p>
                                    <div class="rec-actions">
                                        ${rec.action ? `
                                            <button class="btn-rec-action" onclick="window.aiAdaptiveView.executeRecommendation('${rec.id}')">
                                                ${rec.action}
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="recommendations-section suggested-courses">
                    <h3>📚 推荐课程</h3>
                    <div class="courses-grid">
                        ${suggestedCourses.map(course => `
                            <div class="course-suggestion-card">
                                <div class="course-match">
                                    <span class="match-score">${course.matchScore}% 匹配</span>
                                </div>
                                <div class="course-info">
                                    <h4>${course.name}</h4>
                                    <p class="course-reason">${course.reason}</p>
                                    <div class="course-meta">
                                        <span class="course-difficulty">难度: ${course.difficulty}</span>
                                        <span class="course-words">${course.wordCount} 词</span>
                                    </div>
                                </div>
                                <button class="btn-start-course" onclick="window.aiAdaptiveView.startCourse('${course.id}')">
                                    开始学习
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="recommendations-section other-recommendations">
                    <h3>📝 其他建议</h3>
                    <div class="recommendations-list">
                        ${recommendations.filter(r => r.priority !== 'high').map(rec => `
                            <div class="recommendation-card priority-${rec.priority}">
                                <div class="rec-badge">
                                    ${this.getRecommendationIcon(rec.type)}
                                </div>
                                <div class="rec-content">
                                    <h4>${rec.title}</h4>
                                    <p>${rec.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="recommendations-section difficulty-suggestion">
                    <h3>⚖️ 难度调整建议</h3>
                    <div class="difficulty-adjustment">
                        <p>${difficultyAdjustment.suggestion}</p>
                        <div class="difficulty-options">
                            <button class="btn-difficulty" onclick="window.aiAdaptiveView.setDifficulty(${difficultyAdjustment.recommended - 1})">
                                降低难度
                            </button>
                            <button class="btn-difficulty active">
                                当前难度 (${difficultyAdjustment.current})
                            </button>
                            <button class="btn-difficulty" onclick="window.aiAdaptiveView.setDifficulty(${difficultyAdjustment.recommended + 1})">
                                提高难度
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render review schedule
     */
    renderSchedule() {
        const { nextReview } = this.learningPath;

        return `
            <div class="schedule-container">
                <div class="schedule-header">
                    <h2>📅 智能复习计划</h2>
                    <p>基于艾宾浩斯遗忘曲线优化</p>
                </div>

                <div class="schedule-today">
                    <h3>📌 今日复习 (${nextReview.today.length})</h3>
                    <div class="review-list">
                        ${nextReview.today.map(word => `
                            <div class="review-word-card">
                                <div class="review-word-info">
                                    <span class="review-word">${word.word}</span>
                                    <span class="review-status status-${word.urgency}">
                                        ${this.getUrgencyLabel(word.urgency)}
                                    </span>
                                </div>
                                <div class="review-word-meta">
                                    <span>掌握度: ${word.masteryLevel}/5</span>
                                    <span>上次复习: ${this.formatTimeAgo(word.lastReviewed)}</span>
                                </div>
                                <button class="btn-review-word" onclick="window.aiAdaptiveView.reviewWord('${word.id}')">
                                    复习
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="schedule-upcoming">
                    <h3>📆 未来7天计划</h3>
                    <div class="upcoming-schedule">
                        ${nextReview.upcoming.map(day => `
                            <div class="schedule-day">
                                <div class="schedule-day-header">
                                    <span class="schedule-date">${day.date}</span>
                                    <span class="schedule-count">${day.words.length} 个单词</span>
                                </div>
                                <div class="schedule-day-preview">
                                    ${day.words.slice(0, 5).map(w => w.word).join(', ')}
                                    ${day.words.length > 5 ? '...' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="schedule-visualization">
                    <h3>📊 复习趋势预测</h3>
                    <canvas id="review-forecast-chart" width="800" height="300"></canvas>
                </div>

                <div class="schedule-settings">
                    <h3>⚙️ 复习设置</h3>
                    <div class="settings-form">
                        <div class="setting-item">
                            <label>每日复习目标</label>
                            <input type="number" id="daily-review-goal" value="20" min="5" max="100">
                        </div>
                        <div class="setting-item">
                            <label>复习提醒</label>
                            <select id="reminder-time">
                                <option value="morning">早上 8:00</option>
                                <option value="afternoon" selected>下午 2:00</option>
                                <option value="evening">晚上 8:00</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>
                        <button class="btn-save-settings" onclick="window.aiAdaptiveView.saveScheduleSettings()">
                            保存设置
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render learning analysis
     */
    renderAnalysis() {
        const { profile } = this.learningPath;

        return `
            <div class="analysis-container">
                <div class="analysis-header">
                    <h2>📈 学习数据分析</h2>
                    <div class="analysis-period-selector">
                        <button class="btn-period active" data-period="week">最近7天</button>
                        <button class="btn-period" data-period="month">最近30天</button>
                        <button class="btn-period" data-period="all">全部时间</button>
                    </div>
                </div>

                <div class="analysis-row">
                    <div class="analysis-card progress-chart">
                        <h3>📊 学习进度趋势</h3>
                        <canvas id="progress-trend-chart" width="600" height="300"></canvas>
                    </div>

                    <div class="analysis-card accuracy-chart">
                        <h3>🎯 准确率变化</h3>
                        <canvas id="accuracy-trend-chart" width="600" height="300"></canvas>
                    </div>
                </div>

                <div class="analysis-row">
                    <div class="analysis-card retention-chart">
                        <h3>🧠 记忆保持曲线</h3>
                        <canvas id="retention-curve-chart" width="600" height="300"></canvas>
                        <p class="chart-description">
                            您的平均保持率: <strong>${profile.retentionRate}%</strong>
                        </p>
                    </div>

                    <div class="analysis-card velocity-chart">
                        <h3>⚡ 学习速度分析</h3>
                        <canvas id="velocity-chart" width="600" height="300"></canvas>
                        <p class="chart-description">
                            平均学习速度: <strong>${profile.learningVelocity} 词/天</strong>
                        </p>
                    </div>
                </div>

                <div class="analysis-card heatmap">
                    <h3>🔥 学习活动热力图</h3>
                    <div class="heatmap-container">
                        <canvas id="activity-heatmap" width="1000" height="200"></canvas>
                    </div>
                </div>

                <div class="analysis-card insights">
                    <h3>💡 AI 洞察</h3>
                    <div class="insights-list">
                        ${this.generateInsights(profile).map(insight => `
                            <div class="insight-item ${insight.type}">
                                <div class="insight-icon">${insight.icon}</div>
                                <div class="insight-content">
                                    <h4>${insight.title}</h4>
                                    <p>${insight.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="analysis-card predictions">
                    <h3>🔮 学习预测</h3>
                    <div class="predictions-content">
                        <div class="prediction-item">
                            <span class="prediction-label">预计掌握1000词时间</span>
                            <span class="prediction-value">${this.calculatePrediction(profile, 1000)}</span>
                        </div>
                        <div class="prediction-item">
                            <span class="prediction-label">预计达到80%准确率</span>
                            <span class="prediction-value">${this.calculateAccuracyPrediction(profile, 80)}</span>
                        </div>
                        <div class="prediction-item">
                            <span class="prediction-label">建议每日学习时间</span>
                            <span class="prediction-value">${profile.studyTimePatterns.recommendedDaily} 分钟</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.ai-tab').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                this.currentTab = e.target.dataset.tab;
                await this.refresh();
            });
        });

        // Period selector for analysis
        document.querySelectorAll('.btn-period').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateAnalysisCharts(e.target.dataset.period);
            });
        });

        // Initialize charts after DOM is ready
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }

    /**
     * Initialize all charts
     */
    initializeCharts() {
        if (this.currentTab === 'dashboard') {
            this.drawStudyPatternChart();
        } else if (this.currentTab === 'schedule') {
            this.drawReviewForecastChart();
        } else if (this.currentTab === 'analysis') {
            this.drawProgressTrendChart();
            this.drawAccuracyTrendChart();
            this.drawRetentionCurveChart();
            this.drawVelocityChart();
            this.drawActivityHeatmap();
        }
    }

    /**
     * Draw study pattern chart
     */
    drawStudyPatternChart() {
        const canvas = document.getElementById('study-pattern-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { studyTimePatterns } = this.learningPath.profile;

        // Simple bar chart for study hours
        const hours = Array(24).fill(0);
        studyTimePatterns.hourlyDistribution.forEach(item => {
            hours[item.hour] = item.minutes;
        });

        const maxMinutes = Math.max(...hours);
        const barWidth = canvas.width / 24;
        const barSpacing = 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bars
        hours.forEach((minutes, hour) => {
            const barHeight = (minutes / maxMinutes) * (canvas.height - 40);
            const x = hour * barWidth + barSpacing;
            const y = canvas.height - barHeight - 20;

            ctx.fillStyle = minutes > 0 ? '#4F46E5' : '#E5E7EB';
            ctx.fillRect(x, y, barWidth - barSpacing * 2, barHeight);

            // Hour labels
            if (hour % 3 === 0) {
                ctx.fillStyle = '#6B7280';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(hour + ':00', x + barWidth / 2, canvas.height - 5);
            }
        });
    }

    /**
     * Draw review forecast chart
     */
    drawReviewForecastChart() {
        const canvas = document.getElementById('review-forecast-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { upcoming } = this.learningPath.nextReview;

        // Line chart for upcoming reviews
        const data = upcoming.map(day => day.words.length);
        const maxWords = Math.max(...data);
        const pointSpacing = canvas.width / (data.length + 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#4F46E5';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((words, index) => {
            const x = (index + 1) * pointSpacing;
            const y = canvas.height - (words / maxWords) * (canvas.height - 40) - 20;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw points
            ctx.fillStyle = '#4F46E5';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.stroke();
    }

    /**
     * Draw progress trend chart
     */
    drawProgressTrendChart() {
        const canvas = document.getElementById('progress-trend-chart');
        if (!canvas) return;
        // Similar implementation to other charts
    }

    /**
     * Draw accuracy trend chart
     */
    drawAccuracyTrendChart() {
        const canvas = document.getElementById('accuracy-trend-chart');
        if (!canvas) return;
        // Implementation for accuracy chart
    }

    /**
     * Draw retention curve chart
     */
    drawRetentionCurveChart() {
        const canvas = document.getElementById('retention-curve-chart');
        if (!canvas) return;
        // Implementation for retention curve
    }

    /**
     * Draw velocity chart
     */
    drawVelocityChart() {
        const canvas = document.getElementById('velocity-chart');
        if (!canvas) return;
        // Implementation for velocity chart
    }

    /**
     * Draw activity heatmap
     */
    drawActivityHeatmap() {
        const canvas = document.getElementById('activity-heatmap');
        if (!canvas) return;
        // Implementation for heatmap
    }

    /**
     * Helper: Get learning style icon
     */
    getLearningStyleIcon(style) {
        const icons = {
            visual: '👁️',
            auditory: '👂',
            kinesthetic: '✋',
            reading: '📖'
        };
        return icons[style] || '🎨';
    }

    /**
     * Helper: Get learning style name
     */
    getLearningStyleName(style) {
        const names = {
            visual: '视觉型学习者',
            auditory: '听觉型学习者',
            kinesthetic: '动觉型学习者',
            reading: '阅读型学习者'
        };
        return names[style] || style;
    }

    /**
     * Helper: Get learning style description
     */
    getLearningStyleDescription(style) {
        const descriptions = {
            visual: '您更擅长通过图像、图表和视觉辅助来学习单词',
            auditory: '您更擅长通过听力和发音练习来学习单词',
            kinesthetic: '您更擅长通过互动游戏和实践来学习单词',
            reading: '您更擅长通过阅读例句和文章来学习单词'
        };
        return descriptions[style] || '';
    }

    /**
     * Helper: Get difficulty label
     */
    getDifficultyLabel(level) {
        if (level <= 2) return '简单';
        if (level <= 3) return '中等';
        if (level <= 4) return '困难';
        return '挑战';
    }

    /**
     * Helper: Get recommendation icon
     */
    getRecommendationIcon(type) {
        const icons = {
            warning: '⚠️',
            success: '✅',
            info: 'ℹ️',
            tip: '💡'
        };
        return icons[type] || '📌';
    }

    /**
     * Helper: Get urgency label
     */
    getUrgencyLabel(urgency) {
        const labels = {
            high: '紧急',
            medium: '建议复习',
            low: '可选'
        };
        return labels[urgency] || urgency;
    }

    /**
     * Helper: Format time ago
     */
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        return `${Math.floor(days / 7)}周前`;
    }

    /**
     * Generate AI insights
     */
    generateInsights(profile) {
        const insights = [];

        if (profile.averageAccuracy > 80) {
            insights.push({
                type: 'success',
                icon: '🎉',
                title: '学习表现优秀',
                description: '您的准确率超过80%，建议尝试更高难度的课程'
            });
        }

        if (profile.retentionRate < 60) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: '记忆保持需要改善',
                description: '建议增加复习频率，使用间隔重复学习法'
            });
        }

        if (profile.studyTimePatterns.consistency > 7) {
            insights.push({
                type: 'success',
                icon: '🔥',
                title: '学习习惯良好',
                description: '您保持了很好的学习连续性，继续保持！'
            });
        }

        return insights;
    }

    /**
     * Calculate prediction for word count
     */
    calculatePrediction(profile, targetWords) {
        const remaining = targetWords - profile.totalWords;
        const daysNeeded = Math.ceil(remaining / profile.learningVelocity);
        return `约 ${daysNeeded} 天`;
    }

    /**
     * Calculate accuracy prediction
     */
    calculateAccuracyPrediction(profile, targetAccuracy) {
        const currentAccuracy = parseFloat(profile.averageAccuracy);
        if (currentAccuracy >= targetAccuracy) return '已达成';

        const improvement = targetAccuracy - currentAccuracy;
        const weeksNeeded = Math.ceil(improvement / 2); // Assume 2% improvement per week
        return `约 ${weeksNeeded} 周`;
    }

    /**
     * Action: Adjust difficulty
     */
    async adjustDifficulty() {
        alert('难度调整功能开发中...');
    }

    /**
     * Action: Practice weak area
     */
    async practiceWeakArea(area) {
        alert(`开始练习: ${area}`);
    }

    /**
     * Action: Execute recommendation
     */
    async executeRecommendation(recId) {
        alert(`执行建议: ${recId}`);
    }

    /**
     * Action: Start course
     */
    async startCourse(courseId) {
        window.location.hash = `#course/${courseId}`;
    }

    /**
     * Action: Review word
     */
    async reviewWord(wordId) {
        alert(`复习单词: ${wordId}`);
    }

    /**
     * Action: Set difficulty
     */
    async setDifficulty(level) {
        alert(`设置难度: ${level}`);
    }

    /**
     * Action: Save schedule settings
     */
    async saveScheduleSettings() {
        alert('设置已保存');
    }

    /**
     * Update analysis charts with new period
     */
    updateAnalysisCharts(period) {
        console.log('Update charts for period:', period);
        // Re-initialize charts with new data
        this.initializeCharts();
    }

    /**
     * Refresh view
     */
    async refresh() {
        const mainContent = document.getElementById('main-content');
        const html = await this.render();
        mainContent.innerHTML = html;
        this.setupEventListeners();
    }
}
