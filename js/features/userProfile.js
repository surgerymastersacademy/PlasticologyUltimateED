// js/features/userProfile.js (FINAL CORRECTED VERSION - SYNCS LECTURE LOGS)

import { API_URL, appState, AVATAR_BASE_URL, AVATAR_OPTIONS } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { fetchUserData } from '../api.js';
import { calculateDaysLeft } from '../utils.js';
import { showMainMenuScreen } from '../main.js';
import { saveUserProgress } from './lectures.js'; // Import saveUserProgress

/**
 * Handles the user login form submission.
 * @param {Event} event
 */
export async function handleLogin(event) {
    event.preventDefault();
    dom.loginError.classList.add('hidden');
    dom.loginSubmitBtn.disabled = true;
    dom.loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';

    const payload = {
        eventType: 'login',
        username: dom.usernameInput.value,
        password: dom.passwordInput.value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        const result = await response.json();

        if (result.success) {
            appState.currentUser = result.user;
            const userRoleData = appState.allRoles.find(role => role.Role === appState.currentUser.Role);
            appState.userRoles = userRoleData || {};

            ui.updateWatermark();
            await fetchUserData();

            // --- MODIFICATION START: Sync server logs with local state ---
            // 1. Load progress from localStorage first (for speed on the same device)
            loadUserProgress(); 
            
            // 2. Sync lecture views from server logs
            if (appState.fullActivityLog.length > 0) {
                const lectureLogs = appState.fullActivityLog.filter(log => log.eventType === 'ViewLecture');
                const lectureLinksMap = new Map();
                Object.values(appState.groupedLectures).forEach(chapter => {
                    chapter.topics.forEach(topic => {
                        lectureLinksMap.set(topic.name, topic.link);
                    });
                });

                lectureLogs.forEach(log => {
                    if (lectureLinksMap.has(log.title)) {
                        appState.viewedLectures.add(lectureLinksMap.get(log.title));
                    }
                });
                
                // 3. Save the combined progress back to localStorage
                saveUserProgress();
            }
            // --- MODIFICATION END ---

            await showUserCardModal(true);
            updateUserProfileHeader();
            showMainMenuScreen();
        } else {
            dom.loginError.textContent = result.message || "Invalid username or password.";
            dom.loginError.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Login API Error:", error);
        dom.loginError.textContent = "An error occurred. Please try again.";
        dom.loginError.classList.remove('hidden');
    } finally {
        dom.loginSubmitBtn.disabled = false;
        dom.loginSubmitBtn.textContent = 'Log In';
    }
}

/**
 * Handles user logout process.
 */
export function handleLogout() {
    ui.showConfirmationModal('Log Out?', 'Are you sure you want to log out?', () => {
        appState.currentUser = null;
        appState.navigationHistory = [];
        dom.usernameInput.value = '';
        dom.passwordInput.value = '';
        ui.showScreen(dom.loginContainer);
        dom.modalBackdrop.classList.add('hidden');
    });
}

/**
 * Checks if the current user has permission for a feature based on their role.
 * @param {string} feature - The name of the feature to check.
 * @returns {boolean} - True if access is granted, false otherwise.
 */
export function checkPermission(feature) {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') {
        ui.showConfirmationModal('Access Denied', 'Please log in to access this feature.', () => dom.modalBackdrop.classList.add('hidden'));
        return false;
    }
    if (!appState.userRoles || appState.userRoles[feature] === undefined || String(appState.userRoles[feature]).toLowerCase() !== 'true') {
        ui.showConfirmationModal('Access Denied', `Your current role does not have access to the "${feature}" feature.`, () => dom.modalBackdrop.classList.add('hidden'));
        return false;
    }
    return true;
}

/**
 * Applies UI changes based on the user's role permissions (e.g., disabling buttons).
 */
export function applyRolePermissions() {
    const role = appState.userRoles;
    if (!role) return;

    const featureElements = {
        'Lectures': dom.lecturesBtn,
        'MCQBank': dom.qbankBtn,
        'LerningMode': dom.learningModeBtn,
        'OSCEBank': dom.osceBtn,
        'LeadersBoard': dom.leaderboardBtn,
        'Radio': dom.radioBtn,
        'Library': dom.libraryBtn,
        'StudyPlanner': dom.studyPlannerBtn,
    };

    for (const feature in featureElements) {
        const element = featureElements[feature];
        if (element) {
            const hasAccess = String(role[feature]).toLowerCase() === 'true';
            element.disabled = !hasAccess;
            element.classList.toggle('disabled-feature', !hasAccess);
            element.title = hasAccess ? '' : `Access to ${feature} is not granted for your role.`;
        }
    }
}


// --- USER CARD ---

/**
 * Displays the user profile card modal and fetches the latest data.
 * @param {boolean} isLoginFlow - Flag to prevent closing other modals during login.
 */
