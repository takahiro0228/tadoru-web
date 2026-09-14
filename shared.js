(function (root) {
    "use strict";

    const DEFAULT_SETTINGS = Object.freeze({
        screenshotFormat: "jpeg",
        screenshotQuality: 82,
        captureDelayMs: 120,
        autoRedactFields: true,
        autoRedactEmail: true,
        autoRedactPhone: true,
        autoRedactPostalCode: true,
        autoRedactBirth: true,          // 「生年月日」「年齢」の項目名の隣にある値をマスク（v0.7.15）
        autoRedactNumbers: false,
        showCaptureNotice: true,
        includeUrls: false,
        editableAutoMask: true,
        recordTabSwitches: true,
        fontFamily: "yugothic",   // v0.6.45：既定を游ゴシックに（日本語向け）
        language: "system",
        captureMode: "tab",
        watchScreenChanges: true,
        cropWindowOnly: true,
        targetColor: "#d92d20",
        targetSize: 2,
        textColor: "#d92d20",
        textSize: 12,
        textBorderOn: false,
        textBorderWidth: 1,
        textBorderColor: "#d92d20",
        textBackgroundOn: true,
        textBackgroundColor: "#ffffff",
        textBackgroundOpacity: 90,
        highlightColor: "#d92d20",
        highlightShape: "rect",
        highlightDash: "solid",
        highlightFillColor: "#ffffff",
        highlightFillOpacity: 0,
        footerEnabled: false,
        footerText: "",
        footerAlign: "center",
        showStepUrls: false,
        sectionPages: false,
        laserTrail: 0,   // レーザーポインターの残像（ミリ秒）。0＝なし（v0.6.46）
        coverPage: false,               // 表紙ページを出力の先頭に付ける（v0.6.43）
        recordHover: false,             // ホバーで開いたメニューを遅延撮影で手順にする（v0.6.43）
        recordKeys: false,              // Ctrl+S・Enter・Tab などのキー操作を手順にする（v0.6.43）
        recordScroll: false,            // スクロールを「下にスクロールします」として手順にする（v0.6.43）
        descriptionStyle: "masu",       // 説明文の語尾（masu＝〜します／taigen＝体言止め／plain＝常体／oshika＝押下）（v0.7.11）
        recordSelectValue: false,       // ドロップダウンで選んだ値を説明文に入れる（v0.6.43）
        badgeStepCount: false,          // 記録中のバッジに手順数を出す（v0.6.43）
        tocPage: false,                 // 目次ページを出力に付ける（v0.6.43）
        darkMode: false,                // 編集画面のダークモード（v0.6.43）
        // デザインの既定（v0.6.35：全ページ共通のヘッダー帯・ロゴ・背景・ページ番号）。ガイド側で上書きできます。
        designHeaderEnabled: false,
        designHeaderColor: "",          // "" ＝色なし（透明）
        designHeaderOpacity: 100,       // 帯の色の濃さ（%）。100＝不透明（v0.6.41）
        designHeaderSize: "sm",
        designHeaderHeight: 58,         // px（幅 1280px のページ基準。小=58 / 中=83 / 大=115）
        designHeaderText: "none",
        designHeaderCustom: "",
        designHeaderTextColor: "#111111",
        designLogo: "",
        designLogoPosition: "tr",
        designLogoSize: "sm",
        designBackground: "#ffffff",
        designBackgroundImage: "",      // テンプレート画像（data URL）。"" ＝なし（v0.6.36）
        designBackgroundFit: "stretch", // stretch / cover / contain
        designPageNumber: false,
        toolbarPinned: true,            // ツールバーの詳細を常に表示（ピン留め）。false＝タブだけ表示（v0.6.37）
        designPageNumberAlign: "right",
        arrowColor: "#d92d20",
        arrowSize: 2,
        penColor: "#d92d20",
        penSize: 2,
        highlighterColor: "#ffff00",
        highlighterSize: 8,
        highlighterOpacity: 40,
        customTerms: [],
        customSelectors: [],
        excludedUrls: [],          // 記録・撮影をしないサイト（URL 前方一致・v0.6.47）
        resumeOpensUrl: false,     // 追加で撮影のとき、その手順のページを新しいタブで開く（v0.6.47）
        ocrAuto: true,             // 記録終了後、編集画面で画像内の文字を自動で検出してマスク（v0.7.1・既定 ON）
        domMasking: false,         // 撮影時にページの文字データ（HTML）から自動マスクする（v0.7.3・既定 OFF。OCR に一本化。コードは残す）
        ocrNames: true,            // OCR のときだけ：氏名（ラベル・敬称から推定）をマスク（v0.7.4）
        ocrAddresses: true,        // OCR のときだけ：住所（都道府県〜番地）をマスク（v0.7.4）
        maskEngine: "ocr"          // 読み取り方式（v0.7.6）："html"（簡易方式：撮影時のページの文字データ）／"ocr"（OCR方式）。v0.7.8 で "ocrAi"（Chrome 内蔵 AI）は提供を見送り、保存済みの値は "ocr" として扱います
    });

    /* \u30e9\u30d9\u30eb\u306f\u305d\u306e\u307e\u307e PowerPoint / Word \u306b\u66f8\u304d\u8fbc\u3080\u30d5\u30a9\u30f3\u30c8\u540d\u3068\u3057\u3066\u3082\u4f7f\u3046\u305f\u3081\u3001
     * \u8868\u793a\u7528\u306e\u98fe\u308a\uff08\u300cOffice\u540c\u68b1\u300d\u306a\u3069\uff09\u306f\u4ed8\u3051\u305a\u3001\u5b9f\u969b\u306e\u30d5\u30a9\u30f3\u30c8\u30d5\u30a1\u30df\u30ea\u30fc\u540d\u306b\u3057\u3066\u3044\u307e\u3059\u3002
     * \u30d5\u30a9\u30f3\u30c8\u30d5\u30a1\u30a4\u30eb\u306f\u540c\u68b1\u305b\u305a\u540d\u524d\u3067\u53c2\u7167\u3059\u308b\u3060\u3051\u306a\u306e\u3067\u3001\u5bb9\u91cf\u30fb\u901a\u4fe1\u306f\u4e00\u5207\u5897\u3048\u307e\u305b\u3093\u3002 */
    const FONT_STACKS = Object.freeze({
        yugothic: '"Yu Gothic UI", "Yu Gothic", YuGothic, "\u6e38\u30b4\u30b7\u30c3\u30af", sans-serif',
        bizudgothic: '"BIZ UDPGothic", "BIZ UDGothic", sans-serif',
        meiryo: 'Meiryo, "\u30e1\u30a4\u30ea\u30aa", sans-serif',
        system: '"Helvetica Neue", Helvetica, Arial, "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
        yumincho: '"Yu Mincho", YuMincho, "\u6e38\u660e\u671d", "MS PMincho", serif',
        meiryoui: '"Meiryo UI", Meiryo, "\u30e1\u30a4\u30ea\u30aa", sans-serif',
        msgothic: '"MS PGothic", "\uff2d\uff33 \uff30\u30b4\u30b7\u30c3\u30af", sans-serif',
        msgothicmono: '"MS Gothic", "\uff2d\uff33 \u30b4\u30b7\u30c3\u30af", monospace',
        msmincho: '"MS PMincho", "\uff2d\uff33 \uff30\u660e\u671d", serif',
        msminchomono: '"MS Mincho", "\uff2d\uff33 \u660e\u671d", serif',
        bizudmincho: '"BIZ UDPMincho", "BIZ UDMincho", serif',
        uddigikyokashonr: '"UD \u30c7\u30b8\u30bf\u30eb \u6559\u79d1\u66f8\u4f53 N-R", "UD Digi Kyokasho N-R", sans-serif',
        uddigikyokashonpr: '"UD \u30c7\u30b8\u30bf\u30eb \u6559\u79d1\u66f8\u4f53 NP-R", "UD Digi Kyokasho NP-R", sans-serif',
        notosans: '"Noto Sans JP", "Noto Sans CJK JP", sans-serif',
        hgmarugothic: '"HG\u4e38\uff7a\uff9e\uff7c\uff6f\uff78M-PRO", "HGMaruGothicMPRO", sans-serif',
        hgsoeikaku: '"HGP\u5275\u82f1\u89d2\uff7a\uff9e\uff7c\uff6f\uff78UB", "HGPSoeiKakugothicUB", sans-serif',
        hgkyokasho: '"HGP\u6559\u79d1\u66f8\u4f53", "HGPKyokashotai", serif',
        hggyosho: '"HGP\u884c\u66f8\u4f53", "HGPGyoshotai", serif',
        segoeui: '"Segoe UI", sans-serif',
        arial: 'Arial, Helvetica, sans-serif',
        calibri: 'Calibri, sans-serif',
        verdana: 'Verdana, sans-serif',
        tahoma: 'Tahoma, sans-serif',
        cambria: 'Cambria, serif',
        georgia: 'Georgia, serif',
        times: '"Times New Roman", Times, serif',
        couriernew: '"Courier New", monospace',
        consolas: 'Consolas, "Courier New", "MS Gothic", monospace'
    });

    const FONT_LABELS = Object.freeze({
        yugothic: "\u6e38\u30b4\u30b7\u30c3\u30af",
        bizudgothic: "BIZ UD\u30b4\u30b7\u30c3\u30af",
        meiryo: "\u30e1\u30a4\u30ea\u30aa",
        system: "\u30b7\u30b9\u30c6\u30e0\u6a19\u6e96",
        yumincho: "\u6e38\u660e\u671d",
        meiryoui: "Meiryo UI",
        msgothic: "MS P\u30b4\u30b7\u30c3\u30af",
        msgothicmono: "MS \u30b4\u30b7\u30c3\u30af",
        msmincho: "MS P\u660e\u671d",
        msminchomono: "MS \u660e\u671d",
        bizudmincho: "BIZ UD\u660e\u671d",
        uddigikyokashonr: "UD \u30c7\u30b8\u30bf\u30eb \u6559\u79d1\u66f8\u4f53 N-R",
        uddigikyokashonpr: "UD \u30c7\u30b8\u30bf\u30eb \u6559\u79d1\u66f8\u4f53 NP-R",
        notosans: "Noto Sans JP",
        hgmarugothic: "HG\u4e38\uff7a\uff9e\uff7c\uff6f\uff78M-PRO",
        hgsoeikaku: "HGP\u5275\u82f1\u89d2\uff7a\uff9e\uff7c\uff6f\uff78UB",
        hgkyokasho: "HGP\u6559\u79d1\u66f8\u4f53",
        hggyosho: "HGP\u884c\u66f8\u4f53",
        segoeui: "Segoe UI",
        arial: "Arial",
        calibri: "Calibri",
        verdana: "Verdana",
        tahoma: "Tahoma",
        cambria: "Cambria",
        georgia: "Georgia",
        times: "Times New Roman",
        couriernew: "Courier New",
        consolas: "Consolas"
    });

    /* ===== 項目名（ラベル）の語彙（v0.7.9）=====
     * 「住所」「担当者」などの項目名を見つけるための共通定義です。
     * OCR（画像内の文字）と簡易方式（ページの文字データ）の両方から同じ語彙で判定します。 */
    const LABEL_HEAD = "[一-龥々ぁ-んァ-ヶー〒]{0,8}?";   // 「ポータル住所」「管理部担当者」「現住所」のような前置き（日本語のみ許可）
    const LABEL_EXCLUDE = /(物件|会社|法人|建物|部署|部屋|店舗|商品|画面|ファイル|項目|システム|プラン|銀行|支店|種別|種類|区分|番号|コード|ID|情報|一覧|状態|ステータス|日付|日時|金額|料金|家賃|備考|メモ|説明)$/;
    const LABEL_TRAIL = /[：:＊*※]+$/;
    const FIELD_LABEL_PATTERNS = Object.freeze({
        postalCode: new RegExp(`^${LABEL_HEAD}(郵便番号|〒)[：:]?$`),
        address: new RegExp(`^${LABEL_HEAD}(住所|所在地|所在|都道府県|市区町村|市区郡|町名|町域|番地|地番|丁目|建物名|建物|号室|部屋番号|居住地|本籍|勤務先|送付先|届け先|お届け先|転居先|現住所|旧住所)(?:[1-9１-９]|[（(][^）)]{0,6}[）)])?[：:]?$`),
        name: new RegExp(`^${LABEL_HEAD}(氏名|お名前|名前|担当者|担当|契約者|入居者|申込者|申込人|代表者|オーナー|所有者|保証人|連帯保証人|借主|貸主|名義人|名義|受取人|申請者|依頼者|宛名|お客様|顧客|利用者|本人|フリガナ|ふりがな|カナ)(?:名)?(?:[（(][^）)]{0,6}[）)])?[：:]?$`),
        phone: new RegExp(`^${LABEL_HEAD}(電話番号|電話|TEL|Tel|tel|携帯電話|携帯|連絡先電話番号|連絡先|FAX|ファックス)(?:[（(][^）)]{0,6}[）)])?[：:]?$`),
        email: new RegExp(`^${LABEL_HEAD}(メールアドレス|メール|Eメール|E-mail|E-Mail|EMAIL|Email|email|mail)(?:[（(][^）)]{0,6}[）)])?[：:]?$`),
        // 生年月日・年齢（v0.7.15）：日付を形で判定すると契約日・作成日まで消えるため、項目名の隣だけを対象にします
        birth: new RegExp(`^${LABEL_HEAD}(生年月日|誕生日|お誕生日|生年|年齢|満年齢|生まれ年|Birthday|birthday|Birth date|Birthdate|Date of birth|DOB|Age|age)(?:[（(][^）)]{0,8}[）)])?[：:]?$`)
    });
    /** 項目名かどうかを判定します。kinds を渡すと、その種別だけを対象にします。戻り値は種別名 or null。 */
    function fieldLabelKind(text, settings, kinds) {
        const trimmed = normalizeWidth(String(text || "")).replace(LABEL_TRAIL, "").trim();   // 「ＴＥＬ」「Ｅ－ｍａｉｌ」も項目名として通す（v0.7.11）
        if (!trimmed || trimmed.length > 16) return null;
        const config = mergeSettings(settings);
        const allow = Array.isArray(kinds) && kinds.length ? kinds : ["postalCode", "address", "name", "phone", "email", "birth"];
        const gate = { postalCode: config.autoRedactPostalCode, address: config.ocrAddresses, name: config.ocrNames, phone: config.autoRedactPhone, email: config.autoRedactEmail, birth: config.autoRedactBirth };
        for (const kind of allow) {
            if (!gate[kind] || !FIELD_LABEL_PATTERNS[kind]) continue;
            if (!FIELD_LABEL_PATTERNS[kind].test(trimmed)) continue;
            // 「物件名」「会社名」などは項目名の形をしていても対象にしません
            if (LABEL_EXCLUDE.test(trimmed.replace(/[：:]$/, ""))) continue;
            return kind;
        }
        return null;
    }

    /** 読み取り方式の選択肢（v0.7.6）。 */
    const MASK_ENGINES = Object.freeze([
        { id: "html", label: "簡易方式" },
        { id: "ocr", label: "OCR方式" }
    ]);
    /**
     * 読み取り方式を正規化します。
     * ・未設定の古い設定では、撮影時の HTML マスクが ON なら「簡易方式」、それ以外は「OCR方式」
     * ・v0.7.6〜0.7.7 で保存された "ocrAi"（OCR＋AI方式）は、提供を見送ったため「OCR方式」として扱います（v0.7.8）
     */
    function normalizeMaskEngine(value, domMasking) {
        const id = String(value || "");
        if (MASK_ENGINES.some((item) => item.id === id)) return id;
        if (id === "ocrAi") return "ocr";
        return domMasking === true ? "html" : "ocr";
    }

    /** レーザーの残像の選択肢（v0.6.46）。値はミリ秒。 */
    const LASER_TRAILS = Object.freeze([
        { id: 0, label: "なし" },
        { id: 200, label: "短い（0.2秒）" },
        { id: 400, label: "標準（0.4秒）" },
        { id: 800, label: "長い（0.8秒）" },
        { id: 1500, label: "とても長い（1.5秒）" }
    ]);
    function normalizeLaserTrail(value) {
        if (value === null || value === undefined || value === "") return 0;
        const number = Number(value);
        if (!Number.isFinite(number)) return 0;
        return Math.min(3000, Math.max(0, Math.round(number)));
    }

    /** 記録・撮影をしないサイトか（URL 前方一致・v0.6.47）。大文字小文字は区別せず、前後の空白は無視します。 */
    function isExcludedUrl(url, list) {
        const target = String(url || "").trim().toLowerCase();
        if (!target || !Array.isArray(list)) return false;
        return list.some((prefix) => {
            const head = String(prefix || "").trim().toLowerCase();
            return head.length > 0 && target.startsWith(head);
        });
    }

    function normalizeFont(value) {
        const key = String(value || "");
        return Object.prototype.hasOwnProperty.call(FONT_STACKS, key) ? key : "system";
    }

    function fontStack(value) {
        return FONT_STACKS[normalizeFont(value)];
    }

    const SENSITIVE_PATTERNS = Object.freeze({
        email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
        // 電話番号：国際形式（+ と国番号1〜3桁。米国 +1-202-555-0173／英国 +44 20 7946 0958 など）と、
        // 国内形式（0 始まり・+81）の両方。区切りは - ー 空白 . と括弧に対応します（v0.7.9 で国際形式を追加）
        phone: /(?:\+\d{1,3}[-ー\s.]?\(?\d{1,4}\)?(?:[-ー\s.]?\d{2,4}){1,4}|(?:\+81[-\s]?|0)\d{1,4}[-ー\s]?\d{1,4}[-ー\s]?\d{3,4})/,
        postalCode: /(?:〒\s*)?\d{3}[-ー]\d{4}/,
        longNumber: /\d{6,}/
    });

    function createId(prefix) {
        const safePrefix = typeof prefix === "string" && prefix ? prefix : "id";
        if (root.crypto && typeof root.crypto.randomUUID === "function") {
            return `${safePrefix}-${root.crypto.randomUUID()}`;
        }
        return `${safePrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.min(max, Math.max(min, number));
    }

    function cleanText(value, maxLength) {
        const limit = Number.isFinite(Number(maxLength)) ? Number(maxLength) : 120;
        return String(value ?? "")
            .replace(/\s+/g, " ")
            .replace(/[\u0000-\u001f\u007f]/g, "")
            .trim()
            .slice(0, limit);
    }

    /**
     * 全角の英数字・記号・空白を半角に揃えます（v0.7.11）。
     * 「０３－１２３４－５６７８」「１５０－０００１」「ａ＠ｂ.co.jp」のような全角表記を、電話番号・郵便番号・メールの判定に通すためです。
     * 1文字→1文字の置き換えだけを行い（NFKC は「㈱」→「(株)」のように長さが変わるため使いません）、
     * 文字位置がずれないので OCR の単語位置の計算にもそのまま使えます。
     * カタカナの長音「ー」は氏名の一部になるため変換しません（電話番号の式は「ー」区切りも受け付けます）。
     */
    function normalizeWidth(value) {
        return String(value ?? "")
            .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))   // 全角 ASCII（！〜～、－ ＠ ０〜９ Ａ〜ｚ を含む）→ 半角
            .replace(/　/g, " ")                                                                 // 全角空白 → 半角空白
            .replace(/[‐-―−]/g, "-");                                                // ハイフン類（‐ ‑ ‒ – — ― −）→ -
    }

    /* ---- 履歴のバックアップ（v0.7.18）：すべてのガイドを1つの JSON にまとめる形式 ---- */
    const GUIDE_BUNDLE_FORMAT = "tadoru-guides";

    /** 履歴バックアップの JSON オブジェクトを作ります。ガイド本体はそのまま（注釈・画像を含む）入れます。 */
    function buildGuideBundle(sessionList, appVersion) {
        return {
            format: GUIDE_BUNDLE_FORMAT,
            schemaVersion: 1,
            appVersion: String(appVersion || ""),
            exportedAt: new Date().toISOString(),
            guideCount: Array.isArray(sessionList) ? sessionList.length : 0,
            guides: Array.isArray(sessionList) ? sessionList.filter((item) => item && typeof item === "object") : []
        };
    }

    /**
     * 読み込んだ JSON からガイドの配列を取り出します。
     * ・履歴バックアップ（{ format: "tadoru-guides", guides: [...] }）→ guides
     * ・ガイド1件の JSON（編集画面の「バックアップ（JSON）」・steps を持つ）→ [そのガイド]
     * ・ガイドの配列 → そのまま
     * どれにも当たらなければ null（読み込めない形式）。
     */
    function guidesFromBundle(parsed) {
        if (!parsed || typeof parsed !== "object") return null;
        if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === "object" && Array.isArray(item.steps));
        if (Array.isArray(parsed.guides)) return parsed.guides.filter((item) => item && typeof item === "object" && Array.isArray(item.steps));
        if (Array.isArray(parsed.steps)) return [parsed];
        return null;
    }

    /**
     * 履歴のすべてのガイドを1件ずつ取り寄せます（v0.7.18）。
     * 拡張機能内のメッセージには1回あたりの大きさの上限があるため、全件を一度に受け取らず、一覧 → 1件ずつの順で読みます。
     * send は { type, ... } を送って応答を返す関数（各画面の message()）。onProgress(done, total) は任意。
     */
    async function fetchAllGuides(send, onProgress, idList) {
        const listResult = await send({ type: "PG_LIST_SESSIONS" });
        let index = Array.isArray(listResult?.sessions) ? listResult.sessions : [];
        // idList を渡したときは、その id のガイドだけを一覧の順で取り寄せます（選んだガイドだけをエクスポート・v0.7.19）
        if (Array.isArray(idList)) { const wantSet = new Set(idList.filter(Boolean)); index = index.filter((item) => wantSet.has(item?.id)); }
        const guideList = [];
        let done = 0;
        for (const item of index) {
            if (!item?.id) continue;
            const result = await send({ type: "PG_GET_SESSION", id: item.id });
            const session = result?.session;
            if (session && typeof session === "object" && Array.isArray(session.steps)) guideList.push(session);
            done += 1;
            try { onProgress?.(done, index.length); } catch (_error) { /* noop */ }
        }
        return guideList;
    }

    /** ガイドを1件ずつ履歴に読み込み、件数を合計します（v0.7.18）。戻り値：{ imported, skipped, failed }。 */
    async function importGuidesOneByOne(send, guideList, onProgress) {
        const total = { imported: 0, skipped: 0, failed: 0 };
        const list = Array.isArray(guideList) ? guideList : [];
        let done = 0;
        for (const guide of list) {
            let result = null;
            try { result = await send({ type: "PG_IMPORT_SESSIONS", sessions: [guide] }); } catch (_error) { result = null; }
            if (!result) total.failed += 1;
            else {
                total.imported += Number(result.imported) || 0;
                total.skipped += Number(result.skipped) || 0;
                total.failed += Number(result.failed) || 0;
            }
            done += 1;
            try { onProgress?.(done, list.length); } catch (_error) { /* noop */ }
        }
        return total;
    }

    /** 履歴バックアップのファイル名（例：tadoru-guides-20260909-1530.json）。 */
    function guideBundleFilename(date) {
        const d = date instanceof Date ? date : new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `tadoru-guides-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
    }

    function safeUrl(value) {
        try {
            const url = new URL(String(value ?? ""));
            if (!["http:", "https:", "file:"].includes(url.protocol)) return "";
            url.username = "";
            url.password = "";
            url.search = "";
            url.hash = "";
            return url.toString();
        } catch (_error) {
            return "";
        }
    }

    function normalizeHexColor(value, fallback) {
        return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : fallback;
    }

    /* ---- 枠線の形と線種（v0.6.23）----------------------------------------
     * 編集画面・詳細設定・ポップアップ・Office出力で同じ選択肢を使うため、ここを一次情報にします。 */
    const HIGHLIGHT_SHAPES = Object.freeze([
        { id: "rect", label: "□ 四角" },
        { id: "ellipse", label: "◯ 円" },
        { id: "roundRect", label: "▢ 角丸四角" },
        { id: "triangle", label: "△ 三角" },
        { id: "diamond", label: "◇ ひし形" },
        { id: "hexagon", label: "⬡ 六角形" },
        { id: "trapezoid", label: "⏢ 台形" },
        { id: "parallelogram", label: "▱ 平行四辺形" },
        { id: "rightArrow", label: "⇨ ブロック矢印（右）" },
        { id: "leftArrow", label: "⇦ ブロック矢印（左）" },
        { id: "upArrow", label: "⇧ ブロック矢印（上）" },
        { id: "downArrow", label: "⇩ ブロック矢印（下）" },
        { id: "leftRightArrow", label: "⇔ ブロック矢印（左右）" },
        { id: "upDownArrow", label: "⇕ ブロック矢印（上下）" }
    ]);

    /* ---- 矢印の線の形と矢じり（v0.6.26で2つに分割）------------------------
     * v0.6.25までは arrowKind の1項目でしたが、組み合わせが増えたため
     * 「線の形（arrowLine）」と「矢じり（arrowEnds）」に分けました。
     * 古い arrowKind を持つ注釈は arrowStyle() が読み替えます。 */
    const ARROW_LINES = Object.freeze([
        { id: "straight", label: "直線" },
        { id: "elbow", label: "カギ線" },
        { id: "elbowL", label: "L字" },
        { id: "uShape", label: "コの字" },
        { id: "curve", label: "曲線" }
    ]);
    const ARROW_ENDS = Object.freeze([
        { id: "end", label: "終点に矢" },
        { id: "none", label: "矢なし" },
        { id: "both", label: "両端に矢" }
    ]);
    const LEGACY_ARROW_KINDS = Object.freeze({
        arrow: ["straight", "end"],
        line: ["straight", "none"],
        double: ["straight", "both"],
        elbow: ["elbow", "end"],
        curve: ["curve", "end"]
    });

    function normalizeArrowLine(value) {
        return ARROW_LINES.some((item) => item.id === value) ? String(value) : "straight";
    }

    function normalizeArrowEnds(value) {
        return ARROW_ENDS.some((item) => item.id === value) ? String(value) : "end";
    }

    /* ---- 矢じりの形と大きさ（v0.6.32）。id は Office の headEnd/tailEnd の type・w/len と同じ ---- */
    const ARROW_HEADS = Object.freeze([
        { id: "none", label: "なし" },
        { id: "triangle", label: "▲ 三角" },
        { id: "stealth", label: "➤ 鋭い三角" },
        { id: "arrow", label: "↑ 開いた矢" },
        { id: "oval", label: "● 丸" },
        { id: "diamond", label: "◆ ひし形" }
    ]);
    // 大きさは5段階（v0.6.33）。Office は sm/med/lg の3段階なので、最小→sm、最大→lg に丸めて出力します。
    const ARROW_HEAD_SIZES = Object.freeze([
        { id: "xs", label: "最小" },
        { id: "sm", label: "小" },
        { id: "med", label: "中" },
        { id: "lg", label: "大" },
        { id: "xl", label: "最大" }
    ]);

    function normalizeArrowHead(value, fallback) {
        return ARROW_HEADS.some((item) => item.id === value) ? String(value) : (fallback || "none");
    }

    function normalizeArrowHeadSize(value, fallback) {
        return ARROW_HEAD_SIZES.some((item) => item.id === value) ? String(value) : (fallback || "med");
    }

    /** 注釈・ツール設定から { line, ends, startHead, endHead, headSize } を返します。
     *  v0.6.25以前の arrowKind、v0.6.26〜31の arrowEnds（終点に矢／矢なし／両端）も読み替えます。 */
    function arrowStyle(source) {
        const legacy = LEGACY_ARROW_KINDS[String(source?.arrowKind ?? source?.kind ?? "")];
        const legacyEnds = normalizeArrowEnds(source?.arrowEnds ?? source?.ends ?? legacy?.[1]);
        const startHead = normalizeArrowHead(source?.arrowStart ?? source?.startHead, legacyEnds === "both" ? "triangle" : "none");
        const endHead = normalizeArrowHead(source?.arrowEnd ?? source?.endHead, legacyEnds === "none" ? "none" : "triangle");
        const ends = startHead !== "none" && endHead !== "none" ? "both" : endHead !== "none" ? "end" : startHead !== "none" ? "start" : "none";
        return {
            line: normalizeArrowLine(source?.arrowLine ?? source?.line ?? legacy?.[0]),
            ends,
            startHead,
            endHead,
            headSize: normalizeArrowHeadSize(source?.arrowHeadSize ?? source?.headSize)
        };
    }

    /** 回転角（度）。0〜359に丸めます（v0.6.26）。 */
    function normalizeRotation(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return 0;
        return ((Math.round(number) % 360) + 360) % 360;
    }

    /* ---- 出力フッター（v0.6.25）------------------------------------------ */
    const FOOTER_ALIGNS = Object.freeze([
        { id: "left", label: "左寄せ" },
        { id: "center", label: "中央" },
        { id: "right", label: "右寄せ" }
    ]);

    function normalizeFooterAlign(value) {
        return FOOTER_ALIGNS.some((item) => item.id === value) ? String(value) : "center";
    }

    /* ---- デザイン（スライドマスター相当）v0.6.35 ---------------------------------
     * ヘッダー帯・ロゴ・背景色・ページ番号を「ページの余白」に置きます（撮影画像には重ねない）。
     * 高さは「ページ幅に対する割合」で持ち、印刷・PPTX・スライドショーで同じ見た目になります。 */
    const DESIGN_SIZES = Object.freeze([
        { id: "sm", label: "小" },
        { id: "md", label: "中" },
        { id: "lg", label: "大" }
    ]);
    const DESIGN_HEADER_TEXTS = Object.freeze([
        { id: "title", label: "ガイド名" },
        { id: "section", label: "セクション名" },
        { id: "custom", label: "任意の文字" },
        { id: "none", label: "文字なし" }
    ]);
    const DESIGN_LOGO_POSITIONS = Object.freeze([
        { id: "tl", label: "左上" },
        { id: "tr", label: "右上" },
        { id: "bl", label: "左下" },
        { id: "br", label: "右下" }
    ]);
    const DESIGN_HEADER_RATIO = Object.freeze({ sm: .045, md: .065, lg: .09 });
    /* テンプレート画像（ページ背景）の合わせ方（v0.6.36） */
    const DESIGN_BACKGROUND_FITS = Object.freeze([
        { id: "stretch", label: "ページ全体に引き伸ばす" },
        { id: "cover", label: "比率を保って全体を覆う（はみ出た分は切る）" },
        { id: "contain", label: "比率を保って収める（余りは背景色）" }
    ]);
    function normalizeBackgroundFit(value) {
        return DESIGN_BACKGROUND_FITS.some((item) => item.id === value) ? String(value) : "stretch";
    }
    function normalizeDataImage(value) {
        return typeof value === "string" && value.startsWith("data:image/") ? value : "";
    }
    /**
     * テンプレート画像をページ（幅 pageW × 高さ pageH）に置くときの矩形。
     * imageAspect ＝ 画像の 幅÷高さ。cover はページからはみ出す（切れる）矩形を返します。
     */
    function backgroundImageRect(fit, imageAspect, pageW, pageH) {
        const aspect = Number.isFinite(Number(imageAspect)) && Number(imageAspect) > 0 ? Number(imageAspect) : pageW / Math.max(1, pageH);
        const mode = normalizeBackgroundFit(fit);
        if (mode === "stretch") return { x: 0, y: 0, w: pageW, h: pageH };
        const pageAspect = pageW / Math.max(1, pageH);
        const fillWidth = mode === "cover" ? aspect < pageAspect : aspect > pageAspect;
        const w = fillWidth ? pageW : pageH * aspect;
        const h = fillWidth ? pageW / aspect : pageH;
        return { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h };
    }
    /* 帯の高さは px でも指定できます。px は「幅 1280px のページ（16:9 スライドの 96dpi 相当）」を基準にした値で、
     * 小=58 / 中=83 / 大=115。上限は「大」の値です。 */
    const DESIGN_PAGE_REF_PX = 1280;
    const DESIGN_HEADER_PX = Object.freeze({ sm: 58, md: 83, lg: 115 });
    const DESIGN_HEADER_MAX_PX = 115;
    const DESIGN_LOGO_RATIO = Object.freeze({ sm: .035, md: .05, lg: .07 });
    const DESIGN_FOOT_RATIO = .035;

    function normalizeDesignSize(value) {
        return DESIGN_SIZES.some((item) => item.id === value) ? String(value) : "md";
    }
    function normalizeDesignHeaderText(value) {
        return DESIGN_HEADER_TEXTS.some((item) => item.id === value) ? String(value) : "none";
    }
    function normalizeLogoPosition(value) {
        return DESIGN_LOGO_POSITIONS.some((item) => item.id === value) ? String(value) : "tr";
    }
    /** 帯の色。"" ＝色なし（透明）。 */
    /** 0〜100 の整数（%）。数値でなければ fallback。 */
    function normalizeOpacityPercent(value, fallback) {
        if (value === null || value === undefined || value === "") return fallback ?? 100;
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback ?? 100;
        return Math.min(100, Math.max(0, Math.round(number)));
    }
    /** ヘッダー帯の CSS 色。"" ＝色なし → "transparent"。濃さ 100% 未満は rgba にします（v0.6.41）。 */
    function designBandCss(design) {
        const d = design && typeof design === "object" ? design : {};
        const color = normalizeBandColor(d.headerColor, "");
        if (!color) return "transparent";
        const opacity = normalizeOpacityPercent(d.headerOpacity, 100);
        if (opacity >= 100) return color;
        const rgb = hexToRgb(color);
        if (!rgb) return color;
        return `rgba(${rgb.r},${rgb.g},${rgb.b},${(opacity / 100).toFixed(2)})`;
    }
    /** 色を背景色に濃さ（%）で重ねたときの見た目の色（#rrggbb）。透過を表せない出力（Word の網かけ）用。 */
    function blendHexColor(color, base, opacity) {
        const fg = hexToRgb(normalizeHexColor(color, "#000000"));
        const bg = hexToRgb(normalizeHexColor(base, "#ffffff"));
        if (!fg) return normalizeHexColor(color, "#000000");
        if (!bg) return normalizeHexColor(color, "#000000");
        const a = normalizeOpacityPercent(opacity, 100) / 100;
        const mix = (f, b) => Math.round(f * a + b * (1 - a));
        const hex2 = (n) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
        return `#${hex2(mix(fg.r, bg.r))}${hex2(mix(fg.g, bg.g))}${hex2(mix(fg.b, bg.b))}`;
    }
    function hexToRgb(color) {
        const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(color || ""));
        if (!m) return null;
        return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
    }
    /** 表紙の項目（v0.6.43）。文書番号・版数・作成日・作成部署・機密区分。文書名はガイド名を使います。空文字は「載せない」。 */
    const COVER_CONFIDENTIALITY = Object.freeze([
        { id: "", label: "表示しない" },
        { id: "internal", label: "社内限り" },
        { id: "confidential", label: "社外秘" },
        { id: "restricted", label: "部外秘" },
        { id: "secret", label: "極秘" }
    ]);
    /* ---- 表紙の文書管理項目（v0.7.11）----
     * approvals：作成／確認／承認の欄（見出しは変更可。押印欄＋氏名＋日付）。approvalEnabled が ON のときだけ表紙に載せます
     * revisions：改訂履歴（版・日付・改訂内容・承認者）。1行でもあれば表紙の次に「改訂履歴」ページを挟みます
     * purpose／scope／related：目的・適用範囲・関連文書。入力があるものだけ表紙に載せます（複数行可） */
    const COVER_APPROVAL_COUNT = 3;
    const COVER_APPROVAL_DEFAULT_LABELS = Object.freeze(["作成", "確認", "承認"]);
    const COVER_REVISION_MAX = 20;
    /** 複数行の入力を掃除します（改行は残し、制御文字は除く）。 */
    function cleanMultiline(value, maxLength) {
        const limit = Number.isFinite(Number(maxLength)) ? Number(maxLength) : 600;
        return String(value ?? "")
            .replace(/\r\n?/g, "\n")
            .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
            .split("\n").map((line) => line.replace(/[ \t]+$/g, "")).join("\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            .slice(0, limit);
    }
    function normalizeCoverApprovals(value) {
        const list = Array.isArray(value) ? value : [];
        return Array.from({ length: COVER_APPROVAL_COUNT }, (_unused, index) => {
            const item = list[index] && typeof list[index] === "object" ? list[index] : {};
            return {
                label: cleanText(item.label, 20) || COVER_APPROVAL_DEFAULT_LABELS[index] || "",
                name: cleanText(item.name, 40),
                date: cleanText(item.date, 30)
            };
        });
    }
    function normalizeCoverRevisions(value) {
        const list = Array.isArray(value) ? value : [];
        return list
            .filter((item) => item && typeof item === "object")
            .map((item) => ({
                version: cleanText(item.version, 30),
                date: cleanText(item.date, 30),
                note: cleanText(item.note, 200),
                author: cleanText(item.author, 40)
            }))
            .filter((item) => item.version || item.date || item.note || item.author)
            .slice(0, COVER_REVISION_MAX);
    }
    function normalizeCover(value) {
        const source = value && typeof value === "object" ? value : {};
        const confidentiality = COVER_CONFIDENTIALITY.some((item) => item.id === source.confidentiality) ? String(source.confidentiality) : "";
        return {
            number: cleanText(source.number, 60),
            version: cleanText(source.version, 30),
            date: cleanText(source.date, 30),
            department: cleanText(source.department, 80),
            confidentiality,
            // v0.7.11：文書管理項目。古いガイドには無いので、空（載せない）として扱います
            purpose: cleanMultiline(source.purpose, 600),
            scope: cleanMultiline(source.scope, 600),
            related: cleanMultiline(source.related, 600),
            approvalEnabled: Boolean(source.approvalEnabled),
            approvals: normalizeCoverApprovals(source.approvals),
            revisions: normalizeCoverRevisions(source.revisions)
        };
    }
    /** 表紙に載せる「目的／適用範囲／関連文書」を、入力があるものだけ [見出し, 本文] で返します。 */
    function coverTextSections(cover) {
        const c = normalizeCover(cover);
        return [["目的", c.purpose], ["適用範囲", c.scope], ["関連文書", c.related]].filter(([, text]) => text);
    }
    function coverConfidentialityLabel(id) {
        // v0.7.25：空（「表示しない」）は表紙に載せないので、選択肢の表示名「表示しない」を返さず空文字にします
        // （以前は先頭の { id: "" } に一致して「表示しない」が Excel・PowerPoint・Word・Markdown・スライドショーの表紙に出ていた）
        if (!id) return "";
        return COVER_CONFIDENTIALITY.find((item) => item.id === id)?.label || "";
    }
    function normalizeBandColor(value, fallback) {
        if (value === "" || value === "none" || value === null) return "";
        if (value === undefined) return fallback ?? "";
        return normalizeHexColor(value, fallback ?? "");
    }
    /** 帯の高さ（px）。1〜115。未指定なら「小／中／大」から決めます。 */
    function normalizeHeaderHeight(value, size) {
        const number = Number(value);
        if (Number.isFinite(number) && number > 0) return Math.min(DESIGN_HEADER_MAX_PX, Math.max(1, Math.round(number)));
        return DESIGN_HEADER_PX[normalizeDesignSize(size)] ?? DESIGN_HEADER_PX.sm;
    }
    /** px から「小／中／大／指定（custom）」を逆算します。 */
    function headerSizeFromHeight(height) {
        const found = Object.entries(DESIGN_HEADER_PX).find(([, px]) => px === Number(height));
        return found ? found[0] : "custom";
    }

    function normalizeDesign(source) {
        const value = source && typeof source === "object" ? source : {};
        return {
            headerEnabled: Boolean(value.headerEnabled),
            headerColor: normalizeBandColor(value.headerColor, ""),
            headerOpacity: normalizeOpacityPercent(value.headerOpacity, 100),
            headerHeight: normalizeHeaderHeight(value.headerHeight, value.headerSize ?? "sm"),
            headerSize: headerSizeFromHeight(normalizeHeaderHeight(value.headerHeight, value.headerSize ?? "sm")),
            headerText: normalizeDesignHeaderText(value.headerText ?? "none"),
            headerCustom: cleanText(value.headerCustom, 120),
            headerTextColor: normalizeHexColor(value.headerTextColor, "#111111"),
            logo: typeof value.logo === "string" && value.logo.startsWith("data:image/") ? value.logo : "",
            logoPosition: normalizeLogoPosition(value.logoPosition),
            logoSize: normalizeDesignSize(value.logoSize),
            background: normalizeHexColor(value.background, "#ffffff"),
            backgroundImage: normalizeDataImage(value.backgroundImage),
            backgroundFit: normalizeBackgroundFit(value.backgroundFit),
            pageNumber: Boolean(value.pageNumber),
            pageNumberAlign: normalizeFooterAlign(value.pageNumberAlign ?? "right")
        };
    }

    /** 詳細設定（フラットなキー）→ デザイン */
    function designFromSettings(settings) {
        const value = settings && typeof settings === "object" ? settings : {};
        return normalizeDesign({
            headerEnabled: value.designHeaderEnabled, headerColor: value.designHeaderColor, headerOpacity: value.designHeaderOpacity, headerSize: value.designHeaderSize, headerHeight: value.designHeaderHeight,
            headerText: value.designHeaderText, headerCustom: value.designHeaderCustom, headerTextColor: value.designHeaderTextColor,
            logo: value.designLogo, logoPosition: value.designLogoPosition, logoSize: value.designLogoSize,
            background: value.designBackground, backgroundImage: value.designBackgroundImage, backgroundFit: value.designBackgroundFit,
            pageNumber: value.designPageNumber, pageNumberAlign: value.designPageNumberAlign
        });
    }

    /** デザイン → 詳細設定のキー */
    function designToSettings(design) {
        const d = normalizeDesign(design);
        return {
            designHeaderEnabled: d.headerEnabled, designHeaderColor: d.headerColor, designHeaderOpacity: d.headerOpacity, designHeaderSize: d.headerSize, designHeaderHeight: d.headerHeight,
            designHeaderText: d.headerText, designHeaderCustom: d.headerCustom, designHeaderTextColor: d.headerTextColor,
            designLogo: d.logo, designLogoPosition: d.logoPosition, designLogoSize: d.logoSize,
            designBackground: d.background, designBackgroundImage: d.backgroundImage, designBackgroundFit: d.backgroundFit,
            designPageNumber: d.pageNumber, designPageNumberAlign: d.pageNumberAlign
        };
    }

    /** ページの上下に必要な余白（ページ幅に対する割合）。{ top, bottom, header, logo } */
    function designMetrics(design) {
        const d = normalizeDesign(design);
        const header = d.headerEnabled ? d.headerHeight / DESIGN_PAGE_REF_PX : 0;
        const logo = d.logo ? DESIGN_LOGO_RATIO[d.logoSize] : 0;
        const logoTop = d.logo && (d.logoPosition === "tl" || d.logoPosition === "tr");
        const logoBottom = d.logo && !logoTop;
        const top = Math.max(header, logoTop ? logo * 1.3 : 0);
        const bottom = (d.pageNumber || logoBottom) ? Math.max(DESIGN_FOOT_RATIO, logoBottom ? logo * 1.3 : 0) : 0;
        return { top, bottom, header, logo, logoTop: Boolean(logoTop), logoBottom: Boolean(logoBottom) };
    }

    function designHasChrome(design) {
        const d = normalizeDesign(design);
        return d.headerEnabled || Boolean(d.logo) || d.pageNumber || Boolean(d.backgroundImage) || d.background.toLowerCase() !== "#ffffff";
    }

    /** ヘッダー帯の文字。context: { title, section } */
    function designHeaderLabel(design, context) {
        const d = normalizeDesign(design);
        if (!d.headerEnabled || d.headerText === "none") return "";
        if (d.headerText === "custom") return d.headerCustom;
        if (d.headerText === "section") return cleanText(context?.section, 120);
        return cleanText(context?.title, 120);
    }
    const LINE_DASHES = Object.freeze([
        { id: "solid", label: "実線" },
        { id: "dash", label: "破線" },
        { id: "dot", label: "点線" }
    ]);
    /* ---- 文字の種類と配置（v0.6.24）--------------------------------------
     * 文字は2種類：plain（従来の自動サイズ）と box（テキストボックス＝ドラッグ枠が箱）。
     * 配置（左右・上下・方向）は box のときだけ効きます。 */
    const TEXT_KINDS = Object.freeze([
        { id: "plain", label: "文字（自動サイズ）" },
        { id: "box", label: "テキストボックス" }
    ]);
    const TEXT_ALIGNS = Object.freeze([
        { id: "left", label: "左揃え" },
        { id: "center", label: "中央揃え" },
        { id: "right", label: "右揃え" }
    ]);
    const TEXT_VALIGNS = Object.freeze([
        { id: "top", label: "上揃え" },
        { id: "middle", label: "上下中央" },
        { id: "bottom", label: "下揃え" }
    ]);
    const TEXT_DIRECTIONS = Object.freeze([
        { id: "horizontal", label: "横書き" },
        { id: "vertical", label: "縦書き" }
    ]);

    function normalizeTextKind(value) {
        return value === "box" ? "box" : "plain";
    }

    function normalizeTextAlign(value) {
        return TEXT_ALIGNS.some((item) => item.id === value) ? String(value) : "left";
    }

    function normalizeTextValign(value) {
        return TEXT_VALIGNS.some((item) => item.id === value) ? String(value) : "top";
    }

    function normalizeTextDirection(value) {
        return TEXT_DIRECTIONS.some((item) => item.id === value) ? String(value) : "horizontal";
    }

    /** Office（PowerPoint / Word）の線種名。solid は要素そのものを出しません。 */
    const OFFICE_DASH = Object.freeze({ dash: "dash", dot: "sysDot" });

    function normalizeHighlightShape(value) {
        return HIGHLIGHT_SHAPES.some((item) => item.id === value) ? String(value) : "rect";
    }

    function normalizeLineDash(value) {
        return LINE_DASHES.some((item) => item.id === value) ? String(value) : "solid";
    }

    /** キャンバス用の破線パターン。線の太さ(px)に比例させ、拡大しても見た目が変わらないようにします。 */
    function dashPattern(dash, lineWidth) {
        const width = Math.max(1, Number(lineWidth) || 1);
        if (normalizeLineDash(dash) === "dash") return [width * 4, width * 3];
        if (normalizeLineDash(dash) === "dot") return [width, width * 2];
        return [];
    }

    function mergeSettings(value) {
        const source = value && typeof value === "object" ? value : {};
        const customTerms = Array.isArray(source.customTerms) ? source.customTerms.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 100) : [];
        const customSelectors = Array.isArray(source.customSelectors) ? source.customSelectors.map((item) => cleanText(item, 300)).filter(Boolean).slice(0, 100) : [];
        const excludedUrls = Array.isArray(source.excludedUrls) ? source.excludedUrls.map((item) => cleanText(item, 500)).filter(Boolean).slice(0, 200) : [];
        const maskEngine = normalizeMaskEngine(source.maskEngine, source.domMasking);
        return {
            ...DEFAULT_SETTINGS,
            ...source,
            screenshotQuality: clamp(source.screenshotQuality ?? DEFAULT_SETTINGS.screenshotQuality, 40, 100),
            captureDelayMs: clamp(source.captureDelayMs ?? DEFAULT_SETTINGS.captureDelayMs, 0, 800),
            editableAutoMask: source.editableAutoMask === undefined ? true : Boolean(source.editableAutoMask),
            recordTabSwitches: source.recordTabSwitches === undefined ? true : Boolean(source.recordTabSwitches),
            fontFamily: normalizeFont(source.fontFamily || DEFAULT_SETTINGS.fontFamily),
            language: ["system", "ja", "en"].includes(String(source.language)) ? String(source.language) : "system",
            captureMode: source.captureMode === "screen" ? "screen" : "tab",
            watchScreenChanges: source.watchScreenChanges === undefined ? true : Boolean(source.watchScreenChanges),
            cropWindowOnly: source.cropWindowOnly === undefined ? true : Boolean(source.cropWindowOnly),
            targetColor: normalizeHexColor(source.targetColor, DEFAULT_SETTINGS.targetColor),
            targetSize: clamp(source.targetSize ?? DEFAULT_SETTINGS.targetSize, 0.25, 24),
            textColor: normalizeHexColor(source.textColor, DEFAULT_SETTINGS.textColor),
            textSize: clamp(source.textSize ?? DEFAULT_SETTINGS.textSize, 8, 72),
            textBorderOn: source.textBorderOn === undefined ? DEFAULT_SETTINGS.textBorderOn : Boolean(source.textBorderOn),
            textBorderWidth: clamp(source.textBorderWidth ?? DEFAULT_SETTINGS.textBorderWidth, 0.25, 8),
            textBorderColor: normalizeHexColor(source.textBorderColor, DEFAULT_SETTINGS.textBorderColor),
            textBackgroundOn: source.textBackgroundOn === undefined ? DEFAULT_SETTINGS.textBackgroundOn : Boolean(source.textBackgroundOn),
            textBackgroundColor: normalizeHexColor(source.textBackgroundColor, DEFAULT_SETTINGS.textBackgroundColor),
            textBackgroundOpacity: clamp(source.textBackgroundOpacity ?? DEFAULT_SETTINGS.textBackgroundOpacity, 0, 100),
            highlightColor: normalizeHexColor(source.highlightColor, DEFAULT_SETTINGS.highlightColor),
            highlightShape: normalizeHighlightShape(source.highlightShape),
            highlightDash: normalizeLineDash(source.highlightDash),
            highlightFillColor: normalizeHexColor(source.highlightFillColor, DEFAULT_SETTINGS.highlightFillColor),
            highlightFillOpacity: clamp(source.highlightFillOpacity ?? DEFAULT_SETTINGS.highlightFillOpacity, 0, 100),
            footerEnabled: Boolean(source.footerEnabled),
            footerText: cleanText(source.footerText, 200),
            footerAlign: normalizeFooterAlign(source.footerAlign),
            showStepUrls: Boolean(source.showStepUrls),
            sectionPages: Boolean(source.sectionPages),
            laserTrail: normalizeLaserTrail(source.laserTrail),
            coverPage: Boolean(source.coverPage),
            recordHover: Boolean(source.recordHover),
            recordKeys: Boolean(source.recordKeys),
            recordScroll: Boolean(source.recordScroll),
            descriptionStyle: normalizeDescriptionStyle(source.descriptionStyle),
            recordSelectValue: Boolean(source.recordSelectValue),
            badgeStepCount: Boolean(source.badgeStepCount),
            tocPage: Boolean(source.tocPage),
            darkMode: Boolean(source.darkMode),
            designHeaderEnabled: Boolean(source.designHeaderEnabled),
            designHeaderColor: normalizeBandColor(source.designHeaderColor, DEFAULT_SETTINGS.designHeaderColor),
            designHeaderOpacity: normalizeOpacityPercent(source.designHeaderOpacity, DEFAULT_SETTINGS.designHeaderOpacity),
            designHeaderSize: headerSizeFromHeight(normalizeHeaderHeight(source.designHeaderHeight, source.designHeaderSize ?? DEFAULT_SETTINGS.designHeaderSize)),
            designHeaderHeight: normalizeHeaderHeight(source.designHeaderHeight, source.designHeaderSize ?? DEFAULT_SETTINGS.designHeaderSize),
            designHeaderText: normalizeDesignHeaderText(source.designHeaderText ?? DEFAULT_SETTINGS.designHeaderText),
            designHeaderCustom: cleanText(source.designHeaderCustom, 120),
            designHeaderTextColor: normalizeHexColor(source.designHeaderTextColor, DEFAULT_SETTINGS.designHeaderTextColor),
            designLogo: typeof source.designLogo === "string" && source.designLogo.startsWith("data:image/") ? source.designLogo : "",
            designLogoPosition: normalizeLogoPosition(source.designLogoPosition ?? DEFAULT_SETTINGS.designLogoPosition),
            designLogoSize: normalizeDesignSize(source.designLogoSize ?? DEFAULT_SETTINGS.designLogoSize),
            designBackground: normalizeHexColor(source.designBackground, "#ffffff"),
            designBackgroundImage: normalizeDataImage(source.designBackgroundImage),
            designBackgroundFit: normalizeBackgroundFit(source.designBackgroundFit ?? DEFAULT_SETTINGS.designBackgroundFit),
            designPageNumber: Boolean(source.designPageNumber),
            toolbarPinned: source.toolbarPinned === undefined ? DEFAULT_SETTINGS.toolbarPinned : Boolean(source.toolbarPinned),
            designPageNumberAlign: normalizeFooterAlign(source.designPageNumberAlign ?? DEFAULT_SETTINGS.designPageNumberAlign),
            arrowColor: normalizeHexColor(source.arrowColor, DEFAULT_SETTINGS.arrowColor),
            arrowSize: clamp(source.arrowSize ?? DEFAULT_SETTINGS.arrowSize, 0.25, 24),
            penColor: normalizeHexColor(source.penColor, DEFAULT_SETTINGS.penColor),
            penSize: clamp(source.penSize ?? DEFAULT_SETTINGS.penSize, 0.25, 24),
            highlighterColor: normalizeHexColor(source.highlighterColor, DEFAULT_SETTINGS.highlighterColor),
            highlighterSize: clamp(source.highlighterSize ?? DEFAULT_SETTINGS.highlighterSize, 0.25, 24),
            highlighterOpacity: clamp(source.highlighterOpacity ?? DEFAULT_SETTINGS.highlighterOpacity, 5, 100),
            customTerms,
            customSelectors,
            excludedUrls,
            resumeOpensUrl: Boolean(source.resumeOpensUrl),
            ocrAuto: source.ocrAuto === undefined ? true : Boolean(source.ocrAuto),
            domMasking: maskEngine === "html",   // 撮影時の HTML マスクは「簡易方式」のときだけ（v0.7.6 からは maskEngine から決まります）
            ocrNames: source.ocrNames === undefined ? true : Boolean(source.ocrNames),
            autoRedactBirth: source.autoRedactBirth === undefined ? true : Boolean(source.autoRedactBirth),
            ocrAddresses: source.ocrAddresses === undefined ? true : Boolean(source.ocrAddresses),
            maskEngine
        };
    }

    function detectSensitiveText(text, settings) {
        // 全角の数字・記号を半角に揃えてから判定します（v0.7.11。「０３－１２３４－５６７８」も電話番号として拾う）
        const value = normalizeWidth(cleanText(text, 500));
        const config = mergeSettings(settings);
        if (!value) return false;
        return config.customTerms.some((term) => value.includes(normalizeWidth(term)))
            || (config.autoRedactEmail && SENSITIVE_PATTERNS.email.test(value))
            || (config.autoRedactPhone && SENSITIVE_PATTERNS.phone.test(value))
            || (config.autoRedactPostalCode && SENSITIVE_PATTERNS.postalCode.test(value))
            || (config.autoRedactNumbers && SENSITIVE_PATTERNS.longNumber.test(value));
    }

    /* ===== 説明文の語尾（v0.7.11）=====
     * 自動生成する説明文は、まず「〜します」（ます調）で組み立て、設定に応じて語尾を置き換えます。
     * 手で書いた説明文もこの表の語尾で終わっていれば変換できます（編集画面の「語尾をまとめて変換」）。 */
    const DESCRIPTION_STYLES = Object.freeze([
        { id: "masu", label: "〜します（ます調・既定）", sample: "「保存」をクリックします" },
        { id: "taigen", label: "〜をクリック（体言止め）", sample: "「保存」をクリック" },
        { id: "plain", label: "〜する（常体）", sample: "「保存」をクリックする" },
        { id: "oshika", label: "〜を押下（体言止め・押下）", sample: "「保存」を押下" }
    ]);
    function normalizeDescriptionStyle(value) {
        const id = String(value || "");
        return DESCRIPTION_STYLES.some((item) => item.id === id) ? id : "masu";
    }
    /** 語尾の対応表。列＝ masu / taigen / plain / oshika。長い語尾を先に置き（右クリック→クリック）、文末だけを置き換えます。 */
    const DESCRIPTION_ENDINGS = Object.freeze([
        { masu: "を右クリックします", taigen: "を右クリック", plain: "を右クリックする", oshika: "を右クリック" },
        { masu: "をクリックします", taigen: "をクリック", plain: "をクリックする", oshika: "を押下" },
        { masu: "に入力します", taigen: "に入力", plain: "に入力する", oshika: "に入力" },
        { masu: "を選択します", taigen: "を選択", plain: "を選択する", oshika: "を選択" },
        { masu: "にマウスを合わせます", taigen: "にマウスオーバー", plain: "にマウスを合わせる", oshika: "にマウスオーバー" },
        { masu: "キーを押します", taigen: "キーを押下", plain: "キーを押す", oshika: "キーを押下" },
        { masu: "スクロールします", taigen: "スクロール", plain: "スクロールする", oshika: "スクロール" },
        { masu: "この画面が表示されます", taigen: "この画面の表示を確認", plain: "この画面が表示される", oshika: "この画面の表示を確認" },
        { masu: "を切り替えます", taigen: "を切り替え", plain: "を切り替える", oshika: "を切り替え" },
        { masu: "を開きます", taigen: "を表示", plain: "を開く", oshika: "を表示" },
        { masu: "が開きます", taigen: "の表示を確認", plain: "が開く", oshika: "の表示を確認" },
        { masu: "に切り替えます", taigen: "に切り替え", plain: "に切り替える", oshika: "に切り替え" },
        { masu: "を確認します", taigen: "を確認", plain: "を確認する", oshika: "を確認" },
        { masu: "を押します", taigen: "を押下", plain: "を押す", oshika: "を押下" }
    ]);
    /** ます調の文を、指定の語尾に置き換えます。表に無い語尾の文はそのまま返します。 */
    function applyDescriptionStyle(text, style) {
        const source = String(text ?? "");
        const target = normalizeDescriptionStyle(style);
        if (target === "masu" || !source) return source;
        const row = DESCRIPTION_ENDINGS.find((item) => source.endsWith(item.masu));
        if (!row) return source;
        return source.slice(0, source.length - row.masu.length) + row[target];
    }
    /** どの語尾で書かれていても、ます調（正規形）に戻します。表に無い語尾の文はそのまま返します。 */
    function toMasuDescription(text) {
        const source = String(text ?? "");
        if (!source) return source;
        // 長い語尾から順に照合します（「を右クリック」が「をクリック」に負けないように）
        const candidates = [];
        DESCRIPTION_ENDINGS.forEach((row) => ["masu", "taigen", "plain", "oshika"].forEach((key) => candidates.push({ ending: row[key], masu: row.masu })));
        candidates.sort((a, b) => b.ending.length - a.ending.length);
        const found = candidates.find((item) => source.endsWith(item.ending));
        if (!found) return source;
        return source.slice(0, source.length - found.ending.length) + found.masu;
    }
    /** 任意の語尾の文を、指定の語尾に変換します（一括変換用）。変換できない文はそのまま返します。 */
    function convertDescriptionStyle(text, style) {
        return applyDescriptionStyle(toMasuDescription(text), style);
    }

    /** 操作の種類から説明文を組み立てます。style を省くと「〜します」（ます調）です。 */
    function buildInstruction(meta, style) {
        return applyDescriptionStyle(buildInstructionMasu(meta), style);
    }
    function buildInstructionMasu(meta) {
        const source = meta && typeof meta === "object" ? meta : {};
        const label = cleanText(source.label || source.placeholder || source.role || source.tagName, 80);
        const quoted = label ? `「${label}」` : "対象の項目";
        const value = cleanText(source.value, 80);
        switch (source.action) {
            case "input": return `${quoted}に入力します`;
            case "select": return value ? `${quoted}で「${value}」を選択します` : `${quoted}を選択します`;
            case "hover": return `${quoted}にマウスを合わせます`;
            case "key": return label ? `${label} キーを押します` : "キーを押します";
            case "scroll": return source.direction === "up" ? "上にスクロールします" : source.direction === "left" ? "左にスクロールします" : source.direction === "right" ? "右にスクロールします" : "下にスクロールします";
            case "contextmenu": return `${quoted}を右クリックします`;
            case "screen": return "この画面が表示されます";
            case "check": return `${quoted}を切り替えます`;
            case "navigate": return `${quoted}を開きます`;
            default: return `${quoted}をクリックします`;
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ===== 用紙サイズ（v0.7.11）=====
     * short / long は縦向きのときの幅・高さ（mm）。margin は用紙の余白（mm。縦向き／横向き）。
     * B5 は日本で一般的な JIS B5（182×257mm）です（ISO B5 の 176×250mm ではありません）。 */
    const PAPER_SIZES = Object.freeze([
        { id: "a4", label: "A4（210×297mm）", short: 210, long: 297, margin: { portrait: 14, landscape: 12 } },
        { id: "b5", label: "B5（JIS・182×257mm）", short: 182, long: 257, margin: { portrait: 12, landscape: 10 } },
        { id: "a3", label: "A3（297×420mm）", short: 297, long: 420, margin: { portrait: 18, landscape: 16 } }
    ]);
    const DEFAULT_PAPER_SIZE = "a4";
    function normalizePaperSize(value) {
        const id = String(value || "").toLowerCase();
        return PAPER_SIZES.some((item) => item.id === id) ? id : DEFAULT_PAPER_SIZE;
    }
    /** 用紙サイズと向きから、用紙の幅・高さ・余白（mm）を返します。 */
    function paperMetrics(sizeId, orientationValue) {
        const size = PAPER_SIZES.find((item) => item.id === normalizePaperSize(sizeId)) || PAPER_SIZES[0];
        const landscape = orientationValue === "landscape";
        return {
            id: size.id,
            label: size.label,
            pageWidth: landscape ? size.long : size.short,
            pageHeight: landscape ? size.short : size.long,
            margin: landscape ? size.margin.landscape : size.margin.portrait
        };
    }

    /**
     * 印刷レイアウトの一覧です。
     * paper   : 用紙の向き
     * perPage : 1ページに載せる手順の数
     * cols    : 横に並べる数（perPage / cols が縦の段数になります）
     * align   : perPage が 1 のときの上下配置
     */
    const PAGE_LAYOUTS = Object.freeze([
        { id: "p1-center", paper: "portrait", perPage: 1, cols: 1, align: "center", label: "縦・1枚（中央）" },
        { id: "p1-top", paper: "portrait", perPage: 1, cols: 1, align: "top", label: "縦・1枚（上段）" },
        { id: "p1-bottom", paper: "portrait", perPage: 1, cols: 1, align: "bottom", label: "縦・1枚（下段）" },
        { id: "p2", paper: "portrait", perPage: 2, cols: 1, align: "top", label: "縦・2枚（上下）" },
        { id: "p3", paper: "portrait", perPage: 3, cols: 1, align: "top", label: "縦・3枚（上中下）" },
        { id: "p4", paper: "portrait", perPage: 4, cols: 2, align: "top", label: "縦・4分割（2×2）" },
        { id: "p6", paper: "portrait", perPage: 6, cols: 2, align: "top", label: "縦・6分割（2×3）" },
        { id: "l1", paper: "landscape", perPage: 1, cols: 1, align: "center", label: "横・1枚（中央）" },
        { id: "l2", paper: "landscape", perPage: 2, cols: 2, align: "top", label: "横・2分割（左右）" },
        { id: "l2v", paper: "landscape", perPage: 2, cols: 1, align: "top", label: "横・2分割（上下）" },
        { id: "l4", paper: "landscape", perPage: 4, cols: 2, align: "top", label: "横・4分割（2×2）" },
        { id: "l6", paper: "landscape", perPage: 6, cols: 3, align: "top", label: "横・6分割（3×2）" }
    ]);

    const DEFAULT_LAYOUT_PORTRAIT = "p2";
    const DEFAULT_LAYOUT_LANDSCAPE = "l1";

    /** 保存されたIDを必ず有効なレイアウトへ変換します。 */
    function pageLayout(id, fallbackOrientation) {
        const found = PAGE_LAYOUTS.find((layout) => layout.id === id);
        if (found) return found;
        const fallbackId = fallbackOrientation === "landscape" ? DEFAULT_LAYOUT_LANDSCAPE : DEFAULT_LAYOUT_PORTRAIT;
        return PAGE_LAYOUTS.find((layout) => layout.id === fallbackId);
    }

    /**
     * 「1-3, 5」のような指定を 1 始まりのページ番号の集合にします。
     * 空文字や解釈できない指定は null（＝全ページ）を返します。
     */
    function parsePageRange(value, totalPages) {
        const text = String(value ?? "").trim();
        if (!text) return null;
        const pages = new Set();
        text.split(/[,、\s]+/).filter(Boolean).forEach((part) => {
            const match = /^(\d+)(?:\s*[-–~〜]\s*(\d+))?$/.exec(part.trim());
            if (!match) return;
            const start = Number(match[1]);
            const end = match[2] === undefined ? start : Number(match[2]);
            const from = Math.max(1, Math.min(start, end));
            const to = Math.min(totalPages, Math.max(start, end));
            for (let page = from; page <= to; page += 1) pages.add(page);
        });
        return pages.size ? pages : null;
    }

    /* ---- 色の選択（編集画面と同じパレット・v0.6.22）------------------------
     * 詳細設定とポップアップの <input type="color">（ドラッグで選ぶ画面）を、
     * 編集画面と同じ「テーマの色／標準の色／最近使った色／カスタム」に置き換えます。
     * 元の input はカスタム欄としてそのまま使うため、値の読み書きは従来どおりです。
     * サービスワーカーからも読み込まれるファイルなので、document は関数の中でだけ触ります。 */
    const STANDARD_PALETTE = ["#c00000", "#ff0000", "#ffc000", "#ffff00", "#92d050", "#00b050", "#00b0f0", "#0070c0", "#002060", "#7030a0"];
    const THEME_BASE = ["#ffffff", "#000000", "#e7e6e6", "#44546a", "#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"];
    const RECENT_COLOR_KEY = "pgRecentColors";
    const RECENT_COLOR_LIMIT = 10;
    const PICKER_STYLE_ID = "pgColorPickerStyle";
    const PICKER_CSS = ".pg-color-button{display:inline-flex;align-items:center;gap:4px;padding:4px 6px;border:1px solid #d8d8d8;background:#fff;cursor:pointer}"
        + ".pg-color-button:hover{border-color:#111}"
        + ".pg-color-button .pg-color-chip{display:block;width:22px;height:16px;border:1px solid rgba(0,0,0,.22);background:#d92d20}"
        + ".pg-color-button .pg-color-caret{color:#8a8a8a;font-size:9px}"
        + ".pg-color-popover{position:fixed;z-index:9000;width:244px;max-height:calc(100vh - 16px);overflow-y:auto;padding:11px;border:1px solid #d8d8d8;background:#fff;box-shadow:0 15px 35px rgba(0,0,0,.16)}"
        + ".pg-color-popover[hidden]{display:none!important}"
        + ".pg-color-group{margin-bottom:10px}.pg-color-group[hidden]{display:none!important}"
        + ".pg-color-group>span{display:block;margin-bottom:5px;color:#8a8a8a;font-size:9px;letter-spacing:.04em}"
        + ".pg-color-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:2px}"
        + ".pg-color-grid button{width:100%;aspect-ratio:1;padding:0;border:1px solid rgba(0,0,0,.18);cursor:pointer}"
        + ".pg-color-grid button:hover{border-color:#111}"
        + ".pg-color-grid button.active{outline:2px solid #111;outline-offset:1px}"
        + ".pg-color-custom{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:9px;border-top:1px solid #ececec;color:#525252;font-size:10px}"
        + ".pg-color-custom input[type=\"color\"]{width:44px;height:22px;padding:0;border:1px solid #d8d8d8;background:#fff;cursor:pointer}";

    const colorPickers = [];

    function mixHex(hex, target, ratio) {
        const value = String(hex).replace("#", "");
        const to = String(target).replace("#", "");
        const parts = [0, 2, 4].map((offset) => {
            const from = parseInt(value.slice(offset, offset + 2), 16);
            const dest = parseInt(to.slice(offset, offset + 2), 16);
            return Math.round(from + (dest - from) * ratio);
        });
        return `#${parts.map((n) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0")).join("")}`;
    }

    function themeColumn(base) {
        if (base === "#ffffff") return [base, mixHex(base, "#000000", .05), mixHex(base, "#000000", .15), mixHex(base, "#000000", .25), mixHex(base, "#000000", .35), mixHex(base, "#000000", .5)];
        if (base === "#000000") return [base, mixHex(base, "#ffffff", .5), mixHex(base, "#ffffff", .35), mixHex(base, "#ffffff", .25), mixHex(base, "#ffffff", .15), mixHex(base, "#ffffff", .05)];
        return [base, mixHex(base, "#ffffff", .8), mixHex(base, "#ffffff", .6), mixHex(base, "#ffffff", .4), mixHex(base, "#000000", .25), mixHex(base, "#000000", .5)];
    }

    /** 編集画面と同じ並び（10列×6行）のテーマ色です。 */
    function themeGrid() {
        const columns = THEME_BASE.map(themeColumn);
        const cells = [];
        for (let row = 0; row < 6; row += 1) {
            for (let column = 0; column < columns.length; column += 1) cells.push(columns[column][row]);
        }
        return cells;
    }

    /** 最近使った色は編集画面と同じ localStorage のキーを使うので、両画面で共有されます。 */
    function readRecentColors() {
        try {
            const parsed = JSON.parse(localStorage.getItem(RECENT_COLOR_KEY) || "null");
            return Array.isArray(parsed) ? parsed.filter((color) => /^#[0-9a-f]{6}$/i.test(String(color))).slice(0, RECENT_COLOR_LIMIT) : [];
        } catch (_error) {
            return [];
        }
    }

    function rememberRecentColor(color) {
        try {
            const next = [color, ...readRecentColors().filter((item) => item !== color)].slice(0, RECENT_COLOR_LIMIT);
            localStorage.setItem(RECENT_COLOR_KEY, JSON.stringify(next));
        } catch (_error) {
            // 保存できなくても操作は続けられるようにします。
        }
    }

    function ensurePickerStyle(doc) {
        if (!doc || doc.getElementById(PICKER_STYLE_ID)) return;
        const style = doc.createElement("style");
        style.id = PICKER_STYLE_ID;
        style.textContent = PICKER_CSS;
        (doc.head || doc.documentElement).appendChild(style);
    }

    /**
     * <input type="color"> を、編集画面と同じ色パレットのボタンに置き換えます。
     * 元の input は消さずにパレットの「カスタム」欄へ移すため、
     * 既存の値の読み取り・書き込み・input/change イベントはそのまま動きます。
     */
    function attachColorPicker(input) {
        if (!input || input.dataset.pgColorPicker === "1") return null;
        const doc = input.ownerDocument;
        const anchorParent = input.parentNode;
        if (!doc || !doc.body || !anchorParent) return null;
        input.dataset.pgColorPicker = "1";
        ensurePickerStyle(doc);

        const button = doc.createElement("button");
        button.type = "button";
        button.className = "pg-color-button";
        button.setAttribute("aria-haspopup", "true");
        button.setAttribute("aria-expanded", "false");
        const chip = doc.createElement("span");
        chip.className = "pg-color-chip";
        const caret = doc.createElement("span");
        caret.className = "pg-color-caret";
        caret.textContent = "▾";
        button.append(chip, caret);
        anchorParent.insertBefore(button, input);

        // ポップオーバーは body 直下に置きます（親のはみ出しで切れるのを防ぎ、
        // ラベルの中に色入力が残らないようにするためです）。
        const popover = doc.createElement("div");
        popover.className = "pg-color-popover";
        popover.hidden = true;

        function makeGroup(title) {
            const group = doc.createElement("div");
            group.className = "pg-color-group";
            const label = doc.createElement("span");
            label.textContent = title;
            const grid = doc.createElement("div");
            grid.className = "pg-color-grid";
            group.append(label, grid);
            popover.appendChild(group);
            return { group, grid };
        }

        const themeGroup = makeGroup("テーマの色");
        const baseGroup = makeGroup("標準の色");
        const recentGroup = makeGroup("最近使った色");
        const custom = doc.createElement("label");
        custom.className = "pg-color-custom";
        custom.appendChild(doc.createTextNode("カスタム"));
        custom.appendChild(input);
        popover.appendChild(custom);
        doc.body.appendChild(popover);

        function currentValue() {
            return normalizeHexColor(input.value, "#d92d20");
        }

        function syncChip() {
            const value = currentValue();
            chip.style.background = value;
            button.title = value.toUpperCase();
            popover.querySelectorAll(".pg-color-grid button").forEach((swatch) => {
                swatch.classList.toggle("active", String(swatch.dataset.color || "").toLowerCase() === value);
            });
        }

        function pick(color) {
            input.value = color;
            rememberRecentColor(color);
            fillGrid(recentGroup, readRecentColors());
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            syncChip();
            open(false);
        }

        function fillGrid(target, colors) {
            target.grid.replaceChildren();
            colors.forEach((color) => {
                const swatch = doc.createElement("button");
                swatch.type = "button";
                swatch.dataset.color = color;
                swatch.style.background = color;
                swatch.title = color.toUpperCase();
                swatch.setAttribute("aria-label", color.toUpperCase());
                swatch.addEventListener("click", () => pick(color));
                target.grid.appendChild(swatch);
            });
            target.group.hidden = colors.length === 0;
        }

        function place() {
            const rect = button.getBoundingClientRect();
            const viewportWidth = doc.defaultView?.innerWidth || 800;
            const viewportHeight = doc.defaultView?.innerHeight || 600;
            const width = popover.offsetWidth || 244;
            const height = Math.min(popover.offsetHeight || 220, viewportHeight - 16);
            const left = Math.max(8, Math.min(viewportWidth - width - 8, rect.left));
            const below = rect.bottom + 6;
            // 下に入らなければ上へ。上にも入らなければ画面内へ収めます。
            let top = below + height > viewportHeight ? rect.top - height - 6 : below;
            top = Math.max(8, Math.min(viewportHeight - height - 8, top));
            popover.style.left = `${Math.round(left)}px`;
            popover.style.top = `${Math.round(top)}px`;
        }

        function open(next) {
            const show = typeof next === "boolean" ? next : popover.hidden;
            if (show) {
                colorPickers.forEach((picker) => { if (picker.close && picker.button !== button) picker.close(); });
                fillGrid(recentGroup, readRecentColors());
                syncChip();
            }
            popover.hidden = !show;
            button.setAttribute("aria-expanded", String(show));
            if (show) place();
        }

        fillGrid(themeGroup, themeGrid());
        fillGrid(baseGroup, STANDARD_PALETTE);
        fillGrid(recentGroup, readRecentColors());
        syncChip();

        button.addEventListener("click", (event) => { event.preventDefault(); open(); });
        input.addEventListener("input", syncChip);
        input.addEventListener("change", () => { syncChip(); rememberRecentColor(currentValue()); });
        doc.addEventListener("click", (event) => {
            if (popover.hidden) return;
            if (button.contains(event.target) || popover.contains(event.target)) return;
            open(false);
        });
        doc.addEventListener("keydown", (event) => { if (event.key === "Escape") open(false); });
        // スクロールやサイズ変更では閉じずに位置を合わせ直します。
        // （ポップアップのように狭い画面だと、開いた直後の自動スクロールで閉じてしまうため）
        doc.defaultView?.addEventListener("scroll", () => { if (!popover.hidden) place(); }, true);
        doc.defaultView?.addEventListener("resize", () => { if (!popover.hidden) place(); });

        const picker = { input, button, sync: syncChip, close: () => open(false) };
        colorPickers.push(picker);
        return picker;
    }

    /** 画面側でまとめて値を書き換えたあとに呼ぶと、見本の色を追従させます。 */
    function syncColorPickers() {
        colorPickers.forEach((picker) => picker.sync());
    }

    /** ページ内の <input type="color"> をまとめて置き換えます。 */
    function upgradeColorInputs(root) {
        const scope = root || (typeof document !== "undefined" ? document : null);
        if (!scope) return;
        scope.querySelectorAll('input[type="color"]').forEach((input) => attachColorPicker(input));
    }

    const api = {
        DEFAULT_SETTINGS,
        SENSITIVE_PATTERNS,
        HIGHLIGHT_SHAPES,
        LINE_DASHES,
        ARROW_LINES,
        ARROW_ENDS,
        ARROW_HEADS,
        ARROW_HEAD_SIZES,
        normalizeArrowHead,
        normalizeArrowHeadSize,
        normalizeArrowLine,
        normalizeArrowEnds,
        arrowStyle,
        normalizeRotation,
        FOOTER_ALIGNS,
        isExcludedUrl,
        LASER_TRAILS,
        DESCRIPTION_STYLES,
        normalizeDescriptionStyle,
        applyDescriptionStyle,
        toMasuDescription,
        convertDescriptionStyle,
        MASK_ENGINES,
        normalizeMaskEngine,
        FIELD_LABEL_PATTERNS,
        fieldLabelKind,
        normalizeLaserTrail,
        normalizeFooterAlign,
        DESIGN_SIZES,
        DESIGN_HEADER_TEXTS,
        DESIGN_LOGO_POSITIONS,
        DESIGN_HEADER_RATIO,
        DESIGN_HEADER_PX,
        DESIGN_BACKGROUND_FITS,
        normalizeBackgroundFit,
        backgroundImageRect,
        DESIGN_HEADER_MAX_PX,
        DESIGN_PAGE_REF_PX,
        normalizeBandColor,
        COVER_CONFIDENTIALITY,
        normalizeCover,
        coverConfidentialityLabel,
        COVER_APPROVAL_COUNT,
        COVER_APPROVAL_DEFAULT_LABELS,
        COVER_REVISION_MAX,
        cleanMultiline,
        coverTextSections,
        normalizeOpacityPercent,
        designBandCss,
        blendHexColor,
        normalizeHeaderHeight,
        headerSizeFromHeight,
        DESIGN_LOGO_RATIO,
        DESIGN_FOOT_RATIO,
        normalizeDesign,
        designFromSettings,
        designToSettings,
        designMetrics,
        designHasChrome,
        designHeaderLabel,
        TEXT_KINDS,
        TEXT_ALIGNS,
        TEXT_VALIGNS,
        TEXT_DIRECTIONS,
        normalizeTextKind,
        normalizeTextAlign,
        normalizeTextValign,
        normalizeTextDirection,
        OFFICE_DASH,
        normalizeHighlightShape,
        normalizeLineDash,
        dashPattern,
        STANDARD_PALETTE,
        themeGrid,
        attachColorPicker,
        upgradeColorInputs,
        syncColorPickers,
        PAGE_LAYOUTS,
        PAPER_SIZES,
        DEFAULT_PAPER_SIZE,
        normalizePaperSize,
        paperMetrics,
        DEFAULT_LAYOUT_PORTRAIT,
        DEFAULT_LAYOUT_LANDSCAPE,
        pageLayout,
        parsePageRange,
        createId,
        clamp,
        cleanText,
        normalizeWidth,
        safeUrl,
        GUIDE_BUNDLE_FORMAT,
        buildGuideBundle,
        guidesFromBundle,
        guideBundleFilename,
        fetchAllGuides,
        importGuidesOneByOne,
        mergeSettings,
        normalizeHexColor,
        FONT_STACKS,
        FONT_LABELS,
        normalizeFont,
        fontStack,
        detectSensitiveText,
        buildInstruction,
        escapeHtml
    };

    root.PrivacyGuide = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
