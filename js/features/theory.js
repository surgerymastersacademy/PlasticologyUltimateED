// ===========================
// Update Title: FINAL FIX - Resolve Infinite Recursion Loop
// Date: 13/10/2025
// Version: v2.1.0
// Type: إصلاح
// Description: Fixed a "Maximum call stack size exceeded" crash. An infinite recursion was occurring between showTheoryMenuScreen() and endTheorySession(). The fix prevents endTheorySession() from calling back to showTheoryMenuScreen(), breaking the loop. All previous fixes are included.
// Dependencies Impacted: theory.js
// ===========================

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { formatTime } from '../utils.js';

let sessionTimer;

export function setupTheoryEventListeners() {
    if (dom.theoryBackBtn) dom.theoryBackBtn.addEventListener('click', showTheoryMenuScreen);
    if (dom.theoryFlashcardModeBtn) dom.theoryFlashcardModeBtn.addEventListener('click', () => startTheorySession('flashcard'));
    if (dom.theoryExamModeBtn) dom.theoryExamModeBtn.addEventListener('click', () => startTheorySession('exam'));
    if (dom.theoryEndBtn) dom.theoryEndBtn.addEventListener('click', endTheorySessionAndShowMenu); // Use a new handler
    if (dom.theoryShowAnswerBtn) dom.theoryShowAnswerBtn.addEventListener('click', showTheoryAnswer);
    if (dom.theoryNextBtn) dom.theoryNextBtn.addEventListener('click', showNextTheoryQuestion);
    if (dom.theoryPrevBtn) dom.theoryPrevBtn.addEventListener('click', showPreviousTheoryQuestion);
    if (dom.theoryStatusBtn) dom.theoryStatusBtn.addEventListener('click', toggleTheoryQuestionStatus);
}

export function showTheoryMenuScreen() {
    ui.showScreen(dom.theoryContainer);
    if (dom.theoryViewer) dom.theoryViewer.classList.add('hidden');
    if (dom.theoryControls) dom.theoryControls.classList.remove('hidden');
    endTheorySession(); // This call is safe now
}

function startTheorySession(mode) {
    const questions = appState.allTheoryQuestions; 
    if (!questions || questions.length === 0) {
        alert("No theory questions available.");
        return;
    }

    appState.theorySession = {
        questions: questions,
        currentIndex: 0,
        mode: mode,
        startTime: Date.now(),
        userAnswers: {},
        timerInterval: null
    };

    if (dom.theoryControls) dom.theoryControls.classList.add('hidden');
    if (dom.theoryViewer) dom.theoryViewer.classList.remove('hidden');

    if (mode === 'exam') {
        startTheoryTimer();
    } else {
        if (dom.theoryTimer) dom.theoryTimer.textContent = 'Untimed';
    }

    displayCurrentTheoryQuestion();
}

// [MODIFIED SECTION START] - This function no longer calls showTheoryMenuScreen()
function endTheorySession() {
    clearInterval(sessionTimer);
    if(appState.theorySession && appState.theorySession.timerInterval) {
        clearInterval(appState.theorySession.timerInterval);
    }
    appState.theorySession = null;
    // The call to showTheoryMenuScreen() was removed from here to break the loop.
}

// New wrapper function for the "End Session" button
function endTheorySessionAndShowMenu() {
    endTheorySession();
    showTheoryMenuScreen();
}
// [MODIFIED SECTION END]

function displayCurrentTheoryQuestion() {
    const session = appState.theorySession;
    if (!session) return;

    const question = session.questions[session.currentIndex];
    if (!question) return;

    if (dom.theoryTitle) dom.theoryTitle.textContent = `Theory: ${session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}`;
    if (dom.theoryProgressText) dom.theoryProgressText.textContent = `Question ${session.currentIndex + 1} of ${session.questions.length}`;
    if (dom.theoryQuestionText) dom.theoryQuestionText.textContent = question.QuestionText;
    if (dom.theorySourceText) dom.theorySourceText.textContent = `Source: ${question.Source || 'N/A'} | Chapter: ${question.Chapter || 'N/A'}`;
    
    if (dom.theoryAnswerContainer) dom.theoryAnswerContainer.classList.add('hidden');
    if (dom.theoryAnswerText) dom.theoryAnswerText.textContent = question.ModelAnswer;
    
    if (dom.theoryShowAnswerBtn) {
        dom.theoryShowAnswerBtn.textContent = 'Show Answer';
        dom.theoryShowAnswerBtn.classList.remove('hidden');
    }

    if(session.mode === 'exam') {
        if(dom.theoryShowAnswerBtn) dom.theoryShowAnswerBtn.classList.add('hidden');
    }

    updateTheoryNavButtons();
    updateStatusIcon();
}

