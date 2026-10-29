'use strict';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/private/tmp/vaundy-browsers';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('/Users/troye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
(async()=>{
 const engine=process.env.VAUNDY_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===chromium?{executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('youtube.html#song-odoriko',process.env.VAUNDY_SITE_URL||'http://localhost:4174/').href);
  await page.waitForFunction(()=>!document.querySelector('#play').disabled,null,{timeout:30000});
  assert.match(await page.locator('iframe').getAttribute('src'),/youtube-nocookie\.com\/embed\/CnlMTBwsBHs/);
  await page.click('#play');
  await page.waitForFunction(()=>document.querySelector('#player-status').textContent.includes('影片播放中')&&Number(document.querySelector('#time').textContent.split(':')[1])>=2,null,{timeout:20000});
  console.log('PASS live YouTube video playback time advances in '+engine.name());
  assert.match(await page.locator('#content-kind').innerText(),/原創繁中翻譯/);
  const cue=await page.evaluate(()=>window.VaundyTimeline.parseLRC(window.VAUNDY_LRC['odoriko'].text)[1]);
  await page.locator('[data-cue="1"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-cue="1"]').getAttribute('aria-current')==='true');
  assert.equal(await page.locator('[data-cue="1"] .cue-primary').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('rt').forEach(x=>x.remove());return copy.textContent;}),cue.primary);
  assert.equal(await page.locator('[data-cue="1"] .cue-secondary').innerText(),cue.secondary);
  console.log('PASS bundled Japanese and Chinese seek and highlight together on live playback');
  await page.locator('#lrc-file').setInputFiles({name:'original-test.lrc',mimeType:'text/plain',buffer:Buffer.from('[00:00]本機測試提示一\n[00:02]本機測試提示二\n[00:40]本機測試提示三')});
  await page.waitForFunction(()=>document.querySelectorAll('.cue').length===3);await page.locator('[data-cue="1"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-cue="1"]').getAttribute('aria-current')==='true');console.log('PASS real YouTube seeking highlights imported local cue');
  await page.click('#next');
  await page.waitForFunction(()=>document.querySelector('#song-title').textContent==='怪獣の花唄'&&document.querySelector('#player-status').textContent.includes('影片播放中')&&Number(document.querySelector('#time').textContent.split(':')[1])>=2,null,{timeout:20000});
  console.log('PASS next official original video starts and its playback time advances');assert.match(await page.locator('#content-kind').innerText(),/字幕待補/);assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:process.env.VAUNDY_LIVE_SCREENSHOT||'/private/tmp/vaundy-youtube-live.png',fullPage:true});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
