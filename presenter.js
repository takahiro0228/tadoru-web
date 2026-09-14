/* TADORU. – 発表者ビュー（v0.6.43）
 * スライドショー（editor.html）と BroadcastChannel でつながり、いまの手順・発表者ノート・次の手順・経過時間を表示します。
 * このウィンドウから「前へ／次へ／終了」も送れます。データはこの端末内のウィンドウ間だけでやり取りし、外部へは送りません。
 */
(function () {
    "use strict";

    const byId = (id) => document.getElementById(id);
    let channel = null;
    let startedAt = 0;
    let clockTimer = 0;

    try { channel = new BroadcastChannel("tadoru-presenter"); } catch (_error) { channel = null; }
    if (!channel) {
        byId("status").textContent = "　この環境では発表者ビューを使えません";
        return;
    }

    function pad(value) { return String(value).padStart(2, "0"); }
    function tick() {
        if (!startedAt) return;
        const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        byId("clock").textContent = h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    }

    function setImage(container, url, emptyText) {
        container.replaceChildren();
        if (url) {
            const img = document.createElement("img");
            img.src = url;
            img.alt = "";
            container.appendChild(img);
        } else {
            const none = document.createElement(container.classList.contains("slide") ? "span" : "div");
            none.className = "none";
            none.textContent = emptyText;
            container.appendChild(none);
        }
    }

    function apply(data) {
        if (!data || typeof data !== "object") return;
        if (data.type === "end") {
            byId("status").textContent = "　スライドショーは終了しました";
            startedAt = 0;
            return;
        }
        if (data.type !== "state") return;
        byId("guideTitle").textContent = data.guideTitle || "発表者ビュー";
        byId("status").textContent = data.ended ? "　最後のスライドです" : "";
        byId("currentTitle").textContent = data.title || "—";
        setImage(byId("currentSlide"), data.image, "画像なし");
        const notes = byId("notes");
        if (data.notes) { notes.textContent = data.notes; notes.classList.remove("empty"); }
        else { notes.textContent = "この手順に発表者ノートはありません。編集画面の「発表者ノート」に入力すると、ここに出ます。"; notes.classList.add("empty"); }
        const next = byId("next");
        const thumb = next.firstElementChild;
        if (thumb) {
            const holder = document.createElement("div");
            next.replaceChild(holder, thumb);
            if (data.nextImage) { const img = document.createElement("img"); img.src = data.nextImage; img.alt = ""; holder.replaceWith(img); }
            else { holder.className = "none"; holder.textContent = data.nextTitle ? "画像なし" : "最後"; }
        }
        byId("nextTitle").textContent = data.nextTitle || "（次の手順はありません）";
        byId("nextNotes").textContent = data.nextNotes || "";
        byId("counter").textContent = `${Number(data.index) + 1} / ${data.total}`;
        if (data.startedAt && data.startedAt !== startedAt) startedAt = Number(data.startedAt) || 0;
        tick();
    }

    channel.onmessage = (event) => apply(event?.data);
    document.querySelectorAll("footer button[data-nav]").forEach((button) => {
        button.addEventListener("click", () => { try { channel.postMessage({ type: "nav", action: button.dataset.nav }); } catch (_error) { /* noop */ } });
    });
    document.addEventListener("keydown", (event) => {
        const key = event.key;
        if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(key)) { event.preventDefault(); channel.postMessage({ type: "nav", action: "next" }); }
        else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(key)) { event.preventDefault(); channel.postMessage({ type: "nav", action: "prev" }); }
    });
    clockTimer = window.setInterval(tick, 1000);
    window.addEventListener("beforeunload", () => window.clearInterval(clockTimer));
    try {
        const I18N = globalThis.PrivacyGuideI18n;
        const PG = globalThis.PrivacyGuide;
        if (I18N && PG) {
            chrome.storage?.local?.get?.("pgSettings", (result) => {
                const language = PG.mergeSettings(result?.pgSettings)?.language;
                I18N.applyLanguage(I18N.resolveLanguage(language));
            });
        }
    } catch (_error) { /* 言語切替は任意 */ }
    // 開いたことを伝えて、いまの状態を送ってもらいます。
    try { channel.postMessage({ type: "ready" }); } catch (_error) { /* noop */ }
})();
