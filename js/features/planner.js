// js/features/planner.js (FINAL ENHANCED VERSION)

import { appState, API_URL } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { calculateDaysLeft } from '../utils.js';
import { saveStudyPlan } from '../api.js';
import { launchQuiz } from './quiz.js';

export function showStudyPlannerScreen() {
    ui.showScreen(dom.studyPlannerContainer);
    appState.navigationHistory.push(showStudyPlannerScreen);
    dom.studyPlannerLoader.classList.remove('hidden');
    dom.studyPlannerContent.classList.add('hidden');
    dom.studyPlannerInitialSetup.classList.add('hidden');

    if (!appState.userCardData || !appState.userCardData.ExamDate) {
        promptForExamDate();
    } else if (!appState.studyPlannerData) {
        generateInitialStudyPlanPrompt();
    } else {
        renderStudyPlan();
    }
    dom.studyPlannerLoader.classList.add('hidden');
}

function promptForExamDate() {
    dom.studyPlannerInitialSetup.classList.remove('hidden');
    dom.studyPlannerContent.classList.add('hidden');
    dom.studyPlannerExamDateInput.value = appState.userCardData?.ExamDate ? new Date(appState.userCardData.ExamDate).toISOString().split('T')[0] : '';
    dom.studyPlannerExamDateInput.disabled = false;
    dom.studyPlannerGenerateBtn.textContent = 'Set Exam Date & Generate Plan';
}

function generateInitialStudyPlanPrompt() {
    dom.studyPlannerInitialSetup.classList.remove('hidden');
    dom.studyPlannerContent.classList.add('hidden');
    dom.studyPlannerExamDateInput.value = new Date(appState.userCardData.ExamDate).toISOString().split('T')[0];
    dom.studyPlannerExamDateInput.disabled = true;
    dom.studyPlannerGenerateBtn.textContent = 'Generate Initial Plan';
}

export async function handleGeneratePlan() {
    const examDate = dom.studyPlannerExamDateInput.value;
    if (!examDate) {
        dom.studyPlannerError.textContent = 'Please select your exam date.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }
    dom.studyPlannerError.classList.add('hidden');

    if (!dom.studyPlannerExamDateInput.disabled) {
        const payload = { eventType: 'updateUserCardData', userId: appState.currentUser.UniqueID, examDate };
        try {
            await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
            if (appState.userCardData) appState.userCardData.ExamDate = examDate;
        } catch (error) {
            dom.studyPlannerError.textContent = `Failed to save exam date.`;
            dom.studyPlannerError.classList.remove('hidden');
            return;
        }
    }
    
    generateInitialStudyPlan();
}

function generateInitialStudyPlan() {
    const daysRemaining = calculateDaysLeft(new Date(appState.userCardData.ExamDate));
    if (daysRemaining <= 0) {
        dom.studyPlannerError.textContent = 'Exam date must be in the future.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }

    const plan = [];
    const chapters = [...appState.allChaptersNames];
    const chaptersPerDay = Math.ceil(chapters.length / daysRemaining);

    for (let i = 0; i < daysRemaining; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayPlan = { date: date.toISOString().split('T')[0], tasks: [] };
        const assignedChapters = chapters.splice(0, chaptersPerDay);
        if (assignedChapters.length > 0) {
            dayPlan.tasks.push({ type: 'lecture', name: `Study Lectures for: ${assignedChapters.join(', ')}`, chapters: assignedChapters, completed: false });
            dayPlan.tasks.push({ type: 'quiz', name: `Quiz on: ${assignedChapters.join(', ')}`, chapters: assignedChapters, completed: false });
        }
        if (dayPlan.tasks.length > 0) {
             plan.push(dayPlan);
        }
    }

    appState.studyPlannerData = plan;
    saveStudyPlan(plan);
    renderStudyPlan();
}

function renderStudyPlan() {
    dom.studyPlannerInitialSetup.classList.add('hidden');
    dom.studyPlannerContent.classList.remove('hidden');
    dom.studyPlanDaysContainer.innerHTML = '';
    
    const daysRemaining = calculateDaysLeft(new Date(appState.userCardData.ExamDate));
    dom.planDaysRemaining.textContent = daysRemaining >= 0 ? daysRemaining : 'N/A';
    
    let totalTasks = 0, completedTasks = 0;
    appState.studyPlannerData.forEach(day => {
        day.tasks.forEach(task => {
            totalTasks++;
            if (task.completed) completedTasks++;
        });
    });
    const progress = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0;
    dom.planProgressBar.style.width = `${progress}%`;
    dom.planProgressBar.textContent = `${progress}%`;

    appState.studyPlannerData.forEach((day, dayIndex) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'bg-white rounded-lg shadow-md p-4';
        
        const date = new Date(day.date);
        date.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);

        const isToday = date.getTime() === today.getTime();
        let dateDisplay = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if(isToday) dateDisplay += ' (Today)';

        let tasksHtml = day.tasks.map((task, taskIndex) => `
            <li class="flex items-center justify-between p-2 rounded-md ${task.completed ? 'bg-green-100' : 'bg-slate-50'}">
                <div class="flex items-center">
                    <input type="checkbox" class="task-checkbox h-4 w-4 mr-3" data-day="${dayIndex}" data-task="${taskIndex}" ${task.completed ? 'checked' : ''}>
                    <span class="${task.completed ? 'line-through text-slate-500' : ''}">${task.name}</span>
                </div>
                ${task.type === 'quiz' && !task.completed ? `<button class="start-planner-quiz-btn text-xs bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600" data-chapters='${JSON.stringify(task.chapters)}'>Start Quiz</button>` : ''}
            </li>
        `).join('');

        dayDiv.innerHTML = `<h4 class="font-bold text-lg mb-2 ${isToday ? 'text-blue-600': ''}">${dateDisplay}</h4><ul class="space-y-2">${tasksHtml}</ul>`;
        dom.studyPlanDaysContainer.appendChild(dayDiv);
    });

    addStudyPlanEventListeners();
}

