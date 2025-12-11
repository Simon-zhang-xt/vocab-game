/**
 * Etymology Service
 * V3.3 Feature: Word roots, prefixes, suffixes analysis and learning
 */

export default class EtymologyService {
    constructor() {
        this.rootsDatabase = this.initializeRootsDatabase();
        this.userRootProgress = this.loadUserProgress();
    }

    /**
     * Initialize roots database
     * In production, this would be loaded from a JSON file or API
     */
    initializeRootsDatabase() {
        return {
            // Common Latin/Greek roots
            roots: {
                'bio': {
                    id: 'bio',
                    type: 'root',
                    origin: 'Greek',
                    meaning: 'life',
                    meaning_zh: '生命',
                    examples: [
                        { word: 'biology', meaning: 'study of life', translation: '生物学' },
                        { word: 'biography', meaning: 'written account of a life', translation: '传记' },
                        { word: 'antibiotic', meaning: 'against life (bacteria)', translation: '抗生素' },
                        { word: 'biodiversity', meaning: 'variety of life', translation: '生物多样性' }
                    ]
                },
                'graph': {
                    id: 'graph',
                    type: 'root',
                    origin: 'Greek',
                    meaning: 'write, draw',
                    meaning_zh: '写，画',
                    examples: [
                        { word: 'autograph', meaning: 'self-writing', translation: '亲笔签名' },
                        { word: 'photograph', meaning: 'light-writing', translation: '照片' },
                        { word: 'biography', meaning: 'life-writing', translation: '传记' },
                        { word: 'graphic', meaning: 'related to writing/drawing', translation: '图形的' }
                    ]
                },
                'tele': {
                    id: 'tele',
                    type: 'root',
                    origin: 'Greek',
                    meaning: 'far, distant',
                    meaning_zh: '远，距离',
                    examples: [
                        { word: 'telephone', meaning: 'far sound', translation: '电话' },
                        { word: 'television', meaning: 'far vision', translation: '电视' },
                        { word: 'telescope', meaning: 'far seeing', translation: '望远镜' },
                        { word: 'telegram', meaning: 'far writing', translation: '电报' }
                    ]
                },
                'port': {
                    id: 'port',
                    type: 'root',
                    origin: 'Latin',
                    meaning: 'carry',
                    meaning_zh: '携带，运送',
                    examples: [
                        { word: 'portable', meaning: 'able to be carried', translation: '便携的' },
                        { word: 'transport', meaning: 'carry across', translation: '运输' },
                        { word: 'export', meaning: 'carry out', translation: '出口' },
                        { word: 'import', meaning: 'carry in', translation: '进口' }
                    ]
                },
                'spect': {
                    id: 'spect',
                    type: 'root',
                    origin: 'Latin',
                    meaning: 'look, see',
                    meaning_zh: '看，观察',
                    examples: [
                        { word: 'inspect', meaning: 'look into', translation: '检查' },
                        { word: 'respect', meaning: 'look back at', translation: '尊重' },
                        { word: 'spectator', meaning: 'one who looks', translation: '观众' },
                        { word: 'perspective', meaning: 'looking through', translation: '视角' }
                    ]
                }
            },

            // Common prefixes
            prefixes: {
                'un': {
                    id: 'un',
                    type: 'prefix',
                    meaning: 'not, opposite',
                    meaning_zh: '不，相反',
                    examples: [
                        { word: 'unhappy', meaning: 'not happy', translation: '不快乐的' },
                        { word: 'unable', meaning: 'not able', translation: '不能的' },
                        { word: 'unusual', meaning: 'not usual', translation: '不寻常的' }
                    ]
                },
                'pre': {
                    id: 'pre',
                    type: 'prefix',
                    meaning: 'before',
                    meaning_zh: '在...之前',
                    examples: [
                        { word: 'preview', meaning: 'see before', translation: '预览' },
                        { word: 'predict', meaning: 'say before', translation: '预测' },
                        { word: 'prevent', meaning: 'come before', translation: '预防' }
                    ]
                },
                'anti': {
                    id: 'anti',
                    type: 'prefix',
                    meaning: 'against',
                    meaning_zh: '反对，对抗',
                    examples: [
                        { word: 'antiwar', meaning: 'against war', translation: '反战的' },
                        { word: 'antibiotic', meaning: 'against life (bacteria)', translation: '抗生素' },
                        { word: 'antisocial', meaning: 'against society', translation: '反社会的' }
                    ]
                },
                're': {
                    id: 're',
                    type: 'prefix',
                    meaning: 'again, back',
                    meaning_zh: '再次，返回',
                    examples: [
                        { word: 'return', meaning: 'turn back', translation: '返回' },
                        { word: 'review', meaning: 'see again', translation: '复习' },
                        { word: 'rebuild', meaning: 'build again', translation: '重建' }
                    ]
                }
            },

            // Common suffixes
            suffixes: {
                'able': {
                    id: 'able',
                    type: 'suffix',
                    meaning: 'capable of, able to',
                    meaning_zh: '能够，可以',
                    examples: [
                        { word: 'readable', meaning: 'able to be read', translation: '可读的' },
                        { word: 'washable', meaning: 'able to be washed', translation: '可洗的' },
                        { word: 'comfortable', meaning: 'able to give comfort', translation: '舒适的' }
                    ]
                },
                'tion': {
                    id: 'tion',
                    type: 'suffix',
                    meaning: 'action, state',
                    meaning_zh: '行为，状态',
                    examples: [
                        { word: 'action', meaning: 'state of acting', translation: '行动' },
                        { word: 'education', meaning: 'process of educating', translation: '教育' },
                        { word: 'solution', meaning: 'act of solving', translation: '解决方案' }
                    ]
                },
                'er': {
                    id: 'er',
                    type: 'suffix',
                    meaning: 'person who, thing that',
                    meaning_zh: '做...的人，...器',
                    examples: [
                        { word: 'teacher', meaning: 'person who teaches', translation: '教师' },
                        { word: 'computer', meaning: 'thing that computes', translation: '计算机' },
                        { word: 'writer', meaning: 'person who writes', translation: '作家' }
                    ]
                },
                'ly': {
                    id: 'ly',
                    type: 'suffix',
                    meaning: 'in a manner',
                    meaning_zh: '以...方式',
                    examples: [
                        { word: 'quickly', meaning: 'in a quick manner', translation: '快速地' },
                        { word: 'happily', meaning: 'in a happy manner', translation: '快乐地' },
                        { word: 'carefully', meaning: 'in a careful manner', translation: '小心地' }
                    ]
                }
            }
        };
    }

