(function (root) {
  'use strict';
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase().replace(/[’'"\s()-]/g, '');
  const filterSongs = (songs, {query = '', theme = '', savedOnly = false, saved = []}) => {
    const term = normalize(query);
    return songs.filter(s => (!term || normalize([s.name, s.spotify, s.reading, s.chinese].join(' ')).includes(term)) && (!theme || s.themes.includes(theme)) && (!savedOnly || saved.includes(s.id)));
  };
  function sanitizeState(raw, ids) {
    const valid = new Set(ids);
    const list = value => Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && valid.has(id)))] : [];
    return {saved: list(raw?.saved), read: list(raw?.read), mode: raw?.mode === 'quick' ? 'quick' : 'slow'};
  }
  function readState(storage, ids) {
    try { return {state: sanitizeState(JSON.parse(storage.getItem('vaundy-guide-v1') || '{}'), ids), available: true}; }
    catch { return {state: sanitizeState({}, ids), available: false}; }
  }
  const api = {escapeHTML, normalize, filterSongs, sanitizeState, readState};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VaundyCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
