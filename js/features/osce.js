// js/features/osce.js

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { formatTime } from '../utils.js';
import { logUserActivity } from '../api.js';

function startOsceQuiz(cases, title, totalDuration) {
    appState.currentOsce = {
        ...appState.currentOsce,
        cases,
        caseIndex: 0,
        questionIndex: 0,
        userAnswers: {},
        score: 0,
        totalQuestions: cases.reduce((acc, c) => acc + appState.allOsceQuestions.filter(q => q.CaseID === c.CaseID).length, 0),
    };

    ui.showScreen(dom.osceQuizContainer);
    dom.resultsContainer.classList.add('hidden');
    dom.osceQuizTitle.textContent = title;
    startOsceTimer(totalDuration);
    updateOsceScoreDisplay();
    renderOsceQuestion();
}

export function startOsceSlayer() {
    const casesWithQuestions = appState.allOsceCases.filter(c => appState.allOsceQuestions.some(q => q.CaseID === c.CaseID));
    if (casesWithQuestions.length === 0) {
        dom.osceError.textContent = "No OSCE cases with questions are available.";
        dom.osceError.classList.remove('hidden');
        return;
    }
    const shuffled = [...casesWithQuestions].sort(() => Math.random() - 0.5);
    const totalQuestions = shuffled.reduce((acc, c) => acc + appState.allOsceQuestions.filter(q => q.CaseID === c.CaseID).length, 0);
    const totalDuration = totalQuestions * 60; // 1 minute per question
    startOsceQuiz(shuffled, "OSCE Slayer", totalDuration);
}

export function startCustomOsce() {
    dom.osceError.classList.add('hidden');
    const requestedCount = parseInt(dom.osceCaseCountInput.value, 10);
    if (isNaN(requestedCount) || requestedCount <= 0) {
        dom.osceError.textContent = "Please enter a valid number of cases.";
        dom.osceError.classList.remove('hidden');
        return;
    }

    const timePerQ = parseInt(dom.osceTimePerQInput.value, 10) || 1;
    const timePerQSeconds = timePerQ * 60;
    const selectedChapters = [...dom.chapterSelectOsce.querySelectorAll('input:checked')].map(el => el.value);
    const selectedSources = [...dom.sourceSelectOsce.querySelectorAll('input:checked')].map(el => el.value);

    let filteredCases = appState.allOsceCases.filter(c => appState.allOsceQuestions.some(q => q.CaseID === c.CaseID));
    if (selectedChapters.length > 0) filteredCases = filteredCases.filter(c => selectedChapters.includes(c.Chapter));
    if (selectedSources.length > 0) filteredCases = filteredCases.filter(c => selectedSources.includes(c.Source));
    
    if (filteredCases.length === 0 || requestedCount > filteredCases.length) {
        dom.osceError.textContent = `Only ${filteredCases.length} cases match your filters.`;
        dom.osceError.classList.remove('hidden');
        return;
    }

    const mockCases = [...filteredCases].sort(() => Math.random() - 0.5).slice(0, requestedCount);
    const totalQuestions = mockCases.reduce((acc, c) => acc + appState.allOsceQuestions.filter(q => q.CaseID === c.CaseID).length, 0);
    const totalDuration = totalQuestions * timePerQSeconds;
    startOsceQuiz(mockCases, "Custom OSCE", totalDuration);
}


