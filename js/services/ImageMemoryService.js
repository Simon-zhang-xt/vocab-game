/**
 * Image Memory Service
 * V3.2 Feature: Visual learning with images from Unsplash
 */

export default class ImageMemoryService {
    constructor() {
        this.unsplashAccessKey = 'YOUR_UNSPLASH_ACCESS_KEY'; // Replace with actual key
        this.unsplashApiUrl = 'https://api.unsplash.com';
        this.cache = new Map(); // Cache images to reduce API calls
        this.fallbackImages = this.initializeFallbackImages();
    }

    /**
     * Initialize fallback images for offline mode
     */
    initializeFallbackImages() {
        return {
            'animal': 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400',
            'nature': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
            'food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            'technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
            'architecture': 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400',
            'people': 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
            'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
            'business': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
            'default': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
        };
    }

    /**
     * Get image for a word from Unsplash API
     * @param {string} word - The vocabulary word
     * @param {string} hint - Optional category hint for better results
     * @returns {Promise<Object>} Image data with url, photographer info
     */
    async getImageForWord(word, hint = '') {
        // Check cache first
        const cacheKey = `${word}-${hint}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Construct search query
            const query = hint ? `${word} ${hint}` : word;
            const params = new URLSearchParams({
                query: query,
                per_page: 1,
                orientation: 'squarish',
                content_filter: 'high'
            });

            const response = await fetch(`${this.unsplashApiUrl}/search/photos?${params}`, {
                headers: {
                    'Authorization': `Client-ID ${this.unsplashAccessKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Unsplash API request failed');
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const photo = data.results[0];
                const imageData = {
                    url: photo.urls.regular,
                    thumb: photo.urls.thumb,
                    photographer: photo.user.name,
                    photographerUrl: photo.user.links.html,
                    downloadLocation: photo.links.download_location,
                    alt: photo.alt_description || word
                };

                // Cache the result
                this.cache.set(cacheKey, imageData);

                // Trigger download endpoint (Unsplash API requirement)
                this.triggerDownload(imageData.downloadLocation);

                return imageData;
            } else {
                // No results, use fallback
                return this.getFallbackImage(word, hint);
            }

        } catch (error) {
            console.error('[ImageMemory] Error fetching image:', error);
            return this.getFallbackImage(word, hint);
        }
    }

    /**
     * Get fallback image when API fails
     */
    getFallbackImage(word, hint) {
        const category = this.detectCategory(word, hint);
        const url = this.fallbackImages[category] || this.fallbackImages.default;

        return {
            url: url,
            thumb: url,
            photographer: 'Unsplash',
            photographerUrl: 'https://unsplash.com',
            downloadLocation: null,
            alt: word,
            isFallback: true
        };
    }

    /**
     * Detect word category for fallback images
     */
    detectCategory(word, hint) {
        const categories = {
            animal: ['cat', 'dog', 'bird', 'fish', 'animal', 'pet', 'wildlife'],
            nature: ['tree', 'flower', 'mountain', 'ocean', 'forest', 'nature', 'plant'],
            food: ['food', 'fruit', 'vegetable', 'meal', 'dish', 'cuisine'],
            technology: ['computer', 'phone', 'technology', 'digital', 'device'],
            architecture: ['building', 'house', 'bridge', 'architecture', 'structure'],
            people: ['person', 'people', 'human', 'man', 'woman', 'child'],
            travel: ['travel', 'city', 'landscape', 'destination', 'journey'],
            business: ['business', 'office', 'work', 'meeting', 'professional']
        };

        const searchText = `${word} ${hint}`.toLowerCase();

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => searchText.includes(keyword))) {
                return category;
            }
        }

        return 'default';
    }

    /**
     * Trigger Unsplash download endpoint (API requirement)
     */
    async triggerDownload(downloadLocation) {
        if (!downloadLocation) return;

        try {
            await fetch(downloadLocation, {
                headers: {
                    'Authorization': `Client-ID ${this.unsplashAccessKey}`
                }
            });
        } catch (error) {
            console.warn('[ImageMemory] Failed to trigger download:', error);
        }
    }

    /**
     * Get multiple images for a word list
     * @param {Array} words - Array of word objects {word, hint}
     * @returns {Promise<Array>} Array of image data
     */
    async getImagesForWords(words) {
        const promises = words.map(wordObj =>
            this.getImageForWord(wordObj.word, wordObj.hint || '')
        );

        try {
            return await Promise.all(promises);
        } catch (error) {
            console.error('[ImageMemory] Error fetching multiple images:', error);
            return words.map(wordObj => this.getFallbackImage(wordObj.word, wordObj.hint));
        }
    }

    /**
     * Preload images into cache for better performance
     */
    async preloadImages(words) {
        const images = await this.getImagesForWords(words);

        // Preload image elements
        const imageElements = images.map(imageData => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = imageData.thumb;
            });
        });

        try {
            await Promise.all(imageElements);
            console.log('[ImageMemory] Preloaded', images.length, 'images');
        } catch (error) {
            console.warn('[ImageMemory] Some images failed to preload:', error);
        }
    }

    /**
     * Save user's image association to local storage
     */
    async saveImageAssociation(wordId, imageData, studySessionId) {
        const associations = this.getImageAssociations();

        associations[wordId] = {
            ...imageData,
            studySessionId,
            timestamp: Date.now()
        };

        localStorage.setItem('imageMemoryAssociations', JSON.stringify(associations));
    }

    /**
     * Get user's saved image associations
     */
    getImageAssociations() {
        const data = localStorage.getItem('imageMemoryAssociations');
        return data ? JSON.parse(data) : {};
    }

    /**
     * Get saved image for a word
     */
    getSavedImage(wordId) {
        const associations = this.getImageAssociations();
        return associations[wordId] || null;
    }

    /**
     * Get image memory statistics
     */
    getStatistics() {
        const associations = this.getImageAssociations();
        const wordIds = Object.keys(associations);

        return {
            totalWords: wordIds.length,
            imagesUsed: wordIds.length,
            oldestAssociation: wordIds.length > 0
                ? Math.min(...wordIds.map(id => associations[id].timestamp))
                : null,
            newestAssociation: wordIds.length > 0
                ? Math.max(...wordIds.map(id => associations[id].timestamp))
                : null
        };
    }

    /**
     * Clear cache (for testing or reset)
     */
    clearCache() {
        this.cache.clear();
        localStorage.removeItem('imageMemoryAssociations');
        console.log('[ImageMemory] Cache cleared');
    }

    /**
     * Get random images for quiz mode
     */
    async getRandomImages(count = 4) {
        const randomQueries = [
            'abstract', 'nature', 'city', 'pattern', 'texture',
            'landscape', 'architecture', 'wildlife', 'ocean', 'mountain'
        ];

        const promises = [];
        for (let i = 0; i < count; i++) {
            const query = randomQueries[Math.floor(Math.random() * randomQueries.length)];
            promises.push(this.getImageForWord(query));
        }

        return await Promise.all(promises);
    }

    /**
     * Search images by category
     */
    async searchImagesByCategory(category, count = 10) {
        try {
            const params = new URLSearchParams({
                query: category,
                per_page: count,
                orientation: 'squarish',
                content_filter: 'high'
            });

            const response = await fetch(`${this.unsplashApiUrl}/search/photos?${params}`, {
                headers: {
                    'Authorization': `Client-ID ${this.unsplashAccessKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            return data.results.map(photo => ({
                url: photo.urls.regular,
                thumb: photo.urls.thumb,
                photographer: photo.user.name,
                photographerUrl: photo.user.links.html,
                downloadLocation: photo.links.download_location,
                alt: photo.alt_description || category
            }));

        } catch (error) {
            console.error('[ImageMemory] Search error:', error);
            return [];
        }
    }

    /**
     * Generate study session with images
     */
    async generateImageStudySession(words, options = {}) {
        const {
            sessionSize = 20,
            includeReview = true,
            difficulty = 'medium'
        } = options;

        // Select words for this session
        const sessionWords = words.slice(0, sessionSize);

        // Fetch images for all words
        const images = await this.getImagesForWords(
            sessionWords.map(w => ({
                word: w.word,
                hint: w.category || w.partOfSpeech
            }))
        );

        // Combine words with images
        const studyItems = sessionWords.map((word, index) => ({
            ...word,
            image: images[index],
            studyMode: 'image-memory'
        }));

        // Generate session ID
        const sessionId = `img-session-${Date.now()}`;

        // Save session to local storage
        localStorage.setItem(`imageStudySession-${sessionId}`, JSON.stringify({
            sessionId,
            words: studyItems,
            createdAt: Date.now(),
            difficulty,
            includeReview
        }));

        return {
            sessionId,
            words: studyItems
        };
    }

    /**
     * Get study session by ID
     */
    getStudySession(sessionId) {
        const data = localStorage.getItem(`imageStudySession-${sessionId}`);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Delete study session
     */
    deleteStudySession(sessionId) {
        localStorage.removeItem(`imageStudySession-${sessionId}`);
    }
}
