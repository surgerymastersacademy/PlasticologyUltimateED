// js/features/theory.js (FINAL VERSION v3.1)

import { fetchContentData } from '../api.js';
import { showScreen, showLoader, hideLoader, updateText, showToast } from '../ui.js';

let theoryQuestions = [];
let currentTheoryIndex = 0;

export async function initTheory() {
    // Controls
    const searchBtn = document.getElementById('theory-search-btn');
    if (searchBtn) searchBtn.addEventListener('click', searchTheory);

    const backBtn = document.getElementById('theory-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => showScreen('main-menu-container'));
    
    const endBtn = document.getElementById('theory-end-btn');
    if (endBtn) endBtn.addEventListener('click', () => showScreen('theory-container')); // Back to search
    
    // Browse Handlers (Similar to Learning Mode)
    const browseChapter = document.getElementById('theory-browse-by-chapter-btn');
    if(browseChapter) browseChapter.addEventListener('click', () => {
         document.getElementById('theory-search-input').value = '';
         searchTheory(null, true);
    });

    // Viewer Navigation
    document.getElementById('theory-next-btn').addEventListener('click', nextTheory);
    document.getElementById('theory-prev-btn').addEventListener('click', prevTheory);
    
    // Show Answer Toggle
    document.getElementById('theory-show-answer-btn').addEventListener('click', toggleAnswer);
}

async function searchTheory(e, loadAll = false) {
    const input = document.getElementById('theory-search-input');
    const term = input ? input.value.toLowerCase() : '';
    
    if (!term && !loadAll) {
        showToast("Please enter a keyword to search.", "warning");
        return;
    }

    showLoader('loader');
    try {
        const data = await fetchContentData();
        if (!data || !data.theoryQuestions) throw new Error("No theory data.");

        if (loadAll) {
            theoryQuestions = data.theoryQuestions;
        } else {
            theoryQuestions = data.theoryQuestions.filter(q => 
                (q.Question_Text && q.Question_Text.toLowerCase().includes(term)) ||
                (q.Topic && q.Topic.toLowerCase().includes(term))
            );
        }

        if (theoryQuestions.length > 0) {
            // Shuffle
            theoryQuestions = theoryQuestions.sort(() => 0.5 - Math.random());
            currentTheoryIndex = 0;
            
            showScreen('theory-viewer');
            renderTheory();
        } else {
            showToast("No matching theory questions found.", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Error loading theory bank.", "error");
    } finally {
        hideLoader('loader');
    }
}

function renderTheory() {
    const q = theoryQuestions[currentTheoryIndex];
    if(!q) return;

    // Header Info
    updateText('theory-title', `Question ${currentTheoryIndex + 1}/${theoryQuestions.length}`);
    updateText('theory-source-text', `${q.Chapter || 'General'} | ${q.Source || 'Common'}`);
    
    // Question Text
    updateText('theory-question-text', q.Question_Text);
    
    // Image
    const imgDiv = document.getElementById('theory-img-container');
    imgDiv.innerHTML = q.Image_URL ? 
        `<img src="${q.Image_URL}" class="max-h-60 mx-auto rounded shadow-sm cursor-pointer" onclick="viewImage(this.src)">` : '';

    // Reset Answer State
    const ansContainer = document.getElementById('theory-answer-container');
    const ansBtn = document.getElementById('theory-show-answer-btn');
    
    ansContainer.classList.add('hidden');
    ansBtn.textContent = 'Show Model Answer';
    ansBtn.classList.remove('bg-gray-500');
    ansBtn.classList.add('bg-blue-600');

    // Set Answer Text
    const ansText = document.getElementById('theory-answer-text');
    ansText.innerHTML = (q.Model_Answer || "No model answer available.").replace(/\n/g, '<br>');
    
    // Button State
    const prevBtn = document.getElementById('theory-prev-btn');
    if(prevBtn) prevBtn.disabled = currentTheoryIndex === 0;
}

function toggleAnswer() {
    const container = document.getElementById('theory-answer-container');
    const btn = document.getElementById('theory-show-answer-btn');
    
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        container.classList.add('animate-fadeIn'); // Add animation
        btn.textContent = 'Hide Answer';
        btn.classList.remove('bg-blue-600');
        btn.classList.add('bg-gray-500');
    } else {
        container.classList.add('hidden');
        btn.textContent = 'Show Model Answer';
        btn.classList.remove('bg-gray-500');
        btn.classList.add('bg-blue-600');
    }
}

function nextTheory() {
    if (currentTheoryIndex < theoryQuestions.length - 1) {
        currentTheoryIndex++;
        renderTheory();
    } else {
        showToast("End of session.", "info");
    }
}

function prevTheory() {
    if (currentTheoryIndex > 0) {
        currentTheoryIndex--;
        renderTheory();
    }
}
