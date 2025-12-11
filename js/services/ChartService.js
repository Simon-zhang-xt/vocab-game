/**
 * ChartService.js
 * V2.2 Feature: Data Visualization with Chart.js
 *
 * Provides comprehensive learning analytics visualization
 * - Learning curve chart (words learned over time)
 * - Accuracy trend chart (performance over time)
 * - Mastery distribution chart (word proficiency levels)
 * - Study time chart (daily study duration)
 */

import userDataService from './UserDataService.js';

class ChartService {
    constructor() {
        this.charts = {}; // Store chart instances for cleanup
        this.colors = {
            primary: '#4F46E5',
            success: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444',
            info: '#3B82F6',
            purple: '#667EEA'
        };
    }

    /**
     * Create learning curve chart
     * Shows cumulative words learned over past 30 days
     */
    async createLearningCurveChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        const data = await this.getLearningCurveData();

        // Destroy existing chart if any
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '累计学习单词数',
                    data: data.values,
                    borderColor: this.colors.primary,
                    backgroundColor: `${this.colors.primary}20`,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.colors.primary,
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `学习单词: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 10
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Create accuracy trend chart
     * Shows daily quiz accuracy over past 30 days
     */
    async createAccuracyChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        const data = await this.getAccuracyData();

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '正确率 (%)',
                    data: data.values,
                    borderColor: this.colors.success,
                    backgroundColor: `${this.colors.success}20`,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: this.colors.success,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                return `正确率: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Create mastery distribution chart
     * Shows word count by mastery level (0-4)
     */
    async createMasteryDistributionChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        const data = await this.getMasteryDistributionData();

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#FF6B7A', // 未掌握
                        '#FFB800', // 初识
                        '#00D68F', // 熟悉
                        '#4F46E5', // 掌握
                        '#667EEA'  // 精通
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Create study time chart
     * Shows daily study minutes over past 7 days
     */
    async createStudyTimeChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        const data = await this.getStudyTimeData();

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '学习时长 (分钟)',
                    data: data.values,
                    backgroundColor: this.colors.info,
                    borderColor: this.colors.info,
                    borderWidth: 1,
                    borderRadius: 8,
                    barThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                return `学习时长: ${context.parsed.y} 分钟`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + 'min';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Get learning curve data from user records
     * Returns cumulative word count over past 30 days
     */
    async getLearningCurveData() {
        const records = await userDataService.getAllRecords();
        const today = new Date();
        const labels = [];
        const values = [];

        // Generate past 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Count cumulative words up to this date
            const cumulativeWords = records
                .filter(r => new Date(r.completedAt) <= date)
                .reduce((sum, r) => sum + (r.totalWords || 0), 0);

            labels.push(this.formatDateLabel(date, i === 0));
            values.push(cumulativeWords);
        }

        return { labels, values };
    }

    /**
     * Get accuracy data from quiz records
     * Returns daily average accuracy over past 30 days
     */
    async getAccuracyData() {
        const records = await userDataService.getAllRecords();
        const today = new Date();
        const labels = [];
        const values = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Get records for this day
            const dayRecords = records.filter(r => {
                const recordDate = new Date(r.completedAt).toISOString().split('T')[0];
                return recordDate === dateStr;
            });

            // Calculate average accuracy
            let accuracy = 0;
            if (dayRecords.length > 0) {
                const totalAccuracy = dayRecords.reduce((sum, r) => sum + (r.score || 0), 0);
                accuracy = totalAccuracy / dayRecords.length;
            }

            labels.push(this.formatDateLabel(date, i === 0));
            values.push(accuracy);
        }

        return { labels, values };
    }

    /**
     * Get mastery distribution data
     * Returns count of words at each mastery level (0-4)
     */
    async getMasteryDistributionData() {
        const allWords = await userDataService.getAllWords();

        const distribution = {
            0: 0, // 未掌握
            1: 0, // 初识
            2: 0, // 熟悉
            3: 0, // 掌握
            4: 0  // 精通
        };

        allWords.forEach(word => {
            const level = word.mastery_level || 0;
            distribution[level]++;
        });

        return {
            labels: ['未掌握 😰', '初识 😐', '熟悉 🙂', '掌握 😊', '精通 🤩'],
            values: [
                distribution[0],
                distribution[1],
                distribution[2],
                distribution[3],
                distribution[4]
            ]
        };
    }

    /**
     * Get study time data
     * Returns daily study minutes for past 7 days
     */
    async getStudyTimeData() {
        const records = await userDataService.getAllRecords();
        const today = new Date();
        const labels = [];
        const values = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Get total time for this day
            const dayRecords = records.filter(r => {
                const recordDate = new Date(r.completedAt).toISOString().split('T')[0];
                return recordDate === dateStr;
            });

            const totalMinutes = dayRecords.reduce((sum, r) => {
                const duration = r.timeSpent || 0;
                return sum + Math.round(duration / 60);
            }, 0);

            labels.push(this.formatDateLabel(date, i === 0));
            values.push(totalMinutes);
        }

        return { labels, values };
    }

    /**
     * Format date label for charts
     */
    formatDateLabel(date, isToday = false) {
        if (isToday) return '今天';

        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }

    /**
     * Destroy all chart instances
     * Call this when leaving the page
     */
    destroyAll() {
        Object.keys(this.charts).forEach(canvasId => {
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
                delete this.charts[canvasId];
            }
        });
    }

    /**
     * Refresh all charts
     * Call this after data updates
     */
    async refreshAll() {
        const chartIds = Object.keys(this.charts);
        for (const canvasId of chartIds) {
            if (canvasId.includes('learning-curve')) {
                await this.createLearningCurveChart(canvasId);
            } else if (canvasId.includes('accuracy')) {
                await this.createAccuracyChart(canvasId);
            } else if (canvasId.includes('mastery')) {
                await this.createMasteryDistributionChart(canvasId);
            } else if (canvasId.includes('study-time')) {
                await this.createStudyTimeChart(canvasId);
            }
        }
    }
}

// Export singleton instance
const chartService = new ChartService();
export default chartService;
