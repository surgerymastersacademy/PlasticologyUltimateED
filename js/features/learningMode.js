// js/features/learningMode.js (With Mistakes & Bookmarked logic)

import { appState, API_URL } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { parseQuestions } from '../utils.js';

export function showLearningModeBrowseScreen() {
    ui.showScreen(dom.learningModeContainer);
    dom.learningModeControls.classList.remove('hidden');
    dom.learningModeViewer.classList.add('hidden');
    appState.navigationHistory.push(showLearningModeBrowseScreen);
}

function launchLearningMode(title, questions) {
    if (questions.length === 0) {
        ui.showConfirmationModal('No Questions', `No questions found for "${title}".`, () => dom.modalBackdrop.classList.add('hidden'));
        return;
    }
    ui.showScreen(dom.learningModeContainer);
    appState.currentLearning = { questions, currentIndex: 0, title };
    dom.learningModeControls.classList.add('hidden');
    dom.learningModeViewer.classList.remove('hidden');
    dom.learningTitle.textContent = `Studying: ${title}`;
    appState.navigationHistory.push(() => launchLearningMode(title, questions));
    showLearningQuestion();
}

function showLearningQuestion() {
    const { questions, currentIndex } = appState.currentLearning;
    const currentQuestion = questions[currentIndex];

    dom.learningImageContainer.innerHTML = currentQuestion.ImageURL ? `<img src="${currentQuestion.ImageURL}" class="max-h-48 rounded-lg mx-auto mb-4 cursor-pointer" onclick="ui.showImageModal('${currentQuestion.ImageURL}')">` : '';
    dom.learningQuestionText.textContent = currentQuestion.question;
    dom.learningProgressText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    dom.learningSourceText.textContent = `Source: ${currentQuestion.source || 'N/A'} | Chapter: ${currentQuestion.chapter || 'N/A'}`;
    dom.learningAnswerButtons.innerHTML = '';

    currentQuestion.answerOptions.forEach(answer => {
        const answerDiv = document.createElement('div');
        const button = document.createElement('button');
        button.innerHTML = answer.text;
        button.className = 'learning-answer-btn w-full text-left p-4 rounded-lg';
        button.disabled = true;

        if (answer.isCorrect) {
            button.classList.add('correct');
            const rationale = document.createElement('p');
            rationale.className = 'learning-rationale';
            rationale.innerHTML = answer.rationale || 'No rationale provided.';
            answerDiv.appendChild(button);
            answerDiv.appendChild(rationale);
        } else {
            answerDiv.appendChild(button);
        }
        dom.learningAnswerButtons.appendChild(answerDiv);
    });

    dom.learningPreviousBtn.disabled = currentIndex === 0;
    dom.learningNextBtn.disabled = currentIndex === questions.length - 1;
}

export function handleLearningNext() {
    if (appState.currentLearning.currentIndex < appState.currentLearning.questions.length - 1) {
        appState.currentLearning.currentIndex++;
        showLearningQuestion();
    }
}

export function handleLearningPrevious() {
    if (appState.currentLearning.currentIndex > 0) {
        appState.currentLearning.currentIndex--;
        showLearningQuestion();
    }
}

export function handleLearningSearch() {
    const searchTerm = dom.learningSearchInput.value.trim().toLowerCase();
    if (searchTerm.length < 3) {
        dom.learningSearchError.textContent = 'Please enter at least 3 characters.';
        dom.learningSearchError.classList.remove('hidden');
        return;
    }
    dom.learningSearchError.classList.add('hidden');

    const filteredQuestions = appState.allQuestions.filter(q =>
        q.question.toLowerCase().includes(searchTerm) ||
        q.answerOptions.some(opt => opt.text.toLowerCase().includes(searchTerm))
    );

    launchLearningMode(`Search: "${dom.learningSearchInput.value}"`, filteredQuestions);
}

export function startLearningBrowse(browseBy) {
    const isChapter = browseBy === 'chapter';
    const title = isChapter ? 'Browse by Chapter' : 'Browse by Source';
    
    const itemCounts = appState.allQuestions.reduce((acc, q) => {
        const item = isChapter ? (q.chapter || 'Uncategorized') : (q.source || 'Uncategorized');
        acc[item] = (acc[item] || 0) + 1;
        return acc;
    }, {});

    const items = Object.keys(itemCounts).sort();
    dom.listTitle.textContent = title;
    dom.listItems.innerHTML = '';

    if (items.length === 0) {
        dom.listItems.innerHTML = `<p class="text-slate-500 col-span-full text-center">No ${browseBy}s found.</p>`;
    } else {
        items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'action-btn p-4 bg-white rounded-lg shadow-sm text-center hover:bg-slate-50';
            button.innerHTML = `<h3 class="font-bold text-slate-800">${item}</h3><p class="text-sm text-slate-500">${itemCounts[item]} Questions</p>`;
            button.addEventListener('click', () => {
                const questions = appState.allQuestions.filter(q => {
                    const qItem = isChapter ? (q.chapter || 'Uncategorized') : (q.source || 'Uncategorized');
                    return qItem === item;
                });
                launchLearningMode(item, questions);
            });
            dom.listItems.appendChild(button);
        });
    }

    ui.showScreen(dom.listContainer);
    appState.navigationHistory.push(() => startLearningBrowse(browseBy));
}

// --- NEW FUNCTIONS FOR MISTAKES & BOOKMARKED ---

export async function startLearningMistakes() {
    ui.showConfirmationModal('Loading...', 'Fetching your mistakes, please wait.', () => {});
    dom.modalConfirmBtn.classList.add('hidden'); // Hide confirm button
    dom.modalCancelBtn.classList.add('hidden'); // Hide cancel button
    try {
        const response = await fetch(`${API_URL}?request=getIncorrectQuestions&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Failed to fetch your mistakes.');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const mistakeQuestions = parseQuestions(data.questions);
        dom.modalBackdrop.classList.add('hidden'); // Hide modal before launching
        launchLearningMode("Study Mistakes", mistakeQuestions);

    } catch (error) {
        console.error("Error fetching mistakes:", error);
        dom.modalConfirmBtn.classList.remove('hidden');
        dom.modalCancelBtn.classList.remove('hidden');
        ui.showConfirmationModal('Error', error.message, () => dom.modalBackdrop.classList.add('hidden'));
    }
}

export function startLearningBookmarked() {
    const bookmarkedIds = Array.from(appState.bookmarkedQuestions);
    const bookmarkedQuestions = appState.allQuestions.filter(q => bookmarkedIds.includes(q.UniqueID));
    launchLearningMode("Study Bookmarked", bookmarkedQuestions);
}
