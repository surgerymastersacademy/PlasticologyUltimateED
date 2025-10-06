// js/features/matching.js (NEW FILE - COMPLETE)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logUserActivity } from '../api.js';
import { formatTime } from '../utils.js';
import { showMainMenuScreen } from '../main.js';

let draggedAnswer = null; // Variable to hold the dragged element info

/**
 * Shows the matching bank menu and populates filters.
 */
export function showMatchingMenuScreen() {
    ui.showScreen(dom.matchingMenuContainer);
    appState.navigationHistory.push(showMatchingMenuScreen);
    dom.matchingError.classList.add('hidden');

    // Populate filters
    const chapters = [...new Set(appState.allQuestions.map(q => q.chapter || 'Uncategorized'))].sort();
    const sources = [...new Set(appState.allQuestions.map(q => q.source || 'Uncategorized'))].sort();
    const chapterCounts = appState.allQuestions.reduce((acc, q) => {
        const chapter = q.chapter || 'Uncategorized';
        acc[chapter] = (acc[chapter] || 0) + 1;
        return acc;
    }, {});
    const sourceCounts = appState.allQuestions.reduce((acc, q) => {
        const source = q.source || 'Uncategorized';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});

    ui.populateFilterOptions(dom.chapterSelectMatching, chapters, 'chapter-matching', chapterCounts);
    ui.populateFilterOptions(dom.sourceSelectMatching, sources, 'source-matching', sourceCounts);
}

/**
 * Gathers user input, filters questions, and creates the exam sets.
 */
export function handleStartMatchingExam() {
    // 1. Collect user inputs
    const requestedSetCount = parseInt(dom.matchingSetCount.value, 10);
    const timePerSet = parseInt(dom.matchingTimerInput.value, 10);
    const selectedChapters = Array.from(dom.chapterSelectMatching.querySelectorAll('input:checked')).map(el => el.value);
    const selectedSources = Array.from(dom.sourceSelectMatching.querySelectorAll('input:checked')).map(el => el.value);

    // 2. Filter questions
    let filteredQuestions = appState.allQuestions;
    if (selectedChapters.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedChapters.includes(q.chapter));
    }
    if (selectedSources.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedSources.includes(q.source));
    }

    // 3. Validate if enough questions are available
    const requiredQuestions = requestedSetCount * 5;
    if (filteredQuestions.length < requiredQuestions) {
        dom.matchingError.textContent = `Not enough questions found. You need ${requiredQuestions}, but only found ${filteredQuestions.length} matching your criteria.`;
        dom.matchingError.classList.remove('hidden');
        return;
    }
     dom.matchingError.classList.add('hidden');

    // 4. Create exam sets
    const shuffledPool = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const examSets = [];
    for (let i = 0; i < requestedSetCount; i++) {
        const setQuestions = shuffledPool.splice(0, 5);
        const premises = setQuestions.map(q => ({
            uniqueId: q.UniqueID,
            text: q.Question
        }));
        let answers = setQuestions.map(q => {
            const correctAnswer = q.answerOptions.find(opt => opt.isCorrect);
            return {
                uniqueId: q.UniqueID,
                text: correctAnswer ? correctAnswer.text : 'N/A'
            };
        });
        
        // Shuffle the answers for this set
        answers = answers.sort(() => Math.random() - 0.5);

        examSets.push({ premises, answers });
    }
    
    // 5. Launch the exam
    const examTitle = `Matching Exam (${requestedSetCount} Set${requestedSetCount > 1 ? 's' : ''})`;
    launchMatchingExam(examTitle, examSets, timePerSet);
}


/**
 * Initializes the exam state and launches the UI.
 * @param {string} title
 * @param {Array} sets
 * @param {number} timePerSet
 */
function launchMatchingExam(title, sets, timePerSet) {
    const totalTime = sets.length * timePerSet;
    const totalQuestions = sets.length * 5;

    appState.currentMatchingExam = {
        title,
        sets,
        currentSetIndex: 0,
        userMatches: sets.map(set => new Array(set.premises.length).fill(null)),
        timerInterval: null,
        totalTime,
        score: 0
    };
    
    ui.showScreen(dom.matchingContainer);
    appState.navigationHistory.push(() => launchMatchingExam(title, sets, timePerSet));
    dom.matchingExamTitle.textContent = title;
    dom.matchingTotal.textContent = totalQuestions;
    dom.matchingScore.textContent = 0;
    
    dom.matchingCheckAnswersBtn.classList.remove('hidden');
    dom.matchingNextSetBtn.classList.add('hidden');
    dom.matchingCheckAnswersBtn.disabled = false;
    dom.matchingCheckAnswersBtn.textContent = 'Check Answers';
    dom.matchingCheckAnswersBtn.onclick = handleCheckAnswers;

    startMatchingTimer();
    renderCurrentSet();
}

/**
 * Renders the current set of premises and answers.
 */
