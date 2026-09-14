/* TADORU. – 操作の動画（疑似動画）の生成（v0.7.14）
 * 手順の静止画（注釈・マスク焼き込み済み）から、「カーソルが操作位置まで動いてクリック → 次の画面へ切り替わる」動画を作ります。
 * 画面録画ではないので、入力中の文字やスクロールで一瞬写る情報は含まれず、マスクは手順の画像のまま効きます。
 *
 * 出力：GIF（同梱 gifenc）／WebM（Chrome の WebCodecs＋同梱 webm-muxer）／MP4（WebCodecs H.264＋同梱 mp4-muxer）。
 * WebCodecs が使えない・H.264 が使えないときは、順に WebM → MediaRecorder（リアルタイム録画）へ落とします。
 * どの方式も端末の中だけで動き、外部へは何も送りません。
 *
 * 使い方：
 *   PrivacyGuideVideo.build({
 *       items: [{ render: async () => canvas, description: "1. 「保存」をクリックします", cursor: { x: 0.52, y: 0.31 } | null, sameScreen: false }],
 *       // sameScreen: true ＝直前の項目と同じ画面（同じ手順の2つ目以降の操作手順番号）。画面の切り替えと「読む時間」を省き、カーソル移動→クリックだけを続けます（v0.7.21）
 *       format: "gif" | "webm" | "mp4",
 *       caption: "band" | "overlay" | "none",
 *       speed: 1,          // 0.75＝ゆっくり／1.5＝速い
 *       maxWidth: 1280,    // 出力の最大幅（px）
 *       font: "Yu Gothic",
 *       onProgress: (done, total, label) => {}
 *   }) → { blob, mime, ext, width, height, durationMs, poster: Blob(JPEG), frames, actualFormat, note }
 */
