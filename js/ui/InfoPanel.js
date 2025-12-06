/**
 * InfoPanel - Side panel for displaying detailed information
 * Uses Bootstrap offcanvas component
 */

import { eventBus } from '../core/EventBus.js';

export class InfoPanel {
    constructor() {
        this.panelEl = document.getElementById('infoPanel');
        this.content = document.getElementById('infoPanelContent');
        this.offcanvas = null;
        this.isOpen = false;

        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        // Initialize Bootstrap offcanvas instance
        if (typeof bootstrap !== 'undefined' && this.panelEl) {
            this.offcanvas = bootstrap.Offcanvas.getOrCreateInstance(this.panelEl);

            // Track open/close state
            this.panelEl.addEventListener('shown.bs.offcanvas', () => {
                this.isOpen = true;
            });

            this.panelEl.addEventListener('hidden.bs.offcanvas', () => {
                this.isOpen = false;
            });
        }

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
        if (this.offcanvas) {
            this.offcanvas.show();
        }
    }

    /**
     * Close info panel
     */
    close() {
        if (this.offcanvas) {
            this.offcanvas.hide();
        }
    }

    /**
     * Render content HTML
     * @param {Object} data
     * @returns {string}
     */
    renderContent(data) {
        const { type, title, description, details } = data;

        let html = `
            <div class="badge badge-${type.toLowerCase()} mb-3">${type}</div>
            <h4 class="mb-3">${title}</h4>
            <p class="text-secondary">${description}</p>
        `;

        if (details) {
            html += '<div class="mt-4">';
            for (const [label, value] of Object.entries(details)) {
                html += `
                    <div class="mb-3">
                        <div class="text-uppercase small text-muted fw-semibold mb-1">${label}</div>
                        <div class="fs-5 fw-semibold" style="font-family: var(--font-mono);">${value}</div>
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
            <div class="mt-4">
                <div class="text-uppercase small text-muted fw-semibold mb-2">Example Code</div>
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
            <div class="mt-4">
                <div class="text-uppercase small text-muted fw-semibold mb-2">Key Concepts</div>
                <p class="small text-secondary">
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
            <div class="mt-4">
                <div class="text-uppercase small text-muted fw-semibold mb-2">Example Code</div>
                <div class="code-block">
                    <code>// Subscribe and consume
await consumer.subscribe({ topic: 'events' });

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
