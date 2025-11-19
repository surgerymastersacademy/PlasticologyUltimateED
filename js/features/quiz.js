// js/features/quiz.js (FINAL VERSION - WITH CUSTOM SIMULATION LOGIC)

import { appState, DEFAULT_TIME_PER_QUESTION, SIMULATION_Q_COUNT, SIMULATION_TOTAL_TIME_MINUTES, API_URL } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logUserActivity, logIncorrectAnswer, logCorrectedMistake } from '../api.js';
import { formatTime, parseQuestions } from '../utils.js';
import { showMainMenuScreen } from '../main.js';
import { saveUserProgress } from './lectures.js';

// --- HELPER FUNCTIONS ---

function getQuestionPool() {
    const isUnansweredOnly = document.getElementById('scope-unanswered') && document.getElementById('scope-unanswered').checked;
    if (isUnansweredOnly) {
        return appState.allQuestions.filter(q => !appState.answeredQuestions.has(q.UniqueID));
    }
    return appState.allQuestions;
}

function showChaptersForSource(sourceName) {
    const questionPool = getQuestionPool();
    const sourceSpecificQuestions = questionPool.filter(q => (q.source || 'Uncategorized') === sourceName);

    dom.listTitle.textContent = `Source: ${sourceName}`;
    dom.listItems.innerHTML = '';

    const allButton = document.createElement('button');
    allButton.className = 'action-btn p-4 bg-blue-600 text-white rounded-lg shadow-md text-center hover:bg-blue-700 col-span-full';
    allButton.innerHTML = `
        <h3 class="font-bold text-lg">Start Quiz for All of ${sourceName}</h3>
        <p class="text-sm font-light">${sourceSpecificQuestions.length} Questions</p>
    `;
    allButton.addEventListener('click', () => {
        launchQuiz(sourceSpecificQuestions, sourceName);
    });
    dom.listItems.appendChild(allButton);

    const chapterCounts = sourceSpecificQuestions.reduce((acc, q) => {
        const chapter = q.chapter || 'Uncategorized';
        acc[chapter] = (acc[chapter] || 0) + 1;
        return acc;
    }, {});

    const chapters = Object.keys(chapterCounts).sort();

    if (chapters.length > 0) {
        const separator = document.createElement('div');
        separator.className = 'col-span-full border-t my-4';
        separator.innerHTML = `<p class="text-center text-slate-500 bg-slate-50 -mt-3 mx-auto w-48">Or Choose a Chapter</p>`;
        dom.listItems.appendChild(separator);

        chapters.forEach(chapter => {
            const button = document.createElement('button');
            button.className = 'action-btn p-4 bg-white rounded-lg shadow-sm text-center hover:bg-slate-50';
            button.innerHTML = `
                <h3 class="font-bold text-slate-800">${chapter}</h3>
                <p class="text-sm text-slate-500">${chapterCounts[chapter]} Questions</p>
            `;
            button.addEventListener('click', () => {
                const chapterAndSourceQuestions = sourceSpecificQuestions.filter(q => (q.chapter || 'Uncategorized') === chapter);
                launchQuiz(chapterAndSourceQuestions, `${sourceName} - ${chapter}`);
            });
            dom.listItems.appendChild(button);
        });
    }
}

// --- RESULT SCREEN & REVIEW FUNCTIONS ---

export function restartCurrentQuiz() {
    const config = {
        timePerQuestion: appState.currentQuiz.timePerQuestion,
        isSimulation: appState.currentQuiz.isSimulationMode,
        totalTimeSeconds: appState.currentQuiz.isSimulationMode ? SIMULATION_TOTAL_TIME_MINUTES * 60 : 0
    };
    launchQuiz(appState.currentQuiz.originalQuestions, dom.quizTitle.textContent.replace('Review Incorrect: ', ''), config);
}

export function reviewIncorrectAnswers() {
    const incorrectQuestions = [];
    appState.currentQuiz.originalUserAnswers.forEach((answer, index) => {
        if (answer && !answer.isCorrect) {
            incorrectQuestions.push(appState.currentQuiz.originalQuestions[index]);
        }
    });
    launchQuiz(incorrectQuestions, `Review Incorrect: ${dom.quizTitle.textContent}`);
}

