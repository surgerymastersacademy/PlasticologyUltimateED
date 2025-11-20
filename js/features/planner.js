// js/features/planner.js (FINAL FIXED VERSION v3.1)

import { createJsonRequest, sendPostRequest } from '../api.js';
import { showLoader, hideLoader, showToast, updateText } from '../ui.js';
import { getCurrentUser } from '../state.js';

export async function initPlanner() {
    const container = document.getElementById('study-plans-list');
    if (!container) return;

    // Bind Create Plan Modal Events
    document.getElementById('show-create-plan-modal-btn').addEventListener('click', () => {
        document.getElementById('create-plan-modal').classList.remove('hidden');
        document.getElementById('modal-backdrop').classList.remove('hidden');
    });

    document.getElementById('cancel-create-plan-btn').addEventListener('click', () => {
        document.getElementById('create-plan-modal').classList.add('hidden');
        document.getElementById('modal-backdrop').classList.add('hidden');
    });

    document.getElementById('confirm-create-plan-btn').addEventListener('click', createPlan);
    
    // Back Button
    document.getElementById('back-to-plans-dashboard-btn').addEventListener('click', () => {
        document.getElementById('active-plan-view').classList.add('hidden');
        document.getElementById('planner-dashboard').classList.remove('hidden');
    });

    // Initial Load
    loadUserPlans();
}

async function loadUserPlans() {
    const user = getCurrentUser();
    if (!user) return;

    showLoader('study-planner-loader');
    try {
        // Fetch all plans for this user
        const response = await createJsonRequest({ request: 'getAllUserPlans', userId: user.UniqueID });
        
        const list = document.getElementById('study-plans-list');
        list.innerHTML = '';

        if (response.success && response.plans && response.plans.length > 0) {
            // Sort by date (newest first)
            response.plans.sort((a, b) => new Date(b.Plan_TimeStamp) - new Date(a.Plan_TimeStamp));

            response.plans.forEach(plan => {
                const isActive = String(plan.Plan_Status) === 'TRUE';
                const statusColor = isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300';
                const statusText = isActive ? '<span class="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Active</span>' : '';

                const item = document.createElement('div');
                item.className = `bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${statusColor} flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all mb-3`;
                
                item.innerHTML = `
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h4 class="font-bold text-lg text-slate-800 dark:text-white">${plan.Plan_Name}</h4>
                            ${statusText}
                        </div>
                        <p class="text-xs text-slate-500">
                            <i class="far fa-calendar-alt mr-1"></i>
                            ${new Date(plan.Plan_StartDate).toLocaleDateString()} - ${new Date(plan.Plan_EndDate).toLocaleDateString()}
                        </p>
                    </div>
                    <i class="fas fa-chevron-right text-slate-400"></i>
                `;
                item.addEventListener('click', () => openPlan(plan));
                list.appendChild(item);
            });
        } else {
            list.innerHTML = `
                <div class="text-center py-8">
                    <div class="bg-slate-100 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-calendar-plus text-2xl text-slate-400"></i>
                    </div>
                    <p class="text-slate-500 dark:text-slate-400">No study plans yet.</p>
                    <p class="text-xs text-slate-400">Create one to organize your time.</p>
                </div>
            `;
        }
    } catch (e) {
        console.error(e);
        showToast("Failed to load plans", "error");
    } finally {
        hideLoader('study-planner-loader');
    }
}

