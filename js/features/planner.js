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

    if (!appState.currentUser || !appState.currentUser.UniqueID) {
        dom.studyPlannerError.textContent = 'Please log in to use the study planner.';
        dom.studyPlannerError.classList.remove('hidden');
        dom.studyPlannerLoader.classList.add('hidden');
        return;
    }

    if (!appState.userCardData || !appState.userCardData.ExamDate) {
        promptForExamDate();
        dom.studyPlannerLoader.classList.add('hidden');
    } else if (!appState.studyPlannerData || appState.studyPlannerData.length === 0) { // Check if plan exists and is not empty
        generateInitialStudyPlanPrompt(); // This will call generateInitialStudyPlan if user confirms
        dom.studyPlannerLoader.classList.add('hidden');
    } else {
        renderStudyPlan();
        dom.studyPlannerLoader.classList.add('hidden');
    }
}

function promptForExamDate() {
    dom.studyPlannerInitialSetup.classList.remove('hidden');
    dom.studyPlannerExamDateInput.value = appState.userCardData?.ExamDate ? new Date(appState.userCardData.ExamDate).toISOString().split('T')[0] : '';
    dom.studyPlannerGenerateBtn.textContent = 'Set Exam Date & Generate Plan';
}

function generateInitialStudyPlanPrompt() {
    // This function is called if no plan exists. It should ideally prompt the user
    // or directly call generateInitialStudyPlan if the exam date is already set.
    // For simplicity, if ExamDate is set, we'll generate directly.
    if (appState.userCardData && appState.userCardData.ExamDate) {
        generateInitialStudyPlan();
    } else {
        promptForExamDate(); // Fallback if ExamDate is somehow missing here
    }
}


export async function handleGeneratePlan() {
    dom.studyPlannerError.classList.add('hidden'); // Clear previous errors
    const examDate = dom.studyPlannerExamDateInput.value;
    if (!examDate) {
        dom.studyPlannerError.textContent = 'Please select your exam date.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedExamDate = new Date(examDate);
    selectedExamDate.setHours(0,0,0,0);

    if (selectedExamDate < today) {
        dom.studyPlannerError.textContent = 'Exam date cannot be in the past.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }

    const payload = { eventType: 'updateUserCardData', userId: appState.currentUser.UniqueID, examDate };
    try {
        // Assuming API_URL is correctly defined and accessible
        const response = await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        // Note: with 'no-cors', you won't be able to read response.ok or response.json()
        // You'll need to rely on the server-side logging or a different CORS setup for confirmation.
        
        if(appState.userCardData) appState.userCardData.ExamDate = examDate;
        else appState.userCardData = { ExamDate: examDate }; // Initialize if null

        generateInitialStudyPlan(); // Generate plan after setting exam date
    } catch (error) {
        console.error("Failed to save exam date:", error);
        dom.studyPlannerError.textContent = `Failed to save exam date. Please try again.`;
        dom.studyPlannerError.classList.remove('hidden');
    }
}

function generateInitialStudyPlan() {
    const examDateStr = appState.userCardData.ExamDate;
    if (!examDateStr) {
        dom.studyPlannerError.textContent = 'Exam date is not set. Cannot generate plan.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }

    const examDate = new Date(examDateStr);
    const daysRemaining = calculateDaysLeft(examDate);

    if (daysRemaining <= 0) {
        dom.studyPlannerError.textContent = 'Exam date must be in the future to generate a plan.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }

    const plan = [];
    const allChapters = [...appState.allChaptersNames];
    const totalChapters = allChapters.length;

    if (totalChapters === 0) {
        dom.studyPlannerError.textContent = 'No chapters available to generate a study plan.';
        dom.studyPlannerError.classList.remove('hidden');
        return;
    }

    // Distribute chapters evenly across remaining days
    const chaptersPerDay = Math.ceil(totalChapters / daysRemaining);
    let chapterIndex = 0;

    for (let i = 0; i < daysRemaining; i++) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        const dayPlan = { date: dateString, tasks: [] };
        
        const chaptersForThisDay = [];
        for (let j = 0; j < chaptersPerDay && chapterIndex < totalChapters; j++) {
            chaptersForThisDay.push(allChapters[chapterIndex]);
            chapterIndex++;
        }

        if (chaptersForThisDay.length > 0) {
            dayPlan.tasks.push({ type: 'lecture', name: `Study: ${chaptersForThisDay.join(', ')}`, completed: false });
        } else if (i < totalChapters) { // Ensure at least one task per day if chapters remain
             // This case handles if chaptersPerDay is 0 or very small, ensuring all chapters are assigned
             // This logic might need refinement based on desired distribution
        }
        
        plan.push(dayPlan);
    }

    appState.studyPlannerData = plan;
    saveStudyPlan(plan); // Save the newly generated plan
    renderStudyPlan();
}

function renderStudyPlan() {
    dom.studyPlannerInitialSetup.classList.add('hidden');
    dom.studyPlannerContent.classList.remove('hidden');
    dom.studyPlanDaysContainer.innerHTML = '';
    
    // Summary
    const examDate = appState.userCardData?.ExamDate ? new Date(appState.userCardData.ExamDate) : null;
    const daysRemaining = examDate ? calculateDaysLeft(examDate) : 'N/A';
    dom.planDaysRemaining.textContent = daysRemaining >= 0 ? daysRemaining : 'N/A';
    
    let totalTasks = 0, completedTasks = 0;
    let tasksTodayCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    // Sort studyPlannerData by date to ensure correct display order
    appState.studyPlannerData.sort((a,b) => new Date(a.date) - new Date(b.date));

    appState.studyPlannerData.forEach(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0,0,0,0);

        day.tasks.forEach(task => {
            totalTasks++;
            if (task.completed) completedTasks++;
            if (dayDate.getTime() === today.getTime() && !task.completed) {
                tasksTodayCount++;
            }
        });
    });
    dom.planTasksToday.textContent = tasksTodayCount;

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
            renderStudyPlan(); // Re-render to update progress bar and tasks today
        });
    });
}

export function updateStudyPlanProgress(eventType, itemName) {
    if (!appState.studyPlannerData) return;
    // Basic implementation: check if item name part of a task
    let planUpdated = false;
    appState.studyPlannerData.forEach(day => {
        day.tasks.forEach(task => {
            // Check if task is not completed and its name includes the itemName
            // This is a simple check, might need more robust matching for complex task names
            if (!task.completed && task.name.toLowerCase().includes(itemName.toLowerCase())) {
                task.completed = true;
                planUpdated = true;
            }
        });
    });
    if (planUpdated) {
        saveStudyPlan(appState.studyPlannerData);
        // Optionally re-render the planner screen to show updated progress
        // if (dom.studyPlannerContainer.classList.contains('hidden')) {
        //     // Only re-render if the planner screen is currently visible
        //     renderStudyPlan();
        // }
    }
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

    // Find or create the day entry
    let dayData = appState.studyPlannerData.find(d => d.date === taskDate);
    if (!dayData) {
        dayData = { date: taskDate, tasks: [] };
        appState.studyPlannerData.push(dayData);
        // Sort the entire plan by date after adding a new day
        appState.studyPlannerData.sort((a,b) => new Date(a.date) - new Date(b.date));
    }
    
    dayData.tasks.push({ type: 'custom', name: taskName, completed: false });
    
    saveStudyPlan(appState.studyPlannerData);
    renderStudyPlan();
    dom.studyPlanCustomTaskInput.value = '';
    dom.studyPlanCustomTaskDateInput.value = '';
}
