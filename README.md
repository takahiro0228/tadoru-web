# TADORU. Web 版（スマホ用）

スマホで撮ったスクリーンショット／画面収録を、個人情報をマスクした手順書に仕上げる Web アプリです。
Chrome 拡張機能 TADORU. の編集画面と同じコードを、ブラウザだけで動くようにしたものです。
サーバー通信・ログイン・外部送信はありません。画像とガイドは端末内（ブラウザの IndexedDB）にだけ保存されます。

## 使い方（iPhone）
1. Safari でこのサイトを開き、共有ボタン →「ホーム画面に追加」
2. 「スクリーンショットから作る」で写真を複数選ぶ、または「画面収録（動画）から作る」で収録した動画を選ぶ
3. 編集画面で説明文・注釈・マスクを整える（自動 OCR マスクが走ります）
4. 「共有（JSON）」で Teams・メール・AirDrop・OneDrive などへ送り、PC の TADORU. で「インポート」

## 公開のしかた（GitHub Pages）
このフォルダの中身をリポジトリ直下に置き、Settings → Pages → Deploy from a branch（main / root）。

## ファイル
- index.html / index.js / index.css — ホーム（ガイド一覧・取り込み）
- web-shim.js — 拡張機能 API（chrome.*）の代替。IndexedDB に保存
- web-editor.js / web.css — 編集画面へのスマホ向け追加（ホームへ戻る・共有）
- editor.* / options.* / presenter.* / shared.js / pptx.js / video.js / ocr.js / i18n.js / ocr / video / icons — 拡張機能 v0.7.25 と同じ
- manifest.webmanifest / sw.js — ホーム画面追加・オフライン動作
