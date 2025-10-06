// js/main.js (FINAL VERSION - With Matching Feature Logic)

import { appState } from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { fetchContentData, fetchUserData, logTheoryActivity } from './api.js';
import { handleLogin, handleLogout, showUserCardModal, handleSaveProfile, showMessengerModal, handleSendMessageBtn, checkPermission, loadUserProgress, updateUserProfileHeader, toggleProfileEditMode } from './features/userProfile.js';
import {
    launchQuiz, handleMockExamStart, handleStartSimulation, triggerEndQuiz, handleNextQuestion, handlePreviousQuestion, startChapterQuiz, startSearchedQuiz, handleQBankSearch, updateChapterFilter, startFreeTest, startIncorrectQuestionsQuiz, startBookmarkedQuestionsQuiz,
    toggleBookmark, toggleFlag, showHint, showQuestionNavigator, startQuizBrowse, restartCurrentQuiz, reviewIncorrectAnswers, startSimulationReview
} from './features/quiz.js';
import { renderLectures, saveUserProgress, fetchAndShowLastActivity } from './features/lectures.js';
import { startOsceSlayer, startCustomOsce, endOsceQuiz, handleOsceNext, handleOscePrevious, showOsceNavigator } from './features/osce.js';
import { showStudyPlannerScreen, handleCreatePlan } from './features/planner.js';
import { showLearningModeBrowseScreen, handleLearningSearch, handleLearningNext, handleLearningPrevious, startLearningBrowse, startLearningMistakes, startLearningBookmarked } from './features/learningMode.js';
import { showTheoryMenuScreen, handleTheorySearch, launchTheorySession, showTheoryListScreen } from './features/theory.js';
import { handleRegistrationSubmit, showRegistrationModal, hideRegistrationModal } from './features/registration.js';
import { showActivityLog, renderFilteredLog } from './features/activityLog.js';
import { showNotesScreen, renderNotes, deleteNote } from './features/notes.js';
import { showLeaderboardScreen } from './features/leaderboard.js';
// --- NEW: Import matching feature functions ---
import { showMatchingMenuScreen, handleStartMatchingExam, handleNextSet } from './features/matching.js';

// Global export for inline HTML onclicks
window.app = {
    renderFilteredLog,
    renderNotes,
    deleteNote
};

