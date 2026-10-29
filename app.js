(() => {
  'use strict';
  const songs = window.VAUNDY_SONGS;
  const {escapeHTML: e, filterSongs, readState} = window.VaundyCore;
  const ids = songs.map(s => s.id);
  let loaded;
  try { loaded = readState(window.localStorage, ids); }
  catch { loaded = {state: {saved: [], read: [], mode: 'slow'}, available: false}; }
  const state = loaded.state;
  const $ = id => document.getElementById(id);
  const playlist = 'https://open.spotify.com/playlist/37i9dQZF1DXarlFLUSkBwQ';
  const icons = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 5.8c-2-2.3-5.3-2.3-8.5.7-3.2-3-6.5-3-8.5-.7-2 2.3-1.5 5.7 1 8.2L12 21l7.5-7c2.5-2.5 3-5.9 1-8.2Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/></svg>',
    listen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12H3v7h4v-7H4Zm16 0h1v7h-4v-7h3Z"/></svg>'
  };
  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4200);
  }
  function persist() {
    try { window.localStorage.setItem('vaundy-guide-v1', JSON.stringify(state)); return true; }
    catch { return false; }
  }
  function statusNote(s) {
    if (s.verified) return `<p class="content-note verified-note"><span>${s.id === 'hashire-sakamoto' ? '完整原文已讀・中譯範圍另註' : '完整原文・中譯已讀'}</span>${e(s.research.checkedAt)} 核對；以下為原創大意與延伸聽法。</p>`;
    if (s.pending) return '<p class="content-note"><span>歌詞待核對</span>目前提供聆聽提問，完整解讀尚未補齊。</p>';
    if (s.partial) return '<p class="content-note"><span>開頭導聆</span>依可見歌詞預覽整理，完整敘事待核對。</p>';
    return '<p class="content-note"><span>背景已核對</span>已核對官方發行背景；未取得完整歌詞，以下僅提供背景與聆聽提示。</p>';
  }
  function sourceDetails(s) {
    if (!s.sources?.length) return '';
    return `<details class="song-sources"><summary>歌詞與背景來源</summary><div class="source-note"><p>核對日期：${e(s.research.checkedAt)}。原文：${e(s.research.originalScope)}；中文對照：${e(s.research.translationScope)}。</p><ul>${s.sources.map(source => `<li><a href="${e(source.url)}" target="_blank" rel="noopener noreferrer">${e(source.name)} ↗<span class="sr-only">（在新分頁開啟）</span></a><p>${e(source.scope)}${source.credit ? `；${e(source.credit)}` : ''}</p></li>`).join('')}</ul><p>${e(s.research.note)}</p><p>本頁依日文原文撰寫中文摘要，不轉貼完整歌詞或逐句翻譯。「一種聽法」與提問為編輯延伸${s.context ? '；歌曲背景另列於深入內容。' : '，不是作者正式解說。'}</p></div></details>`;
  }
  function article(s, i) {
    const isSaved = state.saved.includes(s.id), isRead = state.read.includes(s.id);
    const paragraphs = s.meaning.map(p => `<p>${e(p)}</p>`).join('');
    return `<article class="song" id="song-${s.id}" data-id="${s.id}" aria-labelledby="title-${s.id}" tabindex="-1">
      <div class="song-topline"><p class="song-position"><strong>${String(i + 1).padStart(2, '0')}</strong><span>歌單第 ${i + 1} 首</span><span class="song-state" ${isRead ? '' : 'hidden'}>已讀</span></p><div class="song-buttons"><button type="button" class="icon-button read-button" data-action="read" data-song="${s.id}" aria-pressed="${isRead}" aria-label="${isRead ? '取消已讀' : '標記已讀'}：${e(s.name)}">${icons.check}</button><button type="button" class="icon-button save-button" data-action="save" data-song="${s.id}" aria-pressed="${isSaved}" aria-label="${isSaved ? '取消收藏' : '收藏'}：${e(s.name)}">${icons.heart}</button></div></div>
      <h2 id="title-${s.id}">${e(s.name)}</h2><p class="song-meta"><span>${e(s.reading)}</span><span class="divider" aria-hidden="true">/</span><span>${e(s.chinese)}</span><span class="divider" aria-hidden="true">/</span><span>${e(s.duration)}</span></p>
      <p class="song-line">${e(s.line)}</p>
      ${s.themes.length ? `<div class="tags" aria-label="歌曲主題">${s.themes.map(t => `<span class="tag">${e(t)}</span>`).join('')}</div>` : ''}
      <div class="summary-block"><p class="summary-label">白話導聆</p><dl class="summary-facts"><div><dt>歌名意思</dt><dd>${e(s.titleMeaning)}</dd></div><div><dt>核心意思</dt><dd class="summary-copy">${e(s.summary)}</dd></div><div><dt>歌詞亮點</dt><dd>${e(s.highlight)}</dd></div></dl></div>
      ${statusNote(s)}
      <details class="song-details"><summary>${s.pending ? '閱讀聆聽提問與背景' : '深入這首歌'}</summary><div class="detail-content">
        ${paragraphs ? `<section class="detail-section"><h3>${s.verified ? '歌詞大意（原創中文摘要）' : s.partial ? '目前讀到的開頭大意' : '已核對的歌曲背景'}</h3>${paragraphs}</section>` : ''}
        ${s.context ? `<section class="detail-section"><h3>已核對的歌曲背景</h3><p>${e(s.context)}</p></section>` : ''}
        <section class="detail-section"><h3>${s.pending ? '這則筆記的範圍' : '一種聽法'}</h3><p>${e(s.interpretation)}</p></section>
        ${s.image ? `<div class="listening-scene"><p>${e(s.image)}</p></div>` : ''}
        <p class="word-note">${e(s.word)}</p><div class="reflection"><h3>留給自己的一個問題</h3><p>${e(s.prompt)}</p></div>
        <p class="source-note">${s.verified ? '依完整原文閱讀後撰寫；每首的閱讀範圍、譯者資訊與來源連結在下方。' : '內容範圍以本首核對標示為準。'}<br><a href="${playlist}" target="_blank" rel="noopener noreferrer">回原始歌單聽聽 ↗<span class="sr-only">（在新分頁開啟）</span></a></p>
        <nav class="song-navigation" aria-label="${e(s.name)}的前後歌曲">${i > 0 ? `<a href="#song-${songs[i - 1].id}">← ${e(songs[i - 1].name)}</a>` : '<span></span>'}${i < songs.length - 1 ? `<a href="#song-${songs[i + 1].id}">${e(songs[i + 1].name)} →</a>` : '<a href="#top">回到頂部 ↑</a>'}</nav>
      </div></details>
      <p class="listen-tip">${icons.listen}<span><strong>聽的時候</strong>${e(s.listen)}</span></p>
      <nav class="song-listening-links" aria-label="${e(s.name)}的聆聽方式"><a class="track-listen track-lyrics" href="youtube.html#song-${s.id}" target="_blank" rel="noopener noreferrer">${icons.listen} 完整播放・歌詞跟唱 ↗<span class="sr-only">（在新分頁開啟）</span></a><a class="track-listen" href="listen.html#song-${s.id}" target="_blank" rel="noopener noreferrer">動漫導聆・30 秒試聽 ↗<span class="sr-only">（在新分頁開啟）</span></a></nav>
      ${sourceDetails(s)}
    </article>`;
  }
  const intro = window.VAUNDY_INTRO;
  $('artist-intro').innerHTML = `<p class="intro-kicker">聽歌之前</p><h2 id="artist-title">${e(intro.title)}</h2><p class="artist-lead">${e(intro.lead)}</p><div class="artist-basics">${intro.sections.slice(0,2).map(s=>`<section><h3>${e(s.title)}</h3><p>${e(s.text)}</p></section>`).join('')}</div><details class="artist-background"><summary>多看一點：版本、巡演與演前準備</summary><div class="artist-more">${intro.sections.slice(2).map(s=>`<section><h3>${e(s.title)}</h3><p>${e(s.text)}</p></section>`).join('')}</div></details><nav class="intro-sources" aria-label="Vaundy介紹來源">${intro.sources.map(s=>`<a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.name)} ↗<span class="sr-only">（在新分頁開啟）</span></a>`).join('')}</nav>`;
  $('songs').innerHTML = songs.map(article).join('');
  const navHTML = songs.map((s, i) => `<a class="nav-song" href="#song-${s.id}" data-nav="${s.id}"><span class="nav-number">${String(i + 1).padStart(2, '0')}</span><span class="nav-name">${e(s.name)}</span><span class="nav-read" aria-hidden="true">${state.read.includes(s.id) ? '✓' : ''}</span><span class="sr-only nav-read-label">${state.read.includes(s.id) ? '，已讀' : ''}</span></a>`).join('');
  $('song-nav').innerHTML = navHTML; $('mobile-song-nav').innerHTML = navHTML;
  function updateProgress() {
    $('progress-count').textContent = `${state.read.length} / ${songs.length}`;
    $('reading-progress').max = songs.length;
    $('reading-progress').value = state.read.length;
    songs.forEach(s => document.querySelectorAll(`[data-nav="${s.id}"]`).forEach(a => {
      a.querySelector('.nav-read').textContent = state.read.includes(s.id) ? '✓' : '';
      a.querySelector('.nav-read-label').textContent = state.read.includes(s.id) ? '，已讀' : '';
    }));
  }
  function filters() { return {query: $('song-search').value, theme: $('theme-filter').value, savedOnly: $('saved-only').getAttribute('aria-pressed') === 'true', saved: state.saved}; }
  function applyFilters() {
    const values = filters(), found = filterSongs(songs, values), visible = new Set(found.map(s => s.id));
    songs.forEach(s => { $(`song-${s.id}`).hidden = !visible.has(s.id); });
    const filtered = Boolean(values.query || values.theme || values.savedOnly);
    $('clear-filters').hidden = !filtered;
    $('results-count').textContent = found.length === songs.length && !filtered ? `${songs.length} 首歌，從這裡開始。` : `找到 ${found.length} 首歌`;
    $('empty-state').hidden = found.length > 0;
    if (!found.length) {
      const noSaved = values.savedOnly && !state.saved.length;
      $('empty-title').textContent = noSaved ? '先收藏一首喜歡的歌' : '還沒找到符合的歌曲';
      $('empty-copy').textContent = noSaved ? '點每首歌旁邊的愛心，再回來複習。' : '試試另一個歌名，或清除主題與收藏篩選。';
    }
    document.querySelectorAll('[data-nav][aria-current]').forEach(a => { if (!visible.has(a.dataset.nav)) a.removeAttribute('aria-current'); });
    return found;
  }
  function resetFilters() {
    $('song-search').value = ''; $('theme-filter').value = '';
    $('saved-only').setAttribute('aria-pressed', 'false'); applyFilters();
  }
  $('song-search').addEventListener('input', applyFilters);
  $('theme-filter').addEventListener('change', applyFilters);
  $('saved-only').addEventListener('click', () => {
    $('saved-only').setAttribute('aria-pressed', String($('saved-only').getAttribute('aria-pressed') !== 'true')); applyFilters();
  });
  $('clear-filters').addEventListener('click', () => { resetFilters(); $('song-search').focus(); });
  $('empty-reset').addEventListener('click', () => { resetFilters(); $('song-search').focus(); });
  function setMode(mode, retainPosition = true) {
    // Native radios/CSS switch the view even if an unrelated script fails.
    // Restore the previous layout briefly to measure the reading anchor.
    $('slow-mode').checked = state.mode === 'slow';
    $('quick-mode').checked = state.mode === 'quick';
    const threshold = $('reading-controls').getBoundingClientRect().bottom;
    const anchor = retainPosition ? [...document.querySelectorAll('.song:not([hidden])')].find(a => a.getBoundingClientRect().bottom > threshold) : null;
    const oldTop = anchor?.getBoundingClientRect().top;
    state.mode = mode; document.body.dataset.mode = mode;
    $('slow-mode').checked = mode === 'slow';
    $('quick-mode').checked = mode === 'quick';
    $('mode-description').textContent = mode === 'slow' ? '歌名、核心意思與亮點，喜歡再往裡讀。' : '一句話＋聆聽重點，入場前再看一次。';
    // Keep the same song and relative reading position when content above changes height.
    if (anchor && oldTop < window.innerHeight) {
      // When an expanded article shrinks, keep at least its heading in view.
      const newHeight = anchor.getBoundingClientRect().height;
      const preservedTop = Math.max(oldTop, threshold - Math.min(newHeight - 44, 120));
      const delta = anchor.getBoundingClientRect().top - preservedTop;
      if (delta) window.scrollBy({top: delta, behavior: 'instant'});
    }
    if (retainPosition && !persist()) toast('已切換模式；瀏覽器無法保存，本次仍可正常閱讀。');
  }
  $('slow-mode').addEventListener('change', () => { if ($('slow-mode').checked) setMode('slow'); });
  $('quick-mode').addEventListener('change', () => { if ($('quick-mode').checked) setMode('quick'); });
  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (button) {
      const id = button.dataset.song, action = button.dataset.action, key = action === 'save' ? 'saved' : 'read';
      const active = !state[key].includes(id), song = songs.find(s => s.id === id);
      state[key] = active ? [...state[key], id] : state[key].filter(item => item !== id);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', `${action === 'save' ? active ? '取消收藏' : '收藏' : active ? '取消已讀' : '標記已讀'}：${song.name}`);
      $(`song-${id}`).querySelector('.song-state').hidden = !state.read.includes(id);
      button.title = button.getAttribute('aria-label');
      updateProgress(); const stored = persist();
      if (action === 'save') {
        const willHide = filters().savedOnly && !active;
        applyFilters();
        if (willHide) { $('saved-only').focus(); }
        toast((active ? `已收藏〈${song.name}〉` : `已取消收藏〈${song.name}〉`) + (stored ? '' : '；僅本次有效，瀏覽器無法保存。'));
      } else toast((active ? `〈${song.name}〉已讀` : `〈${song.name}〉取消已讀`) + (stored ? '' : '；僅本次有效，瀏覽器無法保存。'));
      return;
    }
    const link = event.target.closest('a[href^="#song-"]');
    if (link) {
      const id = link.getAttribute('href').slice(6);
      if (!ids.includes(id)) return;
      event.preventDefault(); resetFilters();
      if ($('directory-dialog').open) $('directory-dialog').close();
      try { history.replaceState(null, '', `#song-${id}`); }
      catch { location.hash = `song-${id}`; }
      const target = $(`song-${id}`);
      target.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
      target.focus({preventScroll: true});
      markCurrent(id);
    }
  });
  function markCurrent(id) {
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  function handleHash() {
    const id = location.hash.slice(6);
    if (!location.hash.startsWith('#song-') || !ids.includes(id)) return;
    resetFilters();
    requestAnimationFrame(() => { $(`song-${id}`).scrollIntoView({block: 'start', behavior: 'instant'}); markCurrent(id); });
  }
  window.addEventListener('hashchange', handleHash);
  $('open-directory').addEventListener('click', () => $('directory-dialog').showModal());
  $('close-directory').addEventListener('click', () => $('directory-dialog').close());
  $('directory-dialog').addEventListener('click', event => {
    if (event.target !== $('directory-dialog')) return;
    const box = $('directory-dialog').getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('directory-dialog').close();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting && !entry.target.hidden).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) markCurrent(visible[0].target.dataset.id);
    }, {rootMargin: '-180px 0px -50% 0px', threshold: 0});
    document.querySelectorAll('.song').forEach(a => observer.observe(a));
  }
  setMode(state.mode, false); updateProgress(); applyFilters(); handleHash();
  document.querySelectorAll('.icon-button').forEach(button => { button.title = button.getAttribute('aria-label'); });
  if (!loaded.available) toast('瀏覽器無法讀取已存進度，本次仍可正常閱讀。');
})();