    /**
     * Load user's etymology learning progress
     */
    loadUserProgress() {
        const data = localStorage.getItem('etymologyProgress');
        return data ? JSON.parse(data) : {};
    }

    /**
     * Save user progress
     */
    saveUserProgress() {
        localStorage.setItem('etymologyProgress', JSON.stringify(this.userRootProgress));
    }

    /**
     * Analyze a word and break it down into etymological components
     */
    analyzeWord(word) {
        const analysis = {
            word,
            components: [],
            hasEtymology: false
        };

        // Simple pattern matching for demonstration
        // In production, use a comprehensive etymology database

        const wordLower = word.toLowerCase();

        // Check for known prefixes
        for (const [prefix, data] of Object.entries(this.rootsDatabase.prefixes)) {
            if (wordLower.startsWith(prefix)) {
                analysis.components.push({
                    part: prefix,
                    ...data,
                    position: 'prefix'
                });
                analysis.hasEtymology = true;
            }
        }

        // Check for known roots
        for (const [root, data] of Object.entries(this.rootsDatabase.roots)) {
            if (wordLower.includes(root)) {
                analysis.components.push({
                    part: root,
                    ...data,
                    position: 'root'
                });
                analysis.hasEtymology = true;
            }
        }

        // Check for known suffixes
        for (const [suffix, data] of Object.entries(this.rootsDatabase.suffixes)) {
            if (wordLower.endsWith(suffix)) {
                analysis.components.push({
                    part: suffix,
                    ...data,
                    position: 'suffix'
                });
                analysis.hasEtymology = true;
            }
        }

        return analysis;
    }

    /**
     * Get all roots
     */
    getAllRoots() {
        return Object.values(this.rootsDatabase.roots);
    }

    /**
     * Get all prefixes
     */
    getAllPrefixes() {
        return Object.values(this.rootsDatabase.prefixes);
    }

    /**
     * Get all suffixes
     */
    getAllSuffixes() {
        return Object.values(this.rootsDatabase.suffixes);
    }

    /**
     * Get all etymology components
     */
    getAllComponents() {
        return {
            roots: this.getAllRoots(),
            prefixes: this.getAllPrefixes(),
            suffixes: this.getAllSuffixes()
        };
    }

    /**
     * Get component by ID
     */
    getComponent(id) {
        return this.rootsDatabase.roots[id] ||
               this.rootsDatabase.prefixes[id] ||
               this.rootsDatabase.suffixes[id] ||
               null;
    }

    /**
     * Get words related to a specific root
     */
    getRelatedWords(rootId) {
        const component = this.getComponent(rootId);
        return component ? component.examples : [];
    }

    /**
     * Mark root as learned
     */
    markRootLearned(rootId) {
        if (!this.userRootProgress[rootId]) {
            this.userRootProgress[rootId] = {
                learnedAt: Date.now(),
                reviewCount: 0,
                lastReviewed: null,
                masteryLevel: 1
            };
        } else {
            this.userRootProgress[rootId].masteryLevel++;
        }

        this.saveUserProgress();
    }

