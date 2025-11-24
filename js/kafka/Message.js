/**
 * Message - Visual representation of a Kafka message
 * Small animated element that flows through the system
 */

export class Message {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.element = null;
    }

    /**
     * Create SVG group for message
     * @returns {SVGGElement}
     */
    render() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'message');
        group.setAttribute('data-entity', 'message');
        group.setAttribute('data-id', this.id);
        // Position the group at the initial coordinates
        group.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Outer glow circle - centered at (0, 0) relative to group
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', 0);
        glow.setAttribute('cy', 0);
        glow.setAttribute('r', this.radius + 4);
        glow.setAttribute('fill', '#FBBF24');
        glow.setAttribute('opacity', '0.3');

        // Main message circle - centered at (0, 0) relative to group
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', this.radius);
        circle.setAttribute('fill', '#FBBF24');
        circle.setAttribute('opacity', '1');

        // Inner highlight
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', -2);
        highlight.setAttribute('cy', -2);
        highlight.setAttribute('r', 3);
        highlight.setAttribute('fill', '#FDE68A');
        highlight.setAttribute('opacity', '0.8');

        // Shadow for depth
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        shadow.setAttribute('cx', 0);
        shadow.setAttribute('cy', this.radius + 3);
        shadow.setAttribute('rx', this.radius - 2);
        shadow.setAttribute('ry', 2);
        shadow.setAttribute('fill', '#000000');
        shadow.setAttribute('opacity', '0.2');

        group.appendChild(shadow);
        group.appendChild(glow);
        group.appendChild(circle);
        group.appendChild(highlight);

        this.element = group;
        return group;
    }

    /**
     * Update message position
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;

        if (this.element) {
            // Update the group's transform to move the message
            this.element.setAttribute('transform', `translate(${x}, ${y})`);
        }
    }

    /**
     * Get current position
     * @returns {{x: number, y: number}}
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Remove message from DOM
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
