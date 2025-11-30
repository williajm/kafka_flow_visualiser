/**
 * Lesson 2: Partitions (Comprehensive)
 * Demonstrates:
 * - Partitions distributed across brokers
 * - Ordering within partitions (sequence numbers)
 * - No ordering across partitions
 * - Key-based routing (hash) vs round-robin
 * - Parallel consumption
 */

import { Scene } from '../core/Scene.js';
import { Producer } from '../kafka/Producer.js';
import { Broker } from '../kafka/Broker.js';
import { Consumer } from '../kafka/Consumer.js';
import { Message } from '../kafka/Message.js';
import { eventBus } from '../core/EventBus.js';

export class Lesson2_Partitions extends Scene {
    constructor(canvas) {
        super(canvas, {
            title: 'Kafka Partitions Explained',
            description: 'Partitions divide topics across brokers for scalability. Messages distribute round-robin across partitions for even load distribution. Each partition maintains order, and a single consumer can read from all partitions.'
        });

        this.producer = null;
        this.brokers = [];
        this.consumers = [];
        this.messages = [];
        this.messageCount = 0;
        this.partitionCount = 3;
        this.partitionAssignments = [0, 0, 0]; // All partitions → single consumer
        this.consumerCount = 1;

        // Track sequence numbers per partition
        this.partitionSequence = [0, 0, 0];

        // Track GLOBAL message order (to show cross-partition ordering doesn't matter)
        this.globalMessageCount = 0;

        // Track message history per consumer (for display)
        this.consumerHistory = Array.from({ length: this.consumerCount }, () => []);
        this.maxHistorySize = 3;

        // Track in-flight load per broker for a visual load indicator
        this.brokerLoad = Array(this.partitionCount).fill(0);

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
        // Producer on the left (aligned with partition 1 for a straight line)
        this.producer = new Producer('producer-1', 80, 240);

        // Three brokers in the middle (vertically stacked to show distribution)
        const brokerX = 380;
        const brokerStartY = 120;
        const brokerSpacing = 110;

        for (let i = 0; i < this.partitionCount; i++) {
            const broker = new Broker(`broker-${i}`, brokerX, brokerStartY + (i * brokerSpacing), i);
            this.brokers.push(broker);
        }

        // Consumers on the right
        const consumerX = 900;
        // Align consumer with partition 1 for a straight line
        const consumerStartY = 240;
        const consumerSpacing = 160;

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

        // Brokers → Consumers (supports one consumer handling multiple partitions)
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
                    stroke: '#3D4A3D',
                    'stroke-width': 1,
                    'stroke-dasharray': '3,3',
                    opacity: 0.4
                }
            );
            this.addElement(`line-broker-consumer-${i}-to-${consumerIndex}`, line);
        });
    }

    /**
     * Add labels
     */
    addLabels() {
        // Title
        const title = this.createText(
            'Distributed Partitions Across Brokers',
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
     * Add a topic frame around partitions
     */
    addTopicContainer() {
        const frame = this.createRect(330, 90, 360, 380, {
            fill: '#171C17',
            stroke: '#3D4A3D',
            'stroke-width': 2,
            rx: 12,
            opacity: 0.25
        });
        frame.setAttribute('pointer-events', 'none');
        this.addElement('topic-frame', frame);

        const label = this.createText(
            'Topic: user-events (3 partitions)',
            510,
            110,
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
            const historyBox = this.createRect(historyX, historyY, 150, 90, {
                fill: '#1E241E',
                stroke: '#3D4A3D',
                'stroke-width': 1,
                rx: 6,
                opacity: 0.8
            });
            this.addElement(`consumer-${i}-history-box`, historyBox);

            // Title
            const title = this.createText(
                'Consumed (partition order):',
                historyX + 75,
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
                    historyX + 75,
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
     * Add load indicator showing broker load distribution (in-flight messages per broker/partition)
     */
    addLoadIndicator() {
        const x = 720;
        const y = 500;
        const width = 380;
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
            'Broker Load Distribution (in-flight per partition)',
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

        this.brokers.forEach((_, i) => {
            const rowY = y + 34 + (i * 22);
            const label = this.createText(
                `P${i}`,
                x + 12,
                rowY + 8,
                {
                    'font-size': '10',
                    'font-weight': '700',
                    'fill': '#7B9E7B',
                    'text-anchor': 'start'
                }
            );
            this.addElement(`load-label-${i}`, label);

            const barBg = this.createRect(x + 34, rowY, width - 60, 12, {
                fill: '#1E241E',
                stroke: '#282F28',
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
            'Partitions distribute load across brokers. Key-based routing may cause uneven distribution.',
            x + width / 2,
            y + height - 10,
            {
                'font-size': '9',
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
        const historyX = this.consumers[consumerIndex].x + this.consumers[consumerIndex].width + 35;
        const historyY = this.consumers[consumerIndex].y - 10;

        for (let j = 0; j < this.maxHistorySize; j++) {
            const msgElement = this.getElement(`consumer-${consumerIndex}-history-msg-${j}`);
            if (msgElement) {
                if (j < history.length) {
                    const msg = history[j];
                    // Show: "P0 #1" - partition and partition sequence number
                    // Simpler format for round-robin lesson (no keys)
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
                info.description += ` Messages distribute round-robin across all partitions for even load distribution.`;
                eventBus.emit('entity:click', info);
            });
        }

        this.brokers.forEach((broker, i) => {
            const brokerEl = this.getElement(`broker-${i}`);
            if (brokerEl) {
                brokerEl.addEventListener('click', () => {
                    eventBus.emit('entity:click', broker.getInfo());
                });
            }
        });

        this.consumers.forEach((consumer, i) => {
                const consumerEl = this.getElement(`consumer-${i}`);
                if (consumerEl) {
                    consumerEl.addEventListener('click', () => {
                        const info = consumer.getInfo();
                        const partitions = this.getPartitionsForConsumer(i);
                        info.description = partitions.length > 1
                            ? `Consumer ${i} is assigned multiple partitions (${partitions.map(p => `P${p}`).join(', ')}) to show a single process handling more than one partition.`
                            : `Consumer ${i} reads only from Partition ${partitions[0]}.`;
                        info.details['Assigned Partition(s)'] = partitions.map(p => `P${p}`).join(', ');
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
            const delay = i * this.MESSAGE_SEND_DELAY;
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
            const totalWidth = partitions.length * 30 + (partitions.length - 1) * 4;
            const badgeX = consumer.x + consumer.width - totalWidth - 12;
            const badgeY = consumer.y + 8;

            partitions.forEach((p, idx) => {
                const badgeWidth = 30;
                const xOffset = badgeX + idx * (badgeWidth + 4);
                const badge = this.createRect(xOffset, badgeY, badgeWidth, badgeHeight, {
                    fill: '#171C17',
                    stroke: '#6B9E9E',
                    'stroke-width': 1.5,
                    rx: 6,
                    opacity: 0.9
                });
                badge.setAttribute('pointer-events', 'none');
                this.addElement(`consumer-badge-${i}-${p}`, badge);

                const label = this.createText(
                    `P${p}`,
                    xOffset + badgeWidth / 2,
                    badgeY + 12,
                    {
                        'font-size': '10',
                        'font-weight': '700',
                        'fill': '#D5E8D5',
                        'text-anchor': 'middle'
                    }
                );
                label.setAttribute('pointer-events', 'none');
                this.addElement(`consumer-badge-label-${i}-${p}`, label);
            });
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
                this.brokerLoad[partitionIndex] = Math.max(0, this.brokerLoad[partitionIndex] - 1);
                this.updateLoadIndicator(partitionIndex);
            }
        });

        // Increment load when message is created
        this.brokerLoad[partitionIndex] += 1;
        this.updateLoadIndicator(partitionIndex);

        // Producer → Broker/Partition
        tl.to(messageEl, {
            duration: this.ANIM_TRAVEL_DURATION,
            x: brokerCenter.x,
            y: brokerCenter.y,
            ease: 'power1.inOut'
        });

        // Pause at partition
        tl.to(messageEl, {
            duration: this.ANIM_PAUSE_DURATION,
            scale: 0.9,
            opacity: 0.8
        });

        tl.to(messageEl, {
            duration: this.ANIM_PAUSE_DURATION,
            scale: 1,
            opacity: 1
        });

        // Partition → Consumer
        tl.to(messageEl, {
            duration: this.ANIM_TRAVEL_DURATION,
            x: consumerPoint.x,
            y: consumerPoint.y,
            ease: 'power1.inOut'
        });

        // Consume
        tl.to(messageEl, {
            duration: this.ANIM_CONSUME_DURATION,
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
        this.brokerLoad = Array(this.partitionCount).fill(0);
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
     * Update visual load bars for a broker/partition (in-flight messages)
     * @param {number} partitionIndex
     */
    updateLoadIndicator(partitionIndex) {
        const load = this.brokerLoad[partitionIndex];
        const maxVisual = 6; // clamp for visuals
        const normalized = Math.min(load, maxVisual);
        const baseWidth = 10;
        const barWidth = baseWidth + normalized * 22;
        const barFill = this.getElement(`load-bar-fill-${partitionIndex}`);
        if (barFill) {
            barFill.setAttribute('width', barWidth);
            barFill.setAttribute('fill', load > 3 ? '#D4A855' : '#C4B392');
        }
    }
}
