// js/features/lectures.js (FINAL VERSION v3.1)

import { createJsonRequest, sendPostRequest, fetchContentData } from '../api.js';
import { showLoader, hideLoader, showToast } from '../ui.js';
import { getCurrentUser } from '../state.js';

let allLectures = [];

export async function initLectures() {
    const container = document.getElementById('lectures-list');
    const searchInput = document.getElementById('lecture-search-input');
    
    if (!container) return;

    showLoader('lectures-loader');
    container.innerHTML = ''; // Clear previous content

    try {
        // 1. Get Content (Smart Cache)
        const data = await fetchContentData();
        
        if (data && data.lectures) {
            allLectures = data.lectures;
            
            // 2. Get User Progress (Optional: to show what's watched)
            // We could fetch logs here, but for speed, we'll render first
            renderLectures(allLectures);
        } else {
            container.innerHTML = '<p class="text-center text-gray-500">No lectures found.</p>';
        }
    } catch (error) {
        console.error("Lectures Init Error:", error);
        container.innerHTML = '<p class="text-center text-red-500">Failed to load lectures.</p>';
    } finally {
        hideLoader('lectures-loader');
    }

    // Search Listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allLectures.filter(l => 
                (l.Topic && l.Topic.toLowerCase().includes(term)) || 
                (l.Chapter && l.Chapter.toLowerCase().includes(term))
            );
            renderLectures(filtered);
        });
    }
}

function renderLectures(lectures) {
    const container = document.getElementById('lectures-list');
    container.innerHTML = '';

    if (lectures.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 mt-4">No matching lectures found.</p>';
        return;
    }

    // Group by Chapter
    const grouped = {};
    lectures.forEach(lecture => {
        const chapter = lecture.Chapter || 'General';
        if (!grouped[chapter]) grouped[chapter] = [];
        grouped[chapter].push(lecture);
    });

    // Render Groups
    Object.keys(grouped).forEach(chapter => {
        // Create Chapter Header (Accordion Style)
        const chapterDiv = document.createElement('details');
        chapterDiv.className = 'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group mb-4';
        chapterDiv.open = false; // Collapsed by default

        const summary = document.createElement('summary');
        summary.className = 'p-4 cursor-pointer flex justify-between items-center font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors select-none';
        summary.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded uppercase font-bold">${grouped[chapter].length} Videos</span>
                <span>${chapter}</span>
            </div>
            <i class="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
        `;

        const listDiv = document.createElement('div');
        listDiv.className = 'p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 space-y-2';

        grouped[chapter].forEach(lec => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group/item';
            
            // Determine Icon (Video or Link)
            const iconClass = lec.Link.includes('youtu') ? 'fa-youtube text-red-600' : 'fa-play-circle text-teal-600';
            
            item.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 group-hover/item:bg-teal-50 dark:group-hover/item:bg-teal-900/20 transition-colors">
                        <i class="fab ${iconClass} text-lg"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">${lec.Topic}</h4>
                        <p class="text-xs text-slate-400 truncate">Tap to watch</p>
                    </div>
                </div>
                <i class="fas fa-external-link-alt text-slate-300 group-hover/item:text-blue-500"></i>
            `;

            item.addEventListener('click', () => openLecture(lec));
            listDiv.appendChild(item);
        });

        chapterDiv.appendChild(summary);
        chapterDiv.appendChild(listDiv);
        container.appendChild(chapterDiv);
    });
}

async function openLecture(lecture) {
    if (!lecture.Link) {
        showToast('No link available for this lecture', 'error');
        return;
    }

    // 1. Open Link
    window.open(lecture.Link, '_blank');

    // 2. Log View (Silently)
    const user = getCurrentUser();
    if (user) {
        try {
            // Update "Last Activity" in UI immediately (Optimistic UI)
            const ribbon = document.getElementById('last-lecture-ribbon');
            if (ribbon) {
                ribbon.innerHTML = `<i class="fas fa-play mr-1"></i> Resume: ${lecture.Topic.substring(0, 15)}...`;
                ribbon.classList.remove('hidden');
            }

            // Send to Backend
            await sendPostRequest({
                eventType: 'ViewLecture',
                userId: user.UniqueID,
                userName: user.Name,
                lectureName: lecture.Topic
            });
            console.log("Lecture view logged");
        } catch (e) {
            console.warn("Failed to log lecture view", e);
        }
    }
}
