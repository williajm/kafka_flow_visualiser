/**
 * Lesson 4: Consumer Groups
 * Demonstrates:
 * - Multiple consumers in the same consumer group
 * - Partition assignment to consumers (each partition → one consumer)
 * - Parallel consumption across multiple consumers
 * - Load balancing across consumers
 */

import { Scene } from '../core/Scene.js';
import { Producer } from '../kafka/Producer.js';
import { Broker } from '../kafka/Broker.js';
import { Consumer } from '../kafka/Consumer.js';
import { Message } from '../kafka/Message.js';
import { eventBus } from '../core/EventBus.js';

export class Lesson4_ConsumerGroups extends Scene {
    constructor(canvas) {
        super(canvas, {
            title: 'Kafka Consumer Groups',
            description: 'Consumer groups enable parallel processing. Each partition is assigned to exactly one consumer in a group, allowing multiple consumers to process messages simultaneously.'
        });

        this.producer = null;
        this.brokers = [];
        this.consumers = [];
        this.messages = [];
        this.messageCount = 0;
        this.partitionCount = 3;
        // Partition assignments: P0→C0, P1→C1, P2→C2 (one partition per consumer)
        this.partitionAssignments = [0, 1, 2];
        this.consumerCount = 3;

        // Track sequence numbers per partition
        this.partitionSequence = [0, 0, 0];

        // Track GLOBAL message order
        this.globalMessageCount = 0;

        // Track message history per consumer (for display)
        this.consumerHistory = Array.from({ length: this.consumerCount }, () => []);
        this.maxHistorySize = 3;

        // Track in-flight load per consumer
        this.consumerLoad = Array(this.consumerCount).fill(0);

        // Round-robin distribution
        this.roundRobinIndex = 0;

        // Message color
        this.messageColor = '#B5AFA5';  // Gray

        // Animation constants
        this.ANIM_TRAVEL_DURATION = 0.7;
        this.ANIM_PAUSE_DURATION = 0.2;
        this.ANIM_CONSUME_DURATION = 0.3;
        this.MESSAGE_SEND_DELAY = 0.65;
    }

    /**
     * Setup the scene
     */
    async setup() {
        // Producer on the left
        this.producer = new Producer('producer-1', 80, 230);

        // Three brokers in the middle (vertically stacked)
        const brokerX = 380;
        const brokerStartY = 150;
        const brokerSpacing = 110;

        for (let i = 0; i < this.partitionCount; i++) {
            const broker = new Broker(`broker-${i}`, brokerX, brokerStartY + (i * brokerSpacing), i);
            this.brokers.push(broker);
        }

        // Three consumers on the right (perfectly aligned with brokers for horizontal lines)
        const consumerX = 900;
        // Offset consumers slightly so partition→consumer lines stay horizontal (1:1 mapping)
        const consumerStartY = 160;
        const consumerSpacing = 110;  // Same spacing as brokers

        for (let i = 0; i < this.consumerCount; i++) {
            const consumer = new Consumer(`consumer-${i}`, consumerX, consumerStartY + (i * consumerSpacing), 'consumer-group-1');
            this.consumers.push(consumer);
        }

        // Add topic container behind brokers/partitions
        this.addTopicContainer();

        // Render everything
        this.addElement('producer', this.producer.render());

        this.brokers.forEach((broker, i) => {
            this.addElement(`broker-${i}`, broker.render());
        });

        this.consumers.forEach((consumer, i) => {
            this.addElement(`consumer-${i}`, consumer.render());
        });

        // Add visual elements
        this.createConnectionLines();
        this.addLabels();
        this.addConsumerPartitionBadges();
        this.addConsumerHistoryDisplays();
        this.addLoadIndicator();
        this.addConsumerGroupLabel();
        this.setupClickHandlers();

        // Create animation timeline
        this.createAnimationTimeline();
    }

