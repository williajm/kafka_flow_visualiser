/**
 * Lesson 5: Offsets & Lag
 * Demonstrates:
 * - Offsets as position markers in partitions
 * - Consumer offset tracking
 * - Lag (difference between latest offset and consumer offset)
 * - Visual representation of committed offsets
 */

import { Scene } from '../core/Scene.js';
import { Producer } from '../kafka/Producer.js';
import { Broker } from '../kafka/Broker.js';
import { Consumer } from '../kafka/Consumer.js';
import { Message } from '../kafka/Message.js';
import { eventBus } from '../core/EventBus.js';

export class Lesson5_Offsets extends Scene {
    constructor(canvas) {
        super(canvas, {
            title: 'Kafka Offsets & Consumer Lag',
            description: 'Offsets track message positions in partitions. Consumer lag shows how far behind a consumer is from the latest message. Consumers commit offsets to track their progress.'
        });

        this.producer = null;
        this.brokers = [];
        this.consumers = [];
        this.messages = [];
        this.messageCount = 0;
        this.partitionCount = 1; // Single partition to clearly show offset progression
        this.partitionAssignments = [0];
        this.consumerCount = 1;

        // Track offsets per partition
        this.latestOffsets = [0]; // Latest message offset in partition
        this.consumerOffsets = [0]; // Consumer's committed offset

        // Track in-flight messages (not yet consumed)
        this.inflightMessages = [];

        // Message color
        this.messageColor = '#B5AFA5';  // Gray

        // Slow down consumer to create lag
        this.consumerDelay = 1.5; // Extra delay before consuming

        // Animation constants
        this.ANIM_TRAVEL_DURATION = 0.7;
        this.ANIM_PAUSE_DURATION = 0.2;
        this.ANIM_CONSUME_DURATION = 0.3;
        this.MESSAGE_SEND_DELAY = 0.8; // Slower in this lesson
    }

    /**
     * Setup the scene
     */
    async setup() {
        // Producer on the left (aligned with partition for straight line)
        this.producer = new Producer('producer-1', 80, 290);

        // Single broker in the middle
        const broker = new Broker('broker-0', 380, 280, 0);
        this.brokers.push(broker);

        // Single consumer on the right
        // Align consumer with partition for straight line
        const consumer = new Consumer('consumer-0', 900, 290, 'consumer-group-1');
        this.consumers.push(consumer);

        // Add topic container behind broker
        this.addTopicContainer();

        // Render everything
        this.addElement('producer', this.producer.render());
        this.addElement('broker-0', broker.render());
        this.addElement('consumer-0', consumer.render());

        // Add visual elements
        this.createConnectionLines();
        this.addLabels();
        this.addOffsetDisplay();
        this.addLagIndicator();
        this.addConsumerPartitionBadges();
        this.setupClickHandlers();

        // Create animation timeline
        this.createAnimationTimeline();
    }

