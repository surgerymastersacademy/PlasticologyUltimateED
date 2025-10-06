// js/features/matching.js (Version 1.1 - Corrected Chapter Loading & UI)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logUserActivity } from '../api.js';
import { showMainMenuScreen } from '../main.js';

let draggedAnswer = null; // To hold the element being dragged

/**
 * Shows the initial screen for the Matching Bank, allowing users to select a chapter.
 */
export function showMatchingBrowseScreen() {
    // --- START OF FIX ---
    // Instead of using allChaptersNames from lectures, build the list directly from the MCQ Bank.
    const chapterCounts = appState.allQuestions.reduce((acc, q) => {
        const chapter = q.chapter || 'Uncategorized';
        acc[chapter] = (acc[chapter] || 0) + 1;
        return acc;
    }, {});

    const chaptersWithEnoughQuestions = Object.keys(chapterCounts).filter(chapter => chapterCounts[chapter] >= 5);
    // --- END OF FIX ---

    dom.listTitle.textContent = 'Choose a Chapter to Start';
    dom.listItems.innerHTML = '';

    if (chaptersWithEnoughQuestions.length === 0) {
        dom.listItems.innerHTML = `<p class="text-slate-500 col-span-full text-center">No chapters have enough questions (min 5) for a matching game.</p>`;
    } else {
        chaptersWithEnoughQuestions.sort().forEach(chapter => { // Sort alphabetically
            const button = document.createElement('button');
            button.className = 'action-btn p-4 bg-white rounded-lg shadow-sm text-center hover:bg-slate-50';
            button.innerHTML = `<h3 class="font-bold text-slate-800">${chapter}</h3> <p class="text-sm text-slate-500">${chapterCounts[chapter]} Qs available</p>`;
            button.addEventListener('click', () => startMatchingGame(chapter));
            dom.listItems.appendChild(button);
        });
    }

    ui.showScreen(dom.listContainer);
    appState.navigationHistory.push(showMatchingBrowseScreen);
}

/**
 * Starts a new matching game for a given chapter.
 * @param {string} chapterName - The name of the chapter to create the game from.
 */
function startMatchingGame(chapterName) {
    const questionsInChapter = appState.allQuestions.filter(q => q.chapter === chapterName);
    const gameQuestions = [...questionsInChapter].sort(() => 0.5 - Math.random()).slice(0, 5);

    // Prepare game data
    const premises = gameQuestions.map(q => ({
        text: q.question,
        uniqueId: q.UniqueID,
        hint: q.hint
    }));

    const answers = gameQuestions.map(q => {
        const correctAnswer = q.answerOptions.find(opt => opt.isCorrect);
        return {
            text: correctAnswer ? correctAnswer.text : 'N/A',
            uniqueId: q.UniqueID
        };
    });

    appState.currentMatchingGame = {
        questions: gameQuestions,
        premises: premises,
        answers: [...answers].sort(() => 0.5 - Math.random()), // Shuffle answers for display
        userMatches: {},
        score: 0,
        flaggedIndices: new Set(),
        chapter: chapterName,
    };

    renderMatchingGame();
    appState.navigationHistory.push(() => startMatchingGame(chapterName));
}

/**
 * Renders the main UI for the matching game.
 */
function renderMatchingGame() {
    ui.showScreen(dom.matchingContainer);
    dom.matchingTitle.textContent = `Matching: ${appState.currentMatchingGame.chapter}`;

    // Reset UI
    dom.premisesColumn.innerHTML = '';
    dom.answersColumn.innerHTML = '';
    dom.matchingResultsArea.innerHTML = '';
    dom.matchingResultsArea.classList.add('hidden');
    dom.checkMatchingAnswersBtn.classList.add('hidden'); 
    dom.matchingHomeBtn.classList.add('hidden');
    updateProgressBar();

    // Render Premises (Slots)
    appState.currentMatchingGame.premises.forEach((premise, index) => {
        const premiseDiv = document.createElement('div');
        premiseDiv.className = 'premise-item flex items-start gap-4';
        premiseDiv.innerHTML = `
            <div class="flex-grow">
                <p class="font-semibold text-slate-800">${index + 1}. ${premise.text}</p>
                <div class="premise-slot min-h-[50px] bg-slate-200 mt-2 p-3 rounded-lg border-2 border-slate-300 flex items-center justify-center text-slate-500" data-premise-id="${premise.uniqueId}">
                    Drop answer here
                </div>
            </div>
        `;
        dom.premisesColumn.appendChild(premiseDiv);
    });

    // Render Answers (Draggable)
    appState.currentMatchingGame.answers.forEach(answer => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-item bg-white p-3 rounded-lg shadow-sm border cursor-move';
        answerDiv.textContent = answer.text;
        answerDiv.draggable = true;
        answerDiv.dataset.answerId = answer.uniqueId;
        dom.answersColumn.appendChild(answerDiv);
    });

    addDragDropListeners();
}

/**
 * Adds all necessary event listeners for the drag-and-drop functionality.
 */
function addDragDropListeners() {
    const answers = document.querySelectorAll('.answer-item');
    const slots = document.querySelectorAll('.premise-slot');

    answers.forEach(answer => {
        answer.addEventListener('dragstart', handleDragStart);
        answer.addEventListener('dragend', handleDragEnd);
    });

    slots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
}

// --- DRAG & DROP EVENT HANDLERS ---

