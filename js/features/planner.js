// js/features/planner.js (FINAL - CORS FIXED & LINKED TO API)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { calculateDaysLeft } from '../utils.js';
import { launchQuiz } from './quiz.js';
import { analyzePerformanceByChapter } from './performance.js';
import { launchTheorySession } from './theory.js';
// استيراد دوال الاتصال بالسيرفر المصححة
import { 
    createStudyPlanAPI, 
    updateStudyPlanAPI, 
    activateStudyPlanAPI, 
    deleteStudyPlanAPI, 
    getAllUserPlansAPI 
} from '../api.js';

export async function showStudyPlannerScreen() {
    ui.showScreen(dom.studyPlannerContainer);
    appState.navigationHistory.push(showStudyPlannerScreen);
    
    // Safety check
    if (dom.studyPlannerLoader) dom.studyPlannerLoader.classList.remove('hidden');
    if (dom.plannerDashboard) dom.plannerDashboard.classList.add('hidden');
    if (dom.activePlanView) dom.activePlanView.classList.add('hidden');
    if (dom.performanceInsightsContainer) dom.performanceInsightsContainer.classList.add('hidden');

    try {
        // استخدام دالة API المركزية بدلاً من fetch المباشر
        const data = await getAllUserPlansAPI();
        
        if (data && data.success) {
            appState.studyPlans = data.plans || [];
            appState.activeStudyPlan = appState.studyPlans.find(p => String(p.Plan_Status).toUpperCase() === 'TRUE') || null;
            
            renderPerformanceInsights();
            renderPlannerDashboard();

            if (appState.activeStudyPlan) {
                renderActivePlanView();
                dom.plannerDashboard.classList.add('hidden');
                dom.activePlanView.classList.remove('hidden');
            } else {
                dom.plannerDashboard.classList.remove('hidden');
                dom.activePlanView.classList.add('hidden');
            }
        } else {
            throw new Error("Failed to load plans");
        }

    } catch (error) {
        console.error("Error loading study plans:", error);
        if (dom.studyPlansList) dom.studyPlansList.innerHTML = `<p class="text-center text-red-500">Failed to load plans. Please check connection.</p>`;
    } finally {
        if (dom.studyPlannerLoader) dom.studyPlannerLoader.classList.add('hidden');
    }
}

function renderPerformanceInsights() {
    const performance = analyzePerformanceByChapter();
    if (dom.performanceInsightsContainer && performance && (performance.strengths.length > 0 || performance.weaknesses.length > 0)) {
        dom.strengthsList.innerHTML = performance.strengths.length > 0 
            ? performance.strengths.map(s => `<li>${s}</li>`).join('') 
            : '<li>Keep practicing to build your strengths!</li>';
        
        dom.weaknessesList.innerHTML = performance.weaknesses.length > 0 
            ? performance.weaknesses.map(w => `<li>${w}</li>`).join('')
            : '<li>No specific weaknesses found. Great job!</li>';

        dom.performanceInsightsContainer.classList.remove('hidden');
    } else if (dom.performanceInsightsContainer) {
        dom.performanceInsightsContainer.classList.add('hidden');
    }
}

