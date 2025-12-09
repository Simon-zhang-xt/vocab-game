/**
 * VocabService - Vocabulary data management
 */

import StorageService from './StorageService.js';
import Word from '../models/Word.js';

class VocabService {
    /**
     * Get word by ID
     * @param {string} wordId
     * @returns {Word|null}
     */
    static getWord(wordId) {
        const wordData = StorageService.findById(StorageService.KEYS.WORDS, wordId);
        return wordData ? new Word(wordData) : null;
    }

    /**
     * Get multiple words by IDs
     * @param {string[]} wordIds
     * @returns {Word[]}
     */
    static getWords(wordIds) {
        return wordIds
            .map(id => this.getWord(id))
            .filter(word => word !== null);
    }

    /**
     * Search words by text
     * @param {string} query
     * @param {number} [limit=20]
     * @returns {Word[]}
     */
    static searchWords(query, limit = 20) {
        const lowerQuery = query.toLowerCase();
        const allWords = StorageService.get(StorageService.KEYS.WORDS) || [];

        return allWords
            .filter(wordData => {
                const word = wordData.word.toLowerCase();
                const chinese = wordData.definitions[0]?.chinese || '';
                return word.includes(lowerQuery) || chinese.includes(query);
            })
            .slice(0, limit)
            .map(wordData => new Word(wordData));
    }

    /**
     * Get words by source
     * @param {string} source - 'toefl' or 'ielts'
     * @returns {Word[]}
     */
    static getWordsBySource(source) {
        const words = StorageService.findAll(
            StorageService.KEYS.WORDS,
            word => word.source === source
        );
        return words.map(wordData => new Word(wordData));
    }

    /**
     * Get random words for practice
     * @param {number} count
     * @param {string} [source]
     * @returns {Word[]}
     */
    static getRandomWords(count, source = null) {
        let words = StorageService.get(StorageService.KEYS.WORDS) || [];

        if (source) {
            words = words.filter(w => w.source === source);
        }

        // Shuffle and take count
        const shuffled = words.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(wordData => new Word(wordData));
    }
}

export default VocabService;
