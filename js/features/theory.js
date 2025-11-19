// js/features/theory.js (FINAL - CORS FIXED)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logTheoryActivity } from '../api.js';
import { openNoteModal } from '../main.js';

// --- MAIN FUNCTIONS ---

export function showTheoryMenuScreen() {
    ui.showScreen(dom.theoryContainer);
    dom.theoryControls.classList.remove('hidden');
    dom.theoryViewer.classList.add('hidden');
    appState.navigationHistory.push(showTheoryMenuScreen);

    if (!dom.theoryFlashcardModeBtn.dataset.listener) {
        dom.theoryFlashcardModeBtn.dataset.listener = 'true';
        
        dom.theoryFlashcardModeBtn.addEventListener('click', () => launchTheorySession('Flashcard Mode', appState.allTheoryQuestions, false));
        dom.theoryExamModeBtn.addEventListener('click', () => launchTheorySession('Thinking Exam Mode', appState.allTheoryQuestions, true));
        
        dom.theoryBrowseByChapterBtn.addEventListener('click', () => showTheoryListScreen('Chapter'));
        dom.theoryBrowseBySourceBtn.addEventListener('click', () => showTheoryListScreen('Source'));
        dom.theorySearchBtn.addEventListener('click', handleTheorySearch);

        dom.theoryEndBtn.addEventListener('click', () => {
            clearInterval(appState.currentTheorySession.timerInterval);
            showTheoryMenuScreen();
        });
        dom.theoryNextBtn.addEventListener('click', handleTheoryNext);
        dom.theoryPrevBtn.addEventListener('click', handleTheoryPrev);
        
        dom.theoryShowAnswerBtn.addEventListener('click', () => {
            dom.theoryAnswerContainer.classList.remove('hidden'); 
            dom.theoryShowAnswerBtn.classList.add('hidden');      
        });
        
        dom.theoryNoteBtn.addEventListener('click', handleTheoryNote);
        dom.theoryStatusBtn.addEventListener('click', handleTheoryStatusToggle);
    }
}

export function launchTheorySession(title, questions, isExamMode) {
    if (questions.length === 0) {
        ui.showConfirmationModal('No Questions', `No questions were found for this category.`, () => {
            dom.modalBackdrop.classList.add('hidden');
        });
        return;
    }

    appState.currentTheorySession = {
        questions: [...questions].sort(() => Math.random() - 0.5),
        currentIndex: 0,
        isExamMode: isExamMode,
        title: title,
        timerInterval: null
    };

    ui.showScreen(dom.theoryContainer);
    dom.theoryControls.classList.add('hidden');
    dom.theoryViewer.classList.remove('hidden');
    dom.theoryTitle.textContent = title;

    if (isExamMode) {
        startTheoryTimer(questions.length * 3 * 60); // 3 minutes per question
    } else {
        dom.theoryTimer.textContent = 'Study';
    }

    renderTheoryCard();
}

// --- RENDERING ---

function renderTheoryCard() {
    const { questions, currentIndex, isExamMode } = appState.currentTheorySession;
    const question = questions[currentIndex];

    dom.theoryAnswerContainer.classList.add('hidden'); 
    dom.theoryShowAnswerBtn.classList.remove('hidden'); 
    dom.theoryAnswerText.textContent = ''; 

    dom.theoryProgressText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    dom.theorySourceText.textContent = `Source: ${question.Source} | Chapter: ${question.Chapter}`;
    
    dom.theoryImgContainer.innerHTML = question.Img_URL 
        ? `<img src="${question.Img_URL}" class="max-h-48 rounded-lg mx-auto mb-4 cursor-pointer" onclick="ui.showImageModal('${question.Img_URL}')">` 
        : '';
        
    dom.theoryQuestionText.textContent = question.QuestionText;
    dom.theoryAnswerText.textContent = question.ModelAnswer;

    if (isExamMode) {
        dom.theoryShowAnswerBtn.textContent = "Reveal Answer (Check)";
    } else {
        dom.theoryShowAnswerBtn.textContent = "Show Answer";
    }
    
    dom.theoryPrevBtn.disabled = currentIndex === 0;
    dom.theoryNextBtn.disabled = currentIndex === questions.length - 1;

    const userLog = appState.userTheoryLogs ? appState.userTheoryLogs.find(log => log.Question_ID === question.UniqueID) : null;
    
    dom.theoryNoteBtn.classList.toggle('has-note', userLog && userLog.Notes && userLog.Notes.length > 0);
    
    if (userLog && userLog.Status === 'Completed') {
        dom.theoryStatusBtn.classList.add('text-green-500');
    } else {
        dom.theoryStatusBtn.classList.remove('text-green-500');
    }
}

// --- EVENT HANDLERS ---

function handleTheoryNext() {
    if (appState.currentTheorySession.currentIndex < appState.currentTheorySession.questions.length - 1) {
        appState.currentTheorySession.currentIndex++;
        renderTheoryCard();
    }
}

