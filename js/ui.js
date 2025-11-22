// js/ui.js (FINAL VERSION)

import * as dom from './dom.js';
import { appState } from './state.js';
import { applyRolePermissions } from './features/userProfile.js';

/**
 * Hides all main screens and shows the specified one.
 * AUTOMATICALLY UPDATES THE URL HASH.
 */
export function showScreen(screenToShow, isGuest = false) {
    if (!screenToShow) return;

    // 1. Close all modals
    const modals = [
        dom.confirmationModal, dom.questionNavigatorModal, dom.imageViewerModal, 
        dom.noteModal, dom.clearLogModal, dom.announcementsModal, 
        dom.userCardModal, dom.messengerModal, dom.osceNavigatorModal, 
        dom.createPlanModal, dom.matchingMenuContainer // Ensure sub-menus are reset
    ];
    modals.forEach(modal => {
        if (modal && !modal.classList.contains('hidden')) modal.classList.add('hidden');
    });
    if (dom.modalBackdrop) dom.modalBackdrop.classList.add('hidden');

    // 2. Hide all main content containers
    const screens = [
        dom.loginContainer, 
        dom.mainMenuContainer, 
        dom.lecturesContainer, 
        dom.qbankContainer, 
        dom.listContainer, 
        dom.quizContainer, 
        dom.activityLogContainer, 
        dom.notesContainer, 
        dom.libraryContainer, 
        dom.leaderboardContainer, 
        dom.osceContainer, 
        dom.osceQuizContainer, 
        dom.learningModeContainer, 
        dom.studyPlannerContainer, 
        dom.theoryContainer,
        dom.matchingContainer // Fixed visibility issue
    ];
    
    screens.forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });

    // 3. Show the requested screen
    screenToShow.classList.remove('hidden');

    // 4. Update URL Hash
    const screenId = screenToShow.id;
    let newHash = '';
    switch (screenId) {
        case 'main-menu-container': newHash = 'home'; break;
        case 'lectures-container': newHash = 'lectures'; break;
        case 'qbank-container': newHash = 'qbank'; break;
        case 'osce-container': newHash = 'osce'; break;
        case 'theory-container': newHash = 'theory'; break;
        case 'library-container': newHash = 'library'; break;
        case 'study-planner-container': newHash = 'planner'; break;
        case 'leaderboard-container': newHash = 'leaderboard'; break;
        case 'activity-log-container': newHash = 'activity'; break;
        case 'notes-container': newHash = 'notes'; break;
        case 'login-container': newHash = 'login'; break;
        case 'quiz-container': newHash = 'quiz'; break; 
        case 'learning-mode-container': newHash = 'learning'; break;
        case 'matching-container': newHash = 'matching'; break;
    }

    if (newHash && window.location.hash !== `#${newHash}`) {
        if (newHash === 'login') history.replaceState(null, null, ' ');
        else window.location.hash = newHash; 
    }

    // 5. Handle Header
    const watermarkOverlay = document.getElementById('watermark-overlay');
    if (screenToShow !== dom.loginContainer && !isGuest) {
        if (dom.globalHeader) dom.globalHeader.classList.remove('hidden');
        if (watermarkOverlay) watermarkOverlay.classList.remove('hidden');
        if (dom.userNameDisplay) dom.userNameDisplay.classList.remove('hidden');
        
        [dom.logoutBtn, dom.activityLogBtn, dom.notesBtn, dom.userProfileHeaderBtn, dom.messengerBtn].forEach(el => {
            if (el) el.classList.remove('hidden');
        });
        applyRolePermissions();
    } else {
        if (dom.globalHeader) dom.globalHeader.classList.add('hidden');
        if (watermarkOverlay) watermarkOverlay.classList.add('hidden');
    }
}