function handleDragStart(e) {
    draggedAnswer = e.target;
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    if (e.target.classList.contains('premise-slot')) {
        e.target.classList.add('over');
    }
}

function handleDragLeave(e) {
    e.target.classList.remove('over');
}

function handleDrop(e) {
    e.preventDefault();
    const slot = e.target.closest('.premise-slot'); // Ensure we get the slot, even if dropping on text
    if (!slot) return;

    slot.classList.remove('over');

    if (draggedAnswer) {
        const premiseId = slot.dataset.premiseId;
        const answerId = draggedAnswer.dataset.answerId;

        // If the slot already has an answer, return it to the answer pool
        if (slot.firstChild && slot.firstChild.dataset.answerId) {
            dom.answersColumn.appendChild(slot.firstChild);
        }

        slot.innerHTML = '';
        slot.appendChild(draggedAnswer);
        
        appState.currentMatchingGame.userMatches[premiseId] = answerId;

        // Check if all slots are filled
        const allSlotsFilled = appState.currentMatchingGame.premises.every(p => appState.currentMatchingGame.userMatches[p.uniqueId]);
        if (allSlotsFilled) {
            dom.checkMatchingAnswersBtn.classList.remove('hidden');
        }
    }
}

/**
 * Checks the user's matches, displays results, and logs activity.
 */
function checkMatchingAnswers() {
    const { premises, userMatches } = appState.currentMatchingGame;
    let score = 0;

    premises.forEach(premise => {
        const premiseId = premise.uniqueId;
        const correctId = premiseId; // In this logic, the premise and answer share the same UniqueID
        const userAnwerId = userMatches[premiseId];
        const isCorrect = correctId === userAnwerId;
        
        const slot = dom.premisesColumn.querySelector(`[data-premise-id="${premiseId}"]`);
        if (slot) {
            slot.classList.add(isCorrect ? 'matched-correct' : 'matched-incorrect');
        }

        if (isCorrect) {
            score++;
        }
    });

    appState.currentMatchingGame.score = score;
    updateProgressBar(true);
    showMatchingResults();

    // Disable dragging
    document.querySelectorAll('.answer-item').forEach(item => {
        item.draggable = false;
        item.classList.remove('cursor-move');
        item.classList.add('cursor-not-allowed');
    });
    
    dom.checkMatchingAnswersBtn.classList.add('hidden');
    dom.matchingHomeBtn.classList.remove('hidden');

    logUserActivity({
        eventType: 'FinishMatchingQuiz',
        chapter: appState.currentMatchingGame.chapter,
        score: score,
        totalQuestions: premises.length,
    });
}

/**
 * Displays the final results and rationales after checking answers.
 */
function showMatchingResults() {
    const { questions, userMatches } = appState.currentMatchingGame;
    dom.matchingResultsArea.innerHTML = '<h3 class="text-xl font-bold text-slate-800 mb-4">Review & Rationales</h3>';
    dom.matchingResultsArea.classList.remove('hidden');

    questions.forEach(q => {
        const isCorrect = userMatches[q.UniqueID] === q.UniqueID;
        const correctAnswer = q.answerOptions.find(opt => opt.isCorrect);
        const userAnswerElement = dom.premisesColumn.querySelector(`[data-premise-id="${q.UniqueID}"]`).firstChild;
        const userAnswerText = userAnswerElement ? userAnswerElement.textContent.trim() : "No Answer";
        
        const resultDiv = document.createElement('div');
        resultDiv.className = `p-3 mb-3 border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`;
        resultDiv.innerHTML = `
            <p class="font-semibold">${q.question}</p>
            <p class="text-sm mt-1"><strong>Your Answer:</strong> ${userAnswerText}</p>
            ${!isCorrect ? `<p class="text-sm mt-1"><strong>Correct Answer:</strong> ${correctAnswer.text}</p>` : ''}
            <p class="text-sm mt-2 pt-2 border-t"><strong>Rationale:</strong> ${correctAnswer.rationale || 'No rationale provided.'}</p>
        `;
        dom.matchingResultsArea.appendChild(resultDiv);
    });
}

/**
 * Updates the progress bar and score text.
 * @param {boolean} isFinished - Whether the game is finished.
 */
function updateProgressBar(isFinished = false) {
    const total = appState.currentMatchingGame.premises.length;
    const score = appState.currentMatchingGame.score;

    if (isFinished) {
        dom.matchingProgressBar.style.width = `${(score / total) * 100}%`;
        dom.matchingScoreProgressText.textContent = `Final Score: ${score} / ${total}`;
    } else {
        dom.matchingProgressBar.style.width = '0%';
        dom.matchingScoreProgressText.textContent = `Score: 0 / ${total}`;
    }
}

// Event Listeners (will be attached in main.js)
export function addMatchingEventListeners() {
    dom.matchingBackBtn.addEventListener('click', () => {
        // Go back to the browse screen instead of main menu
        if (appState.navigationHistory.length > 1) {
            appState.navigationHistory.pop(); // Remove current screen
            const prevScreenFunc = appState.navigationHistory[appState.navigationHistory.length - 1];
            if(typeof prevScreenFunc === 'function') prevScreenFunc();
        } else {
            showMainMenuScreen();
        }
    });
    dom.checkMatchingAnswersBtn.addEventListener('click', checkMatchingAnswers);
    dom.matchingHomeBtn.addEventListener('click', showMainMenuScreen);
}

