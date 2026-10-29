(() => {
  'use strict';
  window.VaundyPlayer = {create({host,button,status}) {
    let song, controller, api, mode='loading', ready=false, wanted=false, playing=false;
    let loadedId, switchTimer, attemptTimer, lastPosition=0, nearEnd=false, ended=false;
    const player={select,onEnded:null};
    const uri=()=>`spotify:track:${song.spotifyTrackId}`;
    const label=()=>{button.textContent=wanted?'❚❚ 暫停':'▶ 開始播放';button.disabled=mode!=='api'||!ready;};
    function finish() {
      if(ended||!wanted)return;
      ended=true;playing=false;clearTimeout(attemptTimer);
      if(!player.onEnded?.()){wanted=false;label();status.textContent='這段播放已結束 · 按播放再聽一次。';}
    }
    function decorate() {
      const frame=host.querySelector('iframe');
      if(frame){frame.title=`Spotify 播放器：${song.name}`;frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';}
    }
    function fallback() {
      if(mode==='api')return;
      mode='fallback';clearTimeout(switchTimer);
      const frame=document.createElement('iframe');frame.src=`https://open.spotify.com/embed/track/${song.spotifyTrackId}?theme=0`;
      host.replaceChildren(frame);decorate();button.disabled=true;button.textContent='點播放器的 ▶';
      status.textContent='自動播放暫時無法連線，可點播放器聽或在 Spotify 開啟。';
    }
    function requestPlay() {
      if(!controller||!wanted||!ready)return;
      status.textContent='正在開始播放…';controller.play();clearTimeout(attemptTimer);
      const id=song.spotifyTrackId;
      attemptTimer=setTimeout(()=>{
        if(song.spotifyTrackId===id&&!playing&&wanted){status.textContent='若尚未出聲，請點播放器的 ▶；瀏覽器可能需要允許播放。';}
      },8000);
    }
    function load() {
      if(!song)return;
      if(mode==='fallback'){fallback();return;}
      if(!controller)return;
      if(loadedId===song.spotifyTrackId)return;
      loadedId=song.spotifyTrackId;ready=false;playing=false;lastPosition=0;nearEnd=false;ended=false;label();
      status.textContent=wanted?'換歌中，將自動接著播放…':'按一次播放，翻頁時自動接著聽。';
      controller.loadEntity(uri());decorate();
    }
    function select(next) {
      if(song?.spotifyTrackId===next.spotifyTrackId)return;
      clearTimeout(switchTimer);clearTimeout(attemptTimer);
      // Stop old audio immediately, then coalesce rapid page changes.
      if(controller&&playing)controller.pause();song=next;playing=false;ready=false;label();
      if(api&&!controller)mount();
      else switchTimer=setTimeout(load,120);
    }
    function mount() {
      if(!song||controller||mode==='fallback')return;
      clearTimeout(apiTimeout);host.replaceChildren();const mount=document.createElement('div');host.append(mount);
      const initialId=song.spotifyTrackId;
      api.createController(mount,{uri:uri(),width:'100%',height:80},c=>{
        controller=c;mode='api';loadedId=initialId;decorate();
        c.addListener('ready',()=>{
          // Ignore a ready event from a superseded iframe navigation.
          if(loadedId!==song.spotifyTrackId){load();return;}
          const src=host.querySelector('iframe')?.src||'';
          if(!src.includes(song.spotifyTrackId))return;
          ready=true;label();decorate();if(wanted)requestPlay();
        });
        c.addListener('playback_started',event=>{
          if(event.data.playingURI!==uri())return;
          playing=true;wanted=true;clearTimeout(attemptTimer);label();
          status.textContent='播放中 · 翻頁自動接著聽，播放長度依 Spotify 支援。';
        });
        c.addListener('playback_update',event=>{
          const d=event.data;
          if(d.playingURI!==uri()||loadedId!==song.spotifyTrackId)return;
          if(d.isBuffering){status.textContent='Spotify 緩衝中…';return;}
          if(d.duration>0&&d.position>=d.duration-1200)nearEnd=true;
          // Spotify previews can report position === duration while isPaused stays false.
          if(d.duration>0&&d.position>=d.duration&&wanted){finish();return;}
          if(d.isPaused) {
            const finished=nearEnd&&d.position===0&&lastPosition>0;
            playing=false;
            if(finished&&wanted){finish();return;}
            if(d.position>0){wanted=false;clearTimeout(attemptTimer);label();status.textContent='已暫停 · 按播放繼續聽。';}
          } else if(d.position>0) {
            playing=true;wanted=true;clearTimeout(attemptTimer);label();
            status.textContent='播放中 · 翻頁自動接著聽，播放長度依 Spotify 支援。';
          }
          lastPosition=d.position;
        });
        c.addListener('error',()=>{clearTimeout(attemptTimer);playing=false;wanted=false;label();status.textContent='Spotify 暫時無法播放，請點播放器重試或在 Spotify 開啟。';});
        if(loadedId!==song.spotifyTrackId)load();
      });
    }
    button.addEventListener('click',()=>{
      if(!controller||!ready)return;
      wanted=!wanted;label();
      if(wanted){ended=false;nearEnd=false;requestPlay();}
      else{playing=false;clearTimeout(attemptTimer);controller.pause();status.textContent='已暫停 · 按播放繼續聽。';}
    });
    const apiTimeout=setTimeout(fallback,12000);
    window.onSpotifyIframeApiReady=nextApi=>{api=nextApi;mount();};
    const script=document.createElement('script');script.src='https://open.spotify.com/embed/iframe-api/v1';script.async=true;script.onerror=fallback;document.body.append(script);
    return player;
  }};
})();
