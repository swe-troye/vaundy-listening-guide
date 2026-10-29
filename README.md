# Vaundy，在歌裡

仿照 `../kaze-listening-guide` 製作的獨立繁體中文演前導聆網站。依使用者提供的 Spotify「On Tour Taiwan: Vaundy」歌單，保留 21 首順序與錄音版本。台北 HORO 演出為 2026/10/31、11/01，台北小巨蛋，兩天皆 17:30 入場／19:00 開演。

## 開啟

公開網址：https://swe-troye.github.io/vaundy-listening-guide/

逐首導聆：https://swe-troye.github.io/vaundy-listening-guide/listen.html

GitHub 儲存庫：https://github.com/swe-troye/vaundy-listening-guide

直接用現代瀏覽器開啟 `dist/standalone.html`。逐首導聆為 `dist/listen-standalone.html`；兩份檔案放在同一目錄，可互相切換。兩頁均內嵌內容、樣式、腳本與海報，閱讀不需連網；Spotify播放及外部來源需要網路。

也可執行 `npm start`，開啟 http://localhost:4174 。`npm run preview` 預覽建置輸出。沒有網站執行依賴，不需API金鑰。

## 內容與功能

- 歌名意思、核心摘要、歌詞亮點、深入大意、背景、延伸聽法與提問。
- 慢慢讀／演前速讀，三語歌名搜尋、主題篩選、收藏與手動已讀。
- 桌面目錄、手機目錄、歌曲深連結；儲存受限仍可閱讀。
- 逐首導聆提供摘要／深入／聆聽三分頁，前後首、章節搜尋、鍵盤與左右滑動。
- 試聽播放器保留歌單版本，使用 Spotify 公開的約 30 秒音訊；按一次開始後翻頁自動接續，暫停後翻頁保持暫停。完整歌曲使用 Spotify 連結開啟。

2026/10/29 依新歌單更新為 21 首，完整日文已讀、20 首完整外部中文參考已讀。〈走れSAKAMOTO〉的可見中文與外部 TV Size 來源分開標示。中文導聆為本站原創摘要，來源、譯者與閱讀差異见每首來源區及 [SOURCES.md](SOURCES.md)。歌單由 Spotify 整理，仍不代表正式演出曲目。

## 建置與驗證

```sh
npm test
npm run build
node scripts/browser-check.cjs
```

單元測試驗證歌單ID／版本、來源範圍、搜尋篩選、儲存與HTML跳脫。建置檢查腳本語法、DOM錨點和資產引用，產出兩頁與兩份可攜HTML。

瀏覽器檢查使用已有的Playwright Core及Edge，可透過 `VAUNDY_PLAYWRIGHT_MODULE` 指定模組、`VAUNDY_QA_DIR` 指定截圖目錄、`VAUNDY_SITE_URL` 指定HTTP首頁。它們僅為開發工具，不是網站依賴。

GitHub Pages 使用 main 分支根目錄發布。修改後執行測試及建置，再提交並推送即可更新。`research/` 包含僅供核對的原文與頁面快取，不屬於網站資產，不應發布；`playlist-snapshot.json` 只保留歌單資訊，不含Spotify工作階段資料。

2026/10/29 驗證：5項資料／核心測試與21組Edge瀏覽器檢查通過，沒有頁面JavaScript錯誤。涵蓋1440px桌面、768px平板、390/320px手機、667×375橫向、1280×720矮桌面及200%文字。已實際確認Spotify顯示指定歌曲並檢視截圖；修正文字放大時首頁Spotify連結溢出，頁首改為自然換行。

## 動漫版與人像繪製

逐首聆聽網址：https://swe-troye.github.io/vaundy-listening-guide/listen.html 。此頁沿用 Kaze 動漫版的深藍外框、白色閱讀欄、左側人像、隨歌曲切換的場景、斜切翻頁、章節目錄與全螢幕操作；演唱會海報留在文字首頁。手機直式顯示人像帶與閱讀區，橫式展開左右構圖。

`assets/vaundy-guide.svg` 是直接編寫 SVG 的原創 2D 動漫向量人像，特徵為蓬鬆捲髮、圓框墨鏡、寬鬆磚紅上衣與麥克風。它與 Kaze 的 `assets/kaze-guide.svg` 使用同一種製作方法：以 `<path>`、`<circle>`、漸層及麥克風網格 pattern 繪製，瀏覽器直接渲染，無需 OPENAI_API_KEY 或圖片生成 API。此次未使用 imagegen CLI。圖像可編輯、縮放，背景為透明，場景由 HTML/CSS 分層呈現。

