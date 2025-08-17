// js/features/lectures.js

// This module handles the logic for the lectures screen,
// including rendering, searching, and progress tracking.

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { logUserActivity } from '../api.js';
import { startChapterQuiz } from './quiz.js';
// Note: openNoteModal would need to be handled more globally, maybe in main.js
// For now, this dependency is assumed to be available.
import { openNoteModal } from '../main.js';

/**
 * Saves user progress (viewed lectures, bookmarks) to localStorage.
 */
export function saveUserProgress() {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
    localStorage.setItem(`viewedLectures_${appState.currentUser.UniqueID}`, JSON.stringify(Array.from(appState.viewedLectures)));
    localStorage.setItem(`bookmarkedQuestions_${appState.currentUser.UniqueID}`, JSON.stringify(Array.from(appState.bookmarkedQuestions)));
}

/**
 * Toggles the "viewed" status of a lecture.
 * @param {string} lectureLink - The unique link for the lecture.
 * @param {string} lectureName - The name of the lecture for logging.
 */
function toggleLectureViewed(lectureLink, lectureName) {
    if (appState.viewedLectures.has(lectureLink)) {
        appState.viewedLectures.delete(lectureLink);
    } else {
        appState.viewedLectures.add(lectureLink);
        logUserActivity({
            eventType: 'ViewLecture',
            lectureName: lectureName
        });
    }
    saveUserProgress();
    renderLectures(dom.lectureSearchInput.value);
}

/**
 * Renders the list of lectures, grouped by chapters.
 * @param {string} filterText - The search term to filter lectures.
 */
