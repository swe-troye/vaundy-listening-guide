# Vaundy，在歌裡

仿照 `../kaze-listening-guide` 製作的獨立繁體中文演前導聆網站。依使用者提供的 Aya Spotify 歌單，保留 24 首順序與錄音版本。台北 HORO 演出為 2026/10/31、11/01，台北小巨蛋，兩天皆 17:30 入場／19:00 開演。

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

2026/10/29 已讀24首完整日文原文與23首外部中文對照。〈soramimi〉未取得完整外部中譯，依完整日文撰寫摘要並單獨標示。內容為原創中文整理，不轉貼完整歌詞或逐句翻譯；編輯延伸不視為作者正式解說。原文來源主要為UtaTen，〈気まぐれ〉使用marumaru原文與中譯；外部中譯不自動視為官方翻譯。

來源、譯者、版本與譯法差異見每首來源展開區與 [SOURCES.md](SOURCES.md)。歌單建立者使用「Set List」名稱，本站仍不將其當作官方台北曲目表。

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

`player.js` 使用同一個原生 `HTMLAudioElement`，播放 `previews.js` 所列的24首 Spotify 公開試聽音訊。音訊網址由原歌單公開embed的 `audioPreview.url` 取得，與歌單曲目ID逐一對應；僅保留 `https://p.scdn.co/mp3-preview/` 路徑，無 query、工作階段 token、OAuth 或 API Key。24個網址均已確認回傳 audio/mpeg。

這是約30秒的試聽連播，長度依該段音訊而定，並非完整歌曲。每首對應的「在Spotify聽」連結保留，開啟時暫停網站試聽。首次進站由使用者按一次開始，之後手動翻頁或音訊 `ended` 事件接續下一首；暫停後翻頁保持暫停。切換導聆標籤不改動音訊元素。播放進度確實前進時才顯示播放中；載入、緩衝、被瀏覽器拒絕、連線失敗或取消均有獨立狀態。

前版使用 Spotify iFrame API，在桌面 Edge 測試可行，但使用者回報 iPhone Edge 換歌不出聲。iPhone Edge 使用WebKit；已在WebKit的iPhone模式重現前版下一首卡在緩衝，按鈕卻顯示暫停。新版避免換歌重載第三方iframe，保留同一個音訊元素及首次播放授權；不再以Spotify事件或播放意圖推定音訊已在播放。

驗證：6項資料／核心測試與21組Edge版面回歸通過。WebKit iPhone模式已確認首次不強制出聲、按一次播放、換歌後真正音訊時間前進、暫停後換歌不播，以及播放整段試聽後自動接下一首。這是桌面WebKit的iPhone模式，不是實體iPhone測試；實體裝置仍可能因低耗電、背景分頁或播放權限限制，需要再按一次。

啟動 `npm start` 後執行：

```sh
node scripts/playback-check.cjs
VAUNDY_BROWSER=webkit node scripts/playback-check.cjs
```

檢查腳本使用 Playwright Core。Edge 走本機應用程式；WebKit可用 `PLAYWRIGHT_BROWSERS_PATH` 指定已安裝瀏覽器，本次下載在 `/private/tmp/vaundy-browsers`。測試以 `audio.currentTime` 前進和 `paused` 狀態核對，另模擬 `NotAllowedError` 及一直pending的播放要求，確認不會誤顯示播放中。


## YouTube 同步聆聽實驗版

獨立網址：https://swe-troye.github.io/vaundy-listening-guide/youtube.html 。這版不替換 `listen.html`，首頁也未加入實驗版入口。

影片使用官方 YouTube iframe API 與24首 Vaundy／Vaundy - Topic影片，曲目 metadata 見 `youtube-data.js`，逐一透過 YouTube oEmbed 核對標題與頻道；〈逆光〉和〈怪獣の花唄〉皆選 replica 錄音。MV可能有額外前奏或尾聲，時間軸以該影片為準。嵌入播放仍依YouTube地區、影片設定與瀏覽器許可；錯誤時有直接YouTube連結。

互動參考marumaru：逐句高亮、點句跳播、自動跟隨捲動、第二行文字切換、字級、速度、單句循環、A–B循環與時間偏移。影片透過 `getCurrentTime` 驅動同步，播放時間前進才標示播放中；首次播放及自動換歌若受阻，提示點影片的播放鍵。影片字幕使用YouTube原生字幕設定。

**內建是原創中文導聆提示，非逐句歌詞。** 提示依影片段落配置，並不表示歌詞正唱到那一句。完整歌詞同步使用你可使用的LRC：點「匯入LRC」，選擇本機 `.lrc` 或 `.txt`；格式例如 `[00:12.50]文字`，同一時間的多行可放日文與中文。支援重複時間標記、LRC offset、影片個別存檔及清除。檔案最多500KB，在浏览器解析與保存，不上傳伺服器，也不對外發布。未複製marumaru的完整歌詞或翻譯。

驗證：`npm test` 共11項通過；`node scripts/youtube-browser-check.cjs` 共15組受控API介面檢查，涵蓋匯入、重開恢復、跳播、同步、單句及A–B循環、播放受阻、XSS文字處理和手機／200%文字。另以真正YouTube測試桌面Edge與WebKit iPhone模式，確認影片時間前進及下一首播放；WebKit模式不是實體iPhone。

```sh
node scripts/youtube-browser-check.cjs
node scripts/youtube-live-check.cjs
VAUNDY_BROWSER=webkit node scripts/youtube-live-check.cjs
```

本機伺服器使用 `npm start`；開啟 http://localhost:4174/youtube.html 。YouTube iframe需要HTTP來源與referrer，請勿以本機file網址測試。建置會複製实验版5個資產，舊兩份可攜HTML維持原用途。YouTube API不需要本站帳號或API Key。
