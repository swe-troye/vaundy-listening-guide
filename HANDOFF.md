# Handoff — 2026-10-29

使用者要求仿照kaze-listening-guide製作Vaundy網站，提供Ticket Plus與Spotify歌單，要求歌曲資料透過web search。新專案獨立於藤井風網站，未修改原站。

網站來源為index.html/style.css/app.js/core.js/data.js，逐首頁listen.html/listen.css/listen.js，favicon.svg與assets/horo-poster.jpg。PRODUCT.md、DESIGN.md與SOURCES.md記錄產品、設計與來源。

24首歌單快照為playlist-snapshot.json；所有曲目ID與版本保留來源順序。24首原文、23首中譯已讀，soramimi沒有完整中譯，不標「中譯已讀」。kaiju使用原曲原文與中譯，播放為replica版，不宣称逐秒比對錄音。saikai的「これまで」與外部中譯方向不同，依日文原文。homunculus搭配電影採官方YOU’RE NEXT資料，修正中譯頁混用另一電影名。

本機預覽port4174：npm start。npm test驗證資料與核心互動；npm run build產出dist與兩份standalone HTML。node scripts/browser-check.cjs使用系統Playwright Core與Edge；需環境允許啟動瀏覽器。截圖預設/private/tmp/vaundy-qa。

收藏／已讀storage key為vaundy-guide-v1，逐首章節為vaundy-chapter-v1，與Kaze分開。播放器更新為Spotify官方iFrame API：保留同一controller/iframe，120ms合併快速換首；標籤切換不重載。公開網址：https://swe-troye.github.io/vaundy-listening-guide/ ，GitHub Pages 使用 main 分支根目錄發布。

research/為不發布的研究快取；其中可能包括來源網站工作階段資訊，絕不可上傳或納入靜態資產。原創編輯資料已收錄data.js，不需要研究快取才能建置。

最終驗證：npm test 5項通過；npm run build通過；Edge21組瀏覽器檢查通過、無頁面JS錯誤。已檢視桌面、手機與200%文字截圖，確認Spotify實際畫面。頁首flex-wrap修正390px放大文字時連結溢出。測試脚本可用VAUNDY_DIAG=1進行定位，但一般執行完整回歸即可。


## 2026-10-29 動漫頁與自動播放修正

使用者要求逐首聆聽頁接近Kaze的2D動漫版，移除該頁演唱會封面，改為Vaundy人像，並繼續自動播放。已由Kaze anime.html/css/js沿用版面和互動，Vaundy listen.html/css/js維持原網址與歌單，新增player.js及assets/vaundy-guide.svg。既有vaundy-chapter-v1仍保存純song.id，深連結正常；soramimi繼續只標完整原文已讀，完整筆記據個別research欄位揭露中譯範圍。

回查Kaze session rollout-2026-10-28T11-14-29-01a18080-87e8-77e3-bb61-181004bf314b.jsonl確認原圖是直接編寫SVG，非Image API。Vaundy沿用此方法另畫人像，兩站README均記錄方式。未使用API Key、imagegen CLI或外部生成圖片。

Spotify使用官方createController/loadEntity/play/pause與事件。初次按一次才播，翻頁接續，暫停保留；播放到duration可接下一首，最後一首停止。預覽實測可能回報isPaused=false但position===duration，不能只依isPaused判断結束。SDK完整歌曲需要其他帳號條件，不能把約30秒未登入預覽說成全曲。API與一般embed皆不要求本站API金鑰。
