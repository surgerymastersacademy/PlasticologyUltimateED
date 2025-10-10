// ===========================
// Update Title: Bug Fix - DOM Initialization Timing
// Date: 10/10/2025
// Version: v1.1
// Description: Imported and called the new initializeDomElements() function from dom.js at the start of the DOMContentLoaded event. This ensures all element references are valid before they are used, fixing the critical TypeError.
// ===========================

import { appState } from './state.js';
import { domElements, initializeDomElements } from './dom.js'; // IMPORT THE INITIALIZER
import * as api from './api.js';
import * as ui from './ui.js';
// UPDATED: Import startFreeTest from quiz.js
import { initializeQuizMode, startFreeTest } from './quiz.js';
import { initializeLectures } from './lectures.js';
import { initializeLearningMode } from './learningMode.js';
import { initializeActivityLog } from './activityLog.js';
import { initializeLeaderboard } from './leaderboard.js';
import { initializeNotes } from './notes.js';
import { initializeOsce } from './osce.js';
import { initializePlanner } from './planner.js';
import { initializeTheoryMode } from './theory.js';
import { initializeUserProfile } from './userProfile.js';
import { initializeRegistration } from './registration.js';
import { initializeMatchingMode } from './matching.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    initializeDomElements(); // INITIALIZE DOM ELEMENTS HERE, AFTER THE DOM IS READY

    ui.initializeTheme();
    ui.initializeAnimations();

    domElements.toggleThemeBtn.addEventListener('click', ui.toggleTheme);
    domElements.toggleAnimationBtn.addEventListener('click', ui.toggleAnimations);

    // Check for logged in user in localStorage
    const loggedInUser = JSON.parse(localStorage.getItem('plasticologyUser'));
    if (loggedInUser) {
        appState.user = loggedInUser;
        ui.showScreen('main-menu');
        await fetchAllData();
    } else {
        ui.showScreen('login');
    }

    domElements.loginForm.addEventListener('submit', handleLogin);
    // UPDATED: Event listener now calls the imported startFreeTest function
    domElements.freeTestBtn.addEventListener('click', startFreeTest);

    // Global Header Listeners
    domElements.globalHomeBtn.addEventListener('click', () => ui.showScreen('main-menu'));
    domElements.logoutBtn.addEventListener('click', handleLogout);

    // Main Menu Listeners
    domElements.lecturesBtn.addEventListener('click', () => ui.showScreen('lectures'));
    domElements.qbankBtn.addEventListener('click', () => ui.showScreen('qbank'));
    domElements.learningModeBtn.addEventListener('click', () => ui.showScreen('learning-mode'));
    domElements.matchingBtn.addEventListener('click', () => {
        if (appState.chapters && appState.books) {
            ui.populateFilterOptions(appState.chapters, domElements.chapterSelectMatching, 'checkbox');
            ui.populateFilterOptions(appState.books, domElements.sourceSelectMatching, 'checkbox');
        }
        ui.showScreen('matching-menu');
    });
    domElements.theoryBtn.addEventListener('click', () => ui.showScreen('theory'));
    domElements.osceBtn.addEventListener('click', () => ui.showScreen('osce'));
    domElements.studyPlannerBtn.addEventListener('click', () => ui.showScreen('study-planner'));
    domElements.leaderboardBtn.addEventListener('click', () => ui.showScreen('leaderboard'));

    // Back Buttons
    domElements.lecturesBackBtn.addEventListener('click', () => ui.showScreen('main-menu'));
    domElements.qbankBackBtn.addEventListener('click', () => ui.showScreen('main-menu'));

    // Initialize all feature modules
    initializeQuizMode(appState, domElements);
    initializeLectures(appState, domElements);
    initializeLearningMode(appState, domElements);
    initializeActivityLog(appState, domElements);
    initializeLeaderboard(appState, domElements);
    initializeNotes(appState, domElements);
    initializeOsce(appState, domElements);
    initializePlanner(appState, domElements);
    initializeTheoryMode(appState, domElements);
    initializeUserProfile(appState, domElements);
    initializeRegistration(appState, domElements);
    initializeMatchingMode(appState, domElements);
});

async function fetchAllData() {
    if (appState.isDataLoaded) return;
    ui.showLoader(true, 'Loading app content...');
    try {
        const contentData = await api.getContentData();
        appState.allQuestions = contentData.questions || [];
        appState.lectures = contentData.lectures || [];
        appState.chapters = [...new Set(contentData.questions.map(q => q.Chapter))].filter(Boolean);
        appState.books = contentData.books || [];
        // ... (rest of data processing) ...

        const userData = await api.getUserData(appState.user.UniqueID);
        appState.userLogs = userData.logs || [];
        appState.answeredQuestions = new Set(userData.answeredQuestions || []);

        ui.updateHeader(appState.user);
        appState.isDataLoaded = true;
    } catch (error) {
        console.error('Failed to fetch initial data:', error);
        ui.showError(domElements.loginError, 'Could not load app data. Please refresh.');
    } finally {
        ui.showLoader(false);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = domElements.usernameInput.value;
    const password = domElements.passwordInput.value;
    ui.showLoader(true);
    try {
        const response = await api.loginUser(username, password);
        if (response.success) {
            appState.user = response.user;
            localStorage.setItem('plasticologyUser', JSON.stringify(response.user));
            await fetchAllData();
            ui.showScreen('main-menu');
        } else {
            ui.showError(domElements.loginError, response.message);
        }
    } catch (error) {
        console.error('Login failed:', error);
        ui.showError(domElements.loginError, 'An error occurred. Please try again.');
    } finally {
        ui.showLoader(false);
    }
}

function handleLogout() {
    ui.showConfirmationModal("Are you sure you want to log out?", () => {
        localStorage.removeItem('plasticologyUser');
        appState.user = null;
        appState.isDataLoaded = false;
        window.location.reload();
    });
}

// REMOVED: The temporary handleFreeTest function is no longer needed.
