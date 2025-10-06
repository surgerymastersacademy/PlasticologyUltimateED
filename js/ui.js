// js/ui.js (FINAL AND COMPLETE VERSION)

import * as dom from './dom.js';
import { appState } from './state.js';
import { applyRolePermissions } from './features/userProfile.js';

/**
 * Hides all main screens and shows the specified one.
 */
export function showScreen(screenToShow, isGuest = false) {
    // Close all modals first
    [dom.confirmationModal, dom.questionNavigatorModal, dom.imageViewerModal, dom.noteModal, dom.clearLogModal, dom.announcementsModal, dom.userCardModal, dom.messengerModal, dom.osceNavigatorModal, dom.createPlanModal, dom.registrationModal].forEach(modal => {
        if (modal) modal.classList.add('hidden');
    });
    dom.modalBackdrop.classList.add('hidden');

    // Hide all main content containers
    [dom.loginContainer, dom.mainMenuContainer, dom.lecturesContainer, dom.qbankContainer, dom.listContainer, dom.quizContainer, dom.activityLogContainer, dom.notesContainer, dom.libraryContainer, dom.leaderboardContainer, dom.osceContainer, dom.osceQuizContainer, dom.learningModeContainer, dom.studyPlannerContainer, dom.theoryContainer, dom.matchingMenuContainer, dom.matchingContainer].forEach(screen => { // <-- NEW containers added here
        if (screen) screen.classList.add('hidden');
    });

    if (screenToShow) screenToShow.classList.remove('hidden');

    const watermarkOverlay = document.getElementById('watermark-overlay');
    if (screenToShow !== dom.loginContainer && !isGuest) {
        dom.globalHeader.classList.remove('hidden');
        watermarkOverlay.classList.remove('hidden');
    } else {
        dom.globalHeader.classList.add('hidden');
        watermarkOverlay.classList.add('hidden');
    }
}


/**
 * Initializes the main application interface after successful login.
 */
export function initializeMainUI() {
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('login-canvas').style.display = 'none'; // Hide canvas after login
    document.body.style.display = 'block'; // Make sure body is block
    
    applyRolePermissions();
    updateWatermark();
}

/**
 * Updates the watermark text with the current user's details.
 */
function updateWatermark() {
    const watermarkOverlay = document.getElementById('watermark-overlay');
    if (appState.currentUser && watermarkOverlay) {
        const user = appState.currentUser;
        watermarkOverlay.textContent = `${user.Name}\n${user.Username}`;
    }
}

/**
 * Shows a customizable confirmation modal.
 * @param {string} title
 * @param {string} message
 * @param {function} onConfirm
 * @param {string} [confirmText='Confirm']
 * @param {string} [cancelText='Cancel']
 */
export function showConfirmationModal(title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
    dom.modalTitle.textContent = title;
    dom.modalMessage.textContent = message;
    dom.modalConfirmBtn.textContent = confirmText;
    dom.modalCancelBtn.textContent = cancelText;

    dom.modalBackdrop.classList.remove('hidden');
    dom.confirmationModal.classList.remove('hidden');

    // Make sure default buttons are visible if they were hidden
    dom.modalConfirmBtn.classList.remove('hidden');
    dom.modalCancelBtn.classList.remove('hidden');
    
    appState.modalConfirmAction = onConfirm;
}

/**
 * Renders the leaderboard list and the current user's rank.
 * @param {Array} leaderboardData
 * @param {object} currentUserRankData
 */
export function renderLeaderboard(leaderboardData, currentUserRankData) {
    dom.leaderboardList.innerHTML = '';
    leaderboardData.forEach((user, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700';
        const rank = index + 1;
        let medal = '';
        if (rank === 1) medal = '<i class="fas fa-trophy text-yellow-400"></i>';
        else if (rank === 2) medal = '<i class="fas fa-trophy text-gray-400"></i>';
        else if (rank === 3) medal = '<i class="fas fa-trophy text-yellow-600"></i>';

        li.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="font-bold text-lg w-8 text-center">${medal || rank}</span>
                <span class="font-semibold">${user.name}</span>
            </div>
            <span class="font-bold text-blue-600 dark:text-blue-400">${user.score} pts</span>
        `;
        dom.leaderboardList.appendChild(li);
    });

    if (currentUserRankData) {
        dom.currentUserRankDiv.innerHTML = `
            <div class="p-4 rounded-lg bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 flex items-center justify-between">
                <p class="font-semibold">Your Rank: <span class="font-bold text-xl">${currentUserRankData.rank}</span></p>
                <p class="font-semibold">Your Score: <span class="font-bold text-xl">${currentUserRankData.score} pts</span></p>
            </div>
        `;
    } else {
        dom.currentUserRankDiv.innerHTML = `<p class="text-center text-slate-500">Your rank will appear here once you complete a quiz.</p>`;
    }
}

/**
 * Displays announcements in a modal.
 */
export function showAnnouncementsModal() {
    dom.announcementsList.innerHTML = '';
    if (appState.allAnnouncements.length === 0) {
        dom.announcementsList.innerHTML = '<p class="text-slate-500">No new announcements.</p>';
    } else {
        appState.allAnnouncements.forEach(ann => {
            const annItem = document.createElement('div');
            annItem.className = 'p-3 bg-slate-100 dark:bg-slate-700 rounded-lg';
            const date = new Date(ann.TimeStamp).toLocaleString();
            annItem.innerHTML = `
                <p class="font-bold text-slate-700 dark:text-slate-200">${ann.UpdateMessage}</p>
                <p class="text-xs text-slate-400 text-right mt-1">${date}</p>
            `;
            dom.announcementsList.appendChild(annItem);
        });
    }
    dom.modalBackdrop.classList.remove('hidden');
    dom.announcementsModal.classList.remove('hidden');
}

/**
 * Populates a container with checkbox filter options. REQUIRED FOR CUSTOM MOCK.
 * @param {HTMLElement} containerElement
 * @param {Array<string>} items
 * @param {string} inputNamePrefix
 * @param {object} counts
 */
export function populateFilterOptions(containerElement, items, inputNamePrefix, counts) {
    containerElement.innerHTML = '';
    if (!items || items.length === 0) {
        containerElement.innerHTML = `<p class="text-slate-400 text-sm">No options available.</p>`;
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex items-center';
        const safeId = `${inputNamePrefix}-${item.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const count = counts[item] || 0;
        div.innerHTML = `<input id="${safeId}" name="${inputNamePrefix}" value="${item}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                         <label for="${safeId}" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">${item} (${count})</label>`;
        containerElement.appendChild(div);
    });
}
