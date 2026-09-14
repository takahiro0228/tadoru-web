/* TADORU. – OCR Worker の入口（v0.7.2、v0.7.3 で拡充）
 * Tesseract 本体（と内部の画像ライブラリ Leptonica）は、処理中の情報や無害な警告を console.error に出します。
 *   例：「Estimating resolution as 300」「Detected 6 diacritics」「Error in boxClipToRectangle: box outside rectangle」
 * どれも認識処理は続いており異常ではありませんが、chrome://extensions の「エラー」欄に赤く積み上がって紛らわしいため、
 * この入口でそれらを console.info に振り替えてから、同梱の worker.min.js（Tesseract.js・無改変）を読み込みます。
 * 本当の失敗（読み込み失敗・メモリ不足・WASM の中断など）はそのまま console.error に残します。 */
(function () {
    "use strict";
    // 認識処理が続く「情報・警告」の形（Leptonica の「Error in 関数名: 説明」もここに含みます）
    const NOISE = /^(Estimating resolution as \d+|Detected \d+ diacritics|Warning:.*|Error in [A-Za-z0-9_]+: .*|Image too small.*|Empty page!!.*|Too few characters.*|Page too small.*|Tesseract Open Source OCR Engine.*)$/i;
    // これらを含むものは本当の失敗として残します
    const FATAL = /(Aborted|failed to|Could not|Cannot |unreachable|out of memory|RuntimeError|not found|traineddata)/i;
    const original = console.error.bind(console);
    console.error = function (...args) {
        const first = args.length === 1 && typeof args[0] === "string" ? args[0].trim() : "";
        if (first && NOISE.test(first) && !FATAL.test(first)) { console.info("[OCR] " + first); return; }
        original(...args);
    };
    importScripts("worker.min.js");
})();
