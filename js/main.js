// js/main.js

import { appState } from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { fetchContentData, fetchUserData, logUserActivity, saveStudyPlan } from './api.js';
import { handleLogin, handleLogout, showUserCardModal, handleSaveProfile, showMessengerModal, handleSendMessageBtn, checkPermission, loadUserProgress, updateUserProfileHeader, toggleProfileEditMode } from './features/userProfile.js';
import { launchQuiz, handleMockExamStart, handleStartSimulation, triggerEndQuiz, handleNextQuestion, handlePreviousQuestion, startChapterQuiz, startSearchedQuiz, handleQBankSearch } from './features/quiz.js';
import { renderLectures, saveUserProgress, fetchAndShowLastActivity } from './features/lectures.js';
import { startOsceSlayer, startCustomOsce, endOsceQuiz, handleOsceNext, handleOscePrevious, showOsceNavigator } from './features/osce.js';
import { showStudyPlannerScreen, handleGeneratePlan, handleAddCustomTask } from './features/planner.js';
import { showLearningModeBrowseScreen, handleLearningSearch, handleLearningNext, handleLearningPrevious } from './features/learningMode.js';


// SHARED & EXPORTED FUNCTIONS
export function showMainMenuScreen() {
    ui.showScreen(dom.mainMenuContainer);
    appState.navigationHistory = [showMainMenuScreen];
    ui.displayAnnouncement();
    fetchAndShowLastActivity();
}

export function openNoteModal(type, itemId, itemTitle) {
    appState.currentNote = { type, itemId, itemTitle };
    let existingNote = type === 'quiz'
        ? appState.userQuizNotes.find(n => n.QuizID === itemId)
        : appState.userLectureNotes.find(n => n.LectureID === itemId);
    
    dom.noteModalTitle.textContent = `Note on: ${itemTitle.substring(0, 40)}...`;
    dom.noteTextarea.value = existingNote ? existingNote.NoteText : '';
    dom.modalBackdrop.classList.add('hidden');
    dom.noteModal.classList.remove('hidden');
}


