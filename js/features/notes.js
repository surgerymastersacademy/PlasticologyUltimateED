// js/features/notes.js

import { appState } from '../state.js';
import * as dom from '../dom.js';
import * as ui from '../ui.js';
import { fetchUserData } from '../api.js';
import { openNoteModal } from '../main.js';
import { renderLectures } from './lectures.js';

let API_URL;
import('../state.js').then(state => { API_URL = state.API_URL; });

export async function showNotesScreen() {
    ui.showScreen(dom.notesContainer);
    appState.navigationHistory.push(showNotesScreen);
    await fetchUserData(); // Ensure we have the latest notes
    renderNotes('quizzes');
}

export function renderNotes(filter) {
    dom.notesList.innerHTML = '';
    document.querySelectorAll('#notes-container .filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`notes-filter-${filter}`).classList.add('active');

    const notesToDisplay = filter === 'quizzes' ? appState.userQuizNotes : appState.userLectureNotes;

    if (notesToDisplay.length === 0) {
        dom.notesList.innerHTML = `<p class="text-center text-slate-500">No notes found for this category.</p>`;
        return;
    }

    notesToDisplay.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'p-4 bg-white rounded-lg border border-slate-200 shadow-sm';
        let title = 'Note';
        let itemId = null;
        let noteType = '';

        if (filter === 'quizzes') {
            const question = appState.allQuestions.find(q => q.UniqueID === note.QuizID);
            title = question ? `Note on: ${question.question.substring(0, 50)}...` : 'Note on deleted question';
            itemId = note.QuizID;
            noteType = 'quiz';
        } else {
            const lecture = Object.values(appState.groupedLectures).flatMap(c => c.topics).find(t => t.id === note.LectureID);
            title = lecture ? `Note on: ${lecture.name}` : 'Note on deleted lecture';
            itemId = note.LectureID;
            noteType = 'lecture';
        }

        noteItem.innerHTML = `
            <div class="flex justify-between items-start">
                <h4 class="font-bold text-slate-700 flex-grow">${title}</h4>
                <div class="flex-shrink-0 ml-4">
                    <button class="edit-note-btn text-blue-500 hover:text-blue-700 mr-2" title="Edit Note"><i class="fas fa-edit"></i></button>
                    <button class="delete-note-btn text-red-500 hover:text-red-700" title="Delete Note"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <p class="text-slate-600 mt-2 whitespace-pre-wrap">${note.NoteText}</p>
        `;

        noteItem.querySelector('.edit-note-btn').addEventListener('click', () => {
            openNoteModal(noteType, itemId, title.replace('Note on: ', ''));
        });
        noteItem.querySelector('.delete-note-btn').addEventListener('click', () => {
            handleDeleteNote(noteType, note.UniqueID);
        });

        dom.notesList.appendChild(noteItem);
    });
}

export function handleSaveNote() {
    const { type, itemId } = appState.currentNote;
    const payload = {
        eventType: type === 'quiz' ? 'saveQuizNote' : 'saveLectureNote',
        uniqueId: `${appState.currentUser.UniqueID}_${itemId}`,
        userId: appState.currentUser.UniqueID,
        itemId: itemId,
        noteText: dom.noteTextarea.value
    };

    fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) })
        .catch(err => console.error("Failed to save note:", err));

    if (type === 'quiz') {
        const noteIndex = appState.userQuizNotes.findIndex(n => n.QuizID === itemId);
        if (noteIndex > -1) appState.userQuizNotes[noteIndex].NoteText = dom.noteTextarea.value;
        else appState.userQuizNotes.push({ UniqueID: payload.uniqueId, QuizID: itemId, NoteText: payload.noteText });
        dom.quizNoteBtn.classList.toggle('has-note', payload.noteText.length > 0);
    } else {
        const noteIndex = appState.userLectureNotes.findIndex(n => n.LectureID === itemId);
        if (noteIndex > -1) appState.userLectureNotes[noteIndex].NoteText = dom.noteTextarea.value;
        else appState.userLectureNotes.push({ UniqueID: payload.uniqueId, LectureID: itemId, NoteText: payload.noteText });
        renderLectures(dom.lectureSearchInput.value);
    }

    dom.modalBackdrop.classList.add('hidden');
    dom.noteModal.classList.add('hidden');
}

function handleDeleteNote(noteType, uniqueId) {
    ui.showConfirmationModal('Delete Note?', 'Are you sure you want to permanently delete this note?', () => {
        const payload = {
            eventType: noteType === 'quiz' ? 'deleteQuizNote' : 'deleteLectureNote',
            uniqueId
        };
        fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) })
            .catch(err => console.error("Failed to delete note:", err));
        
        if (noteType === 'quiz') {
            appState.userQuizNotes = appState.userQuizNotes.filter(n => n.UniqueID !== uniqueId);
        } else {
            appState.userLectureNotes = appState.userLectureNotes.filter(n => n.UniqueID !== uniqueId);
        }
        
        if (!dom.notesContainer.classList.contains('hidden')) {
            renderNotes(dom.notesFilterQuizzes.classList.contains('active') ? 'quizzes' : 'lectures');
        } else if (!dom.lecturesContainer.classList.contains('hidden')) {
            renderLectures(dom.lectureSearchInput.value);
        }
    });
}