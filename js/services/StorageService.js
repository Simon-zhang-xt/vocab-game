/**
 * StorageService - LocalStorage wrapper for vocabulary learning game
 * Implements the interface defined in contracts/storage-api.md
 */

class StorageService {
    static KEYS = {
        COURSE_SERIES: 'vocab_courseSeries',
        COURSES: 'vocab_courses',
        WORDS: 'vocab_words',
        LEARNING_RECORDS: 'vocab_learningRecords',
        WORD_MASTERY: 'vocab_wordMastery',
        USER_SETTINGS: 'vocab_userSettings',
        VERSION: 'vocab_version'
    };

    static VERSION = '1.0.0';
    static cache = new Map();

    /**
     * Initialize storage and load seed data if first run
     * @returns {Promise<void>}
     */
    static async init() {
        const version = this.get(this.KEYS.VERSION);

        if (!version) {
            console.log('First run detected, loading seed data...');

            try {
                // Load seed data from JSON files
                const [coursesData, toeflWords, ieltsWords] = await Promise.all([
                    fetch('data/courses.json').then(r => r.json()),
                    fetch('data/toefl-vocab.json').then(r => r.json()),
                    fetch('data/ielts-vocab.json').then(r => r.json())
                ]);

                // Store course data
                this.set(this.KEYS.COURSE_SERIES, coursesData.series || []);
                this.set(this.KEYS.COURSES, coursesData.courses || []);

                // Merge vocabulary from both sources
                const allWords = [
                    ...(toeflWords.words || []),
                    ...(ieltsWords.words || [])
                ];
                this.set(this.KEYS.WORDS, allWords);

                // Initialize empty user data
                this.set(this.KEYS.LEARNING_RECORDS, []);
                this.set(this.KEYS.WORD_MASTERY, []);

                // Set default user settings
                this.set(this.KEYS.USER_SETTINGS, {
                    soundEnabled: true,
                    soundVolume: 70,
                    animationsEnabled: true,
                    theme: 'light',
                    language: 'zh',
                    reviewReminders: true,
                    lastActiveAt: new Date().toISOString()
                });

                // Set version
                this.set(this.KEYS.VERSION, this.VERSION);

                console.log('Seed data loaded successfully');
            } catch (error) {
                console.error('Failed to load seed data:', error);
                throw new Error('Failed to initialize application data');
            }
        } else {
            console.log(`Storage initialized, version ${version}`);
        }
    }

    /**
     * Get data from LocalStorage
     * @template T
     * @param {string} key - Storage key
     * @returns {T|null} Parsed data or null
     */
    static get(key) {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        try {
            const data = localStorage.getItem(key);
            if (data === null) return null;

            const parsed = JSON.parse(data);
            this.cache.set(key, parsed);
            return parsed;
        } catch (error) {
            console.error(`Error reading key "${key}":`, error);
            return null;
        }
    }

    /**
     * Set data to LocalStorage
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     * @returns {boolean} Success status
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            this.cache.set(key, value);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded');
                this.dispatchError(key, 'set', 'QuotaExceededError');
            } else {
                console.error(`Error writing key "${key}":`, error);
                this.dispatchError(key, 'set', error.message);
            }
            return false;
        }
    }

    /**
     * Find item by ID in an array
     * @template T
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     * @returns {T|null} Found item or null
     */
    static findById(key, id) {
        const data = this.get(key);
        if (!Array.isArray(data)) return null;
        return data.find(item => item.id === id) || null;
    }

    /**
     * Find all items matching optional predicate
     * @template T
     * @param {string} key - Storage key
     * @param {Function} [predicate] - Filter function
     * @returns {T[]} Matching items
     */
    static findAll(key, predicate = null) {
        const data = this.get(key);
        if (!Array.isArray(data)) return [];
        return predicate ? data.filter(predicate) : data;
    }

    /**
     * Add item to array
     * @template T
     * @param {string} key - Storage key
     * @param {T} item - Item to add
     * @returns {boolean} Success status
     */
    static add(key, item) {
        const data = this.get(key) || [];
        if (!Array.isArray(data)) {
            console.error(`Key "${key}" is not an array`);
            return false;
        }
        data.push(item);
        return this.set(key, data);
    }

    /**
     * Update item in array
     * @template T
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     * @param {Function} updater - Function that returns updated item
     * @returns {boolean} Success status
     */
    static update(key, id, updater) {
        const data = this.get(key);
        if (!Array.isArray(data)) return false;

        const index = data.findIndex(item => item.id === id);
        if (index === -1) return false;

        data[index] = updater(data[index]);
        return this.set(key, data);
    }

    /**
     * Remove item from array
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     * @returns {boolean} Success status
     */
    static remove(key, id) {
        const data = this.get(key);
        if (!Array.isArray(data)) return false;

        const filtered = data.filter(item => item.id !== id);
        if (filtered.length === data.length) return false;

        return this.set(key, filtered);
    }

    /**
     * Clear specific key
     * @param {string} key - Storage key
     */
    static clear(key) {
        localStorage.removeItem(key);
        this.cache.delete(key);
    }

    /**
     * Clear all application data
     */
    static clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.cache.clear();
    }

    /**
     * Get storage information
     * @returns {Object} Storage info
     */
    static getStorageInfo() {
        let used = 0;
        Object.values(this.KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                used += item.length * 2; // UTF-16 uses 2 bytes per character
            }
        });

        const total = 5 * 1024 * 1024; // 5MB typical limit
        const percentage = (used / total) * 100;

        return {
            used,
            total,
            percentage: parseFloat(percentage.toFixed(2)),
            keys: Object.values(this.KEYS).filter(key => localStorage.getItem(key) !== null)
        };
    }

    /**
     * Export all data as JSON
     * @returns {string} JSON string
     */
    static export() {
        const data = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            data[name] = this.get(key);
        });
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import data from JSON
     * @param {string} jsonData - JSON string
     * @returns {boolean} Success status
     */
    static import(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.entries(this.KEYS).forEach(([name, key]) => {
                if (data[name] !== undefined) {
                    this.set(key, data[name]);
                }
            });
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    /**
     * Invalidate cache for a key
     * @param {string} key - Storage key
     */
    static invalidateCache(key) {
        this.cache.delete(key);
    }

    /**
     * Dispatch storage error event
     * @private
     */
    static dispatchError(key, operation, error) {
        window.dispatchEvent(new CustomEvent('vocab-storage-error', {
            detail: { key, operation, error }
        }));
    }
}

export default StorageService;
