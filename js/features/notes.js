// js/features/notes.js (FINAL VERSION v3.1)

import { createJsonRequest, sendPostRequest } from '../api.js';
import { showLoader, hideLoader, showToast } from '../ui.js';
import { getCurrentUser } from '../state.js';

export async function initNotes() {
    const container = document.getElementById('notes-list');
    // فحص وجود الكونتينر (مهم لتفادي الأخطاء إذا كنا في صفحة أخرى)
    if (!container) return;

    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<p class="text-center text-red-500">Please log in to view notes.</p>';
        return;
    }

    showLoader('loader'); // استخدام اللودر العام
    container.innerHTML = '';

    try {
        // جلب بيانات المستخدم التي تحتوي على الملاحظات
        const response = await createJsonRequest({ request: 'userData', userId: user.UniqueID });
        
        // دمج ملاحظات الامتحانات والمحاضرات
        if (response && (response.quizNotes || response.lectureNotes)) {
            const allNotes = [...(response.quizNotes || []), ...(response.lectureNotes || [])];
            renderNotes(allNotes);
        } else {
            container.innerHTML = '<p class="text-center text-gray-500">No notes found.</p>';
        }
    } catch (error) {
        console.error("Notes Error:", error);
        container.innerHTML = '<p class="text-center text-red-500">Failed to load notes.</p>';
    } finally {
        hideLoader('loader');
    }
}

function renderNotes(notes) {
    const container = document.getElementById('notes-list');
    container.innerHTML = '';

    if (notes.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">You haven\'t written any notes yet.</p>';
        return;
    }

    // ترتيب الملاحظات من الأحدث للأقدم
    notes.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-3';
        
        const date = new Date(note.Timestamp).toLocaleDateString();
        const type = note.QuizID ? 'Quiz Note' : 'Lecture Note';
        const typeColor = note.QuizID ? 'text-indigo-600 bg-indigo-50' : 'text-teal-600 bg-teal-50';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold px-2 py-1 rounded ${typeColor}">${type}</span>
                <span class="text-xs text-slate-400">${date}</span>
            </div>
            <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-3 text-sm">${note.NoteText}</p>
            <div class="flex justify-end">
                <button class="text-red-500 text-xs hover:underline delete-note-btn" data-id="${note.UniqueID}" data-type="${note.QuizID ? 'quiz' : 'lecture'}">
                    <i class="fas fa-trash-alt mr-1"></i> Delete
                </button>
            </div>
        `;
        
        // ربط زر الحذف
        card.querySelector('.delete-note-btn').addEventListener('click', (e) => deleteNote(e, note.UniqueID));
        container.appendChild(card);
    });
}

async function deleteNote(e, uniqueId) {
    if(!confirm('Are you sure you want to delete this note?')) return;

    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.textContent = 'Deleting...';
    
    // تحديد نوع الحدث بناءً على البيانات
    const type = btn.dataset.type === 'quiz' ? 'deleteQuizNote' : 'deleteLectureNote';

    try {
        const response = await sendPostRequest({
            eventType: type,
            uniqueId: uniqueId
        });

        if(response.success) {
            showToast('Note deleted', 'success');
            btn.closest('div.bg-white').remove(); // إزالة الكارت من الشاشة
        } else {
            showToast('Failed to delete', 'error');
            btn.innerHTML = originalText;
        }
    } catch (error) {
        console.error(error);
        showToast('Error deleting note', 'error');
        btn.innerHTML = originalText;
    }
}
