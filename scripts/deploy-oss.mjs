import OSS from 'ali-oss';import {readdir,readFile} from 'node:fs/promises';import path from 'node:path';
const required=['ALIYUN_ACCESS_KEY_ID','ALIYUN_ACCESS_KEY_SECRET','ALIYUN_OSS_BUCKET','ALIYUN_OSS_ENDPOINT'];for(const key of required)if(!process.env[key])throw new Error('Missing secret: '+key);
const client=new OSS({accessKeyId:process.env.ALIYUN_ACCESS_KEY_ID,accessKeySecret:process.env.ALIYUN_ACCESS_KEY_SECRET,bucket:process.env.ALIYUN_OSS_BUCKET,endpoint:process.env.ALIYUN_OSS_ENDPOINT,secure:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const files=await walk('dist');files.sort((a,b)=>{const rank=p=>p.endsWith('sw.js')?3:p.endsWith('index.html')?2:1;return rank(a)-rank(b);});
for(const file of files){const key=path.relative('dist',file).split(path.sep).join('/');await client.put(key,await readFile(file),{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':key.startsWith('assets/')?'public, max-age=31536000, immutable':'no-cache'}});console.log('Uploaded',key);}
console.log('Deployment complete. Old hashed assets were retained for clients running the previous release.');