function renderPlannerDashboard() {
    const plansList = dom.studyPlansList;
    if (!plansList) return;
    
    plansList.innerHTML = '';
    if (!appState.studyPlans || appState.studyPlans.length === 0) {
        plansList.innerHTML = `<p class="text-center text-slate-500 p-4 bg-slate-50 rounded-lg">You haven't created any study plans yet. Click "Create New Plan" to get started!</p>`;
    } else {
        appState.studyPlans.forEach(plan => {
            const isActive = String(plan.Plan_Status).toUpperCase() === 'TRUE';
            const planCard = document.createElement('div');
            planCard.className = `p-4 rounded-lg border-2 flex justify-between items-center ${isActive ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200'}`;
            
            let planName = plan.Plan_Name;
            // حماية من البيانات التالفة
            if (typeof planName === 'string' && planName.startsWith('[{')) {
                planName = "Recovered Plan";
            }

            let dateDisplay = '';
            try {
                dateDisplay = `${new Date(plan.Plan_StartDate).toLocaleDateString('en-GB')} - ${new Date(plan.Plan_EndDate).toLocaleDateString('en-GB')}`;
            } catch (e) { dateDisplay = 'Invalid Date'; }

            planCard.innerHTML = `
                <div>
                    <h4 class="font-bold text-lg text-slate-800">${planName}</h4>
                    <p class="text-sm text-slate-500">
                        ${dateDisplay}
                        ${isActive ? '<span class="ml-2 text-xs font-bold text-white bg-blue-500 px-2 py-1 rounded-full">ACTIVE</span>' : ''}
                    </p>
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

                let actionButtonHtml = '';
                if (task.type === 'quiz' && !task.completed) {
                    actionButtonHtml = `<button class="start-planner-quiz-btn text-xs bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600" data-keywords="${keywordsData}" data-is-comprehensive="${task.isComprehensive || false}">Start Quiz</button>`;
                } else if (task.type === 'theory' && !task.completed) {
                    actionButtonHtml = `<button class="start-planner-theory-btn text-xs bg-yellow-500 text-white py-1 px-2 rounded hover:bg-yellow-600" data-keywords="${keywordsData}">Start Study</button>`;
                }

                return `
                <li class="flex items-center justify-between p-2 rounded-md ${task.completed ? 'bg-green-100 text-slate-500 line-through' : 'bg-slate-50'}">
                    <div class="flex items-center">
                        <input type="checkbox" class="task-checkbox h-4 w-4 mr-3" data-day-index="${dayIndex}" data-task-index="${taskIndex}" ${task.completed ? 'checked' : ''}>
                        ${taskContentHtml}
                    </div>
                    ${actionButtonHtml}
                </li>
            `}).join('');

            dayDiv.innerHTML = `<h4 class="font-bold text-lg mb-2 ${isToday ? 'text-blue-600': ''}">${dateDisplay}</h4><ul class="space-y-2">${tasksHtml}</ul>`;
            dom.studyPlanDaysContainer.appendChild(dayDiv);
        });
    }

    addActivePlanEventListeners();
}

function generatePlanContent(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const CUMULATIVE_QUIZ_INTERVAL = 3; 
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
                    name: `Daily MCQ Quiz (Day ${i + 1})`, 
                    keywords: [...todaysKeywords],
                    isComprehensive: false,
                    completed: false 
                });
                dayPlan.tasks.push({
                    type: 'theory',
                    name: `Daily Theory Study (Day ${i + 1})`,
                    keywords: [...todaysKeywords],
                    completed: false
                });
            }

            todaysKeywords.forEach(k => cumulativeKeywords.add(k));

            if ((i + 1) % CUMULATIVE_QUIZ_INTERVAL === 0 || i === daysForLectures - 1) {
                 dayPlan.tasks.push({ 
                    type: 'quiz', 
                    name: `Cumulative MCQ Review`, 
                    keywords: [...cumulativeKeywords],
                    isComprehensive: false,
                    completed: false 
                });
            }
        }
        if (dayPlan.tasks.length > 0) plan.push(dayPlan);
    }
    return plan.sort((a, b) => new Date(a.date) - new Date(b.date));
}

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

    const planData = {
        planName: planName,
        startDate: startDate,
        endDate: endDate,
        studyPlan: generatedPlan
    };

    try {
        // استخدام API المصححة
        await createStudyPlanAPI(planData);
        dom.modalBackdrop.classList.add('hidden');
        dom.createPlanModal.classList.add('hidden');
        showStudyPlannerScreen();
    } catch (error) {
        console.error("Error creating plan:", error);
        errorEl.textContent = 'An error occurred while saving the plan.';
        errorEl.classList.remove('hidden');
    }
}

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
            try {
                await activateStudyPlanAPI(planId);
                showStudyPlannerScreen();
            } catch (error) { console.error("Error activating plan:", error); }
        });
    });

    document.querySelectorAll('.delete-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.currentTarget.dataset.planId;
            ui.showConfirmationModal(
                'Delete Plan?',
                'Are you sure you want to delete this plan?',
                async () => {
                    try {
                        await deleteStudyPlanAPI(planId);
                        if (appState.activeStudyPlan && appState.activeStudyPlan.Plan_ID === planId) {
                            appState.activeStudyPlan = null;
                        }
                        showStudyPlannerScreen();
                    } catch (error) { console.error("Error deleting plan:", error); }
                }
            );
        });
    });
}

function addActivePlanEventListeners() {
    document.querySelectorAll('.task-checkbox').forEach(box => {
        box.addEventListener('change', async (e) => {
            const dayIndex = parseInt(e.currentTarget.dataset.dayIndex);
            const taskIndex = parseInt(e.currentTarget.dataset.taskIndex);
            appState.activeStudyPlan.Study_Plan[dayIndex].tasks[taskIndex].completed = e.currentTarget.checked;
            
            // تحديث حالة الخطة في السيرفر
            await updateStudyPlanAPI(appState.activeStudyPlan.Plan_ID, appState.activeStudyPlan.Study_Plan);
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
                    const questionKeywords = (q.Keywords || '').toLowerCase();
                    return lowerCaseKeywords.some(keyword => questionKeywords.includes(keyword));
                });
            }

            if (questions.length > 0) {
                const quizTitle = e.target.closest('li').querySelector('span, a').textContent;
                launchQuiz(questions, quizTitle);
            } else {
                alert('No MCQ questions found for the topics in this task.');
            }
        });
    });

    document.querySelectorAll('.start-planner-theory-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const keywordsString = e.currentTarget.dataset.keywords.replace(/&quot;/g, '"');
            const keywords = JSON.parse(keywordsString);
            const lowerCaseKeywords = keywords.map(k => k.toLowerCase());

            const questions = appState.allTheoryQuestions.filter(q => {
                const questionKeywords = (q.Keywords || '').toLowerCase();
                return lowerCaseKeywords.some(keyword => questionKeywords.includes(keyword));
            });

            if (questions.length > 0) {
                const studyTitle = e.target.closest('li').querySelector('span, a').textContent;
                launchTheorySession(studyTitle, questions, false);
            } else {
                alert('No Theory questions found for the topics in this task.');
            }
        });
    });
}
