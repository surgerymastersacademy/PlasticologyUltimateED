// js/features/theory.js (CORRECTED FILE)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logTheoryActivity } from '../api.js';
import { openNoteModal } from '../main.js';

// --- MAIN FUNCTIONS ---

/**
 * Shows the main menu screen for the Theory Bank feature.
 */
export function showTheoryMenuScreen() {
    ui.showScreen(dom.theoryContainer);
    dom.theoryControls.classList.remove('hidden');
    dom.theoryViewer.classList.add('hidden');
    appState.navigationHistory.push(showTheoryMenuScreen);

    // Add event listeners for the menu (only once to prevent duplicates)
    if (!dom.theoryFlashcardModeBtn.dataset.listener) {
        dom.theoryFlashcardModeBtn.dataset.listener = 'true';
        dom.theoryFlashcardModeBtn.addEventListener('click', () => launchTheorySession('Flashcard Mode', appState.allTheoryQuestions, false));
        dom.theoryExamModeBtn.addEventListener('click', () => launchTheorySession('Thinking Exam Mode', appState.allTheoryQuestions, true));
        dom.theoryBrowseByChapterBtn.addEventListener('click', () => showTheoryListScreen('Chapter'));
        dom.theoryBrowseBySourceBtn.addEventListener('click', () => showTheoryListScreen('Source'));
        dom.theorySearchBtn.addEventListener('click', handleTheorySearch);
    }
}

/**
 * --- CORRECTED: Added 'export' keyword ---
 * Launches a theory study/exam session.
 * @param {string} title - The title for the session.
 * @param {Array} questions - The array of theory questions for the session.
 * @param {boolean} isExamMode - Flag to determine if it's flashcard or exam mode.
 */
export function launchTheorySession(title, questions, isExamMode) {
    if (questions.length === 0) {
        ui.showConfirmationModal('No Questions', `No questions were found for this category.`, () => {});
        return;
    }

    appState.currentTheorySession = {
        questions: [...questions].sort(() => Math.random() - 0.5),
        currentIndex: 0,
        isExamMode: isExamMode,
        title: title,
        timerInterval: null
    };

    ui.showScreen(dom.theoryContainer);
    dom.theoryControls.classList.add('hidden');
    dom.theoryViewer.classList.remove('hidden');
    dom.theoryTitle.textContent = title;

    if (isExamMode) {
        startTheoryTimer(questions.length * 3 * 60); // 3 minutes per question
    } else {
        dom.theoryTimer.textContent = 'Study';
    }

    renderTheoryCard();

    // Setup event listeners for the viewer (only once)
    if (!dom.theoryEndBtn.dataset.listener) {
        dom.theoryEndBtn.dataset.listener = 'true';
        dom.theoryEndBtn.addEventListener('click', () => {
            clearInterval(appState.currentTheorySession.timerInterval);
            showTheoryMenuScreen();
        });
        dom.theoryNextBtn.addEventListener('click', handleTheoryNext);
        dom.theoryPrevBtn.addEventListener('click', handleTheoryPrev);
        dom.theoryShowAnswerBtn.addEventListener('click', () => {
            dom.theoryAnswerContainer.classList.remove('hidden');
            dom.theoryShowAnswerBtn.classList.add('hidden');
        });
        dom.theoryNoteBtn.addEventListener('click', handleTheoryNote);
        dom.theoryStatusBtn.addEventListener('click', handleTheoryStatusToggle);
    }
}

// --- RENDERING ---

/**
 * Renders the current theory question card.
 */
function renderTheoryCard() {
    const { questions, currentIndex, isExamMode } = appState.currentTheorySession;
    const question = questions[currentIndex];

    dom.theoryProgressText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    dom.theorySourceText.textContent = `Source: ${question.Source} | Chapter: ${question.Chapter}`;
    dom.theoryImgContainer.innerHTML = question.Img_URL ? `<img src="${question.Img_URL}" class="max-h-48 rounded-lg mx-auto mb-4 cursor-pointer" onclick="ui.showImageModal('${question.Img_URL}')">` : '';
    dom.theoryQuestionText.textContent = question.QuestionText;
    dom.theoryAnswerText.textContent = question.ModelAnswer;

    // Handle UI state based on mode
    dom.theoryAnswerContainer.classList.toggle('hidden', isExamMode);
    dom.theoryShowAnswerBtn.classList.toggle('hidden', !isExamMode);
    
    // Update button states
    dom.theoryPrevBtn.disabled = currentIndex === 0;
    dom.theoryNextBtn.disabled = currentIndex === questions.length - 1;

    // Update Note and Status icons based on user log
    const userLog = appState.userTheoryLogs.find(log => log.Question_ID === question.UniqueID);
    dom.theoryNoteBtn.classList.toggle('has-note', userLog && userLog.Notes);
    dom.theoryStatusBtn.classList.toggle('text-green-500', userLog && userLog.Status === 'Completed');
}

// --- EVENT HANDLERS ---

