/* TADORU. Web 版：編集画面に足す部品（ホームへ戻る・共有シート）。editor.js は変更しません。 */
(function () {
    "use strict";
    if (!window.TadoruWeb) return;
    const id = new URLSearchParams(location.search).get("id");

    /* 出力ファイル（PowerPoint・Word・Excel・HTML・Markdown・動画・JSON）を、スマホでは共有シートで送れるようにする。
     * editor.js の downloadBlob() は <a download href="blob:…"> をクリックする作りなので、そのクリックを横取りします。
     * 共有シートにファイルを渡せない環境（PC の一部ブラウザ）では従来どおりダウンロードします。 */
    const MIME = { pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", html: "text/html", md: "text/markdown", json: "application/json", mp4: "video/mp4", webm: "video/webm", gif: "image/gif", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };
    let shareBusy = false;
    document.addEventListener("click", (event) => {
        const anchor = event.target instanceof HTMLAnchorElement ? event.target : null;
        if (!anchor || anchor.dataset.twFallback || !anchor.hasAttribute("download") || !anchor.href.startsWith("blob:") || !navigator.share || !navigator.canShare) return;
        if (shareBusy) return;
        event.preventDefault(); event.stopImmediatePropagation();
        const name = anchor.getAttribute("download") || "tadoru-export";
        const ext = (name.split(".").pop() || "").toLowerCase();
        shareBusy = true;
        fetch(anchor.href).then((r) => r.blob()).then(async (blob) => {
            const file = new File([blob], name, { type: MIME[ext] || blob.type || "application/octet-stream" });
            if (!navigator.canShare({ files: [file] })) throw new Error("fallback");
            await navigator.share({ files: [file], title: name });
        }).catch((error) => {
            if (error && error.name === "AbortError") return;   // 共有シートを閉じただけ
            // 共有できなければ従来のダウンロードに戻す
            const a = document.createElement("a"); a.href = anchor.href; a.download = name; a.dataset.twFallback = "1"; document.body.appendChild(a); a.click(); a.remove();
        }).finally(() => { shareBusy = false; });
    }, true);
    document.addEventListener("DOMContentLoaded", () => {
        const brand = document.querySelector(".app-header .brand");
        if (brand) {
            const home = document.createElement("a");
            home.className = "tw-home"; home.href = "index.html"; home.textContent = "‹ ガイド一覧"; home.title = "Web 版のホーム（ガイド一覧）へ戻る";
            brand.appendChild(home);
        }
        const actions = document.querySelector(".header-actions");
        if (actions && navigator.share) {
            const share = document.createElement("button");
            share.type = "button"; share.className = "tw-share"; share.textContent = "共有（JSON）";
            share.title = "このガイドを JSON にして共有シートで送ります（Teams・メール・AirDrop・OneDrive・Box など）。PC の TADORU. で「インポート」すると取り込めます";
            share.addEventListener("click", async () => {
                share.disabled = true;
                try {
                    const guideId = new URLSearchParams(location.search).get("id") || id;
                    const session = await window.TadoruWeb.getSession(guideId);
                    if (!session) throw new Error("ガイドが見つかりません");
                    const copy = JSON.parse(JSON.stringify(session));
                    copy.exportedAt = new Date().toISOString();
                    const name = `${(copy.title || "guide").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 60)}.json`;
                    const file = new File([JSON.stringify(copy)], name, { type: "application/json" });
                    if (navigator.canShare && !navigator.canShare({ files: [file] })) throw new Error("この端末ではファイルの共有に対応していません");
                    await navigator.share({ files: [file], title: copy.title || "TADORU. ガイド" });
                } catch (error) {
                    if (!(error && error.name === "AbortError")) alert((error && error.message) || "共有できませんでした");
                } finally { share.disabled = false; }
            });
            actions.insertBefore(share, actions.firstChild);
        }
    });
})();