export function startSimulationReview() {
    const config = {
        isReview: true,
        isSimulationReview: true,
        pastAnswers: appState.currentQuiz.originalUserAnswers
    };
    launchQuiz(appState.currentQuiz.originalQuestions, `Review: ${dom.quizTitle.textContent}`, config);
}

// --- IN-QUIZ BUTTON FUNCTIONS ---

export function toggleBookmark() {
    const question = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
    if (!question) return;

    if (appState.bookmarkedQuestions.has(question.UniqueID)) {
        appState.bookmarkedQuestions.delete(question.UniqueID);
        dom.bookmarkBtn.classList.remove('bookmarked');
    } else {
        appState.bookmarkedQuestions.add(question.UniqueID);
        dom.bookmarkBtn.classList.add('bookmarked');
    }
    saveUserProgress();
}

export function toggleFlag() {
    const index = appState.currentQuiz.currentQuestionIndex;
    if (appState.currentQuiz.flaggedIndices.has(index)) {
        appState.currentQuiz.flaggedIndices.delete(index);
        dom.flagBtn.classList.remove('flagged');
    } else {
        appState.currentQuiz.flaggedIndices.add(index);
        dom.flagBtn.classList.add('flagged');
    }
}

export function showHint() {
    const question = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
    if (question && question.hint) {
        dom.hintText.textContent = question.hint;
        dom.hintText.classList.remove('hidden');
    } else {
        dom.hintText.textContent = 'No hint available for this question.';
        dom.hintText.classList.remove('hidden');
    }
}

export function showQuestionNavigator() {
    dom.navigatorGrid.innerHTML = '';
    appState.currentQuiz.questions.forEach((_, index) => {
        const button = document.createElement('button');
        button.textContent = index + 1;
        button.className = 'navigator-btn w-10 h-10 rounded-md font-semibold flex items-center justify-center relative';
        const answer = appState.currentQuiz.userAnswers[index];
        if (answer === null || answer.answer === 'No Answer') {
            button.classList.add('unanswered');
        } else if (answer.isCorrect) {
            button.classList.add('correct');
        } else {
            button.classList.add('incorrect');
        }
        if (appState.currentQuiz.flaggedIndices.has(index)) {
            const flagIcon = document.createElement('i');
            flagIcon.className = 'fas fa-flag flag-icon';
            button.appendChild(flagIcon);
        }
        button.addEventListener('click', () => {
            appState.currentQuiz.currentQuestionIndex = index;
            showQuestion();
            dom.modalBackdrop.classList.add('hidden');
        });
        dom.navigatorGrid.appendChild(button);
    });
    dom.questionNavigatorModal.classList.remove('hidden');
    dom.modalBackdrop.classList.remove('hidden');
}

// --- CORE QUIZ LOGIC ---

export function launchQuiz(questions, title, config = {}) {
    const {
        timePerQuestion = DEFAULT_TIME_PER_QUESTION,
        isReview = false,
        isMistakePractice = false,
        isSimulation = false,
        isSimulationReview = false,
        totalTimeSeconds = 0,
        pastAnswers = null
    } = config;

    appState.currentQuiz = { 
        ...appState.currentQuiz, 
        isReviewMode: isReview, 
        isPracticingMistakes: isMistakePractice, 
        isSimulationMode: isSimulation,
        isSimulationReview: isSimulationReview
    };

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
    dom.quizTitle.textContent = title;
    dom.totalQuestionsSpan.textContent = questions.length;

    if (isSimulation) {
        startSimulationTimer(totalTimeSeconds);
    } else if (!isReview) {
        appState.currentQuiz.timePerQuestion = timePerQuestion;
    }

    updateScoreBar();
    showQuestion();
}

