/**
 * Navigation - Lesson navigation sidebar
 * Handles lesson selection and progress tracking
 */

import { eventBus } from '../core/EventBus.js';

export class Navigation {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.lessonList = document.getElementById('lessonList');
        this.toggleBtn = document.getElementById('sidebarToggle');
        this.currentLesson = 'basics';
        this.unlockedLessons = new Set(['basics']); // Start with only basics unlocked

        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        // Toggle sidebar
        this.toggleBtn.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Lesson item clicks
        this.lessonList.addEventListener('click', (e) => {
            const lessonItem = e.target.closest('.lesson-item');
            if (lessonItem && !lessonItem.classList.contains('locked')) {
                const lessonId = lessonItem.dataset.lesson;
                this.selectLesson(lessonId);
            }
        });

        // Listen for scene ready events to update description
        eventBus.on('scene:ready', (data) => {
            this.updateLessonDescription(data);
        });

        // Listen for lesson completion to unlock next
        eventBus.on('lesson:complete', (lessonId) => {
            this.unlockNextLesson(lessonId);
        });
    }

    /**
     * Toggle sidebar open/closed
     */
    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
    }

    /**
     * Select a lesson
     * @param {string} lessonId
     */
    selectLesson(lessonId) {
        if (!this.unlockedLessons.has(lessonId)) {
            return; // Lesson is locked
        }

        // Update UI
        const items = this.lessonList.querySelectorAll('.lesson-item');
        items.forEach(item => {
            if (item.dataset.lesson === lessonId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        this.currentLesson = lessonId;

        // Emit event for scene change
        eventBus.emit('navigation:lessonChange', lessonId);
    }

    /**
     * Unlock next lesson
     * @param {string} completedLessonId
     */
    unlockNextLesson(completedLessonId) {
        const lessons = ['basics', 'partitions', 'consumer-groups', 'offsets', 'rebalancing'];
        const currentIndex = lessons.indexOf(completedLessonId);

        if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
            const nextLesson = lessons[currentIndex + 1];
            this.unlockedLessons.add(nextLesson);

            // Update UI
            const nextItem = this.lessonList.querySelector(`[data-lesson="${nextLesson}"]`);
            if (nextItem) {
                nextItem.classList.remove('locked');
            }

            // Mark current as complete
            const currentItem = this.lessonList.querySelector(`[data-lesson="${completedLessonId}"]`);
            if (currentItem) {
                const status = currentItem.querySelector('.lesson-status');
                if (status) {
                    status.textContent = '✓';
                    status.style.color = 'var(--color-success)';
                }
            }
        }
    }

    /**
     * Update lesson description overlay
     * @param {Object} data
     */
    updateLessonDescription(data) {
        const descriptionEl = document.getElementById('lessonDescription');
        const titleEl = descriptionEl.querySelector('.lesson-title');
        const textEl = descriptionEl.querySelector('.lesson-text');

        if (titleEl) titleEl.textContent = data.title;
        if (textEl) textEl.textContent = data.description;
    }

    /**
     * Get current lesson ID
     * @returns {string}
     */
    getCurrentLesson() {
        return this.currentLesson;
    }
}