export async function showUserCardModal(isLoginFlow = false) {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') {
        ui.showConfirmationModal('Access Denied', 'Please log in to access your profile card.', () => dom.modalBackdrop.classList.add('hidden'));
        return;
    }
    if (!isLoginFlow) {
        dom.modalBackdrop.classList.remove('hidden');
    }
    dom.userCardModal.classList.remove('hidden');
    dom.profileEditView.classList.add('hidden');
    dom.profileDetailsView.classList.remove('hidden');
    dom.profileEditError.classList.add('hidden');

    dom.cardUserName.textContent = appState.currentUser.Name;
    dom.userAvatar.src = AVATAR_BASE_URL + appState.currentUser.Name;

    try {
        const response = await fetch(`${API_URL}?request=getUserCardData&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Failed to fetch user card data.');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        appState.userCardData = data.cardData;
        renderUserCard(appState.userCardData);
        populateAvatarSelection();
    } catch (error) {
        console.error("Error loading user card data:", error);
        dom.profileEditError.textContent = `Error loading profile: ${error.message}`;
        dom.profileEditError.classList.remove('hidden');
    }
}

function renderUserCard(cardData) {
    if (!cardData) return;
    const displayName = cardData.Nickname && cardData.Nickname.trim() !== '' ? cardData.Nickname : appState.currentUser.Name;
    dom.cardUserName.textContent = displayName;
    dom.cardUserNickname.textContent = cardData.Nickname && cardData.Nickname.trim() !== '' ? `(${appState.currentUser.Name})` : '';
    dom.cardQuizScore.textContent = cardData.QuizScore !== undefined ? cardData.QuizScore : '0';
    dom.userAvatar.src = cardData.User_Img || (AVATAR_BASE_URL + appState.currentUser.Name);
    dom.headerUserAvatar.src = dom.userAvatar.src;

    if (cardData.ExamDate) {
        const examDate = new Date(cardData.ExamDate);
        if (!isNaN(examDate)) {
            dom.cardExamDate.textContent = examDate.toLocaleDateString('en-GB');
            const daysLeft = calculateDaysLeft(examDate);
            dom.cardDaysLeft.textContent = daysLeft >= 0 ? `${daysLeft} days left` : 'Exam passed';
        } else {
            dom.cardExamDate.textContent = 'Invalid Date';
            dom.cardDaysLeft.textContent = 'N/A';
        }
    } else {
        dom.cardExamDate.textContent = 'Not Set';
        dom.cardDaysLeft.textContent = 'N/A';
    }
}

export function toggleProfileEditMode(isEditing) {
    if (isEditing) {
        dom.profileDetailsView.classList.add('hidden');
        dom.profileEditView.classList.remove('hidden');
        dom.editNickname.value = appState.userCardData.Nickname || '';
        dom.editExamDate.value = appState.userCardData.ExamDate ? new Date(appState.userCardData.ExamDate).toISOString().split('T')[0] : '';
        dom.avatarSelectionGrid.querySelectorAll('img').forEach(img => {
            img.classList.remove('border-blue-500', 'border-2');
            if (img.src === dom.userAvatar.src) {
                img.classList.add('border-blue-500', 'border-2');
            }
        });
    } else {
        dom.profileDetailsView.classList.remove('hidden');
        dom.profileEditView.classList.add('hidden');
        dom.profileEditError.classList.add('hidden');
    }
}

function populateAvatarSelection() {
    dom.avatarSelectionGrid.innerHTML = '';
    AVATAR_OPTIONS.forEach(seed => {
        const img = document.createElement('img');
        img.src = AVATAR_BASE_URL + seed;
        img.alt = seed;
        img.className = 'w-12 h-12 rounded-full cursor-pointer hover:opacity-80 transition-opacity';
        if (dom.userAvatar.src === img.src) {
            img.classList.add('border-blue-500', 'border-2');
        }
        img.addEventListener('click', () => {
            dom.avatarSelectionGrid.querySelectorAll('img').forEach(i => i.classList.remove('border-blue-500', 'border-2'));
            img.classList.add('border-blue-500', 'border-2');
            dom.userAvatar.src = img.src;
        });
        dom.avatarSelectionGrid.appendChild(img);
    });
}

export async function handleSaveProfile() {
    dom.profileEditError.classList.add('hidden');
    const payload = {
        eventType: 'updateUserCardData',
        userId: appState.currentUser.UniqueID,
        nickname: dom.editNickname.value.trim(),
        examDate: dom.editExamDate.value,
        userImg: dom.userAvatar.src
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });
        appState.userCardData.Nickname = payload.nickname;
        appState.userCardData.ExamDate = payload.examDate;
        appState.userCardData.User_Img = payload.userImg;
        renderUserCard(appState.userCardData);
        updateUserProfileHeader();
        toggleProfileEditMode(false);
        ui.showConfirmationModal('Profile Updated', 'Your profile has been successfully updated!', () => { /* do nothing */ });

    } catch (error) {
        console.error("Error saving profile:", error);
        dom.profileEditError.textContent = `Failed to save profile. Please try again.`;
        dom.profileEditError.classList.remove('hidden');
    }
}

/**
 * Updates the user's name and avatar in the global header.
 */
export function updateUserProfileHeader() {
    if (appState.currentUser && appState.userCardData) {
        const displayName = appState.userCardData.Nickname && appState.userCardData.Nickname.trim() !== ''
            ? appState.userCardData.Nickname
            : appState.currentUser.Name;
        dom.userNameDisplay.textContent = displayName;
        dom.headerUserAvatar.src = appState.userCardData.User_Img || (AVATAR_BASE_URL + appState.currentUser.Name);
    } else if (appState.currentUser) {
        dom.userNameDisplay.textContent = appState.currentUser.Name;
        dom.headerUserAvatar.src = AVATAR_BASE_URL + appState.currentUser.Name;
    }
}

// --- MESSENGER ---

export async function showMessengerModal() {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') {
        ui.showConfirmationModal('Guest Mode', 'Please log in to use the messenger.', () => dom.modalBackdrop.classList.add('hidden'));
        return;
    }
    dom.modalBackdrop.classList.remove('hidden');
    dom.messengerModal.classList.remove('hidden');
    dom.messagesList.innerHTML = '<p class="text-center text-slate-500">Loading messages...</p>';
    dom.messengerError.classList.add('hidden');
    dom.messageInput.value = '';

    await fetchAndRenderMessages();
    if (appState.messengerPollInterval) clearInterval(appState.messengerPollInterval);
    appState.messengerPollInterval = setInterval(fetchAndRenderMessages, 10000);
}

async function fetchAndRenderMessages() {
    try {
        const response = await fetch(`${API_URL}?request=getMessages&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Failed to fetch messages.');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (JSON.stringify(appState.userMessages) !== JSON.stringify(data.messages)) {
            appState.userMessages = data.messages || [];
            renderMessages();
        }
    } catch (error) {
        console.error("Error loading messages:", error);
        dom.messengerError.textContent = `Error loading messages.`;
        dom.messengerError.classList.remove('hidden');
    }
}

