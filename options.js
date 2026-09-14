(function () {
    "use strict";
    const PG = globalThis.PrivacyGuide;
    const ids = ["autoRedactFields", "ocrNames", "ocrAddresses","autoRedactEmail","autoRedactPhone","autoRedactPostalCode","autoRedactBirth","autoRedactNumbers","editableAutoMask","screenshotFormat","screenshotQuality","captureDelayMs","showCaptureNotice","includeUrls","recordTabSwitches", "resumeOpensUrl", "ocrAuto", "recordHover", "recordKeys", "recordScroll", "recordSelectValue", "descriptionStyle", "badgeStepCount", "watchScreenChanges", "cropWindowOnly", "targetColor", "targetSize", "textColor", "textSize", "textBorderOn", "textBorderWidth", "textBorderColor", "textBackgroundOn", "textBackgroundColor", "textBackgroundOpacity", "highlightColor", "highlightShape", "highlightDash", "highlightFillColor", "highlightFillOpacity", "footerEnabled", "footerText", "footerAlign", "showStepUrls", "sectionPages", "laserTrail", "coverPage", "tocPage", "darkMode", "arrowColor", "arrowSize", "penColor", "penSize", "highlighterColor", "highlighterSize", "highlighterOpacity", "fontFamily", "designHeaderEnabled", "designHeaderColor", "designHeaderOpacity", "designHeaderSize", "designHeaderHeight", "designHeaderText", "designHeaderCustom", "designHeaderTextColor", "designLogoPosition", "designLogoSize", "designBackground", "designBackgroundFit", "designPageNumber", "designPageNumberAlign", "toolbarPinned"];
    const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
    const saveState = document.getElementById("saveState");
    const saveBar = document.getElementById("saveBar");
    const qualityOutput = document.getElementById("qualityOutput");
    let savedSnapshot = "";
    let currentSettings = PG.mergeSettings();
    let statusTimer = 0;

    function setStatus(text, color, autoHide) {
        window.clearTimeout(statusTimer);
        saveState.textContent = text;
        saveState.style.color = color || "#737373";
        if (autoHide === false) return;
        statusTimer = window.setTimeout(() => {
            saveState.textContent = isDirty() ? "未保存の変更があります" : "";
            saveState.style.color = "";
        }, 3200);
    }

    function snapshot(settings) {
        return JSON.stringify(PG.mergeSettings(settings));
    }

    function isDirty() {
        try {
            return snapshot(readForm()) !== savedSnapshot;
        } catch (_error) {
            return false;
        }
    }

    let dirtyMessageShown = false;

    function syncDirty() {
        const dirty = isDirty();
        saveBar?.classList.toggle("dirty", dirty);
        if (dirty) {
            window.clearTimeout(statusTimer);
            saveState.textContent = "未保存の変更があります";
            saveState.style.color = "#b42318";
            dirtyMessageShown = true;
        } else if (dirtyMessageShown) {
            // 表示言語を切り替えると文字列が変わるため、テキスト比較ではなくフラグで判定します。
            saveState.textContent = "";
            saveState.style.color = "";
            dirtyMessageShown = false;
        }
    }

    async function message(payload) {
        try {
            const response = await chrome.runtime.sendMessage(payload);
            if (response?.error) throw new Error(response.error);
            return response || {};
        } catch (error) {
            setStatus(PG.cleanText(error?.message || "処理に失敗しました", 140), "#b42318", false);
            return {};
        }
    }

    function lines(value) {
        return String(value || "").split(/\r?\n/).map((line) => PG.cleanText(line, 300)).filter(Boolean);
    }

    function readForm() {
        // 画面に項目のない設定（撮影モードなど）を落とすと、保存済みの内容と食い違い
        // 「未保存の変更があります」が出っぱなしになるため、現在値の上に画面の値を重ねます。
        return PG.mergeSettings({
            ...currentSettings,
            autoRedactFields: elements.autoRedactFields.checked,
            autoRedactEmail: elements.autoRedactEmail.checked,
            autoRedactPhone: elements.autoRedactPhone.checked,
            autoRedactPostalCode: elements.autoRedactPostalCode.checked,
            autoRedactBirth: elements.autoRedactBirth?.checked,
            autoRedactNumbers: elements.autoRedactNumbers.checked,
            editableAutoMask: elements.editableAutoMask.checked,
            screenshotFormat: elements.screenshotFormat.value,
            screenshotQuality: elements.screenshotQuality.value,
            captureDelayMs: elements.captureDelayMs.value,
            showCaptureNotice: elements.showCaptureNotice.checked,
            includeUrls: elements.includeUrls.checked,
            recordTabSwitches: elements.recordTabSwitches.checked,
            recordHover: elements.recordHover?.checked,
            recordKeys: elements.recordKeys?.checked,
            recordScroll: elements.recordScroll?.checked,
            recordSelectValue: elements.recordSelectValue?.checked,
            descriptionStyle: elements.descriptionStyle?.value,
            badgeStepCount: elements.badgeStepCount?.checked,
            watchScreenChanges: elements.watchScreenChanges.checked,
            cropWindowOnly: elements.cropWindowOnly.checked,
            targetColor: elements.targetColor.value,
            targetSize: elements.targetSize.value,
            textColor: elements.textColor.value,
            textSize: elements.textSize.value,
            textBorderOn: elements.textBorderOn.checked,
            textBorderWidth: elements.textBorderWidth.value,
            textBorderColor: elements.textBorderColor.value,
            textBackgroundOn: elements.textBackgroundOn.checked,
            textBackgroundColor: elements.textBackgroundColor.value,
            textBackgroundOpacity: elements.textBackgroundOpacity.value,
            highlightColor: elements.highlightColor.value,
            highlightFillColor: elements.highlightFillColor.value,
            highlightFillOpacity: elements.highlightFillOpacity.value,
            footerEnabled: elements.footerEnabled.checked,
            footerText: elements.footerText.value,
            footerAlign: elements.footerAlign.value,
            laserTrail: elements.laserTrail?.value,
            ocrAuto: elements.ocrAuto?.checked,
            maskEngine: document.querySelector('input[name="maskEngine"]:checked')?.value,
            ocrNames: elements.ocrNames?.checked,
            ocrAddresses: elements.ocrAddresses?.checked,
            toolbarPinned: elements.toolbarPinned.checked,
            showStepUrls: elements.showStepUrls.checked,
            sectionPages: elements.sectionPages.checked,
            coverPage: elements.coverPage?.checked,
            tocPage: elements.tocPage?.checked,
            darkMode: elements.darkMode?.checked,
            highlightShape: elements.highlightShape.value,
            highlightDash: elements.highlightDash.value,
            arrowColor: elements.arrowColor.value,
            arrowSize: elements.arrowSize.value,
            penColor: elements.penColor.value,
            penSize: elements.penSize.value,
            highlighterColor: elements.highlighterColor.value,
            highlighterSize: elements.highlighterSize.value,
            highlighterOpacity: elements.highlighterOpacity.value,
            fontFamily: elements.fontFamily.value,
            designHeaderEnabled: elements.designHeaderEnabled.checked,
            designHeaderColor: document.getElementById("designHeaderColorNone")?.checked ? "" : elements.designHeaderColor.value,
            designHeaderOpacity: elements.designHeaderOpacity?.value,
            designHeaderSize: elements.designHeaderSize.value,
            designHeaderHeight: elements.designHeaderHeight.value,
            designHeaderText: elements.designHeaderText.value,
            designHeaderCustom: elements.designHeaderCustom.value,
            designHeaderTextColor: elements.designHeaderTextColor.value,
            designLogoPosition: elements.designLogoPosition.value,
            designLogoSize: elements.designLogoSize.value,
            designBackground: elements.designBackground.value,
            designBackgroundFit: elements.designBackgroundFit.value,
            designPageNumber: elements.designPageNumber.checked,
            designPageNumberAlign: elements.designPageNumberAlign.value,
            customTerms: lines(document.getElementById("customTerms").value),
            customSelectors: lines(document.getElementById("customSelectors").value),
            excludedUrls: lines(document.getElementById("excludedUrls")?.value || ""),
            language: document.getElementById("languageSelect")?.value || "system"
        });
    }

    function writeForm(settings) {
        const value = PG.mergeSettings(settings);
        Object.entries(elements).forEach(([id, element]) => {
            if (!element) return;
            if (element.type === "checkbox") element.checked = Boolean(value[id]);
            else if (id === "designHeaderColor") { if (value[id]) element.value = value[id]; }   // "" ＝色なし。色ボタンには直前の色を残す
            else element.value = value[id];
            // 選択肢に無い値（他の画面で保存された太さなど）は選択肢を足して、保存後に「未保存」が消えない状態を防ぎます。
            if (element.tagName === "SELECT" && element.value !== String(value[id]) && value[id] !== undefined && value[id] !== "") {
                const option = document.createElement("option");
                option.value = String(value[id]);
                option.textContent = String(value[id]);
                element.appendChild(option);
                element.value = String(value[id]);
            }
        });
        document.querySelectorAll('input[name="maskEngine"]').forEach((radio) => { radio.checked = radio.value === value.maskEngine; });
        const colorNone = document.getElementById("designHeaderColorNone");
        if (colorNone) colorNone.checked = !value.designHeaderColor;
        headerColorPicker?.button?.classList.toggle("is-none", !value.designHeaderColor);
        document.getElementById("customTerms").value = value.customTerms.join("\n");
        document.getElementById("customSelectors").value = value.customSelectors.join("\n");
        const excluded = document.getElementById("excludedUrls");
        if (excluded) excluded.value = (value.excludedUrls || []).join("\n");
        qualityOutput.textContent = `${value.screenshotQuality}%`;
        const opacitySlider = document.getElementById("textBackgroundOpacitySlider");
        if (opacitySlider) opacitySlider.value = String(value.textBackgroundOpacity);
        const fillOpacitySlider = document.getElementById("highlightFillOpacitySlider");
        if (fillOpacitySlider) fillOpacitySlider.value = String(value.highlightFillOpacity);
        const headerOpacitySlider = document.getElementById("designHeaderOpacitySlider");
        if (headerOpacitySlider) headerOpacitySlider.value = String(value.designHeaderOpacity);
        // 図形の塗りの濃さ：スライダーと数値入力を双方向に同期します（v0.6.26）。
        const fillSlider = document.getElementById("highlightFillOpacitySlider");
        fillSlider?.addEventListener("input", () => {
            if (elements.highlightFillOpacity) elements.highlightFillOpacity.value = fillSlider.value;
        });
        elements.highlightFillOpacity?.addEventListener("input", () => {
            const value = Math.min(100, Math.max(0, Number(elements.highlightFillOpacity.value) || 0));
            if (fillSlider) fillSlider.value = String(value);
        });
        const hlOpacitySlider = document.getElementById("highlighterOpacitySlider");
        if (hlOpacitySlider) hlOpacitySlider.value = String(value.highlighterOpacity);
        // ロゴ（v0.6.35）は画面の入力欄ではなく currentSettings.designLogo に持ちます。
        currentSettings.designLogo = value.designLogo || "";
        currentSettings.designBackgroundImage = value.designBackgroundImage || "";
        syncLogoPreview();
        syncFontSample();
        PG.syncColorPickers();
    }

    /* ---- デザインの既定：ロゴの取り込み（v0.6.35） ---- */
    const LOGO_MAX_BYTES = 500 * 1024;
    const LOGO_MAX_SIDE = 600;

    function syncLogoPreview() {
        [["designLogoPreview", "designLogoRemove", currentSettings.designLogo || ""],
         ["designBackgroundPreview", "designBackgroundRemove", currentSettings.designBackgroundImage || ""]].forEach(([previewId, removeId, dataUrl]) => {
            const preview = document.getElementById(previewId);
            const remove = document.getElementById(removeId);
            if (preview) { preview.hidden = !dataUrl; if (dataUrl) preview.src = dataUrl; else preview.removeAttribute("src"); }
            if (remove) remove.hidden = !dataUrl;
        });
    }

    function dataUrlBytes(dataUrl) {
        const comma = String(dataUrl || "").indexOf(",");
        if (comma < 0) return 0;
        const body = dataUrl.slice(comma + 1);
        const padding = body.endsWith("==") ? 2 : body.endsWith("=") ? 1 : 0;
        return Math.max(0, Math.floor(body.length * 3 / 4) - padding);
    }

    /** 長辺 maxSide px・maxBytes 以内に縮め、PNG・JPEG 以外は PNG に変換します（編集画面と同じ規則）。 */
    async function prepareImageFile(file, maxSide, maxBytes) {
        if (!file || !String(file.type || "").startsWith("image/")) throw new Error("画像ファイルを選んでください");
        const original = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("ファイルを読み込めませんでした"));
            reader.readAsDataURL(file);
        });
        const image = await new Promise((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(new Error("画像を読み込めませんでした"));
            element.src = original;
        });
        const width = image.naturalWidth || 1;
        const height = image.naturalHeight || 1;
        if ((file.type === "image/png" || file.type === "image/jpeg") && file.size <= maxBytes && Math.max(width, height) <= maxSide) {
            return { dataUrl: original, resized: false };
        }
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("画像を変換できませんでした");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let dataUrl = canvas.toDataURL("image/png");
        if (dataUrlBytes(dataUrl) > maxBytes) {
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

    document.getElementById("designLogoPick")?.addEventListener("click", () => document.getElementById("designLogoFile")?.click());
    document.getElementById("designLogoFile")?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        try {
            const result = await prepareImageFile(file, LOGO_MAX_SIDE, LOGO_MAX_BYTES);
            currentSettings.designLogo = result.dataUrl;
            syncLogoPreview();
            syncDirty();
            setStatus(result.resized ? "ロゴを取り込みました（500KB以内に自動で縮小）。保存を押すと既定になります" : "ロゴを取り込みました。保存を押すと既定になります", "#1b5e20", true);
        } catch (error) {
            setStatus(PG.cleanText(error?.message || "ロゴを取り込めませんでした", 120), "#b42318", true);
        }
    });
    document.getElementById("designLogoRemove")?.addEventListener("click", () => {
        currentSettings.designLogo = "";
        syncLogoPreview();
        syncDirty();
    });
    // テンプレート画像（v0.6.36）
    document.getElementById("designBackgroundPick")?.addEventListener("click", () => document.getElementById("designBackgroundFile")?.click());
    document.getElementById("designBackgroundFile")?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        try {
            const result = await prepareImageFile(file, 1920, 1024 * 1024);
            currentSettings.designBackgroundImage = result.dataUrl;
            syncLogoPreview();
            syncDirty();
            setStatus(result.resized ? "テンプレート画像を取り込みました（1MB以内に自動で縮小）。保存を押すと既定になります" : "テンプレート画像を取り込みました。保存を押すと既定になります", "#1b5e20", true);
        } catch (error) {
            setStatus(PG.cleanText(error?.message || "テンプレート画像を取り込めませんでした", 120), "#b42318", true);
        }
    });
    document.getElementById("designBackgroundRemove")?.addEventListener("click", () => {
        currentSettings.designBackgroundImage = "";
        syncLogoPreview();
        syncDirty();
    });

    /* ---- 表示の既定（選択肢の生成とフォント見本） ---- */
    const MARK_SIZES = [0.5, 1, 1.5, 2, 3, 4, 6, 8];
    const TEXT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

    function buildSizeSelect(select, sizes, standard) {
        if (!select || select.childElementCount) return;
        sizes.forEach((pt) => {
            const option = document.createElement("option");
            option.value = String(pt);
            option.textContent = pt === standard ? `${pt} pt（標準）` : `${pt} pt`;
            select.appendChild(option);
        });
    }

    /** 枠線の形・線種（v0.6.23）。選択肢は shared.js が一次情報です。 */
    function buildChoiceSelect(select, list) {
        if (!select || select.childElementCount) return;
        list.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.label;
            select.appendChild(option);
        });
    }

    function buildDisplayControls() {
        buildChoiceSelect(elements.highlightShape, PG.HIGHLIGHT_SHAPES);
        buildChoiceSelect(elements.highlightDash, PG.LINE_DASHES);
        buildChoiceSelect(elements.footerAlign, PG.FOOTER_ALIGNS);
        buildChoiceSelect(elements.laserTrail, PG.LASER_TRAILS);
        buildChoiceSelect(elements.descriptionStyle, PG.DESCRIPTION_STYLES);   // 説明文の語尾（v0.7.11）
        buildChoiceSelect(elements.designHeaderSize, [...PG.DESIGN_SIZES, { id: "custom", label: "指定" }]);
        if (elements.designHeaderHeight) elements.designHeaderHeight.max = String(PG.DESIGN_HEADER_MAX_PX);
        // 小／中／大 を選ぶと px を書き換え、px を直接打つと「指定」になります。
        elements.designHeaderSize?.addEventListener("change", () => {
            const size = elements.designHeaderSize.value;
            if (size === "custom") { elements.designHeaderHeight?.focus(); return; }
            if (elements.designHeaderHeight) elements.designHeaderHeight.value = String(PG.DESIGN_HEADER_PX[size] ?? PG.DESIGN_HEADER_PX.sm);
        });
        elements.designHeaderHeight?.addEventListener("input", () => {
            const value = Number(elements.designHeaderHeight.value);
            if (!Number.isFinite(value) || value < 1) return;
            if (elements.designHeaderSize) elements.designHeaderSize.value = PG.headerSizeFromHeight(Math.min(PG.DESIGN_HEADER_MAX_PX, Math.round(value)));
        });
        document.getElementById("designHeaderColorNone")?.addEventListener("change", (event) => {
            headerColorPicker?.button?.classList.toggle("is-none", event.target.checked);
        });
        // 色を選んだら「色なし」は自動で外します。
        elements.designHeaderColor?.addEventListener("input", () => {
            const none = document.getElementById("designHeaderColorNone");
            if (none) none.checked = false;
            headerColorPicker?.button?.classList.remove("is-none");
        });
        buildChoiceSelect(elements.designHeaderText, PG.DESIGN_HEADER_TEXTS);
        buildChoiceSelect(elements.designLogoPosition, PG.DESIGN_LOGO_POSITIONS);
        buildChoiceSelect(elements.designLogoSize, PG.DESIGN_SIZES);
        buildChoiceSelect(elements.designBackgroundFit, PG.DESIGN_BACKGROUND_FITS);
        buildChoiceSelect(elements.designPageNumberAlign, PG.FOOTER_ALIGNS);
        buildSizeSelect(elements.targetSize, MARK_SIZES, 2);
        buildSizeSelect(elements.arrowSize, MARK_SIZES, 2);
        buildSizeSelect(elements.textSize, TEXT_SIZES, 12);
        buildSizeSelect(elements.textBorderWidth, [0.5, 1, 1.5, 2, 3, 4], 1);
        buildSizeSelect(elements.penSize, MARK_SIZES, 2);
        buildSizeSelect(elements.highlighterSize, [4, 6, 8, 10, 12, 16], 8);
        // 蛍光ペンの濃さ：スライダーと数値入力を双方向に同期します。
        const hlSlider = document.getElementById("highlighterOpacitySlider");
        hlSlider?.addEventListener("input", () => {
            if (elements.highlighterOpacity) elements.highlighterOpacity.value = hlSlider.value;
        });
        elements.highlighterOpacity?.addEventListener("input", () => {
            const value = Math.min(100, Math.max(5, Number(elements.highlighterOpacity.value) || 5));
            if (hlSlider) hlSlider.value = String(value);
        });
        // ヘッダー帯の透過：スライダーと数値入力を双方向に同期します（v0.6.41）。
        const headerSlider = document.getElementById("designHeaderOpacitySlider");
        headerSlider?.addEventListener("input", () => {
            if (elements.designHeaderOpacity) elements.designHeaderOpacity.value = headerSlider.value;
        });
        elements.designHeaderOpacity?.addEventListener("input", () => {
            const value = Math.min(100, Math.max(0, Number(elements.designHeaderOpacity.value) || 0));
            if (headerSlider) headerSlider.value = String(value);
        });
        // 背景の透過：スライダーと数値入力を双方向に同期します。
        const opacitySlider = document.getElementById("textBackgroundOpacitySlider");
        opacitySlider?.addEventListener("input", () => {
            if (elements.textBackgroundOpacity) elements.textBackgroundOpacity.value = opacitySlider.value;
        });
        elements.textBackgroundOpacity?.addEventListener("input", () => {
            const value = Math.min(100, Math.max(0, Number(elements.textBackgroundOpacity.value) || 0));
            if (opacitySlider) opacitySlider.value = String(value);
        });
        if (elements.fontFamily && !elements.fontFamily.childElementCount) {
            Object.entries(PG.FONT_LABELS).forEach(([key, label]) => {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = key === PG.DEFAULT_SETTINGS.fontFamily ? `${label}（既定）` : label;
                option.style.fontFamily = PG.fontStack(key);
                elements.fontFamily.appendChild(option);
            });
        }
        elements.fontFamily?.addEventListener("change", syncFontSample);
    }

    function syncFontSample() {
        const sample = document.getElementById("fontSample");
        if (sample) sample.style.fontFamily = PG.fontStack(elements.fontFamily?.value);
    }

    /* ---- タブ切り替え ---- */
    const tabButtons = Array.from(document.querySelectorAll(".tab-button"));

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            tabButtons.forEach((item) => {
                const active = item === button;
                item.classList.toggle("active", active);
                item.setAttribute("aria-selected", String(active));
            });
            document.querySelectorAll(".tab-pane").forEach((pane) => {
                pane.classList.toggle("active", pane.id === button.dataset.tab);
            });
        });
    });

    /** 診断タブは普段は隠していますが、機能は残しています。
     *  詳細設定のURLの末尾に #diagnostics を付けて開くと表示されます。 */
    if (location.hash === "#diagnostics") {
        const diagnosticsTab = tabButtons.find((item) => item.dataset.tab === "tab-diagnostics");
        if (diagnosticsTab) {
            diagnosticsTab.hidden = false;
            diagnosticsTab.click();
        }
    }

    function markSaved(settings) {
        // 保存直後の画面そのものを基準にします（画面に載せられない値があっても「未保存」が残らないように）。
        try { savedSnapshot = snapshot(readForm()); } catch (_error) { savedSnapshot = snapshot(settings); }
        syncDirty();
    }

    // 言語セレクタ（システム / 日本語 / English）
    const languageSelect = document.getElementById("languageSelect");

    function applyLanguage(setting) {
        const I18N = globalThis.PrivacyGuideI18n;
        if (!I18N) return;
        I18N.applyLanguage(I18N.resolveLanguage(setting));
    }

    languageSelect?.addEventListener("change", async () => {
        const next = globalThis.PrivacyGuideI18n?.normalizeLanguage(languageSelect.value) || "system";
        applyLanguage(next);
        // 言語は他の設定と独立して即時保存します（保存ボタンを押さなくても反映）。
        const result = await message({ type: "PG_SAVE_SETTINGS", settings: { ...currentSettings, language: next } });
        if (result?.settings) {
            currentSettings = result.settings;
            markSaved(result.settings);
        }
    });

    document.getElementById("closeTab")?.addEventListener("click", () => {
        // 拡張機能のオプションはタブで開くため、その場で閉じます。
        chrome.tabs?.getCurrent?.((tab) => {
            if (tab?.id !== undefined) chrome.tabs.remove(tab.id);
            else window.close();
        });
        if (!chrome.tabs?.getCurrent) window.close();
    });

    // 他の画面で言語が変わったら、この画面のセレクタと表示も合わせます。
    chrome.storage?.onChanged?.addListener((changes, area) => {
        if (area !== "local" || !changes.pgSettings) return;
        const next = PG.mergeSettings(changes.pgSettings.newValue);
        if (next.language === (languageSelect?.value || currentSettings.language)) return;
        currentSettings = next;
        if (languageSelect) languageSelect.value = next.language || "system";
        applyLanguage(next.language);
        markSaved(next);
    });

    /* ---- ショートカットキー（Chrome管理）---- */
    async function loadShortcuts() {
        const summary = document.getElementById("shortcutSummary");
        if (!summary) return;
        const result = await message({ type: "PG_GET_SHORTCUTS" });
        const toggle = PG.cleanText(result?.shortcuts?.toggle, 60) || "未設定";
        const capture = PG.cleanText(result?.shortcuts?.capture, 60) || "未設定";
        summary.textContent = `記録の開始／終了：${toggle} ／ いまの画面を1枚撮る：${capture}`;
    }

    document.getElementById("openShortcuts")?.addEventListener("click", () => {
        // 拡張機能からは割当を書き換えられないため、Chromeの設定画面を開きます。
        chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    });

    // Chromeの設定画面で変更して戻ってきたときに、表示を最新にします。
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") loadShortcuts();
    });

    let headerColorPicker = null;

    async function load() {
        buildDisplayControls();
        // 色の選択は編集画面と同じパレットにします（v0.6.22）。
        headerColorPicker = PG.attachColorPicker(elements.designHeaderColor);
        PG.upgradeColorInputs(document);
        loadShortcuts();
        const result = await message({ type: "PG_GET_SETTINGS" });
        currentSettings = PG.mergeSettings(result?.settings);
        if (languageSelect) languageSelect.value = currentSettings.language || "system";
        applyLanguage(currentSettings.language);
        writeForm(result?.settings);
        markSaved(result?.settings);
        setStatus("設定を読み込みました", "#737373");
    }

    elements.screenshotQuality.addEventListener("input", () => { qualityOutput.textContent = `${elements.screenshotQuality.value}%`; });
    document.addEventListener("input", syncDirty);
    document.addEventListener("change", syncDirty);
    document.getElementById("saveButton").addEventListener("click", async () => {
        const result = await message({ type: "PG_SAVE_SETTINGS", settings: readForm() });
        if (result?.settings) {
            currentSettings = result.settings;
            writeForm(result.settings);
            markSaved(result.settings);
            setStatus("設定を保存しました", "#1b5e20");
        }
    });
    document.getElementById("resetButton").addEventListener("click", () => {
        if (!confirm("設定を初期状態に戻しますか？\nガイドのデータは削除されません。")) return;
        writeForm(PG.DEFAULT_SETTINGS);
        syncDirty();
        setStatus("初期設定を表示しています。保存すると確定します。", "#737373");
    });
    const diagnosticsOutput = document.getElementById("diagnosticsOutput");
    const diagnosticsState = document.getElementById("diagnosticsState");
    const copyDiagnostics = document.getElementById("copyDiagnostics");
    let diagnosticsText = "";

    function formatDiagnostics(report) {
        const lines = [];
        lines.push("=== TADORU. 診断 ===");
        lines.push(`取得日時: ${new Date().toLocaleString("ja-JP")}`);
        lines.push(`バージョン: ${report.version}`);
        lines.push(`拡張ID: ${report.extensionId}`);
        lines.push(`manifestのhost_permissions: ${JSON.stringify(report.hostPermissionsInManifest)}`);
        lines.push(`実際に許可されたオリジン: ${JSON.stringify(report.grantedOrigins)}`);
        lines.push(`実際に許可された権限: ${JSON.stringify(report.grantedPermissions)}`);
        lines.push(`コンテンツスクリプト応答: ${report.contentScriptTabs} タブ`);
        lines.push("");
        lines.push(`撮影モード: ${report.settings?.captureMode === "screen" ? "アドバンス（画面全体）" : "通常（Webページのみ）"}`);
        lines.push(`画面共有の状態: ${report.screenModeActive ? "有効" : "無効"} / 共有対象: ${report.screenSurface || "なし"} / タブ内へ切替済み: ${report.screenFallback ? "はい" : "いいえ"}`);
        lines.push(`記録中: ${report.isRecording ? "はい" : "いいえ"} / セッション: ${report.sessionId || "なし"}`);
        lines.push(`現在の手順数: ${report.stepCount}（画像あり ${report.stepsWithImage}）`);
        lines.push(`保存済みガイド: ${report.savedGuides}件 / 使用容量: ${report.storageBytes < 0 ? "不明" : `${Math.round(report.storageBytes / 1024)} KB`}`);
        lines.push(`直近のキャプチャエラー: ${report.lastCaptureError || "なし"}`);
        lines.push(`設定: ${JSON.stringify(report.settings)}`);
        lines.push("");
        lines.push(`--- 手順（最新30件）${report.sessionLabel ? " / " + report.sessionLabel : ""} ---`);
        if (!report.steps.length) lines.push("(手順なし)");
        report.steps.forEach((step) => {
            lines.push(`${String(step.n).padStart(2, "0")} ${step.action} 画像=${step.image ? "○" : "×"} ${step.error}`);
        });
        lines.push("");
        lines.push("--- 動作ログ（最新60件） ---");
        if (!report.eventLog.length) lines.push("(ログなし。記録を開始してから操作すると記録されます)");
        report.eventLog.forEach((entry) => {
            lines.push(`${entry.at.slice(11, 23)} ${entry.kind.padEnd(15)} ${entry.detail}`);
        });
        return lines.join("\n");
    }

    document.getElementById("runDiagnostics").addEventListener("click", async () => {
        diagnosticsState.textContent = "取得中…";
        const result = await message({ type: "PG_DIAGNOSTICS" });
        if (!result?.report) { diagnosticsState.textContent = "取得できませんでした"; return; }
        diagnosticsText = formatDiagnostics(result.report);
        diagnosticsOutput.textContent = diagnosticsText;
        diagnosticsOutput.hidden = false;
        copyDiagnostics.disabled = false;
        diagnosticsState.textContent = "取得しました";
        window.setTimeout(() => { diagnosticsState.textContent = ""; }, 2600);
    });

    copyDiagnostics.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(diagnosticsText);
            diagnosticsState.textContent = "コピーしました";
        } catch (_error) {
            diagnosticsState.textContent = "コピーできませんでした";
        }
        window.setTimeout(() => { diagnosticsState.textContent = ""; }, 2600);
    });

    load();
})();
