(function () {
    "use strict";

    const PG = globalThis.PrivacyGuide;
    const elements = {
        guideTitle: document.getElementById("guideTitle"),
        guideDescription: document.getElementById("guideDescription"),
        saveState: document.getElementById("saveState"),
        stepSummary: document.getElementById("stepSummary"),
        stepList: document.getElementById("stepList"),
        canvas: document.getElementById("editorCanvas"),
        canvasStage: document.getElementById("canvasStage"),
        emptyCanvas: document.getElementById("emptyCanvas"),
        stepDescription: document.getElementById("stepDescription"),
        stepNotes: document.getElementById("stepNotes"),
        retakeStep: document.getElementById("retakeStep"),
        selectedStepIndex: document.getElementById("selectedStepIndex"),
        pageTitle: document.getElementById("pageTitle"),
        pageUrl: document.getElementById("pageUrl"),
        undoButton: document.getElementById("undoButton"),
        redoButton: document.getElementById("redoButton"),
        exportMenu: document.getElementById("exportMenu"),
        libraryDialog: document.getElementById("libraryDialog"),
        libraryList: document.getElementById("libraryList"),
        previewDialog: document.getElementById("previewDialog"),
        previewContent: document.getElementById("previewContent"),
        annotationColor: document.getElementById("annotationColor"),
        annotationSize: document.getElementById("annotationSize"),
        annotationFont: document.getElementById("annotationFont"),
        colorButton: document.getElementById("colorButton"),
        colorChip: document.getElementById("colorChip"),
        colorPopover: document.getElementById("colorPopover"),
        basePalette: document.getElementById("basePalette"),
        recentPalette: document.getElementById("recentPalette"),
        recentGroup: document.getElementById("recentGroup"),
        themePalette: document.getElementById("themePalette"),
        styleScope: document.getElementById("styleScope"),
        targetStyleButton: document.getElementById("targetStyleButton"),
        targetChip: document.getElementById("targetChip"),
        saveTargetDefault: document.getElementById("saveTargetDefault"),
        imageInput: document.getElementById("imageInput"),
        deleteAnnotation: document.getElementById("deleteAnnotation"),
        textBackground: document.getElementById("textBackground"),
        textBackgroundPair: document.getElementById("textBackgroundPair"),
        textBackgroundSlider: document.getElementById("textBackgroundSlider"),
        textBorderWidth: document.getElementById("textBorderWidth"),
        textBorderColorButton: document.getElementById("textBorderColorButton"),
        textBorderChip: document.getElementById("textBorderChip"),
        textBackgroundColorButton: document.getElementById("textBackgroundColorButton"),
        textBackgroundChip: document.getElementById("textBackgroundChip"),
        highlighterOpacityPair: document.getElementById("highlighterOpacityPair"),
        textBorderGroup: document.getElementById("textBorderGroup"),
        textBackgroundGroup: document.getElementById("textBackgroundGroup"),
        highlighterGroup: document.getElementById("highlighterGroup"),
        highlightGroup: document.getElementById("highlightGroup"),
        highlightShape: document.getElementById("highlightShape"),
        highlightDash: document.getElementById("highlightDash"),
        arrowGroup: document.getElementById("arrowGroup"),
        arrowLine: document.getElementById("arrowLine"),
        arrowStart: document.getElementById("arrowStart"),
        arrowEnd: document.getElementById("arrowEnd"),
        arrowHeadSize: document.getElementById("arrowHeadSize"),
        arrowConnect: document.getElementById("arrowConnect"),
        highlightFillGroup: document.getElementById("highlightFillGroup"),
        fillColorButton: document.getElementById("fillColorButton"),
        fillChip: document.getElementById("fillChip"),
        fillOpacity: document.getElementById("fillOpacity"),
        fillOpacitySlider: document.getElementById("fillOpacitySlider"),
        shapeTextGroup: document.getElementById("shapeTextGroup"),
        shapeTextColorButton: document.getElementById("shapeTextColorButton"),
        shapeTextChip: document.getElementById("shapeTextChip"),
        shapeTextSize: document.getElementById("shapeTextSize"),
        shapeTextAlign: document.getElementById("shapeTextAlign"),
        shapeTextValign: document.getElementById("shapeTextValign"),
        orderGroup: document.getElementById("orderGroup"),
        groupGroup: document.getElementById("groupGroup"),
        canvasMenu: document.getElementById("canvasMenu"),
        textKindGroup: document.getElementById("textKindGroup"),
        textKind: document.getElementById("textKind"),
        textAlign: document.getElementById("textAlign"),
        textValign: document.getElementById("textValign"),
        textDirection: document.getElementById("textDirection"),
        highlighterOpacity: document.getElementById("highlighterOpacity"),
        highlighterOpacitySlider: document.getElementById("highlighterOpacitySlider"),
        textEditor: document.getElementById("textEditor"),
        imageBar: document.getElementById("imageBar"),
        zoomResetButton: document.getElementById("zoomResetButton"),
        frameResetWrap: document.getElementById("frameResetWrap"),
        frameResetButton: document.getElementById("frameResetButton"),
        frameResetMenu: document.getElementById("frameResetMenu"),
        baseImageOnly: document.getElementById("baseImageOnly"),
        imageBarState: document.getElementById("imageBarState"),
        pageOrientation: document.getElementById("pageOrientation"),
        paperSize: document.getElementById("paperSize"),
        layoutSummary: document.getElementById("layoutSummary"),
        pageRangeMode: document.getElementById("pageRangeMode"),
        pageRangeInput: document.getElementById("pageRangeInput"),
        pageRangeSummary: document.getElementById("pageRangeSummary"),
        layoutDialog: document.getElementById("layoutDialog"),
        layoutList: document.getElementById("layoutList"),
        layoutApply: document.getElementById("layoutApply"),
        undoBar: null
    };

    let session = null;
    let selectedStepId = null;
    let selectedTool = "select";
    let isSaving = false;
    let saveTimer = null;
    let pointerStart = null;
    let draftAnnotation = null;
    let imageToken = 0;
    let drawFrame = 0;
    // ページ指定は出力のたびの選択なので、保存はしません（既定は全ページ）。
    let pageRange = { mode: "all", text: "", sections: [] };   // sections：「セクションを選ぶ」で選んだ章（章の先頭の手順 id。章なしは "__none"）v0.7.16
    let pendingLayoutId = null;
    const STYLE_KEY = "pgAnnotationStyle";
    const RECENT_KEY = "pgRecentColors";
    const RECENT_LIMIT = 10;
    const DEFAULT_SIZE = 2;
    const DEFAULT_STYLE = { color: "#d92d20", size: DEFAULT_SIZE };
    const PT_SIZES = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20];
    const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
    const HANDLE_RATIO = 0.02;
    const STANDARD_PALETTE = ["#c00000", "#ff0000", "#ffc000", "#ffff00", "#92d050", "#00b050", "#00b0f0", "#0070c0", "#002060", "#7030a0"];
    const THEME_BASE = ["#ffffff", "#000000", "#e7e6e6", "#44546a", "#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"];
    const TOOL_STYLE_KEYS = ["blur", "redact", "highlight", "arrow", "text", "marker", "pen", "highlighter"];
    // オブジェクトの順序のボタン（v0.6.26）。読み込み時に使うので先に置きます。
    const ORDER_BUTTONS = { front: "orderFront", forward: "orderForward", backward: "orderBackward", back: "orderBack" };
    // グループ化のボタン（v0.6.28）。
    const GROUP_BUTTONS = { group: "groupObjects", ungroup: "ungroupObjects", regroup: "regroupObjects" };
    const TOOL_LABELS = { select: "—", blur: "ぼかし", redact: "黒塗り", highlight: "図形", arrow: "矢印", text: "文字", target: "操作手順番号", marker: "操作手順番号", image: "画像", zoom: "拡大図", pen: "ペン", highlighter: "蛍光ペン", eraser: "消しゴム", draw: "フリーハンド" };
    const DEFAULT_TOOL_STYLES = {
        blur: { color: "#111111", size: 2 },
        redact: { color: "#111111", size: 2 },
        highlight: {
            color: "#d92d20", size: 2, shape: "rect", dash: "solid",
            fillColor: "#ffffff", fillOpacity: 0,
            textColor: "#111111", textSize: 12, textAlign: "center", textValign: "middle"
        },
        arrow: { color: "#d92d20", size: 2, arrowLine: "straight", arrowStart: "none", arrowEnd: "triangle", arrowHeadSize: "sm", arrowConnect: true },
        text: { color: "#d92d20", size: 12, font: "system", background: 90, backgroundColor: "#ffffff", borderWidth: 0, borderColor: "#d92d20", textMode: "plain", align: "left", valign: "top", vert: "horizontal" },
        marker: { color: "#d92d20", size: 2 },
        pen: { color: "#d92d20", size: 2 },
        highlighter: { color: "#ffff00", size: 8, opacity: 40 }
    };
    let toolStyles = JSON.parse(JSON.stringify(DEFAULT_TOOL_STYLES));
    let recentColors = [];
    let selectedAnnotationId = null;
    // 選択中の注釈ID。1つだけのときも配列で持ちます（グループ化のための複数選択・v0.6.28）。
    let selectionIds = [];
    // 直前に解除したグループ（再グループ化で復元します）。
    let lastUngroupedIds = [];
    let targetStyleMode = false;
    // 色パレットをどの項目に適用するか（"color" 本体 / "borderColor" 文字の枠線 / "backgroundColor" 文字の背景）
    let colorTargetKey = "color";
    let appSettings = PG.mergeSettings();
    let dragMode = null;
    /* 選択ツールで撮影画像を選んでいる状態（v0.7.24）。Alt+クリックで選び、ハンドルで大きさを変えられます。
     * オブジェクト（注釈）の選択とは排他で、setSelection() に何か入ると外れます。 */
    let frameSelected = false;
    let dragOrigin = null;
    // 選択ツールで何もない所からドラッグしたときの「囲み選択」の枠（PowerPoint風）。
    let marquee = null;
    // トリミング中の状態（v0.6.29）。target は "base"（撮影画像）か貼り付け画像の注釈ID。
    let cropState = null;
    const readyImages = new Map();
    const stepUndo = [];
    const stepRedo = [];
    const editUndo = [];
    const editRedo = [];
    const HISTORY_LIMIT = 60;
    let lastCoalesceKey = "";
    let lastCoalesceAt = 0;
    let editingAnnotationId = null;
    let editingIsNew = false;
    let previewPageWidthPx = 0;
    const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1"/><path d="M6.4 6.5C3.7 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.3-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
    const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/></svg>';
    const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 4h4M9 7v12M15 7v12M6 7l1 13h10l1-13"/></svg>';
    const imageCache = new Map();


    async function message(payload) {
        try {
            const response = await chrome.runtime.sendMessage(payload);
            if (response?.error) throw new Error(response.error);
            return response || {};
        } catch (error) {
            setSaveState(PG.cleanText(error?.message || "処理に失敗しました", 160), "#b42318");
            return {};
        }
    }

    function currentStep() {
        return session?.steps?.find((step) => step?.id === selectedStepId) || null;
    }

    function deepCopy(value) {
        return JSON.parse(JSON.stringify(value ?? null));
    }

    function markerFromTarget(target, color, size, label) {
        return {
            id: PG.createId("annotation"),
            type: "marker",
            fromTarget: true,
            label: String(label),
            x: PG.clamp(target.x, 0, 1),
            y: PG.clamp(target.y, 0, 1),
            width: PG.clamp(target.width, 0.004, 1),
            height: PG.clamp(target.height, 0.004, 1),
            color,
            size
        };
    }

    /* ---- 撮影画像の枠（v0.6.29） ----
     * キャンバス（＝出力1ページ）の大きさは撮影画像の元の大きさで固定。撮影画像は
     * その中の1つのオブジェクトとして、位置・大きさ（x,y,width,height）と
     * 元画像のどこを使うか（crop）を持ちます。すべて 0〜1 の正規化座標です。 */
    function finiteOr(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function normalizeCrop(crop) {
        const source = crop && typeof crop === "object" ? crop : {};
        const x = PG.clamp(finiteOr(source.x, 0), 0, 0.99);
        const y = PG.clamp(finiteOr(source.y, 0), 0, 0.99);
        return {
            x, y,
            width: PG.clamp(finiteOr(source.width, 1), 0.01, 1 - x),
            height: PG.clamp(finiteOr(source.height, 1), 0.01, 1 - y)
        };
    }

    function normalizeFrame(frame) {
        const source = frame && typeof frame === "object" ? frame : {};
        return {
            x: PG.clamp(finiteOr(source.x, 0), -4, 4),
            y: PG.clamp(finiteOr(source.y, 0), -4, 4),
            width: PG.clamp(finiteOr(source.width, 1), 0.01, 8),
            height: PG.clamp(finiteOr(source.height, 1), 0.01, 8),
            crop: normalizeCrop(source.crop)
        };
    }

    function stepFrame(step) {
        return normalizeFrame(step?.frame);
    }

    function isDefaultCrop(crop) {
        return Math.abs(crop.x) < 1e-6 && Math.abs(crop.y) < 1e-6 && Math.abs(crop.width - 1) < 1e-6 && Math.abs(crop.height - 1) < 1e-6;
    }

    function isDefaultFrame(frame) {
        return Math.abs(frame.x) < 1e-6 && Math.abs(frame.y) < 1e-6 && Math.abs(frame.width - 1) < 1e-6
            && Math.abs(frame.height - 1) < 1e-6 && isDefaultCrop(frame.crop);
    }

    /* ---- 非表示スライドとセクション（v0.6.34） ----
     * step.hidden = true の手順は出力・スライドショーから外れます（編集画面には薄く残る）。
     * step.section = { id, title, collapsed } を持つ手順が「セクション（章）の先頭」です。
     * 先頭の見出しより前の手順は「セクションなし」。折りたたみは一覧の表示だけの話です。 */
    function normalizeSection(section) {
        if (!section || typeof section !== "object") return null;
        return {
            id: section.id || PG.createId("section"),
            title: PG.cleanText(section.title, 80) || "セクション",
            collapsed: Boolean(section.collapsed),
            // 見出しページを出力に挟むか（v0.7.25）。true／false はこのセクションだけの指定、null＝詳細設定「セクション見出しのページを出力に挟む」に従う
            page: section.page === true ? true : (section.page === false ? false : null)
        };
    }

    /** このセクションの見出しページを出力・スライドショーに挟むか（v0.7.25）。セクション個別の指定があればそれ、無ければ詳細設定の既定。 */
    function sectionPageEnabled(section) {
        if (!section) return false;
        if (section.page === true || section.page === false) return section.page;
        return Boolean(appSettings.sectionPages);
    }

    function visibleSteps() {
        return (session?.steps || []).filter((step) => step && !step.hidden);
    }

    /** セクションの範囲一覧 [{ start, end(含まない), section|null }]。 */
    function sectionRanges() {
        const steps = session?.steps || [];
        const ranges = [];
        let start = 0;
        let section = null;
        steps.forEach((step, index) => {
            if (!step?.section) return;
            if (index > start || section) ranges.push({ start, end: index, section });
            start = index;
            section = step.section;
        });
        if (steps.length > start || section) ranges.push({ start, end: steps.length, section });
        return ranges;
    }

    function sectionRangeOfIndex(index) {
        return sectionRanges().find((range) => index >= range.start && index < range.end) || null;
    }

    function maskAnnotations(step) {
        if (step.maskApplied) return [];
        const rects = Array.isArray(step.maskRects) ? step.maskRects : [];
        return rects.filter(Boolean).map((rect) => ({
            id: PG.createId("annotation"),
            type: "redact",
            fromMask: true,
            x: PG.clamp(rect.x, 0, 1),
            y: PG.clamp(rect.y, 0, 1),
            width: PG.clamp(rect.width, 0.002, 1),
            height: PG.clamp(rect.height, 0.002, 1),
            color: "#111111",
            size: 2
        }));
    }

    function withMarker(step, index, color, size) {
        const existing = Array.isArray(step.annotations) ? step.annotations.filter(Boolean) : [];
        const list = [...maskAnnotations(step), ...existing];
        if (step.markerApplied) return list;
        if (!step.target || typeof step.target !== "object") return list;
        if (list.some((item) => item?.type === "marker" && item.fromTarget)) return list;
        return [...list, markerFromTarget(step.target, color, size, index + 1)];
    }

    function normalizeSession(value) {
        const source = value && typeof value === "object" ? value : {};
        const markerColor = PG.normalizeHexColor(source.targetColor, appSettings.targetColor);
        const markerSize = normalizeSize(source.targetSize ?? appSettings.targetSize);
        const steps = Array.isArray(source.steps) ? source.steps.filter(Boolean).map((step, index) => ({
            id: step.id || PG.createId("step"),
            order: index + 1,
            action: step.action || "click",
            description: PG.cleanText(step.description, 300) || `手順 ${index + 1}`,
            pageTitle: PG.cleanText(step.pageTitle, 160),
            url: PG.safeUrl(step.url),
            createdAt: step.createdAt || new Date().toISOString(),
            screenshot: typeof step.screenshot === "string" ? step.screenshot : null,
            captureError: PG.cleanText(step.captureError, 200),
            maskRects: Array.isArray(step.maskRects) ? step.maskRects : [],
            maskApplied: Boolean(step.maskApplied) || (Array.isArray(step.maskRects) && step.maskRects.length > 0),
            maskBurnedIn: Boolean(step.maskBurnedIn),
            frame: step.frame && typeof step.frame === "object" ? normalizeFrame(step.frame) : null,
            blankScreenshot: Boolean(step.blankScreenshot),   // 撮影画像を切り取って白紙にした手順（v0.7.24）。Ctrl+V で画像を置き換える対象
            hidden: Boolean(step.hidden),
            notes: PG.cleanText(step.notes, 2000),   // 発表者ノート（話すこと）。出力には載せません（v0.6.43）
            section: normalizeSection(step.section),
            // この手順だけのデザイン上書き（v0.6.36）。変えた項目だけを持つ部分的な設定で、null＝ガイドの設定を使う。
            design: step.design && typeof step.design === "object" ? { ...step.design } : null,
            markerApplied: Boolean(step.markerApplied) || Boolean(step.target && typeof step.target === "object"),
            target: step.target && typeof step.target === "object" ? step.target : null,
            ocrAt: typeof step.ocrAt === "string" && step.ocrAt ? step.ocrAt : null,   // 画像内の文字の検出（OCR）を済ませた日時（v0.7.0）。null＝未処理
            annotations: withMarker(step, index, markerColor, markerSize)
        })) : [];
        return {
            schemaVersion: 1,
            id: source.id || PG.createId("guide"),
            title: PG.cleanText(source.title, 160) || "名称未設定のガイド",
            description: PG.cleanText(source.description, 500),
            status: source.status || "draft",
            createdAt: source.createdAt || new Date().toISOString(),
            updatedAt: source.updatedAt || new Date().toISOString(),
            sourceUrl: PG.safeUrl(source.sourceUrl),
            fontFamily: PG.normalizeFont(source.fontFamily ?? appSettings.fontFamily),
            orientation: source.orientation === "landscape" ? "landscape" : "portrait",
            layout: PG.pageLayout(source.layout, source.orientation).id,
            paperSize: PG.normalizePaperSize(source.paperSize),   // 用紙サイズ（v0.7.11）。未設定の古いガイドは A4
            targetColor: PG.normalizeHexColor(source.targetColor, appSettings.targetColor),
            targetSize: normalizeSize(source.targetSize ?? appSettings.targetSize),
            // このガイドだけのデザイン（v0.6.35）。null は「詳細設定の既定を使う」。
            design: source.design && typeof source.design === "object" ? PG.normalizeDesign(source.design) : null,
            // 表紙の項目（v0.6.43）。表紙を付けるかは詳細設定「出力」の ON/OFF。
            cover: PG.normalizeCover(source.cover),
            steps
        };
    }

    function renumberMarkers() {
        if (!Array.isArray(session?.steps)) return;
        let counter = 0;
        session.steps.forEach((step) => {
            (step.annotations || []).forEach((annotation) => {
                if (annotation?.type !== "marker") return;
                // 非表示の手順は出力されないので番号を詰めます（v0.6.34）。
                if (step.hidden) { annotation.label = "–"; return; }
                counter += 1;
                annotation.label = String(counter);
            });
        });
    }

    function updateOrders() {
        if (!Array.isArray(session?.steps)) return;
        session.steps.forEach((step, index) => { step.order = index + 1; });
        renumberMarkers();
    }

    let statusTimer = 0;

    function setSaveState(text, color, sticky) {
        window.clearTimeout(statusTimer);
        elements.saveState.textContent = text;
        elements.saveState.style.color = color || "#8a8a8a";
        if (sticky) return;
        statusTimer = window.setTimeout(() => {
            // 一定時間たったら消します（「ローカルに保存済み」を出しっぱなしにしない・v0.6.36 追補）
            elements.saveState.textContent = "";
            elements.saveState.style.color = "";
        }, 3200);
    }

    /* ---- 追加で撮影（v0.6.47）：このガイドに記録を続けている間は、背景（記録側）が保存の主になるので編集画面からは保存しません ---- */
    let recordingHere = false;
    let recordingBaseIds = new Set();   // 追加で撮影を始めた時点の手順 id（終了時に何件増えたかを数える）
    function scheduleSave(delay) {
        if (!session || recordingHere) return;
        window.clearTimeout(saveTimer);
        setSaveState("未保存の変更", "#8a8a8a", true);
        saveTimer = window.setTimeout(saveNow, Number(delay) || 450);
    }

    async function saveNow() {
        if (!session || isSaving || recordingHere) return;
        isSaving = true;
        setSaveState("保存中", "#8a8a8a", true);
        const result = await message({ type: "PG_SAVE_SESSION", session });
        if (result?.session) {
            session.updatedAt = result.session.updatedAt;
            setSaveState("ローカルに保存済み", "#1b5e20");
        }
        isSaving = false;
    }

    function stepMeta(step) {
        if (step?.screenshot) return "スクリーンショットあり";
        return step?.captureError || "画像なし";
    }

    function renderStepList() {
        elements.stepList.replaceChildren();
        const steps = Array.isArray(session?.steps) ? session.steps : [];
        const hiddenCount = steps.filter((step) => step?.hidden).length;
        elements.stepSummary.textContent = `${steps.length - hiddenCount} STEP${hiddenCount ? `（非表示 ${hiddenCount}）` : ""}`;
        if (!steps.length) {
            const empty = document.createElement("div");
            empty.className = "empty-canvas";
            empty.style.padding = "28px 12px";
            empty.innerHTML = "<strong>手順がありません</strong><span>右上の＋から追加できます。</span>";
            elements.stepList.appendChild(empty);
            return;
        }
        const ranges = sectionRanges();
        let visibleNumber = 0;
        steps.forEach((step, index) => {
            const range = ranges.find((item) => index >= item.start && index < item.end) || null;
            if (step.section && range && range.start === index) elements.stepList.appendChild(buildSectionHead(step, range));
            const number = step.hidden ? null : (visibleNumber += 1);
            if (range?.section?.collapsed) return;   // 折りたたみ中はカードを出しません（見出しだけ）
            elements.stepList.appendChild(buildStepCard(step, number));
        });
    }

    /** セクションの見出し行（名前・折りたたみ・件数・削除・ドラッグ）。 */
    function buildSectionHead(step, range) {
        const head = document.createElement("div");
        head.className = "section-head";
        head.draggable = true;
        head.dataset.sectionStart = step.id;
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "section-toggle";
        toggle.textContent = step.section.collapsed ? "▸" : "▾";
        toggle.title = step.section.collapsed ? "セクションを開く" : "セクションを折りたたむ（一覧の表示だけ。出力には関係ありません）";
        toggle.addEventListener("click", (event) => {
            event.stopPropagation();
            step.section = { ...step.section, collapsed: !step.section.collapsed };
            renderStepList();
            scheduleSave();
        });
        const title = document.createElement("span");
        title.className = "section-title";
        title.textContent = step.section.title;
        title.title = "クリックで名前を変更";
        title.addEventListener("click", (event) => { event.stopPropagation(); editSectionTitle(step, head, title); });
        const count = document.createElement("span");
        count.className = "section-count";
        const total = range.end - range.start;
        const hidden = (session?.steps || []).slice(range.start, range.end).filter((item) => item?.hidden).length;
        count.textContent = `${total - hidden}件${hidden ? `＋非表示${hidden}` : ""}`;
        // 見出しページを出力に挟むか（v0.7.25）。目のアイコン。個別の指定が無いときは詳細設定の既定に従い、title にその旨を出します
        const pageOn = sectionPageEnabled(step.section);
        const pageButton = document.createElement("button");
        pageButton.type = "button";
        pageButton.className = `section-page-toggle${pageOn ? "" : " off"}`;
        const followsDefault = step.section.page !== true && step.section.page !== false;
        pageButton.title = (pageOn
            ? "見出しページを出力に挟む：ON（出力・スライドショーに、このセクションの章タイトルのページが入ります）。クリックで挟まない"
            : "見出しページを出力に挟む：OFF（このセクションの章タイトルのページは出力・スライドショーに入りません）。クリックで挟む")
            + (followsDefault ? "（いまは詳細設定の既定に従っています）" : "（このセクションだけの指定）");
        pageButton.setAttribute("aria-label", pageButton.title);
        pageButton.innerHTML = pageOn ? ICON_EYE : ICON_EYE_OFF;
        pageButton.addEventListener("click", (event) => {
            event.stopPropagation();
            pushStepHistory();
            step.section = { ...step.section, page: !pageOn };
            renderStepList();
            updatePageRangeSummary();
            scheduleSave();
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "section-remove";
        remove.textContent = "×";
        remove.title = "セクションを削除（手順は残り、前のセクションに続きます）";
        remove.setAttribute("aria-label", "セクションを削除");
        remove.addEventListener("click", (event) => { event.stopPropagation(); removeSection(step.id); });
        const handle = document.createElement("span");
        handle.className = "drag-handle";
        handle.textContent = "⋮⋮";
        handle.title = "ドラッグでセクションごと並べ替え";
        head.append(toggle, title, count, pageButton, remove, handle);
        head.addEventListener("dragstart", (event) => {
            head.classList.add("dragging");
            event.dataTransfer?.setData("text/plain", `section:${step.id}`);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        });
        head.addEventListener("dragend", () => { head.classList.remove("dragging"); clearDropIndicator(); });
        head.addEventListener("dragover", (event) => {
            event.preventDefault();
            const rect = head.getBoundingClientRect();
            clearDropIndicator();
            head.classList.add(event.clientY < rect.top + rect.height / 2 ? "drop-before" : "drop-after");
        });
        head.addEventListener("dragleave", (event) => { if (!head.contains(event.relatedTarget)) head.classList.remove("drop-before", "drop-after"); });
        head.addEventListener("drop", (event) => {
            event.preventDefault();
            const before = head.classList.contains("drop-before");
            clearDropIndicator();
            const data = String(event.dataTransfer?.getData("text/plain") || "");
            // 見出しの前＝このセクションの先頭の前、見出しの後ろ＝先頭の手順の前（＝セクションの中の先頭）
            if (data.startsWith("section:")) reorderSection(data.slice(8), step.id, true);
            else reorderStep(data, step.id, true, !before);
        });
        return head;
    }

    function editSectionTitle(step, head, titleElement) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "section-edit";
        input.maxLength = 80;
        input.value = step.section.title;
        head.replaceChild(input, titleElement);
        head.draggable = false;
        let finished = false;
        const finish = (commit) => {
            if (finished) return;
            finished = true;
            const next = PG.cleanText(input.value, 80);
            if (commit && next && next !== step.section.title) {
                pushStepHistory();
                step.section = { ...step.section, title: next };
                scheduleSave();
            }
            renderStepList();
        };
        input.addEventListener("keydown", (event) => {
            event.stopPropagation();
            if (event.key === "Enter") { event.preventDefault(); finish(true); }
            if (event.key === "Escape") { event.preventDefault(); finish(false); }
        });
        input.addEventListener("blur", () => finish(true));
        input.addEventListener("click", (event) => event.stopPropagation());
        input.focus();
        input.select();
    }

    function buildStepCard(step, number) {
        const card = document.createElement("article");
        card.className = `step-card${step.id === selectedStepId ? " active" : ""}${step.hidden ? " hidden-step" : ""}`;
        card.draggable = true;
        card.dataset.id = step.id;
        const numberBadge = document.createElement("span");
        numberBadge.className = "step-number";
        numberBadge.textContent = step.hidden ? "非表示" : String(number).padStart(2, "0");
        numberBadge.title = step.hidden ? "この手順は出力・スライドショーに含まれません" : "";
        const copy = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = step.description;
        const meta = document.createElement("span");
        meta.textContent = stepMeta(step);
        copy.append(title, meta);
        const tools = document.createElement("div");
        tools.className = "step-card-tools";
        const eyeButton = document.createElement("button");
        eyeButton.type = "button";
        eyeButton.className = `eye${step.hidden ? " off" : ""}`;
        eyeButton.title = step.hidden ? "非表示中：クリックで表示に戻す（出力・スライドショーに含める）" : "この手順を非表示にする（出力・スライドショーから外す。編集画面には残ります）";
        eyeButton.setAttribute("aria-label", eyeButton.title);
        eyeButton.innerHTML = step.hidden ? ICON_EYE_OFF : ICON_EYE;
        eyeButton.addEventListener("click", (event) => { event.stopPropagation(); toggleStepHidden(step.id); });
        const duplicateButton = document.createElement("button");
        duplicateButton.type = "button";
        duplicateButton.title = "この手順を複製";
        duplicateButton.setAttribute("aria-label", "この手順を複製");
        duplicateButton.innerHTML = ICON_COPY;
        duplicateButton.addEventListener("click", (event) => { event.stopPropagation(); duplicateStep(step.id); });
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "danger";
        removeButton.title = "この手順を削除";
        removeButton.setAttribute("aria-label", "この手順を削除");
        removeButton.innerHTML = ICON_TRASH;
        removeButton.addEventListener("click", (event) => { event.stopPropagation(); deleteStep(step.id); });
        const handle = document.createElement("span");
        handle.className = "drag-handle";
        handle.textContent = "⋮⋮";
        tools.append(eyeButton, duplicateButton, removeButton, handle);
        card.append(numberBadge, copy, tools);
        card.addEventListener("click", () => selectStep(step.id));
        card.addEventListener("dragstart", (event) => {
            card.classList.add("dragging");
            event.dataTransfer?.setData("text/plain", step.id);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        });
        card.addEventListener("dragend", () => { card.classList.remove("dragging"); clearDropIndicator(); });
        // 挿入予定位置を緑線で示します（カードの上半分＝この手順の前、下半分＝後ろ）（v0.6.24）。
        card.addEventListener("dragover", (event) => {
            event.preventDefault();
            const rect = card.getBoundingClientRect();
            const before = event.clientY < rect.top + rect.height / 2;
            clearDropIndicator();
            card.classList.add(before ? "drop-before" : "drop-after");
        });
        card.addEventListener("dragleave", (event) => {
            if (!card.contains(event.relatedTarget)) card.classList.remove("drop-before", "drop-after");
        });
        card.addEventListener("drop", (event) => {
            event.preventDefault();
            const before = card.classList.contains("drop-before");
            clearDropIndicator();
            const data = String(event.dataTransfer?.getData("text/plain") || "");
            if (data.startsWith("section:")) reorderSection(data.slice(8), step.id, before);
            else reorderStep(data, step.id, before);
        });
        return card;
    }

    /** 手順の表示／非表示を切り替えます（v0.6.34）。 */
    function toggleStepHidden(id) {
        const step = (session?.steps || []).find((item) => item.id === id);
        if (!step) return;
        pushStepHistory();
        step.hidden = !step.hidden;
        updateOrders();
        renderStepList();
        updateStepFields();
        updatePageRangeSummary();
        drawCanvas();
        scheduleSave();
        setSaveState(step.hidden ? "この手順を非表示にしました（出力・スライドショーから外れます）" : "この手順を表示に戻しました", "#1b5e20");
    }

    /** 選択中の手順から始まるセクションを追加します。 */
    function addSection() {
        const steps = session?.steps || [];
        if (!steps.length) return;
        const step = steps.find((item) => item.id === selectedStepId) || steps[0];
        if (step.section) { setSaveState("この手順はすでにセクションの先頭です。見出しをクリックすると名前を変えられます", "#8a5a12"); return; }
        pushStepHistory();
        const count = steps.filter((item) => item.section).length + 1;
        step.section = { id: PG.createId("section"), title: `セクション ${count}`, collapsed: false };
        renderStepList();
        scheduleSave();
        const head = elements.stepList.querySelector(`.section-head[data-section-start="${step.id}"]`);
        const title = head?.querySelector(".section-title");
        if (head && title) editSectionTitle(step, head, title);
    }

    function removeSection(stepId) {
        const step = (session?.steps || []).find((item) => item.id === stepId);
        if (!step?.section) return;
        pushStepHistory();
        step.section = null;
        renderStepList();
        scheduleSave();
    }

    /** セクションを丸ごと動かします。行き先はターゲット手順が属するセクションの前（before）か後ろ。 */
    function reorderSection(startId, targetId, before) {
        const steps = session?.steps || [];
        const start = steps.findIndex((step) => step.id === startId);
        const targetIndex = steps.findIndex((step) => step.id === targetId);
        if (start < 0 || targetIndex < 0 || !steps[start]?.section) return;
        const range = sectionRangeOfIndex(start);
        const targetRange = sectionRangeOfIndex(targetIndex);
        if (!range || !targetRange || targetRange.start === range.start) return;
        let to = before ? targetRange.start : targetRange.end;
        const block = steps.slice(range.start, range.end);
        if (to > range.start) to -= block.length;
        pushStepHistory();
        steps.splice(range.start, block.length);
        // 「セクションなし」の手順の前に置くと、それらがこのセクションの後ろに続いてしまうので、先頭に置くときは相手側に空の見出しは付けません。
        steps.splice(to, 0, ...block);
        updateOrders();
        renderStepList();
        scheduleSave();
    }

    function clearDropIndicator() {
        elements.stepList?.querySelectorAll(".drop-before, .drop-after")
            .forEach((card) => card.classList.remove("drop-before", "drop-after"));
    }

    function reorderStep(movingId, targetId, before, intoSection) {
        if (!session?.steps || !movingId || !targetId || movingId === targetId) return;
        const from = session.steps.findIndex((step) => step.id === movingId);
        const targetIndex = session.steps.findIndex((step) => step.id === targetId);
        if (from < 0 || targetIndex < 0) return;
        // 緑線の位置（前／後ろ）どおりに差し込みます。before 未指定は従来どおりターゲットの位置へ。
        let to = before === undefined ? targetIndex : (before ? targetIndex : targetIndex + 1);
        if (before !== undefined && from < to) to -= 1;
        if (to === from && !intoSection) return;
        pushStepHistory();
        const [moving] = session.steps.splice(from, 1);
        // セクションの先頭を動かすときは、見出しを次の手順へ引き継ぎます（見出しは元の場所に残る）（v0.6.34）。
        if (moving.section) {
            const next = session.steps[from];
            if (next && !next.section) next.section = moving.section;
            moving.section = null;
        }
        session.steps.splice(to, 0, moving);
        if (intoSection) {
            // 見出しの直後に入れる＝その手順がセクションの新しい先頭になるので、見出しを付け替えます。
            const target = session.steps.find((step) => step.id === targetId);
            if (target?.section) { moving.section = target.section; target.section = null; }
        }
        updateOrders();
        renderStepList();
        scheduleSave();
    }

    function updateStepFields() {
        const step = currentStep();
        const visibleIndex = visibleSteps().findIndex((item) => item.id === step?.id);
        elements.selectedStepIndex.textContent = !step ? "STEP —" : step.hidden ? "非表示" : `STEP ${String(visibleIndex + 1).padStart(2, "0")}`;
        elements.stepDescription.value = step?.description || "";
        elements.stepDescription.disabled = !step || recordingHere;
        if (elements.stepNotes) { elements.stepNotes.value = step?.notes || ""; elements.stepNotes.disabled = !step || recordingHere; }
        syncNotesMark();
        syncRetakeButton();
        elements.pageTitle.textContent = step?.pageTitle || "";
        elements.pageUrl.textContent = step?.url || "";
        elements.pageUrl.href = step?.url || "#";
        elements.pageUrl.hidden = !step?.url;
    }

    function selectStep(id) {
        if (editingAnnotationId) closeTextEditor(true);
        selectedStepId = id || null;
        setSelection([]);
        frameSelected = false;
        renderStepList();
        updateStepFields();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
        updateMaskNotice();
    }

    function updateMaskNotice() {
        const notice = document.getElementById("maskNotice");
        if (!notice) return;
        notice.hidden = !currentStep()?.maskBurnedIn;
    }

    // Two independent histories.
    //  - step history : which steps exist and in what order (add / duplicate / delete / reorder)
    //  - edit history : what is inside a step and the guide-level settings
    // Screenshots are shared by reference, so a snapshot costs almost nothing.
    function cloneStep(step) {
        return { ...step, annotations: (step.annotations || []).map((annotation) => ({ ...annotation })) };
    }

    function stepSnapshot() {
        if (!session) return null;
        return {
            order: session.steps.map((step) => step.id),
            objects: Object.fromEntries(session.steps.map((step) => [step.id, cloneStep(step)])),
            selectedStepId
        };
    }

    function applyStepSnapshot(snapshot) {
        if (!session || !snapshot) return;
        const existing = new Map(session.steps.map((step) => [step.id, step]));
        session.steps = snapshot.order
            .map((id) => existing.get(id) || (snapshot.objects[id] ? cloneStep(snapshot.objects[id]) : null))
            .filter(Boolean);
        // 非表示・セクションの見出しも履歴どおりに戻します（v0.6.34）。
        session.steps.forEach((step) => {
            const saved = snapshot.objects[step.id];
            if (!saved) return;
            step.hidden = Boolean(saved.hidden);
            step.section = saved.section ? { ...saved.section } : null;
        });
        selectedStepId = session.steps.some((step) => step.id === snapshot.selectedStepId)
            ? snapshot.selectedStepId
            : session.steps[0]?.id || null;
        setSelection([]);
        refreshAfterStepChange();
    }

    function editSnapshot() {
        if (!session) return null;
        return {
            guide: {
                title: session.title,
                description: session.description,
                fontFamily: session.fontFamily,
                orientation: session.orientation,
                layout: session.layout,
                paperSize: session.paperSize,
                targetColor: session.targetColor,
                targetSize: session.targetSize,
                design: session.design ? { ...session.design } : null,
                cover: session.cover ? { ...session.cover } : null
            },
            steps: Object.fromEntries(session.steps.map((step) => [step.id, {
                description: step.description,
                notes: step.notes || "",
                screenshot: step.screenshot,
                captureError: step.captureError,
                maskRects: step.maskRects,
                maskApplied: step.maskApplied,
                maskBurnedIn: step.maskBurnedIn,
                frame: step.frame ? normalizeFrame(step.frame) : null,
                blankScreenshot: Boolean(step.blankScreenshot),
                design: step.design ? { ...step.design } : null,
                markerApplied: step.markerApplied,
                target: step.target,
                annotations: (step.annotations || []).map((annotation) => ({ ...annotation }))
            }]))
        };
    }

    function applyEditSnapshot(snapshot) {
        if (!session || !snapshot) return;
        Object.assign(session, snapshot.guide);
        if (!session.cover) session.cover = PG.normalizeCover(null);
        session.steps.forEach((step) => {
            const saved = snapshot.steps[step.id];
            if (!saved) return;
            Object.assign(step, saved, { annotations: saved.annotations.map((annotation) => ({ ...annotation })) });
        });
        setSelection([]);
        elements.guideTitle.value = session.title;
        elements.guideDescription.value = session.description;
        syncLayoutControls();
        syncDesignPanel();
        renumberMarkers();
        renderStepList();
        updateStepFields();
        drawCanvas();
        syncStyleControls();
        updateMaskNotice();
        updateHistoryButtons();
        syncFrameResetButton();
        scheduleSave();
    }

    /** Records a structural change to the step list. */
    function pushStepHistory() {
        if (!session) return;
        stepUndo.push(stepSnapshot());
        if (stepUndo.length > HISTORY_LIMIT) stepUndo.shift();
        stepRedo.length = 0;
        updateHistoryButtons();
    }

    /** Records a content change. coalesceKey groups rapid edits (typing) into one entry. */
    function pushHistory(coalesceKey) {
        if (!session) return;
        const now = Date.now();
        if (coalesceKey && coalesceKey === lastCoalesceKey && now - lastCoalesceAt < 900) {
            lastCoalesceAt = now;
            return;
        }
        lastCoalesceKey = coalesceKey || "";
        lastCoalesceAt = now;
        editUndo.push(editSnapshot());
        if (editUndo.length > HISTORY_LIMIT) editUndo.shift();
        editRedo.length = 0;
        updateHistoryButtons();
    }

    function undoEdit() {
        if (!session || !editUndo.length) return;
        editRedo.push(editSnapshot());
        applyEditSnapshot(editUndo.pop());
        lastCoalesceKey = "";
    }

    function redoEdit() {
        if (!session || !editRedo.length) return;
        editUndo.push(editSnapshot());
        applyEditSnapshot(editRedo.pop());
        lastCoalesceKey = "";
    }

    function undoStepChange() {
        if (!session || !stepUndo.length) return;
        stepRedo.push(stepSnapshot());
        applyStepSnapshot(stepUndo.pop());
        setSaveState("手順の操作を1つ元に戻しました", "#1b5e20");
    }

    function redoStepChange() {
        if (!session || !stepRedo.length) return;
        stepUndo.push(stepSnapshot());
        applyStepSnapshot(stepRedo.pop());
    }

    function updateHistoryButtons() {
        elements.undoButton.disabled = !editUndo.length;
        elements.redoButton.disabled = !editRedo.length;
        const restore = document.getElementById("undoDeleteStep");
        if (restore) {
            restore.disabled = !stepUndo.length;
            restore.title = stepUndo.length
                ? `手順の削除・追加・複製・並べ替えを元に戻す（${stepUndo.length}件）`
                : "手順の削除・追加・複製・並べ替えを元に戻す";
        }
    }

    function loadImage(src) {
        if (!src) return Promise.resolve(null);
        if (imageCache.has(src)) return imageCache.get(src);
        const promise = new Promise((resolve) => {
            const image = new Image();
            image.onload = () => { readyImages.set(src, image); resolve(image); };
            image.onerror = () => resolve(null);
            image.src = src;
        });
        imageCache.set(src, promise);
        return promise;
    }

    function normalizeColor(value) {
        return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : DEFAULT_STYLE.color;
    }

    /** 蛍光ペンの濃さ（5〜100%）。0にすると完全に見えなくなるため下限を設けています。 */
    function normalizeOpacity(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return 40;
        return Math.min(100, Math.max(5, Math.round(number)));
    }

    function normalizeBackground(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return 90;
        return Math.min(100, Math.max(0, Math.round(number)));
    }

    function normalizeSize(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_STYLE.size;
        return Math.min(24, Math.max(0.25, number));
    }

    function lineWidthFor(context, size) {
        const base = Math.max(1, Number(context?.canvas?.width) || 1000) / 1000;
        return Math.max(1, normalizeSize(size) * base * (96 / 72));
    }

    function blurDivisorFor(size) {
        return Math.min(40, Math.max(7, Math.round(4 + normalizeSize(size) * 5)));
    }

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

    function themeGrid() {
        const columns = THEME_BASE.map(themeColumn);
        const cells = [];
        for (let row = 0; row < 6; row += 1) {
            for (let column = 0; column < columns.length; column += 1) cells.push(columns[column][row]);
        }
        return cells;
    }

    function toolStyleKey(tool) {
        return TOOL_STYLE_KEYS.includes(tool) ? tool : null;
    }

    function toolSupportsColor(tool) {
        return ["highlight", "arrow", "text", "target", "marker", "redact", "pen", "highlighter"].includes(tool);
    }

    function toolSupportsSize(tool) {
        return ["highlight", "arrow", "blur", "text", "target", "marker", "pen", "highlighter"].includes(tool);
    }

    function sizeListFor(tool) {
        return tool === "text" ? FONT_SIZES : PT_SIZES;
    }

    function defaultSizeFor(tool) {
        if (tool === "text") return DEFAULT_TOOL_STYLES.text.size;
        // 蛍光ペンは太い線で使うものなので、標準を8ptにしています（v0.6.27）。
        if (tool === "highlighter") return DEFAULT_TOOL_STYLES.highlighter.size;
        return DEFAULT_SIZE;
    }

    function rectOf(annotation, width, height) {
        const x = PG.clamp(annotation?.x, 0, 1) * width;
        const y = PG.clamp(annotation?.y, 0, 1) * height;
        const w = PG.clamp(annotation?.width, -1, 1) * width;
        const h = PG.clamp(annotation?.height, -1, 1) * height;
        return { left: Math.min(x, x + w), top: Math.min(y, y + h), width: Math.abs(w), height: Math.abs(h) };
    }

    function normalizedRect(annotation) {
        const left = Math.min(annotation.x, annotation.x + annotation.width);
        const top = Math.min(annotation.y, annotation.y + annotation.height);
        return { left, top, width: Math.abs(annotation.width), height: Math.abs(annotation.height) };
    }

    function styleTarget() {
        if (targetStyleMode) return { kind: "target", type: "target" };
        if (selectedTool === "select") {
            const annotation = selectedAnnotation();
            return annotation ? { kind: "annotation", type: annotation.type, annotation } : { kind: "none", type: "select" };
        }
        return { kind: "tool", type: selectedTool };
    }

    function documentFont() {
        return PG.normalizeFont(session?.fontFamily ?? appSettings.fontFamily);
    }

    function currentStyle() {
        const target = styleTarget();
        if (target.kind === "target") {
            return {
                color: PG.normalizeHexColor(session?.targetColor, appSettings.targetColor),
                size: normalizeSize(session?.targetSize ?? appSettings.targetSize),
                font: documentFont()
            };
        }
        if (target.kind === "annotation") {
            return {
                color: normalizeColor(target.annotation.color),
                size: normalizeSize(target.annotation.size),
                shape: PG.normalizeHighlightShape(target.annotation.shape ?? toolStyles.highlight.shape),
                dash: PG.normalizeLineDash(target.annotation.dash ?? toolStyles.highlight.dash),
                arrowLine: PG.arrowStyle(target.annotation).line,
                arrowStart: PG.arrowStyle(target.annotation).startHead,
                arrowEnd: PG.arrowStyle(target.annotation).endHead,
                arrowHeadSize: PG.arrowStyle(target.annotation).headSize,
                arrowConnect: target.annotation.arrowConnect !== false,
                fillColor: PG.normalizeHexColor(target.annotation.fillColor, toolStyles.highlight.fillColor),
                fillOpacity: normalizeBackground(target.annotation.fillOpacity ?? 0),
                textColor: PG.normalizeHexColor(target.annotation.textColor, toolStyles.highlight.textColor),
                textSize: normalizeSize(target.annotation.textSize ?? toolStyles.highlight.textSize),
                textAlign: PG.normalizeTextAlign(target.annotation.textAlign ?? "center"),
                textValign: PG.normalizeTextValign(target.annotation.textValign ?? "middle"),
                font: PG.normalizeFont(target.annotation.font ?? documentFont()),
                background: normalizeBackground(target.annotation.background ?? toolStyles.text.background),
                backgroundColor: PG.normalizeHexColor(target.annotation.backgroundColor ?? toolStyles.text.backgroundColor, "#ffffff"),
                borderWidth: Math.max(0, Number(target.annotation.borderWidth ?? toolStyles.text.borderWidth) || 0),
                borderColor: PG.normalizeHexColor(target.annotation.borderColor ?? toolStyles.text.borderColor, "#d92d20"),
                textMode: PG.normalizeTextKind(target.annotation.textMode),
                align: PG.normalizeTextAlign(target.annotation.align),
                valign: PG.normalizeTextValign(target.annotation.valign),
                vert: PG.normalizeTextDirection(target.annotation.vert)
            };
        }
        if (target.kind === "none") {
            return { color: DEFAULT_STYLE.color, size: DEFAULT_STYLE.size, font: documentFont() };
        }
        const key = toolStyleKey(target.type);
        const style = key ? toolStyles[key] : DEFAULT_STYLE;
        return {
            color: normalizeColor(style?.color),
            size: normalizeSize(style?.size),
            shape: PG.normalizeHighlightShape(style?.shape ?? toolStyles.highlight.shape),
            dash: PG.normalizeLineDash(style?.dash ?? toolStyles.highlight.dash),
            arrowLine: PG.arrowStyle(style ?? toolStyles.arrow).line,
            arrowStart: PG.arrowStyle(style ?? toolStyles.arrow).startHead,
            arrowEnd: PG.arrowStyle(style ?? toolStyles.arrow).endHead,
            arrowHeadSize: PG.arrowStyle(style ?? toolStyles.arrow).headSize,
            arrowConnect: (style ?? toolStyles.arrow)?.arrowConnect !== false,
            fillColor: PG.normalizeHexColor(style?.fillColor ?? toolStyles.highlight.fillColor, "#ffffff"),
            fillOpacity: normalizeBackground(style?.fillOpacity ?? toolStyles.highlight.fillOpacity),
            textColor: PG.normalizeHexColor(style?.textColor ?? toolStyles.highlight.textColor, "#111111"),
            textSize: normalizeSize(style?.textSize ?? toolStyles.highlight.textSize),
            textAlign: PG.normalizeTextAlign(style?.textAlign ?? toolStyles.highlight.textAlign),
            textValign: PG.normalizeTextValign(style?.textValign ?? toolStyles.highlight.textValign),
            opacity: normalizeOpacity(style?.opacity ?? toolStyles.highlighter.opacity),
            font: PG.normalizeFont(style?.font ?? documentFont()),
            background: normalizeBackground(style?.background ?? toolStyles.text.background),
            backgroundColor: PG.normalizeHexColor(style?.backgroundColor ?? toolStyles.text.backgroundColor, "#ffffff"),
            borderWidth: Math.max(0, Number(style?.borderWidth ?? toolStyles.text.borderWidth) || 0),
            borderColor: PG.normalizeHexColor(style?.borderColor ?? toolStyles.text.borderColor, "#d92d20"),
            textMode: PG.normalizeTextKind(style?.textMode ?? toolStyles.text.textMode),
            align: PG.normalizeTextAlign(style?.align ?? toolStyles.text.align),
            valign: PG.normalizeTextValign(style?.valign ?? toolStyles.text.valign),
            vert: PG.normalizeTextDirection(style?.vert ?? toolStyles.text.vert)
        };
    }

    const BORDER_WIDTHS = [0, 0.5, 1, 1.5, 2, 3, 4];

    /** 枠線の形・線種の選択肢を作ります（shared.js が一次情報・v0.6.23）。 */
    function buildHighlightOptions() {
        const fill = (select, list) => {
            if (!select || select.childElementCount) return;
            list.forEach((item) => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.label;
                select.appendChild(option);
            });
        };
        fill(elements.highlightShape, PG.HIGHLIGHT_SHAPES);
        fill(elements.highlightDash, PG.LINE_DASHES);
        // 矢印の線の形と矢じり（v0.6.26）
        fill(elements.arrowLine, PG.ARROW_LINES);
        fill(elements.arrowStart, PG.ARROW_HEADS);
        fill(elements.arrowEnd, PG.ARROW_HEADS);
        fill(elements.arrowHeadSize, PG.ARROW_HEAD_SIZES);
        // 図形の中の文字（v0.6.26）
        fill(elements.shapeTextAlign, PG.TEXT_ALIGNS);
        fill(elements.shapeTextValign, PG.TEXT_VALIGNS);
        if (elements.shapeTextSize && !elements.shapeTextSize.childElementCount) {
            FONT_SIZES.forEach((pt) => {
                const option = document.createElement("option");
                option.value = String(pt);
                option.textContent = pt === 12 ? `${pt} pt（標準）` : `${pt} pt`;
                elements.shapeTextSize.appendChild(option);
            });
        }
        // 文字の種類と配置（v0.6.24）
        fill(elements.textKind, PG.TEXT_KINDS);
        fill(elements.textAlign, PG.TEXT_ALIGNS);
        fill(elements.textValign, PG.TEXT_VALIGNS);
        fill(elements.textDirection, PG.TEXT_DIRECTIONS);
    }

    function buildBorderOptions() {
        if (!elements.textBorderWidth || elements.textBorderWidth.childElementCount) return;
        BORDER_WIDTHS.forEach((width) => {
            const option = document.createElement("option");
            option.value = String(width);
            option.textContent = width === 0 ? "枠線なし" : `枠線 ${width} pt`;
            elements.textBorderWidth.appendChild(option);
        });
    }

    function buildFontOptions() {
        if (!elements.annotationFont || elements.annotationFont.childElementCount) return;
        Object.entries(PG.FONT_LABELS).forEach(([key, label]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key === PG.DEFAULT_SETTINGS.fontFamily ? `${label}（既定）` : label;
            option.style.fontFamily = PG.fontStack(key);
            elements.annotationFont.appendChild(option);
        });
    }

    function readStored(key, fallback) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || "null");
            return parsed === null || parsed === undefined ? fallback : parsed;
        } catch (_error) {
            return fallback;
        }
    }

    function writeStored(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (_error) {
            // Storage failures must never block editing.
        }
    }

    function buildSizeOptions(tool) {
        if (!elements.annotationSize) return;
        const list = sizeListFor(tool);
        const standard = defaultSizeFor(tool);
        // 「（標準）」の位置はツールで変わるため、一覧の種類と標準値の両方をキーにします。
        const key = `${tool === "text"}|${standard}`;
        if (elements.annotationSize.dataset.list === key) return;
        elements.annotationSize.dataset.list = key;
        elements.annotationSize.replaceChildren();
        list.forEach((pt) => {
            const option = document.createElement("option");
            option.value = String(pt);
            option.textContent = pt === standard ? `${pt} pt（標準）` : `${pt} pt`;
            elements.annotationSize.appendChild(option);
        });
    }

    function paletteButton(color) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.color = color;
        button.style.background = color;
        button.title = color.toUpperCase();
        button.setAttribute("aria-label", color.toUpperCase());
        button.addEventListener("click", () => {
            setColor(color);
            toggleColorPopover(false);
        });
        return button;
    }

    function fillPalette(container, colors) {
        if (!container) return;
        container.replaceChildren();
        colors.forEach((color) => container.appendChild(paletteButton(color)));
    }

    function renderPalettes() {
        if (elements.themePalette && !elements.themePalette.childElementCount) fillPalette(elements.themePalette, themeGrid());
        if (elements.basePalette && !elements.basePalette.childElementCount) fillPalette(elements.basePalette, STANDARD_PALETTE);
        fillPalette(elements.recentPalette, recentColors);
        if (elements.recentGroup) elements.recentGroup.hidden = recentColors.length === 0;
        syncStyleControls();
    }

    function syncStyleControls() {
        const target = styleTarget();
        const style = currentStyle();
        buildSizeOptions(target.type);
        if (elements.deleteAnnotation) elements.deleteAnnotation.disabled = !selectedAnnotationId;
        const canColor = target.kind !== "none" && toolSupportsColor(target.type);
        const canSize = target.kind !== "none" && toolSupportsSize(target.type);
        const scopeLabel = target.kind === "none" ? "文書" : (TOOL_LABELS[target.type] || "—");
        if (elements.styleScope) elements.styleScope.textContent = scopeLabel + (target.kind === "annotation" ? "*" : "");
        // 文字ツールのときだけ「文字の種類」「文字の枠線」「文字の背景」の区画を出します。
        const isText = target.type === "text";
        if (elements.textKindGroup) elements.textKindGroup.hidden = !isText;
        if (isText) {
            const isBox = PG.normalizeTextKind(style.textMode) === "box";
            if (elements.textKind) elements.textKind.value = PG.normalizeTextKind(style.textMode);
            // 配置はテキストボックスのときだけ有効化します（v0.6.24）。方向（横書き／縦書き）はどちらでも選べます（v0.6.41）。
            [elements.textAlign, elements.textValign].forEach((select) => {
                if (select) select.disabled = !isBox;
            });
            if (elements.textDirection) elements.textDirection.disabled = false;
            if (elements.textAlign) elements.textAlign.value = PG.normalizeTextAlign(style.align);
            if (elements.textValign) elements.textValign.value = PG.normalizeTextValign(style.valign);
            if (elements.textDirection) elements.textDirection.value = PG.normalizeTextDirection(style.vert);
        }
        if (elements.textBorderGroup) elements.textBorderGroup.hidden = !isText;
        if (elements.textBackgroundGroup) elements.textBackgroundGroup.hidden = !isText;
        if (isText) {
            const background = String(normalizeBackground(style.background));
            if (elements.textBackground) elements.textBackground.value = background;
            if (elements.textBackgroundSlider) elements.textBackgroundSlider.value = background;
            if (elements.textBackgroundChip) elements.textBackgroundChip.style.background = PG.normalizeHexColor(style.backgroundColor, "#ffffff");
            if (elements.textBorderWidth) elements.textBorderWidth.value = String(Number(style.borderWidth) || 0);
            if (elements.textBorderChip) elements.textBorderChip.style.background = PG.normalizeHexColor(style.borderColor, "#d92d20");
        }
        // 矢印ツール／矢印オブジェクトのときだけ「矢印の種類」の区画を出します（v0.6.25）。
        const isArrow = target.type === "arrow";
        if (elements.arrowGroup) elements.arrowGroup.hidden = !isArrow;
        if (isArrow) {
            if (elements.arrowLine) elements.arrowLine.value = style.arrowLine;
            if (elements.arrowStart) elements.arrowStart.value = style.arrowStart;
            if (elements.arrowEnd) elements.arrowEnd.value = style.arrowEnd;
            if (elements.arrowHeadSize) elements.arrowHeadSize.value = style.arrowHeadSize;
            if (elements.arrowConnect) elements.arrowConnect.checked = style.arrowConnect !== false;
        }
        // 枠線ツール／枠線オブジェクトのときだけ「枠線の形」の区画を出します（v0.6.23）。
        const isHighlight = target.type === "highlight";
        if (elements.highlightGroup) elements.highlightGroup.hidden = !isHighlight;
        if (elements.highlightFillGroup) elements.highlightFillGroup.hidden = !isHighlight;
        if (elements.shapeTextGroup) elements.shapeTextGroup.hidden = !isHighlight;
        if (isHighlight) {
            if (elements.highlightShape) elements.highlightShape.value = PG.normalizeHighlightShape(style.shape);
            if (elements.highlightDash) elements.highlightDash.value = PG.normalizeLineDash(style.dash);
            // 塗りつぶしと図形の中の文字（v0.6.26）
            if (elements.fillChip) elements.fillChip.style.background = style.fillColor;
            if (elements.fillOpacity) elements.fillOpacity.value = String(style.fillOpacity);
            if (elements.fillOpacitySlider) elements.fillOpacitySlider.value = String(style.fillOpacity);
            if (elements.shapeTextChip) elements.shapeTextChip.style.background = style.textColor;
            if (elements.shapeTextSize) elements.shapeTextSize.value = String(style.textSize);
            if (elements.shapeTextAlign) elements.shapeTextAlign.value = style.textAlign;
            if (elements.shapeTextValign) elements.shapeTextValign.value = style.textValign;
        }
        // 色パレットの適用先は、いまの対象で使えるものだけに限ります。
        const colorKeys = isText ? ["color", "borderColor", "backgroundColor"]
            : isHighlight ? ["color", "fillColor", "textColor"] : ["color"];
        if (!colorKeys.includes(colorTargetKey)) colorTargetKey = "color";
        // オブジェクトの順序は、注釈を選んでいるときだけ操作できます（v0.6.26）。
        const orderState = target.kind === "annotation" ? orderPosition() : null;
        if (elements.orderGroup) elements.orderGroup.hidden = !orderState;
        if (elements.groupGroup) elements.groupGroup.hidden = !orderState;
        setOrderButtonState(orderState);
        syncGroupButtons();
        // 「画像」ツールの区画と、貼り付け画像のトリミング、トリミング中の確定ボタン（v0.6.29）
        const step = currentStep();
        const isImageTool = selectedTool === "image" && !targetStyleMode;
        const imageGroup = document.getElementById("imageGroup");
        if (imageGroup) imageGroup.hidden = !isImageTool || Boolean(cropState);
        if (isImageTool) {
            const hasImage = Boolean(step?.screenshot);
            const cropButton = document.getElementById("cropImage");
            const resetButton = document.getElementById("resetImageFrame");
            const clearButton = document.getElementById("clearImage");
            if (cropButton) cropButton.disabled = !hasImage;
            if (resetButton) resetButton.disabled = !hasImage || isDefaultFrame(stepFrame(step));
            if (clearButton) clearButton.disabled = !hasImage && !(step?.annotations || []).length;
        }
        const pictureGroup = document.getElementById("pictureGroup");
        const isPicture = target.kind === "annotation" && target.type === "image" && !isMultiSelection();
        if (pictureGroup) pictureGroup.hidden = !isPicture || Boolean(cropState);
        if (isPicture) {
            const button = document.getElementById("cropPicture");
            const rotated = Boolean(rotationOf(target.annotation));
            if (button) {
                button.disabled = rotated;
                button.title = rotated ? "回転している画像はトリミングできません。回転を0に戻してから行ってください" : "この画像の残す範囲を決めて切り取ります";
            }
        }
        const cropGroup = document.getElementById("cropGroup");
        if (cropGroup) cropGroup.hidden = !cropState;
        const isHighlighter = target.type === "highlighter";
        if (elements.highlighterGroup) elements.highlighterGroup.hidden = !isHighlighter;
        if (isHighlighter) {
            const value = String(normalizeOpacity(style.opacity));
            if (elements.highlighterOpacity) elements.highlighterOpacity.value = value;
            if (elements.highlighterOpacitySlider) elements.highlighterOpacitySlider.value = value;
        }
        if (elements.annotationFont) {
            // フォントは文字ツール／文字オブジェクトと、スコープが「文書」のときだけ出します（v0.6.22）。
            // ぼかし・黒塗り・矢印・ペンなどフォントを使わないツールでは、並びが崩れるので隠します。
            elements.annotationFont.hidden = !isText && target.kind !== "none";
            elements.annotationFont.value = style.font;
            elements.annotationFont.title = target.type === "text"
                ? "この文字オブジェクトのフォント"
                : "このガイド全体の既定フォント（説明文と新しい文字に適用）";
        }
        if (elements.targetChip) elements.targetChip.style.background = PG.normalizeHexColor(session?.targetColor, appSettings.targetColor);
        elements.targetStyleButton?.classList.toggle("active", targetStyleMode);
        if (elements.saveTargetDefault) elements.saveTargetDefault.hidden = !targetStyleMode;
        if (elements.colorButton) {
            elements.colorButton.disabled = !canColor;
            elements.colorButton.title = canColor ? `${TOOL_LABELS[target.type]}の色 ${style.color.toUpperCase()}` : "このツール／オブジェクトは色を使いません";
        }
        if (elements.colorChip) elements.colorChip.style.background = canColor ? style.color : "#c8c8c8";
        if (elements.annotationColor) elements.annotationColor.value = activeColorValue(style);
        if (elements.annotationSize) {
            elements.annotationSize.disabled = !canSize;
            elements.annotationSize.value = String(style.size);
            elements.annotationSize.title = target.type === "blur" ? "ぼかしの強さ" : target.type === "text" ? "文字の大きさ" : `${TOOL_LABELS[target.type] || "注釈"}の太さ`;
        }
        const paletteColor = activeColorValue(style);
        document.querySelectorAll(".palette button").forEach((button) => {
            button.classList.toggle("active", String(button.dataset.color || "").toLowerCase() === paletteColor);
        });
        elements.textBorderColorButton?.classList.toggle("active", colorTargetKey === "borderColor" && !elements.colorPopover?.hidden);
        elements.textBackgroundColorButton?.classList.toggle("active", colorTargetKey === "backgroundColor" && !elements.colorPopover?.hidden);
        elements.fillColorButton?.classList.toggle("active", colorTargetKey === "fillColor" && !elements.colorPopover?.hidden);
        elements.shapeTextColorButton?.classList.toggle("active", colorTargetKey === "textColor" && !elements.colorPopover?.hidden);
    }

    function updateToolStyle(patch) {
        const target = styleTarget();
        if (patch.font !== undefined && target.type !== "text") {
            if (!session) return;
            pushHistory("documentFont");
            session.fontFamily = PG.normalizeFont(patch.font);
            scheduleSave();
            drawCanvas();
            syncStyleControls();
            return;
        }
        if (target.kind === "target") {
            if (!session) return;
            pushHistory("targetStyle");
            if (patch.color !== undefined) session.targetColor = PG.normalizeHexColor(patch.color, appSettings.targetColor);
            if (patch.size !== undefined) session.targetSize = normalizeSize(patch.size);
            scheduleSave();
            drawCanvas();
            syncStyleControls();
            return;
        }
        if (target.kind === "annotation") {
            const step = currentStep();
            pushHistory(`style:${target.annotation.id}`);
            // まとめて選んでいるときは、選択中すべてに同じ設定を当てます（v0.6.28）。
            selectionAnnotations().forEach((item) => Object.assign(item, patch));
            selectionAnnotations().forEach(fitPlainVerticalBox);
            // 「図形に接続」を外したら、いまの接続も解きます（v0.6.33）。
            if (patch.arrowConnect === false) selectionAnnotations().forEach((item) => { delete item.startAnchor; delete item.endAnchor; });
            scheduleSave();
            drawCanvas();
            updateHistoryButtons();
            syncStyleControls();
            return;
        }
        const key = toolStyleKey(target.type);
        if (!key) return;
        toolStyles[key] = { ...toolStyles[key], ...patch };
        if (patch.background !== undefined) toolStyles.text = { ...toolStyles.text, background: normalizeBackground(patch.background) };
        if (patch.backgroundColor !== undefined) toolStyles.text = { ...toolStyles.text, backgroundColor: PG.normalizeHexColor(patch.backgroundColor, "#ffffff") };
        if (patch.borderWidth !== undefined) toolStyles.text = { ...toolStyles.text, borderWidth: Math.max(0, Number(patch.borderWidth) || 0) };
        if (patch.borderColor !== undefined) toolStyles.text = { ...toolStyles.text, borderColor: PG.normalizeHexColor(patch.borderColor, "#d92d20") };
        if (patch.opacity !== undefined) toolStyles.highlighter = { ...toolStyles.highlighter, opacity: normalizeOpacity(patch.opacity) };
        writeStored(STYLE_KEY, toolStyles);
        syncStyleControls();
    }

    function activeColorValue(style) {
        if (colorTargetKey === "borderColor") return PG.normalizeHexColor(style.borderColor, "#d92d20");
        if (colorTargetKey === "backgroundColor") return PG.normalizeHexColor(style.backgroundColor, "#ffffff");
        if (colorTargetKey === "fillColor") return PG.normalizeHexColor(style.fillColor, "#ffffff");
        if (colorTargetKey === "textColor") return PG.normalizeHexColor(style.textColor, "#111111");
        return normalizeColor(style.color);
    }

    function setColor(value) {
        const color = normalizeColor(value);
        if (colorTargetKey === "borderColor") { updateToolStyle({ borderColor: color }); return; }
        if (colorTargetKey === "backgroundColor") { updateToolStyle({ backgroundColor: color }); return; }
        if (colorTargetKey === "fillColor") { updateToolStyle({ fillColor: color }); return; }
        if (colorTargetKey === "textColor") { updateToolStyle({ textColor: color }); return; }
        updateToolStyle({ color });
    }

    function rememberColor(value) {
        const color = normalizeColor(value);
        recentColors = [color, ...recentColors.filter((item) => item !== color)].slice(0, RECENT_LIMIT);
        writeStored(RECENT_KEY, recentColors);
        fillPalette(elements.recentPalette, recentColors);
        if (elements.recentGroup) elements.recentGroup.hidden = recentColors.length === 0;
        syncStyleControls();
    }

    /** ツールバーは横スクロールできる作りのため、中に置いたままだと下の画面に隠れます。
     *  画面全体を基準にした位置指定へ切り替えて、常に最前面に出します。 */
    function placeColorPopover() {
        const popover = elements.colorPopover;
        const anchor = colorTargetKey === "borderColor" ? elements.textBorderColorButton
            : colorTargetKey === "backgroundColor" ? elements.textBackgroundColorButton
            : colorTargetKey === "fillColor" ? elements.fillColorButton
            : colorTargetKey === "textColor" ? elements.shapeTextColorButton
            : (targetStyleMode ? elements.targetStyleButton : elements.colorButton);
        if (!popover || !anchor) return;
        const rect = anchor.getBoundingClientRect();
        const width = popover.offsetWidth || 244;
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left));
        const top = Math.min(window.innerHeight - 8, rect.bottom + 6);
        popover.style.position = "fixed";
        popover.style.left = `${Math.round(left)}px`;
        popover.style.top = `${Math.round(top)}px`;
    }

    window.addEventListener("resize", () => { if (elements.colorPopover && !elements.colorPopover.hidden) placeColorPopover(); });

    function toggleColorPopover(open) {
        if (!elements.colorPopover) return;
        if (!targetStyleMode && colorTargetKey === "color" && elements.colorButton?.disabled) { elements.colorPopover.hidden = true; return; }
        const next = typeof open === "boolean" ? open : elements.colorPopover.hidden;
        elements.colorPopover.hidden = !next;
        elements.colorButton?.setAttribute("aria-expanded", String(next));
        if (next) placeColorPopover();
    }

    function loadStyle() {
        const saved = readStored(STYLE_KEY, null);
        TOOL_STYLE_KEYS.forEach((key) => {
            const source = saved && typeof saved === "object" ? saved[key] : null;
            toolStyles[key] = {
                color: normalizeColor(source?.color ?? DEFAULT_TOOL_STYLES[key].color),
                size: normalizeSize(source?.size ?? DEFAULT_TOOL_STYLES[key].size)
            };
        });
        // 「表示の既定」（詳細設定・ポップアップ）で保存した矢印・テキストの既定値を
        // 開いた時の初期値にします。設定を変えたのに編集画面に反映されない、を防ぐため
        // ここでは前回使った色よりも設定値を優先します（作業中の変更はその場で有効）。
        toolStyles.highlight = {
            ...toolStyles.highlight,
            color: PG.normalizeHexColor(appSettings.highlightColor, toolStyles.highlight.color),
            shape: PG.normalizeHighlightShape(appSettings.highlightShape),
            dash: PG.normalizeLineDash(appSettings.highlightDash),
            fillColor: PG.normalizeHexColor(appSettings.highlightFillColor, DEFAULT_TOOL_STYLES.highlight.fillColor),
            fillOpacity: normalizeBackground(appSettings.highlightFillOpacity ?? 0),
            // 図形の中の文字は前回使った値を引き継ぎます（設定画面には置いていません）。
            textColor: PG.normalizeHexColor(saved?.highlight?.textColor, DEFAULT_TOOL_STYLES.highlight.textColor),
            textSize: normalizeSize(saved?.highlight?.textSize ?? DEFAULT_TOOL_STYLES.highlight.textSize),
            textAlign: PG.normalizeTextAlign(saved?.highlight?.textAlign ?? "center"),
            textValign: PG.normalizeTextValign(saved?.highlight?.textValign ?? "middle")
        };
        toolStyles.arrow = {
            color: PG.normalizeHexColor(appSettings.arrowColor, toolStyles.arrow.color),
            size: normalizeSize(appSettings.arrowSize ?? toolStyles.arrow.size),
            arrowLine: PG.arrowStyle(saved?.arrow).line,
            arrowStart: PG.arrowStyle(saved?.arrow).startHead,
            arrowEnd: PG.arrowStyle(saved?.arrow).endHead,
            arrowHeadSize: PG.normalizeArrowHeadSize(saved?.arrow?.arrowHeadSize, "sm"),
            arrowConnect: saved?.arrow?.arrowConnect !== false
        };
        toolStyles.pen = {
            color: PG.normalizeHexColor(appSettings.penColor, toolStyles.pen.color),
            size: normalizeSize(appSettings.penSize ?? toolStyles.pen.size)
        };
        toolStyles.highlighter = {
            color: PG.normalizeHexColor(appSettings.highlighterColor, toolStyles.highlighter.color),
            size: normalizeSize(appSettings.highlighterSize ?? toolStyles.highlighter.size),
            opacity: normalizeOpacity(appSettings.highlighterOpacity ?? toolStyles.highlighter.opacity)
        };
        toolStyles.text = {
            ...toolStyles.text,
            color: PG.normalizeHexColor(appSettings.textColor, toolStyles.text.color),
            size: Math.min(72, Math.max(8, Number(appSettings.textSize) || DEFAULT_TOOL_STYLES.text.size)),
            backgroundColor: PG.normalizeHexColor(appSettings.textBackgroundColor, DEFAULT_TOOL_STYLES.text.backgroundColor),
            background: appSettings.textBackgroundOn ? normalizeBackground(appSettings.textBackgroundOpacity) : 0,
            borderWidth: appSettings.textBorderOn ? Math.min(8, Math.max(0.25, Number(appSettings.textBorderWidth) || 1)) : 0,
            borderColor: PG.normalizeHexColor(appSettings.textBorderColor, DEFAULT_TOOL_STYLES.text.borderColor),
            // 文字の種類と配置は前回使った値を引き継ぎます（v0.6.24）。
            textMode: PG.normalizeTextKind(saved?.text?.textMode),
            align: PG.normalizeTextAlign(saved?.text?.align),
            valign: PG.normalizeTextValign(saved?.text?.valign),
            vert: PG.normalizeTextDirection(saved?.text?.vert)
        };
        const storedRecent = readStored(RECENT_KEY, []);
        recentColors = (Array.isArray(storedRecent) ? storedRecent : [])
            .map(normalizeColor)
            .filter((color, index, list) => list.indexOf(color) === index)
            .slice(0, RECENT_LIMIT);
        buildSizeOptions("highlight");
        buildFontOptions();
        buildBorderOptions();
        buildHighlightOptions();
        renderPalettes();
    }

    function pixelate(context, x, y, width, height, size) {
        const w = Math.max(1, Math.floor(width));
        const h = Math.max(1, Math.floor(height));
        const divisor = blurDivisorFor(size);
        const smallW = Math.max(1, Math.round(w / divisor));
        const smallH = Math.max(1, Math.round(h / divisor));
        const temp = document.createElement("canvas");
        temp.width = smallW;
        temp.height = smallH;
        const tempContext = temp.getContext("2d");
        if (!tempContext) return;
        tempContext.drawImage(context.canvas, x, y, w, h, 0, 0, smallW, smallH);
        context.save();
        context.imageSmoothingEnabled = false;
        context.drawImage(temp, 0, 0, smallW, smallH, x, y, w, h);
        context.restore();
    }

    /** 枠線の形ごとのパス。Office のプリセット図形（既定の調整値）と同じ比率で描きます（v0.6.25）。 */
    function traceHighlightPath(context, shape, left, top, width, height) {
        const poly = (points) => {
            context.beginPath();
            points.forEach(([px, py], index) => {
                if (index === 0) context.moveTo(left + px * width, top + py * height);
                else context.lineTo(left + px * width, top + py * height);
            });
            context.closePath();
        };
        if (shape === "ellipse") {
            context.beginPath();
            context.ellipse(left + width / 2, top + height / 2, Math.max(0, width / 2), Math.max(0, height / 2), 0, 0, Math.PI * 2);
            return;
        }
        if (shape === "roundRect") {
            const radius = Math.min(width, height) * 0.1667;
            context.beginPath();
            if (typeof context.roundRect === "function") { context.roundRect(left, top, width, height, radius); return; }
            context.rect(left, top, width, height);
            return;
        }
        if (shape === "triangle") { poly([[0.5, 0], [1, 1], [0, 1]]); return; }
        if (shape === "diamond") { poly([[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]); return; }
        if (shape === "hexagon") {
            const inset = (Math.min(width, height) * 0.25) / Math.max(1, width);
            poly([[inset, 0], [1 - inset, 0], [1, 0.5], [1 - inset, 1], [inset, 1], [0, 0.5]]);
            return;
        }
        if (shape === "trapezoid") {
            const inset = (Math.min(width, height) * 0.25) / Math.max(1, width);
            poly([[inset, 0], [1 - inset, 0], [1, 1], [0, 1]]);
            return;
        }
        if (shape === "parallelogram") {
            const inset = (Math.min(width, height) * 0.25) / Math.max(1, width);
            poly([[inset, 0], [1, 0], [1 - inset, 1], [0, 1]]);
            return;
        }
        // ブロック矢印（v0.6.26）。Office のプリセット既定（軸50%・矢じり min(w,h)×50%）に合わせています。
        const shaft = 0.25;
        if (shape === "rightArrow" || shape === "leftArrow") {
            const head = Math.min(Math.min(width, height) * 0.5, width * 0.9) / Math.max(1, width);
            const points = [[0, shaft], [1 - head, shaft], [1 - head, 0], [1, 0.5], [1 - head, 1], [1 - head, 1 - shaft], [0, 1 - shaft]];
            poly(shape === "leftArrow" ? points.map(([px, py]) => [1 - px, py]) : points);
            return;
        }
        if (shape === "downArrow" || shape === "upArrow") {
            const head = Math.min(Math.min(width, height) * 0.5, height * 0.9) / Math.max(1, height);
            const points = [[shaft, 0], [1 - shaft, 0], [1 - shaft, 1 - head], [1, 1 - head], [0.5, 1], [0, 1 - head], [shaft, 1 - head]];
            poly(shape === "upArrow" ? points.map(([px, py]) => [px, 1 - py]) : points);
            return;
        }
        if (shape === "leftRightArrow") {
            const head = Math.min(Math.min(width, height) * 0.5, width * 0.45) / Math.max(1, width);
            poly([[0, 0.5], [head, 0], [head, shaft], [1 - head, shaft], [1 - head, 0], [1, 0.5],
                [1 - head, 1], [1 - head, 1 - shaft], [head, 1 - shaft], [head, 1]]);
            return;
        }
        if (shape === "upDownArrow") {
            const head = Math.min(Math.min(width, height) * 0.5, height * 0.45) / Math.max(1, height);
            poly([[0.5, 0], [1, head], [1 - shaft, head], [1 - shaft, 1 - head], [1, 1 - head], [0.5, 1],
                [0, 1 - head], [shaft, 1 - head], [shaft, head], [0, head]]);
            return;
        }
        context.beginPath();
        context.rect(left, top, width, height);
    }

    /** 矢印の折れ線・カーブの通過点（px）。描画と消しゴムの当たり判定で共有します（v0.6.25）。 */
    /* ---- 矢印の経路（v0.6.33 上書き）----------------------------------------
     * 直線／L字／曲線は従来どおり。カギ線とコの字は、図形につないでいれば「つないだ辺の向き」から
     * PowerPoint と同じ考え方で経路を決めます（辺から直角に出て、直角に曲がり、相手の辺へ直角に入る）。
     * 中間セグメントの位置は arrowAdjust（端点間を 0〜1 とした割合。範囲外も可）で動かせます。 */
    const SIDE_DIR = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] };

    function curvePoints(x0, y0, x1, y1, midX) {
        const points = [];
        for (let i = 0; i <= 12; i += 1) {
            const t = i / 12;
            const u = 1 - t;
            points.push([
                u * u * u * x0 + 3 * u * u * t * midX + 3 * u * t * t * midX + t * t * t * x1,
                u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y1 + t * t * t * y1
            ]);
        }
        return points;
    }

    /** バーの基準（端点間。近すぎるときは余白4つ分に広げる）。位置 = from + adjust × (to − from)。 */
    function barReference(a, b, margin) {
        let from = Math.min(a, b);
        let to = Math.max(a, b);
        if (to - from < margin * 4) { const center = (a + b) / 2; from = center - margin * 2; to = center + margin * 2; }
        return { from, to };
    }

    /** 調整値の読み出し。arrowBars = { mid, leg1, leg2, s1, s2 }（割合）。旧 arrowAdjust は mid として読みます。 */
    function arrowBarValue(annotation, key) {
        const bars = annotation?.arrowBars && typeof annotation.arrowBars === "object" ? annotation.arrowBars : {};
        const raw = key === "mid" && bars.mid === undefined ? annotation?.arrowAdjust : bars[key];
        const number = Number(raw);
        return Number.isFinite(number) ? number : null;
    }

    function hasArrowBar(annotation, key) {
        return arrowBarValue(annotation, key) !== null;
    }

    /** 矢印の経路をピクセル座標で返します。
     *  { points:[[x,y]...], bars:[{ key, axis, from, to, x, y }] }
     *  bar は「動かせる中間セグメント」。axis はバーを動かす方向（x＝縦線を左右に、y＝横線を上下に）。 */
    function arrowRoutePx(annotation, width, height) {
        const style = PG.arrowStyle(annotation);
        const x0 = annotation.x * width;
        const y0 = annotation.y * height;
        const x1 = (annotation.x + annotation.width) * width;
        const y1 = (annotation.y + annotation.height) * height;
        const margin = Math.max(18, width * .022);
        const bars = [];
        const value = (key, ref, auto) => {
            const adj = arrowBarValue(annotation, key);
            return adj === null ? auto : ref.from + adj * (ref.to - ref.from);
        };
        const addBar = (key, axis, ref, a, b) => {
            // a,b はセグメントの両端。バーはその中点に置きます。
            bars.push({ key, axis, from: ref.from, to: ref.to, x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 });
        };
        const done = (points) => ({ points, bars });

        if (style.line === "straight") return done([[x0, y0], [x1, y1]]);
        if (style.line === "elbowL") return done([[x0, y0], [x1, y0], [x1, y1]]);
        if (style.line === "curve") {
            const ref = barReference(x0, x1, margin);
            const midX = value("mid", ref, (x0 + x1) / 2);
            addBar("mid", "x", ref, [midX, y0], [midX, y1]);
            return done(curvePoints(x0, y0, x1, y1, midX));
        }

        const dirS = annotation.startAnchor ? SIDE_DIR[annotation.startAnchor.side] : null;
        const dirE = annotation.endAnchor ? SIDE_DIR[annotation.endAnchor.side] : null;
        const dx = x1 - x0;
        const dy = y1 - y0;

        /** Z型（中間1本）。horizontal＝中間の線が縦（x を動かす）。 */
        const zRoute = (horizontal) => {
            if (horizontal) {
                const ref = barReference(x0, x1, margin);
                const midX = value("mid", ref, (x0 + x1) / 2);
                addBar("mid", "x", ref, [midX, y0], [midX, y1]);
                return done([[x0, y0], [midX, y0], [midX, y1], [x1, y1]]);
            }
            const ref = barReference(y0, y1, margin);
            const midY = value("mid", ref, (y0 + y1) / 2);
            addBar("mid", "y", ref, [x0, midY], [x1, midY]);
            return done([[x0, y0], [x0, midY], [x1, midY], [x1, y1]]);
        };

        /** コの字。dir は両端が出る向き（[0,-1]＝上 など）。脚が長くなったら脚のバーも出し、動かした脚は短い足（stub）を挟んで平行移動します。 */
        const uRoute = (dir, autoDepth) => {
            const vertical = dir[1] !== 0;   // 脚が縦（上か下へ出る）
            if (vertical) {
                const ref = barReference(y0, y1, margin);
                const Y = value("mid", ref, autoDepth);
                const legRef = barReference(x0, x1, margin);
                const leg1X = value("leg1", legRef, x0);
                const leg2X = value("leg2", legRef, x1);
                const stub = dir[1] * margin;
                const points = [[x0, y0]];
                if (leg1X !== x0) points.push([x0, y0 + stub], [leg1X, y0 + stub]);
                points.push([leg1X, Y], [leg2X, Y]);
                if (leg2X !== x1) points.push([leg2X, y1 + stub], [x1, y1 + stub]);
                points.push([x1, y1]);
                addBar("mid", "y", ref, [leg1X, Y], [leg2X, Y]);
                if (Math.abs(Y - y0) > margin * 3) addBar("leg1", "x", legRef, [leg1X, leg1X !== x0 ? y0 + stub : y0], [leg1X, Y]);
                if (Math.abs(Y - y1) > margin * 3) addBar("leg2", "x", legRef, [leg2X, Y], [leg2X, leg2X !== x1 ? y1 + stub : y1]);
                return done(points);
            }
            const ref = barReference(x0, x1, margin);
            const X = value("mid", ref, autoDepth);
            const legRef = barReference(y0, y1, margin);
            const leg1Y = value("leg1", legRef, y0);
            const leg2Y = value("leg2", legRef, y1);
            const stub = dir[0] * margin;
            const points = [[x0, y0]];
            if (leg1Y !== y0) points.push([x0 + stub, y0], [x0 + stub, leg1Y]);
            points.push([X, leg1Y], [X, leg2Y]);
            if (leg2Y !== y1) points.push([x1 + stub, leg2Y], [x1 + stub, y1]);
            points.push([x1, y1]);
            addBar("mid", "x", ref, [X, leg1Y], [X, leg2Y]);
            if (Math.abs(X - x0) > margin * 3) addBar("leg1", "y", legRef, [leg1Y !== y0 ? x0 + stub : x0, leg1Y], [X, leg1Y]);
            if (Math.abs(X - x1) > margin * 3) addBar("leg2", "y", legRef, [X, leg2Y], [leg2Y !== y1 ? x1 + stub : x1, leg2Y]);
            return done(points);
        };

        if (!dirS && !dirE) {
            if (style.line === "elbow") return zRoute(true);
            // コの字（つないでいない）：長い方の軸に沿って進み、両端が同じ側（上／左）へ出ます。
            const horizontalMajor = Math.abs(dx) >= Math.abs(dy);
            const span = Math.max(margin * 2, horizontalMajor ? Math.abs(dx) : Math.abs(dy));
            return horizontalMajor
                ? uRoute([0, -1], Math.min(y0, y1) - span * .3)
                : uRoute([-1, 0], Math.min(x0, x1) - span * .3);
        }

        // つないでいる：辺の向き（外向き）。つないでいない側は、相手へ向かう軸から推定します。
        const horizontalMajor = Math.abs(dx) >= Math.abs(dy);
        const ds = dirS || (horizontalMajor ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dy) || 1]);
        const de = dirE || (horizontalMajor ? [-(Math.sign(dx) || 1), 0] : [0, -(Math.sign(dy) || 1)]);
        const sHorizontal = ds[0] !== 0;
        const eHorizontal = de[0] !== 0;

        if (sHorizontal === eHorizontal && ds[0] === -de[0] && ds[1] === -de[1]) {
            // 向かい合っている（右→左、下→上 など）
            if (sHorizontal) {
                if (dx * ds[0] >= margin * 2) return zRoute(true);
                // 相手が後ろにいる：いったん出て、上か下を回り込む（5本。足2本と中間の3本が動かせる）
                const refS = barReference(x0, x1, margin);
                const ax = value("s1", refS, x0 + ds[0] * margin);
                const bx = value("s2", refS, x1 + de[0] * margin);
                const ref = barReference(y0, y1, margin);
                const midY = value("mid", ref, Math.abs(dy) > margin * 2 ? (y0 + y1) / 2 : Math.min(y0, y1) - margin * 2);
                addBar("s1", "x", refS, [ax, y0], [ax, midY]);
                addBar("mid", "y", ref, [ax, midY], [bx, midY]);
                addBar("s2", "x", refS, [bx, midY], [bx, y1]);
                return done([[x0, y0], [ax, y0], [ax, midY], [bx, midY], [bx, y1], [x1, y1]]);
            }
            if (dy * ds[1] >= margin * 2) return zRoute(false);
            const refS = barReference(y0, y1, margin);
            const ay = value("s1", refS, y0 + ds[1] * margin);
            const by = value("s2", refS, y1 + de[1] * margin);
            const ref = barReference(x0, x1, margin);
            const midX = value("mid", ref, Math.abs(dx) > margin * 2 ? (x0 + x1) / 2 : Math.min(x0, x1) - margin * 2);
            addBar("s1", "y", refS, [x0, ay], [midX, ay]);
            addBar("mid", "x", ref, [midX, ay], [midX, by]);
            addBar("s2", "y", refS, [midX, by], [x1, by]);
            return done([[x0, y0], [x0, ay], [midX, ay], [midX, by], [x1, by], [x1, y1]]);
        }
        if (sHorizontal === eHorizontal) {
            // 同じ向き（右と右、上と上 など）：コの字
            if (sHorizontal) return uRoute(ds, (ds[0] > 0 ? Math.max(x0, x1) : Math.min(x0, x1)) + ds[0] * margin * 1.5);
            return uRoute(ds, (ds[1] > 0 ? Math.max(y0, y1) : Math.min(y0, y1)) + ds[1] * margin * 1.5);
        }
        // 直角（右と下 など）：L字で届くならL字、届かなければ4本（中の2本が動かせる）
        const corner = sHorizontal ? [x1, y0] : [x0, y1];
        const outOk = sHorizontal ? (corner[0] - x0) * ds[0] > margin : (corner[1] - y0) * ds[1] > margin;
        const inOk = eHorizontal ? (corner[0] - x1) * de[0] > margin : (corner[1] - y1) * de[1] > margin;
        if (outOk && inOk) return done([[x0, y0], corner, [x1, y1]]);
        if (sHorizontal) {
            const refX = barReference(x0, x1, margin);
            const refY = barReference(y0, y1, margin);
            const X = value("s1", refX, x0 + ds[0] * margin);
            const Y = value("s2", refY, y1 + de[1] * margin);
            addBar("s1", "x", refX, [X, y0], [X, Y]);
            addBar("s2", "y", refY, [X, Y], [x1, Y]);
            return done([[x0, y0], [X, y0], [X, Y], [x1, Y], [x1, y1]]);
        }
        const refY = barReference(y0, y1, margin);
        const refX = barReference(x0, x1, margin);
        const Y = value("s1", refY, y0 + ds[1] * margin);
        const X = value("s2", refX, x1 + de[0] * margin);
        addBar("s1", "y", refY, [x0, Y], [X, Y]);
        addBar("s2", "x", refX, [X, Y], [X, y1]);
        return done([[x0, y0], [x0, Y], [X, Y], [X, y1], [x1, y1]]);
    }

    /** 矢じりを描きます（v0.6.32：形は Office と同じ triangle／stealth／arrow／oval／diamond）。
     *  tip が線の端、angle は線の進む向き。戻り値は「線をどこまで手前で止めるか」の長さです。 */
    function drawArrowHead(context, tipX, tipY, angle, head, kind, lineWidth) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const at = (back, side) => [tipX - back * cos - side * sin, tipY - back * sin + side * cos];
        if (kind === "arrow") {
            // 開いた矢：塗らずに2本の線。線は先端まで届かせます。
            context.save();
            context.lineWidth = lineWidth;
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(...at(head, head * .55));
            context.lineTo(tipX, tipY);
            context.lineTo(...at(head, -head * .55));
            context.stroke();
            context.restore();
            return 0;
        }
        context.beginPath();
        if (kind === "oval") {
            const radius = head * .38;
            context.arc(tipX - radius * cos, tipY - radius * sin, radius, 0, Math.PI * 2);
            context.fill();
            return radius * 1.6;
        }
        if (kind === "diamond") {
            const half = head * .5;
            context.moveTo(tipX, tipY);
            context.lineTo(...at(half, half * .75));
            context.lineTo(...at(head, 0));
            context.lineTo(...at(half, -half * .75));
            context.closePath();
            context.fill();
            return head * .9;
        }
        if (kind === "stealth") {
            // 後ろがえぐれた鋭い三角
            context.moveTo(tipX, tipY);
            context.lineTo(...at(head, head * .5));
            context.lineTo(...at(head * .6, 0));
            context.lineTo(...at(head, -head * .5));
            context.closePath();
            context.fill();
            return head * .55;
        }
        // triangle（既定）
        context.moveTo(tipX, tipY);
        context.lineTo(...at(head * Math.cos(Math.PI / 6), head * Math.sin(Math.PI / 6)));
        context.lineTo(...at(head * Math.cos(Math.PI / 6), -head * Math.sin(Math.PI / 6)));
        context.closePath();
        context.fill();
        return head * Math.cos(Math.PI / 6);
    }

    const ARROW_HEAD_SCALE = { xs: .55, sm: .75, med: 1, lg: 1.35, xl: 1.75 };

    /** 矢じりの種類ごとに、線をどこまで手前で止めるか（drawArrowHead と同じ値）。 */
    function arrowHeadInset(kind, head) {
        if (kind === "none" || kind === "arrow") return 0;
        if (kind === "oval") return head * .38 * 1.6;
        if (kind === "diamond") return head * .9;
        if (kind === "stealth") return head * .55;
        return head * Math.cos(Math.PI / 6);
    }

    /** 線の端を amount だけ手前で止めます。矢じりの三角から線が飛び出さないようにするためです（v0.6.27）。 */
    function trimEnd(points, amount, atStart) {
        if (!(amount > 0) || points.length < 2) return points;
        const next = points.map((point) => point.slice());
        const tipIndex = atStart ? 0 : next.length - 1;
        const nextIndex = atStart ? 1 : next.length - 2;
        const tip = next[tipIndex];
        const neighbour = next[nextIndex];
        const dx = neighbour[0] - tip[0];
        const dy = neighbour[1] - tip[1];
        const length = Math.hypot(dx, dy);
        if (length < 0.001) return next;
        const move = Math.min(amount, length * 0.95) / length;
        next[tipIndex] = [tip[0] + dx * move, tip[1] + dy * move];
        return next;
    }

    function drawArrow(context, annotation, color, size) {
        const style = PG.arrowStyle(annotation);
        const width = context.canvas.width;
        const height = context.canvas.height;
        const points = arrowRoutePx(annotation, width, height).points;
        const startHead = style.startHead;
        const endHead = style.endHead;
        const line = lineWidthFor(context, size);
        const scale = ARROW_HEAD_SCALE[style.headSize] || 1;
        const [fromX, fromY] = points[0];
        const [toX, toY] = points[points.length - 1];
        const head = Math.max(line * 3.2, Math.min(Math.hypot(toX - fromX, toY - fromY) * .22, line * 8)) * scale;
        // 矢じりの根元まで線を止めると、線が矢の先を突き破りません。
        let stroked = points;
        if (endHead !== "none") stroked = trimEnd(stroked, arrowHeadInset(endHead, head), false);
        if (startHead !== "none") stroked = trimEnd(stroked, arrowHeadInset(startHead, head), true);
        context.save();
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = line;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        stroked.forEach(([px, py], index) => { if (index === 0) context.moveTo(px, py); else context.lineTo(px, py); });
        context.stroke();
        if (endHead !== "none") {
            const [prevX, prevY] = points[points.length - 2];
            drawArrowHead(context, toX, toY, Math.atan2(toY - prevY, toX - prevX), head, endHead, line);
        }
        if (startHead !== "none") {
            const [nextX, nextY] = points[1];
            drawArrowHead(context, fromX, fromY, Math.atan2(fromY - nextY, fromX - nextX), head, startHead, line);
        }
        context.restore();
    }

    function fontPxFor(context, size) {
        return Math.max(8, normalizeSize(size) * (96 / 72) * (Math.max(1, context.canvas.width) / 1200));
    }

    function wrapLines(context, text, maxWidth) {
        const lines = [];
        String(text || "").split(/\n/).forEach((paragraph) => {
            let current = "";
            for (const character of paragraph) {
                const candidate = current + character;
                if (current && maxWidth > 0 && context.measureText(candidate).width > maxWidth) {
                    lines.push(current);
                    current = character;
                } else {
                    current = candidate;
                }
            }
            lines.push(current);
        });
        return lines;
    }

    /** 縦書きの列。段落（改行）ごとに1列、perColumn 文字で折り返し。perColumn が 0 以下なら折り返しません。 */
    function verticalColumns(text, perColumn) {
        const columns = [];
        const limit = Number.isFinite(perColumn) && perColumn > 0 ? Math.floor(perColumn) : 0;
        String(text || "").split(/\n/).forEach((paragraph) => {
            const chars = Array.from(paragraph);
            if (!chars.length) { columns.push([]); return; }
            if (!limit) { columns.push(chars); return; }
            for (let start = 0; start < chars.length; start += limit) columns.push(chars.slice(start, start + limit));
        });
        return columns;
    }

    /** 文字（自動サイズ）を縦書きにしたときの実寸（px）。背景・枠線・Office 出力の大きさに使います（v0.6.41）。 */
    function measurePlainVertical(context, annotation) {
        const fontPx = fontPxFor(context, annotation?.size);
        const padding = fontPx * .28;
        const charH = fontPx * 1.12;
        const columnW = fontPx * 1.32;
        const columns = verticalColumns(annotation?.text, 0);
        const tallest = columns.reduce((max, chars) => Math.max(max, chars.length), 0);
        return {
            columns, charH, columnW, padding,
            width: columns.length * columnW + padding * 2,
            height: Math.max(1, tallest) * charH + padding * 2
        };
    }

    /** 文字（自動サイズ）の縦書きは、描画した実寸に枠（選択範囲・ハンドル・Office出力）を合わせます（v0.6.41）。 */
    function fitPlainVerticalBox(annotation) {
        if (!annotation || annotation.type !== "text") return;
        if (PG.normalizeTextKind(annotation.textMode) === "box" || PG.normalizeTextDirection(annotation.vert) !== "vertical") return;
        const context = elements.canvas?.getContext?.("2d");
        if (!context) return;
        const canvasW = Math.max(1, elements.canvas.width || 1);
        const canvasH = Math.max(1, elements.canvas.height || 1);
        context.save();
        context.font = `600 ${fontPxFor(context, annotation.size)}px ${PG.fontStack(annotation.font ?? documentFont())}`;
        const m = measurePlainVertical(context, annotation);
        context.restore();
        const box = normalizedRect(annotation);
        annotation.x = box.left;
        annotation.y = box.top;
        annotation.width = PG.clamp(m.width / canvasW, 0.002, 1);
        annotation.height = PG.clamp(m.height / canvasH, 0.002, 1);
    }

    function drawTextAnnotation(context, annotation, box, color) {
        const fontPx = fontPxFor(context, annotation.size);
        context.save();
        context.font = `600 ${fontPx}px ${PG.fontStack(annotation.font ?? documentFont())}`;
        context.textBaseline = "top";
        context.fillStyle = color;
        const padding = fontPx * .28;
        const alpha = normalizeBackground(annotation.background ?? 90) / 100;
        const borderWidth = Math.max(0, Number(annotation.borderWidth) || 0);
        const isBox = PG.normalizeTextKind(annotation.textMode) === "box";
        const lineHeight = fontPx * 1.32;

        const paintFrame = (left, top, width, height) => {
            if (alpha > 0) {
                const bg = PG.normalizeHexColor(annotation.backgroundColor, "#ffffff").replace("#", "");
                const channel = (part) => { const value = parseInt(part, 16); return Number.isFinite(value) ? value : 255; };
                context.fillStyle = `rgba(${channel(bg.slice(0, 2))},${channel(bg.slice(2, 4))},${channel(bg.slice(4, 6))},${alpha})`;
                context.fillRect(left, top, width, height);
                context.fillStyle = color;
            }
            if (borderWidth > 0) {
                context.strokeStyle = PG.normalizeHexColor(annotation.borderColor, "#d92d20");
                context.lineWidth = lineWidthFor(context, borderWidth);
                context.strokeRect(left, top, width, height);
            }
        };

        if (!isBox && PG.normalizeTextDirection(annotation.vert) === "vertical") {
            // 文字（自動サイズ）の縦書き（v0.6.41）：段落ごとに1列、列は右から左。背景・枠線は文字にぴったり合わせます。
            const m = measurePlainVertical(context, annotation);
            const blockW = m.columns.length * m.columnW;
            paintFrame(box.left, box.top, m.width, m.height);
            m.columns.forEach((chars, columnIndex) => {
                const columnX = box.left + m.padding + blockW - (columnIndex + 1) * m.columnW;
                chars.forEach((character, charIndex) => {
                    const charW = context.measureText(character).width;
                    context.fillText(character, columnX + (m.columnW - charW) / 2, box.top + m.padding + charIndex * m.charH);
                });
            });
            context.restore();
            return;
        }

        if (!isBox) {
            // 従来の文字（自動サイズ）：背景・枠線は文字にぴったり合わせます。挙動は変えません。
            const lines = wrapLines(context, annotation.text, Math.max(fontPx, box.width - padding * 2));
            const widest = lines.reduce((max, line) => Math.max(max, context.measureText(line).width), 0);
            paintFrame(box.left, box.top, widest + padding * 2, lines.length * lineHeight + padding * 2);
            lines.forEach((line, index) => {
                context.fillText(line, box.left + padding, box.top + padding + index * lineHeight);
            });
            context.restore();
            return;
        }

        // テキストボックス（v0.6.24）：ドラッグした枠が箱。背景・枠線は箱全体、文字は配置に従います。
        paintFrame(box.left, box.top, box.width, box.height);
        const align = PG.normalizeTextAlign(annotation.align);
        const valign = PG.normalizeTextValign(annotation.valign);
        const innerW = Math.max(fontPx, box.width - padding * 2);
        const innerH = Math.max(fontPx, box.height - padding * 2);
        if (PG.normalizeTextDirection(annotation.vert) === "vertical") {
            // 縦書き：1文字ずつ縦に並べ、列は右から左へ。改行と箱の高さで列を折り返します。
            const charH = fontPx * 1.12;
            const columnW = lineHeight;
            const perColumn = Math.max(1, Math.floor(innerH / charH));
            const columns = verticalColumns(annotation.text, perColumn);
            const blockW = columns.length * columnW;
            const blockLeft = align === "left" ? box.left + padding
                : align === "center" ? box.left + (box.width - blockW) / 2
                : box.left + box.width - padding - blockW;
            columns.forEach((chars, columnIndex) => {
                const columnX = blockLeft + blockW - (columnIndex + 1) * columnW;
                const columnH = chars.length * charH;
                const startY = valign === "top" ? box.top + padding
                    : valign === "middle" ? box.top + (box.height - columnH) / 2
                    : box.top + box.height - padding - columnH;
                chars.forEach((character, charIndex) => {
                    const charW = context.measureText(character).width;
                    context.fillText(character, columnX + (columnW - charW) / 2, startY + charIndex * charH);
                });
            });
            context.restore();
            return;
        }
        const lines = wrapLines(context, annotation.text, innerW);
        const blockH = lines.length * lineHeight;
        const startY = valign === "top" ? box.top + padding
            : valign === "middle" ? box.top + (box.height - blockH) / 2
            : box.top + box.height - padding - blockH;
        lines.forEach((line, index) => {
            const lineW = context.measureText(line).width;
            const x = align === "left" ? box.left + padding
                : align === "center" ? box.left + (box.width - lineW) / 2
                : box.left + box.width - padding - lineW;
            context.fillText(line, x, startY + index * lineHeight);
        });
        context.restore();
    }

    /** 図形の中の文字（v0.6.26）。ダブルクリックで入力し、配置は区画「図形の文字」で選びます。 */
    function drawShapeText(context, annotation, box) {
        const text = String(annotation.text || "");
        if (!text) return;
        const fontPx = fontPxFor(context, annotation.textSize ?? 12);
        context.save();
        context.font = `600 ${fontPx}px ${PG.fontStack(annotation.font ?? documentFont())}`;
        context.textBaseline = "top";
        context.fillStyle = PG.normalizeHexColor(annotation.textColor, "#111111");
        const padding = fontPx * .3;
        const lines = wrapLines(context, text, Math.max(fontPx, box.width - padding * 2));
        const lineHeight = fontPx * 1.32;
        const blockH = lines.length * lineHeight;
        const align = PG.normalizeTextAlign(annotation.textAlign ?? "center");
        const valign = PG.normalizeTextValign(annotation.textValign ?? "middle");
        const startY = valign === "top" ? box.top + padding
            : valign === "bottom" ? box.top + box.height - padding - blockH
            : box.top + (box.height - blockH) / 2;
        lines.forEach((row, index) => {
            const rowWidth = context.measureText(row).width;
            const x = align === "left" ? box.left + padding
                : align === "right" ? box.left + box.width - padding - rowWidth
                : box.left + (box.width - rowWidth) / 2;
            context.fillText(row, x, startY + index * lineHeight);
        });
        context.restore();
    }

    /** 画像を、元画像の crop 範囲だけ切り出して box に描きます（v0.6.29）。 */
    function drawCroppedImage(context, image, crop, box) {
        const sourceW = image.naturalWidth || image.width || 1;
        const sourceH = image.naturalHeight || image.height || 1;
        const c = normalizeCrop(crop);
        if (box.width <= 0 || box.height <= 0) return;
        context.drawImage(image,
            c.x * sourceW, c.y * sourceH, Math.max(1, c.width * sourceW), Math.max(1, c.height * sourceH),
            box.left, box.top, box.width, box.height);
    }

    function drawFramedImage(context, image, frame) {
        const width = context.canvas.width;
        const height = context.canvas.height;
        drawCroppedImage(context, image, frame.crop, {
            left: frame.x * width, top: frame.y * height, width: frame.width * width, height: frame.height * height
        });
    }

    function drawImageAnnotation(context, annotation, box) {
        const image = readyImages.get(annotation.src);
        if (image) {
            drawCroppedImage(context, image, annotation.crop, box);
            return;
        }
        context.save();
        context.strokeStyle = "#b0b0b0";
        context.setLineDash([6, 5]);
        context.strokeRect(box.left, box.top, box.width, box.height);
        context.restore();
    }

    /** 正規化座標を図形の中心まわりに回します。縦横比が違うので、いったんピクセルに直して回します。 */
    function spinPoint(annotation, nx, ny, degrees) {
        if (!degrees) return { x: nx, y: ny };
        const width = Math.max(1, elements.canvas?.width || 1);
        const height = Math.max(1, elements.canvas?.height || 1);
        const r = normalizedRect(annotation);
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const px = (nx - cx) * width;
        const py = (ny - cy) * height;
        const rad = degrees * Math.PI / 180;
        const rx = px * Math.cos(rad) - py * Math.sin(rad);
        const ry = px * Math.sin(rad) + py * Math.cos(rad);
        return { x: cx + rx / width, y: cy + ry / height };
    }

    /** 画面上の点を、回転していない状態の座標へ戻します（当たり判定用）。 */
    function unspinPoint(annotation, point) {
        return spinPoint(annotation, point.x, point.y, -rotationOf(annotation));
    }

    function handlePoints(annotation) {
        if (!annotation) return [];
        const r = normalizedRect(annotation);
        const rotation = rotationOf(annotation);
        // 矢印は両端、それ以外は四隅がサイズ変更のハンドルです。
        const corners = annotation.type === "arrow"
            ? [
                { key: "start", x: annotation.x, y: annotation.y },
                { key: "end", x: annotation.x + annotation.width, y: annotation.y + annotation.height }
            ]
            : [
                { key: "nw", x: r.left, y: r.top },
                { key: "ne", x: r.left + r.width, y: r.top },
                { key: "sw", x: r.left, y: r.top + r.height },
                { key: "se", x: r.left + r.width, y: r.top + r.height }
            ];
        // 中間バー（v0.6.33）：カギ線・コの字・曲線の中間セグメントを動かすハンドル。回転していない矢印だけ。
        if (annotation.type === "arrow" && !rotation) {
            const canvasW = Math.max(1, elements.canvas?.width || 1);
            const canvasH = Math.max(1, elements.canvas?.height || 1);
            arrowRoutePx(annotation, canvasW, canvasH).bars.forEach((barInfo) => {
                corners.push({ key: `adjust:${barInfo.key}`, x: barInfo.x / canvasW, y: barInfo.y / canvasH });
            });
        }
        // 回転ハンドル（v0.6.26）。上辺の中央から少し上に離して置きます。
        if (canRotate(annotation)) {
            const gap = 26 / Math.max(1, elements.canvas?.height || 1);
            corners.push({ key: "rotate", x: r.left + r.width / 2, y: r.top - gap });
        }
        return corners.map((handle) => {
            const spun = spinPoint(annotation, handle.x, handle.y, rotation);
            return { key: handle.key, x: spun.x, y: spun.y };
        });
    }

    function handleSizePx(context) {
        return Math.max(11, context.canvas.width * 0.011);
    }

    /** 回転ハンドル（v0.6.28）。PowerPointと同じく、図形から伸びた線の先に
     *  白い丸を置き、中に時計回りの矢印を描きます。 */
    function drawRotateHandle(context, cx, cy, size, stroke, anchor) {
        const radius = size * .95;
        context.save();
        context.setLineDash([]);
        context.lineCap = "butt";
        // 図形とハンドルをつなぐ線
        if (anchor) {
            context.strokeStyle = "#9a9a9a";
            context.lineWidth = Math.max(1, stroke * .6);
            context.beginPath();
            context.moveTo(anchor.x, anchor.y);
            context.lineTo(cx, cy);
            context.stroke();
        }
        context.fillStyle = "#fff";
        context.strokeStyle = "#9a9a9a";
        context.lineWidth = Math.max(1, stroke * .6);
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        // 時計回りの矢印（3時の少し下から回って、右上で止める）
        const arcRadius = radius * .5;
        const start = Math.PI * .55;
        const end = Math.PI * .05;
        context.strokeStyle = "#3c3c3c";
        context.lineWidth = Math.max(1.1, radius * .19);
        context.beginPath();
        context.arc(cx, cy, arcRadius, start, end);
        context.stroke();
        // 円弧の終点に、進む向き（接線）の矢じり
        const tipX = cx + arcRadius * Math.cos(end);
        const tipY = cy + arcRadius * Math.sin(end);
        const tangent = end - Math.PI / 2;
        const headSize = Math.max(2.4, radius * .4);
        context.fillStyle = "#3c3c3c";
        context.beginPath();
        context.moveTo(tipX + headSize * Math.cos(tangent), tipY + headSize * Math.sin(tangent));
        context.lineTo(tipX + headSize * Math.cos(tangent + 2.45), tipY + headSize * Math.sin(tangent + 2.45));
        context.lineTo(tipX + headSize * Math.cos(tangent - 2.45), tipY + headSize * Math.sin(tangent - 2.45));
        context.closePath();
        context.fill();
        context.restore();
    }

    function drawSelection(context, annotation) {
        const box = rectOf(annotation, context.canvas.width, context.canvas.height);
        const stroke = Math.max(2, context.canvas.width / 700);
        const rotation = rotationOf(annotation);
        context.save();
        if (rotation) {
            const cx = box.left + box.width / 2;
            const cy = box.top + box.height / 2;
            context.translate(cx, cy);
            context.rotate(rotation * Math.PI / 180);
            context.translate(-cx, -cy);
        }
        // A white underlay keeps the outline visible on dark fills such as the black redaction boxes.
        context.setLineDash([]);
        context.strokeStyle = "rgba(255,255,255,.95)";
        context.lineWidth = stroke * 2.2;
        context.strokeRect(box.left, box.top, box.width, box.height);
        context.strokeStyle = "#111";
        context.lineWidth = stroke;
        context.setLineDash([stroke * 3, stroke * 2.2]);
        context.strokeRect(box.left, box.top, box.width, box.height);
        context.setLineDash([]);
        context.restore();
        context.save();
        const size = handleSizePx(context);
        // 回転ハンドルへつなぐ線の根元（図形の上辺の中央。回転していれば回した位置）。
        const outline = normalizedRect(annotation);
        const anchorPoint = spinPoint(annotation, outline.left + outline.width / 2, outline.top, rotation);
        const rotateAnchor = { x: anchorPoint.x * context.canvas.width, y: anchorPoint.y * context.canvas.height };
        handlePoints(annotation).forEach((point) => {
            const cx = point.x * context.canvas.width;
            const cy = point.y * context.canvas.height;
            context.lineWidth = Math.max(1.5, stroke * .8);
            if (point.key === "rotate") { drawRotateHandle(context, cx, cy, size, stroke, rotateAnchor); return; }
            if (String(point.key).startsWith("adjust:")) {
                // 中間バー：動かせる線と同じ向きの黄色の棒（縦線なら｜、横線ならー）
                const key = String(point.key).slice(7);
                const route = arrowRoutePx(annotation, context.canvas.width, context.canvas.height);
                const barInfo = route.bars.find((item) => item.key === key);
                const vertical = barInfo?.axis === "x";   // x を動かすバー＝縦線 → ｜
                const half = size * 1.1;
                context.lineCap = "round";
                context.lineWidth = Math.max(3, stroke * 1.6);
                context.strokeStyle = "#fff";
                context.beginPath();
                if (vertical) { context.moveTo(cx, cy - half); context.lineTo(cx, cy + half); } else { context.moveTo(cx - half, cy); context.lineTo(cx + half, cy); }
                context.stroke();
                context.lineWidth = Math.max(2, stroke * 1.1);
                context.strokeStyle = "#e6a800";
                context.stroke();
                return;
            }
            context.fillStyle = "#fff";
            context.strokeStyle = "#111";
            context.beginPath();
            context.rect(cx - size / 2, cy - size / 2, size, size);
            context.fill();
            context.stroke();
        });
        context.restore();
    }

    /** まとめて選んでいるときの枠（v0.6.28）。個々は細い枠、全体は破線＋ハンドルで囲みます。 */
    /** 囲み選択の途中経過（うす青の四角＋点線）。PowerPointの範囲選択と同じ見た目です。 */
    function drawMarquee(context) {
        const rect = marqueeRect();
        if (!rect) return;
        const width = context.canvas.width;
        const height = context.canvas.height;
        const stroke = Math.max(1, width / 1000);
        context.save();
        context.fillStyle = "rgba(0,112,192,.12)";
        context.fillRect(rect.left * width, rect.top * height, rect.width * width, rect.height * height);
        context.strokeStyle = "rgba(0,112,192,.9)";
        context.lineWidth = stroke;
        context.setLineDash([stroke * 4, stroke * 3]);
        context.strokeRect(rect.left * width, rect.top * height, rect.width * width, rect.height * height);
        context.restore();
    }

    function drawMultiSelection(context, items) {
        const width = context.canvas.width;
        const height = context.canvas.height;
        const stroke = Math.max(2, width / 700);
        context.save();
        context.setLineDash([]);
        context.strokeStyle = "rgba(27,94,32,.75)";
        context.lineWidth = Math.max(1, stroke * .6);
        items.forEach((annotation) => {
            const box = rectOf(annotation, width, height);
            const rotation = rotationOf(annotation);
            context.save();
            if (rotation) {
                const cx = box.left + box.width / 2;
                const cy = box.top + box.height / 2;
                context.translate(cx, cy);
                context.rotate(rotation * Math.PI / 180);
                context.translate(-cx, -cy);
            }
            context.strokeRect(box.left, box.top, box.width, box.height);
            context.restore();
        });
        const bounds = selectionBounds(items);
        if (!bounds) { context.restore(); return; }
        const left = bounds.left * width;
        const top = bounds.top * height;
        const boxWidth = bounds.width * width;
        const boxHeight = bounds.height * height;
        context.strokeStyle = "rgba(255,255,255,.95)";
        context.lineWidth = stroke * 2.2;
        context.strokeRect(left, top, boxWidth, boxHeight);
        context.strokeStyle = "#111";
        context.lineWidth = stroke;
        context.setLineDash([stroke * 3, stroke * 2.2]);
        context.strokeRect(left, top, boxWidth, boxHeight);
        context.setLineDash([]);
        context.restore();
        context.save();
        const size = handleSizePx(context);
        const anchor = { x: left + boxWidth / 2, y: top };
        selectionHandlePoints().forEach((point) => {
            const cx = point.x * width;
            const cy = point.y * height;
            context.lineWidth = Math.max(1.5, stroke * .8);
            if (point.key === "rotate") { drawRotateHandle(context, cx, cy, size, stroke, anchor); return; }
            context.fillStyle = "#fff";
            context.strokeStyle = "#111";
            context.beginPath();
            context.rect(cx - size / 2, cy - size / 2, size, size);
            context.fill();
            context.stroke();
        });
        context.restore();
    }

    function drawMarker(context, annotation, box, color, size) {
        const line = lineWidthFor(context, size);
        context.save();
        context.strokeStyle = color;
        context.lineWidth = line;
        context.strokeRect(box.left - line, box.top - line, box.width + line * 2, box.height + line * 2);
        const label = String(annotation.label ?? "");
        if (label) {
            const radius = Math.max(14, Math.min(26, context.canvas.width / 38));
            const cx = Math.max(radius + 3, box.left - radius * .35);
            const cy = Math.max(radius + 3, box.top - radius * .35);
            context.fillStyle = color;
            context.beginPath();
            context.arc(cx, cy, radius, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = "#fff";
            context.font = `800 ${Math.round(radius * .85)}px "Helvetica Neue", Arial, sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(label, cx, cy + 1);
        }
        context.restore();
    }

    /** 回転できる種類（v0.6.26、v0.6.27で矢印を追加）。ぼかしはピクセル処理のため回転できません。 */
    const ROTATABLE_TYPES = ["highlight", "redact", "text", "image", "marker", "arrow"];

    function isAnchoredArrow(annotation) {
        return annotation?.type === "arrow" && Boolean(annotation.startAnchor || annotation.endAnchor);
    }

    function canRotate(annotation) {
        // 図形につないだ矢印は端の位置が図形で決まるので回せません（v0.6.33）。
        if (isAnchoredArrow(annotation)) return false;
        return ROTATABLE_TYPES.includes(annotation?.type);
    }

    /* ---- コネクタ（v0.6.33）：矢印の端を図形の接続点（上下左右の中央）につなぎ、図形が動けば追従 ---- */
    const CONNECTABLE_TYPES = ["highlight", "redact", "text", "image", "marker"];
    let connectorHint = false;   // 矢印を描いている・端を動かしている間、接続点を表示

    /** 図形の接続点（回転を反映した正規化座標）。 */
    function connectionPoints(annotation) {
        if (!annotation || !CONNECTABLE_TYPES.includes(annotation.type)) return [];
        const box = normalizedRect(annotation);
        const rotation = rotationOf(annotation);
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        // 接続点は枠線の「外縁」に置きます（枠線の中心だと、太い線や矢じりが図形に食い込んで見える）。
        const canvasW = Math.max(1, elements.canvas?.width || 1);
        const canvasH = Math.max(1, elements.canvas?.height || 1);
        let strokePx = 0;
        if (annotation.type === "highlight") strokePx = lineWidthFor({ canvas: { width: canvasW } }, normalizeSize(annotation.size)) / 2;
        if (annotation.type === "text" && Number(annotation.borderWidth) > 0) strokePx = lineWidthFor({ canvas: { width: canvasW } }, Number(annotation.borderWidth)) / 2;
        const ox = strokePx / canvasW;
        const oy = strokePx / canvasH;
        return [
            { side: "top", x: cx, y: box.top - oy }, { side: "right", x: box.left + box.width + ox, y: cy },
            { side: "bottom", x: cx, y: box.top + box.height + oy }, { side: "left", x: box.left - ox, y: cy }
        ].map((point) => ({ side: point.side, ...spinPoint(annotation, point.x, point.y, rotation) }));
    }

    /** point に近い接続点を返します（無ければ null）。excludeId は矢印自身。 */
    function findConnection(point, excludeId) {
        const tolerance = handleTolerance();
        const limitX = tolerance.x * 1.7;
        const limitY = tolerance.y * 1.7;
        let best = null;
        (currentStep()?.annotations || []).forEach((annotation) => {
            if (!annotation || annotation.id === excludeId) return;
            connectionPoints(annotation).forEach((candidate) => {
                const dx = Math.abs(point.x - candidate.x) / limitX;
                const dy = Math.abs(point.y - candidate.y) / limitY;
                const score = Math.hypot(dx, dy);
                if (score <= 1 && (!best || score < best.score)) best = { id: annotation.id, side: candidate.side, x: candidate.x, y: candidate.y, score };
            });
        });
        return best;
    }

    function anchorPoint(step, anchor) {
        if (!anchor?.id) return null;
        const target = (step?.annotations || []).find((item) => item?.id === anchor.id);
        if (!target) return null;
        return connectionPoints(target).find((point) => point.side === anchor.side) || null;
    }

    /** つないだ矢印の端を、いまの図形の位置に合わせます。図形が消えていれば接続を外します。 */
    function syncConnectors(step) {
        (step?.annotations || []).forEach((annotation) => {
            if (!isAnchoredArrow(annotation)) return;
            const start = anchorPoint(step, annotation.startAnchor);
            const end = anchorPoint(step, annotation.endAnchor);
            if (annotation.startAnchor && !start) delete annotation.startAnchor;
            if (annotation.endAnchor && !end) delete annotation.endAnchor;
            const fromX = start ? start.x : annotation.x;
            const fromY = start ? start.y : annotation.y;
            const toX = end ? end.x : annotation.x + annotation.width;
            const toY = end ? end.y : annotation.y + annotation.height;
            annotation.x = fromX;
            annotation.y = fromY;
            annotation.width = toX - fromX;
            annotation.height = toY - fromY;
            if (annotation.rotation) annotation.rotation = 0;
        });
    }

    /** 矢印の端 (handle: "start"|"end") を point に置き、接続できる図形が近ければ吸い付けます。 */
    function placeArrowEnd(annotation, handle, point) {
        const snap = annotation.arrowConnect === false ? null : findConnection(point, annotation.id);
        const target = snap ? { x: snap.x, y: snap.y } : point;
        if (handle === "start") {
            const endX = annotation.x + annotation.width;
            const endY = annotation.y + annotation.height;
            annotation.x = target.x;
            annotation.y = target.y;
            annotation.width = endX - target.x;
            annotation.height = endY - target.y;
            if (snap) annotation.startAnchor = { id: snap.id, side: snap.side }; else delete annotation.startAnchor;
        } else {
            annotation.width = target.x - annotation.x;
            annotation.height = target.y - annotation.y;
            if (snap) annotation.endAnchor = { id: snap.id, side: snap.side }; else delete annotation.endAnchor;
        }
        return snap;
    }

    /** 接続点の表示（矢印を描く・端を動かす間）。つながっている点は緑で強調します。 */
    function drawConnectionPoints(context, arrow) {
        const width = context.canvas.width;
        const height = context.canvas.height;
        const radius = Math.max(3.5, handleSizePx(context) * .32);
        const active = new Set([arrow?.startAnchor, arrow?.endAnchor].filter(Boolean).map((anchor) => `${anchor.id}:${anchor.side}`));
        context.save();
        context.lineWidth = Math.max(1, width / 1000);
        (currentStep()?.annotations || []).forEach((annotation) => {
            if (!annotation || annotation.id === arrow?.id) return;
            connectionPoints(annotation).forEach((point) => {
                const on = active.has(`${annotation.id}:${point.side}`);
                context.beginPath();
                context.arc(point.x * width, point.y * height, on ? radius * 1.5 : radius, 0, Math.PI * 2);
                context.fillStyle = on ? "#1b5e20" : "rgba(255,255,255,.95)";
                context.strokeStyle = on ? "#1b5e20" : "#6a6a6a";
                context.fill();
                context.stroke();
            });
        });
        context.restore();
    }

    function rotationOf(annotation) {
        return canRotate(annotation) ? PG.normalizeRotation(annotation.rotation) : 0;
    }

    /** 回転しているときだけキャンバスを図形の中心で回してから本体を描きます（v0.6.26）。 */
    function drawAnnotation(context, annotation) {
        const rotation = rotationOf(annotation);
        if (!rotation) { drawAnnotationBody(context, annotation); return; }
        const box = rectOf(annotation, context.canvas.width, context.canvas.height);
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        context.save();
        context.translate(cx, cy);
        context.rotate(rotation * Math.PI / 180);
        context.translate(-cx, -cy);
        drawAnnotationBody(context, annotation);
        context.restore();
    }

    function drawAnnotationBody(context, annotation) {
        if (!annotation) return;
        if (annotation.id && annotation.id === editingAnnotationId) return;
        const width = context.canvas.width;
        const height = context.canvas.height;
        const x = PG.clamp(annotation.x, 0, 1) * width;
        const y = PG.clamp(annotation.y, 0, 1) * height;
        const w = PG.clamp(annotation.width, -1, 1) * width;
        const h = PG.clamp(annotation.height, -1, 1) * height;
        const left = Math.min(x, x + w);
        const top = Math.min(y, y + h);
        const rectW = Math.abs(w);
        const rectH = Math.abs(h);
        const color = normalizeColor(annotation.color);
        const size = normalizeSize(annotation.size ?? annotation.weight);
        if (annotation.type === "blur") pixelate(context, left, top, rectW, rectH, size);
        if (annotation.type === "redact") {
            context.save();
            context.fillStyle = color;
            context.fillRect(left, top, rectW, rectH);
            context.restore();
        }
        if (annotation.type === "highlight") {
            context.save();
            const highlightWidth = lineWidthFor(context, size);
            traceHighlightPath(context, PG.normalizeHighlightShape(annotation.shape), left, top, rectW, rectH);
            // 塗りつぶし（v0.6.26）。透過0％＝塗りなしなので、既存の図形は見た目が変わりません。
            const fillAlpha = normalizeBackground(annotation.fillOpacity ?? 0) / 100;
            if (fillAlpha > 0) {
                context.save();
                context.globalAlpha = fillAlpha;
                context.fillStyle = PG.normalizeHexColor(annotation.fillColor, "#ffffff");
                context.fill();
                context.restore();
            }
            context.strokeStyle = color;
            context.lineWidth = highlightWidth;
            context.lineJoin = "round";
            context.setLineDash(PG.dashPattern(annotation.dash, highlightWidth));
            context.stroke();
            context.restore();
            drawShapeText(context, annotation, { left, top, width: rectW, height: rectH });
        }
        if (annotation.type === "arrow") drawArrow(context, annotation, color, size);
        if (annotation.type === "text") drawTextAnnotation(context, annotation, { left, top, width: rectW, height: rectH }, color);
        if (annotation.type === "image") drawImageAnnotation(context, annotation, { left, top, width: rectW, height: rectH });
        if (annotation.type === "marker") drawMarker(context, annotation, { left, top, width: rectW, height: rectH }, color, size);
        if (annotation.type === "draw" && Array.isArray(annotation.points) && annotation.points.length > 1) {
            context.save();
            context.strokeStyle = color;
            context.lineWidth = lineWidthFor(context, size);
            context.lineJoin = "round";
            context.lineCap = "round";
            if (annotation.mode === "highlighter") context.globalAlpha = normalizeOpacity(annotation.opacity ?? 40) / 100;
            context.beginPath();
            annotation.points.forEach((pt, index) => {
                const px = PG.clamp(pt.x, 0, 1) * width;
                const py = PG.clamp(pt.y, 0, 1) * height;
                if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
            });
            context.stroke();
            context.restore();
        }
    }

    async function buildStepCanvas(step, includeDraft, baseOnly, excludeTypes) {
        if (!step?.screenshot) return null;
        syncConnectors(step);
        const image = await loadImage(step.screenshot);
        if (!image) return null;
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return null;
        // ページ（キャンバス）は白で塗り、撮影画像は枠（位置・大きさ・トリミング）に従って置きます（v0.6.29）。
        // 枠が初期値なら従来どおりページいっぱいに描かれます。
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawFramedImage(context, image, stepFrame(step));
        await Promise.all((step.annotations || [])
            .filter((annotation) => annotation?.type === "image" && annotation.src && !readyImages.has(annotation.src))
            .map((annotation) => loadImage(annotation.src)));
        // baseOnly is the untouched capture: no annotations at all, including the automatic masks.
        const skip = Array.isArray(excludeTypes) ? excludeTypes : (excludeTypes ? ["marker"] : []);
        const drawList = baseOnly
            ? []
            : (step.annotations || []).filter((annotation) => !skip.includes(annotation?.type));
        drawList.forEach((annotation) => drawAnnotation(context, annotation));
        if (includeDraft && draftAnnotation) drawAnnotation(context, draftAnnotation);
        if (includeDraft && selectionIds.length && !cropState) {
            const chosen = selectionIds
                .map((id) => (step.annotations || []).find((item) => item?.id === id))
                .filter(Boolean);
            if (chosen.length === 1) drawSelection(context, chosen[0]);
            else if (chosen.length > 1) drawMultiSelection(context, chosen);
        }
        if (includeDraft && marquee) drawMarquee(context);
        if (includeDraft && connectorHint) drawConnectionPoints(context, draftAnnotation || selectedAnnotation());
        if (includeDraft && cropState) drawCrop(context);
        else if (includeDraft && (selectedTool === "image" || (selectedTool === "select" && frameSelected))) drawFrameSelection(context, stepFrame(step), !selectionIds.length);
        return canvas;
    }

    async function drawCanvas() {
        const token = ++imageToken;
        const step = currentStep();
        const rendered = await buildStepCanvas(step, true);
        if (token !== imageToken) return;
        if (!rendered) {
            elements.canvas.hidden = true;
            elements.emptyCanvas.hidden = false;
            elements.emptyCanvas.querySelector("strong").textContent = step ? "スクリーンショットがありません" : "手順を選択してください";
            elements.emptyCanvas.querySelector("span").textContent = step
                ? `${step.captureError || "この手順には画像がありません。"} 画像をここにドラッグ＆ドロップするか、Ctrl+Vで貼り付けると1枚だけ設定できます。`
                : "記録したスクリーンショットをここで編集できます。";
            if (elements.imageBar) elements.imageBar.hidden = true;
            syncDesignChrome();
            syncFrameResetButton();
            return;
        }
        elements.emptyCanvas.hidden = true;
        elements.canvas.hidden = false;
        elements.canvas.width = rendered.width;
        elements.canvas.height = rendered.height;
        elements.canvas.getContext("2d", { alpha: false })?.drawImage(rendered, 0, 0);
        if (elements.imageBar) elements.imageBar.hidden = false;
        syncDesignChrome();
        syncFrameResetButton();
    }

    function canvasPoint(event) {
        const rect = elements.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return {
            x: PG.clamp((event.clientX - rect.left) / rect.width, 0, 1),
            y: PG.clamp((event.clientY - rect.top) / rect.height, 0, 1)
        };
    }

    function setTool(tool) {
        selectedTool = ["select", "blur", "redact", "highlight", "arrow", "text", "marker", "image", "zoom", "pen", "highlighter", "eraser"].includes(tool) ? tool : "select";
        if (cropState) finishCrop();
        if (selectedTool !== "select") setSelection([]);
        frameSelected = false;
        targetStyleMode = false;
        document.querySelectorAll(".tool").forEach((button) => button.classList.toggle("active", button.dataset.tool === selectedTool));
        elements.canvas.dataset.tool = selectedTool;
        toggleColorPopover(false);
        syncStyleControls();
    }

    function refreshAfterStepChange() {
        updateOrders();
        renderStepList();
        updateStepFields();
        drawCanvas();
        syncStyleControls();
        updateMaskNotice();
        updateHistoryButtons();
        scheduleSave();
    }

    function addBlankStep() {
        if (!session) return;
        pushStepHistory();
        const step = {
            id: PG.createId("step"), action: "note",
            description: "補足を入力します", pageTitle: "", url: "", createdAt: new Date().toISOString(),
            screenshot: null, captureError: "画像なしの補足手順です",
            maskRects: [], maskApplied: true, maskBurnedIn: false, target: null, annotations: []
        };
        const current = session.steps.findIndex((item) => item.id === selectedStepId);
        const at = current < 0 ? session.steps.length : current + 1;
        session.steps.splice(at, 0, step);
        selectedStepId = step.id;
        setSelection([]);
        refreshAfterStepChange();
    }

    function duplicateStep(id) {
        if (!session?.steps) return;
        const index = session.steps.findIndex((item) => item.id === (id || selectedStepId));
        if (index < 0) return;
        pushStepHistory();
        const copy = deepCopy(session.steps[index]);
        copy.section = null;   // 見出しは複製しません（セクションの先頭は1つ）
        copy.id = PG.createId("step");
        copy.description = `${copy.description}（コピー）`;
        (copy.annotations || []).forEach((annotation) => { annotation.id = PG.createId("annotation"); });
        session.steps.splice(index + 1, 0, copy);
        selectedStepId = copy.id;
        setSelection([]);
        refreshAfterStepChange();
    }

    function deleteStep(id) {
        if (!session?.steps) return;
        const index = session.steps.findIndex((item) => item.id === (id || selectedStepId));
        if (index < 0) return;
        pushStepHistory();
        const [removed] = session.steps.splice(index, 1);
        // セクションの先頭を消したら、見出しは次の手順に引き継ぎます（v0.6.34）。
        if (removed.section && session.steps[index] && !session.steps[index].section) session.steps[index].section = removed.section;
        if (selectedStepId === removed.id) {
            selectedStepId = session.steps[Math.min(index, session.steps.length - 1)]?.id || null;
            setSelection([]);
        }
        refreshAfterStepChange();
        setSaveState("手順を削除しました。手順一覧の戻るボタンで戻せます", "#8a5a12");
    }

    /** ガイドの用紙サイズ（a4／b5／a3。v0.7.11）。 */
    function paperSizeId() {
        return PG.normalizePaperSize(session?.paperSize);
    }
    function pageMetrics() {
        // 用紙（A4／B5／A3）から余白を引いた印字領域（mm）。perPage / cols / align は選択中のレイアウト由来です。
        const layout = layoutOf();
        const sheet = PG.paperMetrics(paperSizeId(), layout.paper);
        const paper = { width: sheet.pageWidth - sheet.margin * 2, height: sheet.pageHeight - sheet.margin * 2, margin: sheet.margin, pageWidth: sheet.pageWidth, pageHeight: sheet.pageHeight, paperId: sheet.id };
        return {
            ...paper,
            perPage: layout.perPage,
            cols: layout.cols,
            rows: Math.max(1, Math.ceil(layout.perPage / layout.cols)),
            align: layout.align || "top"
        };
    }

    /** 出力ページ下部のフッター（会社名・copyright等）。詳細設定で指定します（v0.6.25）。 */
    function footerSettings() {
        const text = PG.cleanText(appSettings.footerText, 200);
        if (!appSettings.footerEnabled || !text) return null;
        return { text, align: PG.normalizeFooterAlign(appSettings.footerAlign) };
    }

    /**
     * 出力1ページの上下に付けるデザイン（帯・ロゴ・ページ番号）の HTML（v0.6.35）。
     * ページ番号は後で「n / N」に置き換えるため、いったん印を入れておきます。
     */
    function designPageParts(design, section) {
        if (!design) return { top: "", bottom: "" };
        const metrics = PG.designMetrics(design);
        const label = PG.designHeaderLabel(design, { title: session?.title || "", section });
        const logo = (position) => (design.logo && design.logoPosition === position
            ? `<img class="design-logo ${position}" src="${design.logo}" alt="">` : "");
        const top = metrics.top > 0
            ? `<div class="design-top">${design.headerEnabled ? `<div class="design-band"><span>${PG.escapeHtml(label)}</span></div>` : ""}${logo("tl")}${logo("tr")}</div>`
            : "";
        const bottom = metrics.bottom > 0
            ? `<div class="design-bottom">${logo("bl")}${logo("br")}${design.pageNumber ? '<div class="design-pagenum">__PG_PAGE__ / __PG_TOTAL__</div>' : ""}</div>`
            : "";
        return { top, bottom };
    }

    /**
     * 印刷・HTML 用のデザインの集まり（v0.6.36）。手順ごとの上書きがあるとページごとにデザインが違うため、
     * 同じデザインには同じクラス名（dsg-0, dsg-1, …）を付け、CSS はデザインの種類ぶんだけ出します。
     */
    function createDesignRegistry() {
        const list = [];
        return {
            classFor(design) {
                if (!design) return "";
                const key = JSON.stringify(design);
                let index = list.findIndex((item) => item.key === key);
                if (index < 0) { list.push({ key, design }); index = list.length - 1; }
                return ` dsg-${index}`;
            },
            css(metrics, pageClass) {
                return list.map((item, index) => designPageCss(item.design, metrics, `${pageClass}.dsg-${index}`)).join("");
            }
        };
    }
    let lastDesignRegistry = null;

    /** 表紙・目次を出すか（v0.6.43）。ページ指定で一部だけ出すときは付けません。 */
    function frontMatterEnabled() {
        const all = !selectedPages();
        return { cover: Boolean(appSettings.coverPage) && all, toc: Boolean(appSettings.tocPage) && all };
    }

    /** 表紙の中身（印刷・HTML）。h1 は PDF のしおりにもなります。 */
    function coverPageHtml() {
        const cover = PG.normalizeCover(session?.cover);
        const rows = [["文書番号", cover.number], ["版数", cover.version], ["作成日", cover.date], ["作成部署", cover.department]]
            .filter(([, value]) => value)
            .map(([label, value]) => `<tr><th>${label}</th><td>${PG.escapeHtml(value)}</td></tr>`).join("");
        const mark = cover.confidentiality ? `<div class="cover-mark">${PG.escapeHtml(PG.coverConfidentialityLabel(cover.confidentiality))}</div>` : "";
        // v0.7.11：承認欄（右上・押印欄つき）、目的・適用範囲・関連文書（下部）
        const approval = cover.approvalEnabled ? coverApprovalHtml(cover) : "";
        const sections = PG.coverTextSections(cover).map(([label, text]) =>
            `<section class="cover-text"><h2>${PG.escapeHtml(label)}</h2>${label === "関連文書"
                ? `<ul>${text.split("\n").filter((line) => line.trim()).map((line) => `<li>${PG.escapeHtml(line.trim())}</li>`).join("")}</ul>`
                : `<p>${PG.escapeHtml(text).replace(/\n/g, "<br>")}</p>`}</section>`).join("");
        const tight = Boolean(approval || sections);   // 承認欄・本文があるときは中央の余白を詰めます
        return `<div class="cover-block${tight ? " cover-tight" : ""}"><div class="cover-top">${mark}${approval}</div><div class="cover-center"><h1>${PG.escapeHtml(session?.title || "")}</h1>${session?.description ? `<p class="cover-description">${PG.escapeHtml(session.description)}</p>` : ""}</div>${sections ? `<div class="cover-sections">${sections}</div>` : ""}${rows ? `<table class="cover-meta">${rows}</table>` : ""}</div>`;
    }
    /** 承認欄（v0.7.11）：見出し行＋押印欄（空の高い枡）＋氏名＋日付。日本の社内文書の右上の欄と同じ形です。 */
    function coverApprovalHtml(cover) {
        const cells = cover.approvals;
        const heads = cells.map((item) => `<th>${PG.escapeHtml(item.label)}</th>`).join("");
        const stamps = cells.map(() => `<td class="approval-stamp"></td>`).join("");
        const names = cells.map((item) => `<td class="approval-name">${PG.escapeHtml(item.name) || "&nbsp;"}</td>`).join("");
        const dates = cells.map((item) => `<td class="approval-date">${PG.escapeHtml(item.date) || "&nbsp;"}</td>`).join("");
        return `<table class="cover-approval"><thead><tr>${heads}</tr></thead><tbody><tr>${stamps}</tr><tr>${names}</tr><tr>${dates}</tr></tbody></table>`;
    }
    /** 改訂履歴ページ（v0.7.11）：版・日付・改訂内容・承認者の表。改訂履歴が1行でもあるときだけ表紙の次に入ります。 */
    function revisionPageHtml() {
        const cover = PG.normalizeCover(session?.cover);
        if (!cover.revisions.length) return "";
        const rows = cover.revisions.map((item) => `<tr><td>${PG.escapeHtml(item.version) || "&nbsp;"}</td><td>${PG.escapeHtml(item.date) || "&nbsp;"}</td><td class="revision-note">${PG.escapeHtml(item.note) || "&nbsp;"}</td><td>${PG.escapeHtml(item.author) || "&nbsp;"}</td></tr>`).join("");
        return `<div class="revision-block"><h2>改訂履歴</h2><table class="cover-revisions"><thead><tr><th>版</th><th>日付</th><th>改訂内容</th><th>承認者</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }

    /** 目次の行。セクションがあれば「章」と「その中の手順」、なければ手順だけ。page は出力上のページ番号。 */
    function tocRows(entries, pageOf) {
        const rows = [];
        const hasSection = entries.some((entry) => entry.section);
        let lastSection = null;
        entries.forEach((entry, position) => {
            if (hasSection && entry.section && entry.section !== lastSection) {
                rows.push({ level: 1, text: entry.section, page: pageOf[position] });
                lastSection = entry.section;
            }
            rows.push({ level: hasSection ? 2 : 1, text: `${entry.index + 1}. ${PG.cleanText(entry.step.description, 120)}`, page: pageOf[position] });
        });
        return rows;
    }

    async function buildPageBlocks(stepClass) {
        const metrics = pageMetrics();
        const entries = exportSteps();
        const front = frontMatterEnabled();
        const pages = [];
        const head = front.cover ? "" : `<header class="sheet-head"><h1>${PG.escapeHtml(session?.title || "")}</h1>${session?.description ? `<p class="description">${PG.escapeHtml(session.description)}</p>` : ""}</header>`;
        const footer = footerSettings();
        const foot = footer ? `<div class="sheet-footer">${PG.escapeHtml(footer.text)}</div>` : "";
        const registry = createDesignRegistry();
        lastDesignRegistry = registry;
        const guideDesign = exportDesign(null);
        let blocks = [];
        let blockSection = null;
        let blockStep = null;   // ページ先頭の手順（手順ごとのデザイン上書きはページ先頭の手順のものを使います）
        let numbered = 0;
        let headPlaced = false;
        const pageOf = [];   // entries の位置 → 出力上のページ番号（目次用・v0.6.43）
        const unnumberedPage = (className, inner) => {
            // 表紙・目次・セクション見出しのページ：ページ番号を付けず、数えもしません。
            const parts = designPageParts(guideDesign, null);
            const bottom = parts.bottom.replace('<div class="design-pagenum">__PG_PAGE__ / __PG_TOTAL__</div>', "");
            return `<div class="sheet-page ${className}${registry.classFor(guideDesign)}">${parts.top}${inner}${foot}${bottom}</div>`;
        };
        if (front.cover) pages.push(unnumberedPage("cover-page", coverPageHtml()));
        if (front.cover && revisionPageHtml()) pages.push(unnumberedPage("revision-page", revisionPageHtml()));   // 改訂履歴（v0.7.11）
        const tocSlot = pages.length;   // 目次はここに差し込みます（ページ番号を確定してから作るため）
        const flush = () => {
            if (!blocks.length) return;
            const design = exportDesign(blockStep);
            const parts = designPageParts(design, blockSection);
            numbered += 1;
            const withHead = !headPlaced ? head : "";
            headPlaced = true;
            pages.push(`<div class="sheet-page${registry.classFor(design)}">${parts.top}${withHead}<div class="sheet-grid">${blocks.join("")}</div>${foot}${parts.bottom.replace("__PG_PAGE__", String(numbered))}</div>`);
            blocks = [];
        };
        for (let position = 0; position < entries.length; position += 1) {
            const { step, index, sectionTitle, section } = entries[position];
            if (sectionTitle) {
                // セクション見出しのページ（v0.6.34）：ページを区切って、章タイトルだけのページを挟みます。
                flush();
                const parts = designPageParts(guideDesign, sectionTitle);
                // 見出しページにはページ番号を付けません（数えもしません）。
                const bottom = parts.bottom.replace('<div class="design-pagenum">__PG_PAGE__ / __PG_TOTAL__</div>', "");
                const withHead = !headPlaced ? head : "";
                headPlaced = true;
                pages.push(`<div class="sheet-page section-page${registry.classFor(guideDesign)}">${parts.top}${withHead}<div class="section-title-block"><h2>${PG.escapeHtml(sectionTitle)}</h2></div>${foot}${bottom}</div>`);
            }
            if (!blocks.length) { blockSection = section || null; blockStep = step; }
            pageOf[position] = numbered + 1;
            const canvas = await buildStepCanvas(step, false);
            const image = canvas
                ? `<img src="${canvas.toDataURL("image/jpeg", .9)}" alt="手順 ${index + 1}">`
                : '<div class="no-image">画像なし</div>';
            const url = appSettings.showStepUrls && step.url ? `<small class="url">${PG.escapeHtml(step.url)}</small>` : "";
            // 手順の見出しは h3（セクション h2 の下の階層。PDF のしおりが章→手順の階層になります・v0.6.43）
            blocks.push(`<section class="${stepClass}"><h3><span>${index + 1}</span>${PG.escapeHtml(step.description)}</h3>${image}${url}</section>`);
            if (blocks.length >= metrics.perPage) flush();
        }
        flush();
        if (front.toc && entries.length) {
            const rows = tocRows(entries, pageOf);
            const perPage = metrics.width > metrics.height ? 22 : 34;
            const chunks = [];
            for (let start = 0; start < rows.length; start += perPage) chunks.push(rows.slice(start, start + perPage));
            const tocPages = chunks.map((chunk, chunkIndex) => unnumberedPage("toc-page",
                `<div class="toc-block">${chunkIndex === 0 ? "<h2>目次</h2>" : ""}<ol class="toc-list">${chunk.map((row) =>
                    `<li class="toc-l${row.level}"><span class="toc-text">${PG.escapeHtml(row.text)}</span><span class="toc-dots"></span><span class="toc-page">${row.page}</span></li>`).join("")}</ol></div>`));
            pages.splice(tocSlot, 0, ...tocPages);
        }
        if (!pages.length) {
            const parts = designPageParts(guideDesign, null);
            numbered = 1;
            pages.push(`<div class="sheet-page${registry.classFor(guideDesign)}">${parts.top}${head}${foot}${parts.bottom.replace("__PG_PAGE__", "1")}</div>`);
        }
        return { pages: pages.join("").split("__PG_TOTAL__").join(String(Math.max(1, numbered))), metrics };
    }

    function pageCss(metrics, pageClass, stepClass) {
        // 1ページの枚数が増えるほど、見出しと番号バッジを小さくします。
        const dense = metrics.perPage >= 4;
        const medium = metrics.perPage === 3;
        const titleSize = dense ? "9pt" : medium ? "11pt" : "12pt";
        const badge = dense ? "5mm" : medium ? "6mm" : "7mm";
        const badgeSize = dense ? "7pt" : medium ? "8pt" : "9pt";
        const gap = dense ? "4mm" : "6mm";
        // 1ページ1枚のときだけ、上段・中央・下段の指定が効きます。
        const justify = metrics.perPage === 1 && metrics.align === "center" ? "center"
            : metrics.perPage === 1 && metrics.align === "bottom" ? "flex-end"
                : "flex-start";
        // 用紙は mm で明示します（B5 は JIS B5 のため、CSS の "B5"（ISO）キーワードを使いません。v0.7.11）
        return `@page{size:${metrics.pageWidth}mm ${metrics.pageHeight}mm;margin:${metrics.margin}mm}`
            + `.${pageClass}{box-sizing:border-box;display:flex;flex-direction:column;width:${metrics.width}mm;height:${metrics.height}mm;overflow:hidden}`
            + `.${pageClass} .sheet-grid{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:repeat(${metrics.cols},minmax(0,1fr));grid-template-rows:repeat(${metrics.rows},minmax(0,1fr));gap:${gap}}`
            + `.${stepClass}{display:flex;flex-direction:column;justify-content:${justify};min-width:0;min-height:0;margin:0}`
            + `.${stepClass} h3{flex:none;display:flex;align-items:center;gap:8px;margin:0 0 3mm;font-size:${titleSize};font-weight:700}`
            + `.${stepClass} h3 span{width:${badge};height:${badge};display:grid;place-items:center;flex:none;color:#fff;font-size:${badgeSize};background:#111}`
            + `.${stepClass} img{min-height:0;max-width:100%;max-height:100%;width:auto;object-fit:contain;align-self:flex-start;border:1px solid #ddd}`
            + `.${stepClass} .no-image{padding:10mm;border:1px solid #ddd;color:#888;text-align:center}`
            + `.${stepClass} .url{flex:none;margin-top:2mm;color:#8a8a8a;font-size:7pt;word-break:break-all}`
            + `.${pageClass} .section-title-block{flex:1 1 auto;display:flex;align-items:center;justify-content:center;min-height:0}`
            + `.${pageClass} .section-title-block h2{margin:0;padding:0 0 6mm;border-bottom:1.2mm solid #1b5e20;font-size:${dense ? "18pt" : "26pt"};font-weight:800;letter-spacing:.04em;text-align:center}`
            + `.sheet-head{flex:none}.sheet-head h1{margin:0 0 2mm;font-size:16pt}.sheet-head .description{margin:0 0 3mm;color:#606060;font-size:9pt}`
            // 表紙・目次（v0.6.43）
            + `.${pageClass} .cover-block{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;position:relative}`
            + `.${pageClass} .cover-mark{align-self:flex-end;padding:1.5mm 4mm;border:.5mm solid #b42318;color:#b42318;font-size:11pt;font-weight:800;letter-spacing:.2em}`
            + `.${pageClass} .cover-center{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 10mm}`
            + `.${pageClass} .cover-center h1{margin:0;padding:0 0 6mm;border-bottom:1.2mm solid #1b5e20;font-size:${dense ? "22pt" : "28pt"};font-weight:800;letter-spacing:.04em;line-height:1.4}`
            + `.${pageClass} .cover-description{margin:8mm 0 0;color:#606060;font-size:11pt;line-height:1.7}`
            + `.${pageClass} .cover-meta{align-self:center;margin:0 0 14mm;border-collapse:collapse;font-size:10.5pt}`
            + `.${pageClass} .cover-meta th{padding:1.8mm 8mm 1.8mm 0;border-bottom:.2mm solid #ddd;color:#606060;font-weight:600;text-align:left;white-space:nowrap}`
            + `.${pageClass} .cover-meta td{padding:1.8mm 0;border-bottom:.2mm solid #ddd;min-width:50mm}`
            // 表紙の文書管理項目（v0.7.11）：承認欄（右上）・目的／適用範囲／関連文書・改訂履歴ページ
            + `.${pageClass} .cover-top{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:4mm}`
            + `.${pageClass} .cover-tight .cover-center{flex:0 1 auto;padding:10mm 10mm 8mm}`
            + `.${pageClass} .cover-approval{border-collapse:collapse;font-size:9pt;table-layout:fixed}`
            + `.${pageClass} .cover-approval th,.${pageClass} .cover-approval td{width:${dense ? "20mm" : "24mm"};border:.3mm solid #333;text-align:center;padding:1.2mm 1mm;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}`
            + `.${pageClass} .cover-approval th{font-weight:700;background:#f2f2f2;-webkit-print-color-adjust:exact;print-color-adjust:exact}`
            + `.${pageClass} .cover-approval .approval-stamp{height:${dense ? "16mm" : "20mm"}}`
            + `.${pageClass} .cover-approval .approval-date{color:#606060;font-size:8pt}`
            + `.${pageClass} .cover-sections{flex:1 1 auto;min-height:0;overflow:hidden;padding:0 6mm;margin:0 0 6mm}`
            + `.${pageClass} .cover-text{margin:0 0 4mm}`
            + `.${pageClass} .cover-text h2{margin:0 0 1.5mm;padding:0 0 1mm 2.5mm;border-left:1.2mm solid #1b5e20;font-size:10.5pt;font-weight:800}`
            + `.${pageClass} .cover-text p,.${pageClass} .cover-text ul{margin:0;font-size:${dense ? "9pt" : "10pt"};line-height:1.7}`
            + `.${pageClass} .cover-text ul{padding-left:6mm}`
            + `.${pageClass} .cover-tight .cover-meta{margin-bottom:4mm}`
            + `.${pageClass} .revision-block{flex:1 1 auto;min-height:0;padding:0 6mm}`
            + `.${pageClass} .revision-block h2{margin:0 0 6mm;padding:0 0 3mm;border-bottom:.8mm solid #1b5e20;font-size:18pt;font-weight:800;letter-spacing:.1em}`
            + `.${pageClass} .cover-revisions{width:100%;border-collapse:collapse;font-size:10pt;table-layout:fixed}`
            + `.${pageClass} .cover-revisions th,.${pageClass} .cover-revisions td{border:.3mm solid #333;padding:2mm 2.5mm;text-align:left;vertical-align:top;word-break:break-all}`
            + `.${pageClass} .cover-revisions th{background:#f2f2f2;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}`
            + `.${pageClass} .cover-revisions th:nth-child(1),.${pageClass} .cover-revisions td:nth-child(1){width:18%}`
            + `.${pageClass} .cover-revisions th:nth-child(2),.${pageClass} .cover-revisions td:nth-child(2){width:20%}`
            + `.${pageClass} .cover-revisions th:nth-child(4),.${pageClass} .cover-revisions td:nth-child(4){width:18%}`
            + `.${pageClass} .toc-block{flex:1 1 auto;min-height:0;padding:0 6mm}`
            + `.${pageClass} .toc-block h2{margin:0 0 6mm;padding:0 0 3mm;border-bottom:.8mm solid #1b5e20;font-size:18pt;font-weight:800;letter-spacing:.1em}`
            + `.${pageClass} .toc-list{margin:0;padding:0;list-style:none}`
            + `.${pageClass} .toc-list li{display:flex;align-items:baseline;gap:2mm;margin:0 0 ${metrics.width > metrics.height ? "1.6mm" : "2.2mm"};font-size:10pt;line-height:1.4}`
            + `.${pageClass} .toc-list li.toc-l1{font-weight:700}`
            + `.${pageClass} .toc-list li.toc-l2{padding-left:8mm;font-weight:400}`
            + `.${pageClass} .toc-text{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`
            + `.${pageClass} .toc-dots{flex:1 1 auto;min-width:6mm;border-bottom:.3mm dotted #999;transform:translateY(-1.2mm)}`
            + `.${pageClass} .toc-page{flex:none;min-width:8mm;text-align:right;font-variant-numeric:tabular-nums}`
            + `.sheet-footer{flex:none;margin-top:1.5mm;color:#8a8a8a;font-size:7pt;text-align:${footerSettings()?.align || "center"};word-break:break-all}`
            + (lastDesignRegistry ? lastDesignRegistry.css(metrics, pageClass) : "")
            + `@media print{.${pageClass}{break-after:page}.${pageClass}:last-child{break-after:auto}}`;
    }

    /** デザイン（帯・ロゴ・背景色・ページ番号）の印刷／HTML 用 CSS。寸法はページ幅（mm）に対する割合です。 */
    function designPageCss(design, metrics, pageClass) {
        if (!design) return "";
        const d = PG.designMetrics(design);
        const mm = (ratio) => `${(metrics.width * ratio).toFixed(2)}mm`;
        const footMm = metrics.width * PG.DESIGN_FOOT_RATIO;
        const align = design.pageNumberAlign === "left" ? "left" : design.pageNumberAlign === "right" ? "right" : "center";
        const logoInset = design.headerEnabled && d.logoTop ? "1.5mm" : "0";
        return `.${pageClass}{background:${design.background};${backgroundImageCss(design)}-webkit-print-color-adjust:exact;print-color-adjust:exact}`
            + `.${pageClass} .design-top{position:relative;flex:none;height:${mm(d.top)};margin-bottom:2.5mm}`
            + `.${pageClass} .design-band{position:absolute;left:0;right:0;top:0;height:${mm(d.header)};display:flex;align-items:center;overflow:hidden;padding:0 ${design.logo && design.logoPosition === "tr" && d.logoTop ? mm(d.logo * 3.2) : "3mm"} 0 ${design.logo && design.logoPosition === "tl" && d.logoTop ? mm(d.logo * 3.2) : "3mm"};color:${design.headerTextColor};font-size:${(metrics.width * d.header * .42).toFixed(2)}mm;font-weight:700;white-space:nowrap;background:${PG.designBandCss(design)};-webkit-print-color-adjust:exact;print-color-adjust:exact}`
            + `.${pageClass} .design-band span{overflow:hidden;text-overflow:ellipsis}`
            + `.${pageClass} .design-logo{position:absolute;top:50%;height:${mm(d.logo)};max-width:${mm(d.logo * 3)};object-fit:contain;transform:translateY(-50%)}`
            + `.${pageClass} .design-logo.tl,.${pageClass} .design-logo.bl{left:${logoInset}}`
            + `.${pageClass} .design-logo.tr,.${pageClass} .design-logo.br{right:${logoInset}}`
            + `.${pageClass} .design-bottom{position:relative;flex:none;height:${mm(d.bottom)};margin-top:2mm}`
            + `.${pageClass} .design-pagenum{position:absolute;left:0;right:0;bottom:0;height:${footMm.toFixed(2)}mm;line-height:${footMm.toFixed(2)}mm;padding:0 ${design.logo && d.logoBottom ? mm(d.logo * 3.2) : "0"};color:#8a8a8a;font-size:${Math.max(6, footMm * .5 * 2.835).toFixed(1)}pt;text-align:${align}}`;
    }

    async function renderPreview() {
        if (!session) return;
        elements.previewContent.innerHTML = "<div class='preview-sheet'><p>プレビューを作成しています…</p></div>";
        elements.previewContent.style.fontFamily = PG.fontStack(documentFont());
        elements.previewContent.dataset.orientation = orientation();
        const { pages, metrics } = await buildPageBlocks("preview-step");
        const style = document.getElementById("printPageStyle") || document.createElement("style");
        style.id = "printPageStyle";
        style.textContent = pageCss(metrics, "sheet-page", "preview-step");
        document.head.appendChild(style);
        elements.previewContent.innerHTML = `<div class="preview-sheet">${pages}</div>`;
        previewPageWidthPx = (metrics.width + metrics.margin * 2) * (96 / 25.4);
        fitPreviewZoom();
    }

    /** Scales the fixed-size paper down so a whole page fits the dialog. Printing is unaffected. */
    function fitPreviewZoom() {
        if (!previewPageWidthPx) return;
        const available = elements.previewContent.clientWidth - 36;
        if (available <= 0) return;
        elements.previewContent.style.zoom = String(Math.min(1, available / previewPageWidthPx));
    }

    async function buildStandaloneHtml() {
        const title = PG.escapeHtml(session?.title || "TADORU.");
        const { pages, metrics } = await buildPageBlocks("step");
        const css = `body{margin:0;background:#e9e9e6;color:#111;font-family:${PG.fontStack(documentFont())}}`
            + `.sheet{display:flex;flex-direction:column;align-items:center;gap:8mm;padding:8mm 0}`
            + `.sheet-page{background:#fff;padding:${metrics.margin}mm;box-shadow:0 4px 18px rgba(0,0,0,.12)}`
            + pageCss(metrics, "sheet-page", "step")
            + `@media print{body{background:#fff}.sheet{gap:0;padding:0}.sheet-page{padding:0;box-shadow:none}}`;
        return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body><main class="sheet">${pages}</main></body></html>`;
    }

    /**
     * 印刷は専用のiframeで行います。
     * プレビューは <dialog showModal()> で開いており、モーダルはブラウザのトップレイヤーに
     * 描画されるため印刷時にページ分割されず、1ページ目しか出力されません。
     * HTML出力と同じ独立ドキュメントを作り、そこから印刷することで全ページが出ます。
     */
    async function printGuide() {
        if (!session) return;
        setSaveState("印刷用のページを作成しています…", "#8a8a8a", true);
        const html = await buildStandaloneHtml();
        document.getElementById("printFrame")?.remove();
        const frame = document.createElement("iframe");
        frame.id = "printFrame";
        frame.setAttribute("aria-hidden", "true");
        // display:none だと印刷対象にならないため、画面外に置きます。
        frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1200px;height:900px;border:0;visibility:hidden";
        document.body.appendChild(frame);

        const done = () => {
            window.setTimeout(() => frame.remove(), 1000);
            setSaveState("印刷ダイアログを開きました", "#1b5e20");
        };
        frame.addEventListener("load", () => {
            const view = frame.contentWindow;
            if (!view) { frame.remove(); setSaveState("印刷用のページを作成できませんでした", "#b42318"); return; }
            const images = Array.from(frame.contentDocument?.images || []);
            const ready = Promise.all(images.map((image) => (image.complete
                ? Promise.resolve()
                : new Promise((resolve) => { image.addEventListener("load", resolve, { once: true }); image.addEventListener("error", resolve, { once: true }); }))));
            ready.then(() => {
                window.setTimeout(() => {
                    try { view.focus(); view.print(); } catch (_error) { /* 印刷がブロックされても編集画面は壊しません */ }
                    done();
                }, 120);
            });
        }, { once: true });
        frame.srcdoc = html;
    }

    async function standaloneStepsHtml() {
        const { pages } = await buildPageBlocks("step");
        return pages;
    }

    function setImageBarState(text, color) {
        if (!elements.imageBarState) return;
        elements.imageBarState.textContent = text;
        elements.imageBarState.style.color = color || "#1b5e20";
        window.setTimeout(() => { if (elements.imageBarState.textContent === text) elements.imageBarState.textContent = ""; }, 2600);
    }

    function stepFilename(step, extension) {
        const index = session?.steps?.findIndex((item) => item?.id === step?.id) ?? -1;
        const base = PG.cleanText(step?.description, 80).replace(/[\\/:*?\"<>|]/g, "-").trim()
            || `手順${String(index + 1).padStart(2, "0")}`;
        return `${base}.${extension}`;
    }

    async function currentStepImage() {
        const step = currentStep();
        if (!step?.screenshot) return null;
        const baseOnly = Boolean(elements.baseImageOnly?.checked);
        return buildStepCanvas(step, false, baseOnly);
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    }

    async function copyStepImage() {
        const canvas = await currentStepImage();
        if (!canvas) return;
        try {
            const blob = await canvasToBlob(canvas, "image/png");
            if (!blob) throw new Error("画像を作成できませんでした");
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            setImageBarState(elements.baseImageOnly?.checked ? "撮影したままの画像をコピーしました" : "コピーしました",
                elements.baseImageOnly?.checked ? "#b42318" : "#1b5e20");
        } catch (error) {
            setImageBarState(PG.cleanText(error?.message || "コピーできませんでした", 60), "#b42318");
        }
    }

    async function downloadStepImage(format) {
        const step = currentStep();
        const canvas = await currentStepImage();
        if (!step || !canvas) return;
        const png = format === "png";
        const blob = await canvasToBlob(canvas, png ? "image/png" : "image/jpeg", png ? undefined : .92);
        if (!blob) { setImageBarState("画像を作成できませんでした", "#b42318"); return; }
        downloadBlob(blob, stepFilename(step, png ? "png" : "jpg"));
        setImageBarState(elements.baseImageOnly?.checked ? "撮影したままの画像を保存しました" : "保存しました",
            elements.baseImageOnly?.checked ? "#b42318" : "#1b5e20");
    }

    function safeFilename(extension) {
        const base = PG.cleanText(session?.title, 80).replace(/[\\/:*?\"<>|]/g, "-") || "tadoru";
        return `${base}.${extension}`;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    /* ---- 印刷レイアウトとページ指定 ---------------------------------- */

    function layoutOf() {
        return PG.pageLayout(session?.layout, session?.orientation);
    }

    function orientation() {
        return layoutOf().paper;
    }

    /**
     * ページ指定の単位は「手順（スライド1枚＝画像1枚）」です。出力用紙の枚数ではありません（v0.6.22）。
     * 絞り込んだ手順は、出力時に perPage ごとに詰め直されて用紙に載ります。
     */
    function totalPages() {
        return Math.max(1, visibleSteps().length);
    }

    /** 選択中の手順の番号（1始まり・表示中の手順だけを数える）です。 */
    function currentPageNumber() {
        const index = visibleSteps().findIndex((step) => step.id === selectedStepId);
        if (index < 0) return 1;
        return index + 1;
    }

    /**
     * セクション（章）ごとの手順番号（v0.7.16）。exportSteps と同じ数え方（非表示は除く・番号は表示中の手順で詰める）。
     * 章の先頭の手順が非表示でも章は始まります。最初の章より前の手順は「（章なし）」（id "__none"）にまとめます。
     */
    function sectionGroups() {
        const groups = [];
        let current = null;
        let index = 0;
        (session?.steps || []).forEach((step) => {
            if (!step) return;
            if (step.section) { current = { id: step.id, title: PG.cleanText(step.section.title, 80) || "（名称なし）", numbers: [] }; groups.push(current); }
            if (step.hidden) return;
            if (!current) { current = { id: "__none", title: "（章なし）", numbers: [] }; groups.push(current); }
            index += 1;
            current.numbers.push(index);
        });
        return groups.filter((group) => group.numbers.length);
    }
    function hasSections() { return sectionGroups().some((group) => group.id !== "__none"); }
    function selectedSectionGroups() {
        const chosen = new Set(pageRange.sections || []);
        return sectionGroups().filter((group) => chosen.has(group.id));
    }
    /** 出力する手順番号の集合。null は「すべて」を意味します。 */
    function selectedPages() {
        const total = totalPages();
        if (pageRange.mode === "current") return new Set([Math.min(currentPageNumber(), total)]);
        if (pageRange.mode === "range") return PG.parsePageRange(pageRange.text, total);
        if (pageRange.mode === "section") {
            const groups = selectedSectionGroups();
            if (!groups.length) return null;   // 何も選んでいなければ「すべて」（要約にその旨を出します）
            return new Set(groups.flatMap((group) => group.numbers));
        }
        return null;
    }

    /**
     * 出力対象の手順を { step, index } で返します。
     * index は元の通し番号なので、絞っても手順番号は変わりません。
     */
    function exportSteps() {
        // 非表示の手順は外し、番号は表示中の手順だけで詰めます（v0.6.34）。
        // 詳細設定「セクション見出しのページを出力に挟む」が ON なら、各セクションの最初の出力手順に sectionTitle を付けます。
        const steps = session?.steps || [];
        const entries = [];
        let pendingSection = null;
        let currentSection = null;   // いま属しているセクション名（ヘッダー帯の「セクション名」用・v0.6.35）
        let index = 0;
        steps.forEach((step) => {
            if (!step) return;
            // 見出しページはセクション個別の指定（一覧の目のアイコン）＞詳細設定の既定（v0.7.25）
            if (step.section) { pendingSection = sectionPageEnabled(step.section) ? step.section.title : null; currentSection = step.section.title; }
            if (step.hidden) return;
            entries.push({ step, index, sectionTitle: pendingSection || null, section: currentSection });
            pendingSection = null;
            index += 1;
        });
        const pages = selectedPages();
        if (!pages) return entries;
        return entries.filter((entry) => pages.has(entry.index + 1));
    }

    function updatePageRangeSummary() {
        if (!elements.pageRangeSummary) return;
        const total = totalPages();
        const pages = selectedPages();
        // Excel・Markdown は「ページ」ではなく「手順」単位（1手順＝1行）なので、数え方の言葉だけ変えます（v0.6.45）。
        const unit = exportUsesPages() ? "ページ" : "手順";
        if (pageRange.mode === "current") {
            elements.pageRangeSummary.textContent = `全${total}${unit}中、${Math.min(currentPageNumber(), total)}${unit}目だけを出力します`;
        } else if (pageRange.mode === "range") {
            elements.pageRangeSummary.textContent = pages
                ? `全${total}${unit}中、${pages.size}${unit}を出力します`
                : `指定が読み取れないため、全${total}${unit}を出力します`;
        } else if (pageRange.mode === "section") {
            const groups = selectedSectionGroups();
            elements.pageRangeSummary.textContent = groups.length
                ? `全${total}${unit}中、${groups.map((group) => `「${group.title}」`).join("")}の${pages ? pages.size : 0}${unit}を出力します`
                : `セクションが選ばれていないため、全${total}${unit}を出力します`;
        } else {
            elements.pageRangeSummary.textContent = `全${total}${unit}を出力します`;
        }
    }

    /* ---- 出力形式ごとの表示（v0.6.45） ----
     * 印刷・PDF／PowerPoint／Word／HTML：用紙の向き・配置・ページ指定を使う
     * Excel／Markdown：1手順1行（1見出し）なので用紙の向き・配置は出さず、「ページ指定」を「手順の指定」にする
     * JSON：すべて保存するので、どれも出さない */
    const PAGE_FORMATS = ["print", "pptx", "docx", "html"];
    function exportFormat() {
        const value = document.getElementById("exportFormat")?.value;
        return ["print", "pptx", "docx", "xlsx", "html", "markdown", "json", "mp4", "webm", "gif"].includes(value) ? value : "print";
    }
    const VIDEO_FORMATS = ["mp4", "webm", "gif"];   // 操作の動画（v0.7.14）
    function isVideoFormat(format) { return VIDEO_FORMATS.includes(format); }
    function exportUsesPages() { return PAGE_FORMATS.includes(exportFormat()); }
    /** 出力メニュー「黒塗りを画像に焼き込む」。要素が無いときは安全側（焼き込む）。 */
    function exportBurnRedact() {
        const box = document.getElementById("burnRedact");
        return box ? Boolean(box.checked) : true;
    }
    /** 出力形式に合わせて、出力メニューの項目の表示・文言を切り替えます（syncLayoutControls の最後で呼びます）。 */
    function applyExportFormatVisibility() {
        const format = exportFormat();
        const usesPages = PAGE_FORMATS.includes(format);
        const isJson = format === "json";
        const orientationLabel = document.getElementById("pageOrientationLabel");
        if (orientationLabel) orientationLabel.hidden = !usesPages;
        const paperLabel = document.getElementById("paperSizeLabel");
        if (paperLabel) paperLabel.hidden = !usesPages || format === "pptx";   // PowerPoint はスライド比率で決まるため用紙サイズを出しません
        if (elements.layoutSummary && !usesPages) elements.layoutSummary.hidden = true;
        const rangeLabel = document.getElementById("pageRangeLabel");
        if (rangeLabel) rangeLabel.hidden = isJson;
        if (elements.pageRangeInput) elements.pageRangeInput.hidden = isJson || pageRange.mode !== "range";
        if (elements.pageRangeSummary) elements.pageRangeSummary.hidden = isJson;
        const title = document.getElementById("pageRangeTitle");
        if (title) title.textContent = usesPages ? "ページ指定" : "手順の指定";
        const sectionsBox = document.getElementById("pageRangeSections");
        if (sectionsBox) sectionsBox.hidden = isJson || pageRange.mode !== "section";
        if (elements.pageRangeMode) {
            const labels = usesPages ? ["全ページ", "現在のページのみ", "ページを指定", "セクションを選ぶ"] : ["全手順", "現在の手順のみ", "手順を指定", "セクションを選ぶ"];
            [...elements.pageRangeMode.options].forEach((option, index) => { if (labels[index] && option.textContent !== labels[index]) option.textContent = labels[index]; });
        }
        const burnLabel = document.getElementById("burnRedactLabel");
        if (burnLabel) burnLabel.hidden = !["pptx", "docx", "xlsx"].includes(format);
        // 操作の動画（v0.7.14）：形式が動画のときだけ見せ方・速さ・大きさを出し、PowerPoint のときだけ「最後のスライドに入れる」を出します
        const video = isVideoFormat(format);
        ["videoCaptionLabel", "videoSpeedLabel", "videoWidthLabel"].forEach((id) => { const label = document.getElementById(id); if (label) label.hidden = !video; });
        const pptxVideoLabel = document.getElementById("pptxVideoLabel");
        if (pptxVideoLabel) pptxVideoLabel.hidden = format !== "pptx";
        const note = document.getElementById("exportFormatNote");
        if (note) {
            note.textContent = isJson ? "バックアップはガイド全体（すべての手順・画像・設定）を保存します"
                : format === "xlsx" ? "1手順1行の表にします。用紙の向き・配置は使いません"
                : format === "markdown" ? "見出しと画像の文書にします。用紙の向き・配置は使いません"
                : format === "mp4" ? "手順の画像をつなぎ、カーソルが操作位置まで動いてクリックする動画にします（画面録画ではないため、マスクはそのまま効きます）。PowerPoint に貼って再生できます。H.264 が使えない PC では WebM になります"
                : format === "webm" ? "手順の画像をつなぎ、カーソルが操作位置まで動いてクリックする動画にします。Chrome・Edge・Teams で再生できます（PowerPoint には貼れません。貼るなら MP4）"
                : format === "gif" ? "手順の画像をつなぎ、カーソルが操作位置まで動いてクリックするGIFにします。Teams・チャットに貼れます。256色のため文字は少し粗くなり、手順が多いと容量が大きくなります（目安：1手順 0.3〜1MB）"
                : "";
            note.hidden = !note.textContent;
        }
    }
    /* ---- 操作の動画の設定（v0.7.14）：この端末に記憶します ---- */
    const VIDEO_OPTIONS_KEY = "pg.videoOptions";
    function videoOptions() {
        const stored = readStored(VIDEO_OPTIONS_KEY, {});
        const caption = document.getElementById("videoCaption")?.value || stored.caption || "band";
        const speed = Number(document.getElementById("videoSpeed")?.value || stored.speed || 1) || 1;
        const width = Number(document.getElementById("videoWidth")?.value || stored.width || 1280) || 1280;
        const pptxVideo = document.getElementById("pptxVideo") ? Boolean(document.getElementById("pptxVideo").checked) : Boolean(stored.pptxVideo);
        return { caption: ["band", "overlay", "none"].includes(caption) ? caption : "band", speed, width, pptxVideo };
    }
    function restoreVideoOptions() {
        const stored = readStored(VIDEO_OPTIONS_KEY, {});
        const caption = document.getElementById("videoCaption"); if (caption && stored.caption) caption.value = stored.caption;
        const speed = document.getElementById("videoSpeed"); if (speed && stored.speed) speed.value = String(stored.speed);
        const width = document.getElementById("videoWidth"); if (width && stored.width) width.value = String(stored.width);
        const pptxVideo = document.getElementById("pptxVideo"); if (pptxVideo) pptxVideo.checked = Boolean(stored.pptxVideo);
    }
    ["videoCaption", "videoSpeed", "videoWidth", "pptxVideo"].forEach((id) => document.getElementById(id)?.addEventListener("change", () => writeStored(VIDEO_OPTIONS_KEY, videoOptions())));
    restoreVideoOptions();

    /**
     * 操作の動画の材料（v0.7.14、v0.7.21 で操作手順番号ごとに）。出力対象の手順（ページ指定・非表示を反映）から、画像のある手順だけを使います。
     * ・1つの操作手順番号＝動画の1コマ単位。手順に番号が2つ以上あれば、同じ画面のままカーソルが番号の順（表示の番号順）に動いてクリックします
     * ・cursor は番号の注釈の「いまの位置」の中心（0〜1）。編集画面で番号を動かせば、その位置へ動きます
     * ・帯の番号は画面の番号（ラベル）に合わせます。番号のない手順（手動撮影・タブ切替など）は番号なしで説明だけ出し、カーソルは動かしません
     * ・sameScreen＝同じ手順の2つ目以降の番号。動画側では画面の切り替えと「読む時間」を省いてカーソル移動だけにします
     */
    function videoItems() {
        const items = [];
        exportSteps()
            .filter(({ step }) => step?.screenshot)
            .forEach(({ step }) => {
                const render = () => buildStepCanvas(step, false);
                const text = PG.cleanText(step.description, 120);
                const markerList = (step.annotations || []).filter((annotation) => annotation?.type === "marker"
                    && Number.isFinite(Number(annotation.x)) && Number.isFinite(Number(annotation.y)));
                if (!markerList.length) { items.push({ render, description: text, cursor: null, sameScreen: false }); return; }
                markerList.forEach((marker, position) => {
                    const label = PG.cleanText(marker.label, 6);
                    items.push({
                        render,
                        description: label && label !== "–" ? `${label}. ${text}` : text,
                        cursor: { x: PG.clamp(Number(marker.x) + (Number(marker.width) || 0) / 2, 0, 1), y: PG.clamp(Number(marker.y) + (Number(marker.height) || 0) / 2, 0, 1) },
                        sameScreen: position > 0
                    });
                });
            });
        return items;
    }
    /** 動画を作ります。format: mp4／webm／gif。進捗は上部のメッセージに出します。 */
    async function buildVideoFile(format) {
        const maker = globalThis.PrivacyGuideVideo;
        if (!maker) throw new Error("動画の部品（video.js）を読み込めませんでした");
        const items = videoItems();
        if (!items.length) throw new Error("動画にする手順がありません（画像のある手順が必要です）");
        const options = videoOptions();
        const fontLabel = PG.FONT_LABELS[documentFont()] === "システム標準" ? "Yu Gothic" : PG.FONT_LABELS[documentFont()];
        const seconds = Math.round(maker.estimateDurationMs(items, options.speed) / 1000);
        return maker.build({
            items, format, caption: options.caption, speed: options.speed, maxWidth: options.width, font: fontLabel,
            onProgress: (done, total) => setSaveState(`操作の動画を作成しています… ${Math.min(done + 1, total)} / ${total} 番号（約${seconds}秒の動画）`, "#8a8a8a", true)
        });
    }
    async function exportVideo(format) {
        setSaveState("操作の動画を作成しています…", "#8a8a8a", true);
        try {
            const made = await buildVideoFile(format);
            downloadBlob(made.blob, safeFilename(made.ext));
            const size = made.blob.size >= 1048576 ? `${(made.blob.size / 1048576).toFixed(1)} MB` : `${Math.round(made.blob.size / 1024)} KB`;
            const label = made.actualFormat === "gif" ? "GIF" : made.actualFormat === "mp4" ? "動画（MP4）" : "動画（WebM）";
            setSaveState(`${label}を保存しました（${Math.round(made.durationMs / 1000)}秒・${size}）${made.note ? `。${made.note}` : ""}`, "#1b5e20", Boolean(made.note));
        } catch (error) {
            setSaveState(`動画を作れませんでした：${PG.cleanText(error?.message || error, 140)}`, "#b42318", true);
        }
    }
    document.getElementById("exportFormat")?.addEventListener("change", () => syncLayoutControls());
    document.getElementById("exportRun")?.addEventListener("click", () => exportGuide(exportFormat()));

    function syncLayoutControls() {
        const layout = layoutOf();
        const isPreset = layout.id === PG.DEFAULT_LAYOUT_PORTRAIT || layout.id === PG.DEFAULT_LAYOUT_LANDSCAPE;
        if (elements.pageOrientation) {
            elements.pageOrientation.value = layout.id === PG.DEFAULT_LAYOUT_PORTRAIT ? "portrait"
                : layout.id === PG.DEFAULT_LAYOUT_LANDSCAPE ? "landscape" : "custom";
        }
        if (elements.layoutSummary) {
            elements.layoutSummary.hidden = isPreset;
            // 見出しと配置名を別のノードにして、翻訳がそれぞれ効くようにします。
            elements.layoutSummary.textContent = "";
            if (!isPreset) {
                const lead = document.createElement("span");
                lead.textContent = "配置：";
                const name = document.createElement("span");
                name.textContent = layout.label;
                elements.layoutSummary.append(lead, name);
            }
        }
        if (elements.paperSize) {
            if (!elements.paperSize.childElementCount) {
                PG.PAPER_SIZES.forEach((item) => {
                    const option = document.createElement("option");
                    option.value = item.id;
                    option.textContent = item.label;
                    elements.paperSize.appendChild(option);
                });
            }
            elements.paperSize.value = paperSizeId();
            elements.paperSize.disabled = !session;
        }
        // セクションを選ぶ（v0.7.16）：章があるときだけ選択肢に出し、無ければ「すべて」に戻します
        const sectionOption = elements.pageRangeMode?.querySelector('option[value="section"]');
        const sectionsAvailable = hasSections();
        if (sectionOption) { sectionOption.hidden = !sectionsAvailable; sectionOption.disabled = !sectionsAvailable; }
        if (!sectionsAvailable && pageRange.mode === "section") pageRange.mode = "all";
        renderSectionChoices();
        if (elements.pageRangeMode) elements.pageRangeMode.value = pageRange.mode;
        if (elements.pageRangeInput) {
            elements.pageRangeInput.hidden = pageRange.mode !== "range";
            if (elements.pageRangeInput.value !== pageRange.text) elements.pageRangeInput.value = pageRange.text;
        }
        updatePageRangeSummary();
        applyExportFormatVisibility();
    }

    /** 「セクションを選ぶ」の章一覧（v0.7.16）。チェックの状態は pageRange.sections に持ちます（出力のたびの選択なので保存しません）。 */
    function renderSectionChoices() {
        const box = document.getElementById("pageRangeSections");
        if (!box) return;
        const groups = sectionGroups();
        const chosen = new Set((pageRange.sections || []).filter((id) => groups.some((group) => group.id === id)));
        pageRange.sections = [...chosen];
        box.textContent = "";
        groups.forEach((group) => {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "checkbox";
            input.value = group.id;
            input.checked = chosen.has(group.id);
            const name = document.createElement("span");
            name.textContent = group.title;
            const count = document.createElement("span");
            count.className = "section-count";
            count.textContent = `${group.numbers.length} 手順`;
            label.append(input, name, count);
            box.appendChild(label);
        });
        const actions = document.createElement("div");
        actions.className = "section-actions";
        [["all", "すべて選ぶ"], ["none", "すべて外す"]].forEach(([action, text]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.sectionAction = action;
            button.textContent = text;
            actions.appendChild(button);
        });
        box.appendChild(actions);
    }
    document.getElementById("pageRangeSections")?.addEventListener("change", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
        const set = new Set(pageRange.sections || []);
        if (input.checked) set.add(input.value); else set.delete(input.value);
        pageRange.sections = [...set];
        updatePageRangeSummary();
    });
    document.getElementById("pageRangeSections")?.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("button[data-section-action]") : null;
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        pageRange.sections = button.dataset.sectionAction === "all" ? sectionGroups().map((group) => group.id) : [];
        renderSectionChoices();
        updatePageRangeSummary();
    });

    /** レイアウト選択ダイアログの中身を組み立てます。 */
    function renderLayoutChoices() {
        if (!elements.layoutList) return;
        elements.layoutList.textContent = "";
        PG.PAGE_LAYOUTS.forEach((layout) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "layout-card";
            card.dataset.layout = layout.id;
            if (layout.id === pendingLayoutId) card.classList.add("selected");

            const rows = Math.max(1, Math.ceil(layout.perPage / layout.cols));
            const figure = document.createElement("span");
            figure.className = "layout-figure";
            // 用紙の縦横比に合わせた小さな見本を描きます。
            const wide = layout.paper === "landscape";
            figure.style.width = `${wide ? 54 : 38}px`;
            figure.style.height = `${wide ? 38 : 54}px`;
            figure.style.gridTemplateColumns = `repeat(${layout.cols},1fr)`;
            // 1枚配置は行を auto にしないと、alignContent（中央・上段・下段）が効きません。
            figure.style.gridTemplateRows = layout.perPage === 1 ? "auto" : `repeat(${rows},1fr)`;
            const cells = layout.cols * rows;
            for (let index = 0; index < cells; index += 1) {
                const cell = document.createElement("span");
                cell.className = index < layout.perPage ? "layout-cell" : "layout-cell blank";
                // 1枚配置のときは、中央・上段・下段が分かるように高さを変えます。
                if (layout.perPage === 1 && layout.align !== "top") {
                    figure.style.alignContent = layout.align === "center" ? "center" : "end";
                    cell.style.height = `${wide ? 20 : 28}px`;
                } else if (layout.perPage === 1) {
                    figure.style.alignContent = "start";
                    cell.style.height = `${wide ? 20 : 28}px`;
                }
                figure.appendChild(cell);
            }
            const label = document.createElement("span");
            label.textContent = layout.label;
            card.append(figure, label);
            elements.layoutList.appendChild(card);
        });
    }

    function openLayoutDialog() {
        pendingLayoutId = layoutOf().id;
        renderLayoutChoices();
        elements.exportMenu.hidden = true;
        elements.layoutDialog?.showModal();
    }

    function applyLayout(id) {
        if (!session) return;
        pushHistory();
        const layout = PG.pageLayout(id, session.orientation);
        session.layout = layout.id;
        // 既存の保存形式との互換のため、用紙の向きも書き戻します。
        session.orientation = layout.paper;
        syncLayoutControls();
        scheduleSave();
    }

    // Annotation types that become editable Office shapes. Blur stays baked into the
    // image because it is a pixel operation and has no shape equivalent.
    const SHAPE_TYPES = ["redact", "highlight", "arrow", "text", "image", "marker"];

    function shapeData(step) {
        return (step.annotations || [])
            .filter((annotation) => SHAPE_TYPES.includes(annotation?.type))
            .map((annotation) => {
                const box = normalizedRect(annotation);
                const shape = {
                    type: annotation.type,
                    color: normalizeColor(annotation.color),
                    size: normalizeSize(annotation.size),
                    x: PG.clamp(box.left, 0, 1),
                    y: PG.clamp(box.top, 0, 1),
                    width: PG.clamp(box.width, 0.002, 1),
                    height: PG.clamp(box.height, 0.002, 1)
                };
                if (annotation.type === "arrow") {
                    // Arrows keep their direction: x/y is the tail, width/height the signed delta.
                    shape.x = PG.clamp(annotation.x, 0, 1);
                    shape.y = PG.clamp(annotation.y, 0, 1);
                    shape.width = PG.clamp(annotation.width, -1, 1);
                    shape.height = PG.clamp(annotation.height, -1, 1);
                    shape.arrow = PG.arrowStyle(annotation);
                    // 中間バー・接続で決まった経路（v0.6.33）。曲線と手動カギ線は adj、それ以外の折れ線は点列で出します。
                    const canvasW = Math.max(1, elements.canvas.width);
                    const canvasH = Math.max(1, elements.canvas.height);
                    const route = arrowRoutePx(annotation, canvasW, canvasH);
                    const connected = Boolean(annotation.startAnchor || annotation.endAnchor);
                    const midAdjust = arrowBarValue(annotation, "mid");
                    if (midAdjust !== null) shape.arrow.adjust = midAdjust;
                    if (shape.arrow.line === "uShape" || (shape.arrow.line === "elbow" && (connected || route.points.length !== 4))) {
                        shape.arrow.route = route.points.map(([px, py]) => ({ x: px / canvasW, y: py / canvasH }));
                    }
                }
                if (annotation.type === "highlight") {
                    shape.shape = PG.normalizeHighlightShape(annotation.shape);
                    shape.dash = PG.normalizeLineDash(annotation.dash);
                    shape.fillColor = PG.normalizeHexColor(annotation.fillColor, "#ffffff");
                    shape.fillOpacity = normalizeBackground(annotation.fillOpacity ?? 0);
                    if (String(annotation.text || "")) {
                        shape.text = String(annotation.text);
                        shape.textColor = PG.normalizeHexColor(annotation.textColor, "#111111");
                        shape.textSize = normalizeSize(annotation.textSize ?? 12);
                        shape.align = PG.normalizeTextAlign(annotation.textAlign ?? "center");
                        shape.valign = PG.normalizeTextValign(annotation.textValign ?? "middle");
                        shape.font = PG.FONT_LABELS[PG.normalizeFont(annotation.font ?? documentFont())] === "システム標準"
                            ? "Yu Gothic"
                            : PG.FONT_LABELS[PG.normalizeFont(annotation.font ?? documentFont())];
                    }
                }
                shape.rotation = rotationOf(annotation);
                if (annotation.type === "marker") shape.label = String(annotation.label || "");
                if (annotation.type === "text") {
                    shape.text = String(annotation.text || "");
                    shape.font = PG.FONT_LABELS[PG.normalizeFont(annotation.font ?? documentFont())] === "システム標準"
                        ? "Yu Gothic"
                        : PG.FONT_LABELS[PG.normalizeFont(annotation.font ?? documentFont())];
                    shape.background = normalizeBackground(annotation.background ?? 90);
                    shape.backgroundColor = PG.normalizeHexColor(annotation.backgroundColor, "#ffffff");
                    shape.borderWidth = Math.max(0, Number(annotation.borderWidth) || 0);
                    shape.borderColor = PG.normalizeHexColor(annotation.borderColor, "#d92d20");
                }
                if (annotation.type === "image") {
                    shape.src = annotation.src || "";
                    const crop = normalizeCrop(annotation.crop);
                    if (!isDefaultCrop(crop)) shape.crop = crop;
                }
                if (annotation.type === "text") {
                    shape.textMode = PG.normalizeTextKind(annotation.textMode);
                    shape.align = PG.normalizeTextAlign(annotation.align);
                    shape.valign = PG.normalizeTextValign(annotation.valign);
                    shape.vert = PG.normalizeTextDirection(annotation.vert);
                    if (shape.textMode !== "box" && shape.vert === "vertical") {
                        // 自動サイズの縦書き（v0.6.41）：画面と同じ実寸で図形を置きます（PowerPoint は列、Word はテキストボックスとして縦書き）。
                        const context = elements.canvas?.getContext?.("2d");
                        const canvasW = Math.max(1, elements.canvas?.width || 1);
                        const canvasH = Math.max(1, elements.canvas?.height || 1);
                        if (context) {
                            context.save();
                            context.font = `600 ${fontPxFor(context, annotation.size)}px ${PG.fontStack(annotation.font ?? documentFont())}`;
                            const m = measurePlainVertical(context, annotation);
                            context.restore();
                            shape.width = PG.clamp(m.width / canvasW, 0.002, 1);
                            shape.height = PG.clamp(m.height / canvasH, 0.002, 1);
                        }
                    }
                }
                return shape;
            });
    }

    async function collectSlides(format, asShapes) {
        const slides = [];
        // 黒塗りの焼き込み（v0.7.2・出力メニュー「黒塗りを画像に焼き込む」既定 ON）：
        // ON のときは黒塗りだけ画像に描き込み、図形としては出しません（受け取った人が動かして下を見られないように）。
        const burn = asShapes && exportBurnRedact();
        const exclude = asShapes ? SHAPE_TYPES.filter((type) => !(burn && type === "redact")) : [];
        const entries = exportSteps();
        for (let position = 0; position < entries.length; position += 1) {
            const { step, index, sectionTitle } = entries[position];
            if (sectionTitle) slides.push({ number: null, title: PG.cleanText(sectionTitle, 200), image: null, width: 16, height: 9, shapes: [], section: true, sectionName: sectionTitle });
            const canvas = await buildStepCanvas(step, false, false, exclude);
            slides.push({
                number: index + 1,
                title: PG.cleanText(step.description, 200),
                image: canvas ? canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", .92) : null,
                width: canvas ? canvas.width : 16,
                height: canvas ? canvas.height : 9,
                shapes: asShapes ? shapeData(step).filter((shape) => !(burn && shape.type === "redact")) : [],
                sectionName: entries[position].section || "",
                // 手順ごとのデザイン上書き（v0.6.36）。無ければ null＝マスター（ガイドの設定）を使う
                design: step.design && asShapes ? await officeDesignOf(designFor(step)) : null
            });
        }
        return slides;
    }

    /** Office・Markdown・スライドショー用の表紙データ（v0.6.43）。表紙OFFなら null。 */
    function coverData() {
        if (!frontMatterEnabled().cover) return null;
        const cover = PG.normalizeCover(session?.cover);
        return {
            title: session?.title || "",
            description: session?.description || "",
            number: cover.number, version: cover.version, date: cover.date, department: cover.department,
            confidentiality: cover.confidentiality,
            confidentialityLabel: PG.coverConfidentialityLabel(cover.confidentiality),
            // v0.7.11：文書管理項目（Word・Markdown。v0.7.12 から PowerPoint・Excel も）
            approvals: cover.approvalEnabled ? cover.approvals.map((item) => ({ ...item })) : [],
            revisions: cover.revisions.map((item) => ({ ...item })),
            sections: PG.coverTextSections(cover).map(([label, text]) => ({ label, text }))
        };
    }

    /** Office 用の目次行（v0.6.43）。page は手順の番号（PowerPoint のスライド番号）。stepIndex は Word 側でページ番号を引き直すための位置。 */
    function officeTocRows(entries) {
        if (!frontMatterEnabled().toc || !entries.length) return null;
        // entries の位置と、Office に渡す steps 配列（セクション見出しを含む）の位置の対応を作ります。
        const rows = [];
        const hasSection = entries.some((entry) => entry.section);
        let lastSection = null;
        let slidePosition = 0;
        entries.forEach((entry) => {
            if (entry.sectionTitle) slidePosition += 1;   // セクション見出しのスライド／ページ
            if (hasSection && entry.section && entry.section !== lastSection) {
                rows.push({ level: 1, text: entry.section, page: entry.index + 1, stepIndex: entry.sectionTitle ? slidePosition - 1 : slidePosition });
                lastSection = entry.section;
            }
            rows.push({ level: hasSection ? 2 : 1, text: `${entry.index + 1}. ${PG.cleanText(entry.step.description, 120)}`, page: entry.index + 1, stepIndex: slidePosition });
            slidePosition += 1;
        });
        return { rows };
    }

    async function exportOfficeFile(kind) {
        const builder = globalThis.PrivacyGuidePptx;
        if (!builder) { setSaveState("出力モジュールを読み込めませんでした", "#b42318"); return; }
        setSaveState(kind === "pptx" ? "PowerPointを作成しています…" : "Wordを作成しています…", "#8a8a8a", true);
        const slides = await collectSlides("jpeg", true);
        const fontLabel = PG.FONT_LABELS[documentFont()] === "システム標準" ? "Yu Gothic" : PG.FONT_LABELS[documentFont()];
        const footer = footerSettings();
        const design = await officeDesign();
        const front = { cover: coverData(), toc: officeTocRows(exportSteps()) };
        // 操作の動画を最後のスライドに（v0.7.14）：MP4 が作れれば動画、作れなければ動くGIFの画像として入れます
        let video = null;
        if (kind === "pptx" && videoOptions().pptxVideo) {
            try {
                let made = await buildVideoFile("mp4");
                if (made.actualFormat !== "mp4") made = await buildVideoFile("gif");
                video = { kind: made.actualFormat === "mp4" ? "mp4" : "gif", bytes: new Uint8Array(await made.blob.arrayBuffer()), poster: new Uint8Array(await made.poster.arrayBuffer()), width: made.width, height: made.height, durationMs: made.durationMs, title: "操作の動画（クリックで再生）" };
                setSaveState("PowerPointを作成しています…", "#8a8a8a", true);
            } catch (error) {
                setSaveState(`動画を作れなかったため、動画なしで PowerPoint を作ります：${PG.cleanText(error?.message || error, 100)}`, "#b42318", true);
            }
        }
        const bytes = kind === "pptx"
            ? builder.buildPptx(slides, { orientation: orientation(), font: fontLabel, footer, design, documentTitle: session?.title || "", front, video })
            : builder.buildDocx(slides, {
                orientation: orientation(),
                paper: PG.paperMetrics(paperSizeId(), orientation()),   // 用紙サイズ（v0.7.11）
                perPage: layoutOf().perPage,
                font: fontLabel,
                // 表紙があるときは本文先頭の題名・説明を重ねません（表紙に載るため）
                documentTitle: front.cover ? "" : (session?.title || ""),
                description: front.cover ? "" : (session?.description || ""),
                footer,
                design,
                front
            });
        const mime = kind === "pptx"
            ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        downloadBlob(new Blob([bytes], { type: mime }), safeFilename(kind === "pptx" ? "pptx" : "docx"));
        setSaveState(kind === "pptx" ? (video ? `PowerPointを保存しました（最後に${video.kind === "mp4" ? "動画（MP4）" : "GIF"}のスライドを追加）` : "PowerPointを保存しました") : "Wordを保存しました", "#1b5e20");
    }

    /** Excel（.xlsx）出力（v0.6.45）：1手順1行（No.／操作／画面／備考）。画像を「画面」列に置き、注釈は編集できる図形として重ねます。 */
    async function exportExcelFile() {
        const builder = globalThis.PrivacyGuidePptx;
        if (!builder?.buildXlsx) { setSaveState("出力モジュールを読み込めませんでした", "#b42318"); return; }
        setSaveState("Excelを作成しています…", "#8a8a8a", true);
        // PowerPoint・Word と同じく、注釈は画像に焼き込まず、Excel 上で動かせる図形として出します。
        const slides = await collectSlides("jpeg", true);
        const fontLabel = PG.FONT_LABELS[documentFont()] === "システム標準" ? "Yu Gothic" : PG.FONT_LABELS[documentFont()];
        const bytes = builder.buildXlsx(slides, {
            font: fontLabel,
            documentTitle: session?.title || "",
            description: session?.description || "",
            cover: coverData(),
            footer: footerSettings()
        });
        downloadBlob(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), safeFilename("xlsx"));
        setSaveState("Excelを保存しました", "#1b5e20");
    }

    async function exportGuide(type) {
        elements.exportMenu.hidden = true;
        if (!session) return;
        await saveNow();
        if (type === "print") {
            await printGuide();
            return;
        }
        if (type === "json") {
            const flattened = deepCopy(session);
            for (let index = 0; index < flattened.steps.length; index += 1) {
                const rendered = await buildStepCanvas(session.steps[index], false);
                if (rendered) flattened.steps[index].screenshot = rendered.toDataURL("image/jpeg", .9);
                flattened.steps[index].annotations = [];
                flattened.steps[index].target = null;
            }
            flattened.exportedAt = new Date().toISOString();
            flattened.isFlattenedExport = true;
            downloadBlob(new Blob([JSON.stringify(flattened, null, 2)], { type: "application/json" }), safeFilename("json"));
            return;
        }
        if (type === "pptx" || type === "docx") {
            await exportOfficeFile(type);
            return;
        }
        if (isVideoFormat(type)) {
            await exportVideo(type);
            return;
        }
        if (type === "xlsx") {
            await exportExcelFile();
            return;
        }
        if (type === "html") {
            const html = await buildStandaloneHtml();
            downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), safeFilename("html"));
            return;
        }
        if (type === "markdown") {
            const lines = [`# ${session.title}`, "", session.description || "", ""];
            const design = exportDesign();
            if (design?.logo) lines.splice(1, 0, "", `![ロゴ](${design.logo})`);
            const entries = exportSteps();
            // 表紙の項目・目次（v0.6.43）
            const cover = coverData();
            if (cover) {
                const rows = [["文書番号", cover.number], ["版数", cover.version], ["作成日", cover.date], ["作成部署", cover.department], ["機密区分", cover.confidentialityLabel]].filter(([, value]) => value);
                if (rows.length) lines.push("| 項目 | 内容 |", "|---|---|", ...rows.map(([label, value]) => `| ${label} | ${value} |`), "");
                // 文書管理項目（v0.7.11）
                const mdCell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ") || " ";
                if (cover.approvals.length) {
                    lines.push(`| ${cover.approvals.map((item) => mdCell(item.label)).join(" | ")} |`, `|${cover.approvals.map(() => "---").join("|")}|`,
                        `| ${cover.approvals.map((item) => mdCell(item.name)).join(" | ")} |`, `| ${cover.approvals.map((item) => mdCell(item.date)).join(" | ")} |`, "");
                }
                cover.sections.forEach(({ label, text }) => {
                    lines.push(`## ${label}`, "");
                    if (label === "関連文書") lines.push(...text.split("\n").filter((line) => line.trim()).map((line) => `- ${line.trim()}`), "");
                    else lines.push(text, "");
                });
                if (cover.revisions.length) {
                    lines.push("## 改訂履歴", "", "| 版 | 日付 | 改訂内容 | 承認者 |", "|---|---|---|---|",
                        ...cover.revisions.map((item) => `| ${mdCell(item.version)} | ${mdCell(item.date)} | ${mdCell(item.note)} | ${mdCell(item.author)} |`), "");
                }
            }
            const toc = officeTocRows(entries);
            if (toc) {
                lines.push("## 目次", "", ...toc.rows.map((row) => `${row.level >= 2 ? "    " : ""}- ${row.text}`), "");
            }
            for (let position = 0; position < entries.length; position += 1) {
                const { step, index, sectionTitle } = entries[position];
                if (sectionTitle) lines.push("---", "", `## ${sectionTitle}`, "");
                lines.push(`## ${index + 1}. ${step.description}`, "");
                const canvas = await buildStepCanvas(step, false);
                if (canvas) lines.push(`![手順 ${index + 1}](${canvas.toDataURL("image/jpeg", .86)})`, "");
                if (appSettings.showStepUrls && step.url) lines.push(`<small>${step.url}</small>`, "");
            }
            downloadBlob(new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }), safeFilename("md"));
        }
    }

    const librarySelectedSet = new Set();   // ガイド一覧でエクスポート用に選んだガイドの id（v0.7.19）
    let libraryIdList = [];                  // いま一覧に出ているガイド id
    /** 選択数に合わせて「エクスポート（n件）」と「すべて選択」の状態を合わせます。 */
    function syncLibrarySelection() {
        const button = document.getElementById("exportGuidesButton");
        const selectAll = document.getElementById("librarySelectAll");
        const count = librarySelectedSet.size;
        if (button) { button.disabled = count === 0; button.textContent = count ? `エクスポート（${count}件）` : "エクスポート"; }
        if (selectAll) {
            const selectedVisible = libraryIdList.filter((id) => librarySelectedSet.has(id)).length;
            selectAll.checked = libraryIdList.length > 0 && selectedVisible === libraryIdList.length;
            selectAll.indeterminate = selectedVisible > 0 && selectedVisible < libraryIdList.length;
            selectAll.disabled = libraryIdList.length === 0;
        }
    }
    document.getElementById("librarySelectAll")?.addEventListener("change", (event) => {
        if (event.currentTarget.checked) libraryIdList.forEach((id) => librarySelectedSet.add(id));
        else libraryIdList.forEach((id) => librarySelectedSet.delete(id));
        elements.libraryList.querySelectorAll(".pick input").forEach((box) => { box.checked = librarySelectedSet.has(box.dataset.id); });
        syncLibrarySelection();
    });
    async function renderLibrary() {
        const result = await message({ type: "PG_LIST_SESSIONS" });
        const list = Array.isArray(result?.sessions) ? result.sessions : [];
        elements.libraryList.replaceChildren();
        libraryIdList = list.map((item) => item?.id).filter(Boolean);
        [...librarySelectedSet].forEach((id) => { if (!libraryIdList.includes(id)) librarySelectedSet.delete(id); });
        syncLibrarySelection();
        if (!list.length) {
            elements.libraryList.innerHTML = '<div class="empty-canvas" style="padding:40px"><strong>ガイドがありません</strong><span>拡張機能から記録を開始してください。</span></div>';
            return;
        }
        list.forEach((item) => {
            const row = document.createElement("div");
            row.className = "library-item";
            // エクスポート用の選択（v0.7.19）。行のクリック（開く）とは別に扱います
            const pick = document.createElement("label");
            pick.className = "pick";
            pick.title = "エクスポートするガイドとして選ぶ";
            const pickBox = document.createElement("input");
            pickBox.type = "checkbox";
            pickBox.dataset.id = item?.id || "";
            pickBox.checked = librarySelectedSet.has(item?.id);
            pickBox.addEventListener("click", (event) => event.stopPropagation());
            pickBox.addEventListener("change", () => { if (pickBox.checked) librarySelectedSet.add(item?.id); else librarySelectedSet.delete(item?.id); syncLibrarySelection(); });
            pick.addEventListener("click", (event) => event.stopPropagation());
            pick.appendChild(pickBox);
            const info = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = item?.title || "名称未設定のガイド";
            const meta = document.createElement("span");
            meta.textContent = `${Number(item?.stepCount) || 0}ステップ · ${item?.updatedAt ? new Date(item.updatedAt).toLocaleString("ja-JP") : ""}`;
            info.append(title, meta);
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = item?.id === session?.id ? "編集中" : "開く";
            button.disabled = item?.id === session?.id;
            row.append(pick, info, button);
            row.addEventListener("click", () => { if (item?.id !== session?.id) loadSession(item?.id); });
            elements.libraryList.appendChild(row);
        });
    }

    /* ---- 追加で撮影（v0.6.47） ---- */
    function setRecordingHere(on, text) {
        if (on && !recordingHere) recordingBaseIds = new Set((session?.steps || []).map((step) => step.id));
        recordingHere = Boolean(on);
        const notice = document.getElementById("recordNotice");
        if (notice) notice.hidden = !recordingHere;
        const label = document.getElementById("recordNoticeText");
        if (label && text) label.textContent = text;
        const button = document.getElementById("resumeRecord");
        if (button) button.disabled = recordingHere;
        document.body.classList.toggle("recording-here", recordingHere);
        ["guideTitle", "guideDescription", "stepDescription", "stepNotes"].forEach((id) => { const input = document.getElementById(id); if (input) input.disabled = recordingHere || (id.startsWith("step") && !currentStep()); });
    }
    /** 記録側が保存したガイドを読み直し、手順一覧を最新にします（選択と履歴は保ちます）。 */
    async function refreshFromStorage(selectId) {
        if (!session) return;
        const result = await message({ type: "PG_GET_SESSION", id: session.id });
        if (!result?.session) return;
        const fresh = normalizeSession(result.session);
        session = fresh;
        renumberMarkers();
        if (selectId && session.steps.some((step) => step.id === selectId)) selectedStepId = selectId;
        else if (!session.steps.some((step) => step.id === selectedStepId)) selectedStepId = session.steps[0]?.id || null;
        setSelection([]);
        renderStepList();
        updateStepFields();
        drawCanvas();
        updateMaskNotice();
        updateHistoryButtons();
    }
    document.getElementById("resumeRecord")?.addEventListener("click", async () => {
        if (!session || recordingHere) return;
        if (editingAnnotationId) closeTextEditor(true);
        await saveNow();
        const step = currentStep();
        const result = await message({ type: "PG_RESUME", payload: { sessionId: session.id, afterStepId: step?.id || "", url: step?.url || "" } });
        if (!result?.ok) {
            setSaveState(result?.reason === "already-recording" ? "別のガイドを記録中です。先にポップアップで記録を終了してください" : "追加で撮影を始められませんでした", "#b42318");
            return;
        }
        stepUndo.length = 0; stepRedo.length = 0; editUndo.length = 0; editRedo.length = 0; updateHistoryButtons();
        const where = step ? `手順 ${session.steps.indexOf(step) + 1} の直後` : "末尾";
        setRecordingHere(true, result.pending
            ? `追加で撮影：撮影ウィンドウで画面を選ぶと記録が始まります。新しい手順は${where}に入ります。`
            : `追加で撮影中：${result.opened ? "開いたタブ" : (result.tabTitle ? `「${result.tabTitle}」のタブ` : "ページのタブ")}で操作すると、手順が${where}に入ります。終了はここの「記録を終了」・ポップアップ・Alt+Shift+G`);
        setSaveState("追加で撮影中", "#b42318", true);
    });
    document.getElementById("recordStop")?.addEventListener("click", async () => { await message({ type: "PG_STOP" }); });
    // 記録の開始・終了（pgCurrent）と、記録側の保存（pgSession:<id>）を見て、手順一覧を追従させます。
    chrome.storage?.onChanged?.addListener(async (changes, area) => {
        if (area !== "local" || !session) return;
        if (changes.pgCurrent) {
            const next = changes.pgCurrent.newValue || {};
            const prev = changes.pgCurrent.oldValue || {};
            const mine = next.isRecording && next.sessionId === session.id;
            if (mine && !recordingHere) setRecordingHere(true, "追加で撮影中：操作したページの手順が入ります。終了はここの「記録を終了」・ポップアップ・Alt+Shift+G");
            if (!mine && recordingHere) {
                const lastAdded = prev.insertAfterStepId && prev.insertAfterStepId !== prev.resumeAnchorId ? prev.insertAfterStepId : null;
                setRecordingHere(false);
                await refreshFromStorage(lastAdded || selectedStepId);
                const added = session.steps.filter((step) => !recordingBaseIds.has(step.id)).length;
                setSaveState(added > 0 ? `追加で撮影を終了しました（${added} 件の手順を追加）` : "追加で撮影を終了しました（追加された手順はありません）", "#1b5e20");
                if (added > 0) setTimeout(runAutoOcr, 1200);
            }
            return;
        }
        if (recordingHere && changes[`pgSession:${session.id}`]) {
            const current = await chrome.storage.local.get("pgCurrent");
            await refreshFromStorage(current?.pgCurrent?.insertAfterStepId || selectedStepId);
        }
    });

    /* ---- 他のガイドから取り込む（v0.6.47） ---- */
    const mergeState = { source: null, picked: new Set() };
    function mergeElements() {
        return { dialog: document.getElementById("mergeDialog"), list: document.getElementById("mergeList"), subtitle: document.getElementById("mergeSubtitle"), back: document.getElementById("mergeBack"), apply: document.getElementById("mergeApply") };
    }
    async function renderMergeGuides() {
        const ui = mergeElements();
        if (!ui.list) return;
        mergeState.source = null; mergeState.picked.clear();
        ui.back.hidden = true; ui.apply.hidden = true;
        ui.subtitle.textContent = "取り込むガイドを選んでください。手順はコピーされ、選択中の手順の直後に入ります";
        const result = await message({ type: "PG_LIST_SESSIONS" });
        const list = (Array.isArray(result?.sessions) ? result.sessions : []).filter((item) => item?.id && item.id !== session?.id);
        ui.list.replaceChildren();
        if (!list.length) { ui.list.innerHTML = '<div class="empty-canvas" style="padding:40px"><strong>取り込めるガイドがありません</strong><span>他のガイドを記録すると、ここに出ます。</span></div>'; return; }
        list.forEach((item) => {
            const row = document.createElement("div");
            row.className = "library-item";
            const info = document.createElement("div");
            const title = document.createElement("strong"); title.textContent = item.title || "名称未設定のガイド";
            const meta = document.createElement("span"); meta.textContent = `${Number(item.stepCount) || 0}ステップ · ${item.updatedAt ? new Date(item.updatedAt).toLocaleString("ja-JP") : ""}`;
            info.append(title, meta);
            const button = document.createElement("button"); button.type = "button"; button.textContent = "手順を選ぶ";
            row.append(info, button);
            row.addEventListener("click", () => renderMergeSteps(item.id));
            ui.list.appendChild(row);
        });
    }
    async function renderMergeSteps(id) {
        const ui = mergeElements();
        const result = await message({ type: "PG_GET_SESSION", id });
        if (!result?.session) return;
        mergeState.source = normalizeSession(result.session);
        mergeState.picked = new Set(mergeState.source.steps.map((step) => step.id));
        ui.subtitle.textContent = `「${mergeState.source.title}」の手順。取り込むものにチェックを付けてください（初期状態はすべて）`;
        ui.back.hidden = false; ui.apply.hidden = false;
        ui.list.replaceChildren();
        const all = document.createElement("label"); all.className = "merge-row merge-all";
        const allBox = document.createElement("input"); allBox.type = "checkbox"; allBox.checked = true;
        allBox.addEventListener("change", () => { ui.list.querySelectorAll('input[data-step]').forEach((box) => { box.checked = allBox.checked; box.checked ? mergeState.picked.add(box.dataset.step) : mergeState.picked.delete(box.dataset.step); }); syncMergeApply(); });
        const allText = document.createElement("span"); allText.textContent = "すべて選択";
        all.append(allBox, allText); ui.list.appendChild(all);
        mergeState.source.steps.forEach((step, index) => {
            const row = document.createElement("label"); row.className = "merge-row";
            const box = document.createElement("input"); box.type = "checkbox"; box.checked = true; box.dataset.step = step.id;
            box.addEventListener("change", () => { box.checked ? mergeState.picked.add(step.id) : mergeState.picked.delete(step.id); allBox.checked = mergeState.picked.size === mergeState.source.steps.length; syncMergeApply(); });
            const number = document.createElement("span"); number.className = "merge-number"; number.textContent = String(index + 1).padStart(2, "0");
            const text = document.createElement("span"); text.className = "merge-text";
            const title = document.createElement("strong"); title.textContent = PG.cleanText(step.description, 120) || "（説明なし）";
            const meta = document.createElement("small"); meta.textContent = `${step.section?.title ? `セクション「${step.section.title}」の先頭 · ` : ""}${step.screenshot ? "スクリーンショットあり" : "画像なし"}`;
            text.append(title, meta);
            row.append(box, number, text);
            ui.list.appendChild(row);
        });
        syncMergeApply();
    }
    function syncMergeApply() {
        const ui = mergeElements();
        if (ui.apply) { ui.apply.disabled = !mergeState.picked.size; ui.apply.textContent = mergeState.picked.size ? `${mergeState.picked.size} 件を取り込む` : "取り込む"; }
    }
    function applyMerge() {
        const ui = mergeElements();
        if (!session || !mergeState.source || !mergeState.picked.size) return;
        pushStepHistory();
        const copies = mergeState.source.steps.filter((step) => mergeState.picked.has(step.id)).map((step) => {
            const copy = deepCopy(step);
            copy.id = PG.createId("step");
            // セクション（章）は id を振り直して持ち込みます。注釈の id も新しくします。
            if (copy.section && typeof copy.section === "object") copy.section = { ...copy.section, id: PG.createId("section") };
            (copy.annotations || []).forEach((annotation) => { annotation.id = PG.createId("annotation"); });
            return copy;
        });
        const current = session.steps.findIndex((item) => item.id === selectedStepId);
        const at = current < 0 ? session.steps.length : current + 1;
        session.steps.splice(at, 0, ...copies);
        selectedStepId = copies[0]?.id || selectedStepId;
        setSelection([]);
        renumberMarkers();
        refreshAfterStepChange();
        setSaveState(`「${mergeState.source.title}」から ${copies.length} 件の手順を取り込みました`, "#1b5e20");
        ui.dialog?.close();
    }
    document.getElementById("mergeGuide")?.addEventListener("click", async () => { if (!session) return; await renderMergeGuides(); mergeElements().dialog?.showModal(); });
    document.getElementById("mergeBack")?.addEventListener("click", renderMergeGuides);
    document.getElementById("mergeApply")?.addEventListener("click", applyMerge);

    async function loadSession(id) {
        if (!id) return;
        cancelAutoOcr();
        await saveNow();
        const result = await message({ type: "PG_GET_SESSION", id });
        if (!result?.session) return;
        session = normalizeSession(result.session);
        stepUndo.length = 0;
        stepRedo.length = 0;
        editUndo.length = 0;
        editRedo.length = 0;
        lastCoalesceKey = "";
        renumberMarkers();
        selectedStepId = session.steps[0]?.id || null;
        setSelection([]);
        elements.guideTitle.value = session.title;
        elements.guideDescription.value = session.description;
        syncLayoutControls();
        syncDesignPanel();
        history.replaceState(null, "", `editor.html?id=${encodeURIComponent(session.id)}`);
        elements.libraryDialog.close();
        renderStepList();
        updateStepFields();
        drawCanvas();
        syncStyleControls();
        updateMaskNotice();
        updateHistoryButtons();
        document.title = `編集中: ${session.title} – TADORU.`;
        setSaveState("ローカルに保存済み", "#1b5e20");
        await syncRecordingHere();
        runAutoOcr();
    }
    /** 開いたガイドがいま記録中（追加で撮影中）かを確認し、表示を合わせます（v0.6.47）。 */
    async function syncRecordingHere() {
        const state = await message({ type: "PG_GET_STATE" });
        const mine = Boolean(state?.isRecording && session && state?.sessionId === session.id);
        if (mine !== recordingHere) setRecordingHere(mine, mine ? "追加で撮影中：操作したページの手順が入ります。終了はここの「記録を終了」・ポップアップ・Alt+Shift+G" : "");
        if (mine) setSaveState("追加で撮影中", "#b42318", true);
    }

    async function importJson(file) {
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            // 履歴のバックアップ（「エクスポート」の JSON・v0.7.18）はまとめて履歴に足し、一覧を更新します
            if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.guides)) {
                const guideList = PG.guidesFromBundle(parsed) || [];
                if (!guideList.length) { setSaveState("読み込めるガイドが入っていません", "#b42318"); return; }
                const result = await PG.importGuidesOneByOne(message, guideList, (done, total) => setSaveState(`インポートしています… ${done} / ${total}`, "#8a8a8a", true));
                const parts = [`${result?.imported || 0}件を履歴にインポートしました`];
                if (result?.skipped) parts.push(`${result.skipped}件はすでにあるため読み飛ばし`);
                if (result?.failed) parts.push(`${result.failed}件は読み込めず`);
                setSaveState(parts.join("・"), result?.imported ? "#1b5e20" : "#b42318", true);
                if (elements.libraryDialog?.open) await renderLibrary();
                return;
            }
            const imported = normalizeSession(parsed);
            imported.id = PG.createId("guide");
            imported.title = `${imported.title}（読み込み）`;
            imported.createdAt = new Date().toISOString();
            const result = await message({ type: "PG_SAVE_SESSION", session: imported });
            if (result?.session?.id) await loadSession(result.session.id);
        } catch (_error) {
            setSaveState("JSONを読み込めませんでした", "#b42318");
        }
    }
    /** ガイド一覧で選んだガイドを1つの JSON に書き出します（「エクスポート」・v0.7.18、v0.7.19 で選択式に）。ポップアップの同名ボタンと同じ形式です。 */
    async function exportSelectedGuides(button) {
        const idList = [...librarySelectedSet];
        const state = document.getElementById("libraryState");
        const say = (text, color) => { if (state) { state.textContent = text; state.style.color = color || "#8a8a8a"; } setSaveState(text, color, true); };
        if (!idList.length) { say("左のチェックでエクスポートするガイドを選んでください", "#b42318"); return; }
        if (button) button.disabled = true;
        say("エクスポートしています…", "#8a8a8a");
        try {
            if (session && !recordingHere && idList.includes(session.id)) await saveNow();   // 開いているガイドを含むなら最新の内容にします
            const sessions = await PG.fetchAllGuides(message, (done, total) => say(`エクスポートしています… ${done} / ${total}`, "#8a8a8a"), idList);
            if (!sessions.length) { say("エクスポートできるガイドがありません", "#b42318"); return; }
            const bundle = PG.buildGuideBundle(sessions, chrome.runtime.getManifest?.()?.version);
            downloadBlob(new Blob([JSON.stringify(bundle)], { type: "application/json" }), PG.guideBundleFilename(new Date()));
            say(`${sessions.length}件のガイドをエクスポートしました`, "#1b5e20");
        } catch (error) {
            say(`エクスポートできませんでした（${PG.cleanText(error?.message || error, 80)}）`, "#b42318");
        } finally {
            syncLibrarySelection();
        }
    }
    document.getElementById("exportGuidesButton")?.addEventListener("click", (event) => exportSelectedGuides(event.currentTarget));

    elements.guideTitle.addEventListener("input", () => {
        if (!session) return;
        pushHistory("title");
        session.title = PG.cleanText(elements.guideTitle.value, 160) || "名称未設定のガイド";
        document.title = `編集中: ${session.title} – TADORU.`;
        scheduleSave();
        syncDesignChrome();
    });
    elements.guideDescription.addEventListener("input", () => {
        if (!session) return;
        pushHistory("guideDescription");
        session.description = PG.cleanText(elements.guideDescription.value, 500);
        scheduleSave();
    });
    elements.stepDescription.addEventListener("input", () => {
        const step = currentStep();
        if (!step) return;
        pushHistory(`stepDescription:${step.id}`);
        step.description = PG.cleanText(elements.stepDescription.value, 300);
        renderStepList();
        scheduleSave();
    });
    // 発表者ノート（v0.6.43）：出力には載せず、スライドショーの発表者ビューにだけ出します。
    elements.stepNotes?.addEventListener("input", () => {
        const step = currentStep();
        if (!step) return;
        pushHistory(`stepNotes:${step.id}`);
        step.notes = PG.cleanText(elements.stepNotes.value, 2000);
        syncNotesMark();
        scheduleSave();
    });

    /* ---- 発表者ノートのペイン（v0.6.44）：PowerPoint と同じく画像の下に折りたたみで置きます ---- */
    const NOTES_OPEN_KEY = "tadoruNotesOpen";   // このタブ（端末）の開閉状態。ガイドの内容ではないので localStorage に置きます
    function syncNotesMark() {
        const mark = document.getElementById("notesMark");
        if (mark) mark.hidden = !currentStep()?.notes;
    }
    function setNotesOpen(open, focus) {
        const toggle = document.getElementById("notesToggle");
        if (!elements.stepNotes || !toggle) return;
        elements.stepNotes.hidden = !open;
        toggle.setAttribute("aria-expanded", String(Boolean(open)));
        const label = document.getElementById("notesToggleText");
        if (label) label.textContent = open ? "▼ 発表者ノート" : "▲ 発表者ノート";   // textContent で差し替えると i18n の監視が新しいノードを翻訳します
        try { localStorage.setItem(NOTES_OPEN_KEY, open ? "1" : "0"); } catch (_error) { /* 保存できなくても動作には影響しません */ }
        if (open && focus && !elements.stepNotes.disabled) elements.stepNotes.focus();
    }
    document.getElementById("notesToggle")?.addEventListener("click", () => setNotesOpen(elements.stepNotes?.hidden, true));
    try { setNotesOpen(localStorage.getItem(NOTES_OPEN_KEY) === "1", false); } catch (_error) { setNotesOpen(false, false); }

    /* ---- 画像内の文字を検出してマスク（OCR・v0.7.0） ----
     * 端末内の Tesseract.js で画像の文字を読み、詳細設定の条件に一致する部分を黒塗り注釈として足します。
     * OCR が使えない環境（部品の読み込み失敗・WASM 不可など）では、従来の自動マスク（ページの文字データ）のままにします。 */
    let ocrBusy = false;
    function rectCovers(existing, rect) {
        const box = normalizedRect(existing);
        const left = Math.max(box.left, rect.x), top = Math.max(box.top, rect.y);
        const right = Math.min(box.left + box.width, rect.x + rect.width), bottom = Math.min(box.top + box.height, rect.y + rect.height);
        const inter = Math.max(0, right - left) * Math.max(0, bottom - top);
        return inter / Math.max(1e-6, rect.width * rect.height) >= 0.8;
    }
    function ocrStatusLabel(status) {
        const text = String(status || "");
        if (/loading tesseract core|initializing tesseract/i.test(text)) return "文字認識の準備中";
        if (/loading language|initializing api/i.test(text)) return "言語データの読み込み中";
        if (/recognizing/i.test(text)) return "文字を読み取り中";
        return text ? PG.cleanText(text, 40) : "処理中";
    }
    document.getElementById("ocrMask")?.addEventListener("click", async () => {
        const step = currentStep();
        if (!step?.screenshot || ocrBusy || recordingHere) return;
        const ocr = globalThis.PrivacyGuideOcr;
        if (!ocr?.available()) { setSaveState("文字認識を使えないため、従来の自動マスク（ページの文字データ）のままです", "#b42318"); return; }
        if (editingAnnotationId) closeTextEditor(true);
        const button = document.getElementById("ocrMask");
        ocrBusy = true;
        if (button) button.disabled = true;
        setSaveState("画像内の文字を検出しています…（初回は数秒かかります）", "#8a8a8a", true);
        let result;
        try {
            result = await ocr.findSensitiveRects(step.screenshot, appSettings, (message) => {
                if (message && typeof message.progress === "number") setSaveState(`${ocrStatusLabel(message.status)} ${Math.round(message.progress * 100)}%`, "#8a8a8a", true);
            });
        } catch (error) {
            result = { ok: false, error: PG.cleanText(error?.message || error, 120), rects: [], wordCount: 0, elapsedMs: 0 };
        }
        ocrBusy = false;
        if (button) button.disabled = false;
        if (!result?.ok) { setSaveState(`文字認識を使えないため、従来の自動マスク（ページの文字データ）のままです（${result?.error || "不明なエラー"}）`, "#b42318"); return; }
        const target = currentStep();
        if (!target || target.id !== step.id) { setSaveState("手順が切り替わったため、マスクは足していません", "#b42318"); return; }
        const seconds = (result.elapsedMs / 1000).toFixed(1);
        if (pendingOcrRects(target, result.rects).length) pushHistory(`ocr:${target.id}`);
        const added = applyOcrRects(target, result.rects);
        if (!added) {
            await saveNow();   // ocrAt（処理済みの印）を保存してから結果を出します
            setSaveState(result.rects.length ? `検出した文字はすでにマスク済みです（${seconds}秒）` : `マスク対象の文字は見つかりませんでした（${result.wordCount} 語を読み取り・${seconds}秒）`, "#1b5e20", true);
            return;
        }
        drawCanvas();
        updateHistoryButtons();
        await saveNow();   // 「保存済み」で上書きされないよう、保存してから結果を出します（v0.7.2）
        setSaveState(`画像内の文字から ${added} 件をマスクしました（${seconds}秒）`, "#1b5e20", true);
    });
    /** OCR で見つけた矩形を黒塗り注釈として足します（すでに同じ場所が黒塗りなら重ねません）。戻り値は足した数。 */
    function pendingOcrRects(step, rects) {
        const existing = (step?.annotations || []).filter((item) => item?.type === "redact");
        return (rects || []).filter((rect) => !existing.some((item) => rectCovers(item, rect)));
    }
    function applyOcrRects(step, rects) {
        if (!step) return 0;
        if (!Array.isArray(step.annotations)) step.annotations = [];
        const fresh = pendingOcrRects(step, rects);
        fresh.forEach((rect) => step.annotations.push({ id: PG.createId("annotation"), type: "redact", fromOcr: true, x: rect.x, y: rect.y, width: rect.width, height: rect.height, color: "#111111", size: 2 }));
        step.ocrAt = new Date().toISOString();
        return fresh.length;
    }
    /* ---- いまの読み取り方式の表示（v0.7.7）：画像バーに「読み取り方式：OCR＋AI方式」などを出します。押すと詳細設定を開きます ---- */
    const ENGINE_LABELS = { html: "簡易方式", ocr: "OCR方式" };
    function syncEngineBadge() {
        const badge = document.getElementById("engineBadge");
        if (!badge) return;
        const engine = ENGINE_LABELS[appSettings.maskEngine] ? appSettings.maskEngine : "ocr";
        badge.textContent = `読み取り方式：${ENGINE_LABELS[engine]}`;
        badge.classList.toggle("is-html", engine === "html");
    }
    document.getElementById("engineBadge")?.addEventListener("click", () => chrome.runtime.openOptionsPage());

    /* ---- 記録終了後の自動 OCR（v0.7.1・詳細設定「画像内の文字を自動で検出してマスクする」既定 ON） ----
     * 編集画面でガイドを開いたとき（記録の終了直後・追加で撮影の終了直後を含む）、まだ処理していない手順を上から順に読み取ります。
     * 従来の自動マスク（ページの文字データ）はそのまま。OCR が使えない環境では黙って従来のままにします。 */
    let ocrAutoRun = null;
    async function runAutoOcr() {
        if (!session || !appSettings.ocrAuto || recordingHere || ocrBusy) return;
        if (appSettings.maskEngine === "html") return;   // 簡易方式（v0.7.6）：撮影時のページの文字データでマスク済み。自動 OCR はしません
        const ocr = globalThis.PrivacyGuideOcr;
        if (!ocr?.available()) return;
        const pending = session.steps.filter((step) => step?.screenshot && !step.ocrAt);
        if (!pending.length) return;
        const run = { sessionId: session.id, cancelled: false };
        ocrAutoRun = run;
        ocrBusy = true;
        const button = document.getElementById("ocrMask");
        if (button) button.disabled = true;
        let done = 0;
        let added = 0;
        let failed = "";
        let historyPushed = false;
        setOcrNotice(true, 0, pending.length, added);
        for (const step of pending) {
            if (run.cancelled || !session || session.id !== run.sessionId || recordingHere) break;
            done += 1;
            setOcrNotice(true, done, pending.length, added);
            setSaveState(`画像内の文字を検出中… ${done} / ${pending.length} 手順`, "#8a8a8a", true);
            let result;
            try { result = await ocr.findSensitiveRects(step.screenshot, appSettings); }
            catch (error) { result = { ok: false, error: PG.cleanText(error?.message || error, 120), rects: [] }; }
            if (run.cancelled || !session || session.id !== run.sessionId) break;
            if (!result?.ok) { failed = result?.error || "不明なエラー"; done -= 1; break; }
            if (!session.steps.includes(step)) continue;   // 処理中に削除された手順
            if (!historyPushed && pendingOcrRects(step, result.rects).length) { pushHistory("ocr-auto"); historyPushed = true; }
            added += applyOcrRects(step, result.rects);
        }
        ocrBusy = false;
        if (button) button.disabled = false;
        if (ocrAutoRun === run) ocrAutoRun = null;
        setOcrNotice(false);
        if (run.cancelled || !session || session.id !== run.sessionId) return;
        drawCanvas();
        updateHistoryButtons();
        if (done) await saveNow();   // 「保存済み」で上書きされないよう、保存してから結果を出します（v0.7.2）
        if (failed) setSaveState(`文字認識を使えないため、従来の自動マスク（ページの文字データ）のままです（${failed}）`, "#b42318", true);
        else setSaveState(added ? `画像内の文字を自動で検出しました（${done} 手順・${added} 件をマスク）` : `画像内の文字を自動で検出しました（${done} 手順・マスク対象なし）`, "#1b5e20", true);
    }
    function cancelAutoOcr() { if (ocrAutoRun) ocrAutoRun.cancelled = true; setOcrNotice(false); }
    /** 自動 OCR の進行中の帯（v0.7.3）。処理中の手順番号と進み具合、ここまでに足した黒塗りの数を出します。 */
    function setOcrNotice(on, done, total, added) {
        const notice = document.getElementById("ocrNotice");
        if (!notice) return;
        notice.hidden = !on;
        if (!on) return;
        const text = document.getElementById("ocrNoticeText");
        const bar = document.getElementById("ocrBar");
        const count = document.getElementById("ocrNoticeCount");
        const safeTotal = Math.max(1, Number(total) || 1);
        const current = Math.min(safeTotal, Math.max(0, Number(done) || 0));
        if (text) text.textContent = current > 0
            ? `画像内の文字を検出してマスクしています… ${current} / ${safeTotal} 手順目（この間も編集できます）`
            : "画像内の文字の検出を準備しています…（初回は数秒かかります）";
        if (bar) bar.style.width = `${Math.round((Math.max(0, current - 1) / safeTotal) * 100)}%`;
        if (count) count.textContent = added > 0 ? `黒塗り ${added} 件` : "";
    }
    window.addEventListener("beforeunload", () => { cancelAutoOcr(); globalThis.PrivacyGuideOcr?.terminate?.(); });

    /* ---- 撮り直し（v0.6.43）：この手順のページを開き、Alt+Shift+S で画像だけ差し替えます ---- */
    let retakeArmed = null;   // { sessionId, stepId }
    function syncRetakeButton() {
        const button = elements.retakeStep;
        if (!button) return;
        const step = currentStep();
        button.hidden = !step || !step.url;
        button.classList.toggle("armed", Boolean(retakeArmed && step && retakeArmed.stepId === step.id));
        button.textContent = retakeArmed && step && retakeArmed.stepId === step.id ? "撮り直し待ち（Alt+Shift+S）" : "撮り直す";
    }
    elements.retakeStep?.addEventListener("click", async () => {
        const step = currentStep();
        if (!session || !step) return;
        if (retakeArmed && retakeArmed.stepId === step.id) {
            await message({ type: "PG_RETAKE_CANCEL" });
            retakeArmed = null;
            syncRetakeButton();
            setSaveState("撮り直しを取りやめました", "#8a8a8a");
            return;
        }
        await saveNow();
        const result = await message({ type: "PG_RETAKE_START", payload: { sessionId: session.id, stepId: step.id, url: step.url } });
        if (!result?.ok) { setSaveState("撮り直しを始められませんでした", "#b42318"); return; }
        retakeArmed = { sessionId: session.id, stepId: step.id };
        syncRetakeButton();
        setSaveState(`手順 ${result.stepNumber} のページを開きました。画面を整えて Alt+Shift+S を押すと画像が差し替わります`, "#1b5e20", true);
    });
    // 背景が差し替えを終えると pgRetakeDone を書くので、その手順の画像だけ取り込みます（編集中の他の内容は保ちます）。
    chrome.storage?.onChanged?.addListener(async (changes, area) => {
        if (area !== "local" || !changes.pgRetakeDone?.newValue) return;
        const done = changes.pgRetakeDone.newValue;
        if (!session || done.sessionId !== session.id) return;
        const result = await message({ type: "PG_GET_SESSION", id: session.id });
        const fresh = (result?.session?.steps || []).find((item) => item?.id === done.stepId);
        const step = session.steps.find((item) => item?.id === done.stepId);
        if (!fresh || !step) return;
        pushHistory(`retake:${step.id}`);
        step.screenshot = fresh.screenshot;
        step.maskRects = Array.isArray(fresh.maskRects) ? fresh.maskRects : [];
        step.maskBurnedIn = Boolean(fresh.maskBurnedIn);
        step.captureError = fresh.captureError || "";
        step.pageTitle = fresh.pageTitle || step.pageTitle;
        step.target = null;
        step.frame = null;
        step.blankScreenshot = false;
        step.markerApplied = true;
        step.maskApplied = false;
        step.ocrAt = null;   // 画像が変わったので、自動 OCR をもう一度かけます（v0.7.1）
        step.annotations = (step.annotations || []).filter((item) => item && !item.fromMask && !item.fromOcr);
        step.annotations = withMarker(step, session.steps.indexOf(step), PG.normalizeHexColor(session.targetColor, appSettings.targetColor), normalizeSize(session.targetSize ?? appSettings.targetSize));
        step.maskApplied = true;
        imageCache.delete(fresh.screenshot);
        retakeArmed = null;
        syncRetakeButton();
        renderStepList();
        drawCanvas();
        updateMaskNotice();
        updateHistoryButtons();
        scheduleSave();
        setTimeout(runAutoOcr, 600);
        setSaveState("画像を差し替えました", "#1b5e20");
    });

    /* ---- 表紙の項目（v0.6.43）。v0.6.45 からタイトル下の「表紙」ボタン→ダイアログで入力。文書名はガイド名。 ---- */
    const coverElements = {
        number: document.getElementById("coverNumber"),
        version: document.getElementById("coverVersion"),
        date: document.getElementById("coverDate"),
        department: document.getElementById("coverDepartment"),
        confidentiality: document.getElementById("coverConfidentiality"),
        state: null   // v0.6.45：表紙はタイトル下のボタン→ダイアログに移動（表紙ONのときだけ表示）
    };
    if (coverElements.confidentiality && !coverElements.confidentiality.childElementCount) {
        PG.COVER_CONFIDENTIALITY.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.label;
            coverElements.confidentiality.appendChild(option);
        });
    }
    /** 表紙ダイアログの入力欄を cover の内容で埋めます（下書き方式・v0.7.11。開いている間は session ではなく下書きを表示）。 */
    function renderCoverForm(cover) {
        ["number", "version", "date", "department"].forEach((key) => {
            const input = coverElements[key];
            if (!input) return;
            if (input.value !== cover[key]) input.value = cover[key];
            input.disabled = !session;
        });
        if (coverElements.confidentiality) { coverElements.confidentiality.value = cover.confidentiality; coverElements.confidentiality.disabled = !session; }
        syncCoverExtras(cover);
    }
    function syncCoverFields() {
        const cover = PG.normalizeCover(session?.cover);
        // ダイアログを開いている間（下書き中）は入力欄を上書きしません（Undo などで呼ばれても下書きを守る）
        if (!coverDraft) renderCoverForm(cover);
        syncCoverButton(cover);
    }

    /* ---- 表紙の文書管理項目（v0.7.11）：目的・適用範囲・関連文書／承認欄／改訂履歴 ---- */
    const coverExtra = {
        purpose: document.getElementById("coverPurpose"),
        scope: document.getElementById("coverScope"),
        related: document.getElementById("coverRelated"),
        approvalEnabled: document.getElementById("coverApprovalEnabled"),
        approvalGrid: document.getElementById("coverApprovalGrid"),
        revisionTable: document.getElementById("coverRevisionTable"),
        revisionAdd: document.getElementById("coverRevisionAdd")
    };
    /* 下書き方式（v0.7.11）：ダイアログの入力は coverDraft に溜め、「保存」で session.cover に確定して即保存します。
     * 「キャンセル」「×」「Esc」は下書きを捨てます（保存していない変更があれば確認）。 */
    const coverDialog = document.getElementById("coverDialog");
    let coverDraft = null;   // 開いている間だけ入る。null＝閉じている
    function coverDraftDirty() {
        return Boolean(coverDraft) && JSON.stringify(coverDraft) !== JSON.stringify(PG.normalizeCover(session?.cover));
    }
    function updateCoverDialogState() {
        const dirty = coverDraftDirty();
        const save = document.getElementById("coverSave");
        if (save) save.disabled = !session || !dirty;
        const flag = document.getElementById("coverDirty");
        if (flag) flag.hidden = !dirty;
    }
    /** 画面の入力から表紙データを組み立てます（session.cover は毎回新しいオブジェクトに差し替え、Undo の履歴と配列を共有しません）。 */
    function readCoverForm(base) {
        const basic = {};
        ["number", "version", "date", "department", "confidentiality"].forEach((key) => { if (coverElements[key]) basic[key] = coverElements[key].value; });
        return readCoverExtras({ ...(base || {}), ...basic });
    }
    function readCoverExtras(base) {
        const approvals = [...(coverExtra.approvalGrid?.querySelectorAll(".approval-cell") || [])].map((cell) => ({
            label: cell.querySelector('[data-field="label"]')?.value,
            name: cell.querySelector('[data-field="name"]')?.value,
            date: cell.querySelector('[data-field="date"]')?.value
        }));
        const revisions = [...(coverExtra.revisionTable?.querySelectorAll(".revision-row") || [])].map((row) => ({
            version: row.querySelector('[data-field="version"]')?.value,
            date: row.querySelector('[data-field="date"]')?.value,
            note: row.querySelector('[data-field="note"]')?.value,
            author: row.querySelector('[data-field="author"]')?.value
        }));
        return PG.normalizeCover({
            ...(base || {}),
            purpose: coverExtra.purpose?.value,
            scope: coverExtra.scope?.value,
            related: coverExtra.related?.value,
            approvalEnabled: Boolean(coverExtra.approvalEnabled?.checked),
            approvals: approvals.length ? approvals : base?.approvals,
            revisions
        });
    }
    function renderApprovalGrid(cover) {
        const grid = coverExtra.approvalGrid;
        if (!grid) return;
        grid.textContent = "";
        cover.approvals.forEach((item, index) => {
            const cell = document.createElement("div");
            cell.className = "approval-cell";
            cell.dataset.index = String(index);
            const label = document.createElement("input"); label.type = "text"; label.maxLength = 20; label.className = "approval-label"; label.dataset.field = "label"; label.value = item.label; label.placeholder = PG.COVER_APPROVAL_DEFAULT_LABELS[index] || "見出し";
            const name = document.createElement("input"); name.type = "text"; name.maxLength = 40; name.dataset.field = "name"; name.value = item.name; name.placeholder = "氏名";
            const date = document.createElement("input"); date.type = "text"; date.maxLength = 30; date.dataset.field = "date"; date.value = item.date; date.placeholder = "日付（例：2026/9/8）";
            const hint = document.createElement("small"); hint.textContent = "見出し／氏名／日付";
            cell.append(label, name, date, hint);
            grid.appendChild(cell);
        });
        grid.classList.toggle("disabled", !cover.approvalEnabled);
    }
    function renderRevisionTable(cover, focusIndex) {
        const table = coverExtra.revisionTable;
        if (!table) return;
        table.textContent = "";
        ["版", "日付", "改訂内容", "承認者", ""].forEach((text) => { const head = document.createElement("span"); head.className = "revision-head"; head.textContent = text; table.appendChild(head); });
        if (!cover.revisions.length) {
            const empty = document.createElement("span"); empty.className = "revision-empty"; empty.textContent = "改訂履歴はありません。「行を追加」で1行目（例：第1.0版・初版）を足します。"; table.appendChild(empty);
            return;
        }
        cover.revisions.forEach((item, index) => {
            const row = document.createElement("div"); row.className = "revision-row"; row.dataset.index = String(index); row.style.display = "contents";
            [["version", item.version, "第1.0版", 30], ["date", item.date, "2026/9/8", 30], ["note", item.note, "初版", 200], ["author", item.author, "承認者", 40]].forEach(([field, value, placeholder, max]) => {
                const input = document.createElement("input"); input.type = "text"; input.maxLength = max; input.dataset.field = field; input.value = value; input.placeholder = placeholder; row.appendChild(input);
            });
            const remove = document.createElement("button"); remove.type = "button"; remove.className = "revision-remove"; remove.dataset.remove = String(index); remove.title = "この行を削除"; remove.textContent = "×";
            row.appendChild(remove);
            table.appendChild(row);
        });
        if (Number.isInteger(focusIndex)) table.querySelector(`.revision-row[data-index="${focusIndex}"] input`)?.focus();
    }
    function syncCoverExtras(cover) {
        ["purpose", "scope", "related"].forEach((key) => { const input = coverExtra[key]; if (!input) return; if (input.value !== cover[key]) input.value = cover[key]; input.disabled = !session; });
        if (coverExtra.approvalEnabled) { coverExtra.approvalEnabled.checked = cover.approvalEnabled; coverExtra.approvalEnabled.disabled = !session; }
        renderApprovalGrid(cover);
        renderRevisionTable(cover);
        const textState = document.getElementById("coverTextState");
        if (textState) textState.textContent = PG.coverTextSections(cover).map(([label]) => label).join("・") || "未入力";
        const approvalState = document.getElementById("coverApprovalState");
        if (approvalState) approvalState.textContent = cover.approvalEnabled ? "表紙に載せる" : "載せない";
        const revisionState = document.getElementById("coverRevisionState");
        if (revisionState) revisionState.textContent = cover.revisions.length ? `${cover.revisions.length} 行` : "なし";
    }
    /** 入力のたびに下書きを更新します（行は作り直さず、見出しの状態と「保存」ボタンだけ更新）。session には書きません。 */
    function commitCoverExtras() {
        if (!session || !coverDraft) return;
        coverDraft = readCoverForm(coverDraft);
        const cover = coverDraft;
        coverExtra.approvalGrid?.classList.toggle("disabled", !cover.approvalEnabled);
        const textState = document.getElementById("coverTextState");
        if (textState) textState.textContent = PG.coverTextSections(cover).map(([label]) => label).join("・") || "未入力";
        const approvalState = document.getElementById("coverApprovalState");
        if (approvalState) approvalState.textContent = cover.approvalEnabled ? "表紙に載せる" : "載せない";
        const revisionState = document.getElementById("coverRevisionState");
        if (revisionState) revisionState.textContent = cover.revisions.length ? `${cover.revisions.length} 行` : "なし";
        updateCoverDialogState();
    }
    ["number", "version", "date", "department", "confidentiality", "purpose", "scope", "related"].forEach((key) => (coverElements[key] || coverExtra[key])?.addEventListener("input", commitCoverExtras));
    coverExtra.approvalEnabled?.addEventListener("change", commitCoverExtras);
    coverExtra.approvalGrid?.addEventListener("input", (event) => { if (event.target?.dataset?.field) commitCoverExtras(); });
    coverExtra.revisionTable?.addEventListener("input", (event) => { if (event.target?.dataset?.field) commitCoverExtras(); });
    coverExtra.revisionTable?.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("button[data-remove]") : null;
        if (!button || !session || !coverDraft) return;
        event.preventDefault();
        const index = Number(button.dataset.remove);
        const current = readCoverForm(coverDraft);
        coverDraft = PG.normalizeCover({ ...current, revisions: current.revisions.filter((_item, position) => position !== index) });
        syncCoverExtras(coverDraft);
        updateCoverDialogState();
    });
    coverExtra.revisionAdd?.addEventListener("click", (event) => {
        event.preventDefault();
        if (!session || !coverDraft) return;
        const current = readCoverForm(coverDraft);
        if (current.revisions.length >= PG.COVER_REVISION_MAX) { setSaveState(`改訂履歴は ${PG.COVER_REVISION_MAX} 行までです`, "#b42318"); return; }
        // 空行は normalizeCover で落ちるため、版だけ仮の値を入れておきます（そのまま書き換えられます）
        const nextVersion = current.revisions.length ? "" : (current.version || "第1.0版");
        const revisions = [...current.revisions, { version: nextVersion || `第${current.revisions.length + 1}版`, date: "", note: current.revisions.length ? "" : "初版", author: "" }];
        coverDraft = PG.normalizeCover({ ...current, revisions });
        syncCoverExtras(coverDraft);
        renderRevisionTable(coverDraft, coverDraft.revisions.length - 1);
        updateCoverDialogState();
    });
    /** 「保存」：下書きをこのガイドの表紙として確定し、すぐにローカル保存します（Ctrl+Z で戻せます）。 */
    async function saveCoverDraft() {
        if (!session || !coverDraft) return;
        const next = readCoverForm(coverDraft);
        if (JSON.stringify(next) !== JSON.stringify(PG.normalizeCover(session.cover))) {
            pushHistory();
            session.cover = next;
        }
        syncCoverButton(session.cover);
        coverDraft = null;
        if (coverDialog?.open) coverDialog.close("save");
        window.clearTimeout(saveTimer);
        await saveNow();
        setSaveState("表紙を保存しました", "#1b5e20");
    }
    /** 「キャンセル」「×」「Esc」：下書きを捨てて閉じます（保存していない変更があれば確認）。 */
    function cancelCoverDraft() {
        if (coverDraftDirty() && !confirm("表紙に保存していない変更があります。\n変更を捨てて閉じますか？")) return false;
        coverDraft = null;
        if (coverDialog?.open) coverDialog.close("cancel");
        syncCoverFields();
        return true;
    }
    document.getElementById("coverSave")?.addEventListener("click", (event) => { event.preventDefault(); saveCoverDraft(); });
    document.getElementById("coverCancel")?.addEventListener("click", (event) => { event.preventDefault(); cancelCoverDraft(); });
    document.getElementById("coverClose")?.addEventListener("click", (event) => { event.preventDefault(); cancelCoverDraft(); });
    coverDialog?.addEventListener("cancel", (event) => { event.preventDefault(); cancelCoverDraft(); });   // Esc
    coverDialog?.querySelector("form")?.addEventListener("submit", (event) => event.preventDefault());   // Enter で閉じない
    coverDialog?.addEventListener("close", () => { if (coverDraft) { coverDraft = null; syncCoverFields(); } });
    /** 表紙ボタン（v0.6.45）：タイトル下に置き、表紙ONのときだけ表示。入力済みの項目を要約して見せます。 */
    function syncCoverButton(cover) {
        const button = document.getElementById("coverButton");
        if (!button) return;
        button.hidden = !appSettings.coverPage || !session;
        const extras = [cover?.approvalEnabled ? "承認欄" : "", cover?.revisions?.length ? `改訂履歴${cover.revisions.length}行` : "", ...PG.coverTextSections(cover).map(([label]) => label)];
        const summary = [cover?.number, cover?.version, cover?.date, cover?.department, cover?.confidentiality ? PG.coverConfidentialityLabel(cover.confidentiality) : "", ...extras].filter((value) => String(value || "").trim()).join(" ／ ");
        button.textContent = summary ? `表紙：${summary}` : "表紙の項目を入力…";
    }
    document.getElementById("coverButton")?.addEventListener("click", () => {
        if (!coverDialog || !session) return;
        coverDraft = PG.normalizeCover(session.cover);   // 下書きの開始
        renderCoverForm(coverDraft);
        updateCoverDialogState();
        if (!coverDialog.open) coverDialog.showModal();
        coverElements.number?.focus();
    });
    // 「配置：…」を押すと、いつでも選び直せます（v0.6.27）。
    // select は同じ「カスタマイズ…」を選び直しても change が起きないため、入口を別に用意しています。
    elements.layoutSummary?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (session) openLayoutDialog();
    });
    elements.pageOrientation?.addEventListener("change", () => {
        if (!session) return;
        if (elements.pageOrientation.value === "custom") {
            openLayoutDialog();
            return;
        }
        applyLayout(elements.pageOrientation.value === "landscape" ? PG.DEFAULT_LAYOUT_LANDSCAPE : PG.DEFAULT_LAYOUT_PORTRAIT);
    });
    // 用紙サイズ（v0.7.11）：ガイドごとに保存し、印刷・PDF／HTML／Word のページの大きさに使います。Ctrl+Z で戻せます
    elements.paperSize?.addEventListener("change", () => {
        if (!session) return;
        const next = PG.normalizePaperSize(elements.paperSize.value);
        if (next === paperSizeId()) return;
        pushHistory();
        session.paperSize = next;
        syncLayoutControls();
        scheduleSave();
        setSaveState(`用紙サイズを ${PG.paperMetrics(next, "portrait").label} にしました`, "#1b5e20");
    });
    /* ---- ツールバーの折りたたみ（v0.6.37）----
     * Excel・PowerPoint のリボンと同じ操作感です。
     *   ピン留め（既定）：詳細の行（色・太さ・形など）を常に表示
     *   たたむ：タブだけ表示。タブを押した間だけ詳細が出て、キャンバスを触ると閉じます
     * 操作：右端の▲ボタン／選択中のタブをもう一度クリック／タブをダブルクリックで固定。
     * 状態は詳細設定（toolbarPinned）に保存し、次に開いたときも同じ状態になります。 */
    let toolbarTemp = false;   // たたんでいるときに一時的に開いているか

    function toolbarDetailRow() {
        return document.querySelector(".tool-row-detail");
    }

    function syncToolbarPin() {
        const row = toolbarDetailRow();
        const pin = document.getElementById("toolbarPin");
        const pinned = appSettings.toolbarPinned !== false;
        if (row) row.hidden = !pinned && !toolbarTemp;
        if (pin) {
            pin.setAttribute("aria-pressed", String(pinned));
            pin.textContent = pinned ? "▲" : "▼";
        }
    }

    async function setToolbarPinned(pinned) {
        toolbarTemp = false;
        appSettings = { ...appSettings, toolbarPinned: Boolean(pinned) };
        syncToolbarPin();
        // 次に開いたときも同じ状態にするため、詳細設定として保存します。
        await message({ type: "PG_SAVE_SETTINGS", settings: appSettings });
    }

    document.querySelectorAll(".tool").forEach((button) => button.addEventListener("click", () => {
        const wasActive = button.dataset.tool === selectedTool && !document.querySelector(".tool-row-detail")?.hidden;
        setTool(button.dataset.tool);
        if (appSettings.toolbarPinned !== false) {
            // 開いたままのとき、選択中のタブをもう一度押すとたたみます。
            if (wasActive && button.dataset.tool === selectedTool) { setToolbarPinned(false); return; }
            return;
        }
        toolbarTemp = !(wasActive && button.dataset.tool === selectedTool);
        syncToolbarPin();
    }));
    document.querySelectorAll(".tool").forEach((button) => button.addEventListener("dblclick", () => {
        // ダブルクリックで「開いたまま」に固定（Excel と同じ）
        if (appSettings.toolbarPinned === false) setToolbarPinned(true);
    }));
    document.getElementById("toolbarPin")?.addEventListener("click", () => setToolbarPinned(appSettings.toolbarPinned === false));
    elements.targetStyleButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        targetStyleMode = !targetStyleMode;
        if (targetStyleMode) setSelection([]);
        syncStyleControls();
        toggleColorPopover(targetStyleMode);
    });
    elements.saveTargetDefault?.addEventListener("click", async () => {
        const style = currentStyle();
        const result = await message({ type: "PG_SAVE_SETTINGS", settings: { ...appSettings, targetColor: style.color, targetSize: style.size } });
        if (result?.settings) {
            appSettings = result.settings;
            setSaveState("操作手順番号の既定色を保存しました", "#1b5e20");
        }
    });
    elements.colorButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const reopen = colorTargetKey !== "color" && !elements.colorPopover?.hidden;
        colorTargetKey = "color";
        syncStyleControls();
        toggleColorPopover(reopen ? true : undefined);
    });
    elements.textBorderColorButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const reopen = colorTargetKey !== "borderColor" && !elements.colorPopover?.hidden;
        colorTargetKey = "borderColor";
        syncStyleControls();
        toggleColorPopover(reopen ? true : undefined);
    });
    elements.textBackgroundColorButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const reopen = colorTargetKey !== "backgroundColor" && !elements.colorPopover?.hidden;
        colorTargetKey = "backgroundColor";
        syncStyleControls();
        toggleColorPopover(reopen ? true : undefined);
    });
    elements.annotationColor?.addEventListener("input", () => setColor(elements.annotationColor.value));
    elements.annotationColor?.addEventListener("change", () => rememberColor(elements.annotationColor.value));
    elements.annotationSize?.addEventListener("change", () => updateToolStyle({ size: normalizeSize(elements.annotationSize.value) }));
    elements.annotationFont?.addEventListener("change", () => updateToolStyle({ font: PG.normalizeFont(elements.annotationFont.value) }));
    elements.highlightShape?.addEventListener("change", () => updateToolStyle({ shape: PG.normalizeHighlightShape(elements.highlightShape.value) }));
    elements.highlightDash?.addEventListener("change", () => updateToolStyle({ dash: PG.normalizeLineDash(elements.highlightDash.value) }));
    elements.arrowLine?.addEventListener("change", () => updateToolStyle({ arrowLine: PG.normalizeArrowLine(elements.arrowLine.value) }));
    elements.arrowStart?.addEventListener("change", () => updateToolStyle({ arrowStart: PG.normalizeArrowHead(elements.arrowStart.value, "none") }));
    elements.arrowEnd?.addEventListener("change", () => updateToolStyle({ arrowEnd: PG.normalizeArrowHead(elements.arrowEnd.value, "none") }));
    elements.arrowHeadSize?.addEventListener("change", () => updateToolStyle({ arrowHeadSize: PG.normalizeArrowHeadSize(elements.arrowHeadSize.value) }));
    elements.arrowConnect?.addEventListener("change", () => updateToolStyle({ arrowConnect: Boolean(elements.arrowConnect.checked) }));
    elements.fillOpacitySlider?.addEventListener("input", () => {
        if (elements.fillOpacity) elements.fillOpacity.value = elements.fillOpacitySlider.value;
        updateToolStyle({ fillOpacity: normalizeBackground(elements.fillOpacitySlider.value) });
    });
    elements.fillOpacity?.addEventListener("change", () => {
        const value = normalizeBackground(elements.fillOpacity.value);
        elements.fillOpacity.value = String(value);
        if (elements.fillOpacitySlider) elements.fillOpacitySlider.value = String(value);
        updateToolStyle({ fillOpacity: value });
    });
    elements.shapeTextSize?.addEventListener("change", () => updateToolStyle({ textSize: normalizeSize(elements.shapeTextSize.value) }));
    elements.shapeTextAlign?.addEventListener("change", () => updateToolStyle({ textAlign: PG.normalizeTextAlign(elements.shapeTextAlign.value) }));
    elements.shapeTextValign?.addEventListener("change", () => updateToolStyle({ textValign: PG.normalizeTextValign(elements.shapeTextValign.value) }));
    elements.fillColorButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const reopen = colorTargetKey !== "fillColor" && !elements.colorPopover?.hidden;
        colorTargetKey = "fillColor";
        syncStyleControls();
        toggleColorPopover(reopen ? true : undefined);
    });
    elements.shapeTextColorButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const reopen = colorTargetKey !== "textColor" && !elements.colorPopover?.hidden;
        colorTargetKey = "textColor";
        syncStyleControls();
        toggleColorPopover(reopen ? true : undefined);
    });
    Object.entries(ORDER_BUTTONS).forEach(([mode, id]) => {
        document.getElementById(id)?.addEventListener("click", () => reorderAnnotation(mode));
    });
    const GROUP_ACTIONS = { group: groupSelection, ungroup: ungroupSelection, regroup: regroupSelection };
    Object.entries(GROUP_BUTTONS).forEach(([mode, id]) => {
        document.getElementById(id)?.addEventListener("click", () => GROUP_ACTIONS[mode]());
    });
    /* ---- コピー／切り取り／貼り付け／複製／書式のコピー（v0.6.32）---- */
    let objectClipboard = null;   // { items, marker, markerWritten, sourceStepId, lastStepId, pasteCount }
    let formatClipboard = null;   // { type, style }
    const CLIP_MARKER_PREFIX = "tadoru:objects:";
    // 書式のコピーで運ぶ項目。形そのもの（shape・textMode）や位置は運びません。
    const FORMAT_KEYS = ["color", "size", "dash", "fillColor", "fillOpacity", "textColor", "textSize", "textAlign", "textValign",
        "font", "background", "backgroundColor", "borderWidth", "borderColor", "align", "valign", "vert",
        "arrowLine", "arrowStart", "arrowEnd", "arrowHeadSize", "opacity"];

    function copySelection(cut) {
        const step = currentStep();
        const items = selectionAnnotations();
        if (step && !items.length && frameSelected) { copyFrame(cut); return true; }   // 撮影画像（v0.7.24）
        if (!step || !items.length) return false;
        const marker = CLIP_MARKER_PREFIX + PG.createId("clip");
        objectClipboard = { items: items.map((item) => deepCopy(item)), marker, markerWritten: false, sourceStepId: step.id, lastStepId: step.id, pasteCount: 0 };
        // OS のクリップボードに合言葉を入れておき、貼り付け時に「図形のコピーが最新か」を見分けます。
        try {
            navigator.clipboard?.writeText(marker).then(() => { if (objectClipboard?.marker === marker) objectClipboard.markerWritten = true; }).catch(() => {});
        } catch (_error) { /* 書けなければ合言葉なしで判定します */ }
        if (cut) {
            pushHistory();
            const ids = items.map((item) => item.id);
            step.annotations = step.annotations.filter((item) => !ids.includes(item?.id));
            renumberMarkers();
            setSelection([]);
            scheduleSave();
            drawCanvas();
            updateHistoryButtons();
            syncStyleControls();
            setSaveState(`${items.length}個を切り取りました`, "#1b5e20");
        } else {
            setSaveState(`${items.length}個をコピーしました`, "#1b5e20");
        }
        return true;
    }

    /**
     * 撮影画像のコピー／切り取り（v0.7.24）。いま見えている範囲（枠とページの重なる部分）を PNG にして内部クリップボードへ入れます。
     * 切り取りは、撮影画像だけを同じ大きさの白い画像に置き換えて白紙にします（注釈は残る・Ctrl+Z で戻る）。
     */
    async function copyFrame(cut) {
        const step = currentStep();
        if (!step?.screenshot) return false;
        const image = await loadImage(step.screenshot);
        if (!image || currentStep() !== step) { setSaveState("画像を読み込めませんでした", "#b42318"); return false; }
        const pageW = image.naturalWidth || image.width;
        const pageH = image.naturalHeight || image.height;
        if (!pageW || !pageH) return false;
        const frame = stepFrame(step);
        // 枠とページの重なり（見えている範囲）。ページの外にはみ出した部分はコピーしません。
        const left = Math.max(0, frame.x) * pageW;
        const top = Math.max(0, frame.y) * pageH;
        const right = Math.min(1, frame.x + frame.width) * pageW;
        const bottom = Math.min(1, frame.y + frame.height) * pageH;
        const w = Math.round(right - left);
        const h = Math.round(bottom - top);
        if (w < 1 || h < 1) { setSaveState("撮影画像がページの外にあるためコピーできません", "#b42318"); return false; }
        const page = document.createElement("canvas");
        page.width = pageW;
        page.height = pageH;
        const pageContext = page.getContext("2d", { alpha: false });
        if (!pageContext) return false;
        pageContext.fillStyle = "#ffffff";
        pageContext.fillRect(0, 0, pageW, pageH);
        drawFramedImage(pageContext, image, frame);
        const clip = document.createElement("canvas");
        clip.width = w;
        clip.height = h;
        const clipContext = clip.getContext("2d", { alpha: false });
        if (!clipContext) return false;
        clipContext.drawImage(page, Math.round(left), Math.round(top), w, h, 0, 0, w, h);
        const marker = CLIP_MARKER_PREFIX + PG.createId("clip");
        objectClipboard = { items: [], frameImage: { src: clip.toDataURL("image/png"), width: w, height: h },
            marker, markerWritten: false, sourceStepId: step.id, lastStepId: step.id, pasteCount: 0 };
        try {
            navigator.clipboard?.writeText(marker).then(() => { if (objectClipboard?.marker === marker) objectClipboard.markerWritten = true; }).catch(() => {});
        } catch (_error) { /* 書けなければ合言葉なしで判定します */ }
        if (cut) {
            pushHistory();
            const blank = document.createElement("canvas");
            blank.width = pageW;
            blank.height = pageH;
            const blankContext = blank.getContext("2d", { alpha: false });
            if (!blankContext) return false;
            blankContext.fillStyle = "#ffffff";
            blankContext.fillRect(0, 0, pageW, pageH);
            step.screenshot = blank.toDataURL("image/png");
            step.frame = null;
            step.blankScreenshot = true;
            step.maskRects = [];
            step.maskApplied = true;
            step.maskBurnedIn = false;
            step.target = null;
            frameSelected = false;
            renderStepList();
            scheduleSave();
            drawCanvas();
            updateHistoryButtons();
            syncStyleControls();
            syncFrameResetButton();
            setSaveState("撮影画像を切り取りました（白紙・注釈は残っています）", "#1b5e20");
        } else {
            setSaveState("撮影画像をコピーしました", "#1b5e20");
        }
        return true;
    }

    /**
     * コピーした撮影画像を貼り付けます（v0.7.24）。撮影画像が無い手順・切り取って白紙にした手順ならその手順の撮影画像にし、
     * 撮影画像のある手順なら貼り付け画像オブジェクト（画像ツールの「インポート」と同じ大きさ）として追加します。
     */
    function pasteFrameImage(offset) {
        const step = currentStep();
        const source = objectClipboard?.frameImage;
        if (!step || !source?.src) return false;
        if (!step.screenshot || step.blankScreenshot) {
            const wasBlank = Boolean(step.screenshot) && step.blankScreenshot;
            if (wasBlank) {
                // 白紙の手順：注釈は残したまま撮影画像だけ戻します（applyStepScreenshot は注釈以外を初期化するので同じ手順で置き換え）。
                pushHistory();
                step.screenshot = source.src;
                step.captureError = "";
                step.maskRects = [];
                step.maskApplied = true;
                step.maskBurnedIn = false;
                step.target = null;
                step.frame = null;
                step.blankScreenshot = false;
                setSelection([]);
                renderStepList();
                drawCanvas();
                scheduleSave();
            } else if (!applyStepScreenshot(source.src)) {
                return false;
            }
            updateHistoryButtons();
            syncStyleControls();
            syncFrameResetButton();
            setSaveState("撮影画像を貼り付けました", "#1b5e20");
            return true;
        }
        const ratio = source.height / Math.max(1, source.width);
        const canvasRatio = elements.canvas.width / Math.max(1, elements.canvas.height);
        const width = .34;
        const shift = Number(offset) || 0;
        insertObject({
            id: PG.createId("annotation"), type: "image", src: source.src,
            x: PG.clamp(.5 - width / 2 + shift, 0, 1), y: PG.clamp(.12 + shift, 0, 1), width, height: width * ratio * canvasRatio
        });
        return true;
    }

    /** 複製して置きます。offset は右下へずらす量（正規化座標）。グループはグループのまま新しいIDに付け替えます。 */
    function pasteObjects(sourceItems, offset) {
        const step = currentStep();
        if (!step?.screenshot) { setSaveState("画像のある手順を選んでください", "#b42318"); return []; }
        pushHistory();
        const groupIds = new Map();
        const created = sourceItems.map((item) => {
            const copy = deepCopy(item);
            copy.id = PG.createId("annotation");
            if (copy.groupId) {
                if (!groupIds.has(copy.groupId)) groupIds.set(copy.groupId, PG.createId("group"));
                copy.groupId = groupIds.get(copy.groupId);
            }
            delete copy.fromMask;
            delete copy.fromTarget;
            copy.x = PG.clamp((Number(copy.x) || 0) + offset, -1, 1);
            copy.y = PG.clamp((Number(copy.y) || 0) + offset, -1, 1);
            if (Array.isArray(copy.points)) copy.points = copy.points.map((pt) => ({ x: PG.clamp(pt.x + offset, 0, 1), y: PG.clamp(pt.y + offset, 0, 1) }));
            return copy;
        });
        // 一緒に貼った図形へつないでいた矢印は、新しい図形につなぎ直します（v0.6.33）。
        const idMap = new Map(sourceItems.map((item, index) => [item.id, created[index].id]));
        created.forEach((item) => {
            ["startAnchor", "endAnchor"].forEach((key) => {
                if (item[key]?.id && idMap.has(item[key].id)) item[key] = { ...item[key], id: idMap.get(item[key].id) };
            });
        });
        step.annotations.push(...created);
        renumberMarkers();
        setTool("select");
        setSelection(created.map((item) => item.id));
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
        return created;
    }

    function pasteClipboard() {
        const step = currentStep();
        if (!objectClipboard || !step) return false;
        if (objectClipboard.lastStepId !== step.id) { objectClipboard.lastStepId = step.id; objectClipboard.pasteCount = 0; }
        objectClipboard.pasteCount += 1;
        // 同じ手順なら少しずつ右下へ、別の手順なら1回目は同じ位置に。
        const shift = step.id === objectClipboard.sourceStepId ? objectClipboard.pasteCount : objectClipboard.pasteCount - 1;
        if (objectClipboard.frameImage) return pasteFrameImage(0.02 * shift);   // 撮影画像（v0.7.24）
        pasteObjects(objectClipboard.items, 0.02 * shift);
        return true;
    }

    function duplicateSelection() {
        const items = selectionAnnotations();
        if (!items.length) return;
        pasteObjects(items.map((item) => deepCopy(item)), 0.02);
    }

    function copyFormat() {
        const source = selectedAnnotation();
        if (!source) return;
        const style = {};
        FORMAT_KEYS.forEach((key) => { if (source[key] !== undefined) style[key] = deepCopy(source[key]); });
        formatClipboard = { type: source.type, style };
        setSaveState(`${TOOL_LABELS[source.type] || "オブジェクト"}の書式をコピーしました。貼り付け先を選んで Ctrl+Shift+V`, "#1b5e20");
    }

    /** 書式を貼り付けます。同じ種類なら全部、違う種類なら色と太さだけ（文字の大きさは文字同士のときだけ）。 */
    function pasteFormat() {
        const targets = selectionAnnotations();
        if (!formatClipboard || !targets.length) return;
        pushHistory();
        targets.forEach((target) => {
            if (target.type === formatClipboard.type) { Object.assign(target, deepCopy(formatClipboard.style)); return; }
            if (formatClipboard.style.color && toolSupportsColor(target.type)) target.color = formatClipboard.style.color;
            const sizeLike = (type) => toolSupportsSize(type) && type !== "text";
            if (formatClipboard.style.size !== undefined && sizeLike(target.type) && sizeLike(formatClipboard.type)) target.size = formatClipboard.style.size;
        });
        targets.forEach((target) => { if (toolSupportsColor(target.type)) rememberColor(target.color); });
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
    }

    function syncClipboardMenu() {
        const hasSelection = selectionIds.length > 0;
        const canCopy = hasSelection || (frameSelected && Boolean(currentStep()?.screenshot));   // 撮影画像もコピー・切り取り可（v0.7.24）
        const states = { copy: canCopy, cut: canCopy, duplicate: hasSelection, copyFormat: hasSelection,
            paste: Boolean(objectClipboard), pasteFormat: Boolean(formatClipboard) && hasSelection };
        elements.canvasMenu?.querySelectorAll("button[data-menu]").forEach((button) => {
            if (button.dataset.menu in states) button.disabled = !states[button.dataset.menu];
        });
    }

    // キャンバスの右クリックメニュー（コピー・順序・グループ・削除）。
    elements.canvas?.addEventListener("contextmenu", (event) => {
        const menu = elements.canvasMenu;
        if (!menu || !currentStep()?.screenshot) return;
        event.preventDefault();
        const point = canvasPoint(event);
        if (point) {
            const hit = hitTest(point);
            if (hit) {
                setTool("select");
                setSelection([hit.annotation.id]);
                drawCanvas();
            }
        }
        syncStyleControls();
        syncClipboardMenu();
        menu.hidden = false;
        const width = menu.offsetWidth || 176;
        const height = menu.offsetHeight || 180;
        menu.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX))}px`;
        menu.style.top = `${Math.max(8, Math.min(window.innerHeight - height - 8, event.clientY))}px`;
    });
    elements.canvasMenu?.addEventListener("click", (event) => {
        const button = event.target?.closest?.("button");
        if (!button || button.disabled) return;
        if (button.dataset.order) reorderAnnotation(button.dataset.order);
        else if (button.dataset.group) GROUP_ACTIONS[button.dataset.group]?.();
        else if (button.dataset.menu === "delete") elements.deleteAnnotation?.click();
        else if (button.dataset.menu === "copy") copySelection(false);
        else if (button.dataset.menu === "cut") copySelection(true);
        else if (button.dataset.menu === "paste") pasteClipboard();
        else if (button.dataset.menu === "duplicate") duplicateSelection();
        else if (button.dataset.menu === "copyFormat") copyFormat();
        else if (button.dataset.menu === "pasteFormat") pasteFormat();
        closeCanvasMenu();
    });
    document.addEventListener("click", (event) => {
        if (elements.canvasMenu?.hidden) return;
        if (elements.canvasMenu?.contains(event.target)) return;
        closeCanvasMenu();
    });
    window.addEventListener("blur", closeCanvasMenu);
    elements.textKind?.addEventListener("change", () => updateToolStyle({ textMode: PG.normalizeTextKind(elements.textKind.value) }));
    elements.textAlign?.addEventListener("change", () => updateToolStyle({ align: PG.normalizeTextAlign(elements.textAlign.value) }));
    elements.textValign?.addEventListener("change", () => updateToolStyle({ valign: PG.normalizeTextValign(elements.textValign.value) }));
    elements.textDirection?.addEventListener("change", () => updateToolStyle({ vert: PG.normalizeTextDirection(elements.textDirection.value) }));
    elements.textBackground?.addEventListener("change", () => {
        const value = normalizeBackground(elements.textBackground.value);
        elements.textBackground.value = String(value);
        if (elements.textBackgroundSlider) elements.textBackgroundSlider.value = String(value);
        updateToolStyle({ background: value });
    });
    // スライダー：ドラッグ中は数値だけ追従させ、離した時に確定します。
    elements.textBackgroundSlider?.addEventListener("input", () => {
        if (elements.textBackground) elements.textBackground.value = elements.textBackgroundSlider.value;
    });
    elements.textBackgroundSlider?.addEventListener("change", () => {
        const value = normalizeBackground(elements.textBackgroundSlider.value);
        if (elements.textBackground) elements.textBackground.value = String(value);
        updateToolStyle({ background: value });
    });
    // カラー選択は input で即反映します（change はピッカーを閉じるまで発火しないため）。
    // 連続で動かしても履歴はキーで束ねられるので、元に戻すは1回でまとまります。
    elements.textBorderWidth?.addEventListener("change", () => updateToolStyle({ borderWidth: Math.max(0, Number(elements.textBorderWidth.value) || 0) }));
    elements.highlighterOpacity?.addEventListener("change", () => {
        const value = normalizeOpacity(elements.highlighterOpacity.value);
        elements.highlighterOpacity.value = String(value);
        if (elements.highlighterOpacitySlider) elements.highlighterOpacitySlider.value = String(value);
        updateToolStyle({ opacity: value });
    });
    elements.highlighterOpacitySlider?.addEventListener("input", () => {
        if (elements.highlighterOpacity) elements.highlighterOpacity.value = elements.highlighterOpacitySlider.value;
    });
    elements.highlighterOpacitySlider?.addEventListener("change", () => {
        const value = normalizeOpacity(elements.highlighterOpacitySlider.value);
        if (elements.highlighterOpacity) elements.highlighterOpacity.value = String(value);
        updateToolStyle({ opacity: value });
    });
    document.addEventListener("click", (event) => {
        if (!elements.colorPopover || elements.colorPopover.hidden) return;
        if (elements.colorPopover.contains(event.target) || elements.colorButton?.contains(event.target)
            || elements.textBorderColorButton?.contains(event.target) || elements.textBackgroundColorButton?.contains(event.target)
            || elements.targetStyleButton?.contains(event.target)) return;
        toggleColorPopover(false);
    });

    function selectedAnnotation() {
        return currentStep()?.annotations?.find((item) => item?.id === selectedAnnotationId) || null;
    }

    /* ---- 選択とグループ（v0.6.28）---------------------------------------
     * selectionIds が選択中のID一覧、selectedAnnotationId はその最後（主選択）です。
     * 既存の処理は主選択を見ているので、単一選択のときの動きは今までと同じです。 */
    function setSelection(ids) {
        const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
        selectionIds = list;
        selectedAnnotationId = list.length ? list[list.length - 1] : null;
        if (list.length) frameSelected = false;   // オブジェクトを選んだら撮影画像の選択は外れます（v0.7.24）
    }

    function selectionAnnotations() {
        const list = currentStep()?.annotations || [];
        return selectionIds.map((id) => list.find((item) => item?.id === id)).filter(Boolean);
    }

    function isMultiSelection() {
        return selectionAnnotations().length > 1;
    }

    /** 同じグループの仲間（グループでなければ自分だけ）を返します。 */
    function groupMembers(annotation) {
        if (!annotation) return [];
        const list = currentStep()?.annotations || [];
        if (!annotation.groupId) return [annotation];
        const members = list.filter((item) => item?.groupId === annotation.groupId);
        return members.length ? members : [annotation];
    }

    /** 選択中のものをまとめて囲む四角（正規化座標）。回転は外接矩形で近似します。 */
    function selectionBounds(items) {
        const list = items && items.length ? items : selectionAnnotations();
        if (!list.length) return null;
        let left = 1;
        let top = 1;
        let right = 0;
        let bottom = 0;
        list.forEach((annotation) => {
            const box = normalizedRect(annotation);
            const rotation = rotationOf(annotation);
            // 回転しているものは、回したあとの四隅で囲みます。
            [[box.left, box.top], [box.left + box.width, box.top],
                [box.left, box.top + box.height], [box.left + box.width, box.top + box.height]]
                .forEach(([cornerX, cornerY]) => {
                    const spun = spinPoint(annotation, cornerX, cornerY, rotation);
                    left = Math.min(left, spun.x);
                    top = Math.min(top, spun.y);
                    right = Math.max(right, spun.x);
                    bottom = Math.max(bottom, spun.y);
                });
        });
        return { left, top, width: Math.max(0.002, right - left), height: Math.max(0.002, bottom - top) };
    }

    /** まとめて選択しているときのハンドル（四隅＋回転）。 */
    function selectionHandlePoints() {
        const bounds = selectionBounds();
        if (!bounds) return [];
        const gap = 26 / Math.max(1, elements.canvas?.height || 1);
        return [
            { key: "nw", x: bounds.left, y: bounds.top },
            { key: "ne", x: bounds.left + bounds.width, y: bounds.top },
            { key: "sw", x: bounds.left, y: bounds.top + bounds.height },
            { key: "se", x: bounds.left + bounds.width, y: bounds.top + bounds.height },
            { key: "rotate", x: bounds.left + bounds.width / 2, y: bounds.top - gap }
        ];
    }

    function handleTolerance() {
        const width = Math.max(1, elements.canvas.width);
        const height = Math.max(1, elements.canvas.height);
        const size = Math.max(11, width * 0.011) * 0.9;
        return { x: size / width, y: size / height };
    }

    function hitTest(point) {
        const list = (currentStep()?.annotations || []).filter((annotation) => annotation?.type !== "draw");
        const visible = (annotation) => Boolean(annotation);
        const tolerance = handleTolerance();
        // まとめて選んでいるときは、外接矩形のハンドルを先に見ます（v0.6.28）。
        if (isMultiSelection()) {
            const grip = selectionHandlePoints().find((handle) =>
                Math.abs(point.x - handle.x) <= tolerance.x && Math.abs(point.y - handle.y) <= tolerance.y);
            if (grip) return { annotation: selectedAnnotation(), mode: grip.key === "rotate" ? "rotate" : "resize", handle: grip.key };
        }
        const selected = selectedAnnotation();
        if (selected && !isMultiSelection() && visible(selected)) {
            const hit = handlePoints(selected).find((handle) =>
                Math.abs(point.x - handle.x) <= tolerance.x && Math.abs(point.y - handle.y) <= tolerance.y);
            if (hit) return { annotation: selected, mode: hit.key === "rotate" ? "rotate" : "resize", handle: hit.key };
        }
        for (let index = list.length - 1; index >= 0; index -= 1) {
            const annotation = list[index];
            if (!annotation || !visible(annotation)) continue;
            const box = normalizedRect(annotation);
            const pad = annotation.type === "arrow" ? Math.max(tolerance.x, tolerance.y) : 0;
            const local = unspinPoint(annotation, point);
            if (local.x >= box.left - pad && local.x <= box.left + box.width + pad
                && local.y >= box.top - pad && local.y <= box.top + box.height + pad) {
                return { annotation, mode: "move" };
            }
            if (annotation.type === "arrow" && !rotationOf(annotation)) {
                // 経路が外接矩形の外に出る矢印（コの字・回り込み）は、線の近くでも選べるようにします。
                const canvasW = Math.max(1, elements.canvas.width);
                const canvasH = Math.max(1, elements.canvas.height);
                const pts = arrowRoutePx(annotation, canvasW, canvasH).points;
                const px = point.x * canvasW;
                const py = point.y * canvasH;
                const threshold = Math.max(10, tolerance.x * canvasW);
                for (let i = 0; i < pts.length - 1; i += 1) {
                    const [ax, ay] = pts[i];
                    const [bx, by] = pts[i + 1];
                    const ddx = bx - ax, ddy = by - ay;
                    const lengthSq = ddx * ddx + ddy * ddy;
                    const t = lengthSq ? Math.max(0, Math.min(1, ((px - ax) * ddx + (py - ay) * ddy) / lengthSq)) : 0;
                    if (Math.hypot(px - (ax + t * ddx), py - (ay + t * ddy)) <= threshold) return { annotation, mode: "move" };
                }
            }
        }
        return null;
    }

    /** まとめて選んだものを、1つの図形のように動かす・広げる・回すための処理（v0.6.28）。 */
    function applyGroupDrag(origin, mode, dx, dy, point, snap, canvasW, canvasH) {
        const step = currentStep();
        const bounds = origin.bounds;
        if (!step || !bounds) return;
        const byId = new Map((step.annotations || []).map((item) => [item.id, item]));
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;

        if (mode === "move") {
            origin.items.forEach((snapshot) => {
                const live = byId.get(snapshot.id);
                if (!live) return;
                live.x = PG.clamp(snapshot.x + dx, -1, 1);
                live.y = PG.clamp(snapshot.y + dy, -1, 1);
                if (Array.isArray(snapshot.points)) {
                    live.points = snapshot.points.map((pt) => ({ x: PG.clamp(pt.x + dx, 0, 1), y: PG.clamp(pt.y + dy, 0, 1) }));
                }
            });
            return;
        }

        if (mode === "rotate") {
            const degrees = Math.atan2((point.y - centerY) * canvasH, (point.x - centerX) * canvasW) * 180 / Math.PI + 90;
            // 掴んだ瞬間の向きを基準にします（最初の1回分も無駄にしないため）。
            const start = Math.atan2((origin.point.y - centerY) * canvasH, (origin.point.x - centerX) * canvasW) * 180 / Math.PI + 90;
            const delta = snap ? Math.round((degrees - start) / 15) * 15 : degrees - start;
            const rad = delta * Math.PI / 180;
            origin.items.forEach((snapshot) => {
                const live = byId.get(snapshot.id);
                if (!live) return;
                // 中心のまわりに位置を回し、向きも同じだけ足します。
                const box = normalizedRect(snapshot);
                const itemCenterX = box.left + box.width / 2;
                const itemCenterY = box.top + box.height / 2;
                const ox = (itemCenterX - centerX) * canvasW;
                const oy = (itemCenterY - centerY) * canvasH;
                const rx = ox * Math.cos(rad) - oy * Math.sin(rad);
                const ry = ox * Math.sin(rad) + oy * Math.cos(rad);
                const movedX = centerX + rx / canvasW - itemCenterX;
                const movedY = centerY + ry / canvasH - itemCenterY;
                live.x = PG.clamp(snapshot.x + movedX, -1, 1);
                live.y = PG.clamp(snapshot.y + movedY, -1, 1);
                if (canRotate(live)) live.rotation = PG.normalizeRotation((Number(snapshot.rotation) || 0) + delta);
                if (Array.isArray(snapshot.points)) {
                    live.points = snapshot.points.map((pt) => ({ x: PG.clamp(pt.x + movedX, 0, 1), y: PG.clamp(pt.y + movedY, 0, 1) }));
                }
            });
            return;
        }

        // サイズ変更：外接矩形の変化と同じ比率で、中の位置と大きさを合わせます。
        const min = 0.01;
        const west = origin.handle === "nw" || origin.handle === "sw";
        const north = origin.handle === "nw" || origin.handle === "ne";
        let left = bounds.left;
        let top = bounds.top;
        let width = bounds.width;
        let height = bounds.height;
        if (west) {
            const nextLeft = Math.min(bounds.left + dx, bounds.left + bounds.width - min);
            width = bounds.width - (nextLeft - bounds.left);
            left = nextLeft;
        } else {
            width = Math.max(min, bounds.width + dx);
        }
        if (north) {
            const nextTop = Math.min(bounds.top + dy, bounds.top + bounds.height - min);
            height = bounds.height - (nextTop - bounds.top);
            top = nextTop;
        } else {
            height = Math.max(min, bounds.height + dy);
        }
        const scaleX = width / bounds.width;
        const scaleY = height / bounds.height;
        origin.items.forEach((snapshot) => {
            const live = byId.get(snapshot.id);
            if (!live) return;
            live.x = PG.clamp(left + (snapshot.x - bounds.left) * scaleX, -1, 1);
            live.y = PG.clamp(top + (snapshot.y - bounds.top) * scaleY, -1, 1);
            if (typeof snapshot.width === "number") live.width = PG.clamp(snapshot.width * scaleX, -1, 1);
            if (typeof snapshot.height === "number") live.height = PG.clamp(snapshot.height * scaleY, -1, 1);
            if (Array.isArray(snapshot.points)) {
                live.points = snapshot.points.map((pt) => ({
                    x: PG.clamp(left + (pt.x - bounds.left) * scaleX, 0, 1),
                    y: PG.clamp(top + (pt.y - bounds.top) * scaleY, 0, 1)
                }));
            }
        });
    }

    function applyResize(target, origin, handle, dx, dy) {
        const min = 0.006;
        if (target.type === "arrow") {
            if (handle === "start") {
                target.x = PG.clamp(origin.x + dx, 0, 1);
                target.y = PG.clamp(origin.y + dy, 0, 1);
                target.width = PG.clamp(origin.x + origin.width - target.x, -1, 1);
                target.height = PG.clamp(origin.y + origin.height - target.y, -1, 1);
            } else {
                target.width = PG.clamp(origin.width + dx, -1, 1);
                target.height = PG.clamp(origin.height + dy, -1, 1);
            }
            return;
        }
        const west = handle === "nw" || handle === "sw";
        const north = handle === "nw" || handle === "ne";
        let x = origin.x;
        let y = origin.y;
        let width = origin.width;
        let height = origin.height;
        if (west) {
            const nextX = Math.min(origin.x + dx, origin.x + origin.width - min);
            width = origin.width - (nextX - origin.x);
            x = nextX;
        } else {
            width = Math.max(min, origin.width + dx);
        }
        if (north) {
            const nextY = Math.min(origin.y + dy, origin.y + origin.height - min);
            height = origin.height - (nextY - origin.y);
            y = nextY;
        } else {
            height = Math.max(min, origin.height + dy);
        }
        target.x = PG.clamp(x, -1, 1);
        target.y = PG.clamp(y, -1, 1);
        target.width = PG.clamp(width, min, 1);
        target.height = PG.clamp(height, min, 1);
    }

    function normalizeAnnotationRect(annotation) {
        if (!annotation || annotation.type === "arrow") return;
        if (annotation.width < 0) { annotation.x += annotation.width; annotation.width = -annotation.width; }
        if (annotation.height < 0) { annotation.y += annotation.height; annotation.height = -annotation.height; }
    }

    /* ---- オブジェクトの順序（v0.6.26）---------------------------------------
     * 手順のスクリーンショットは注釈ではなく下地なので、常に一番下のままです。
     * 並べ替えの対象は、その上に置いた注釈（図形・文字・画像・ぼかしなど）だけです。 */

    /** 選択中のものが、いま何個の「選択外」より後ろにいるかを返します。 */
    function orderPosition() {
        const list = currentStep()?.annotations || [];
        const ids = new Set(selectionIds);
        const firstIndex = list.findIndex((item) => ids.has(item?.id));
        if (firstIndex < 0) return null;
        const outside = list.filter((item) => !ids.has(item?.id));
        const before = list.slice(0, firstIndex).filter((item) => !ids.has(item?.id)).length;
        return { before, outside: outside.length };
    }

    function setOrderButtonState(position) {
        const atTop = !position || position.before >= position.outside;
        const atBottom = !position || position.before <= 0;
        const disable = (id, off) => { const button = document.getElementById(id); if (button) button.disabled = off; };
        disable(ORDER_BUTTONS.front, atTop);
        disable(ORDER_BUTTONS.forward, atTop);
        disable(ORDER_BUTTONS.back, atBottom);
        disable(ORDER_BUTTONS.backward, atBottom);
        if (!elements.canvasMenu) return;
        elements.canvasMenu.querySelectorAll("button[data-order]").forEach((button) => {
            const mode = button.dataset.order;
            button.disabled = (mode === "front" || mode === "forward") ? atTop : atBottom;
        });
    }

    function reorderAnnotation(mode) {
        const step = currentStep();
        const position = orderPosition();
        if (!step || !position) return;
        const ids = new Set(selectionIds);
        const chosen = step.annotations.filter((item) => ids.has(item?.id));
        const rest = step.annotations.filter((item) => !ids.has(item?.id));
        const next = mode === "front" ? rest.length
            : mode === "back" ? 0
            : mode === "forward" ? Math.min(rest.length, position.before + 1)
            : Math.max(0, position.before - 1);
        if (next === position.before) return;
        pushHistory();
        rest.splice(next, 0, ...chosen);
        step.annotations = rest;
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
    }

    /* ---- グループ化・解除・再グループ化（v0.6.28）---- */
    function applyGroupId(items, groupId) {
        items.forEach((item) => {
            if (groupId) item.groupId = groupId;
            else delete item.groupId;
        });
    }

    function canGroup() {
        const items = selectionAnnotations();
        if (items.length < 2) return false;
        // すでに全員が同じグループなら、グループ化する意味がありません。
        const first = items[0].groupId;
        return !(first && items.every((item) => item.groupId === first));
    }

    function canUngroup() {
        return selectionAnnotations().some((item) => item.groupId);
    }

    function canRegroup() {
        const list = currentStep()?.annotations || [];
        const alive = lastUngroupedIds.filter((id) => list.some((item) => item?.id === id));
        return alive.length > 1;
    }

    function groupSelection() {
        if (!canGroup()) return;
        const items = selectionAnnotations();
        pushHistory();
        applyGroupId(items, PG.createId("group"));
        setSelection(items.map((item) => item.id));
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
        setSaveState("グループ化しました", "#1b5e20");
    }

    function ungroupSelection() {
        if (!canUngroup()) return;
        const items = selectionAnnotations().filter((item) => item.groupId);
        pushHistory();
        lastUngroupedIds = items.map((item) => item.id);
        applyGroupId(items, null);
        setSelection(lastUngroupedIds);
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
        setSaveState("グループを解除しました", "#1b5e20");
    }

    function regroupSelection() {
        if (!canRegroup()) return;
        const list = currentStep()?.annotations || [];
        const items = lastUngroupedIds.map((id) => list.find((item) => item?.id === id)).filter(Boolean);
        pushHistory();
        applyGroupId(items, PG.createId("group"));
        setSelection(items.map((item) => item.id));
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
        setSaveState("再グループ化しました", "#1b5e20");
    }

    function syncGroupButtons() {
        const states = { group: canGroup(), ungroup: canUngroup(), regroup: canRegroup() };
        Object.entries(GROUP_BUTTONS).forEach(([mode, id]) => {
            const button = document.getElementById(id);
            if (button) button.disabled = !states[mode];
        });
        // 押せないときは、どうすれば押せるかをツールチップで案内します。
        const groupButton = document.getElementById(GROUP_BUTTONS.group);
        if (groupButton) {
            groupButton.title = states.group
                ? "選んだオブジェクトをグループ化（Ctrl+G）"
                : "Shift+クリックか、何もない所からドラッグで囲んで2つ以上選ぶとグループ化できます（Ctrl+G）";
        }
        elements.canvasMenu?.querySelectorAll("button[data-group]").forEach((button) => {
            button.disabled = !states[button.dataset.group];
        });
    }

    function closeCanvasMenu() {
        if (elements.canvasMenu) elements.canvasMenu.hidden = true;
    }

    function commitAnnotation(step, annotation) {
        pushHistory();
        normalizeAnnotationRect(annotation);
        step.annotations.push(annotation);
        renumberMarkers();
        if (toolSupportsColor(annotation.type)) rememberColor(annotation.color);
        setSelection([annotation.id]);
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
    }

    function editorGeometry(annotation) {
        const canvasRect = elements.canvas.getBoundingClientRect();
        const stageRect = elements.canvasStage.getBoundingClientRect();
        const scaleX = canvasRect.width / Math.max(1, elements.canvas.width);
        const scaleY = canvasRect.height / Math.max(1, elements.canvas.height);
        const box = rectOf(annotation, elements.canvas.width, elements.canvas.height);
        // 図形の中の文字は、線の太さではなく文字の大きさを使います（v0.6.26）。
        const basePt = annotation.type === "highlight" ? (annotation.textSize ?? 12) : annotation.size;
        const fontPx = Math.max(8, normalizeSize(basePt) * (96 / 72) * (Math.max(1, elements.canvas.width) / 1200));
        return {
            left: canvasRect.left - stageRect.left + elements.canvasStage.scrollLeft + box.left * scaleX,
            top: canvasRect.top - stageRect.top + elements.canvasStage.scrollTop + box.top * scaleY,
            width: Math.max(60, box.width * scaleX),
            height: Math.max(fontPx * scaleY * 1.6, box.height * scaleY),
            fontPx: Math.max(9, fontPx * scaleY)
        };
    }

    function openTextEditor(annotation, isNew) {
        const editor = elements.textEditor;
        if (!editor || !annotation) return;
        editingAnnotationId = annotation.id;
        editingIsNew = Boolean(isNew);
        const geometry = editorGeometry(annotation);
        const alpha = normalizeBackground(annotation.background ?? 90) / 100;
        editor.style.left = `${geometry.left}px`;
        editor.style.top = `${geometry.top}px`;
        editor.style.width = `${geometry.width}px`;
        editor.style.height = `${geometry.height}px`;
        editor.style.fontSize = `${geometry.fontPx}px`;
        editor.style.fontFamily = PG.fontStack(annotation.font ?? documentFont());
        editor.style.fontWeight = "600";
        const isShape = annotation.type === "highlight";
        editor.style.color = isShape ? PG.normalizeHexColor(annotation.textColor, "#111111") : normalizeColor(annotation.color);
        editor.style.background = isShape ? "rgba(255,255,255,.92)" : `rgba(255,255,255,${Math.max(.35, alpha)})`;
        // テキストボックスと図形の中の文字は、編集中も左右の配置を反映します（縦書きの編集は横書き表示）。
        editor.style.textAlign = isShape ? PG.normalizeTextAlign(annotation.textAlign ?? "center")
            : PG.normalizeTextKind(annotation.textMode) === "box" ? PG.normalizeTextAlign(annotation.align) : "left";
        editor.value = String(annotation.text || "");
        editor.hidden = false;
        drawCanvas();
        editor.focus();
        editor.select();
    }

    function closeTextEditor(commit) {
        const editor = elements.textEditor;
        if (!editor || editor.hidden || !editingAnnotationId) return;
        const step = currentStep();
        const annotation = step?.annotations?.find((item) => item?.id === editingAnnotationId);
        const value = String(editor.value || "").slice(0, 600);
        const wasNew = editingIsNew;
        editor.hidden = true;
        editingAnnotationId = null;
        editingIsNew = false;
        if (!step || !annotation) { drawCanvas(); return; }
        if (commit === false) {
            if (wasNew) step.annotations = step.annotations.filter((item) => item?.id !== annotation.id);
            setSelection(wasNew ? [] : [annotation.id]);
            drawCanvas();
            syncStyleControls();
            return;
        }
        if (!value.trim() && annotation.type !== "text") {
            // 図形は文字を空にするだけで、図形自体は残します（v0.6.26）。
            if (annotation.text) { pushHistory(); annotation.text = ""; }
            setSelection([annotation.id]);
        } else if (!value.trim()) {
            if (!wasNew) pushHistory();
            step.annotations = step.annotations.filter((item) => item?.id !== annotation.id);
            setSelection([]);
        } else if (annotation.text !== value) {
            if (!wasNew) pushHistory();
            annotation.text = value;
        }
        fitPlainVerticalBox(annotation);
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
    }

    /* ---- 部分拡大図（v0.6.43）：囲んだ範囲を2倍に拡大した図を、赤枠と「拡大」の見出し付きで同じ手順に添えます ---- */
    async function createZoomFigure(step, rect) {
        if (!step?.screenshot || !rect || rect.width <= 0 || rect.height <= 0) { drawCanvas(); return; }
        // 拡大元は「いま見えている画像」（自動マスクの黒塗りも含む。番号だけ除く）。マスク前の画像は使いません。
        const base = await buildStepCanvas(step, false, false, ["marker"]);
        if (!base) { drawCanvas(); return; }
        const sx = Math.round(rect.left * base.width);
        const sy = Math.round(rect.top * base.height);
        const sw = Math.max(1, Math.round(rect.width * base.width));
        const sh = Math.max(1, Math.round(rect.height * base.height));
        const scale = 2;
        const zoomCanvas = document.createElement("canvas");
        zoomCanvas.width = sw * scale;
        zoomCanvas.height = sh * scale;
        const zc = zoomCanvas.getContext("2d");
        if (!zc) { drawCanvas(); return; }
        zc.imageSmoothingEnabled = true;
        zc.imageSmoothingQuality = "high";
        zc.drawImage(base, sx, sy, sw, sh, 0, 0, zoomCanvas.width, zoomCanvas.height);
        const src = zoomCanvas.toDataURL("image/png");

        // 置き場所：右側に入るなら右、入らなければ左、それも無理なら下。大きさは元の2倍（ページの 60% まで）。
        let zw = Math.min(rect.width * scale, .6);
        let zh = zw * (rect.height / rect.width);
        if (zh > .6) { zh = .6; zw = zh * (rect.width / rect.height); }
        const gap = .02;
        let zx;
        let zy = PG.clamp(rect.top, 0, 1 - zh);
        if (rect.left + rect.width + gap + zw <= 1) zx = rect.left + rect.width + gap;
        else if (rect.left - gap - zw >= 0) zx = rect.left - gap - zw;
        else { zx = PG.clamp(rect.left, 0, 1 - zw); zy = PG.clamp(rect.top + rect.height + gap, 0, 1 - zh); }

        pushHistory();
        const groupId = PG.createId("group");
        const red = "#d92d20";
        const sourceFrame = { id: PG.createId("annotation"), type: "highlight", shape: "rect", dash: "solid", color: red, size: 2, fillColor: "#ffffff", fillOpacity: 0, x: rect.left, y: rect.top, width: rect.width, height: rect.height, zoomSource: true };
        const image = { id: PG.createId("annotation"), type: "image", src, x: zx, y: zy, width: zw, height: zh, groupId };
        const frame = { id: PG.createId("annotation"), type: "highlight", shape: "rect", dash: "solid", color: red, size: 2, fillColor: "#ffffff", fillOpacity: 0, x: zx, y: zy, width: zw, height: zh, groupId };
        const labelH = .035;
        const label = {
            id: PG.createId("annotation"), type: "text", text: "拡大", color: red, size: 10, font: documentFont(),
            background: 100, backgroundColor: "#ffffff", borderWidth: 1, borderColor: red,
            x: zx, y: Math.max(0, zy - labelH), width: .08, height: labelH, groupId
        };
        step.annotations = [...(step.annotations || []), sourceFrame, image, frame, label];
        setTool("select");
        setSelection([image.id, frame.id, label.id]);
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
        setSaveState("拡大図を追加しました。ドラッグで位置を調整できます", "#1b5e20");
    }

    /* ---- スポイト（v0.6.43）：Chrome の EyeDropper API で画面上の色を拾います ---- */
    document.getElementById("eyedropperButton")?.addEventListener("click", async () => {
        if (typeof window.EyeDropper !== "function") { setSaveState("このブラウザはスポイトに対応していません", "#b42318"); return; }
        try {
            const result = await new window.EyeDropper().open();
            const color = PG.normalizeHexColor(result?.sRGBHex, "");
            if (!color) return;
            const target = styleTarget();
            if (target.kind === "none") { setSaveState("色を付けるオブジェクトかツールを先に選んでください", "#8a8a8a"); return; }
            updateToolStyle({ color });
            setSaveState(`色 ${color} を取り込みました`, "#1b5e20");
        } catch (_error) { /* Esc で取りやめ */ }
    });

    function insertObject(annotation) {
        const step = currentStep();
        if (!step?.screenshot) {
            setSaveState("画像のある手順を選んでください", "#b42318");
            return;
        }
        commitAnnotation(step, annotation);
        setTool("select");
    }

    function applyStepScreenshot(src) {
        const step = currentStep();
        if (!step) return false;
        pushHistory();
        step.screenshot = src;
        step.captureError = "";
        step.maskRects = [];
        step.maskApplied = true;
        step.maskBurnedIn = false;
        step.target = null;
        step.frame = null;
        step.blankScreenshot = false;
        setSelection([]);
        renderStepList();
        drawCanvas();
        scheduleSave();
        return true;
    }

    function readImageFile(file) {
        if (!file || !/^image\//.test(file.type || "")) return;
        const reader = new FileReader();
        reader.onload = () => {
            const src = String(reader.result || "");
            if (!src.startsWith("data:image/")) return;
            if (!currentStep()?.screenshot || currentStep()?.blankScreenshot) { applyStepScreenshot(src); return; }
            const probe = new Image();
            probe.onload = () => {
                const ratio = probe.naturalHeight / Math.max(1, probe.naturalWidth);
                const canvasRatio = elements.canvas.width / Math.max(1, elements.canvas.height);
                const width = .34;
                insertObject({
                    id: PG.createId("annotation"), type: "image", src,
                    x: .5 - width / 2, y: .12, width, height: width * ratio * canvasRatio
                });
            };
            probe.onerror = () => setSaveState("画像を読み込めませんでした", "#b42318");
            probe.src = src;
        };
        reader.readAsDataURL(file);
    }

    /* ---- 「画像」ツール：撮影画像の移動・拡大縮小と、トリミング（v0.6.29） ---- */
    let frameDrag = null;
    /** 撮影画像のドラッグ（移動／サイズ変更）を始めます。「画像」ツールと選択ツールで共通です。 */
    function beginFrameDrag(step, raw, handle, event) {
        if (!step?.screenshot || !raw) return;
        frameDrag = {
            mode: handle ? "resize" : "move", handle: handle?.key || "", point: raw, frame: stepFrame(step), pushed: false,
            items: (step.annotations || []).map((item) => deepCopy(item))
        };
        elements.canvas.setPointerCapture(event.pointerId);
    }

    /** クランプしない座標。撮影画像はキャンバスの外へも動かせるので、こちらを使います。 */
    function canvasPointRaw(event) {
        const rect = elements.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    }

    /** 四角の8方向ハンドル（四隅＋各辺の中央）。 */
    function rectHandlePoints(rect) {
        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        return [
            { key: "nw", x: rect.x, y: rect.y }, { key: "n", x: cx, y: rect.y },
            { key: "ne", x: rect.x + rect.width, y: rect.y }, { key: "e", x: rect.x + rect.width, y: cy },
            { key: "se", x: rect.x + rect.width, y: rect.y + rect.height }, { key: "s", x: cx, y: rect.y + rect.height },
            { key: "sw", x: rect.x, y: rect.y + rect.height }, { key: "w", x: rect.x, y: cy }
        ];
    }

    function hitRectHandle(rect, point) {
        const tolerance = handleTolerance();
        return rectHandlePoints(rect).find((handle) =>
            Math.abs(point.x - handle.x) <= tolerance.x * 1.3 && Math.abs(point.y - handle.y) <= tolerance.y * 1.3) || null;
    }

    function pointInRect(rect, point) {
        return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
    }

    /** 8方向ハンドルで四角を変形します。keepAspect のとき四隅は縦横比（ピクセル基準）を保ちます。 */
    function resizeRect(origin, handle, dx, dy, keepAspect) {
        const min = 0.02;
        const west = handle.includes("w");
        const east = handle.includes("e");
        const north = handle.includes("n");
        const south = handle.includes("s");
        let x = origin.x;
        let y = origin.y;
        let width = origin.width;
        let height = origin.height;
        if (west) { const nextX = Math.min(origin.x + dx, origin.x + origin.width - min); width = origin.width - (nextX - origin.x); x = nextX; }
        if (east) width = Math.max(min, origin.width + dx);
        if (north) { const nextY = Math.min(origin.y + dy, origin.y + origin.height - min); height = origin.height - (nextY - origin.y); y = nextY; }
        if (south) height = Math.max(min, origin.height + dy);
        if (keepAspect && (west || east) && (north || south)) {
            const scale = Math.max(width / origin.width, height / origin.height);
            width = origin.width * scale;
            height = origin.height * scale;
            if (west) x = origin.x + origin.width - width;
            if (north) y = origin.y + origin.height - height;
        }
        return { x, y, width, height };
    }

    /** 四角 from の中身が四角 to に移ったものとして、注釈を同じ写像で動かします。
     *  撮影画像を動かす・広げる・トリミングで拡大すると、載せた番号や図形も一緒に付いてきます。 */
    function remapAnnotations(step, from, to, snapshots) {
        if (!step || !from || !to || !from.width || !from.height) return;
        const scaleX = to.width / from.width;
        const scaleY = to.height / from.height;
        const mapX = (value) => to.x + (value - from.x) * scaleX;
        const mapY = (value) => to.y + (value - from.y) * scaleY;
        const byId = new Map((step.annotations || []).map((item) => [item?.id, item]));
        (snapshots || []).forEach((snapshot) => {
            const live = byId.get(snapshot?.id);
            if (!live) return;
            live.x = PG.clamp(mapX(snapshot.x), -1, 1);
            live.y = PG.clamp(mapY(snapshot.y), -1, 1);
            if (typeof snapshot.width === "number") live.width = PG.clamp(snapshot.width * scaleX, -1, 1);
            if (typeof snapshot.height === "number") live.height = PG.clamp(snapshot.height * scaleY, -1, 1);
            if (Array.isArray(snapshot.points)) {
                live.points = snapshot.points.map((pt) => ({ x: PG.clamp(mapX(pt.x), 0, 1), y: PG.clamp(mapY(pt.y), 0, 1) }));
            }
        });
    }

    /** 「画像」ツール用の当たり判定。貼り付け画像（type image）だけを見ます。選択中の画像はハンドルを先に見ます。 */
    function hitImageAnnotation(point) {
        const list = (currentStep()?.annotations || []).filter((annotation) => annotation?.type === "image");
        if (!list.length) return null;
        const tolerance = handleTolerance();
        const selected = selectedAnnotation();
        if (selected?.type === "image" && !cropState) {
            const grip = handlePoints(selected).find((handle) =>
                Math.abs(point.x - handle.x) <= tolerance.x && Math.abs(point.y - handle.y) <= tolerance.y);
            if (grip) return { annotation: selected, mode: grip.key === "rotate" ? "rotate" : "resize", handle: grip.key };
        }
        for (let index = list.length - 1; index >= 0; index -= 1) {
            const annotation = list[index];
            const box = normalizedRect(annotation);
            const local = unspinPoint(annotation, point);
            if (local.x >= box.left && local.x <= box.left + box.width && local.y >= box.top && local.y <= box.top + box.height) {
                return { annotation, mode: "move" };
            }
        }
        return null;
    }

    function frameRect(frame) {
        return { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
    }

    /** 撮影画像をページいっぱい・トリミングなしの元の状態に戻します。注釈も一緒に戻します。 */
    /** その手順の撮影画像を、撮影した最初の状態（ページいっぱい・トリミングなし）に戻します。 */
    function restoreStepFrame(step) {
        if (!step?.screenshot) return false;
        const frame = stepFrame(step);
        if (isDefaultFrame(frame)) return false;
        // いま見えている範囲（枠）は、元画像では crop の位置にあたります。
        const items = (step.annotations || []).map((item) => deepCopy(item));
        step.frame = null;
        remapAnnotations(step, frameRect(frame), frame.crop, items);
        return true;
    }

    /** 撮影画像の位置・大きさ・トリミングが変わっている手順（v0.6.36 追補）。 */
    function framedSteps() {
        return (session?.steps || []).filter((step) => step?.screenshot && !isDefaultFrame(stepFrame(step)));
    }

    function resetImageFrame() {
        const step = currentStep();
        if (!step?.screenshot || isDefaultFrame(stepFrame(step))) return;
        pushHistory();
        restoreStepFrame(step);
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
        syncFrameResetButton();
    }

    /** すべての手順の撮影画像を最初の状態に戻します（Ctrl+Z で戻せます）。 */
    async function resetAllImageFrames() {
        const targets = framedSteps();
        if (!targets.length) return;
        pushHistory();
        targets.forEach((step) => restoreStepFrame(step));
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
        syncFrameResetButton();
        // 保存の状態表示に上書きされないよう、保存が終わってから知らせます。
        await saveNow();
        setSaveState(`${targets.length}件の画像サイズを最初に戻しました`, "#b42318");
    }

    /**
     * 上部の赤い「画像サイズリセット」（v0.6.36 追補）。
     * どこかの手順で撮影画像の位置・大きさ・トリミングが変わっているときだけ出します。
     */
    function syncFrameResetButton() {
        if (!elements.frameResetWrap) return;
        const targets = framedSteps();
        elements.frameResetWrap.hidden = targets.length === 0;
        if (!targets.length) { closeFrameResetMenu(); return; }
        const step = currentStep();
        const currentChanged = Boolean(step?.screenshot) && !isDefaultFrame(stepFrame(step));
        elements.frameResetButton.textContent = targets.length > 1 ? `画像サイズリセット（${targets.length}件）` : "画像サイズリセット";
        const stepItem = elements.frameResetMenu?.querySelector('[data-scope="step"]');
        const allItem = elements.frameResetMenu?.querySelector('[data-scope="all"]');
        if (stepItem) stepItem.disabled = !currentChanged;
        if (allItem) allItem.textContent = `すべて（${targets.length}件）`;
    }

    function closeFrameResetMenu() {
        if (elements.frameResetMenu) elements.frameResetMenu.hidden = true;
    }

    /** 「画像」ツールで撮影画像の枠を描きます（破線＋8つのハンドル）。 */
    function drawFrameSelection(context, frame, withHandles) {
        const width = context.canvas.width;
        const height = context.canvas.height;
        const stroke = Math.max(2, width / 700);
        const left = frame.x * width;
        const top = frame.y * height;
        const boxW = frame.width * width;
        const boxH = frame.height * height;
        context.save();
        context.setLineDash([]);
        context.strokeStyle = "rgba(255,255,255,.95)";
        context.lineWidth = stroke * 2.2;
        context.strokeRect(left, top, boxW, boxH);
        context.strokeStyle = "#1b5e20";
        context.lineWidth = stroke;
        context.setLineDash([stroke * 3, stroke * 2.2]);
        context.strokeRect(left, top, boxW, boxH);
        context.setLineDash([]);
        if (!withHandles) { context.restore(); return; }
        const size = handleSizePx(context);
        context.lineWidth = Math.max(1.5, stroke * .8);
        rectHandlePoints(frameRect(frame)).forEach((point) => {
            const cx = point.x * width;
            const cy = point.y * height;
            context.fillStyle = "#fff";
            context.strokeStyle = "#1b5e20";
            context.beginPath();
            context.rect(cx - size / 2, cy - size / 2, size, size);
            context.fill();
            context.stroke();
        });
        context.restore();
    }

    /** トリミング中の見た目。残す範囲の外はうすく白くし、PowerPoint と同じ黒い └ ┌ と ｜ ― のハンドルを出します。 */
    function drawCrop(context) {
        if (!cropState) return;
        const width = context.canvas.width;
        const height = context.canvas.height;
        const b = cropState.bounds;
        const r = cropState.rect;
        const bx = b.x * width, by = b.y * height, bw = b.width * width, bh = b.height * height;
        const rx = r.x * width, ry = r.y * height, rw = r.width * width, rh = r.height * height;
        context.save();
        context.fillStyle = "rgba(255,255,255,.62)";
        // 残す範囲の外側（画像の枠の中だけ）を4枚の帯で覆います。
        context.fillRect(bx, by, bw, Math.max(0, ry - by));
        context.fillRect(bx, ry + rh, bw, Math.max(0, by + bh - (ry + rh)));
        context.fillRect(bx, ry, Math.max(0, rx - bx), rh);
        context.fillRect(rx + rw, ry, Math.max(0, bx + bw - (rx + rw)), rh);
        const stroke = Math.max(1.5, width / 900);
        context.strokeStyle = "#111";
        context.lineWidth = stroke;
        context.setLineDash([]);
        context.strokeRect(rx, ry, rw, rh);
        // ハンドル
        const length = handleSizePx(context) * 1.7;
        const thick = Math.max(3, stroke * 3);
        context.lineWidth = thick;
        context.lineCap = "butt";
        context.strokeStyle = "#111";
        const half = thick / 2;
        rectHandlePoints(r).forEach((point) => {
            const cx = point.x * width;
            const cy = point.y * height;
            context.beginPath();
            if (point.key.length === 2) {
                // 四隅：内向きの L 字。線の外側の角が四角の角に重なるようにします。
                const dirX = point.key.includes("w") ? 1 : -1;
                const dirY = point.key.includes("n") ? 1 : -1;
                // 枠の内側に沿わせます（ページの端にある角でも見えるように）。
                const ox = cx + dirX * half;
                const oy = cy + dirY * half;
                context.moveTo(ox + dirX * length, oy);
                context.lineTo(ox, oy);
                context.lineTo(ox, oy + dirY * length);
            } else if (point.key === "n" || point.key === "s") {
                const oy = cy + (point.key === "n" ? half : -half);
                context.moveTo(cx - length / 2, oy);
                context.lineTo(cx + length / 2, oy);
            } else {
                const ox = cx + (point.key === "w" ? half : -half);
                context.moveTo(ox, cy - length / 2);
                context.lineTo(ox, cy + length / 2);
            }
            context.stroke();
        });
        context.restore();
    }

    function cropTargetAnnotation() {
        if (!cropState || cropState.target === "base") return null;
        return (currentStep()?.annotations || []).find((item) => item?.id === cropState.target) || null;
    }

    /** トリミングを始めます。target は "base"（撮影画像）か、貼り付け画像の注釈ID。 */
    function startCrop(target) {
        const step = currentStep();
        if (!step?.screenshot) return;
        let bounds = null;
        if (target === "base") {
            bounds = frameRect(stepFrame(step));
        } else {
            const annotation = (step.annotations || []).find((item) => item?.id === target);
            if (!annotation || annotation.type !== "image" || rotationOf(annotation)) return;
            normalizeAnnotationRect(annotation);
            const box = normalizedRect(annotation);
            bounds = { x: box.left, y: box.top, width: box.width, height: box.height };
        }
        // 残す範囲の初期値は「画像のうちページに見えている部分」。
        const left = Math.max(0, bounds.x);
        const top = Math.max(0, bounds.y);
        const right = Math.min(1, bounds.x + bounds.width);
        const bottom = Math.min(1, bounds.y + bounds.height);
        const rect = right - left > 0.02 && bottom - top > 0.02
            ? { x: left, y: top, width: right - left, height: bottom - top }
            : { ...bounds };
        cropState = { target, bounds, rect, drag: null };
        toggleColorPopover(false);
        closeCanvasMenu();
        drawCanvas();
        syncStyleControls();
    }

    function cancelCrop() {
        if (!cropState) return;
        cropState = null;
        drawCanvas();
        syncStyleControls();
    }

    /** トリミングを確定します。切り取った範囲はその位置・大きさのまま残り、周りは余白になります（v0.6.29）。 */
    function finishCrop() {
        const state = cropState;
        const step = currentStep();
        if (!state || !step) { cropState = null; syncStyleControls(); return; }
        const annotation = cropTargetAnnotation();
        if (state.target !== "base" && !annotation) { cancelCrop(); return; }
        const { bounds, rect } = state;
        const unchanged = ["x", "y", "width", "height"].every((key) => Math.abs(rect[key] - bounds[key]) < 1e-6);
        if (unchanged) { cancelCrop(); return; }
        const oldCrop = state.target === "base" ? stepFrame(step).crop : normalizeCrop(annotation.crop);
        // 残す範囲が元画像のどこにあたるか（枠の中での割合を、いまの crop に掛ける）
        const newCrop = normalizeCrop({
            x: oldCrop.x + (rect.x - bounds.x) / bounds.width * oldCrop.width,
            y: oldCrop.y + (rect.y - bounds.y) / bounds.height * oldCrop.height,
            width: rect.width / bounds.width * oldCrop.width,
            height: rect.height / bounds.height * oldCrop.height
        });
        pushHistory();
        if (state.target === "base") {
            step.frame = normalizeFrame({ ...rect, crop: newCrop });
        } else {
            annotation.x = rect.x;
            annotation.y = rect.y;
            annotation.width = rect.width;
            annotation.height = rect.height;
            annotation.crop = newCrop;
        }
        cropState = null;
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
    }

    /** トリミング中の pointerdown。ハンドルなら範囲の変形、範囲の中なら移動。 */
    function beginCropDrag(point, event) {
        if (!cropState) return;
        const handle = hitRectHandle(cropState.rect, point);
        // 範囲の外をクリック＝確定（PowerPoint と同じ）
        if (!handle && !pointInRect(cropState.rect, point)) { finishCrop(); return; }
        cropState.drag = { mode: handle ? "resize" : "move", handle: handle?.key || "", point, rect: { ...cropState.rect } };
        elements.canvas.setPointerCapture(event.pointerId);
    }

    function moveCropDrag(point) {
        const drag = cropState?.drag;
        if (!drag) return;
        const dx = point.x - drag.point.x;
        const dy = point.y - drag.point.y;
        const b = cropState.bounds;
        let next;
        if (drag.mode === "move") {
            next = { ...drag.rect, x: drag.rect.x + dx, y: drag.rect.y + dy };
            next.x = PG.clamp(next.x, b.x, b.x + b.width - next.width);
            next.y = PG.clamp(next.y, b.y, b.y + b.height - next.height);
        } else {
            next = resizeRect(drag.rect, drag.handle, dx, dy, false);
            // 元の画像の枠からは出られません。
            const left = Math.max(b.x, next.x);
            const top = Math.max(b.y, next.y);
            const right = Math.min(b.x + b.width, next.x + next.width);
            const bottom = Math.min(b.y + b.height, next.y + next.height);
            next = { x: left, y: top, width: Math.max(0.02, right - left), height: Math.max(0.02, bottom - top) };
        }
        cropState.rect = next;
        if (drawFrame) return;
        drawFrame = requestAnimationFrame(() => { drawFrame = 0; drawCanvas(); });
    }

    elements.canvas.addEventListener("pointerdown", (event) => {
        if (editingAnnotationId) closeTextEditor(true);
        const step = currentStep();
        if (!step?.screenshot) return;
        const point = canvasPoint(event);
        if (!point) return;
        if (cropState) { beginCropDrag(point, event); return; }
        if (selectedTool === "image") {
            // 貼り付け画像をクリックしたら、その画像を選んで動かします（選択ツールと同じ扱い）。
            const picked = hitImageAnnotation(point);
            if (picked) {
                pushHistory();
                normalizeAnnotationRect(picked.annotation);
                if (!selectionIds.includes(picked.annotation.id)) setSelection([picked.annotation.id]);
                dragMode = picked.mode;
                dragOrigin = {
                    point, rect: { ...picked.annotation }, handle: picked.handle || "se",
                    items: selectionAnnotations().map((item) => deepCopy(item)), bounds: selectionBounds()
                };
                elements.canvas.setPointerCapture(event.pointerId);
                drawCanvas();
                syncStyleControls();
                return;
            }
            if (selectionIds.length) { setSelection([]); syncStyleControls(); }
            const raw = canvasPointRaw(event) || point;
            const frame = stepFrame(step);
            const handle = hitRectHandle(frameRect(frame), raw);
            if (!handle && !pointInRect(frameRect(frame), raw)) { drawCanvas(); return; }
            frameDrag = {
                mode: handle ? "resize" : "move", handle: handle?.key || "", point: raw, frame, pushed: false,
                items: (step.annotations || []).map((item) => deepCopy(item))
            };
            elements.canvas.setPointerCapture(event.pointerId);
            return;
        }
        if (selectedTool === "select") {
            // 撮影画像の選択（v0.7.24）：Alt+クリックで選ぶ。選択中はハンドルで大きさを変え、枠内のドラッグで動かす。
            // 枠の外をクリックすると選択が外れ、従来どおり（囲み選択の始点）になります。
            const raw = canvasPointRaw(event) || point;
            const frameBox = frameRect(stepFrame(step));
            if (frameSelected) {
                const frameHandle = hitRectHandle(frameBox, raw);
                if (frameHandle) { beginFrameDrag(step, raw, frameHandle, event); return; }
                const overObject = !event.altKey && hitTest(point);
                if (!overObject && pointInRect(frameBox, raw)) { beginFrameDrag(step, raw, null, event); return; }
                frameSelected = false;
            }
            if (event.altKey && pointInRect(frameBox, raw)) {
                setSelection([]);
                frameSelected = true;
                beginFrameDrag(step, raw, null, event);
                drawCanvas();
                syncStyleControls();
                return;
            }
            const hit = hitTest(point);
            if (hit) { pushHistory(); normalizeAnnotationRect(hit.annotation); }
            if (hit && hit.mode === "move") {
                // グループの仲間はまとめて選びます。Shiftを押していれば選択に足し引きします（v0.6.28）。
                const members = groupMembers(hit.annotation).map((item) => item.id);
                if (event.shiftKey) {
                    const already = members.every((id) => selectionIds.includes(id));
                    const rest = selectionIds.filter((id) => !members.includes(id));
                    setSelection(already ? rest : [...rest, ...members]);
                } else if (!selectionIds.includes(hit.annotation.id)) {
                    setSelection(members);
                }
            } else if (!hit) {
                // 何もない所は「囲み選択」の始点です。Shiftなしなら選択をいったん外し、
                // Shiftありなら今の選択に足していきます（v0.6.28）。
                if (!event.shiftKey) setSelection([]);
                marquee = { start: point, end: point, base: event.shiftKey ? [...selectionIds] : [] };
                elements.canvas.setPointerCapture(event.pointerId);
            }
            dragMode = hit?.mode || null;
            dragOrigin = hit ? {
                point,
                rect: { ...hit.annotation },
                handle: hit.handle || "se",
                items: selectionAnnotations().map((item) => deepCopy(item)),
                bounds: selectionBounds()
            } : null;
            if (hit) elements.canvas.setPointerCapture(event.pointerId);
            drawCanvas();
            syncStyleControls();
            return;
        }
        if (selectedTool === "eraser") {
            elements.canvas.setPointerCapture(event.pointerId);
            erasing = true;
            erasedInGesture = false;
            eraseAnnotationsAt(point);
            return;
        }
        if (selectedTool === "pen" || selectedTool === "highlighter") {
            elements.canvas.setPointerCapture(event.pointerId);
            const style = currentStyle();
            draftAnnotation = {
                id: PG.createId("annotation"), type: "draw",
                mode: selectedTool === "highlighter" ? "highlighter" : "pen",
                x: point.x, y: point.y, width: 0, height: 0,
                color: style.color, size: style.size,
                opacity: normalizeOpacity(style.opacity ?? toolStyles.highlighter.opacity),
                points: [{ x: point.x, y: point.y }]
            };
            pointerStart = point;
            return;
        }
        pointerStart = point;
        elements.canvas.setPointerCapture(event.pointerId);
        const style = currentStyle();
        draftAnnotation = {
            id: PG.createId("annotation"), type: selectedTool,
            x: pointerStart.x, y: pointerStart.y, width: 0, height: 0,
            color: style.color, size: style.size
        };
        if (selectedTool === "highlight") {
            draftAnnotation.shape = PG.normalizeHighlightShape(style.shape);
            draftAnnotation.dash = PG.normalizeLineDash(style.dash);
            draftAnnotation.fillColor = PG.normalizeHexColor(style.fillColor, "#ffffff");
            draftAnnotation.fillOpacity = normalizeBackground(style.fillOpacity);
        }
        if (selectedTool === "zoom") {
            // 部分拡大図（v0.6.43）：囲んでいる間は赤い枠を下書きとして見せます。
            draftAnnotation.type = "highlight";
            draftAnnotation.zoomDraft = true;
            draftAnnotation.shape = "rect";
            draftAnnotation.dash = "solid";
            draftAnnotation.color = "#d92d20";
            draftAnnotation.size = 2;
            draftAnnotation.fillColor = "#ffffff";
            draftAnnotation.fillOpacity = 0;
        }
        if (selectedTool === "arrow") {
            draftAnnotation.arrowLine = PG.normalizeArrowLine(style.arrowLine);
            draftAnnotation.arrowStart = PG.normalizeArrowHead(style.arrowStart, "none");
            draftAnnotation.arrowEnd = PG.normalizeArrowHead(style.arrowEnd, "none");
            draftAnnotation.arrowHeadSize = PG.normalizeArrowHeadSize(style.arrowHeadSize);
            draftAnnotation.arrowConnect = style.arrowConnect !== false;
            if (draftAnnotation.arrowConnect) {
                // 始点が図形の接続点の近くなら、そこから引き始めます（v0.6.33）。
                connectorHint = true;
                const snap = findConnection(point, draftAnnotation.id);
                if (snap) {
                    draftAnnotation.x = snap.x;
                    draftAnnotation.y = snap.y;
                    draftAnnotation.startAnchor = { id: snap.id, side: snap.side };
                }
            }
        }
        if (selectedTool === "text") {
            draftAnnotation.text = "";
            draftAnnotation.font = style.font;
            draftAnnotation.background = normalizeBackground(style.background);
            if (PG.normalizeTextKind(style.textMode) === "box") {
                draftAnnotation.textMode = "box";
                draftAnnotation.align = PG.normalizeTextAlign(style.align);
                draftAnnotation.valign = PG.normalizeTextValign(style.valign);
                draftAnnotation.vert = PG.normalizeTextDirection(style.vert);
            } else if (PG.normalizeTextDirection(style.vert) === "vertical") {
                draftAnnotation.vert = "vertical";   // 自動サイズの縦書き（v0.6.41）
            }
        }
        if (selectedTool === "marker") draftAnnotation.label = "";
    });

    /* ---- フリーハンド（ペン・蛍光ペン・消しゴム） ---- */
    let erasing = false;
    let erasedInGesture = false;

    /** 指定位置にある注釈を消します。v0.6.24 から手書きだけでなく全種類
     *（ぼかし・黒塗り・枠線・矢印・文字・画像・操作手順番号）が対象です。
     * 枠線は「線の近く」だけを消し、枠の中をなぞっても消えないようにしています。 */
    function eraseAnnotationsAt(point) {
        const step = currentStep();
        if (!step?.annotations?.length) return;
        const width = elements.canvas.width || 1;
        const height = elements.canvas.height || 1;
        const px = point.x * width;
        const py = point.y * height;
        const nearSegment = (qx, qy, ax, ay, bx, by, threshold) => {
            const dx = bx - ax, dy = by - ay;
            const lengthSq = dx * dx + dy * dy;
            const t = lengthSq ? Math.max(0, Math.min(1, ((qx - ax) * dx + (qy - ay) * dy) / lengthSq)) : 0;
            return Math.hypot(qx - (ax + t * dx), qy - (ay + t * dy)) <= threshold;
        };
        /** 回転している注釈は、なぞった点のほうを逆に回してから当てはめます（v0.6.27）。 */
        const localPoint = (annotation) => {
            const rotation = rotationOf(annotation);
            if (!rotation) return { x: px, y: py };
            const box = normalizedRect(annotation);
            const cx = (box.left + box.width / 2) * width;
            const cy = (box.top + box.height / 2) * height;
            const rad = -rotation * Math.PI / 180;
            const ox = px - cx;
            const oy = py - cy;
            return { x: cx + ox * Math.cos(rad) - oy * Math.sin(rad), y: cy + ox * Math.sin(rad) + oy * Math.cos(rad) };
        };
        const hitStroke = (annotation, q) => {
            const threshold = Math.max(12, lineWidthFor({ canvas: elements.canvas }, normalizeSize(annotation.size)) * 1.5);
            const pts = annotation.points || [];
            for (let i = 0; i < pts.length - 1; i += 1) {
                if (nearSegment(q.x, q.y, pts[i].x * width, pts[i].y * height, pts[i + 1].x * width, pts[i + 1].y * height, threshold)) return true;
            }
            return false;
        };
        const hitAnnotation = (annotation) => {
            if (!annotation) return false;
            const q = localPoint(annotation);
            if (annotation.type === "draw") return hitStroke(annotation, q);
            if (annotation.type === "arrow") {
                const threshold = Math.max(12, lineWidthFor({ canvas: elements.canvas }, normalizeSize(annotation.size)) * 1.5);
                const points = arrowRoutePx(annotation, width, height).points;
                for (let i = 0; i < points.length - 1; i += 1) {
                    if (nearSegment(q.x, q.y, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], threshold)) return true;
                }
                return false;
            }
            const px2 = q.x;
            const py2 = q.y;
            const box = normalizedRect(annotation);
            const left = box.left * width, top = box.top * height;
            const right = left + box.width * width, bottom = top + box.height * height;
            const margin = 6;
            if (annotation.type === "highlight") {
                const threshold = Math.max(10, lineWidthFor({ canvas: elements.canvas }, normalizeSize(annotation.size)) * 1.5);
                const outer = px2 >= left - threshold && px2 <= right + threshold && py2 >= top - threshold && py2 <= bottom + threshold;
                const inner = px2 >= left + threshold && px2 <= right - threshold && py2 >= top + threshold && py2 <= bottom - threshold;
                return outer && !inner;
            }
            return px2 >= left - margin && px2 <= right + margin && py2 >= top - margin && py2 <= bottom + margin;
        };
        const remaining = step.annotations.filter((annotation) => !hitAnnotation(annotation));
        if (remaining.length === step.annotations.length) return;
        if (!erasedInGesture) { pushHistory(); erasedInGesture = true; }
        const survivors = selectionIds.filter((id) => remaining.some((annotation) => annotation?.id === id));
        step.annotations = remaining;
        if (survivors.length !== selectionIds.length) setSelection(survivors);
        renumberMarkers();
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
    }

    /** 囲み選択の枠（正規化座標）。始点と今の位置から左上・幅・高さを出します。 */
    function marqueeRect() {
        if (!marquee) return null;
        const left = Math.min(marquee.start.x, marquee.end.x);
        const top = Math.min(marquee.start.y, marquee.end.y);
        return { left, top, width: Math.abs(marquee.end.x - marquee.start.x), height: Math.abs(marquee.end.y - marquee.start.y) };
    }

    /** 囲み選択を確定します。枠に丸ごと入っているもの（PowerPointと同じ基準）を選び、
     * グループの仲間もまとめて選びます。ほとんど動かしていなければ普通のクリック扱いです。 */
    function finishMarquee() {
        const rect = marqueeRect();
        const base = marquee?.base || [];
        marquee = null;
        if (!rect) return;
        const width = Math.max(1, elements.canvas.width);
        const height = Math.max(1, elements.canvas.height);
        const step = currentStep();
        if (!step || rect.width * width < 4 || rect.height * height < 4) { drawCanvas(); return; }
        const inside = (step.annotations || []).filter((annotation) => {
            if (!annotation || annotation.type === "draw") return false;
            const box = selectionBounds([annotation]);
            return Boolean(box) && box.left >= rect.left && box.top >= rect.top
                && box.left + box.width <= rect.left + rect.width && box.top + box.height <= rect.top + rect.height;
        });
        const picked = [];
        inside.forEach((annotation) => groupMembers(annotation).forEach((member) => {
            if (member?.id && !picked.includes(member.id)) picked.push(member.id);
        }));
        setSelection([...base.filter((id) => !picked.includes(id)), ...picked]);
        drawCanvas();
        syncStyleControls();
    }

    elements.canvas.addEventListener("pointercancel", () => {
        if (cropState?.drag) cropState.drag = null;
        frameDrag = null;
        if (!marquee) { drawCanvas(); return; }
        marquee = null;
        drawCanvas();
    });

    elements.canvas.addEventListener("pointermove", (event) => {
        const point = canvasPoint(event);
        if (!point) return;
        if (cropState) { moveCropDrag(point); return; }
        if (frameDrag) {
            const step = currentStep();
            const raw = canvasPointRaw(event) || point;
            if (!step) return;
            const dx = raw.x - frameDrag.point.x;
            const dy = raw.y - frameDrag.point.y;
            if (!frameDrag.pushed) { pushHistory(); frameDrag.pushed = true; }
            const origin = frameDrag.frame;
            const next = frameDrag.mode === "move"
                ? { x: origin.x + dx, y: origin.y + dy, width: origin.width, height: origin.height }
                : resizeRect(frameRect(origin), frameDrag.handle, dx, dy, true);
            step.frame = normalizeFrame({ ...next, crop: origin.crop });
            remapAnnotations(step, frameRect(origin), frameRect(step.frame), frameDrag.items);
            if (drawFrame) return;
            drawFrame = requestAnimationFrame(() => { drawFrame = 0; drawCanvas(); });
            return;
        }
        if (marquee) {
            marquee.end = point;
            if (drawFrame) return;
            drawFrame = requestAnimationFrame(() => { drawFrame = 0; drawCanvas(); });
            return;
        }
        if (dragMode && dragOrigin) {
            const target = selectedAnnotation();
            if (!target) return;
            const dx = point.x - dragOrigin.point.x;
            const dy = point.y - dragOrigin.point.y;
            const canvasW = Math.max(1, elements.canvas.width);
            const canvasH = Math.max(1, elements.canvas.height);
            // まとめて選んでいるときは、全体を1つの図形として扱います（v0.6.28）。
            if ((dragOrigin.items || []).length > 1) {
                applyGroupDrag(dragOrigin, dragMode, dx, dy, point, event.shiftKey, canvasW, canvasH);
                if (drawFrame) return;
                drawFrame = requestAnimationFrame(() => { drawFrame = 0; drawCanvas(); });
                return;
            }
            if (dragMode === "rotate") {
                // 図形の中心からポインタへの向きが、そのまま角度になります（Shiftで15度刻み）。
                const origin = normalizedRect(dragOrigin.rect);
                const cx = origin.left + origin.width / 2;
                const cy = origin.top + origin.height / 2;
                const degrees = Math.atan2((point.y - cy) * canvasH, (point.x - cx) * canvasW) * 180 / Math.PI + 90;
                target.rotation = PG.normalizeRotation(event.shiftKey ? Math.round(degrees / 15) * 15 : degrees);
            } else if (dragMode === "move") {
                target.x = PG.clamp(dragOrigin.rect.x + dx, -1, 1);
                target.y = PG.clamp(dragOrigin.rect.y + dy, -1, 1);
                // 矢印そのものを動かしたら接続は外れます（PowerPoint と同じ）。
                if (target.type === "arrow") { delete target.startAnchor; delete target.endAnchor; }
            } else if (target.type === "arrow" && String(dragOrigin.handle).startsWith("adjust:")) {
                // 中間バー：バーの軸に沿った位置を、端点間の割合（arrowBars[key]）に直して持ちます（v0.6.33）。
                const key = String(dragOrigin.handle).slice(7);
                const barInfo = arrowRoutePx(dragOrigin.rect, canvasW, canvasH).bars.find((item) => item.key === key);
                if (barInfo) {
                    const pos = barInfo.axis === "x" ? point.x * canvasW : point.y * canvasH;
                    const span = barInfo.to - barInfo.from;
                    if (Math.abs(span) > 1e-6) {
                        const bars = { ...(target.arrowBars || {}) };
                        if (target.arrowAdjust !== undefined && bars.mid === undefined) bars.mid = Number(target.arrowAdjust);
                        bars[key] = Math.round(((pos - barInfo.from) / span) * 1000) / 1000;
                        target.arrowBars = bars;
                        delete target.arrowAdjust;
                    }
                }
            } else if (target.type === "arrow" && (dragOrigin.handle === "start" || dragOrigin.handle === "end") && !rotationOf(dragOrigin.rect)) {
                // 矢印の端：接続点の近くなら吸い付けます（v0.6.33）。
                Object.assign(target, { x: dragOrigin.rect.x, y: dragOrigin.rect.y, width: dragOrigin.rect.width, height: dragOrigin.rect.height });
                connectorHint = target.arrowConnect !== false;
                placeArrowEnd(target, dragOrigin.handle, point);
            } else {
                // 回転している図形は、動かした量も同じだけ戻してから当てはめます。
                const rotation = rotationOf(dragOrigin.rect);
                let localDx = dx;
                let localDy = dy;
                if (rotation) {
                    const px = dx * canvasW;
                    const py = dy * canvasH;
                    const rad = -rotation * Math.PI / 180;
                    localDx = (px * Math.cos(rad) - py * Math.sin(rad)) / canvasW;
                    localDy = (px * Math.sin(rad) + py * Math.cos(rad)) / canvasH;
                }
                applyResize(target, dragOrigin.rect, dragOrigin.handle, localDx, localDy);
            }
            if (drawFrame) return;
            drawFrame = requestAnimationFrame(() => { drawFrame = 0; drawCanvas(); });
            return;
        }
        if (erasing) { eraseAnnotationsAt(point); return; }
        if (!pointerStart || !draftAnnotation) return;
        if (draftAnnotation.type === "draw") {
            const last = draftAnnotation.points[draftAnnotation.points.length - 1];
            if (Math.hypot(point.x - last.x, point.y - last.y) >= 0.0015) draftAnnotation.points.push({ x: point.x, y: point.y });
        } else if (draftAnnotation.type === "arrow" && draftAnnotation.arrowConnect) {
            placeArrowEnd(draftAnnotation, "end", point);
        } else {
            draftAnnotation.width = point.x - pointerStart.x;
            draftAnnotation.height = point.y - pointerStart.y;
        }
        if (drawFrame) return;
        drawFrame = requestAnimationFrame(() => { drawFrame = 0; drawCanvas(); });
    });

    elements.canvas.addEventListener("pointerup", (event) => {
        const step = currentStep();
        if (drawFrame) { cancelAnimationFrame(drawFrame); drawFrame = 0; }
        if (cropState) {
            if (cropState.drag) { cropState.drag = null; drawCanvas(); }
            return;
        }
        if (frameDrag) {
            frameDrag = null;
            scheduleSave();
            drawCanvas();
            updateHistoryButtons();
            syncStyleControls();
            return;
        }
        if (marquee) { finishMarquee(); return; }
        if (dragMode) {
            dragMode = null;
            dragOrigin = null;
            connectorHint = false;
            scheduleSave();
            drawCanvas();
            updateHistoryButtons();
            return;
        }
        if (erasing) { erasing = false; erasedInGesture = false; return; }
        if (!step || !draftAnnotation || !pointerStart) return;
        if (draftAnnotation.type === "draw") {
            const pending = draftAnnotation;
            pointerStart = null;
            draftAnnotation = null;
            if ((pending.points || []).length < 2) { drawCanvas(); return; }
            // 選択・複製系の処理が矩形を前提にしているため、外接矩形も持たせます。
            const xs = pending.points.map((pt) => pt.x);
            const ys = pending.points.map((pt) => pt.y);
            pending.x = Math.min(...xs);
            pending.y = Math.min(...ys);
            pending.width = Math.max(...xs) - pending.x;
            pending.height = Math.max(...ys) - pending.y;
            commitAnnotation(step, pending);
            setSelection([]);
            drawCanvas();
            // ペン・蛍光ペンは連続で描けるようツールを維持します。
            return;
        }
        const point = canvasPoint(event) || pointerStart;
        connectorHint = false;
        if (draftAnnotation.type === "arrow" && draftAnnotation.arrowConnect) {
            placeArrowEnd(draftAnnotation, "end", point);
        } else {
            draftAnnotation.width = point.x - pointerStart.x;
            draftAnnotation.height = point.y - pointerStart.y;
        }
        const minSize = selectedTool === "arrow" ? .008 : .004;
        const drawn = Math.abs(draftAnnotation.width) > minSize || Math.abs(draftAnnotation.height) > minSize;
        const pending = draftAnnotation;
        pointerStart = null;
        draftAnnotation = null;
        if (!drawn) { drawCanvas(); return; }
        if (pending.zoomDraft) { createZoomFigure(step, normalizedRect(pending)); return; }
        commitAnnotation(step, pending);
        if (pending.type === "text") {
            setTool("select");
            setSelection([pending.id]);
            openTextEditor(pending, true);
        }
        // 連続で描いたり色を変えたりできるよう、描いた後もツールは選んだままにします。
        // 解除したいときは画像の外（まわりの余白）をクリックします。
    });

    // 画像のまわりの余白（市松模様の台紙）を押したら、ツールと選択を解除します。
    // ツールバーの操作や画像そのものへの描画では解除しません。
    elements.canvasStage?.addEventListener("pointerdown", (event) => {
        // たたんでいるときの一時表示は、キャンバスを触ったら閉じます（v0.6.37）。
        if (toolbarTemp) { toolbarTemp = false; syncToolbarPin(); }
        const target = event.target;
        if (target instanceof Element && (target.closest("#editorCanvas") || target.closest(".text-editor"))) return;
        if (selectedTool === "select" && !selectedAnnotationId) return;
        if (selectedTool !== "select") setTool("select");
        if (selectedAnnotationId) {
            setSelection([]);
            drawCanvas();
        }
        syncStyleControls();
    });

    elements.canvas.addEventListener("pointerdown", () => { if (toolbarTemp) { toolbarTemp = false; syncToolbarPin(); } }, true);
    elements.canvas.addEventListener("dblclick", (event) => {
        const step = currentStep();
        if (!step?.screenshot || cropState || selectedTool === "image") return;
        const point = canvasPoint(event);
        if (!point) return;
        const hit = hitTest(point);
        if (String(hit?.handle || "").startsWith("adjust:") && hasArrowBar(hit.annotation, hit.handle.slice(7))) {
            // 中間バーをダブルクリック → そのバーだけ自動の位置に戻す
            pushHistory();
            const key = hit.handle.slice(7);
            const bars = { ...(hit.annotation.arrowBars || {}) };
            if (hit.annotation.arrowAdjust !== undefined && bars.mid === undefined) bars.mid = Number(hit.annotation.arrowAdjust);
            delete bars[key];
            delete hit.annotation.arrowAdjust;
            if (Object.keys(bars).length) hit.annotation.arrowBars = bars; else delete hit.annotation.arrowBars;
            scheduleSave();
            drawCanvas();
            updateHistoryButtons();
            return;
        }
        if (!hit) {
            setTool("select");
            const style = { ...DEFAULT_TOOL_STYLES.text, ...toolStyles.text };
            const created = {
                id: PG.createId("annotation"), type: "text", text: "",
                x: PG.clamp(point.x, 0, .96), y: PG.clamp(point.y, 0, .96),
                width: .3, height: .07,
                color: normalizeColor(style.color),
                size: normalizeSize(style.size),
                font: PG.normalizeFont(style.font ?? documentFont()),
                background: normalizeBackground(style.background),
                backgroundColor: PG.normalizeHexColor(style.backgroundColor, "#ffffff"),
                borderWidth: Math.max(0, Number(style.borderWidth) || 0),
                borderColor: PG.normalizeHexColor(style.borderColor, "#d92d20")
            };
            if (PG.normalizeTextDirection(style.vert) === "vertical") created.vert = "vertical";   // 自動サイズの縦書き（v0.6.41）
            commitAnnotation(step, created);
            openTextEditor(created, true);
            return;
        }
        setTool("select");
        setSelection([hit.annotation.id]);
        drawCanvas();
        syncStyleControls();
        const target = selectedAnnotation();
        if (!target || (target.type !== "text" && target.type !== "highlight")) return;
        if (target.type === "highlight") {
            // 図形の中に文字を入れます。まだ持っていなければ、いまの既定を写します（v0.6.26）。
            if (target.textColor === undefined) target.textColor = PG.normalizeHexColor(toolStyles.highlight.textColor, "#111111");
            if (target.textSize === undefined) target.textSize = normalizeSize(toolStyles.highlight.textSize);
            if (target.textAlign === undefined) target.textAlign = PG.normalizeTextAlign(toolStyles.highlight.textAlign);
            if (target.textValign === undefined) target.textValign = PG.normalizeTextValign(toolStyles.highlight.textValign);
        }
        openTextEditor(target, false);
    });

    elements.textEditor?.addEventListener("keydown", (event) => {
        event.stopPropagation();
        if (event.key === "Escape") { event.preventDefault(); closeTextEditor(false); return; }
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); closeTextEditor(true); }
    });
    elements.textEditor?.addEventListener("blur", () => closeTextEditor(true));
    elements.canvasStage?.addEventListener("scroll", () => { if (editingAnnotationId) closeTextEditor(true); });

    ["dragenter", "dragover"].forEach((type) => elements.canvasStage?.addEventListener(type, (event) => {
        if (![...(event.dataTransfer?.types || [])].includes("Files")) return;
        event.preventDefault();
        elements.canvasStage.classList.add("dropping");
    }));
    ["dragleave", "dragend"].forEach((type) => elements.canvasStage?.addEventListener(type, () => elements.canvasStage.classList.remove("dropping")));
    elements.canvasStage?.addEventListener("drop", (event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file) return;
        event.preventDefault();
        elements.canvasStage.classList.remove("dropping");
        readImageFile(file);
    });
    elements.baseImageOnly?.addEventListener("change", () => {
        if (elements.baseImageOnly.checked) setImageBarState("以降はマスクなしの原本を出力します", "#b42318");
        else setImageBarState("編集後の画像を出力します");
    });
    document.getElementById("copyImage")?.addEventListener("click", copyStepImage);
    document.getElementById("downloadPng")?.addEventListener("click", () => downloadStepImage("png"));
    document.getElementById("downloadJpeg")?.addEventListener("click", () => downloadStepImage("jpeg"));

    document.getElementById("importImage")?.addEventListener("click", () => elements.imageInput?.click());
    // トリミングの対象は「いま選んでいる画像」。貼り付け画像を選んでいればそれ、なければ撮影画像です。
    document.getElementById("cropImage")?.addEventListener("click", () => {
        if (cropState) { finishCrop(); return; }
        const picked = selectedAnnotation();
        startCrop(picked?.type === "image" ? picked.id : "base");
    });
    document.getElementById("cropPicture")?.addEventListener("click", () => { if (selectedAnnotationId) startCrop(selectedAnnotationId); });
    document.getElementById("resetImageFrame")?.addEventListener("click", resetImageFrame);
    elements.zoomResetButton?.addEventListener("click", () => setCanvasZoom(1));
    // 上部の赤いボタン：押すと「この手順だけ／すべて」を選べます（v0.6.36 追補）
    elements.frameResetButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!elements.frameResetMenu) return;
        const next = elements.frameResetMenu.hidden;
        if (next) syncFrameResetButton();
        elements.frameResetMenu.hidden = !next;
    });
    elements.frameResetMenu?.addEventListener("click", (event) => {
        const scope = event.target?.dataset?.scope;
        if (!scope) return;
        closeFrameResetMenu();
        if (scope === "all") resetAllImageFrames(); else resetImageFrame();
    });
    document.addEventListener("click", (event) => {
        if (elements.frameResetMenu?.hidden) return;
        if (elements.frameResetWrap?.contains(event.target)) return;
        closeFrameResetMenu();
    });
    // 語尾をまとめて変換（v0.7.11）：ガイド内すべての手順の操作説明を、選んだ語尾に置き換えます（Ctrl+Z で戻せます）
    const descriptionStyleButton = document.getElementById("descriptionStyleButton");
    const descriptionStyleMenu = document.getElementById("descriptionStyleMenu");
    const descriptionStyleWrap = document.getElementById("descriptionStyleWrap");
    function closeDescriptionStyleMenu() { if (descriptionStyleMenu) descriptionStyleMenu.hidden = true; }
    function renderDescriptionStyleMenu() {
        if (!descriptionStyleMenu) return;
        descriptionStyleMenu.textContent = "";
        const current = PG.normalizeDescriptionStyle(appSettings?.descriptionStyle);
        (PG.DESCRIPTION_STYLES || []).forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.style = item.id;
            button.className = item.id === current ? "current" : "";
            const label = document.createElement("span");
            label.textContent = item.label + (item.id === current ? "（設定の既定）" : "");
            const sample = document.createElement("small");
            sample.textContent = item.sample;
            button.append(label, sample);
            descriptionStyleMenu.appendChild(button);
        });
    }
    function convertAllDescriptions(styleId) {
        if (!session || !Array.isArray(session.steps)) return;
        const style = PG.normalizeDescriptionStyle(styleId);
        const changes = [];
        session.steps.forEach((step) => {
            if (!step || typeof step.description !== "string") return;
            const next = PG.convertDescriptionStyle(step.description, style);
            if (next !== step.description) changes.push({ step, next });
        });
        const styleLabel = (PG.DESCRIPTION_STYLES || []).find((item) => item.id === style)?.label || style;
        if (!changes.length) { setSaveState(`変換できる語尾の手順はありませんでした（${styleLabel}）`, "#737373"); return; }
        pushHistory();   // 1回の操作としてまとめて戻せるようにします
        changes.forEach(({ step, next }) => { step.description = next; });
        const current = currentStep();
        if (current && elements.stepDescription) elements.stepDescription.value = current.description || "";
        renderStepList();
        scheduleSave();
        setSaveState(`${changes.length} 件の手順の語尾を「${styleLabel}」に変換しました（Ctrl+Z で戻せます）`, "#1b5e20");
    }
    descriptionStyleButton?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!descriptionStyleMenu || !session) return;
        const next = descriptionStyleMenu.hidden;
        if (next) renderDescriptionStyleMenu();
        descriptionStyleMenu.hidden = !next;
    });
    descriptionStyleMenu?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const target = event.target instanceof Element ? event.target.closest("button[data-style]") : null;
        if (!target) return;
        closeDescriptionStyleMenu();
        convertAllDescriptions(target.dataset.style);
    });
    document.addEventListener("click", (event) => {
        if (!descriptionStyleMenu || descriptionStyleMenu.hidden) return;
        if (descriptionStyleWrap?.contains(event.target)) return;
        closeDescriptionStyleMenu();
    });
    document.getElementById("cropDone")?.addEventListener("click", finishCrop);
    // この手順の撮影画像と注釈をまとめて消して白紙にします（元に戻すで復元できます）。
    document.getElementById("clearImage")?.addEventListener("click", () => {
        const step = currentStep();
        if (!step) return;
        if (!step.screenshot && !(step.annotations || []).length) return;
        if (!confirm("この手順の画像と注釈をすべて削除しますか？\n（元に戻すで復元できます）")) return;
        pushHistory();
        step.screenshot = null;
        step.captureError = "画像を削除した手順です";
        step.maskRects = [];
        step.maskApplied = true;
        step.maskBurnedIn = false;
        step.target = null;
        step.frame = null;
        step.blankScreenshot = false;
        step.annotations = [];
        renumberMarkers();
        setSelection([]);
        renderStepList();
        drawCanvas();
        scheduleSave();
        updateHistoryButtons();
        syncStyleControls();
    });
    elements.imageInput?.addEventListener("change", (event) => {
        readImageFile(event.target.files?.[0]);
        event.target.value = "";
    });

    elements.deleteAnnotation?.addEventListener("click", () => {
        const step = currentStep();
        const targets = selectionAnnotations();
        if (!step || !targets.length) return;
        pushHistory();
        const ids = targets.map((item) => item.id);
        step.annotations = step.annotations.filter((item) => !ids.includes(item?.id));
        renumberMarkers();
        setSelection([]);
        scheduleSave();
        drawCanvas();
        updateHistoryButtons();
        syncStyleControls();
    });

    document.addEventListener("paste", (event) => {
        const active = document.activeElement;
        if (active && ["INPUT", "TEXTAREA"].includes(active.tagName)) return;
        const items = [...(event.clipboardData?.items || [])];
        const imageItem = items.find((item) => item.type.startsWith("image/"));
        // 図形をコピーした直後（合言葉が一致）なら図形を貼り付けます（v0.6.32）。
        const clipText = String(event.clipboardData?.getData("text/plain") || "");
        if (objectClipboard && (clipText === objectClipboard.marker || (!objectClipboard.markerWritten && !imageItem))) {
            event.preventDefault();
            pasteClipboard();
            return;
        }
        if (imageItem) {
            event.preventDefault();
            readImageFile(imageItem.getAsFile());
            return;
        }
        const text = PG.cleanText(event.clipboardData?.getData("text/plain"), 600);
        if (!text) return;
        if (!currentStep()?.screenshot) return;
        event.preventDefault();
        const style = { ...DEFAULT_TOOL_STYLES.text, ...toolStyles.text };
        insertObject({
            id: PG.createId("annotation"), type: "text", text,
            x: .12, y: .12, width: .5, height: .1,
            color: normalizeColor(style.color), size: normalizeSize(style.size),
            background: normalizeBackground(style.background),
            backgroundColor: PG.normalizeHexColor(style.backgroundColor, "#ffffff"),
            borderWidth: Math.max(0, Number(style.borderWidth) || 0),
            borderColor: PG.normalizeHexColor(style.borderColor, "#d92d20")
        });
    });

    elements.undoButton.addEventListener("click", undoEdit);
    elements.redoButton.addEventListener("click", redoEdit);
    document.getElementById("clearAnnotations").addEventListener("click", () => {
        const step = currentStep();
        if (!step?.annotations?.length) return;
        pushHistory();
        step.annotations = [];
        renumberMarkers();
        setSelection([]);
        drawCanvas(); scheduleSave(); updateHistoryButtons(); syncStyleControls();
    });

    document.getElementById("addStep").addEventListener("click", addBlankStep);
    document.getElementById("addSection")?.addEventListener("click", addSection);
    document.getElementById("undoDeleteStep").addEventListener("click", undoStepChange);
    document.getElementById("guideLibrary").addEventListener("click", async () => { await renderLibrary(); elements.libraryDialog.showModal(); });
    document.getElementById("deleteGuide").addEventListener("click", async () => {
        if (!session || !confirm(`「${session.title}」を削除しますか？\nこの操作は元に戻せません。`)) return;
        const result = await message({ type: "PG_DELETE_SESSION", id: session.id });
        if (result?.deleted) {
            session = null;
            const listResult = await message({ type: "PG_LIST_SESSIONS" });
            const next = listResult?.sessions?.[0];
            if (next?.id) await loadSession(next.id); else location.href = "editor.html";
        }
    });
    /* ---- デザイン（スライドマスター相当）v0.6.35 / v0.6.36 ----
     * 全ページ共通のヘッダー帯・ロゴ・背景色・テンプレート画像・ページ番号です。
     * 優先順位：手順ごとの上書き（step.design）→ ガイド（session.design）→ 詳細設定の既定。null＝上位を使う。
     * 帯・ロゴ・ページ番号は「出力1ページ（用紙／スライド1枚）」の余白に付け、撮影画像には重ねません。 */
    const designElements = {
        panel: document.getElementById("designPanel"),
        status: document.getElementById("designStatus"),
        reset: document.getElementById("designReset"),
        scopeGuide: document.getElementById("designScopeGuide"),
        scopeStep: document.getElementById("designScopeStep"),
        headerEnabled: document.getElementById("designHeaderEnabled"),
        headerFields: document.getElementById("designHeaderFields"),
        headerColor: document.getElementById("designHeaderColor"),
        headerColorNone: document.getElementById("designHeaderColorNone"),
        headerSize: document.getElementById("designHeaderSize"),
        headerHeight: document.getElementById("designHeaderHeight"),
        headerText: document.getElementById("designHeaderText"),
        headerCustomRow: document.getElementById("designHeaderCustomRow"),
        headerCustom: document.getElementById("designHeaderCustom"),
        headerTextColor: document.getElementById("designHeaderTextColor"),
        logoPick: document.getElementById("designLogoPick"),
        logoRemove: document.getElementById("designLogoRemove"),
        logoFile: document.getElementById("designLogoFile"),
        logoPreview: document.getElementById("designLogoPreview"),
        logoFields: document.getElementById("designLogoFields"),
        logoPosition: document.getElementById("designLogoPosition"),
        logoSize: document.getElementById("designLogoSize"),
        background: document.getElementById("designBackground"),
        backgroundPick: document.getElementById("designBackgroundPick"),
        backgroundRemove: document.getElementById("designBackgroundRemove"),
        backgroundFile: document.getElementById("designBackgroundFile"),
        backgroundPreview: document.getElementById("designBackgroundPreview"),
        backgroundFields: document.getElementById("designBackgroundFields"),
        backgroundFit: document.getElementById("designBackgroundFit"),
        pageNumber: document.getElementById("designPageNumber"),
        pageNumberFields: document.getElementById("designPageNumberFields"),
        pageNumberAlign: document.getElementById("designPageNumberAlign"),
        sheet: document.getElementById("designSheet"),
        band: document.getElementById("designBand"),
        bandText: document.getElementById("designBandText"),
        logoImage: document.getElementById("designLogoImage"),
        foot: document.getElementById("designFoot"),
        footText: document.getElementById("designFootText"),
        zoomBadge: document.getElementById("zoomBadge")
    };
    const LOGO_MAX_BYTES = 500 * 1024;
    const LOGO_MAX_SIDE = 600;
    const BACKGROUND_MAX_BYTES = 1024 * 1024;
    const BACKGROUND_MAX_SIDE = 1920;
    const designPickers = {};
    // デザインパネルの「設定の範囲」：guide＝ガイド全体、step＝選択中の手順だけ（v0.6.36）
    let designScope = "guide";

    /**
     * その手順に効いているデザイン。ガイド（session.design → なければ詳細設定の既定）の上に、
     * 手順の上書き（step.design＝変えた項目だけ）を重ねます。step 省略時はガイドのもの。
     */
    function designFor(step) {
        const guide = session?.design || PG.designFromSettings(appSettings);
        return PG.normalizeDesign(step?.design ? { ...guide, ...step.design } : guide);
    }

    /** パネルが編集対象にしているデザイン（範囲に応じてガイド／手順）。 */
    function effectiveDesign() {
        return designScope === "step" ? designFor(currentStep()) : designFor(null);
    }

    function fillChoiceSelect(select, list) {
        if (!select) return;
        select.replaceChildren();
        list.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.label;
            select.appendChild(option);
        });
    }

    function syncDesignPanel() {
        if (!designElements.panel) return;
        syncCoverFields();
        const step = currentStep();
        if (designScope === "step" && !step) designScope = "guide";
        designElements.scopeGuide.classList.toggle("active", designScope === "guide");
        designElements.scopeStep.classList.toggle("active", designScope === "step");
        designElements.scopeStep.disabled = !step;
        const design = effectiveDesign();
        let own;
        if (designScope === "step") {
            own = Boolean(step?.design);
            designElements.status.textContent = own ? "この手順独自の設定" : (session?.design ? "ガイド全体の設定を使用中" : "詳細設定の既定を使用中");
            designElements.reset.textContent = "ガイドの設定に戻す";
            designElements.reset.title = "この手順だけの設定を消して、ガイド全体の設定に戻します";
        } else {
            own = Boolean(session?.design);
            designElements.status.textContent = own ? "このガイド独自の設定" : "詳細設定の既定を使用中";
            designElements.reset.textContent = "既定に戻す";
            designElements.reset.title = "このガイドだけの設定を消して、詳細設定の既定に戻します";
        }
        designElements.status.style.color = own ? "#1b5e20" : "#8a8a8a";
        designElements.reset.hidden = !own;
        designElements.headerEnabled.checked = design.headerEnabled;
        // 色なし（透明）のときは色ボタンを薄くして、直前の色は残しておきます。
        designElements.headerColorNone.checked = !design.headerColor;
        if (design.headerColor) designElements.headerColor.value = design.headerColor;
        designPickers.headerColor?.button?.classList.toggle("is-none", !design.headerColor);
        designElements.headerSize.value = design.headerSize;
        if (Number(designElements.headerHeight.value) !== design.headerHeight) designElements.headerHeight.value = String(design.headerHeight);
        designElements.headerText.value = design.headerText;
        if (designElements.headerCustom.value !== design.headerCustom) designElements.headerCustom.value = design.headerCustom;
        designElements.headerCustomRow.hidden = design.headerText !== "custom";
        designElements.headerTextColor.value = design.headerTextColor;
        designElements.headerFields.classList.toggle("disabled", !design.headerEnabled);
        designElements.logoRemove.hidden = !design.logo;
        designElements.logoPreview.hidden = !design.logo;
        const preview = designElements.logoPreview.querySelector("img");
        if (preview) { if (design.logo) preview.src = design.logo; else preview.removeAttribute("src"); }
        designElements.logoFields.classList.toggle("disabled", !design.logo);
        designElements.logoPosition.value = design.logoPosition;
        designElements.logoSize.value = design.logoSize;
        designElements.background.value = design.background;
        designElements.backgroundRemove.hidden = !design.backgroundImage;
        designElements.backgroundPreview.hidden = !design.backgroundImage;
        const bgPreview = designElements.backgroundPreview.querySelector("img");
        if (bgPreview) { if (design.backgroundImage) bgPreview.src = design.backgroundImage; else bgPreview.removeAttribute("src"); }
        designElements.backgroundFields.classList.toggle("disabled", !design.backgroundImage);
        designElements.backgroundFit.value = design.backgroundFit;
        designElements.pageNumber.checked = design.pageNumber;
        designElements.pageNumberAlign.value = design.pageNumberAlign;
        designElements.pageNumberFields.classList.toggle("disabled", !design.pageNumber);
        PG.syncColorPickers();
        designElements.panel.querySelectorAll("input,select,button").forEach((control) => {
            if (control === designElements.reset || control === designElements.scopeStep) return;
            control.disabled = !session;
        });
    }

    function setDesignScope(scope) {
        designScope = scope === "step" && currentStep() ? "step" : "guide";
        syncDesignPanel();
    }

    /** 範囲（ガイド／手順）に応じてデザインを部分的に変更します（履歴に残り、Ctrl+Z で戻せます）。 */
    function updateDesign(patch, coalesceKey) {
        if (!session) return;
        pushHistory(coalesceKey || "");
        if (designScope === "step") {
            // 手順の上書きは「変えた項目だけ」を持ちます。ガイド側を後で変えても、触っていない項目は追従します。
            const step = currentStep();
            if (!step) return;
            step.design = { ...(step.design || {}), ...(patch || {}) };
        } else {
            session.design = PG.normalizeDesign({ ...effectiveDesign(), ...(patch || {}) });
        }
        scheduleSave();
        syncDesignPanel();
        syncDesignChrome();
        updateHistoryButtons();
    }

    function resetDesign() {
        if (!session) return;
        if (designScope === "step") {
            const step = currentStep();
            if (!step?.design) return;
            pushHistory();
            step.design = null;
            setSaveState("この手順のデザインをガイド全体の設定に戻しました", "#1b5e20");
        } else {
            if (!session.design) return;
            pushHistory();
            session.design = null;
            setSaveState("デザインを詳細設定の既定に戻しました", "#1b5e20");
        }
        scheduleSave();
        syncDesignPanel();
        syncDesignChrome();
        updateHistoryButtons();
    }

    function dataUrlBytes(dataUrl) {
        const comma = String(dataUrl || "").indexOf(",");
        if (comma < 0) return 0;
        const body = dataUrl.slice(comma + 1);
        const padding = body.endsWith("==") ? 2 : body.endsWith("=") ? 1 : 0;
        return Math.max(0, Math.floor(body.length * 3 / 4) - padding);
    }

    function loadImageElement(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("画像を読み込めませんでした"));
            image.src = src;
        });
    }

    /**
     * 画像ファイルを保存用の data URL にします。長辺 maxSide px・maxBytes を上限に自動で縮小し、
     * PNG・JPEG 以外（SVG・GIF・WebP）は PowerPoint／Word で確実に開ける PNG に変換します。
     */
    async function prepareImageFile(file, maxSide, maxBytes) {
        if (!file || !String(file.type || "").startsWith("image/")) throw new Error("画像ファイルを選んでください");
        const original = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("ファイルを読み込めませんでした"));
            reader.readAsDataURL(file);
        });
        const image = await loadImageElement(original);
        const width = image.naturalWidth || image.width || 1;
        const height = image.naturalHeight || image.height || 1;
        const keepAsIs = (file.type === "image/png" || file.type === "image/jpeg")
            && file.size <= maxBytes && Math.max(width, height) <= maxSide;
        if (keepAsIs) return { dataUrl: original, resized: false };
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("画像を変換できませんでした");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let dataUrl = canvas.toDataURL("image/png");
        if (dataUrlBytes(dataUrl) > maxBytes) {
            // 透過を捨てて JPEG にすると大きく減ります（白背景で合成）。
            const flat = document.createElement("canvas");
            flat.width = canvas.width;
            flat.height = canvas.height;
            const flatContext = flat.getContext("2d");
            if (flatContext) {
                flatContext.fillStyle = "#ffffff";
                flatContext.fillRect(0, 0, flat.width, flat.height);
                flatContext.drawImage(canvas, 0, 0);
                let quality = .85;
                dataUrl = flat.toDataURL("image/jpeg", quality);
                while (dataUrlBytes(dataUrl) > maxBytes && quality > .4) {
                    quality -= .15;
                    dataUrl = flat.toDataURL("image/jpeg", quality);
                }
            }
        }
        return { dataUrl, resized: true };
    }

    function prepareLogo(file) {
        return prepareImageFile(file, LOGO_MAX_SIDE, LOGO_MAX_BYTES);
    }

    async function importLogo(file) {
        if (!session || !file) return;
        try {
            const result = await prepareLogo(file);
            updateDesign({ logo: result.dataUrl });
            setSaveState(result.resized ? "ロゴを取り込みました（500KB以内に自動で縮小）" : "ロゴを取り込みました", "#1b5e20");
        } catch (error) {
            setSaveState(PG.cleanText(error?.message || "ロゴを取り込めませんでした", 120), "#b42318");
        }
    }

    async function importBackgroundImage(file) {
        if (!session || !file) return;
        try {
            const result = await prepareImageFile(file, BACKGROUND_MAX_SIDE, BACKGROUND_MAX_BYTES);
            updateDesign({ backgroundImage: result.dataUrl });
            setSaveState(result.resized ? "テンプレート画像を取り込みました（1MB以内に自動で縮小）" : "テンプレート画像を取り込みました", "#1b5e20");
        } catch (error) {
            setSaveState(PG.cleanText(error?.message || "テンプレート画像を取り込めませんでした", 120), "#b42318");
        }
    }

    /** 出力1ページ単位の「n / N」。非表示の手順とセクション見出しページは数えません。 */
    function currentSheetNumber() {
        const steps = visibleSteps();
        const perPage = Math.max(1, layoutOf().perPage);
        const position = steps.findIndex((step) => step.id === selectedStepId);
        const total = Math.max(1, Math.ceil(steps.length / perPage));
        return { number: position < 0 ? 1 : Math.floor(position / perPage) + 1, total };
    }

    function currentSectionTitle() {
        const index = (session?.steps || []).findIndex((step) => step?.id === selectedStepId);
        if (index < 0) return "";
        return sectionRangeOfIndex(index)?.section?.title || "";
    }

    /** CSS の背景画像指定（テンプレート画像）。合わせ方に応じて background-size を切り替えます。 */
    function backgroundImageCss(design) {
        if (!design?.backgroundImage) return "";
        const size = design.backgroundFit === "cover" ? "cover" : design.backgroundFit === "contain" ? "contain" : "100% 100%";
        return `background-image:url(${design.backgroundImage});background-size:${size};background-position:center;background-repeat:no-repeat;`;
    }

    /* ---- キャンバスのズーム（v0.6.36）：Ctrl＋マウスホイールで拡大縮小、Ctrl＋0 で 100% ---- */
    const ZOOM_STEPS = [.5, .67, .8, 1, 1.25, 1.5, 2, 3, 4];
    let canvasZoom = 1;

    function setCanvasZoom(next, anchor) {
        const value = ZOOM_STEPS.reduce((best, step) => (Math.abs(step - next) < Math.abs(best - next) ? step : best), 1);
        if (value === canvasZoom) return;
        const stage = elements.canvasStage;
        const canvas = elements.canvas;
        // 拡大の中心（マウス位置）がずれないように、キャンバス上の相対位置を覚えておきます。
        const before = canvas.getBoundingClientRect();
        const rx = anchor && before.width ? PG.clamp((anchor.x - before.left) / before.width, 0, 1) : .5;
        const ry = anchor && before.height ? PG.clamp((anchor.y - before.top) / before.height, 0, 1) : .5;
        canvasZoom = value;
        syncDesignChrome();
        if (anchor) {
            const after = canvas.getBoundingClientRect();
            stage.scrollLeft += (after.left + rx * after.width) - anchor.x;
            stage.scrollTop += (after.top + ry * after.height) - anchor.y;
        }
        if (editingAnnotationId) closeTextEditor(true);
    }

    function syncZoomBadge() {
        const badge = designElements.zoomBadge;
        const zoomed = canvasZoom !== 1 && !elements.canvas.hidden;
        if (badge) {
            badge.hidden = !zoomed;
            badge.textContent = `${Math.round(canvasZoom * 100)}%`;
        }
        // 上部の赤い「画像拡大リセット」（v0.6.36 追補）：Ctrl＋ホイールで拡大しているときだけ出します。
        if (elements.zoomResetButton) {
            elements.zoomResetButton.hidden = !zoomed;
            elements.zoomResetButton.textContent = `画像拡大リセット（${Math.round(canvasZoom * 100)}%）`;
        }
    }

    /**
     * 編集画面のキャンバスの周りに「ページ」を描きます。帯・ロゴ・ページ番号は画像の外側の余白に置くので、
     * その分だけキャンバスを縮めて、ページ全体が表示領域に収まるようにします。
     * ズーム（Ctrl＋ホイール）はこの大きさに倍率を掛けます。デザインが無く 100% のとき（既定）は何も変えません。
     */
    function syncDesignChrome() {
        const sheet = designElements.sheet;
        if (!sheet || !elements.canvas) return;
        const canvas = elements.canvas;
        const stage = elements.canvasStage;
        const design = designFor(currentStep());
        const hasChrome = Boolean(session) && PG.designHasChrome(design);
        syncZoomBadge();
        if (canvas.hidden || !session || (!hasChrome && canvasZoom === 1)) {
            sheet.hidden = true;
            canvas.style.width = "";
            canvas.style.height = "";
            canvas.style.margin = "";
            canvas.style.maxWidth = "";
            canvas.style.maxHeight = "";
            stage.classList.remove("zoomed");
            return;
        }
        const stageStyle = getComputedStyle(stage);
        const availableW = Math.max(40, stage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight));
        const availableH = Math.max(40, stage.clientHeight - parseFloat(stageStyle.paddingTop) - parseFloat(stageStyle.paddingBottom));
        const aspect = Math.max(1, canvas.height) / Math.max(1, canvas.width);
        const metrics = hasChrome ? PG.designMetrics(design) : { top: 0, bottom: 0, header: 0, logo: 0, logoTop: false, logoBottom: false };
        const padRatio = hasChrome ? .025 : 0;
        // ズーム 100% の基準。デザインがあるときはページ全体が収まる大きさ、無いときは従来の CSS
        // （max-width:100% ＝ 幅に合わせる。高さは超えたらスクロール）と同じにします。
        // ここを揃えないと、拡大したのに縮んで見えます（v0.6.36 で修正）。
        const fitW = hasChrome
            ? Math.min(availableW / (1 + padRatio * 2), availableH / (aspect + metrics.top + metrics.bottom + padRatio * 2))
            : Math.min(availableW, canvas.width);
        const pageW = Math.max(20, Math.floor(fitW * canvasZoom));
        const pad = Math.round(pageW * padRatio);
        const topH = Math.round(pageW * metrics.top);
        const bottomH = Math.round(pageW * metrics.bottom);
        const imageH = Math.round(pageW * aspect);
        canvas.style.maxWidth = "none";
        canvas.style.maxHeight = "none";
        canvas.style.width = `${pageW}px`;
        canvas.style.height = `${imageH}px`;
        canvas.style.margin = `${topH + pad}px ${pad}px ${bottomH + pad}px ${pad}px`;
        // 表示領域より大きいときは中央寄せをやめて、左上からスクロールで見られるようにします。
        stage.classList.toggle("zoomed", pageW + pad * 2 > availableW || imageH + topH + bottomH + pad * 2 > availableH);
        if (!hasChrome) { sheet.hidden = true; return; }
        const left = canvas.offsetLeft - pad;
        const top = canvas.offsetTop - topH - pad;
        const sheetW = pageW + pad * 2;
        const sheetH = imageH + topH + bottomH + pad * 2;
        sheet.hidden = false;
        sheet.style.left = `${left}px`;
        sheet.style.top = `${top}px`;
        sheet.style.width = `${sheetW}px`;
        sheet.style.height = `${sheetH}px`;
        sheet.style.background = design.background;
        if (design.backgroundImage) {
            sheet.style.backgroundImage = `url(${design.backgroundImage})`;
            sheet.style.backgroundSize = design.backgroundFit === "cover" ? "cover" : design.backgroundFit === "contain" ? "contain" : "100% 100%";
            sheet.style.backgroundPosition = "center";
            sheet.style.backgroundRepeat = "no-repeat";
        }
        // ヘッダー帯
        const band = designElements.band;
        const headerH = Math.round(pageW * metrics.header);
        band.hidden = !design.headerEnabled;
        if (design.headerEnabled) {
            band.style.left = `${pad}px`;
            band.style.top = `${pad}px`;
            band.style.width = `${pageW}px`;
            band.style.height = `${headerH}px`;
            band.style.background = PG.designBandCss(design);
            band.style.color = design.headerTextColor;
            band.style.fontSize = `${Math.max(8, Math.round(headerH * .42))}px`;
            const logoOnBandSide = design.logo && metrics.logoTop;
            band.style.paddingLeft = logoOnBandSide && design.logoPosition === "tl" ? `${Math.round(pageW * metrics.logo * 1.4) + pad}px` : "";
            band.style.paddingRight = logoOnBandSide && design.logoPosition === "tr" ? `${Math.round(pageW * metrics.logo * 1.4) + pad}px` : "";
            designElements.bandText.textContent = PG.designHeaderLabel(design, { title: session.title, section: currentSectionTitle() });
        }
        // ロゴ（四隅のいずれか。上なら帯と同じ段、下ならページ番号と同じ段）
        const logo = designElements.logoImage;
        logo.hidden = !design.logo;
        if (design.logo) {
            if (logo.getAttribute("src") !== design.logo) logo.src = design.logo;
            const logoH = Math.round(pageW * metrics.logo);
            const logoW = Math.round(logoH * 3);
            const rowH = metrics.logoTop ? topH : bottomH;
            const rowTop = metrics.logoTop ? pad : pad + topH + imageH;
            logo.style.height = `${logoH}px`;
            logo.style.width = `${logoW}px`;
            logo.style.top = `${rowTop + Math.max(0, Math.round((rowH - logoH) / 2))}px`;
            const isLeft = design.logoPosition === "tl" || design.logoPosition === "bl";
            logo.style.left = isLeft ? `${pad + Math.round(pageW * .012)}px` : "";
            logo.style.right = isLeft ? "" : `${pad + Math.round(pageW * .012)}px`;
            logo.style.objectPosition = isLeft ? "left center" : "right center";
        }
        // ページ番号
        const foot = designElements.foot;
        foot.hidden = !design.pageNumber;
        if (design.pageNumber) {
            const footH = Math.round(pageW * PG.DESIGN_FOOT_RATIO);
            foot.style.left = `${pad}px`;
            foot.style.width = `${pageW}px`;
            foot.style.top = `${pad + topH + imageH + Math.max(0, bottomH - footH)}px`;
            foot.style.height = `${footH}px`;
            foot.style.justifyContent = design.pageNumberAlign === "left" ? "flex-start" : design.pageNumberAlign === "right" ? "flex-end" : "center";
            foot.style.fontSize = `${Math.max(7, Math.round(footH * .5))}px`;
            const sheetNumber = currentSheetNumber();
            designElements.footText.textContent = `${sheetNumber.number} / ${sheetNumber.total}`;
        }
    }

    /** 出力（印刷・HTML・PPTX・Word・スライドショー）に渡すデザイン。何も設定が無ければ null。step 省略時はガイドのもの。 */
    function exportDesign(step) {
        const design = designFor(step);
        return PG.designHasChrome(design) ? design : null;
    }

    const imageAspectCache = new Map();
    async function imageAspectOf(dataUrl, fallback) {
        if (!dataUrl) return fallback;
        if (imageAspectCache.has(dataUrl)) return imageAspectCache.get(dataUrl);
        let aspect = fallback;
        try {
            const image = await loadImageElement(dataUrl);
            aspect = Math.max(.1, (image.naturalWidth || 1) / Math.max(1, image.naturalHeight || 1));
        } catch (_error) { aspect = fallback; }
        imageAspectCache.set(dataUrl, aspect);
        return aspect;
    }

    /** PowerPoint／Word 出力モジュールに渡す形（寸法の割合と、帯の固定文字・画像の縦横比を添えます）。 */
    async function officeDesignOf(design) {
        if (!design) return null;
        return {
            ...design,
            metrics: PG.designMetrics(design),
            footRatio: PG.DESIGN_FOOT_RATIO,
            logoAspect: await imageAspectOf(design.logo, 3),
            backgroundAspect: await imageAspectOf(design.backgroundImage, 16 / 9),
            label: design.headerText === "section" ? null : PG.designHeaderLabel(design, { title: session?.title || "" })
        };
    }

    async function officeDesign() {
        return officeDesignOf(exportDesign(null));
    }

    function setSidebarPanel(panel) {
        const design = panel === "design";
        document.querySelectorAll(".sidebar-tab").forEach((tab) => {
            const active = tab.dataset.panel === (design ? "design" : "steps");
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });
        elements.stepList.hidden = design;
        if (designElements.panel) designElements.panel.hidden = !design;
        const tools = document.querySelector(".sidebar-tools");
        if (tools) tools.hidden = design;
        if (design) syncDesignPanel();
    }

    if (designElements.panel) {
        fillChoiceSelect(designElements.headerSize, [...PG.DESIGN_SIZES, { id: "custom", label: "指定" }]);
        designElements.headerHeight.max = String(PG.DESIGN_HEADER_MAX_PX);
        fillChoiceSelect(designElements.headerText, PG.DESIGN_HEADER_TEXTS);
        fillChoiceSelect(designElements.logoPosition, PG.DESIGN_LOGO_POSITIONS);
        fillChoiceSelect(designElements.logoSize, PG.DESIGN_SIZES);
        fillChoiceSelect(designElements.backgroundFit, PG.DESIGN_BACKGROUND_FITS);
        fillChoiceSelect(designElements.pageNumberAlign, PG.FOOTER_ALIGNS);
        designPickers.headerColor = PG.attachColorPicker(designElements.headerColor);
        [designElements.headerTextColor, designElements.background].forEach((input) => PG.attachColorPicker(input));
        document.querySelectorAll(".sidebar-tab").forEach((tab) => tab.addEventListener("click", () => setSidebarPanel(tab.dataset.panel)));
        designElements.scopeGuide.addEventListener("click", () => setDesignScope("guide"));
        designElements.scopeStep.addEventListener("click", () => setDesignScope("step"));
        designElements.reset.addEventListener("click", resetDesign);
        designElements.headerEnabled.addEventListener("change", () => updateDesign({ headerEnabled: designElements.headerEnabled.checked }));
        designElements.headerColor.addEventListener("input", () => updateDesign({ headerColor: designElements.headerColor.value }, "design:headerColor"));
        designElements.headerColorNone.addEventListener("change", () => updateDesign({ headerColor: designElements.headerColorNone.checked ? "" : (PG.normalizeHexColor(designElements.headerColor.value, "#1b5e20")) }));
        designElements.headerSize.addEventListener("change", () => {
            const size = designElements.headerSize.value;
            if (size === "custom") { designElements.headerHeight.focus(); designElements.headerHeight.select?.(); return; }
            updateDesign({ headerHeight: PG.DESIGN_HEADER_PX[size], headerSize: size });
        });
        designElements.headerHeight.addEventListener("input", () => {
            const value = Number(designElements.headerHeight.value);
            if (!Number.isFinite(value) || value < 1) return;   // 入力途中（空欄など）は待つ
            updateDesign({ headerHeight: PG.normalizeHeaderHeight(value, "sm") }, "design:headerHeight");
        });
        designElements.headerHeight.addEventListener("blur", () => syncDesignPanel());
        designElements.headerText.addEventListener("change", () => {
            updateDesign({ headerText: designElements.headerText.value });
            if (designElements.headerText.value === "custom") designElements.headerCustom.focus();
        });
        designElements.headerCustom.addEventListener("input", () => updateDesign({ headerCustom: designElements.headerCustom.value }, "design:headerCustom"));
        designElements.headerTextColor.addEventListener("input", () => updateDesign({ headerTextColor: designElements.headerTextColor.value }, "design:headerTextColor"));
        designElements.logoPick.addEventListener("click", () => designElements.logoFile.click());
        designElements.logoFile.addEventListener("change", (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            importLogo(file);
        });
        designElements.logoRemove.addEventListener("click", () => updateDesign({ logo: "" }));
        designElements.logoPosition.addEventListener("change", () => updateDesign({ logoPosition: designElements.logoPosition.value }));
        designElements.logoSize.addEventListener("change", () => updateDesign({ logoSize: designElements.logoSize.value }));
        designElements.background.addEventListener("input", () => updateDesign({ background: designElements.background.value }, "design:background"));
        designElements.backgroundPick.addEventListener("click", () => designElements.backgroundFile.click());
        designElements.backgroundFile.addEventListener("change", (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            importBackgroundImage(file);
        });
        designElements.backgroundRemove.addEventListener("click", () => updateDesign({ backgroundImage: "" }));
        designElements.backgroundFit.addEventListener("change", () => updateDesign({ backgroundFit: designElements.backgroundFit.value }));
        designElements.pageNumber.addEventListener("change", () => updateDesign({ pageNumber: designElements.pageNumber.checked }));
        designElements.pageNumberAlign.addEventListener("change", () => updateDesign({ pageNumberAlign: designElements.pageNumberAlign.value }));
        if (typeof ResizeObserver === "function" && elements.canvasStage) {
            new ResizeObserver(() => { if (!designElements.sheet?.hidden || canvasZoom !== 1 || PG.designHasChrome(designFor(currentStep()))) syncDesignChrome(); }).observe(elements.canvasStage);
        }
        // Ctrl＋マウスホイールで拡大縮小（ブラウザ全体のズームは抑止）。通常のホイールはそのままスクロール。
        elements.canvasStage?.addEventListener("wheel", (event) => {
            if (!(event.ctrlKey || event.metaKey) || elements.canvas.hidden || !session) return;
            event.preventDefault();
            const index = ZOOM_STEPS.indexOf(canvasZoom);
            const nextIndex = PG.clamp((index < 0 ? ZOOM_STEPS.indexOf(1) : index) + (event.deltaY < 0 ? 1 : -1), 0, ZOOM_STEPS.length - 1);
            setCanvasZoom(ZOOM_STEPS[nextIndex], { x: event.clientX, y: event.clientY });
        }, { passive: false });
        designElements.zoomBadge?.addEventListener("click", () => setCanvasZoom(1));
        syncDesignPanel();
    }

    /* ---- スライドショー（v0.6.31）：PowerPoint と同じ操作感の全画面プレゼン ---- */
    const show = {
        active: false, index: 0, steps: [], ended: false, blank: null, grid: false, typed: "",
        images: new Map(), navTimer: 0, cursorTimer: 0, jumpTimer: 0,
        // v0.6.43：レーザー切替・ペン・発表者ビュー
        laser: false, trail: [], trailRaf: 0, pen: false, inking: false, startedAt: 0, presenter: null, channel: null
    };
    const showRoot = document.getElementById("slideshow");

    /* ---- レーザーポインター（L で切替）：カーソルを隠し、赤い点と軽い残像を描きます（v0.6.43） ---- */
    function setLaser(on) {
        show.laser = Boolean(on);
        showRoot.classList.toggle("laser-on", show.laser);
        const trail = showElement("slideLaserTrail");
        if (trail) trail.hidden = !show.laser;
        if (!show.laser) { showElement("slideLaser").hidden = true; show.trail = []; clearLaserTrail(); }
        syncShowNavButtons();
    }
    function clearLaserTrail() {
        const trail = showElement("slideLaserTrail");
        const context = trail?.getContext?.("2d");
        if (context) context.clearRect(0, 0, trail.width, trail.height);
    }
    function fitOverlayCanvas(canvas) {
        if (!canvas) return null;
        const rect = showRoot.getBoundingClientRect();
        const ratio = Math.max(1, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.round(rect.width * ratio));
        const h = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        return ratio;
    }
    /** レーザーの残像を残す時間（ミリ秒）。詳細設定「レーザーポインターの残像」。0＝なし（既定・v0.6.46）。 */
    function laserTrailMs() {
        return PG.normalizeLaserTrail(appSettings.laserTrail);
    }
    function pushLaserPoint(x, y) {
        if (laserTrailMs() <= 0) return;
        show.trail.push({ x, y, at: performance.now() });
        if (show.trail.length > 90) show.trail.shift();
        if (!show.trailRaf) show.trailRaf = requestAnimationFrame(drawLaserTrail);
    }
    function drawLaserTrail() {
        show.trailRaf = 0;
        const trail = showElement("slideLaserTrail");
        if (!trail || !show.laser) return;
        const ratio = fitOverlayCanvas(trail);
        const context = trail.getContext("2d");
        context.clearRect(0, 0, trail.width, trail.height);
        const now = performance.now();
        const keep = laserTrailMs();
        const points = keep > 0 ? show.trail.filter((point) => now - point.at < keep) : [];
        show.trail = points;
        for (let i = 1; i < points.length; i += 1) {
            const age = (now - points[i].at) / keep;
            context.strokeStyle = `rgba(255,40,40,${(1 - age) * .55})`;
            context.lineWidth = (1 - age) * 9 * ratio + 2;
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(points[i - 1].x * ratio, points[i - 1].y * ratio);
            context.lineTo(points[i].x * ratio, points[i].y * ratio);
            context.stroke();
        }
        if (points.length) show.trailRaf = requestAnimationFrame(drawLaserTrail);
    }

    /* ---- ペン（Ctrl＋P で切替）：スライドショー中の一時的な書き込み。次のスライドで消えます（v0.6.43） ---- */
    function setPen(on) {
        show.pen = Boolean(on);
        showRoot.classList.toggle("pen-on", show.pen);
        if (show.pen) { setLaser(false); fitOverlayCanvas(showElement("slideInk")); }
        show.inking = false;
        syncShowNavButtons();
    }
    function clearInk() {
        const ink = showElement("slideInk");
        const context = ink?.getContext?.("2d");
        if (context) context.clearRect(0, 0, ink.width, ink.height);
    }
    function inkPoint(event) {
        const rect = showRoot.getBoundingClientRect();
        const ratio = Math.max(1, window.devicePixelRatio || 1);
        return { x: (event.clientX - rect.left) * ratio, y: (event.clientY - rect.top) * ratio, ratio };
    }
    function syncShowNavButtons() {
        showRoot?.querySelector('button[data-show="laser"]')?.classList.toggle("on", show.laser);
        showRoot?.querySelector('button[data-show="pen"]')?.classList.toggle("on", show.pen);
        showRoot?.querySelector('button[data-show="presenter"]')?.classList.toggle("on", Boolean(show.presenter && !show.presenter.closed));
    }

    /* ---- 発表者ビュー（S）：別ウィンドウに発表者ノート・次の手順・経過時間を出します（v0.6.43） ---- */
    function presenterChannel() {
        if (show.channel) return show.channel;
        try {
            show.channel = new BroadcastChannel("tadoru-presenter");
            show.channel.onmessage = (event) => {
                const data = event?.data || {};
                if (!show.active) return;
                if (data.type === "nav") {
                    if (data.action === "next") nextSlide();
                    else if (data.action === "prev") prevSlide();
                    else if (data.action === "end") endSlideshow();
                } else if (data.type === "ready") {
                    broadcastPresenter();
                }
            };
        } catch (_error) { show.channel = null; }
        return show.channel;
    }
    function openPresenter() {
        const channel = presenterChannel();
        if (!channel) { setSaveState("この環境では発表者ビューを開けません", "#b42318"); return; }
        if (show.presenter && !show.presenter.closed) { try { show.presenter.focus(); } catch (_error) { /* noop */ } broadcastPresenter(); return; }
        show.presenter = window.open(chrome.runtime.getURL("presenter.html"), "tadoru-presenter", "popup=yes,width=980,height=640");
        syncShowNavButtons();
        setTimeout(broadcastPresenter, 600);
    }
    async function broadcastPresenter() {
        const channel = show.channel;
        if (!channel || !show.active) return;
        const step = show.steps[show.index];
        const next = show.steps[show.index + 1];
        const stepNumber = show.steps.slice(0, show.index + 1).filter((item) => !item.sectionTitle).length;
        const payload = {
            type: "state",
            index: show.index,
            total: show.steps.length,
            title: step ? (step.coverSlide ? (session?.title || "") : PG.cleanText(step.description, 300) || (step.sectionTitle ? "セクション" : `手順 ${stepNumber}`)) : "",
            notes: step?.notes || "",
            nextTitle: next ? (next.coverSlide ? (session?.title || "") : PG.cleanText(next.description, 300)) : "",
            nextNotes: next?.notes || "",
            image: step ? await slideImage(step) : null,
            nextImage: next ? await slideImage(next) : null,
            startedAt: show.startedAt,
            ended: show.ended,
            guideTitle: session?.title || ""
        };
        try { channel.postMessage(payload); } catch (_error) { /* 画像が大きすぎる等。文字だけ送り直します */
            try { channel.postMessage({ ...payload, image: null, nextImage: null }); } catch (_ignored) { /* noop */ }
        }
    }

    /** 手順の画像（注釈込み）を data URL にして返します。同じ回のスライドショー中はキャッシュします。 */
    async function slideImage(step) {
        if (!step?.screenshot || step.sectionTitle) return null;
        const key = step.id;
        if (show.images.has(key)) return show.images.get(key);
        const canvas = await buildStepCanvas(step, false, false);
        const url = canvas ? canvas.toDataURL("image/png") : null;
        show.images.set(key, url);
        return url;
    }

    function showElement(id) { return document.getElementById(id); }

    async function renderSlide() {
        if (!show.active) return;
        const step = show.steps[show.index];
        const total = show.steps.length;
        showElement("slideEnd").hidden = !show.ended;
        showElement("slideBlank").hidden = !show.blank;
        showElement("slideBlank").classList.toggle("white", show.blank === "white");
        showElement("slideGrid").hidden = !show.grid;
        if (!step) return;
        const isSection = Boolean(step.sectionTitle);
        const isCover = Boolean(step.coverSlide);
        showRoot.classList.toggle("section-slide", isSection && !isCover);
        showRoot.classList.toggle("cover-slide", isCover);
        const coverMeta = showElement("slideCoverMeta");
        if (coverMeta) {
            coverMeta.hidden = !isCover;
            if (isCover) {
                const c = step.coverSlide;
                coverMeta.replaceChildren();
                if (c.confidentialityLabel) { const mark = document.createElement("div"); mark.className = "cover-mark"; mark.textContent = c.confidentialityLabel; coverMeta.appendChild(mark); }
                if (c.description) { const desc = document.createElement("p"); desc.className = "cover-description"; desc.textContent = c.description; coverMeta.appendChild(desc); }
                [["文書番号", c.number], ["版数", c.version], ["作成日", c.date], ["作成部署", c.department]].filter(([, value]) => value).forEach(([label, value]) => {
                    const row = document.createElement("div"); row.className = "cover-row";
                    const key = document.createElement("span"); key.textContent = label;
                    const val = document.createElement("span"); val.textContent = value;
                    row.append(key, val); coverMeta.appendChild(row);
                });
            }
        }
        // 手順番号は見出し画面を数えず、表示中の手順だけで振ります。
        const stepNumber = show.steps.slice(0, show.index + 1).filter((item) => !item.sectionTitle).length;
        showElement("slideNumber").textContent = isSection ? "" : String(stepNumber);
        showElement("slideNumber").hidden = isSection;
        showElement("slideTitle").textContent = PG.cleanText(step.description, 300) || (isSection ? "セクション" : `手順 ${stepNumber}`);
        showElement("slideCounter").textContent = `${show.index + 1} / ${total}`;
        const footer = footerSettings();
        showElement("slideFooterText").textContent = footer ? footer.text : (session?.title || "");
        syncSlideDesign(step);
        const image = showElement("slideImage");
        const noImage = showElement("slideNoImage");
        const url = await slideImage(step);
        if (!show.active || show.steps[show.index] !== step) return;
        if (url) { image.src = url; image.hidden = false; noImage.hidden = true; }
        else { image.removeAttribute("src"); image.hidden = true; noImage.hidden = isSection; }
        // 次のスライドを先に作っておくと、送ったときに待たされません。
        const next = show.steps[show.index + 1];
        if (next) slideImage(next);
        // ペンの書き込みはスライドごと（v0.6.43）。発表者ビューにも状態を送ります。
        clearInk();
        broadcastPresenter();
    }

    /** スライドショーの帯・ロゴ・背景色（v0.6.35）。デザインが無ければ従来の黒背景のままです。 */
    function syncSlideDesign(step) {
        const band = showElement("slideBand");
        const logo = showElement("slideLogo");
        if (!band || !logo) return;
        const design = exportDesign(step?.sectionTitle ? null : step);
        if (!design) {
            band.hidden = true;
            logo.hidden = true;
            showRoot.style.background = "";
            showRoot.classList.remove("light-bg");
            return;
        }
        const metrics = PG.designMetrics(design);
        showRoot.style.background = design.background;
        if (design.backgroundImage) {
            showRoot.style.backgroundImage = `url(${design.backgroundImage})`;
            showRoot.style.backgroundSize = design.backgroundFit === "cover" ? "cover" : design.backgroundFit === "contain" ? "contain" : "100% 100%";
            showRoot.style.backgroundPosition = "center";
            showRoot.style.backgroundRepeat = "no-repeat";
        }
        const rgb = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(design.background);
        const luminance = rgb ? (parseInt(rgb[1], 16) * .299 + parseInt(rgb[2], 16) * .587 + parseInt(rgb[3], 16) * .114) / 255 : 0;
        showRoot.classList.toggle("light-bg", luminance > .6);
        band.hidden = !design.headerEnabled;
        if (design.headerEnabled) {
            band.style.height = `${(metrics.header * 100).toFixed(2)}vw`;
            band.style.background = PG.designBandCss(design);
            band.style.color = design.headerTextColor;
            band.style.fontSize = `${(metrics.header * 100 * .42).toFixed(2)}vw`;
            const logoTopSide = design.logo && metrics.logoTop;
            band.style.paddingLeft = logoTopSide && design.logoPosition === "tl" ? `${(metrics.logo * 100 * 3.4).toFixed(2)}vw` : "";
            band.style.paddingRight = logoTopSide && design.logoPosition === "tr" ? `${(metrics.logo * 100 * 3.4).toFixed(2)}vw` : "";
            let section = step?.sectionTitle || "";
            if (!section && step?.id) {
                const index = (session?.steps || []).findIndex((item) => item?.id === step.id);
                section = index >= 0 ? (sectionRangeOfIndex(index)?.section?.title || "") : "";
            }
            showElement("slideBandText").textContent = PG.designHeaderLabel(design, { title: session?.title || "", section });
        }
        logo.hidden = !design.logo;
        if (design.logo) {
            if (logo.getAttribute("src") !== design.logo) logo.src = design.logo;
            const size = (metrics.logo * 100).toFixed(2);
            logo.style.height = `${size}vw`;
            logo.style.width = `${(metrics.logo * 300).toFixed(2)}vw`;
            const isLeft = design.logoPosition === "tl" || design.logoPosition === "bl";
            logo.style.left = isLeft ? "1vw" : "";
            logo.style.right = isLeft ? "" : "1vw";
            logo.style.objectPosition = isLeft ? "left center" : "right center";
            // 上：帯と同じ段（帯が無ければ画面の上端）。下：画面の下端。
            const rowH = metrics.logoTop ? metrics.top * 100 : metrics.bottom * 100;
            const offset = Math.max(0, (rowH - metrics.logo * 100) / 2).toFixed(2);
            logo.style.top = metrics.logoTop ? `${offset}vw` : "";
            logo.style.bottom = metrics.logoTop ? "" : `${offset}vw`;
        }
    }

    async function renderSlideGrid() {
        const grid = showElement("slideGrid");
        grid.replaceChildren();
        for (let index = 0; index < show.steps.length; index += 1) {
            const step = show.steps[index];
            const button = document.createElement("button");
            button.type = "button";
            button.className = index === show.index ? "current" : "";
            const url = await slideImage(step);
            if (url) { const img = document.createElement("img"); img.src = url; img.alt = ""; button.appendChild(img); }
            else { const empty = document.createElement("div"); empty.className = "slide-grid-empty"; empty.textContent = step.coverSlide ? "表紙" : step.sectionTitle ? "セクション" : "画像なし"; button.appendChild(empty); }
            const label = document.createElement("span");
            const num = document.createElement("b");
            num.textContent = String(index + 1);
            label.append(num, document.createTextNode(PG.cleanText(step.description, 120) || ""));
            button.appendChild(label);
            button.addEventListener("click", (event) => { event.stopPropagation(); show.grid = false; show.ended = false; goToSlide(index); });
            grid.appendChild(button);
        }
    }

    function goToSlide(index) {
        if (!show.steps.length) return;
        show.index = PG.clamp(Math.round(index), 0, show.steps.length - 1);
        show.ended = false;
        renderSlide();
    }

    function nextSlide() {
        if (show.blank) { show.blank = null; renderSlide(); return; }
        if (show.ended) { endSlideshow(); return; }
        if (show.index >= show.steps.length - 1) { show.ended = true; renderSlide(); return; }
        show.index += 1;
        renderSlide();
    }

    function prevSlide() {
        if (show.blank) { show.blank = null; renderSlide(); return; }
        if (show.ended) { show.ended = false; renderSlide(); return; }
        if (show.index > 0) show.index -= 1;
        renderSlide();
    }

    function toggleSlideGrid() {
        show.grid = !show.grid;
        if (show.grid) renderSlideGrid();
        renderSlide();
    }

    function toggleBlank(kind) {
        show.blank = show.blank === kind ? null : kind;
        renderSlide();
    }

    function revealSlideNav() {
        showRoot.classList.add("show-nav");
        showRoot.classList.remove("hide-cursor");
        clearTimeout(show.navTimer);
        show.navTimer = setTimeout(() => showRoot.classList.remove("show-nav"), 2600);
        clearTimeout(show.cursorTimer);
        show.cursorTimer = setTimeout(() => showRoot.classList.add("hide-cursor"), 3000);
    }

    async function startSlideshow(fromCurrent) {
        if (!visibleSteps().length) { setSaveState("スライドショーにする手順がありません（すべて非表示です）", "#b42318"); return; }
        if (editingAnnotationId) closeTextEditor(true);
        if (cropState) finishCrop();
        await saveNow();
        // 非表示の手順は外し、詳細設定が ON なら章タイトル画面を挟みます（v0.6.34）。
        show.steps = [];
        let pendingSection = null;
        (session.steps || []).forEach((step) => {
            if (step.section) pendingSection = sectionPageEnabled(step.section) ? step.section.title : null;   // v0.7.25：セクション個別の指定＞既定
            if (step.hidden) return;
            if (pendingSection) show.steps.push({ id: `section:${step.id}`, sectionTitle: pendingSection, description: pendingSection, screenshot: null });
            pendingSection = null;
            show.steps.push(step);
        });
        // 表紙（v0.6.43）：詳細設定「表紙ページを付ける」が ON なら最初に表紙を1枚入れます。
        if (appSettings.coverPage) show.steps.unshift({ id: "cover", coverSlide: coverData() || { title: session.title, description: session.description }, sectionTitle: session.title, description: session.title, screenshot: null });
        show.images.clear();
        const current = show.steps.findIndex((step) => step.id === selectedStepId);
        show.index = fromCurrent && current >= 0 ? current : 0;
        show.ended = false;
        show.blank = null;
        show.grid = false;
        show.typed = "";
        show.active = true;
        show.startedAt = Date.now();
        showRoot.hidden = false;
        showElement("slideLaser").hidden = true;
        setLaser(false);
        setPen(false);
        clearInk();
        revealSlideNav();
        renderSlide();
        try { await showRoot.requestFullscreen?.(); } catch (_error) { /* 全画面にできなくてもオーバーレイで続けます */ }
        showRoot.focus();
    }

    function endSlideshow() {
        if (!show.active) return;
        try { show.channel?.postMessage({ type: "end" }); } catch (_error) { /* noop */ }
        show.active = false;
        setLaser(false);
        setPen(false);
        clearInk();
        showRoot.hidden = true;
        showRoot.classList.remove("show-nav", "hide-cursor", "laser-on", "pen-on", "cover-slide");
        clearTimeout(show.navTimer);
        clearTimeout(show.cursorTimer);
        show.images.clear();
        if (document.fullscreenElement === showRoot) document.exitFullscreen?.().catch?.(() => {});
        // PowerPoint と同じく、終了時に見ていた手順を編集画面で選びます。
        const step = show.steps.slice(show.index).find((item) => !item.sectionTitle) || show.steps[show.index];
        if (step && !step.sectionTitle && step.id !== selectedStepId) selectStep(step.id);
    }

    document.getElementById("presentButton")?.addEventListener("click", (event) => startSlideshow(event.shiftKey));
    document.addEventListener("fullscreenchange", () => {
        // 全画面中に Esc を押すと Chrome が全画面だけを解除するので、ここでスライドショーも終えます。
        if (!show.active || document.fullscreenElement) return;
        // ただし発表者ビューが開いているときは終えません（v0.6.46）。別ウィンドウを開く・操作すると Chrome が全画面を解除するため、
        // ここで終えると発表者ビューの「次へ」などが効かなくなります。ウィンドウ表示のまま続け、終了は Esc か発表者ビューの「終了」で行います。
        if (show.presenter && !show.presenter.closed) { syncShowNavButtons(); return; }
        endSlideshow();
    });
    showRoot?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-show]");
        if (button) {
            event.stopPropagation();
            const action = button.dataset.show;
            if (action === "prev") prevSlide();
            else if (action === "next") nextSlide();
            else if (action === "grid") toggleSlideGrid();
            else if (action === "blank") toggleBlank("black");
            else if (action === "laser") setLaser(!show.laser);
            else if (action === "pen") setPen(!show.pen);
            else if (action === "presenter") openPresenter();
            else if (action === "end") endSlideshow();
            return;
        }
        if (show.grid || show.pen) return;
        nextSlide();
    });
    showRoot?.addEventListener("contextmenu", (event) => { event.preventDefault(); if (!show.grid) prevSlide(); });
    showRoot?.addEventListener("wheel", (event) => {
        if (show.grid) return;
        event.preventDefault();
        if (event.deltaY > 0) nextSlide(); else if (event.deltaY < 0) prevSlide();
    }, { passive: false });
    showRoot?.addEventListener("mousemove", (event) => {
        revealSlideNav();
        if (show.laser) showRoot.classList.remove("hide-cursor");
        // L で切り替えたレーザー、または Ctrl を押しながらの移動で赤い点を出します（Ctrl は PowerPoint の Ctrl＋ドラッグ相当）。
        const laser = showElement("slideLaser");
        if (show.laser || event.ctrlKey) {
            laser.hidden = false;
            laser.style.left = `${event.clientX}px`;
            laser.style.top = `${event.clientY}px`;
            if (show.laser) pushLaserPoint(event.clientX, event.clientY);
        } else laser.hidden = true;
    });
    document.addEventListener("keyup", (event) => { if (show.active && !show.laser && event.key === "Control") showElement("slideLaser").hidden = true; });
    // ペンの書き込み（v0.6.43）
    const ink = document.getElementById("slideInk");
    ink?.addEventListener("pointerdown", (event) => {
        if (!show.active || !show.pen) return;
        event.preventDefault(); event.stopPropagation();
        fitOverlayCanvas(ink);
        show.inking = true;
        ink.setPointerCapture?.(event.pointerId);
        const p = inkPoint(event);
        const context = ink.getContext("2d");
        context.strokeStyle = "#ff1a1a"; context.lineWidth = 4 * p.ratio; context.lineCap = "round"; context.lineJoin = "round";
        context.beginPath(); context.moveTo(p.x, p.y);
    });
    ink?.addEventListener("pointermove", (event) => {
        if (!show.inking) return;
        event.preventDefault();
        const p = inkPoint(event);
        const context = ink.getContext("2d");
        context.lineTo(p.x, p.y); context.stroke();
    });
    ["pointerup", "pointercancel"].forEach((type) => ink?.addEventListener(type, () => { show.inking = false; }));
    ink?.addEventListener("click", (event) => event.stopPropagation());
    ink?.addEventListener("contextmenu", (event) => { event.preventDefault(); event.stopPropagation(); });
    window.addEventListener("resize", () => { if (show.active) { fitOverlayCanvas(showElement("slideLaserTrail")); } });

    document.addEventListener("keydown", (event) => {
        if (!show.active) {
            // F5＝最初から、Shift+F5＝いまの手順から（PowerPoint と同じ）。ページの再読み込みは止めます。
            if (event.key === "F5" && !document.querySelector("dialog[open]")) { event.preventDefault(); startSlideshow(event.shiftKey); }
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const key = event.key;
        if (key === "Escape") { if (show.grid) { show.grid = false; renderSlide(); } else endSlideshow(); return; }
        if (/^[0-9]$/.test(key)) {
            // 番号を打って Enter で、その手順へ移動します。
            show.typed = (show.typed + key).slice(-4);
            const jump = showElement("slideJump");
            jump.textContent = `手順 ${show.typed} へ（Enter）`;
            jump.hidden = false;
            clearTimeout(show.jumpTimer);
            show.jumpTimer = setTimeout(() => { show.typed = ""; jump.hidden = true; }, 4000);
            return;
        }
        if (key === "Enter" && show.typed) {
            const target = Number(show.typed) - 1;
            show.typed = "";
            showElement("slideJump").hidden = true;
            show.grid = false;
            goToSlide(target);
            return;
        }
        if (["Enter", "ArrowRight", "ArrowDown", " ", "PageDown", "n", "N"].includes(key)) { if (!show.grid) nextSlide(); return; }
        if (["Backspace", "ArrowLeft", "ArrowUp", "PageUp"].includes(key) || ((key === "p" || key === "P") && !(event.ctrlKey || event.metaKey))) { if (!show.grid) prevSlide(); return; }
        if (key === "Home") { goToSlide(0); return; }
        if (key === "End") { goToSlide(show.steps.length - 1); return; }
        if (key === "b" || key === "B") { toggleBlank("black"); return; }
        if (key === "w" || key === "W") { toggleBlank("white"); return; }
        if (key === "g" || key === "G") { toggleSlideGrid(); return; }
        if (key === "l" || key === "L") { setLaser(!show.laser); return; }
        if ((key === "p" || key === "P") && (event.ctrlKey || event.metaKey)) { setPen(!show.pen); return; }
        if (key === "e" || key === "E") { clearInk(); return; }
        if (key === "s" || key === "S") { openPresenter(); return; }
    }, true);

    document.getElementById("previewButton").addEventListener("click", async () => {
        if (!elements.previewDialog.open) elements.previewDialog.showModal();
        await renderPreview();
        fitPreviewZoom();
    });
    window.addEventListener("resize", () => { if (elements.previewDialog.open) fitPreviewZoom(); });
    document.getElementById("exportButton").addEventListener("click", () => {
        elements.exportMenu.hidden = !elements.exportMenu.hidden;
        // 開くたびに、いまの手順数とページ指定の内容で表示を作り直します。
        if (!elements.exportMenu.hidden) syncLayoutControls();
    });
    elements.exportMenu.addEventListener("click", (event) => { const type = event.target?.dataset?.export; if (type) exportGuide(type); });
    document.addEventListener("click", (event) => {
        if (elements.layoutDialog?.open) return;
        if (!elements.exportMenu.contains(event.target) && event.target?.id !== "exportButton") elements.exportMenu.hidden = true;
        const viewMenu = document.getElementById("viewMenu");
        if (viewMenu && !viewMenu.contains(event.target) && event.target?.id !== "viewButton") { viewMenu.hidden = true; document.getElementById("viewButton")?.setAttribute("aria-expanded", "false"); }
    });

    /* ---- 表示メニュー（v0.6.44）：詳細設定「表示」のうち、編集中に切り替えたい項目を編集画面からも変えられます ---- */
    const VIEW_SETTING_KEYS = ["darkMode", "toolbarPinned", "coverPage", "tocPage"];
    function syncViewMenu() {
        document.querySelectorAll("#viewMenu input[data-setting]").forEach((input) => {
            const key = input.dataset.setting;
            if (!VIEW_SETTING_KEYS.includes(key)) return;
            input.checked = key === "toolbarPinned" ? appSettings.toolbarPinned !== false : Boolean(appSettings[key]);
        });
    }
    document.getElementById("viewButton")?.addEventListener("click", () => {
        const menu = document.getElementById("viewMenu");
        if (!menu) return;
        menu.hidden = !menu.hidden;
        document.getElementById("viewButton")?.setAttribute("aria-expanded", String(!menu.hidden));
        if (!menu.hidden) syncViewMenu();
    });
    document.getElementById("viewMenu")?.addEventListener("change", async (event) => {
        const key = event.target?.dataset?.setting;
        if (!VIEW_SETTING_KEYS.includes(key)) return;
        const checked = Boolean(event.target.checked);
        if (key === "toolbarPinned") { await setToolbarPinned(checked); return; }
        appSettings = { ...appSettings, [key]: checked };
        syncDarkMode();
        if (session) { syncDesignPanel(); syncDesignChrome(); }
        // 詳細設定と同じ保存先（pgSettings）に保存するので、詳細設定画面・次回起動時にも同じ状態になります。
        await message({ type: "PG_SAVE_SETTINGS", settings: appSettings });
    });
    document.getElementById("viewOpenOptions")?.addEventListener("click", () => { chrome.runtime.openOptionsPage(); const menu = document.getElementById("viewMenu"); if (menu) menu.hidden = true; });

    /* ---- 用紙の向き・カスタマイズ・ページ指定 ---- */
    elements.pageRangeMode?.addEventListener("change", () => {
        pageRange.mode = ["all", "current", "range", "section"].includes(elements.pageRangeMode.value) ? elements.pageRangeMode.value : "all";
        // セクションを選ぶ：最初は「いま選択中の手順が属する章」を選んでおきます（v0.7.16）
        if (pageRange.mode === "section" && !(pageRange.sections || []).length) {
            const number = currentPageNumber();
            const group = sectionGroups().find((item) => item.numbers.includes(number));
            if (group) pageRange.sections = [group.id];
        }
        syncLayoutControls();
        if (pageRange.mode === "range") elements.pageRangeInput?.focus();
    });
    elements.pageRangeInput?.addEventListener("input", () => {
        pageRange.text = elements.pageRangeInput.value;
        updatePageRangeSummary();
    });
    elements.layoutList?.addEventListener("click", (event) => {
        const card = event.target?.closest?.(".layout-card");
        if (!card) return;
        pendingLayoutId = card.dataset.layout;
        renderLayoutChoices();
    });
    elements.layoutApply?.addEventListener("click", () => {
        applyLayout(pendingLayoutId);
        elements.layoutDialog?.close();
        // 出力メニューへ戻します。document のクリック監視が先に閉じてしまうため、
        // このクリックが伝わりきってから開き直します。
        window.setTimeout(() => {
            elements.exportMenu.hidden = false;
            syncLayoutControls();
        }, 0);
    });
    elements.layoutDialog?.addEventListener("close", () => { syncLayoutControls(); });
    document.getElementById("importButton").addEventListener("click", () => document.getElementById("importInput").click());
    document.getElementById("importInput").addEventListener("change", (event) => importJson(event.target.files?.[0]));

    document.addEventListener("keydown", (event) => {
        const editing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "");
        if (cropState && !editing) {
            if (event.key === "Escape" || event.key === "Enter") { event.preventDefault(); finishCrop(); return; }
        }
        if (event.key === "Escape") { toggleColorPopover(false); closeCanvasMenu(); closeFrameResetMenu(); if (toolbarTemp) { toolbarTemp = false; syncToolbarPin(); } if (frameSelected) { frameSelected = false; drawCanvas(); } }
        if (!editing && !selectedAnnotationId && event.key === "Delete"
            && !document.querySelector("dialog[open]")
            && currentStep()?.screenshot) {
            // 手順の画像を削除します。確認ダイアログ付きの「画像を削除」ボタンと同じ動作です（v0.6.24）。
            event.preventDefault();
            document.getElementById("clearImage")?.click();
            return;
        }
        if (!editing && selectedAnnotationId && (event.key === "Delete" || event.key === "Backspace")) {
            event.preventDefault();
            elements.deleteAnnotation?.click();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "g") {
            event.preventDefault();
            if (event.shiftKey) ungroupSelection(); else groupSelection();
            return;
        }
        // コピー・切り取り・複製・書式（v0.6.32）。選択が無いときは通常の動作のままにします。
        if ((event.ctrlKey || event.metaKey) && !editing && !document.querySelector("dialog[open]")) {
            const key = event.key.toLowerCase();
            if (event.shiftKey && key === "c") { if (selectedAnnotationId) { event.preventDefault(); copyFormat(); } return; }
            if (event.shiftKey && key === "v") { if (selectedAnnotationId && formatClipboard) { event.preventDefault(); pasteFormat(); } return; }
            if (key === "c" && (selectedAnnotationId || frameSelected)) { event.preventDefault(); copySelection(false); return; }
            if (key === "x" && (selectedAnnotationId || frameSelected)) { event.preventDefault(); copySelection(true); return; }
            if (key === "d" && selectedAnnotationId) { event.preventDefault(); duplicateSelection(); return; }
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "0" && !editing) { event.preventDefault(); setCanvasZoom(1); return; }   // ズームを 100% に（v0.6.36）
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveNow(); }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); elements.undoButton.click(); }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); elements.redoButton.click(); }
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z") { event.preventDefault(); redoEdit(); }
        if ((event.ctrlKey || event.metaKey) && event.altKey && event.key.toLowerCase() === "z") { event.preventDefault(); undoStepChange(); }
        if ((event.ctrlKey || event.metaKey) && event.altKey && event.key.toLowerCase() === "y") { event.preventDefault(); redoStepChange(); }
    });
    window.addEventListener("beforeunload", () => { if (session && !recordingHere) chrome.runtime.sendMessage({ type: "PG_SAVE_SESSION", session }).catch(() => null); });

    document.getElementById("openMaskSetting")?.addEventListener("click", () => chrome.runtime.openOptionsPage());

    // ポップアップや詳細設定で言語を変えたとき、開いたままの編集タブにも即座に反映します。
    chrome.storage?.onChanged?.addListener((changes, area) => {
        if (area !== "local" || !changes.pgSettings) return;
        const next = PG.mergeSettings(changes.pgSettings.newValue);
        const changedLanguage = next.language !== appSettings.language;
        appSettings = next;
        syncToolbarPin();
        syncDarkMode();
        syncViewMenu();
        syncEngineBadge();
        // 詳細設定の「デザインの既定」が変わったら、既定を使っているガイドの表示に反映します。
        if (session) { syncDesignPanel(); syncDesignChrome(); }
        if (!changedLanguage) return;
        const I18N = globalThis.PrivacyGuideI18n;
        if (I18N) I18N.applyLanguage(I18N.resolveLanguage(next.language));
    });

    /** 編集画面のダークモード（v0.6.43）。詳細設定「表示の既定」の ON/OFF。撮影画像・出力物の色は変えません。 */
    function syncDarkMode() {
        document.body.classList.toggle("dark-mode", Boolean(appSettings.darkMode));
    }

    async function init() {
        const settingsResult = await message({ type: "PG_GET_SETTINGS" });
        appSettings = PG.mergeSettings(settingsResult?.settings);
        syncEngineBadge();
        const I18N = globalThis.PrivacyGuideI18n;
        if (I18N) I18N.applyLanguage(I18N.resolveLanguage(appSettings.language));
        loadStyle();
        syncToolbarPin();
        syncDarkMode();
        setTool("select");
        const requestedId = new URLSearchParams(location.search).get("id");
        if (requestedId) return loadSession(requestedId);
        const result = await message({ type: "PG_LIST_SESSIONS" });
        const first = result?.sessions?.[0];
        if (first?.id) return loadSession(first.id);
        elements.guideTitle.value = "ガイドがありません";
        elements.guideTitle.disabled = true;
        elements.guideDescription.disabled = true;
        setSaveState("拡張機能から記録を開始してください", "#8a8a8a", true);
        renderStepList();
        updateStepFields();
    }

    init();
})();
