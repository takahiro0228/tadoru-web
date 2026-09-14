/*
 * TADORU. Web 版 — chrome.* API の代替（web-shim.js）
 * 拡張機能の編集画面（editor.js）・詳細設定（options.js）・発表者ビューを、そのままブラウザ上で動かすための層です。
 * ・保存先：IndexedDB（データベース "tadoru-web"、ストア "kv"）。chrome.storage.local と同じ「キー→値」で保存します
 * ・メッセージ：background.js の PG_* のうち、記録に関係しないものを同じ返り値の形で実装します
 * ・記録系（PG_START／PG_RESUME／PG_RETAKE_START など）は「Web 版では使えません」というエラーを返します
 * 通信・ログイン・外部送信は一切ありません。
 */
(function (root) {
    "use strict";
    if (root.chrome && root.chrome.runtime && root.chrome.runtime.id) return; // 拡張機能内では何もしない

    const DB_NAME = "tadoru-web";
    const STORE = "kv";
    const INDEX_KEY = "pg_sessions_index";
    const SETTINGS_KEY = "pg_settings";
    const sessionKey = (id) => `pg_session_${id}`;
    const VERSION = "0.7.25-web.1";

    let dbPromise = null;
    function openDb() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error || new Error("IndexedDB を開けません"));
        });
        return dbPromise;
    }
    function tx(mode, run) {
        return openDb().then((db) => new Promise((resolve, reject) => {
            const t = db.transaction(STORE, mode);
            const store = t.objectStore(STORE);
            let out;
            try { out = run(store); } catch (error) { reject(error); return; }
            t.oncomplete = () => resolve(out && typeof out.then === "function" ? out : (out && "result" in out ? out.result : out));
            t.onerror = () => reject(t.error || new Error("IndexedDB の処理に失敗しました"));
            t.onabort = () => reject(t.error || new Error("IndexedDB の処理が中断されました"));
        }));
    }
    const kv = {
        async get(keys) {
            const list = keys == null ? null : (Array.isArray(keys) ? keys : (typeof keys === "object" ? Object.keys(keys) : [keys]));
            const db = await openDb();
            return new Promise((resolve, reject) => {
                const t = db.transaction(STORE, "readonly"); const store = t.objectStore(STORE); const out = {};
                if (list === null) {
                    const req = store.openCursor();
                    req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } };
                } else {
                    list.forEach((k) => { const req = store.get(k); req.onsuccess = () => { if (req.result !== undefined) out[k] = req.result; }; });
                }
                t.oncomplete = () => resolve(out); t.onerror = () => reject(t.error);
            });
        },
        set(items) { return tx("readwrite", (store) => { Object.keys(items || {}).forEach((k) => store.put(items[k], k)); }); },
        remove(keys) { const list = Array.isArray(keys) ? keys : [keys]; return tx("readwrite", (store) => { list.forEach((k) => store.delete(k)); }); },
        async getKeys() { const all = await kv.get(null); return Object.keys(all); }
    };

    // ---- セッション（ガイド）の保存。background.js と同じ形 ----
    const PGS = () => root.PrivacyGuideShared || root.PG || {};
    const cleanText = (t, n) => (PGS().cleanText ? PGS().cleanText(t, n) : String(t || "").slice(0, n));
    function indexEntryOf(session) {
        return { id: session.id, title: cleanText(session.title, 160) || "名称未設定のガイド", stepCount: Array.isArray(session.steps) ? session.steps.length : 0,
            createdAt: session.createdAt, updatedAt: session.updatedAt, status: session.status || "draft", favorite: Boolean(session.favorite) };
    }
    async function listSessions() { const r = await kv.get(INDEX_KEY); return Array.isArray(r[INDEX_KEY]) ? r[INDEX_KEY] : []; }
    async function getSession(id) { if (!id) return null; const r = await kv.get(sessionKey(id)); return r[sessionKey(id)] || null; }
    async function saveSession(session, keepUpdatedAt) {
        if (!session || !session.id) throw new Error("セッションIDがありません");
        if (!keepUpdatedAt) session.updatedAt = new Date().toISOString();
        if (!session.createdAt) session.createdAt = session.updatedAt;
        const index = await listSessions();
        await kv.set({ [sessionKey(session.id)]: session, [INDEX_KEY]: [indexEntryOf(session), ...index.filter((e) => e && e.id !== session.id)] });
        return session;
    }
    async function deleteSession(id) {
        if (!id) return false;
        const index = await listSessions();
        await kv.remove(sessionKey(id));
        await kv.set({ [INDEX_KEY]: index.filter((e) => e && e.id !== id) });
        return true;
    }
    async function toggleFavorite(id) {
        const session = await getSession(id); if (!session) return false;
        session.favorite = !session.favorite; await saveSession(session, true); return session.favorite;
    }
    async function duplicateSession(id) {
        const session = await getSession(id); if (!session) throw new Error("ガイドが見つかりません");
        const copy = JSON.parse(JSON.stringify(session));
        copy.id = createId("guide"); copy.title = `${cleanText(session.title, 140) || "名称未設定のガイド"}（コピー）`;
        copy.createdAt = new Date().toISOString(); copy.favorite = false;
        await saveSession(copy); return copy.id;
    }
    async function importSessions(list) {
        const result = { imported: 0, skipped: 0, failed: 0 };
        const guides = Array.isArray(list) ? list : [list];
        const index = await listSessions(); const known = new Set(index.map((e) => e && e.id));
        for (const guide of guides) {
            try {
                if (!guide || !Array.isArray(guide.steps)) { result.failed += 1; continue; }
                if (guide.id && known.has(guide.id)) { result.skipped += 1; continue; }
                if (!guide.id) guide.id = createId("guide");
                if (!guide.updatedAt) guide.updatedAt = new Date().toISOString();
                await saveSession(guide, true); known.add(guide.id); result.imported += 1;
            } catch (_error) { result.failed += 1; }
        }
        return result;
    }
    function createId(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
    async function getSettings() {
        const r = await kv.get(SETTINGS_KEY);
        const merge = PGS().mergeSettings;
        return merge ? merge(r[SETTINGS_KEY] || {}) : (r[SETTINGS_KEY] || {});
    }
    async function saveSettings(settings) {
        const merge = PGS().mergeSettings; const merged = merge ? merge(settings || {}) : (settings || {});
        await kv.set({ [SETTINGS_KEY]: merged }); return merged;
    }

    const RECORDING_ONLY = "Web 版では記録機能は使えません。スマホでは画面収録やスクリーンショットを「取り込み」から読み込んでください";
    async function handle(message) {
        const type = message && message.type;
        switch (type) {
            case "PG_PING": return { ok: true, version: VERSION };
            case "PG_GET_SETTINGS": return { settings: await getSettings() };
            case "PG_SAVE_SETTINGS": return { settings: await saveSettings(message.settings) };
            case "PG_LIST_SESSIONS": return { sessions: await listSessions() };
            case "PG_GET_SESSION": return { session: await getSession(message.id) };
            case "PG_SAVE_SESSION": return { session: await saveSession(message.session) };
            case "PG_DELETE_SESSION": return { deleted: await deleteSession(message.id) };
            case "PG_TOGGLE_FAVORITE": return { favorite: await toggleFavorite(message.id) };
            case "PG_DUPLICATE_SESSION": return { id: await duplicateSession(message.id) };
            case "PG_IMPORT_SESSIONS": return await importSessions(message.sessions);
            case "PG_GET_STATE": return { isRecording: false, sessionId: null, retake: null, lastCaptureError: "", shortcuts: { toggle: "—", capture: "—", undo: "—" }, settings: await getSettings(), web: true };
            case "PG_GET_SHORTCUTS": return { shortcuts: { toggle: "Web 版では未対応", capture: "Web 版では未対応", undo: "Web 版では未対応" } };
            case "PG_DIAGNOSTICS": {
                const index = await listSessions();
                const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
                return { text: [`TADORU. Web 版 ${VERSION}`, `UA: ${navigator.userAgent}`, `ガイド数: ${index.length}`, est ? `保存領域: ${Math.round((est.usage || 0) / 1048576)} MB / ${Math.round((est.quota || 0) / 1048576)} MB` : "", `standalone: ${matchMedia("(display-mode: standalone)").matches}`].filter(Boolean).join("\n") };
            }
            case "PG_LOG": return { ok: true };
            case "PG_START": case "PG_STOP": case "PG_RESUME": case "PG_RETAKE_START": case "PG_RETAKE_CANCEL": case "PG_CAPTURE_NOW": case "PG_UNDO_LAST_STEP":
                return { error: RECORDING_ONLY };
            default: return { error: `Web 版では未対応のメッセージです: ${type}` };
        }
    }

    const base = new URL(".", location.href).href;
    root.chrome = {
        runtime: {
            sendMessage: (message) => handle(message).catch((error) => ({ error: (error && error.message) || String(error) })),
            getURL: (path) => new URL(String(path || "").replace(/^\//, ""), base).href,
            getManifest: () => ({ version: VERSION, name: "TADORU. Web" }),
            openOptionsPage: () => { root.open("options.html", "_blank"); },
            onMessage: { addListener() {}, removeListener() {} },
            lastError: null
        },
        storage: { local: kv, session: kv, onChanged: { addListener() {}, removeListener() {} } },
        tabs: {
            create: async (opts) => { if (opts && opts.url) root.open(opts.url, "_blank"); return {}; },
            remove: async () => { root.close(); },
            query: async () => [],
            onActivated: { addListener() {} }, onUpdated: { addListener() {} }, onRemoved: { addListener() {} }
        },
        commands: { getAll: async () => [] },
        i18n: { getUILanguage: () => navigator.language || "ja" }
    };

    // Web 版専用の道具（index.js から使う）
    root.TadoruWeb = { kv, listSessions, getSession, saveSession, deleteSession, importSessions, createId, getSettings, VERSION };

    // Service Worker の登録（オフライン動作・ホーム画面追加）
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
        root.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
    }
})(typeof globalThis !== "undefined" ? globalThis : this);
