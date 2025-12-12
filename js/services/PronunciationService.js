/**
 * Pronunciation Service
 * V3.4 Feature: AI-powered pronunciation training and assessment
 * Uses Web Speech API for speech recognition and synthesis
 */

export default class PronunciationService {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isRecording = false;
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;

        // Check browser support
        this.isSupported = this.checkBrowserSupport();

        // Initialize user pronunciation history
        this.pronunciationHistory = this.loadPronunciationHistory();

        // Scoring thresholds
        this.scoringConfig = {
            excellent: 90,
            good: 75,
            fair: 60,
            poor: 0
        };
    }

    /**
     * Check if Web Speech API is supported
     */
    checkBrowserSupport() {
        const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        const hasSynthesis = 'speechSynthesis' in window;
        const hasAudioContext = 'AudioContext' in window || 'webkitAudioContext' in window;

        return {
            recognition: hasRecognition,
            synthesis: hasSynthesis,
            audioContext: hasAudioContext,
            isFullySupported: hasRecognition && hasSynthesis && hasAudioContext
        };
    }

    /**
     * Initialize speech recognition
     */
    initializeRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            throw new Error('Speech Recognition not supported in this browser');
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = 'en-US'; // Default to American English
    }

    /**
     * Initialize audio context for waveform visualization
     */
    async initializeAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            return true;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            return false;
        }
    }

    /**
     * Get waveform data for visualization
     */
    getWaveformData() {
        if (!this.analyser) return null;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        return dataArray;
    }

    /**
     * Get frequency data for visualization
     */
    getFrequencyData() {
        if (!this.analyser) return null;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        return dataArray;
    }

    /**
     * Play word pronunciation using Text-to-Speech
     */
    async speak(text, options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                reject(new Error('Speech Synthesis not supported'));
                return;
            }

            // Cancel any ongoing speech
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            // Configure utterance
            utterance.lang = options.lang || 'en-US';
            utterance.rate = options.rate || 0.9; // Slightly slower for learning
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;

            // Try to use a native English voice
            const voices = this.synthesis.getVoices();
            const englishVoice = voices.find(voice =>
                voice.lang.startsWith('en') && voice.localService
            );
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            utterance.onend = () => resolve();
            utterance.onerror = (error) => reject(error);

            this.synthesis.speak(utterance);
        });
    }

    /**
     * Record user pronunciation
     */
    async startRecording(targetWord) {
        if (!this.isSupported.recognition) {
            throw new Error('Speech Recognition not supported');
        }

        if (!this.recognition) {
            this.initializeRecognition();
        }

        // Initialize audio context if not already done
        if (!this.audioContext) {
            await this.initializeAudioContext();
        }

        return new Promise((resolve, reject) => {
            this.isRecording = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const results = [];

                for (let i = 0; i < event.results[0].length; i++) {
                    results.push({
                        transcript: event.results[0][i].transcript,
                        confidence: event.results[0][i].confidence
                    });
                }

                this.isRecording = false;

                // Calculate pronunciation score
                const score = this.calculatePronunciationScore(
                    targetWord,
                    results[0].transcript,
                    results[0].confidence
                );

                resolve({
                    targetWord,
                    results,
                    score,
                    timestamp: Date.now()
                });
            };

            this.recognition.onerror = (event) => {
                this.isRecording = false;
                reject(new Error(`Speech recognition error: ${event.error}`));
            };

            this.recognition.onend = () => {
                this.isRecording = false;
            };

            try {
                this.recognition.start();
            } catch (error) {
                this.isRecording = false;
                reject(error);
            }
        });
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
        }
    }

    /**
     * Calculate pronunciation score
     * Compares user's pronunciation with target word
     */
    calculatePronunciationScore(targetWord, spokenWord, confidence) {
        // Normalize both words
        const target = targetWord.toLowerCase().trim();
        const spoken = spokenWord.toLowerCase().trim();

        // Exact match
        if (target === spoken) {
            return {
                score: Math.round(confidence * 100),
                accuracy: 100,
                feedback: 'Perfect pronunciation!',
                level: 'excellent'
            };
        }

        // Calculate similarity using Levenshtein distance
        const similarity = this.calculateSimilarity(target, spoken);
        const accuracyScore = Math.round(similarity * 100);

        // Adjust score based on confidence
        const finalScore = Math.round((accuracyScore * 0.7) + (confidence * 100 * 0.3));

        // Determine feedback level
        let level, feedback;
        if (finalScore >= this.scoringConfig.excellent) {
            level = 'excellent';
            feedback = 'Excellent pronunciation!';
        } else if (finalScore >= this.scoringConfig.good) {
            level = 'good';
            feedback = 'Good job! Keep practicing.';
        } else if (finalScore >= this.scoringConfig.fair) {
            level = 'fair';
            feedback = 'Not bad, but needs improvement.';
        } else {
            level = 'poor';
            feedback = 'Try again. Listen carefully and repeat.';
        }

        return {
            score: finalScore,
            accuracy: accuracyScore,
            confidence: Math.round(confidence * 100),
            feedback,
            level,
            spokenWord: spoken
        };
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;

        // Create distance matrix
        const matrix = Array(len1 + 1).fill(null).map(() =>
            Array(len2 + 1).fill(0)
        );

        // Initialize first row and column
        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

        // Calculate distances
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        const distance = matrix[len1][len2];
        const maxLen = Math.max(len1, len2);

        return maxLen === 0 ? 1 : (1 - distance / maxLen);
    }

    /**
     * Get available voices for TTS
     */
    getAvailableVoices() {
        if (!this.synthesis) return [];

        const voices = this.synthesis.getVoices();

        // Filter and categorize English voices
        const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));

        return englishVoices.map(voice => ({
            name: voice.name,
            lang: voice.lang,
            localService: voice.localService,
            default: voice.default,
            // Categorize by accent
            accent: this.categorizeAccent(voice.lang)
        }));
    }

    /**
     * Categorize voice accent based on language code
     */
    categorizeAccent(langCode) {
        const accentMap = {
            'en-US': 'American',
            'en-GB': 'British',
            'en-AU': 'Australian',
            'en-CA': 'Canadian',
            'en-IN': 'Indian',
            'en-NZ': 'New Zealand',
            'en-ZA': 'South African'
        };

        return accentMap[langCode] || 'Other';
    }

    /**
     * Save pronunciation attempt to history
     */
    savePronunciationAttempt(wordId, result) {
        if (!this.pronunciationHistory[wordId]) {
            this.pronunciationHistory[wordId] = {
                attempts: [],
                bestScore: 0,
                totalAttempts: 0,
                averageScore: 0
            };
        }

        const wordHistory = this.pronunciationHistory[wordId];
        wordHistory.attempts.push(result);
        wordHistory.totalAttempts++;

        // Update best score
        if (result.score.score > wordHistory.bestScore) {
            wordHistory.bestScore = result.score.score;
        }

        // Calculate average score
        const sum = wordHistory.attempts.reduce((acc, att) => acc + att.score.score, 0);
        wordHistory.averageScore = Math.round(sum / wordHistory.totalAttempts);

        // Keep only last 10 attempts
        if (wordHistory.attempts.length > 10) {
            wordHistory.attempts = wordHistory.attempts.slice(-10);
        }

        this.savePronunciationHistory();

        return wordHistory;
    }

    /**
     * Get pronunciation history for a word
     */
    getWordPronunciationHistory(wordId) {
        return this.pronunciationHistory[wordId] || null;
    }

    /**
     * Get overall pronunciation statistics
     */
    getPronunciationStatistics() {
        const wordIds = Object.keys(this.pronunciationHistory);

        if (wordIds.length === 0) {
            return {
                totalWords: 0,
                totalAttempts: 0,
                averageScore: 0,
                excellentWords: 0,
                goodWords: 0,
                needsPractice: 0
            };
        }

        let totalAttempts = 0;
        let totalScore = 0;
        let excellentWords = 0;
        let goodWords = 0;
        let needsPractice = 0;

        wordIds.forEach(wordId => {
            const history = this.pronunciationHistory[wordId];
            totalAttempts += history.totalAttempts;
            totalScore += history.bestScore;

            if (history.bestScore >= this.scoringConfig.excellent) {
                excellentWords++;
            } else if (history.bestScore >= this.scoringConfig.good) {
                goodWords++;
            } else {
                needsPractice++;
            }
        });

        return {
            totalWords: wordIds.length,
            totalAttempts,
            averageScore: Math.round(totalScore / wordIds.length),
            excellentWords,
            goodWords,
            needsPractice
        };
    }

    /**
     * Get words that need pronunciation practice
     */
    getWordsNeedingPractice(minScore = 75) {
        return Object.entries(this.pronunciationHistory)
            .filter(([_, history]) => history.bestScore < minScore)
            .map(([wordId, history]) => ({
                wordId,
                bestScore: history.bestScore,
                totalAttempts: history.totalAttempts,
                averageScore: history.averageScore
            }))
            .sort((a, b) => a.bestScore - b.bestScore);
    }

    /**
     * Load pronunciation history from localStorage
     */
    loadPronunciationHistory() {
        try {
            const data = localStorage.getItem('pronunciationHistory');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to load pronunciation history:', error);
            return {};
        }
    }

    /**
     * Save pronunciation history to localStorage
     */
    savePronunciationHistory() {
        try {
            localStorage.setItem('pronunciationHistory', JSON.stringify(this.pronunciationHistory));
        } catch (error) {
            console.error('Failed to save pronunciation history:', error);
        }
    }

    /**
     * Reset pronunciation history for a word
     */
    resetWordHistory(wordId) {
        delete this.pronunciationHistory[wordId];
        this.savePronunciationHistory();
    }

    /**
     * Clear all pronunciation history
     */
    clearAllHistory() {
        this.pronunciationHistory = {};
        this.savePronunciationHistory();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.recognition) {
            this.recognition.abort();
            this.recognition = null;
        }

        if (this.synthesis) {
            this.synthesis.cancel();
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isRecording = false;
    }
}
