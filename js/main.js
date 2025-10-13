// js/main.js (FINAL VERSION - With Registration Logic)

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
import { showActivityLog, renderFilteredLog } from './features/activityLog.js';
import { showNotesScreen, renderNotes, handleSaveNote } from './features/notes.js';
import { showLeaderboardScreen } from './features/leaderboard.js';
import { analyzePerformanceByChapter } from './features/performance.js';
import { showTheoryMenuScreen, launchTheorySession } from './features/theory.js';
// --- NEW: Import registration handlers ---
import { showRegistrationModal, hideRegistrationModal, handleRegistrationSubmit } from './features/registration.js';


// SHARED & EXPORTED FUNCTIONS
export function showMainMenuScreen() {
    ui.showScreen(dom.mainMenuContainer);
    appState.navigationHistory = [showMainMenuScreen];
    ui.displayAnnouncement();
    fetchAndShowLastActivity();
}

export function openNoteModal(type, itemId, itemTitle) {
    appState.currentNote = { type, itemId, itemTitle };
    let existingNote;

    if (type === 'quiz') {
        existingNote = appState.userQuizNotes.find(n => n.QuizID === itemId);
    } else if (type === 'lecture') {
        existingNote = appState.userLectureNotes.find(n => n.LectureID === itemId);
    } else if (type === 'theory') {
        const log = appState.userTheoryLogs.find(l => l.Question_ID === itemId);
        existingNote = log ? { NoteText: log.Notes } : null;
    }

    dom.noteModalTitle.textContent = `Note on: ${itemTitle.substring(0, 40)}...`;
    dom.noteTextarea.value = existingNote ? existingNote.NoteText : '';
    dom.modalBackdrop.classList.remove('hidden');
    dom.noteModal.classList.remove('hidden');
}


function populateAllFilters() {
    // For QBank (Exam Mode)
    const allSources = [...new Set(appState.allQuestions.map(q => q.source || 'Uncategorized'))].sort();
    const sourceCounts = appState.allQuestions.reduce((acc, q) => {
        const source = q.source || 'Uncategorized';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});
    ui.populateFilterOptions(dom.sourceSelectMock, allSources, 'mock-source', sourceCounts);
    updateChapterFilter();

    // For OSCE
    const osceChapters = [...new Set(appState.allOsceCases.map(c => c.Chapter || 'Uncategorized'))].sort();
    const osceSources = [...new Set(appState.allOsceCases.map(c => c.Source || 'Uncategorized'))].sort();
    const osceChapterCounts = appState.allOsceCases.reduce((acc, c) => {
        const chapter = c.Chapter || 'Uncategorized';
        acc[chapter] = (acc[chapter] || 0) + 1;
        return acc;
    }, {});
    const osceSourceCounts = appState.allOsceCases.reduce((acc, c) => {
        const source = c.Source || 'Uncategorized';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});
    ui.populateFilterOptions(dom.chapterSelectOsce, osceChapters, 'osce-chapter', osceChapterCounts);
    ui.populateFilterOptions(dom.sourceSelectOsce, osceSources, 'osce-source', osceSourceCounts);
}