(function (root) {
    "use strict";

    const FPS = 20;                       // 動きのある区間のフレームレート
    const CURSOR_COLOR = "#111111";
    const RIPPLE_COLOR = "#D92D20";
    const BAND_COLOR = "#1b1b1b";

    /** 区間の長さ（ミリ秒・speed=1 のとき） */
    const TIMING = Object.freeze({
        holdBase: 700,        // 画面を見せる（最低）
        holdPerChar: 45,      // 説明文1文字あたり足す時間
        holdMax: 2600,        // 見せる時間の上限
        move: 650,            // カーソルの移動
        click: 350,           // クリックの波紋
        fade: 320,            // 次の画面へのクロスフェード
        last: 1800,           // 最後の手順を見せる時間
        between: 260          // 同じ画面で次の番号へ移る前の間（帯の番号が変わったのを見せる・v0.7.21）
    });

    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
    function easeInOut(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    /** 出力の大きさ（偶数に丸めます。H.264 は幅・高さが奇数だと失敗します） */
    function even(value) { return Math.max(2, Math.round(value / 2) * 2); }

    /** 説明文の帯の高さ */
    function bandHeight(width, captionMode) {
        if (captionMode === "none") return 0;
        return even(clamp(Math.round(width * .075), 44, 120));
    }

    /** 1フレームぶんのキャンバス（画面＋帯）を描く道具 */
    function createStage(width, height, captionMode, font) {
        const band = bandHeight(width, captionMode);
        const frameH = even(captionMode === "band" ? height + band : height);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = frameH;
        const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
        const fontStack = `"${String(font || "Yu Gothic").replace(/"/g, "")}", "Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif`;

        function drawScreen(source, alpha) {
            if (!source) return;
            context.save();
            context.globalAlpha = clamp(alpha ?? 1, 0, 1);
            context.drawImage(source, 0, 0, source.width, source.height, 0, 0, width, height);
            context.restore();
        }
        function drawCaption(text) {
            if (captionMode === "none" || !text) return;
            const h = band;
            const y = captionMode === "band" ? height : height - h;
            context.save();
            context.fillStyle = captionMode === "band" ? BAND_COLOR : "rgba(20,20,20,.82)";
            context.fillRect(0, y, width, h);
            const size = Math.round(h * .42);
            context.font = `700 ${size}px ${fontStack}`;
            context.fillStyle = "#ffffff";
            context.textBaseline = "middle";
            const pad = Math.round(h * .5);
            let label = String(text);
            const maxW = width - pad * 2;
            if (context.measureText(label).width > maxW) {
                while (label.length > 1 && context.measureText(`${label}…`).width > maxW) label = label.slice(0, -1);
                label = `${label}…`;
            }
            context.fillText(label, pad, y + h / 2);
            context.restore();
        }
        function drawCursor(x, y) {
            // 標準的な矢印カーソル。先端が (x, y)。大きさは幅 1280px で約 24px
            const s = clamp(width / 1280, .6, 1.6) * 1.35;
            context.save();
            context.translate(x, y);
            context.scale(s, s);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, 17);
            context.lineTo(4.2, 13.2);
            context.lineTo(7.2, 19.6);
            context.lineTo(9.6, 18.5);
            context.lineTo(6.7, 12.2);
            context.lineTo(12.2, 12.2);
            context.closePath();
            context.fillStyle = "#ffffff";
            context.strokeStyle = CURSOR_COLOR;
            context.lineWidth = 1.4;
            context.lineJoin = "round";
            context.shadowColor = "rgba(0,0,0,.35)";
            context.shadowBlur = 3;
            context.shadowOffsetX = 1;
            context.shadowOffsetY = 1;
            context.fill();
            context.shadowColor = "transparent";
            context.stroke();
            context.restore();
        }
        function drawRipple(x, y, t) {
            // t: 0→1。円が広がりながら薄くなります
            const r = Math.max(6, width * .035) * (0.25 + t * .75);
            context.save();
            context.globalAlpha = (1 - t) * .9;
            context.strokeStyle = RIPPLE_COLOR;
            context.lineWidth = Math.max(2, width / 400);
            context.beginPath();
            context.arc(x, y, r, 0, Math.PI * 2);
            context.stroke();
            context.globalAlpha = (1 - t) * .25;
            context.fillStyle = RIPPLE_COLOR;
            context.fill();
            context.restore();
        }
        function clear() {
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, frameH);
        }
        return { canvas, context, width, height: frameH, screenHeight: height, band, drawScreen, drawCaption, drawCursor, drawRipple, clear };
    }

    /**
     * 手順の画像を出力サイズに合わせて縮小したコピーを作ります（毎フレーム大きな画像を描かないため）。
     * 大きさが違う画像は幅に合わせ、余った上下は白にします。
     */
    function fitScreen(source, width, height) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        const scale = Math.min(width / source.width, height / source.height);
        const w = Math.round(source.width * scale);
        const h = Math.round(source.height * scale);
        context.drawImage(source, Math.round((width - w) / 2), Math.round((height - h) / 2), w, h);
        return { canvas, offsetX: Math.round((width - w) / 2), offsetY: Math.round((height - h) / 2), w, h };
    }

    /**
     * フレームを順に作って sink に渡します（メモリに全フレームを溜めません）。
     * sink(canvas, durationMs) は同期でも Promise でも構いません。
     */
    async function produceFrames(items, options, sink) {
        const speed = clamp(Number(options.speed) || 1, .4, 3);
        const scaleMs = (ms) => Math.max(30, Math.round(ms / speed));
        const first = await items[0].render();
        if (!first) throw new Error("最初の手順の画像を作れませんでした");
        const maxWidth = even(clamp(Number(options.maxWidth) || 1280, 320, 1920));
        const width = even(Math.min(maxWidth, first.width));
        const height = even(Math.round(first.height * (width / first.width)));
        const stage = createStage(width, height, options.caption || "band", options.font);
        const frameMs = Math.round(1000 / FPS);
        const total = items.length;
        let emitted = 0;
        let durationMs = 0;

        let current = fitScreen(first, width, height);
        let cursor = { x: width * .5, y: height * .5 };   // 最初のカーソル位置（中央）
        let poster = null;   // 最初のフレームの複製（PowerPoint のポスター画像などに）
        const emit = async (ms) => {
            if (!poster) {
                poster = document.createElement("canvas");
                poster.width = stage.canvas.width; poster.height = stage.canvas.height;
                poster.getContext("2d", { alpha: false }).drawImage(stage.canvas, 0, 0);
            }
            durationMs += ms; emitted += 1;
            await sink(stage.canvas, ms);
        };

        for (let index = 0; index < total; index += 1) {
            const item = items[index];
            const nextItem = index + 1 < total ? items[index + 1] : null;
            const caption = item.description || "";
            const target = item.cursor && Number.isFinite(item.cursor.x) && Number.isFinite(item.cursor.y)
                ? { x: current.offsetX + clamp(item.cursor.x, 0, 1) * current.w, y: current.offsetY + clamp(item.cursor.y, 0, 1) * current.h }
                : null;
            options.onProgress?.(index, total, caption);

            // 1) 画面を見せる（説明文を読む時間）。同じ画面の2つ目以降の番号（sameScreen）は説明文を既に読んでいるので短い間だけ置きます（v0.7.21）
            const hold = item.sameScreen
                ? TIMING.between
                : index === total - 1 && !target
                    ? TIMING.last
                    : clamp(TIMING.holdBase + caption.length * TIMING.holdPerChar, TIMING.holdBase, TIMING.holdMax);
            stage.clear();
            stage.drawScreen(current.canvas, 1);
            stage.drawCaption(caption);
            stage.drawCursor(cursor.x, cursor.y);
            await emit(scaleMs(hold));

            if (target) {
                // 2) カーソルが操作位置へ動く
                const moveFrames = Math.max(2, Math.round(scaleMs(TIMING.move) / frameMs));
                const from = { ...cursor };
                for (let f = 1; f <= moveFrames; f += 1) {
                    const t = easeInOut(f / moveFrames);
                    cursor = { x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t };
                    stage.clear();
                    stage.drawScreen(current.canvas, 1);
                    stage.drawCaption(caption);
                    stage.drawCursor(cursor.x, cursor.y);
                    await emit(frameMs);
                }
                // 3) クリックの波紋
                const clickFrames = Math.max(2, Math.round(scaleMs(TIMING.click) / frameMs));
                for (let f = 1; f <= clickFrames; f += 1) {
                    stage.clear();
                    stage.drawScreen(current.canvas, 1);
                    stage.drawRipple(target.x, target.y, f / clickFrames);
                    stage.drawCaption(caption);
                    stage.drawCursor(cursor.x, cursor.y);
                    await emit(frameMs);
                }
                if (index === total - 1) {
                    // 最後の手順：押した後の画面をしばらく見せる
                    stage.clear();
                    stage.drawScreen(current.canvas, 1);
                    stage.drawCaption(caption);
                    stage.drawCursor(cursor.x, cursor.y);
                    await emit(scaleMs(TIMING.last));
                }
            }

            // 4) 次の画面へクロスフェード。次が同じ画面（sameScreen）なら画面は変えず、カーソルだけ続けて動かします（v0.7.21）
            if (nextItem && nextItem.sameScreen) continue;
            if (nextItem) {
                const nextSource = await nextItem.render();
                const next = nextSource ? fitScreen(nextSource, width, height) : current;
                if (nextSource) {
                    const fadeFrames = Math.max(2, Math.round(scaleMs(TIMING.fade) / frameMs));
                    for (let f = 1; f <= fadeFrames; f += 1) {
                        const t = f / fadeFrames;
                        stage.clear();
                        stage.drawScreen(current.canvas, 1);
                        stage.drawScreen(next.canvas, t);
                        stage.drawCaption(t < .5 ? caption : (nextItem.description || ""));
                        stage.drawCursor(cursor.x, cursor.y);
                        await emit(frameMs);
                    }
                }
                current = next;
            }
        }
        options.onProgress?.(total, total, "");
        return { width: stage.width, height: stage.height, frames: emitted, durationMs, poster };
    }

    /** JPEG の Blob（PowerPoint のポスター画像などに） */
    function canvasToBlob(canvas, type, quality) {
        return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));
    }
    /* ===== GIF ===== */
    function gifAvailable() { return Boolean(root.PrivacyGuideGifenc && typeof root.PrivacyGuideGifenc.GIFEncoder === "function"); }
    async function buildGif(items, options) {
        const lib = root.PrivacyGuideGifenc;
        if (!lib) throw new Error("GIF の部品（gifenc）を読み込めませんでした");
        const gif = lib.GIFEncoder();
        let pending = 0;
        const info = await produceFrames(items, options, async (canvas, ms) => {
            const { width, height } = canvas;
            const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
            // フレームごとに256色のパレットを作ります（画面が変わっても色が破綻しないように）
            const palette = lib.quantize(data, 256, { format: "rgb444", oneBitAlpha: false });
            const index = lib.applyPalette(data, palette, "rgb444");
            gif.writeFrame(index, width, height, { palette, delay: Math.max(20, ms), repeat: 0 });
            pending += 1;
            if (pending % 6 === 0) await new Promise((resolve) => setTimeout(resolve, 0));   // 画面を固めない
        });
        gif.finish();
        const bytes = gif.bytes();
        const blob = new Blob([bytes], { type: "image/gif" });
        return { blob, mime: "image/gif", ext: "gif", width: info.width, height: info.height, durationMs: info.durationMs, frames: info.frames, actualFormat: "gif", poster: await canvasToBlob(info.poster, "image/jpeg", .86), note: "" };
    }

    /* ===== WebCodecs（WebM／MP4）===== */
    function webCodecsAvailable() { return typeof root.VideoEncoder === "function" && typeof root.VideoFrame === "function"; }

    async function pickCodec(kind, width, height) {
        const candidates = kind === "mp4"
            ? ["avc1.42E028", "avc1.42E01F", "avc1.4D4028", "avc1.640028", "avc1.42001F"]   // H.264 Constrained Baseline 4.0 → 3.1 → Main → High
            : ["vp09.00.10.08", "vp8"];
        for (const codec of candidates) {
            try {
                const config = { codec, width, height, bitrate: Math.round(width * height * 0.09) * 20, framerate: FPS };
                if (kind === "mp4") config.avc = { format: "avc" };
                const support = await root.VideoEncoder.isConfigSupported(config);
                if (support?.supported) return { codec, config };
            } catch (_error) { /* 次の候補へ */ }
        }
        return null;
    }

    async function buildWithWebCodecs(items, options, kind) {
        // 出力サイズを先に決めるため、最初の画像だけ描いておきます
        const probe = await items[0].render();
        if (!probe) throw new Error("最初の手順の画像を作れませんでした");
        const maxWidth = even(clamp(Number(options.maxWidth) || 1280, 320, 1920));
        const width = even(Math.min(maxWidth, probe.width));
        const screenH = even(Math.round(probe.height * (width / probe.width)));
        const height = even(options.caption === "band" ? screenH + bandHeight(width, options.caption) : screenH);
        const picked = await pickCodec(kind, width, height);
        if (!picked) return null;

        const MuxerLib = kind === "mp4" ? root.Mp4Muxer : root.WebMMuxer;
        if (!MuxerLib) throw new Error(kind === "mp4" ? "MP4 の部品（mp4-muxer）を読み込めませんでした" : "WebM の部品（webm-muxer）を読み込めませんでした");
        const target = new MuxerLib.ArrayBufferTarget();
        const muxer = new MuxerLib.Muxer(kind === "mp4"
            ? { target, video: { codec: "avc", width, height }, fastStart: "in-memory", firstTimestampBehavior: "offset" }
            : { target, video: { codec: picked.codec.startsWith("vp09") ? "V_VP9" : "V_VP8", width, height, frameRate: FPS }, firstTimestampBehavior: "offset" });
        let encodeError = null;
        const encoder = new root.VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: (error) => { encodeError = error; }
        });
        encoder.configure(picked.config);
        let timestampUs = 0;
        let count = 0;
        let lastCanvas = null;   // 最後のフレームの複製（末尾の静止時間を動画の長さに含めるため）
        const info = await produceFrames(items, options, async (canvas, ms) => {
            if (encodeError) throw encodeError;
            const durationUs = Math.round(ms * 1000);
            const frame = new root.VideoFrame(canvas, { timestamp: timestampUs, duration: durationUs });
            // 2秒ごと・区切りの長い静止フレームはキーフレームにして、動画の途中からの再生に強くします
            const keyFrame = count === 0 || ms >= 500 || count % (FPS * 2) === 0;
            encoder.encode(frame, { keyFrame });
            frame.close();
            timestampUs += durationUs;
            count += 1;
            if (!lastCanvas) { lastCanvas = document.createElement("canvas"); lastCanvas.width = canvas.width; lastCanvas.height = canvas.height; }
            lastCanvas.getContext("2d", { alpha: false }).drawImage(canvas, 0, 0);
            if (encoder.encodeQueueSize > 8) await new Promise((resolve) => setTimeout(resolve, 0));
        });
        // 動画の長さは「最後のフレームの時刻」で決まるため、同じ絵をもう1枚末尾に置いて、最後の手順を見せる時間を確保します
        if (lastCanvas && !encodeError) {
            const tail = new root.VideoFrame(lastCanvas, { timestamp: timestampUs, duration: Math.round(1000 / FPS) * 1000 });
            encoder.encode(tail, { keyFrame: false });
            tail.close();
        }
        await encoder.flush();
        encoder.close();
        if (encodeError) throw encodeError;
        muxer.finalize();
        const mime = kind === "mp4" ? "video/mp4" : "video/webm";
        const blob = new Blob([target.buffer], { type: mime });
        return { blob, mime, ext: kind, width: info.width, height: info.height, durationMs: info.durationMs, frames: info.frames, actualFormat: kind, poster: await canvasToBlob(info.poster, "image/jpeg", .86), note: "" };
    }

    /* ===== MediaRecorder（WebCodecs が使えないときの WebM）===== */
    async function buildWithMediaRecorder(items, options) {
        if (typeof root.MediaRecorder !== "function") throw new Error("この Chrome では動画を作れません（MediaRecorder が使えません）");
        // リアルタイムで録るため、動画の長さと同じ時間がかかります
        let stream = null;
        let recorder = null;
        const chunks = [];
        let width = 0;
        let height = 0;
        let poster = null;
        const info = await produceFrames(items, options, async (canvas, ms) => {
            if (!recorder) {
                width = canvas.width; height = canvas.height;
                stream = canvas.captureStream(0);
                const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => root.MediaRecorder.isTypeSupported(type)) || "video/webm";
                recorder = new root.MediaRecorder(stream, { mimeType, videoBitsPerSecond: Math.round(width * height * 1.8) });
                recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
                recorder.start(250);
                poster = await canvasToBlob(canvas, "image/jpeg", .86);
            }
            const track = stream.getVideoTracks()[0];
            if (track && typeof track.requestFrame === "function") track.requestFrame();
            await new Promise((resolve) => setTimeout(resolve, ms));
        });
        await new Promise((resolve) => { recorder.onstop = resolve; recorder.stop(); });
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: "video/webm" });
        return { blob, mime: "video/webm", ext: "webm", width, height, durationMs: info.durationMs, frames: info.frames, actualFormat: "webm", poster, note: "この Chrome では WebCodecs が使えないため、リアルタイム録画で作りました" };
    }

    /** 入口。format に応じて作り、使えない方式は自動で次へ落とします。actualFormat と note に実際の形式・理由が入ります。 */
    async function build(options) {
        const items = Array.isArray(options?.items) ? options.items.filter((item) => item && typeof item.render === "function") : [];
        if (!items.length) throw new Error("動画にする手順がありません（画像のある手順が必要です）");
        const format = ["gif", "webm", "mp4"].includes(options.format) ? options.format : "mp4";
        if (format === "gif") return buildGif(items, options);
        const notes = [];
        if (webCodecsAvailable()) {
            if (format === "mp4") {
                try {
                    const made = await buildWithWebCodecs(items, options, "mp4");
                    if (made) return made;
                    notes.push("この PC の Chrome では H.264（MP4）のエンコードが使えないため、WebM で作りました");
                } catch (error) {
                    notes.push(`MP4 を作れなかったため WebM で作りました（${String(error?.message || error).slice(0, 80)}）`);
                }
            }
            try {
                const made = await buildWithWebCodecs(items, options, "webm");
                if (made) { made.note = notes.join("。"); return made; }
                notes.push("VP9/VP8 のエンコードが使えないため、リアルタイム録画で作りました");
            } catch (error) {
                notes.push(`WebM を作れなかったため、リアルタイム録画で作りました（${String(error?.message || error).slice(0, 80)}）`);
            }
        } else {
            notes.push("この Chrome では WebCodecs が使えないため、リアルタイム録画（WebM）で作りました");
        }
        const made = await buildWithMediaRecorder(items, options);
        made.note = notes.join("。");
        return made;
    }

    /** 出力の目安（秒）。進捗表示と「時間がかかる」注意に使います。 */
    function estimateDurationMs(items, speed) {
        const s = clamp(Number(speed) || 1, .4, 3);
        return Math.round(items.reduce((sum, item, index) => {
            const hold = item.sameScreen ? TIMING.between : clamp(TIMING.holdBase + String(item.description || "").length * TIMING.holdPerChar, TIMING.holdBase, TIMING.holdMax);
            const nextSame = Boolean(items[index + 1]?.sameScreen);   // 次が同じ画面なら切り替えは無い
            return sum + hold + (item.cursor ? TIMING.move + TIMING.click : 0) + (nextSame ? 0 : TIMING.fade);
        }, TIMING.last) / s);
    }

    root.PrivacyGuideVideo = { build, estimateDurationMs, gifAvailable, webCodecsAvailable, FPS, TIMING };
})(typeof globalThis !== "undefined" ? globalThis : this);
