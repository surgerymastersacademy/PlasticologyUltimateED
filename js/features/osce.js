// js/features/osce.js (FINAL VERSION v3.1)

import { createJsonRequest, sendPostRequest, fetchContentData } from '../api.js';
import { showScreen, showLoader, hideLoader, showToast, updateText } from '../ui.js';
import { getCurrentUser } from '../state.js';

let currentOSCEs = [];
let currentOSCEIndex = 0;
let osceTimerInterval;

export async function initOSCE() {
    // Bind Event Listeners
    const startSlayerBtn = document.getElementById('start-osce-slayer-btn');
    if (startSlayerBtn) startSlayerBtn.addEventListener('click', startOSCESlayer);

    const startCustomBtn = document.getElementById('start-custom-osce-btn');
    if (startCustomBtn) startCustomBtn.addEventListener('click', startCustomOSCE);
    
    const nextBtn = document.getElementById('osce-next-btn');
    if (nextBtn) nextBtn.addEventListener('click', nextOSCE);

    const prevBtn = document.getElementById('osce-previous-btn');
    if (prevBtn) prevBtn.addEventListener('click', prevOSCE);

    const endBtn = document.getElementById('end-osce-quiz-btn');
    if (endBtn) endBtn.addEventListener('click', endOSCE);

    const backBtn = document.getElementById('osce-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => showScreen('main-menu-container'));

    // Toggle Options (Optional)
    const toggleOptionsBtn = document.getElementById('toggle-osce-options-btn');
    if (toggleOptionsBtn) {
        toggleOptionsBtn.addEventListener('click', () => {
            const optionsDiv = document.getElementById('custom-osce-options');
            if (optionsDiv) optionsDiv.classList.toggle('hidden');
        });
    }
}

async function startOSCESlayer() {
    startOSCESession(null, "OSCE Slayer Mode ⚔️");
}

async function startCustomOSCE() {
    const countInput = document.getElementById('osce-case-count');
    const count = parseInt(countInput ? countInput.value : 0) || 5;
    startOSCESession(count, "Custom OSCE Session");
}

async function startOSCESession(limit, title) {
    showLoader('loader');
    try {
        const data = await fetchContentData();
        if (!data || !data.osceCases || !data.osceQuestions) throw new Error("No OSCE data found.");

        // Merge Cases with their Questions to ensure we only show valid cases
        let validCases = data.osceCases.map(c => {
            const questions = data.osceQuestions.filter(q => q.CaseID === c.CaseID);
            return { ...c, questions };
        }).filter(c => c.questions.length > 0); 

        if (validCases.length === 0) {
            showToast("No valid OSCE cases found.", "error");
            return;
        }

        // Shuffle
        validCases = validCases.sort(() => 0.5 - Math.random());
        
        // Apply limit if custom
        if (limit && limit > 0) {
            validCases = validCases.slice(0, Math.min(limit, validCases.length));
        }

        // Init State
        currentOSCEs = validCases;
        currentOSCEIndex = 0;
        
        // Setup UI
        updateText('osce-quiz-title', title);
        showScreen('osce-quiz-container');
        renderOSCE();
        startOSCETimer();

    } catch (e) {
        console.error("OSCE Start Error:", e);
        showToast("Failed to start OSCE session.", "error");
    } finally {
        hideLoader('loader');
    }
}

function renderOSCE() {
    const caseData = currentOSCEs[currentOSCEIndex];
    // For simplicity in V3.1, we show the first question of the case.
    // Enhanced logic could loop through questions within a case.
    const qData = caseData.questions[0]; 
    
    // 1. Case Info
    updateText('osce-case-title', caseData.CaseTitle || 'Clinical Case');
    updateText('osce-case-description', caseData.CaseScenario || 'No scenario provided.');
    
    const imgContainer = document.getElementById('osce-case-image-container');
    if (imgContainer) {
        imgContainer.innerHTML = caseData.CaseImage ? 
            `<img src="${caseData.CaseImage}" class="w-full max-h-64 object-contain rounded cursor-pointer shadow-sm" onclick="viewImage(this.src)">` : 
            '<div class="bg-gray-100 h-40 flex items-center justify-center text-gray-400 rounded">No Image</div>';
    }

    // 2. Question Info
    updateText('osce-question-text', qData.QuestionText || 'What is your diagnosis?');
    updateText('osce-progress-text', `Case ${currentOSCEIndex + 1} of ${currentOSCEs.length}`);
    
    // 3. Answer Area (Input + Reveal Button)
    const ansArea = document.getElementById('osce-answer-area');
    if (ansArea) {
        ansArea.innerHTML = `
            <textarea id="osce-user-answer" class="w-full p-3 border rounded-lg h-24 mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-700 dark:text-white" placeholder="Type your diagnosis/management here..."></textarea>
            <button id="osce-check-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg w-full transition-colors shadow-sm">
                <i class="fas fa-eye mr-2"></i> Show Model Answer
            </button>
            
            <div id="osce-model-answer-box" class="hidden mt-4 p-4 bg-green-50 border-l-4 border-green-500 text-slate-800 rounded-r-lg animate-fadeIn">
                <h4 class="font-bold text-green-800 mb-1">Model Answer:</h4>
                <p class="text-sm whitespace-pre-wrap">${qData.ModelAnswer || 'No model answer available.'}</p>
            </div>
        `;

        // Bind Reveal Button
        document.getElementById('osce-check-btn').addEventListener('click', function() {
            const modelBox = document.getElementById('osce-model-answer-box');
            modelBox.classList.remove('hidden');
            this.classList.add('opacity-50', 'cursor-not-allowed');
            this.disabled = true;
            this.textContent = 'Answer Revealed';
        });
    }
    
    // 4. Navigation Buttons State
    const prevBtn = document.getElementById('osce-previous-btn');
    const nextBtn = document.getElementById('osce-next-btn');
    
    if (prevBtn) prevBtn.disabled = currentOSCEIndex === 0;
    if (nextBtn) {
        nextBtn.textContent = currentOSCEIndex === currentOSCEs.length - 1 ? 'Finish Session' : 'Next Case';
        nextBtn.className = currentOSCEIndex === currentOSCEs.length - 1 ? 
            'bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700' : 
            'bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700';
    }
}

function nextOSCE() {
    if (currentOSCEIndex < currentOSCEs.length - 1) {
        currentOSCEIndex++;
        renderOSCE();
    } else {
        endOSCE();
    }
}

function prevOSCE() {
    if (currentOSCEIndex > 0) {
        currentOSCEIndex--;
        renderOSCE();
    }
}

function startOSCETimer() {
    clearInterval(osceTimerInterval);
    let seconds = 0;
    const timerEl = document.getElementById('osce-timer');
    
    osceTimerInterval = setInterval(() => {
        seconds++;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);
}

async function endOSCE() {
    clearInterval(osceTimerInterval);
    
    if(confirm("Are you sure you want to end this session?")) {
        const user = getCurrentUser();
        const title = document.getElementById('osce-quiz-title')?.textContent || 'OSCE Session';
        
        // Log the session
        if(user) {
            try {
                sendPostRequest({
                    eventType: 'FinishOSCEQuiz',
                    userId: user.UniqueID,
                    userName: user.Name,
                    osceTitle: title,
                    totalQuestions: currentOSCEs.length,
                    // Optional: Calculate a score if we implement self-grading later
                    score: 'Practice' 
                });
            } catch (e) {
                console.warn("Logging failed", e);
            }
        }
        
        showScreen('main-menu-container');
        showToast("Session Completed! Great practice.", "success");
    } else {
        // If canceled, restart timer
        startOSCETimer();
    }
}
