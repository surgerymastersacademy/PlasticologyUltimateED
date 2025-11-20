// js/features/performance.js (FINAL VERSION v3.1)

import { createJsonRequest } from '../api.js';
import { getCurrentUser } from '../state.js';

/**
 * Fetches user logs and calculates performance insights (Strengths & Weaknesses).
 * Called by Planner or Dashboard.
 */
export async function updatePerformanceInsights() {
    const user = getCurrentUser();
    if (!user) return;

    const strengthsList = document.getElementById('strengths-list');
    const weaknessesList = document.getElementById('weaknesses-list');
    const container = document.getElementById('performance-insights-container');

    // If UI elements don't exist, skip
    if (!strengthsList || !weaknessesList) return;

    try {
        // Fetch logs to analyze performance
        const response = await createJsonRequest({ request: 'userData', userId: user.UniqueID });

        if (response && response.logs) {
            const stats = calculateStats(response.logs);
            renderInsights(stats, strengthsList, weaknessesList);
            
            // Show the container if it was hidden
            if (container) container.classList.remove('hidden');
        }
    } catch (e) {
        console.warn("Failed to update performance insights:", e);
    }
}

/**
 * Analyzes logs to determine accuracy per topic/chapter.
 */
function calculateStats(logs) {
    const topicStats = {};

    // 1. Aggregate Scores
    logs.forEach(log => {
        // We need logs that have detailed scores (Quiz logs)
        // Assuming 'title' or 'details' contains Topic/Chapter info
        // This logic depends on how your Quiz Logs are structured.
        // For now, we'll try to parse the Title as "Source - Chapter" or just use Title.
        
        if (log.total && log.total > 0) {
            let topic = "General";
            // Try to extract topic from Title "Quiz: ChapterName"
            if (log.title && log.title.includes(':')) {
                topic = log.title.split(':')[1].trim();
            } else {
                topic = log.title || "General";
            }

            if (!topicStats[topic]) {
                topicStats[topic] = { correct: 0, total: 0 };
            }

            topicStats[topic].correct += parseInt(log.score || 0);
            topicStats[topic].total += parseInt(log.total || 0);
        }
    });

    // 2. Calculate Percentage
    const results = [];
    Object.keys(topicStats).forEach(topic => {
        const data = topicStats[topic];
        if (data.total >= 5) { // Only count if attempted at least 5 questions
            results.push({
                topic: topic,
                accuracy: (data.correct / data.total) * 100
            });
        }
    });

    return results.sort((a, b) => b.accuracy - a.accuracy);
}

function renderInsights(stats, sList, wList) {
    sList.innerHTML = '';
    wList.innerHTML = '';

    if (stats.length === 0) {
        sList.innerHTML = '<li class="text-sm text-gray-500">Take more quizzes to see insights.</li>';
        wList.innerHTML = '<li class="text-sm text-gray-500">Data will appear here.</li>';
        return;
    }

    // Top 3 Strengths
    const strengths = stats.filter(s => s.accuracy >= 70).slice(0, 3);
    strengths.forEach(s => {
        sList.innerHTML += `<li class="text-sm text-green-700 mb-1"><i class="fas fa-check-circle mr-2"></i>${s.topic} (${Math.round(s.accuracy)}%)</li>`;
    });
    if (strengths.length === 0) sList.innerHTML = '<li class="text-sm text-gray-500">Keep practicing to build strengths!</li>';

    // Bottom 3 Weaknesses
    const weaknesses = stats.slice().reverse().filter(s => s.accuracy < 70).slice(0, 3);
    weaknesses.forEach(w => {
        wList.innerHTML += `<li class="text-sm text-red-700 mb-1"><i class="fas fa-exclamation-circle mr-2"></i>${w.topic} (${Math.round(w.accuracy)}%)</li>`;
    });
    if (weaknesses.length === 0 && stats.length > 0) wList.innerHTML = '<li class="text-sm text-gray-500">Great job! No major weaknesses found.</li>';
}
