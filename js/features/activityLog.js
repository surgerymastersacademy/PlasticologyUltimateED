// js/features/activityLog.js (FINAL VERSION v3.1)

import { createJsonRequest, sendPostRequest } from '../api.js';
import { showLoader, hideLoader, showToast } from '../ui.js';
import { getCurrentUser } from '../state.js';

let activityChart = null;

export async function initActivityLog() {
    const container = document.getElementById('activity-log-list');
    // تأكد من وجود الكونتينر قبل البدء
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    // استخدام لودر عام إذا لم يوجد لودر مخصص
    showLoader('loader'); 
    container.innerHTML = '';

    try {
        // نستخدم طلب 'userData' لأنه يرجع اللوجات ضمن البيانات
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

    // تفعيل زر مسح السجل
    const clearBtn = document.getElementById('clear-log-btn');
    if(clearBtn) {
        clearBtn.onclick = () => {
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

    // عرض اللوجات
    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg mb-2 shadow-sm';
        
        const isQuiz = log.eventType && log.eventType.includes('Quiz');
        const icon = isQuiz ? 'fa-check-circle text-green-500' : 'fa-play-circle text-blue-500';
        // عرض الدرجة فقط إذا كانت موجودة
        const scoreText = (log.score !== undefined && log.total !== undefined) 
            ? `<span class="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">${log.score}/${log.total}</span>` 
            : '';
        
        item.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <i class="fas ${icon} text-sm"></i>
                </div>
                <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">${log.title || 'Unknown Activity'}</p>
                    <p class="text-[10px] text-slate-400">${new Date(log.timestamp).toLocaleDateString()} - ${new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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

    // حذف الرسم البياني القديم إذا وجد لتجنب التداخل
    if (activityChart) {
        activityChart.destroy();
    }

    // تجميع البيانات: عدد النشاطات لكل يوم في آخر 7 أيام
    const days = {};
    const labels = [];
    const dataPoints = [];
    
    // تهيئة الأيام السبعة الماضية
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString(); // المفتاح للتجميع
        const displayStr = d.toLocaleDateString(undefined, {weekday: 'short'}); // للعرض (Mon, Tue)
        days[dateStr] = 0;
        labels.push(displayStr);
        
        // نحتاج حفظ التواريخ الأصلية للمقارنة
        // (تبسيطاً هنا سنعتمد على ترتيب المصفوفات المتوازي)
    }

    // ملء البيانات
    logs.forEach(log => {
        const d = new Date(log.timestamp).toLocaleDateString();
        // إذا كان التاريخ ضمن آخر 7 أيام (موجود في المصفوفة)
        if (days.hasOwnProperty(d)) {
            days[d]++;
        }
    });

    // تحويل الكائن إلى مصفوفة بنفس ترتيب التواريخ
    // (هنا نفترض أن keys الكائن `days` مرتبة، لكن الأفضل الاعتماد على labels generated loop)
    // سنعيد التكرار لضمان الترتيب
    const sortedData = [];
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString();
        sortedData.push(days[dateStr]);
    }

    activityChart = new Chart(ctx, {
        type: 'bar', // أو 'line' حسب التفضيل
        data: {
            labels: labels,
            datasets: [{
                label: 'Activities',
                data: sortedData,
                backgroundColor: 'rgba(37, 99, 235, 0.6)', // Blue-600
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // ليملأ الكونتينر
            plugins: { legend: { display: false } },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1 },
                    grid: { display: false }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

async function clearLogs(userId) {
    try {
        await sendPostRequest({ eventType: 'clearAllLogs', userId: userId });
        showToast('Logs cleared successfully', 'success');
        initActivityLog(); // إعادة تحميل القائمة لتظهر فارغة
    } catch (e) {
        console.error(e);
        showToast('Failed to clear logs', 'error');
    }
}
