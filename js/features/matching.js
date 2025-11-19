// js/features/matching.js

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logUserActivity } from '../api.js';
import { populateFilterOptions } from '../ui.js';
import { formatTime } from '../utils.js';

// --- Initialization & Menu ---

export function showMatchingMenu() {
    ui.showScreen(dom.matchingContainer);
    dom.matchingMenuContainer.classList.remove('hidden');
    dom.matchingGameContainer.classList.add('hidden');
    appState.navigationHistory.push(showMatchingMenu);

    // Populate filters (similar to QBank)
    populateFilters();
}

function populateFilters() {
    const allQuestions = appState.allQuestions;
    
    const chapters = [...new Set(allQuestions.map(q => q.chapter || 'Uncategorized'))].sort();
    const chapterCounts = allQuestions.reduce((acc, q) => {
        acc[q.chapter || 'Uncategorized'] = (acc[q.chapter || 'Uncategorized'] || 0) + 1;
        return acc;
    }, {});
    populateFilterOptions(dom.chapterSelectMatching, chapters, 'match-chapter', chapterCounts);

    const sources = [...new Set(allQuestions.map(q => q.source || 'Uncategorized'))].sort();
    const sourceCounts = allQuestions.reduce((acc, q) => {
        acc[q.source || 'Uncategorized'] = (acc[q.source || 'Uncategorized'] || 0) + 1;
        return acc;
    }, {});
    populateFilterOptions(dom.sourceSelectMatching, sources, 'match-source', sourceCounts);
}

// --- Game Logic ---

export function handleStartMatchingExam() {
    dom.matchingError.classList.add('hidden');
    
    // 1. Get Settings
    const setCount = parseInt(dom.matchingSetCountInput.value) || 10;
    const timePerSet = parseInt(dom.matchingTimerInput.value) || 60;
    
    // 2. Filter Questions
    const selectedChapters = [...dom.chapterSelectMatching.querySelectorAll('input:checked')].map(el => el.value);
    const selectedSources = [...dom.sourceSelectMatching.querySelectorAll('input:checked')].map(el => el.value);
    
    let pool = appState.allQuestions;
    if (selectedChapters.length > 0) pool = pool.filter(q => selectedChapters.includes(q.chapter));
    if (selectedSources.length > 0) pool = pool.filter(q => selectedSources.includes(q.source));

    // 3. Validate Pool Size (Need at least 5 questions per set)
    if (pool.length < 5) {
        dom.matchingError.textContent = `Not enough questions. Found ${pool.length}, need at least 5.`;
        dom.matchingError.classList.remove('hidden');
        return;
    }

    // 4. Create Sets
    // Shuffle pool
    pool = pool.sort(() => Math.random() - 0.5);
    
    const maxPossibleSets = Math.floor(pool.length / 5);
    const finalSetCount = Math.min(setCount, maxPossibleSets);
    
    if (finalSetCount < 1) {
         dom.matchingError.textContent = `Selection too restrictive.`;
         dom.matchingError.classList.remove('hidden');
         return;
    }

    const examSets = [];
    for (let i = 0; i < finalSetCount; i++) {
        const startIndex = i * 5;
        const setQuestions = pool.slice(startIndex, startIndex + 5);
        
        // We need to verify these questions actually HAVE correct answers text
        const preparedSet = setQuestions.map(q => {
            const correctOpt = q.answerOptions.find(o => o.isCorrect);
            return {
                id: q.UniqueID,
                question: q.question,
                answerText: correctOpt ? correctOpt.text : "Answer Error",
                answerId: q.UniqueID // In matching, Answer ID matches Question ID
            };
        });

        examSets.push({
            premises: preparedSet, // Questions
            answers: [...preparedSet].sort(() => Math.random() - 0.5) // Shuffled Answers
        });
    }

    // 5. Initialize State
    appState.currentMatching = {
        allSets: examSets,
        currentSetIndex: 0,
        userMatches: {},
        score: 0,
        timerInterval: null,
        timePerSet: timePerSet,
        selectedAnswerElement: null
    };

    // 6. Start UI
    dom.matchingMenuContainer.classList.add('hidden');
    dom.matchingGameContainer.classList.remove('hidden');
    startSet();
}

function startSet() {
    const state = appState.currentMatching;
    const currentSet = state.allSets[state.currentSetIndex];
    
    // Reset per-set state
    state.userMatches = {};
    state.selectedAnswerElement = null;
    clearInterval(state.timerInterval);
    
    // Update Header
    dom.matchingProgress.textContent = `Set ${state.currentSetIndex + 1}/${state.allSets.length}`;
    dom.matchingScore.textContent = `Score: ${state.score}`;
    
    // Controls
    dom.matchingSubmitBtn.classList.remove('hidden');
    dom.matchingNextBtn.classList.add('hidden');

    // Render DOM
    renderGameField(currentSet);

    // Start Timer
    let timeLeft = state.timePerSet;
    dom.matchingTimer.textContent = formatTime(timeLeft);
    state.timerInterval = setInterval(() => {
        timeLeft--;
        dom.matchingTimer.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(state.timerInterval);
            checkCurrentSetAnswers(true); // Auto submit on timeout
        }
    }, 1000);
}

