// js/main.js (FINAL MASTER VERSION v3.1)

// 1. Core Imports
import { isAuthenticated, getCurrentUser } from './state.js';
import { showScreen, showLoader, hideLoader, initSettings } from './ui.js'; // initSettings added
import { setupUserProfileEvents, updateUserUI, handleLogin } from './features/userProfile.js';

// 2. Feature Imports
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
import { initLibrary } from './features/library.js'; // المكتبة الجديدة

// 3. Start Application
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    console.log("🚀 Starting Plasticology v3.1...");

    // A. Initialize App Settings (Theme & Animation)
    initSettings();
    
    // B. Setup Global Event Listeners (Login, Register, Logout)
    setupGlobalEvents();

    // C. Initialize Public Features
    initRegistration(); // Setup Register Form Logic
    setupUserProfileEvents(); // Setup Profile Modal & Login Events
    
    // D. Check Authentication State
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
            const modal = document.getElementById('registration-modal');
            const backdrop = document.getElementById('modal-backdrop');
            if (modal && backdrop) {
                modal.classList.remove('hidden');
                backdrop.classList.remove('hidden');
            }
        });
    }

    // Logout Handlers (For Mobile & Desktop Sidebar Buttons)
    const logoutBtns = ['logout-btn', 'logout-btn-desktop']; 
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
    // Safety check: ensure functions exist before calling to prevent crash
    // This block guarantees that the app runs even if one module fails
    try { initLectures(); } catch(e) { console.error("Init Lectures Failed", e); }
    try { initQuiz(); } catch(e) { console.error("Init Quiz Failed", e); }
    try { initPlanner(); } catch(e) { console.error("Init Planner Failed", e); }
    try { initMatching(); } catch(e) { console.error("Init Matching Failed", e); }
    try { initOSCE(); } catch(e) { console.error("Init OSCE Failed", e); }
    try { initLearningMode(); } catch(e) { console.error("Init Learning Failed", e); }
    try { initTheory(); } catch(e) { console.error("Init Theory Failed", e); }
    try { initNotes(); } catch(e) { console.error("Init Notes Failed", e); }
    try { initActivityLog(); } catch(e) { console.error("Init Activity Failed", e); }
    try { initLeaderboard(); } catch(e) { console.error("Init Leaderboard Failed", e); }
    try { initLibrary(); } catch(e) { console.error("Init Library Failed", e); }
}
