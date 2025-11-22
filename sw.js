// sw.js (FINAL FIXED VERSION v4)

// Increased version to force update and fix Tailwind CORS error
const CACHE_NAME = 'plasticology-app-v13'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/login-animation.js',
  './js/main.js',
  './js/api.js',
  './js/dom.js',
  './js/state.js',
  './js/ui.js',
  './js/utils.js',
  // Features
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
  './js/features/matching.js',
  './js/features/onboarding.js',
  // External Libraries (Only cache safe static files)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
  // REMOVED: Tailwind CDN (Causes CORS error/Crash)
];

// 1. Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Event
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
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event
self.addEventListener('fetch', (event) => {
  // Ignore Google Apps Script and Tailwind
  if (event.request.url.includes('script.google.com') || event.request.url.includes('tailwindcss')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
          // Offline fallback
      });
    })
  );
});