    /**
     * Create connection lines
     */
    createConnectionLines() {
        const producerPoint = this.producer.getEmitPoint();

        // Producer → Brokers (fanned out)
        this.brokers.forEach((broker, i) => {
            const brokerPoint = broker.getReceivePoint();
            const line = this.createLine(
                producerPoint.x,
                producerPoint.y,
                brokerPoint.x,
                brokerPoint.y,
                {
                    stroke: '#3D4A3D',
                    'stroke-width': 1,
                    'stroke-dasharray': '3,3',
                    opacity: 0.4
                }
            );
            this.addElement(`line-producer-broker-${i}`, line);
        });

        // Brokers → Consumers (1-to-1 mapping)
        this.brokers.forEach((broker, i) => {
            const brokerPoint = broker.getEmitPoint();
            const consumerIndex = this.partitionAssignments[i];
            const consumerPoint = this.consumers[consumerIndex].getReceivePoint();
            const line = this.createLine(
                brokerPoint.x,
                brokerPoint.y,
                consumerPoint.x,
                consumerPoint.y,
                {
                    stroke: '#6B9E9E',
                    'stroke-width': 2,
                    'stroke-dasharray': '5,5',
                    opacity: 0.6
                }
            );
            this.addElement(`line-broker-consumer-${i}`, line);
        });
    }

    /**
     * Add labels
     */
    addLabels() {
        // Title
        const title = this.createText(
            'Consumer Group: Parallel Processing',
            600,
            50,
            {
                'font-size': '14',
                'font-weight': '600',
                'fill': '#FAF6F0',
                'text-anchor': 'middle'
            }
        );
        this.addElement('title', title);
    }

    /**
     * Add consumer group label
     */
    addConsumerGroupLabel() {
        const x = 900;
        const y = 110;

        const groupBox = this.createRect(x, y, 180, 30, {
            fill: '#1E241E',
            stroke: '#6B9E9E',
            'stroke-width': 1.5,
            rx: 8,
            opacity: 0.8
        });
        this.addElement('consumer-group-box', groupBox);

        const groupLabel = this.createText(
            'Consumer Group: consumer-group-1',
            x + 90,
            y + 19,
            {
                'font-size': '10',
                'font-weight': '600',
                'fill': '#6B9E9E',
                'text-anchor': 'middle'
            }
        );
        this.addElement('consumer-group-label', groupLabel);
    }

    /**
     * Add a topic frame around partitions
     */
    addTopicContainer() {
        const frame = this.createRect(330, 120, 360, 380, {
            fill: '#171C17',
            stroke: '#3D4A3D',
            'stroke-width': 2,
            rx: 12,
            opacity: 0.25
        });
        frame.setAttribute('pointer-events', 'none');
        this.addElement('topic-frame', frame);

        const label = this.createText(
            'Topic: events (3 partitions)',
            510,
            140,
            {
                'font-size': '12',
                'font-weight': '700',
                'fill': '#D5D0C8',
                'text-anchor': 'middle'
            }
        );
        label.setAttribute('pointer-events', 'none');
        this.addElement('topic-label', label);
    }

    /**
     * Add consumer history displays
     */
    addConsumerHistoryDisplays() {
        this.consumers.forEach((consumer, i) => {
            const historyX = consumer.x + consumer.width + 35;
            const historyY = consumer.y - 10;

            // History box background
            const historyBox = this.createRect(historyX, historyY, 120, 90, {
                fill: '#1E241E',
                stroke: '#3D4A3D',
                'stroke-width': 1,
                rx: 6,
                opacity: 0.8
            });
            this.addElement(`consumer-${i}-history-box`, historyBox);

            // Title
            const title = this.createText(
                'Consumed:',
                historyX + 60,
                historyY + 15,
                {
                    'font-size': '9',
                    'fill': '#B5AFA5',
                    'text-anchor': 'middle'
                }
            );
            this.addElement(`consumer-${i}-history-title`, title);

            // Placeholder for messages (will be updated dynamically)
            for (let j = 0; j < this.maxHistorySize; j++) {
                const msgY = historyY + 33 + (j * 18);

                const msgText = this.createText(
                    '—',
                    historyX + 60,
                    msgY,
                    {
                        'font-size': '10',
                        'fill': '#7A756C',
                        'text-anchor': 'middle',
                        'font-family': 'monospace'
                    }
                );
                this.addElement(`consumer-${i}-history-msg-${j}`, msgText);
            }
        });
    }