function showQuestion() {
    resetQuizState();
    const quizState = appState.currentQuiz;
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    
    const isMultipleChoice = currentQuestion.QuestionType?.toLowerCase() === 'multiple';

    if (isMultipleChoice) {
        const notice = document.createElement('p');
        notice.id = 'multiple-choice-notice';
        notice.className = 'text-sm text-blue-600 font-semibold text-center mb-2';
        notice.textContent = '(This question may have more than one correct answer)';
        dom.questionText.parentNode.insertBefore(notice, dom.questionText.nextSibling);
    }

    dom.hintBtn.style.display = (quizState.isSimulationMode || quizState.isSimulationReview) ? 'none' : 'block';

    if (currentQuestion.ImageURL) {
        const img = document.createElement('img');
        img.src = currentQuestion.ImageURL;
        img.className = 'max-h-48 rounded-lg mx-auto mb-4 cursor-pointer';
        img.addEventListener('click', () => ui.showImageModal(currentQuestion.ImageURL));
        dom.questionImageContainer.appendChild(img);
    }

    dom.questionText.textContent = currentQuestion.question;
    dom.progressText.textContent = `Question ${quizState.currentQuestionIndex + 1} of ${quizState.questions.length}`;
    dom.sourceText.textContent = `Source: ${currentQuestion.source || 'N/A'} | Chapter: ${currentQuestion.chapter || 'N/A'}`;
    dom.previousBtn.disabled = quizState.currentQuestionIndex === 0;

    const isLastQuestion = quizState.currentQuestionIndex === quizState.questions.length - 1;
    const isAnswered = quizState.userAnswers[quizState.currentQuestionIndex] !== null;
    
    if (isMultipleChoice && !isAnswered && !quizState.isReviewMode) {
        dom.nextSkipBtn.textContent = 'Submit Answer';
    } else {
        dom.nextSkipBtn.textContent = (isLastQuestion && !quizState.isReviewMode) ? 'Finish' : 'Next';
    }

    dom.flagBtn.classList.toggle('flagged', quizState.flaggedIndices.has(quizState.currentQuestionIndex));
    dom.bookmarkBtn.classList.toggle('bookmarked', appState.bookmarkedQuestions.has(currentQuestion.UniqueID));
    
    dom.answerButtons.className = currentQuestion.answerOptions.length >= 5 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4';

    const shuffledAnswers = (quizState.isReviewMode || quizState.isSimulationMode) ? [...currentQuestion.answerOptions] : [...currentQuestion.answerOptions].sort(() => Math.random() - 0.5);

    shuffledAnswers.forEach(answer => {
        const inputType = isMultipleChoice ? 'checkbox' : 'radio';
        const container = document.createElement('div');
        const label = document.createElement('label');
        label.className = 'answer-btn w-full text-left p-4 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-transparent flex items-center cursor-pointer';
        label.dataset.correct = answer.isCorrect;
        label.dataset.text = answer.text;

        const input = document.createElement('input');
        input.type = inputType;
        input.name = 'answer-option';
        input.value = answer.text;
        input.className = 'mr-3 h-5 w-5';

        if (!isMultipleChoice) {
            input.addEventListener('click', (e) => selectAnswer(e, answer));
        }
        
        const answerText = document.createElement('span');
        answerText.innerHTML = answer.text;

        label.appendChild(input);
        label.appendChild(answerText);
        
        const rationale = document.createElement('p');
        rationale.className = 'rationale text-sm mt-2 p-2 rounded-md';
        rationale.textContent = answer.rationale;

        container.appendChild(label);
        container.appendChild(rationale);
        dom.answerButtons.appendChild(container);
    });

    const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];
    if (userAnswer !== null) {
        if (quizState.isSimulationReview) {
            showSimulationReviewResult();
        } else if (quizState.isSimulationMode) {
            const selectedAnswers = isMultipleChoice ? userAnswer.answer : [userAnswer.answer];
            Array.from(dom.answerButtons.querySelectorAll('label')).forEach(label => {
                const input = label.querySelector('input');
                if (selectedAnswers.includes(input.value)) {
                    label.classList.add('simulation-selected');
                    if (isMultipleChoice) input.checked = true;
                }
            });
        } else {
            showAnswerResult();
        }
    }

    if (quizState.isReviewMode) {
        dom.timerDisplay.textContent = 'Review';
    } else if (!quizState.isSimulationMode) {
        startTimer();
    }

    const hasNote = appState.userQuizNotes.some(note => note.QuizID === currentQuestion.UniqueID);
    dom.quizNoteBtn.classList.toggle('has-note', hasNote);
}

