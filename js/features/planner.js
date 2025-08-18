// js/features/planner.js (FINAL, COMPLETE, AND CORRECTED DISPLAY LOGIC)

import { appState, API_URL } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { calculateDaysLeft } from '../utils.js';
import { launchQuiz } from './quiz.js';

/**
 * Main function to show the study planner screen. It decides whether to show the dashboard or the active plan.
 */
export async function showStudyPlannerScreen() {
    ui.showScreen(dom.studyPlannerContainer);
    appState.navigationHistory.push(showStudyPlannerScreen);
    dom.studyPlannerLoader.classList.remove('hidden');
    dom.plannerDashboard.classList.add('hidden');
    dom.activePlanView.classList.add('hidden');

    try {
        const response = await fetch(`${API_URL}?request=getAllUserPlans&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Could not fetch study plans.');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        appState.studyPlans = data.plans || [];
        appState.activeStudyPlan = appState.studyPlans.find(p => String(p.Plan_Status).toUpperCase() === 'TRUE') || null;

        renderPlannerDashboard();
        if (appState.activeStudyPlan) {
            renderActivePlanView();
            dom.plannerDashboard.classList.add('hidden');
            dom.activePlanView.classList.remove('hidden');
        } else {
            dom.plannerDashboard.classList.remove('hidden');
            dom.activePlanView.classList.add('hidden');
        }

    } catch (error) {
        console.error("Error loading study plans:", error);
        // This assumes you have a general error display element in your planner container.
        const plannerErrorDisplay = dom.studyPlannerError; 
        if(plannerErrorDisplay) plannerErrorDisplay.textContent = error.message;
    } finally {
        dom.studyPlannerLoader.classList.add('hidden');
    }
}

/**
 * Renders the dashboard view, showing a list of all created plans.
 */
function renderPlannerDashboard() {
    const plansList = dom.studyPlansList;
    plansList.innerHTML = '';
    if (appState.studyPlans.length === 0) {
        plansList.innerHTML = `<p class="text-center text-slate-500 p-4 bg-slate-50 rounded-lg">You haven't created any study plans yet. Click "Create New Plan" to get started!</p>`;
    } else {
        appState.studyPlans.forEach(plan => {
            const isActive = String(plan.Plan_Status).toUpperCase() === 'TRUE';
            const planCard = document.createElement('div');
            planCard.className = `p-4 rounded-lg border-2 flex justify-between items-center ${isActive ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200'}`;
            
            // --- THIS IS THE CORRECTED PART ---
            // It now correctly displays the dates and status.
            planCard.innerHTML = `
                <div>
                    <h4 class="font-bold text-lg text-slate-800">${plan.Plan_Name}</h4>
                    <p class="text-sm text-slate-500">
                        ${new Date(plan.Plan_StartDate).toLocaleDateString('en-GB')} - ${new Date(plan.Plan_EndDate).toLocaleDateString('en-GB')}
                        ${isActive ? '<span class="ml-2 text-xs font-bold text-white bg-blue-500 px-2 py-1 rounded-full">ACTIVE</span>' : ''}
                    </p>
                </div>
                <div class="flex gap-2">
                    ${!isActive ? `<button class="activate-plan-btn action-btn bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-1 px-3 rounded" data-plan-id="${plan.Plan_ID}">Activate</button>` : ''}
                    <button class="view-plan-btn action-btn bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold py-1 px-3 rounded" data-plan-id="${plan.Plan_ID}">View</button>
                </div>
            `;
            plansList.appendChild(planCard);
        });
    }
    addDashboardEventListeners();
}

/**
 * Renders the detailed view of the currently active study plan.
 */
function renderActivePlanView() {
    const plan = appState.activeStudyPlan;
    if (!plan) {
        dom.activePlanView.classList.add('hidden');
        dom.plannerDashboard.classList.remove('hidden');
        return;
    }

    dom.activePlanName.textContent = plan.Plan_Name;
    const endDate = new Date(plan.Plan_EndDate);
    const daysRemaining = calculateDaysLeft(endDate);
    dom.planDaysRemaining.textContent = daysRemaining >= 0 ? daysRemaining : 'Ended';

    let totalTasks = 0, completedTasks = 0;
    if (plan.Study_Plan) {
        plan.Study_Plan.forEach(day => {
            day.tasks.forEach(task => {
                totalTasks++;
                if (task.completed) completedTasks++;
            });
        });
    }

    const progress = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0;
    dom.planProgressBar.style.width = `${progress}%`;
    dom.planProgressBar.textContent = `${progress}%`;

    const todayString = new Date().toISOString().split('T')[0];
    const todayPlan = plan.Study_Plan ? plan.Study_Plan.find(day => day.date === todayString) : null;
    dom.planTasksToday.textContent = todayPlan ? todayPlan.tasks.filter(t => !t.completed).length : 0;

    dom.studyPlanDaysContainer.innerHTML = '';
    if (plan.Study_Plan) {
        plan.Study_Plan.forEach((day, dayIndex) => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'bg-white rounded-lg shadow-sm p-4';
            const date = new Date(day.date);
            const isToday = date.toISOString().split('T')[0] === todayString;
            let dateDisplay = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            if (isToday) dateDisplay += ' (Today)';

            let tasksHtml = day.tasks.map((task, taskIndex) => `
                <li class="flex items-center justify-between p-2 rounded-md ${task.completed ? 'bg-green-100 text-slate-500 line-through' : 'bg-slate-50'}">
                    <div class="flex items-center">
                        <input type="checkbox" class="task-checkbox h-4 w-4 mr-3" data-day-index="${dayIndex}" data-task-index="${taskIndex}" ${task.completed ? 'checked' : ''}>
                        <span>${task.name}</span>
                    </div>
                    ${task.type === 'quiz' && !task.completed ? `<button class="start-planner-quiz-btn text-xs bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600" data-chapters='${JSON.stringify(task.chapters)}'>Start Quiz</button>` : ''}
                </li>
            `).join('');

            dayDiv.innerHTML = `<h4 class="font-bold text-lg mb-2 ${isToday ? 'text-blue-600': ''}">${dateDisplay}</h4><ul class="space-y-2">${tasksHtml}</ul>`;
            dom.studyPlanDaysContainer.appendChild(dayDiv);
        });
    }

    addActivePlanEventListeners();
}

