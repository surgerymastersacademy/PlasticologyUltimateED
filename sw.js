// sw.js - Service Worker for Plasticology PWA (UPDATED v2)

// Increment this version to force all users to download the new code
const CACHE_NAME = 'plasticology-app-v2'; // Changed from v1 to v2

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
  './js/features/matching.js', // Added the new file
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Install Event: Cache all static assets
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  // Tell the active service worker to take control of the page immediately.
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
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
      return cachedResponse || fetch(event.request).catch(() => {
          // Optional: Return a fallback page here if offline and file not found
      });
    })
  );
});
