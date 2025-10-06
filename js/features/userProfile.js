// V.2.1 - 2025-10-06
// js/features/userProfile.js

import { appState, API_URL, AVATAR_BASE_URL, AVATAR_OPTIONS } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { fetchUserData } from '../api.js';
import { calculateDaysLeft } from '../utils.js';
import { showMainMenuScreen } from '../main.js';

let originalCardData = null;

export async function handleLogin(event) {
    event.preventDefault();
    dom.loginError.classList.add('hidden');
    dom.loginSubmitBtn.disabled = true;
    dom.loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const username = dom.usernameInput.value;
    const password = dom.passwordInput.value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ eventType: 'login', username, password }),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error('Network error. Please try again.');
        }

        const result = await response.json();

        if (result.success) {
            appState.currentUser = result.user;
            await loadUserProgress();
            showMainMenuScreen();
            updateUserProfileHeader();
            ui.updateWatermark();
        } else {
            throw new Error(result.message || 'Invalid credentials.');
        }

    } catch (error) {
        console.error("Login API Error:", error);
        dom.loginError.textContent = error.message;
        dom.loginError.classList.remove('hidden');
    } finally {
        dom.loginSubmitBtn.disabled = false;
        dom.loginSubmitBtn.innerHTML = 'Log In';
    }
}

export function handleLogout() {
    ui.showConfirmationModal('Logout', 'Are you sure you want to log out?', () => {
        // Correctly reset the state for logout
        Object.keys(appState).forEach(key => {
            if (['allQuestions', 'allRoles', 'allAnnouncements', 'allFreeTestQuestions', 'mcqBooks', 'allChaptersNames', 'allOsceCases', 'allOsceQuestions', 'allTheoryQuestions'].includes(key)) return;
            
            if (appState[key] instanceof Set) {
                appState[key].clear();
            } else if (Array.isArray(appState[key])) {
                appState[key] = [];
            } else if (typeof appState[key] === 'object' && appState[key] !== null) {
                // Resetting nested state objects to null or their default structure
                if (key.startsWith('current')) {
                    appState[key] = null;
                }
            }
        });
        appState.currentUser = null;
        localStorage.clear();
        window.location.reload();
    });
}


export async function loadUserProgress() {
    await fetchUserData();
    const bookmarks = localStorage.getItem('bookmarkedQuestions');
    if (bookmarks) {
        appState.bookmarkedQuestions = new Set(JSON.parse(bookmarks));
    } else {
        appState.bookmarkedQuestions = new Set();
    }
}


export function updateUserProfileHeader() {
    if (!appState.currentUser) return;
    dom.userNameDisplay.textContent = appState.currentUser.Name;
    const avatarUrl = appState.userCardData?.User_Img || `${AVATAR_BASE_URL}${appState.currentUser.Name}`;
    dom.headerUserAvatar.src = avatarUrl;
}

export function applyRolePermissions() {
    // This function can be expanded to hide/show buttons based on role
    // For now, specific checks are done in the event listeners
}

export function checkPermission(feature) {
    if (!appState.currentUser) return false;
    const userRole = appState.allRoles.find(r => r.Role === appState.currentUser.Role);
    if (!userRole || String(userRole[feature]).toUpperCase() !== 'TRUE') {
        alert(`You do not have permission to access '${feature}'. Please contact support to upgrade your subscription.`);
        return false;
    }
    return true;
}

