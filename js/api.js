// js/api.js (FINAL CORRECTED VERSION)

import { API_URL, appState } from './state.js';
// REMOVED: import { updateStudyPlanProgress } from './features/planner.js';

/**
 * --- NEW: Sends registration data to the backend. ---
 * @param {object} registrationData - The user's registration details.
 * @returns {Promise<object>} The JSON response from the server.
 */
export async function registerUser(registrationData) {
    const payload = {
        eventType: 'registerUser',
        ...registrationData
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payload),
            redirect: 'follow'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        return await response.json();
    } catch (error) {
        console.error('Registration API error:', error);
        return { success: false, message: 'An error occurred during registration. Please check your connection and try again.' };
    }
}


/**
 * Logs a user activity event to the backend.
 * @param {object} eventData - The data payload for the event.
 */
export function logUserActivity(eventData) {
    if (!API_URL || !appState.currentUser || appState.currentUser.Role === 'Guest') return;

    const now = new Date();
    let newLogEntry = null;
    const payload = {
        ...eventData,
        userId: appState.currentUser.UniqueID,
        userName: appState.currentUser.Name
    };

    if (payload.eventType === 'FinishQuiz') {
        const details = appState.currentQuiz.originalQuestions.map((q, index) => {
            return {
                qID: q.UniqueID,
                ans: appState.currentQuiz.originalUserAnswers[index] ? appState.currentQuiz.originalUserAnswers[index].answer : 'No Answer'
            };
        });
        payload.details = JSON.stringify(details);

        newLogEntry = {
            logId: now.toISOString(),
            timestamp: now,
            eventType: 'FinishQuiz',
            title: payload.quizTitle,
            score: payload.score,
            total: payload.totalQuestions,
            isReviewable: true
        };
        // REMOVED: updateStudyPlanProgress('quiz', payload.quizTitle);

    } else if (payload.eventType === 'ViewLecture') {
        newLogEntry = {
            timestamp: now,
            eventType: 'ViewLecture',
            title: payload.lectureName
        };
        // REMOVED: updateStudyPlanProgress('lecture', payload.lectureName);
    }

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    }).then(() => {
        if (newLogEntry) {
            appState.fullActivityLog.unshift(newLogEntry);
        }
    }).catch(error => console.error('Error logging activity:', error));
}


/**
 * Logs a theory question interaction to the backend.
 * @param {object} logData - The data for the theory log.
 */
export function logTheoryActivity(logData) {
    if (!API_URL || !appState.currentUser || appState.currentUser.Role === 'Guest') return;

    const payload = {
        eventType: 'saveTheoryLog',
        userId: appState.currentUser.UniqueID,
        questionId: logData.questionId,
        logUniqueId: `${appState.currentUser.UniqueID}_${logData.questionId}`,
        ...logData // This will include 'Notes' or 'Status'
    };

    // Optimistically update the local state
    const logIndex = appState.userTheoryLogs.findIndex(log => log.Question_ID === logData.questionId);
    if (logIndex > -1) {
        if (logData.Notes !== undefined) appState.userTheoryLogs[logIndex].Notes = logData.Notes;
        if (logData.Status !== undefined) appState.userTheoryLogs[logIndex].Status = logData.Status;
    } else {
        appState.userTheoryLogs.push({
            Log_UniqueID: payload.logUniqueId,
            User_ID: payload.userId,
            Question_ID: payload.questionId,
            Notes: logData.Notes || '',
            Status: logData.Status || ''
        });
    }

    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', // Use no-cors for "fire and forget" logging
        body: JSON.stringify(payload)
    }).catch(error => console.error('Error logging theory activity:', error));
}


/**
 * Fetches the main content data (questions, lectures, etc.) from the backend.
 * @returns {Promise<object|null>}
 */
export async function fetchContentData() {
    try {
        const response = await fetch(`${API_URL}?request=contentData&t=${new Date().getTime()}`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });
        if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        console.error("Error loading content data:", error);
        return null;
    }
}

/**
 * Fetches all data specific to the logged-in user (logs, notes, plans).
 */
