// js/features/matching.js (FINAL FIXED VERSION v3.1)

import { createJsonRequest, sendPostRequest, fetchContentData } from '../api.js';
import { showScreen, showLoader, hideLoader, showToast } from '../ui.js';
import { getCurrentUser } from '../state.js';

let matchingSets = [];
let currentSetIndex = 0;
let currentScore = 0;
let matchingTimer;
let timeLeft = 60;

export async function initMatching() {
    // Bind Event Listeners
    const startBtn = document.getElementById('start-matching-btn');
    if (startBtn) startBtn.addEventListener('click', startMatchingGame);
    
    const submitBtn = document.getElementById('matching-submit-btn');
    if (submitBtn) submitBtn.addEventListener('click', checkMatchingAnswers);

    const nextBtn = document.getElementById('matching-next-btn');
    if (nextBtn) nextBtn.addEventListener('click', nextMatchingSet);

    const endBtn = document.getElementById('end-matching-btn');
    if (endBtn) endBtn.addEventListener('click', endMatchingGame);
    
    const backBtn = document.getElementById('matching-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => showScreen('main-menu-container'));
}

async function startMatchingGame() {
    const setCountInput = document.getElementById('matching-set-count');
    const timerInput = document.getElementById('matching-timer-input');
    
    const setCount = parseInt(setCountInput ? setCountInput.value : 10) || 5;
    const timePerSet = parseInt(timerInput ? timerInput.value : 60) || 60;

    showLoader('loader'); // Ensure a generic loader exists in UI
    try {
        const data = await fetchContentData();
        
        // Logic: Extract pairs from Questions (Source vs Chapter) or specific "Matching" sheet if available.
        // Fallback logic: Create pairs from Questions to ensure game works.
        let pairs = [];
        
        if (data.questions && data.questions.length > 0) {
            // Create pairs: Premise = Question Start, Answer = Correct Answer
            // We shuffle questions first to get random pairs
            const shuffledQs = data.questions.sort(() => 0.5 - Math.random()).slice(0, setCount * 5);
            
            pairs = shuffledQs.map(q => ({
                id: q.UniqueID,
                premise: truncateText(q.Question, 60),
                answer: truncateText(q.Correct_Answer_Text || q.Option_A || "Answer", 40)
            }));
        }

        if (pairs.length < 5) {
            showToast("Not enough data to start matching.", "error");
            return;
        }

        // Divide into sets of 5
        matchingSets = [];
        for (let i = 0; i < pairs.length; i += 5) {
            matchingSets.push(pairs.slice(i, i + 5));
        }

        // Initialize Game State
        currentSetIndex = 0;
        currentScore = 0;
        timeLeft = timePerSet;
        
        showScreen('matching-game-container');
        loadMatchingSet();
        
    } catch (e) {
        console.error("Matching Start Error:", e);
        showToast("Failed to start Matching Game", "error");
    } finally {
        hideLoader('loader');
    }
}

function loadMatchingSet() {
    const set = matchingSets[currentSetIndex];
    const premisesArea = document.getElementById('matching-premises-area');
    const answersArea = document.getElementById('matching-answers-area');
    
    if (!premisesArea || !answersArea) return;

    premisesArea.innerHTML = '';
    answersArea.innerHTML = '';
    
    // Update Header Info
    const progressEl = document.getElementById('matching-progress');
    if(progressEl) progressEl.textContent = `Set ${currentSetIndex + 1}/${matchingSets.length}`;
    
    document.getElementById('matching-submit-btn').classList.remove('hidden');
    document.getElementById('matching-next-btn').classList.add('hidden');

    // 1. Render Premises (Left Side - Drop Zones)
    set.forEach((pair, idx) => {
        const card = document.createElement('div');
        card.className = 'premise-card bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-2';
        card.innerHTML = `
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">${pair.premise}</p>
            <div class="premise-drop-zone border-2 border-dashed border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900/50 h-10 flex items-center justify-center text-xs text-slate-400 transition-colors" 
                 data-correct="${pair.answer}" 
                 data-id="${pair.id}">
                 Drop Answer Here
            </div>
        `;
        premisesArea.appendChild(card);
    });

    // 2. Render Answers (Right Side - Draggables)
    // Shuffle answers so they don't align perfectly
    const shuffledAnswers = [...set].sort(() => 0.5 - Math.random());
    
    shuffledAnswers.forEach(pair => {
        const item = document.createElement('div');
        item.className = 'answer-draggable bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg cursor-grab active:cursor-grabbing shadow-sm mb-2 text-sm text-slate-700 dark:text-slate-200 font-medium';
        item.textContent = pair.answer;
        item.draggable = true;
        
        // Desktop Drag Events
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', pair.answer);
            item.classList.add('opacity-50');
        });
        item.addEventListener('dragend', () => item.classList.remove('opacity-50'));
        
        // Mobile Tap Events (Select -> Tap Zone)
        item.addEventListener('click', () => handleMobileSelect(item));
        
        answersArea.appendChild(item);
    });

    setupDropZones();
    startMatchingTimer();
}