// MAIN APP INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {

    const toggleThemeBtn = document.getElementById('toggle-theme-btn');
    const toggleAnimationBtn = document.getElementById('toggle-animation-btn');
    const loginCanvas = document.getElementById('login-canvas');
    const htmlEl = document.documentElement;

    function initializeSettings() {
        // Theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlEl.className = savedTheme;
        toggleThemeBtn.className = savedTheme;

        // Animation
        const savedAnimation = localStorage.getItem('animation') || 'on';
        if (savedAnimation === 'off') {
            loginCanvas.style.display = 'none';
            htmlEl.classList.add('animation-off');
        } else {
            loginCanvas.style.display = 'block';
            htmlEl.classList.remove('animation-off');
        }
    }

    toggleThemeBtn.addEventListener('click', () => {
        if (htmlEl.classList.contains('light')) {
            htmlEl.className = htmlEl.className.replace('light', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            htmlEl.className = htmlEl.className.replace('dark', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    toggleAnimationBtn.addEventListener('click', () => {
        if (htmlEl.classList.contains('animation-off')) {
            htmlEl.classList.remove('animation-off');
            loginCanvas.style.display = 'block';
            localStorage.setItem('animation', 'on');
        } else {
            htmlEl.classList.add('animation-off');
            loginCanvas.style.display = 'none';
            localStorage.setItem('animation', 'off');
        }
    });

    async function initializeApp() {
        dom.loginSubmitBtn.disabled = true;
        dom.loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Your Companion is on His way...';
        dom.freeTestBtn.disabled = true;

        const data = await fetchContentData();
        if (data && data.roles && data.questions) {
            appState.allQuestions = utils.parseQuestions(data.questions);
            appState.allFreeTestQuestions = utils.parseQuestions(data.freeTestQuestions);
            appState.groupedLectures = utils.groupLecturesByChapter(data.lectures);
            appState.mcqBooks = data.books || [];
            appState.allAnnouncements = data.announcements || [];
            appState.allOsceCases = utils.parseOsceCases(data.osceCases);
            appState.allOsceQuestions = utils.parseOsceQuestions(data.osceQuestions);
            appState.allRoles = data.roles || [];
            appState.allChaptersNames = Object.keys(appState.groupedLectures);
            appState.allTheoryQuestions = utils.parseTheoryQuestions(data.theoryQuestions);

            populateAllFilters();
            
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

    initializeSettings();

    // --- EVENT LISTENERS ---
    
    // Login and Registration
    dom.loginForm.addEventListener('submit', handleLogin);
    dom.showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegistrationModal();
    });
    dom.registrationForm.addEventListener('submit', handleRegistrationSubmit);
    dom.registerCancelBtn.addEventListener('click', hideRegistrationModal);

    // Global Navigation
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
    [dom.lecturesBackBtn, dom.qbankBackBtn, dom.listBackBtn, dom.activityBackBtn, dom.libraryBackBtn, dom.notesBackBtn, dom.leaderboardBackBtn, dom.osceBackBtn, dom.learningModeBackBtn, dom.studyPlannerBackBtn, dom.theoryBackBtn].forEach(btn => {
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

    // Main Menu & Header
    dom.lecturesBtn.addEventListener('click', () => { if (checkPermission('Lectures')) { renderLectures(); ui.showScreen(dom.lecturesContainer); appState.navigationHistory.push(() => ui.showScreen(dom.lecturesContainer)); } });
    dom.qbankBtn.addEventListener('click', () => { if (checkPermission('MCQBank')) { ui.showScreen(dom.qbankContainer); appState.navigationHistory.push(() => ui.showScreen(dom.qbankContainer)); } });
    dom.learningModeBtn.addEventListener('click', () => { if (checkPermission('LerningMode')) showLearningModeBrowseScreen(); });
    dom.theoryBtn.addEventListener('click', () => { if (checkPermission('TheoryBank')) showTheoryMenuScreen(); });
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
    
    // Notes & Activity Log
    dom.notesBtn.addEventListener('click', showNotesScreen);
    dom.activityLogBtn.addEventListener('click', showActivityLog);
    dom.logFilterAll.addEventListener('click', () => renderFilteredLog('all'));
    dom.logFilterQuizzes.addEventListener('click', () => renderFilteredLog('quizzes'));
    dom.logFilterLectures.addEventListener('click', () => renderFilteredLog('lectures'));
    dom.notesFilterQuizzes.addEventListener('click', () => renderNotes('quizzes'));
    dom.notesFilterLectures.addEventListener('click', () => renderNotes('lectures'));
    dom.notesFilterTheory.addEventListener('click', () => renderNotes('theory'));
    dom.noteSaveBtn.addEventListener('click', () => {
        const { type, itemId } = appState.currentNote;
        if (type === 'theory') {
            logTheoryActivity({
                questionId: itemId,
                Notes: dom.noteTextarea.value,
            });
            const theoryNoteBtn = document.getElementById('theory-note-btn');
            if(theoryNoteBtn) theoryNoteBtn.classList.toggle('has-note', dom.noteTextarea.value.length > 0);
             dom.modalBackdrop.classList.add('hidden');
             dom.noteModal.classList.add('hidden');
        } else {
            handleSaveNote(); 
        }
    });
    dom.noteCancelBtn.addEventListener('click', () => { dom.noteModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    
    // QBank Listeners
    dom.startMockBtn.addEventListener('click', handleMockExamStart);
    dom.startSimulationBtn.addEventListener('click', handleStartSimulation);
    dom.qbankSearchBtn.addEventListener('click', handleQBankSearch);
    dom.qbankStartSearchQuizBtn.addEventListener('click', startSearchedQuiz);
    dom.qbankClearSearchBtn.addEventListener('click', () => {
        dom.qbankSearchResultsContainer.classList.add('hidden');
        dom.qbankMainContent.classList.remove('hidden');
        dom.qbankSearchInput.value = '';
    });
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
    dom.browseByChapterBtn.addEventListener('click', () => startQuizBrowse('chapter'));
    dom.browseBySourceBtn.addEventListener('click', () => startQuizBrowse('source'));
    const qbankTabs = [dom.qbankTabCreate, dom.qbankTabPractice, dom.qbankTabBrowse];
    const qbankPanels = [dom.qbankPanelCreate, dom.qbankPanelPractice, dom.qbankPanelBrowse];
    function switchQBankTab(activeIndex) {
        qbankTabs.forEach((tab, index) => {
            if(tab) tab.classList.toggle('active', index === activeIndex);
        });
        qbankPanels.forEach((panel, index) => {
            if(panel) panel.classList.toggle('hidden', index !== activeIndex);
        });
        dom.qbankMainContent.classList.remove('hidden');
        dom.qbankSearchResultsContainer.classList.add('hidden');
    }
    qbankTabs.forEach((tab, index) => {
        if(tab) tab.addEventListener('click', () => switchQBankTab(index));
    });
    if(qbankTabs[0]) switchQBankTab(0);

    // In-Quiz Listeners
    dom.endQuizBtn.addEventListener('click', triggerEndQuiz);
    dom.nextSkipBtn.addEventListener('click', handleNextQuestion);
    dom.previousBtn.addEventListener('click', handlePreviousQuestion);
    dom.bookmarkBtn.addEventListener('click', toggleBookmark);
    dom.flagBtn.addEventListener('click', toggleFlag);
    dom.hintBtn.addEventListener('click', showHint);
    dom.navigatorBtn.addEventListener('click', showQuestionNavigator);
    dom.quizNoteBtn.addEventListener('click', () => {
        const question = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
        if (question) {
            openNoteModal('quiz', question.UniqueID, question.question);
        }
    });
    dom.resultsHomeBtn.addEventListener('click', showMainMenuScreen);
    dom.restartBtn.addEventListener('click', () => restartCurrentQuiz());
    dom.reviewIncorrectBtn.addEventListener('click', () => reviewIncorrectAnswers());
    const reviewSimulationBtn = document.getElementById('review-simulation-btn');
    if(reviewSimulationBtn) reviewSimulationBtn.addEventListener('click', () => startSimulationReview());

    // OSCE Listeners
    dom.startOsceSlayerBtn.addEventListener('click', startOsceSlayer);
    dom.startCustomOsceBtn.addEventListener('click', startCustomOsce);
    dom.toggleOsceOptionsBtn.addEventListener('click', () => dom.customOsceOptions.classList.toggle('visible'));
    dom.endOsceQuizBtn.addEventListener('click', () => endOsceQuiz(false));
    dom.osceNextBtn.addEventListener('click', handleOsceNext);
    dom.oscePreviousBtn.addEventListener('click', handleOscePrevious);
    dom.osceNavigatorBtn.addEventListener('click', showOsceNavigator);
    document.getElementById('select-all-chapters-osce').addEventListener('change', (e) => {
        dom.chapterSelectOsce.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });
    document.getElementById('select-all-sources-osce').addEventListener('change', (e) => {
        dom.sourceSelectOsce.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });
    
    // Learning Mode Listeners
    dom.endLearningBtn.addEventListener('click', showLearningModeBrowseScreen);
    dom.learningNextBtn.addEventListener('click', handleLearningNext);
    dom.learningPreviousBtn.addEventListener('click', handleLearningPrevious);
    dom.learningSearchBtn.addEventListener('click', handleLearningSearch);
    dom.learningBrowseByChapterBtn.addEventListener('click', () => startLearningBrowse('chapter'));
    dom.learningBrowseBySourceBtn.addEventListener('click', () => startLearningBrowse('source'));
    const learningMistakesBtn = document.getElementById('learning-mistakes-btn');
    if(learningMistakesBtn) learningMistakesBtn.addEventListener('click', startLearningMistakes);
    const learningBookmarkedBtn = document.getElementById('learning-bookmarked-btn');
    if(learningBookmarkedBtn) learningBookmarkedBtn.addEventListener('click', startLearningBookmarked);

    // Study Planner Event Listeners
    dom.showCreatePlanModalBtn.addEventListener('click', () => {
        dom.createPlanModal.classList.remove('hidden');
        dom.modalBackdrop.classList.remove('hidden');
    });
    dom.cancelCreatePlanBtn.addEventListener('click', () => {
        dom.createPlanModal.classList.add('hidden');
        dom.modalBackdrop.classList.add('hidden');
    });
    dom.confirmCreatePlanBtn.addEventListener('click', handleCreatePlan);
    dom.backToPlansDashboardBtn.addEventListener('click', () => {
        dom.activePlanView.classList.add('hidden');
        dom.plannerDashboard.classList.remove('hidden');
    });

    // Modals
    dom.modalCancelBtn.addEventListener('click', () => { dom.confirmationModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    dom.modalConfirmBtn.addEventListener('click', () => { if (appState.modalConfirmAction) { appState.modalConfirmAction(); dom.confirmationModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');} });
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


    initializeApp();
});