// ===============================================================
// ============== INITIALIZATION & MAIN LOGIC ====================
// ===============================================================

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Initial Setup ---
    setupDarkMode();
    
    // Attempt to load guest data or check for logged-in user
    const savedUser = localStorage.getItem('plasticologyUser');
    if (savedUser) {
        appState.currentUser = JSON.parse(savedUser);
        await initializeAuthenticatedSession();
    } else {
        ui.showScreen(dom.loginContainer);
    }
    
    // --- GLOBAL EVENT LISTENERS ---
    dom.globalHomeBtn.addEventListener('click', showMainMenuScreen);
    dom.logoutBtn.addEventListener('click', handleLogout);
    
    // --- LOGIN & REGISTRATION ---
    dom.loginForm.addEventListener('submit', handleLogin);
    dom.showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegistrationModal();
    });
    dom.registrationForm.addEventListener('submit', handleRegistrationSubmit);
    dom.registerCancelBtn.addEventListener('click', hideRegistrationModal);
    
    // --- MAIN MENU NAVIGATION ---
    dom.lecturesBtn.addEventListener('click', showLecturesScreen);
    dom.qbankBtn.addEventListener('click', showQBankScreen);
    dom.osceBtn.addEventListener('click', showOsceMenuScreen);
    dom.leaderboardBtn.addEventListener('click', showLeaderboardScreen);
    dom.notesBtn.addEventListener('click', showNotesScreen);
    dom.activityLogBtn.addEventListener('click', showActivityLog);
    dom.plannerBtn.addEventListener('click', showStudyPlannerScreen);
    dom.learningModeBtn.addEventListener('click', showLearningModeBrowseScreen);
    dom.theoryModeBtn.addEventListener('click', showTheoryMenuScreen);
    
    // --- QBANK ---
    dom.mockExamBtn.addEventListener('click', handleMockExamStart);
    dom.simulationExamBtn.addEventListener('click', handleStartSimulation);
    dom.browseChapterBtn.addEventListener('click', () => startQuizBrowse('Chapter'));
    dom.browseSourceBtn.addEventListener('click', () => startQuizBrowse('Source'));
    dom.qbankSearchInput.addEventListener('keyup', handleQBankSearch);
    
    // --- QUIZ CONTROLS ---
    dom.nextQuestionBtn.addEventListener('click', handleNextQuestion);
    dom.prevQuestionBtn.addEventListener('click', handlePreviousQuestion);
    dom.backToMenuBtn.addEventListener('click', showMainMenuScreen);
    dom.flagBtn.addEventListener('click', toggleFlag);
    dom.bookmarkBtn.addEventListener('click', toggleBookmark);
    dom.hintBtn.addEventListener('click', showHint);
    dom.navigatorBtn.addEventListener('click', showQuestionNavigator);
    dom.noteTakingBtn.addEventListener('click', () => openNoteModal('quiz'));
    dom.restartQuizBtn.addEventListener('click', restartCurrentQuiz);
    dom.reviewMistakesBtn.addEventListener('click', reviewIncorrectAnswers);
    
    // --- OSCE ---
    dom.osceSlayerBtn.addEventListener('click', startOsceSlayer);
    dom.customOsceBtn.addEventListener('click', startCustomOsce);
    dom.osceNextBtn.addEventListener('click', handleOsceNext);
    dom.oscePrevBtn.addEventListener('click', handleOscePrevious);
    dom.osceNavigatorBtn.addEventListener('click', showOsceNavigator);
    
    // --- LEARNING MODE ---
    dom.learningBrowseAllBtn.addEventListener('click', startLearningBrowse);
    dom.learningStudyMistakesBtn.addEventListener('click', startLearningMistakes);
    dom.learningStudyBookmarkedBtn.addEventListener('click', startLearningBookmarked);
    dom.learningSearchInput.addEventListener('keyup', handleLearningSearch);
    dom.learningNextBtn.addEventListener('click', handleLearningNext);
    dom.learningPrevBtn.addEventListener('click', handleLearningPrevious);
    
    // --- THEORY ---
    dom.theoryBrowseByChapterBtn.addEventListener('click', () => showTheoryListScreen('Chapter'));
    
    // --- NEW: MATCHING BANK ---
    dom.matchingModeBtn.addEventListener('click', showMatchingMenuScreen);
    dom.startMatchingExamBtn.addEventListener('click', handleStartMatchingExam);
    dom.matchingNextSetBtn.addEventListener('click', handleNextSet);
    
    // --- MODAL & MISC LISTENERS ---
    dom.modalConfirmBtn.addEventListener('click', () => { if(appState.modalConfirmAction) appState.modalConfirmAction(); });
    dom.modalCancelBtn.addEventListener('click', () => { dom.confirmationModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');});
    dom.imageViewerCloseBtn.addEventListener('click', () => { dom.imageViewerModal.classList.add('hidden'); if(dom.userCardModal.classList.contains('hidden') && dom.createPlanModal.classList.contains('hidden') && dom.announcementsModal.classList.contains('hidden') && dom.messengerModal.classList.contains('hidden')) dom.modalBackdrop.classList.add('hidden');});
    dom.announcementsCloseBtn.addEventListener('click', () => { dom.announcementsModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    dom.userCardCloseBtn.addEventListener('click', () => { dom.userCardModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    dom.messengerCloseBtn.addEventListener('click', () => {
        dom.messengerModal.classList.add('hidden');
        dom.modalBackdrop.classList.add('hidden');
        if (appState.messengerPollInterval) clearInterval(appState.messengerPollInterval);
    });
    dom.navigatorCloseBtn.addEventListener('click', () => { dom.questionNavigatorModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');});
    dom.osceNavigatorCloseBtn.addEventListener('click', () => { dom.osceNavigatorModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');});
    dom.clearLogCancelBtn.addEventListener('click', () => { dom.clearLogModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    dom.clearLogBtn.addEventListener('click', () => { dom.clearLogModal.classList.remove('hidden'); dom.modalBackdrop.classList.remove('hidden'); });
    
    // User Profile / Card
    dom.userProfileHeaderBtn.addEventListener('click', showUserCardModal);
    dom.editProfileBtn.addEventListener('click', () => toggleProfileEditMode(true));
    dom.saveProfileBtn.addEventListener('click', handleSaveProfile);
    dom.messengerBtn.addEventListener('click', showMessengerModal);
    dom.sendMessageBtn.addEventListener('click', handleSendMessageBtn);
    
    // Planner
    dom.createNewPlanBtn.addEventListener('click', () => {
        dom.createPlanModal.classList.remove('hidden');
        dom.modalBackdrop.classList.remove('hidden');
    });
    dom.cancelCreatePlanBtn.addEventListener('click', () => {
        dom.createPlanModal.classList.add('hidden');
        dom.modalBackdrop.classList.add('hidden');
    });
    dom.confirmCreatePlanBtn.addEventListener('click', handleCreatePlan);
    
    // Header Buttons
    dom.announcementsBtn.addEventListener('click', ui.showAnnouncementsModal);
});

async function initializeAuthenticatedSession() {
    ui.initializeMainUI();
    showMainMenuScreen();
    await fetchContentData();
    await fetchUserData();
    loadUserProgress();
    updateUserProfileHeader();
    fetchAndShowLastActivity();
    renderLectures(); // Initial render
}


// ===============================================================
// ================== SCREEN NAVIGATION ==========================
// ===============================================================

export function showMainMenuScreen() {
    ui.showScreen(dom.mainMenuContainer);
    if(appState.navigationHistory.length === 0 || appState.navigationHistory[appState.navigationHistory.length - 1] !== showMainMenuScreen) {
        appState.navigationHistory.push(showMainMenuScreen);
    }
    fetchAndShowLastActivity();
}

export function showLecturesScreen() {
    ui.showScreen(dom.lecturesContainer);
    appState.navigationHistory.push(showLecturesScreen);
}

export function showQBankScreen() {
    ui.showScreen(dom.qbankContainer);
    appState.navigationHistory.push(showQBankScreen);
    updateChapterFilter(); // Update filters when showing screen
}

export function showOsceMenuScreen() {
    ui.showScreen(dom.osceContainer);
    appState.navigationHistory.push(showOsceMenuScreen);
    const chapters = [...new Set(appState.allOsceCases.map(c => c.Chapter || 'Uncategorized'))].sort();
    const sources = [...new Set(appState.allOsceCases.map(c => c.Source || 'Uncategorized'))].sort();
    const chapterCounts = chapters.reduce((acc, chapter) => {
        acc[chapter] = appState.allOsceCases.filter(c => (c.Chapter || 'Uncategorized') === chapter).length;
        return acc;
    }, {});
    const sourceCounts = sources.reduce((acc, source) => {
        acc[source] = appState.allOsceCases.filter(c => (c.Source || 'Uncategorized') === source).length;
        return acc;
    }, {});
    ui.populateFilterOptions(dom.chapterSelectOsce, chapters, 'osce-chapter', chapterCounts);
    ui.populateFilterOptions(dom.sourceSelectOsce, sources, 'osce-source', sourceCounts);
}

// ===============================================================
// ==================== MODAL CONTROLS ===========================
// ===============================================================
export function openNoteModal(type, itemId = null, itemTitle = null) {
    appState.currentNote.type = type;
    if (itemId) appState.currentNote.itemId = itemId;
    if (itemTitle) appState.currentNote.itemTitle = itemTitle;
    
    let existingNote = '';
    if (type === 'quiz') {
        const note = appState.userQuizNotes.find(n => n.QuizID === (itemId || appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex].UniqueID));
        if (note) existingNote = note.NoteText;
        dom.noteModalTitle.textContent = `Note for: ${itemTitle || appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex].Question.substring(0, 50)}...`;
    }
    // Add logic for lecture and theory notes if needed
    
    dom.noteTextarea.value = existingNote;
    dom.modalBackdrop.classList.remove('hidden');
    dom.noteModal.classList.remove('hidden');
}

// ===============================================================
// ===================== DARK MODE ===============================
// ===============================================================
function setupDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const sunIcon = darkModeToggle.querySelector('.fa-sun');
    const moonIcon = darkModeToggle.querySelector('.fa-moon');

    if (localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        sunIcon.style.display = 'inline';
        moonIcon.style.display = 'none';
    } else {
        document.documentElement.classList.remove('dark');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'inline';
    }

    darkModeToggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            sunIcon.style.display = 'inline';
            moonIcon.style.display = 'none';
        }
    });
}
