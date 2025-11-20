// js/features/quiz.js (FINAL VERSION v3.1)

import { createJsonRequest, sendPostRequest, fetchContentData } from '../api.js';
import { showScreen, showLoader, hideLoader, showToast, updateText } from '../ui.js';
import { getCurrentUser } from '../state.js';

let currentQuestions = [];
let currentQuestionIndex = 0;
let quizTimerInterval;
let userAnswers = []; 

// الدالة التي يبحث عنها main.js
export async function initQuiz() {
    // أزرار البدء
    const startMockBtn = document.getElementById('start-mock-btn');
    if (startMockBtn) startMockBtn.addEventListener('click', startMockExam);

    const startSimBtn = document.getElementById('start-simulation-btn');
    if (startSimBtn) startSimBtn.addEventListener('click', startSimulationMode);

    // أزرار التحكم داخل الامتحان
    const nextBtn = document.getElementById('next-skip-btn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

    const prevBtn = document.getElementById('previous-btn');
    if (prevBtn) prevBtn.addEventListener('click', prevQuestion);

    const endBtn = document.getElementById('end-quiz-btn');
    if (endBtn) endBtn.addEventListener('click', endQuiz);

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.addEventListener('click', () => showScreen('main-menu-container'));
    
    const homeBtn = document.getElementById('results-home-btn');
    if (homeBtn) homeBtn.addEventListener('click', () => showScreen('main-menu-container'));

    // تحميل الفلاتر (Sources & Chapters)
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
        div.className = 'flex items-center space-x-2 mb-1';
        div.innerHTML = `<input type="checkbox" value="${item}" class="form-checkbox h-4 w-4 text-blue-600"><span class="text-sm text-slate-700 dark:text-slate-300 ml-2">${item}</span>`;
        container.appendChild(div);
    });
}

// --- EXAM LOGIC ---

async function startMockExam() {
    const countInput = document.getElementById('mock-q-count');
    const count = parseInt(countInput ? countInput.value : 10) || 10;
    
    const timerInput = document.getElementById('custom-timer-input');
    const timePerQ = parseInt(timerInput ? timerInput.value : 60) || 60;

    const selectedSources = getSelectedValues('source-select-mock');
    const selectedChapters = getSelectedValues('chapter-select-mock');

    startQuizSession(count, timePerQ, selectedSources, selectedChapters, "Mock Exam");
}

async function startSimulationMode() {
    const selectedSources = getSelectedValues('source-select-sim');
    const selectedChapters = getSelectedValues('chapter-select-sim');
    // 100 Questions, 72 seconds each (120 mins total)
    startQuizSession(100, 72, selectedSources, selectedChapters, "Simulation Mode");
}

async function startQuizSession(count, timePerQ, sources, chapters, title) {
    showLoader('loader');
    try {
        const data = await fetchContentData();
        let questions = data.questions || [];

        // Filter logic
        if (sources.length > 0) questions = questions.filter(q => sources.includes(q.Source));
        if (chapters.length > 0) questions = questions.filter(q => chapters.includes(q.Chapter));

        if (questions.length === 0) {
            showToast("No questions found with these filters.", "error");
            return;
        }

        // Randomize and Slice
        questions = questions.sort(() => 0.5 - Math.random()).slice(0, Math.min(count, questions.length));

        // Setup State
        currentQuestions = questions;
        currentQuestionIndex = 0;
        userAnswers = new Array(questions.length).fill(null);

        // UI Setup
        updateText('quiz-title', title);
        updateText('total-questions', questions.length);
        document.getElementById('results-container').classList.add('hidden');
        document.getElementById('question-container').classList.remove('hidden');
        document.getElementById('controls-container').classList.remove('hidden');

        showScreen('quiz-container');
        renderQuestion();
        startTimer(questions.length * timePerQ);

    } catch (e) {
        console.error(e);
        showToast("Error starting quiz", "error");
    } finally {
        hideLoader('loader');
    }
}

function getSelectedValues(containerId) {
    const container = document.getElementById(containerId);
    if(!container) return [];
    return Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
}

function renderQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    if (!q) return;

    updateText('score-progress-text', `${currentQuestionIndex + 1}/${currentQuestions.length}`);
    updateText('source-text', `${q.Source || ''} - ${q.Chapter || ''}`);
    
    // Question Text & Image
    const qText = document.getElementById('question-text');
    qText.innerHTML = q.Question;
    
    const qImg = document.getElementById('question-image-container');
    qImg.innerHTML = q.Image_URL ? `<img src="${q.Image_URL}" class="max-h-64 rounded shadow cursor-pointer" onclick="viewImage(this.src)">` : '';

    // Options
    const optionsContainer = document.getElementById('answer-buttons-quiz');
    optionsContainer.innerHTML = '';
    const options = [q.Option_A, q.Option_B, q.Option_C, q.Option_D];

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn w-full text-left mb-2 p-3 rounded border hover:bg-slate-50';
        // Highlight if selected previously
        if (userAnswers[currentQuestionIndex] === idx) {
            btn.classList.add('user-choice', 'bg-blue-50', 'border-blue-500');
        }
        
        btn.innerHTML = `<span class="font-bold mr-2">${String.fromCharCode(65+idx)}.</span> ${opt || ''}`;
        btn.onclick = () => selectAnswer(idx, btn);
        optionsContainer.appendChild(btn);
    });

    // Nav Buttons
    const prevBtn = document.getElementById('previous-btn');
    if(prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    
    const nextBtn = document.getElementById('next-skip-btn');
    if(nextBtn) nextBtn.textContent = currentQuestionIndex === currentQuestions.length - 1 ? 'Finish' : 'Next';
}

function selectAnswer(idx, btn) {
    userAnswers[currentQuestionIndex] = idx;
    // UI Feedback
    const all = document.querySelectorAll('#answer-buttons-quiz .answer-btn');
    all.forEach(b => b.classList.remove('user-choice', 'bg-blue-50', 'border-blue-500'));
    btn.classList.add('user-choice', 'bg-blue-50', 'border-blue-500');
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

function startTimer(seconds) {
    clearInterval(quizTimerInterval);
    let remaining = seconds;
    const display = document.getElementById('timer');
    
    quizTimerInterval = setInterval(() => {
        remaining--;
        if (remaining < 0) {
            endQuiz();
            return;
        }
        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        if(display) display.textContent = `${m}:${s}`;
    }, 1000);
}

async function endQuiz() {
    clearInterval(quizTimerInterval);
    
    // Calculate Score
    let correctCount = 0;
    const details = currentQuestions.map((q, i) => {
        const userIdx = userAnswers[i];
        const correctChar = (q.Correct_Answer || 'A').trim().toUpperCase();
        const correctIdx = correctChar.charCodeAt(0) - 65;
        const isCorrect = userIdx === correctIdx;
        if (isCorrect) correctCount++;
        
        return {
            qID: q.UniqueID,
            ans: userIdx !== null ? String.fromCharCode(65 + userIdx) : 'No Answer',
            isCorrect: isCorrect
        };
    });

    // Update UI
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
            
            // Update local score immediately
            user.QuizScore = (parseInt(user.QuizScore) || 0) + correctCount;
            localStorage.setItem('plastico_user', JSON.stringify(user));
            
        } catch (e) {
            console.error("Save Score Error:", e);
        }
    }
}