    /**
     * Add load indicator showing consumer load distribution
     */
    addLoadIndicator() {
        const x = 80;
        const y = 380;
        const width = 220;
        const height = 110;

        const box = this.createRect(x, y, width, height, {
            fill: '#171C17',
            stroke: '#3D4A3D',
            'stroke-width': 1,
            rx: 10,
            opacity: 0.7
        });
        this.addElement('load-box', box);

        const title = this.createText(
            'Consumer Load (in-flight)',
            x + width / 2,
            y + 18,
            {
                'font-size': '11',
                'font-weight': '700',
                'fill': '#FAF6F0',
                'text-anchor': 'middle'
            }
        );
        this.addElement('load-title', title);

        this.consumers.forEach((_, i) => {
            const rowY = y + 34 + (i * 22);
            const label = this.createText(
                `C${i}`,
                x + 12,
                rowY + 8,
                {
                    'font-size': '10',
                    'font-weight': '700',
                    'fill': '#6B9E9E',
                    'text-anchor': 'start'
                }
            );
            this.addElement(`load-label-${i}`, label);

            const barBg = this.createRect(x + 34, rowY, width - 60, 12, {
                fill: '#111831',
                stroke: '#1E293B',
                'stroke-width': 1,
                rx: 6,
                opacity: 0.8
            });
            this.addElement(`load-bar-bg-${i}`, barBg);

            const barFill = this.createRect(x + 34, rowY, 10, 12, {
                fill: '#C4B392',
                rx: 6,
                opacity: 0.9
            });
            this.addElement(`load-bar-fill-${i}`, barFill);
        });

        const note = this.createText(
            'Each consumer processes one partition in parallel.',
            x + width / 2,
            y + height - 10,
            {
                'font-size': '8',
                'fill': '#B5AFA5',
                'text-anchor': 'middle'
            }
        );
        this.addElement('load-note', note);
    }

    /**
     * Update consumer history display
     * @param {number} consumerIndex
     * @param {string} key
     * @param {number} seqNum
     * @param {number} globalNum
     * @param {string} color
     * @param {number} partitionIndex
     */
    updateConsumerHistory(consumerIndex, key, seqNum, globalNum, color, partitionIndex) {
        const history = this.consumerHistory[consumerIndex];

        // Add new message to history
        history.push({ key, seqNum, globalNum, color, partitionIndex });

        // Keep only last N messages
        if (history.length > this.maxHistorySize) {
            history.shift();
        }

        // Update display
        for (let j = 0; j < this.maxHistorySize; j++) {
            const msgElement = this.getElement(`consumer-${consumerIndex}-history-msg-${j}`);
            if (msgElement) {
                if (j < history.length) {
                    const msg = history[j];
                    msgElement.textContent = `P${msg.partitionIndex} #${msg.seqNum}`;
                    msgElement.setAttribute('fill', msg.color);
                    msgElement.setAttribute('opacity', '1');
                } else {
                    msgElement.textContent = '—';
                    msgElement.setAttribute('fill', '#7A756C');
                    msgElement.setAttribute('opacity', '0.5');
                }
            }
        }
    }