function selectAnswer(e, selectedAnswer) {
    const quizState = appState.currentQuiz;
    const currentQuestionIndex = quizState.currentQuestionIndex;
    const currentQuestion = quizState.questions[currentQuestionIndex];

    if (currentQuestion.QuestionType?.toLowerCase() === 'multiple') {
        if (quizState.isSimulationMode) {
            const selectedCheckboxes = Array.from(dom.answerButtons.querySelectorAll('input[type="checkbox"]:checked'));
            const selectedAnswersText = selectedCheckboxes.map(cb => cb.value);
            quizState.userAnswers[currentQuestionIndex] = { answer: selectedAnswersText, isCorrect: null };
            
            dom.answerButtons.querySelectorAll('label').forEach(lbl => lbl.classList.remove('simulation-selected'));
            selectedCheckboxes.forEach(cb => cb.closest('label').classList.add('simulation-selected'));
            updateScoreBar();
        }
        return; 
    }
    
    if (quizState.isReviewMode) return;

    if (quizState.isSimulationMode) {
        quizState.userAnswers[currentQuestionIndex] = { answer: selectedAnswer.text, isCorrect: selectedAnswer.isCorrect };
        
        dom.answerButtons.querySelectorAll('label').forEach(lbl => lbl.classList.remove('simulation-selected'));
        e.target.closest('label').classList.add('simulation-selected');
        updateScoreBar();
        return;
    }

    if (quizState.userAnswers[currentQuestionIndex] !== null) return;

    const isCorrect = selectedAnswer.isCorrect;
    quizState.userAnswers[currentQuestionIndex] = { answer: selectedAnswer.text, isCorrect: isCorrect };
    clearInterval(quizState.timerInterval);

    if (isCorrect) {
        quizState.score++;
        if(quizState.isPracticingMistakes) logCorrectedMistake(currentQuestion.UniqueID);
    } else if (!quizState.isPracticingMistakes) {
        logIncorrectAnswer(currentQuestion.UniqueID, selectedAnswer.text);
    }
    
    showAnswerResult();
    updateScoreBar();
}


function showResults() {
    clearInterval(appState.currentQuiz.timerInterval);
    clearInterval(appState.currentQuiz.simulationTimerInterval);

    dom.questionContainer.classList.add('hidden');
    dom.controlsContainer.classList.add('hidden');
    dom.resultsContainer.classList.remove('hidden');

    const totalQuestions = appState.currentQuiz.originalQuestions.length;
    let finalScore = appState.currentQuiz.score;

    if (appState.currentQuiz.isSimulationMode) {
        finalScore = 0;
        appState.currentQuiz.originalQuestions.forEach((q, index) => {
            const userAnswer = appState.currentQuiz.originalUserAnswers[index];
            if (!userAnswer) return;

            const isMultiple = q.QuestionType?.toLowerCase() === 'multiple';
            const correctAnswers = (q.CorrectAnswer || '').split('||').map(a => a.trim());
            
            let isCorrect = false;
            if (isMultiple) {
                const selected = userAnswer.answer || [];
                isCorrect = correctAnswers.length === selected.length && correctAnswers.every(a => selected.includes(a));
            } else {
                isCorrect = userAnswer.answer === correctAnswers[0];
            }
            
            if(isCorrect) finalScore++;
            userAnswer.isCorrect = isCorrect;
        });
        appState.currentQuiz.score = finalScore;
    }

    dom.resultsTitle.textContent = appState.currentQuiz.isSimulationMode ? "Simulation Complete!" : "Quiz Complete!";
    dom.resultsScoreText.innerHTML = `Your score is <span class="font-bold">${finalScore}</span> out of <span class="font-bold">${totalQuestions}</span>.`;
    
    const incorrectCount = appState.currentQuiz.originalUserAnswers.filter(a => a && !a.isCorrect).length;
    const isSimulation = appState.currentQuiz.isSimulationMode;
    const reviewSimulationBtn = document.getElementById('review-simulation-btn');

    dom.reviewIncorrectBtn.classList.toggle('hidden', isSimulation || incorrectCount === 0);
    if (reviewSimulationBtn) reviewSimulationBtn.classList.toggle('hidden', !isSimulation);
    dom.restartBtn.classList.toggle('hidden', isSimulation);

    if (!isSimulation && incorrectCount > 0) {
        dom.reviewIncorrectBtn.textContent = `Review ${incorrectCount} Incorrect`;
    }

    if (!appState.currentQuiz.isReviewMode && !appState.currentQuiz.isPracticingMistakes) {
        const attemptedQuestions = appState.currentQuiz.originalUserAnswers.filter(a => a !== null).length;
        
        // Immediate Local Sync
        appState.currentQuiz.originalQuestions.forEach((q, index) => {
            const answer = appState.currentQuiz.originalUserAnswers[index];
            if (answer && answer.answer !== 'No Answer') {
                appState.answeredQuestions.add(q.UniqueID);
            }
        });

        logUserActivity({
            eventType: 'FinishQuiz',
            quizTitle: dom.quizTitle.textContent,
            score: finalScore,
            totalQuestions: totalQuestions,
            attemptedQuestions: attemptedQuestions,
        });

        if (isSimulation) {
            appState.currentQuiz.originalQuestions.forEach((q, index) => {
                const answer = appState.currentQuiz.originalUserAnswers[index];
                if (answer && !answer.isCorrect) {
                    const answerText = Array.isArray(answer.answer) ? answer.answer.join('||') : answer.answer;
                    logIncorrectAnswer(q.UniqueID, answerText);
                }
            });
        }
    }
}


