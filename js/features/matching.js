// js/features/matching.js (Version 1.2 - Custom Matching Exam Mode)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logUserActivity } from '../api.js';
import { showMainMenuScreen } from '../main.js';
import { formatTime } from '../utils.js';

let draggedAnswer = null; // To hold the element being dragged

/**
 * Shows the main menu for creating a custom matching exam.
 */
export function showMatchingMenuScreen() {
    ui.showScreen(dom.matchingMenuContainer);
    appState.navigationHistory.push(showMatchingMenuScreen);
    populateMatchingFilters();
}

/**
 * Populates the filter options (chapters and sources) for the matching exam.
 */
function populateMatchingFilters() {
    const allSources = [...new Set(appState.allQuestions.map(q => q.source || 'Uncategorized'))].sort();
    const sourceCounts = appState.allQuestions.reduce((acc, q) => {
        const source = q.source || 'Uncategorized';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});

    ui.populateFilterOptions(dom.sourceSelectMatching, allSources, 'matching-source', sourceCounts);
    updateMatchingChapterFilter();
}

/**
 * Updates the chapter filter based on the selected sources.
 */
export function updateMatchingChapterFilter() {
    const selectedSources = [...dom.sourceSelectMatching.querySelectorAll('input:checked')].map(el => el.value);
    
    let relevantQuestions = selectedSources.length === 0 
        ? appState.allQuestions
        : appState.allQuestions.filter(q => selectedSources.includes(q.source || 'Uncategorized'));

    const chapterCounts = {};
    relevantQuestions.forEach(q => {
        const chapter = q.chapter || 'Uncategorized';
        chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1;
    });

    ui.populateFilterOptions(dom.chapterSelectMatching, Object.keys(chapterCounts).sort(), 'matching-chapter', chapterCounts);
}


/**
 * Handles the logic for starting a new custom matching exam.
 */
export function handleStartMatchingExam() {
    dom.matchingError.classList.add('hidden');
    const requestedSetCount = parseInt(dom.matchingSetCount.value, 10) || 1;
    const timePerQuestion = parseInt(dom.matchingTimerInput.value, 10) || 45;

    const selectedChapters = [...dom.chapterSelectMatching.querySelectorAll('input:checked')].map(el => el.value);
    const selectedSources = [...dom.sourceSelectMatching.querySelectorAll('input:checked')].map(el => el.value);

    let filteredQuestions = appState.allQuestions;
    if (selectedChapters.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedChapters.includes(q.chapter));
    }
    if (selectedSources.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedSources.includes(q.source));
    }

    const totalRequiredQuestions = requestedSetCount * 5;
    if (filteredQuestions.length < totalRequiredQuestions) {
        dom.matchingError.textContent = `Only ${filteredQuestions.length} questions are available for your selected filters. You need at least ${totalRequiredQuestions}.`;
        dom.matchingError.classList.remove('hidden');
        return;
    }

    // Create the sets
    const shuffledPool = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const examSets = [];
    for (let i = 0; i < requestedSetCount; i++) {
        const setQuestions = shuffledPool.splice(0, 5);
        const premises = setQuestions.map(q => ({ text: q.question, uniqueId: q.UniqueID, hint: q.hint }));
        const answers = setQuestions.map(q => {
            const correctAnswer = q.answerOptions.find(opt => opt.isCorrect);
            return { text: correctAnswer ? correctAnswer.text : 'N/A', uniqueId: q.UniqueID };
        });
        examSets.push({
            questions: setQuestions,
            premises: premises,
            answers: [...answers].sort(() => Math.random() - 0.5)
        });
    }

    const totalTime = requestedSetCount * 5 * timePerQuestion;
    const examTitle = selectedChapters.length > 0 ? selectedChapters.join(', ') : 'General Matching Exam';

    launchMatchingExam(examTitle, examSets, totalTime);
}

/**
 * Initializes and launches the matching exam UI.
 * @param {string} title The title of the exam.
 * @param {Array} sets The array of question sets.
 * @param {number} totalTimeSeconds The total time for the exam in seconds.
 */
function launchMatchingExam(title, sets, totalTimeSeconds) {
    appState.currentMatchingExam = {
        sets: sets,
        currentSetIndex: 0,
        totalSets: sets.length,
        timerInterval: null,
        userMatches: Array(sets.length).fill({}),
        flaggedSets: new Set(),
        title: title,
        isReviewMode: false,
        finalScore: 0
    };

    ui.showScreen(dom.matchingContainer);
    dom.matchingTitle.textContent = title;
    
    startMatchingTimer(totalTimeSeconds);
    renderCurrentSet();
    appState.navigationHistory.push(() => launchMatchingExam(title, sets, totalTimeSeconds));
}

