/**
 * CourseList Component - Display course series and courses
 */

import StorageService from '../services/StorageService.js';
import CourseSeries from '../models/CourseSeries.js';
import Course from '../models/Course.js';

class CourseList {
    constructor(container, onCourseSelect) {
        this.container = container;
        this.onCourseSelect = onCourseSelect;
        this.selectedSeriesId = null;
    }

    /**
     * Render course series grid
     */
    render() {
        const seriesData = StorageService.get(StorageService.KEYS.COURSE_SERIES) || [];
        const series = seriesData.map(s => new CourseSeries(s));

        if (series.length === 0) {
            this.renderEmptyState();
            return;
        }

        const html = `
            <div class="course-container fade-in">
                <h2 style="font-size: var(--font-size-3xl); font-weight: 700; margin-bottom: var(--spacing-xl); color: var(--text-primary);">
                    📚 选择课程系列 / Choose Course Series
                </h2>
                <div class="series-grid">
                    ${series.map(s => this.renderSeriesCard(s)).join('')}
                </div>
                <div id="series-courses"></div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachSeriesListeners();
    }

    /**
     * Render single series card
     * @param {CourseSeries} series
     * @returns {string}
     */
    renderSeriesCard(series) {
        return `
            <div class="series-card ${this.selectedSeriesId === series.id ? 'active' : ''}"
                 data-series-id="${series.id}">
                <div class="series-thumbnail">
                    📖
                </div>
                <div class="series-content">
                    <div class="series-header">
                        <h3 class="series-title">${series.title}</h3>
                        <div class="series-badges">
                            <span class="badge badge-theme">${series.getThemeDisplay()}</span>
                            <span class="badge badge-difficulty">${series.getDifficultyDisplay()}</span>
                        </div>
                    </div>
                    <p class="series-description">${series.description}</p>
                    <div class="series-meta">
                        <span class="meta-item">
                            📝 ${series.getCourseCount()} 个课程
                        </span>
                        <span class="meta-item">
                            ⏱️ ${series.totalEstimatedMinutes} 分钟
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to series cards
     */
    attachSeriesListeners() {
        const cards = this.container.querySelectorAll('.series-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const seriesId = card.dataset.seriesId;
                this.showSeriesCourses(seriesId);
            });
        });
    }

    /**
     * Show courses for selected series
     * @param {string} seriesId
     */
    showSeriesCourses(seriesId) {
        this.selectedSeriesId = seriesId;

        // Update card active state
        const cards = this.container.querySelectorAll('.series-card');
        cards.forEach(card => {
            if (card.dataset.seriesId === seriesId) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Get series and courses
        const seriesData = StorageService.findById(StorageService.KEYS.COURSE_SERIES, seriesId);
        const series = new CourseSeries(seriesData);

        const coursesData = StorageService.findAll(
            StorageService.KEYS.COURSES,
            c => series.courseIds.includes(c.id)
        );
        const courses = coursesData
            .map(c => new Course(c))
            .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

        // Render courses
        const coursesContainer = this.container.querySelector('#series-courses');
        coursesContainer.innerHTML = `
            <div class="course-list slide-in-right">
                <div class="course-list-header">
                    <h3 class="course-list-title">${series.title}</h3>
                    <button class="back-button" id="back-to-series">
                        ← 返回
                    </button>
                </div>
                ${courses.map(c => this.renderCourseItem(c)).join('')}
            </div>
        `;

        // Attach course listeners
        this.attachCourseListeners(courses);

        // Attach back button listener
        const backButton = coursesContainer.querySelector('#back-to-series');
        backButton.addEventListener('click', () => {
            this.selectedSeriesId = null;
            coursesContainer.innerHTML = '';
            cards.forEach(card => card.classList.remove('active'));
        });

        // Scroll to courses
        coursesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Render single course item
     * @param {Course} course
     * @returns {string}
     */
    renderCourseItem(course) {
        return `
            <div class="course-item" data-course-id="${course.id}">
                <div class="course-number">${course.sequenceOrder}</div>
                <div class="course-info">
                    <h4 class="course-title">${course.title}</h4>
                    <p class="course-description">${course.description}</p>
                    <div class="course-stats">
                        <span class="course-stat">
                            📝 ${course.getWordCount()} 个单词
                        </span>
                        <span class="course-stat">
                            ⏱️ ${course.estimatedMinutes} 分钟
                        </span>
                        <span class="course-stat">
                            ❓ ${course.getQuestionCount()} 道题
                        </span>
                    </div>
                </div>
                <div class="course-action">
                    <button class="btn btn-primary">开始学习 →</button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to course items
     * @param {Course[]} courses
     */
    attachCourseListeners(courses) {
        const items = this.container.querySelectorAll('.course-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const courseId = item.dataset.courseId;
                const course = courses.find(c => c.id === courseId);
                if (course && this.onCourseSelect) {
                    this.onCourseSelect(course);
                }
            });
        });
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <p class="empty-state-text">暂无课程</p>
                <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                    请稍后再试
                </p>
            </div>
        `;
    }
}

export default CourseList;
