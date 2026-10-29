/* Timeline utilities shared by the experimental player and its tests. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VaundyTimeline=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  function parseLRC(text) {
    if(typeof text!=='string'||text.length>512000)throw Error('檔案太大，請使用 500 KB 以內的 LRC。');
    const offset=Number(text.match(/^\[offset:([+-]?\d+)\]/mi)?.[1]||0)/1000;
    if(!Number.isFinite(offset)||Math.abs(offset)>3600)throw Error('LRC 時間偏移超出可用範圍。');
    const groups=new Map();
    for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)) {
      const tags=[...line.matchAll(/\[(\d{1,3}):([0-5]?\d)(?:[.:](\d{1,3}))?\]/g)];
      if(!tags.length)continue;
      const words=line.replace(/\[[^\]]*\]/g,'').trim();if(!words)continue;
      for(const tag of tags) {
        const t=Math.max(0,Number(tag[1])*60+Number(tag[2])+Number(`0.${tag[3]||'0'}`)+offset);
        if(!groups.has(t))groups.set(t,[]);
        if(!groups.get(t).includes(words))groups.get(t).push(words);
      }
    }
    if(!groups.size)throw Error('找不到時間標記，例如 [00:12.50]。');
    if(groups.size>3000)throw Error('時間標記太多，請使用單首歌的 LRC。');
    return [...groups].sort((a,b)=>a[0]-b[0]).map(([start,lines])=>({start,primary:lines[0],secondary:lines.slice(1).join('\n')}));
  }
  function activeIndex(cues,time,offset=0) {
    let low=0,high=cues.length-1,result=-1;
    while(low<=high){const mid=(low+high)>>1;if(cues[mid].start+offset<=time){result=mid;low=mid+1;}else high=mid-1;}
    return result;
  }
  function formatTime(seconds) {
    const value=Math.max(0,Math.floor(Number(seconds)||0));return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
  }
  return {parseLRC,activeIndex,formatTime};
});