/**
 * Generates the daily tasks for a new plan based on date range and content.
 */
function generatePlanContent(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setDate(endDate.getDate() + 1);
    const daysRemaining = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return null;

    const plan = [];
    const chapters = [...appState.allChaptersNames];
    const chaptersPerDay = Math.ceil(chapters.length / daysRemaining);

    for (let i = 0; i < daysRemaining; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayPlan = { date: date.toISOString().split('T')[0], tasks: [] };
        
        const assignedChapters = chapters.splice(0, chaptersPerDay);
        if (assignedChapters.length > 0) {
            dayPlan.tasks.push({ type: 'lecture', name: `Study: ${assignedChapters.join(', ')}`, chapters: assignedChapters, completed: false });
            dayPlan.tasks.push({ type: 'quiz', name: `Quiz: ${assignedChapters.join(', ')}`, chapters: assignedChapters, completed: false });
        }
        
        if (dayPlan.tasks.length > 0) {
             plan.push(dayPlan);
        }
    }
    return plan;
}

/**
 * Handles the creation of a new plan from the modal.
 */
export async function handleCreatePlan() {
    const planName = dom.newPlanName.value.trim();
    const startDate = dom.newPlanStartDate.value;
    const endDate = dom.newPlanEndDate.value;
    const errorEl = dom.createPlanError;

    if (!planName || !startDate || !endDate) {
        errorEl.textContent = 'All fields are required.';
        errorEl.classList.remove('hidden');
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        errorEl.textContent = 'Start date cannot be after the end date.';
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const generatedPlan = generatePlanContent(startDate, endDate);
    if (!generatedPlan) {
        errorEl.textContent = 'Could not generate a plan. Ensure the date range is valid.';
        errorEl.classList.remove('hidden');
        return;
    }

    const payload = {
        eventType: 'createStudyPlan',
        userId: appState.currentUser.UniqueID,
        planName: planName,
        startDate: startDate,
        endDate: endDate,
        studyPlan: generatedPlan
    };

    try {
        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        dom.modalBackdrop.classList.add('hidden');
        dom.createPlanModal.classList.add('hidden');
        showStudyPlannerScreen();
    } catch (error) {
        console.error("Error creating plan:", error);
        errorEl.textContent = 'An error occurred while saving the plan.';
        errorEl.classList.remove('hidden');
    }
}

/**
 * Adds event listeners for the dashboard view (view/activate buttons).
 */
function addDashboardEventListeners() {
    document.querySelectorAll('.view-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.currentTarget.dataset.planId;
            appState.activeStudyPlan = appState.studyPlans.find(p => p.Plan_ID === planId);
            renderActivePlanView();
            dom.plannerDashboard.classList.add('hidden');
            dom.activePlanView.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.activate-plan-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const planId = e.currentTarget.dataset.planId;
            const payload = { eventType: 'activateStudyPlan', userId: appState.currentUser.UniqueID, planId: planId };
            try {
                await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                showStudyPlannerScreen();
            } catch (error) {
                console.error("Error activating plan:", error);
            }
        });
    });
}

/**
 * Adds event listeners for the active plan view (checkboxes, quiz buttons).
 */
function addActivePlanEventListeners() {
    document.querySelectorAll('.task-checkbox').forEach(box => {
        box.addEventListener('change', async (e) => {
            const dayIndex = parseInt(e.currentTarget.dataset.dayIndex);
            const taskIndex = parseInt(e.currentTarget.dataset.taskIndex);
            appState.activeStudyPlan.Study_Plan[dayIndex].tasks[taskIndex].completed = e.currentTarget.checked;
            const payload = {
                eventType: 'updateStudyPlan',
                planId: appState.activeStudyPlan.Plan_ID,
                studyPlan: appState.activeStudyPlan.Study_Plan
            };
            await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
            renderActivePlanView();
        });
    });

    document.querySelectorAll('.start-planner-quiz-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chapters = JSON.parse(e.currentTarget.dataset.chapters);
            const questions = appState.allQuestions.filter(q => chapters.includes(q.chapter));
            if (questions.length > 0) {
                launchQuiz(questions, `Quiz for: ${chapters.join(', ')}`);
            } else {
                alert('No questions found for the chapters in this task.');
            }
        });
    });
}
