const CACHE_NAME = "mud-pies-v3";

const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/about.html",
    "/how-to-play.html",
    "/style.css",
    "/script.js",
    "/manifest.json",

    "/assets/mudpie.png",
    "/assets/music.mp3",
    "/assets/splat.wav",

    "/assets/icon-192.png",
    "/assets/icon-512.png",
    "/assets/icon-192-maskable.png",
    "/assets/icon-512-maskable.png",

    "/assets/screenshot-540.png",
    "/assets/screenshot-1920.png"
];

// Install: cache app files
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error("Cache install failed:", error);
            })
    );

    self.skipWaiting();
});


// Activate: remove old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});


// Fetch: cache first, network fallback
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((networkResponse) => {

                        // Only cache valid responses
                        if (
                            !networkResponse ||
                            networkResponse.status !== 200 ||
                            networkResponse.type === "error"
                        ) {
                            return networkResponse;
                        }

                        const responseClone = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });

                        return networkResponse;
                    });
            })
            .catch(() => {
                // Offline fallback
                return caches.match("/index.html");
            })
    );
});
