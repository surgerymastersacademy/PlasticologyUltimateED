// js/features/learningMode.js (FINAL VERSION v3.1)

import { fetchContentData } from '../api.js';
import { showScreen, showLoader, hideLoader, updateText } from '../ui.js';

let learningQuestions = [];
let currentLearningIndex = 0;

export async function initLearningMode() {
    // Search Handler
    document.getElementById('learning-search-btn').addEventListener('click', handleSearch);
    
    // Navigation Handlers
    document.getElementById('learning-next-btn').addEventListener('click', nextQuestion);
    document.getElementById('learning-previous-btn').addEventListener('click', prevQuestion);
    document.getElementById('end-learning-btn').addEventListener('click', () => showScreen('main-menu-container'));

    // Browse Buttons
    document.getElementById('learning-browse-by-chapter-btn').addEventListener('click', () => alert("Browse feature coming in v3.2")); 
    // You can implement browse logic similar to Quiz filters if needed
}

async function handleSearch() {
    const term = document.getElementById('learning-search-input').value.toLowerCase();
    const errorMsg = document.getElementById('learning-search-error');
    
    if (!term) {
        errorMsg.textContent = "Please enter a topic.";
        errorMsg.classList.remove('hidden');
        return;
    }
    errorMsg.classList.add('hidden');

    showLoader('loader');
    try {
        const data = await fetchContentData();
        if (!data || !data.questions) return;

        // Filter Questions
        learningQuestions = data.questions.filter(q => 
            (q.Question && q.Question.toLowerCase().includes(term)) ||
            (q.Tags && q.Tags.toLowerCase().includes(term))
        );

        if (learningQuestions.length > 0) {
            currentLearningIndex = 0;
            updateText('learning-title', `Study: "${term}"`);
            showScreen('learning-mode-viewer');
            renderLearningQuestion();
        } else {
            errorMsg.textContent = "No questions found for this topic.";
            errorMsg.classList.remove('hidden');
        }
    } catch (e) {
        console.error(e);
    } finally {
        hideLoader('loader');
    }
}

function renderLearningQuestion() {
    const q = learningQuestions[currentLearningIndex];
    const qText = document.getElementById('learning-question-text');
    const qImg = document.getElementById('learning-image-container');
    const answersDiv = document.getElementById('learning-answer-buttons');
    
    // Progress
    updateText('learning-progress-text', `Question ${currentLearningIndex + 1} of ${learningQuestions.length}`);
    updateText('learning-source-text', `${q.Source || ''} - ${q.Chapter || ''}`);

    // Content
    qText.innerHTML = q.Question;
    qImg.innerHTML = q.Image_URL ? `<img src="${q.Image_URL}" class="max-h-64 rounded shadow cursor-pointer" onclick="viewImage(this.src)">` : '';

    // Options (Immediate Feedback Logic)
    answersDiv.innerHTML = '';
    const options = [q.Option_A, q.Option_B, q.Option_C, q.Option_D];
    const correctChar = q.Correct_Answer.trim().toUpperCase(); // 'A'
    const correctIdx = correctChar.charCodeAt(0) - 65;

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'learning-answer-btn w-full text-left p-3 rounded border border-slate-200 mb-2 hover:bg-slate-50';
        btn.innerHTML = `<span class="font-bold">${String.fromCharCode(65+idx)}.</span> ${opt}`;
        
        btn.onclick = () => {
            // Show Result immediately
            if (idx === correctIdx) {
                btn.classList.add('correct', 'bg-green-100', 'border-green-500');
            } else {
                btn.classList.add('incorrect', 'bg-red-100', 'border-red-500');
                // Highlight correct one automatically
                answersDiv.children[correctIdx].classList.add('correct', 'bg-green-100', 'border-green-500');
            }
            
            // Show Rationale if exists
            if (q.Rationale && !document.getElementById('rationale-box')) {
                const ratDiv = document.createElement('div');
                ratDiv.id = 'rationale-box';
                ratDiv.className = 'mt-4 p-4 bg-blue-50 text-blue-900 rounded border-l-4 border-blue-500 text-sm animate-fadeIn';
                ratDiv.innerHTML = `<strong>💡 Explanation:</strong><br>${q.Rationale}`;
                answersDiv.appendChild(ratDiv);
            }
        };
        answersDiv.appendChild(btn);
    });
}

function nextQuestion() {
    if (currentLearningIndex < learningQuestions.length - 1) {
        currentLearningIndex++;
        renderLearningQuestion();
    }
}

function prevQuestion() {
    if (currentLearningIndex > 0) {
        currentLearningIndex--;
        renderLearningQuestion();
    }
}