方法已回查 Kaze 原始 session `rollout-2026-10-28T11-14-29-01a18080-87e8-77e3-bb61-181004bf314b.jsonl`：2026-10-28 16:08 UTC 直接寫入 SVG 原始碼，後由提交 `db5a608` 收錄。Kaze README 也補上製作方式。未把 session 原文、帳號資料或憑證複製到專案。

## 自動播放（iPhone 修正）

`player.js` 使用同一個原生 `HTMLAudioElement`，播放 `previews.js` 所列的21首 Spotify 公開試聽音訊。音訊網址由原歌單公開embed的 `audioPreview.url` 取得，與歌單曲目ID逐一對應；僅保留 `https://p.scdn.co/mp3-preview/` 路徑，無 query、工作階段 token、OAuth 或 API Key。21個網址均已確認回傳 audio/mpeg。

這是約30秒的試聽連播，長度依該段音訊而定，並非完整歌曲。每首對應的「在Spotify聽」連結保留，開啟時暫停網站試聽。首次進站由使用者按一次開始，之後手動翻頁或音訊 `ended` 事件接續下一首；暫停後翻頁保持暫停。切換導聆標籤不改動音訊元素。播放進度確實前進時才顯示播放中；載入、緩衝、被瀏覽器拒絕、連線失敗或取消均有獨立狀態。

前版使用 Spotify iFrame API，在桌面 Edge 測試可行，但使用者回報 iPhone Edge 換歌不出聲。iPhone Edge 使用WebKit；已在WebKit的iPhone模式重現前版下一首卡在緩衝，按鈕卻顯示暫停。新版避免換歌重載第三方iframe，保留同一個音訊元素及首次播放授權；不再以Spotify事件或播放意圖推定音訊已在播放。

驗證：6項資料／核心測試與21組Edge版面回歸通過。WebKit iPhone模式已確認首次不強制出聲、按一次播放、換歌後真正音訊時間前進、暫停後換歌不播，以及播放整段試聽後自動接下一首。這是桌面WebKit的iPhone模式，不是實體iPhone測試；實體裝置仍可能因低耗電、背景分頁或播放權限限制，需要再按一次。

啟動 `npm start` 後執行：

```sh
node scripts/playback-check.cjs
VAUNDY_BROWSER=webkit node scripts/playback-check.cjs
```

檢查腳本使用 Playwright Core。Edge 走本機應用程式；WebKit可用 `PLAYWRIGHT_BROWSERS_PATH` 指定已安裝瀏覽器，本次下載在 `/private/tmp/vaundy-browsers`。測試以 `audio.currentTime` 前進和 `paused` 狀態核對，另模擬 `NotAllowedError` 及一直pending的播放要求，確認不會誤顯示播放中。


## 歌詞跟唱（正式版）

正式網址：https://swe-troye.github.io/vaundy-listening-guide/youtube.html 。

入口：首頁「進入歌詞跟唱」；每首歌曲「完整播放・歌詞跟唱」；動漫導聆播放器旁的同名按鈕。逐首入口與歌詞頁回到動漫／文字版皆保留曲目，切換時先暫停當前播放。可攜 HTML 的跟唱連結指向正式 HTTPS 網址，避免單獨分享兩份可攜檔案時缺少歌詞頁。

預設提供 17 首完整日文與本站原創繁中逐句翻譯；另外 4 首等待使用者提供 LRC，資料見 `youtube-lrc.js`。日文與時間軸來自使用者提供的 `vaundy_lab2_lrc.zip`（LRCLIB），中文依該日文重新翻譯，語意與自然口語風格參考 marumaru。每首保留 LRCLIB 紀錄連結、翻譯歸屬與 marumaru 參考頁。外站譯者署名屬參考頁，本站中文不冒稱為其作品。

整理時保留原始時間標記與重複段落；空白時間點顯示「♪／間奏／尾聲」，〈東京フラッシュ〉移除原檔 `^` 後的英文註解，改放原創繁中。日文錯字／口語轉寫沿用提供檔案，中文依上下文理解；意象含糊處屬本站翻譯解讀。吟唱若日中相同，第二行標示「吟唱」避免解析器去重。

