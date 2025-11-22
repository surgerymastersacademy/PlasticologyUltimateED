// js/features/planner.js (FINAL UPDATED VERSION - With Chapter Selection)

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { calculateDaysLeft } from '../utils.js';
import { launchQuiz } from './quiz.js';
import { analyzePerformanceByChapter } from './performance.js';
import { launchTheorySession } from './theory.js';
import { 
    createStudyPlanAPI, 
    updateStudyPlanAPI, 
    activateStudyPlanAPI, 
    deleteStudyPlanAPI, 
    getAllUserPlansAPI 
} from '../api.js';

// --- 1. Initialization & Screen Logic ---

export async function showStudyPlannerScreen() {
    ui.showScreen(dom.studyPlannerContainer);
    appState.navigationHistory.push(showStudyPlannerScreen);
    
    // Reset UI
    if (dom.studyPlannerLoader) dom.studyPlannerLoader.classList.remove('hidden');
    if (dom.plannerDashboard) dom.plannerDashboard.classList.add('hidden');
    if (dom.activePlanView) dom.activePlanView.classList.add('hidden');
    if (dom.performanceInsightsContainer) dom.performanceInsightsContainer.classList.add('hidden');

    try {
        // Fetch plans from API
        const data = await getAllUserPlansAPI();
        
        if (data && data.success) {
            appState.studyPlans = data.plans || [];
            
            // Check for active plan
            const activePlan = appState.studyPlans.find(p => p.Plan_Status === 'Active');
            
            if (activePlan) {
                appState.activeStudyPlan = activePlan;
                renderActivePlan(activePlan);
            } else {
                appState.activeStudyPlan = null;
                showCreatePlanDashboard();
            }
        } else {
            // Fallback if API fails or no plans
             appState.studyPlans = [];
             showCreatePlanDashboard();
        }

    } catch (error) {
        console.error("Error fetching study plans:", error);
        dom.studyPlannerLoader.innerHTML = `<p class="text-red-500 text-center">Failed to load plans. Please check connection.</p>`;
    } finally {
        if (dom.studyPlannerLoader) dom.studyPlannerLoader.classList.add('hidden');
    }
}

function showCreatePlanDashboard() {
    if (dom.plannerDashboard) dom.plannerDashboard.classList.remove('hidden');
    if (dom.activePlanView) dom.activePlanView.classList.add('hidden');
    
    // Performance Insights (Optional)
    const performance = analyzePerformanceByChapter();
    if (performance && dom.performanceInsightsContainer) {
        dom.performanceInsightsContainer.classList.remove('hidden');
        dom.weakAreasList.innerHTML = performance.weaknesses.map(w => `<li class="text-red-600"><i class="fas fa-exclamation-circle mr-2"></i>${w}</li>`).join('');
        dom.strongAreasList.innerHTML = performance.strengths.map(s => `<li class="text-green-600"><i class="fas fa-check-circle mr-2"></i>${s}</li>`).join('');
    }
}

// --- 2. NEW: Chapter Selection Logic ---

/**
 * Fills the chapter selection list in the Modal.
 * Called when opening the Create Plan Modal.
 */
export function renderPlannerChapterSelection() {
    const listContainer = document.getElementById('planner-chapters-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    
    // Ensure we have chapters
    const chapters = appState.allChaptersNames || []; 

    if (chapters.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500">No chapters found.</p>';
        return;
    }

    // Create Checkboxes
    chapters.forEach((chapter, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center hover:bg-white p-1 rounded transition';
        div.innerHTML = `
            <input type="checkbox" id="plan-chap-${index}" name="plan-selected-chapters" value="${chapter}" checked 
                   class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer">
            <label for="plan-chap-${index}" class="ml-2 text-sm text-gray-700 cursor-pointer select-none w-full">${chapter}</label>
        `;
        listContainer.appendChild(div);
    });

    // Helper Buttons Logic
    const selectAllBtn = document.getElementById('select-all-chapters-btn');
    const clearAllBtn = document.getElementById('clear-all-chapters-btn');

    if (selectAllBtn) {
        selectAllBtn.onclick = () => {
            document.querySelectorAll('input[name="plan-selected-chapters"]').forEach(el => el.checked = true);
        };
    }
    if (clearAllBtn) {
        clearAllBtn.onclick = () => {
            document.querySelectorAll('input[name="plan-selected-chapters"]').forEach(el => el.checked = false);
        };
    }
}

// --- 3. Plan Generation Logic ---

export async function handleCreatePlan(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('plan-name');
    const startDateInput = document.getElementById('plan-start-date');
    const examDateInput = document.getElementById('plan-exam-date');
    const errorMsg = document.getElementById('chapter-selection-error');

    // Basic Validation
    if (!nameInput.value || !startDateInput.value || !examDateInput.value) {
        alert("Please fill in all fields.");
        return;
    }

    // NEW: Get Selected Chapters
    const selectedCheckboxes = document.querySelectorAll('input[name="plan-selected-chapters"]:checked');
    const selectedChapters = Array.from(selectedCheckboxes).map(cb => cb.value);

    // Validation: Must select at least one
    if (selectedChapters.length === 0) {
        if (errorMsg) errorMsg.classList.remove('hidden');
        return;
    } else {
        if (errorMsg) errorMsg.classList.add('hidden');
    }

    // Generate Plan with SELECTED chapters only
    const studyPlan = generateStudyPlan(
        nameInput.value,
        new Date(startDateInput.value),
        new Date(examDateInput.value),
        selectedChapters // Pass selection
    );

    if (!studyPlan) return; // Date error handling inside generate function

    // UI Feedback
    dom.createPlanBtn.disabled = true;
    dom.createPlanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        const result = await createStudyPlanAPI(studyPlan);
        
        if (result.success) {
            dom.createPlanModal.classList.add('hidden');
            dom.modalBackdrop.classList.add('hidden');
            dom.createPlanForm.reset();
            alert('Study Plan Created Successfully! 🚀');
            showStudyPlannerScreen(); // Refresh
        } else {
            throw new Error(result.message || "Failed to create plan");
        }
    } catch (error) {
        alert(error.message);
    } finally {
        dom.createPlanBtn.disabled = false;
        dom.createPlanBtn.innerHTML = 'Create Plan';
    }
}

