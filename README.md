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
- Spotify曲目播放器保留歌單版本；換歌移除舊播放器，切換導聆分頁保留播放。需手動開始，完整播放支援依帳號、地區與瀏覽器而異。

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
