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
            description: 'Partitions divide topics across brokers for scalability. Messages with keys maintain order within partitions. Messages without keys distribute round-robin.'
        });

        this.producer = null;
        this.brokers = [];
        this.consumers = [];
        this.messages = [];
        this.messageCount = 0;
        this.partitionCount = 3;

        // Track sequence numbers per partition
        this.partitionSequence = [0, 0, 0];

        // Track GLOBAL message order (to show cross-partition ordering doesn't matter)
        this.globalMessageCount = 0;

        // Track message history per consumer (for display)
        this.consumerHistory = [[], [], []];
        this.maxHistorySize = 3;

        // Two modes: 'keyed' and 'round-robin'
        this.mode = 'keyed';
        this.roundRobinIndex = 0;

        // Key mappings for keyed mode
        this.keyToPartition = {
            'user-A': 0,
            'user-B': 1,
            'user-C': 2
        };

        this.keyColors = {
            'user-A': '#22D3EE',  // Cyan
            'user-B': '#FBBF24',  // Yellow
            'user-C': '#F472B6'   // Pink
        };
    }

    /**
     * Setup the scene
     */
    async setup() {
        // Producer on the left
        this.producer = new Producer('producer-1', 80, 230);

        // Three brokers in the middle (vertically stacked to show distribution)
        const brokerX = 380;
        const brokerStartY = 120;
        const brokerSpacing = 110;

        for (let i = 0; i < this.partitionCount; i++) {
            const broker = new Broker(`broker-${i}`, brokerX, brokerStartY + (i * brokerSpacing), i);
            this.brokers.push(broker);
        }

        // Three consumers on the right
        const consumerX = 900;
        const consumerStartY = 150;
        const consumerSpacing = 110;

        for (let i = 0; i < this.partitionCount; i++) {
            const consumer = new Consumer(`consumer-${i}`, consumerX, consumerStartY + (i * consumerSpacing), 'consumer-group-1');
            this.consumers.push(consumer);
        }

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
        this.addModeIndicator();
        this.addLegend();
        this.addConsumerHistoryDisplays();
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
                    stroke: '#2D3561',
                    'stroke-width': 1,
                    'stroke-dasharray': '3,3',
                    opacity: 0.4
                }
            );
            this.addElement(`line-producer-broker-${i}`, line);
        });

        // Brokers → Consumers (one-to-one)
        this.brokers.forEach((broker, i) => {
            const brokerPoint = broker.getEmitPoint();
            const consumerPoint = this.consumers[i].getReceivePoint();
            const line = this.createLine(
                brokerPoint.x,
                brokerPoint.y,
                consumerPoint.x,
                consumerPoint.y,
                {
                    stroke: '#2D3561',
                    'stroke-width': 1,
                    'stroke-dasharray': '3,3',
                    opacity: 0.4
                }
            );
            this.addElement(`line-broker-consumer-${i}`, line);
        });
    }

    /**
     * Add labels
     */
    addLabels() {
        // Consumer labels
        this.consumers.forEach((consumer, i) => {
            const point = consumer.getReceivePoint();
            const label = this.createText(
                `C${i}`,
                point.x + consumer.width + 20,
                point.y + 5,
                {
                    'font-size': '12',
                    'font-weight': '600',
                    'fill': '#34D399'
                }
            );
            this.addElement(`consumer-label-${i}`, label);
        });

        // Title
        const title = this.createText(
            'Distributed Partitions Across Brokers',
            600,
            50,
            {
                'font-size': '14',
                'font-weight': '600',
                'fill': '#E2E8F0',
                'text-anchor': 'middle'
            }
        );
        this.addElement('title', title);
    }

    /**
     * Add mode indicator
     */
    addModeIndicator() {
        const x = 80;
        const y = 520;

        const modeBox = this.createRect(x, y, 200, 60, {
            fill: '#141B3D',
            stroke: '#2D3561',
            'stroke-width': 1,
            rx: 8
        });
        this.addElement('mode-box', modeBox);

        const modeTitle = this.createText(
            'Current Mode:',
            x + 100,
            y + 20,
            {
                'font-size': '11',
                'fill': '#94A3B8',
                'text-anchor': 'middle'
            }
        );
        this.addElement('mode-title', modeTitle);

        const modeValue = this.createText(
            'Key-Based Routing',
            x + 100,
            y + 40,
            {
                'font-size': '13',
                'font-weight': '700',
                'fill': '#60A5FA',
                'text-anchor': 'middle'
            }
        );
        this.addElement('mode-value', modeValue);
    }

    /**
     * Add legend
     */
    addLegend() {
        const x = 80;
        const y = 80;

        // Keyed mode legend
        const title = this.createText(
            'Message Keys:',
            x,
            y,
            {
                'font-size': '11',
                'font-weight': '600',
                'fill': '#E2E8F0',
                'text-anchor': 'start'
            }
        );
        this.addElement('legend-title', title);

        Object.entries(this.keyColors).forEach(([key, color], i) => {
            const yPos = y + 18 + (i * 18);

            const circle = this.createCircle(x + 5, yPos, 4, {
                fill: color,
                opacity: 0.9
            });
            this.addElement(`legend-circle-${key}`, circle);

            const label = this.createText(
                key,
                x + 15,
                yPos + 4,
                {
                    'font-size': '10',
                    'fill': '#94A3B8',
                    'text-anchor': 'start'
                }
            );
            this.addElement(`legend-label-${key}`, label);

            const partition = this.keyToPartition[key];
            const partLabel = this.createText(
                `→ P${partition}`,
                x + 65,
                yPos + 4,
                {
                    'font-size': '10',
                    'fill': '#22D3EE',
                    'text-anchor': 'start'
                }
            );
            this.addElement(`legend-part-${key}`, partLabel);
        });

        // Explanation note
        const note1 = this.createText(
            'Watch: Same key → same partition → ordered!',
            x,
            y + 75,
            {
                'font-size': '9',
                'fill': '#64748B',
                'text-anchor': 'start',
                'font-style': 'italic'
            }
        );
        this.addElement('legend-note-1', note1);

        const note2 = this.createText(
            'Numbers in ( ) = global order - may be out of sequence!',
            x,
            y + 90,
            {
                'font-size': '8',
                'fill': '#64748B',
                'text-anchor': 'start',
                'font-style': 'italic'
            }
        );
        this.addElement('legend-note-2', note2);

        const note3 = this.createText(
            'Gray messages = no key (round-robin distribution)',
            x,
            y + 103,
            {
                'font-size': '8',
                'fill': '#64748B',
                'text-anchor': 'start',
                'font-style': 'italic'
            }
        );
        this.addElement('legend-note-3', note3);
    }

    /**
     * Add consumer history displays
     */
    addConsumerHistoryDisplays() {
        this.consumers.forEach((consumer, i) => {
            const historyX = consumer.x + consumer.width + 35;
            const historyY = consumer.y - 10;

            // History box background
            const historyBox = this.createRect(historyX, historyY, 130, 90, {
                fill: '#141B3D',
                stroke: '#2D3561',
                'stroke-width': 1,
                rx: 6,
                opacity: 0.8
            });
            this.addElement(`consumer-${i}-history-box`, historyBox);

            // Title
            const title = this.createText(
                'Consumed (partition order):',
                historyX + 65,
                historyY + 15,
                {
                    'font-size': '9',
                    'fill': '#94A3B8',
                    'text-anchor': 'middle'
                }
            );
            this.addElement(`consumer-${i}-history-title`, title);

            // Placeholder for messages (will be updated dynamically)
            for (let j = 0; j < this.maxHistorySize; j++) {
                const msgY = historyY + 33 + (j * 18);

                const msgText = this.createText(
                    '—',
                    historyX + 65,
                    msgY,
                    {
                        'font-size': '10',
                        'fill': '#64748B',
                        'text-anchor': 'middle',
                        'font-family': 'monospace'
                    }
                );
                this.addElement(`consumer-${i}-history-msg-${j}`, msgText);
            }
        });
    }

    /**
     * Update consumer history display
     * @param {number} consumerIndex
     * @param {string} key
     * @param {number} seqNum
     * @param {number} globalNum
     * @param {string} color
     */
    updateConsumerHistory(consumerIndex, key, seqNum, globalNum, color) {
        const history = this.consumerHistory[consumerIndex];

        // Add new message to history
        history.push({ key, seqNum, globalNum, color });

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
                    // Show: "A #1 (msg 4)" - partition order + global order
                    msgElement.textContent = `${msg.key.split('-')[1]} #${msg.seqNum} (${msg.globalNum})`;
                    msgElement.setAttribute('fill', msg.color);
                    msgElement.setAttribute('opacity', '1');
                } else {
                    msgElement.textContent = '—';
                    msgElement.setAttribute('fill', '#64748B');
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
                info.description += ` In key-based mode, the producer hashes the message key to determine the target partition. In round-robin mode, messages distribute evenly.`;
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
                    info.description = `Consumer ${i} reads only from Partition ${i}. Multiple consumers enable parallel processing for high throughput.`;
                    info.details['Assigned Partition'] = `P${i}`;
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
            repeatDelay: 3
        });

        // PHASE 1: Keyed messages (first 8 messages)
        const keyedSequence = [
            'user-A',  // P0 - seq 0
            'user-B',  // P1 - seq 0
            'user-C',  // P2 - seq 0
            'user-A',  // P0 - seq 1 (shows ordering!)
            'user-B',  // P1 - seq 1
            'user-A',  // P0 - seq 2 (3 in a row to same partition!)
            'user-C',  // P2 - seq 1
            'user-B',  // P1 - seq 2
        ];

        keyedSequence.forEach((key, i) => {
            const delay = i * 0.55;
            // Add random jitter (±0.2s) to show cross-partition ordering issues
            const jitter = (Math.random() - 0.5) * 0.4;
            timeline.add(() => {
                this.createAndAnimateMessage(key, true);
            }, delay + jitter);
        });

        // Switch to round-robin mode
        const switchTime = keyedSequence.length * 0.55 + 1.5;
        timeline.add(() => {
            this.switchMode('round-robin');
        }, switchTime);

        // PHASE 2: Round-robin messages (next 9 messages)
        const roundRobinCount = 9;
        for (let i = 0; i < roundRobinCount; i++) {
            const delay = switchTime + 0.5 + (i * 0.55);
            const jitter = (Math.random() - 0.5) * 0.4;
            timeline.add(() => {
                this.createAndAnimateMessage(null, false); // null = round-robin
            }, delay + jitter);
        }

        // Switch back to keyed mode
        const switchBackTime = switchTime + 0.5 + (roundRobinCount * 0.55) + 1.5;
        timeline.add(() => {
            this.switchMode('keyed');
        }, switchBackTime);

        return timeline;
    }

    /**
     * Switch between keyed and round-robin modes
     * @param {string} mode - 'keyed' or 'round-robin'
     */
    switchMode(mode) {
        this.mode = mode;

        // Update mode indicator
        const modeValueEl = this.getElement('mode-value');
        if (modeValueEl) {
            modeValueEl.textContent = mode === 'keyed' ? 'Key-Based Routing' : 'Round-Robin';
            modeValueEl.setAttribute('fill', mode === 'keyed' ? '#60A5FA' : '#F59E0B');
        }
    }

    /**
     * Create and animate message with key or round-robin
     * @param {string|null} key - Message key (or null for round-robin)
     * @param {boolean} isKeyed - Whether this is keyed mode
     */
    createAndAnimateMessage(key, isKeyed = true) {
        const messageId = `message-${this.messageCount++}`;
        const producerPoint = this.producer.getEmitPoint();

        let partitionIndex;
        let messageColor;

        if (isKeyed && key) {
            // Keyed mode: use key to determine partition
            partitionIndex = this.keyToPartition[key];
            messageColor = this.keyColors[key];
        } else {
            // Round-robin mode: distribute evenly
            partitionIndex = this.roundRobinIndex;
            this.roundRobinIndex = (this.roundRobinIndex + 1) % this.partitionCount;

            // Use a neutral gray color for round-robin messages
            messageColor = '#94A3B8';
            key = `msg-${this.messageCount}`;
        }

        // Get sequence number for this partition AND global number
        const seqNum = this.partitionSequence[partitionIndex]++;
        const globalNum = this.globalMessageCount++;

        // Create message
        const message = new Message(messageId, producerPoint.x, producerPoint.y);
        const messageEl = message.render();

        // Color the message
        const circles = messageEl.querySelectorAll('circle');
        circles.forEach(circle => {
            if (circle.getAttribute('fill') === '#FBBF24') {
                circle.setAttribute('fill', messageColor);
            }
        });

        // Add key label
        const displayKey = isKeyed && key.includes('user-')
            ? key.split('-')[1]  // "A", "B", "C"
            : `M${globalNum}`;    // "M1", "M2", etc. for round-robin

        const keyLabel = this.createText(
            displayKey,
            0,
            -1,
            {
                'font-size': '8',
                'font-weight': '700',
                'fill': '#0A0E27',
                'text-anchor': 'middle'
            }
        );
        messageEl.appendChild(keyLabel);

        // Add sequence number
        const seqLabel = this.createText(
            `#${seqNum}`,
            0,
            5,
            {
                'font-size': '7',
                'font-weight': '600',
                'fill': '#0A0E27',
                'text-anchor': 'middle'
            }
        );
        messageEl.appendChild(seqLabel);

        this.addElement(messageId, messageEl);
        this.messages.push(message);

        // Animate
        const broker = this.brokers[partitionIndex];
        const consumer = this.consumers[partitionIndex];

        const brokerCenter = broker.getPartitionCenter();
        const consumerPoint = consumer.getReceivePoint();

        const tl = gsap.timeline({
            onComplete: () => {
                this.removeElement(messageId);
                const index = this.messages.indexOf(message);
                if (index > -1) this.messages.splice(index, 1);
            }
        });

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
                const displayKey = isKeyed && key.includes('user-') ? key : `M${globalNum}`;
                this.updateConsumerHistory(partitionIndex, displayKey, seqNum, globalNum, messageColor);
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.messages = [];
        this.messageCount = 0;
        this.partitionSequence = [0, 0, 0];
        this.globalMessageCount = 0;
        this.consumerHistory = [[], [], []];
        super.destroy();
    }
}
