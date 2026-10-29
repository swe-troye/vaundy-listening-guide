# Vaundy，在歌裡 — 視覺系統

## 使用情境與方向

演前在手機上閱讀、通勤時預習，或在桌面一邊聽歌一邊看導聆。沿用 kaze-listening-guide 的明亮白底與分層閱讀，主色改為 HORO 海報呼應的深紅色；首頁保留熟悉的目錄、慢讀、速讀與收藏控件。官方海報提供藝人識別，閱讀區保持單純。

## 色彩

白底 oklch(1 0 0)、正文 oklch(.23 .012 25)、品牌 oklch(.45 .16 25)、次要文字 oklch(.46 .018 25)、表面 oklch(.97 .012 25)、線條 oklch(.89 .012 25)、選取 oklch(.96 .025 25)。逐首頁左側使用 oklch(.28 .08 25)，正文保持白底，左側次要字 oklch(.90 .02 25)。正文與次要資訊保持足夠對比。

## 字體與版面

沿用系統字體 PingFang TC / Microsoft JhengHei / system-ui，不載入第三方字體。caption .875rem、body 1rem、lead 1.125rem、subheading 1.5rem、heading 2rem、首頁 display 3rem；逐首頁標題 2.5rem，手機 2rem。正文行高1.9；標題字距 -.025em。段落不超過40em。

首頁最大1280px；桌面240px目錄＋閱讀欄，1100px以下200px目錄，850px以下單欄與原生dialog目錄。海報完整保留1200×500比例，不裁切巡演文字；手機置於導言之後。

動漫逐首頁直接沿用 Kaze anime.html/css/js 的構圖與互動語彙：深藍外框、白色閱讀欄、左側 SVG 人像、斜切舞台、黄色下一首按鈕與底部 Spotify dock。`assets/vaundy-guide.svg` 為獨立繪製的 Vaundy 原型人像：捲髮、墨鏡、磚紅上衣、麥克風；不使用演唱會封面。桌面／橫式分欄，手機／平板直式使用160／240px人像帶＋可捲動正文；保留100dvh與安全區。

歌曲依主題切換城市、天空、海浪、星光與節慶場景；薄荷、玫瑰、藍、黄、紫色場景配合深色線條與賽璐璐陰影。圖像由向量路徑編寫，無圖片生成 API，製作紀錄見 README。

## 操作與可及性

控件至少44px。慢讀／速讀為原生radio；來源與深入內容為details。對話框使用dialog，支援Escape。逐首頁分頁使用tablist、roving tabindex與左右／Home／End鍵；非輸入狀態左右鍵換歌，觸控可左右滑動。所有互動皆有3px焦點外框。

160–180ms狀態過渡，逐首換頁只做短距離位移與透明度，不阻擋內容。尊重prefers-reduced-motion。文字可放大，標題允許換行。

## 播放器

以 `player.js` 包裝 Spotify 官方 iFrame API，保留同一個 iframe／controller。首次按一次後保存本次瀏覽的播放意圖，換首立即停止已播放的舊歌曲、120ms合併快速切換，ready後要求播放。暫停後切換保持暫停，不把未載入的歌曲送出pause指令。播放狀態與進度依官方事件回報；播放位置達到實際duration時接下一首，最後一首停下。首次不強制出聲，瀏覽器限制時提示點播放器，API失敗回退普通embed。

角色650ms、正文420ms、斜切480ms、日光700ms動畫與Kaze相同，快速切換取消上次動畫；prefers-reduced-motion停用。