    /**
     * Setup click handlers
     */
    setupClickHandlers() {
        const producerEl = this.getElement('producer');
        if (producerEl) {
            producerEl.addEventListener('click', () => {
                const info = this.producer.getInfo();
                info.description += ` Messages distribute round-robin across all partitions.`;
                eventBus.emit('entity:click', info);
            });
        }

        this.brokers.forEach((broker, i) => {
            const brokerEl = this.getElement(`broker-${i}`);
            if (brokerEl) {
                brokerEl.addEventListener('click', () => {
                    const info = broker.getInfo();
                    const consumerIndex = this.partitionAssignments[i];
                    info.description += ` This partition is assigned to Consumer ${consumerIndex} in the consumer group.`;
                    eventBus.emit('entity:click', info);
                });
            }
        });

        this.consumers.forEach((consumer, i) => {
            const consumerEl = this.getElement(`consumer-${i}`);
            if (consumerEl) {
                consumerEl.addEventListener('click', () => {
                    const info = consumer.getInfo();
                    const partitions = this.getPartitionsForConsumer(i);
                    info.description = `Consumer ${i} is assigned Partition ${partitions[0]} exclusively. Other consumers in the group handle the other partitions.`;
                    info.details['Assigned Partition(s)'] = partitions.map(p => `P${p}`).join(', ');
                    info.details['Consumer Group'] = 'consumer-group-1';
                    eventBus.emit('entity:click', info);
                });
            }
        });
    }

    /**
     * Create animation timeline
     */
    createAnimationTimeline() {
        const timeline = this.animator.createTimeline({
            repeat: -1,
            repeatDelay: 2
        });

        // Send messages in round-robin fashion
        const messageCount = 15;
        for (let i = 0; i < messageCount; i++) {
            const delay = i * 0.65;
            timeline.add(() => {
                this.createAndAnimateMessage();
            }, delay);
        }

        return timeline;
    }

    /**
     * Add inline partition badges to each consumer
     */
    addConsumerPartitionBadges() {
        this.consumers.forEach((consumer, i) => {
            const partitions = this.getPartitionsForConsumer(i);
            const badgeHeight = 18;
            const badgeWidth = 30;
            const badgeX = consumer.x + consumer.width - badgeWidth - 12;
            const badgeY = consumer.y + 8;

            const badge = this.createRect(badgeX, badgeY, badgeWidth, badgeHeight, {
                fill: '#171C17',
                stroke: '#6B9E9E',
                'stroke-width': 1.5,
                rx: 6,
                opacity: 0.9
            });
            badge.setAttribute('pointer-events', 'none');
            this.addElement(`consumer-badge-${i}`, badge);

            const label = this.createText(
                `P${partitions[0]}`,
                badgeX + badgeWidth / 2,
                badgeY + 12,
                {
                    'font-size': '10',
                    'font-weight': '700',
                    'fill': '#D5E8D5',
                    'text-anchor': 'middle'
                }
            );
            label.setAttribute('pointer-events', 'none');
            this.addElement(`consumer-badge-label-${i}`, label);
        });
    }