function renderGameField(set) {
    dom.matchingPremisesArea.innerHTML = '';
    dom.matchingAnswersArea.innerHTML = '';

    // Render Premises (Drop Zones)
    set.premises.forEach(item => {
        const card = document.createElement('div');
        card.className = 'premise-card';
        card.innerHTML = `
            <div class="premise-text">${item.question}</div>
            <div class="premise-drop-zone" data-premise-id="${item.id}">
                <span class="text-slate-400 text-sm pointer-events-none">Tap an answer, then tap here</span>
            </div>
        `;
        
        // Add click listener to drop zone
        const dropZone = card.querySelector('.premise-drop-zone');
        dropZone.addEventListener('click', () => handlePremiseClick(dropZone, item.id));
        
        dom.matchingPremisesArea.appendChild(card);
    });

    // Render Answers (Clickable)
    set.answers.forEach(item => {
        createAnswerElement(item, dom.matchingAnswersArea);
    });
}

function createAnswerElement(item, parent) {
    const ansDiv = document.createElement('div');
    ansDiv.className = 'answer-draggable';
    ansDiv.textContent = item.answerText;
    ansDiv.dataset.answerId = item.answerId;
    
    ansDiv.addEventListener('click', (e) => handleAnswerClick(e.target));
    
    parent.appendChild(ansDiv);
}

// --- Interaction Logic ---

function handleAnswerClick(element) {
    const state = appState.currentMatching;
    
    // If clicking an answer already inside a premise -> Return it to pool
    if (element.parentElement.classList.contains('premise-drop-zone')) {
        const premiseId = element.parentElement.dataset.premiseId;
        delete state.userMatches[premiseId]; // Remove match record
        dom.matchingAnswersArea.appendChild(element); // Move back to pool
        return;
    }

    // Normal selection from pool
    if (state.selectedAnswerElement) {
        state.selectedAnswerElement.classList.remove('answer-selected');
    }
    
    state.selectedAnswerElement = element;
    element.classList.add('answer-selected');
}

function handlePremiseClick(dropZone, premiseId) {
    const state = appState.currentMatching;
    
    if (!state.selectedAnswerElement) return; // No answer selected
    
    // Check if zone already has an answer
    if (dropZone.children.length > 0 && dropZone.children[0].classList.contains('answer-draggable')) {
        // Move existing answer back to pool
        const existing = dropZone.children[0];
        dom.matchingAnswersArea.appendChild(existing);
    }

    // Move selected answer to this zone
    dropZone.innerHTML = ''; // Remove placeholder text
    dropZone.appendChild(state.selectedAnswerElement);
    
    // Record Match
    state.userMatches[premiseId] = state.selectedAnswerElement.dataset.answerId;
    
    // Cleanup Selection
    state.selectedAnswerElement.classList.remove('answer-selected');
    state.selectedAnswerElement = null;
}

// --- Grading & Navigation ---

export function checkCurrentSetAnswers(isTimeUp = false) {
    const state = appState.currentMatching;
    clearInterval(state.timerInterval);
    
    // Lock Interface
    dom.matchingSubmitBtn.classList.add('hidden');
    dom.matchingNextBtn.classList.remove('hidden');
    
    // Disable clicks
    const answers = document.querySelectorAll('.answer-draggable');
    answers.forEach(a => a.style.pointerEvents = 'none');
    const zones = document.querySelectorAll('.premise-drop-zone');
    zones.forEach(z => z.style.pointerEvents = 'none');

    // Check Matches
    const currentSet = state.allSets[state.currentSetIndex];
    
    currentSet.premises.forEach(premise => {
        const zone = document.querySelector(`.premise-drop-zone[data-premise-id="${premise.id}"]`);
        const userAnswerId = state.userMatches[premise.id];
        
        // Logic: In this matching format, PremiseID should equal AnswerID for a correct match
        const isCorrect = userAnswerId && String(userAnswerId) === String(premise.id);
        
        if (isCorrect) {
            zone.classList.add('correct-match');
            state.score++;
        } else {
            zone.classList.add('incorrect-match');
            // Show Correct Answer
            const reveal = document.createElement('div');
            reveal.className = 'correct-answer-reveal';
            reveal.innerHTML = `<i class="fas fa-check mr-1"></i> Correct: ${premise.answerText}`;
            zone.parentElement.appendChild(reveal);
        }
    });

    dom.matchingScore.textContent = `Score: ${state.score}`;
}

export function handleNextMatchingSet() {
    const state = appState.currentMatching;
    if (state.currentSetIndex < state.allSets.length - 1) {
        state.currentSetIndex++;
        startSet();
    } else {
        endMatchingGame();
    }
}

function endMatchingGame() {
    const state = appState.currentMatching;
    clearInterval(state.timerInterval);
    
    // Log Result
    logUserActivity({
        eventType: 'FinishMatchingQuiz',
        score: state.score,
        totalSets: state.allSets.length,
        details: `Completed ${state.allSets.length} sets. Final Score: ${state.score}`
    });

    ui.showConfirmationModal('Test Complete', `You scored ${state.score} points!`, () => {
        dom.modalBackdrop.classList.add('hidden');
        showMatchingMenu();
    });
}