function handleTheoryNext() {
    if (appState.currentTheorySession.currentIndex < appState.currentTheorySession.questions.length - 1) {
        appState.currentTheorySession.currentIndex++;
        renderTheoryCard();
    }
}

function handleTheoryPrev() {
    if (appState.currentTheorySession.currentIndex > 0) {
        appState.currentTheorySession.currentIndex--;
        renderTheoryCard();
    }
}

function handleTheoryNote() {
    const question = appState.currentTheorySession.questions[appState.currentTheorySession.currentIndex];
    openNoteModal('theory', question.UniqueID, question.QuestionText);
}

function handleTheoryStatusToggle() {
    const question = appState.currentTheorySession.questions[appState.currentTheorySession.currentIndex];
    const userLog = appState.userTheoryLogs.find(log => log.Question_ID === question.UniqueID);
    const currentStatus = userLog ? userLog.Status : '';
    const newStatus = currentStatus === 'Completed' ? '' : 'Completed';

    logTheoryActivity({
        questionId: question.UniqueID,
        Status: newStatus
    });
    
    dom.theoryStatusBtn.classList.toggle('text-green-500', newStatus === 'Completed');
}

function handleTheorySearch() {
    const searchTerm = dom.theorySearchInput.value.trim().toLowerCase();
    if (searchTerm.length < 3) {
        alert('Please enter at least 3 characters to search.');
        return;
    }
    const filteredQuestions = appState.allTheoryQuestions.filter(q => 
        q.QuestionText.toLowerCase().includes(searchTerm) ||
        q.ModelAnswer.toLowerCase().includes(searchTerm) ||
        q.Keywords.toLowerCase().includes(searchTerm)
    );
    launchTheorySession(`Search: "${searchTerm}"`, filteredQuestions, false); // Default to flashcard mode for search
}

// --- BROWSE & LIST VIEW ---

/**
 * Shows a list screen to browse theory questions by Chapter or Source.
 * @param {string} browseBy - Either 'Chapter' or 'Source'.
 */
function showTheoryListScreen(browseBy) {
    const isChapter = browseBy === 'Chapter';
    const title = `Browse by ${browseBy}`;
    
    const itemCounts = appState.allTheoryQuestions.reduce((acc, q) => {
        const item = q[browseBy] || 'Uncategorized';
        acc[item] = (acc[item] || 0) + 1;
        return acc;
    }, {});

    const items = Object.keys(itemCounts).sort();
    dom.listTitle.textContent = title;
    dom.listItems.innerHTML = '';

    items.forEach(item => {
        const button = document.createElement('button');
        button.className = 'action-btn p-4 bg-white rounded-lg shadow-sm text-center hover:bg-slate-50';
        button.innerHTML = `<h3 class="font-bold text-slate-800">${item}</h3><p class="text-sm text-slate-500">${itemCounts[item]} Questions</p>`;
        button.addEventListener('click', () => {
            const questions = appState.allTheoryQuestions.filter(q => (q[browseBy] || 'Uncategorized') === item);
            
            // Ask user for study mode via a confirmation modal
            ui.showConfirmationModal(
                `Study "${item}"`,
                'How would you like to study these questions?',
                () => launchTheorySession(item, questions, false) // Default confirm is Flashcard
            );
            
            // Customize modal buttons for this specific choice
            const confirmBtnContainer = dom.modalConfirmBtn.parentElement;
            confirmBtnContainer.innerHTML = ''; // Clear old buttons
            
            const flashcardBtn = document.createElement('button');
            flashcardBtn.textContent = 'Flashcard Mode';
            flashcardBtn.className = 'action-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
            flashcardBtn.onclick = () => {
                launchTheorySession(item, questions, false);
                dom.modalBackdrop.classList.add('hidden');
            };

            const examBtn = document.createElement('button');
            examBtn.textContent = 'Exam Mode';
            examBtn.className = 'action-btn bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded';
            examBtn.onclick = () => {
                launchTheorySession(item, questions, true);
                dom.modalBackdrop.classList.add('hidden');
            };
            
            confirmBtnContainer.appendChild(dom.modalCancelBtn);
            confirmBtnContainer.appendChild(examBtn);
            confirmBtnContainer.appendChild(flashcardBtn);

        });
        dom.listItems.appendChild(button);
    });

    ui.showScreen(dom.listContainer);
    appState.navigationHistory.push(() => showTheoryListScreen(browseBy));
}

// --- TIMER ---
function startTheoryTimer(duration) {
    clearInterval(appState.currentTheorySession.timerInterval);
    let timeLeft = duration;
    dom.theoryTimer.textContent = ui.formatTime(timeLeft);
    appState.currentTheorySession.timerInterval = setInterval(() => {
        timeLeft--;
        dom.theoryTimer.textContent = ui.formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(appState.currentTheorySession.timerInterval);
            alert("Time's up!");
            showTheoryMenuScreen();
        }
    }, 1000);
}
