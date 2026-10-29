# Handoff — 2026-10-29

使用者要求仿照kaze-listening-guide製作Vaundy網站，提供Ticket Plus與Spotify歌單，要求歌曲資料透過web search。新專案獨立於藤井風網站，未修改原站。

網站來源為index.html/style.css/app.js/core.js/data.js，逐首頁listen.html/listen.css/listen.js，favicon.svg與assets/horo-poster.jpg。PRODUCT.md、DESIGN.md與SOURCES.md記錄產品、設計與來源。

24首歌單快照為playlist-snapshot.json；所有曲目ID與版本保留來源順序。24首原文、23首中譯已讀，soramimi沒有完整中譯，不標「中譯已讀」。kaiju使用原曲原文與中譯，播放為replica版，不宣称逐秒比對錄音。saikai的「これまで」與外部中譯方向不同，依日文原文。homunculus搭配電影採官方YOU’RE NEXT資料，修正中譯頁混用另一電影名。

本機預覽port4174：npm start。npm test驗證資料與核心互動；npm run build產出dist與兩份standalone HTML。node scripts/browser-check.cjs使用系統Playwright Core與Edge；需環境允許啟動瀏覽器。截圖預設/private/tmp/vaundy-qa。

收藏／已讀storage key為vaundy-guide-v1，逐首章節為vaundy-chapter-v1，與Kaze分開。播放器每次換首移除舊frame，150ms合併載入；標籤切換不重載。公開網址：https://swe-troye.github.io/vaundy-listening-guide/ ，GitHub Pages 使用 main 分支根目錄發布。

research/為不發布的研究快取；其中可能包括來源網站工作階段資訊，絕不可上傳或納入靜態資產。原創編輯資料已收錄data.js，不需要研究快取才能建置。

最終驗證：npm test 5項通過；npm run build通過；Edge21組瀏覽器檢查通過、無頁面JS錯誤。已檢視桌面、手機與200%文字截圖，確認Spotify實際畫面。頁首flex-wrap修正390px放大文字時連結溢出。測試脚本可用VAUNDY_DIAG=1進行定位，但一般執行完整回歸即可。
