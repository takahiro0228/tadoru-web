/* TADORU. Web 版 Service Worker：アプリ本体（HTML/JS/CSS/OCR部品）を端末に保存し、オフラインでも開けるようにします。
 * 外部への通信は行いません（同じフォルダのファイルだけを扱います）。 */
const VERSION = "tadoru-web-0.7.25-web.2";
const FILES = [
"editor.css",
"editor.html",
"editor.js",
"i18n.js",
"icons/icon.svg",
"icons/icon128.png",
"icons/icon16.png",
"icons/icon32.png",
"icons/icon48.png",
"index.css",
"index.html",
"index.js",
"manifest.webmanifest",
"ocr.js",
"ocr/LICENSE-tesseract.js.md",
"ocr/core/LICENSE-tesseract.js-core.txt",
"ocr/core/tesseract-core-relaxedsimd-lstm.wasm.js",
"ocr/core/tesseract-core-simd-lstm.wasm.js",
"ocr/lang/LICENSE-tessdata_fast.txt",
"ocr/lang/eng.traineddata",
"ocr/lang/jpn.traineddata",
"ocr/tesseract.min.js",
"ocr/worker-quiet.js",
"ocr/worker.min.js",
"options.css",
"options.html",
"options.js",
"pptx.js",
"presenter.html",
"presenter.js",
"shared.js",
"video.js",
"video/LICENSE-gifenc.md",
"video/LICENSE-mp4-muxer.txt",
"video/LICENSE-webm-muxer.txt",
"video/gifenc-after.js",
"video/gifenc-before.js",
"video/gifenc.js",
"video/mp4-muxer.js",
"video/webm-muxer.js",
"web-editor.js",
"web-shim.js",
"web.css"
];
self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(VERSION).then((cache) => Promise.allSettled(FILES.map((f) => cache.add(new Request(f, { cache: "reload" }))))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;
    event.respondWith(caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(event.request, copy)); }
        return res;
    })));
});
