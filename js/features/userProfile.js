// js/features/userProfile.js (FINAL - CORS FIXED)

import { createJsonRequest, sendPostRequest } from '../api.js';
import { showScreen, showLoader, hideLoader, showToast } from '../ui.js';
import { setCurrentUser, getCurrentUser } from '../state.js';

// --- Login Handler ---
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
    showLoader('login-loader'); // تأكد أن هذا العنصر موجود في HTML الجديد
    if(loadingText) loadingText.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        // 1. طلب تسجيل الدخول
        const loginData = { eventType: 'login', username, password };
        const response = await sendPostRequest(loginData);

        if (response && response.success) {
            const user = response.user;
            setCurrentUser(user);
            localStorage.setItem('plastico_user', JSON.stringify(user));

            // 2. طلب بيانات المستخدم الكاملة (عشان نجيب الـ Score والـ Streak)
            await fetchUserData(user.UniqueID);

            // 3. تحديث الواجهة الجديدة بالكامل
            updateUserUI(user);

            // 4. الانتقال للداشبورد
            document.getElementById('login-container').classList.add('hidden');
            
            // إظهار العناصر الأساسية للتصميم الجديد
            document.getElementById('desktop-sidebar').classList.remove('hidden'); // إظهار القائمة الجانبية
            document.getElementById('desktop-sidebar').classList.add('flex');
            
            document.getElementById('main-menu-container').classList.remove('hidden'); // إظهار الداشبورد
            document.getElementById('global-header').classList.remove('hidden'); // إظهار الهيدر
            document.getElementById('global-header').classList.add('flex');

            // إظهار شريط الموبايل السفلي
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

// --- Fetch Full User Data (Score, Streak, etc.) ---
async function fetchUserData(userId) {
    try {
        // نستخدم request=getUserCardData لأنها خفيفة وترجع الـ Score
        const response = await createJsonRequest({ request: 'getUserCardData', userId: userId });
        if (response && response.success) {
            const updatedUser = { ...getCurrentUser(), ...response.cardData };
            setCurrentUser(updatedUser);
            localStorage.setItem('plastico_user', JSON.stringify(updatedUser));
            return updatedUser;
        }
    } catch (e) {
        console.warn("Could not fetch latest stats:", e);
    }
}

// --- THE FIX: Update ALL New UI Elements Safely ---
export function updateUserUI(user) {
    if (!user) return;

    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${user.Name}`;
    const userImg = user.User_Img || defaultAvatar;
    const firstName = user.Name.split(' ')[0];

    // 1. Update Sidebar (Desktop)
    safeUpdateText('sidebar-user-name', `Dr. ${firstName}`);
    safeUpdateSrc('sidebar-user-avatar', userImg);

    // 2. Update Dashboard (Welcome Card & Stats)
    safeUpdateText('dashboard-user-name', `Dr. ${firstName}`);
    safeUpdateText('dashboard-score', user.QuizScore || 0);
    
    // Streak Logic (Simulation for now, needs backend logic later)
    const streak = localStorage.getItem(`streak_${user.UniqueID}`) || 0;
    safeUpdateText('dashboard-streak', streak);
    
    // Exam Date Logic
    if (user.ExamDate) {
        const daysLeft = calculateDaysLeft(user.ExamDate);
        safeUpdateText('dashboard-exam-date', new Date(user.ExamDate).toLocaleDateString());
        safeUpdateText('dashboard-days-left', `${daysLeft} Days`);
    } else {
        safeUpdateText('dashboard-exam-date', 'Not Set');
        safeUpdateText('dashboard-days-left', '--');
    }

    // 3. Update Mobile Header
    safeUpdateSrc('header-user-avatar', userImg);
    safeUpdateText('streak-count', streak);

    // 4. Update User Card Modal (Hidden fields)
    safeUpdateText('card-user-name', user.Name);
    safeUpdateText('card-user-nickname', user.Nickname || 'Plastic Surgery Resident');
    safeUpdateSrc('user-avatar', userImg);
    safeUpdateText('card-quiz-score', user.QuizScore || 0);
    
    // Subscription Check
    if (user.SubscriptionEndDate) {
        const expiry = new Date(user.SubscriptionEndDate);
        const now = new Date();
        const isActive = expiry > now;
        safeUpdateText('card-subscription-expiry', isActive ? 'Active' : 'Expired');
        const statusEl = document.getElementById('card-subscription-expiry');
        if(statusEl) statusEl.className = isActive ? 'font-bold text-green-600' : 'font-bold text-red-600';
    }
}

// --- Helper Functions to prevent Crashes (The "Null" Fix) ---
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

// --- User Card Modal Logic ---
export function showUserCardModal() {
    const user = getCurrentUser();
    if (!user) return;

    updateUserUI(user); // Refresh data before showing
    
    const modal = document.getElementById('user-card-modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    if(modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        
        // Reset to details view
        const detailsView = document.getElementById('profile-details-view');
        const editView = document.getElementById('profile-edit-view');
        if(detailsView) detailsView.classList.remove('hidden');
        if(editView) editView.classList.add('hidden');
    }
}

export function hideUserCardModal() {
    const modal = document.getElementById('user-card-modal');
    const backdrop = document.getElementById('modal-backdrop');
    if(modal) modal.classList.add('hidden');
    if(backdrop) backdrop.classList.add('hidden');
}

// --- Messenger Logic (Simplified) ---
export function showMessenger() {
    const modal = document.getElementById('messenger-modal');
    const backdrop = document.getElementById('modal-backdrop');
    if(modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        loadMessages(); // Function to load messages (needs to be implemented or imported)
    }
}

// --- Event Listeners Setup ---
export function setupUserProfileEvents() {
    // Profile Buttons (Header & Sidebar) -> Show Modal
    const profileBtns = ['user-profile-header-btn', 'sidebar-profile-btn', 'mobile-profile-btn'];
    profileBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', showUserCardModal);
    });

    // Modal Close
    const closeBtn = document.getElementById('user-card-close-btn');
    if(closeBtn) closeBtn.addEventListener('click', hideUserCardModal);

    // Edit Profile Toggle
    const editBtn = document.getElementById('edit-profile-btn');
    if(editBtn) {
        editBtn.addEventListener('click', () => {
            document.getElementById('profile-details-view').classList.add('hidden');
            document.getElementById('profile-edit-view').classList.remove('hidden');
            // Pre-fill inputs
            const user = getCurrentUser();
            if(document.getElementById('edit-nickname')) document.getElementById('edit-nickname').value = user.Nickname || '';
            if(document.getElementById('edit-exam-date')) document.getElementById('edit-exam-date').value = user.ExamDate || '';
        });
    }

    // Cancel Edit
    const cancelBtn = document.getElementById('cancel-edit-profile-btn');
    if(cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('profile-edit-view').classList.add('hidden');
            document.getElementById('profile-details-view').classList.remove('hidden');
        });
    }

    // Messenger
    const messengerBtn = document.getElementById('messenger-btn');
    if(messengerBtn) messengerBtn.addEventListener('click', showMessenger);
    
    const closeMessengerBtn = document.getElementById('messenger-close-btn');
    if(closeMessengerBtn) closeMessengerBtn.addEventListener('click', () => {
        document.getElementById('messenger-modal').classList.add('hidden');
        document.getElementById('modal-backdrop').classList.add('hidden');
    });
}

// Placeholder for loadMessages if not imported
function loadMessages() {
    const list = document.getElementById('messages-list');
    if(list) list.innerHTML = '<p class="text-center text-gray-500 mt-4">No messages yet.</p>';
    // Actual implementation should fetch from API
}