    /**
     * Create connection lines
     */
    createConnectionLines() {
        const producerPoint = this.producer.getEmitPoint();
        const brokerPoint = this.brokers[0].getReceivePoint();
        const brokerEmitPoint = this.brokers[0].getEmitPoint();
        const consumerPoint = this.consumers[0].getReceivePoint();

        // Producer → Broker
        const line1 = this.createLine(
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
        this.addElement('line-producer-broker', line1);

        // Broker → Consumer
        const line2 = this.createLine(
            brokerEmitPoint.x,
            brokerEmitPoint.y,
            consumerPoint.x,
            consumerPoint.y,
            {
                stroke: '#6B9E9E',
                'stroke-width': 2,
                'stroke-dasharray': '5,5',
                opacity: 0.6
            }
        );
        this.addElement('line-broker-consumer', line2);
    }

    /**
     * Add labels
     */
    addLabels() {
        // Title
        const title = this.createText(
            'Consumer Offsets & Lag',
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
     * Add a topic frame around broker
     */
    addTopicContainer() {
        const frame = this.createRect(330, 250, 360, 80, {
            fill: '#171C17',
            stroke: '#3D4A3D',
            'stroke-width': 2,
            rx: 12,
            opacity: 0.25
        });
        frame.setAttribute('pointer-events', 'none');
        this.addElement('topic-frame', frame);

        const label = this.createText(
            'Topic: events (Partition 0)',
            510,
            270,
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
     * Add offset display showing latest and consumer offsets
     */
    addOffsetDisplay() {
        const x = 80;
        const y = 380;
        const width = 260;
        const height = 110;

        const box = this.createRect(x, y, width, height, {
            fill: '#171C17',
            stroke: '#3D4A3D',
            'stroke-width': 1,
            rx: 10,
            opacity: 0.7
        });
        this.addElement('offset-box', box);

        const title = this.createText(
            'Offset Tracking',
            x + width / 2,
            y + 18,
            {
                'font-size': '11',
                'font-weight': '700',
                'fill': '#FAF6F0',
                'text-anchor': 'middle'
            }
        );
        this.addElement('offset-title', title);

        // Latest offset
        const latestLabel = this.createText(
            'Latest Offset (P0):',
            x + 15,
            y + 45,
            {
                'font-size': '10',
                'fill': '#B5AFA5',
                'text-anchor': 'start'
            }
        );
        this.addElement('latest-offset-label', latestLabel);

        const latestValue = this.createText(
            '0',
            x + width - 15,
            y + 45,
            {
                'font-size': '12',
                'font-weight': '700',
                'fill': '#7B9E7B',
                'text-anchor': 'end'
            }
        );
        this.addElement('latest-offset-value', latestValue);

        // Consumer offset
        const consumerLabel = this.createText(
            'Consumer Offset (C0):',
            x + 15,
            y + 68,
            {
                'font-size': '10',
                'fill': '#B5AFA5',
                'text-anchor': 'start'
            }
        );
        this.addElement('consumer-offset-label', consumerLabel);

        const consumerValue = this.createText(
            '0',
            x + width - 15,
            y + 68,
            {
                'font-size': '12',
                'font-weight': '700',
                'fill': '#6B9E9E',
                'text-anchor': 'end'
            }
        );
        this.addElement('consumer-offset-value', consumerValue);

        // Explanation
        const note = this.createText(
            'Consumer commits offsets to track progress.',
            x + width / 2,
            y + height - 10,
            {
                'font-size': '8',
                'fill': '#7A756C',
                'text-anchor': 'middle',
                'font-style': 'italic'
            }
        );
        this.addElement('offset-note', note);
    }

    /**
     * Add lag indicator
     */
    addLagIndicator() {
        const x = 720;
        const y = 380;
        const width = 380;
        const height = 110;

        const box = this.createRect(x, y, width, height, {
            fill: '#171C17',
            stroke: '#3D4A3D',
            'stroke-width': 1,
            rx: 10,
            opacity: 0.7
        });
        this.addElement('lag-box', box);

        const title = this.createText(
            'Consumer Lag',
            x + width / 2,
            y + 18,
            {
                'font-size': '11',
                'font-weight': '700',
                'fill': '#FAF6F0',
                'text-anchor': 'middle'
            }
        );
        this.addElement('lag-title', title);

        // Lag value
        const lagLabel = this.createText(
            'Lag (messages behind):',
            x + 15,
            y + 50,
            {
                'font-size': '10',
                'fill': '#B5AFA5',
                'text-anchor': 'start'
            }
        );
        this.addElement('lag-label', lagLabel);

        const lagValue = this.createText(
            '0',
            x + width / 2,
            y + 75,
            {
                'font-size': '24',
                'font-weight': '700',
                'fill': '#6B9E9E',
                'text-anchor': 'middle'
            }
        );
        this.addElement('lag-value', lagValue);

        // Explanation
        const note = this.createText(
            'Lag = Latest Offset - Consumer Offset. High lag means consumer is falling behind.',
            x + width / 2,
            y + height - 10,
            {
                'font-size': '8',
                'fill': '#7A756C',
                'text-anchor': 'middle',
                'font-style': 'italic'
            }
        );
        this.addElement('lag-note', note);
    }

    /**
     * Update offset displays
     */
    updateOffsetDisplays() {
        const latestOffset = this.latestOffsets[0];
        const consumerOffset = this.consumerOffsets[0];
        const lag = latestOffset - consumerOffset;

        // Update latest offset
        const latestEl = this.getElement('latest-offset-value');
        if (latestEl) {
            latestEl.textContent = latestOffset.toString();
        }

        // Update consumer offset
        const consumerEl = this.getElement('consumer-offset-value');
        if (consumerEl) {
            consumerEl.textContent = consumerOffset.toString();
        }

        // Update lag
        const lagEl = this.getElement('lag-value');
        if (lagEl) {
            lagEl.textContent = lag.toString();
            // Color code lag
            if (lag === 0) {
                lagEl.setAttribute('fill', '#6B9E9E'); // Green - no lag
            } else if (lag < 3) {
                lagEl.setAttribute('fill', '#D4A855'); // Yellow - low lag
            } else {
                lagEl.setAttribute('fill', '#C2785C'); // Red - high lag
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
                info.description += ` Each message sent gets assigned a sequential offset number in the partition.`;
                eventBus.emit('entity:click', info);
            });
        }

        const brokerEl = this.getElement('broker-0');
        if (brokerEl) {
            brokerEl.addEventListener('click', () => {
                const info = this.brokers[0].getInfo();
                info.description += ` The partition stores messages with sequential offsets. Latest offset: ${this.latestOffsets[0]}.`;
                info.details['Latest Offset'] = this.latestOffsets[0].toString();
                eventBus.emit('entity:click', info);
            });
        }

        const consumerEl = this.getElement('consumer-0');
        if (consumerEl) {
            consumerEl.addEventListener('click', () => {
                const info = this.consumers[0].getInfo();
                const lag = this.latestOffsets[0] - this.consumerOffsets[0];
                info.description = `Consumer tracks its position with committed offsets. Current offset: ${this.consumerOffsets[0]}, Lag: ${lag} messages.`;
                info.details['Consumer Offset'] = this.consumerOffsets[0].toString();
                info.details['Lag'] = `${lag} messages`;
                eventBus.emit('entity:click', info);
            });
        }
    }

    /**
     * Create animation timeline
     */
    createAnimationTimeline() {
        const timeline = this.animator.createTimeline({
            repeat: -1,
            repeatDelay: 3
        });

        // Send messages with varying pace to create lag
        const messageCount = 12;
        for (let i = 0; i < messageCount; i++) {
            // Speed up production midway to increase lag
            const delay = i * (i < 6 ? 0.8 : 0.5);
            timeline.add(() => {
                this.createAndAnimateMessage();
            }, delay);
        }

        return timeline;
    }

    /**
     * Add inline partition badges to consumer
     */
    addConsumerPartitionBadges() {
        const consumer = this.consumers[0];
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
        this.addElement('consumer-badge-0', badge);

        const label = this.createText(
            'P0',
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
        this.addElement('consumer-badge-label-0', label);
    }

    /**
     * Create and animate message with offset tracking
     */
    createAndAnimateMessage() {
        const messageId = `message-${this.messageCount++}`;
        const producerPoint = this.producer.getEmitPoint();

        const partitionIndex = 0;
        const consumerIndex = 0;

        // Assign offset (latest offset becomes this message's offset)
        const messageOffset = this.latestOffsets[partitionIndex];
        this.latestOffsets[partitionIndex]++;

        // Update displays immediately when message is produced
        this.updateOffsetDisplays();

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

        // Add offset label
        const offsetLabel = this.createText(
            `#${messageOffset}`,
            0,
            0,
            {
                'font-size': '9',
                'font-weight': '700',
                'fill': '#171C17',
                'text-anchor': 'middle'
            }
        );
        messageEl.appendChild(offsetLabel);

        this.addElement(messageId, messageEl);
        this.messages.push(message);
        this.inflightMessages.push({ messageId, offset: messageOffset });

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

                // Remove from inflight
                const inflightIndex = this.inflightMessages.findIndex(m => m.messageId === messageId);
                if (inflightIndex > -1) this.inflightMessages.splice(inflightIndex, 1);
            }
        });

        // Producer → Broker/Partition
        tl.to(messageEl, {
            duration: 0.7,
            x: brokerCenter.x,
            y: brokerCenter.y,
            ease: 'power1.inOut'
        });

        // Pause at partition (consumer is slow)
        tl.to(messageEl, {
            duration: this.consumerDelay,
            scale: 1,
            opacity: 0.8
        });

        // Partition → Consumer
        tl.to(messageEl, {
            duration: 0.7,
            x: consumerPoint.x,
            y: consumerPoint.y,
            opacity: 1,
            ease: 'power1.inOut'
        });

        // Consume and commit offset
        tl.to(messageEl, {
            duration: 0.3,
            scale: 0,
            opacity: 0,
            ease: 'power2.in',
            onStart: () => {
                // Consumer commits offset after consuming
                this.consumerOffsets[partitionIndex] = messageOffset + 1;
                this.updateOffsetDisplays();
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
        this.latestOffsets = [0];
        this.consumerOffsets = [0];
        this.inflightMessages = [];
        super.destroy();
    }
}
