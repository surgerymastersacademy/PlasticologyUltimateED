// ===========================
// Update Title: Matching Bank Feature
// Date: 10/10/2025
// Version: v1.0
// Description: Core logic for the new Matching Bank feature, including setup, gameplay (click-to-match), navigation, and scoring.
// ===========================

import { appState } from './state.js';
import { domElements } from './dom.js';
import * as ui from './ui.js';
import * as utils from './utils.js';

let selectedAnswerElement = null;
let timerInterval = null;

/**
 * Initializes all event listeners for the Matching Bank feature.
 */
export function initializeMatchingMode() {
    domElements.startMatchingBtn.addEventListener('click', handleStartMatchingExam);
    domElements.matchingMenuBackBtn.addEventListener('click', () => ui.showScreen('main-menu'));
    domElements.endMatchingQuizBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        ui.showConfirmationModal('Are you sure you want to end this exam?', () => ui.showScreen('main-menu'));
    });

    // Using event delegation for dynamic elements
    domElements.matchingAnswersArea.addEventListener('click', handleAnswerClick);
    domElements.matchingPremisesArea.addEventListener('click', handlePremiseClick);

    domElements.matchingNextBtn.addEventListener('click', handleNextSet);
    domElements.matchingPreviousBtn.addEventListener('click', handlePreviousSet);
}

/**
 * Starts the matching exam after validating user settings.
 */
function handleStartMatchingExam() {
    const setCount = parseInt(domElements.matchingSetCountInput.value, 10) || 10;
    const timePerSet = parseInt(domElements.matchingTimerInput.value, 10) || 60;
    const requiredQuestions = setCount * 5;

    const selectedChapters = ui.getSelectedFilterIds(domElements.chapterSelectMatching);
    const selectedSources = ui.getSelectedFilterIds(domElements.sourceSelectMatching);

    let filteredQuestions = appState.allQuestions;

    if (selectedChapters.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedChapters.includes(q.Chapter));
    }
    if (selectedSources.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedSources.includes(q.Book));
    }

    if (filteredQuestions.length < requiredQuestions) {
        ui.showError(domElements.matchingError, `Not enough questions available for your filter. Found ${filteredQuestions.length}, need ${requiredQuestions}.`);
        return;
    }

    utils.shuffleArray(filteredQuestions);
    
    // Reset state
    appState.matchingExam.sets = [];
    appState.matchingExam.userMatches = {};
    appState.matchingExam.scores = {};
    appState.currentMatchingSetIndex = 0;
    
    appState.matchingExam.config = { setCount, timePerSet };

    // Create sets
    for (let i = 0; i < setCount; i++) {
        const setQuestions = filteredQuestions.slice(i * 5, (i + 1) * 5);
        const premises = setQuestions.map(q => ({ question: q.Question, UniqueID: q.UniqueID }));
        const answers = setQuestions.map(q => ({ answer: q.CorrectAnswer, UniqueID: q.UniqueID }));
        utils.shuffleArray(answers);
        
        appState.matchingExam.sets.push({ premises, answers });
        appState.matchingExam.userMatches[i] = {}; // { premiseId: answerId }
    }

    ui.showScreen('matching-quiz');
    renderCurrentSet();
}

/**
 * Renders the current set of premises and answers.
 */
function renderCurrentSet() {
    const setIndex = appState.currentMatchingSetIndex;
    const currentSet = appState.matchingExam.sets[setIndex];
    const userMatchesForSet = appState.matchingExam.userMatches[setIndex] || {};

    domElements.matchingPremisesArea.innerHTML = '';
    domElements.matchingAnswersArea.innerHTML = '';
    domElements.matchingAnswersArea.classList.remove('no-pointer-events');
    domElements.matchingPremisesArea.classList.remove('no-pointer-events');

    // Render premises
    currentSet.premises.forEach(premise => {
        const premiseEl = document.createElement('div');
        premiseEl.className = 'premise-item';
        premiseEl.innerHTML = `
            <div class="premise-text">${premise.question}</div>
            <div class="premise-drop-zone" data-premise-id="${premise.UniqueID}"></div>
        `;
        domElements.matchingPremisesArea.appendChild(premiseEl);
    });

    // Render answers and place matched ones
    const matchedAnswerIds = Object.values(userMatchesForSet);
    currentSet.answers.forEach(answer => {
        if (!matchedAnswerIds.includes(answer.UniqueID)) {
            const answerEl = createAnswerElement(answer);
            domElements.matchingAnswersArea.appendChild(answerEl);
        }
    });

    // Restore previously matched answers to their premise slots
    for (const [premiseId, answerId] of Object.entries(userMatchesForSet)) {
        const dropZone = domElements.matchingPremisesArea.querySelector(`[data-premise-id="${premiseId}"]`);
        const answerObj = currentSet.answers.find(a => a.UniqueID === answerId);
        if (dropZone && answerObj) {
            dropZone.appendChild(createAnswerElement(answerObj));
        }
    }

    updateUI();
    startTimer();
}

/**
 * Handles clicking on an answer item.
 * @param {Event} e The click event.
 */
function handleAnswerClick(e) {
    const target = e.target.closest('.answer-item');
    if (!target) return;

    if (selectedAnswerElement) {
        selectedAnswerElement.classList.remove('answer-selected');
    }

    // If clicking the same element, deselect it
    if (selectedAnswerElement === target) {
        selectedAnswerElement = null;
        return;
    }
    
    selectedAnswerElement = target;
    selectedAnswerElement.classList.add('answer-selected');
}

/**
 * Handles clicking on a premise drop zone or an answer within it.
 * @param {Event} e The click event.
 */