function checkMultipleAnswers() {
    const quizState = appState.currentQuiz;
    const currentQuestionIndex = quizState.currentQuestionIndex;
    const currentQuestion = quizState.questions[currentQuestionIndex];
    
    if (quizState.userAnswers[currentQuestionIndex] !== null) return;

    const selectedCheckboxes = Array.from(dom.answerButtons.querySelectorAll('input[type="checkbox"]:checked'));
    if (selectedCheckboxes.length === 0 && !quizState.isReviewMode) {
        ui.showConfirmationModal('No Answer Selected', 'Please select at least one answer before submitting.', () => dom.modalBackdrop.classList.add('hidden'));
        return false;
    }

    const selectedAnswers = selectedCheckboxes.map(cb => cb.value.trim());
    const correctAnswers = (currentQuestion.CorrectAnswer || '').split('||').map(a => a.trim());

    const allCorrectSelected = selectedAnswers.every(sa => correctAnswers.includes(sa));
    const allCorrectAvailable = correctAnswers.every(ca => selectedAnswers.includes(ca));
    const isCorrect = allCorrectSelected && allCorrectAvailable;

    quizState.userAnswers[currentQuestionIndex] = { answer: selectedAnswers, isCorrect: isCorrect };
    clearInterval(quizState.timerInterval);

    if (isCorrect) {
        quizState.score++;
        if (quizState.isPracticingMistakes) logCorrectedMistake(currentQuestion.UniqueID);
    } else if (!quizState.isPracticingMistakes) {
        logIncorrectAnswer(currentQuestion.UniqueID, selectedAnswers.join('||'));
    }
    
    showAnswerResult();
    updateScoreBar();
    return true;
}


export function handleNextQuestion() {
    const quizState = appState.currentQuiz;
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const isMultipleChoice = currentQuestion.QuestionType?.toLowerCase() === 'multiple';
    const isAnswered = quizState.userAnswers[quizState.currentQuestionIndex] !== null;

    if (isMultipleChoice && !isAnswered && !quizState.isReviewMode && !quizState.isSimulationMode) {
        const submissionSuccessful = checkMultipleAnswers();
        if (!submissionSuccessful) return;
        dom.nextSkipBtn.textContent = (quizState.currentQuestionIndex === quizState.questions.length - 1) ? 'Finish' : 'Next';
        return;
    }

    if (appState.currentQuiz.currentQuestionIndex < appState.currentQuiz.questions.length - 1) {
        appState.currentQuiz.currentQuestionIndex++;
        showQuestion();
    } else {
        triggerEndQuiz();
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
    const currentQuestion = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
    const isMultipleChoice = currentQuestion.QuestionType?.toLowerCase() === 'multiple';
    const noAnswer = isMultipleChoice ? { answer: [], isCorrect: false } : { answer: 'No Answer', isCorrect: false };
    
    appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] = noAnswer;
    showAnswerResult();
    updateScoreBar();
}

