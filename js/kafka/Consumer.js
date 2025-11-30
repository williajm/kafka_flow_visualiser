/**
 * Consumer - Visual representation of a Kafka consumer
 * Consumes and processes messages from topics
 */

export class Consumer {
    constructor(id, x, y, groupId = null) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.groupId = groupId;
        this.width = 120;
        this.height = 80;
        this.element = null;
    }

    /**
     * Create SVG group for consumer
     * @returns {SVGGElement}
     */
    render() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'consumer');
        group.setAttribute('data-entity', 'consumer');
        group.setAttribute('data-id', this.id);
        group.style.cursor = 'pointer';

        // Background rectangle with gradient
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', this.x);
        rect.setAttribute('y', this.y);
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', 12);
        rect.setAttribute('fill', 'url(#consumerGradient)');
        rect.setAttribute('opacity', '0.9');

        // Border
        const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        border.setAttribute('x', this.x);
        border.setAttribute('y', this.y);
        border.setAttribute('width', this.width);
        border.setAttribute('height', this.height);
        border.setAttribute('rx', 12);
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#6B9E9E');
        border.setAttribute('stroke-width', 2);

        // Icon (simplified consumer symbol)
        const iconGroup = this.createIcon();

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', this.x + this.width / 2);
        label.setAttribute('y', this.y + this.height - 15);
        label.setAttribute('fill', '#ffffff');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', '600');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = 'Consumer';

        group.appendChild(rect);
        group.appendChild(border);
        group.appendChild(iconGroup);
        group.appendChild(label);

        this.element = group;
        return group;
    }

    /**
     * Create consumer icon
     * @returns {SVGGElement}
     */
    createIcon() {
        const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Simple download/receive arrow
        const centerX = this.x + this.width / 2;
        const centerY = this.y + 30;

        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow.setAttribute('d', `
            M ${centerX - 8} ${centerY - 12}
            L ${centerX + 8} ${centerY - 12}
            L ${centerX + 8} ${centerY + 2}
            L ${centerX + 13} ${centerY + 2}
            L ${centerX} ${centerY + 12}
            L ${centerX - 13} ${centerY + 2}
            L ${centerX - 8} ${centerY + 2}
            Z
        `);
        arrow.setAttribute('fill', '#ffffff');
        arrow.setAttribute('opacity', '0.9');

        iconGroup.appendChild(arrow);
        return iconGroup;
    }

    /**
     * Get center point for message reception
     * @returns {{x: number, y: number}}
     */
    getReceivePoint() {
        return {
            x: this.x,
            y: this.y + this.height / 2
        };
    }

    /**
     * Get info for detail panel
     * @returns {Object}
     */
    getInfo() {
        return {
            type: 'Consumer',
            title: 'Kafka Consumer',
            description: 'Consumers read and process messages from Kafka topics. They can be part of consumer groups for load balancing and fault tolerance.',
            details: {
                'ID': this.id,
                'Group': this.groupId || 'None',
                'Role': 'Message Consumer'
            }
        };
    }
}
