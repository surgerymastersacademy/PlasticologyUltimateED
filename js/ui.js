// js/ui.js (FINAL AND COMPLETE VERSION)

import * as dom from './dom.js';
import { appState } from './state.js';
import { applyRolePermissions } from './features/userProfile.js';

/**
 * Hides all main screens and shows the specified one.
 */
export function showScreen(screenToShow, isGuest = false) {
    // Close all modals first
    [dom.confirmationModal, dom.questionNavigatorModal, dom.imageViewerModal, dom.noteModal, dom.clearLogModal, dom.announcementsModal, dom.userCardModal, dom.messengerModal, dom.osceNavigatorModal].forEach(modal => {
        if (modal) modal.classList.add('hidden');
    });
    dom.modalBackdrop.classList.add('hidden');

    // Hide all main content containers
    [dom.loginContainer, dom.mainMenuContainer, dom.lecturesContainer, dom.qbankContainer, dom.listContainer, dom.quizContainer, dom.activityLogContainer, dom.notesContainer, dom.libraryContainer, dom.leaderboardContainer, dom.osceContainer, dom.osceQuizContainer, dom.learningModeContainer, dom.studyPlannerContainer, dom.theoryContainer].forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });

    if (screenToShow) screenToShow.classList.remove('hidden');

    const watermarkOverlay = document.getElementById('watermark-overlay');
    if (screenToShow !== dom.loginContainer && !isGuest) {
        dom.globalHeader.classList.remove('hidden');
        watermarkOverlay.classList.remove('hidden');
        dom.userNameDisplay.classList.remove('hidden');
        dom.logoutBtn.classList.remove('hidden');
        dom.activityLogBtn.classList.remove('hidden');
        dom.notesBtn.classList.remove('hidden');
        dom.userProfileHeaderBtn.classList.remove('hidden');
        dom.messengerBtn.classList.remove('hidden');
        applyRolePermissions();
    } else {
        dom.globalHeader.classList.add('hidden');
        watermarkOverlay.classList.add('hidden');
    }
}

/**
 * Displays a confirmation modal.
 */
export function showConfirmationModal(title, text, onConfirm) {
    appState.modalConfirmAction = onConfirm;
    dom.confirmationModal.querySelector('#modal-title').textContent = title;
    dom.confirmationModal.querySelector('#modal-text').textContent = text;
    dom.confirmationModal.classList.remove('hidden');
    dom.modalBackdrop.classList.remove('hidden');
}

/**
 * Displays the image viewer modal.
 */
export function showImageModal(src) {
    dom.modalBackdrop.classList.remove('hidden');
    dom.imageViewerModal.classList.remove('hidden');
    dom.modalImage.src = src;
}

/**
 * Renders the list of books in the library.
 */
export function renderBooks() {
    dom.libraryList.innerHTML = '';
    if (appState.mcqBooks.length === 0) {
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

        const contentHtml = `<div class="flex-grow"><h3 class="font-bold text-slate-800 text-lg">${book.Book}</h3><p class="text-slate-600 text-sm mt-1">${book.Description || ''}</p></div>`;
        const arrowHtml = `<div class="flex-shrink-0 ml-4 self-center"><i class="fas fa-external-link-alt text-slate-400"></i></div>`;

        bookElement.innerHTML = iconHtml + contentHtml + arrowHtml;
        dom.libraryList.appendChild(bookElement);
    });
}

/**
 * Renders the leaderboard with top 10 users and current user's rank.
 */
