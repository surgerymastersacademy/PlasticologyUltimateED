// js/features/leaderboard.js (FINAL VERSION v3.1)

import { createJsonRequest } from '../api.js';
import { showLoader, hideLoader } from '../ui.js';
import { getCurrentUser } from '../state.js';

export async function initLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    const userRankContainer = document.getElementById('current-user-rank');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    showLoader('leaderboard-loader');
    container.innerHTML = '';
    if(userRankContainer) userRankContainer.innerHTML = '';

    try {
        const response = await createJsonRequest({ request: 'leaderboard', userId: user.UniqueID });
        
        if (response && response.success) {
            renderLeaderboard(response.leaderboard, response.currentUserRank);
        } else {
            container.innerHTML = '<p class="text-center text-gray-500">Leaderboard unavailable.</p>';
        }
    } catch (error) {
        console.error("Leaderboard Error:", error);
        container.innerHTML = '<p class="text-center text-red-500">Failed to load leaderboard.</p>';
    } finally {
        hideLoader('leaderboard-loader');
    }
}

function renderLeaderboard(topUsers, currentUserRank) {
    const container = document.getElementById('leaderboard-list');
    const userRankContainer = document.getElementById('current-user-rank');

    // 1. Render Top 10
    if (topUsers.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">No data yet.</p>';
    } else {
        topUsers.forEach((u, index) => {
            const isTop3 = index < 3;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const bgClass = isTop3 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-100';
            
            const item = document.createElement('div');
            item.className = `flex items-center justify-between p-3 rounded-lg border ${bgClass} dark:bg-slate-800 dark:border-slate-700 mb-2`;
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="font-bold text-lg w-8 text-center">${medal}</span>
                    <span class="font-semibold text-slate-700 dark:text-slate-200">${u.name}</span>
                </div>
                <div class="text-blue-600 font-bold text-sm">${u.score || 0} pts</div>
            `;
            container.appendChild(item);
        });
    }

    // 2. Render Current User Rank
    if (currentUserRank && userRankContainer) {
        userRankContainer.innerHTML = `
            <div class="flex items-center justify-between text-blue-900">
                <span class="font-bold">Your Rank: #${currentUserRank.rank}</span>
                <span class="font-bold">${currentUserRank.score} pts</span>
            </div>
            <p class="text-xs text-blue-600 mt-1">Keep pushing, Dr. ${currentUserRank.name}!</p>
        `;
        userRankContainer.classList.remove('hidden');
    }
}
