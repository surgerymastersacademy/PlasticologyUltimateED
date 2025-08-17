// js/features/quiz.js (FINAL AND COMPLETE VERSION)

import { appState, DEFAULT_TIME_PER_QUESTION, SIMULATION_Q_COUNT, SIMULATION_TOTAL_TIME_MINUTES } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logUserActivity, logIncorrectAnswer, logCorrectedMistake } from '../api.js';
import { formatTime } from '../utils.js';
import { showMainMenuScreen, openNoteModal } from '../main.js';
import { populateFilterOptions } from '../ui.js';

export function launchQuiz(questions, title, config = {}) {
    const {
        timePerQuestion = DEFAULT_TIME_PER_QUESTION,
        isReview = false,
        isMistakePractice = false,
        isSimulation = false,
        totalTimeSeconds = 0,
        pastAnswers = null
    } = config;

    appState.currentQuiz = { ...appState.currentQuiz, isReviewMode: isReview, isPracticingMistakes: isMistakePractice, isSimulationMode: isSimulation };

    ui.showScreen(dom.quizContainer);
    appState.currentQuiz.currentQuestionIndex = 0;
    appState.currentQuiz.score = 0;
    appState.currentQuiz.questions = questions;

    if (!isReview) {
        appState.currentQuiz.originalQuestions = [...questions];
        appState.currentQuiz.userAnswers = new Array(questions.length).fill(null);
        appState.currentQuiz.originalUserAnswers = appState.currentQuiz.userAnswers;
    } else {
        appState.currentQuiz.originalQuestions = [...questions]; 
        appState.currentQuiz.userAnswers = pastAnswers;
        appState.currentQuiz.originalUserAnswers = pastAnswers;
    }

    appState.currentQuiz.flaggedIndices.clear();
    dom.resultsContainer.classList.add('hidden');
    dom.questionContainer.classList.remove('hidden');
    dom.controlsContainer.classList.remove('hidden');
    dom.quizTitle.textContent = isReview ? `Review: ${title}` : title;
    dom.totalQuestionsSpan.textContent = questions.length;

    if (isSimulation) {
        startSimulationTimer(totalTimeSeconds);
    } else {
        appState.currentQuiz.timePerQuestion = timePerQuestion;
    }

    updateScoreBar();
    showQuestion();
}

function showQuestion() {
    resetQuizState();
    const currentQuestion = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];

    dom.hintBtn.style.display = appState.currentQuiz.isSimulationMode ? 'none' : 'block';

    if (currentQuestion.ImageURL) {
        const img = document.createElement('img');
        img.src = currentQuestion.ImageURL;
        img.className = 'max-h-48 rounded-lg mx-auto mb-4 cursor-pointer';
        img.addEventListener('click', () => ui.showImageModal(currentQuestion.ImageURL));
        dom.questionImageContainer.appendChild(img);
    }

    dom.questionText.textContent = currentQuestion.question;
    dom.progressText.textContent = `Question ${appState.currentQuiz.currentQuestionIndex + 1} of ${appState.currentQuiz.questions.length}`;
    dom.sourceText.textContent = `Source: ${currentQuestion.source || 'N/A'} | Chapter: ${currentQuestion.chapter || 'N/A'}`;
    dom.previousBtn.disabled = appState.currentQuiz.currentQuestionIndex === 0;

    const isLastQuestion = appState.currentQuiz.currentQuestionIndex === appState.currentQuiz.questions.length - 1;
    dom.nextSkipBtn.textContent = isLastQuestion ? 'Finish' : 'Next';

    dom.flagBtn.classList.toggle('flagged', appState.currentQuiz.flaggedIndices.has(appState.currentQuiz.currentQuestionIndex));
    const hasBookmark = appState.bookmarkedQuestions.has(currentQuestion.UniqueID);
    dom.bookmarkBtn.classList.toggle('bookmarked', hasBookmark);

    const shuffledAnswers = (appState.currentQuiz.isReviewMode || appState.currentQuiz.isSimulationMode) ? [...currentQuestion.answerOptions] : [...currentQuestion.answerOptions].sort(() => Math.random() - 0.5);

    shuffledAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.innerHTML = answer.text;
        button.className = 'answer-btn w-full text-left p-4 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-transparent';
        button.dataset.correct = answer.isCorrect;
        button.dataset.text = answer.text;
        button.addEventListener('click', (e) => selectAnswer(e, answer));
        const rationale = document.createElement('p');
        rationale.className = 'rationale text-sm mt-2 p-2 rounded-md';
        rationale.textContent = answer.rationale;
        const container = document.createElement('div');
        container.appendChild(button);
        container.appendChild(rationale);
        dom.answerButtons.appendChild(container);
    });

    const userAnswer = appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex];
    if (userAnswer !== null) {
        if (appState.currentQuiz.isSimulationMode) {
            const selectedButton = Array.from(dom.answerButtons.querySelectorAll('button')).find(btn => btn.dataset.text === userAnswer.answer);
            if (selectedButton) selectedButton.classList.add('bg-blue-200', 'border-blue-400', 'user-choice');
            dom.answerButtons.querySelectorAll('button').forEach(btn => btn.disabled = true);
        } else {
            showAnswerResult();
        }
    }

    if (!appState.currentQuiz.isReviewMode && !appState.currentQuiz.isSimulationMode) {
        startTimer();
    } else if (appState.currentQuiz.isReviewMode) {
        dom.timerDisplay.textContent = 'Review';
    }

    const hasNote = appState.userQuizNotes.some(note => note.QuizID === currentQuestion.UniqueID);
    dom.quizNoteBtn.classList.toggle('has-note', hasNote);
}

