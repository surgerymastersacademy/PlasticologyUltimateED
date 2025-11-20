// js/state.js (FINAL VERSION v3.1)

// 1. Internal State Variables
let currentUser = null;
let currentQuiz = null;
let appSettings = {
    theme: 'light',
    animationEnabled: true
};

// =========================================
// USER STATE MANAGEMENT
// =========================================

/**
 * Sets the current active user in memory.
 * @param {Object} user - The user object returned from API.
 */
export function setCurrentUser(user) {
    currentUser = user;
    // We don't save to localStorage here to keep this function pure.
    // localStorage handling is done in userProfile.js logic usually, 
    // but getCurrentUser below handles the retrieval fallback.
}

/**
 * Gets the current user. 
 * Auto-restores from localStorage if memory is empty (e.g., after refresh).
 * @returns {Object|null} The user object or null if not logged in.
 */
export function getCurrentUser() {
    // 1. Return from memory if available
    if (currentUser) {
        return currentUser;
    }

    // 2. Fallback: Try to restore from localStorage
    const storedUser = localStorage.getItem('plastico_user');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            return currentUser;
        } catch (e) {
            console.error("Error parsing stored user:", e);
            // If corrupted, clear it
            localStorage.removeItem('plastico_user');
            return null;
        }
    }

    return null;
}

/**
 * Checks if a user is currently logged in.
 * @returns {boolean}
 */
export function isAuthenticated() {
    return !!getCurrentUser();
}

/**
 * Clears user state (Logout).
 */
export function clearUserState() {
    currentUser = null;
    localStorage.removeItem('plastico_user');
    // Optional: Clear streak or other session-specific items if needed
    // localStorage.removeItem('plastico_content_v3'); // Usually we keep content cache
}

// =========================================
// QUIZ STATE MANAGEMENT
// =========================================

export function setCurrentQuiz(quiz) {
    currentQuiz = quiz;
}

export function getCurrentQuiz() {
    return currentQuiz;
}

// =========================================
// APP SETTINGS (Theme/Animation)
// =========================================

export function getAppSettings() {
    // Try to load from local storage first
    const storedSettings = localStorage.getItem('plastico_settings');
    if (storedSettings) {
        appSettings = { ...appSettings, ...JSON.parse(storedSettings) };
    }
    return appSettings;
}

export function updateAppSetting(key, value) {
    appSettings[key] = value;
    localStorage.setItem('plastico_settings', JSON.stringify(appSettings));
}
