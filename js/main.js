/**
 * Main Application Entry Point
 * Initializes all components and manages application state
 */

import { eventBus } from './core/EventBus.js';
import { Controls } from './ui/Controls.js';
import { InfoPanel } from './ui/InfoPanel.js';
import { Navigation } from './ui/Navigation.js';
import { Lesson1_Basics } from './lessons/Lesson1_Basics.js';
import { Lesson2_Partitions } from './lessons/Lesson2_Partitions.js';
import { Lesson3_PartitionsWithKeys } from './lessons/Lesson3_PartitionsWithKeys.js';
import { Lesson4_ConsumerGroups } from './lessons/Lesson4_ConsumerGroups.js';
import { Lesson5_Offsets } from './lessons/Lesson5_Offsets.js';
import { Lesson6_Rebalancing } from './lessons/Lesson6_Rebalancing.js';
import { Broker } from './kafka/Broker.js';

class KafkaFlowVisualizer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.currentScene = null;
        this.lessons = new Map();

        // Initialize UI components
        this.controls = new Controls();
        this.infoPanel = new InfoPanel();
        this.navigation = new Navigation();

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Register all lessons
        this.registerLessons();

        // Setup event listeners
        this.setupEventListeners();

        // Load the first lesson
        await this.loadLesson('basics');

        console.log('🚀 Kafka Flow Visualizer initialized');
    }

    /**
     * Register all available lessons
     */
    registerLessons() {
        this.lessons.set('basics', Lesson1_Basics);
        this.lessons.set('partitions', Lesson2_Partitions);
        this.lessons.set('partitions-keys', Lesson3_PartitionsWithKeys);
        this.lessons.set('consumer-groups', Lesson4_ConsumerGroups);
        this.lessons.set('offsets', Lesson5_Offsets);
        this.lessons.set('rebalancing', Lesson6_Rebalancing);
    }

    /**
     * Setup event listeners for inter-component communication
     */
    setupEventListeners() {
        // Navigation events
        eventBus.on('navigation:lessonChange', async (lessonId) => {
            await this.loadLesson(lessonId);
        });

        // Control events
        eventBus.on('controls:playPause', (isPlaying) => {
            if (this.currentScene) {
                if (isPlaying) {
                    this.currentScene.play();
                } else {
                    this.currentScene.pause();
                }
            }
        });

        eventBus.on('controls:reset', () => {
            if (this.currentScene) {
                this.currentScene.reset();
            }
        });

        eventBus.on('controls:speedChange', (speed) => {
            if (this.currentScene) {
                this.currentScene.setSpeed(speed);
            }
        });
    }

    /**
     * Load a lesson by ID
     * @param {string} lessonId
     */
    async loadLesson(lessonId) {
        // Disable controls during transition
        this.controls.disable();

        // Cleanup current scene
        if (this.currentScene) {
            this.currentScene.destroy();
            this.currentScene = null;
        }

        // Get lesson class
        const LessonClass = this.lessons.get(lessonId);

        if (!LessonClass) {
            console.error(`Lesson "${lessonId}" not found`);
            this.controls.enable();
            return;
        }

        // Create and initialize new scene
        this.currentScene = new LessonClass(this.canvas);
        await this.currentScene.init();

        // Re-enable controls
        this.controls.enable();

        console.log(`📚 Loaded lesson: ${lessonId}`);
    }

    /**
     * Get current scene
     * @returns {Scene|null}
     */
    getCurrentScene() {
        return this.currentScene;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.kafkaApp = new KafkaFlowVisualizer();
    });
} else {
    window.kafkaApp = new KafkaFlowVisualizer();
}

// Export for debugging
export default KafkaFlowVisualizer;