    /**
     * Create and animate message in round-robin fashion
     */
    createAndAnimateMessage() {
        const messageId = `message-${this.messageCount++}`;
        const producerPoint = this.producer.getEmitPoint();

        // Round-robin distribution: distribute evenly across partitions
        const partitionIndex = this.roundRobinIndex;
        this.roundRobinIndex = (this.roundRobinIndex + 1) % this.partitionCount;

        const consumerIndex = this.partitionAssignments[partitionIndex];

        // Get sequence number for this partition AND global number
        const seqNum = this.partitionSequence[partitionIndex]++;
        const globalNum = this.globalMessageCount++;

        // Create message
        const message = new Message(messageId, producerPoint.x, producerPoint.y);
        const messageEl = message.render();

        // Color the message
        const circles = messageEl.querySelectorAll('circle');
        circles.forEach(circle => {
            if (circle.getAttribute('fill') === '#D4A855') {
                circle.setAttribute('fill', this.messageColor);
            }
        });

        // Add message number label
        const msgLabel = this.createText(
            `M${globalNum}`,
            0,
            -1,
            {
                'font-size': '8',
                'font-weight': '700',
                'fill': '#171C17',
                'text-anchor': 'middle'
            }
        );
        messageEl.appendChild(msgLabel);

        // Add sequence number
        const seqLabel = this.createText(
            `#${seqNum}`,
            0,
            5,
            {
                'font-size': '7',
                'font-weight': '600',
                'fill': '#171C17',
                'text-anchor': 'middle'
            }
        );
        messageEl.appendChild(seqLabel);

        this.addElement(messageId, messageEl);
        this.messages.push(message);

        // Animate
        const broker = this.brokers[partitionIndex];
        const consumer = this.consumers[consumerIndex];

        const brokerCenter = broker.getPartitionCenter();
        const consumerPoint = consumer.getReceivePoint();

        const tl = gsap.timeline({
            onComplete: () => {
                this.removeElement(messageId);
                const index = this.messages.indexOf(message);
                if (index > -1) this.messages.splice(index, 1);
                this.consumerLoad[consumerIndex] = Math.max(0, this.consumerLoad[consumerIndex] - 1);
                this.updateLoadIndicator(consumerIndex);
            }
        });

        // Increment load when message is created
        this.consumerLoad[consumerIndex] += 1;
        this.updateLoadIndicator(consumerIndex);

        // Producer → Broker/Partition
        tl.to(messageEl, {
            duration: 0.7,
            x: brokerCenter.x,
            y: brokerCenter.y,
            ease: 'power1.inOut'
        });

        // Pause at partition
        tl.to(messageEl, {
            duration: 0.2,
            scale: 0.9,
            opacity: 0.8
        });

        tl.to(messageEl, {
            duration: 0.2,
            scale: 1,
            opacity: 1
        });

        // Partition → Consumer
        tl.to(messageEl, {
            duration: 0.7,
            x: consumerPoint.x,
            y: consumerPoint.y,
            ease: 'power1.inOut'
        });

        // Consume
        tl.to(messageEl, {
            duration: 0.3,
            scale: 0,
            opacity: 0,
            ease: 'power2.in',
            onStart: () => {
                // Update consumer history when message is consumed
                this.updateConsumerHistory(consumerIndex, `M${globalNum}`, seqNum, globalNum, this.messageColor, partitionIndex);
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        // Kill all GSAP animations for this scene
        this.messages.forEach(msg => {
            const el = this.elements.get(`message-${msg.id || this.messages.indexOf(msg)}`);
            if (el) gsap.killTweensOf(el);
        });
        this.messages = [];
        this.messageCount = 0;
        this.partitionSequence = [0, 0, 0];
        this.globalMessageCount = 0;
        this.consumerHistory = Array.from({ length: this.consumerCount }, () => []);
        this.consumerLoad = Array(this.consumerCount).fill(0);
        super.destroy();
    }

    /**
     * Get all partitions assigned to a consumer
     * @param {number} consumerIndex
     * @returns {number[]}
     */
    getPartitionsForConsumer(consumerIndex) {
        return this.partitionAssignments
            .map((assignedConsumer, partition) => assignedConsumer === consumerIndex ? partition : null)
            .filter(p => p !== null);
    }

    /**
     * Update visual load bars for a consumer (in-flight messages)
     * @param {number} consumerIndex
     */
    updateLoadIndicator(consumerIndex) {
        const load = this.consumerLoad[consumerIndex];
        const maxVisual = 6; // clamp for visuals
        const normalized = Math.min(load, maxVisual);
        const baseWidth = 10;
        const barWidth = baseWidth + normalized * 22;
        const barFill = this.getElement(`load-bar-fill-${consumerIndex}`);
        if (barFill) {
            barFill.setAttribute('width', barWidth);
            barFill.setAttribute('fill', load > 3 ? '#D4A855' : '#C4B392');
        }
    }
}
