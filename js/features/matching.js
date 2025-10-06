// V.1.6 - 2025-10-06
// js/features/matching.js

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { showMainMenuScreen } from '../main.js';
import { logUserActivity } from '../api.js';

let draggedAnswer = null; 

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

    let filteredQuestions = appState.allQuestions.filter(q => q.question && q.CorrectAnswer);

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
        // FIX: Ensure we use the now-consistent 'question' and 'CorrectAnswer' keys
        const premises = setQuestions.map(q => ({ question: q.question, uniqueId: q.UniqueID }));
        let answers = setQuestions.map(q => ({ CorrectAnswer: q.CorrectAnswer, uniqueId: q.UniqueID }));
        
        answers.sort(() => Math.random() - 0.5);

        examSets.push({ premises, answers });
    }

    const totalTime = setCount * timePerSet;
    launchMatchingExam(`Custom Matching Exam`, examSets, totalTime);
}

function launchMatchingExam(title, sets, totalTime) {
    console.log("Data Sent to UI:", sets[0]); // Debugging: Check data before rendering
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
    addDragDropListeners();

    dom.endMatchingBtn.onclick = () => endMatchingExam(false);
    dom.checkAnswersBtn.onclick = checkCurrentSetAnswers;
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

// ... (The rest of the file from startMatchingTimer() to the end remains unchanged)
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

function addDragDropListeners() {
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragend', handleDragEnd);
}

function removeDragDropListeners() {
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('dragleave', handleDragLeave);
    document.removeEventListener('drop', handleDrop);
    document.removeEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
    if (e.target.classList.contains('answer-draggable')) {
        draggedAnswer = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
        const parentPremise = e.target.closest('.premise-drop-zone');
        if (parentPremise) {
            const premiseId = parentPremise.dataset.premiseId;
            delete appState.currentMatching.userMatches[appState.currentMatching.setIndex][premiseId];
            parentPremise.classList.remove('has-answer');
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

        const existingAnswer = dropZone.querySelector('.answer-draggable');
        if (existingAnswer) {
            dom.matchingAnswersArea.appendChild(existingAnswer);
        }
        
        const placeholder = dropZone.querySelector('.dropped-answer-placeholder');
        if(placeholder) {
            placeholder.insertAdjacentElement('beforebegin', draggedAnswer);
        } else {
            dropZone.appendChild(draggedAnswer);
        }
        dropZone.classList.add('has-answer');

        const premiseId = dropZone.dataset.premiseId;
        const answerId = draggedAnswer.dataset.answerId;
        appState.currentMatching.userMatches[appState.currentMatching.setIndex][premiseId] = answerId;
    }
}

function handleDragEnd() {
    if (draggedAnswer) {
        draggedAnswer.classList.remove('dragging');
        draggedAnswer = null;
    }
}

function checkCurrentSetAnswers() {
    const { sets, setIndex, userMatches } = appState.currentMatching;
    const currentSet = sets[setIndex];
    const currentMatches = userMatches[setIndex];

    dom.matchingContainer.querySelectorAll('.answer-draggable').forEach(el => el.draggable = false);
    dom.matchingContainer.querySelectorAll('.premise-drop-zone').forEach(el => el.classList.remove('drag-over'));
    dom.checkAnswersBtn.disabled = true;

    currentSet.premises.forEach(premise => {
        const dropZone = dom.matchingPremisesArea.querySelector(`[data-premise-id="${premise.uniqueId}"]`);
        const userDroppedAnswerId = currentMatches[premise.uniqueId];
        const droppedAnswerEl = dropZone.querySelector('.answer-draggable');

        if (userDroppedAnswerId === premise.uniqueId) {
            if (droppedAnswerEl) {
                droppedAnswerEl.classList.add('correct-match');
            }
        } else {
            if (droppedAnswerEl) {
                droppedAnswerEl.classList.add('incorrect-match');
            }

            const correctAnswer = currentSet.answers.find(ans => ans.uniqueId === premise.uniqueId);
            if (correctAnswer) {
                const correctAnswerEl = document.createElement('div');
                correctAnswerEl.className = 'correct-answer-reveal';
                correctAnswerEl.innerHTML = `<i class="fas fa-check-circle text-green-600 mr-2"></i> ${correctAnswer.CorrectAnswer}`;
                dropZone.appendChild(correctAnswerEl);
            }
        }
    });
}

function endMatchingExam(isTimeUp = false) {
    clearInterval(appState.currentMatching.timerInterval);
    removeDragDropListeners();

    if (isTimeUp && !appState.currentMatching.isReviewMode) {
        checkCurrentSetAnswers();
        ui.showConfirmationModal(
            "Time's up!",
            `The exam has ended. Let's see your final score.`,
            () => calculateAndShowFinalScore()
        );
    } else {
        calculateAndShowFinalScore();
    }
}

function calculateAndShowFinalScore() {
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
        appState.currentMatching.setIndex++;
        renderCurrentSet();
    }
}

function prevSet() {
    if (appState.currentMatching.setIndex > 0) {
        appState.currentMatching.setIndex--;
        renderCurrentSet();
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
        const answerEl = document.querySelector(`.answer-draggable[data-answer-id="${answerId}"]`);
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
