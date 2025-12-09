/**
 * AudioManager - Web Audio API wrapper for sound effects
 * Implementation per research.md recommendation
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.7;
    }

    /**
     * Initialize audio context (requires user interaction on iOS)
     */
    init() {
        if (!this.context) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.context = new AudioContext();
                console.log('AudioManager initialized');
            } catch (error) {
                console.warn('Web Audio API not supported:', error);
                this.enabled = false;
            }
        }

        // Resume context if suspended (iOS requirement)
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    /**
     * Load audio file
     * @param {string} name - Sound name
     * @param {string} url - Audio file URL
     * @returns {Promise<void>}
     */
    async load(name, url) {
        if (!this.enabled || !this.context) return;

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.sounds[name] = await this.context.decodeAudioData(arrayBuffer);
            console.log(`Loaded sound: ${name}`);
        } catch (error) {
            console.warn(`Failed to load sound "${name}":`, error);
        }
    }

    /**
     * Play sound
     * @param {string} name - Sound name
     */
    play(name) {
        if (!this.enabled || !this.context || !this.sounds[name]) {
            return;
        }

        try {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[name];

            const gainNode = this.context.createGain();
            gainNode.gain.value = this.volume;

            source.connect(gainNode);
            gainNode.connect(this.context.destination);
            source.start(0);
        } catch (error) {
            console.warn(`Failed to play sound "${name}":`, error);
        }
    }

    /**
     * Set volume
     * @param {number} value - Volume (0-1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }

    /**
     * Enable/disable audio
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Preload common sound effects
     * @returns {Promise<void>}
     */
    async preloadSounds() {
        const sounds = {
            correct: 'assets/audio/correct.mp3',
            incorrect: 'assets/audio/incorrect.mp3',
            complete: 'assets/audio/complete.mp3'
        };

        await Promise.allSettled(
            Object.entries(sounds).map(([name, url]) => this.load(name, url))
        );
    }
}

// Create singleton instance
const audioManager = new AudioManager();

// Initialize on first user interaction
let initialized = false;
document.addEventListener('click', () => {
    if (!initialized) {
        audioManager.init();
        initialized = true;
    }
}, { once: true });

export default audioManager;
