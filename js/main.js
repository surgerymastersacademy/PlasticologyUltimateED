// js/main.js (FINAL CORRECTED VERSION)

import { appState } from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { fetchContentData } from './api.js';
import { handleLogin, handleLogout, showUserCardModal, handleSaveProfile, showMessengerModal, handleSendMessageBtn, checkPermission, loadUserProgress, updateUserProfileHeader, toggleProfileEditMode } from './features/userProfile.js';
import { launchQuiz, handleMockExamStart, handleStartSimulation, triggerEndQuiz, handleNextQuestion, handlePreviousQuestion, startChapterQuiz, startSearchedQuiz, handleQBankSearch, updateChapterFilter, startFreeTest, startIncorrectQuestionsQuiz, startBookmarkedQuestionsQuiz } from './features/quiz.js';
import { renderLectures, saveUserProgress, fetchAndShowLastActivity } from './features/lectures.js';
import { startOsceSlayer, startCustomOsce, endOsceQuiz, handleOsceNext, handleOscePrevious, showOsceNavigator } from './features/osce.js';
import { showStudyPlannerScreen, handleGeneratePlan, handleAddCustomTask } from './features/planner.js';
import { showLearningModeBrowseScreen, handleLearningSearch, handleLearningNext, handleLearningPrevious } from './features/learningMode.js';
import { showActivityLog, renderFilteredLog } from './features/activityLog.js';
import { showNotesScreen, renderNotes, handleSaveNote } from './features/notes.js';
import { showLeaderboardScreen } from './features/leaderboard.js';

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
        dom.loginSubmitBtn.disabled = true;
        dom.loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Your Companion is on His way...';
        dom.freeTestBtn.disabled = true;

        const data = await fetchContentData();
        if (data && data.roles && data.questions) {
            appState.allQuestions = utils.parseQuestions(data.questions);
            // --- MODIFICATION: STORE THE NEW FREE TEST QUESTIONS ---
            appState.allFreeTestQuestions = utils.parseQuestions(data.freeTestQuestions);
            
            appState.groupedLectures = utils.groupLecturesByChapter(data.lectures);
            appState.mcqBooks = data.books || [];
            appState.allAnnouncements = data.announcements || [];
            appState.allOsceCases = utils.parseOsceCases(data.osceCases);
            appState.allOsceQuestions = utils.parseOsceQuestions(data.osceQuestions);
            appState.allRoles = data.roles || [];
            appState.allChaptersNames = Object.keys(appState.groupedLectures);
            
            dom.loginSubmitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Your Companion is Here!';
            dom.freeTestBtn.disabled = false;
            
            setTimeout(() => {
                dom.loginSubmitBtn.disabled = false;
                dom.loginSubmitBtn.textContent = 'Log In';
            }, 1500);

        } else {
            dom.loginSubmitBtn.textContent = 'Error Loading Data';
            dom.loginError.textContent = 'Failed to load app content. Please refresh.';
            dom.loginError.classList.remove('hidden');
        }
    }

    // --- EVENT LISTENERS ---
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
    dom.freeTestBtn.addEventListener('click', startFreeTest);
    [dom.lecturesBackBtn, dom.qbankBackBtn, dom.listBackBtn, dom.activityBackBtn, dom.libraryBackBtn, dom.notesBackBtn, dom.leaderboardBackBtn, dom.osceBackBtn, dom.learningModeBackBtn, dom.studyPlannerBackBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            if (appState.navigationHistory.length > 1) {
                appState.navigationHistory.pop();
                const previousScreen = appState.navigationHistory[appState.navigationHistory.length - 1];
                if (typeof previousScreen === 'function') previousScreen();
            } else {
                showMainMenuScreen();
            }
        });
    });
    dom.lecturesBtn.addEventListener('click', () => { if (checkPermission('Lectures')) { renderLectures(); ui.showScreen(dom.lecturesContainer); appState.navigationHistory.push(() => ui.showScreen(dom.lecturesContainer)); } });
    dom.qbankBtn.addEventListener('click', () => { if (checkPermission('MCQBank')) { ui.showScreen(dom.qbankContainer); appState.navigationHistory.push(() => ui.showScreen(dom.qbankContainer)); } });
    dom.learningModeBtn.addEventListener('click', () => { if (checkPermission('LerningMode')) showLearningModeBrowseScreen(); });
    dom.osceBtn.addEventListener('click', () => { if (checkPermission('OSCEBank')) { ui.showScreen(dom.osceContainer); appState.navigationHistory.push(() => ui.showScreen(dom.osceContainer)); } });
    dom.libraryBtn.addEventListener('click', () => { if (checkPermission('Library')) { ui.renderBooks(); ui.showScreen(dom.libraryContainer); appState.navigationHistory.push(() => ui.showScreen(dom.libraryContainer)); } });
    dom.studyPlannerBtn.addEventListener('click', () => { if (checkPermission('StudyPlanner')) showStudyPlannerScreen(); });
    dom.userProfileHeaderBtn.addEventListener('click', () => showUserCardModal(false));
    dom.editProfileBtn.addEventListener('click', () => toggleProfileEditMode(true));
    dom.cancelEditProfileBtn.addEventListener('click', () => toggleProfileEditMode(false));
    dom.saveProfileBtn.addEventListener('click', handleSaveProfile);
    dom.radioBtn.addEventListener('click', () => dom.radioBannerContainer.classList.toggle('open'));
    dom.radioCloseBtn.addEventListener('click', () => dom.radioBannerContainer.classList.remove('open'));
    dom.announcementsBtn.addEventListener('click', ui.showAnnouncementsModal);
    dom.messengerBtn.addEventListener('click', showMessengerModal);
    dom.sendMessageBtn.addEventListener('click', handleSendMessageBtn);
    dom.lectureSearchInput.addEventListener('keyup', (e) => renderLectures(e.target.value));
    dom.leaderboardBtn.addEventListener('click', () => checkPermission('LeadersBoard') && showLeaderboardScreen());
    dom.notesBtn.addEventListener('click', showNotesScreen);
    dom.activityLogBtn.addEventListener('click', showActivityLog);
    dom.logFilterAll.addEventListener('click', () => renderFilteredLog('all'));
    dom.logFilterQuizzes.addEventListener('click', () => renderFilteredLog('quizzes'));
    dom.logFilterLectures.addEventListener('click', () => renderFilteredLog('lectures'));
    dom.notesFilterQuizzes.addEventListener('click', () => renderNotes('quizzes'));
    dom.notesFilterLectures.addEventListener('click', () => renderNotes('lectures'));
    dom.noteSaveBtn.addEventListener('click', handleSaveNote);
    dom.noteCancelBtn.addEventListener('click', () => { dom.noteModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    dom.startMockBtn.addEventListener('click', handleMockExamStart);
    dom.startSimulationBtn.addEventListener('click', handleStartSimulation);
    dom.qbankSearchBtn.addEventListener('click', handleQBankSearch);
    dom.qbankStartSearchQuizBtn.addEventListener('click', startSearchedQuiz);
    dom.toggleCustomOptionsBtn.addEventListener('click', () => dom.customExamOptions.classList.toggle('visible'));
    dom.sourceSelectMock.addEventListener('change', updateChapterFilter);
    dom.selectAllSourcesMock.addEventListener('change', (e) => {
        dom.sourceSelectMock.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
        updateChapterFilter();
    });
    dom.selectAllChaptersMock.addEventListener('change', (e) => {
        dom.chapterSelectMock.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });
    dom.practiceMistakesBtn.addEventListener('click', startIncorrectQuestionsQuiz);
    dom.practiceBookmarkedBtn.addEventListener('click', startBookmarkedQuestionsQuiz);
    dom.endQuizBtn.addEventListener('click', triggerEndQuiz);
    dom.nextSkipBtn.addEventListener('click', handleNextQuestion);
    dom.previousBtn.addEventListener('click', handlePreviousQuestion);
    dom.startOsceSlayerBtn.addEventListener('click', startOsceSlayer);
    dom.startCustomOsceBtn.addEventListener('click', startCustomOsce);
    dom.endOsceQuizBtn.addEventListener('click', () => endOsceQuiz(false));
    dom.osceNextBtn.addEventListener('click', handleOsceNext);
    dom.oscePreviousBtn.addEventListener('click', handleOscePrevious);
    dom.osceNavigatorBtn.addEventListener('click', showOsceNavigator);
    dom.endLearningBtn.addEventListener('click', showLearningModeBrowseScreen);
    dom.learningNextBtn.addEventListener('click', handleLearningNext);
    dom.learningPreviousBtn.addEventListener('click', handleLearningPrevious);
    dom.learningSearchBtn.addEventListener('click', handleLearningSearch);
    dom.studyPlannerGenerateBtn.addEventListener('click', handleGeneratePlan);
    dom.studyPlanAddCustomTaskBtn.addEventListener('click', handleAddCustomTask);
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

    initializeApp();
});
