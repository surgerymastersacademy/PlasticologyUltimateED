// js/features/activityLog.js (FINAL VERSION v3.1)

import { createJsonRequest, sendPostRequest } from '../api.js';
import { showLoader, hideLoader, showToast } from '../ui.js';
import { getCurrentUser } from '../state.js';

let activityChart = null;

export async function initActivityLog() {
    const container = document.getElementById('activity-log-list');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    showLoader('loader'); // Ensure generic loader exists or add ID to HTML
    container.innerHTML = '';

    try {
        // Reuse 'userData' request as it returns logs
        const response = await createJsonRequest({ request: 'userData', userId: user.UniqueID });
        
        if (response && response.logs) {
            renderLogs(response.logs);
            renderChart(response.logs);
        } else {
            container.innerHTML = '<p class="text-center text-gray-500">No activity recorded yet.</p>';
        }
    } catch (error) {
        console.error("Activity Log Error:", error);
        container.innerHTML = '<p class="text-center text-red-500">Failed to load activity.</p>';
    } finally {
        hideLoader('loader');
    }

    // Clear Log Button
    const clearBtn = document.getElementById('clear-log-btn');
    if(clearBtn) {
        clearBtn.onclick = () => {
            // Show confirmation modal (implementation depends on your modal logic)
            if(confirm("Delete all logs? This cannot be undone.")) {
                clearLogs(user.UniqueID);
            }
        };
    }
}

function renderLogs(logs) {
    const container = document.getElementById('activity-log-list');
    container.innerHTML = '';
    
    if(logs.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">No recent activity.</p>';
        return;
    }

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg mb-2';
        
        const isQuiz = log.eventType && log.eventType.includes('Quiz');
        const icon = isQuiz ? 'fa-check-circle text-green-500' : 'fa-play-circle text-blue-500';
        const scoreText = log.score ? `<span class="font-bold text-slate-800 dark:text-white">${log.score}/${log.total}</span>` : '';
        
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas ${icon} text-lg"></i>
                <div>
                    <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate w-48">${log.title || 'Unknown Activity'}</p>
                    <p class="text-xs text-slate-400">${new Date(log.timestamp).toLocaleDateString()}</p>
                </div>
            </div>
            ${scoreText}
        `;
        container.appendChild(item);
    });
}

function renderChart(logs) {
    const ctx = document.getElementById('activity-chart');
    if (!ctx) return;

    // Destroy previous instance if exists
    if (activityChart) {
        activityChart.destroy();
    }

    // Simple Logic: Count activities per day (Last 7 days)
    const days = {};
    const labels = [];
    const dataPoints = [];
    
    // Init last 7 days
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString();
        days[dateStr] = 0;
        labels.push(dateStr.split('/')[0] + '/' + dateStr.split('/')[1]); // Short date
    }

    logs.forEach(log => {
        const d = new Date(log.timestamp).toLocaleDateString();
        if (days[d] !== undefined) days[d]++;
    });

    // Populate data
    Object.keys(days).forEach(k => dataPoints.push(days[k]));

    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Activity',
                data: dataPoints,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

async function clearLogs(userId) {
    try {
        await sendPostRequest({ eventType: 'clearAllLogs', userId: userId });
        showToast('Logs cleared', 'success');
        initActivityLog(); // Reload
    } catch (e) {
        showToast('Failed to clear logs', 'error');
    }
}
