// js/api.js

// This file is the data abstraction layer. It handles all communication
// with the Google Apps Script backend.

import { API_URL, appState } from './state.js';
import { updateStudyPlanProgress } from './features/planner.js';

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
        updateStudyPlanProgress('quiz', payload.quizTitle);

    } else if (payload.eventType === 'ViewLecture') {
        newLogEntry = {
            timestamp: now,
            eventType: 'ViewLecture',
            title: payload.lectureName
        };
        updateStudyPlanProgress('lecture', payload.lectureName);
    }

    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    }).then(() => {
        if (newLogEntry) {
            appState.fullActivityLog.unshift(newLogEntry);
        }
    }).catch(error => console.error('Error logging activity:', error));
}

/**
 * Saves the user's study plan to the backend.
 * @param {Array} plan - The study plan data.
 */
export async function saveStudyPlan(plan) {
    const payload = {
        eventType: 'saveStudyPlan',
        userId: appState.currentUser.UniqueID,
        planData: plan
    };
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });
        console.log("Study plan saved successfully.");
    } catch (error) {
        console.error("Error saving study plan:", error);
    }
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
 * Fetches all data specific to the logged-in user (logs, notes, plan).
 */
export async function fetchUserData() {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
    try {
        const userDataResponse = await fetch(`${API_URL}?request=userData&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!userDataResponse.ok) throw new Error('Could not fetch user data.');
        const data = await userDataResponse.json();
        if (data.error) throw new Error(data.error);

        appState.fullActivityLog = data.logs || [];
        appState.userQuizNotes = data.quizNotes || [];
        appState.userLectureNotes = data.lectureNotes || [];

        const studyPlanResponse = await fetch(`${API_URL}?request=getStudyPlan&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!studyPlanResponse.ok) throw new Error('Could not fetch study plan.');
        const studyPlanData = await studyPlanResponse.json();
        if (studyPlanData.error) throw new Error(studyPlanData.error);
        appState.studyPlannerData = studyPlanData.plan;

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
    fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) })
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
    fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) })
        .catch(err => console.error("Failed to log corrected mistake:", err));
}