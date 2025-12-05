/**
 * Navigation - Lesson navigation sidebar
 * Handles lesson selection and progress tracking
 * Uses Bootstrap offcanvas for mobile and syncs both lesson lists
 */

import { eventBus } from '../core/EventBus.js';

export class Navigation {
    constructor() {
        // Mobile offcanvas
        this.offcanvasEl = document.getElementById('lessonsOffcanvas');
        this.lessonListMobile = document.getElementById('lessonList');

        // Desktop sidebar
        this.lessonListDesktop = document.getElementById('lessonListDesktop');

        // Bootstrap offcanvas instance (initialized after Bootstrap loads)
        this.offcanvas = null;

        this.currentLesson = 'basics';
        this.unlockedLessons = new Set(['basics', 'partitions', 'partitions-keys', 'consumer-groups', 'offsets', 'rebalancing']);

        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        // Initialize Bootstrap offcanvas instance
        if (typeof bootstrap !== 'undefined' && this.offcanvasEl) {
            this.offcanvas = bootstrap.Offcanvas.getOrCreateInstance(this.offcanvasEl);
        }

        // Unlock lessons in both lists
        this.unlockedLessons.forEach(lessonId => {
            this.updateLessonLockState(lessonId, false);
        });

        // Set initial active lesson indicator
        this.setActiveIndicator(this.currentLesson);

        // Lesson item clicks - Mobile list
        if (this.lessonListMobile) {
            this.lessonListMobile.addEventListener('click', (e) => {
                const lessonItem = e.target.closest('.kafka-lesson-item');
                if (lessonItem && !lessonItem.classList.contains('locked')) {
                    const lessonId = lessonItem.dataset.lesson;
                    this.selectLesson(lessonId);
                }
            });
        }

        // Lesson item clicks - Desktop list
        if (this.lessonListDesktop) {
            this.lessonListDesktop.addEventListener('click', (e) => {
                const lessonItem = e.target.closest('.kafka-lesson-item');
                if (lessonItem && !lessonItem.classList.contains('locked')) {
                    const lessonId = lessonItem.dataset.lesson;
                    this.selectLesson(lessonId);
                }
            });
        }

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
     * Update lesson lock state in both lists
     * @param {string} lessonId
     * @param {boolean} locked
     */
    updateLessonLockState(lessonId, locked) {
        [this.lessonListMobile, this.lessonListDesktop].forEach(list => {
            if (!list) return;
            const item = list.querySelector(`[data-lesson="${lessonId}"]`);
            if (item) {
                if (locked) {
                    item.classList.add('locked');
                } else {
                    item.classList.remove('locked');
                }
            }
        });
    }

    /**
     * Set active indicator on a lesson in both lists
     * @param {string} lessonId
     */
    setActiveIndicator(lessonId) {
        [this.lessonListMobile, this.lessonListDesktop].forEach(list => {
            if (!list) return;
            const item = list.querySelector(`[data-lesson="${lessonId}"]`);
            if (item) {
                const status = item.querySelector('.kafka-lesson-status');
                if (status) {
                    status.textContent = '●';
                    status.style.color = 'var(--color-success)';
                }
            }
        });
    }

    /**
     * Check if we're on mobile viewport
     */
    isMobile() {
        return window.innerWidth < 992; // Bootstrap lg breakpoint
    }

    /**
     * Select a lesson
     * @param {string} lessonId
     */
    selectLesson(lessonId) {
        if (!this.unlockedLessons.has(lessonId)) {
            return; // Lesson is locked
        }

        // Update UI in both lists
        [this.lessonListMobile, this.lessonListDesktop].forEach(list => {
            if (!list) return;
            const items = list.querySelectorAll('.kafka-lesson-item');
            items.forEach(item => {
                const status = item.querySelector('.kafka-lesson-status');
                if (item.dataset.lesson === lessonId) {
                    item.classList.add('active');
                    if (status) {
                        status.textContent = '●';
                        status.style.color = 'var(--color-success)';
                    }
                } else {
                    item.classList.remove('active');
                    if (status && !status.textContent.includes('✓')) {
                        status.textContent = '';
                    }
                }
            });
        });

        this.currentLesson = lessonId;

        // Close offcanvas on mobile after selecting lesson
        if (this.isMobile() && this.offcanvas) {
            this.offcanvas.hide();
        }

        // Emit event for scene change
        eventBus.emit('navigation:lessonChange', lessonId);
    }

    /**
     * Unlock next lesson
     * @param {string} completedLessonId
     */
    unlockNextLesson(completedLessonId) {
        const lessons = ['basics', 'partitions', 'partitions-keys', 'consumer-groups', 'offsets', 'rebalancing'];
        const currentIndex = lessons.indexOf(completedLessonId);

        if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
            const nextLesson = lessons[currentIndex + 1];
            this.unlockedLessons.add(nextLesson);

            // Update UI - unlock next lesson
            this.updateLessonLockState(nextLesson, false);

            // Mark current as complete in both lists
            [this.lessonListMobile, this.lessonListDesktop].forEach(list => {
                if (!list) return;
                const currentItem = list.querySelector(`[data-lesson="${completedLessonId}"]`);
                if (currentItem) {
                    const status = currentItem.querySelector('.kafka-lesson-status');
                    if (status) {
                        status.textContent = '✓';
                        status.style.color = 'var(--color-success)';
                    }
                }
            });
        }
    }

    /**
     * Update lesson description overlay
     * @param {Object} data
     */
    updateLessonDescription(data) {
        const descriptionEl = document.getElementById('lessonDescription');
        const titleEl = descriptionEl?.querySelector('.kafka-lesson-title');
        const textEl = descriptionEl?.querySelector('.kafka-lesson-text');

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
