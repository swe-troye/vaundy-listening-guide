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


## iPhone Edge 自動播放回報與修正（現行實作）

使用者回報下一首顯示播放但沒出聲，裝置為iPhone Edge。WebKit iPhone模式已重現前版Spotify iframe換歌卡緩衝，按鈕仍顯示暫停。player.js現已全面改用同一HTMLAudioElement，previews.js載入24首原歌單公開audioPreview.url，沒有Spotify iframe/API控制；約30秒試聽，不是完整歌曲。預覽URL只保留p.scdn.co/mp3-preview路徑，24首依曲目ID對應且HTTP音訊已驗證，未保存工作階段token或URL query。

同步src/play保留首次手勢，timeupdate前進才標播放中，pending表示載入、可取消；NotAllowedError、網路/解碼錯誤有提示。原生ended接下一首，暫停保留，開啟Spotify連結會停止試聽。所有錯誤提示在手機可見。測試以實際audio.currentTime/paused核對，已在WebKit iPhone模式確認整段播完接下一首；不是實體iPhone驗證。前面iFrame API筆記僅為舊版歷史，勿恢復為現行實作。


## 歌詞跟唱正式版

正式路徑 /youtube.html；首頁主入口、24 首歌曲入口及動漫導聆播放器旁皆可點開。雙向切換保留 song hash，跨頁先暫停當前播放器。可攜版入口指向公開 HTTPS 歌詞頁，兩份可攜閱讀檔仍可單獨分享。

24 首使用 Vaundy - Topic 官方錄音，兩首 replica 保留版本。youtube-lrc.js 內建使用者提供 ZIP 的日文與 LRC 時間軸，以及本站原創繁中翻譯；youtube-readings.js 含參考 marumaru／UtaTen 的讀音，保留超→super 等逐句特殊唱法。普通字形差異補充見 scripts/build-readings.py。完整來源、操作與維護方式見 README.md／SOURCES.md。

本機匯入可覆蓋與還原內建歌詞；偏移按影片保存，ruby 開關不改文字與時間。影片時間前進才顯示播放中，播放受阻仍提示手動點播放。所有時間軸仍標記 timingVerified:false，總長核對不等於逐句實聽校正。

驗證使用 core 單元測試、受控 YouTube fixture、閱讀頁與手機排版、真正 WebKit／Edge 播放。新增切換連結已驗證保留曲目及暫停音訊。research/ 與使用者 outputs/ 不加入提交；不提交原站 HTML、tokens 或 session 紀錄。