function renderCurrentSet() {
    const { sets, currentSetIndex } = appState.currentMatchingExam;
    const currentSet = sets[currentSetIndex];

    dom.premisesContainer.innerHTML = '';
    dom.answersContainer.innerHTML = '';

    // Render Premises (Drop Zones)
    currentSet.premises.forEach((premise, index) => {
        const premiseEl = document.createElement('div');
        premiseEl.className = 'premise-slot';
        premiseEl.dataset.premiseIndex = index;
        premiseEl.innerHTML = `
            <span class="premise-question-text">${index + 1}. ${premise.text}</span>
            <div class="premise-drop-zone" data-premise-id="${premise.uniqueId}">Drop here</div>
        `;
        premiseEl.addEventListener('dragover', handleDragOver);
        premiseEl.addEventListener('drop', handleDrop);
        dom.premisesContainer.appendChild(premiseEl);
    });

    // Render Answers (Draggable)
    currentSet.answers.forEach((answer, index) => {
        const answerEl = document.createElement('div');
        answerEl.className = 'answer-option';
        answerEl.draggable = true;
        answerEl.dataset.answerId = answer.uniqueId;
        answerEl.textContent = answer.text;
        answerEl.addEventListener('dragstart', handleDragStart);
        dom.answersContainer.appendChild(answerEl);
    });

    dom.matchingSetIndicator.textContent = `Set ${currentSetIndex + 1} of ${sets.length}`;
}

// --- DRAG & DROP LOGIC ---

function handleDragStart(e) {
    draggedAnswer = {
        id: e.target.dataset.answerId,
        text: e.target.textContent,
        element: e.target
    };
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    const dropZone = e.target.closest('.premise-drop-zone');
    if (dropZone) {
         // Add a visual indicator
        dom.premisesContainer.querySelectorAll('.premise-slot').forEach(el => el.classList.remove('drag-over'));
        e.target.closest('.premise-slot').classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    dom.premisesContainer.querySelectorAll('.premise-slot').forEach(el => el.classList.remove('drag-over'));

    const dropZone = e.target.closest('.premise-drop-zone');
    if (dropZone && draggedAnswer) {
        // Update state
        const premiseIndex = parseInt(e.target.closest('.premise-slot').dataset.premiseIndex, 10);
        const { currentSetIndex } = appState.currentMatchingExam;
        appState.currentMatchingExam.userMatches[currentSetIndex][premiseIndex] = draggedAnswer.id;

        // Update UI
        dropZone.textContent = draggedAnswer.text;
        dropZone.classList.add('filled');
        
        // Hide the dragged answer
        draggedAnswer.element.style.display = 'none';
        
        // Return any previously dropped answer back to the list
        const previousAnswerId = dropZone.dataset.previousAnswer;
        if (previousAnswerId) {
             const previousAnswerEl = dom.answersContainer.querySelector(`[data-answer-id="${previousAnswerId}"]`);
             if(previousAnswerEl) previousAnswerEl.style.display = 'flex';
        }
        dropZone.dataset.previousAnswer = draggedAnswer.id;

        draggedAnswer = null;
    }
}

// --- TIMER & RESULTS ---

function startMatchingTimer() {
    clearInterval(appState.currentMatchingExam.timerInterval);
    let timeLeft = appState.currentMatchingExam.totalTime;
    dom.matchingTimer.textContent = formatTime(timeLeft);

    appState.currentMatchingExam.timerInterval = setInterval(() => {
        timeLeft--;
        dom.matchingTimer.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(appState.currentMatchingExam.timerInterval);
            handleCheckAnswers(); // Auto-submit when time is up
        }
    }, 1000);
}

function handleCheckAnswers() {
    clearInterval(appState.currentMatchingExam.timerInterval);
    dom.matchingCheckAnswersBtn.disabled = true;

    const { sets, userMatches } = appState.currentMatchingExam;
    let totalScore = 0;

    // Disable dragging
    dom.answersContainer.querySelectorAll('.answer-option').forEach(el => el.draggable = false);

    // Score all sets
    sets.forEach((set, setIndex) => {
        set.premises.forEach((premise, premiseIndex) => {
            if (premise.uniqueId === userMatches[setIndex][premiseIndex]) {
                totalScore++;
            }
        });
    });
    
    appState.currentMatchingExam.score = totalScore;
    dom.matchingScore.textContent = totalScore;

    // Show visual feedback for the current set
    const currentSetIndex = appState.currentMatchingExam.currentSetIndex;
    const currentSet = sets[currentSetIndex];
    currentSet.premises.forEach((premise, premiseIndex) => {
        const dropZone = dom.premisesContainer.querySelector(`[data-premise-id="${premise.uniqueId}"]`);
        if (dropZone) {
            const isCorrect = premise.uniqueId === userMatches[currentSetIndex][premiseIndex];
            dropZone.classList.add(isCorrect ? 'correct-match' : 'incorrect-match');
        }
    });

    // Log the final result after checking the last set
    if (currentSetIndex === sets.length - 1) {
        logUserActivity({
            eventType: 'logMatchingActivity',
            score: appState.currentMatchingExam.score,
            totalQuestions: sets.length * 5,
            details: {
                sets: sets.map(s => ({
                    premises: s.premises.map(p => p.uniqueId),
                    answers: s.answers.map(a => a.uniqueId)
                })),
                userMatches: userMatches
            }
        });
        dom.matchingCheckAnswersBtn.textContent = 'Finish & Exit';
        dom.matchingCheckAnswersBtn.onclick = showMainMenuScreen;
        dom.matchingCheckAnswersBtn.disabled = false;
    } else {
        // Show "Next Set" button
        dom.matchingNextSetBtn.classList.remove('hidden');
        dom.matchingCheckAnswersBtn.classList.add('hidden');
    }
}

export function handleNextSet() {
    appState.currentMatchingExam.currentSetIndex++;
    if (appState.currentMatchingExam.currentSetIndex < appState.currentMatchingExam.sets.length) {
        dom.matchingNextSetBtn.classList.add('hidden');
        dom.matchingCheckAnswersBtn.classList.remove('hidden');
        dom.matchingCheckAnswersBtn.disabled = false;
        renderCurrentSet();
    }
}
