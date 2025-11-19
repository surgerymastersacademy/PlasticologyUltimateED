// js/api.js (UPDATED - With Smart Caching Logic)

import { API_URL, appState, APP_VERSION } from './state.js';

/**
 * Sends registration data to the backend.
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

    } else if (payload.eventType === 'ViewLecture') {
        newLogEntry = {
            timestamp: now,
            eventType: 'ViewLecture',
            title: payload.lectureName
        };
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
 * --- NEW: Fetches main content data with Smart Caching ---
 * Checks LocalStorage first. If data exists and version matches, uses it.
 * Otherwise, fetches from Google Sheets.
 * @returns {Promise<object|null>}
 */
export async function fetchContentData() {
    const CACHE_KEY = 'plasticology_content_data';
    const VERSION_KEY = 'plasticology_content_version';

    // 1. Check Cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedVersion = localStorage.getItem(VERSION_KEY);

    if (cachedData && cachedVersion === APP_VERSION) {
        console.log("⚡ Loading content from local cache...");
        try {
            return JSON.parse(cachedData);
        } catch (e) {
            console.warn("Cache corrupted, fetching fresh data.");
        }
    }

    // 2. Fetch from Network
    console.log("🌐 Fetching fresh content from server...");
    try {
        const response = await fetch(`${API_URL}?request=contentData&t=${new Date().getTime()}`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });
        
        if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status}`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // 3. Save to Cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(VERSION_KEY, APP_VERSION);
        } catch (e) {
            console.warn("Storage quota exceeded. Data not cached.", e);
        }

        return data;
    } catch (error) {
        console.error("Error loading content data:", error);
        
        // Fallback: If network fails but we have old cache, use it even if version mismatch
        if (cachedData) {
            console.warn("Network failed. Using outdated cache as fallback.");
            return JSON.parse(cachedData);
        }
        return null;
    }
}

/**
 * Fetches all data specific to the logged-in user (logs, notes, plans).
 * User data is NOT cached persistently because it changes frequently.
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

        return data; 
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
