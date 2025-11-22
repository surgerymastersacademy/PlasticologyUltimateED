// js/api.js (FINAL UPGRADED VERSION - IndexedDB SUPPORT)

import { API_URL, appState } from './state.js';

// --- 1. INDEXED DB ENGINE (DATABASE HANDLER) ---
// This replaces localStorage for heavy content to fix QuotaExceededError
const DB_NAME = 'PlasticologyDB';
const DB_VERSION = 1;
const STORE_NAME = 'content_store';

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function dbSet(key, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function dbGet(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// --- 2. API HELPERS ---

async function sendPostRequest(payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
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

// --- 3. USER & AUTHENTICATION ---

export async function registerUser(registrationData) {
    const payload = {
        eventType: 'registerUser',
        ...registrationData
    };
    return await sendPostRequest(payload);
}

// --- 4. ACTIVITY LOGGING ---

export function logUserActivity(eventData) {
    if (!API_URL || !appState.currentUser || appState.currentUser.Role === 'Guest') return;

    const now = new Date();
    const payload = {
        ...eventData,
        userId: appState.currentUser.UniqueID,
        userName: appState.currentUser.Name
    };

    // Optimistic UI Update
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

// --- 5. PLANNER API FUNCTIONS ---

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

// --- 6. DATA FETCHING (UPGRADED TO INDEXED DB) ---

export async function fetchContentData() {
    const CACHE_KEY = 'plasticology_content_data';
    const CACHE_TIMESTAMP_KEY = 'plasticology_last_fetch_time';
    const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

    // 1. Try to load from IndexedDB first (Large Storage)
    let cachedData = null;
    try {
        cachedData = await dbGet(CACHE_KEY); // Async call to DB
        if (cachedData) {
            console.log(`⚡ Loaded cached content v${cachedData.version || '?'}`);
        }
    } catch (e) {
        console.warn("DB Read Error:", e);
    }

    const lastFetchTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const now = new Date().getTime();

    // 2. If cache is fresh, skip network
    if (cachedData && lastFetchTime && (now - parseInt(lastFetchTime) < CACHE_DURATION)) {
        console.log("🕒 Cache is fresh. Skipping server request.");
        return cachedData;
    }

    // 3. If stale, fetch from server
    console.log("🔄 Fetching fresh data from server...");
    
    try {
        const response = await fetch(`${API_URL}?request=contentData&t=${now}`, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            if (response.status === 429 && cachedData) {
                console.warn("⚠️ Server busy (429). Using cached data.");
                return cachedData;
            }
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Save to IndexedDB (No Quota Limit)
        try {
            await dbSet(CACHE_KEY, data); 
            localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        } catch (dbError) {
            console.error("Failed to save to DB:", dbError);
        }

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
        return cachedData || null; // Fallback
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