(() => {
  'use strict';
  const songs = window.VAUNDY_SONGS, {escapeHTML:e, filterSongs} = window.VaundyCore;
  const $ = id => document.getElementById(id);
  let current = 0, tab = 'summary', playerTimer, toastTimer, motion;
  const hashIndex = () => songs.findIndex(s=>`#song-${s.id}` === location.hash);
  try { current = Math.max(0,songs.findIndex(s=>s.id===localStorage.getItem('vaundy-chapter-v1'))); } catch {}
  if (hashIndex() >= 0) current = hashIndex();
  function toast(message) { clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false; toastTimer=setTimeout(()=>$('toast').hidden=true,4200); }
  function renderTab() {
    const s=songs[current];
    document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    $('tab-content').setAttribute('aria-labelledby',`tab-${tab}`);
    if(tab==='summary') $('tab-content').innerHTML=`<dl><div><dt>歌名意思</dt><dd>${e(s.titleMeaning)}</dd></div><div><dt>核心意思</dt><dd>${e(s.summary)}</dd></div><div><dt>歌詞亮點</dt><dd>${e(s.highlight)}</dd></div></dl>`;
    if(tab==='meaning') $('tab-content').innerHTML=`<h2>歌詞大意 · 原創摘要</h2>${s.meaning.map(p=>`<p>${e(p)}</p>`).join('')}${s.context?`<h2>已核對的背景</h2><p>${e(s.context)}</p>`:''}<h2>一種聽法</h2><p>${e(s.interpretation)}</p>`;
    if(tab==='listen') $('tab-content').innerHTML=`<h2>聽的時候</h2><p>${e(s.listen)}</p><div class="listen-question"><h2>留給自己的一個問題</h2><p>${e(s.prompt)}</p></div>`;
  }
  function chapterList() {
    const found=filterSongs(songs,{query:$('chapter-search').value});
    $('chapters-list').innerHTML=found.map(s=>`<a href="#song-${s.id}" data-chapter="${s.id}" ${s.id===songs[current].id?'aria-current="true"':''}><span>${String(songs.indexOf(s)+1).padStart(2,'0')}</span>${e(s.name)}</a>`).join('');
    $('chapters-empty').hidden=found.length>0;
  }
  function render(changePlayer=true,animate=false) {
    const s=songs[current];
    $('chapter-number').textContent=`${String(current+1).padStart(2,'0')} / ${songs.length}`;
    $('aside-title').textContent=s.name; $('aside-chinese').textContent=s.chinese;
    $('song-title').textContent=s.name; $('song-line').textContent=s.line; $('song-meta').textContent=`${s.reading} · ${s.duration}`;
    $('position').textContent=`第 ${current+1} 首，共 ${songs.length} 首`;
    $('previous').disabled=current===0; $('next').disabled=current===songs.length-1;
    $('full-note').href=`index.html#song-${s.id}`;
    $('spotify-direct').href=`https://open.spotify.com/track/${s.spotifyTrackId}`;
    document.title=`${s.name} · Vaundy 逐首導聆`;
    renderTab();chapterList();
    $('sources-content').innerHTML=`<p>${e(s.name)} · ${e(s.research.checkedAt)} 核對</p><p>原文：${e(s.research.originalScope)}；中譯：${e(s.research.translationScope)}。</p><ul>${s.sources.map(x=>`<li><a href="${e(x.url)}" target="_blank" rel="noopener noreferrer">${e(x.name)} ↗</a><small>${e(x.scope)}${x.credit?'；'+e(x.credit):''}</small></li>`).join('')}</ul><p>${e(s.research.note)}</p>`;
    if(changePlayer) {
      clearTimeout(playerTimer);$('spotify-player').replaceChildren();
      playerTimer=setTimeout(()=>{const frame=document.createElement('iframe');frame.src=`https://open.spotify.com/embed/track/${s.spotifyTrackId}?theme=0`;frame.title=`Spotify：${s.name}`;frame.allow='encrypted-media; fullscreen; picture-in-picture';frame.referrerPolicy='strict-origin-when-cross-origin';$('spotify-player').replaceChildren(frame);},150);
    }
    if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches) {motion?.cancel();motion=$('chapter').animate([{opacity:.7,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});}
  }
  function go(index) {
    if(index<0||index>=songs.length||index===current)return;
    current=index;
    history.replaceState(null,'',`#song-${songs[current].id}`);
    try {localStorage.setItem('vaundy-chapter-v1',songs[current].id);}catch{}
    render(true,true);$('chapter').scrollTop=0;
    if(innerWidth<=850) $('chapter').scrollIntoView({block:'start',behavior:'instant'});
  }
  $('previous').addEventListener('click',()=>go(current-1));$('next').addEventListener('click',()=>go(current+1));
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;renderTab();}));
  document.querySelector('.tabs').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const names=['summary','meaning','listen'];let i=names.indexOf(tab);
    if(event.key==='Home')i=0;else if(event.key==='End')i=2;else i=(i+(event.key==='ArrowRight'?1:2))%3;
    tab=names[i];renderTab();$(`tab-${tab}`).focus();
  });
  $('chapters-open').addEventListener('click',()=>{$('chapters-dialog').showModal();$('chapter-search').focus();});
  $('chapters-close').addEventListener('click',()=>$('chapters-dialog').close());
  $('chapter-search').addEventListener('input',chapterList);
  $('chapters-list').addEventListener('click',event=>{const a=event.target.closest('[data-chapter]');if(!a)return;event.preventDefault();go(songs.findIndex(s=>s.id===a.dataset.chapter));$('chapters-dialog').close();$('chapter').focus({preventScroll:true});});
  $('sources-open').addEventListener('click',()=>$('sources-dialog').showModal());$('sources-close').addEventListener('click',()=>$('sources-dialog').close());
  addEventListener('hashchange',()=>{const i=hashIndex();if(i>=0)go(i);});
  addEventListener('keydown',event=>{
    if(document.querySelector('dialog[open]')||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('input,textarea,select,[role="tab"],[contenteditable="true"]'))return;
    if(event.key==='ArrowRight'){event.preventDefault();go(current+1);}if(event.key==='ArrowLeft'){event.preventDefault();go(current-1);}
  });
  $('share').addEventListener('click',async()=>{const u=new URL(location.href);u.hash=`song-${songs[current].id}`;try{await navigator.clipboard.writeText(u.href);toast('已複製這首歌的連結');}catch{toast('可複製瀏覽器網址，分享這首歌');history.replaceState(null,'',u.href);}});
  let touch;
  $('chapter').addEventListener('touchstart',event=>{if(event.touches.length===1&&!event.target.closest('a,button'))touch={x:event.touches[0].clientX,y:event.touches[0].clientY};else touch=null;},{passive:true});
  $('chapter').addEventListener('touchend',event=>{if(!touch)return;const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*2)go(current+(dx<0?1:-1));},{passive:true});
  render();
})();