export function showConfirmationModal(title, text, onConfirm) {
    if (!dom.confirmationModal) return;
    appState.modalConfirmAction = onConfirm;
    const titleEl = dom.confirmationModal.querySelector('#modal-title');
    const textEl = dom.confirmationModal.querySelector('#modal-text');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    dom.confirmationModal.classList.remove('hidden');
    if (dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
}

export function showImageModal(src) {
    if (!dom.imageViewerModal || !dom.modalImage) return;
    if (dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
    dom.imageViewerModal.classList.remove('hidden');
    dom.modalImage.src = src;
}

export function renderBooks() {
    if (!dom.libraryList) return;
    dom.libraryList.innerHTML = '';
    if (!appState.mcqBooks || appState.mcqBooks.length === 0) {
        dom.libraryList.innerHTML = `<p class="text-center text-slate-500">No books found in the library.</p>`;
        return;
    }
    appState.mcqBooks.forEach(book => {
        if (!book.Book || !book.Link) return;
        const bookElement = document.createElement('a');
        bookElement.href = book.Link;
        bookElement.target = '_blank';
        bookElement.className = 'flex items-start p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-200';
        let iconHtml;
        if (book.icon && (book.icon.startsWith('http://') || book.icon.startsWith('https://'))) {
            iconHtml = `<div class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg mr-4 overflow-hidden"><img src="${book.icon}" alt="${book.Book}" class="w-full h-full object-cover"></div>`;
        } else {
            iconHtml = `<div class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg mr-4"><i class="${book.icon || 'fas fa-book'} text-2xl text-orange-600"></i></div>`;
        }
        bookElement.innerHTML = `${iconHtml}<div class="flex-grow"><h3 class="font-bold text-slate-800 text-lg">${book.Book}</h3><p class="text-slate-600 text-sm mt-1">${book.Description || ''}</p></div><div class="flex-shrink-0 ml-4 self-center"><i class="fas fa-external-link-alt text-slate-400"></i></div>`;
        dom.libraryList.appendChild(bookElement);
    });
}

export function renderLeaderboard(top10, currentUserRank) {
    if (!dom.leaderboardList || !dom.currentUserRankDiv) return;
    dom.leaderboardList.innerHTML = '';
    dom.currentUserRankDiv.innerHTML = '';
    if (currentUserRank) {
        dom.currentUserRankDiv.innerHTML = `
            <div class="p-4 bg-blue-100 border-2 border-blue-300 rounded-lg">
                <h4 class="text-lg font-bold text-center text-blue-800">Your Rank</h4>
                <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center"><div class="w-10 h-10 flex items-center justify-center text-xl font-bold text-blue-700">${currentUserRank.rank}</div><p class="font-bold text-slate-800 text-lg ml-4">${currentUserRank.name} (You)</p></div>
                    <div class="text-right"><p class="font-extrabold text-2xl text-blue-600">${currentUserRank.score}</p><p class="text-xs text-slate-500">Total Score</p></div>
                </div>
            </div>`;
    }
    if (!top10 || top10.length === 0) {
        dom.leaderboardList.innerHTML = `<p class="text-center text-slate-500 mt-4">The leaderboard is empty.</p>`;
        return;
    }
    top10.forEach(user => {
        const rank = user.rank;
        let rankIcon = '';
        let rankColor = 'bg-white border-slate-200';
        if (rank === 1) { rankIcon = 'fas fa-trophy text-yellow-400'; rankColor = 'bg-yellow-100 border-yellow-300'; } 
        else if (rank === 2) { rankIcon = 'fas fa-medal text-gray-400'; rankColor = 'bg-gray-100 border-gray-300'; } 
        else if (rank === 3) { rankIcon = 'fas fa-award text-orange-400'; rankColor = 'bg-orange-100 border-orange-300'; }
        const userElement = document.createElement('div');
        userElement.className = `flex items-center p-4 rounded-lg border-2 ${rankColor}`;
        userElement.innerHTML = `<div class="w-10 h-10 flex items-center justify-center text-xl font-bold ${rank > 3 ? 'text-slate-600' : ''}">${rankIcon ? `<i class="${rankIcon}"></i>` : rank}</div><div class="flex-grow ml-4"><p class="font-bold text-slate-800 text-lg">${user.name}</p></div><div class="text-right"><p class="font-bold text-slate-500">Rank ${rank}</p></div>`;
        dom.leaderboardList.appendChild(userElement);
    });
}

export function updateWatermark() {
    const user = appState.currentUser;
    const watermarkOverlay = document.getElementById('watermark-overlay');
    if (!watermarkOverlay) return;
    if (!user || user.Role === 'Guest') { watermarkOverlay.classList.add('hidden'); return; }
    watermarkOverlay.innerHTML = '';
    const date = new Date().toLocaleDateString('en-GB');
    const watermarkItem = document.createElement('div');
    watermarkItem.className = 'flex flex-col items-end text-slate-900';
    watermarkItem.innerHTML = `<img src="https://pub-fb0d46cb77cb4e22b5863540fe118da4.r2.dev/Plasticology%202025%20Logo%20white%20outline.png" alt="Logo" class="h-10 opacity-50" style="filter: invert(1);"><span class="font-semibold text-xs">${user.Name}</span><span class="text-xs">${date}</span>`;
    watermarkOverlay.appendChild(watermarkItem);
}

export function displayAnnouncement() {
    const banner = document.getElementById('announcement-banner');
    if (!banner) return;
    if (!appState.allAnnouncements || !appState.allAnnouncements.length) { banner.classList.add('hidden'); return; }
    const latestAnnouncement = appState.allAnnouncements[0];
    const seenAnnouncementId = localStorage.getItem('seenAnnouncementId');
    if (seenAnnouncementId === latestAnnouncement.UniqueID) { banner.classList.add('hidden'); return; }
    banner.innerHTML = `<div class="mb-4 p-4 bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 rounded-lg relative"><div class="flex"><div class="py-1"><i class="fas fa-bullhorn fa-lg mr-4"></i></div><div><p class="font-bold">Latest Update</p><p class="text-sm">${latestAnnouncement.UpdateMessage}</p></div></div><button id="close-announcement-btn" class="absolute top-0 bottom-0 right-0 px-4 py-3">&times;</button></div>`;
    banner.classList.remove('hidden');
    const closeBtn = document.getElementById('close-announcement-btn');
    if(closeBtn) { closeBtn.addEventListener('click', () => { banner.classList.add('hidden'); localStorage.setItem('seenAnnouncementId', latestAnnouncement.UniqueID); }); }
}

export function showAnnouncementsModal() {
    if (!dom.announcementsList || !dom.announcementsModal) return;
    dom.announcementsList.innerHTML = '';
    if (!appState.allAnnouncements || appState.allAnnouncements.length === 0) {
        dom.announcementsList.innerHTML = `<p class="text-center text-slate-500">No announcements right now.</p>`;
    } else {
        appState.allAnnouncements.forEach(ann => {
            const annItem = document.createElement('div');
            annItem.className = 'p-3 border-b';
            const date = new Date(ann.TimeStamp).toLocaleDateString('en-GB');
            annItem.innerHTML = `<p class="font-bold text-slate-700">${ann.UpdateMessage}</p><p class="text-xs text-slate-400 text-right mt-1">${date}</p>`;
            dom.announcementsList.appendChild(annItem);
        });
    }
    if (dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
    dom.announcementsModal.classList.remove('hidden');
}

export function populateFilterOptions(containerElement, items, inputNamePrefix, counts) {
    if (!containerElement) return;
    containerElement.innerHTML = '';
    if (!items || items.length === 0) { containerElement.innerHTML = `<p class="text-slate-400 text-sm">No options available.</p>`; return; }
    items.forEach(item => {
        if (!item) return;
        const div = document.createElement('div');
        div.className = 'flex items-center';
        const safeId = `${inputNamePrefix}-${item.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const count = counts ? (counts[item] || 0) : 0;
        div.innerHTML = `<input id="${safeId}" name="${inputNamePrefix}" value="${item}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"><label for="${safeId}" class="ml-3 text-sm text-gray-600">${item} ${count > 0 ? `(${count} Qs)` : ''}</label>`;
        containerElement.appendChild(div);
    });
}

export function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}
