// js/main.js (FINAL VERSION v3.1)

import { isAuthenticated, getCurrentUser } from './state.js';
import { showScreen, showLoader, hideLoader } from './ui.js';
import { setupUserProfileEvents, updateUserUI } from './features/userProfile.js';
import { handleLogin } from './features/userProfile.js';

// Feature Initializers
import { initLectures } from './features/lectures.js';
import { initQuiz } from './features/quiz.js';
import { initPlanner } from './features/planner.js';
import { initMatching } from './features/matching.js';
import { initOSCE } from './features/osce.js';
import { initLearningMode } from './features/learningMode.js';
import { initTheory } from './features/theory.js';
import { initNotes } from './features/notes.js';
import { initActivityLog } from './features/activityLog.js';
import { initLeaderboard } from './features/leaderboard.js';
import { initRegistration } from './features/registration.js';
import { initOnboarding } from './features/onboarding.js';

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    console.log("🚀 Starting Plasticology v3.1...");
    
    // 1. Global Event Listeners
    setupGlobalEvents();

    // 2. Initialize Features (Bind buttons, etc.)
    initRegistration(); // Setup Register Form
    setupUserProfileEvents(); // Setup Profile & Login events
    
    // 3. Check Auth State
    if (isAuthenticated()) {
        const user = getCurrentUser();
        console.log("✅ User logged in:", user.Name);
        
        // Update UI with user data
        updateUserUI(user);
        
        // Initialize protected features
        initializeProtectedFeatures();
        
        // Go to Dashboard
        showScreen('main-menu-container');
    } else {
        console.log("🔒 No user, showing login.");
        showScreen('login-container');
        
        // Check for onboarding (Tour)
        initOnboarding();
    }
}

function setupGlobalEvents() {
    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Show Register Link
    const regLink = document.getElementById('show-register-link');
    if (regLink) {
        regLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registration-modal').classList.remove('hidden');
            document.getElementById('modal-backdrop').classList.remove('hidden');
        });
    }

    // Mobile/Desktop Logout
    const logoutBtns = ['logout-btn', 'logout-btn-desktop']; // Add IDs as needed
    logoutBtns.forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.addEventListener('click', handleLogout);
    });
}

function handleLogout() {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('plastico_user');
        window.location.reload();
    }
}

// Initialize features that require a user
function initializeProtectedFeatures() {
    initLectures();
    initQuiz();
    initPlanner();
    initMatching();
    initOSCE();
    initLearningMode();
    initTheory();
    initNotes();
    initActivityLog();
    initLeaderboard();
}
