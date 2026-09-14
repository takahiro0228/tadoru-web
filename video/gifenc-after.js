/* TADORU. – gifenc の読み込み補助（v0.7.14）：exports を PrivacyGuideGifenc に移し、後片付けします。 */
(function (root) {
    root.PrivacyGuideGifenc = root.exports && typeof root.exports.GIFEncoder === "function" ? root.exports : null;
    try { delete root.exports; delete root.module; } catch (_error) { /* 下で確実に消します */ }
    // delete が効かない環境（var 宣言などで削除不可になっている場合）でも、UMD ライブラリが CommonJS と誤認しないよう undefined にします。
    if (typeof root.exports !== "undefined") root.exports = undefined;
    if (typeof root.module !== "undefined") root.module = undefined;
})(typeof globalThis !== "undefined" ? globalThis : this);
