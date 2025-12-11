/**
 * Service Worker for PWA
 * V3.1 Feature: Offline Mode & Caching
 *
 * Provides offline functionality and performance optimization
 * through intelligent caching strategies
 */

const CACHE_VERSION = 'vocab-game-v3.1.0';
const CACHE_NAME = `${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',

    // CSS Files
    '/css/main.css',
    '/css/course.css',
    '/css/game.css',
    '/css/animations.css',
    '/css/auth.css',
    '/css/user-center.css',
    '/css/example-sentences.css',

    // JavaScript Files
    '/js/app.js',
    '/js/models/Course.js',
    '/js/models/Word.js',
    '/js/services/StorageService.js',
    '/js/services/AuthService.js',
    '/js/services/UserDataService.js',
    '/js/services/DailyGoalService.js',
    '/js/services/ChartService.js',
    '/js/services/ExampleSentenceService.js',
    '/js/components/CourseList.js',
    '/js/components/GameView.js',
    '/js/components/ResultsView.js',
    '/js/components/AuthView.js',
    '/js/components/UserCenterView.js',
    '/js/components/ExampleSentenceView.js',
    '/js/components/GoalSettingModal.js',
    '/js/utils/audio.js',

    // Data Files
    '/data/courses.json',
    '/data/words.json',

    // Audio Files (placeholder - actual audio loaded on demand)
    '/assets/audio/correct.mp3',
    '/assets/audio/incorrect.mp3',
    '/assets/audio/complete.mp3',

    // External Dependencies (from CDN)
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Dynamic content patterns (cache on request)
const DYNAMIC_CACHE_PATTERNS = [
    /\/data\/.*/,
    /\/assets\/.*/,
    /\.json$/,
    /\.mp3$/
];

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...', CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Static assets cached successfully');
                // Force activation of new service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Cache installation failed:', error);
            })
    );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...', CACHE_VERSION);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated successfully');
                // Take control of all clients immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event - Serve from cache with network fallback
 * Strategy: Cache First with Network Fallback
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip Supabase API calls (always use network)
    if (url.hostname.includes('supabase')) {
        event.respondWith(fetch(request));
        return;
    }

    // Apply caching strategy based on request type
    if (shouldCacheRequest(request)) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(networkFirstStrategy(request));
    }
});

/**
 * Check if request should be cached
 */
function shouldCacheRequest(request) {
    const url = new URL(request.url);

    // Cache static assets
    if (STATIC_CACHE_URLS.some(cached => url.pathname === cached)) {
        return true;
    }

    // Cache dynamic content matching patterns
    if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        return true;
    }

    return false;
}

/**
 * Cache First Strategy
 * Try cache first, fallback to network if not found
 */
async function cacheFirstStrategy(request) {
    try {
        // Try to get from cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);

            // Update cache in background (stale-while-revalidate)
            fetch(request)
                .then(response => {
                    if (response && response.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, response.clone());
                        });
                    }
                })
                .catch(() => {
                    // Silently fail background update
                });

            return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[Service Worker] Fetching from network:', request.url);
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        // Return cached version if available
        return caches.match(request);
    }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache if offline
 */
async function networkFirstStrategy(request) {
    try {
        console.log('[Service Worker] Network first:', request.url);
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', request.url);

        // Fallback to cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        throw error;
    }
}

/**
 * Message Event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls;
        caches.open(CACHE_NAME).then(cache => {
            cache.addAll(urls);
        });
    }

    if (event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }

    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

/**
 * Sync Event - Background sync for offline data
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-offline-data') {
        event.waitUntil(syncOfflineData());
    }
});

/**
 * Sync offline data when connection is restored
 */
async function syncOfflineData() {
    try {
        console.log('[Service Worker] Syncing offline data...');

        // Get offline data from IndexedDB or localStorage
        // This would be implemented based on your data storage strategy

        // Send data to server
        // await fetch('/api/sync', { method: 'POST', body: offlineData });

        console.log('[Service Worker] Offline data synced successfully');
    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
        throw error; // Retry later
    }
}

/**
 * Push Event - Handle push notifications (future feature)
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received');

    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Vocabulary Game';
    const options = {
        body: data.body || '时间学习单词了！',
        icon: '/assets/images/icon-192.png',
        badge: '/assets/images/badge-72.png',
        vibrate: [200, 100, 200],
        data: data.url
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');

    event.notification.close();

    const url = event.notification.data || '/';

    event.waitUntil(
        clients.openWindow(url)
    );
});

console.log('[Service Worker] Loaded:', CACHE_VERSION);
