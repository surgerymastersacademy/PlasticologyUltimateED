// V.2.2 - 2025-10-07
// js/features/matching.js

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { showMainMenuScreen } from '../main.js';
import { logUserActivity } from '../api.js';

let selectedAnswerElement = null;

export function updateMatchingChapterFilter() {
    const selectedSources = Array.from(dom.sourceSelectMatching.querySelectorAll('input:checked')).map(cb => cb.value);

    let questionsToConsider = appState.allQuestions;
    if (selectedSources.length > 0) {
        questionsToConsider = appState.allQuestions.filter(q => selectedSources.includes(q.source || 'Uncategorized'));
    }

    const chapterCounts = questionsToConsider.reduce((acc, q) => {
        const chapter = q.Chapter || 'Uncategorized';
        acc[chapter] = (acc[chapter] || 0) + 1;
        return acc;
    }, {});

    const chapterNames = Object.keys(chapterCounts).sort();
    ui.populateFilterOptions(dom.chapterSelectMatching, chapterNames, 'matching-chapter', chapterCounts);
}

export function handleStartMatchingExam() {
    const setCount = parseInt(dom.matchingSetCount.value, 10) || 10;
    const timePerSet = parseInt(dom.matchingTimerInput.value, 10) || 60;
    dom.matchingError.classList.add('hidden');

    const selectedChapters = Array.from(dom.chapterSelectMatching.querySelectorAll('input:checked')).map(cb => cb.value);
    const selectedSources = Array.from(dom.sourceSelectMatching.querySelectorAll('input:checked')).map(cb => cb.value);

    let filteredQuestions = appState.allQuestions.filter(q => q.question && q.CorrectAnswer && q.Chapter);

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

    const shuffledPool = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const examSets = [];
    for (let i = 0; i < setCount; i++) {
        const setQuestions = shuffledPool.splice(0, 5);
        const premises = setQuestions.map(q => ({ question: q.question, uniqueId: q.UniqueID }));
        let answers = setQuestions.map(q => ({ CorrectAnswer: q.CorrectAnswer, uniqueId: q.UniqueID }));
        
        answers.sort(() => Math.random() - 0.5);

        examSets.push({ premises, answers });
    }

    const totalTime = setCount * timePerSet;
    launchMatchingExam(`Custom Matching Exam`, examSets, totalTime);
}

function launchMatchingExam(title, sets, totalTime) {
    appState.currentMatching = {
        sets: sets,
        setIndex: 0,
        userMatches: sets.map(() => ({})),
        timerInterval: null,
        score: 0,
        totalPremises: sets.reduce((acc, set) => acc + set.premises.length, 0),
        isReviewMode: false
    };
    appState.timers.matching = {
        totalTime: totalTime,
        timeLeft: totalTime
    };

    dom.matchingTitle.textContent = title;
    ui.showScreen(dom.matchingContainer);
    renderCurrentSet();
    startMatchingTimer();
    addClickListeners();

    dom.endMatchingBtn.onclick = () => endMatchingExam(false);
    dom.checkAnswersBtn.onclick = checkCurrentSetAnswers; // This button will now trigger the final score calculation
    dom.matchingNextSetBtn.onclick = nextSet;
    dom.matchingPreviousSetBtn.onclick = prevSet;
}

function renderCurrentSet() {
    const { sets, setIndex } = appState.currentMatching;
    const currentSet = sets[setIndex];
    ui.renderMatchingSet(currentSet, setIndex, sets.length);
    updateNavigationButtons();
    restoreUserMatchesForCurrentSet();
}

function addClickListeners() {
    dom.matchingContainer.addEventListener('click', handleMatchingClick);
}

function removeClickListeners() {
    dom.matchingContainer.removeEventListener('click', handleMatchingClick);
    if (selectedAnswerElement) {
        selectedAnswerElement.classList.remove('answer-selected');
        selectedAnswerElement = null;
    }
}

function handleMatchingClick(e) {
    const target = e.target;
    if (appState.currentMatching.isReviewMode) return;

    if (target.matches('#matching-answers-area .answer-clickable')) {
        handleSelectAnswer(target);
    }
    else if (target.closest('.premise-drop-zone:not(.has-answer)')) {
        handleSelectPremise(target.closest('.premise-drop-zone'));
    }
    else if (target.matches('.premise-drop-zone .answer-clickable')) {
        handleReturnAnswer(target);
    }
}

function handleSelectAnswer(answerEl) {
    if (answerEl === selectedAnswerElement) {
        answerEl.classList.remove('answer-selected');
        selectedAnswerElement = null;
        return;
    }
    if (selectedAnswerElement) {
        selectedAnswerElement.classList.remove('answer-selected');
    }
    selectedAnswerElement = answerEl;
    selectedAnswerElement.classList.add('answer-selected');
}

function handleSelectPremise(premiseEl) {
    if (!selectedAnswerElement) return;

    const premiseId = premiseEl.dataset.premiseId;
    const answerId = selectedAnswerElement.dataset.answerId;

    premiseEl.querySelector('.dropped-answer-placeholder').insertAdjacentElement('beforebegin', selectedAnswerElement);
    premiseEl.classList.add('has-answer');
    appState.currentMatching.userMatches[appState.currentMatching.setIndex][premiseId] = answerId;

    selectedAnswerElement.classList.remove('answer-selected');
    selectedAnswerElement = null;
}