function updateScoreBar() {
    const total = appState.currentQuiz.questions.length;
    if (total === 0) return;

    if (appState.currentQuiz.isSimulationMode) {
        const answered = appState.currentQuiz.userAnswers.filter(a => a !== null).length;
        dom.scoreProgressText.textContent = `Answered: ${answered} / ${total}`;
        dom.scoreBarCorrect.style.width = '0%';
        dom.scoreBarIncorrect.style.width = '0%';
        dom.scoreBarAnswered.classList.remove('hidden');
        dom.scoreBarAnswered.style.width = `${(answered / total) * 100}%`;
    } else {
        const answered = appState.currentQuiz.userAnswers.filter(a => a !== null).length;
        const correct = appState.currentQuiz.userAnswers.filter(a => a && a.isCorrect).length;
        const incorrect = answered - correct;
        dom.scoreProgressText.textContent = `Score: ${correct} / ${answered}`;
        dom.scoreBarCorrect.style.width = `${(correct / total) * 100}%`;
        dom.scoreBarIncorrect.style.width = `${(incorrect / total) * 100}%`;
        dom.scoreBarAnswered.classList.add('hidden');
    }
}

function resetQuizState() {
    clearInterval(appState.currentQuiz.timerInterval);
    dom.answerButtons.innerHTML = '';
    dom.questionImageContainer.innerHTML = '';
    dom.hintText.classList.add('hidden');
    const notice = document.getElementById('multiple-choice-notice');
    if(notice) notice.remove();
}

function showAnswerResult() {
    const quizState = appState.currentQuiz;
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];
    const isMultipleChoice = currentQuestion.QuestionType?.toLowerCase() === 'multiple';

    Array.from(dom.answerButtons.children).forEach(container => {
        const label = container.querySelector('label');
        const input = container.querySelector('input');
        const rationale = container.querySelector('.rationale');
        input.disabled = true;

        const isCorrectOption = label.dataset.correct === 'true';
        
        if (isCorrectOption) {
            label.classList.add('correct');
            rationale.classList.add('bg-green-100', 'visible');
        } else {
            rationale.classList.add('bg-red-100', 'visible');
        }

        if (userAnswer) {
            const userSelections = isMultipleChoice ? userAnswer.answer : [userAnswer.answer];
            if (userSelections.includes(input.value)) {
                if (!isCorrectOption) {
                    label.classList.add('incorrect', 'user-choice');
                }
                if (isMultipleChoice) input.checked = true;
            }
        }
    });
}

function showSimulationReviewResult() {
    const quizState = appState.currentQuiz;
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];
    const isMultipleChoice = currentQuestion.QuestionType?.toLowerCase() === 'multiple';
    
    Array.from(dom.answerButtons.children).forEach(container => {
        const label = container.querySelector('label');
        const input = container.querySelector('input');
        const rationale = container.querySelector('.rationale');
        input.disabled = true;
        const isCorrectOption = label.dataset.correct === 'true';

        rationale.classList.add('visible');
        rationale.classList.toggle('bg-green-100', isCorrectOption);
        rationale.classList.toggle('bg-red-100', !isCorrectOption);

        if (isCorrectOption) {
            label.classList.add('correct');
        }

        if (userAnswer) {
            const userSelections = isMultipleChoice ? userAnswer.answer : [userAnswer.answer];
            if (userSelections.includes(input.value)) {
                if (!userAnswer.isCorrect && !isCorrectOption) {
                    label.classList.add('incorrect', 'user-choice');
                }
                input.checked = true;
            }
        }
    });
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

// --- QUIZ CREATION/STARTING FUNCTIONS ---

