/**
 * Lesson 2: Partitions
 * Demonstrates how messages with keys go to specific partitions
 * Shows ordering guarantees within partitions and parallel consumer processing
 */

import { Scene } from '../core/Scene.js';
import { Producer } from '../kafka/Producer.js';
import { Topic } from '../kafka/Topic.js';
import { Consumer } from '../kafka/Consumer.js';
import { Message } from '../kafka/Message.js';
import { eventBus } from '../core/EventBus.js';

export class Lesson2_Partitions extends Scene {
    constructor(canvas) {
        super(canvas, {
            title: 'Partitions & Keys',
            description: 'Messages with the same key always go to the same partition, preserving order. Multiple consumers process partitions in parallel for scalability.'
        });

        this.producer = null;
        this.topic = null;
        this.consumers = [];
        this.messages = [];
        this.messageCount = 0;
        this.partitionCount = 3;

        // Define message keys and their assigned partitions (simulating hash % 3)
        this.keyToPartition = {
            'user-A': 0,  // Color: cyan
            'user-B': 1,  // Color: yellow
            'user-C': 2   // Color: pink
        };

        this.keyColors = {
            'user-A': '#22D3EE',  // Cyan
            'user-B': '#FBBF24',  // Yellow/amber
            'user-C': '#F472B6'   // Pink
        };
    }

    /**
     * Setup the scene - create and position all entities
     */
    async setup() {
        // Create entities - topic has 3 partitions, 3 consumers (one per partition)
        this.producer = new Producer('producer-1', 100, 260);
        this.topic = new Topic('topic-1', 480, 200, this.partitionCount);

        // Create 3 consumers, vertically stacked
        const consumerStartY = 180;
        const consumerSpacing = 80;
        for (let i = 0; i < this.partitionCount; i++) {
            const consumer = new Consumer(`consumer-${i}`, 950, consumerStartY + (i * consumerSpacing), `consumer-group-1`);
            this.consumers.push(consumer);
        }

        // Render producer and topic
        const producerEl = this.producer.render();
        const topicEl = this.topic.render();

        this.addElement('producer', producerEl);
        this.addElement('topic', topicEl);

        // Render consumers
        this.consumers.forEach((consumer, i) => {
            const consumerEl = consumer.render();
            this.addElement(`consumer-${i}`, consumerEl);
        });

        // Add click handlers for info panel
        this.setupClickHandlers();

        // Create connection lines
        this.createConnectionLines();

        // Add partition labels
        this.addPartitionLabels();

        // Add consumer labels
        this.addConsumerLabels();

        // Add key legend
        this.addKeyLegend();

        // Create animation timeline
        this.createAnimationTimeline();
    }

    /**
     * Create visual connection lines between components
     */
    createConnectionLines() {
        const producerPoint = this.producer.getEmitPoint();
        const topicReceivePoint = this.topic.getReceivePoint();
        const topicEmitPoint = this.topic.getEmitPoint();

        // Producer → Topic line
        const line1 = this.createLine(
            producerPoint.x,
            producerPoint.y,
            topicReceivePoint.x,
            topicReceivePoint.y + 50,
            {
                stroke: '#2D3561',
                'stroke-width': 2,
                'stroke-dasharray': '5,5',
                opacity: 0.5
            }
        );
        this.addElement('line-producer-topic', line1);

        // Topic → Consumer lines (one per partition)
        this.consumers.forEach((consumer, i) => {
            const partitionY = this.getPartitionY(i);
            const consumerPoint = consumer.getReceivePoint();

            const line = this.createLine(
                topicEmitPoint.x,
                partitionY,
                consumerPoint.x,
                consumerPoint.y,
                {
                    stroke: '#2D3561',
                    'stroke-width': 2,
                    'stroke-dasharray': '5,5',
                    opacity: 0.5
                }
            );
            this.addElement(`line-topic-consumer-${i}`, line);
        });
    }

