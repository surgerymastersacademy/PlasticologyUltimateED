// js/features/leaderboard.js

import { appState, API_URL } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';

export async function showLeaderboardScreen() {
    ui.showScreen(dom.leaderboardContainer);
    appState.navigationHistory.push(showLeaderboardScreen);

    dom.leaderboardList.innerHTML = '';
    dom.currentUserRankDiv.innerHTML = '';
    dom.leaderboardLoader.classList.remove('hidden');

    try {
        const response = await fetch(`${API_URL}?request=leaderboard&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard data.');
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        ui.renderLeaderboard(data.leaderboard, data.currentUserRank);

    } catch (error) {
        console.error("Error loading leaderboard:", error);
        dom.leaderboardList.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
    } finally {
        dom.leaderboardLoader.classList.add('hidden');
    }
}