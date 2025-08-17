// js/features/planner.js

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
    dom.studyPlannerExamDateInput.value = appState.userCardData?.ExamDate ? new Date(appState.userCardData.ExamDate).toISOString().split('T')[0] : '';
    dom.studyPlannerGenerateBtn.textContent = 'Set Exam Date & Generate Plan';
}

export async function handleGeneratePlan() {
    const examDate = dom.studyPlannerExamDateInput.value;
    if (!examDate) {
        dom.studyPlannerError.textContent = 'Please select your exam date.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }
    dom.studyPlannerError.classList.add('hidden');

    const payload = { eventType: 'updateUserCardData', userId: appState.currentUser.UniqueID, examDate };
    try {
        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        if(appState.userCardData) appState.userCardData.ExamDate = examDate;
        generateInitialStudyPlan();
    } catch (error) {
        dom.studyPlannerError.textContent = `Failed to save exam date.`;
        dom.studyPlannerError.classList.remove('hidden');
    }
}

function generateInitialStudyPlan() {
    // Logic to generate the plan based on chapters and questions
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
            dayPlan.tasks.push({ type: 'lecture', name: `Study: ${assignedChapters.join(', ')}`, completed: false });
        }
        plan.push(dayPlan);
    }

    appState.studyPlannerData = plan;
    saveStudyPlan(plan);
    renderStudyPlan();
}

function renderStudyPlan() {
    dom.studyPlannerInitialSetup.classList.add('hidden');
    dom.studyPlannerContent.classList.remove('hidden');
    dom.studyPlanDaysContainer.innerHTML = '';
    
    // Summary
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

    // Render daily cards
    appState.studyPlannerData.forEach((day, dayIndex) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'bg-white rounded-lg shadow-md p-4';
        
        const date = new Date(day.date);
        const isToday = date.toDateString() === new Date().toDateString();
        let dateDisplay = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if(isToday) dateDisplay += ' (Today)';

        let tasksHtml = day.tasks.map((task, taskIndex) => `
            <li class="flex items-center p-2 rounded-md ${task.completed ? 'bg-green-100' : 'bg-slate-50'}">
                <input type="checkbox" class="task-checkbox h-4 w-4 mr-3" data-day="${dayIndex}" data-task="${taskIndex}" ${task.completed ? 'checked' : ''}>
                <span class="${task.completed ? 'line-through text-slate-500' : ''}">${task.name}</span>
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
}

export function updateStudyPlanProgress(eventType, itemName) {
    if (!appState.studyPlannerData) return;
    // Basic implementation: check if item name part of a task
    let planUpdated = false;
    appState.studyPlannerData.forEach(day => {
        day.tasks.forEach(task => {
            if (!task.completed && task.name.includes(itemName)) {
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
        dom.customTaskError.textContent = 'Please provide both task name and date.';
        dom.customTaskError.classList.remove('hidden');
        return;
    }
    dom.customTaskError.classList.add('hidden');

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