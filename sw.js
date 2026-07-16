const CACHE_NAME = "mud-pies-v5";

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

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            await Promise.allSettled(
                ASSETS_TO_CACHE.map(async (asset) => {
                    try {
                        await cache.add(asset);
                    } catch (e) {
                        console.warn("Failed to cache:", asset, e);
                    }
                })
            );

            await self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            await Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );

            await self.clients.claim();
        })()
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Ignore cross-origin requests.
    if (url.origin !== self.location.origin) return;

    // Let the browser handle ALL page navigation.
    if (event.request.mode === "navigate") return;

    // Only cache static assets.
    const destination = event.request.destination;

    if (
        ![
            "script",
            "style",
            "image",
            "font",
            "audio",
            "manifest"
        ].includes(destination)
    ) {
        return;
    }

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            const cached = await cache.match(event.request);
            if (cached) return cached;

            try {
                const response = await fetch(event.request);

                if (
                    response.ok &&
                    !response.redirected &&
                    response.type !== "opaqueredirect"
                ) {
                    cache.put(event.request, response.clone());
                }

                return response;
            } catch {
                return cached || Response.error();
            }
        })()
    );
});
