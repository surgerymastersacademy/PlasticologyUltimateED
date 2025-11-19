// js/api.js (FINAL COMPLETE VERSION - INCLUDES PLANNER & SMART CACHING)

import { API_URL, appState } from './state.js';

/**
 * Helper function to handle POST requests with CORS safeguards.
 */
async function sendPostRequest(payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Critical for GAS CORS
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Request Failed:", error);
        return { success: false, message: "Network Error: " + error.message };
    }
}

/**
 * --- USER & AUTHENTICATION ---
 */
export async function registerUser(registrationData) {
    const payload = {
        eventType: 'registerUser',
        ...registrationData
    };
    return await sendPostRequest(payload);
}

/**
 * --- ACTIVITY LOGGING ---
 */
export function logUserActivity(eventData) {
    if (!API_URL || !appState.currentUser || appState.currentUser.Role === 'Guest') return;

    const now = new Date();
    const payload = {
        ...eventData,
        userId: appState.currentUser.UniqueID,
        userName: appState.currentUser.Name
    };

    let newLogEntry = null;
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
        newLogEntry = { timestamp: now, eventType: 'ViewLecture', title: payload.lectureName };
    } else if (payload.eventType === 'FinishMatchingQuiz') {
        newLogEntry = { timestamp: now, eventType: 'FinishMatchingQuiz', title: 'Matching Test', score: payload.score };
    } else if (payload.eventType === 'FinishOSCEQuiz') {
        newLogEntry = { timestamp: now, eventType: 'FinishOSCEQuiz', title: payload.osceTitle || 'OSCE', score: payload.score };
    }

    if (newLogEntry) {
        appState.fullActivityLog.unshift(newLogEntry);
    }

    sendPostRequest(payload).catch(err => console.warn("Background logging failed", err));
}

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

    sendPostRequest(payload);
}

export function logIncorrectAnswer(questionId, userAnswer) {
    sendPostRequest({
        eventType: 'logIncorrectAnswer',
        userId: appState.currentUser.UniqueID,
        questionId: questionId,
        userAnswer: userAnswer
    });
}

export function logCorrectedMistake(questionId) {
    sendPostRequest({
        eventType: 'logCorrectedMistake',
        userId: appState.currentUser.UniqueID,
        questionId: questionId
    });
}

/**
 * --- PLANNER API FUNCTIONS ---
 * هذه الدوال كانت ناقصة وهي سبب خطأ الـ SyntaxError
 */

export async function createStudyPlanAPI(planData) {
    const payload = {
        eventType: 'createStudyPlan',
        userId: appState.currentUser.UniqueID,
        planName: planData.planName,
        startDate: planData.startDate,
        endDate: planData.endDate,
        studyPlan: planData.studyPlan
    };
    return await sendPostRequest(payload);
}

export async function updateStudyPlanAPI(planId, studyPlan) {
    const payload = {
        eventType: 'updateStudyPlan',
        planId: planId,
        studyPlan: studyPlan
    };
    return await sendPostRequest(payload);
}

export async function activateStudyPlanAPI(planId) {
    const payload = {
        eventType: 'activateStudyPlan',
        userId: appState.currentUser.UniqueID,
        planId: planId
    };
    return await sendPostRequest(payload);
}

export async function deleteStudyPlanAPI(planId) {
    const payload = {
        eventType: 'deleteStudyPlan',
        planId: planId
    };
    return await sendPostRequest(payload);
}

export async function getAllUserPlansAPI() {
    if (!appState.currentUser) return { success: false };
    try {
        const response = await fetch(`${API_URL}?request=getAllUserPlans&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`, {
            method: 'GET',
            redirect: 'follow'
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (e) {
        console.error("Error fetching plans", e);
        return { success: false };
    }
}

/**
 * --- DATA FETCHING & SMART SYNC (Fixes 429 Error) ---
 */

export async function fetchContentData() {
    const CACHE_KEY = 'plasticology_content_data';
    const CACHE_TIMESTAMP_KEY = 'plasticology_last_fetch_time';
    const CACHE_DURATION = 60 * 60 * 1000; // ساعة واحدة

    // 1. محاولة قراءة الكاش
    const cachedString = localStorage.getItem(CACHE_KEY);
    const lastFetchTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const now = new Date().getTime();

    let cachedData = null;
    if (cachedString) {
        try {
            cachedData = JSON.parse(cachedString);
            console.log(`⚡ Loaded cached content v${cachedData.version || '?'}`);
        } catch (e) { console.warn("Cache corrupted"); }
    }

    // 2. إذا كان الكاش جديداً (أقل من ساعة)، استخدمه ولا تتصل بالسيرفر
    if (cachedData && lastFetchTime && (now - parseInt(lastFetchTime) < CACHE_DURATION)) {
        console.log("🕒 Cache is fresh. Skipping server request to avoid 429 error.");
        return cachedData;
    }

    // 3. إذا كان الكاش قديماً، حاول الاتصال بالسيرفر
    console.log("🔄 Fetching fresh data from server...");
    
    try {
        const response = await fetch(`${API_URL}?request=contentData&t=${now}`, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            // إذا رد السيرفر بخطأ (429 - Too Many Requests)، استخدم الكاش القديم
            if (response.status === 429 && cachedData) {
                console.warn("⚠️ Server busy (429). Using cached data.");
                return cachedData;
            }
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        // تحديث الكاش
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());

        const serverVersion = String(data.version);
        const localVersion = cachedData ? String(cachedData.version) : null;

        if (cachedData && serverVersion !== localVersion) {
            if (confirm("🎉 New content available! Refresh now?")) {
                window.location.reload();
            }
        }
        return data;

    } catch (err) {
        console.error("Content fetch failed:", err);
        // في حالة الفشل التام، استخدم الكاش القديم
        return cachedData || null;
    }
}

export async function fetchUserData() {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
    try {
        const response = await fetch(`${API_URL}?request=userData&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`, {
            redirect: 'follow'
        });
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
