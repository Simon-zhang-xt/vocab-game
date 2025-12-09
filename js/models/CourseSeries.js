/**
 * CourseSeries Model - Themed collection of courses
 * Schema defined in contracts/course-schema.json
 */

class CourseSeries {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.theme = data.theme;
        this.difficulty = data.difficulty;
        this.courseIds = data.courseIds || [];
        this.totalEstimatedMinutes = data.totalEstimatedMinutes;
        this.thumbnailUrl = data.thumbnailUrl || null;
        this.createdAt = data.createdAt;
    }

    /**
     * Get course count
     * @returns {number}
     */
    getCourseCount() {
        return this.courseIds.length;
    }

    /**
     * Get theme display name
     * @returns {string}
     */
    getThemeDisplay() {
        const themeNames = {
            'business': '商务英语',
            'academic': '学术英语',
            'daily': '日常英语',
            'general': '通用英语'
        };
        return themeNames[this.theme] || this.theme;
    }

    /**
     * Get difficulty display name
     * @returns {string}
     */
    getDifficultyDisplay() {
        const difficultyNames = {
            'toefl': 'TOEFL',
            'ielts': 'IELTS',
            'mixed': 'TOEFL + IELTS'
        };
        return difficultyNames[this.difficulty] || this.difficulty;
    }

    /**
     * Validate series data
     * @returns {boolean}
     */
    isValid() {
        return !!(
            this.id &&
            this.title &&
            this.description &&
            this.theme &&
            this.difficulty &&
            this.courseIds.length > 0 &&
            this.totalEstimatedMinutes > 0
        );
    }
}

export default CourseSeries;
