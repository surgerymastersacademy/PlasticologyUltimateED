// js/api.js (FINAL COMPATIBLE VERSION v3.1)

import { showLoader, hideLoader, showToast } from './ui.js';

// ⚠️ هام: استبدل هذا الرابط برابط السكربت الخاص بك إذا لم يكن موجوداً
// Web App URL from Google Apps Script Deployment
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzVzJ-s4g_M-k3v-TzX3j2gJ1x4kL5mN6oP7qR8s9tU0vW1x2y3z/exec"; 
// ملاحظة: إذا كان الرابط موجوداً في config.js أو main.js، تأكد من استخدامه هنا. 
// في هذا الهيكل، سنفترض أن الرابط يتم تمريره أو تحديده هنا.
// للأمان، يفضل وضع رابطك الحقيقي هنا مكان الرابط الافتراضي أعلاه.

// =========================================
// 1. GENERIC REQUEST FUNCTIONS
// =========================================

/**
 * Sends a GET request to the Google Apps Script Web App.
 * Used for fetching data (e.g., getUserCardData, contentData).
 * @param {Object} params - Key-value pairs for query parameters.
 */
export async function createJsonRequest(params) {
    if (!SCRIPT_URL || SCRIPT_URL.includes("AKfycbzVzJ")) {
        console.warn("⚠️ Warning: Using placeholder SCRIPT_URL. Please update api.js with your deployed Web App URL.");
    }

    // Construct URL with parameters
    const url = new URL(SCRIPT_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    try {
        const response = await fetch(url, {
            method: "GET",
            redirect: "follow" // Important for Google Apps Script redirects
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API GET Error:", error);
        throw error;
    }
}

/**
 * Sends a POST request to the Google Apps Script Web App.
 * Used for actions (e.g., login, register, updateProfile, sendMessage).
 * Uses 'text/plain' to avoid CORS preflight (OPTIONS) issues.
 * @param {Object} data - The JSON payload to send.
 */
export async function sendPostRequest(data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            // Using text/plain avoids the CORS preflight check
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(data),
            redirect: "follow"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("API POST Error:", error);
        throw error; // Propagate error to be handled by the caller
    }
}

// =========================================
// 2. SMART CONTENT FETCHING (Caching Logic)
// =========================================

/**
 * Fetches main content data (Questions, Lectures, etc.) with smart caching.
 * Checks local storage first to save quota and load faster.
 */
export async function fetchContentData() {
    const CACHE_KEY = 'plasticology_content_v3';
    const CACHE_TIME_KEY = 'plasticology_content_time';
    const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

    // 1. Check Local Cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = new Date().getTime();

    if (cachedData && cachedTime && (now - parseInt(cachedTime) < CACHE_DURATION)) {
        console.log("⚡ Loaded cached content");
        return JSON.parse(cachedData);
    }

    // 2. Fetch from Server if cache expired or missing
    try {
        // Using createJsonRequest (GET) for contentData
        const data = await createJsonRequest({ request: 'contentData' });

        if (data && !data.error) {
            // Save to cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            console.log("🌐 Fetched fresh content from server");
            return data;
        } else {
            throw new Error(data.error || "Invalid data structure");
        }
    } catch (error) {
        console.warn("Failed to fetch fresh content, falling back to cache if available...", error);
        if (cachedData) {
            showToast("Offline mode: Using saved content.", "info");
            return JSON.parse(cachedData);
        }
        throw error;
    }
}
