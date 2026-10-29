(() => {
  'use strict';
  window.VaundyPlayer = {create({host,button,status}) {
    const audio=host.querySelector('audio'), title=host.querySelector('strong');
    let song, wanted=false, playing=false, pending=false, switching=false, request=0, timer, previousTime=0;
    const player={select,pause:stop,onEnded:null};
    const url=()=>window.VAUNDY_PREVIEWS?.[song.spotifyTrackId];
    const current=()=>audio.currentSrc===url();
    function label() {
      button.disabled=!song||!url();
      button.textContent=playing?'❚❚ 暫停':pending?'取消播放':'▶ 開始試聽';
    }
    function stop() {
      request++;clearTimeout(timer);wanted=false;pending=false;playing=false;audio.pause();label();
    }
    function failed(error,id) {
      if(id!==request)return;
      clearTimeout(timer);wanted=false;pending=false;playing=false;label();
      status.textContent=error?.name==='NotAllowedError'?'請再按一次開始試聽，允許瀏覽器播放。':'試聽暫時無法播放，可再按一次或到 Spotify 聽。';
    }
    function play() {
      const id=++request;
      wanted=true;pending=true;playing=false;label();status.textContent='正在載入試聽…';clearTimeout(timer);
      // Keep this call in the click/next handler; never defer the user gesture to a ready event.
      const result=audio.play();
      result?.catch(error=>failed(error,id));
      timer=setTimeout(()=>{
        if(id===request&&!playing){stop();status.textContent='試聽尚未開始，請再按一次；也可到 Spotify 聽。';}
      },12000);
    }
    function select(next) {
      if(song?.spotifyTrackId===next.spotifyTrackId)return;
      const continuePlaying=wanted;
      request++;clearTimeout(timer);switching=true;playing=false;pending=false;previousTime=0;
      audio.pause();song=next;title.textContent=song.name;audio.setAttribute('aria-label',`${song.name} · 約 30 秒試聽`);
      if(!url()){wanted=false;audio.removeAttribute('src');audio.load();label();status.textContent='這首暫無公開試聽，請到 Spotify 聽。';return;}
      // The same HTMLAudioElement retains the listener's playback permission on WebKit.
      audio.src=url();audio.load();label();
      if(continuePlaying)play();else status.textContent='約 30 秒試聽 · 按一次開始，翻頁接著聽。';
    }
    button.addEventListener('click',()=>{
      if(!song||!url())return;
      if(playing||pending){stop();status.textContent='已暫停 · 按開始試聽繼續。';}
      else play();
    });
    audio.addEventListener('loadedmetadata',()=>{if(current())switching=false;});
    audio.addEventListener('play',()=>{
      if(!current())return;
      wanted=true;pending=true;label();
    });
    audio.addEventListener('timeupdate',()=>{
      if(!current()||audio.paused||audio.ended)return;
      // A play request or a provider event is not evidence of audible progress.
      if(audio.currentTime>previousTime&&audio.currentTime>0){
        wanted=true;playing=true;pending=false;clearTimeout(timer);label();
        status.textContent='試聽播放中 · 播完自動下一首。';
      }
      previousTime=audio.currentTime;
    });
    audio.addEventListener('waiting',()=>{if(current()&&wanted){playing=false;pending=true;label();status.textContent='試聽緩衝中…';}});
    audio.addEventListener('pause',()=>{
      if(switching||!current()||audio.ended||!audio.paused)return;
      stop();status.textContent='已暫停 · 按開始試聽繼續。';
    });
    audio.addEventListener('ended',()=>{
      if(!current())return;
      clearTimeout(timer);playing=false;pending=false;
      if(wanted&&player.onEnded?.())return;
      wanted=false;label();status.textContent='試聽已結束 · 按開始試聽再聽一次。';
    });
    audio.addEventListener('error',()=>{if(current())failed(audio.error,request);});
    label();return player;
  }};
})();
