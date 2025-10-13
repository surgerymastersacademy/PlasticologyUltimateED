// js/features/theory.js (MODIFIED AND CORRECTED)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logTheoryActivity } from '../api.js';
import { openNoteModal } from '../main.js';

// --- STATE & SETUP ---

let theoryTimerInterval = null;

/**
 * Initializes the theory screen, populates filters, and sets up listeners.
 * This is the main entry point when the user clicks on the Theory Bank.
 */
export function setupTheoryScreen() {
    ui.showScreen(dom.theoryContainer);
    showTheoryFilters(); // Start by showing the filter/menu screen
    populateTheoryFilters();

    // Attach listeners only once to prevent duplicates
    if (!dom.startTheoryBtn.dataset.listener) {
        dom.startTheoryBtn.addEventListener('click', handleStartTheorySession);
        dom.startTheoryBtn.dataset.listener = 'true';
    }
    if (!dom.theoryNextBtn.dataset.listener) {
        dom.theoryNextBtn.addEventListener('click', handleTheoryNavigation.bind(null, 1));
        dom.theoryPrevBtn.addEventListener('click', handleTheoryNavigation.bind(null, -1));
        dom.theoryShowAnswerBtn.addEventListener('click', showModelAnswer);
        dom.theoryMarkCompleteBtn.addEventListener('click', () => handleMarkQuestion('Completed'));
        dom.theoryMarkIncompleteBtn.addEventListener('click', () => handleMarkQuestion('Incomplete'));
        
        // Add dataset attributes to all buttons to ensure this block runs only once
        dom.theoryNextBtn.dataset.listener = 'true';
        dom.theoryPrevBtn.dataset.listener = 'true';
        dom.theoryShowAnswerBtn.dataset.listener = 'true';
        dom.theoryMarkCompleteBtn.dataset.listener = 'true';
        dom.theoryMarkIncompleteBtn.dataset.listener = 'true';
    }
}

// --- UI CONTROL ---

/**
 * Shows the initial filters/menu for the theory section.
 */
function showTheoryFilters() {
    clearInterval(theoryTimerInterval);
    dom.theoryFilters.classList.remove('hidden');
    dom.theorySessionContainer.classList.add('hidden');
    appState.navigationHistory.push(setupTheoryScreen); // Add to history for back button
}

/**
 * Shows the main session view for answering questions.
 */
function showTheorySession() {
    dom.theoryFilters.classList.add('hidden');
    dom.theorySessionContainer.classList.remove('hidden');
}

/**
 * Populates the Chapter and Source dropdown filters.
 */
function populateTheoryFilters() {
    const chapters = [...new Set(appState.allTheoryQuestions.map(q => q.Chapter))].sort();
    const sources = [...new Set(appState.allTheoryQuestions.map(q => q.Source))].sort();

    ui.populateSelect(dom.theoryChapterSelect, chapters, 'All Chapters');
    ui.populateSelect(dom.theorySourceSelect, sources, 'All Sources');
}


// --- SESSION LOGIC ---

/**
 * Handles the click on the "Start Session" button.
 */
function handleStartTheorySession() {
    const selectedChapter = dom.theoryChapterSelect.value;
    const selectedSource = dom.theorySourceSelect.value;

    let filteredQuestions = appState.allTheoryQuestions;

    if (selectedChapter) {
        filteredQuestions = filteredQuestions.filter(q => q.Chapter === selectedChapter);
    }
    if (selectedSource) {
        filteredQuestions = filteredQuestions.filter(q => q.Source === selectedSource);
    }

    if (filteredQuestions.length === 0) {
        alert('No questions found matching your criteria. Please broaden your selection.');
        return;
    }

    launchTheorySession(filteredQuestions);
}

/**
 * Launches a theory study session with the given questions.
 * @param {Array} questions - The array of theory questions for the session.
 */
