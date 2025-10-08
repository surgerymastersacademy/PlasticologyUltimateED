// ===================================================
// Plasticology Ultimate Edition
// File: js/features/error-reporter.js
// Version: v1.1.1 — 2025-10-08
// Author: ChatGPT x Dr. Bishoy
// Description: Client-side Error Reporter for Apps Script Integration
// ===================================================

import { API_URL } from "../state.js"; // use the canonical API endpoint from app state

function getSystemInfo() {
  try {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`,
      url: window.location.href,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return { message: "Failed to collect system info", error: String(err) };
  }
}

async function safeFetch(url, options = {}, retries = 2) {
  try {
    const res = await fetch(url, options);
    return res.ok ? res : Promise.reject(new Error(`HTTP ${res.status}`));
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 600));
      return safeFetch(url, options, retries - 1);
    } else {
      console.error("Failed to send error report:", err);
    }
  }
}

export async function reportClientError(errorData) {
  try {
    const payload = {
      eventType: "clientError",
      ...errorData,
      system: getSystemInfo(),
    };

    if (!navigator.onLine) {
      const q = JSON.parse(localStorage.getItem("offlineErrors") || "[]");
      q.push(payload);
      localStorage.setItem("offlineErrors", JSON.stringify(q));
      return;
    }

    await safeFetch(API_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Error in reportClientError:", err);
  }
}

window.addEventListener("online", async () => {
  const cached = JSON.parse(localStorage.getItem("offlineErrors") || "[]");
  if (!cached.length) return;
  for (const item of cached) {
    await reportClientError(item);
  }
  localStorage.removeItem("offlineErrors");
});
