'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {parseLRC,activeIndex,formatTime}=require('../youtube-core.js');
test('LRC parsing keeps bilingual lines, repeated timestamps, fractions and BOM',()=>{
 const cues=parseLRC('\uFEFF[ar:本機測試]\n[00:01.5]第一句提示\n[00:01.50]First note\n[00:03.125][00:06.00]第二句提示\n[00:08.00]\n');
 assert.deepEqual(cues,[{start:1.5,primary:'第一句提示',secondary:'First note'},{start:3.125,primary:'第二句提示',secondary:''},{start:6,primary:'第二句提示',secondary:''}]);
});
test('LRC sorting, offset and hostile markup are treated as plain text',()=>{
 const cues=parseLRC('[offset:-500]\n[00:05.00]後段提示\n[00:02.00]<img src=x onerror=alert(1)>');
 assert.equal(cues[0].start,1.5);assert.equal(cues[0].primary,'<img src=x onerror=alert(1)>');assert.equal(cues[1].start,4.5);
 assert.throws(()=>parseLRC('[offset:'+'9'.repeat(400)+']\n[00:00]文字'),/偏移/);
});
test('bad or oversized LRC fails without inventing timing',()=>{
 assert.throws(()=>parseLRC('沒有時間軸'),/時間標記/);assert.throws(()=>parseLRC('x'.repeat(512001)),/太大/);assert.throws(()=>parseLRC('[00:99]無效秒數'),/時間標記/);
});
test('active cue uses timestamp boundaries, seek-back and user offset',()=>{
 const cues=parseLRC('[00:02]提示一\n[00:06]提示二\n[00:10]提示三');
 assert.equal(activeIndex(cues,1),-1);assert.equal(activeIndex(cues,6),1);assert.equal(activeIndex(cues,3),0);assert.equal(activeIndex(cues,6,1),0);assert.equal(activeIndex(cues,12),2);assert.equal(activeIndex([],8),-1);assert.equal(formatTime(125.7),'02:05');
});
test('all 21 official video IDs preserve the selected recordings',()=>{
 const ctx={window:{}};for(const file of ['data.js','youtube-data.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 const songs=ctx.window.VAUNDY_SONGS, videos=ctx.window.VAUNDY_VIDEOS;
 assert.equal(Object.keys(videos).length,21);for(const song of songs){const v=videos[song.id];assert.match(v.videoId,/^[A-Za-z0-9_-]{11}$/);assert.match(v.channel,/^Vaundy/);assert.equal(v.source,'https://www.youtube.com/watch?v='+v.videoId);}
 assert.equal(videos.kaiju.title,'怪獣の花唄');assert.equal(videos.kaiju.videoId,'ENQANfv2ANQ');
});
test('all supplied songs have bilingual timing within the selected studio recording',()=>{
 const ctx={window:{}};for(const file of ['data.js','youtube-data.js','youtube-lrc.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 const {VAUNDY_SONGS:songs,VAUNDY_VIDEOS:videos,VAUNDY_LRC:lyrics}=ctx.window;
 assert.equal(Object.keys(lyrics).length,21);
 for(const song of songs.filter(s=>lyrics[s.id])){
  const lrc=lyrics[song.id],cues=parseLRC(lrc.text),video=videos[song.id];
  assert.ok(cues.length>=20,song.id);assert.ok(cues.every(c=>c.primary&&c.secondary),song.id);
  assert.ok(cues.every(c=>!c.primary.includes('^')),song.id+' does not mix embedded English annotations into Japanese');
  assert.ok(cues.at(-1).start<=video.durationSeconds+2,song.id+' end timing fits recording');
  assert.ok(Math.abs(lrc.duration-video.durationSeconds)<=2,song.id+' is not the longer MV');
  assert.equal(video.channelId,'UC8_Ag6BVp43Vmrx6eillK9g');assert.equal(lrc.timingVerified,false);
  assert.match(lrc.sourceUrl,/^https:\/\/lrclib\.net\//);assert.equal(lrc.translationCredit,'本站原創繁中翻譯');
 }
 assert.equal(lyrics.kaiju.name,'怪獣の花唄');assert.equal(lyrics.kaiju.originalScript,'romaji');assert.equal(lyrics.kaiju.providedFile,'vaundy_extra_4_lrc.zip');
});
test('ruby segments preserve supplied lyric text and contextual sung readings',()=>{
 const ctx={window:{}};for(const file of ['youtube-lrc.js','youtube-readings.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 const {VAUNDY_LRC:lyrics,VAUNDY_READINGS:readings}=ctx.window;
 assert.equal(Object.keys(readings).length,21);
 for(const [id,lrc] of Object.entries(lyrics)){
  for(const cue of parseLRC(lrc.text)){
   const segments=readings[id].lines[cue.primary];assert.ok(segments,id+' has this cue');
   assert.equal(segments.map(x=>x.text).join(''),cue.primary,id+' keeps original text');
   assert.ok(segments.every(x=>x.reading||!/[\u3400-\u9fff]/u.test(x.text)),id+' annotates supplied kanji');
  }
  assert.match(readings[id].sourceUrl,/^https:\/\/(www\.marumaru-x\.com|utaten\.com)\//);
 }
 for(const line of ['超 try','超 high'])assert.equal(readings.saikai.lines[line].find(x=>x.text==='超').reading,'super');
 assert.ok(Object.values(readings.saikai.lines).some(line=>line.some(x=>x.text==='隅'&&x.reading==='すき')));
 assert.equal(readings['tokyo-flash'].lines[Object.keys(readings['tokyo-flash'].lines).find(x=>x.includes('上手'))].find(x=>x.text==='上手').reading,'うま');
 assert.ok(Object.values(readings.napori.lines).some(line=>line.some(x=>x.text==='2人'&&x.reading==='ふたり')));
});

test('four extra supplied subtitles preserve sources and use the original kaiju recording',()=>{
 const ctx={window:{}};for(const file of ['data.js','youtube-data.js','youtube-lrc.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 const {VAUNDY_SONGS:songs,VAUNDY_VIDEOS:videos,VAUNDY_LRC:lyrics,VAUNDY_LRC_SOURCES:sources}=ctx.window;
 assert.deepEqual(Object.keys(sources).sort(),['hashire-sakamoto','kaiju','singularity','wasureru-mae-ni']);
 assert.equal(songs.filter(s=>!lyrics[s.id]).length,0);
 for(const [id,source] of Object.entries(sources)){
  assert.equal(lyrics[id].sourceUrl,source.sourceUrl);assert.equal(lyrics[id].providedFile,'vaundy_extra_4_lrc.zip');assert.equal(source.apiUrl,'https://lrclib.net/api/get/'+source.id);
  assert.ok(Math.abs(source.duration-videos[id].durationSeconds)<=2);
  assert.equal(source.timingVerified,false);assert.ok(source.timestampCount>=20);
 }
});