export function handleMockExamStart() {
    dom.mockError.classList.add('hidden');
    const requestedCount = parseInt(dom.mockQCountInput.value, 10);
    if (isNaN(requestedCount) || requestedCount <= 0) {
        dom.mockError.textContent = "Please enter a valid number of questions.";
        dom.mockError.classList.remove('hidden');
        return;
    }
    const customTime = parseInt(dom.customTimerInput.value, 10);
    
    let questionPool = getQuestionPool();
    const selectedChapters = [...dom.chapterSelectMock.querySelectorAll('input:checked')].map(el => el.value);
    const selectedSources = [...dom.sourceSelectMock.querySelectorAll('input:checked')].map(el => el.value);

    let filteredQuestions = questionPool;
    if (selectedChapters.length > 0) filteredQuestions = filteredQuestions.filter(q => selectedChapters.includes(q.chapter));
    if (selectedSources.length > 0) filteredQuestions = filteredQuestions.filter(q => selectedSources.includes(q.source));

    if (filteredQuestions.length === 0 || requestedCount > filteredQuestions.length) {
        dom.mockError.textContent = `Only ${filteredQuestions.length} questions available for your combined filters. Please broaden your criteria.`;
        dom.mockError.classList.remove('hidden');
        return;
    }

    const mockQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5).slice(0, requestedCount);
    const config = { timePerQuestion: (customTime > 0) ? customTime : DEFAULT_TIME_PER_QUESTION };
    launchQuiz(mockQuestions, "Custom Mock Exam", config);
}

// --- NEW SIMULATION START LOGIC (CUSTOMIZABLE) ---

export function handleStartSimulation() {
    dom.simulationError.classList.add('hidden');
    
    // 1. Get base pool
    let questionPool = getQuestionPool();

    // 2. Read Simulation Filters (Safe check for undefined elements)
    let selectedSources = [];
    let selectedChapters = [];

    if (dom.sourceSelectSim) {
        selectedSources = [...dom.sourceSelectSim.querySelectorAll('input:checked')].map(el => el.value);
    }
    
    if (dom.chapterSelectSim) {
        selectedChapters = [...dom.chapterSelectSim.querySelectorAll('input:checked')].map(el => el.value);
    }

    // 3. Apply Filters (if any selection is made)
    if (selectedSources.length > 0) {
        questionPool = questionPool.filter(q => selectedSources.includes(q.source || 'Uncategorized'));
    }
    if (selectedChapters.length > 0) {
        questionPool = questionPool.filter(q => selectedChapters.includes(q.chapter || 'Uncategorized'));
    }

    // 4. Validate Pool Size
    if (questionPool.length === 0) {
        dom.simulationError.textContent = `No questions match your criteria. Please select more sources or chapters.`;
        dom.simulationError.classList.remove('hidden');
        return;
    }

    // 5. Select Random Questions (Max 100)
    const simulationQuestions = [...questionPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, SIMULATION_Q_COUNT);

    // 6. Calculate Time dynamically (1.2 mins per question)
    const actualCount = simulationQuestions.length;
    const totalTimeSeconds = Math.floor((actualCount / 100) * SIMULATION_TOTAL_TIME_MINUTES * 60);

    const config = { isSimulation: true, totalTimeSeconds };
    launchQuiz(simulationQuestions, "Exam Simulation", config);
}

