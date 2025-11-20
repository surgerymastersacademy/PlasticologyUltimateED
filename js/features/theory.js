// js/features/theory.js (FINAL VERSION v3.1)

import { createJsonRequest, sendPostRequest, fetchContentData } from '../api.js';
import { showScreen, showLoader, hideLoader, updateText } from '../ui.js';
import { getCurrentUser } from '../state.js';

let theoryQuestions = [];
let currentTheoryIndex = 0;

export async function initTheory() {
    document.getElementById('theory-search-btn').addEventListener('click', searchTheory);
    document.getElementById('theory-back-btn').addEventListener('click', () => showScreen('main-menu-container'));
    document.getElementById('theory-end-btn').addEventListener('click', () => showScreen('theory-container')); // Back to menu
    
    // Viewer Controls
    document.getElementById('theory-next-btn').addEventListener('click', nextTheory);
    document.getElementById('theory-prev-btn').addEventListener('click', prevTheory);
    document.getElementById('theory-show-answer-btn').addEventListener('click', () => {
        document.getElementById('theory-answer-container').classList.remove('hidden');
    });
}

async function searchTheory() {
    const term = document.getElementById('theory-search-input').value.toLowerCase();
    
    showLoader('loader'); // Generic loader
    try {
        const data = await fetchContentData(); // Use smart fetch
        if (!data || !data.theoryQuestions) return;

        theoryQuestions = data.theoryQuestions.filter(q => 
            q.Question_Text && q.Question_Text.toLowerCase().includes(term)
        );

        if (theoryQuestions.length > 0) {
            currentTheoryIndex = 0;
            showScreen('theory-viewer');
            renderTheory();
        } else {
            alert("No theory questions found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        hideLoader('loader');
    }
}

function renderTheory() {
    const q = theoryQuestions[currentTheoryIndex];
    
    updateText('theory-question-text', q.Question_Text);
    updateText('theory-source-text', `${q.Chapter} - ${q.Source}`);
    
    // Reset Answer View
    document.getElementById('theory-answer-container').classList.add('hidden');
    const ansText = document.getElementById('theory-answer-text');
    ansText.innerHTML = q.Model_Answer || "No model answer available.";
    
    // Image
    const imgDiv = document.getElementById('theory-img-container');
    imgDiv.innerHTML = q.Image_URL ? `<img src="${q.Image_URL}" class="max-h-60 mx-auto rounded">` : '';
}

function nextTheory() {
    if (currentTheoryIndex < theoryQuestions.length - 1) {
        currentTheoryIndex++;
        renderTheory();
    }
}

function prevTheory() {
    if (currentTheoryIndex > 0) {
        currentTheoryIndex--;
        renderTheory();
    }
}
