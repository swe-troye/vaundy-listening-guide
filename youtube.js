(() => {
  'use strict';
  const songs=window.VAUNDY_SONGS, videos=window.VAUNDY_VIDEOS, lyrics=window.VAUNDY_LRC||{};
  const {parseLRC,activeIndex,formatTime}=window.VaundyTimeline;
  const {escapeHTML:e,filterSongs}=window.VaundyCore;
  const $=id=>document.getElementById(id);
  let index=Math.max(0,songs.findIndex(s=>`#song-${s.id}`===location.hash));
  let player,ready=false,wanted=false,pending=false,actualPlaying=false,cues=[],active=-1,offset=0,imported=null;
  let following=true,singleLoop=false,loopCue=-1,pointA=null,pointB=null,lastTime=-1,sourceDuration=0;
  let guardTimer,apiTimer,pollTimer,apiUnavailable=false;
  const song=()=>songs[index],video=()=>videos[song().id];
  const bundled=()=>lyrics[song().id];
  const readingData=()=>window.VAUNDY_READINGS?.[song().id];
  const storageKey=()=>`vaundy-youtube-lrc-v1-${video().videoId}`;
  const currentPlayer=()=>player?.getVideoData?.()?.video_id===video().videoId;
  function playbackLabel() {
    $('play').disabled=!ready;
    const text=!ready?'播放器載入中':actualPlaying?'❚❚ 暫停':pending?'取消播放':'▶ 播放影片';if($('play').textContent!==text)$('play').textContent=text;
  }
  function status(text){if($('player-status').textContent!==text)$('player-status').textContent=text;}
  function clearAttempt(){clearTimeout(guardTimer);}
  function startGuard() {
    clearAttempt();guardTimer=setTimeout(()=>{
      if(!actualPlaying&&wanted){wanted=false;pending=false;playbackLabel();status('尚未開始播放，請點影片中的 ▶；也可在 YouTube 開啟。');}
    },10000);
  }
  function play() {
    if(!ready)return;
    wanted=true;pending=true;actualPlaying=false;playbackLabel();status('等待 YouTube 開始播放…');
    player.playVideo();startGuard();
  }
  function pause() {
    wanted=false;pending=false;actualPlaying=false;clearAttempt();player?.pauseVideo?.();playbackLabel();status('已暫停。點句子可以跳到對應位置。');
  }
  function durationHint() {const [m,s]=song().duration.split(':').map(Number);return m*60+s;}
  function demoCues(duration) {
    const s=song();return [s.line,s.titleMeaning,...s.meaning.slice(0,2),s.listen,s.prompt].map((primary,i)=>({start:Math.round(duration*[0,.12,.3,.5,.72,.88][i]),primary,secondary:''}));
  }
  function renderCues() {
    $('timeline').replaceChildren();active=-1;
    for(const [i,cue] of cues.entries()) {
      const button=document.createElement('button');button.type='button';button.className='cue';button.dataset.cue=String(i);
      const time=document.createElement('span');time.className='cue-time';const marker=document.createElement('span');marker.className='cue-marker';marker.textContent='目前';marker.setAttribute('aria-hidden','true');time.append(marker,document.createTextNode(formatTime(cue.start+offset)));
      const words=document.createElement('span');const primary=document.createElement('span');primary.className='cue-primary';primary.lang=imported||bundled()?'ja':'zh-Hant';
      const segments=readingData()?.lines[cue.primary];
      if(segments&&segments.map(x=>x.text).join('')===cue.primary){
        for(const segment of segments){
          if(segment.reading){const ruby=document.createElement('ruby'),rb=document.createElement('rb'),rt=document.createElement('rt');rb.textContent=segment.text;rt.textContent=segment.reading;ruby.append(rb,rt);primary.append(ruby);}
          else primary.append(document.createTextNode(segment.text));
        }
      }else primary.textContent=cue.primary;
      words.append(primary);
      if(cue.secondary){const secondary=document.createElement('span');secondary.className='cue-secondary';secondary.textContent=cue.secondary;words.append(secondary);}
      button.append(time,words);$('timeline').append(button);
    }
    $('content-kind').textContent=imported?`你匯入的 LRC · ${imported.name}`:bundled()?'日文／中文逐句歌詞 · 原創繁中翻譯':'字幕待補 · 目前顯示原創導聆';
    $('timeline-hint').textContent=imported||bundled()?'點歌詞，跳到這一句':'這首尚未匯入 LRC。下方提供下載來源；目前提示按影片段落配置，並非歌詞時間軸。';
    $('remove-lrc').disabled=!imported;
    const bilingual=cues.some(c=>c.secondary);$('translation').disabled=!bilingual;
    $('readings').disabled=!$('timeline').querySelector('ruby');
    $('sync-status').textContent=`${cues.length} 個時間點${imported?' · 匯入歌詞僅留在此瀏覽器':bundled()?' · LRC 尚未逐句實聽校正':''}`;
    const s=song(),marumaru=s.sources.find(x=>x.url.includes('marumaru')),b=bundled();
    $('lyrics-source-credit').textContent=imported?'目前顯示你匯入的 LRC，內容與翻譯以該檔案為準。':b?'日文歌詞／時間軸：你提供的 LRC（LRCLIB）；繁中：本站原創翻譯。':'本站原創中文導聆。';
    const readings=readingData();
    $('lyrics-source-note').textContent=`${!imported&&!b?'字幕待補；下載來源的 JSON 中，syncedLyrics 欄位是 LRC 文字，可存成 .lrc 後匯入。':marumaru?'語意與翻譯風格參考：marumaru；參考頁翻譯署名請見原站。':'這首依你提供的日文原創翻譯，未取得 marumaru 中文對照。'}${readings?` 讀音參考：${readings.sourceName}${readings.supplementUrl?'，UtaTen 補充':''}${readings.editorialReadings?'；異體寫法另由本站補上一般讀音':''}。`:''}${!imported&&b?' 時間軸尚未逐句實聽校正，可依播放調整。':''}${b?.originalScript==='romaji'?' 原檔為羅馬字；本站依提供文字還原日文，時間軸不變。':''}`;
  }
  function setActive(time,scroll=true) {
    const next=activeIndex(cues,time,offset);if(next===active)return;
    if(active>=0)$('timeline').children[active]?.removeAttribute('aria-current');
    active=next;const row=$('timeline').children[active];
    if(row){row.setAttribute('aria-current','true');if(following&&scroll)scrollToRow(row);}
  }
  function scrollToRow(row) {
    const box=$('timeline'),rect=box.getBoundingClientRect(),rowRect=row.getBoundingClientRect();
    const visibleTop=Math.max(rect.top,0),visibleBottom=Math.min(rect.bottom,innerHeight);
    const center=visibleBottom>visibleTop?(visibleTop+visibleBottom)/2:rect.top+box.clientHeight/2;
    const target=Math.max(0,box.scrollTop+rowRect.top-(center-rowRect.height/2));
    box.scrollTo({top:target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }

  function setFollowing(value) {
    following=value;$('follow').setAttribute('aria-pressed',String(value));$('return-current').hidden=value;$('follow-state').textContent=value?'自動跟隨':'自由瀏覽';
    if(value&&active>=0)scrollToRow($('timeline').children[active]);
  }
  function loopLabel() {
    $('loop-line').setAttribute('aria-pressed',String(singleLoop));
    $('loop-status').textContent=singleLoop?'循環目前高亮的時間段。':pointA!==null&&pointB!==null?`循環 ${formatTime(pointA)} → ${formatTime(pointB)}`:pointA!==null?`A = ${formatTime(pointA)}，再設定終點 B。`:'先聽到想練習的位置，再設定起點 A 與終點 B。';
  }
  function clearLoop(){singleLoop=false;loopCue=-1;pointA=null;pointB=null;loopLabel();}
  function seek(time) {
    if(!ready){status('播放器還在載入，請稍候。');return;}
    const t=Math.max(0,Math.min(time,player.getDuration?.()||Infinity));player.seekTo(t,true);lastTime=-1;setActive(t);
    if(wanted)player.playVideo();
  }
  function updateTimelineDuration(duration) {
    if(imported||bundled()||duration<=0||Math.abs(duration-sourceDuration)<1)return;
    sourceDuration=duration;cues=demoCues(duration);renderCues();
  }
  function tick() {
    if(!ready||!currentPlayer())return;
    const time=player.getCurrentTime()||0,duration=player.getDuration()||0,state=player.getPlayerState();
    $('time').textContent=formatTime(time);if(duration>0){$('duration').textContent=formatTime(duration);updateTimelineDuration(duration);}
    setActive(time);
    if(state===1&&time>lastTime&&lastTime>=0){actualPlaying=true;pending=false;wanted=true;clearAttempt();playbackLabel();status(player.isMuted?.()?'影片正在播放，但目前靜音；請用影片控制開啟聲音。':'影片播放中 · 文字跟隨目前時間。');}
    lastTime=time;
    if(state!==1)return;
    const a=singleLoop&&loopCue>=0?Math.max(0,cues[loopCue].start+offset):pointA;
    const b=singleLoop&&loopCue>=0?(cues[loopCue+1]?cues[loopCue+1].start+offset:duration):pointB;
    if(a!==null&&b!==null&&b>a+.2&&time>=b-.08){player.seekTo(a,true);lastTime=-1;}
  }
  function songList() {
    const found=filterSongs(songs,{query:$('song-search').value});
    $('song-list').innerHTML=found.map(s=>`<button type="button" class="song-choice" data-song="${e(s.id)}" ${s.id===song().id?'aria-current="true"':''}><span>${String(songs.indexOf(s)+1).padStart(2,'0')}</span><span>${e(s.name)}</span></button>`).join('');
    $('song-empty').hidden=found.length>0;
  }
  function restoreLRC() {
    imported=null;offset=0;
    try{const saved=JSON.parse(localStorage.getItem(storageKey())||'null');if(saved){if(typeof saved.text==='string'){const parsed=parseLRC(saved.text);imported={text:saved.text,name:String(saved.name||'本機 LRC')};cues=parsed;}offset=Math.max(-20,Math.min(20,Number(saved.offset)||0));}}catch{imported=null;offset=0;}
    if(!imported)cues=bundled()?parseLRC(bundled().text):demoCues(durationHint());
    $('offset').value=String(offset);$('offset-value').textContent=`${offset.toFixed(1)} 秒`;sourceDuration=durationHint();renderCues();
  }
  function saveLRC() {try{localStorage.setItem(storageKey(),JSON.stringify(imported?{...imported,offset}:{bundled:true,offset}));}catch{$('sync-status').textContent='瀏覽器無法保存此次歌詞或時間微調，重開後請重新設定。';}}
  function renderSong() {
    const s=song(),v=video();$('song-number').textContent=`${String(index+1).padStart(2,'0')} / ${songs.length}`;
    $('song-title').textContent=s.name;$('song-reading').textContent=`${s.reading} / ${s.chinese}`;
    $('anime-open').href=`listen.html#song-${s.id}`;$('home-open').href=$('guide-open').href=`index.html#song-${s.id}`;
    document.title=`${s.name} · 歌詞跟唱`;$('youtube-open').href=v.source;
    $('previous').disabled=index===0;$('next').disabled=index===songs.length-1;
    const b=bundled(),download=!b&&window.VAUNDY_LRC_SOURCES?.[s.id];
    $('sources').innerHTML=`<p><strong>影片：</strong>${e(v.title)}</p><p><strong>頻道：</strong>${e(v.channel)} · ${e(v.checkedAt)} 核對</p><p><a href="${e(v.source)}" target="_blank" rel="noopener noreferrer">官方 YouTube 影片 ↗</a></p>${b?`<p><strong>日文歌詞／時間軸：</strong>使用者提供的 ${e(b.providedFile)}${b.originalScript==='romaji'?'；原檔羅馬字已還原為日文':''}（<a href="${e(b.sourceUrl)}" target="_blank" rel="noopener noreferrer">LRCLIB 原始紀錄 ↗</a>）</p><p><strong>中文：</strong>本站原創繁中翻譯；語意與風格參考 marumaru。時間軸尚未逐句實聽校正，請按播放微調。</p>`:'<p>內建文字為本站原創中文導聆。</p>'}`;
    const marumaru=s.sources.find(x=>x.url.includes('marumaru'));
    const original=s.sources.find(x=>x.kind==='original');
    $('marumaru-link').href=marumaru?.url||'https://www.marumaru-x.com/';
    $('lyrics-source-link').href=download?.apiUrl||marumaru?.url||original.url;
    $('lyrics-source-link').textContent=download?'取得這首 LRC 來源（JSON）↗':marumaru?'在 marumaru 查看日文歌詞與中文翻譯 ↗':`日文原文：${original.name} ↗`;
    if(download)$('sources').insertAdjacentHTML('beforeend',`<p><strong>字幕待補：</strong><a href="${e(download.sourceUrl)}" target="_blank" rel="noopener noreferrer">LRCLIB 紀錄 ↗</a> · <a href="${e(download.apiUrl)}" target="_blank" rel="noopener noreferrer">LRC 來源 JSON ↗</a>。曲長 ${e(String(Math.round(download.duration)))} 秒；待使用者提供，未逐句實聽校正。</p>`);
    clearLoop();restoreLRC();$('timeline').scrollTop=0;songList();setFollowing(true);$('youtube-open').hidden=!apiUnavailable;$('time').textContent='00:00';$('duration').textContent='--:--';
  }
  function select(next) {
    if(next<0||next>=songs.length||next===index)return;
    const continuePlaying=wanted;clearAttempt();index=next;actualPlaying=false;pending=continuePlaying;lastTime=-1;
    history.replaceState(null,'',`#song-${song().id}`);renderSong();playbackLabel();
    if(ready){if(continuePlaying){player.loadVideoById(video().videoId);status('正在換到下一支影片…');startGuard();}else player.cueVideoById(video().videoId);}
  }
  $('previous').addEventListener('click',()=>select(index-1));$('next').addEventListener('click',()=>select(index+1));
  $('play').addEventListener('click',()=>{if(actualPlaying||pending)pause();else play();});
  $('speed').addEventListener('change',()=>{if(ready)player.setPlaybackRate(Number($('speed').value));});
  $('song-search').addEventListener('input',songList);
  $('song-list').addEventListener('click',event=>{const b=event.target.closest('[data-song]');if(b)select(songs.findIndex(s=>s.id===b.dataset.song));});
  $('timeline').addEventListener('click',event=>{const b=event.target.closest('[data-cue]');if(b){const i=Number(b.dataset.cue);if(singleLoop)loopCue=i;seek(cues[i].start+offset);}});
  $('settings-open').addEventListener('click',()=>{const settings=$('lyrics-settings');settings.open=!settings.open;if(settings.open){settings.querySelector('summary').focus();settings.scrollIntoView({block:'nearest',behavior:'instant'});}});
  $('lyrics-settings').addEventListener('toggle',()=>$('settings-open').setAttribute('aria-expanded',String($('lyrics-settings').open)));
  $('timeline').addEventListener('keydown',event=>{if(['PageDown','PageUp','Home','End'].includes(event.key))setFollowing(false);});
  $('follow').addEventListener('click',()=>setFollowing(!following));$('return-current').addEventListener('click',()=>setFollowing(true));
  for(const event of ['wheel','touchmove'])$('timeline').addEventListener(event,()=>setFollowing(false),{passive:true});
  $('translation').addEventListener('click',()=>{const shown=$('translation').getAttribute('aria-pressed')==='true';$('translation').setAttribute('aria-pressed',String(!shown));$('timeline').classList.toggle('hide-secondary',shown);});
  $('readings').addEventListener('click',()=>{const shown=$('readings').getAttribute('aria-pressed')==='true';$('readings').setAttribute('aria-pressed',String(!shown));$('timeline').classList.toggle('hide-readings',shown);if(following&&active>=0)scrollToRow($('timeline').children[active]);});
  $('font-size').addEventListener('change',()=>$('timeline').dataset.size=$('font-size').value);
  $('loop-line').addEventListener('click',()=>{singleLoop=!singleLoop;loopCue=singleLoop?Math.max(0,active):-1;pointA=null;pointB=null;loopLabel();});
  $('set-a').addEventListener('click',()=>{if(!ready)return;singleLoop=false;pointA=player.getCurrentTime();pointB=null;loopLabel();});
  $('set-b').addEventListener('click',()=>{if(!ready)return;const t=player.getCurrentTime();if(pointA===null||t<=pointA+.2){$('loop-status').textContent='先設定 A，B 需要晚於 A。';return;}pointB=t;singleLoop=false;loopLabel();});
  $('clear-loop').addEventListener('click',clearLoop);
  $('offset').addEventListener('input',()=>{offset=Number($('offset').value);$('offset-value').textContent=`${offset.toFixed(1)} 秒`;renderCues();setActive(ready?player.getCurrentTime():0,false);saveLRC();});
  $('reset-offset').addEventListener('click',()=>{$('offset').value='0';$('offset').dispatchEvent(new Event('input'));});
  $('import-open').addEventListener('click',()=>$('lrc-file').click());
  $('lrc-file').addEventListener('change',async()=>{
    const file=$('lrc-file').files[0];if(!file)return;const selected=video().videoId;
    try{if(file.size>512000)throw Error('檔案太大，請使用 500 KB 以內的 LRC。');const text=await file.text(),parsed=parseLRC(text);if(video().videoId!==selected)return;imported={text,name:file.name};cues=parsed;offset=0;clearLoop();renderCues();$('offset').value='0';$('offset-value').textContent='0.0 秒';saveLRC();setActive(ready?player.getCurrentTime():0,false);}catch(error){$('sync-status').textContent=error.message;}
    $('lrc-file').value='';
  });
  $('remove-lrc').addEventListener('click',()=>{try{localStorage.removeItem(storageKey());}catch{}clearLoop();restoreLRC();setActive(ready?player.getCurrentTime():0,false);});
  for(const id of ['youtube-open','anime-open','home-open','guide-open'])$(id).addEventListener('click',()=>{if(ready)pause();});
  addEventListener('hashchange',()=>{const i=songs.findIndex(s=>`#song-${s.id}`===location.hash);if(i>=0)select(i);});
  document.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,select,textarea,button,a'))return;
    if(event.code==='Space'){event.preventDefault();$('play').click();}
    if(['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const i=Math.max(0,Math.min(cues.length-1,active+(event.key==='ArrowDown'?1:-1)));seek(cues[i].start+offset);}
  });
  renderSong();playbackLabel();
  window.onYouTubeIframeAPIReady=()=>{
    player=new YT.Player('youtube-player',{host:'https://www.youtube-nocookie.com',videoId:video().videoId,width:'100%',height:'100%',playerVars:{playsinline:1,controls:1,rel:0,cc_load_policy:1,cc_lang_pref:'ja',origin:location.origin},events:{
      onReady:()=>{clearTimeout(apiTimer);apiUnavailable=false;$('youtube-open').hidden=true;ready=true;if(!currentPlayer())player.cueVideoById(video().videoId);playbackLabel();status('按影片的 ▶ 開始聽，文字會跟隨播放。');pollTimer=setInterval(tick,200);},
      onStateChange:event=>{
        if(!currentPlayer())return;
        const state=event.data;
        if(state===1){wanted=true;pending=true;lastTime=-1;status('正在確認影片播放…');}
        else if(state===2){wanted=false;pending=false;actualPlaying=false;clearAttempt();status('影片已暫停。');}
        else if(state===3){actualPlaying=false;pending=wanted;status('YouTube 緩衝中…');}
        else if(state===0){actualPlaying=false;pending=false;clearAttempt();if(singleLoop&&loopCue>=0){seek(cues[loopCue].start+offset);play();}else if(pointA!==null&&pointB!==null){seek(pointA);play();}else if(wanted&&index<songs.length-1)select(index+1);else{wanted=false;status('這首已播放完畢。');}}
        playbackLabel();
      },
      onAutoplayBlocked:()=>{wanted=false;pending=false;actualPlaying=false;clearAttempt();playbackLabel();status('瀏覽器需要播放許可，請點影片中的 ▶ 繼續。');},
      onPlaybackRateChange:event=>{$('speed').value=String(event.data);},
      onError:event=>{wanted=false;pending=false;actualPlaying=false;clearAttempt();playbackLabel();status(`這支影片目前無法在此播放（YouTube ${event.data}）。請用下方連結繼續。`);$('youtube-open').hidden=false;}
    }});
  };
  function apiFailed(){apiUnavailable=true;status('YouTube 播放器無法連線，仍可閱讀或用下方連結播放。');$('play').textContent='播放器無法連線';$('youtube-open').hidden=false;}
  apiTimer=setTimeout(apiFailed,15000);const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=apiFailed;document.body.append(script);
  addEventListener('pagehide',()=>{clearInterval(pollTimer);clearAttempt();});
  addEventListener('pageshow',event=>{if(event.persisted&&ready){clearInterval(pollTimer);pollTimer=setInterval(tick,200);}});
})();
