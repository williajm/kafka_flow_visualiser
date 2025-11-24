/**
 * Lesson 6: Consumer Group Rebalancing
 * Demonstrates:
 * - What happens when consumers join a group
 * - What happens when consumers leave a group
 * - Automatic partition reassignment during rebalancing
 * - Brief pause during rebalancing (no consumption)
 */

import { Scene } from '../core/Scene.js';
import { Producer } from '../kafka/Producer.js';
import { Broker } from '../kafka/Broker.js';
import { Consumer } from '../kafka/Consumer.js';
import { Message } from '../kafka/Message.js';
import { eventBus } from '../core/EventBus.js';

export class Lesson6_Rebalancing extends Scene {
    constructor(canvas) {
        super(canvas, {
            title: 'Consumer Group Rebalancing',
            description: 'When consumers join or leave a group, Kafka automatically rebalances partitions. During rebalancing, consumption pauses briefly while partitions are reassigned to maintain even distribution.'
        });

        this.producer = null;
        this.brokers = [];
        this.consumers = [];
        this.messages = [];
        this.messageCount = 0;
        this.partitionCount = 3;

        // Dynamic partition assignments - will change during rebalancing
        this.partitionAssignments = [0, 0, 0]; // Initially all to C0
        this.activeConsumerCount = 1; // Start with 1 active consumer

        // Track sequence numbers per partition
        this.partitionSequence = [0, 0, 0];
        this.globalMessageCount = 0;

        // Track in-flight load per consumer
        this.consumerLoad = [0, 0, 0];

        // Round-robin distribution
        this.roundRobinIndex = 0;

        // Message color
        this.messageColor = '#94A3B8';  // Gray

        // Rebalancing state
        this.isRebalancing = false;
        this.rebalancePhase = 0; // 0: 1 consumer, 1: 2 consumers, 2: 3 consumers
    }

