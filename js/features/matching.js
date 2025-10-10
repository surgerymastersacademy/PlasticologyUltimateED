// js/features/matching.js

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import * as utils from '../utils.js';
import { logUserActivity } from '../api.js';
import { showMainMenuScreen } from '../main.js';

let selectedAnswerElement = null;
let timerInterval = null;

// This function will be called from main.js to set up all the event listeners
export function initializeMatching() {
    dom.startMatchingBtn.addEventListener('click', handleStartMatchingExam);
    dom.matchingMenuBackBtn.addEventListener('click', showMainMenuScreen);
    dom.endMatchingQuizBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        ui.showConfirmationModal('Are you sure you want to end this exam?', showMainMenuScreen);
    });

    dom.matchingAnswersArea.addEventListener('click', handleAnswerClick);
    dom.matchingPremisesArea.addEventListener('click', handlePremiseClick);
    dom.matchingNextBtn.addEventListener('click', handleNextSet);
    dom.matchingPreviousBtn.addEventListener('click', handlePreviousSet);
    
    dom.selectAllChaptersMatching.addEventListener('change', (e) => {
        dom.chapterSelectMatching.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });
    dom.selectAllSourcesMatching.addEventListener('change', (e) => {
        dom.sourceSelectMatching.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });
}

export function showMatchingMenuScreen() {
    if (!appState.allQuestions || appState.allQuestions.length === 0) {
        ui.showError(dom.loginError, "Question data is not loaded yet. Please wait.");
        return;
    }
    
    const allChapters = [...new Set(appState.allQuestions.map(q => q.Chapter).filter(Boolean))].sort();
    const allSources = [...new Set(appState.allQuestions.map(q => q.source || 'Uncategorized'))].sort();
    
    ui.populateFilterOptions(dom.chapterSelectMatching, allChapters, 'matching-chapter');
    ui.populateFilterOptions(dom.sourceSelectMatching, allSources, 'matching-source');

    ui.showScreen(dom.matchingMenuContainer);
    appState.navigationHistory.push(showMatchingMenuScreen);
}


function handleStartMatchingExam() {
    const setCount = parseInt(dom.matchingSetCountInput.value, 10) || 10;
    const timePerSet = parseInt(dom.matchingTimerInput.value, 10) || 60;
    const requiredQuestions = setCount * 5;

    const selectedChapters = ui.getSelectedFilterOptions(dom.chapterSelectMatching);
    const selectedSources = ui.getSelectedFilterOptions(dom.sourceSelectMatching);

    let filteredQuestions = appState.allQuestions;
    if (selectedChapters.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedChapters.includes(q.Chapter));
    }
    if (selectedSources.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => selectedSources.includes(q.source));
    }

    if (filteredQuestions.length < requiredQuestions) {
        ui.showError(dom.matchingError, `Not enough questions found (${filteredQuestions.length}). Need ${requiredQuestions}. Try broader filters.`);
        return;
    }

    utils.shuffleArray(filteredQuestions);
    
    appState.matchingExam = {
        sets: [],
        config: { setCount, timePerSet },
        userMatches: {},
        scores: {},
    };
    
    for (let i = 0; i < setCount; i++) {
        const setQuestions = filteredQuestions.slice(i * 5, (i + 1) * 5);
        const premises = setQuestions.map(q => ({ question: q.Question, UniqueID: q.UniqueID }));
        const answers = setQuestions.map(q => ({ answer: q.CorrectAnswer, UniqueID: q.UniqueID }));
        utils.shuffleArray(answers);
        
        appState.matchingExam.sets.push({ premises, answers });
        appState.matchingExam.userMatches[i] = {};
    }
    
    appState.currentMatchingSetIndex = 0;
    ui.showScreen(dom.matchingQuizContainer);
    renderCurrentSet();
}

function renderCurrentSet() {
    const setIndex = appState.currentMatchingSetIndex;
    const currentSet = appState.matchingExam.sets[setIndex];
    const userMatchesForSet = appState.matchingExam.userMatches[setIndex] || {};

    dom.matchingPremisesArea.innerHTML = '';
    dom.matchingAnswersArea.innerHTML = '';
    [dom.matchingAnswersArea, dom.matchingPremisesArea].forEach(el => el.classList.remove('no-pointer-events'));

    currentSet.premises.forEach(premise => {
        dom.matchingPremisesArea.innerHTML += `
            <div class="premise-item">
                <div class="premise-text">${premise.question}</div>
                <div class="premise-drop-zone" data-premise-id="${premise.UniqueID}"></div>
            </div>`;
    });

    const matchedAnswerIds = Object.values(userMatchesForSet);
    currentSet.answers.forEach(answer => {
        if (!matchedAnswerIds.includes(answer.UniqueID)) {
            dom.matchingAnswersArea.appendChild(createAnswerElement(answer));
        }
    });

    for (const [premiseId, answerId] of Object.entries(userMatchesForSet)) {
        const dropZone = dom.matchingPremisesArea.querySelector(`[data-premise-id="${premiseId}"]`);
        const answerObj = currentSet.answers.find(a => a.UniqueID === answerId);
        if (dropZone && answerObj) {
            dropZone.appendChild(createAnswerElement(answerObj));
        }
    }

    updateUI();
    startTimer();
}