function renderOsceQuestion() {
    const { cases, caseIndex, questionIndex } = appState.currentOsce;
    const currentCase = cases[caseIndex];
    const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID);
    const currentQuestion = caseQuestions[questionIndex];

    if (!currentQuestion) {
        handleOsceNext();
        return;
    }

    dom.osceCaseTitle.textContent = currentCase.Title;
    dom.osceCaseDescription.textContent = currentCase.CaseDescription;
    dom.osceCaseImageContainer.innerHTML = currentCase.ImageURL ? `<img src="${currentCase.ImageURL}" class="max-h-64 rounded-lg mx-auto mb-4 cursor-pointer" onclick="showImageModal('${currentCase.ImageURL}')">` : '';
    
    dom.osceProgressText.textContent = `Case ${caseIndex + 1}/${cases.length} - Question ${questionIndex + 1}/${caseQuestions.length}`;
    dom.osceQuestionText.textContent = currentQuestion.QuestionText;
    dom.osceQuestionImageContainer.innerHTML = currentQuestion.ImageURL ? `<img src="${currentQuestion.ImageURL}" class="max-h-48 rounded-lg mx-auto mb-4 cursor-pointer" onclick="showImageModal('${currentQuestion.ImageURL}')">` : '';

    dom.osceAnswerArea.innerHTML = '';
    dom.osceModelAnswerArea.innerHTML = '';
    dom.osceModelAnswerArea.classList.add('hidden');
    dom.osceSelfCorrectionArea.innerHTML = '';
    dom.osceSelfCorrectionArea.classList.add('hidden');

    const answerKey = `${currentCase.CaseID}_${currentQuestion.QuestionID}`;
    const userAnswer = appState.currentOsce.userAnswers[answerKey];

    if (currentQuestion.QuestionType === 'MCQ') {
        const shuffledAnswers = [...currentQuestion.answerOptions].sort(() => Math.random() - 0.5);
        shuffledAnswers.forEach(answer => {
            const button = document.createElement('button');
            button.textContent = answer.text;
            button.className = 'answer-btn w-full text-left p-4 rounded-lg bg-slate-100 hover:bg-slate-200';
            button.onclick = () => selectOsceAnswer(answer);
            dom.osceAnswerArea.appendChild(button);
        });
        if (userAnswer) showOsceMcqResult();
    } else { // Essay
        if (userAnswer) {
            dom.osceModelAnswerArea.innerHTML = `<p class="font-semibold">Model Answer:</p><p>${currentQuestion.EssayModelAnswer}</p>`;
            dom.osceModelAnswerArea.classList.remove('hidden');
            dom.osceSelfCorrectionArea.innerHTML = `<p class="text-center font-bold text-slate-600">You marked this as ${userAnswer.isCorrect ? 'Correct' : 'Incorrect'}.</p>`;
            dom.osceSelfCorrectionArea.classList.remove('hidden');
        } else {
            const showAnswerBtn = document.createElement('button');
            showAnswerBtn.textContent = 'Show Model Answer';
            showAnswerBtn.className = 'action-btn bg-green-600 text-white font-bold py-2 px-4 rounded-lg';
            showAnswerBtn.onclick = () => {
                dom.osceModelAnswerArea.innerHTML = `<p class="font-semibold">Model Answer:</p><p>${currentQuestion.EssayModelAnswer}</p>`;
                dom.osceModelAnswerArea.classList.remove('hidden');
                showAnswerBtn.classList.add('hidden');
                dom.osceSelfCorrectionArea.classList.remove('hidden');
                dom.osceSelfCorrectionArea.innerHTML = `
                    <p class="text-center font-semibold mb-2">Did you get it right?</p>
                    <div class="flex justify-center gap-4">
                        <button class="self-correct-btn action-btn bg-green-500 text-white font-bold py-2 px-4" data-correct="true">Correct</button>
                        <button class="self-correct-btn action-btn bg-red-500 text-white font-bold py-2 px-4" data-correct="false">Incorrect</button>
                    </div>`;
                dom.osceSelfCorrectionArea.querySelectorAll('.self-correct-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => handleOsceSelfCorrection(e.target.dataset.correct === 'true'));
                });
            };
            dom.osceAnswerArea.appendChild(showAnswerBtn);
        }
    }

    dom.oscePreviousBtn.disabled = caseIndex === 0 && questionIndex === 0;
    dom.osceNextBtn.textContent = (caseIndex === cases.length - 1 && questionIndex === caseQuestions.length - 1) ? 'Finish' : 'Next';
}

function selectOsceAnswer(selectedAnswer) {
    const { cases, caseIndex, questionIndex } = appState.currentOsce;
    const currentCase = cases[caseIndex];
    const currentQuestion = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID)[questionIndex];
    const answerKey = `${currentCase.CaseID}_${currentQuestion.QuestionID}`;
    
    if (appState.currentOsce.userAnswers[answerKey]) return;

    appState.currentOsce.userAnswers[answerKey] = { answer: selectedAnswer.text, isCorrect: selectedAnswer.isCorrect };
    if (selectedAnswer.isCorrect) appState.currentOsce.score++;
    
    updateOsceScoreDisplay();
    showOsceMcqResult();
}

function showOsceMcqResult() {
    const { cases, caseIndex, questionIndex, userAnswers } = appState.currentOsce;
    const currentCase = cases[caseIndex];
    const currentQuestion = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID)[questionIndex];
    const answerKey = `${currentCase.CaseID}_${currentQuestion.QuestionID}`;
    const userAnswer = userAnswers[answerKey];

    Array.from(dom.osceAnswerArea.querySelectorAll('.answer-btn')).forEach(button => {
        button.disabled = true;
        const isCorrect = currentQuestion.answerOptions.find(opt => opt.text === button.textContent)?.isCorrect;
        if (isCorrect) button.classList.add('correct');
        else if (userAnswer && button.textContent === userAnswer.answer) button.classList.add('incorrect', 'user-choice');
    });
}