function generateStudyPlan(planName, startDate, examDate, chaptersToStudy) {
    const today = new Date();
    today.setHours(0,0,0,0);
    startDate.setHours(0,0,0,0);
    examDate.setHours(0,0,0,0);

    if (examDate <= startDate) {
        alert("Exam date must be after start date.");
        return null;
    }

    const totalDays = Math.ceil((examDate - startDate) / (1000 * 60 * 60 * 24));
    if (totalDays < 1) {
        alert("Duration is too short.");
        return null;
    }

    // Use provided chapters or fallback to all
    const chapters = (chaptersToStudy && chaptersToStudy.length > 0) 
                     ? chaptersToStudy 
                     : appState.allChaptersNames;

    const daysPerChapter = Math.max(1, Math.floor((totalDays - 7) / chapters.length)); // Reserve 7 days for revision
    
    let planDays = [];
    let currentDay = new Date(startDate);
    let chapterIndex = 0;

    // 1. Study Phase
    while (chapterIndex < chapters.length && currentDay < examDate) {
        const chapter = chapters[chapterIndex];
        
        for (let i = 0; i < daysPerChapter && currentDay < examDate; i++) {
            planDays.push({
                date: new Date(currentDay).toISOString(),
                phase: 'Study',
                tasks: [
                    { type: 'lecture', title: `Watch: ${chapter}`, completed: false },
                    { type: 'theory', title: `Read: ${chapter}`, completed: false, keywords: JSON.stringify([chapter]) },
                    { type: 'quiz', title: `Quiz: ${chapter}`, completed: false, keywords: JSON.stringify([chapter]) }
                ]
            });
            currentDay.setDate(currentDay.getDate() + 1);
        }
        chapterIndex++;
    }

    // 2. Revision Phase (Remaining Days)
    let revisionDayCount = 1;
    while (currentDay < examDate) {
        planDays.push({
            date: new Date(currentDay).toISOString(),
            phase: 'Revision',
            tasks: [
                { type: 'mixed-quiz', title: `Full Mock Exam ${revisionDayCount}`, completed: false },
                { type: 'review-mistakes', title: `Review Mistakes`, completed: false }
            ]
        });
        revisionDayCount++;
        currentDay.setDate(currentDay.getDate() + 1);
    }

    return {
        User_ID: appState.currentUser.UniqueID,
        Plan_Name: planName,
        Plan_StartDate: startDate.toISOString(),
        Plan_EndDate: examDate.toISOString(),
        Study_Plan_JSON: JSON.stringify({ days: planDays }),
        Plan_Status: 'Active'
    };
}

// --- 4. Rendering & Interaction ---

