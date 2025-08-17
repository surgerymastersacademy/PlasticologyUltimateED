// js/features/activityLog.js

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { fetchUserData } from '../api.js';
import { launchQuiz } from './quiz.js'; // Needed for quiz review functionality
import { parseQuestions } from '../utils.js';

// We need the API_URL for the reviewQuiz fetch call
let API_URL;
import('../state.js').then(state => { API_URL = state.API_URL; });

export async function showActivityLog() {
    ui.showScreen(dom.activityLogContainer);
    appState.navigationHistory.push(showActivityLog);
    dom.activityLogList.innerHTML = '<div class="loader"></div>';
    await fetchUserData(); // Ensure we have the latest logs
    renderFilteredLog('all');
}

export function renderFilteredLog(filter) {
    dom.activityLogList.innerHTML = '';
    document.querySelectorAll('#activity-log-container .filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`log-filter-${filter}`).classList.add('active');

    dom.allSummary.classList.add('hidden');
    dom.quizSummary.classList.add('hidden');
    dom.lectureSummary.classList.add('hidden');

    const logsToDisplay = appState.fullActivityLog.filter(log => {
        if (filter === 'all') return true;
        if (filter === 'quizzes') return log.eventType === 'FinishQuiz';
        if (filter === 'lectures') return log.eventType === 'ViewLecture';
        return false;
    });

    renderActivityChart(logsToDisplay);

    const quizLogs = appState.fullActivityLog.filter(log => log.eventType === 'FinishQuiz');
    let totalCorrect = 0;
    let totalAttempted = 0;
    quizLogs.forEach(log => {
        totalCorrect += parseInt(log.score, 10) || 0;
        totalAttempted += parseInt(log.total, 10) || 0;
    });
    const totalIncorrect = totalAttempted - totalCorrect;
    const accuracy = totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(1) : 0;

    if (filter === 'all') {
        dom.allSummary.classList.remove('hidden');
        const totalLectures = Object.values(appState.groupedLectures).reduce((acc, ch) => acc + ch.topics.length, 0);
        const viewedLectures = new Set(appState.fullActivityLog.filter(l => l.eventType === 'ViewLecture').map(l => l.title)).size;
        dom.allLecturesProgress.textContent = `${viewedLectures} / ${totalLectures}`;
        dom.allQuestionsProgress.textContent = `${totalAttempted} / ${appState.allQuestions.length}`;
    } else if (filter === 'quizzes') {
        dom.quizSummary.classList.remove('hidden');
        dom.totalCorrectAnswers.textContent = totalCorrect;
        dom.totalIncorrectAnswers.textContent = totalIncorrect;
        dom.overallAccuracy.textContent = `${accuracy}%`;
    } else if (filter === 'lectures') {
        dom.lectureSummary.classList.remove('hidden');
        const viewedLogs = appState.fullActivityLog.filter(log => log.eventType === 'ViewLecture');
        const uniqueLectures = new Set(viewedLogs.map(l => l.title));
        dom.lecturesViewedCount.textContent = uniqueLectures.size;
        const uniqueChapters = new Set(viewedLogs.map(l => {
            for (const chapterName in appState.groupedLectures) {
                if (appState.groupedLectures[chapterName].topics.some(t => t.name === l.title)) {
                    return chapterName;
                }
            }
            return null;
        }).filter(c => c));
        dom.chaptersStartedCount.textContent = uniqueChapters.size;
    }

    if (logsToDisplay.length === 0) {
        dom.activityLogList.innerHTML = `<p class="text-center text-slate-500">No activity recorded.</p>`;
        return;
    }

    logsToDisplay.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'p-3 border rounded-lg flex flex-col sm:flex-row justify-between items-center bg-white gap-3';
        const date = new Date(log.timestamp).toLocaleString('en-GB');
        let mainContent = '';
        if (log.eventType === 'FinishQuiz') {
            mainContent = `
                <div class="flex-grow text-center sm:text-left">
                    <p class="font-bold text-slate-800">${log.title}</p>
                    <p class="text-sm text-slate-500">${date}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-lg ${log.score / log.total >= 0.5 ? 'text-green-600' : 'text-red-600'}">${log.score} / ${log.total}</p>
                    <p class="text-xs text-slate-500">Score</p>
                </div>
            `;
            if (log.isReviewable) {
                const reviewButton = document.createElement('button');
                reviewButton.innerHTML = `<i class="fas fa-redo-alt mr-2"></i> Review`;
                reviewButton.className = 'action-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm';
                reviewButton.onclick = () => startFullQuizReview(log.logId, log.title);
                logItem.appendChild(reviewButton);
            }
        } else if (log.eventType === 'ViewLecture') {
            mainContent = `
                <div class="flex-grow text-center sm:text-left">
                    <p class="font-bold text-slate-800">${log.title}</p>
                    <p class="text-sm text-slate-500">${date}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-lg text-green-600"><i class="fas fa-video"></i></p>
                    <p class="text-xs text-slate-500">Viewed</p>
                </div>
            `;
        }
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'flex-grow flex items-center justify-between w-full';
        contentWrapper.innerHTML = mainContent;
        logItem.prepend(contentWrapper);
        dom.activityLogList.appendChild(logItem);
    });
}

function renderActivityChart(logs) {
    if (appState.activityChartInstance) {
        appState.activityChartInstance.destroy();
    }
    const labels = [];
    const activityByDay = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
        activityByDay[key] = { lectures: 0, quizzes: 0 };
    }
    logs.forEach(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        if (activityByDay[logDate]) {
            if (log.eventType === 'ViewLecture') activityByDay[logDate].lectures++;
            else if (log.eventType === 'FinishQuiz') activityByDay[logDate].quizzes++;
        }
    });
    const lectureData = Object.values(activityByDay).map(d => d.lectures);
    const quizData = Object.values(activityByDay).map(d => d.quizzes);
    appState.activityChartInstance = new Chart(dom.activityChartCanvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Lectures', data: lectureData, backgroundColor: 'rgba(20, 184, 166, 0.6)' },
                { label: 'Quizzes', data: quizData, backgroundColor: 'rgba(59, 130, 246, 0.6)' }
            ]
        },
        options: {
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { title: { display: true, text: 'Your Activity in the Last 7 Days' } }
        }
    });
}

async function startFullQuizReview(logId, title) {
    ui.showScreen(dom.quizContainer);
    dom.progressText.textContent = 'Loading review...';
    try {
        const response = await fetch(`${API_URL}?request=reviewQuiz&logId=${encodeURIComponent(logId)}&userId=${appState.currentUser.UniqueID}`);
        if (!response.ok) throw new Error('Failed to fetch review data.');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const reviewQuestions = data.reviewData.map(item => parseQuestions([item.question])[0]);
        const pastAnswers = data.reviewData.map(item => {
            const question = parseQuestions([item.question])[0];
            const correctOption = question.answerOptions.find(opt => opt.isCorrect);
            return {
                answer: item.userAnswer,
                isCorrect: item.userAnswer === correctOption.text
            };
        });

        launchQuiz(reviewQuestions, title, { isReview: true, pastAnswers: pastAnswers });
    } catch (error) {
        console.error("Error starting full quiz review:", error);
        dom.progressText.textContent = `Error: ${error.message}`;
    }
}