function handleTheoryPrev() {
    if (appState.currentTheorySession.currentIndex > 0) {
        appState.currentTheorySession.currentIndex--;
        renderTheoryCard();
    }
}

function handleTheoryNote() {
    const question = appState.currentTheorySession.questions[appState.currentTheorySession.currentIndex];
    openNoteModal('theory', question.UniqueID, question.QuestionText);
}

function handleTheoryStatusToggle() {
    const question = appState.currentTheorySession.questions[appState.currentTheorySession.currentIndex];
    
    let userLog = appState.userTheoryLogs.find(log => log.Question_ID === question.UniqueID);
    
    let newStatus = '';
    if (userLog) {
        newStatus = userLog.Status === 'Completed' ? '' : 'Completed';
        userLog.Status = newStatus;
    } else {
        newStatus = 'Completed';
        appState.userTheoryLogs.push({
            Question_ID: question.UniqueID,
            Status: newStatus,
            Notes: ''
        });
    }

    dom.theoryStatusBtn.classList.toggle('text-green-500', newStatus === 'Completed');

    logTheoryActivity({
        questionId: question.UniqueID,
        Status: newStatus
    });
}

function handleTheorySearch() {
    const searchTerm = dom.theorySearchInput.value.trim().toLowerCase();
    if (searchTerm.length < 3) {
        alert('Please enter at least 3 characters to search.');
        return;
    }
    
    const filteredQuestions = appState.allTheoryQuestions.filter(q => 
        (q.QuestionText && q.QuestionText.toLowerCase().includes(searchTerm)) ||
        (q.ModelAnswer && q.ModelAnswer.toLowerCase().includes(searchTerm)) ||
        (q.Keywords && q.Keywords.toLowerCase().includes(searchTerm))
    );
    
    launchTheorySession(`Search: "${searchTerm}"`, filteredQuestions, false);
}

// --- BROWSE & LIST VIEW ---

function showTheoryListScreen(browseBy) {
    const isChapter = browseBy === 'Chapter';
    const title = `Browse by ${browseBy}`;
    
    const itemCounts = appState.allTheoryQuestions.reduce((acc, q) => {
        const item = isChapter ? (q.Chapter || 'Uncategorized') : (q.Source || 'Uncategorized');
        acc[item] = (acc[item] || 0) + 1;
        return acc;
    }, {});

    const items = Object.keys(itemCounts).sort();
    dom.listTitle.textContent = title;
    dom.listItems.innerHTML = '';

    if (items.length === 0) {
        dom.listItems.innerHTML = `<p class="text-center text-slate-500 col-span-3">No theory questions found.</p>`;
    } else {
        items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'action-btn p-4 bg-white rounded-lg shadow-sm text-center hover:bg-slate-50';
            button.innerHTML = `
                <h3 class="font-bold text-slate-800">${item}</h3>
                <p class="text-sm text-slate-500">${itemCounts[item]} Questions</p>
            `;
            button.addEventListener('click', () => {
                const questions = appState.allTheoryQuestions.filter(q => {
                    const qItem = isChapter ? (q.Chapter || 'Uncategorized') : (q.Source || 'Uncategorized');
                    return qItem === item;
                });
                
                ui.showConfirmationModal(
                    `Study "${item}"`,
                    'Select your study mode:',
                    () => launchTheorySession(item, questions, false)
                );
                
                const confirmBtnContainer = dom.modalConfirmBtn.parentElement;
                confirmBtnContainer.innerHTML = '';
                
                const flashcardBtn = document.createElement('button');
                flashcardBtn.textContent = 'Flashcard Mode';
                flashcardBtn.className = 'action-btn bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mr-2';
                flashcardBtn.onclick = () => {
                    launchTheorySession(item, questions, false);
                    dom.modalBackdrop.classList.add('hidden');
                };

                const examBtn = document.createElement('button');
                examBtn.textContent = 'Thinking Exam';
                examBtn.className = 'action-btn bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded';
                examBtn.onclick = () => {
                    launchTheorySession(item, questions, true);
                    dom.modalBackdrop.classList.add('hidden');
                };
                
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.className = 'action-btn bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded ml-2';
                cancelBtn.onclick = () => {
                    dom.modalBackdrop.classList.add('hidden');
                };
                
                confirmBtnContainer.appendChild(flashcardBtn);
                confirmBtnContainer.appendChild(examBtn);
                confirmBtnContainer.appendChild(cancelBtn);
            });
            dom.listItems.appendChild(button);
        });
    }

    ui.showScreen(dom.listContainer);
    appState.navigationHistory.push(() => showTheoryListScreen(browseBy));
}

function startTheoryTimer(duration) {
    clearInterval(appState.currentTheorySession.timerInterval);
    let timeLeft = duration;
    dom.theoryTimer.textContent = ui.formatTime(timeLeft);
    appState.currentTheorySession.timerInterval = setInterval(() => {
        timeLeft--;
        dom.theoryTimer.textContent = ui.formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(appState.currentTheorySession.timerInterval);
            alert("Time's up!");
        }
    }, 1000);
}