function handlePremiseClick(e) {
    const premiseDropZone = e.target.closest('.premise-drop-zone');
    const answerInZone = e.target.closest('.answer-item');

    // Case 1: Return an answer from a premise to the answer area
    if (answerInZone && premiseDropZone) {
        const premiseId = premiseDropZone.dataset.premiseId;
        const answerId = answerInZone.dataset.answerId;
        
        delete appState.matchingExam.userMatches[appState.currentMatchingSetIndex][premiseId];
        
        domElements.matchingAnswersArea.appendChild(answerInZone);
        return;
    }

    // Case 2: Drop a selected answer into an empty premise zone
    if (premiseDropZone && !premiseDropZone.hasChildNodes() && selectedAnswerElement) {
        const premiseId = premiseDropZone.dataset.premiseId;
        const answerId = selectedAnswerElement.dataset.answerId;

        premiseDropZone.appendChild(selectedAnswerElement);
        selectedAnswerElement.classList.remove('answer-selected');
        
        appState.matchingExam.userMatches[appState.currentMatchingSetIndex][premiseId] = answerId;

        selectedAnswerElement = null;
    }
}

/**
 * Creates a draggable answer element.
 * @param {object} answer - The answer object { answer, UniqueID }.
 * @returns {HTMLElement} The created answer element.
 */
function createAnswerElement(answer) {
    const answerEl = document.createElement('div');
    answerEl.className = 'answer-item';
    answerEl.dataset.answerId = answer.UniqueID;
    answerEl.textContent = answer.answer;
    return answerEl;
}

/**
 * Navigates to the next set or triggers answer checking.
 */
function handleNextSet() {
    clearInterval(timerInterval);
    const setIndex = appState.currentMatchingSetIndex;
    const totalSets = appState.matchingExam.config.setCount;

    if (setIndex < totalSets - 1) {
        appState.currentMatchingSetIndex++;
        renderCurrentSet();
    } else {
        checkCurrentSetAnswers();
    }
}

/**
 * Navigates to the previous set.
 */
function handlePreviousSet() {
    clearInterval(timerInterval);
    if (appState.currentMatchingSetIndex > 0) {
        appState.currentMatchingSetIndex--;
        renderCurrentSet();
    }
}

/**
 * Checks the answers for the current set and provides visual feedback.
 */
function checkCurrentSetAnswers() {
    clearInterval(timerInterval);
    domElements.matchingAnswersArea.classList.add('no-pointer-events');
    domElements.matchingPremisesArea.classList.add('no-pointer-events');

    const setIndex = appState.currentMatchingSetIndex;
    const currentSet = appState.matchingExam.sets[setIndex];
    const userMatches = appState.matchingExam.userMatches[setIndex] || {};
    let score = 0;

    currentSet.premises.forEach(premise => {
        const dropZone = domElements.matchingPremisesArea.querySelector(`[data-premise-id="${premise.UniqueID}"]`);
        const placedAnswerId = userMatches[premise.UniqueID];
        
        const isCorrect = premise.UniqueID === placedAnswerId;
        
        if (placedAnswerId) {
            const answerEl = dropZone.querySelector('.answer-item');
            answerEl.classList.add(isCorrect ? 'correct-match' : 'incorrect-match');
            if (isCorrect) score++;
        }

        if (!isCorrect) {
            const correctAnswer = currentSet.answers.find(a => a.UniqueID === premise.UniqueID);
            const revealEl = document.createElement('div');
            revealEl.className = 'correct-answer-reveal';
            revealEl.innerHTML = `Correct: <strong>${correctAnswer.answer}</strong>`;
            dropZone.insertAdjacentElement('afterend', revealEl);
        }
    });

    appState.matchingExam.scores[setIndex] = score;

    setTimeout(calculateAndShowFinalScore, 2000); // Wait 2s to show feedback
}

/**
 * Calculates the total score and displays the final result.
 */
function calculateAndShowFinalScore() {
    let totalScore = 0;
    const totalQuestions = appState.matchingExam.config.setCount * 5;

    for (const setScore of Object.values(appState.matchingExam.scores)) {
        totalScore += setScore;
    }
    
    // Log activity
    utils.logUserActivity({
        eventType: 'FinishMatchingQuiz',
        quizTitle: 'Matching Bank Exam',
        score: totalScore,
        totalQuestions: totalQuestions,
        details: JSON.stringify(appState.matchingExam.userMatches)
    });

    ui.showResultsModal(
        'Matching Exam Complete!',
        `Your final score is ${totalScore} out of ${totalQuestions}.`,
        () => ui.showScreen('main-menu')
    );
}

/**
 * Starts the timer for the current set.
 */
function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = appState.matchingExam.config.timePerSet;

    timerInterval = setInterval(() => {
        timeLeft--;
        domElements.matchingTimer.textContent = utils.formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (appState.currentMatchingSetIndex < appState.matchingExam.config.setCount - 1) {
                handleNextSet();
            } else {
                checkCurrentSetAnswers();
            }
        }
    }, 1000);
    domElements.matchingTimer.textContent = utils.formatTime(timeLeft);
}

/**
 * Updates UI elements like progress text and button states.
 */
function updateUI() {
    const setIndex = appState.currentMatchingSetIndex;
    const totalSets = appState.matchingExam.config.setCount;

    domElements.matchingProgressText.textContent = `Set ${setIndex + 1} of ${totalSets}`;
    domElements.matchingPreviousBtn.disabled = setIndex === 0;
    domElements.matchingNextBtn.textContent = (setIndex === totalSets - 1) ? 'Check Answers' : 'Next';
}
