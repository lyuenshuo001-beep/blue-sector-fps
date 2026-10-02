import * as T from 'three';
export type Surface='plaster'|'stone'|'brick'|'wood'|'metal'|'rubber'|'tile';
const cache=new Map<string,T.MeshStandardMaterial>();const templates=new Map<Surface,T.MeshStandardMaterial>();
// Original deterministic micro-surface maps, generated locally; no external assets.
export function material(kind:Surface,color=0xffffff){
 const key=kind+color;if(cache.has(key))return cache.get(key)!;
 if(templates.has(kind)){const m=templates.get(kind)!.clone();m.color.setHex(color);cache.set(key,m);return m;} const size=256,c=document.createElement('canvas'),n=document.createElement('canvas'),r=document.createElement('canvas');c.width=n.width=r.width=size;c.height=n.height=r.height=size;
 const ctx=c.getContext('2d')!,nc=n.getContext('2d')!,rc=r.getContext('2d')!;
 const image=ctx.createImageData(size,size),normal=nc.createImageData(size,size),rough=rc.createImageData(size,size);
 const heights=new Float32Array(size*size);let seed=43;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){let h=.55+(rand()-.5)*.14;if(kind==='stone'||kind==='brick'||kind==='tile'){const row=Math.floor(y/64),xx=(x+(row%2)*64)%128;if(y%64<3||xx<3)h=.22;}if(kind==='wood')h=.5+Math.sin(x*.28+Math.sin(y*.05)*2)*.1+(rand()-.5)*.1;if(kind==='metal')h=.65+(rand()-.5)*.065-(y%42===0?.13:0);if(kind==='rubber')h=.3+((x+y)%8<3?.12:0);heights[y*size+x]=h;}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=y*size+x,i=k*4,h=heights[k],v=kind==='metal'?170+h*80:100+h*150;image.data.set([v,v,v,255],i);const dx=heights[y*size+(x+1)%size]-h,dy=heights[((y+1)%size)*size+x]-h;normal.data.set([128-dx*120,128-dy*120,250,255],i);const rv=kind==='metal'?95+h*70:kind==='rubber'?225:180+h*60;rough.data.set([rv,rv,rv,255],i);}
 ctx.putImageData(image,0,0);nc.putImageData(normal,0,0);rc.putImageData(rough,0,0);
 const tex=(canvas:HTMLCanvasElement,srgb=false)=>{const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};
 const m=new T.MeshStandardMaterial({color,map:tex(c,true),normalMap:tex(n),normalScale:new T.Vector2(.45,.45),roughnessMap:tex(r),roughness:kind==='metal'?.63:.98,metalness:kind==='metal'?.85:0});cache.set(key,m);templates.set(kind,m);return m;
}
export function worldUV(g:T.BufferGeometry,scale=.35){const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));uv.setXY(i,(ax>.6?p.getZ(i):p.getX(i))*scale,(ay>.6?p.getZ(i):p.getY(i))*scale);}return g;}