function launchTheorySession(questions) {
    appState.currentTheorySession = {
        questions: [...questions].sort(() => Math.random() - 0.5), // Shuffle questions
        currentIndex: 0,
    };

    showTheorySession();
    renderCurrentTheoryQuestion();
    startTheoryTimer(30 * 60); // Start a 30-minute timer
}

/**
 * Renders the current question and its state onto the UI.
 */
function renderCurrentTheoryQuestion() {
    const session = appState.currentTheorySession;
    if (!session || !session.questions.length) return;

    const question = session.questions[session.currentIndex];
    
    // Reset UI elements for the new question
    dom.theoryModelAnswer.classList.add('hidden');
    dom.theoryShowAnswerBtn.classList.remove('hidden');
    dom.theoryEssayTextarea.value = ''; // Clear previous answer

    // Update text content
    dom.theoryProgressText.textContent = `Question ${session.currentIndex + 1} of ${session.questions.length}`;
    dom.theoryQuestionText.textContent = question.QuestionText;
    dom.theoryModelAnswerContent.innerHTML = `<p>${question.ModelAnswer}</p>`; // Use innerHTML if answers can have HTML tags
    
    // Update button states
    dom.theoryPrevBtn.disabled = session.currentIndex === 0;
    dom.theoryNextBtn.disabled = session.currentIndex === session.questions.length - 1;

    // Update status display based on logs
    const userLog = appState.userTheoryLogs.find(log => log.Question_ID === question.UniqueID);
    if (userLog && userLog.Status) {
        dom.theoryStatusText.textContent = `Status: ${userLog.Status}`;
        dom.theoryStatusText.className = userLog.Status === 'Completed' ? 'text-lg font-semibold text-green-600' : 'text-lg font-semibold text-red-600';
    } else {
        dom.theoryStatusText.textContent = 'Status: Not Attempted';
        dom.theoryStatusText.className = 'text-lg font-semibold text-gray-500';
    }
}

// --- EVENT HANDLERS ---

/**
 * Navigates to the next or previous question.
 * @param {number} direction - 1 for next, -1 for previous.
 */
function handleTheoryNavigation(direction) {
    const session = appState.currentTheorySession;
    const newIndex = session.currentIndex + direction;

    if (newIndex >= 0 && newIndex < session.questions.length) {
        session.currentIndex = newIndex;
        renderCurrentTheoryQuestion();
    }
}

/**
 * Shows the model answer for the current question.
 */
function showModelAnswer() {
    dom.theoryModelAnswer.classList.remove('hidden');
    dom.theoryShowAnswerBtn.classList.add('hidden');
}

/**
 * Marks the current question with a status (e.g., 'Completed', 'Incomplete').
 * @param {string} status - The status to log for the question.
 */
function handleMarkQuestion(status) {
    const question = appState.currentTheorySession.questions[appState.currentTheorySession.currentIndex];
    
    // Log the activity to the backend/state
    logTheoryActivity({
        questionId: question.UniqueID,
        Status: status,
        Notes: dom.theoryEssayTextarea.value // Also save any notes written
    });

    // Update the UI immediately
    dom.theoryStatusText.textContent = `Status: ${status}`;
    dom.theoryStatusText.className = status === 'Completed' ? 'text-lg font-semibold text-green-600' : 'text-lg font-semibold text-red-600';

    // Automatically move to the next question after marking
    setTimeout(() => {
        handleTheoryNavigation(1);
    }, 500); // 0.5 second delay
}

// --- TIMER ---

/**
 * Starts the session timer.
 * @param {number} durationInSeconds - The total duration for the timer.
 */
function startTheoryTimer(durationInSeconds) {
    clearInterval(theoryTimerInterval);
    let timeLeft = durationInSeconds;

    theoryTimerInterval = setInterval(() => {
        timeLeft--;
        dom.theoryTimer.textContent = ui.formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(theoryTimerInterval);
            alert("Time's up!");
            showTheoryFilters(); // Go back to the menu when time is up
        }
    }, 1000);
}