function renderMessages() {
    dom.messagesList.innerHTML = '';
    if (appState.userMessages.length === 0) {
        dom.messagesList.innerHTML = `<p class="text-center text-slate-500">No messages yet.</p>`;
        return;
    }

    appState.userMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        const timestamp = new Date(msg.Timestamp).toLocaleString('en-GB');

        if (msg.UserMessage && String(msg.UserMessage).trim() !== '') {
            messageDiv.innerHTML += `<div class="flex justify-end mb-2"><div class="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]"><p class="text-sm">${msg.UserMessage}</p><p class="text-xs text-right opacity-80 mt-1">${timestamp} (You)</p></div></div>`;
        }
        if (msg.AdminReply && String(msg.AdminReply).trim() !== '') {
            messageDiv.innerHTML += `<div class="flex justify-start mb-2"><div class="bg-gray-200 text-slate-800 p-3 rounded-lg max-w-[80%]"><p class="text-sm">${msg.AdminReply}</p><p class="text-xs text-left opacity-80 mt-1">${timestamp} (Admin)</p></div></div>`;
        }
        dom.messagesList.appendChild(messageDiv);
    });
    dom.messagesList.scrollTop = dom.messagesList.scrollHeight;
}

export async function handleSendMessageBtn() {
    dom.messengerError.classList.add('hidden');
    const messageText = dom.messageInput.value.trim();

    if (!messageText) return;

    dom.sendMessageBtn.disabled = true;
    dom.sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const payload = {
        eventType: 'sendMessage',
        userId: appState.currentUser.UniqueID,
        userName: appState.currentUser.Name,
        message: messageText
    };

    try {
        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        await fetchAndRenderMessages();
        dom.messageInput.value = '';
    } catch (error) {
        console.error("Error sending message:", error);
        dom.messengerError.textContent = `Failed to send message.`;
        dom.messengerError.classList.remove('hidden');
    } finally {
        dom.sendMessageBtn.disabled = false;
        dom.sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

/**
 * Loads user progress (viewed lectures, bookmarks) from localStorage.
 */
export function loadUserProgress() {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
    const savedLectures = localStorage.getItem(`viewedLectures_${appState.currentUser.UniqueID}`);
    if (savedLectures) {
        appState.viewedLectures = new Set(JSON.parse(savedLectures));
    }
    const savedBookmarks = localStorage.getItem(`bookmarkedQuestions_${appState.currentUser.UniqueID}`);
    if (savedBookmarks) {
        appState.bookmarkedQuestions = new Set(JSON.parse(savedBookmarks));
    }
}