function renderActivePlan(plan) {
    if (!plan) return;
    
    dom.plannerDashboard.classList.add('hidden');
    dom.activePlanView.classList.remove('hidden');
    dom.activePlanTitle.textContent = plan.Plan_Name;

    const planData = JSON.parse(plan.Study_Plan_JSON);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const todayStr = today.toISOString().split('T')[0];
    
    // Progress Calculation
    let totalTasks = 0;
    let completedTasks = 0;
    
    // Render Days
    dom.planDaysContainer.innerHTML = '';
    
    planData.days.forEach((day, index) => {
        const dayDate = new Date(day.date);
        const dayDateStr = dayDate.toISOString().split('T')[0];
        const isToday = dayDateStr === todayStr;
        const isPast = dayDate < today;

        day.tasks.forEach(t => {
            totalTasks++;
            if (t.completed) completedTasks++;
        });

        const dayCard = document.createElement('div');
        dayCard.className = `p-4 rounded-lg border ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-gray-200'} ${isPast ? 'opacity-75' : ''}`;
        
        // Header
        let statusBadge = '';
        if (isToday) statusBadge = '<span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">Today</span>';
        else if (isPast) statusBadge = '<span class="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">Past</span>';
        
        dayCard.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h4 class="font-bold text-gray-700 ${isToday ? 'text-blue-700' : ''}">Day ${index + 1} <span class="text-xs font-normal text-gray-500">(${dayDate.toLocaleDateString()})</span></h4>
                ${statusBadge}
            </div>
            <ul class="space-y-2" id="tasks-day-${index}">
            </ul>
        `;
        
        const taskList = dayCard.querySelector('ul');
        
        day.tasks.forEach((task, taskIdx) => {
            const li = document.createElement('li');
            li.className = 'flex items-center text-sm';
            const taskId = `task-${index}-${taskIdx}`;
            
            // Action Button (Go to Lecture/Quiz)
            let actionBtn = '';
            if (task.type === 'quiz') {
                actionBtn = `<button class="ml-auto text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200 start-planner-quiz-btn" data-keywords='${task.keywords || "[]"}'>Start</button>`;
            } else if (task.type === 'lecture') {
                actionBtn = `<button class="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200">View</button>`;
            } else if (task.type === 'theory') {
                 actionBtn = `<button class="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded hover:bg-amber-200 start-planner-theory-btn" data-keywords='${task.keywords || "[]"}'>Study</button>`;
            }

            li.innerHTML = `
                <input type="checkbox" id="${taskId}" ${task.completed ? 'checked' : ''} class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out">
                <label for="${taskId}" class="ml-2 text-gray-700 ${task.completed ? 'line-through text-gray-400' : ''} flex-1 cursor-pointer select-none">${task.title}</label>
                ${!task.completed ? actionBtn : ''}
            `;
            
            // Checkbox Logic
            const checkbox = li.querySelector('input');
            checkbox.addEventListener('change', async () => {
                task.completed = checkbox.checked;
                // Visual update
                const label = li.querySelector('label');
                if (checkbox.checked) label.classList.add('line-through', 'text-gray-400');
                else label.classList.remove('line-through', 'text-gray-400');
                
                // Save progress
                plan.Study_Plan_JSON = JSON.stringify(planData);
                await updateStudyPlanAPI(plan);
                renderProgress(totalTasks, completedTasks + (checkbox.checked ? 1 : -1)); // Optimistic update
            });

            taskList.appendChild(li);
        });

        dom.planDaysContainer.appendChild(dayCard);
    });

    // Scroll to today
    setTimeout(() => {
        const todayCard = dom.planDaysContainer.querySelector('.ring-2');
        if (todayCard) todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);

    renderProgress(totalTasks, completedTasks);
    attachQuickActionListeners();

    // Delete Plan Button
    dom.deletePlanBtn.onclick = async () => {
        if (confirm("Are you sure you want to delete this plan? This cannot be undone.")) {
            const res = await deleteStudyPlanAPI(plan.Plan_ID);
            if (res.success) {
                appState.activeStudyPlan = null;
                showStudyPlannerScreen();
            } else {
                alert(res.message);
            }
        }
    };
}

function renderProgress(total, completed) {
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    dom.planProgressBar.style.width = `${percentage}%`;
    dom.planProgressText.textContent = `${percentage}% Completed`;
}

function attachQuickActionListeners() {
    document.querySelectorAll('.start-planner-quiz-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const keywordsString = e.currentTarget.dataset.keywords.replace(/&quot;/g, '"');
            const keywords = JSON.parse(keywordsString);
            const lowerCaseKeywords = keywords.map(k => k.toLowerCase());

            const questions = appState.allQuestions.filter(q => {
                const questionKeywords = (q.Keywords || '').toLowerCase();
                return lowerCaseKeywords.some(keyword => questionKeywords.includes(keyword));
            });

            if (questions.length > 0) {
                const quizTitle = e.target.closest('li').querySelector('span, a, label').textContent;
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
                const studyTitle = e.target.closest('li').querySelector('span, a, label').textContent;
                launchTheorySession(studyTitle, questions, false);
            } else {
                alert('No Theory questions found for the topics in this task.');
            }
        });
    });
}
