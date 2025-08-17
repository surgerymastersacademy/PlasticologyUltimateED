// js/main.js (FINAL VERSION with custom loading messages)

import { appState } from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { fetchContentData } from './api.js';
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
    dom.modalBackdrop.classList.remove('hidden');
    dom.noteModal.classList.remove('hidden');
}


// MAIN APP INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {

    async function initializeApp() {
        // --- MODIFICATION START: Using your new custom messages ---
        dom.loginSubmitBtn.disabled = true;
        // The loading message
        dom.loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Your Companion is on His way to you... Be Ready';
        dom.freeTestBtn.disabled = true;
        // --- MODIFICATION END ---

        const data = await fetchContentData();
        if (data && data.roles && data.questions) {
            appState.allQuestions = utils.parseQuestions(data.questions);
            appState.groupedLectures = utils.groupLecturesByChapter(data.lectures);
            appState.mcqBooks = data.books || [];
            appState.allAnnouncements = data.announcements || [];
            appState.allOsceCases = utils.parseOsceCases(data.osceCases);
            appState.allOsceQuestions = utils.parseOsceQuestions(data.osceQuestions);
            appState.allRoles = data.roles || [];
            appState.allChaptersNames = Object.keys(appState.groupedLectures);

            // --- MODIFICATION START: Success message shown briefly ---
            dom.loginSubmitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Your Companion is Here for You';
            dom.freeTestBtn.disabled = false;
            
            // After a short delay, revert to "Log In"
            setTimeout(() => {
                dom.loginSubmitBtn.disabled = false;
                dom.loginSubmitBtn.textContent = 'Log In';
            }, 1500); // Wait 1.5 seconds before changing to "Log In"
            // --- MODIFICATION END ---

        } else {
            dom.loginSubmitBtn.textContent = 'Error Loading Data';
            dom.loginError.textContent = 'Failed to load app content. Please check your connection and refresh.';
            dom.loginError.classList.remove('hidden');
        }
    }

    // --- EVENT LISTENERS (No changes needed here) ---

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
        btn.addEventListener('click', () => {
            if (appState.navigationHistory.length > 1) {
                appState.navigationHistory.pop();
                const previousScreen = appState.navigationHistory[appState.navigationHistory.length - 1];
                if (typeof previousScreen === 'function') {
                    previousScreen();
                }
            } else {
                showMainMenuScreen();
            }
        });
    });

    // Main Menu
    dom.lecturesBtn.addEventListener('click', () => { if (checkPermission('Lectures')) { renderLectures(); ui.showScreen(dom.lecturesContainer); appState.navigationHistory.push(() => ui.showScreen(dom.lecturesContainer)); } });
    dom.qbankBtn.addEventListener('click', () => { if (checkPermission('MCQBank')) { ui.showScreen(dom.qbankContainer); appState.navigationHistory.push(() => ui.showScreen(dom.qbankContainer)); } });
    dom.learningModeBtn.addEventListener('click', () => { if (checkPermission('LerningMode')) showLearningModeBrowseScreen(); });
    dom.osceBtn.addEventListener('click', () => { if (checkPermission('OSCEBank')) { ui.showScreen(dom.osceContainer); appState.navigationHistory.push(() => ui.showScreen(dom.osceContainer)); } });
    dom.libraryBtn.addEventListener('click', () => { if (checkPermission('Library')) { ui.renderBooks(); ui.showScreen(dom.libraryContainer); appState.navigationHistory.push(() => ui.showScreen(dom.libraryContainer)); } });
    // dom.leaderboardBtn.addEventListener('click', () => checkPermission('LeadersBoard') && showLeaderboardScreen());
    dom.studyPlannerBtn.addEventListener('click', () => { if (checkPermission('StudyPlanner')) showStudyPlannerScreen(); });
    
    // Header & User Profile
    dom.userProfileHeaderBtn.addEventListener('click', () => showUserCardModal(false));
    dom.editProfileBtn.addEventListener('click', () => toggleProfileEditMode(true));
    dom.cancelEditProfileBtn.addEventListener('click', () => toggleProfileEditMode(false));
    dom.saveProfileBtn.addEventListener('click', handleSaveProfile);
    
    // Misc Header
    dom.radioBtn.addEventListener('click', () => dom.radioBannerContainer.classList.toggle('open'));
    dom.radioCloseBtn.addEventListener('click', () => dom.radioBannerContainer.classList.remove('open'));
    dom.announcementsBtn.addEventListener('click', ui.showAnnouncementsModal);
    // dom.notesBtn.addEventListener('click', () => (ui.showScreen(dom.notesContainer), renderNotes('quizzes')));
    // dom.activityLogBtn.addEventListener('click', () => (ui.showScreen(dom.activityLogContainer), renderFilteredLog('all')));
    
    // Messenger
    dom.messengerBtn.addEventListener('click', showMessengerModal);
    dom.sendMessageBtn.addEventListener('click', handleSendMessageBtn);

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
    dom.modalCancelBtn.addEventListener('click', () => { dom.modalBackdrop.classList.add('hidden'); });
    dom.modalConfirmBtn.addEventListener('click', () => { if (appState.modalConfirmAction) { appState.modalConfirmAction(); dom.modalBackdrop.classList.add('hidden');} });
    dom.imageViewerCloseBtn.addEventListener('click', () => { dom.imageViewerModal.classList.add('hidden'); if(dom.userCardModal.classList.contains('hidden')) dom.modalBackdrop.classList.add('hidden');});
    dom.announcementsCloseBtn.addEventListener('click', () => { dom.announcementsModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    dom.userCardCloseBtn.addEventListener('click', () => { dom.userCardModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    dom.messengerCloseBtn.addEventListener('click', () => {
        dom.messengerModal.classList.add('hidden');
        dom.modalBackdrop.classList.add('hidden');
        if (appState.messengerPollInterval) clearInterval(appState.messengerPollInterval);
    });
    dom.osceNavigatorCloseBtn.addEventListener('click', () => { dom.osceNavigatorModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');});

    // Init App
    initializeApp();
});
