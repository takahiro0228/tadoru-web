/* TADORU. Web 版 ホーム（index.js）
 * ・ガイド一覧（IndexedDB）
 * ・スクリーンショット（複数画像）→ ガイド
 * ・画面収録（動画）→ 画面の切り替わりで自動分割 → ガイド（PC 版アドバンスモードの監視と同じ考え方：64×36 に縮小したフレームの差分）
 * ・JSON（バックアップ／エクスポート）の読み込み
 * すべて端末内で処理します。 */
(function () {
    "use strict";
    const W = window.TadoruWeb;
    const $ = (id) => document.getElementById(id);
    const MAX_SIDE = 1600;           // 取り込み画像の最大辺（px）。スマホのスクショはこれ以上あっても手順書には不要
    const JPEG_QUALITY = .86;
    const SAMPLE_FPS = 5;            // 動画を見る間隔（1秒に5コマ）
    const CHANGE_THRESHOLD = 9;      // capture.js と同じ
    const SETTLE_THRESHOLD = 3;
    const MIN_GAP_MS = 1800;
    const MAX_STEPS = 300;

    document.addEventListener("DOMContentLoaded", async () => {
        $("version").textContent = `v${W.VERSION}`;
        $("pickImages").addEventListener("change", (e) => createFromImages([...e.target.files]).finally(() => { e.target.value = ""; }));
        $("pickVideo").addEventListener("change", (e) => createFromVideo(e.target.files[0]).finally(() => { e.target.value = ""; }));
        $("pickJson").addEventListener("change", (e) => importJson([...e.target.files]).finally(() => { e.target.value = ""; }));
        $("search").addEventListener("input", renderList);
        await renderList();
    });

    // ---------- 一覧 ----------
    async function renderList() {
        const list = await W.listSessions();
        const q = ($("search").value || "").trim().toLowerCase();
        const shown = list.filter((s) => !q || String(s.title || "").toLowerCase().includes(q));
        $("guideCount").textContent = `${list.length} 件`;
        $("empty").hidden = list.length > 0;
        const box = $("list"); box.innerHTML = "";
        shown.forEach((s) => {
            const card = document.createElement("div"); card.className = "card";
            const title = document.createElement("a"); title.className = "title"; title.href = `editor.html?id=${encodeURIComponent(s.id)}`; title.textContent = s.title || "名称未設定のガイド";
            const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = `${s.stepCount || 0} 手順 ・ 更新 ${fmt(s.updatedAt)}`;
            const tools = document.createElement("div"); tools.className = "tools";
            const open = document.createElement("button"); open.className = "open"; open.type = "button"; open.textContent = "編集"; open.addEventListener("click", () => { location.href = title.href; });
            const del = document.createElement("button"); del.className = "danger"; del.type = "button"; del.textContent = "削除";
            del.addEventListener("click", async () => { if (!confirm(`「${s.title || "名称未設定のガイド"}」を削除しますか？\n元に戻せません。`)) return; await W.deleteSession(s.id); renderList(); });
            tools.append(open, del);
            card.append(title, meta, tools);
            box.appendChild(card);
        });
    }
    function fmt(iso) { const d = new Date(iso || 0); return Number.isNaN(d.getTime()) ? "—" : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }

    // ---------- 進捗 ----------
    function progress(ratio, text) { const p = $("progress"); p.hidden = false; $("progressBar").style.width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`; if (text) $("progressText").textContent = text; }
    function progressDone() { $("progress").hidden = true; }

    // ---------- ガイド・手順の形（拡張機能と同じ） ----------
    function newSession(title) {
        const now = new Date().toISOString();
        return { id: W.createId("guide"), title, description: "", status: "draft", createdAt: now, updatedAt: now, favorite: false, steps: [] };
    }
    function newStep(dataUrl, description, extra) {
        return Object.assign({ id: W.createId("step"), action: "capture", description: description || "", pageTitle: "", url: "", createdAt: new Date().toISOString(),
            screenshot: dataUrl, captureError: "", maskRects: [], maskApplied: true, maskBurnedIn: false, target: null, annotations: [], ocrAt: null }, extra || {});
    }
    async function finish(session) {
        if (!session.steps.length) { alert("手順を作れませんでした（画像を読み込めませんでした）"); return; }
        await W.saveSession(session);
        progressDone();
        location.href = `editor.html?id=${encodeURIComponent(session.id)}`;
    }

    // ---------- スクリーンショット → ガイド ----------
    async function createFromImages(files) {
        const images = files.filter((f) => /^image\//.test(f.type)).sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0) || a.name.localeCompare(b.name));
        if (!images.length) return;
        const session = newSession(`スクリーンショットの手順 ${dateLabel()}`);
        for (let i = 0; i < images.length && i < MAX_STEPS; i += 1) {
            progress(i / images.length, `画像を読み込んでいます… ${i + 1} / ${images.length}`);
            try { session.steps.push(newStep(await fileToDataUrl(images[i]), "")); } catch (_e) { /* 読めない画像は飛ばす */ }
        }
        await finish(session);
    }
    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file); const img = new Image();
            img.onload = () => { try { resolve(shrink(img, img.naturalWidth, img.naturalHeight)); } catch (e) { reject(e); } finally { URL.revokeObjectURL(url); } };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("画像を読み込めません")); };
            img.src = url;
        });
    }
    function shrink(source, w, h) {
        const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
        const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
        const x = c.getContext("2d", { alpha: false }); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(source, 0, 0, c.width, c.height);
        return c.toDataURL("image/jpeg", JPEG_QUALITY);
    }

    // ---------- 画面収録（動画） → 自動分割 → ガイド ----------
    async function createFromVideo(file) {
        if (!file) return;
        const video = $("probe"); const url = URL.createObjectURL(file);
        try {
            progress(0, "動画を読み込んでいます…");
            await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = () => reject(new Error("この動画は再生できません（形式非対応）")); video.src = url; });
            let duration = video.duration;
            if (!Number.isFinite(duration)) {
                // 画面収録アプリの一部（WebM）は長さの情報を持たないため、末尾へ飛ばして実際の長さを測る
                await new Promise((resolve) => { const done = () => { video.ondurationchange = null; resolve(); }; video.ondurationchange = () => { if (Number.isFinite(video.duration)) done(); }; video.currentTime = 1e101; setTimeout(done, 4000); });
                duration = video.duration;
            }
            if (!Number.isFinite(duration) || duration <= 0) throw new Error("動画の長さを取得できません");
            const session = newSession(`画面収録の手順 ${dateLabel()}`);
            const small = document.createElement("canvas"); small.width = 64; small.height = 36; const sctx = small.getContext("2d", { alpha: false, willReadFrequently: true });
            const thumb = () => { sctx.drawImage(video, 0, 0, 64, 36); return sctx.getImageData(0, 0, 64, 36).data; };
            const diff = (a, b) => { if (!a || !b) return 0; let t = 0; for (let i = 0; i < a.length; i += 4) t += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return t / (a.length / 4); };
            const seek = (t) => new Promise((resolve) => { video.onseeked = () => resolve(); video.currentTime = Math.min(duration - .01, Math.max(0, t)); });
            const step = 1 / SAMPLE_FPS;
            let baseline = null, changing = false, lastStepAt = -Infinity, prev = null;
            // 最初のコマは必ず手順にする
            await seek(0.05); baseline = thumb(); session.steps.push(newStep(shrink(video, video.videoWidth, video.videoHeight), "", { videoTime: 0 })); lastStepAt = 0;
            for (let t = step; t < duration; t += step) {
                progress(t / duration, `画面の切り替わりを探しています… ${Math.round(t)} / ${Math.round(duration)} 秒　${session.steps.length} 手順`);
                await seek(t); const cur = thumb();
                const score = diff(baseline, cur);
                if (!changing) { if (score >= CHANGE_THRESHOLD) changing = true; }
                else {
                    const settle = diff(prev, cur);
                    if (settle <= SETTLE_THRESHOLD && (t - lastStepAt) * 1000 >= MIN_GAP_MS) {
                        // 落ち着いた画面を1手順として保存し、基準を更新
                        session.steps.push(newStep(shrink(video, video.videoWidth, video.videoHeight), "", { videoTime: Math.round(t * 10) / 10 }));
                        baseline = cur; changing = false; lastStepAt = t;
                        if (session.steps.length >= MAX_STEPS) break;
                    }
                }
                prev = cur;
            }
            await finish(session);
        } catch (error) { progressDone(); alert((error && error.message) || "動画を読み込めませんでした"); }
        finally { video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); }
    }

    // ---------- JSON 読み込み ----------
    async function importJson(files) {
        let guides = [];
        for (const f of files) {
            try {
                const data = JSON.parse(await f.text());
                if (Array.isArray(data)) guides.push(...data);
                else if (data && Array.isArray(data.sessions)) guides.push(...data.sessions);
                else if (data && Array.isArray(data.guides)) guides.push(...data.guides);
                else if (data && Array.isArray(data.steps)) guides.push(data);
            } catch (_e) { /* 壊れたファイルは飛ばす */ }
        }
        if (!guides.length) { alert("読み込めるガイドが見つかりませんでした"); return; }
        const r = await W.importSessions(guides);
        alert(`読み込み ${r.imported} 件／同じガイドを読み飛ばし ${r.skipped} 件／失敗 ${r.failed} 件`);
        renderList();
    }
    function dateLabel() { const d = new Date(); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
})();
