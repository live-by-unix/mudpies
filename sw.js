const CACHE_NAME = 'mud-pies-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './about.html',
    './how-to-play.html',
    './style.css',
    './script.js',
    './manifest.json',
    './assets/mudpie.png',
    './assets/music.mp3',
    './assets/splat.wav',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/icon-192-maskable.png',
    './assets/icon-512-maskable.png',
    './assets/screenshot-540.png',
    './assets/screenshot-1920.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(error => {
                console.log('Cache install failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return a fallback response if offline
                        console.log('Offline: Unable to fetch', event.request.url);
                    });
            })
    );
});
