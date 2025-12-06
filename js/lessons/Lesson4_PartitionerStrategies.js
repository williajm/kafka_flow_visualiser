/**
 * Lesson 4: Sticky Partitioner
 * Demonstrates:
 * - Sticky partitioner (Kafka 2.4+ default): batches messages to same partition
 * - Batch filling before switching partitions
 * - Trade-off: better throughput vs less even distribution
 */

import { Scene } from '../core/Scene.js';
import { Producer } from '../kafka/Producer.js';
import { Broker } from '../kafka/Broker.js';
import { Consumer } from '../kafka/Consumer.js';
import { Message } from '../kafka/Message.js';
import { eventBus } from '../core/EventBus.js';

export class Lesson4_PartitionerStrategies extends Scene {
    constructor(canvas) {
        super(canvas, {
            title: 'Sticky Partitioner',
            description: 'The default partitioner since Kafka 2.4. Messages batch to the same partition until full, then switch. This improves throughput by creating larger batches.'
        });

        this.producer = null;
        this.brokers = [];
        this.consumer = null;

        this.messages = [];
        this.messageCount = 0;
        this.partitionCount = 3;

        // Sticky partitioner state
        this.stickyPartitionIndex = 0;
        this.stickyBatchCount = 0;
        this.stickyBatchSize = 4; // Messages per batch before switching

        // Track sequence numbers per partition
        this.partitionSequence = [0, 0, 0];

        // Track load per partition
        this.partitionLoad = [0, 0, 0];

        // Consumer history
        this.consumerHistory = [];
        this.maxHistorySize = 6;

        // Global message counter
        this.globalMessageCount = 0;

        // Partition assignments (all to one consumer for simplicity)
        this.partitionAssignments = [0, 0, 0];

        // Color
        this.messageColor = '#D4A855'; // Gold

        // Animation constants
        this.ANIM_TRAVEL_DURATION = 0.7;
        this.ANIM_PAUSE_DURATION = 0.2;
        this.ANIM_CONSUME_DURATION = 0.3;
        this.MESSAGE_SEND_DELAY = 0.5;
    }

    /**
     * Setup the scene
     */
    async setup() {
        // Producer on the left
        this.producer = new Producer('producer-1', 80, 240);

        // Three brokers in the middle
        const brokerX = 380;
        const brokerStartY = 120;
        const brokerSpacing = 110;

        for (let i = 0; i < this.partitionCount; i++) {
            const broker = new Broker(`broker-${i}`, brokerX, brokerStartY + (i * brokerSpacing), i);
            this.brokers.push(broker);
        }

        // Consumer on the right
        this.consumer = new Consumer('consumer-1', 700, 240, 'consumer-group-1');

        // Add visual elements
        this.addTopicContainer();

        // Render everything
        this.addElement('producer', this.producer.render());

        this.brokers.forEach((broker, i) => {
            this.addElement(`broker-${i}`, broker.render());
        });

        this.addElement('consumer', this.consumer.render());

        // Add connection lines
        this.createConnectionLines();
        this.addLabels();
        this.addConsumerPartitionBadges();
        this.addLoadIndicator();
        this.addBatchIndicator();
        this.addConsumerHistoryDisplay();
        this.setupClickHandlers();

        // Create animation timeline
        this.createAnimationTimeline();
    }

