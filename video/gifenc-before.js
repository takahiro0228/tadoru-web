/* TADORU. – gifenc の読み込み補助（v0.7.14）
 * 同梱の video/gifenc.js は CommonJS 形式（exports に関数を足す）なので、直前にこの変数を用意しておきます。
 * 読み込み後に video/gifenc-after.js が exports の中身を PrivacyGuideGifenc に移します。ライブラリ本体は無改変です。
 * 注意：`var exports` で宣言すると window の削除不可プロパティになり、後片付けの delete が効かずに残ります。
 * 残ったままだと後続の UMD ライブラリ（ocr/tesseract.min.js）が CommonJS と誤認して window.Tesseract を作らず、
 * OCR が「使えない」扱いになるため、削除できるプロパティ代入で用意します。 */
globalThis.exports = {};
globalThis.module = { exports: globalThis.exports };
