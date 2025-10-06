// V.1.1 - 2025-10-06
// js/features/matching.js

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { showMainMenuScreen } from '../main.js';

let draggedAnswer = null; // To hold the element being dragged

/**
 * Main handler to start the matching exam process.
 */
export function handleStartMatchingExam() {
    const setCount = parseInt(dom.matchingSetCount.value, 10);
    const timePerSet = parseInt(dom.matchingTimerInput.value, 10);

    // --- Validation ---
    if (!setCount || setCount <= 0) {
        dom.matchingError.textContent = 'Please enter a valid number of sets.';
        dom.matchingError.classList.remove('hidden');
        return;
    }
    if (!timePerSet || timePerSet < 10) {
        dom.matchingError.textContent = 'Please enter a time of at least 10 seconds per set.';
        dom.matchingError.classList.remove('hidden');
        return;
    }
    dom.matchingError.classList.add('hidden');

    // --- Filtering Questions ---
    const selectedChapters = Array.from(dom.chapterSelectMatching.querySelectorAll('input:checked')).map(cb => cb.value);
    const selectedSources = Array.from(dom.sourceSelectMatching.querySelectorAll('input:checked')).map(cb => cb.value);

    let filteredQuestions = appState.allQuestions;

    if (selectedChapters.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedChapters.includes(q.Chapter));
    }
    if (selectedSources.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedSources.includes(q.source));
    }

    const requiredQuestions = setCount * 5;
    if (filteredQuestions.length < requiredQuestions) {
        dom.matchingError.textContent = `Not enough questions found (${filteredQuestions.length}) to create ${setCount} sets. Please select more chapters/sources or reduce the number of sets.`;
        dom.matchingError.classList.remove('hidden');
        return;
    }

    // --- Creating Exam Sets ---
    const shuffledPool = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const examSets = [];
    for (let i = 0; i < setCount; i++) {
        const setQuestions = shuffledPool.splice(0, 5);
        const premises = setQuestions.map(q => ({ question: q.question, uniqueId: q.UniqueID }));
        let answers = setQuestions.map(q => ({ CorrectAnswer: q.CorrectAnswer, uniqueId: q.UniqueID }));
        
        // Shuffle answers for the current set
        answers.sort(() => Math.random() - 0.5);

        examSets.push({ premises, answers });
    }

    const totalTime = setCount * timePerSet;
    launchMatchingExam(`Custom Matching Exam`, examSets, totalTime);
}

/**
 * Initializes and launches the matching exam UI.
 */
function launchMatchingExam(title, sets, totalTime) {
    appState.currentMatching = {
        sets: sets,
        setIndex: 0,
        userMatches: sets.map(() => ({})), // Array of objects to store matches for each set
        timerInterval: null,
        totalTime: totalTime,
        timeLeft: totalTime,
        score: 0,
        totalPremises: sets.reduce((acc, set) => acc + set.premises.length, 0),
        isReviewMode: false
    };

    dom.matchingTitle.textContent = title;
    ui.showScreen(dom.matchingContainer);
    renderCurrentSet();
    startMatchingTimer();
    addDragDropListeners();

    // Attach event listeners for this specific exam instance
    dom.endMatchingBtn.onclick = () => endMatchingExam(false);
    dom.checkAnswersBtn.onclick = checkCurrentSetAnswers;
    dom.matchingNextSetBtn.onclick = nextSet;
    dom.matchingPreviousSetBtn.onclick = prevSet;
}

/**
 * Renders the current set of premises and answers.
 */
function renderCurrentSet() {
    const { sets, setIndex, userMatches } = appState.currentMatching;
    const currentSet = sets[setIndex];
    ui.renderMatchingSet(currentSet, setIndex, sets.length);
    updateNavigationButtons();
    restoreUserMatchesForCurrentSet();
}

/**
 * Starts the exam timer.
 */
function startMatchingTimer() {
    if (appState.currentMatching.timerInterval) {
        clearInterval(appState.currentMatching.timerInterval);
    }

    appState.currentMatching.timerInterval = setInterval(() => {
        appState.currentMatching.timeLeft--;
        const minutes = Math.floor(appState.currentMatching.timeLeft / 60).toString().padStart(2, '0');
        const seconds = (appState.currentMatching.timeLeft % 60).toString().padStart(2, '0');
        dom.matchingTimer.textContent = `${minutes}:${seconds}`;

        if (appState.currentMatching.timeLeft <= 0) {
            endMatchingExam(true); // Automatically end when time is up
        }
    }, 1000);
}

/**
 * Adds document-level event listeners for drag and drop.
 */
function addDragDropListeners() {
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragend', handleDragEnd);
}

/**
 * Removes the drag and drop listeners.
 */
function removeDragDropListeners() {
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('dragleave', handleDragLeave);
    document.removeEventListener('drop', handleDrop);
    document.removeEventListener('dragend', handleDragEnd);
}

// --- Drag & Drop Event Handlers ---

function handleDragStart(e) {
    if (e.target.classList.contains('answer-draggable')) {
        draggedAnswer = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
        // If it was in a premise box, remove it from state
        const parentPremise = e.target.closest('.premise-drop-zone');
        if (parentPremise) {
            const premiseId = parentPremise.dataset.premiseId;
            delete appState.currentMatching.userMatches[appState.currentMatching.setIndex][premiseId];
        }
    }
}

