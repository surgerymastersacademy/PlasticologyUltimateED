// js/api.js (FINAL - Professional Version Control)

import { API_URL, appState } from './state.js';

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
    } else if (payload.eventType === 'FinishMatchingQuiz') {
        newLogEntry = {
            timestamp: now,
            eventType: 'FinishMatchingQuiz',
            title: 'Matching Test',
            score: payload.score
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
        ...logData 
    };

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
        mode: 'no-cors', 
        body: JSON.stringify(payload)
    }).catch(error => console.error('Error logging theory activity:', error));
}


/**
 * --- UPDATED: Fetches content data using "Stale-While-Revalidate" strategy ---
 * 1. Checks LocalStorage and returns it IMMEDIATELY (Fast start).
 * 2. Checks Google Sheets (Background).
 * 3. If Sheet Version > Local Version -> Updates Cache & Reloads.
 */
export async function fetchContentData() {
    const CACHE_KEY = 'plasticology_content_data';

    // 1. Fast Start: Try to load from LocalStorage
    const cachedString = localStorage.getItem(CACHE_KEY);
    let cachedData = null;
    
    if (cachedString) {
        try {
            cachedData = JSON.parse(cachedString);
            console.log(`⚡ Loaded cached version: ${cachedData.version || 'Unknown'}`);
        } catch (e) {
            console.warn("Cache corrupted.");
        }
    }

    // 2. Background Update: Always fetch from network to check for updates
    // We don't await this if we have cache, we let it run in background? 
    // No, main.js awaits this function. We must return something.
    
    const networkPromise = fetch(`${API_URL}?request=contentData&t=${new Date().getTime()}`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            
            // Check Version
            const serverVersion = String(data.version);
            const localVersion = cachedData ? String(cachedData.version) : null;

            if (serverVersion !== localVersion) {
                console.log(`✨ New version found! Server: ${serverVersion}, Local: ${localVersion}`);
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                
                // If we were using cached data, we need to tell the user to refresh
                if (cachedData) {
                    // Small delay to ensure UI is rendered before alerting
                    setTimeout(() => {
                        if(confirm("New content is available! Press OK to refresh.")) {
                            window.location.reload();
                        }
                    }, 1000);
                }
            }
            return data;
        })
        .catch(error => {
            console.error("Background fetch failed:", error);
            return null; // Return null to signal failure
        });

    // 3. Decision: What to return to main.js?
    if (cachedData) {
        // If we have cache, return it immediately so app starts fast.
        // The network promise runs in the background and will trigger reload if needed.
        return cachedData;
    } else {
        // If no cache (first run), we MUST wait for network.
        return await networkPromise;
    }
}

/**
 * Fetches all data specific to the logged-in user.
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

export function logCorrectedMistake(questionId) {
    const payload = {
        eventType: 'logCorrectedMistake',
        userId: appState.currentUser.UniqueID,
        questionId: questionId
    };
    fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) })
        .catch(err => console.error("Failed to log corrected mistake:", err));
}
