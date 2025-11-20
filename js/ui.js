// js/ui.js (FINAL VERSION v3.1)

// =========================================
// 1. SCREEN NAVIGATION (Routing UI)
// =========================================

/**
 * Manages switching between different screens/containers.
 * Handles the visibility of the Dashboard, Sidebar, and Login screens.
 * @param {string} containerId - The ID of the container to show (e.g., 'qbank-container').
 */
export function showScreen(containerId) {
    // 1. Hide all main content containers
    const containers = document.querySelectorAll('[id$="-container"]');
    containers.forEach(el => {
        // Don't hide the main wrapper or overlays
        if (el.id !== 'main-menu-container' && el.id !== 'login-container' && el.id !== 'settings-container') {
            el.classList.add('hidden');
        }
    });

    // 2. Handle Special Screens
    if (containerId === 'login-container') {
        document.getElementById('login-container').classList.remove('hidden');
        document.getElementById('main-menu-container').classList.add('hidden');
        document.getElementById('global-header').classList.add('hidden');
        document.getElementById('desktop-sidebar').classList.remove('flex'); // Hide sidebar
        document.getElementById('desktop-sidebar').classList.add('hidden');
        const mobileNav = document.getElementById('mobile-bottom-nav');
        if(mobileNav) mobileNav.classList.add('hidden');
    
    } else if (containerId === 'main-menu-container') { // Dashboard / Home
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('main-menu-container').classList.remove('hidden');
        document.getElementById('global-header').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.add('flex'); // Show Sidebar
        const mobileNav = document.getElementById('mobile-bottom-nav');
        if(mobileNav) mobileNav.classList.remove('hidden');

        // Reset Nav Active State (Mobile)
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const homeBtn = document.getElementById('nav-home-btn');
        if(homeBtn) homeBtn.classList.add('active');

    } else { // Inner Content Screens (Lectures, Quiz, etc.)
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('main-menu-container').classList.add('hidden'); // Hide Dashboard
        
        // Show the specific target container
        const target = document.getElementById(containerId);
        if (target) target.classList.remove('hidden');
        
        // Ensure Navigation Bars are visible
        document.getElementById('global-header').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.remove('hidden');
        document.getElementById('desktop-sidebar').classList.add('flex');
        const mobileNav = document.getElementById('mobile-bottom-nav');
        if(mobileNav) mobileNav.classList.remove('hidden');
    }

    // Scroll to top
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTo(0, 0);
}

// =========================================
// 2. LOADERS & SPINNERS
// =========================================

export function showLoader(elementId = 'loader') {
    const loader = document.getElementById(elementId);
    if (loader) loader.classList.remove('hidden');
}

export function hideLoader(elementId = 'loader') {
    const loader = document.getElementById(elementId);
    if (loader) loader.classList.add('hidden');
}

// =========================================
// 3. TOAST NOTIFICATIONS (Popups)
// =========================================

/**
 * Shows a floating toast notification.
 * @param {string} message - The text to display.
 * @param {string} type - 'success', 'error', 'info', 'warning'.
 */
export function showToast(message, type = 'info') {
    // Create container if missing
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-2 w-max max-w-xs md:max-w-sm';
        document.body.appendChild(container);
    }

    // Create Toast Element
    const toast = document.createElement('div');
    
    let bgClass = 'bg-slate-800';
    let icon = 'fa-info-circle';

    if (type === 'success') { bgClass = 'bg-green-600'; icon = 'fa-check-circle'; }
    else if (type === 'error') { bgClass = 'bg-red-600'; icon = 'fa-exclamation-circle'; }
    else if (type === 'warning') { bgClass = 'bg-yellow-600'; icon = 'fa-exclamation-triangle'; }

    toast.className = `${bgClass} text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-3 text-sm font-semibold animate-fadeIn transition-all duration-500`;
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;

    // Add to container
    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]'); // Exit animation
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// =========================================
// 4. HELPER UTILITIES
// =========================================

export function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

export function toggleElement(id, show) {
    const el = document.getElementById(id);
    if (el) {
        if (show) el.classList.remove('hidden');
        else el.classList.add('hidden');
    }
}