export function startChapterQuiz(chapterName, questionsToUse) {
    const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
    launchQuiz(shuffled, chapterName);
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
    
    const questionPool = getQuestionPool();
    const results = questionPool.filter(q => {
        const questionText = q.question.toLowerCase();
        const answersText = q.answerOptions.map(opt => opt.text.toLowerCase()).join(' '); 
        const keywordsText = (q.Keywords || '').toLowerCase();
        return questionText.includes(searchTerm) || answersText.includes(searchTerm) || keywordsText.includes(searchTerm);
    });

    appState.qbankSearchResults = results;
    dom.qbankMainContent.classList.add('hidden');

    if (results.length === 0) {
        dom.qbankSearchError.textContent = `No questions found for "${dom.qbankSearchInput.value}".`;
        dom.qbankSearchError.classList.remove('hidden');
    } else {
        const sourceCounts = results.reduce((acc, q) => {
            const source = q.source || 'Uncategorized';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});
        let resultsHtml = `<p class="font-bold text-lg mb-2">Found ${results.length} questions for "${dom.qbankSearchInput.value}", distributed as follows:</p>`;
        resultsHtml += '<ul class="list-disc list-inside text-left">';
        for (const source in sourceCounts) {
            resultsHtml += `<li><strong>${source}:</strong> ${sourceCounts[source]} Questions</li>`;
        }
        resultsHtml += '</ul>';
        dom.qbankSearchResultsInfo.innerHTML = resultsHtml;
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

export function updateChapterFilter() {
    const questionPool = getQuestionPool();
    const selectedSources = [...dom.sourceSelectMock.querySelectorAll('input:checked')].map(el => el.value);
    
    let relevantQuestions = selectedSources.length === 0 
        ? questionPool
        : questionPool.filter(q => selectedSources.includes(q.source || 'Uncategorized'));

    const chapterCounts = {};
    relevantQuestions.forEach(q => {
        const chapter = q.chapter || 'Uncategorized';
        chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1;
    });

    ui.populateFilterOptions(dom.chapterSelectMock, Object.keys(chapterCounts).sort(), 'mock-chapter', chapterCounts);
}

export async function startIncorrectQuestionsQuiz() {
    dom.loader.classList.remove('hidden');
    dom.loadingText.textContent = 'Loading your mistakes...';
    dom.loadingText.classList.remove('hidden');
    try {
        const response = await fetch(`${API_URL}?request=getIncorrectQuestions&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`, { redirect: 'follow' });
        if (!response.ok) throw new Error('Failed to fetch your mistakes.');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (data.questions.length === 0) {
            ui.showConfirmationModal('All Clear!', 'You have no incorrect questions to practice. Well done!', () => dom.modalBackdrop.classList.add('hidden'));
            return;
        }
        const mistakeQuestions = parseQuestions(data.questions);
        launchQuiz(mistakeQuestions, "Practice Mistakes", { isMistakePractice: true });
    } catch (error) {
        dom.mockError.textContent = error.message;
        dom.mockError.classList.remove('hidden');
    } finally {
        dom.loader.classList.add('hidden');
        dom.loadingText.classList.add('hidden');
    }
}

export function startBookmarkedQuestionsQuiz() {
    const bookmarkedIds = Array.from(appState.bookmarkedQuestions);
    if (bookmarkedIds.length === 0) {
        ui.showConfirmationModal('No Bookmarks', 'You have not bookmarked any questions yet.', () => dom.modalBackdrop.classList.add('hidden'));
        return;
    }

    const bookmarkedQuestions = appState.allQuestions.filter(q => bookmarkedIds.includes(q.UniqueID));
    launchQuiz(bookmarkedQuestions, "Bookmarked Questions");
}

export function startFreeTest() {
    if (appState.allFreeTestQuestions.length === 0) {
        alert("Free test questions are not available, please contact support.");
        return;
    }
    const shuffled = [...appState.allFreeTestQuestions].sort(() => 0.5 - Math.random());
    const sampleQuestions = shuffled.slice(0, 10);
    appState.currentUser = { Name: 'Guest', UniqueID: `guest_${Date.now()}`, Role: 'Guest' };
    launchQuiz(sampleQuestions, "Free Sample Test");
}

export function startQuizBrowse(browseBy) {
    const isChapter = browseBy === 'chapter';
    const title = isChapter ? 'Browse by Chapter' : 'Browse by Source';
    
    const questionPool = getQuestionPool();
    const itemCounts = questionPool.reduce((acc, q) => {
        const item = isChapter ? (q.chapter || 'Uncategorized') : (q.source || 'Uncategorized');
        acc[item] = (acc[item] || 0) + 1;
        return acc;
    }, {});

    const items = Object.keys(itemCounts).sort();
    dom.listTitle.textContent = title;
    dom.listItems.innerHTML = ''; 

    if (items.length === 0) {
        dom.listItems.innerHTML = `<p class="text-slate-500 col-span-full text-center">No ${browseBy}s found for the selected scope.</p>`;
    } else {
        items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'action-btn p-4 bg-white rounded-lg shadow-sm text-center hover:bg-slate-50';
            button.innerHTML = `
                <h3 class="font-bold text-slate-800">${item}</h3>
                <p class="text-sm text-slate-500">${itemCounts[item]} Questions</p>
            `;
            button.addEventListener('click', () => {
                if (isChapter) {
                    const questions = questionPool.filter(q => (q.chapter || 'Uncategorized') === item);
                    launchQuiz(questions, item);
                } else {
                    showChaptersForSource(item);
                }
            });
            dom.listItems.appendChild(button);
        });
    }

    ui.showScreen(dom.listContainer);
    appState.navigationHistory.push(() => startQuizBrowse(browseBy));
}
