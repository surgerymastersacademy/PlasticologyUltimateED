// ===================================================
// Plasticology Ultimate Edition
// File: js/state.js
// Version: v1.2.0 — 2025-10-08
// Description: Centralized state & config (FULL RESTORED STYLE) with quiz defaults & API URL.
// Notes:
//  • Append-only merge: no removals of prior fields; legacy names preserved when possible.
//  • Exposes constants used by quiz.js (SIMULATION_Q_COUNT, DEFAULT_TIME_PER_QUESTION).
//  • Provides custom-mode helper for default random question count.
// ===================================================

// ===== Legacy-compatible Global App State =====
export const appState = {
  // --- identity/session ---
  user: null,                  // legacy
  currentUser: null,           // some modules refer to currentUser
  token: null,
  startTime: new Date().toISOString(),

  // --- roles & permissions ---
  roles: [],
  allRoles: [],
  permissions: {},

  // --- ui/settings/flags ---
  settings: {},
  flags: {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isDarkMode: false,
    hasError: false,
    initialized: false,
  },

  // --- caches (kept for compatibility with older modules) ---
  cache: {
    content: null,           // questions, lectures, books, announcements, roles...
    userData: null,          // logs, notes, answeredQuestions, theoryLogs
    roles: null,
    lastFetchedAt: null,
  },

  // --- runtime collections used by api.js & features ---
  fullActivityLog: [],
  userQuizNotes: [],
  userLectureNotes: [],
  userTheoryLogs: [],
  answeredQuestions: new Set(),

  // --- quiz runtime (referenced by api.js when finishing quiz) ---
  currentQuiz: {
    originalQuestions: [],
    originalUserAnswers: [],
    meta: {}
  }
};

// Keep a global reference for debugging (legacy behavior)
if (typeof window !== "undefined") {
  window.appState = appState;
}

// ===== Quiz Defaults & Helpers =====
// • Per Dr. Bishoy: Exam simulator = 100 questions
// • Default timer per question = 45 seconds
// • Custom mode default = 10 random if user leaves input empty
export const SIMULATION_Q_COUNT = 100;
export const DEFAULT_TIME_PER_QUESTION = 45;
export const CUSTOM_MODE_DEFAULT_Q_COUNT = 10;

/**
 * Returns the intended question count for custom exams.
 * If user input is empty/invalid, falls back to 10.
 */
export function getCustomQuestionCount(userInput) {
  const parsed = parseInt(userInput, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn("[Custom Exam] Empty/invalid count → using default:", CUSTOM_MODE_DEFAULT_Q_COUNT);
    return CUSTOM_MODE_DEFAULT_Q_COUNT;
    }
  return parsed;
}

// ===== API URL Configuration =====
// Uses local override if present to make testing easier without touching the bundle.
export const API_URL = (() => {
  try {
    const localOverride = typeof localStorage !== "undefined" && localStorage.getItem("API_URL_OVERRIDE");
    if (localOverride) {
      console.log("%cUsing local API override", "color:#eab308;");
      return localOverride;
    }
    // Official deployment URL (update when you redeploy Apps Script)
    return "https://script.google.com/macros/s/AKfycbzx8gRgbYZw8Rrg348q2dlsRd7yQ9IXUNUPBDUf-Q5Wb9LntLuKY-ozmnbZOOuQsDU_3w/exec";
  } catch (err) {
    console.warn("Failed to resolve API_URL:", err);
    return "";
  }
})();

// ===== Theme Management (legacy-compatible) =====
export function setTheme(theme) {
  try {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    if (typeof localStorage !== "undefined") localStorage.setItem("theme", theme);
    appState.flags.isDarkMode = theme === "dark";
  } catch (err) {
    console.error("Failed to set theme:", err);
  }
}

export function initTheme() {
  try {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem("theme")) || null;
    const prefersDark = typeof window !== "undefined" &&
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    setTheme(theme);
    console.log("%cTheme initialized:", "color:#3b82f6;", theme);
  } catch (err) {
    console.error("Theme init failed:", err);
    appState.flags.hasError = true;
  }
}

// ===== App Lifecycle =====
export function initAppState() {
  try {
    if (appState.flags.initialized) return;
    initTheme();

    if (typeof window !== "undefined") {
      window.addEventListener("online",  () => (appState.flags.isOnline = true));
      window.addEventListener("offline", () => (appState.flags.isOnline = false));
    }

    // Attempt to restore session immediately
    const restored = loadUserData();
    if (restored) {
      appState.user = restored;
      appState.currentUser = restored; // keep both pointers in sync
    }

    appState.flags.initialized = true;
    console.log("%cApp state initialized", "color:#06b6d4;");
  } catch (err) {
    console.error("Error initializing app state:", err);
    appState.flags.hasError = true;
  }
}

// ===== Session Management (legacy-compatible names) =====
export function saveSession(userData) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("userData", JSON.stringify(userData));
    }
    appState.user = userData;
    appState.currentUser = userData; // keep legacy property updated
    console.log("%cUser session saved", "color:#16a34a;");
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

export function loadUserData() {
  try {
    if (typeof localStorage === "undefined") return null;
    const data = localStorage.getItem("userData");
    if (data) {
      const parsed = JSON.parse(data);
      // upgrade path for older shapes
      if (!parsed.UniqueID && parsed.userId) parsed.UniqueID = parsed.userId;
      return parsed;
    }
    return null;
  } catch (err) {
    console.error("Failed to load user data:", err);
    return null;
  }
}

export function clearSession() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("userData");
    }
    appState.user = null;
    appState.currentUser = null;
    console.log("%cSession cleared", "color:#f97316;");
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}

// ===== Role Utilities (kept for compatibility; safe no-ops if roles absent) =====
export function setRoles(rolesArray) {
  appState.roles = Array.isArray(rolesArray) ? rolesArray : [];
  appState.allRoles = appState.roles;
}
export function hasRole(roleName) {
  const u = appState.currentUser || appState.user;
  if (!u) return false;
  const role = (u.Role || u.role || "").toString().trim();
  return role.toLowerCase() === String(roleName || "").toLowerCase();
}

// ===== Content/User Cache Helpers (compatible with older modules) =====
export function cacheContent(payload) {
  appState.cache.content = payload;
  appState.cache.lastFetchedAt = Date.now();
}
export function cacheUserData(payload) {
  appState.cache.userData = payload;
  appState.cache.lastFetchedAt = Date.now();
}

// ===== Utility to prime quiz runtime safely =====
export function primeCurrentQuiz(questions = [], userAnswers = []) {
  appState.currentQuiz.originalQuestions = Array.isArray(questions) ? questions : [];
  appState.currentQuiz.originalUserAnswers = Array.isArray(userAnswers) ? userAnswers : [];
  appState.currentQuiz.meta = {
    simulationCount: SIMULATION_Q_COUNT,
    defaultSecondsPerQuestion: DEFAULT_TIME_PER_QUESTION
  };
}
