// js/features/onboarding.js (FINAL VERSION v3.1)

import { showToast } from '../ui.js';

export function initOnboarding() {
    const hasSeenTour = localStorage.getItem('plastico_tour_seen_v3');
    if (hasSeenTour) return;

    // Show Welcome Modal
    const modal = document.getElementById('onboarding-modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');

        document.getElementById('start-tour-btn').onclick = startTour;
        document.getElementById('skip-tour-btn').onclick = endTour;
    }
}

function startTour() {
    // Close welcome modal
    document.getElementById('onboarding-modal').classList.add('hidden');
    
    // Tour Steps
    const steps = [
        { id: 'login-container', text: 'Login here to access your personalized dashboard.' },
        { id: 'free-test-btn', text: 'Try our Free Test before subscribing.' }
    ];

    // Simple Tour Implementation (You can expand this)
    // For now, we just mark as seen to avoid annoyance
    showToast('Welcome to Plasticology v3.1! Explore the new features.', 'info');
    endTour();
}

function endTour() {
    localStorage.setItem('plastico_tour_seen_v3', 'true');
    document.getElementById('onboarding-modal').classList.add('hidden');
    document.getElementById('modal-backdrop').classList.add('hidden');
}
