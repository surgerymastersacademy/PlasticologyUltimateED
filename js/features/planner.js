// js/features/planner.js (FINAL, ADVANCED VERSION WITH LECTURE-BASED & CUMULATIVE QUIZZES)

import { appState, API_URL } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { calculateDaysLeft } from '../utils.js';
import { launchQuiz } from './quiz.js';
import { analyzePerformanceByChapter } from './performance.js';

/**
 * Main function to show the study planner screen. It decides whether to show the dashboard or the active plan.
 */
export async function showStudyPlannerScreen() {
    ui.showScreen(dom.studyPlannerContainer);
    appState.navigationHistory.push(showStudyPlannerScreen);
    dom.studyPlannerLoader.classList.remove('hidden');
    dom.plannerDashboard.classList.add('hidden');
    dom.activePlanView.classList.add('hidden');
    dom.performanceInsightsContainer.classList.add('hidden'); // Hide insights initially

    try {
        const response = await fetch(`${API_URL}?request=getAllUserPlans&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Could not fetch study plans.');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        appState.studyPlans = data.plans || [];
        appState.activeStudyPlan = appState.studyPlans.find(p => String(p.Plan_Status).toUpperCase() === 'TRUE') || null;
        
        renderPerformanceInsights(); // Attempt to render insights
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
    } finally {
        dom.studyPlannerLoader.classList.add('hidden');
    }
}

/**
 * Renders the performance insights section based on user's activity log.
 */
function renderPerformanceInsights() {
    const performance = analyzePerformanceByChapter();
    if (performance && (performance.strengths.length > 0 || performance.weaknesses.length > 0)) {
        dom.strengthsList.innerHTML = performance.strengths.length > 0 
            ? performance.strengths.map(s => `<li>${s}</li>`).join('') 
            : '<li>Keep practicing to build your strengths!</li>';
        
        dom.weaknessesList.innerHTML = performance.weaknesses.length > 0 
            ? performance.weaknesses.map(w => `<li>${w}</li>`).join('')
            : '<li>No specific weaknesses found. Great job!</li>';

        dom.performanceInsightsContainer.classList.remove('hidden');
    } else {
        dom.performanceInsightsContainer.classList.add('hidden');
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
            
            let planName = plan.Plan_Name;
            let planDetailsHTML = `
                <p class="text-sm text-slate-500">
                    ${new Date(plan.Plan_StartDate).toLocaleDateString('en-GB')} - ${new Date(plan.Plan_EndDate).toLocaleDateString('en-GB')}
                    ${isActive ? '<span class="ml-2 text-xs font-bold text-white bg-blue-500 px-2 py-1 rounded-full">ACTIVE</span>' : ''}
                </p>`;

            if (typeof planName === 'string' && planName.startsWith('[{')) {
                planName = "Corrupted Plan Data";
                planDetailsHTML = `<p class="text-sm text-red-500">Error: Please correct this plan's data in the Google Sheet.</p>`;
            }

            planCard.innerHTML = `
                <div>
                    <h4 class="font-bold text-lg text-slate-800">${planName}</h4>
                    ${planDetailsHTML}
                </div>
                <div class="flex gap-2">
                    ${!isActive ? `<button class="activate-plan-btn action-btn bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-1 px-3 rounded" data-plan-id="${plan.Plan_ID}">Activate</button>` : ''}
                    <button class="view-plan-btn action-btn bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold py-1 px-3 rounded" data-plan-id="${plan.Plan_ID}">View</button>
                    <button class="delete-plan-btn action-btn bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-1 px-3 rounded" data-plan-id="${plan.Plan_ID}" title="Delete Plan"><i class="fas fa-trash"></i></button>
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
    if (!plan) return;

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

            let tasksHtml = day.tasks.map((task, taskIndex) => {
                let taskContentHtml = '';
                if (task.type === 'lecture' && task.link) {
                    taskContentHtml = `<a href="${task.link}" target="_blank" class="text-blue-600 hover:underline">${task.name}</a>`;
                } else {
                    taskContentHtml = `<span>${task.name}</span>`;
                }
                
                const keywordsData = JSON.stringify(task.keywords || []).replace(/"/g, '&quot;');

                return `
                <li class="flex items-center justify-between p-2 rounded-md ${task.completed ? 'bg-green-100 text-slate-500 line-through' : 'bg-slate-50'}">
                    <div class="flex items-center">
                        <input type="checkbox" class="task-checkbox h-4 w-4 mr-3" data-day-index="${dayIndex}" data-task-index="${taskIndex}" ${task.completed ? 'checked' : ''}>
                        ${taskContentHtml}
                    </div>
                    ${task.type === 'quiz' && !task.completed ? `<button class="start-planner-quiz-btn text-xs bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600" data-keywords="${keywordsData}" data-is-comprehensive="${task.isComprehensive || false}">Start Quiz</button>` : ''}
                </li>
            `}).join('');

            dayDiv.innerHTML = `<h4 class="font-bold text-lg mb-2 ${isToday ? 'text-blue-600': ''}">${dateDisplay}</h4><ul class="space-y-2">${tasksHtml}</ul>`;
            dom.studyPlanDaysContainer.appendChild(dayDiv);
        });
    }

    addActivePlanEventListeners();
}

/**
 * Generates the daily tasks for a new plan with the new smart quiz logic.
 */
function generatePlanContent(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const CUMULATIVE_QUIZ_INTERVAL = 3; // Add a cumulative quiz every 3 days
    
    const allLectures = Object.values(appState.groupedLectures).flatMap(chapter => chapter.topics);
    
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const daysForComprehensive = 2;
    const daysForLectures = totalDays - daysForComprehensive;

    if (daysForLectures <= 0) return null;

    const plan = [];
    const lecturesPerDay = Math.ceil(allLectures.length / daysForLectures);
    let cumulativeKeywords = new Set();

    for (let i = 0; i < daysForLectures; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dayPlan = { date: currentDate.toISOString().split('T')[0], tasks: [] };
        
        const assignedLectures = allLectures.splice(0, lecturesPerDay);
        if (assignedLectures.length > 0) {
            assignedLectures.forEach(lec => {
                dayPlan.tasks.push({ type: 'lecture', name: lec.name, link: lec.link, completed: false });
            });

            const todaysKeywords = new Set(assignedLectures.flatMap(lec => (lec.Keywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean)));
            
            if (todaysKeywords.size > 0) {
                dayPlan.tasks.push({ 
                    type: 'quiz', 
                    name: `Daily Quiz (Day ${i + 1})`, 
                    keywords: [...todaysKeywords],
                    isComprehensive: false,
                    completed: false 
                });
            }

            todaysKeywords.forEach(k => cumulativeKeywords.add(k));

            if ((i + 1) % CUMULATIVE_QUIZ_INTERVAL === 0 || i === daysForLectures - 1) {
                 dayPlan.tasks.push({ 
                    type: 'quiz', 
                    name: `Cumulative Review`, 
                    keywords: [...cumulativeKeywords],
                    isComprehensive: false,
                    completed: false 
                });
            }
        }
        
        if (dayPlan.tasks.length > 0) {
             plan.push(dayPlan);
        }
    }

    for (let i = 1; i >= 0; i--) {
        const examDate = new Date(endDate);
        examDate.setDate(endDate.getDate() - i);
        plan.push({
            date: examDate.toISOString().split('T')[0],
            tasks: [{
                type: 'quiz',
                name: `Comprehensive Mock Exam ${2 - i}`,
                keywords: [],
                isComprehensive: true,
                completed: false
            }]
        });
    }

    return plan.sort((a, b) => new Date(a.date) - new Date(b.date));
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
    if (new Date(startDate) >= new Date(endDate)) {
        errorEl.textContent = 'End date must be after the start date.';
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const generatedPlan = generatePlanContent(startDate, endDate);
    if (!generatedPlan) {
        errorEl.textContent = 'Could not generate a plan. The date range is too short for the content.';
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
 * Adds event listeners for the dashboard view (view/activate/delete buttons).
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

    // NEW: Event listener for delete button
    document.querySelectorAll('.delete-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.currentTarget.dataset.planId;
            ui.showConfirmationModal(
                'Delete Plan?',
                'Are you sure you want to permanently delete this study plan? This action cannot be undone.',
                async () => {
                    const payload = {
                        eventType: 'deleteStudyPlan',
                        planId: planId
                    };
                    try {
                        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                        if (appState.activeStudyPlan && appState.activeStudyPlan.Plan_ID === planId) {
                            appState.activeStudyPlan = null;
                        }
                        showStudyPlannerScreen(); // Refresh the whole view
                    } catch (error) {
                        console.error("Error deleting plan:", error);
                        alert("Failed to delete the plan. Please try again.");
                    }
                }
            );
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
            const keywordsString = e.currentTarget.dataset.keywords.replace(/&quot;/g, '"');
            const keywords = JSON.parse(keywordsString);
            const isComprehensive = e.currentTarget.dataset.isComprehensive === 'true';
            let questions = [];

            if (isComprehensive) {
                questions = [...appState.allQuestions].sort(() => 0.5 - Math.random()).slice(0, 100);
            } else {
                const lowerCaseKeywords = keywords.map(k => k.toLowerCase());
                questions = appState.allQuestions.filter(q => {
                    const questionText = `
                        ${q.question} 
                        ${q.answerOptions.map(o => o.text).join(' ')} 
                        ${q.answerOptions.map(o => o.rationale).join(' ')}
                    `.toLowerCase();
                    return lowerCaseKeywords.some(keyword => questionText.includes(keyword));
                });
            }

            if (questions.length > 0) {
                const quizTitle = e.target.closest('li').querySelector('span, a').textContent;
                launchQuiz(questions, quizTitle);
            } else {
                alert('No questions found for the topics in this task.');
            }
        });
    });
}
