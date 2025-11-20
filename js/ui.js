// js/ui.js (FINAL VERSION v3.1 - WITH SETTINGS LOGIC)

import { getAppSettings, updateAppSetting } from './state.js';

// =========================================
// 0. SETTINGS & THEME LOGIC (NEW)
// =========================================

export function initSettings() {
    const themeBtn = document.getElementById('toggle-theme-btn');
    const animBtn = document.getElementById('toggle-animation-btn');
    
    // 1. Load Saved Settings
    const settings = getAppSettings(); // Returns { theme: 'light', animationEnabled: true }
    applyTheme(settings.theme);
    applyAnimation(settings.animationEnabled);

    // 2. Theme Button Click
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = current === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            updateAppSetting('theme', newTheme);
        });
    }

    // 3. Animation Button Click
    if (animBtn) {
        animBtn.addEventListener('click', () => {
            const isOff = document.documentElement.classList.contains('animation-off');
            applyAnimation(isOff); // Toggle: If off, turn on.
            updateAppSetting('animationEnabled', isOff);
        });
    }
}

function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
    } else {
        html.classList.remove('dark');
        html.classList.add('light');
    }
}

function applyAnimation(enabled) {
    const html = document.documentElement;
    if (enabled) {
        html.classList.remove('animation-off');
        // Restart canvas if needed (Handled in login-animation.js via CSS check)
    } else {
        html.classList.add('animation-off');
    }
}

// =========================================
// 1. SCREEN NAVIGATION
// =========================================

export function showScreen(containerId) {
    const containers = document.querySelectorAll('[id$="-container"]');
    containers.forEach(el => {
        if (el.id !== 'main-menu-container' && el.id !== 'login-container' && el.id !== 'settings-container') {
            el.classList.add('hidden');
        }
    });

    if (containerId === 'login-container') {
        document.getElementById('login-container').classList.remove('hidden');
        document.getElementById('main-menu-container').classList.add('hidden');
        document.getElementById('global-header').classList.add('hidden');
        document.getElementById('desktop-sidebar').classList.remove('flex');
        document.getElementById('desktop-sidebar').classList.add('hidden');
        const mobileNav = document.getElementById('mobile-bottom-nav');
        if(mobileNav) mobileNav.classList.add('hidden');
    
    } else if (containerId === 'main-menu-container') { 
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('main-menu-container').classList.remove('hidden');
        document.getElementById('global-header').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.add('flex');
        const mobileNav = document.getElementById('mobile-bottom-nav');
        if(mobileNav) mobileNav.classList.remove('hidden');
        
        // Reset Nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const homeBtn = document.getElementById('nav-home-btn');
        if(homeBtn) homeBtn.classList.add('active');

    } else {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('main-menu-container').classList.add('hidden');
        
        const target = document.getElementById(containerId);
        if (target) target.classList.remove('hidden');
        
        document.getElementById('global-header').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.add('flex');
        const mobileNav = document.getElementById('mobile-bottom-nav');
        if(mobileNav) mobileNav.classList.remove('hidden');
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTo(0, 0);
}

// =========================================
// 2. LOADERS & TOASTS
// =========================================

export function showLoader(elementId = 'loader') {
    const loader = document.getElementById(elementId);
    if (loader) loader.classList.remove('hidden');
}

export function hideLoader(elementId = 'loader') {
    const loader = document.getElementById(elementId);
    if (loader) loader.classList.add('hidden');
}

export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-2 w-max max-w-xs md:max-w-sm';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    let bgClass = 'bg-slate-800';
    let icon = 'fa-info-circle';

    if (type === 'success') { bgClass = 'bg-green-600'; icon = 'fa-check-circle'; }
    else if (type === 'error') { bgClass = 'bg-red-600'; icon = 'fa-exclamation-circle'; }
    else if (type === 'warning') { bgClass = 'bg-yellow-600'; icon = 'fa-exclamation-triangle'; }

    toast.className = `${bgClass} text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-3 text-sm font-semibold animate-fadeIn transition-all duration-500`;
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

export function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