    /**
     * Setup the scene
     */
    async setup() {
        // Producer on the left (aligned with partition 1 for straight line)
        this.producer = new Producer('producer-1', 80, 240);

        // Three brokers in the middle (vertically stacked)
        const brokerX = 380;
        const brokerStartY = 150;
        const brokerSpacing = 110;

        for (let i = 0; i < this.partitionCount; i++) {
            const broker = new Broker(`broker-${i}`, brokerX, brokerStartY + (i * brokerSpacing), i);
            this.brokers.push(broker);
        }

        // Three consumer positions on the right (we'll show/hide them)
        const consumerX = 900;
        const consumerStartY = 160;
        const consumerSpacing = 110;

        for (let i = 0; i < 3; i++) {
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

        // Initially only show consumer 0
        this.addElement('consumer-0', this.consumers[0].render());

        // Add visual elements
        this.createConnectionLines();
        this.addLabels();
        this.addConsumerGroupLabel();
        this.addRebalanceStatus();
        this.addConsumerPartitionBadges();
        this.setupClickHandlers();

        // Initially hide consumers 1 and 2
        this.hideConsumer(1);
        this.hideConsumer(2);

        // Create animation timeline
        this.createAnimationTimeline();
    }

    /**
     * Create connection lines (will be updated during rebalancing)
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

        // Brokers → Consumers (will be updated dynamically)
        this.updateConsumerLines();
    }

    /**
     * Update consumer connection lines based on current assignments
     */
    updateConsumerLines() {
        // Remove old lines
        this.brokers.forEach((_, i) => {
            this.removeElement(`line-broker-consumer-${i}`);
        });

        // Create new lines based on current assignments
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
                    stroke: '#34D399',
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
            'Consumer Group Rebalancing',
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
     * Add consumer group label
     */
    addConsumerGroupLabel() {
        const x = 900;
        const y = 80;

        const groupBox = this.createRect(x, y, 240, 30, {
            fill: '#141B3D',
            stroke: '#34D399',
            'stroke-width': 1.5,
            rx: 8,
            opacity: 0.8
        });
        this.addElement('consumer-group-box', groupBox);

        const groupLabel = this.createText(
            'Consumer Group: consumer-group-1',
            x + 120,
            y + 19,
            {
                'font-size': '10',
                'font-weight': '600',
                'fill': '#34D399',
                'text-anchor': 'middle'
            }
        );
        this.addElement('consumer-group-label', groupLabel);
    }

    /**
     * Add rebalancing status indicator
     */
    addRebalanceStatus() {
        const x = 80;
        const y = 380;
        const width = 220;
        // Taller box so all status text stays within the frame
        const height = 110;

        const box = this.createRect(x, y, width, height, {
            fill: '#0B122C',
            stroke: '#2D3561',
            'stroke-width': 1,
            rx: 10,
            opacity: 0.7
        });
        this.addElement('rebalance-box', box);

        const title = this.createText(
            'Rebalancing Status',
            x + width / 2,
            y + 18,
            {
                'font-size': '11',
                'font-weight': '700',
                'fill': '#E2E8F0',
                'text-anchor': 'middle'
            }
        );
        this.addElement('rebalance-title', title);

        // Active consumers
        const consumerLabel = this.createText(
            'Active Consumers:',
            x + 15,
            y + 45,
            {
                'font-size': '10',
                'fill': '#94A3B8',
                'text-anchor': 'start'
            }
        );
        this.addElement('consumer-count-label', consumerLabel);

        const consumerValue = this.createText(
            '1',
            x + width - 15,
            y + 45,
            {
                'font-size': '12',
                'font-weight': '700',
                'fill': '#34D399',
                'text-anchor': 'end'
            }
        );
        this.addElement('consumer-count-value', consumerValue);

        // Status
        const statusLabel = this.createText(
            'Status:',
            x + 15,
            y + 65,
            {
                'font-size': '10',
                'fill': '#94A3B8',
                'text-anchor': 'start'
            }
        );
        this.addElement('rebalance-status-label', statusLabel);

        const statusValue = this.createText(
            'Stable',
            x + width / 2,
            y + 83,
            {
                'font-size': '13',
                'font-weight': '700',
                'fill': '#34D399',
                'text-anchor': 'middle'
            }
        );
        this.addElement('rebalance-status-value', statusValue);

        // Explanation
        const note = this.createText(
            'Watch consumers join/leave.',
            x + width / 2,
            y + 102,
            {
                'font-size': '8',
                'fill': '#64748B',
                'text-anchor': 'middle',
                'font-style': 'italic'
            }
        );
        this.addElement('rebalance-note', note);
    }

    /**
     * Update rebalancing status display
     */
    updateRebalanceStatus() {
        const consumerCountEl = this.getElement('consumer-count-value');
        if (consumerCountEl) {
            consumerCountEl.textContent = this.activeConsumerCount.toString();
        }

        const statusEl = this.getElement('rebalance-status-value');
        if (statusEl) {
            if (this.isRebalancing) {
                statusEl.textContent = 'Rebalancing...';
                statusEl.setAttribute('fill', '#FBBF24'); // Yellow
            } else {
                statusEl.textContent = 'Stable';
                statusEl.setAttribute('fill', '#34D399'); // Green
            }
        }
    }

    /**
     * Add a topic frame around partitions
     */
    addTopicContainer() {
        const frame = this.createRect(330, 120, 360, 380, {
            fill: '#0B122C',
            stroke: '#2D3561',
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
                'fill': '#CBD5E1',
                'text-anchor': 'middle'
            }
        );
        label.setAttribute('pointer-events', 'none');
        this.addElement('topic-label', label);
    }

    /**
     * Show a consumer
     */
    showConsumer(index) {
        const consumer = this.consumers[index];
        const existingEl = this.getElement(`consumer-${index}`);
        if (!existingEl) {
            this.addElement(`consumer-${index}`, consumer.render());
        }

        const consumerEl = this.getElement(`consumer-${index}`);
        if (consumerEl) {
            consumerEl.style.opacity = '1';
            consumerEl.style.display = 'block';
        }

        // Show partition badges
        this.updateConsumerPartitionBadges();
    }

    /**
     * Hide a consumer
     */
    hideConsumer(index) {
        const consumerEl = this.getElement(`consumer-${index}`);
        if (consumerEl) {
            consumerEl.style.opacity = '0';
            consumerEl.style.display = 'none';
        }

        // Hide partition badges for this consumer
        for (let p = 0; p < this.partitionCount; p++) {
            const badge = this.getElement(`consumer-badge-${index}-${p}`);
            const label = this.getElement(`consumer-badge-label-${index}-${p}`);
            if (badge) badge.style.display = 'none';
            if (label) label.style.display = 'none';
        }
    }

    /**
     * Perform rebalancing
     */
    async rebalance(newConsumerCount) {
        this.isRebalancing = true;
        this.activeConsumerCount = newConsumerCount;
        this.updateRebalanceStatus();

        // Pause for rebalancing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update partition assignments based on consumer count
        if (newConsumerCount === 1) {
            this.partitionAssignments = [0, 0, 0]; // All to C0
            this.hideConsumer(1);
            this.hideConsumer(2);
        } else if (newConsumerCount === 2) {
            this.partitionAssignments = [0, 0, 1]; // P0,P1→C0, P2→C1
            this.showConsumer(1);
            this.hideConsumer(2);
        } else if (newConsumerCount === 3) {
            this.partitionAssignments = [0, 1, 2]; // P0→C0, P1→C1, P2→C2
            this.showConsumer(1);
            this.showConsumer(2);
        }

        // Update connection lines
        this.updateConsumerLines();

        // Update partition badges
        this.updateConsumerPartitionBadges();

        this.isRebalancing = false;
        this.updateRebalanceStatus();
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
                    info.description += ` Currently assigned to Consumer ${consumerIndex}.`;
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
                    if (partitions.length > 0) {
                        info.description = `Consumer ${i} is assigned partitions: ${partitions.map(p => `P${p}`).join(', ')}. During rebalancing, assignments may change.`;
                        info.details['Assigned Partition(s)'] = partitions.map(p => `P${p}`).join(', ');
                    } else {
                        info.description = `Consumer ${i} is currently inactive.`;
                    }
                    info.details['Consumer Group'] = 'consumer-group-1';
                    eventBus.emit('entity:click', info);
                });
            }
        });
    }

    /**
     * Create animation timeline with rebalancing events
     */
    createAnimationTimeline() {
        const timeline = this.animator.createTimeline({
            repeat: -1,
            repeatDelay: 2
        });

        let time = 0;

        // Phase 1: Start with 1 consumer (messages 0-4)
        for (let i = 0; i < 5; i++) {
            timeline.add(() => {
                if (!this.isRebalancing) {
                    this.createAndAnimateMessage();
                }
            }, time);
            time += 0.65;
        }

        // Add consumer 2 (rebalance to 2 consumers)
        timeline.add(async () => {
            await this.rebalance(2);
        }, time);
        time += 2;

        // Phase 2: 2 consumers (messages 5-9)
        for (let i = 0; i < 5; i++) {
            timeline.add(() => {
                if (!this.isRebalancing) {
                    this.createAndAnimateMessage();
                }
            }, time);
            time += 0.65;
        }

        // Add consumer 3 (rebalance to 3 consumers)
        timeline.add(async () => {
            await this.rebalance(3);
        }, time);
        time += 2;

        // Phase 3: 3 consumers (messages 10-14)
        for (let i = 0; i < 5; i++) {
            timeline.add(() => {
                if (!this.isRebalancing) {
                    this.createAndAnimateMessage();
                }
            }, time);
            time += 0.65;
        }

        // Remove consumers (rebalance back to 1 consumer)
        timeline.add(async () => {
            await this.rebalance(1);
        }, time);
        time += 2;

        return timeline;
    }

    /**
     * Add inline partition badges to each consumer
     */
    addConsumerPartitionBadges() {
        this.consumers.forEach((consumer, i) => {
            const partitions = this.getPartitionsForConsumer(i);
            const badgeHeight = 18;
            const totalWidth = partitions.length * 30 + Math.max(0, partitions.length - 1) * 4;
            const badgeX = consumer.x + consumer.width - totalWidth - 12;
            const badgeY = consumer.y + 8;

            partitions.forEach((p, idx) => {
                const badgeWidth = 30;
                const xOffset = badgeX + idx * (badgeWidth + 4);

                // Remove existing badge if it exists
                this.removeElement(`consumer-badge-${i}-${p}`);
                this.removeElement(`consumer-badge-label-${i}-${p}`);

                const badge = this.createRect(xOffset, badgeY, badgeWidth, badgeHeight, {
                    fill: '#0B122C',
                    stroke: '#34D399',
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
                        'fill': '#D1FAE5',
                        'text-anchor': 'middle'
                    }
                );
                label.setAttribute('pointer-events', 'none');
                this.addElement(`consumer-badge-label-${i}-${p}`, label);
            });
        });
    }

    /**
     * Update partition badges for all consumers
     */
    updateConsumerPartitionBadges() {
        // Clear all badges first
        for (let i = 0; i < 3; i++) {
            for (let p = 0; p < this.partitionCount; p++) {
                this.removeElement(`consumer-badge-${i}-${p}`);
                this.removeElement(`consumer-badge-label-${i}-${p}`);
            }
        }

        // Recreate badges based on current assignments
        this.addConsumerPartitionBadges();
    }

    /**
     * Create and animate message in round-robin fashion
     */
    createAndAnimateMessage() {
        if (this.isRebalancing) return; // Don't send messages during rebalancing

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
            if (circle.getAttribute('fill') === '#FBBF24') {
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
                'fill': '#0A0E27',
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
                'fill': '#0A0E27',
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
            }
        });

        // Increment load when message is created
        this.consumerLoad[consumerIndex] += 1;

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
            ease: 'power2.in'
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
        this.consumerLoad = [0, 0, 0];
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
}
