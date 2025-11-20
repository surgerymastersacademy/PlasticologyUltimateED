// js/features/learningMode.js (FINAL VERSION v3.1)

import { fetchContentData } from '../api.js';
import { showScreen, showLoader, hideLoader, updateText, showToast } from '../ui.js';

let learningQuestions = [];
let currentLearningIndex = 0;

export async function initLearningMode() {
    // Search Handler
    const searchBtn = document.getElementById('learning-search-btn');
    if(searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    // Browse Handlers
    const browseChapterBtn = document.getElementById('learning-browse-by-chapter-btn');
    if(browseChapterBtn) browseChapterBtn.addEventListener('click', () => {
         // For v3.1, we'll auto-search for "General" or show all as a fallback
         // You can expand this to show a modal with chapters later
         document.getElementById('learning-search-input').value = ''; 
         handleSearch(null, true); // true = load all
    });

    // Navigation Handlers
    document.getElementById('learning-next-btn').addEventListener('click', nextQuestion);
    document.getElementById('learning-previous-btn').addEventListener('click', prevQuestion);
    
    document.getElementById('end-learning-btn').addEventListener('click', () => {
        showScreen('main-menu-container');
    });
    
    document.getElementById('learning-mode-back-btn').addEventListener('click', () => {
        showScreen('main-menu-container');
    });
}

async function handleSearch(e, loadAll = false) {
    const input = document.getElementById('learning-search-input');
    const term = input ? input.value.toLowerCase() : '';
    const errorMsg = document.getElementById('learning-search-error');
    
    if (!term && !loadAll) {
        if(errorMsg) {
            errorMsg.textContent = "Please enter a topic to search.";
            errorMsg.classList.remove('hidden');
        }
        return;
    }
    if(errorMsg) errorMsg.classList.add('hidden');

    showLoader('loader');
    try {
        const data = await fetchContentData();
        if (!data || !data.questions) throw new Error("No questions data.");

        // Filter Questions
        if (loadAll) {
             learningQuestions = data.questions; // Load everything (Browse mode)
             updateText('learning-title', `Browsing All Questions`);
        } else {
            learningQuestions = data.questions.filter(q => 
                (q.Question && q.Question.toLowerCase().includes(term)) ||
                (q.Chapter && q.Chapter.toLowerCase().includes(term)) ||
                (q.Tags && q.Tags.toLowerCase().includes(term))
            );
            updateText('learning-title', `Study: "${term}"`);
        }

        if (learningQuestions.length > 0) {
            // Shuffle for variety
            learningQuestions = learningQuestions.sort(() => 0.5 - Math.random());
            currentLearningIndex = 0;
            
            showScreen('learning-mode-viewer');
            renderLearningQuestion();
        } else {
            if(errorMsg) {
                errorMsg.textContent = "No questions found matching your search.";
                errorMsg.classList.remove('hidden');
            }
        }
    } catch (e) {
        console.error(e);
        showToast("Failed to load learning mode.", "error");
    } finally {
        hideLoader('loader');
    }
}

function renderLearningQuestion() {
    const q = learningQuestions[currentLearningIndex];
    if (!q) return;

    const qText = document.getElementById('learning-question-text');
    const qImg = document.getElementById('learning-image-container');
    const answersDiv = document.getElementById('learning-answer-buttons');
    
    // Progress Info
    updateText('learning-progress-text', `Question ${currentLearningIndex + 1} of ${learningQuestions.length}`);
    updateText('learning-source-text', `${q.Source || 'General'} - ${q.Chapter || 'Mixed'}`);

    // Question Content
    qText.innerHTML = q.Question;
    
    // Image Handling
    qImg.innerHTML = '';
    if (q.Image_URL) {
        qImg.innerHTML = `<img src="${q.Image_URL}" class="max-h-64 rounded-lg shadow-md cursor-pointer mx-auto" onclick="viewImage(this.src)">`;
    }

    // Render Options
    answersDiv.innerHTML = '';
    const options = [q.Option_A, q.Option_B, q.Option_C, q.Option_D];
    // Determine correct index (0=A, 1=B, etc.)
    const correctChar = (q.Correct_Answer || 'A').trim().toUpperCase().charAt(0); 
    const correctIdx = correctChar.charCodeAt(0) - 65;

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        // Use 'learning-answer-btn' class we defined in style.css
        btn.className = 'learning-answer-btn w-full text-left p-4 rounded-xl border-2 border-slate-200 mb-3 hover:bg-slate-50 transition-all flex items-start';
        btn.innerHTML = `
            <span class="font-bold mr-3 text-slate-500 bg-slate-100 w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0">${String.fromCharCode(65+idx)}</span>
            <span class="mt-1 text-slate-700 dark:text-slate-800 font-medium">${opt || ''}</span>
        `;
        
        // Click Handler (Immediate Feedback)
        btn.onclick = () => {
            // Disable all buttons to prevent double guessing
            const allBtns = answersDiv.querySelectorAll('button');
            allBtns.forEach(b => b.disabled = true);

            if (idx === correctIdx) {
                // Correct!
                btn.classList.remove('border-slate-200');
                btn.classList.add('correct', 'bg-green-50', 'border-green-500');
                btn.querySelector('span.font-bold').classList.replace('bg-slate-100', 'bg-green-200');
                btn.querySelector('span.font-bold').classList.replace('text-slate-500', 'text-green-800');
            } else {
                // Incorrect!
                btn.classList.remove('border-slate-200');
                btn.classList.add('incorrect', 'bg-red-50', 'border-red-500');
                btn.querySelector('span.font-bold').classList.replace('bg-slate-100', 'bg-red-200');
                btn.querySelector('span.font-bold').classList.replace('text-slate-500', 'text-red-800');
                
                // Highlight the correct answer automatically
                const correctBtn = allBtns[correctIdx];
                if(correctBtn) {
                    correctBtn.classList.remove('border-slate-200');
                    correctBtn.classList.add('correct', 'bg-green-50', 'border-green-500');
                }
            }
            
            // Show Rationale
            showRationale(q.Rationale, answersDiv);
        };
        
        answersDiv.appendChild(btn);
    });
}

function showRationale(rationaleText, container) {
    // Remove existing rationale if any
    const existing = document.getElementById('rationale-box');
    if (existing) existing.remove();

    const ratDiv = document.createElement('div');
    ratDiv.id = 'rationale-box';
    // Use 'rationale visible' class from style.css for animation
    ratDiv.className = 'rationale visible mt-4 text-sm text-slate-700 dark:text-slate-800';
    
    const content = rationaleText || "No explanation provided for this question.";
    ratDiv.innerHTML = `
        <h4 class="font-bold text-green-700 mb-1"><i class="fas fa-lightbulb mr-1"></i> Explanation:</h4>
        <p>${content}</p>
    `;
    
    container.appendChild(ratDiv);
    // Scroll to explanation
    ratDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestion() {
    if (currentLearningIndex < learningQuestions.length - 1) {
        currentLearningIndex++;
        renderLearningQuestion();
    } else {
        showToast("End of questions.", "info");
    }
}

function prevQuestion() {
    if (currentLearningIndex > 0) {
        currentLearningIndex--;
        renderLearningQuestion();
    }
}