function handleOsceSelfCorrection(isCorrect) {
    const { cases, caseIndex, questionIndex } = appState.currentOsce;
    const currentCase = cases[caseIndex];
    const currentQuestion = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID)[questionIndex];
    const answerKey = `${currentCase.CaseID}_${currentQuestion.QuestionID}`;

    if (appState.currentOsce.userAnswers[answerKey]) return;

    appState.currentOsce.userAnswers[answerKey] = { answer: isCorrect ? 'Correct' : 'Incorrect', isCorrect };
    if (isCorrect) appState.currentOsce.score++;
    
    updateOsceScoreDisplay();
    dom.osceSelfCorrectionArea.innerHTML = `<p class="text-center font-bold text-slate-600">Your answer has been recorded.</p>`;
}

function updateOsceScoreDisplay() {
    dom.osceScoreDisplay.textContent = `Score: ${appState.currentOsce.score}/${appState.currentOsce.totalQuestions}`;
}

function startOsceTimer(durationInSeconds) {
    clearInterval(appState.currentOsce.timerInterval);
    let timeLeft = durationInSeconds;
    dom.osceTimer.textContent = formatTime(timeLeft);
    appState.currentOsce.timerInterval = setInterval(() => {
        timeLeft--;
        dom.osceTimer.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(appState.currentOsce.timerInterval);
            endOsceQuiz(true);
        }
    }, 1000);
}

export function handleOsceNext() {
    const { cases, caseIndex, questionIndex } = appState.currentOsce;
    const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === cases[caseIndex].CaseID);

    if (questionIndex < caseQuestions.length - 1) {
        appState.currentOsce.questionIndex++;
    } else if (caseIndex < cases.length - 1) {
        appState.currentOsce.caseIndex++;
        appState.currentOsce.questionIndex = 0;
    } else {
        endOsceQuiz(true);
        return;
    }
    renderOsceQuestion();
}

export function handleOscePrevious() {
    if (appState.currentOsce.questionIndex > 0) {
        appState.currentOsce.questionIndex--;
    } else if (appState.currentOsce.caseIndex > 0) {
        appState.currentOsce.caseIndex--;
        const prevCase = appState.currentOsce.cases[appState.currentOsce.caseIndex];
        const prevCaseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === prevCase.CaseID);
        appState.currentOsce.questionIndex = prevCaseQuestions.length - 1;
    }
    renderOsceQuestion();
}

export function endOsceQuiz(isForced = false) {
    if (isForced) {
        showOsceResults();
    } else {
        ui.showConfirmationModal('End OSCE?', 'Are you sure you want to end this session?', () => {
            dom.modalBackdrop.classList.add('hidden');
            showOsceResults();
        });
    }
}

function showOsceResults() {
    clearInterval(appState.currentOsce.timerInterval);
    ui.showScreen(dom.quizContainer);
    dom.questionContainer.classList.add('hidden');
    dom.controlsContainer.classList.add('hidden');
    dom.resultsContainer.classList.remove('hidden');

    dom.resultsTitle.textContent = "OSCE Complete!";
    dom.resultsScoreText.innerHTML = `Your score is <span class="font-bold">${appState.currentOsce.score}</span> out of <span class="font-bold">${appState.currentOsce.totalQuestions}</span>.`;
    dom.restartBtn.classList.add('hidden');
    dom.reviewIncorrectBtn.classList.add('hidden');
    
    // Log OSCE activity
    // logUserActivity({ ... });
}

export function showOsceNavigator() {
    dom.osceNavigatorContent.innerHTML = '';
    appState.currentOsce.cases.forEach((caseItem, caseIdx) => {
        const caseDiv = document.createElement('div');
        caseDiv.className = 'border-b pb-2';
        caseDiv.innerHTML = `<h4 class="font-bold text-slate-700">Case ${caseIdx + 1}: ${caseItem.Title}</h4>`;
        const questionsGrid = document.createElement('div');
        questionsGrid.className = 'grid grid-cols-5 sm:grid-cols-8 gap-2 mt-2';
        
        const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === caseItem.CaseID);
        caseQuestions.forEach((q, qIdx) => {
            const button = document.createElement('button');
            button.textContent = qIdx + 1;
            button.className = 'navigator-btn w-10 h-10 rounded-md font-semibold';
            const answer = appState.currentOsce.userAnswers[`${caseItem.CaseID}_${q.QuestionID}`];
            if (!answer) button.classList.add('unanswered');
            else if (answer.isCorrect) button.classList.add('correct');
            else button.classList.add('incorrect');
            
            button.addEventListener('click', () => {
                appState.currentOsce.caseIndex = caseIdx;
                appState.currentOsce.questionIndex = qIdx;
                renderOsceQuestion();
                dom.modalBackdrop.classList.add('hidden');
            });
            questionsGrid.appendChild(button);
        });
        caseDiv.appendChild(questionsGrid);
        dom.osceNavigatorContent.appendChild(caseDiv);
    });

    dom.modalBackdrop.classList.remove('hidden');
    dom.osceNavigatorModal.classList.remove('hidden');
}