export function renderLectures(filterText = '') {
    dom.lecturesList.innerHTML = '';
    const lowerCaseFilter = filterText.toLowerCase();
    const chapterNames = Object.keys(appState.groupedLectures).sort();
    let chaptersFound = 0;

    if (Object.keys(appState.groupedLectures).length === 0) {
        dom.lecturesLoader.classList.remove('hidden');
        return;
    }
    dom.lecturesLoader.classList.add('hidden');

    chapterNames.forEach(chapterName => {
        const chapterData = appState.groupedLectures[chapterName];
        const isChapterMatch = chapterName.toLowerCase().includes(lowerCaseFilter);
        const isTopicMatch = chapterData.topics.some(topic => topic.name.toLowerCase().includes(lowerCaseFilter));
        if (filterText && !isChapterMatch && !isTopicMatch) return;
        chaptersFound++;
        const details = document.createElement('details');
        details.className = 'bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm';
        details.open = !!filterText;
        const summary = document.createElement('summary');
        summary.className = 'p-4 cursor-pointer hover:bg-slate-50';

        const totalTopics = chapterData.topics.length;
        const viewedTopics = chapterData.topics.filter(topic => appState.viewedLectures.has(topic.link)).length;
        const progressPercentage = totalTopics > 0 ? (viewedTopics / totalTopics) * 100 : 0;

        summary.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="flex items-center font-bold text-slate-800 text-lg">
                    <i class="${chapterData.icon || 'fas fa-layer-group'} mr-3 text-cyan-600 w-5 text-center"></i>
                    ${chapterName}
                </span>
                <div class="flex items-center gap-4">
                    <i class="fas fa-chevron-down transition-transform duration-300 text-slate-500"></i>
                </div>
            </div>
            <div class="mt-2 flex items-center gap-2">
                <div class="w-full bg-slate-200 rounded-full h-2.5">
                    <div class="bg-cyan-600 h-2.5 rounded-full" style="width: ${progressPercentage}%"></div>
                </div>
                <span class="text-xs font-semibold text-slate-500">${viewedTopics}/${totalTopics}</span>
            </div>
        `;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'p-4 bg-slate-50 border-t border-slate-200';
        const topicList = document.createElement('ul');
        topicList.className = 'space-y-2';
        chapterData.topics.forEach(topic => {
            const listItem = document.createElement('li');
            listItem.className = 'flex items-center justify-between p-3 rounded-md hover:bg-blue-100 transition-colors group';
            const isViewed = appState.viewedLectures.has(topic.link);
            if (isViewed) listItem.classList.add('lecture-viewed');

            const controls = document.createElement('div');
            controls.className = 'flex items-center gap-3';
            const icon = document.createElement('i');
            icon.className = `fas ${isViewed ? 'fa-check-circle' : 'fa-play-circle'} mr-3 text-blue-500 view-toggle-icon`;
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleLectureViewed(topic.link, topic.name);
            });
            const noteIcon = document.createElement('i');
            const hasNote = appState.userLectureNotes.some(note => note.LectureID === topic.id);
            noteIcon.className = `fas fa-sticky-note text-slate-400 hover:text-amber-500 note-icon ${hasNote ? 'has-note' : ''}`;
            noteIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openNoteModal('lecture', topic.id, topic.name);
            });
            controls.appendChild(icon);
            controls.appendChild(noteIcon);

            const content = document.createElement('div');
            content.className = "flex-grow";
            const link = document.createElement('a');
            link.href = topic.link;
            link.target = '_blank';
            link.className = "lecture-name text-slate-800 font-medium";
            link.textContent = topic.name;
            content.appendChild(link);
            listItem.appendChild(controls);
            listItem.appendChild(content);
            topicList.appendChild(listItem);
        });
        contentDiv.appendChild(topicList);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3';
        const relevantQuestions = appState.allQuestions.filter(q => q.chapter.trim().toLowerCase() === chapterName.trim().toLowerCase());
        if (relevantQuestions.length > 0) {
            const quizButton = document.createElement('button');
            quizButton.className = 'w-full action-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2';
            quizButton.innerHTML = `<i class="fas fa-pencil-alt"></i> Test Chapter (${relevantQuestions.length} Qs)`;
            quizButton.addEventListener('click', () => startChapterQuiz(chapterName, relevantQuestions));
            actionsDiv.appendChild(quizButton);
        }
        if (chapterData.mock && chapterData.mock.link) {
            const mockButton = document.createElement('a');
            mockButton.href = chapterData.mock.link;
            mockButton.target = '_blank';
            mockButton.className = 'w-full action-btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2';
            mockButton.innerHTML = `<i class="fas fa-vial"></i> ${chapterData.mock.name}`;
            actionsDiv.appendChild(mockButton);
        }
        if (actionsDiv.hasChildNodes()) {
            contentDiv.appendChild(actionsDiv);
        }

        details.appendChild(summary);
        details.appendChild(contentDiv);
        dom.lecturesList.appendChild(details);
    });

    if (chaptersFound === 0) {
        dom.lecturesList.innerHTML = `<p class="text-center text-slate-500">No lectures found matching your search.</p>`;
    }
}

/**
 * Fetches and displays the last user activity on the main menu.
 */
export async function fetchAndShowLastActivity() {
    if (!appState.currentUser || appState.currentUser.Role === 'Guest' || appState.fullActivityLog.length === 0) {
        dom.lastLectureRibbon.classList.add('hidden');
        dom.lastQuizRibbon.classList.add('hidden');
        return;
    }

    const lastLecture = appState.fullActivityLog.find(log => log.eventType === 'ViewLecture');
    const lastQuiz = appState.fullActivityLog.find(log => log.eventType === 'FinishQuiz');

    if (lastLecture) {
        dom.lastLectureRibbon.innerHTML = `<i class="fas fa-video mr-2"></i> Last Lecture Viewed: <strong>${lastLecture.title}</strong>`;
        dom.lastLectureRibbon.classList.remove('hidden');
    }
    if (lastQuiz) {
        dom.lastQuizRibbon.innerHTML = `<i class="fas fa-check-double mr-2"></i> Last Quiz: <strong>${lastQuiz.title}</strong> (Score: ${lastQuiz.score}/${lastQuiz.total})`;
        dom.lastQuizRibbon.classList.remove('hidden');
    }
}