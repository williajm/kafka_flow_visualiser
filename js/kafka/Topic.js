/**
 * Topic - Visual representation of a Kafka topic
 * Stores messages in partitions
 */

export class Topic {
    constructor(id, x, y, partitionCount = 1) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.partitionCount = partitionCount;
        this.width = 140;
        this.height = 100;
        this.element = null;
    }

    /**
     * Create SVG group for topic
     * @returns {SVGGElement}
     */
    render() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'topic');
        group.setAttribute('data-entity', 'topic');
        group.setAttribute('data-id', this.id);
        group.style.cursor = 'pointer';

        if (this.partitionCount === 1) {
            // Single partition - simpler visualization
            this.renderSinglePartition(group);
        } else {
            // Multiple partitions - stacked view
            this.renderMultiplePartitions(group);
        }

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', this.x + this.width / 2);
        label.setAttribute('y', this.y + this.height + 20);
        label.setAttribute('fill', '#E2E8F0');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', '600');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = 'Topic';

        // Partition count badge
        if (this.partitionCount > 1) {
            const badge = this.createPartitionBadge();
            group.appendChild(badge);
        }

        group.appendChild(label);

        this.element = group;
        return group;
    }

    /**
     * Render single partition visualization
     * @param {SVGGElement} group
     */
    renderSinglePartition(group) {
        // Cylinder-like shape (simplified)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', this.x);
        rect.setAttribute('y', this.y);
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('rx', 12);
        rect.setAttribute('fill', 'url(#topicGradient)');
        rect.setAttribute('opacity', '0.9');

        // Border
        const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        border.setAttribute('x', this.x);
        border.setAttribute('y', this.y);
        border.setAttribute('width', this.width);
        border.setAttribute('height', this.height);
        border.setAttribute('rx', 12);
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#60A5FA');
        border.setAttribute('stroke-width', 2);

        // Storage lines (to indicate data storage)
        for (let i = 0; i < 3; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const yPos = this.y + 25 + (i * 20);
            line.setAttribute('x1', this.x + 20);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', this.x + this.width - 20);
            line.setAttribute('y2', yPos);
            line.setAttribute('stroke', '#ffffff');
            line.setAttribute('stroke-width', 2);
            line.setAttribute('opacity', '0.3');
            line.setAttribute('stroke-linecap', 'round');
            group.appendChild(line);
        }

        group.appendChild(rect);
        group.appendChild(border);
    }

    /**
     * Render multiple partitions visualization
     * @param {SVGGElement} group
     */
    renderMultiplePartitions(group) {
        const partitionHeight = 25;
        const gap = 5;
        const totalHeight = (partitionHeight * this.partitionCount) + (gap * (this.partitionCount - 1));
        const startY = this.y + (this.height - totalHeight) / 2;

        for (let i = 0; i < this.partitionCount; i++) {
            const partitionY = startY + (i * (partitionHeight + gap));

            const partition = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            partition.setAttribute('x', this.x);
            partition.setAttribute('y', partitionY);
            partition.setAttribute('width', this.width);
            partition.setAttribute('height', partitionHeight);
            partition.setAttribute('rx', 6);
            partition.setAttribute('fill', '#3B82F6');
            partition.setAttribute('opacity', '0.8');
            partition.setAttribute('stroke', '#60A5FA');
            partition.setAttribute('stroke-width', 2);

            group.appendChild(partition);
        }
    }

    /**
     * Create partition count badge
     * @returns {SVGGElement}
     */
    createPartitionBadge() {
        const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        badge.setAttribute('x', this.x + this.width - 30);
        badge.setAttribute('y', this.y - 10);
        badge.setAttribute('width', 40);
        badge.setAttribute('height', 20);
        badge.setAttribute('rx', 10);
        badge.setAttribute('fill', '#22D3EE');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.x + this.width - 10);
        text.setAttribute('y', this.y + 5);
        text.setAttribute('fill', '#0A0E27');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', '700');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = `${this.partitionCount}P`;

        badgeGroup.appendChild(badge);
        badgeGroup.appendChild(text);

        return badgeGroup;
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
     * Get center point for message emission to consumers
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
            type: 'Topic',
            title: 'Kafka Topic',
            description: 'Topics are categories or feeds to which messages are published. They are divided into partitions for scalability and parallel processing.',
            details: {
                'ID': this.id,
                'Partitions': this.partitionCount,
                'Replication': 'N/A (Visualization)'
            }
        };
    }
}