export function renderLeaderboard(top10, currentUserRank) {
    dom.leaderboardList.innerHTML = '';
    dom.currentUserRankDiv.innerHTML = '';

    if (currentUserRank) {
        dom.currentUserRankDiv.innerHTML = `
            <div class="p-4 bg-blue-100 border-2 border-blue-300 rounded-lg">
                <h4 class="text-lg font-bold text-center text-blue-800">Your Rank</h4>
                <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center">
                        <div class="w-10 h-10 flex items-center justify-center text-xl font-bold text-blue-700">${currentUserRank.rank}</div>
                        <p class="font-bold text-slate-800 text-lg ml-4">${currentUserRank.name} (You)</p>
                    </div>
                    <div class="text-right">
                        <p class="font-extrabold text-2xl text-blue-600">${currentUserRank.score}</p>
                        <p class="text-xs text-slate-500">Total Score</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (!top10 || top10.length === 0) {
        dom.leaderboardList.innerHTML = `<p class="text-center text-slate-500 mt-4">The leaderboard is empty.</p>`;
        return;
    }

    top10.forEach(user => {
        const rank = user.rank;
        let rankIcon = '';
        let rankColor = 'bg-white border-slate-200';
        if (rank === 1) {
            rankIcon = 'fas fa-trophy text-yellow-400';
            rankColor = 'bg-yellow-100 border-yellow-300';
        } else if (rank === 2) {
            rankIcon = 'fas fa-medal text-gray-400';
            rankColor = 'bg-gray-100 border-gray-300';
        } else if (rank === 3) {
            rankIcon = 'fas fa-award text-orange-400';
            rankColor = 'bg-orange-100 border-orange-300';
        }

        const userElement = document.createElement('div');
        userElement.className = `flex items-center p-4 rounded-lg border-2 ${rankColor}`;
        userElement.innerHTML = `
            <div class="w-10 h-10 flex items-center justify-center text-xl font-bold ${rank > 3 ? 'text-slate-600' : ''}">${rankIcon ? `<i class="${rankIcon}"></i>` : rank}</div>
            <div class="flex-grow ml-4"><p class="font-bold text-slate-800 text-lg">${user.name}</p></div>
            <div class="text-right"><p class="font-bold text-slate-500">Rank ${rank}</p></div>
        `;
        dom.leaderboardList.appendChild(userElement);
    });
}

/**
 * Updates the watermark with the current user's name and date.
 */
export function updateWatermark() {
    const user = appState.currentUser;
    const watermarkOverlay = document.getElementById('watermark-overlay');
    if (!user || user.Role === 'Guest') {
        watermarkOverlay.classList.add('hidden');
        return;
    }

    watermarkOverlay.innerHTML = '';
    const date = new Date().toLocaleDateString('en-GB');
    const watermarkItem = document.createElement('div');
    watermarkItem.className = 'flex flex-col items-end text-slate-900';
    watermarkItem.innerHTML = `
        <img src="https://raw.githubusercontent.com/doctorbishoy/Plasticology-/main/Plasticology%202025%20Logo%20white%20outline.png" alt="Logo" class="h-10 opacity-50" style="filter: invert(1);">
        <span class="font-semibold text-xs">${user.Name}</span>
        <span class="text-xs">${date}</span>
    `;
    watermarkOverlay.appendChild(watermarkItem);
}

/**
 * Displays the latest unseen announcement.
 */
export function displayAnnouncement() {
    const banner = document.getElementById('announcement-banner');
    if (!appState.allAnnouncements.length) {
        banner.classList.add('hidden');
        return;
    }
    const latestAnnouncement = appState.allAnnouncements[0];
    const seenAnnouncementId = localStorage.getItem('seenAnnouncementId');
    if (seenAnnouncementId === latestAnnouncement.UniqueID) {
        banner.classList.add('hidden');
        return;
    }
    banner.innerHTML = `
        <div class="mb-4 p-4 bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 rounded-lg relative">
            <div class="flex">
                <div class="py-1"><i class="fas fa-bullhorn fa-lg mr-4"></i></div>
                <div>
                    <p class="font-bold">Latest Update</p>
                    <p class="text-sm">${latestAnnouncement.UpdateMessage}</p>
                </div>
            </div>
            <button id="close-announcement-btn" class="absolute top-0 bottom-0 right-0 px-4 py-3">&times;</button>
        </div>
    `;
    banner.classList.remove('hidden');
    document.getElementById('close-announcement-btn').addEventListener('click', () => {
        banner.classList.add('hidden');
        localStorage.setItem('seenAnnouncementId', latestAnnouncement.UniqueID);
    });
}

/**
 * Shows the announcements modal with a list of all announcements.
 */
export function showAnnouncementsModal() {
    dom.announcementsList.innerHTML = '';
    if (appState.allAnnouncements.length === 0) {
        dom.announcementsList.innerHTML = `<p class="text-center text-slate-500">No announcements right now.</p>`;
    } else {
        appState.allAnnouncements.forEach(ann => {
            const annItem = document.createElement('div');
            annItem.className = 'p-3 border-b';
            const date = new Date(ann.TimeStamp).toLocaleDateString('en-GB');
            annItem.innerHTML = `
                <p class="font-bold text-slate-700">${ann.UpdateMessage}</p>
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
        div.innerHTML = `<input id="${safeId}" name="${inputNamePrefix}" value="${item}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"><label for="${safeId}" class="ml-3 text-sm text-gray-600">${item} ${count > 0 ? `(${count} Qs)` : ''}</label>`;
        containerElement.appendChild(div);
    });
}

