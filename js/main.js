// js/main.js (FINAL VERSION - UPDATED FOR SIMULATION FILTERS)

import { appState } from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { fetchContentData, logTheoryActivity } from './api.js';
import { handleLogin, handleLogout, showUserCardModal, handleSaveProfile, showMessengerModal, handleSendMessageBtn, checkPermission, updateUserProfileHeader, toggleProfileEditMode } from './features/userProfile.js';
import {
    handleMockExamStart, handleStartSimulation, triggerEndQuiz, handleNextQuestion, handlePreviousQuestion, startSearchedQuiz, handleQBankSearch, updateChapterFilter, startFreeTest, startIncorrectQuestionsQuiz, startBookmarkedQuestionsQuiz,
    toggleBookmark, toggleFlag, showHint, showQuestionNavigator, startQuizBrowse, restartCurrentQuiz, reviewIncorrectAnswers, startSimulationReview
} from './features/quiz.js';
import { renderLectures, fetchAndShowLastActivity } from './features/lectures.js';
import { startOsceSlayer, startCustomOsce, endOsceQuiz, handleOsceNext, handleOscePrevious, showOsceNavigator } from './features/osce.js';
import { showStudyPlannerScreen, handleCreatePlan } from './features/planner.js';
import { showLearningModeBrowseScreen, handleLearningSearch, handleLearningNext, handleLearningPrevious, startLearningBrowse, startLearningMistakes, startLearningBookmarked } from './features/learningMode.js';
import { showActivityLog, renderFilteredLog } from './features/activityLog.js';
import { showNotesScreen, renderNotes, handleSaveNote } from './features/notes.js';
import { showLeaderboardScreen } from './features/leaderboard.js';
import { showTheoryMenuScreen, launchTheorySession } from './features/theory.js';
import { showRegistrationModal, hideRegistrationModal, handleRegistrationSubmit } from './features/registration.js';
import { showMatchingMenu, handleStartMatchingExam, checkCurrentSetAnswers, handleNextMatchingSet } from './features/matching.js';
import { checkAndTriggerOnboarding, startTour, nextTourStep, endTour } from './features/onboarding.js';

// --- Helper: Safe Event Listener ---
function safeListen(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
    }
}