    /**
     * Update root review
     */
    updateRootReview(rootId, correct) {
        if (!this.userRootProgress[rootId]) {
            this.markRootLearned(rootId);
            return;
        }

        const progress = this.userRootProgress[rootId];
        progress.lastReviewed = Date.now();
        progress.reviewCount++;

        if (correct) {
            progress.masteryLevel = Math.min(5, progress.masteryLevel + 1);
        } else {
            progress.masteryLevel = Math.max(1, progress.masteryLevel - 1);
        }

        this.saveUserProgress();
    }

    /**
     * Get user's root learning statistics
     */
    getStatistics() {
        const allComponents = [
            ...this.getAllRoots(),
            ...this.getAllPrefixes(),
            ...this.getAllSuffixes()
        ];

        const learnedCount = Object.keys(this.userRootProgress).length;
        const totalCount = allComponents.length;

        const masteryLevels = {
            1: 0, // Beginner
            2: 0, // Familiar
            3: 0, // Proficient
            4: 0, // Advanced
            5: 0  // Master
        };

        for (const progress of Object.values(this.userRootProgress)) {
            masteryLevels[progress.masteryLevel]++;
        }

        return {
            totalComponents: totalCount,
            learnedComponents: learnedCount,
            unlearned: totalCount - learnedCount,
            masteryLevels,
            completionRate: ((learnedCount / totalCount) * 100).toFixed(1)
        };
    }

    /**
     * Get roots that need review
     */
    getRootsForReview(limit = 10) {
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;

        const rootsToReview = [];

        for (const [rootId, progress] of Object.entries(this.userRootProgress)) {
            const component = this.getComponent(rootId);
            if (!component) continue;

            const daysSinceReview = progress.lastReviewed
                ? (now - progress.lastReviewed) / dayInMs
                : 999;

            // Review interval based on mastery level
            const reviewInterval = {
                1: 1,   // 1 day
                2: 3,   // 3 days
                3: 7,   // 1 week
                4: 14,  // 2 weeks
                5: 30   // 1 month
            }[progress.masteryLevel] || 1;

            if (daysSinceReview >= reviewInterval) {
                rootsToReview.push({
                    ...component,
                    progress
                });
            }
        }

        // Sort by priority (longest overdue first)
        rootsToReview.sort((a, b) => a.progress.lastReviewed - b.progress.lastReviewed);

        return rootsToReview.slice(0, limit);
    }

    /**
     * Generate root learning session
     */
    generateLearningSession(options = {}) {
        const {
            sessionSize = 10,
            focusType = 'all', // 'roots', 'prefixes', 'suffixes', or 'all'
            includeReview = true
        } = options;

        let components = [];

        switch (focusType) {
            case 'roots':
                components = this.getAllRoots();
                break;
            case 'prefixes':
                components = this.getAllPrefixes();
                break;
            case 'suffixes':
                components = this.getAllSuffixes();
                break;
            default:
                components = [
                    ...this.getAllRoots(),
                    ...this.getAllPrefixes(),
                    ...this.getAllSuffixes()
                ];
        }

        // Filter unlearned components
        const unlearned = components.filter(c => !this.userRootProgress[c.id]);

        // Get review components if requested
        let reviewComponents = [];
        if (includeReview) {
            reviewComponents = this.getRootsForReview(Math.floor(sessionSize * 0.3));
        }

        // Combine new and review components
        const sessionComponents = [
            ...reviewComponents,
            ...unlearned.slice(0, sessionSize - reviewComponents.length)
        ];

        // Shuffle
        sessionComponents.sort(() => Math.random() - 0.5);

        const sessionId = `etymology-session-${Date.now()}`;

        return {
            sessionId,
            components: sessionComponents,
            createdAt: Date.now(),
            focusType
        };
    }

    /**
     * Build word tree showing root connections
     */
    buildWordTree(rootId) {
        const component = this.getComponent(rootId);
        if (!component) return null;

        return {
            root: component,
            relatedWords: component.examples,
            connections: this.findRelatedRoots(rootId)
        };
    }

    /**
     * Find related roots based on shared words
     */
    findRelatedRoots(rootId) {
        const component = this.getComponent(rootId);
        if (!component) return [];

        const related = [];
        const rootWords = new Set(component.examples.map(e => e.word));

        const allComponents = [
            ...this.getAllRoots(),
            ...this.getAllPrefixes(),
            ...this.getAllSuffixes()
        ];

        for (const other of allComponents) {
            if (other.id === rootId) continue;

            const sharedWords = other.examples.filter(e => rootWords.has(e.word));

            if (sharedWords.length > 0) {
                related.push({
                    component: other,
                    sharedWords
                });
            }
        }

        return related;
    }

    /**
     * Clear all progress (for testing/reset)
     */
    clearProgress() {
        this.userRootProgress = {};
        localStorage.removeItem('etymologyProgress');
    }
}