    /**
     * Add partition labels
     */
    addPartitionLabels() {
        const partitionHeight = 25;
        const gap = 5;
        const totalHeight = (partitionHeight * this.partitionCount) + (gap * (this.partitionCount - 1));
        const startY = this.topic.y + (this.topic.height - totalHeight) / 2;

        for (let i = 0; i < this.partitionCount; i++) {
            const partitionY = startY + (i * (partitionHeight + gap));

            const label = this.createText(
                `P${i}`,
                this.topic.x - 20,
                partitionY + partitionHeight / 2 + 5,
                {
                    'font-size': '12',
                    'font-weight': '600',
                    'fill': '#22D3EE',
                    'text-anchor': 'end'
                }
            );

            this.addElement(`partition-label-${i}`, label);
        }
    }

    /**
     * Add consumer labels
     */
    addConsumerLabels() {
        this.consumers.forEach((consumer, i) => {
            const consumerPoint = consumer.getReceivePoint();
            const label = this.createText(
                `C${i}`,
                consumerPoint.x + consumer.width + 25,
                consumerPoint.y + 5,
                {
                    'font-size': '12',
                    'font-weight': '600',
                    'fill': '#34D399',
                    'text-anchor': 'start'
                }
            );
            this.addElement(`consumer-label-${i}`, label);
        });
    }

    /**
     * Add key legend explaining message colors
     */
    addKeyLegend() {
        const legendX = 80;
        const legendY = 80;

        const title = this.createText(
            'Message Keys:',
            legendX,
            legendY,
            {
                'font-size': '12',
                'font-weight': '600',
                'fill': '#E2E8F0',
                'text-anchor': 'start'
            }
        );
        this.addElement('legend-title', title);

        Object.entries(this.keyColors).forEach(([key, color], i) => {
            const y = legendY + 20 + (i * 20);

            // Color circle
            const circle = this.createCircle(legendX + 6, y, 5, {
                fill: color,
                opacity: 0.9
            });
            this.addElement(`legend-circle-${key}`, circle);

            // Key label
            const label = this.createText(
                key,
                legendX + 18,
                y + 4,
                {
                    'font-size': '11',
                    'fill': '#94A3B8',
                    'text-anchor': 'start'
                }
            );
            this.addElement(`legend-label-${key}`, label);

            // Partition assignment
            const partition = this.keyToPartition[key];
            const partitionLabel = this.createText(
                `→ P${partition}`,
                legendX + 72,
                y + 4,
                {
                    'font-size': '11',
                    'fill': '#22D3EE',
                    'text-anchor': 'start'
                }
            );
            this.addElement(`legend-partition-${key}`, partitionLabel);
        });
    }

    /**
     * Setup click handlers for entities
     */
    setupClickHandlers() {
        const producerEl = this.getElement('producer');
        const topicEl = this.getElement('topic');

        if (producerEl) {
            producerEl.addEventListener('click', () => {
                const info = this.producer.getInfo();
                info.description += ' Messages are sent with keys (user-A, user-B, user-C). Same key always goes to the same partition.';
                eventBus.emit('entity:click', info);
            });
        }

        if (topicEl) {
            topicEl.addEventListener('click', () => {
                const info = this.topic.getInfo();
                info.description += ' Keys are hashed to determine partition: hash(key) % 3. This ensures all messages for a user stay in order.';
                eventBus.emit('entity:click', info);
            });
        }

        // Consumer click handlers
        this.consumers.forEach((consumer, i) => {
            const consumerEl = this.getElement(`consumer-${i}`);
            if (consumerEl) {
                consumerEl.addEventListener('click', () => {
                    const info = consumer.getInfo();
                    info.description = `Consumer ${i} reads exclusively from Partition ${i}. Multiple consumers enable parallel processing while maintaining per-key ordering.`;
                    info.details['Assigned Partition'] = `P${i}`;
                    eventBus.emit('entity:click', info);
                });
            }
        });
    }