function handleDragOver(e) {
    e.preventDefault();
    const dropZone = e.target.closest('.premise-drop-zone');
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const dropZone = e.target.closest('.premise-drop-zone');
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const dropZone = e.target.closest('.premise-drop-zone');
    if (dropZone && draggedAnswer) {
        dropZone.classList.remove('drag-over');

        // Check if there's already an answer, and if so, move it back to the answer area
        const existingAnswer = dropZone.querySelector('.answer-draggable');
        if (existingAnswer) {
            dom.matchingAnswersArea.appendChild(existingAnswer);
        }

        const placeholder = dropZone.querySelector('.dropped-answer-placeholder');
        if (placeholder) {
            dropZone.insertBefore(draggedAnswer, placeholder);
            dropZone.classList.add('has-answer');
        }

        // Update state
        const premiseId = dropZone.dataset.premiseId;
        const answerId = draggedAnswer.dataset.answerId;
        appState.currentMatching.userMatches[appState.currentMatching.setIndex][premiseId] = answerId;
    }
}

function handleDragEnd(e) {
    if (draggedAnswer) {
        draggedAnswer.classList.remove('dragging');
        draggedAnswer = null;
    }
}

/**
 * Checks answers for the current set and provides visual feedback.
 */
function checkCurrentSetAnswers() {
    const { sets, setIndex, userMatches } = appState.currentMatching;
    const currentSet = sets[setIndex];
    const currentMatches = userMatches[setIndex];

    currentSet.premises.forEach(premise => {
        const dropZone = dom.matchingPremisesArea.querySelector(`[data-premise-id="${premise.uniqueId}"]`);
        const droppedAnswerId = currentMatches[premise.uniqueId];
        const droppedAnswerEl = dropZone.querySelector('.answer-draggable');

        if (droppedAnswerEl) {
            if (droppedAnswerId === premise.uniqueId) {
                // Correct
                droppedAnswerEl.style.backgroundColor = '#d1fae5'; // green-200
                droppedAnswerEl.style.borderColor = '#10b981'; // green-500
            } else {
                // Incorrect
                droppedAnswerEl.style.backgroundColor = '#fee2e2'; // red-200
                droppedAnswerEl.style.borderColor = '#ef4444'; // red-500
            }
        }
    });

    // Disable further dragging for this set
    dom.matchingContainer.querySelectorAll('.answer-draggable').forEach(el => el.draggable = false);
    dom.checkAnswersBtn.disabled = true;
}

/**
 * Ends the exam, calculates the final score, and shows results.
 */
function endMatchingExam(isTimeUp = false) {
    clearInterval(appState.currentMatching.timerInterval);
    removeDragDropListeners();

    if (isTimeUp) {
        alert("Time's up!");
    }

    // Calculate final score
    let finalScore = 0;
    appState.currentMatching.sets.forEach((set, index) => {
        const userMatchesForSet = appState.currentMatching.userMatches[index];
        set.premises.forEach(premise => {
            if (userMatchesForSet[premise.uniqueId] === premise.uniqueId) {
                finalScore++;
            }
        });
    });
    appState.currentMatching.score = finalScore;

    // Show results
    ui.showConfirmationModal(
        'Exam Complete!',
        `You scored ${finalScore} out of ${appState.currentMatching.totalPremises}.`,
        showMainMenuScreen
    );
    // Here you would also log the activity to the server if needed
    // logUserActivity({ eventType: 'FinishMatchingQuiz', ... });
}


/**
 * Moves to the next set.
 */
function nextSet() {
    if (appState.currentMatching.setIndex < appState.currentMatching.sets.length - 1) {
        appState.currentMatching.setIndex++;
        renderCurrentSet();
    }
}

/**
 * Moves to the previous set.
 */
function prevSet() {
    if (appState.currentMatching.setIndex > 0) {
        appState.currentMatching.setIndex--;
        renderCurrentSet();
    }
}

/**
 * Updates the visibility of navigation buttons.
 */
function updateNavigationButtons() {
    const { setIndex, sets } = appState.currentMatching;
    dom.matchingPreviousSetBtn.classList.toggle('hidden', setIndex === 0);
    dom.matchingNextSetBtn.classList.toggle('hidden', setIndex === sets.length - 1);
    dom.checkAnswersBtn.classList.toggle('hidden', setIndex !== sets.length - 1);
    dom.checkAnswersBtn.disabled = false;
}

/**
 * Restores the user's previous matches on a set when navigating back and forth.
 */
function restoreUserMatchesForCurrentSet() {
    const { setIndex, userMatches } = appState.currentMatching;
    const matchesForCurrentSet = userMatches[setIndex];

    for (const premiseId in matchesForCurrentSet) {
        const answerId = matchesForCurrentSet[premiseId];
        const answerEl = dom.matchingAnswersArea.querySelector(`[data-answer-id="${answerId}"]`);
        const premiseEl = dom.matchingPremisesArea.querySelector(`[data-premise-id="${premiseId}"]`);

        if (answerEl && premiseEl) {
            const placeholder = premiseEl.querySelector('.dropped-answer-placeholder');
            premiseEl.insertBefore(answerEl, placeholder);
            premiseEl.classList.add('has-answer');
        }
    }
}