function selectAnswer(e, selectedAnswer) {
    if (appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] !== null) return;

    clearInterval(appState.currentQuiz.timerInterval);
    const currentQuestion = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
    const isCorrect = selectedAnswer.isCorrect;
    appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] = { answer: selectedAnswer.text, isCorrect };

    if (isCorrect) {
        appState.currentQuiz.score++;
        if (appState.currentQuiz.isPracticingMistakes) {
            logCorrectedMistake(currentQuestion.UniqueID);
        }
    } else if (!appState.currentQuiz.isPracticingMistakes && !appState.currentQuiz.isSimulationMode) {
        logIncorrectAnswer(currentQuestion.UniqueID, selectedAnswer.text);
    }

    if (appState.currentQuiz.isSimulationMode) {
        dom.answerButtons.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.text === selectedAnswer.text) {
                btn.classList.add('bg-blue-200', 'border-blue-400', 'user-choice');
            }
        });
        updateScoreBar();
    } else {
        showAnswerResult();
        updateScoreBar();
    }
}

function showResults() {
    clearInterval(appState.currentQuiz.timerInterval);
    clearInterval(appState.currentQuiz.simulationTimerInterval);

    dom.questionContainer.classList.add('hidden');
    dom.controlsContainer.classList.add('hidden');
    dom.resultsContainer.classList.remove('hidden');

    dom.resultsTitle.textContent = appState.currentQuiz.isSimulationMode ? "Simulation Complete!" : "Quiz Complete!";
    dom.resultsScoreText.innerHTML = `Your score is <span class="font-bold">${appState.currentQuiz.score}</span> out of <span class="font-bold">${appState.currentQuiz.originalQuestions.length}</span>.`;

    const incorrectCount = appState.currentQuiz.originalUserAnswers.filter(a => a && !a.isCorrect).length;
    dom.reviewIncorrectBtn.classList.toggle('hidden', incorrectCount === 0);
    if (incorrectCount > 0) dom.reviewIncorrectBtn.textContent = `Review ${incorrectCount} Incorrect`;

    if (!appState.currentQuiz.isReviewMode && !appState.currentQuiz.isPracticingMistakes) {
        logUserActivity({
            eventType: 'FinishQuiz',
            quizTitle: dom.quizTitle.textContent,
            score: appState.currentQuiz.score,
            totalQuestions: appState.currentQuiz.originalQuestions.length
        });
        if (appState.currentQuiz.isSimulationMode) {
            appState.currentQuiz.originalQuestions.forEach((q, index) => {
                const answer = appState.currentQuiz.originalUserAnswers[index];
                if (answer && !answer.isCorrect) logIncorrectAnswer(q.UniqueID, answer.answer);
            });
        }
    }
}

