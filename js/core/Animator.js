/**
 * Animator - Wrapper around GSAP for consistent, controllable animations
 * Provides timeline management and playback control
 */

export class Animator {
    constructor() {
        this.timeline = null;
        this.speed = 1;
        this.isPlaying = false;
    }

    /**
     * Create a new GSAP timeline
     * @param {Object} config - GSAP timeline configuration
     * @returns {gsap.core.Timeline}
     */
    createTimeline(config = {}) {
        this.timeline = gsap.timeline({
            paused: true,
            ...config
        });
        return this.timeline;
    }

    /**
     * Play the current timeline
     */
    play() {
        if (!this.timeline) return;
        this.timeline.play();
        this.isPlaying = true;
    }

    /**
     * Pause the current timeline
     */
    pause() {
        if (!this.timeline) return;
        this.timeline.pause();
        this.isPlaying = false;
    }

    /**
     * Toggle play/pause
     */
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Reset timeline to beginning
     */
    reset() {
        if (!this.timeline) return;
        this.timeline.seek(0);
        this.timeline.pause();
        this.isPlaying = false;
    }

    /**
     * Set playback speed
     * @param {number} speed - Playback speed multiplier (0.5 = half speed, 2 = double speed)
     */
    setSpeed(speed) {
        this.speed = speed;
        if (this.timeline) {
            this.timeline.timeScale(speed);
        }
    }

    /**
     * Get current speed
     * @returns {number}
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * Check if timeline is currently playing
     * @returns {boolean}
     */
    getIsPlaying() {
        return this.isPlaying;
    }

    /**
     * Animate an element to a position
     * @param {Element} element - DOM or SVG element
     * @param {Object} props - GSAP animation properties
     * @param {number} duration - Animation duration in seconds
     * @returns {gsap.core.Timeline}
     */
    to(element, props, duration = 1) {
        return gsap.to(element, {
            duration,
            ease: 'power2.out',
            ...props
        });
    }

    /**
     * Animate an element from a position
     * @param {Element} element - DOM or SVG element
     * @param {Object} props - GSAP animation properties
     * @param {number} duration - Animation duration in seconds
     * @returns {gsap.core.Timeline}
     */
    from(element, props, duration = 1) {
        return gsap.from(element, {
            duration,
            ease: 'power2.out',
            ...props
        });
    }

    /**
     * Set properties without animation
     * @param {Element} element - DOM or SVG element
     * @param {Object} props - Properties to set
     */
    set(element, props) {
        gsap.set(element, props);
    }

    /**
     * Animate message flow along a path
     * @param {Element} element - Message element
     * @param {Object} start - Start coordinates {x, y}
     * @param {Object} end - End coordinates {x, y}
     * @param {number} duration - Duration in seconds
     * @returns {gsap.core.Tween}
     */
    animateMessageFlow(element, start, end, duration = 1.5) {
        // Calculate control point for bezier curve (slight arc)
        const controlX = (start.x + end.x) / 2;
        const controlY = Math.min(start.y, end.y) - 50;

        return gsap.to(element, {
            duration,
            ease: 'power1.inOut',
            motionPath: {
                path: [
                    { x: start.x, y: start.y },
                    { x: controlX, y: controlY },
                    { x: end.x, y: end.y }
                ],
                curviness: 1.5
            }
        });
    }

    /**
     * Create a pulsing glow effect
     * @param {Element} element - Element to pulse
     * @param {string} color - Glow color
     * @returns {gsap.core.Tween}
     */
    pulseGlow(element, color = '#FBBF24') {
        return gsap.to(element, {
            duration: 0.8,
            filter: `drop-shadow(0 0 12px ${color})`,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }

    /**
     * Cleanup - kill all animations
     */
    destroy() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }
        this.isPlaying = false;
    }
}
