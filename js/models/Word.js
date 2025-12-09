/**
 * Word Model - Vocabulary entry
 * Schema defined in contracts/vocab-schema.json
 */

class Word {
    constructor(data) {
        this.id = data.id;
        this.word = data.word;
        this.phonetic = data.phonetic || null;
        this.audioUrl = data.audioUrl || null;
        this.partOfSpeech = data.partOfSpeech;
        this.definitions = data.definitions || [];
        this.examples = data.examples || [];
        this.source = data.source;
        this.difficultyLevel = data.difficultyLevel;
        this.tags = data.tags || [];
    }

    /**
     * Get Chinese definition
     * @returns {string}
     */
    getChineseDefinition() {
        return this.definitions[0]?.chinese || '';
    }

    /**
     * Get English definition
     * @returns {string}
     */
    getEnglishDefinition() {
        return this.definitions[0]?.english || '';
    }

    /**
     * Get first example sentence
     * @returns {string}
     */
    getExample() {
        return this.examples[0] || this.definitions[0]?.example || '';
    }

    /**
     * Validate word data
     * @returns {boolean}
     */
    isValid() {
        return !!(
            this.id &&
            this.word &&
            this.partOfSpeech &&
            this.definitions.length > 0 &&
            this.source &&
            typeof this.difficultyLevel === 'number' &&
            this.difficultyLevel >= 1 &&
            this.difficultyLevel <= 5
        );
    }
}

export default Word;