// --- Interaction Logic ---

function setupDropZones() {
    document.querySelectorAll('.premise-drop-zone').forEach(zone => {
        // Desktop Drop
        zone.addEventListener('dragover', e => {
            e.preventDefault(); // Allow drop
            zone.classList.add('bg-blue-100', 'dark:bg-blue-900/50');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('bg-blue-100', 'dark:bg-blue-900/50');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('bg-blue-100', 'dark:bg-blue-900/50');
            const data = e.dataTransfer.getData('text/plain');
            fillZone(zone, data);
        });

        // Mobile Tap Drop
        zone.addEventListener('click', () => {
            const selected = document.querySelector('.answer-draggable.selected');
            if (selected) {
                fillZone(zone, selected.textContent);
                selected.classList.remove('selected', 'ring-2', 'ring-blue-500');
                // Optional: Hide selected item after placing
                selected.style.display = 'none'; 
            }
        });
    });
}

function handleMobileSelect(el) {
    // Deselect others
    document.querySelectorAll('.answer-draggable').forEach(a => {
        a.classList.remove('selected', 'ring-2', 'ring-blue-500');
    });
    // Select current
    el.classList.add('selected', 'ring-2', 'ring-blue-500');
}

function fillZone(zone, text) {
    // If zone already has text, return old text to pool (advanced logic skipped for simplicity)
    zone.textContent = text;
    zone.classList.add('text-blue-700', 'dark:text-blue-300', 'font-bold', 'border-solid', 'border-blue-300');
    zone.classList.remove('text-slate-400', 'border-dashed');
    
    // Find and hide the source draggable (visual feedback)
    const answers = document.querySelectorAll('.answer-draggable');
    answers.forEach(a => {
        if (a.textContent === text && a.style.display !== 'none') {
            a.style.display = 'none';
        }
    });
}

// --- Game Logic ---

function checkMatchingAnswers() {
    clearInterval(matchingTimer);
    
    let setScore = 0;
    const zones = document.querySelectorAll('.premise-drop-zone');
    
    zones.forEach(zone => {
        const userAns = zone.textContent.trim();
        const correctAns = zone.dataset.correct;
        
        if (userAns === correctAns) {
            zone.classList.add('bg-green-100', 'dark:bg-green-900/30', 'border-green-500', 'text-green-700');
            setScore++;
        } else {
            zone.classList.add('bg-red-100', 'dark:bg-red-900/30', 'border-red-500', 'text-red-700');
            
            // Show correction
            const correction = document.createElement('div');
            correction.className = 'text-xs text-green-600 dark:text-green-400 mt-1 font-bold';
            correction.textContent = `✓ ${correctAns}`;
            zone.parentNode.appendChild(correction);
        }
    });

    currentScore += setScore;
    const scoreEl = document.getElementById('matching-score');
    if(scoreEl) scoreEl.textContent = `Score: ${currentScore}`;
    
    document.getElementById('matching-submit-btn').classList.add('hidden');
    
    // Proceed logic
    if (currentSetIndex < matchingSets.length - 1) {
        document.getElementById('matching-next-btn').classList.remove('hidden');
    } else {
        setTimeout(endMatchingGame, 1500);
    }
}

function nextMatchingSet() {
    currentSetIndex++;
    loadMatchingSet();
}

function startMatchingTimer() {
    clearInterval(matchingTimer);
    // Reset timer for each set? Or global? Assuming per set for now based on init logic
    let t = timeLeft; 
    const display = document.getElementById('matching-timer');
    
    matchingTimer = setInterval(() => {
        t--;
        if(display) display.textContent = `00:${t.toString().padStart(2, '0')}`;
        if (t <= 0) {
            checkMatchingAnswers();
        }
    }, 1000);
}

async function endMatchingGame() {
    clearInterval(matchingTimer);
    alert(`🎉 Game Over!\nYour Total Score: ${currentScore}`);
    showScreen('main-menu-container');

    const user = getCurrentUser();
    if (user) {
        try {
            await sendPostRequest({
                eventType: 'FinishMatchingQuiz',
                userId: user.UniqueID,
                userName: user.Name,
                score: currentScore,
                totalSets: matchingSets.length,
                details: "Matching Game Session"
            });
        } catch (e) {
            console.warn("Failed to save matching score", e);
        }
    }
}

function truncateText(str, n) {
    return (str.length > n) ? str.slice(0, n-1) + '...' : str;
}
