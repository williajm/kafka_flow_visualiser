/**
 * Producer - Visual representation of a Kafka producer
 * Creates and sends messages to topics
 */

export class Producer {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = 120;
        this.height = 80;
        this.element = null;
    }

    /**
     * Create SVG group for producer
     * @returns {SVGGElement}
     */
    render() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'producer');
        group.setAttribute('data-entity', 'producer');
        group.setAttribute('data-id', this.id);
        group.style.cursor = 'pointer';

        // Background rectangle with gradient
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', this.x);
        rect.setAttribute('y', this.y);
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', 12);
        rect.setAttribute('fill', 'url(#producerGradient)');
        rect.setAttribute('opacity', '0.9');

        // Border
        const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        border.setAttribute('x', this.x);
        border.setAttribute('y', this.y);
        border.setAttribute('width', this.width);
        border.setAttribute('height', this.height);
        border.setAttribute('rx', 12);
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#A78BFA');
        border.setAttribute('stroke-width', 2);

        // Icon (simplified producer symbol)
        const iconGroup = this.createIcon();

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', this.x + this.width / 2);
        label.setAttribute('y', this.y + this.height - 15);
        label.setAttribute('fill', '#ffffff');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', '600');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = 'Producer';

        group.appendChild(rect);
        group.appendChild(border);
        group.appendChild(iconGroup);
        group.appendChild(label);

        this.element = group;
        return group;
    }

    /**
     * Create producer icon
     * @returns {SVGGElement}
     */
    createIcon() {
        const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Simple arrow pointing right
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const centerX = this.x + this.width / 2;
        const centerY = this.y + 30;

        arrow.setAttribute('d', `
            M ${centerX - 15} ${centerY - 10}
            L ${centerX + 5} ${centerY - 10}
            L ${centerX + 5} ${centerY - 15}
            L ${centerX + 15} ${centerY}
            L ${centerX + 5} ${centerY + 15}
            L ${centerX + 5} ${centerY + 10}
            L ${centerX - 15} ${centerY + 10}
            Z
        `);
        arrow.setAttribute('fill', '#ffffff');
        arrow.setAttribute('opacity', '0.9');

        iconGroup.appendChild(arrow);
        return iconGroup;
    }

    /**
     * Get center point for message emission
     * @returns {{x: number, y: number}}
     */
    getEmitPoint() {
        return {
            x: this.x + this.width,
            y: this.y + this.height / 2
        };
    }

    /**
     * Get info for detail panel
     * @returns {Object}
     */
    getInfo() {
        return {
            type: 'Producer',
            title: 'Kafka Producer',
            description: 'Producers publish messages to Kafka topics. They serialize data and determine which partition to send each message to.',
            details: {
                'ID': this.id,
                'Role': 'Message Publisher'
            }
        };
    }
}
