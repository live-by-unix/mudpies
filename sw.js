const CACHE_NAME = "mud-pies-v4";

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


// Install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .catch((error) => {
                console.error("Cache install failed:", error);
            })
    );

    self.skipWaiting();
});


// Activate
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});


// Fetch
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request, {
            redirect: "follow"
        })
        .then((response) => {

            // Don't cache redirects/errors
            if (
                !response ||
                response.status !== 200 ||
                response.type === "opaqueredirect"
            ) {
                return response;
            }

            const clone = response.clone();

            caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(event.request, clone);
                });

            return response;
        })
        .catch(() => {
            return caches.match(event.request)
                .then((cached) => {
                    return cached || caches.match("/index.html");
                });
        })
    );
});
