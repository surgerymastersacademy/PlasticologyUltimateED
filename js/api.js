// js/api.js (FINAL CORRECTED VERSION)

import { API_URL, appState } from './state.js';
// REMOVED: import { updateStudyPlanProgress } from './features/planner.js';

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
