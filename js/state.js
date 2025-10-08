// ===================================================
// Plasticology Ultimate Edition
// File: js/state.js
// Version: v1.1.6 — 2025-10-08
// Description: Centralized state management with API config, theme, and safety flags.
// ===================================================

// ===== App State =====
export const appState = {
  user: null,
  allRoles: [],
  settings: {},
  flags: {
    isOnline: navigator.onLine,
    isDarkMode: false,
    hasError: false,
  },
  startTime: new Date().toISOString(),
  fullActivityLog: [],
  userQuizNotes: [],
  userLectureNotes: [],
  userTheoryLogs: [],
  answeredQuestions: new Set()
};

// ===== Default Quiz Configuration =====
export const DEFAULT_TIME_PER_QUESTION = 60; // seconds per question

// ===== API URL Configuration =====
export const API_URL = (() => {
  try {
    const localOverride = localStorage.getItem("API_URL_OVERRIDE");
    if (localOverride) {
      console.log("%cUsing local API override", "color:#eab308;");
      return localOverride;
    }

    // ✅ Official Plasticology API URL
    return "https://script.google.com/macros/s/AKfycbzx8gRgbYZw8Rrg348q2dlsRd7yQ9IXUNUPBDUf-Q5Wb9LntLuKY-ozmnbZOOuQsDU_3w/exec";
  } catch (err) {
    console.warn("Failed to resolve API_URL:", err);
    return "";
  }
})();

// ===== Theme Initialization =====
export function initTheme() {
  try {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");

    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    appState.flags.isDarkMode = theme === "dark";

    console.log("%cTheme initialized:", "color:#3b82f6;", theme);
  } catch (err) {
    console.error("Theme init failed:", err);
    appState.flags.hasError = true;
  }
}

// ===== App State Initialization =====
export function initAppState() {
  try {
    console.log("%cInitializing App State...", "color:#06b6d4;");
    initTheme();

    window.addEventListener("online", () => (appState.flags.isOnline = true));
    window.addEventListener("offline", () => (appState.flags.isOnline = false));
  } catch (err) {
    console.error("Error initializing app state:", err);
    appState.flags.hasError = true;
  }
}

// ===== Session Management =====
export function saveSession(userData) {
  try {
    localStorage.setItem("userData", JSON.stringify(userData));
    appState.user = userData;
    console.log("%cUser session saved", "color:#16a34a;");
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

export function loadUserData() {
  try {
    const data = localStorage.getItem("userData");
    if (data) {
      appState.user = JSON.parse(data);
      console.log("%cLoaded user data from session", "color:#16a34a;");
      return appState.user;
    }
    return null;
  } catch (err) {
    console.error("Failed to load user data:", err);
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem("userData");
    console.log("%cSession cleared", "color:#f97316;");
    appState.user = null;
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}

// ===== Export for debugging =====
window.appState = appState;