export async function fetchUserData() {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
    try {
        const response = await fetch(`${API_URL}?request=userData&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Could not fetch user data.');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        appState.fullActivityLog = data.logs || [];
        appState.userQuizNotes = data.quizNotes || [];
        appState.userLectureNotes = data.lectureNotes || [];
        appState.answeredQuestions = new Set(data.answeredQuestions || []);
        appState.userTheoryLogs = data.theoryLogs || [];

        return data; // Return data so it can be used by other functions
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Logs an incorrect answer to the backend for tracking mistakes.
 * @param {string} questionId
 * @param {string} userAnswer
 */
export function logIncorrectAnswer(questionId, userAnswer) {
    const payload = {
        eventType: 'logIncorrectAnswer',
        userId: appState.currentUser.UniqueID,
        questionId: questionId,
        userAnswer: userAnswer
    };
    fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) })
        .catch(err => console.error("Failed to log incorrect answer:", err));
}

/**
 * Logs that a previously incorrect answer has now been answered correctly.
 * @param {string} questionId
 */
export function logCorrectedMistake(questionId) {
    const payload = {
        eventType: 'logCorrectedMistake',
        userId: appState.currentUser.UniqueID,
        questionId: questionId
    };
    fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) })
        .catch(err => console.error("Failed to log corrected mistake:", err));
}

// ===================================================
// Plasticology Ultimate Edition — API Hardening Block
// File: js/api.js (append-only)
// Version: v1.1.4 — 2025-10-08
// Notes:
//  • Non-breaking: does not modify existing exports or function signatures.
//  • Adds safe fetch with timeout + retry for calls targeting API_URL only.
//  • On repeated failures, reports via error-reporter (if available) and logs clearly.
// ===================================================

/* eslint-disable no-console */
(() => {
  try {
    const ORIG_FETCH = window.fetch.bind(window);
    const MAX_RETRIES = 2;         // total attempts = 1 + MAX_RETRIES
    const TIMEOUT_MS  = 12000;     // 12s timeout per attempt
    const BACKOFF_MS  = 700;       // base backoff, will be multiplied

    async function timedFetch(url, init = {}, timeoutMs = TIMEOUT_MS) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const merged = { ...init, signal: controller.signal };
        return await ORIG_FETCH(url, merged);
      } finally {
        clearTimeout(id);
      }
    }

    async function retryFetchForAPI(url, init = {}) {
      let lastErr = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const res = await timedFetch(url, init, TIMEOUT_MS);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res;
        } catch (err) {
          lastErr = err;
          const wait = BACKOFF_MS * (attempt + 1);
          console.warn(`[API] fetch failed (attempt ${attempt + 1}):`, err?.message || err);
          await new Promise(r => setTimeout(r, wait));
        }
      }
      // After exhausting attempts, try to report (if reporter exists)
      try {
        if (window.__reportClientError) {
          window.__reportClientError({
            type: "api",
            stage: "retry_exhausted",
            message: String(lastErr?.message || lastErr),
            file: "api.js",
            url
          });
        } else {
          // Try dynamic import without breaking the app
          import("./features/error-reporter.js")
            .then(m => m.reportClientError?.({
              type: "api",
              stage: "retry_exhausted",
              message: String(lastErr?.message || lastErr),
              file: "api.js",
              url
            }))
            .catch(() => void 0);
        }
      } catch (_) {}
      throw lastErr || new Error("API request failed");
    }

    // Monkey-patch fetch ONLY for API_URL target to add timeout + retry
    window.fetch = async function(input, init) {
      try {
        const url = (typeof input === "string") ? input : (input?.url || "");
        if (typeof API_URL === "string" && url && API_URL && url.startsWith(API_URL)) {
          return await retryFetchForAPI(url, init);
        }
        return await ORIG_FETCH(input, init);
      } catch (e) {
        // Never break call sites; rethrow
        throw e;
      }
    };

    // Optional: API health probe (non-blocking). Result stored on window.__apiHealthy
    (async () => {
      try {
        const probeUrl = (typeof API_URL === "string" && API_URL.includes("?"))
          ? `${API_URL}&health=1`
          : `${API_URL}?health=1`;
        const res = await ORIG_FETCH(probeUrl, { method: "GET", cache: "no-store" });
        window.__apiHealthy = res.ok;
      } catch {
        window.__apiHealthy = false;
      }
    })();

    console.log("%cAPI hardening active (timeout+retry for Apps Script calls)", "color:#0ea5e9;");
  } catch (e) {
    console.warn("API hardening block failed to initialize (non-fatal).", e);
  }
})();