export function handleNextQuestion() {
    if (appState.currentQuiz.currentQuestionIndex < appState.currentQuiz.questions.length - 1) {
        appState.currentQuiz.currentQuestionIndex++;
        showQuestion();
    } else {
        showResults();
    }
}

export function handlePreviousQuestion() {
    if (appState.currentQuiz.currentQuestionIndex > 0) {
        appState.currentQuiz.currentQuestionIndex--;
        showQuestion();
    }
}

function startTimer() {
    if (appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] !== null) {
        dom.timerDisplay.textContent = 'Done';
        return;
    }
    let timeLeft = appState.currentQuiz.timePerQuestion;
    dom.timerDisplay.textContent = formatTime(timeLeft);
    appState.currentQuiz.timerInterval = setInterval(() => {
        timeLeft--;
        dom.timerDisplay.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(appState.currentQuiz.timerInterval);
            handleTimeUp();
        }
    }, 1000);
}

function startSimulationTimer(durationInSeconds) {
    clearInterval(appState.currentQuiz.simulationTimerInterval);
    let timeLeft = durationInSeconds;
    dom.timerDisplay.textContent = formatTime(timeLeft);
    appState.currentQuiz.simulationTimerInterval = setInterval(() => {
        timeLeft--;
        dom.timerDisplay.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(appState.currentQuiz.simulationTimerInterval);
            showResults();
        }
    }, 1000);
}

function handleTimeUp() {
    appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] = { answer: 'No Answer', isCorrect: false };
    showAnswerResult();
    updateScoreBar();
}

function updateScoreBar() {
    const total = appState.currentQuiz.questions.length;
    if (total === 0) return;
    const answered = appState.currentQuiz.userAnswers.filter(a => a !== null).length;
    const correct = appState.currentQuiz.userAnswers.filter(a => a && a.isCorrect).length;
    const incorrect = answered - correct;
    dom.scoreProgressText.textContent = `Score: ${correct} / ${answered}`;
    dom.scoreBarCorrect.style.width = `${(correct / total) * 100}%`;
    dom.scoreBarIncorrect.style.width = `${(incorrect / total) * 100}%`;
}

function resetQuizState() {
    clearInterval(appState.currentQuiz.timerInterval);
    dom.answerButtons.innerHTML = '';
    dom.questionImageContainer.innerHTML = '';
    dom.hintText.classList.add('hidden');
}

function showAnswerResult() {
    const userAnswer = appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex];
    Array.from(dom.answerButtons.children).forEach(container => {
        const button = container.querySelector('button');
        const rationale = container.querySelector('.rationale');
        button.disabled = true;

        if (button.dataset.correct === 'true') {
            button.classList.add('correct');
            rationale.classList.add('bg-green-100', 'visible');
        } else {
            if (userAnswer && button.dataset.text === userAnswer.answer) {
                button.classList.add('incorrect', 'user-choice');
            }
            rationale.classList.add('bg-red-100', 'visible');
        }
    });
    dom.hintBtn.classList.add('hidden');
}

export function handleMockExamStart() {
    dom.mockError.classList.add('hidden');
    const requestedCount = parseInt(dom.mockQCountInput.value, 10);
    if (isNaN(requestedCount) || requestedCount <= 0) {
        dom.mockError.textContent = "Please enter a valid number of questions.";
        dom.mockError.classList.remove('hidden');
        return;
    }
    const customTime = parseInt(dom.customTimerInput.value, 10);
    const selectedChapters = [...dom.chapterSelectMock.querySelectorAll('input:checked')].map(el => el.value);
    const selectedSources = [...dom.sourceSelectMock.querySelectorAll('input:checked')].map(el => el.value);

    let filteredQuestions = appState.allQuestions;
    if (selectedChapters.length > 0) filteredQuestions = filteredQuestions.filter(q => selectedChapters.includes(q.chapter));
    if (selectedSources.length > 0) filteredQuestions = filteredQuestions.filter(q => selectedSources.includes(q.source));

    if (filteredQuestions.length === 0 || requestedCount > filteredQuestions.length) {
        dom.mockError.textContent = `Only ${filteredQuestions.length} questions available for this filter.`;
        dom.mockError.classList.remove('hidden');
        return;
    }

    const mockQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5).slice(0, requestedCount);
    const config = { timePerQuestion: (customTime > 0) ? customTime : DEFAULT_TIME_PER_QUESTION };
    launchQuiz(mockQuestions, "Custom Mock Exam", config);
}