function showNextTheoryQuestion() {
    const session = appState.theorySession;
    if (session && session.currentIndex < session.questions.length - 1) {
        session.currentIndex++;
        displayCurrentTheoryQuestion();
    }
}

function showPreviousTheoryQuestion() {
    const session = appState.theorySession;
    if (session && session.currentIndex > 0) {
        session.currentIndex--;
        displayCurrentTheoryQuestion();
    }
}

function showTheoryAnswer() {
    if (dom.theoryAnswerContainer) dom.theoryAnswerContainer.classList.toggle('hidden');
    if (dom.theoryShowAnswerBtn) {
        const isHidden = dom.theoryAnswerContainer.classList.contains('hidden');
        dom.theoryShowAnswerBtn.textContent = isHidden ? 'Show Answer' : 'Hide Answer';
    }
}

function startTheoryTimer() {
    const session = appState.theorySession;
    if (!session) return;

    const duration = session.questions.length * 5 * 60; // 5 minutes per question
    let timeLeft = duration;

    clearInterval(session.timerInterval);

    function updateTimer() {
        if (dom.theoryTimer) {
            dom.theoryTimer.textContent = formatTime(timeLeft);
        }
        if (timeLeft <= 0) {
            clearInterval(session.timerInterval);
            alert("Time's up!");
            endTheorySessionAndShowMenu();
        }
        timeLeft--;
    }

    updateTimer();
    session.timerInterval = setInterval(updateTimer, 1000);
}


function updateTheoryNavButtons() {
    const session = appState.theorySession;
    if (!session) return;
    if (dom.theoryPrevBtn) dom.theoryPrevBtn.disabled = session.currentIndex === 0;
    if (dom.theoryNextBtn) dom.theoryNextBtn.disabled = session.currentIndex === session.questions.length - 1;
}

function toggleTheoryQuestionStatus() {
    const session = appState.theorySession;
    if (!session) return;
    const questionId = session.questions[session.currentIndex].UniqueID;
    
    const logIndex = appState.userTheoryLogs.findIndex(log => log.Question_ID === questionId);

    if (logIndex > -1) {
        let currentStatus = appState.userTheoryLogs[logIndex].Status;
        appState.userTheoryLogs[logIndex].Status = (currentStatus === 'Completed') ? 'Not Completed' : 'Completed';
    } else {
        appState.userTheoryLogs.push({
            User_ID: appState.currentUser.UniqueID,
            Question_ID: questionId,
            Status: 'Completed',
            Notes: ''
        });
    }
    updateStatusIcon();
}

function updateStatusIcon() {
    const session = appState.theorySession;
    if (!session || !dom.theoryStatusBtn) return;
    
    const questionId = session.questions[session.currentIndex].UniqueID;
    const log = appState.userTheoryLogs.find(log => log.Question_ID === questionId);

    if (log && log.Status === 'Completed') {
        dom.theoryStatusBtn.classList.remove('text-slate-500', 'hover:text-green-500');
        dom.theoryStatusBtn.classList.add('text-green-600');
        dom.theoryStatusBtn.innerHTML = '<i class="fas fa-check-circle"></i>';
        dom.theoryStatusBtn.title = 'Mark as Not Completed';
    } else {
        dom.theoryStatusBtn.classList.remove('text-green-600');
        dom.theoryStatusBtn.classList.add('text-slate-500', 'hover:text-green-500');
        dom.theoryStatusBtn.innerHTML = '<i class="far fa-check-circle"></i>';
        dom.theoryStatusBtn.title = 'Mark as Completed';
    }
}

export function launchTheorySession(chapter, source) {
    let filteredQuestions = appState.allTheoryQuestions;

    if (chapter && chapter !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.Chapter === chapter);
    }
    if (source && source !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.Source === source);
    }

    if (filteredQuestions.length === 0) {
        alert('No questions found for the selected filters.');
        return;
    }

    appState.theorySession = {
        questions: filteredQuestions,
        currentIndex: 0,
        mode: 'flashcard',
        startTime: Date.now(),
        userAnswers: {},
        timerInterval: null
    };

    ui.showScreen(dom.theoryContainer);
    if (dom.theoryControls) dom.theoryControls.classList.add('hidden');
    if (dom.theoryViewer) dom.theoryViewer.classList.remove('hidden');
    if (dom.theoryTimer) dom.theoryTimer.textContent = 'Untimed';
    
    displayCurrentTheoryQuestion();
}
