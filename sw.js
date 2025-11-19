// sw.js - Service Worker for Plasticology PWA
const CACHE_NAME = 'plasticology-app-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './js/login-animation.js',
  // We cache the main modules, but since they are imports, 
  // caching the entry point is usually enough for the browser to find the rest in modern PWA.
  // However, listing them explicitly ensures they are available offline.
  './js/main.js',
  './js/api.js',
  './js/dom.js',
  './js/state.js',
  './js/ui.js',
  './js/utils.js',
  './js/features/activityLog.js',
  './js/features/leaderboard.js',
  './js/features/learningMode.js',
  './js/features/lectures.js',
  './js/features/notes.js',
  './js/features/osce.js',
  './js/features/performance.js',
  './js/features/planner.js',
  './js/features/quiz.js',
  './js/features/registration.js',
  './js/features/theory.js',
  './js/features/userProfile.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Install Event: Cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. Fetch Event: Serve from Cache, fallback to Network
self.addEventListener('fetch', (event) => {
  // Ignore Google Apps Script API calls (never cache POST requests or dynamic data)
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached file if found, otherwise go to network
      return cachedResponse || fetch(event.request);
    })
  );
});