// MAIN APP INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {

    async function initializeApp() {
        const data = await fetchContentData();
        if (data) {
            appState.allQuestions = utils.parseQuestions(data.questions);
            appState.groupedLectures = utils.groupLecturesByChapter(data.lectures);
            appState.mcqBooks = data.books || [];
            appState.allAnnouncements = data.announcements || [];
            appState.allOsceCases = utils.parseOsceCases(data.osceCases);
            appState.allOsceQuestions = utils.parseOsceQuestions(data.osceQuestions);
            appState.allRoles = data.roles || [];
            appState.allChaptersNames = Object.keys(appState.groupedLectures);
            // Extract all unique sources from questions
            appState.allSourcesNames = [...new Set(appState.allQuestions.map(q => q.source).filter(s => s && s !== 'N/A'))]; // Filter out 'N/A' sources
        } else {
            dom.loginLoadingText.textContent = 'Failed to load app content. Please refresh.';
        }
        dom.loginLoadingText.classList.add('hidden');
    }

    // --- EVENT LISTENERS ---
    
    // Login & Navigation
    dom.loginForm.addEventListener('submit', handleLogin);
    dom.logoutBtn.addEventListener('click', handleLogout);
    dom.globalHomeBtn.addEventListener('click', () => {
        if (appState.currentUser?.Role === 'Guest') {
            ui.showScreen(dom.loginContainer);
            appState.currentUser = null;
        } else {
            showMainMenuScreen();
        }
    });
    
    // Back Buttons
    [dom.lecturesBackBtn, dom.qbankBackBtn, dom.listBackBtn, dom.activityBackBtn, dom.libraryBackBtn, dom.notesBackBtn, dom.leaderboardBackBtn, dom.osceBackBtn, dom.learningModeBackBtn, dom.studyPlannerBackBtn].forEach(btn => {
        btn.addEventListener('click', () => appState.navigationHistory.length > 1 ? appState.navigationHistory.pop()() : showMainMenuScreen());
    });

    // Main Menu
    dom.lecturesBtn.addEventListener('click', () => checkPermission('Lectures') && (ui.showScreen(dom.lecturesContainer), appState.navigationHistory.push(() => ui.showScreen(dom.lecturesContainer)), renderLectures()));
    dom.qbankBtn.addEventListener('click', () => checkPermission('MCQBank') && (ui.showScreen(dom.qbankContainer), appState.navigationHistory.push(() => ui.showScreen(dom.qbankContainer)), ui.renderQBankFilters())); // ADDED: Call renderQBankFilters
    dom.learningModeBtn.addEventListener('click', () => checkPermission('LerningMode') && showLearningModeBrowseScreen());
    dom.osceBtn.addEventListener('click', () => checkPermission('OSCEBank') && (ui.showScreen(dom.osceContainer), appState.navigationHistory.push(() => ui.showScreen(dom.osceContainer))));
    dom.libraryBtn.addEventListener('click', () => checkPermission('Library') && (ui.showScreen(dom.libraryContainer), appState.navigationHistory.push(() => ui.showScreen(dom.libraryContainer)), ui.renderBooks()));
    dom.leaderboardBtn.addEventListener('click', () => checkPermission('LeadersBoard') /* && showLeaderboardScreen() */);
    dom.studyPlannerBtn.addEventListener('click', () => checkPermission('StudyPlanner') && showStudyPlannerScreen());
    
    // Header
    dom.userProfileHeaderBtn.addEventListener('click', () => showUserCardModal(false));
    dom.radioBtn.addEventListener('click', () => dom.radioBannerContainer.classList.toggle('open'));
    dom.radioCloseBtn.addEventListener('click', () => dom.radioBannerContainer.classList.remove('open'));
    dom.announcementsBtn.addEventListener('click', ui.showAnnouncementsModal);
    dom.notesBtn.addEventListener('click', () => (ui.showScreen(dom.notesContainer) /*, renderNotes('quizzes') */));
    dom.activityLogBtn.addEventListener('click', () => (ui.showScreen(dom.activityLogContainer) /*, renderFilteredLog('all') */));
    dom.messengerBtn.addEventListener('click', showMessengerModal);
    
    // Lectures
    dom.lectureSearchInput.addEventListener('keyup', (e) => renderLectures(e.target.value));

    // QBank
    dom.startMockBtn.addEventListener('click', handleMockExamStart);
    dom.startSimulationBtn.addEventListener('click', handleStartSimulation);
    dom.qbankSearchBtn.addEventListener('click', handleQBankSearch);
    dom.qbankStartSearchQuizBtn.addEventListener('click', startSearchedQuiz);
    
    // Quiz Controls
    dom.endQuizBtn.addEventListener('click', triggerEndQuiz);
    dom.nextSkipBtn.addEventListener('click', handleNextQuestion);
    dom.previousBtn.addEventListener('click', handlePreviousQuestion);
    
    // OSCE
    dom.startOsceSlayerBtn.addEventListener('click', startOsceSlayer);
    dom.startCustomOsceBtn.addEventListener('click', startCustomOsce);
    dom.endOsceQuizBtn.addEventListener('click', () => endOsceQuiz(false));
    dom.osceNextBtn.addEventListener('click', handleOsceNext);
    dom.oscePreviousBtn.addEventListener('click', handleOscePrevious);
    dom.osceNavigatorBtn.addEventListener('click', showOsceNavigator);

    // Learning Mode
    dom.endLearningBtn.addEventListener('click', showLearningModeBrowseScreen);
    dom.learningNextBtn.addEventListener('click', handleLearningNext);
    dom.learningPreviousBtn.addEventListener('click', handleLearningPrevious);
    dom.learningSearchBtn.addEventListener('click', handleLearningSearch);

    // Study Planner
    dom.studyPlannerGenerateBtn.addEventListener('click', handleGeneratePlan);
    dom.studyPlanAddCustomTaskBtn.addEventListener('click', handleAddCustomTask);

    // Modals
    dom.modalCancelBtn.addEventListener('click', () => dom.modalBackdrop.classList.add('hidden'));
    dom.modalConfirmBtn.addEventListener('click', () => { if (appState.modalConfirmAction) appState.modalConfirmAction(); });
    dom.imageViewerCloseBtn.addEventListener('click', () => dom.imageViewerModal.classList.add('hidden'));
    dom.announcementsCloseBtn.addEventListener('click', () => dom.announcementsModal.classList.add('hidden'));
    dom.userCardCloseBtn.addEventListener('click', () => dom.userCardModal.classList.add('hidden'));
    dom.messengerCloseBtn.addEventListener('click', () => {
        dom.messengerModal.classList.add('hidden');
        if (appState.messengerPollInterval) clearInterval(appState.messengerPollInterval);
    });
    dom.osceNavigatorCloseBtn.addEventListener('click', () => dom.osceNavigatorModal.classList.add('hidden'));

    // Init App
    initializeApp();
});