function openPlan(plan) {
    document.getElementById('planner-dashboard').classList.add('hidden');
    document.getElementById('active-plan-view').classList.remove('hidden');
    
    updateText('active-plan-name', plan.Plan_Name);
    
    // Parse Plan Content
    let schedule = [];
    try {
        schedule = typeof plan.Study_Plan === 'string' ? JSON.parse(plan.Study_Plan) : plan.Study_Plan;
        // Handle case where Study_Plan might be wrapped in another object based on GS Code logic
        if (plan.Study_Plan_JSON) {
             schedule = JSON.parse(plan.Study_Plan_JSON);
        }
    } catch(e) {
        console.warn("Error parsing plan JSON", e);
        schedule = [];
    }

    const container = document.getElementById('study-plan-days-container');
    container.innerHTML = '';

    // Add Activation Button if not active
    if (String(plan.Plan_Status) !== 'TRUE') {
        const activateBtn = document.createElement('button');
        activateBtn.className = 'w-full bg-green-600 text-white py-2 rounded-lg font-bold mb-4 hover:bg-green-700 transition-colors shadow-sm';
        activateBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Set as Active Plan';
        activateBtn.onclick = () => activateStudyPlan(plan.Plan_ID);
        container.appendChild(activateBtn);
    }

    if (!schedule || schedule.length === 0) {
        container.innerHTML += '<p class="text-center text-gray-500">This plan is empty.</p>';
        return;
    }

    // Render Days
    schedule.forEach((day, idx) => {
        const dayEl = document.createElement('div');
        dayEl.className = 'bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-3';
        
        let topicsHtml = '';
        if (day.topics && Array.isArray(day.topics)) {
            topicsHtml = day.topics.map(t => `<li class="flex items-start"><span class="mr-2">•</span><span>${t}</span></li>`).join('');
        } else {
             topicsHtml = '<li class="text-slate-400 italic">Free Day / Review</li>';
        }

        dayEl.innerHTML = `
            <h5 class="font-bold text-blue-600 mb-2 flex items-center">
                <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-2">Day ${day.day || idx + 1}</span>
            </h5>
            <ul class="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                ${topicsHtml}
            </ul>
        `;
        container.appendChild(dayEl);
    });

    // Update Progress Summary
    const today = new Date();
    const endDate = new Date(plan.Plan_EndDate);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    updateText('plan-days-remaining', `${daysLeft > 0 ? daysLeft : 0} Days Remaining`);
    updateText('plan-tasks-today', `${schedule.length} Total Days`);
}

async function activateStudyPlan(planId) {
    const user = getCurrentUser();
    if (!user || !planId) return;

    showLoader('study-planner-loader');
    try {
        // Use generic sendPostRequest instead of the missing named export
        const response = await sendPostRequest({
            eventType: 'activateStudyPlan',
            userId: user.UniqueID,
            planId: planId
        });

        if (response.success) {
            showToast("Plan activated successfully!", "success");
            document.getElementById('active-plan-view').classList.add('hidden');
            document.getElementById('planner-dashboard').classList.remove('hidden');
            loadUserPlans(); // Refresh list
        } else {
            showToast(response.message || "Failed to activate plan", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Error activating plan", "error");
    } finally {
        hideLoader('study-planner-loader');
    }
}

async function createPlan() {
    const name = document.getElementById('new-plan-name').value;
    const start = document.getElementById('new-plan-start-date').value;
    const end = document.getElementById('new-plan-end-date').value;
    const user = getCurrentUser();
    const errorMsg = document.getElementById('create-plan-error');

    if (!name || !start || !end) {
        if(errorMsg) {
            errorMsg.textContent = "Please fill in all fields.";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    const confirmBtn = document.getElementById('confirm-create-plan-btn');
    confirmBtn.textContent = 'Creating...';
    confirmBtn.disabled = true;

    // Simple Generator Logic (Placeholder for V3.1)
    // In a real scenario, this would distribute topics based on remaining days
    const startDate = new Date(start);
    const endDate = new Date(end);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const generatedPlan = [];
    for(let i=0; i <= totalDays && i < 60; i++) { // Cap at 60 days for safety
        generatedPlan.push({
            day: i + 1,
            topics: i % 7 === 6 ? ['Rest / Review'] : ['General Principles', 'Wound Healing'] // Dummy topics
        });
    }

    try {
        await sendPostRequest({
            eventType: 'createStudyPlan',
            userId: user.UniqueID,
            planName: name,
            startDate: start,
            endDate: end,
            studyPlan: generatedPlan
        });
        
        showToast("New study plan created!", "success");
        document.getElementById('create-plan-modal').classList.add('hidden');
        document.getElementById('modal-backdrop').classList.add('hidden');
        
        // Reset form
        document.getElementById('new-plan-name').value = '';
        document.getElementById('new-plan-start-date').value = '';
        document.getElementById('new-plan-end-date').value = '';

        loadUserPlans(); // Refresh

    } catch (e) {
        console.error(e);
        showToast("Failed to create plan", "error");
    } finally {
        confirmBtn.textContent = 'Create';
        confirmBtn.disabled = false;
    }
}