/**
 * Renders the current set of premises and answers.
 */
function renderCurrentSet() {
    const exam = appState.currentMatchingExam;
    const currentSet = exam.sets[exam.currentSetIndex];

    dom.matchingSetProgressText.textContent = `Set: ${exam.currentSetIndex + 1} / ${exam.totalSets}`;
    updateProgressBar();

    // Reset UI for the current set
    dom.premisesColumn.innerHTML = '';
    dom.answersColumn.innerHTML = '';
    dom.matchingResultsArea.classList.add('hidden');
    dom.matchingFinalControls.classList.add('hidden');
    
    // Render Premises
    currentSet.premises.forEach((premise, index) => {
        const premiseDiv = document.createElement('div');
        premiseDiv.className = 'premise-item flex items-start gap-4';
        const userMatch = exam.userMatches[exam.currentSetIndex][premise.uniqueId];
        let existingAnswerHTML = 'Drop answer here';
        
        if (userMatch) {
            const answerText = currentSet.answers.find(a => a.uniqueId === userMatch)?.text || 
                               exam.sets.flat().flatMap(s => s.answers).find(a => a.uniqueId === userMatch)?.text || 
                               'Previously Placed Answer';
            existingAnswerHTML = `<div class="answer-item bg-white p-3 rounded-lg shadow-sm border" data-answer-id="${userMatch}">${answerText}</div>`;
        }
        
        premiseDiv.innerHTML = `
            <div class="flex-grow">
                <p class="font-semibold text-slate-800">${index + 1}. ${premise.text}</p>
                <div class="premise-slot min-h-[50px] bg-slate-200 mt-2 p-3 rounded-lg border-2 border-slate-300 flex items-center justify-center text-slate-500" data-premise-id="${premise.uniqueId}">
                    ${existingAnswerHTML}
                </div>
            </div>
        `;
        dom.premisesColumn.appendChild(premiseDiv);
    });

    // Render only the un-matched answers for this set
    const matchedAnswerIds = Object.values(exam.userMatches[exam.currentSetIndex]);
    currentSet.answers.forEach(answer => {
        if (!matchedAnswerIds.includes(answer.uniqueId)) {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-item bg-white p-3 rounded-lg shadow-sm border cursor-move';
            answerDiv.textContent = answer.text;
            answerDiv.draggable = true;
            answerDiv.dataset.answerId = answer.uniqueId;
            dom.answersColumn.appendChild(answerDiv);
        }
    });

    updateNavigationButtons();
    addDragDropListeners();
}

/**
 * Adds event listeners for drag-and-drop functionality.
 */
function addDragDropListeners() {
    document.querySelectorAll('.answer-item').forEach(answer => {
        answer.addEventListener('dragstart', handleDragStart);
        answer.addEventListener('dragend', handleDragEnd);
    });
    document.querySelectorAll('.premise-slot').forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
}

// Drag & Drop Handlers
function handleDragStart(e) {
    draggedAnswer = e.target;
    setTimeout(() => e.target.classList.add('dragging'), 0);
}
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}
function handleDragOver(e) {
    e.preventDefault();
    const target = e.target.closest('.premise-slot');
    if (target) target.classList.add('over');
}
function handleDragLeave(e) {
    const target = e.target.closest('.premise-slot');
    if (target) target.classList.remove('over');
}
function handleDrop(e) {
    e.preventDefault();
    const slot = e.target.closest('.premise-slot');
    if (!slot) return;
    slot.classList.remove('over');
    if (draggedAnswer) {
        const premiseId = slot.dataset.premiseId;
        const answerId = draggedAnswer.dataset.answerId;

        // If slot has an answer, return it to the pool
        if (slot.firstChild && slot.firstChild.dataset.answerId) {
            dom.answersColumn.appendChild(slot.firstChild);
        }
        slot.innerHTML = '';
        slot.appendChild(draggedAnswer);
        
        const currentMatches = { ...appState.currentMatchingExam.userMatches[appState.currentMatchingExam.currentSetIndex] };
        currentMatches[premiseId] = answerId;
        appState.currentMatchingExam.userMatches[appState.currentMatchingExam.currentSetIndex] = currentMatches;
    }
}

