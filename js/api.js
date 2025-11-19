// js/api.js (FINAL VERSION - Professional Version Control & Auto-Update)
// مسؤول عن الاتصال بالسيرفر، التخزين المؤقت، والتحديث التلقائي للمحتوى

import { API_URL, appState } from './state.js';

/**
 * يرسل بيانات التسجيل للسيرفر
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
 * يسجل نشاط المستخدم (امتحانات، محاضرات، إلخ)
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

    // تجهيز السجل المحلي للعرض الفوري
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

    // إرسال للسيرفر
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
 * يسجل نشاط الأسئلة النظرية (Theory)
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

    // تحديث الحالة المحلية فوراً
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
 * --- الوظيفة الجوهرية: جلب المحتوى وتحديثه ---
 * 1. تفحص الذاكرة المحلية وتعيد البيانات فوراً (للشرعة).
 * 2. تتصل بالسيرفر في الخلفية.
 * 3. تقارن رقم الإصدار، وإذا وجدت تحديثاً، تحفظه وتطلب التحديث.
 */
export async function fetchContentData() {
    const CACHE_KEY = 'plasticology_content_data';

    // 1. البداية السريعة: تحميل من الكاش
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

    // 2. التحديث في الخلفية (Background Fetch)
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
            
            // مقارنة الإصدارات
            const serverVersion = String(data.version);
            const localVersion = cachedData ? String(cachedData.version) : null;

            if (serverVersion !== localVersion) {
                console.log(`✨ New version found! Server: ${serverVersion}, Local: ${localVersion}`);
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                
                // إذا كنا نستخدم الكاش القديم حالياً، ننبه المستخدم للتحديث
                if (cachedData) {
                    setTimeout(() => {
                        // يمكن استبدال هذا بنافذة أجمل لاحقاً
                        if(confirm("🎉 تحديث جديد للمحتوى متاح! اضغط OK للتحميل.")) {
                            window.location.reload();
                        }
                    }, 2000); // انتظار ثانيتين حتى لا يظهر التنبيه فور فتح التطبيق
                }
            }
            return data;
        })
        .catch(error => {
            console.error("Background fetch failed:", error);
            return null;
        });

    // 3. القرار: ماذا نعيد للتطبيق الآن؟
    if (cachedData) {
        // إذا وجدنا كاش، نستخدمه فوراً (السرعة القصوى)
        // التحديث سيحدث في الخلفية
        return cachedData;
    } else {
        // أول مرة يفتح التطبيق: يجب انتظار الشبكة
        return await networkPromise;
    }
}

/**
 * جلب بيانات المستخدم الخاصة (لا يتم تخزينها في الكاش الدائم لأنها تتغير كثيراً)
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
