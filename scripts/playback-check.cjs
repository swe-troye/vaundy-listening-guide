const assert=require('node:assert/strict');
const {chromium}=require('/Users/troye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
(async()=>{
 const b=await chromium.launch({executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',headless:true});
 try {
 const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  window.audit=[];let callback;
  Object.defineProperty(window,'onSpotifyIframeApiReady',{configurable:true,get:()=>callback,set:fn=>{callback=api=>{
   const create=api.createController.bind(api);api.createController=(el,options,cb)=>create(el,options,c=>{
    ['playback_started','playback_update'].forEach(n=>c.addListener(n,e=>window.audit.push({event:n,data:e.data})));
    cb(c);
   });fn(api);
  };}});
 });
 await p.goto((process.env.VAUNDY_SITE_URL||'http://localhost:4174/')+'listen.html#song-naki-jizo');
 await p.waitForFunction(()=>!document.querySelector('#play-toggle').disabled);
 await p.waitForTimeout(1500);assert.equal(await p.evaluate(()=>window.audit.some(e=>e.event==='playback_started')),false);console.log('PASS no forced audio on first visit');
 await p.click('#play-toggle');
 async function advancing(id){await p.waitForFunction(id=>window.audit.some(e=>e.data.playingURI==='spotify:track:'+id&&e.data.position>1500),id,{timeout:25000});console.log('PASS audio position advances',id);}
 await advancing('22D3hqjQ8R7t29wp6Gy44W');
 const old=await p.locator('#spotify-player iframe').elementHandle();
 await p.click('#next');await advancing('3CmVQtVx9KlzOuPhRJRShH');assert.equal(await old.evaluate(e=>e.isConnected),true);console.log('PASS persistent iframe auto-plays on chapter change');
 await p.click('#play-toggle');await p.click('#next');await p.waitForFunction(()=>!document.querySelector('#play-toggle').disabled);await p.waitForTimeout(2500);
 assert.equal(await p.evaluate(()=>window.audit.some(e=>e.data.playingURI==='spotify:track:'+window.VAUNDY_SONGS[2].spotifyTrackId&&!e.data.isPaused&&e.data.position>0)),false);
 assert.match(await p.locator('#play-toggle').innerText(),/開始播放/);console.log('PASS paused navigation remains paused');
 await p.click('#play-toggle');const id=await p.evaluate(()=>window.VAUNDY_SONGS[2].spotifyTrackId);await advancing(id);
 console.log('WAIT natural preview end');await p.waitForFunction(()=>document.querySelector('#slide-title').textContent==='再会',null,{timeout:45000});
 const nextId=await p.evaluate(()=>window.VAUNDY_SONGS[3].spotifyTrackId);await advancing(nextId);console.log('PASS natural end advances chapter and starts next song');assert.deepEqual(errors,[]);
 const offline=await b.newPage();await offline.route('https://open.spotify.com/embed/iframe-api/v1',r=>r.abort());await offline.goto((process.env.VAUNDY_SITE_URL||'http://localhost:4174/')+'listen.html#song-naki-jizo');await offline.waitForSelector('#spotify-player iframe');assert.match(await offline.locator('#play-toggle').innerText(),/點播放器/);await offline.click('#next');await offline.waitForFunction(()=>document.querySelector('#spotify-player iframe')?.src.includes('3CmVQtVx9KlzOuPhRJRShH'));assert.equal(await offline.locator('iframe').count(),1);assert.equal(await offline.locator('#guide-character').evaluate(e=>e.complete&&e.naturalWidth>0),true);console.log('PASS API failure retains illustrated page and falls back to exact track embed');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