export function showMainMenuScreen() {
    ui.showScreen(dom.mainMenuContainer);
    appState.navigationHistory = [showMainMenuScreen];
    ui.displayAnnouncement();
    fetchAndShowLastActivity();
    
    setTimeout(() => {
        checkAndTriggerOnboarding();
    }, 1000);
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

    if(dom.noteModalTitle) dom.noteModalTitle.textContent = `Note on: ${itemTitle.substring(0, 40)}...`;
    if(dom.noteTextarea) dom.noteTextarea.value = existingNote ? existingNote.NoteText : '';
    if(dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
    if(dom.noteModal) dom.noteModal.classList.remove('hidden');
}

function populateAllFilters() {
    // 1. QBank Mock Filters (Existing)
    const allSources = [...new Set(appState.allQuestions.map(q => q.source || 'Uncategorized'))].sort();
    const sourceCounts = appState.allQuestions.reduce((acc, q) => {
        const source = q.source || 'Uncategorized';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});
    ui.populateFilterOptions(dom.sourceSelectMock, allSources, 'mock-source', sourceCounts);
    updateChapterFilter();

    // 2. Simulation Filters (NEW)
    // Populate Sources
    ui.populateFilterOptions(dom.sourceSelectSim, allSources, 'sim-source', sourceCounts);
    
    // Populate Chapters (All chapters initially)
    const allChapters = [...new Set(appState.allQuestions.map(q => q.chapter || 'Uncategorized'))].sort();
    const chapterCounts = appState.allQuestions.reduce((acc, q) => {
        const chapter = q.chapter || 'Uncategorized';
        acc[chapter] = (acc[chapter] || 0) + 1;
        return acc;
    }, {});
    ui.populateFilterOptions(dom.chapterSelectSim, allChapters, 'sim-chapter', chapterCounts);

    // Check all boxes by default for Simulation Mode
    if(dom.sourceSelectSim) dom.sourceSelectSim.querySelectorAll('input').forEach(i => i.checked = true);
    if(dom.chapterSelectSim) dom.chapterSelectSim.querySelectorAll('input').forEach(i => i.checked = true);


    // 3. OSCE Filters (Existing)
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

// --- Router ---
function handleRouting() {
    if (!appState.currentUser && window.location.hash !== '#login') {
        return;
    }
    const hash = window.location.hash;
    switch(hash) {
        case '#home': showMainMenuScreen(); break;
        case '#lectures': if (checkPermission('Lectures')) { renderLectures(); ui.showScreen(dom.lecturesContainer); } break;
        case '#qbank': if (checkPermission('MCQBank')) ui.showScreen(dom.qbankContainer); break;
        case '#learning': if (checkPermission('LerningMode')) showLearningModeBrowseScreen(); break;
        case '#theory': if (checkPermission('TheoryBank')) showTheoryMenuScreen(); break;
        case '#osce': if (checkPermission('OSCEBank')) ui.showScreen(dom.osceContainer); break;
        case '#library': if (checkPermission('Library')) { ui.renderBooks(); ui.showScreen(dom.libraryContainer); } break;
        case '#planner': if (checkPermission('StudyPlanner')) showStudyPlannerScreen(); break;
        case '#leaderboard': if (checkPermission('LeadersBoard')) showLeaderboardScreen(); break;
        case '#activity': showActivityLog(); break;
        case '#notes': showNotesScreen(); break;
        case '#quiz': 
            if (!appState.currentQuiz.questions || appState.currentQuiz.questions.length === 0) {
                window.location.hash = '#home';
            } else {
                ui.showScreen(dom.quizContainer);
            }
            break;
        case '#matching': showMatchingMenu(); break;
        default: break;
    }
}

// --- PWA Logic ---
let deferredPrompt; 
function initializePwaFeatures() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return; 

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if(dom.pwaInstallBanner) dom.pwaInstallBanner.classList.remove('hidden');
    });

    if(dom.pwaInstallBtn) {
        dom.pwaInstallBtn.addEventListener('click', () => {
            if (isIOS) {
                if(dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
                const iosModal = document.getElementById('ios-install-modal');
                if(iosModal) iosModal.classList.remove('hidden');
            } else if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        if(dom.pwaInstallBanner) dom.pwaInstallBanner.classList.add('hidden');
                    }
                    deferredPrompt = null;
                });
            } else {
                alert("To install, tap your browser menu and select 'Add to Home Screen' or 'Install App'.");
            }
        });
    }
    const iosCloseBtn = document.getElementById('ios-install-close-btn');
    if(iosCloseBtn) {
        iosCloseBtn.addEventListener('click', () => {
            const iosModal = document.getElementById('ios-install-modal');
            if(iosModal) iosModal.classList.add('hidden');
            dom.modalBackdrop.classList.add('hidden');
        });
    }
}

