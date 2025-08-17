// js/features/learningMode.js (CORRECTED VERSION)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';

export function showLearningModeBrowseScreen() {
    ui.showScreen(dom.learningModeContainer);
    dom.learningModeControls.classList.remove('hidden');
    dom.learningModeViewer.classList.add('hidden');
    appState.navigationHistory.push(showLearningModeBrowseScreen);
}

function launchLearningMode(title, questions) {
    ui.showScreen(dom.learningModeContainer);
    appState.currentLearning = { questions, currentIndex: 0, title };
    dom.learningModeControls.classList.add('hidden');
    dom.learningModeViewer.classList.remove('hidden');
    dom.learningTitle.textContent = `Studying: ${title}`;
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
        button.textContent = answer.text;
        button.className = 'learning-answer-btn w-full text-left p-4 rounded-lg';
        button.disabled = true;

        if (answer.isCorrect) {
            button.classList.add('correct');
            const rationale = document.createElement('p');
            rationale.className = 'learning-rationale';
            rationale.textContent = answer.rationale || 'No rationale provided.';
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

    if (filteredQuestions.length === 0) {
        dom.learningSearchError.textContent = `No questions found for "${dom.learningSearchInput.value}".`;
        dom.learningSearchError.classList.remove('hidden');
    } else {
        launchLearningMode(`Search: "${dom.learningSearchInput.value}"`, filteredQuestions);
    }
}