export async function showUserCardModal() {
    dom.cardUserName.textContent = appState.currentUser.Name;
    dom.cardSubscriptionStatus.textContent = appState.currentUser.Role;
    
    const expiryDateStr = appState.currentUser.SubscriptionEndDate;
    if (expiryDateStr) {
        const expiryDate = new Date(expiryDateStr);
        dom.cardSubscriptionExpiry.textContent = expiryDate.toLocaleDateString('en-GB');
        const daysLeft = calculateDaysLeft(expiryDateStr);
        if (daysLeft !== null) {
            dom.cardDaysLeft.textContent = daysLeft >= 0 ? `${daysLeft} days` : 'Expired';
            dom.cardDaysLeft.className = daysLeft > 7 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
        } else {
            dom.cardDaysLeft.textContent = 'N/A';
        }
    } else {
        dom.cardSubscriptionExpiry.textContent = 'N/A';
        dom.cardDaysLeft.textContent = 'N/A';
    }

    try {
        const response = await fetch(`${API_URL}?request=getUserCardData&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        originalCardData = data.cardData;
        appState.userCardData = data.cardData;

        dom.cardUserNickname.textContent = originalCardData.Nickname || '';
        dom.cardQuizScore.textContent = originalCardData.QuizScore || '0';
        
        const examDateStr = originalCardData.ExamDate;
        if (examDateStr) {
            dom.cardExamDate.textContent = new Date(examDateStr).toLocaleDateString('en-GB');
        } else {
            dom.cardExamDate.textContent = 'Not Set';
        }

        const avatarUrl = originalCardData.User_Img || `${AVATAR_BASE_URL}${appState.currentUser.Name}`;
        dom.userAvatar.src = avatarUrl;
        dom.headerUserAvatar.src = avatarUrl;

    } catch (error) {
        console.error("Failed to load user card data:", error);
    }
    
    toggleProfileEditMode(false);
    dom.modalBackdrop.classList.remove('hidden');
    dom.userCardModal.classList.remove('hidden');
}


export function toggleProfileEditMode(isEdit) {
    dom.profileDetailsView.classList.toggle('hidden', isEdit);
    dom.profileEditView.classList.toggle('hidden', !isEdit);
    dom.profileEditError.classList.add('hidden');

    if (isEdit) {
        dom.editNickname.value = originalCardData.Nickname || '';
        dom.editExamDate.value = originalCardData.ExamDate ? new Date(originalCardData.ExamDate).toISOString().split('T')[0] : '';
        
        dom.avatarSelectionGrid.innerHTML = AVATAR_OPTIONS.map(seed => `
            <img src="${AVATAR_BASE_URL}${seed}" alt="${seed}" data-seed="${seed}" class="w-12 h-12 rounded-full border-2 border-transparent hover:border-blue-500 cursor-pointer">
        `).join('');
    }
}

export async function handleSaveProfile() {
    const newNickname = dom.editNickname.value;
    const newExamDate = dom.editExamDate.value;
    const newAvatarImg = document.querySelector('#avatar-selection-grid img.selected');
    const newAvatarUrl = newAvatarImg ? newAvatarImg.src : (originalCardData.User_Img || '');

    const payload = {
        eventType: 'updateUserCardData',
        userId: appState.currentUser.UniqueID,
        nickname: newNickname,
        examDate: newExamDate,
        userImg: newAvatarUrl
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.error || !result.success) throw new Error(result.error || 'Failed to save.');
        
        await showUserCardModal();
        toggleProfileEditMode(false);

    } catch (error) {
        dom.profileEditError.textContent = error.message;
        dom.profileEditError.classList.remove('hidden');
    }
}

export async function showMessengerModal() {
    dom.modalBackdrop.classList.remove('hidden');
    dom.messengerModal.classList.remove('hidden');
    
    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_URL}?request=getMessages&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            dom.messagesList.innerHTML = data.messages.map(msg => `
                <div class="mb-2 ${msg.AdminReply ? 'text-left' : 'text-right'}">
                    <div class="inline-block p-2 rounded-lg ${msg.AdminReply ? 'bg-slate-200' : 'bg-blue-500 text-white'}">
                        ${msg.UserMessage || msg.AdminReply}
                    </div>
                    <div class="text-xs text-slate-400 mt-1">${new Date(msg.Timestamp).toLocaleString()}</div>
                </div>
            `).join('');
            dom.messagesList.scrollTop = dom.messagesList.scrollHeight;
        } catch (error) {
            dom.messagesList.innerHTML = `<p class="text-center text-red-500">Failed to load messages.</p>`;
        }
    };
    
    await fetchMessages();
    appState.messengerPollInterval = setInterval(fetchMessages, 30000);
}


export async function handleSendMessageBtn() {
    const message = dom.messageInput.value.trim();
    if (!message) return;
    
    const payload = {
        eventType: 'sendMessage',
        userId: appState.currentUser.UniqueID,
        userName: appState.currentUser.Name,
        message: message
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        
        dom.messageInput.value = '';
        const newMessageEl = document.createElement('div');
        newMessageEl.className = 'mb-2 text-right';
        newMessageEl.innerHTML = `
            <div class="inline-block p-2 rounded-lg bg-blue-500 text-white">${message}</div>
            <div class="text-xs text-slate-400 mt-1">Sending...</div>
        `;
        dom.messagesList.appendChild(newMessageEl);
        dom.messagesList.scrollTop = dom.messagesList.scrollHeight;

    } catch (error) {
        dom.messengerError.textContent = error.message;
        dom.messengerError.classList.remove('hidden');
    }
}

document.addEventListener('click', e => {
    if (e.target.matches('#avatar-selection-grid img')) {
        document.querySelectorAll('#avatar-selection-grid img').forEach(img => img.classList.remove('selected', 'border-blue-500'));
        e.target.classList.add('selected', 'border-blue-500');
    }
});
