/**
 * Controls - Playback control UI component
 * Handles play/pause, reset, and speed controls
 */

import { eventBus } from '../core/EventBus.js';

export class Controls {
    constructor() {
        this.isPlaying = false;
        this.speed = 1;

        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');

        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });

        // Speed slider
        this.speedSlider.addEventListener('input', (e) => {
            this.setSpeed(parseFloat(e.target.value));
        });

        // Listen to scene events
        eventBus.on('scene:play', () => {
            this.updatePlayState(true);
        });

        eventBus.on('scene:pause', () => {
            this.updatePlayState(false);
        });

        eventBus.on('scene:reset', () => {
            this.updatePlayState(false);
        });
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        eventBus.emit('controls:playPause', this.isPlaying);
        this.updatePlayState(this.isPlaying);
    }

    /**
     * Reset the scene
     */
    reset() {
        this.isPlaying = false;
        eventBus.emit('controls:reset');
        this.updatePlayState(false);
    }

    /**
     * Set playback speed
     * @param {number} speed
     */
    setSpeed(speed) {
        this.speed = speed;
        this.speedValue.textContent = `${speed}x`;
        eventBus.emit('controls:speedChange', speed);
    }

    /**
     * Update play/pause button state
     * @param {boolean} playing
     */
    updatePlayState(playing) {
        this.isPlaying = playing;

        const playIcon = this.playPauseBtn.querySelector('.play-icon');
        const pauseIcon = this.playPauseBtn.querySelector('.pause-icon');

        if (playing) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }

    /**
     * Disable controls (during scene transitions)
     */
    disable() {
        this.playPauseBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.speedSlider.disabled = true;
    }

    /**
     * Enable controls
     */
    enable() {
        this.playPauseBtn.disabled = false;
        this.resetBtn.disabled = false;
        this.speedSlider.disabled = false;
    }
}