function addStudyPlanEventListeners() {
    document.querySelectorAll('.task-checkbox').forEach(box => {
        box.addEventListener('change', (e) => {
            const dayIndex = e.target.dataset.day;
            const taskIndex = e.target.dataset.task;
            appState.studyPlannerData[dayIndex].tasks[taskIndex].completed = e.target.checked;
            saveStudyPlan(appState.studyPlannerData);
            renderStudyPlan();
        });
    });

    document.querySelectorAll('.start-planner-quiz-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chapters = JSON.parse(e.target.dataset.chapters);
            const questions = appState.allQuestions.filter(q => chapters.includes(q.chapter));
            if (questions.length > 0) {
                launchQuiz(questions, `Quiz for: ${chapters.join(', ')}`);
            } else {
                alert('No questions found for the chapters in this task.');
            }
        });
    });
}

export function updateStudyPlanProgress(eventType, itemName) {
    if (!appState.studyPlannerData) return;
    let planUpdated = false;
    appState.studyPlannerData.forEach(day => {
        day.tasks.forEach(task => {
            if (!task.completed && task.chapters && task.chapters.some(ch => itemName.includes(ch))) {
                task.completed = true;
                planUpdated = true;
            }
        });
    });
    if (planUpdated) saveStudyPlan(appState.studyPlannerData);
}

export function handleAddCustomTask() {
    const taskName = dom.studyPlanCustomTaskInput.value.trim();
    const taskDate = dom.studyPlanCustomTaskDateInput.value;
    if (!taskName || !taskDate) {
        dom.studyPlannerError.textContent = 'Please provide both task name and date.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }

    const dayData = appState.studyPlannerData.find(d => d.date === taskDate);
    if (dayData) {
        dayData.tasks.push({ type: 'custom', name: taskName, completed: false });
    } else {
        appState.studyPlannerData.push({ date: taskDate, tasks: [{ type: 'custom', name: taskName, completed: false }] });
        appState.studyPlannerData.sort((a,b) => new Date(a.date) - new Date(b.date));
    }
    saveStudyPlan(appState.studyPlannerData);
    renderStudyPlan();
    dom.studyPlanCustomTaskInput.value = '';
    dom.studyPlanCustomTaskDateInput.value = '';
}
