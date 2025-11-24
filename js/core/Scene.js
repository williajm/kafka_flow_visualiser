/**
 * Scene - Base class for lesson visualizations
 * Each lesson extends this class and implements its own visualization logic
 */

import { Animator } from './Animator.js';
import { eventBus } from './EventBus.js';

export class Scene {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.config = {
            title: 'Untitled Lesson',
            description: 'No description provided',
            ...config
        };

        this.animator = new Animator();
        this.elements = new Map(); // Store SVG elements by ID
        this.isInitialized = false;
    }

    /**
     * Initialize the scene - called when scene becomes active
     * Override in subclasses to set up initial visualization
     */
    async init() {
        if (this.isInitialized) return;

        this.clear();
        await this.setup();
        this.isInitialized = true;

        // Emit scene ready event
        eventBus.emit('scene:ready', {
            title: this.config.title,
            description: this.config.description
        });
    }

    /**
     * Setup method - override in subclasses
     * Create and position all visual elements
     */
    async setup() {
        // Override in subclass
    }

    /**
     * Start the animation sequence
     */
    play() {
        this.animator.play();
        eventBus.emit('scene:play');
    }

    /**
     * Pause the animation
     */
    pause() {
        this.animator.pause();
        eventBus.emit('scene:pause');
    }

    /**
     * Reset the scene to initial state
     */
    reset() {
        this.animator.reset();
        eventBus.emit('scene:reset');
    }

    /**
     * Set playback speed
     * @param {number} speed
     */
    setSpeed(speed) {
        this.animator.setSpeed(speed);
    }

    /**
     * Clear all elements from canvas
     */
    clear() {
        const vizGroup = this.canvas.querySelector('#visualization');
        if (vizGroup) {
            vizGroup.innerHTML = '';
        }
        this.elements.clear();
    }

    /**
     * Add an element to the scene
     * @param {string} id - Unique identifier
     * @param {SVGElement} element - SVG element to add
     */
    addElement(id, element) {
        element.setAttribute('data-id', id);
        this.elements.set(id, element);

        const vizGroup = this.canvas.querySelector('#visualization');
        if (vizGroup) {
            vizGroup.appendChild(element);
        }

        return element;
    }

    /**
     * Get an element by ID
     * @param {string} id
     * @returns {SVGElement|undefined}
     */
    getElement(id) {
        return this.elements.get(id);
    }

    /**
     * Remove an element from the scene
     * @param {string} id
     */
    removeElement(id) {
        const element = this.elements.get(id);
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        this.elements.delete(id);
    }

    /**
     * Create SVG group element
     * @param {string} id
     * @param {Object} attrs - Additional attributes
     * @returns {SVGGElement}
     */
    createGroup(id, attrs = {}) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', id);

        Object.entries(attrs).forEach(([key, value]) => {
            group.setAttribute(key, value);
        });

        return this.addElement(id, group);
    }

    /**
     * Create SVG text element
     * @param {string} text - Text content
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} attrs - Additional attributes
     * @returns {SVGTextElement}
     */
    createText(text, x, y, attrs = {}) {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.textContent = text;
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('fill', '#E2E8F0');
        textEl.setAttribute('font-family', 'inherit');
        textEl.setAttribute('text-anchor', 'middle');

        Object.entries(attrs).forEach(([key, value]) => {
            textEl.setAttribute(key, value);
        });

        return textEl;
    }

    /**
     * Create SVG rectangle
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {Object} attrs
     * @returns {SVGRectElement}
     */
    createRect(x, y, width, height, attrs = {}) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);

        Object.entries(attrs).forEach(([key, value]) => {
            rect.setAttribute(key, value);
        });

        return rect;
    }

    /**
     * Create SVG circle
     * @param {number} cx
     * @param {number} cy
     * @param {number} r
     * @param {Object} attrs
     * @returns {SVGCircleElement}
     */
    createCircle(cx, cy, r, attrs = {}) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);

        Object.entries(attrs).forEach(([key, value]) => {
            circle.setAttribute(key, value);
        });

        return circle;
    }

    /**
     * Create SVG line
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {Object} attrs
     * @returns {SVGLineElement}
     */
    createLine(x1, y1, x2, y2, attrs = {}) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);

        Object.entries(attrs).forEach(([key, value]) => {
            line.setAttribute(key, value);
        });

        return line;
    }

    /**
     * Cleanup - destroy animator and clear elements
     */
    destroy() {
        this.animator.destroy();
        this.clear();
        this.isInitialized = false;
    }
}
