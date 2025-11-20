import { createJsonRequest, sendPostRequest } from '../api.js';
import { showScreen, showLoader, hideLoader, showToast } from '../ui.js';
import { setCurrentUser, getCurrentUser } from '../state.js';

// =========================================
// 1. LOGIN & AUTHENTICATION
// =========================================

export async function handleLogin(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('login-error');
    const loadingText = document.getElementById('login-loading-text');
    const submitBtn = document.getElementById('login-submit-btn');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }

    // UI Loading State
    errorMsg.classList.add('hidden');
    showLoader('login-loader');
    if(loadingText) loadingText.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        const loginData = { eventType: 'login', username, password };
        const response = await sendPostRequest(loginData);

        if (response && response.success) {
            const user = response.user;
            setCurrentUser(user);
            localStorage.setItem('plastico_user', JSON.stringify(user));

            // Fetch extra stats (Score/Streak)
            await fetchUserData(user.UniqueID);

            // Update UI
            updateUserUI(user);

            // Switch Screens
            document.getElementById('login-container').classList.add('hidden');
            
            // Show New UI Elements
            document.getElementById('desktop-sidebar').classList.remove('hidden');
            document.getElementById('desktop-sidebar').classList.add('flex');
            document.getElementById('main-menu-container').classList.remove('hidden');
            document.getElementById('global-header').classList.remove('hidden');
            document.getElementById('global-header').classList.add('flex');
            const mobileNav = document.getElementById('mobile-bottom-nav');
            if(mobileNav) mobileNav.classList.remove('hidden');

            showToast(`Welcome back, Dr. ${user.Name.split(' ')[0]}! 👋`, 'success');

        } else {
            throw new Error(response ? response.message : 'Login failed');
        }
    } catch (error) {
        console.error('Login Error:', error);
        errorMsg.textContent = error.message || 'Invalid username or password.';
        errorMsg.classList.remove('hidden');
        showToast(error.message || 'Login Failed', 'error');
    } finally {
        hideLoader('login-loader');
        if(loadingText) loadingText.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

async function fetchUserData(userId) {
    try {
        const response = await createJsonRequest({ request: 'getUserCardData', userId: userId });
        if (response && response.success) {
            const currentUser = getCurrentUser();
            const updatedUser = { ...currentUser, ...response.cardData };
            setCurrentUser(updatedUser);
            localStorage.setItem('plastico_user', JSON.stringify(updatedUser));
            return updatedUser; // Return for immediate use
        }
    } catch (e) {
        console.warn("Could not fetch latest stats:", e);
    }
}

// =========================================
// 2. UI UPDATES (Safe & Comprehensive)
// =========================================

export function updateUserUI(user) {
    if (!user) return;

    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${user.Name}`;
    const userImg = user.User_Img || defaultAvatar;
    const firstName = user.Name.split(' ')[0];

    // Sidebar (Desktop)
    safeUpdateText('sidebar-user-name', `Dr. ${firstName}`);
    safeUpdateSrc('sidebar-user-avatar', userImg);

    // Dashboard
    safeUpdateText('dashboard-user-name', `Dr. ${firstName}`);
    safeUpdateText('dashboard-score', user.QuizScore || 0);
    
    // Streak
    const streak = localStorage.getItem(`streak_${user.UniqueID}`) || 0;
    safeUpdateText('dashboard-streak', streak);
    
    // Exam Date
    if (user.ExamDate) {
        const daysLeft = calculateDaysLeft(user.ExamDate);
        safeUpdateText('dashboard-exam-date', new Date(user.ExamDate).toLocaleDateString());
        safeUpdateText('dashboard-days-left', `${daysLeft} Days`);
    } else {
        safeUpdateText('dashboard-exam-date', 'Not Set');
        safeUpdateText('dashboard-days-left', '--');
    }

    // Header (Mobile)
    safeUpdateSrc('header-user-avatar', userImg);
    safeUpdateText('streak-count', streak);

    // Modal (Hidden Fields)
    safeUpdateText('card-user-name', user.Name);
    safeUpdateText('card-user-nickname', user.Nickname || 'Plastic Surgery Resident');
    safeUpdateSrc('user-avatar', userImg);
    safeUpdateText('card-quiz-score', user.QuizScore || 0);
    safeUpdateText('card-exam-date', user.ExamDate || 'Not Set');
    
    if (user.SubscriptionEndDate) {
        const expiry = new Date(user.SubscriptionEndDate);
        const now = new Date();
        const isActive = expiry > now;
        safeUpdateText('card-subscription-expiry', isActive ? 'Active' : 'Expired');
        const statusEl = document.getElementById('card-subscription-expiry');
        if(statusEl) statusEl.className = isActive ? 'font-bold text-green-600' : 'font-bold text-red-600';
    }
}

// =========================================
// 3. MESSENGER LOGIC (Restored)
// =========================================

export function showMessenger() {
    const modal = document.getElementById('messenger-modal');
    const backdrop = document.getElementById('modal-backdrop');
    if(modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        loadMessages(); 
    }
}

async function loadMessages() {
    const list = document.getElementById('messages-list');
    const user = getCurrentUser();
    if (!list || !user) return;

    list.innerHTML = '<p class="text-center text-slate-500 mt-4">Loading messages...</p>';

    try {
        const response = await createJsonRequest({ request: 'getMessages', userId: user.UniqueID });
        list.innerHTML = ''; // Clear loader

        if (response.success && response.messages && response.messages.length > 0) {
            response.messages.forEach(msg => {
                // User Message
                if (msg.UserMessage) {
                    const userMsgDiv = document.createElement('div');
                    userMsgDiv.className = 'flex justify-end mb-2';
                    userMsgDiv.innerHTML = `<div class="bg-blue-600 text-white p-2 rounded-lg max-w-[80%] text-sm">${msg.UserMessage}</div>`;
                    list.appendChild(userMsgDiv);
                }
                // Admin Reply
                if (msg.AdminReply) {
                    const adminMsgDiv = document.createElement('div');
                    adminMsgDiv.className = 'flex justify-start mb-2';
                    adminMsgDiv.innerHTML = `<div class="bg-gray-200 text-slate-800 p-2 rounded-lg max-w-[80%] text-sm border border-gray-300"><strong>Admin:</strong> ${msg.AdminReply}</div>`;
                    list.appendChild(adminMsgDiv);
                }
            });
            // Scroll to bottom
            list.scrollTop = list.scrollHeight;
        } else {
            list.innerHTML = '<p class="text-center text-slate-400 text-sm mt-4">No messages yet. Ask us anything!</p>';
        }
    } catch (error) {
        console.error("Error loading messages:", error);
        list.innerHTML = '<p class="text-center text-red-500 text-sm">Failed to load messages.</p>';
    }
}

async function handleSendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    const user = getCurrentUser();

    if (!message || !user) return;

    // Optimistic UI Update (Show message immediately)
    const list = document.getElementById('messages-list');
    const tempDiv = document.createElement('div');
    tempDiv.className = 'flex justify-end mb-2 opacity-50';
    tempDiv.innerHTML = `<div class="bg-blue-600 text-white p-2 rounded-lg max-w-[80%] text-sm">${message}</div>`;
    list.appendChild(tempDiv);
    list.scrollTop = list.scrollHeight;
    input.value = '';

    try {
        const response = await sendPostRequest({
            eventType: 'sendMessage',
            userId: user.UniqueID,
            userName: user.Name,
            message: message
        });

        if (response.success) {
            tempDiv.classList.remove('opacity-50'); // Confirm sent
            showToast('Message sent', 'success');
        } else {
            tempDiv.remove(); // Remove if failed
            showToast('Failed to send message', 'error');
        }
    } catch (error) {
        console.error("Send message error:", error);
        tempDiv.remove();
        showToast('Error sending message', 'error');
    }
}

// =========================================
// 4. EDIT PROFILE LOGIC (Restored)
// =========================================

function generateAvatarGrid() {
    const grid = document.getElementById('avatar-selection-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const user = getCurrentUser();
    const seeds = ['Felix', 'Aneka', 'Bob', 'Cale', 'Dr', 'Surgeon', 'Plastic', 'Bot', 'User1', 'User2'];
    
    seeds.forEach(seed => {
        const url = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
        const img = document.createElement('img');
        img.src = url;
        img.className = `w-12 h-12 rounded-full cursor-pointer border-2 hover:scale-110 transition ${user.User_Img === url ? 'border-blue-600' : 'border-transparent'}`;
        
        img.addEventListener('click', () => {
            // Remove selected class from others
            Array.from(grid.children).forEach(c => c.classList.remove('border-blue-600'));
            img.classList.add('border-blue-600');
            // Store temp selection
            grid.dataset.selectedAvatar = url;
        });
        
        grid.appendChild(img);
    });
}

async function handleSaveProfile() {
    const nickname = document.getElementById('edit-nickname').value;
    const examDate = document.getElementById('edit-exam-date').value;
    const grid = document.getElementById('avatar-selection-grid');
    const selectedAvatar = grid.dataset.selectedAvatar;
    const user = getCurrentUser();

    if (!user) return;

    const btn = document.getElementById('save-profile-btn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const updateData = {
            eventType: 'updateUserCardData',
            userId: user.UniqueID,
            nickname: nickname,
            examDate: examDate
        };
        if (selectedAvatar) updateData.userImg = selectedAvatar;

        const response = await sendPostRequest(updateData);

        if (response.success) {
            // Update local state
            user.Nickname = nickname;
            user.ExamDate = examDate;
            if (selectedAvatar) user.User_Img = selectedAvatar;
            
            setCurrentUser(user);
            localStorage.setItem('plastico_user', JSON.stringify(user));
            
            // Update UI
            updateUserUI(user);
            showToast('Profile Updated Successfully!', 'success');
            
            // Return to view mode
            document.getElementById('profile-edit-view').classList.add('hidden');
            document.getElementById('profile-details-view').classList.remove('hidden');
        } else {
            showToast(response.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error("Profile update error:", error);
        showToast('Error updating profile', 'error');
    } finally {
        btn.textContent = 'Save';
        btn.disabled = false;
    }
}

// =========================================
// 5. HELPERS & EVENT LISTENERS
// =========================================

function safeUpdateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function safeUpdateSrc(id, src) {
    const el = document.getElementById(id);
    if (el) el.src = src;
}

function calculateDaysLeft(dateString) {
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0;
}

export function showUserCardModal() {
    const user = getCurrentUser();
    if (!user) return;
    updateUserUI(user);
    
    const modal = document.getElementById('user-card-modal');
    const backdrop = document.getElementById('modal-backdrop');
    if(modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        
        // Reset View
        document.getElementById('profile-details-view').classList.remove('hidden');
        document.getElementById('profile-edit-view').classList.add('hidden');
    }
}

export function hideUserCardModal() {
    document.getElementById('user-card-modal').classList.add('hidden');
    document.getElementById('modal-backdrop').classList.add('hidden');
}

// MAIN SETUP FUNCTION
export function setupUserProfileEvents() {
    // Show Profile Events
    ['user-profile-header-btn', 'sidebar-profile-btn', 'mobile-profile-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', showUserCardModal);
    });

    // Close Profile
    const closeBtn = document.getElementById('user-card-close-btn');
    if(closeBtn) closeBtn.addEventListener('click', hideUserCardModal);

    // Edit Profile Toggle
    const editBtn = document.getElementById('edit-profile-btn');
    if(editBtn) {
        editBtn.addEventListener('click', () => {
            document.getElementById('profile-details-view').classList.add('hidden');
            document.getElementById('profile-edit-view').classList.remove('hidden');
            
            const user = getCurrentUser();
            if(document.getElementById('edit-nickname')) document.getElementById('edit-nickname').value = user.Nickname || '';
            if(document.getElementById('edit-exam-date')) document.getElementById('edit-exam-date').value = user.ExamDate || '';
            generateAvatarGrid(); // Init avatars
        });
    }

    // Save Profile
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if(saveProfileBtn) saveProfileBtn.addEventListener('click', handleSaveProfile);

    // Cancel Edit
    const cancelBtn = document.getElementById('cancel-edit-profile-btn');
    if(cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('profile-edit-view').classList.add('hidden');
            document.getElementById('profile-details-view').classList.remove('hidden');
        });
    }

    // Messenger Events
    const messengerBtn = document.getElementById('messenger-btn');
    if(messengerBtn) messengerBtn.addEventListener('click', showMessenger);
    
    const closeMessengerBtn = document.getElementById('messenger-close-btn');
    if(closeMessengerBtn) closeMessengerBtn.addEventListener('click', () => {
        document.getElementById('messenger-modal').classList.add('hidden');
        document.getElementById('modal-backdrop').classList.add('hidden');
    });

    const sendMsgBtn = document.getElementById('send-message-btn');
    if(sendMsgBtn) sendMsgBtn.addEventListener('click', handleSendMessage);
}
