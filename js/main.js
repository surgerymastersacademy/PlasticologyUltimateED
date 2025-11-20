// js/main.js (FINAL MASTER VERSION v3.1)

import { isAuthenticated, getCurrentUser } from './state.js';
import { showScreen, showLoader, hideLoader } from './ui.js';
import { setupUserProfileEvents, updateUserUI, handleLogin } from './features/userProfile.js';

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
import { initLibrary } from './features/library.js'; // تمت الإضافة

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    console.log("🚀 Starting Plasticology v3.1...");
    
    // 1. Global Event Listeners (Login, Register, Logout)
    setupGlobalEvents();

    // 2. Initialize Public Features
    initRegistration(); // Setup Register Form Logic
    setupUserProfileEvents(); // Setup Profile Modal & Login Events
    
    // 3. Check Authentication State
    if (isAuthenticated()) {
        const user = getCurrentUser();
        console.log("✅ User logged in:", user.Name);
        
        // Update UI with user data (Avatar, Name, Score)
        updateUserUI(user);
        
        // Initialize all protected features (Quiz, Planner, Library, etc.)
        initializeProtectedFeatures();
        
        // Navigate to Dashboard
        showScreen('main-menu-container');
    } else {
        console.log("🔒 No user, showing login.");
        showScreen('login-container');
        
        // Show Onboarding Tour for new visitors
        initOnboarding();
    }
}

function setupGlobalEvents() {
    // Login Form Submit Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Show Register Link Handler
    const regLink = document.getElementById('show-register-link');
    if (regLink) {
        regLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registration-modal').classList.remove('hidden');
            document.getElementById('modal-backdrop').classList.remove('hidden');
        });
    }

    // Logout Handlers (Mobile & Desktop Sidebar)
    const logoutBtns = ['logout-btn']; 
    logoutBtns.forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.addEventListener('click', handleLogout);
    });
}

function handleLogout() {
    if(confirm("Are you sure you want to logout?")) {
        // Clear user data from storage
        localStorage.removeItem('plastico_user');
        // Reload page to reset state completely
        window.location.reload();
    }
}

// Initialize all features that require a logged-in user
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
    initLibrary(); // تفعيل المكتبة
}
