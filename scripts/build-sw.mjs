import {readdir,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {deflateSync} from 'node:zlib';
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else if(e.name!=='sw.js')out.push(p);}return out;}
function png(size){const crc32=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};const chunk=(name,b)=>{const n=Buffer.from(name),h=Buffer.alloc(4),c=Buffer.alloc(4);h.writeUInt32BE(b.length);c.writeUInt32BE(crc32(Buffer.concat([n,b])));return Buffer.concat([h,n,b,c]);};const raw=Buffer.alloc(size*(size*4+1));for(let y=0;y<size;y++)for(let x=0;x<size;x++){const X=x/size,Y=y/size;const outer=X>.2&&X<.79-Math.abs(Y-.5)*.7&&Y>.25&&Y<.75;const inner=X>.33&&X<.64-Math.abs(Y-.5)*.7&&Y>.38&&Y<.62;const on=outer&&!inner;const i=y*(size*4+1)+1+x*4;raw.set(on?[101,231,255,255]:[8,21,35,255],i);}const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
for(const size of [192,512])await writeFile('dist/icon-'+size+'.png',png(size));
await writeFile('dist/404.html','<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BLUE SECTOR / 404</title><body style="background:#081523;color:#91e2fc;font:18px sans-serif;padding:12%"><h1>404 / SIGNAL LOST</h1><p>页面不存在。请打开游戏主页。</p><a style="color:white" href="./">返回游戏</a></body></html>');
const files=await walk('dist'),hash=createHash('sha256');for(const p of files)hash.update(await readFile(p));const version=hash.digest('hex').slice(0,16);
const urls=files.map(p=>'./'+p.slice(5));urls.push('./');
const source=`const PREFIX='blue-sector-'+new URL(self.registration.scope).pathname.replace(/[^a-z0-9]/gi,'_')+'-';
const CACHE=PREFIX+'${version}',FILES=${JSON.stringify(urls)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin||!url.href.startsWith(self.registration.scope))return;
event.respondWith((async()=>{const cache=await caches.open(CACHE);if(event.request.mode==='navigate'){try{const res=await fetch(event.request);if(res.ok)return res;}catch{}return await cache.match('./index.html')||Response.error();}
const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;return fetch(event.request);})());});
`;
await writeFile('dist/sw.js',source);console.log('PWA precache:',urls.length,'files; revision',version);

