// ===========================
// Update Title: FIX - Missing Function Export
// Date: 13/10/2025
// Version: v1.3.2
// Type: إصلاح
// Description: Fixed a SyntaxError crash on app load. The 'launchTheorySession' function was not exported from theory.js, preventing planner.js from importing it. The 'export' keyword has been added.
// Dependencies Impacted: theory.js, planner.js
// ===========================

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { formatTime } from '../utils.js'; 

export function setupTheoryEventListeners() {
    dom.startTheoryBtn.addEventListener('click', () => {
        const selectedChapter = dom.theoryChapterSelect.value;
        const selectedSource = dom.theorySourceSelect.value;
        launchTheorySession(selectedChapter, selectedSource);
    });

    dom.theoryEssayTextarea.addEventListener('input', () => {
        const currentQuestion = appState.theorySession.questions[appState.theorySession.currentIndex];
        if (currentQuestion) {
            saveTheoryProgress(currentQuestion.UniqueID, 'Notes', dom.theoryEssayTextarea.value);
        }
    });

    dom.theoryNextBtn.addEventListener('click', handleTheoryNext);
    dom.theoryPrevBtn.addEventListener('click', handleTheoryPrev);
    dom.theoryShowAnswerBtn.addEventListener('click', toggleTheoryAnswer);
    
    dom.theoryMarkCompleteBtn.addEventListener('click', () => markTheoryQuestion('Completed'));
    dom.theoryMarkIncompleteBtn.addEventListener('click', () => markTheoryQuestion('Incomplete'));
}

export function showTheoryScreen() {
    ui.showScreen(dom.theoryScreen);
    populateTheoryFilters();
}

// [MODIFIED SECTION START] - ADDED 'export'
export function launchTheorySession(chapter, source) {
// [MODIFIED SECTION END]
    let filteredQuestions = appState.allTheoryQuestions;

    if (chapter !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.Chapter === chapter);
    }
    if (source !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.Source === source);
    }

    if (filteredQuestions.length === 0) {
        alert('No questions found for the selected filters.');
        return;
    }

    appState.theorySession = {
        questions: filteredQuestions,
        currentIndex: 0,
        timerInterval: null,
        startTime: new Date()
    };

    dom.theoryFilters.classList.add('hidden');
    dom.theorySessionContainer.classList.remove('hidden');

    startTheoryTimer(30 * 60); // 30 minutes timer
    displayCurrentTheoryQuestion();
}

function displayCurrentTheoryQuestion() {
    const session = appState.theorySession;
    if (!session || session.questions.length === 0) return;

    const question = session.questions[session.currentIndex];
    const log = findUserLogForTheory(question.UniqueID);

    dom.theoryQuestionText.textContent = question.QuestionText;
    dom.theoryProgressText.textContent = `Question ${session.currentIndex + 1} of ${session.questions.length}`;
    dom.theoryModelAnswer.classList.add('hidden');
    dom.theoryModelAnswerContent.textContent = question.ModelAnswer;
    dom.theoryEssayTextarea.value = log ? log.Notes : '';

    updateTheoryNavButtons();
    updateTheoryStatus(log ? log.Status : 'Not Started');
}

function updateTheoryNavButtons() {
    const session = appState.theorySession;
    dom.theoryPrevBtn.disabled = session.currentIndex === 0;
    dom.theoryNextBtn.disabled = session.currentIndex === session.questions.length - 1;
}

function updateTheoryStatus(status) {
    dom.theoryStatusText.textContent = `Status: ${status}`;
    dom.theoryStatusText.className = 'text-lg font-semibold'; // Reset classes
    switch (status) {
        case 'Completed':
            dom.theoryStatusText.classList.add('text-green-600');
            break;
        case 'Incomplete':
            dom.theoryStatusText.classList.add('text-red-600');
            break;
        default:
            dom.theoryStatusText.classList.add('text-gray-500');
            break;
    }
}

function handleTheoryNext() {
    const session = appState.theorySession;
    if (session.currentIndex < session.questions.length - 1) {
        session.currentIndex++;
        displayCurrentTheoryQuestion();
    }
}

function handleTheoryPrev() {
    const session = appState.theorySession;
    if (session.currentIndex > 0) {
        session.currentIndex--;
        displayCurrentTheoryQuestion();
    }
}

function toggleTheoryAnswer() {
    dom.theoryModelAnswer.classList.toggle('hidden');
    dom.theoryShowAnswerBtn.textContent = dom.theoryModelAnswer.classList.contains('hidden') 
        ? 'Show Model Answer' 
        : 'Hide Model Answer';
}

function markTheoryQuestion(status) {
    const currentQuestion = appState.theorySession.questions[appState.theorySession.currentIndex];
    if (currentQuestion) {
        saveTheoryProgress(currentQuestion.UniqueID, 'Status', status);
        updateTheoryStatus(status);
    }
}

function saveTheoryProgress(questionId, field, value) {
    const userId = appState.currentUser.UniqueID;
    const logUniqueId = `${userId}_${questionId}`;

    let logData = {
        logUniqueId: logUniqueId,
        userId: userId,
        questionId: questionId,
    };

    if (field === 'Status') {
        logData.Status = value;
    } else if (field === 'Notes') {
        logData.Notes = value;
    }
    
    // Find existing log and update it, or add new
    const existingLogIndex = appState.userTheoryLogs.findIndex(log => log.Log_UniqueID === logUniqueId);
    if (existingLogIndex > -1) {
        appState.userTheoryLogs[existingLogIndex][field] = value;
        appState.userTheoryLogs[existingLogIndex].Essay_Time_Stamp = new Date().toISOString();
    } else {
        const newLog = {
            Log_UniqueID: logUniqueId,
            User_ID: userId,
            Question_ID: questionId,
            Status: 'In Progress',
            Notes: '',
            Essay_Time_Stamp: new Date().toISOString()
        };
        newLog[field] = value;
        appState.userTheoryLogs.push(newLog);
    }
    
    // This should call an API function similar to saveUserProgress
    // For now, it updates the local state.
    // api.saveTheoryLog(logData); 
    console.log("Saving theory progress:", logData);
}


function findUserLogForTheory(questionId) {
    const userId = appState.currentUser.UniqueID;
    return appState.userTheoryLogs.find(log => log.User_ID === userId && log.Question_ID === questionId);
}


function populateTheoryFilters() {
    const chapters = [...new Set(appState.allTheoryQuestions.map(q => q.Chapter))];
    const sources = [...new Set(appState.allTheoryQuestions.map(q => q.Source))];

    dom.theoryChapterSelect.innerHTML = '<option value="all">All Chapters</option>';
    chapters.sort().forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter;
        option.textContent = chapter;
        dom.theoryChapterSelect.appendChild(option);
    });

    dom.theorySourceSelect.innerHTML = '<option value="all">All Sources</option>';
    sources.sort().forEach(source => {
        const option = document.createElement('option');
        option.value = source;
        option.textContent = source;
        dom.theorySourceSelect.appendChild(option);
    });
}

function startTheoryTimer(duration) {
    clearInterval(appState.theorySession.timerInterval);
    let timeLeft = duration;
    dom.theoryTimer.textContent = formatTime(timeLeft);
    appState.theorySession.timerInterval = setInterval(() => {
        timeLeft--;
        dom.theoryTimer.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(appState.theorySession.timerInterval);
        }
    }, 1000);
}
