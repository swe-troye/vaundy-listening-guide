'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const files = ['index.html','style.css','data.js','core.js','app.js','favicon.svg','listen.html','listen.css','listen.js','previews.js','player.js','assets/horo-poster.jpg','assets/vaundy-guide.svg','youtube.html','youtube.css','youtube.js','youtube-data.js','youtube-lrc.js','youtube-core.js'];
const read = file => fs.readFileSync(path.join(root,file),'utf8');
for (const file of files) if(file.endsWith('.js')) new vm.Script(read(file),{filename:file});
for (const [page,script] of [['index.html','app.js'],['listen.html','listen.js'],['youtube.html','youtube.js']]) {
 const html=read(page);
 for (const [,id] of read(script).matchAll(/\$\('([\w-]+)'\)/g)) if(!html.includes(`id="${id}"`)) throw new Error(`Missing ${script} DOM anchor: ${id}`);
 for (const [,link] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {const target=link.split(/[?#]/)[0];if(!/^https?:/.test(target)&&!files.includes(target)) throw new Error(`Missing asset: ${target}`);}
}
const ctx={window:{}};vm.runInNewContext(read('data.js'),ctx);
const snapshot=JSON.parse(read('playlist-snapshot.json')),songs=ctx.window.VAUNDY_SONGS;
if(songs.length!==snapshot.tracks.length || songs.some((s,i)=>s.spotifyTrackId!==snapshot.tracks[i].id)) throw new Error('Playlist order/version mismatch');
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
for (const file of files) {fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(out,file));}
for (const [page,css,app,name] of [['index.html','style.css','app.js','standalone.html'],['listen.html','listen.css','listen.js','listen-standalone.html']]) {
 let html=read(page).replace(/\s*<script src="[\w-]+\.js(?:\?[^"]*)?" defer><\/script>/g,'');
 html=html.replace(new RegExp(`<link rel="stylesheet" href="${css.replace('.','\\.')}(?:\\?[^"]*)?">`),()=>`<style>${read(css)}</style>`);
 for(const [asset,mime] of [['favicon.svg','image/svg+xml'],['assets/horo-poster.jpg','image/jpeg'],['assets/vaundy-guide.svg','image/svg+xml']]) {const data=fs.readFileSync(path.join(root,asset)).toString('base64');html=html.split(`"${asset}"`).join(`"data:${mime};base64,${data}"`);}
 html=html.replaceAll('href="listen.html','href="listen-standalone.html').replaceAll('href="index.html','href="standalone.html');
 const scripts=['data.js','core.js',...(app==='listen.js'?['previews.js','player.js']:[]),app].map(f=>`<script>${read(f).replaceAll('listen.html#song-','listen-standalone.html#song-').replaceAll('index.html#song-','standalone.html#song-').replace(/<\/script/gi,'<\\/script')}</script>`).join('\n');
 html=html.replace('</body>',()=>`${scripts}\n</body>`);fs.writeFileSync(path.join(out,name),html);
}
console.log(`Built ${songs.length} songs, 19 static assets, and 2 portable HTML files.`);