// ===================================================
// Plasticology Ultimate Edition
// Build: UI Smart Alerts — v1.1.5 (2025-10-08)
// Type: Append-only block (non-breaking)
// Purpose: Toast & Banner notifications + Theme & Sidebar helpers
// ===================================================

(function () {
  try {
    if (window.__uiSmartAlertsLoaded) return;
    window.__uiSmartAlertsLoaded = true;

    // ---------- CSS Injection (idempotent) ----------
    const STYLE_ID = "ui-smart-alerts-styles";
    if (!document.getElementById(STYLE_ID)) {
      const css = `
        .toast-container{position:fixed;right:16px;bottom:16px;display:flex;flex-direction:column;gap:10px;z-index:9998}
        .toast{min-width:260px;max-width:420px;padding:12px 14px;border-radius:12px;box-shadow:0 10px 20px rgba(0,0,0,.12);display:flex;align-items:flex-start;gap:10px;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;animation:toastIn .22s ease-out}
        .toast .msg{line-height:1.35;font-size:14px}
        .toast .close{margin-left:auto;border:none;background:transparent;font-size:16px;cursor:pointer;opacity:.8}
        .toast-success{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
        .toast-info{background:#eff6ff;color:#1e3a8a;border:1px solid #bfdbfe}
        .toast-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
        .toast-error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
        @keyframes toastIn{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}

        .banner{position:fixed;top:0;left:0;right:0;padding:10px 14px;z-index:9999;display:flex;align-items:center;gap:10px;justify-content:center;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
        .banner-success{background:#ecfdf5;color:#065f46;border-bottom:1px solid #a7f3d0}
        .banner-info{background:#eff6ff;color:#1e3a8a;border-bottom:1px solid #bfdbfe}
        .banner-warn{background:#fffbeb;color:#92400e;border-bottom:1px solid #fde68a}
        .banner-error{background:#fef2f2;color:#991b1b;border-bottom:1px solid #fecaca}
        .banner .close{position:absolute;right:14px;top:8px;border:none;background:transparent;font-size:18px;cursor:pointer;opacity:.85}

        .sidebar-open{transform:translateX(0)}
        .sidebar-closed{transform:translateX(-100%)}
        .sidebar-animate{transition:transform .25s ease}
      `;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
    }

    // ---------- Containers (idempotent) ----------
    function ensureToastContainer() {
      let c = document.getElementById("toast-container");
      if (!c) {
        c = document.createElement("div");
        c.id = "toast-container";
        c.className = "toast-container";
        document.body.appendChild(c);
      }
      return c;
    }

    function ensureBanner() {
      let b = document.getElementById("top-banner");
      if (!b) {
        b = document.createElement("div");
        b.id = "top-banner";
        b.className = "banner banner-info";
        b.style.display = "none";
        const close = document.createElement("button");
        close.className = "close";
        close.innerHTML = "&times;";
        close.addEventListener("click", () => { b.style.display = "none"; });
        const span = document.createElement("span");
        span.className = "msg";
        b.appendChild(span);
        b.appendChild(close);
        document.body.appendChild(b);
      }
      return b;
    }

    // ---------- Helpers ----------
    const ICONS = {
      success: "✔️",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    };

    const CLASS_BY_TYPE = {
      success: "success",
      info: "info",
      warn: "warn",
      error: "error",
    };

    function createToast(msg, type="info", autoDismiss=true) {
      const c = ensureToastContainer();
      const t = document.createElement("div");
      const cls = CLASS_BY_TYPE[type] || "info";
      t.className = `toast toast-${cls}`;

      const icon = document.createElement("div");
      icon.textContent = ICONS[type] || ICONS.info;
      const text = document.createElement("div");
      text.className = "msg";
      text.textContent = msg;
      const close = document.createElement("button");
      close.className = "close";
      close.innerHTML = "&times;";
      close.addEventListener("click", () => t.remove());

      t.appendChild(icon);
      t.appendChild(text);
      t.appendChild(close);
      c.appendChild(t);

      // Smart AutoDismiss: info/success auto-hide, warn/error stay
      if (autoDismiss && (type === "info" || type === "success")) {
        setTimeout(() => {
          try { t.remove(); } catch(_) {}
        }, 3000);
      }
      return t;
    }

    function showBanner(msg, type="info", autoDismiss=false) {
      const b = ensureBanner();
      const cls = CLASS_BY_TYPE[type] || "info";
      b.className = `banner banner-${cls}`;
      b.querySelector(".msg").textContent = `${ICONS[type] || ICONS.info} ${msg}`;
      b.style.display = "flex";
      if (autoDismiss && (type === "info" || type === "success")) {
        setTimeout(() => { b.style.display = "none"; }, 3000);
      }
      return b;
    }

    // ---------- Theme Sync ----------
    function syncTheme() {
      const isDark = document.documentElement.classList.contains("dark");
      document.getElementById("toast-container")?.style.setProperty("filter", isDark ? "brightness(0.95)" : "none");
      // Banner colors are defined; no extra needed
    }

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    syncTheme();

    // ---------- Sidebar helpers (non-intrusive) ----------
    function attachSidebarHelpers() {
      const sidebar = document.getElementById("sidebar");
      if (!sidebar) return;
      sidebar.classList.add("sidebar-animate");
      // Ensure default visible on desktop; mobile can toggle externally
      function setOpen(open) {
        sidebar.classList.toggle("sidebar-open", open);
        sidebar.classList.toggle("sidebar-closed", !open);
      }
      // Expose small API
      window.UIAlerts = window.UIAlerts || {};
      window.UIAlerts.setSidebarOpen = setOpen;
    }
    attachSidebarHelpers();

    // ---------- Public API (safe globals) ----------
    window.showToast = function (message, type="info", autoDismiss) {
      // default Smart AutoDismiss
      const shouldAuto = (autoDismiss !== undefined) ? autoDismiss : (type === "info" || type === "success");
      return createToast(String(message), type, shouldAuto);
    };
    window.showBanner = function (message, type="info", autoDismiss) {
      const shouldAuto = (autoDismiss !== undefined) ? autoDismiss : (type === "info" || type === "success");
      return showBanner(String(message), type, shouldAuto);
    };

    // Demo hooks (comment out in production if you like)
    // window.showToast("Welcome to Plasticology!", "success");
  } catch (e) {
    console.error("UI Smart Alerts block failed (non-fatal):", e);
  }
})();