export function handleStartSimulation() {
    dom.simulationError.classList.add('hidden');
    if (appState.allQuestions.length < SIMULATION_Q_COUNT) {
        dom.simulationError.textContent = `Not enough questions available. (Required: ${SIMULATION_Q_COUNT})`;
        dom.simulationError.classList.remove('hidden');
        return;
    }
    const simulationQuestions = [...appState.allQuestions].sort(() => Math.random() - 0.5).slice(0, SIMULATION_Q_COUNT);
    const totalTimeSeconds = SIMULATION_TOTAL_TIME_MINUTES * 60;
    const config = { isSimulation: true, totalTimeSeconds };
    launchQuiz(simulationQuestions, "Exam Simulation", config);
}

export function startChapterQuiz(chapterName, questionsToUse) {
    const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
    launchQuiz(shuffled, chapterName);
}

export function triggerEndQuiz() {
    if (appState.currentQuiz.isReviewMode) {
        showMainMenuScreen();
        return;
    }
    ui.showConfirmationModal('End Quiz?', 'Are you sure you want to end this quiz?', () => {
        dom.modalBackdrop.classList.add('hidden');
        showResults();
    });
}

export function handleQBankSearch() {
    const searchTerm = dom.qbankSearchInput.value.trim().toLowerCase();
    dom.qbankSearchError.classList.add('hidden');
    dom.qbankSearchResultsContainer.classList.add('hidden');

    if (searchTerm.length < 3) {
        dom.qbankSearchError.textContent = 'Please enter at least 3 characters.';
        dom.qbankSearchError.classList.remove('hidden');
        return;
    }

    const results = appState.allQuestions.filter(q => q.question.toLowerCase().includes(searchTerm) || q.answerOptions.some(opt => opt.text.toLowerCase().includes(searchTerm)));
    appState.qbankSearchResults = results;

    if (results.length === 0) {
        dom.qbankSearchError.textContent = `No questions found for "${dom.qbankSearchInput.value}".`;
        dom.qbankSearchError.classList.remove('hidden');
    } else {
        dom.qbankSearchResultsInfo.textContent = `Found ${results.length} questions.`;
        dom.qbankSearchResultsContainer.classList.remove('hidden');
    }
}

export function startSearchedQuiz() {
    const requestedCount = parseInt(dom.qbankSearchQCount.value, 10);
    const questionsToUse = appState.qbankSearchResults;
    dom.qbankSearchError.classList.add('hidden');

    if (!isNaN(requestedCount) && requestedCount > 0) {
        if (requestedCount > questionsToUse.length) {
            dom.qbankSearchError.textContent = `Only ${questionsToUse.length} questions found.`;
            dom.qbankSearchError.classList.remove('hidden');
            return;
        }
        const quizQuestions = [...questionsToUse].sort(() => Math.random() - 0.5).slice(0, requestedCount);
        launchQuiz(quizQuestions, `Quiz for "${dom.qbankSearchInput.value}"`);
    } else {
        const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
        launchQuiz(shuffled, `Quiz for "${dom.qbankSearchInput.value}"`);
    }
}

// THIS IS THE MISSING FUNCTION, NOW ADDED AND EXPORTED
export function updateChapterFilter() {
    const selectedSources = [...dom.sourceSelectMock.querySelectorAll('input:checked')].map(el => el.value);
    
    let relevantQuestions = selectedSources.length === 0 
        ? appState.allQuestions
        : appState.allQuestions.filter(q => selectedSources.includes(q.source || 'Uncategorized'));

    const chapterCounts = {};
    relevantQuestions.forEach(q => {
        const chapter = q.chapter || 'Uncategorized';
        chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1;
    });

    // This function needs to exist in ui.js to populate the checkboxes
    populateFilterOptions(dom.chapterSelectMock, Object.keys(chapterCounts).sort(), 'mock-chapter', chapterCounts);
}