    /**
     * Create the animation timeline
     */
    createAnimationTimeline() {
        const timeline = this.animator.createTimeline({
            repeat: -1,
            repeatDelay: 1.5
        });

        // Create messages with specific keys showing same key → same partition
        const messageSequence = [
            'user-A',  // → P0
            'user-B',  // → P1
            'user-C',  // → P2
            'user-A',  // → P0 (same partition as first user-A)
            'user-B',  // → P1 (same partition as first user-B)
            'user-A',  // → P0 (demonstrates ordering within partition)
            'user-C',  // → P2
            'user-B',  // → P1
            'user-C',  // → P2
        ];

        messageSequence.forEach((key, i) => {
            const delay = i * 0.7;
            timeline.add(() => {
                this.createAndAnimateMessage(key);
            }, delay);
        });

        return timeline;
    }

    /**
     * Get partition Y coordinate
     * @param {number} partitionIndex
     * @returns {number}
     */
    getPartitionY(partitionIndex) {
        const partitionHeight = 25;
        const gap = 5;
        const totalHeight = (partitionHeight * this.partitionCount) + (gap * (this.partitionCount - 1));
        const startY = this.topic.y + (this.topic.height - totalHeight) / 2;

        return startY + (partitionIndex * (partitionHeight + gap)) + partitionHeight / 2;
    }

    /**
     * Create and animate a single message with a specific key
     * @param {string} key - Message key (user-A, user-B, or user-C)
     */
    createAndAnimateMessage(key) {
        const messageId = `message-${this.messageCount++}`;
        const producerPoint = this.producer.getEmitPoint();

        // Determine partition based on key
        const partitionIndex = this.keyToPartition[key];
        const messageColor = this.keyColors[key];

        // Create colored message at producer
        const message = new Message(messageId, producerPoint.x, producerPoint.y);
        const messageEl = message.render();

        // Change message color based on key
        const circles = messageEl.querySelectorAll('circle');
        circles.forEach(circle => {
            if (circle.getAttribute('fill') === '#FBBF24') {
                circle.setAttribute('fill', messageColor);
            }
        });

        // Add key label to message
        const keyLabel = this.createText(
            key.split('-')[1], // Just "A", "B", or "C"
            0,
            0,
            {
                'font-size': '9',
                'font-weight': '700',
                'fill': '#0A0E27',
                'text-anchor': 'middle'
            }
        );
        messageEl.appendChild(keyLabel);

        this.addElement(messageId, messageEl);
        this.messages.push(message);

        // Animation sequence
        const tl = gsap.timeline({
            onComplete: () => {
                // Remove message after animation
                this.removeElement(messageId);
                const index = this.messages.indexOf(message);
                if (index > -1) {
                    this.messages.splice(index, 1);
                }
            }
        });

        const topicReceivePoint = this.topic.getReceivePoint();
        const topicEmitPoint = this.topic.getEmitPoint();
        const consumer = this.consumers[partitionIndex];
        const consumerPoint = consumer.getReceivePoint();

        // Calculate partition-specific Y coordinate
        const partitionY = this.getPartitionY(partitionIndex);

        // Producer → Topic (enter at partition level)
        tl.to(messageEl, {
            duration: 0.8,
            x: topicReceivePoint.x,
            y: partitionY,
            ease: 'power1.inOut'
        });

        // Pause at partition (storage)
        tl.to(messageEl, {
            duration: 0.3,
            scale: 0.8,
            opacity: 0.7
        });

        // Move across the partition
        tl.to(messageEl, {
            duration: 0.4,
            scale: 1,
            opacity: 1,
            x: topicEmitPoint.x,
            y: partitionY
        });

        // Partition → Consumer (specific consumer for this partition)
        tl.to(messageEl, {
            duration: 0.8,
            x: consumerPoint.x,
            y: consumerPoint.y,
            ease: 'power1.inOut'
        });

        // Consume (fade out)
        tl.to(messageEl, {
            duration: 0.4,
            scale: 0,
            opacity: 0,
            ease: 'power2.in'
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.messages = [];
        this.messageCount = 0;
        super.destroy();
    }
}
