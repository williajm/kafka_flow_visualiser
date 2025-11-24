/**
 * InfoPanel - Side panel for displaying detailed information
 * Slides in when user clicks on Kafka components
 */

import { eventBus } from '../core/EventBus.js';

export class InfoPanel {
    constructor() {
        this.panel = document.getElementById('infoPanel');
        this.closeBtn = document.getElementById('infoPanelClose');
        this.content = document.getElementById('infoPanelContent');
        this.isOpen = false;

        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        this.closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Listen for entity click events
        eventBus.on('entity:click', (data) => {
            this.show(data);
        });
    }

    /**
     * Show info panel with content
     * @param {Object} data - Entity information
     */
    show(data) {
        this.content.innerHTML = this.renderContent(data);
        this.panel.classList.add('open');
        this.isOpen = true;
    }

    /**
     * Close info panel
     */
    close() {
        this.panel.classList.remove('open');
        this.isOpen = false;
    }

    /**
     * Render content HTML
     * @param {Object} data
     * @returns {string}
     */
    renderContent(data) {
        const { type, title, description, details } = data;

        let html = `
            <div class="badge badge-${type.toLowerCase()}">${type}</div>
            <h3 style="margin-top: 1rem;">${title}</h3>
            <p>${description}</p>
        `;

        if (details) {
            html += '<div style="margin-top: 2rem;">';
            for (const [label, value] of Object.entries(details)) {
                html += `
                    <div style="margin-bottom: 1rem;">
                        <div class="info-label">${label}</div>
                        <div class="info-value">${value}</div>
                    </div>
                `;
            }
            html += '</div>';
        }

        // Add example code if available
        if (type === 'Producer') {
            html += this.getProducerExample();
        } else if (type === 'Topic') {
            html += this.getTopicExample();
        } else if (type === 'Consumer') {
            html += this.getConsumerExample();
        }

        return html;
    }

    /**
     * Get producer code example
     * @returns {string}
     */
    getProducerExample() {
        return `
            <div style="margin-top: 2rem;">
                <div class="info-label">Example Code</div>
                <div class="code-block">
                    <code>// Send message to topic
producer.send({
  topic: 'events',
  messages: [{
    value: 'Hello Kafka'
  }]
});</code>
                </div>
            </div>
        `;
    }

    /**
     * Get topic code example
     * @returns {string}
     */
    getTopicExample() {
        return `
            <div style="margin-top: 2rem;">
                <div class="info-label">Key Concepts</div>
                <p style="font-size: 0.875rem; color: var(--text-secondary);">
                    Topics are divided into <strong>partitions</strong> for parallel processing.
                    Messages with the same key go to the same partition, preserving order.
                </p>
            </div>
        `;
    }

    /**
     * Get consumer code example
     * @returns {string}
     */
    getConsumerExample() {
        return `
            <div style="margin-top: 2rem;">
                <div class="info-label">Example Code</div>
                <div class="code-block">
                    <code>// Subscribe and consume
consumer.subscribe(['events']);

await consumer.run({
  eachMessage: async ({ message }) => {
    console.log(message.value);
  }
});</code>
                </div>
            </div>
        `;
    }
}
