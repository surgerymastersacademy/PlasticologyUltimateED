// js/features/onboarding.js (FINAL)

import * as dom from '../dom.js';

const TOUR_STEPS = [
    { elementId: 'streak-container', title: 'Daily Streak 🔥', text: 'Track your consistency! Open the app daily to keep your streak alive.' },
    { elementId: 'lectures-btn', title: 'Video Lectures', text: 'Watch organized video lessons grouped by chapter. Mark them as viewed to track progress.' },
    { elementId: 'qbank-btn', title: 'Question Bank', text: 'The core of Plasticology. Create exams, simulations, and practice your mistakes.' },
    { elementId: 'matching-btn', title: 'Matching Bank', text: 'Test your connections. Match terms in a fun, interactive way.' },
    { elementId: 'theory-btn', title: 'Theory & Essays', text: 'Study theory questions in Flashcard mode or test yourself in Exam mode.' },
    { elementId: 'study-planner-btn', title: 'Smart Planner', text: 'Create a study schedule. The app will generate daily tasks for you.' },
    { elementId: 'leaderboard-btn', title: 'Leaderboard', text: 'See how you rank against other doctors.' }
];

let currentStepIndex = 0;

export function checkAndTriggerOnboarding() {
    const hasSeenTour = localStorage.getItem('plasticology_tour_v3_seen');
    if (!hasSeenTour && !dom.mainMenuContainer.classList.contains('hidden')) {
        showWelcomeModal();
    }
}

export function showWelcomeModal() {
    dom.modalBackdrop.classList.remove('hidden');
    dom.onboardingModal.classList.remove('hidden');
}

export function startTour() {
    dom.onboardingModal.classList.add('hidden');
    dom.modalBackdrop.classList.remove('hidden'); 
    localStorage.setItem('plasticology_tour_v3_seen', 'true');
    currentStepIndex = 0;
    highlightStep(currentStepIndex);
}

export function endTour() {
    const activeHighlights = document.querySelectorAll('.tour-highlight');
    activeHighlights.forEach(el => el.classList.remove('tour-highlight'));
    dom.tourTooltip.classList.add('hidden');
    dom.onboardingModal.classList.add('hidden');
    dom.modalBackdrop.classList.add('hidden');
    localStorage.setItem('plasticology_tour_v3_seen', 'true');
}

function highlightStep(index) {
    const prevHighlights = document.querySelectorAll('.tour-highlight');
    prevHighlights.forEach(el => el.classList.remove('tour-highlight'));

    if (index >= TOUR_STEPS.length) {
        endTour();
        return;
    }

    const step = TOUR_STEPS[index];
    const element = document.getElementById(step.elementId);

    if (!element || element.offsetParent === null) {
        currentStepIndex++;
        highlightStep(currentStepIndex);
        return;
    }

    element.classList.add('tour-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    dom.tourTitle.textContent = step.title;
    dom.tourText.textContent = step.text;
    dom.tourStepCount.textContent = `${index + 1} / ${TOUR_STEPS.length}`;
    dom.tourTooltip.classList.remove('hidden');
}

export function nextTourStep() {
    currentStepIndex++;
    highlightStep(currentStepIndex);
}