// --- Daily Streak ---
function calculateDailyStreak() {
    if (!dom.streakContainer || !dom.streakCount) return;
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('lastVisitDate');
    let streak = parseInt(localStorage.getItem('dailyStreak') || '0');

    if (lastVisit !== today) {
        if (lastVisit) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (lastVisit === yesterdayStr) streak++;
            else streak = 1; 
        } else {
            streak = 1;
        }
        localStorage.setItem('lastVisitDate', today);
        localStorage.setItem('dailyStreak', streak);
    }
    dom.streakCount.textContent = streak;
    if (streak > 0) {
        dom.streakContainer.classList.remove('hidden');
        dom.streakContainer.classList.add('flex');
    }
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const toggleThemeBtn = document.getElementById('toggle-theme-btn');
    const toggleAnimationBtn = document.getElementById('toggle-animation-btn');
    const loginCanvas = document.getElementById('login-canvas');
    const htmlEl = document.documentElement;

    window.addEventListener('hashchange', handleRouting);
    initializePwaFeatures();
    calculateDailyStreak(); 

    function initializeSettings() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlEl.className = savedTheme;
        if(toggleThemeBtn) toggleThemeBtn.className = savedTheme;

        const savedAnimation = localStorage.getItem('animation') || 'on';
        if (savedAnimation === 'off') {
            if(loginCanvas) loginCanvas.style.display = 'none';
            htmlEl.classList.add('animation-off');
        } else {
            if(loginCanvas) loginCanvas.style.display = 'block';
            htmlEl.classList.remove('animation-off');
        }
    }

    safeListen(toggleThemeBtn, 'click', () => {
        if (htmlEl.classList.contains('light')) {
            htmlEl.className = htmlEl.className.replace('light', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            htmlEl.className = htmlEl.className.replace('dark', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    safeListen(toggleAnimationBtn, 'click', () => {
        if (htmlEl.classList.contains('animation-off')) {
            htmlEl.classList.remove('animation-off');
            if(loginCanvas) loginCanvas.style.display = 'block';
            localStorage.setItem('animation', 'on');
        } else {
            htmlEl.classList.add('animation-off');
            if(loginCanvas) loginCanvas.style.display = 'none';
            localStorage.setItem('animation', 'off');
        }
    });

    async function initializeApp() {
        if(dom.loginSubmitBtn) {
            dom.loginSubmitBtn.disabled = true;
            dom.loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Connecting...';
        }
        if(dom.freeTestBtn) dom.freeTestBtn.disabled = true;

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
            appState.allTheoryQuestions = utils.parseTheoryQuestions(data.theoryQuestions);

            populateAllFilters();
            
            if(dom.loginSubmitBtn) {
                dom.loginSubmitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Ready!';
                setTimeout(() => {
                    dom.loginSubmitBtn.disabled = false;
                    dom.loginSubmitBtn.textContent = 'Log In';
                }, 1000);
            }
            if(dom.freeTestBtn) dom.freeTestBtn.disabled = false;
        } else {
            if(dom.loginSubmitBtn) dom.loginSubmitBtn.textContent = 'Connection Error';
            if(dom.loginError) {
                dom.loginError.textContent = 'Failed to load content. Please refresh.';
                dom.loginError.classList.remove('hidden');
            }
        }
    }

    initializeSettings();

    // --- EVENT LISTENERS ---
    safeListen(dom.helpBtn, 'click', startTour);
    safeListen(dom.startTourBtn, 'click', startTour);
    safeListen(dom.skipTourBtn, 'click', endTour);
    safeListen(dom.tourNextBtn, 'click', nextTourStep);
    safeListen(dom.tourEndBtn, 'click', endTour);

    safeListen(dom.loginForm, 'submit', handleLogin);
    safeListen(dom.showRegisterLink, 'click', (e) => { e.preventDefault(); showRegistrationModal(); });
    safeListen(dom.registrationForm, 'submit', handleRegistrationSubmit);
    safeListen(dom.registerCancelBtn, 'click', hideRegistrationModal);

    safeListen(dom.logoutBtn, 'click', handleLogout);
    safeListen(dom.globalHomeBtn, 'click', () => {
        if (appState.currentUser?.Role === 'Guest') { ui.showScreen(dom.loginContainer); appState.currentUser = null; } 
        else { showMainMenuScreen(); }
    });
    safeListen(dom.freeTestBtn, 'click', startFreeTest);
    
    // Back Buttons
    [dom.lecturesBackBtn, dom.qbankBackBtn, dom.listBackBtn, dom.activityBackBtn, dom.libraryBackBtn, dom.notesBackBtn, dom.leaderboardBackBtn, dom.osceBackBtn, dom.learningModeBackBtn, dom.studyPlannerBackBtn, dom.theoryBackBtn, dom.matchingBackBtn].forEach(btn => {
        safeListen(btn, 'click', () => { if (window.history.length > 1) window.history.back(); else showMainMenuScreen(); });
    });

    // Menu Buttons
    safeListen(dom.lecturesBtn, 'click', () => { if (checkPermission('Lectures')) { renderLectures(); ui.showScreen(dom.lecturesContainer); } });
    safeListen(dom.qbankBtn, 'click', () => { if (checkPermission('MCQBank')) { ui.showScreen(dom.qbankContainer); } });
    safeListen(dom.learningModeBtn, 'click', () => { if (checkPermission('LerningMode')) showLearningModeBrowseScreen(); });
    safeListen(dom.theoryBtn, 'click', () => { if (checkPermission('TheoryBank')) showTheoryMenuScreen(); });
    safeListen(dom.osceBtn, 'click', () => { if (checkPermission('OSCEBank')) { ui.showScreen(dom.osceContainer); } });
    safeListen(dom.libraryBtn, 'click', () => { if (checkPermission('Library')) { ui.renderBooks(); ui.showScreen(dom.libraryContainer); } });
    safeListen(dom.studyPlannerBtn, 'click', () => { if (checkPermission('StudyPlanner')) showStudyPlannerScreen(); });
    safeListen(dom.leaderboardBtn, 'click', () => checkPermission('LeadersBoard') && showLeaderboardScreen());
    safeListen(dom.matchingBtn, 'click', () => showMatchingMenu());
    
    // Features
    safeListen(dom.userProfileHeaderBtn, 'click', () => showUserCardModal(false));
    safeListen(dom.editProfileBtn, 'click', () => toggleProfileEditMode(true));
    safeListen(dom.cancelEditProfileBtn, 'click', () => toggleProfileEditMode(false));
    safeListen(dom.saveProfileBtn, 'click', handleSaveProfile);
    safeListen(dom.radioBtn, 'click', () => dom.radioBannerContainer.classList.toggle('open'));
    safeListen(dom.radioCloseBtn, 'click', () => dom.radioBannerContainer.classList.remove('open'));
    safeListen(dom.announcementsBtn, 'click', ui.showAnnouncementsModal);
    safeListen(dom.messengerBtn, 'click', showMessengerModal);
    safeListen(dom.sendMessageBtn, 'click', handleSendMessageBtn);
    safeListen(dom.lectureSearchInput, 'keyup', (e) => renderLectures(e.target.value));
    
    safeListen(dom.notesBtn, 'click', showNotesScreen);
    safeListen(dom.activityLogBtn, 'click', showActivityLog);
    safeListen(dom.logFilterAll, 'click', () => renderFilteredLog('all'));
    safeListen(dom.logFilterQuizzes, 'click', () => renderFilteredLog('quizzes'));
    safeListen(dom.logFilterLectures, 'click', () => renderFilteredLog('lectures'));
    safeListen(dom.notesFilterQuizzes, 'click', () => renderNotes('quizzes'));
    safeListen(dom.notesFilterLectures, 'click', () => renderNotes('lectures'));
    safeListen(dom.notesFilterTheory, 'click', () => renderNotes('theory'));
    safeListen(dom.noteSaveBtn, 'click', () => {
        const { type, itemId } = appState.currentNote;
        if (type === 'theory') {
            logTheoryActivity({ questionId: itemId, Notes: dom.noteTextarea.value });
            if(dom.theoryNoteBtn) dom.theoryNoteBtn.classList.toggle('has-note', dom.noteTextarea.value.length > 0);
             dom.modalBackdrop.classList.add('hidden');
             dom.noteModal.classList.add('hidden');
        } else { handleSaveNote(); }
    });
    safeListen(dom.noteCancelBtn, 'click', () => { dom.noteModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    
    // QBank Listeners
    safeListen(dom.startMockBtn, 'click', handleMockExamStart);
    safeListen(dom.startSimulationBtn, 'click', handleStartSimulation); // Uses new filtered logic
    safeListen(dom.qbankSearchBtn, 'click', handleQBankSearch);
    safeListen(dom.qbankStartSearchQuizBtn, 'click', startSearchedQuiz);
    safeListen(dom.qbankClearSearchBtn, 'click', () => {
        dom.qbankSearchResultsContainer.classList.add('hidden');
        dom.qbankMainContent.classList.remove('hidden');
        dom.qbankSearchInput.value = '';
    });
    safeListen(dom.toggleCustomOptionsBtn, 'click', () => dom.customExamOptions.classList.toggle('visible'));
    
    // Mock Filters
    safeListen(dom.sourceSelectMock, 'change', updateChapterFilter);
    if(dom.selectAllSourcesMock) safeListen(dom.selectAllSourcesMock, 'change', (e) => {
        dom.sourceSelectMock.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
        updateChapterFilter();
    });
    if(dom.selectAllChaptersMock) safeListen(dom.selectAllChaptersMock, 'change', (e) => {
        dom.chapterSelectMock.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });

    // NEW: Simulation Filters Listeners
    safeListen(dom.toggleSimulationOptionsBtn, 'click', () => dom.simulationCustomOptions.classList.toggle('hidden'));
    if(dom.selectAllSourcesSim) safeListen(dom.selectAllSourcesSim, 'change', (e) => {
        dom.sourceSelectSim.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });
    if(dom.selectAllChaptersSim) safeListen(dom.selectAllChaptersSim, 'change', (e) => {
        dom.chapterSelectSim.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });

    safeListen(dom.practiceMistakesBtn, 'click', startIncorrectQuestionsQuiz);
    safeListen(dom.practiceBookmarkedBtn, 'click', startBookmarkedQuestionsQuiz);
    if(dom.browseByChapterBtn) safeListen(dom.browseByChapterBtn, 'click', () => startQuizBrowse('chapter'));
    if(dom.browseBySourceBtn) safeListen(dom.browseBySourceBtn, 'click', () => startQuizBrowse('source'));
    
    const qbankTabs = [dom.qbankTabCreate, dom.qbankTabPractice, dom.qbankTabBrowse];
    qbankTabs.forEach((tab, index) => { 
        safeListen(tab, 'click', () => {
            const panels = [dom.qbankPanelCreate, dom.qbankPanelPractice, dom.qbankPanelBrowse];
            qbankTabs.forEach((t, i) => t && t.classList.toggle('active', i === index));
            panels.forEach((p, i) => p && p.classList.toggle('hidden', i !== index));
            if(dom.qbankMainContent) dom.qbankMainContent.classList.remove('hidden');
            if(dom.qbankSearchResultsContainer) dom.qbankSearchResultsContainer.classList.add('hidden');
        }); 
    });

    safeListen(dom.endQuizBtn, 'click', triggerEndQuiz);
    safeListen(dom.nextSkipBtn, 'click', handleNextQuestion);
    safeListen(dom.previousBtn, 'click', handlePreviousQuestion);
    safeListen(dom.bookmarkBtn, 'click', toggleBookmark);
    safeListen(dom.flagBtn, 'click', toggleFlag);
    safeListen(dom.hintBtn, 'click', showHint);
    safeListen(dom.navigatorBtn, 'click', showQuestionNavigator);
    safeListen(dom.quizNoteBtn, 'click', () => {
        const question = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
        if (question) openNoteModal('quiz', question.UniqueID, question.question);
    });
    safeListen(dom.resultsHomeBtn, 'click', showMainMenuScreen);
    safeListen(dom.restartBtn, 'click', () => restartCurrentQuiz());
    safeListen(dom.reviewIncorrectBtn, 'click', () => reviewIncorrectAnswers());
    safeListen(document.getElementById('review-simulation-btn'), 'click', () => startSimulationReview());

    safeListen(dom.startMatchingBtn, 'click', handleStartMatchingExam);
    safeListen(dom.matchingSubmitBtn, 'click', () => checkCurrentSetAnswers());
    safeListen(dom.matchingNextBtn, 'click', handleNextMatchingSet);
    safeListen(dom.endMatchingBtn, 'click', () => { ui.showConfirmationModal('End Test', 'Are you sure?', () => showMatchingMenu()); });

    safeListen(dom.startOsceSlayerBtn, 'click', startOsceSlayer);
    safeListen(dom.startCustomOsceBtn, 'click', startCustomOsce);
    safeListen(dom.toggleOsceOptionsBtn, 'click', () => dom.customOsceOptions.classList.toggle('visible'));
    safeListen(dom.endOsceQuizBtn, 'click', () => endOsceQuiz(false));
    safeListen(dom.osceNextBtn, 'click', handleOsceNext);
    safeListen(dom.oscePreviousBtn, 'click', handleOscePrevious);
    safeListen(dom.osceNavigatorBtn, 'click', showOsceNavigator);
    if(dom.chapterSelectOsce) safeListen(document.getElementById('select-all-chapters-osce'), 'change', (e) => { dom.chapterSelectOsce.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; }); });
    if(dom.sourceSelectOsce) safeListen(document.getElementById('select-all-sources-osce'), 'change', (e) => { dom.sourceSelectOsce.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; }); });
    
    safeListen(dom.endLearningBtn, 'click', showLearningModeBrowseScreen);
    safeListen(dom.learningNextBtn, 'click', handleLearningNext);
    safeListen(dom.learningPreviousBtn, 'click', handleLearningPrevious);
    safeListen(dom.learningSearchBtn, 'click', handleLearningSearch);
    if(dom.learningBrowseByChapterBtn) safeListen(dom.learningBrowseByChapterBtn, 'click', () => startLearningBrowse('chapter'));
    if(dom.learningBrowseBySourceBtn) safeListen(dom.learningBrowseBySourceBtn, 'click', () => startLearningBrowse('source'));
    safeListen(document.getElementById('learning-mistakes-btn'), 'click', startLearningMistakes);
    safeListen(document.getElementById('learning-bookmarked-btn'), 'click', startLearningBookmarked);

    safeListen(dom.showCreatePlanModalBtn, 'click', () => { dom.createPlanModal.classList.remove('hidden'); dom.modalBackdrop.classList.remove('hidden'); });
    safeListen(dom.cancelCreatePlanBtn, 'click', () => { dom.createPlanModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.confirmCreatePlanBtn, 'click', handleCreatePlan);
    safeListen(dom.backToPlansDashboardBtn, 'click', () => { dom.activePlanView.classList.add('hidden'); dom.plannerDashboard.classList.remove('hidden'); });

    safeListen(dom.modalCancelBtn, 'click', () => { dom.confirmationModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.modalConfirmBtn, 'click', () => { if (appState.modalConfirmAction) { appState.modalConfirmAction(); dom.confirmationModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');} });
    safeListen(dom.imageViewerCloseBtn, 'click', () => { dom.imageViewerModal.classList.add('hidden'); if(dom.userCardModal.classList.contains('hidden') && dom.createPlanModal.classList.contains('hidden') && dom.announcementsModal.classList.contains('hidden') && dom.messengerModal.classList.contains('hidden')) dom.modalBackdrop.classList.add('hidden');});
    safeListen(dom.announcementsCloseBtn, 'click', () => { dom.announcementsModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.userCardCloseBtn, 'click', () => { dom.userCardModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.messengerCloseBtn, 'click', () => { dom.messengerModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); if (appState.messengerPollInterval) clearInterval(appState.messengerPollInterval); });
    safeListen(dom.navigatorCloseBtn, 'click', () => { dom.questionNavigatorModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');});
    safeListen(dom.osceNavigatorCloseBtn, 'click', () => { dom.osceNavigatorModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');});
    safeListen(dom.clearLogCancelBtn, 'click', () => { dom.clearLogModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.clearLogBtn, 'click', () => { dom.clearLogModal.classList.remove('hidden'); dom.modalBackdrop.classList.remove('hidden'); });

    initializeApp();
});