function handleAnswerClick(e) {
    const target = e.target.closest('.answer-item');
    if (!target) return;

    if (selectedAnswerElement) {
        selectedAnswerElement.classList.remove('answer-selected');
    }
    if (selectedAnswerElement === target) {
        selectedAnswerElement = null;
        return;
    }
    selectedAnswerElement = target;
    selectedAnswerElement.classList.add('answer-selected');
}

function handlePremiseClick(e) {
    const premiseDropZone = e.target.closest('.premise-drop-zone');
    const answerInZone = e.target.closest('.answer-item');

    if (answerInZone && premiseDropZone) {
        delete appState.matchingExam.userMatches[appState.currentMatchingSetIndex][premiseDropZone.dataset.premiseId];
        dom.matchingAnswersArea.appendChild(answerInZone);
        if (selectedAnswerElement === answerInZone) selectedAnswerElement = null;
        return;
    }

    if (premiseDropZone && !premiseDropZone.hasChildNodes() && selectedAnswerElement) {
        premiseDropZone.appendChild(selectedAnswerElement);
        appState.matchingExam.userMatches[appState.currentMatchingSetIndex][premiseDropZone.dataset.premiseId] = selectedAnswerElement.dataset.answerId;
        selectedAnswerElement.classList.remove('answer-selected');
        selectedAnswerElement = null;
    }
}

function createAnswerElement({ answer, UniqueID }) {
    const el = document.createElement('div');
    el.className = 'answer-item';
    el.dataset.answerId = UniqueID;
    el.textContent = answer;
    return el;
}

function handleNextSet() {
    clearInterval(timerInterval);
    const { currentMatchingSetIndex, matchingExam: { config } } = appState;
    if (currentMatchingSetIndex < config.setCount - 1) {
        appState.currentMatchingSetIndex++;
        renderCurrentSet();
    } else {
        checkCurrentSetAnswers();
    }
}

function handlePreviousSet() {
    clearInterval(timerInterval);
    if (appState.currentMatchingSetIndex > 0) {
        appState.currentMatchingSetIndex--;
        renderCurrentSet();
    }
}

function checkCurrentSetAnswers() {
    clearInterval(timerInterval);
    [dom.matchingAnswersArea, dom.matchingPremisesArea].forEach(el => el.classList.add('no-pointer-events'));
    dom.matchingNextBtn.disabled = true;

    const setIndex = appState.currentMatchingSetIndex;
    const { sets, userMatches } = appState.matchingExam;
    let score = 0;

    sets[setIndex].premises.forEach(premise => {
        const dropZone = dom.matchingPremisesArea.querySelector(`[data-premise-id="${premise.UniqueID}"]`);
        const placedAnswerId = userMatches[setIndex][premise.UniqueID];
        const isCorrect = premise.UniqueID === placedAnswerId;
        
        dropZone.parentElement.classList.add(isCorrect ? 'correct-match' : 'incorrect-match');
        if (isCorrect) score++;
        
        if (!isCorrect) {
            const correctAnswer = sets[setIndex].answers.find(a => a.UniqueID === premise.UniqueID);
            const revealEl = document.createElement('div');
            revealEl.className = 'correct-answer-reveal';
            revealEl.innerHTML = `Correct: <strong>${correctAnswer.answer}</strong>`;
            dropZone.insertAdjacentElement('afterend', revealEl);
        }
    });

    appState.matchingExam.scores[setIndex] = score;
    setTimeout(calculateAndShowFinalScore, 2500);
}

function calculateAndShowFinalScore() {
    const { scores, config } = appState.matchingExam;
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const totalQuestions = config.setCount * 5;

    logUserActivity({
        userId: appState.currentUser.UniqueID,
        userName: appState.currentUser.Name,
        eventType: 'FinishMatchingQuiz',
        quizTitle: 'Matching Bank Exam',
        score: totalScore,
        totalQuestions,
        details: JSON.stringify(appState.matchingExam.userMatches)
    });

    ui.showResultsModal(
        'Matching Exam Complete!',
        `Your final score is ${totalScore} out of ${totalQuestions}.`,
        showMainMenuScreen
    );
}

function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = appState.matchingExam.config.timePerSet;
    dom.matchingTimer.textContent = utils.formatTime(timeLeft);
    timerInterval = setInterval(() => {
        timeLeft--;
        dom.matchingTimer.textContent = utils.formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            const { currentMatchingSetIndex, matchingExam: { config } } = appState;
            if (currentMatchingSetIndex < config.setCount - 1) {
                handleNextSet();
            } else {
                checkCurrentSetAnswers();
            }
        }
    }, 1000);
}

function updateUI() {
    const { currentMatchingSetIndex, matchingExam: { config } } = appState;
    dom.matchingProgressText.textContent = `Set ${currentMatchingSetIndex + 1} of ${config.setCount}`;
    dom.matchingPreviousBtn.disabled = currentMatchingSetIndex === 0;
    dom.matchingNextBtn.disabled = false;
    dom.matchingNextBtn.textContent = (currentMatchingSetIndex === config.setCount - 1) ? 'Check Answers' : 'Next';
}
