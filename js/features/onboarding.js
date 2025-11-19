// js/features/onboarding.js

import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { appState } from '../state.js';

// Define the Tour Steps
const TOUR_STEPS = [
    {
        elementId: 'streak-container',
        title: 'Daily Streak 🔥',
        text: 'Track your consistency! Open the app daily to keep your streak alive.'
    },
    {
        elementId: 'lectures-btn',
        title: 'Video Lectures',
        text: 'Watch organized video lessons grouped by chapter. Don\'t forget to mark them as viewed!'
    },
    {
        elementId: 'qbank-btn',
        title: 'Question Bank',
        text: 'The core of Plasticology. Create exams, simulations, and practice your mistakes.'
    },
    {
        elementId: 'matching-btn',
        title: 'Matching Bank (New!)',
        text: 'Test your connections. Match diseases to symptoms or treatments in a fun, interactive way.'
    },
    {
        elementId: 'theory-btn',
        title: 'Theory & Essays',
        text: 'Study theory questions in Flashcard mode or test yourself in Exam mode.'
    },
    {
        elementId: 'study-planner-btn',
        title: 'Smart Planner',
        text: 'Create a study schedule. The app will generate daily tasks and quizzes for you.'
    },
    {
        elementId: 'leaderboard-btn',
        title: 'Leaderboard',
        text: 'See how you rank against other doctors based on your quiz scores.'
    }
];

let currentStepIndex = 0;

/**
 * Checks if the user is visiting for the first time (after this update).
 */
export function checkAndTriggerOnboarding() {
    const hasSeenTour = localStorage.getItem('plasticology_tour_v1_seen');
    
    // If user hasn't seen tour AND is logged in (Main Menu is visible)
    if (!hasSeenTour && !dom.mainMenuContainer.classList.contains('hidden')) {
        showWelcomeModal();
    }
}

/**
 * Shows the "What's New" Welcome Modal.
 */
export function showWelcomeModal() {
    dom.modalBackdrop.classList.remove('hidden');
    dom.onboardingModal.classList.remove('hidden');
}

/**
 * Starts the guided tour.
 */
export function startTour() {
    // Close Welcome Modal
    dom.onboardingModal.classList.add('hidden');
    dom.modalBackdrop.classList.remove('hidden'); // Keep backdrop for focus
    
    // Mark as seen immediately so it doesn't annoy user next time
    localStorage.setItem('plasticology_tour_v1_seen', 'true');

    currentStepIndex = 0;
    highlightStep(currentStepIndex);
}

/**
 * Skips/Ends the tour.
 */
export function endTour() {
    // Remove highlights
    const activeHighlights = document.querySelectorAll('.tour-highlight');
    activeHighlights.forEach(el => el.classList.remove('tour-highlight'));
    
    // Hide Tooltip
    dom.tourTooltip.classList.add('hidden');
    dom.modalBackdrop.classList.add('hidden');
    dom.onboardingModal.classList.add('hidden');
    
    // Mark as seen
    localStorage.setItem('plasticology_tour_v1_seen', 'true');
}

function highlightStep(index) {
    // Remove previous highlight
    const prevHighlights = document.querySelectorAll('.tour-highlight');
    prevHighlights.forEach(el => el.classList.remove('tour-highlight'));

    if (index >= TOUR_STEPS.length) {
        endTour();
        ui.showConfirmationModal("You're Ready!", "Good luck with your studies!", () => {});
        return;
    }

    const step = TOUR_STEPS[index];
    const element = document.getElementById(step.elementId);

    // If element doesn't exist (e.g. Streak hidden on mobile), skip to next
    if (!element || element.offsetParent === null) {
        currentStepIndex++;
        highlightStep(currentStepIndex);
        return;
    }

    // 1. Highlight Element
    element.classList.add('tour-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 2. Position Tooltip
    const rect = element.getBoundingClientRect();
    const tooltip = dom.tourTooltip;
    
    // Content
    dom.tourTitle.textContent = step.title;
    dom.tourText.textContent = step.text;
    dom.tourStepCount.textContent = `${index + 1} / ${TOUR_STEPS.length}`;

    tooltip.classList.remove('hidden');

    // Calculate Position (Basic Logic: Center screen, or below element)
    // For simplicity in this implementation, we fix it to the bottom center or center screen
    // A truly dynamic positioning system is complex, so we'll use CSS fixed positioning for the tooltip
    // but purely visual highlighting for the element.
}

// Navigate
export function nextTourStep() {
    currentStepIndex++;
    highlightStep(currentStepIndex);
}