    /**
     * Add a topic frame around partitions
     */
    addTopicContainer() {
        const frame = this.createRect(330, 90, 160, 360, {
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
            410,
            110,
            {
                'font-size': '11',
                'font-weight': '700',
                'fill': '#D5D0C8',
                'text-anchor': 'middle'
            }
        );
        label.setAttribute('pointer-events', 'none');
        this.addElement('topic-label', label);
    }

    /**
     * Add labels
     */
    addLabels() {
        const title = this.createText(
            'Sticky Partitioner: Batch Then Switch',
            400,
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
     * Create connection lines
     */
    createConnectionLines() {
        const producerPoint = this.producer.getEmitPoint();

        // Producer → Brokers
        this.brokers.forEach((broker, i) => {
            const brokerPoint = broker.getReceivePoint();
            const line = this.createLine(
                producerPoint.x, producerPoint.y,
                brokerPoint.x, brokerPoint.y,
                { stroke: '#3D4A3D', 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: 0.4 }
            );
            this.addElement(`line-producer-broker-${i}`, line);
        });

        // Brokers → Consumer
        this.brokers.forEach((broker, i) => {
            const brokerPoint = broker.getEmitPoint();
            const consumerPoint = this.consumer.getReceivePoint();
            const line = this.createLine(
                brokerPoint.x, brokerPoint.y,
                consumerPoint.x, consumerPoint.y,
                { stroke: '#3D4A3D', 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: 0.4 }
            );
            this.addElement(`line-broker-consumer-${i}`, line);
        });
    }

    /**
     * Add consumer partition badges
     */
    addConsumerPartitionBadges() {
        const partitions = [0, 1, 2];
        const badgeHeight = 18;
        const totalWidth = partitions.length * 30 + (partitions.length - 1) * 4;
        const badgeX = this.consumer.x + this.consumer.width - totalWidth - 12;
        const badgeY = this.consumer.y + 8;

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
            this.addElement(`consumer-badge-${p}`, badge);

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
            this.addElement(`consumer-badge-label-${p}`, label);
        });
    }

    /**
     * Add load indicator
     */
    addLoadIndicator() {
        const x = this.producer.x;
        const y = this.producer.y + this.producer.height + 60;
        const width = 200;
        const height = 100;

        const box = this.createRect(x, y, width, height, {
            fill: '#171C17',
            stroke: '#3D4A3D',
            'stroke-width': 1,
            rx: 10,
            opacity: 0.7
        });
        this.addElement('load-box', box);

        const title = this.createText(
            'Partition Load (in-flight)',
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

        for (let i = 0; i < this.partitionCount; i++) {
            const rowY = y + 32 + (i * 20);

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

            const barBg = this.createRect(x + 34, rowY, width - 55, 12, {
                fill: '#1E241E',
                stroke: '#282F28',
                'stroke-width': 1,
                rx: 6,
                opacity: 0.8
            });
            this.addElement(`load-bar-bg-${i}`, barBg);

            const barFill = this.createRect(x + 34, rowY, 10, 12, {
                fill: this.messageColor,
                rx: 6,
                opacity: 0.9
            });
            this.addElement(`load-bar-fill-${i}`, barFill);
        }
    }

    /**
     * Add batch indicator
     */
    addBatchIndicator() {
        const x = this.producer.x;
        const y = this.producer.y - 80;
        const width = 200;
        const height = 60;

        const box = this.createRect(x, y, width, height, {
            fill: '#171C17',
            stroke: this.messageColor,
            'stroke-width': 2,
            rx: 10,
            opacity: 0.9
        });
        this.addElement('batch-box', box);

        const titleEl = this.createText(
            'Current Batch',
            x + width / 2,
            y + 18,
            {
                'font-size': '10',
                'font-weight': '600',
                'fill': '#B5AFA5',
                'text-anchor': 'middle'
            }
        );
        this.addElement('batch-title', titleEl);

        const batchText = this.createText(
            `Partition ${this.stickyPartitionIndex}: ${this.stickyBatchCount}/${this.stickyBatchSize} messages`,
            x + width / 2,
            y + 40,
            {
                'font-size': '12',
                'font-weight': '700',
                'fill': this.messageColor,
                'text-anchor': 'middle'
            }
        );
        this.addElement('batch-text', batchText);
    }

    /**
     * Add consumer history display
     */
    addConsumerHistoryDisplay() {
        const historyX = this.consumer.x + this.consumer.width + 25;
        const historyY = this.consumer.y - 30;

        const historyBox = this.createRect(historyX, historyY, 160, 130, {
            fill: '#1E241E',
            stroke: '#3D4A3D',
            'stroke-width': 1,
            rx: 6,
            opacity: 0.8
        });
        this.addElement('consumer-history-box', historyBox);

        const title = this.createText(
            'Consumed (arrival order):',
            historyX + 80,
            historyY + 15,
            {
                'font-size': '9',
                'fill': '#B5AFA5',
                'text-anchor': 'middle'
            }
        );
        this.addElement('consumer-history-title', title);

        for (let j = 0; j < this.maxHistorySize; j++) {
            const msgY = historyY + 30 + (j * 16);
            const msgText = this.createText(
                '—',
                historyX + 80,
                msgY,
                {
                    'font-size': '10',
                    'fill': '#7A756C',
                    'text-anchor': 'middle',
                    'font-family': 'monospace'
                }
            );
            this.addElement(`consumer-history-msg-${j}`, msgText);
        }
    }

    /**
     * Update batch indicator display
     */
    updateBatchIndicator() {
        const batchText = this.getElement('batch-text');
        if (batchText) {
            batchText.textContent = `Partition ${this.stickyPartitionIndex}: ${this.stickyBatchCount}/${this.stickyBatchSize} messages`;
        }
    }

    /**
     * Update load indicator
     */
    updateLoadIndicator(partitionIndex) {
        const load = this.partitionLoad[partitionIndex];
        const maxVisual = 5;
        const normalized = Math.min(load, maxVisual);
        const baseWidth = 10;
        const barWidth = baseWidth + normalized * 22;

        const barFill = this.getElement(`load-bar-fill-${partitionIndex}`);
        if (barFill) {
            barFill.setAttribute('width', barWidth);
            barFill.setAttribute('fill', load > 3 ? '#E85D4C' : this.messageColor);
        }
    }

    /**
     * Update consumer history display
     */
    updateConsumerHistory(seqNum, globalNum, partitionIndex) {
        this.consumerHistory.push({ seqNum, globalNum, partitionIndex });

        if (this.consumerHistory.length > this.maxHistorySize) {
            this.consumerHistory.shift();
        }

        for (let j = 0; j < this.maxHistorySize; j++) {
            const msgElement = this.getElement(`consumer-history-msg-${j}`);
            if (msgElement) {
                if (j < this.consumerHistory.length) {
                    const msg = this.consumerHistory[j];
                    msgElement.textContent = `M${msg.globalNum} → P${msg.partitionIndex} #${msg.seqNum}`;
                    msgElement.setAttribute('fill', this.messageColor);
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
                eventBus.emit('entity:click', {
                    type: 'Producer',
                    title: 'Sticky Partitioner Producer',
                    description: 'Uses the sticky partitioner (Kafka 2.4+ default). Messages batch to the same partition until the batch is full or a timeout occurs, then switches to another partition. This improves batching efficiency and throughput.',
                    details: {
                        'Batch Size': `${this.stickyBatchSize} messages`,
                        'Current Partition': `P${this.stickyPartitionIndex}`,
                        'Batch Progress': `${this.stickyBatchCount}/${this.stickyBatchSize}`
                    }
                });
            });
        }

        this.brokers.forEach((broker, i) => {
            const el = this.getElement(`broker-${i}`);
            if (el) {
                el.addEventListener('click', () => eventBus.emit('entity:click', broker.getInfo()));
            }
        });

        const consumerEl = this.getElement('consumer');
        if (consumerEl) {
            consumerEl.addEventListener('click', () => {
                eventBus.emit('entity:click', {
                    type: 'Consumer',
                    title: 'Consumer',
                    description: 'Receives messages batched by the sticky partitioner. Notice how messages arrive in clusters from the same partition before switching.',
                    details: {
                        'Assigned Partitions': 'P0, P1, P2',
                        'Group': 'consumer-group-1'
                    }
                });
            });
        }
    }

    /**
     * Create animation timeline
     */
    createAnimationTimeline() {
        const timeline = this.animator.createTimeline({
            repeat: -1,
            repeatDelay: 2
        });

        // Send 12 messages to show batching behavior
        const messageCount = 12;
        for (let i = 0; i < messageCount; i++) {
            const delay = i * this.MESSAGE_SEND_DELAY;
            timeline.add(() => {
                this.createAndAnimateMessage();
            }, delay);
        }

        return timeline;
    }

    /**
     * Create and animate a message using sticky partitioner
     */
    createAndAnimateMessage() {
        const messageId = `message-${this.messageCount++}`;
        const producerPoint = this.producer.getEmitPoint();

        // Sticky partitioner: stay on same partition until batch is full
        const partitionIndex = this.stickyPartitionIndex;
        this.stickyBatchCount++;

        // Check if batch is full and switch partition
        if (this.stickyBatchCount >= this.stickyBatchSize) {
            this.stickyBatchCount = 0;
            this.stickyPartitionIndex = (this.stickyPartitionIndex + 1) % this.partitionCount;
        }

        this.updateBatchIndicator();

        const seqNum = this.partitionSequence[partitionIndex]++;
        const globalNum = this.globalMessageCount++;

        // Create message
        const message = new Message(messageId, producerPoint.x, producerPoint.y);
        const messageEl = message.render();

        // Add labels
        const msgLabel = this.createText(`M${globalNum}`, 0, -1, {
            'font-size': '8', 'font-weight': '700', 'fill': '#171C17', 'text-anchor': 'middle'
        });
        messageEl.appendChild(msgLabel);

        const seqLabel = this.createText(`#${seqNum}`, 0, 5, {
            'font-size': '7', 'font-weight': '600', 'fill': '#171C17', 'text-anchor': 'middle'
        });
        messageEl.appendChild(seqLabel);

        this.addElement(messageId, messageEl);
        this.messages.push(message);

        // Animate
        const broker = this.brokers[partitionIndex];
        const brokerCenter = broker.getPartitionCenter();
        const consumerPoint = this.consumer.getReceivePoint();

        this.partitionLoad[partitionIndex]++;
        this.updateLoadIndicator(partitionIndex);

        const tl = gsap.timeline({
            onComplete: () => {
                this.removeElement(messageId);
                const index = this.messages.indexOf(message);
                if (index > -1) this.messages.splice(index, 1);
                this.partitionLoad[partitionIndex] = Math.max(0, this.partitionLoad[partitionIndex] - 1);
                this.updateLoadIndicator(partitionIndex);
            }
        });

        tl.to(messageEl, {
            duration: this.ANIM_TRAVEL_DURATION,
            x: brokerCenter.x,
            y: brokerCenter.y,
            ease: 'power1.inOut'
        });

        tl.to(messageEl, { duration: this.ANIM_PAUSE_DURATION, scale: 0.9, opacity: 0.8 });
        tl.to(messageEl, { duration: this.ANIM_PAUSE_DURATION, scale: 1, opacity: 1 });

        tl.to(messageEl, {
            duration: this.ANIM_TRAVEL_DURATION,
            x: consumerPoint.x,
            y: consumerPoint.y,
            ease: 'power1.inOut'
        });

        tl.to(messageEl, {
            duration: this.ANIM_CONSUME_DURATION,
            scale: 0,
            opacity: 0,
            ease: 'power2.in',
            onStart: () => {
                this.updateConsumerHistory(seqNum, globalNum, partitionIndex);
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.messages.forEach(msg => {
            const el = this.elements.get(msg.id);
            if (el) gsap.killTweensOf(el);
        });
        this.messages = [];
        this.messageCount = 0;
        this.partitionSequence = [0, 0, 0];
        this.partitionLoad = [0, 0, 0];
        this.globalMessageCount = 0;
        this.stickyBatchCount = 0;
        this.stickyPartitionIndex = 0;
        this.consumerHistory = [];
        super.destroy();
    }
}
