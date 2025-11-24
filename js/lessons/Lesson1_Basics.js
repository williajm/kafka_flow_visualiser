/**
 * Lesson 1: The Basics
 * Demonstrates basic Kafka flow: Producer → Topic → Consumer
 * Simple message flow animation to introduce core concepts
 */

import { Scene } from '../core/Scene.js';
import { Producer } from '../kafka/Producer.js';
import { Topic } from '../kafka/Topic.js';
import { Consumer } from '../kafka/Consumer.js';
import { Message } from '../kafka/Message.js';
import { eventBus } from '../core/EventBus.js';

export class Lesson1_Basics extends Scene {
    constructor(canvas) {
        super(canvas, {
            title: 'Kafka Basics',
            description: 'Learn the fundamental flow of Kafka: Producers send messages to Topics, which Consumers then read and process.'
        });

        this.producer = null;
        this.topic = null;
        this.consumer = null;
        this.messages = [];
        this.messageCount = 0;
    }

    /**
     * Setup the scene - create and position all entities
     */
    async setup() {
        // Create entities with proper spacing
        this.producer = new Producer('producer-1', 100, 260);
        this.topic = new Topic('topic-1', 540, 250, 1);
        this.consumer = new Consumer('consumer-1', 980, 260);

        // Render entities
        const producerEl = this.producer.render();
        const topicEl = this.topic.render();
        const consumerEl = this.consumer.render();

        this.addElement('producer', producerEl);
        this.addElement('topic', topicEl);
        this.addElement('consumer', consumerEl);

        // Add click handlers for info panel
        this.setupClickHandlers();

        // Create connection lines
        this.createConnectionLines();

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
        const consumerPoint = this.consumer.getReceivePoint();

        // Producer → Topic line
        const line1 = this.createLine(
            producerPoint.x,
            producerPoint.y,
            topicReceivePoint.x,
            topicReceivePoint.y,
            {
                stroke: '#2D3561',
                'stroke-width': 2,
                'stroke-dasharray': '5,5',
                opacity: 0.5
            }
        );
        this.addElement('line1', line1);

        // Topic → Consumer line
        const line2 = this.createLine(
            topicEmitPoint.x,
            topicEmitPoint.y,
            consumerPoint.x,
            consumerPoint.y,
            {
                stroke: '#2D3561',
                'stroke-width': 2,
                'stroke-dasharray': '5,5',
                opacity: 0.5
            }
        );
        this.addElement('line2', line2);

        // Add flow arrows
        this.addFlowArrows();
    }

    /**
     * Add directional arrows to show flow
     */
    addFlowArrows() {
        const producerPoint = this.producer.getEmitPoint();
        const topicReceivePoint = this.topic.getReceivePoint();
        const topicEmitPoint = this.topic.getEmitPoint();
        const consumerPoint = this.consumer.getReceivePoint();

        // Arrow 1
        const arrow1 = this.createArrow(
            (producerPoint.x + topicReceivePoint.x) / 2,
            (producerPoint.y + topicReceivePoint.y) / 2
        );
        this.addElement('arrow1', arrow1);

        // Arrow 2
        const arrow2 = this.createArrow(
            (topicEmitPoint.x + consumerPoint.x) / 2,
            (topicEmitPoint.y + consumerPoint.y) / 2
        );
        this.addElement('arrow2', arrow2);
    }

    /**
     * Create arrow SVG element
     * @param {number} x
     * @param {number} y
     * @returns {SVGElement}
     */
    createArrow(x, y) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `
            M ${x - 8} ${y - 6}
            L ${x + 4} ${y}
            L ${x - 8} ${y + 6}
        `);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#60A5FA');
        path.setAttribute('stroke-width', 2);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('opacity', 0.6);

        return path;
    }

    /**
     * Setup click handlers for entities
     */
    setupClickHandlers() {
        const producerEl = this.getElement('producer');
        const topicEl = this.getElement('topic');
        const consumerEl = this.getElement('consumer');

        if (producerEl) {
            producerEl.addEventListener('click', () => {
                eventBus.emit('entity:click', this.producer.getInfo());
            });
        }

        if (topicEl) {
            topicEl.addEventListener('click', () => {
                eventBus.emit('entity:click', this.topic.getInfo());
            });
        }

        if (consumerEl) {
            consumerEl.addEventListener('click', () => {
                eventBus.emit('entity:click', this.consumer.getInfo());
            });
        }
    }

    /**
     * Create the animation timeline
     */
    createAnimationTimeline() {
        const timeline = this.animator.createTimeline({
            repeat: -1,  // Loop forever
            repeatDelay: 1
        });

        // Create 5 messages that flow through the system
        for (let i = 0; i < 5; i++) {
            const delay = i * 1.2; // Stagger messages

            timeline.add(() => {
                this.createAndAnimateMessage();
            }, delay);
        }

        return timeline;
    }

    /**
     * Create and animate a single message through the pipeline
     */
    createAndAnimateMessage() {
        const messageId = `message-${this.messageCount++}`;
        const producerPoint = this.producer.getEmitPoint();

        // Create message at producer
        const message = new Message(messageId, producerPoint.x, producerPoint.y);
        const messageEl = message.render();
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
        const consumerPoint = this.consumer.getReceivePoint();

        // Producer → Topic (with curved motion)
        tl.to(messageEl, {
            duration: 0.8,
            x: topicReceivePoint.x,
            y: topicReceivePoint.y,
            ease: 'power1.inOut'
        });

        // Pause at topic (storage)
        tl.to(messageEl, {
            duration: 0.3,
            scale: 0.8,
            opacity: 0.7
        });

        tl.to(messageEl, {
            duration: 0.3,
            scale: 1,
            opacity: 1,
            x: topicEmitPoint.x,
            y: topicEmitPoint.y
        });

        // Topic → Consumer (with curved motion)
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
        // Kill all GSAP animations for this scene
        this.messages.forEach(msg => {
            const el = this.elements.get(`message-${msg.id || this.messages.indexOf(msg)}`);
            if (el) gsap.killTweensOf(el);
        });
        this.messages = [];
        this.messageCount = 0;
        super.destroy();
    }
}