播放器使用 21 支 Vaundy - Topic 官方錄音影片，metadata 見 `youtube-data.js`。先從 YouTube Music 錄音搜尋取得候選，再以 YouTube oEmbed 核對名稱／頻道、影片資料核對 Topic 頻道 ID `UC8_Ag6BVp43Vmrx6eillK9g` 與時長；一般 YouTube 專輯頁可能將錄音替換為 MV，不能只靠該頁選擇音源。〈怪獣の花唄〉已改為《strobo》原版；〈逆光〉已移出歌單。錄音總長與提供的 LRC 標示最多差 2 秒，**這不是逐句同步校正**，17 首內建時間軸仍標記 `timingVerified:false`，可用文字延遲微調。

互動參考 marumaru：逐句高亮、點句跳播、自動跟隨捲動、中文切換、字級、速度、單句循環、A–B 循環與時間偏移。影片透過 `getCurrentTime` 驅動同步，播放時間前進才標示播放中；首次播放及自動換歌若受阻，提示點影片的播放鍵。YouTube 的地區與瀏覽器播放設定仍可能影響嵌入，保留直接影片連結。

「匯入 LRC」可用自己的 `.lrc`／`.txt` 覆蓋這首內建歌詞；格式 `[00:12.50]文字`，同一時間多行可放日文與中文。檔案最多 500 KB，僅在瀏覽器解析與保存。「還原內建歌詞」清除覆蓋並恢復日中對照。內建歌詞的時間微調也按影片保存，只存偏移值、不重複存整份內建文字；曲目切換不互相污染。

驗證：`npm test` 共 14 項；`node scripts/youtube-browser-check.cjs` 共 21 組受控 API 介面檢查，涵蓋雙語預載、匯入／還原、偏移保存、跳播、同步、單句及 A–B 循環、播放受阻、XSS 文字處理與手機／200% 文字。真正 YouTube 測試另外驗證播放時間、跳播與下一首播放；WebKit iPhone 模式不等於實體 iPhone Edge。

```sh
node scripts/youtube-browser-check.cjs
node scripts/youtube-live-check.cjs
VAUNDY_BROWSER=webkit node scripts/youtube-live-check.cjs
```

本機：`npm start`，開啟 http://localhost:4174/youtube.html 。YouTube iframe 需要 HTTP 來源與 referrer。建置包含歌詞跟唱 7 個資產，YouTube iframe API 不需要本站帳號或 API Key。

漢字上方讀音使用原生 `<ruby><rb>漢字</rb><rt>讀音</rt></ruby>`，預設顯示、可用「顯示讀音」切換；切換不改歌詞、翻譯或時間軸。`youtube-readings.js` 依 marumaru 的逐句標音對齊使用者提供的日文，保留〈再会〉「超→super」「隅→すき」等特殊唱法。部分缺字由 UtaTen 補充。參考頁使用假名、原檔使用漢字等差異，另補一般讀音並標示為本站補充，沒有宣稱逐首實聽驗證所有唱法。匯入文字完全符合已核對的日文句子時，也可使用該句讀音。

維護標音：`python3 scripts/build-readings.py` 讀取本機 `research/` 的參考頁快照，輸出只有原檔文字與讀音的結構化片段；不發布原站 HTML。對齊以逐句內容優先，單字補充只接受該歌讀音無歧義的詞；不將「上手」錯拆成「上／手→て」。`EDITOR_READINGS` 列出本站補充的普通讀音。輸出報告位於忽略的 `research/readings-report.json`；執行 `npm test` 會檢查原文完整保留、所有漢字覆蓋與特殊唱法，DOM 以 `textContent` 建立標音。

## 目前缺字幕的四首

21 首清單保留 17 首既有字幕；〈忘れる前に〉、〈走れSAKAMOTO〉、〈シンギュラリティ〉與〈怪獣の花唄〉原版待使用者下載 LRC 後提供。跟唱頁顯示「字幕待補」並提供 JSON 來源，現有提示為原創導聆，非逐句歌詞。原版怪獣不沿用舊 replica LRC。

下載來源列於 `youtube-data.js` 的 `VAUNDY_LRC_SOURCES`；JSON 的 `syncedLyrics` 欄位可存成 UTF-8 `.lrc`。下載網址與完整核對資訊已另提供使用者；不需要 Spotify API 金鑰。
