// js/features/quiz.js (FINAL VERSION v3.1)

import { createJsonRequest, sendPostRequest, fetchContentData } from '../api.js';
import { showScreen, showLoader, hideLoader, showToast, updateText } from '../ui.js';
import { getCurrentUser } from '../state.js';

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizTimerInterval;
let timeElapsed = 0;
let userAnswers = []; // To track answers for review/logging

export async function initQuiz() {
    // Setup Event Listeners for Quiz Selection
    const startMockBtn = document.getElementById('start-mock-btn');
    if (startMockBtn) startMockBtn.addEventListener('click', startMockExam);

    const startSimBtn = document.getElementById('start-simulation-btn');
    if (startSimBtn) startSimBtn.addEventListener('click', startSimulationMode);

    // Setup Quiz Navigation Controls
    document.getElementById('next-skip-btn').addEventListener('click', nextQuestion);
    document.getElementById('previous-btn').addEventListener('click', prevQuestion);
    document.getElementById('end-quiz-btn').addEventListener('click', endQuiz);
    document.getElementById('restart-btn').addEventListener('click', () => {
        showScreen('main-menu-container');
    });

    // Load Filters (Sources/Chapters) for Custom Exams
    loadQuizFilters();
}

async function loadQuizFilters() {
    try {
        const data = await fetchContentData();
        if (!data || !data.questions) return;

        const questions = data.questions;
        const sources = [...new Set(questions.map(q => q.Source).filter(Boolean))].sort();
        const chapters = [...new Set(questions.map(q => q.Chapter).filter(Boolean))].sort();

        populateFilter('source-select-mock', sources);
        populateFilter('chapter-select-mock', chapters);
        populateFilter('source-select-sim', sources);
        populateFilter('chapter-select-sim', chapters);
        
    } catch (e) {
        console.warn("Failed to load quiz filters", e);
    }
}

function populateFilter(elementId, items) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.innerHTML = `<label class="flex items-center space-x-2"><input type="checkbox" value="${item}" class="form-checkbox"><span>${item}</span></label>`;
        container.appendChild(div);
    });
}

// --- EXAM MODES ---

async function startMockExam() {
    const countInput = document.getElementById('mock-q-count');
    const count = parseInt(countInput.value) || 10;
    const timerInput = document.getElementById('custom-timer-input');
    const timePerQ = parseInt(timerInput.value) || 60; // seconds

    // Get Filters
    const selectedSources = getSelectedValues('source-select-mock');
    const selectedChapters = getSelectedValues('chapter-select-mock');

    startQuizSession(count, timePerQ, selectedSources, selectedChapters, "Mock Exam");
}

async function startSimulationMode() {
    // Hardcoded Simulation Rules: 100 Qs, 120 Mins (72s/Q)
    const selectedSources = getSelectedValues('source-select-sim');
    const selectedChapters = getSelectedValues('chapter-select-sim');
    
    startQuizSession(100, 72, selectedSources, selectedChapters, "Simulation Mode");
}

async function startQuizSession(count, timePerQ, sources, chapters, title) {
    showLoader('loader');
    try {
        const data = await fetchContentData();
        let questions = data.questions;

        // Filter
        if (sources.length > 0) questions = questions.filter(q => sources.includes(q.Source));
        if (chapters.length > 0) questions = questions.filter(q => chapters.includes(q.Chapter));

        if (questions.length === 0) {
            showToast("No questions found with these filters.", "error");
            hideLoader('loader');
            return;
        }

        // Shuffle & Slice
        questions = questions.sort(() => 0.5 - Math.random()).slice(0, Math.min(count, questions.length));

        // Init State
        currentQuestions = questions;
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = new Array(questions.length).fill(null);
        timeElapsed = 0;

        // Setup UI
        updateText('quiz-title', title);
        updateText('total-questions', questions.length);
        document.getElementById('results-container').classList.add('hidden');
        document.getElementById('question-container').classList.remove('hidden');
        document.getElementById('controls-container').classList.remove('hidden');

        // Start Timer
        startTimer(questions.length * timePerQ);

        // Show First Question
        showScreen('quiz-container');
        renderQuestion();

    } catch (e) {
        console.error(e);
        showToast("Failed to start quiz", "error");
    } finally {
        hideLoader('loader');
    }
}

function getSelectedValues(containerId) {
    const container = document.getElementById(containerId);
    if(!container) return [];
    return Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
}

// --- GAMEPLAY ---

function renderQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    const qText = document.getElementById('question-text');
    const qImg = document.getElementById('question-image-container');
    const optionsContainer = document.getElementById('answer-buttons-quiz');
    const sourceText = document.getElementById('source-text');

    // Progress
    updateText('score-progress-text', `${currentQuestionIndex + 1}/${currentQuestions.length}`);
    
    // Content
    qText.innerHTML = q.Question; // Allow HTML
    sourceText.textContent = `${q.Source || 'General'} - ${q.Chapter || ''}`;
    
    // Image
    qImg.innerHTML = '';
    if (q.Image_URL) {
        qImg.innerHTML = `<img src="${q.Image_URL}" class="max-h-64 rounded-lg shadow-md cursor-pointer" onclick="viewImage(this.src)">`;
    }

    // Options
    optionsContainer.innerHTML = '';
    const options = [q.Option_A, q.Option_B, q.Option_C, q.Option_D]; // Assuming 4 options
    
    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn text-left';
        btn.innerHTML = `<span class="font-bold mr-2">${String.fromCharCode(65+idx)}.</span> ${opt}`;
        
        // Check if already answered
        if (userAnswers[currentQuestionIndex] === idx) {
            btn.classList.add('user-choice', 'bg-blue-50');
        }

        btn.onclick = () => selectAnswer(idx, btn);
        optionsContainer.appendChild(btn);
    });

    // Update Navigation Buttons
    document.getElementById('previous-btn').disabled = currentQuestionIndex === 0;
    document.getElementById('next-skip-btn').textContent = currentQuestionIndex === currentQuestions.length - 1 ? 'Finish' : 'Next';
}

function selectAnswer(optionIndex, btnElement) {
    // Save answer
    userAnswers[currentQuestionIndex] = optionIndex;

    // Visual Feedback
    const buttons = document.querySelectorAll('#answer-buttons-quiz .answer-btn');
    buttons.forEach(b => b.classList.remove('user-choice', 'bg-blue-50'));
    btnElement.classList.add('user-choice', 'bg-blue-50');
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        endQuiz();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

// --- TIMER & SCORING ---

function startTimer(totalSeconds) {
    clearInterval(quizTimerInterval);
    let remaining = totalSeconds;
    const timerDisplay = document.getElementById('timer');
    
    quizTimerInterval = setInterval(() => {
        remaining--;
        timeElapsed++;
        
        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;

        if (remaining <= 0) {
            endQuiz();
        }
    }, 1000);
}

async function endQuiz() {
    clearInterval(quizTimerInterval);
    
    // Calculate Score
    let correctCount = 0;
    const details = [];

    currentQuestions.forEach((q, idx) => {
        const userAnsIdx = userAnswers[idx];
        const correctAnsChar = q.Correct_Answer.trim().toUpperCase(); // e.g., "A"
        const correctAnsIdx = correctAnsChar.charCodeAt(0) - 65; // 0 for A, 1 for B...
        
        const isCorrect = userAnsIdx === correctAnsIdx;
        if (isCorrect) correctCount++;

        details.push({
            qID: q.UniqueID,
            ans: userAnsIdx !== null ? String.fromCharCode(65 + userAnsIdx) : 'No Answer',
            isCorrect: isCorrect
        });
    });

    // Show Results
    document.getElementById('question-container').classList.add('hidden');
    document.getElementById('controls-container').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    
    updateText('score-text', correctCount);
    
    // Save to Server
    const user = getCurrentUser();
    if (user) {
        try {
            await sendPostRequest({
                eventType: 'FinishQuiz',
                userId: user.UniqueID,
                userName: user.Name,
                quizTitle: document.getElementById('quiz-title').textContent,
                score: correctCount,
                totalQuestions: currentQuestions.length,
                details: JSON.stringify(details)
            });
            
            // Update Local Score (Optimistic)
            const newTotal = (parseInt(user.QuizScore) || 0) + correctCount;
            user.QuizScore = newTotal;
            localStorage.setItem('plastico_user', JSON.stringify(user));
            
        } catch (e) {
            console.error("Failed to save quiz result", e);
        }
    }
}

// Helper for Image Modal (make global)
window.viewImage = (src) => {
    const modal = document.getElementById('image-viewer-modal');
    const img = document.getElementById('modal-image');
    img.src = src;
    modal.classList.remove('hidden');
    document.getElementById('image-viewer-close-btn').onclick = () => modal.classList.add('hidden');
};
