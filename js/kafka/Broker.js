/**
 * Broker - Visual representation of a Kafka broker server
 * Contains partitions and shows distributed nature of Kafka
 */

export class Broker {
    constructor(id, x, y, partitionIndex) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.partitionIndex = partitionIndex;
        this.width = 100;
        this.height = 90;
        this.element = null;
    }

    /**
     * Create SVG group for broker
     * @returns {SVGGElement}
     */
    render() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'broker');
        group.setAttribute('data-entity', 'broker');
        group.setAttribute('data-id', this.id);

        // Background box
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', this.x);
        rect.setAttribute('y', this.y);
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', 8);
        rect.setAttribute('fill', '#1E2749');
        rect.setAttribute('opacity', '0.6');
        rect.setAttribute('stroke', '#2D3561');
        rect.setAttribute('stroke-width', 1);

        // Broker label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', this.x + this.width / 2);
        label.setAttribute('y', this.y + 15);
        label.setAttribute('fill', '#94A3B8');
        label.setAttribute('font-size', '10');
        label.setAttribute('font-weight', '600');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = `Broker ${this.partitionIndex}`;

        // Partition box inside broker
        const partitionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        partitionRect.setAttribute('x', this.x + 10);
        partitionRect.setAttribute('y', this.y + 25);
        partitionRect.setAttribute('width', this.width - 20);
        partitionRect.setAttribute('height', 50);
        partitionRect.setAttribute('rx', 6);
        partitionRect.setAttribute('fill', '#3B82F6');
        partitionRect.setAttribute('opacity', '0.8');
        partitionRect.setAttribute('stroke', '#60A5FA');
        partitionRect.setAttribute('stroke-width', 2);

        // Partition label
        const partLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        partLabel.setAttribute('x', this.x + this.width / 2);
        partLabel.setAttribute('y', this.y + 55);
        partLabel.setAttribute('fill', '#ffffff');
        partLabel.setAttribute('font-size', '12');
        partLabel.setAttribute('font-weight', '700');
        partLabel.setAttribute('text-anchor', 'middle');
        partLabel.textContent = `P${this.partitionIndex}`;

        group.appendChild(rect);
        group.appendChild(label);
        group.appendChild(partitionRect);
        group.appendChild(partLabel);

        this.element = group;
        return group;
    }

    /**
     * Get partition center point
     * @returns {{x: number, y: number}}
     */
    getPartitionCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + 50
        };
    }

    /**
     * Get receive point (left side of partition)
     * @returns {{x: number, y: number}}
     */
    getReceivePoint() {
        return {
            x: this.x + 10,
            y: this.y + 50
        };
    }

    /**
     * Get emit point (right side of partition)
     * @returns {{x: number, y: number}}
     */
    getEmitPoint() {
        return {
            x: this.x + this.width - 10,
            y: this.y + 50
        };
    }

    /**
     * Get info for detail panel
     * @returns {Object}
     */
    getInfo() {
        return {
            type: 'Broker',
            title: `Kafka Broker ${this.partitionIndex}`,
            description: 'A Kafka broker is a server in the Kafka cluster. Each broker hosts one or more partitions, distributing the load across the cluster for fault tolerance and scalability.',
            details: {
                'Broker ID': this.partitionIndex,
                'Hosts Partition': `P${this.partitionIndex}`,
                'Role': 'Data storage and serving'
            }
        };
    }
}