function handleReturnAnswer(droppedAnswerEl) {
    const parentPremise = droppedAnswerEl.closest('.premise-drop-zone');
    const premiseId = parentPremise.dataset.premiseId;

    dom.matchingAnswersArea.appendChild(droppedAnswerEl);
    parentPremise.classList.remove('has-answer');
    
    delete appState.currentMatching.userMatches[appState.currentMatching.setIndex][premiseId];

    if (droppedAnswerEl === selectedAnswerElement) {
        selectedAnswerElement.classList.remove('answer-selected');
        selectedAnswerElement = null;
    }
}

function startMatchingTimer() {
    if (appState.currentMatching.timerInterval) {
        clearInterval(appState.currentMatching.timerInterval);
    }
    const timerState = appState.timers.matching;
    appState.currentMatching.timerInterval = setInterval(() => {
        timerState.timeLeft--;
        const minutes = Math.floor(timerState.timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timerState.timeLeft % 60).toString().padStart(2, '0');
        dom.matchingTimer.textContent = `${minutes}:${seconds}`;
        if (timerState.timeLeft <= 0) {
            endMatchingExam(true);
        }
    }, 1000);
}

/**
 * UPDATED: This function now also triggers the final score calculation.
 */
function checkCurrentSetAnswers() {
    appState.currentMatching.isReviewMode = true;
    removeClickListeners();

    const { sets, setIndex, userMatches } = appState.currentMatching;
    const currentSet = sets[setIndex];
    const currentMatches = userMatches[setIndex];

    dom.checkAnswersBtn.disabled = true;

    currentSet.premises.forEach(premise => {
        const dropZone = dom.matchingPremisesArea.querySelector(`[data-premise-id="${premise.uniqueId}"]`);
        const userDroppedAnswerId = currentMatches[premise.uniqueId];
        const droppedAnswerEl = dropZone.querySelector('.answer-clickable');

        if (userDroppedAnswerId === premise.uniqueId) {
            if (droppedAnswerEl) droppedAnswerEl.classList.add('correct-match');
        } else {
            if (droppedAnswerEl) droppedAnswerEl.classList.add('incorrect-match');
            
            const correctAnswer = currentSet.answers.find(ans => ans.uniqueId === premise.uniqueId);
            if (correctAnswer) {
                const correctAnswerEl = document.createElement('div');
                correctAnswerEl.className = 'correct-answer-reveal';
                correctAnswerEl.innerHTML = `<i class="fas fa-check-circle text-green-600 mr-2"></i> ${correctAnswer.CorrectAnswer}`;
                dropZone.appendChild(correctAnswerEl);
            }
        }
    });

    // After showing the review, automatically trigger the final score modal after a short delay
    setTimeout(() => {
        calculateAndShowFinalScore();
    }, 2000); // Wait 2 seconds for the user to see the review
}

function endMatchingExam(isTimeUp = false) {
    clearInterval(appState.currentMatching.timerInterval);
    removeClickListeners();

    if (isTimeUp) {
        // If time is up, force check the answers of the current (and final) set
        checkCurrentSetAnswers();
    } else {
        // If user clicks end, just calculate score directly
        calculateAndShowFinalScore();
    }
}

function calculateAndShowFinalScore() {
    // Prevent this from running multiple times
    if (document.getElementById('modal-title')?.textContent === 'Exam Complete!') {
        return;
    }

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
    
    logUserActivity({
        eventType: 'FinishMatchingQuiz',
        quizTitle: 'Matching Exam',
        score: finalScore,
        totalQuestions: appState.currentMatching.totalPremises
    });

    ui.showConfirmationModal(
        'Exam Complete!',
        `You scored ${finalScore} out of ${appState.currentMatching.totalPremises}.`,
        showMainMenuScreen
    );
}

function nextSet() {
    if (appState.currentMatching.setIndex < appState.currentMatching.sets.length - 1) {
        appState.currentMatching.isReviewMode = false;
        appState.currentMatching.setIndex++;
        renderCurrentSet();
        addClickListeners();
    }
}

function prevSet() {
    if (appState.currentMatching.setIndex > 0) {
        appState.currentMatching.isReviewMode = false;
        appState.currentMatching.setIndex--;
        renderCurrentSet();
        addClickListeners();
    }
}

function updateNavigationButtons() {
    const { setIndex, sets } = appState.currentMatching;
    dom.matchingPreviousSetBtn.style.visibility = setIndex === 0 ? 'hidden' : 'visible';
    dom.matchingNextSetBtn.style.visibility = setIndex === sets.length - 1 ? 'hidden' : 'visible';
    dom.checkAnswersBtn.style.visibility = setIndex === sets.length - 1 ? 'visible' : 'hidden';
    dom.checkAnswersBtn.disabled = false;
}

function restoreUserMatchesForCurrentSet() {
    const { setIndex, userMatches } = appState.currentMatching;
    const matchesForCurrentSet = userMatches[setIndex];

    for (const premiseId in matchesForCurrentSet) {
        const answerId = matchesForCurrentSet[premiseId];
        const answerEl = document.querySelector(`.answer-clickable[data-answer-id="${answerId}"]`);
        const premiseEl = dom.matchingPremisesArea.querySelector(`[data-premise-id="${premiseId}"]`);

        if (answerEl && premiseEl) {
             const placeholder = premiseEl.querySelector('.dropped-answer-placeholder');
            if(placeholder) {
                placeholder.insertAdjacentElement('beforebegin', answerEl);
            } else {
                premiseEl.appendChild(answerEl);
            }
            premiseEl.classList.add('has-answer');
        }
    }
}