// Navigation & Timers
function updateNavigationButtons() {
    const exam = appState.currentMatchingExam;
    dom.matchingPreviousSetBtn.disabled = exam.currentSetIndex === 0;
    dom.matchingNextSetBtn.classList.toggle('hidden', exam.currentSetIndex === exam.totalSets - 1);
    dom.matchingFinalControls.classList.toggle('hidden', exam.currentSetIndex !== exam.totalSets - 1);
}

function startMatchingTimer(totalTimeSeconds) {
    clearInterval(appState.currentMatchingExam.timerInterval);
    let timeLeft = totalTimeSeconds;
    dom.matchingTimer.textContent = formatTime(timeLeft);
    appState.currentMatchingExam.timerInterval = setInterval(() => {
        timeLeft--;
        dom.matchingTimer.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(appState.currentMatchingExam.timerInterval);
            endMatchingExam(true); // Force end
        }
    }, 1000);
}

function handleNextSet() {
    if (appState.currentMatchingExam.currentSetIndex < appState.currentMatchingExam.totalSets - 1) {
        appState.currentMatchingExam.currentSetIndex++;
        renderCurrentSet();
    }
}

function handlePreviousSet() {
    if (appState.currentMatchingExam.currentSetIndex > 0) {
        appState.currentMatchingExam.currentSetIndex--;
        renderCurrentSet();
    }
}

function endMatchingExam(isForced = false) {
    if (isForced) {
        checkAllAnswersAndShowResults();
    } else {
        ui.showConfirmationModal('End Exam?', 'Are you sure you want to end this matching exam and see your results?', () => {
            checkAllAnswersAndShowResults();
        });
    }
}

// Results & Logging
function checkAllAnswersAndShowResults() {
    clearInterval(appState.currentMatchingExam.timerInterval);
    const { sets, userMatches } = appState.currentMatchingExam;
    let totalScore = 0;

    sets.forEach((set, setIndex) => {
        set.premises.forEach(premise => {
            if (userMatches[setIndex] && userMatches[setIndex][premise.uniqueId] === premise.uniqueId) {
                totalScore++;
            }
        });
    });
    
    appState.currentMatchingExam.finalScore = totalScore;
    renderFinalResults();

    logUserActivity({
        eventType: 'FinishMatchingQuiz',
        chapter: appState.currentMatchingExam.title,
        score: totalScore,
        totalQuestions: sets.length * 5,
    });
}

function renderFinalResults() {
    ui.showScreen(dom.quizContainer); // Reuse quiz results container
    dom.questionContainer.classList.add('hidden');
    dom.controlsContainer.classList.add('hidden');
    dom.resultsContainer.classList.remove('hidden');

    const totalQuestions = appState.currentMatchingExam.sets.length * 5;
    const finalScore = appState.currentMatchingExam.finalScore;

    dom.resultsTitle.textContent = "Matching Exam Complete!";
    dom.resultsScoreText.innerHTML = `Your score is <span class="font-bold">${finalScore}</span> out of <span class="font-bold">${totalQuestions}</span>.`;
    dom.restartBtn.classList.add('hidden');
    dom.reviewIncorrectBtn.classList.add('hidden');
    document.getElementById('review-simulation-btn').classList.add('hidden');
}


function updateProgressBar() {
    const total = appState.currentMatchingExam.totalSets;
    const current = appState.currentMatchingExam.currentSetIndex + 1;
    dom.matchingProgressBar.style.width = `${(current / total) * 100}%`;
}


// Event Listeners
export function addMatchingEventListeners() {
    dom.startMatchingExamBtn.addEventListener('click', handleStartMatchingExam);
    dom.toggleMatchingOptionsBtn.addEventListener('click', () => dom.customMatchingOptions.classList.toggle('visible'));
    dom.sourceSelectMatching.addEventListener('change', updateMatchingChapterFilter);
    dom.selectAllSourcesMatching.addEventListener('change', (e) => {
        dom.sourceSelectMatching.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
        updateMatchingChapterFilter();
    });
    dom.selectAllChaptersMatching.addEventListener('change', (e) => {
        dom.chapterSelectMatching.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });

    dom.matchingEndBtn.addEventListener('click', () => endMatchingExam(false));
    dom.matchingNextSetBtn.addEventListener('click', handleNextSet);
    dom.matchingPreviousSetBtn.addEventListener('click', handlePreviousSet);
    dom.checkMatchingAnswersBtn.addEventListener('click', () => endMatchingExam(false));
    dom.matchingHomeBtn.addEventListener('click', showMainMenuScreen);
}

