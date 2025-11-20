// js/api.js (FINAL VERSION - OPTIMIZED & COMPLETE)

import { API_URL, appState } from './state.js';

// =================================================
// 1. INDEXED DB ENGINE (لحل مشكلة امتلاء الذاكرة)
// =================================================
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
    try {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) { console.warn("DB Write Error", e); }
}

async function dbGet(key) {
    try {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) { return null; }
}

// =================================================
// 2. API HELPER (الدالة السحرية للاختصار وحل CORS)
// =================================================
async function sendPostRequest(payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // CORS Fix
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Server Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("API Request Failed:", error);
        return { success: false, message: "Connection Error" };
    }
}

// =================================================
// 3. USER & LOGGING FUNCTIONS (كل الخواص هنا)
// =================================================

export async function registerUser(data) {
    return await sendPostRequest({ eventType: 'registerUser', ...data });
}

export function logUserActivity(eventData) {
    if (!API_URL || !appState.currentUser || appState.currentUser.Role === 'Guest') return;
    
    const now = new Date();
    const payload = { ...eventData, userId: appState.currentUser.UniqueID, userName: appState.currentUser.Name };

    // Optimistic Update (تحديث فوري للشاشة قبل السيرفر)
    let newLogEntry = null;
    if (payload.eventType === 'FinishQuiz') {
        const details = appState.currentQuiz.originalQuestions.map((q, i) => ({
            qID: q.UniqueID, ans: appState.currentQuiz.originalUserAnswers[i]?.answer || 'No Answer'
        }));
        payload.details = JSON.stringify(details);
        newLogEntry = { logId: now.toISOString(), timestamp: now, eventType: 'FinishQuiz', title: payload.quizTitle, score: payload.score, total: payload.totalQuestions, isReviewable: true };
    } else if (payload.eventType === 'ViewLecture') {
        newLogEntry = { timestamp: now, eventType: 'ViewLecture', title: payload.lectureName };
    } else if (payload.eventType === 'FinishMatchingQuiz') {
        newLogEntry = { timestamp: now, eventType: 'FinishMatchingQuiz', title: 'Matching Test', score: payload.score };
    } else if (payload.eventType === 'FinishOSCEQuiz') {
        newLogEntry = { timestamp: now, eventType: 'FinishOSCEQuiz', title: payload.osceTitle || 'OSCE', score: payload.score };
    }

    if (newLogEntry) appState.fullActivityLog.unshift(newLogEntry);
    sendPostRequest(payload); // إرسال للسيرفر في الخلفية
}

export function logTheoryActivity(logData) {
    const payload = { 
        eventType: 'saveTheoryLog', 
        userId: appState.currentUser.UniqueID, 
        logUniqueId: `${appState.currentUser.UniqueID}_${logData.questionId}`, 
        ...logData 
    };
    // Update Local State
    const idx = appState.userTheoryLogs.findIndex(l => l.Question_ID === logData.questionId);
    if (idx > -1) {
        if (logData.Notes !== undefined) appState.userTheoryLogs[idx].Notes = logData.Notes;
        if (logData.Status !== undefined) appState.userTheoryLogs[idx].Status = logData.Status;
    } else {
        appState.userTheoryLogs.push({ Log_UniqueID: payload.logUniqueId, User_ID: payload.userId, Question_ID: payload.questionId, Notes: logData.Notes || '', Status: logData.Status || '' });
    }
    sendPostRequest(payload);
}

export function logIncorrectAnswer(qid, ans) { sendPostRequest({ eventType: 'logIncorrectAnswer', userId: appState.currentUser.UniqueID, questionId: qid, userAnswer: ans }); }
export function logCorrectedMistake(qid) { sendPostRequest({ eventType: 'logCorrectedMistake', userId: appState.currentUser.UniqueID, questionId: qid }); }

// =================================================
// 4. PLANNER FUNCTIONS (أكواد الخطة الدراسية)
// =================================================

export async function createStudyPlanAPI(data) { return await sendPostRequest({ eventType: 'createStudyPlan', userId: appState.currentUser.UniqueID, ...data }); }
export async function updateStudyPlanAPI(id, plan) { return await sendPostRequest({ eventType: 'updateStudyPlan', planId: id, studyPlan: plan }); }
export async function activateStudyPlanAPI(id) { return await sendPostRequest({ eventType: 'activateStudyPlan', userId: appState.currentUser.UniqueID, planId: id }); }
export async function deleteStudyPlanAPI(id) { return await sendPostRequest({ eventType: 'deleteStudyPlan', planId: id }); }

export async function getAllUserPlansAPI() {
    if (!appState.currentUser) return { success: false };
    try {
        const res = await fetch(`${API_URL}?request=getAllUserPlans&userId=${appState.currentUser.UniqueID}&t=${Date.now()}`, { redirect: 'follow' });
        return await res.json();
    } catch (e) { return { success: false }; }
}

// =================================================
// 5. DATA FETCHING (Smart Sync & Caching)
// =================================================

export async function fetchContentData() {
    const CACHE_KEY = 'plasticology_content_data';
    const TIME_KEY = 'plasticology_last_fetch';
    const HOUR = 60 * 60 * 1000;

    // 1. Try IndexedDB (Big Storage)
    let cachedData = await dbGet(CACHE_KEY);
    const lastTime = localStorage.getItem(TIME_KEY);
    const now = Date.now();

    // 2. Check freshness (Avoid 429 Error)
    if (cachedData && lastTime && (now - parseInt(lastTime) < HOUR)) {
        console.log("🕒 Using cached data (Fresh)");
        return cachedData;
    }

    // 3. Fetch from Server
    console.log("🔄 Fetching from server...");
    try {
        const res = await fetch(`${API_URL}?request=contentData&t=${now}`, { method: 'GET', redirect: 'follow' });
        
        if (!res.ok) {
            if (res.status === 429 && cachedData) return cachedData; // Fail-safe
            throw new Error(`Server ${res.status}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Save to DB & LocalStorage
        await dbSet(CACHE_KEY, data);
        localStorage.setItem(TIME_KEY, now.toString());

        // Update Prompt
        const sVer = String(data.version);
        const lVer = cachedData ? String(cachedData.version) : null;
        if (cachedData && sVer !== lVer && confirm("New content available! Refresh?")) {
            window.location.reload();
        }
        return data;
    } catch (e) {
        console.error("Fetch failed:", e);
        return cachedData || null;
    }
}

export async function fetchUserData() {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
    try {
        const res = await fetch(`${API_URL}?request=userData&userId=${appState.currentUser.UniqueID}&t=${Date.now()}`, { redirect: 'follow' });
        const data = await res.json();
        if (!data.error) {
            appState.fullActivityLog = data.logs || [];
            appState.userQuizNotes = data.quizNotes || [];
            appState.userLectureNotes = data.lectureNotes || [];
            appState.answeredQuestions = new Set(data.answeredQuestions || []);
            appState.userTheoryLogs = data.theoryLogs || [];
        }
        return data;
    } catch (e) { console.error("User Data Error", e); }
}
