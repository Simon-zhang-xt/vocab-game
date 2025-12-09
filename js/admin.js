/**
 * Admin Panel - Vocabulary and Course Management
 * 后台管理 - 词库和课程管理
 */

import StorageService from './services/StorageService.js';
import Word from './models/Word.js';
import Course from './models/Course.js';
import CourseSeries from './models/CourseSeries.js';

class AdminPanel {
    constructor() {
        this.currentTab = 'words';
        this.editingWordId = null;
        this.editingCourseId = null;
        this.init();
    }

    async init() {
        console.log('Admin Panel initializing...');

        // Initialize storage
        await StorageService.init();

        // Setup tab switching
        this.setupTabs();

        // Setup forms
        this.setupWordForm();
        this.setupCourseForm();
        this.setupImportExport();

        // Load initial data
        this.loadWords();
        this.loadCourses();
        this.updateStats();

        console.log('Admin Panel initialized');
    }

    /**
     * Setup tab switching
     */
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        this.currentTab = tabName;
    }

    /**
     * Setup word form
     */
    setupWordForm() {
        const addBtn = document.getElementById('add-word-btn');
        const form = document.getElementById('word-form');
        const formElement = document.getElementById('word-form-element');
        const cancelBtn = document.getElementById('cancel-word-btn');

        addBtn.addEventListener('click', () => {
            this.editingWordId = null;
            formElement.reset();
            form.classList.remove('hidden');
            form.scrollIntoView({ behavior: 'smooth' });
        });

        cancelBtn.addEventListener('click', () => {
            form.classList.add('hidden');
            this.editingWordId = null;
        });

        formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWord();
        });
    }

    /**
     * Save word
     */
    saveWord() {
        const wordData = {
            id: this.editingWordId || `word_${Date.now()}`,
            word: document.getElementById('word-text').value.trim(),
            phonetic: document.getElementById('word-phonetic').value.trim(),
            partOfSpeech: document.getElementById('word-pos').value,
            definition: document.getElementById('word-definition').value.trim(),
            example: {
                en: document.getElementById('word-example-en').value.trim(),
                zh: document.getElementById('word-example-zh').value.trim()
            },
            synonyms: document.getElementById('word-synonyms').value.split(',').map(s => s.trim()).filter(Boolean),
            antonyms: document.getElementById('word-antonyms').value.split(',').map(s => s.trim()).filter(Boolean),
            difficulty: parseInt(document.getElementById('word-difficulty').value),
            tags: document.getElementById('word-tags').value.split(',').map(s => s.trim()).filter(Boolean)
        };

        // Get existing words
        const words = StorageService.get(StorageService.KEYS.WORDS) || [];

        if (this.editingWordId) {
            // Update existing word
            const index = words.findIndex(w => w.id === this.editingWordId);
            if (index !== -1) {
                words[index] = wordData;
                this.showMessage('单词更新成功！', 'success');
            }
        } else {
            // Add new word
            words.push(wordData);
            this.showMessage('单词添加成功！', 'success');
        }

        // Save to storage
        StorageService.set(StorageService.KEYS.WORDS, words);

        // Reset form and reload list
        document.getElementById('word-form').classList.add('hidden');
        document.getElementById('word-form-element').reset();
        this.editingWordId = null;
        this.loadWords();
        this.updateStats();
    }

    /**
     * Load and display words
     */
    loadWords() {
        const words = StorageService.get(StorageService.KEYS.WORDS) || [];
        const container = document.getElementById('words-list');

        if (words.length === 0) {
            container.innerHTML = `
                <div class="empty-state-admin">
                    <div class="empty-state-admin-icon">📖</div>
                    <p class="empty-state-admin-text">还没有添加任何单词</p>
                    <p style="color: var(--text-secondary);">点击上方"添加新单词"按钮开始创建词库</p>
                </div>
            `;
            return;
        }

        container.innerHTML = words.map(word => this.renderWordItem(word)).join('');

        // Attach event listeners
        words.forEach(word => {
            const editBtn = document.getElementById(`edit-word-${word.id}`);
            const deleteBtn = document.getElementById(`delete-word-${word.id}`);

            if (editBtn) {
                editBtn.addEventListener('click', () => this.editWord(word.id));
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteWord(word.id));
            }
        });
    }

    renderWordItem(word) {
        return `
            <div class="word-item">
                <div class="word-item-header">
                    <div class="word-title">
                        <h3>${word.word}</h3>
                        ${word.phonetic ? `<p class="word-phonetic">${word.phonetic}</p>` : ''}
                    </div>
                    <div class="word-actions">
                        <button id="edit-word-${word.id}" class="btn btn-secondary">✏️ 编辑</button>
                        <button id="delete-word-${word.id}" class="btn btn-secondary" style="color: var(--error-color);">🗑️ 删除</button>
                    </div>
                </div>
                <div class="word-content">
                    <div class="word-meta">
                        <span><strong>词性:</strong> ${word.partOfSpeech}</span>
                        <span><strong>难度:</strong> Level ${word.difficulty}</span>
                        <span><strong>ID:</strong> <code>${word.id}</code></span>
                    </div>
                    <div class="word-definition">
                        <strong>释义:</strong> ${word.definition}
                    </div>
                    ${word.example && word.example.en ? `
                        <div class="word-example">
                            <div class="word-example-en">"${word.example.en}"</div>
                            ${word.example.zh ? `<div class="word-example-zh">${word.example.zh}</div>` : ''}
                        </div>
                    ` : ''}
                    ${word.synonyms && word.synonyms.length > 0 ? `
                        <div style="margin-bottom: var(--spacing-sm);">
                            <strong>同义词:</strong> ${word.synonyms.join(', ')}
                        </div>
                    ` : ''}
                    ${word.antonyms && word.antonyms.length > 0 ? `
                        <div style="margin-bottom: var(--spacing-sm);">
                            <strong>反义词:</strong> ${word.antonyms.join(', ')}
                        </div>
                    ` : ''}
                    ${word.tags && word.tags.length > 0 ? `
                        <div class="word-tags">
                            ${word.tags.map(tag => `<span class="word-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    editWord(wordId) {
        const words = StorageService.get(StorageService.KEYS.WORDS) || [];
        const word = words.find(w => w.id === wordId);

        if (!word) return;

        this.editingWordId = wordId;

        // Fill form
        document.getElementById('word-text').value = word.word;
        document.getElementById('word-phonetic').value = word.phonetic || '';
        document.getElementById('word-pos').value = word.partOfSpeech;
        document.getElementById('word-difficulty').value = word.difficulty;
        document.getElementById('word-definition').value = word.definition;
        document.getElementById('word-example-en').value = word.example?.en || '';
        document.getElementById('word-example-zh').value = word.example?.zh || '';
        document.getElementById('word-synonyms').value = (word.synonyms || []).join(', ');
        document.getElementById('word-antonyms').value = (word.antonyms || []).join(', ');
        document.getElementById('word-tags').value = (word.tags || []).join(', ');

        // Show form
        const form = document.getElementById('word-form');
        form.classList.remove('hidden');
        form.scrollIntoView({ behavior: 'smooth' });
    }

    deleteWord(wordId) {
        if (!confirm('确定要删除这个单词吗？此操作不可恢复。\n\nAre you sure you want to delete this word?')) {
            return;
        }

        let words = StorageService.get(StorageService.KEYS.WORDS) || [];
        words = words.filter(w => w.id !== wordId);
        StorageService.set(StorageService.KEYS.WORDS, words);

        this.showMessage('单词已删除', 'success');
        this.loadWords();
        this.updateStats();
    }

    /**
     * Setup course form
     */
    setupCourseForm() {
        const addBtn = document.getElementById('add-course-btn');
        const form = document.getElementById('course-form');
        const formElement = document.getElementById('course-form-element');
        const cancelBtn = document.getElementById('cancel-course-btn');

        addBtn.addEventListener('click', () => {
            this.editingCourseId = null;
            formElement.reset();
            form.classList.remove('hidden');
            form.scrollIntoView({ behavior: 'smooth' });
        });

        cancelBtn.addEventListener('click', () => {
            form.classList.add('hidden');
            this.editingCourseId = null;
        });

        formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCourse();
        });
    }

    saveCourse() {
        const courseData = {
            id: document.getElementById('course-id').value.trim(),
            seriesId: document.getElementById('course-series').value,
            number: parseInt(document.getElementById('course-number').value),
            title: document.getElementById('course-title').value.trim(),
            description: document.getElementById('course-description').value.trim(),
            wordIds: document.getElementById('course-word-ids').value.split(',').map(s => s.trim()).filter(Boolean),
            isLocked: false
        };

        // Get existing courses
        const courses = StorageService.get(StorageService.KEYS.COURSES) || [];

        if (this.editingCourseId) {
            // Update existing
            const index = courses.findIndex(c => c.id === this.editingCourseId);
            if (index !== -1) {
                courses[index] = courseData;
                this.showMessage('课程更新成功！', 'success');
            }
        } else {
            // Add new
            courses.push(courseData);
            this.showMessage('课程添加成功！', 'success');
        }

        StorageService.set(StorageService.KEYS.COURSES, courses);

        // Reset and reload
        document.getElementById('course-form').classList.add('hidden');
        document.getElementById('course-form-element').reset();
        this.editingCourseId = null;
        this.loadCourses();
        this.updateStats();
    }

    loadCourses() {
        const courses = StorageService.get(StorageService.KEYS.COURSES) || [];
        const container = document.getElementById('courses-list');

        if (courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state-admin">
                    <div class="empty-state-admin-icon">📚</div>
                    <p class="empty-state-admin-text">还没有添加任何课程</p>
                    <p style="color: var(--text-secondary);">点击上方"添加新课程"按钮开始创建课程</p>
                </div>
            `;
            return;
        }

        container.innerHTML = courses.map(course => this.renderCourseItem(course)).join('');

        // Attach listeners
        courses.forEach(course => {
            const editBtn = document.getElementById(`edit-course-${course.id}`);
            const deleteBtn = document.getElementById(`delete-course-${course.id}`);

            if (editBtn) {
                editBtn.addEventListener('click', () => this.editCourse(course.id));
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteCourse(course.id));
            }
        });
    }

    renderCourseItem(course) {
        return `
            <div class="course-item-admin">
                <div class="course-item-header">
                    <div class="course-title-admin">
                        <h3>${course.title}</h3>
                        <p class="course-id">${course.id}</p>
                    </div>
                    <div class="word-actions">
                        <button id="edit-course-${course.id}" class="btn btn-secondary">✏️ 编辑</button>
                        <button id="delete-course-${course.id}" class="btn btn-secondary" style="color: var(--error-color);">🗑️ 删除</button>
                    </div>
                </div>
                <div class="course-content">
                    <div class="course-meta">
                        <span><strong>系列:</strong> ${course.seriesId}</span>
                        <span><strong>编号:</strong> ${course.number}</span>
                        <span><strong>单词数:</strong> ${course.wordIds.length}</span>
                    </div>
                    ${course.description ? `<p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">${course.description}</p>` : ''}
                    <details style="margin-top: var(--spacing-md);">
                        <summary style="cursor: pointer; font-weight: 600;">查看包含的单词ID</summary>
                        <pre style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md); margin-top: var(--spacing-sm); overflow-x: auto; font-size: var(--font-size-sm);">${course.wordIds.join(', ')}</pre>
                    </details>
                </div>
            </div>
        `;
    }

    editCourse(courseId) {
        const courses = StorageService.get(StorageService.KEYS.COURSES) || [];
        const course = courses.find(c => c.id === courseId);

        if (!course) return;

        this.editingCourseId = courseId;

        document.getElementById('course-series').value = course.seriesId;
        document.getElementById('course-id').value = course.id;
        document.getElementById('course-number').value = course.number;
        document.getElementById('course-title').value = course.title;
        document.getElementById('course-description').value = course.description || '';
        document.getElementById('course-word-ids').value = course.wordIds.join(', ');

        const form = document.getElementById('course-form');
        form.classList.remove('hidden');
        form.scrollIntoView({ behavior: 'smooth' });
    }

    deleteCourse(courseId) {
        if (!confirm('确定要删除这个课程吗？此操作不可恢复。')) {
            return;
        }

        let courses = StorageService.get(StorageService.KEYS.COURSES) || [];
        courses = courses.filter(c => c.id !== courseId);
        StorageService.set(StorageService.KEYS.COURSES, courses);

        this.showMessage('课程已删除', 'success');
        this.loadCourses();
        this.updateStats();
    }

    /**
     * Setup import/export
     */
    setupImportExport() {
        // Import words
        document.getElementById('import-words-btn').addEventListener('click', () => {
            this.importWords();
        });

        // Download template
        document.getElementById('download-template-btn').addEventListener('click', () => {
            this.downloadTemplate();
        });

        // Export buttons
        document.getElementById('export-words-btn').addEventListener('click', () => {
            this.exportWords();
        });

        document.getElementById('export-courses-btn').addEventListener('click', () => {
            this.exportCourses();
        });

        document.getElementById('export-all-btn').addEventListener('click', () => {
            this.exportAll();
        });
    }

    importWords() {
        const jsonText = document.getElementById('import-json').value.trim();

        if (!jsonText) {
            alert('请输入JSON数据');
            return;
        }

        try {
            const newWords = JSON.parse(jsonText);

            if (!Array.isArray(newWords)) {
                throw new Error('JSON must be an array');
            }

            const words = StorageService.get(StorageService.KEYS.WORDS) || [];
            words.push(...newWords);
            StorageService.set(StorageService.KEYS.WORDS, words);

            this.showMessage(`成功导入 ${newWords.length} 个单词！`, 'success');
            document.getElementById('import-json').value = '';
            this.loadWords();
            this.updateStats();
        } catch (error) {
            alert('JSON格式错误: ' + error.message);
        }
    }

    downloadTemplate() {
        const template = [
            {
                "id": "word_example",
                "word": "example",
                "phonetic": "/ɪɡˈzæmpl/",
                "partOfSpeech": "n.",
                "definition": "例子；范例",
                "example": {
                    "en": "This is an example sentence.",
                    "zh": "这是一个例句。"
                },
                "synonyms": ["instance", "case"],
                "antonyms": [],
                "difficulty": 1,
                "tags": ["basic", "common"]
            }
        ];

        this.downloadJSON(template, 'word-template.json');
    }

    exportWords() {
        const words = StorageService.get(StorageService.KEYS.WORDS) || [];
        this.downloadJSON(words, 'words-export.json');
        this.showMessage('单词数据已导出', 'success');
    }

    exportCourses() {
        const courses = StorageService.get(StorageService.KEYS.COURSES) || [];
        this.downloadJSON(courses, 'courses-export.json');
        this.showMessage('课程数据已导出', 'success');
    }

    exportAll() {
        const data = {
            words: StorageService.get(StorageService.KEYS.WORDS) || [],
            courses: StorageService.get(StorageService.KEYS.COURSES) || [],
            series: StorageService.get(StorageService.KEYS.COURSE_SERIES) || [],
            exportDate: new Date().toISOString()
        };
        this.downloadJSON(data, 'vocab-game-complete-export.json');
        this.showMessage('完整数据已导出', 'success');
    }

    downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Update statistics
     */
    updateStats() {
        const words = StorageService.get(StorageService.KEYS.WORDS) || [];
        const courses = StorageService.get(StorageService.KEYS.COURSES) || [];
        const series = StorageService.get(StorageService.KEYS.COURSE_SERIES) || [];

        document.getElementById('total-words').textContent = words.length;
        document.getElementById('total-courses').textContent = courses.length;
        document.getElementById('total-series').textContent = series.length;
    }

    /**
     * Show message
     */
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;

        const container = document.querySelector('.admin-container');
        container.insertBefore(message, container.firstChild);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
