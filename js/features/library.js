// js/features/library.js (FINAL VERSION v3.1)

import { createJsonRequest } from '../api.js';
import { showLoader, hideLoader, showToast } from '../ui.js';
import { getCurrentUser } from '../state.js';

export async function initLibrary() {
    const container = document.getElementById('library-list');
    if (!container) return;

    showLoader('library-loader');
    container.innerHTML = '';

    try {
        // We use 'contentData' because books are usually loaded at startup
        // OR we can request specific 'books' if the payload is heavy.
        // Assuming books are part of the main content payload for v3.1:
        const response = await createJsonRequest({ request: 'contentData' });
        
        if (response && response.books && response.books.length > 0) {
            renderLibrary(response.books);
        } else {
            container.innerHTML = '<p class="col-span-2 text-center text-gray-500">No resources available yet.</p>';
        }
    } catch (error) {
        console.error("Library Error:", error);
        container.innerHTML = '<p class="col-span-2 text-center text-red-500">Failed to load library.</p>';
    } finally {
        hideLoader('library-loader');
    }
}

function renderLibrary(books) {
    const container = document.getElementById('library-list');
    container.innerHTML = '';

    books.forEach(book => {
        // Validate Book Data
        if (!book.BookName || !book.Link) return;

        const item = document.createElement('div');
        item.className = 'bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center hover:shadow-md transition-all group';
        
        const icon = book.Type === 'Video' ? 'fa-play-circle text-red-500' : 'fa-file-pdf text-red-500';
        
        item.innerHTML = `
            <div class="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <i class="fas ${icon} text-2xl"></i>
            </div>
            <h4 class="font-bold text-sm text-slate-800 dark:text-white mb-1 line-clamp-2">${book.BookName}</h4>
            <p class="text-xs text-slate-400 mb-3">${book.Category || 'General'}</p>
            <a href="${book.Link}" target="_blank" class="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                Open Resource
            </a>
        `;
        container.appendChild(item);
    });
}
