/* TADORU. – 画像内の文字の検出（OCR・v0.7.0、項目名からの推定 v0.7.5、Chrome 内蔵 AI v0.7.6）
 * Tesseract.js（Apache-2.0）をこの拡張機能に同梱し、端末の中だけで文字を読み取ります。外部へは何も送りません。
 * 役割：撮影画像から文字と位置を読み取り、詳細設定の「プライバシー保護」の条件（メール・電話・郵便番号・6桁以上の数字・独自の語句）に
 *       一致する部分の黒塗り（矩形）を作ります。ページの文字データを使う従来の自動マスクはそのまま残し、
 *       OCR が使えない環境（読み込み失敗・WASM 不可など）では従来のままにします（自動で切り替え）。
 */
(function (root) {
    "use strict";

    const LANGS = ["jpn", "eng"];   // 日本語（横書き）＋英数字
    const MAX_SIDE = 3200;          // 読み取りに使う画像の最大辺（px）。小さい画像は2倍まで拡大して精度を上げます
    let workerPromise = null;
    let lastError = "";

    function PG() { return root.PrivacyGuide; }

    /** 同梱ファイルと Tesseract.js が読み込めているか（false なら従来の自動マスクのみ）。 */
    function available() {
        return typeof root.Tesseract?.createWorker === "function" && typeof chrome?.runtime?.getURL === "function";
    }

    function describeError(error) {
        const text = String(error?.message || error || "");
        if (/wasm|WebAssembly/i.test(text)) return "この環境では WebAssembly を実行できません";
        if (/traineddata|lang/i.test(text)) return "言語データを読み込めませんでした";
        if (/worker/i.test(text)) return "文字認識の処理（Worker）を起動できませんでした";
        return text ? PG().cleanText(text, 120) : "文字認識を開始できませんでした";
    }

    /** Worker を1回だけ作って使い回します（初回は WASM と言語データの読み込みで数秒かかります）。 */
    function getWorker(onProgress) {
        if (workerPromise) return workerPromise;
        if (!available()) return Promise.reject(new Error("Tesseract.js が読み込まれていません"));
        const base = chrome.runtime.getURL("ocr");
        workerPromise = (async () => {
            const worker = await root.Tesseract.createWorker(LANGS, 1, {
                workerPath: `${base}/worker-quiet.js`,   // 情報メッセージを console.error に出さない入口（中で worker.min.js を読み込みます）
                corePath: `${base}/core`,
                langPath: `${base}/lang`,
                workerBlobURL: false,   // MV3 の CSP では blob: の Worker を作れないため、同梱ファイルを直接使います
                gzip: false,            // 言語データは展開済みのまま同梱
                cacheMethod: "none",    // 端末内のファイルなので IndexedDB へのキャッシュは不要
                logger: (message) => { try { onProgress?.(message); } catch (_error) { /* noop */ } },
                errorHandler: (error) => { lastError = describeError(error); }
            });
            // 画面のスクリーンショット向け：ページ全体を自動で分割して読みます。
            await worker.setParameters({ tessedit_pageseg_mode: "3", preserve_interword_spaces: "1" });
            return worker;
        })().catch((error) => {
            workerPromise = null;
            lastError = describeError(error);
            throw error;
        });
        return workerPromise;
    }

    async function terminate() {
        const pending = workerPromise;
        workerPromise = null;
        try { await terminateAi(); } catch (_error) { /* noop */ }
        if (!pending) return;
        try { const worker = await pending; await worker.terminate(); } catch (_error) { /* noop */ }
    }

    function loadImage(src) {
        return new Promise((resolve) => {
            if (!src) { resolve(null); return; }
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = src;
        });
    }

    /** 読み取り用に画像を拡大します（小さい文字の精度対策）。戻り値は { canvas, scale }。 */
    function prepare(image) {
        const width = Math.max(1, image.naturalWidth || image.width);
        const height = Math.max(1, image.naturalHeight || image.height);
        const scale = Math.max(1, Math.min(2, MAX_SIDE / Math.max(width, height)));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return { canvas, scale, width, height };
    }

    /** Tesseract の結果（blocks）から行と単語を平らに取り出します。 */
    function flattenLines(data) {
        const lines = [];
        const blocks = Array.isArray(data?.blocks) ? data.blocks : [];
        blocks.forEach((block) => (block?.paragraphs || []).forEach((paragraph) => (paragraph?.lines || []).forEach((line) => {
            const words = (line?.words || []).filter((word) => word && word.bbox && String(word.text || "").trim()).map((word) => ({
                text: String(word.text),
                confidence: Number(word.confidence) || 0,
                x0: word.bbox.x0, y0: word.bbox.y0, x1: word.bbox.x1, y1: word.bbox.y1
            }));
            if (words.length) lines.push({ text: String(line?.text || "").trim(), words });
        })));
        return lines;
    }

    /** 詳細設定に合わせて、検出する正規表現と語句を作ります。 */
    function patternsFor(settings) {
        const config = PG().mergeSettings(settings);
        const base = PG().SENSITIVE_PATTERNS;
        const list = [];
        if (config.autoRedactEmail) list.push({ kind: "email", regex: new RegExp(base.email.source, "gi") });
        if (config.autoRedactPhone) list.push({ kind: "phone", regex: new RegExp(base.phone.source, "g") });
        if (config.autoRedactPostalCode) list.push({ kind: "postalCode", regex: new RegExp(base.postalCode.source, "g") });
        if (config.autoRedactNumbers) list.push({ kind: "longNumber", regex: new RegExp(base.longNumber.source, "g") });
        (config.customTerms || []).forEach((term) => {
            const escaped = PG().normalizeWidth(String(term)).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");   // 語句側も半角に揃える（v0.7.11）
            if (escaped) list.push({ kind: "term", regex: new RegExp(escaped, "gi") });
        });
        // ---- OCR のときだけの対象（v0.7.4）。ページの文字データでは判定しません ----
        if (config.ocrAddresses) {
            // 住所：都道府県から始まり、市区郡町村を経て、番地（数字・丁目・番・号）まで。全角数字・漢数字にも対応。
            list.push({ kind: "address", regex: new RegExp(`${PREF}[^\\s、。，,]{1,24}?(?:市|区|郡|町|村)[^\\s、。，,]{0,30}?(?:${NUM}+(?:丁目|番地|番|号|${DASH})?)(?:[${NUM_CLASS}${DASH_CLASS}]{0,12})(?:[^\\s、。，,]{0,20}?(?:号室|号|階|F|ビル|マンション|ハイツ|コーポ|荘|レジデンス|タワー|棟))?`, "g") });
            // 郵便番号の直後に続く住所（「〒160-0022 東京都新宿区…」）も上の式で拾えます
        }
        if (config.ocrNames) {
            // 氏名（1）：ラベルの後ろ。「氏名：山田 太郎」「契約者名 山田太郎」など。ラベルの次から行末（または次のラベルまで）を隠します
            list.push({ kind: "name", regex: new RegExp(`(?:${NAME_LABELS})(?:[\\s　]*[：:;；・･｜|=＝][\\s　]*|[\\s　]+)((?!${NAME_LABELS})[^\\s　：:/／|｜]{1,12}(?:[\\s　][^\\s　：:/／|｜]{1,12})?)`, "g"), group: 1 });   // ラベルの後ろに区切り（：や、OCR が「：」を読み違えやすい「・」「;」など）か空白が必要（「契約者情報」のような見出しを誤って隠さないため）
            // 氏名（2）：敬称の前。「山田 太郎 様」「ヤマダタロウ様」「田中さん」。名前部分だけを隠します
            list.push({ kind: "name", regex: new RegExp(`([一-龥々ァ-ヶー]{1,6}(?:[\\s　][一-龥々ァ-ヶー]{1,6})?)[\\s　]?(?:様|さま|殿|さん|氏)(?![一-龥ぁ-ん])`, "g"), group: 1 });
        }
        return list;
    }
    const PREF = "(?:北海道|東京都|京都府|大阪府|(?:青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)県)";
    const NUM_CLASS = "0-9０-９〇一二三四五六七八九十百";
    const NUM = `[${NUM_CLASS}]`;
    const DASH_CLASS = "\\-－ー−‐の";
    const DASH = `[${DASH_CLASS}]`;
    const NAME_LABELS = "氏名|お名前|名前|ご契約者名?|契約者名?|入居者名?|申込者名?|申込人|担当者名?|ご担当者名?|代表者名?|オーナー名?|所有者名?|保証人名?|連帯保証人名?|借主名?|貸主名?|名義人?|受取人名?|申請者名?|依頼者名?|宛名|お客様名|顧客名|利用者名|本人氏名|フリガナ|ふりがな|カナ氏名";

    /**
     * 1行の単語列を「空白区切り」と「区切りなし」の2通りの文字列にして検索し、一致した文字範囲にかかる単語を返します。
     * 日本語は単語の切れ目が不定なので区切りなしでも探し、電話番号の「03 1234 5678」のような並びは空白区切りで拾います。
     */
    function matchWords(words, patterns) {
        const hit = new Map();   // 単語 index → 種別
        const variants = [" ", ""].map((separator) => {
            let text = "";
            const spans = [];
            words.forEach((word, index) => {
                if (index > 0) text += separator;
                // 全角の数字・記号は半角に揃えて照合します（v0.7.11）。1文字→1文字の変換なので単語の位置（span）はずれません
                const wordText = PG().normalizeWidth(word.text);
                spans.push({ index, start: text.length, end: text.length + wordText.length });
                text += wordText;
            });
            return { text, spans };
        });
        variants.forEach(({ text, spans }) => {
            patterns.forEach(({ kind, regex, group }) => {
                regex.lastIndex = 0;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    let start = match.index;
                    let end = start + match[0].length;
                    if (end <= start) { regex.lastIndex += 1; continue; }
                    // 捕捉グループ指定（氏名など）：一致全体ではなく、その部分だけを隠します
                    const groupIndex = Number(group) || 0;
                    if (groupIndex > 0 && typeof match[groupIndex] === "string" && match[groupIndex]) {
                        const offset = match[0].indexOf(match[groupIndex]);
                        if (offset >= 0) { start = match.index + offset; end = start + match[groupIndex].length; }
                    }
                    spans.forEach((span) => { if (span.end > start && span.start < end) hit.set(span.index, hit.get(span.index) || kind); });
                }
            });
        });
        return hit;
    }

    /** 一致した単語をまとめて矩形にします（同じ行で隣り合う単語は1つの矩形に）。 */
    function rectsFromLine(line, hit, scale, width, height) {
        const rects = [];
        let current = null;
        line.words.forEach((word, index) => {
            const kind = hit.get(index);
            if (!kind) { if (current) { rects.push(current); current = null; } return; }
            const box = { x0: word.x0, y0: word.y0, x1: word.x1, y1: word.y1 };
            if (current && index === current.last + 1) {
                current.x0 = Math.min(current.x0, box.x0); current.y0 = Math.min(current.y0, box.y0);
                current.x1 = Math.max(current.x1, box.x1); current.y1 = Math.max(current.y1, box.y1);
                current.last = index;
                current.text += word.text;
            } else {
                if (current) rects.push(current);
                current = { ...box, last: index, kind, text: word.text };
            }
        });
        if (current) rects.push(current);
        const pad = 2 * scale;
        return rects.map((rect) => ({
            kind: rect.kind,
            text: rect.text,
            x: PG().clamp((rect.x0 - pad) / scale / width, 0, 1),
            y: PG().clamp((rect.y0 - pad) / scale / height, 0, 1),
            width: PG().clamp((rect.x1 - rect.x0 + pad * 2) / scale / width, 0.002, 1),
            height: PG().clamp((rect.y1 - rect.y0 + pad * 2) / scale / height, 0.002, 1)
        }));
    }

    /* ===== 項目名（ラベル）からの推定（v0.7.5） =====
     * 業務画面は「項目名 ｜ 値」の表や、「項目名」の下の行に値が来る形が多く、値だけでは住所・氏名と分かりません。
     * そこで、項目名に当たる語（住所・都道府県・地番・担当者・氏名 など）を見つけ、
     *   ① 同じ行でその語の後ろに続く語、② 同じ高さで右隣にある行、③ すぐ下の行
     * の順に「値」を探して黒塗りします。値が別の項目名だった場合は隠しません（空欄の項目対策）。 */
    // 項目名の語彙は shared.js（PrivacyGuide.FIELD_LABEL_PATTERNS）に一本化しています（v0.7.9）。
    // OCR で値を推定する対象は従来どおり「郵便番号・住所・氏名」の3種です。
    const OCR_LABEL_KINDS = ["postalCode", "address", "name", "birth"];   // birth：生年月日・年齢（v0.7.15）

    function lineBox(line) {
        return {
            x0: Math.min(...line.words.map((w) => w.x0)), y0: Math.min(...line.words.map((w) => w.y0)),
            x1: Math.max(...line.words.map((w) => w.x1)), y1: Math.max(...line.words.map((w) => w.y1))
        };
    }

    /**
     * 行の語を「見た目のかたまり（トークン）」にまとめます。OCR は「都 道 府 県」「住所 情報」のように1語を細かく分けるため、
     * 隣の語との隙間が行の高さの 6 割未満なら同じかたまりとみなします（空白1つ分の隙間があれば別のかたまり）。
     * text：全部つないだ文字、textCore：他の語の枠にすっぽり入る語（同じ場所の重複読み）を除いた文字。
     */
    function tokenize(line) {
        const box = lineBox(line);
        const lineH = Math.max(1, box.y1 - box.y0);
        const tokens = [];
        line.words.forEach((word, index) => {
            const last = tokens[tokens.length - 1];
            if (last && word.x0 - last.x1 < lineH * 0.6) {
                const inside = word.x0 >= last.x0 - 2 && word.x1 <= last.x1 + 2;
                last.text += word.text;
                if (!inside) last.textCore += word.text;
                last.x0 = Math.min(last.x0, word.x0); last.y0 = Math.min(last.y0, word.y0);
                last.x1 = Math.max(last.x1, word.x1); last.y1 = Math.max(last.y1, word.y1);
                last.indexes.push(index);
            } else {
                tokens.push({ text: word.text, textCore: word.text, x0: word.x0, y0: word.y0, x1: word.x1, y1: word.y1, indexes: [index] });
            }
        });
        return tokens;
    }

    function labelKind(text, settings) {
        return PG().fieldLabelKind(text, settings, OCR_LABEL_KINDS);
    }

    /** トークン index から始まる項目名を判定します。戻り値 { kind, count }（count＝項目名を構成するトークン数）または null。 */
    function labelAt(tokens, index, settings) {
        const token = tokens[index];
        if (!token) return null;
        let kind = labelKind(token.text, settings) || labelKind(token.textCore, settings);
        if (kind) return { kind, count: 1 };
        // 「ポータル 都道府県」のように空白1つ程度で分かれた項目名（離れていれば別の項目・値なのでつなぎません）
        const next = tokens[index + 1];
        if (next && next.x0 - token.x1 < tokenHeight(token, next) * 1.5) {
            kind = labelKind(token.text + next.text, settings) || labelKind(token.textCore + next.textCore, settings);
            if (kind) return { kind, count: 2 };
        }
        return null;
    }

    function tokenHeight(a, b) {
        return Math.max(1, a.y1 - a.y0, b ? b.y1 - b.y0 : 0);
    }

    /**
     * 値の行から、次の項目名が出るまでの語（word index）を返します（空欄の項目の後ろに別の項目名が来ても隠しません）。
     * 表の別の列のように大きく離れたかたまり（隙間が高さの 3 倍超）は同じ値とみなしません。
     */
    function valueWords(tokens, startToken, settings) {
        const picked = [];
        for (let t = startToken; t < tokens.length; t += 1) {
            if (labelAt(tokens, t, settings)) break;
            if (t > startToken && tokens[t].x0 - tokens[t - 1].x1 > tokenHeight(tokens[t - 1], tokens[t]) * 3) break;
            picked.push(...tokens[t].indexes);
        }
        return picked;
    }

    /** 同じ場所を二重に隠さないよう、他の矩形に 8 割以上含まれる矩形を落とします（正規表現と項目名の両方で見つかった値など）。 */
    function dedupeRects(rects) {
        const area = (r) => Math.max(0, r.width) * Math.max(0, r.height);
        const overlap = (a, b) => {
            const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
            const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
            return Math.max(0, w) * Math.max(0, h);
        };
        const sorted = rects.slice().sort((a, b) => area(b) - area(a));
        const kept = [];
        sorted.forEach((rect) => {
            const covered = kept.some((other) => overlap(other, rect) / Math.max(1e-9, area(rect)) >= 0.8);
            if (!covered) kept.push(rect);
        });
        return kept;
    }

    function labelBasedRects(lines, settingsInput, scale, width, height) {
        const settings = PG().mergeSettings(settingsInput);
        if (!settings.ocrNames && !settings.ocrAddresses && !settings.autoRedactPostalCode && !settings.autoRedactBirth) return [];   // birth：v0.7.15
        const boxes = lines.map(lineBox);
        const tokensOf = lines.map(tokenize);
        const rects = [];
        const pushRect = (line, indexes, kind) => {
            if (!indexes.length) return;
            const hit = new Map(indexes.map((i) => [i, kind]));
            const text = indexes.map((i) => line.words[i].text).join("");
            if (!text.replace(/[\s　。、．，.,：:ー－\-_/／|｜]/g, "")) return;   // 記号だけの値は隠さない
            rects.push(...rectsFromLine(line, hit, scale, width, height));
        };
        lines.forEach((line, lineIndex) => {
            const tokens = tokensOf[lineIndex];
            for (let t = 0; t < tokens.length; t += 1) {
                const label = labelAt(tokens, t, settings);
                if (!label) continue;
                const afterToken = t + label.count;
                // ① 同じ行の後ろ（隙間で区切られた次のかたまりから、次の項目名の手前まで）
                const same = valueWords(tokens, afterToken, settings);
                if (same.length) {
                    pushRect(line, same, label.kind);
                    while (t + 1 < tokens.length && tokens[t + 1].indexes[0] <= same[same.length - 1]) t += 1;
                    continue;
                }
                // ② 同じ高さで右隣の行 ③ すぐ下の行
                const box = boxes[lineIndex];
                const labelH = Math.max(1, box.y1 - box.y0);
                const labelCy = (box.y0 + box.y1) / 2;
                let right = null;
                let below = null;
                lines.forEach((other, otherIndex) => {
                    if (otherIndex === lineIndex) return;
                    const ob = boxes[otherIndex];
                    const overlap = Math.min(box.y1, ob.y1) - Math.max(box.y0, ob.y0);
                    const sameRow = overlap > Math.min(labelH, ob.y1 - ob.y0) * 0.5;
                    if (sameRow && ob.x0 >= box.x1 - labelH * 0.2 && ob.x0 - box.x1 < width * scale * 0.35) {
                        if (right === null || ob.x0 < boxes[right].x0) right = otherIndex;
                    }
                    const gap = ob.y0 - box.y1;
                    const xNear = ob.x0 < box.x1 + labelH * 2 && ob.x1 > box.x0 - labelH * 2;
                    if (gap >= -labelH * 0.2 && gap < labelH * 1.8 && xNear && ob.y0 > labelCy) {
                        if (below === null || ob.y0 < boxes[below].y0) below = otherIndex;
                    }
                });
                const targetIndex = right !== null ? right : below;
                if (targetIndex === null) { t = afterToken - 1; continue; }
                pushRect(lines[targetIndex], valueWords(tokensOf[targetIndex], 0, settings), label.kind);
                t = afterToken - 1;
            }
        });
        return rects;
    }

    /* ===== OCR＋AI方式（v0.7.6）：Chrome 内蔵 AI（Google Gemini Nano・Prompt API）で人名を追加検出 =====
     * OCR で読み取った文章だけを Chrome 内蔵の AI に渡し、「人名はどれか」を答えてもらいます。AI は端末内で動き、外部送信はありません。
     * 返ってきた名前を OCR の単語の位置と照合して黒塗りにします。AI が使えない（未準備・非対応 PC・エラー）ときは OCR方式のまま続けます。 */
    const AI_LANG_OPTIONS = { expectedInputs: [{ type: "text", languages: ["ja", "en"] }], expectedOutputs: [{ type: "text", languages: ["ja"] }] };
    const AI_SYSTEM = "あなたは業務画面のスクリーンショットを OCR で読み取ったテキストから、個人の氏名（人名）だけを抜き出す係です。会社名・物件名・建物名・地名・駅名・部署名・項目名（「担当者」「氏名」など）は含めません。姓と名の間の空白はそのままにし、敬称（様・さん・殿）は外します。人名が無ければ空の配列を返します。";
    const AI_SCHEMA = { type: "object", properties: { names: { type: "array", items: { type: "string" }, maxItems: 40 } }, required: ["names"] };
    const AI_TIMEOUT_MS = 30000;
    let aiBasePromise = null;
    let aiBaseSession = null;

    function aiApi() { return typeof root.LanguageModel?.create === "function" ? root.LanguageModel : null; }

    /** 使える状態か："available"（準備済み）／"downloadable"（未準備）／"downloading"（準備中）／"unavailable"（この PC では不可）／"unsupported"（この Chrome に無い） */
    async function aiAvailability() {
        const api = aiApi();
        if (!api || typeof api.availability !== "function") return "unsupported";
        try { return String(await api.availability(AI_LANG_OPTIONS)); }
        catch (_error) {
            try { return String(await api.availability()); } catch (_again) { return "unavailable"; }
        }
    }

    /** 詳細設定のボタンから：Chrome に AI を準備させます（初回はモデルの取得が走ります。進み具合は onProgress(0〜1)）。戻り値は準備後の状態。 */
    async function aiEnable(onProgress) {
        const api = aiApi();
        if (!api) throw new Error("この Chrome では Chrome 内蔵 AI を使えません");
        const monitor = (m) => { try { m.addEventListener("downloadprogress", (event) => { try { onProgress?.(Number(event.loaded) || 0); } catch (_e) { /* noop */ } }); } catch (_e) { /* noop */ } };
        let session;
        try { session = await api.create({ ...AI_LANG_OPTIONS, monitor }); }
        catch (_error) { session = await api.create({ monitor }); }
        try { session?.destroy?.(); } catch (_e) { /* noop */ }
        return aiAvailability();
    }

    /** 指示文（system）を持った土台のセッションを1回だけ作り、手順ごとに複製して使います（会話が溜まらないように）。 */
    function aiBase() {
        if (aiBasePromise) return aiBasePromise;
        const api = aiApi();
        if (!api) return Promise.reject(new Error("unsupported"));
        aiBasePromise = (async () => {
            const options = { initialPrompts: [{ role: "system", content: AI_SYSTEM }] };
            let session;
            try { session = await api.create({ ...AI_LANG_OPTIONS, ...options }); }
            catch (_error) { session = await api.create(options); }
            aiBaseSession = session;
            return session;
        })().catch((error) => { aiBasePromise = null; aiBaseSession = null; throw error; });
        return aiBasePromise;
    }

    function withTimeout(promise, ms) {
        let timer = 0;
        const timeout = new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error("timeout")), ms); });
        return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    }

    /** OCR の行テキストを AI に渡して人名の一覧を返します。戻り値 { status:"used"|"unavailable"|"error", names:[], error } */
    async function aiNames(lines, onProgress) {
        const status = await aiAvailability();
        if (status !== "available") return { status: "unavailable", names: [], error: status };
        const text = lines.map((line) => line.text).filter(Boolean).join("\n").slice(0, 4000);
        if (!text.trim()) return { status: "used", names: [], error: "" };
        let session = null;
        try {
            try { onProgress?.({ status: "ai", progress: 0 }); } catch (_e) { /* noop */ }
            const base = await aiBase();
            session = typeof base.clone === "function" ? await base.clone() : base;
            const answer = await withTimeout(session.prompt(`次のテキストから人名だけを抜き出してください。\n---\n${text}`, { responseConstraint: AI_SCHEMA }), AI_TIMEOUT_MS);
            const parsed = JSON.parse(String(answer || "{}"));
            const names = (Array.isArray(parsed?.names) ? parsed.names : [])
                .map((name) => String(name || "").replace(/[\s　]+/g, " ").trim())
                .filter((name) => name.length >= 2 && name.length <= 20 && !/^[0-9０-９\-－ー・:：\s]+$/.test(name))
                .slice(0, 40);
            return { status: "used", names: [...new Set(names)], error: "" };
        } catch (error) {
            return { status: "error", names: [], error: PG().cleanText(error?.message || error, 80) };
        } finally {
            if (session && session !== aiBaseSession) { try { session.destroy?.(); } catch (_e) { /* noop */ } }
        }
    }

    /** AI が返した名前を OCR の単語と照合して矩形にします（空白あり・なしの両方で探します）。 */
    function rectsForNames(lines, names, settings, scale, width, height) {
        const patterns = [];
        names.forEach((name) => {
            const compact = name.replace(/[\s　]/g, "");
            if (labelKind(compact, settings)) return;   // 「担当者」などの項目名を名前と答えた場合は無視
            [...new Set([name, compact])].forEach((variant) => {
                const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                if (escaped) patterns.push({ kind: "name", regex: new RegExp(escaped, "g") });
            });
        });
        if (!patterns.length) return [];
        const rects = [];
        lines.forEach((line) => {
            const hit = matchWords(line.words, patterns);
            if (hit.size) rects.push(...rectsFromLine(line, hit, scale, width, height));
        });
        return rects;
    }

    async function terminateAi() {
        const pending = aiBasePromise;
        aiBasePromise = null;
        aiBaseSession = null;
        if (!pending) return;
        try { const session = await pending; session?.destroy?.(); } catch (_error) { /* noop */ }
    }

    /**
     * 画像（data URL）を読み取り、詳細設定の条件に一致する部分の矩形（画像に対する 0〜1 の割合）を返します。
     * 戻り値：{ ok, rects:[{x,y,width,height,kind,text}], lines:[{text}], wordCount, elapsedMs, error, aiStatus, aiError, aiMs }
     * aiStatus は "off"（OCR＋AI方式でない）／"used"／"unavailable"（AI 未準備・非対応）／"error"。
     * OCR が使えないときは ok:false と理由を返します（従来の自動マスクへの切り替えは呼び出し側が行います）。
     */
    async function findSensitiveRects(imageSrc, settings, onProgress) {
        const startedAt = performance.now();
        if (!available()) return { ok: false, error: "文字認識の部品（Tesseract.js）が読み込まれていません", rects: [], lines: [], wordCount: 0, elapsedMs: 0 };
        const image = await loadImage(imageSrc);
        if (!image) return { ok: false, error: "画像を読み込めませんでした", rects: [], lines: [], wordCount: 0, elapsedMs: 0 };
        let worker;
        try { worker = await getWorker(onProgress); }
        catch (error) { return { ok: false, error: lastError || describeError(error), rects: [], lines: [], wordCount: 0, elapsedMs: performance.now() - startedAt }; }
        const { canvas, scale, width, height } = prepare(image);
        let data;
        try {
            const result = await worker.recognize(canvas, {}, { blocks: true, text: true });
            data = result?.data;
        } catch (error) {
            return { ok: false, error: describeError(error), rects: [], lines: [], wordCount: 0, elapsedMs: performance.now() - startedAt };
        }
        const lines = flattenLines(data);
        const patterns = patternsFor(settings);
        const rects = [];
        lines.forEach((line) => {
            const hit = matchWords(line.words, patterns);
            if (hit.size) rects.push(...rectsFromLine(line, hit, scale, width, height));
        });
        // 項目名（ラベル）から値の位置を推定（v0.7.5）：「都道府県｜東京都」「管理部担当者／熊谷 奈々」のような画面向け
        rects.push(...labelBasedRects(lines, settings, scale, width, height));
        // OCR＋AI方式（v0.7.6）：Chrome 内蔵 AI に人名を挙げてもらい、位置を照合して追加（「氏名を検出」が ON のときだけ）
        const config = PG().mergeSettings(settings);
        let aiStatus = "off";
        let aiError = "";
        let aiMs = 0;
        // v0.7.8：Chrome 内蔵 AI（OCR＋AI方式）は提供を見送ったため、ここは常に false になります。
        // 将来 Chrome 側の状況が変わったときのために、下の処理と ocr.js 内の AI 関連コードはそのまま残しています。
        if (config.maskEngine === "ocrAi" && config.ocrNames) {
            const aiStartedAt = performance.now();
            const ai = await aiNames(lines, onProgress);
            aiMs = performance.now() - aiStartedAt;
            aiStatus = ai.status;
            aiError = ai.error || "";
            if (ai.status === "used" && ai.names.length) rects.push(...rectsForNames(lines, ai.names, config, scale, width, height));
        }
        return {
            ok: true,
            rects: dedupeRects(rects),
            lines: lines.map((line) => ({ text: line.text })),
            wordCount: lines.reduce((sum, line) => sum + line.words.length, 0),
            elapsedMs: performance.now() - startedAt,
            error: "",
            aiStatus,
            aiError,
            aiMs
        };
    }

    root.PrivacyGuideOcr = { available, findSensitiveRects, terminate, getWorker, LANGS, aiAvailability, aiEnable, aiNames };
})(typeof globalThis !== "undefined" ? globalThis : this);
