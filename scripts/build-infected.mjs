// Original organic infected meshes. Run with Node; no downloaded game assets.
import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:application/octet-stream;base64,'+Buffer.from(b).toString('base64');this.onloadend?.();});}};
const out='public/assets/infected';await mkdir(out,{recursive:true});
const crc=b=>{let c=0xffffffff;for(const v of b){c^=v;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
function png(size,pixel){const raw=Buffer.alloc(size*(size*4+1));for(let y=0;y<size;y++)for(let x=0;x<size;x++)raw.set([...pixel(x,y),255],y*(size*4+1)+1+x*4);const chunk=(n,b)=>{const name=Buffer.from(n),h=Buffer.alloc(4),c=Buffer.alloc(4);h.writeUInt32BE(b.length);c.writeUInt32BE(crc(Buffer.concat([name,b])));return Buffer.concat([h,name,b,c]);};const h=Buffer.alloc(13);h.writeUInt32BE(size);h.writeUInt32BE(size,4);h[8]=8;h[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const noise=(x,y)=>{const s=Math.sin(x*12.9898+y*78.233)*43758.5453;return s-Math.floor(s);};
await writeFile(out+'/tissue-color.png',png(256,(x,y)=>{const vein=Math.abs(Math.sin(x*.12+Math.sin(y*.052)*5)),n=noise(x,y);return vein<.07?[140+n*25,116+n*20,115+n*20]:[195+n*50,193+n*45,185+n*43];}));
await writeFile(out+'/tissue-normal.png',png(256,(x,y)=>[128+(noise(x+1,y)-noise(x,y))*35,128+(noise(x,y+1)-noise(x,y))*35,250]));
await writeFile(out+'/tissue-roughness.png',png(256,(x,y)=>{const v=160+noise(x,y)*75;return[v,v,v];}));
for(const kind of ['infected','spitter','bomber','pouncer'])for(const low of [false,true]){
 const root=new T.Group();root.name=kind;root.userData={creator:'Twinkle',license:'CC0-1.0',original:true};const fat=kind==='bomber'?1.75:kind==='spitter'?1.35:kind==='pouncer'?.72:1;
 const definitions=[['hips',-1,0,.90,0],['chest',0,0,1.26,.02],['head',1,0,1.68,.07],['upperL',1,-.35,1.35,0],['foreL',3,-.43,.99,.07],['handL',4,-.46,.70,.15],['upperR',1,.35,1.35,0],['foreR',6,.43,.99,.07],['handR',7,.46,.70,.15],['thighL',0,-.17,.85,0],['shinL',9,-.18,.46,.025],['footL',10,-.18,.10,.09],['thighR',0,.17,.85,0],['shinR',12,.18,.46,.025],['footR',13,.18,.10,.09]];
 const bones=definitions.map(([name])=>{const b=new T.Bone();b.name=name;return b;});definitions.forEach(([,parent,x,y,z],i)=>{const p=parent<0?[0,0,0]:definitions[parent].slice(2);bones[i].position.set(x-p[0],y-p[1],z-p[2]);if(parent<0)root.add(bones[i]);else bones[parent].add(bones[i]);});root.updateMatrixWorld(true);
 const mats=[new T.MeshStandardMaterial({name:'Tissue',color:0xffffff,vertexColors:true,roughness:.83}),new T.MeshStandardMaterial({name:'TornFabric',color:0xffffff,vertexColors:true,roughness:1}),new T.MeshStandardMaterial({name:'EyesAndSacs',color:0xffffff,vertexColors:true,roughness:.26,emissive:kind==='spitter'?0x305513:kind==='bomber'?0x601b03:0x403312,emissiveIntensity:.8})];
 const parts=[[],[],[]],segments=low?6:12;
 function add(g,m,bone,color){if(bone===2&&kind==='pouncer')g.translate(0,-.03,.12);if(g.index){const prev=g;g=g.toNonIndexed();prev.dispose();}const count=g.getAttribute('position').count,indices=new Uint16Array(count*4),weights=new Float32Array(count*4),colors=new Float32Array(count*3),c=new T.Color(color);for(let i=0;i<count;i++){indices[i*4]=bone;weights[i*4]=1;const p=g.getAttribute('position'),n=.86+noise(p.getX(i)*50,p.getY(i)*50)*.2;colors.set([c.r*n,c.g*n,c.b*n],i*3);}g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));parts[m].push(g);}
 const flesh=kind==='spitter'?0x79896a:kind==='bomber'?0x987b71:kind==='pouncer'?0x77868a:0x778172,cloth=kind==='spitter'?0x586756:kind==='bomber'?0x4a4840:kind==='pouncer'?0x453b39:0x3c5361;
 function oval(x,y,z,sx,sy,sz,bone,m=0,color=flesh){const g=new T.SphereGeometry(1,segments,low?5:9);const p=g.attributes.position;for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),n=1+Math.sin(px*17+py*12+pz*8)*.027;p.setXYZ(i,px*n,py*n,pz*n);}g.scale(sx,sy,sz);g.translate(x,y,z);g.computeVertexNormals();add(g,m,bone,color);}
 function limb(a,b,r1,r2,bone,m=0,color=flesh){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa);const g=new T.CylinderGeometry(r2,r1,delta.length(),segments,3);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()));g.translate(...aa.add(bb).multiplyScalar(.5).toArray());add(g,m,bone,color);}
 // Tapered, organic torso, ribcage and asymmetric torn clothing (never cube bodies).
 oval(0,1.06,0,.245*fat,.28,.17*fat,0,1,cloth);oval(0,1.28,.025,.29*fat,.27,.165*fat,1,1,cloth);oval(-.15,1.36,.13,.085*fat,.13,.05,1,0,0x774a45);
 limb([-.25*fat,1.43,.045],[.25*fat,1.43,.045],.065,.065,1);
 for(let i=0;i<5;i++){oval(-.10,1.32-i*.055,.165*fat,.13,.018,.028,1,0,i===2?0x794c49:flesh);}
 if(!low){for(let i=0;i<5;i++){const x=(i-2)*.10;const g=new T.ConeGeometry(.045,.09+noise(i,2)*.10,3);g.rotateX(Math.PI);g.translate(x,1.04,.16*fat);add(g,1,0,cloth);}}
 limb([0,1.46,0],[0,1.59,.045],.083,.071,1);oval(0,1.71,.065,.137,.207,.13,2);oval(0,1.58,.119,.114,.080,.09,2);oval(0,1.62,.182,.073,.044,.013,2,0,0x301c1b);
 for(const side of[-1,1]){oval(side*.058,1.742,.182,.045,.037,.018,2,0,0x30322d);oval(side*.058,1.741,.193,.009,.006,.008,2,2,0xbfc778);oval(side*.066,1.775,.173,.060,.024,.034,2);oval(side*.097,1.675,.155,.046,.043,.037,2);}
 oval(0,1.704,.206,.025,.052,.036,2);oval(-.10,1.79,.09,.028,.065,.06,2,0,0x643d3a);for(let i=0;i<(low?4:8);i++)oval((i-(low?1.5:3.5))*.016,1.639,.197,.007,.017,.008,2,0,0xc8c3a2);
 for(const side of[-1,1]){const b=side<0?3:6,l=side<0?9:12;
 oval(side*.34,1.355,0,.137,.14,.134,1,1,cloth);limb([side*.35,1.33,0],[side*.43,.99,.07],.115,.074,b);oval(side*.43,.99,.07,.085,.085,.075,b);limb([side*.43,.99,.07],[side*.46,.70,.15],.077,.045,b+1);oval(side*.46,.70,.15,.065,.094,.04,b+2);
 for(let finger=0;finger<(low?2:4);finger++)limb([side*.46+(finger-1.5)*.026,.66,.16],[side*.46+(finger-1.5)*.029,.53+(finger%2)*.025,.20],.014,.006,b+2);
 limb([side*.17,.87,0],[side*.18,.46,.025],.137,.080,l,1,cloth);oval(side*.18,.46,.07,.082,.09,.071,l);limb([side*.18,.44,.025],[side*.18,.1,.09],.078,.045,l+1);oval(side*.18,.085,.16,.084,.071,.17,l+2,1,0x302e2a);
 // Open lesions, lifted edges and exposed muscle make the silhouette/material readable.
 oval(side*.44,1.03,.135,.056,.11,.013,b,0,0x693f3c);oval(side*.18,.35,.09,.035,.12,.014,l+1,0,0x75524a);
 }
 if(kind==='spitter'){oval(0,1.18,.20,.28,.32,.20,1,0,0x6b7650);for(let i=0;i<6;i++)oval(Math.sin(i*2)*.21,1.15+i*.06,.30,.063,.08,.065,1,2,0x9db648);oval(0,1.59,.23,.055,.06,.073,2,2,0xb5cb62);}
 if(kind==='bomber'){oval(0,1.03,.15,.43,.45,.32,0,0,0xa2856a);for(let i=0;i<8;i++)oval(Math.sin(i*2.1)*.31,.8+i*.065,.34+Math.cos(i)*.07,.095,.10,.085,0,2,0xd27f38);}
 if(kind==='pouncer'){oval(0,1.4,-.17,.22,.24,.12,1,0,0x7f8e91);for(let i=0;i<6;i++)oval(0,1.23+i*.055,-.20,.033,.036,.06,1,0,0xd3d0b5);}
 const skeleton=new T.Skeleton(bones);parts.forEach((geos,i)=>{if(!geos.length)return;const merged=mergeGeometries(geos),indexed=mergeVertices(merged,1e-4);merged.dispose();const mesh=new T.SkinnedMesh(indexed,mats[i]);mesh.name=mats[i].name;root.add(mesh);mesh.bind(skeleton);geos.forEach(g=>g.dispose());});
 const tracks=[];for(const [name,axis,amp,phase] of [['thighL','x',.58,0],['thighR','x',.58,Math.PI],['upperL','x',.45,Math.PI],['upperR','x',.45,0],['chest','z',.07,0],['head','z',.1,Math.PI]]){const times=[0,.2,.4,.6,.8],values=times.flatMap(t=>{const e=new T.Euler();if(name==='chest')e.x=kind==='pouncer'?.35:.16;if(name==='head')e.x=-.12;e[axis]=Math.sin(t/.8*Math.PI*2+phase)*amp+(name.startsWith('upper')?-.45:0);return new T.Quaternion().setFromEuler(e).toArray();});tracks.push(new T.QuaternionKeyframeTrack(name+'.quaternion',times,values));}
 const animations=[new T.AnimationClip('LurchRun',.8,tracks)];
 const data=await new GLTFExporter().parseAsync(root,{binary:true,animations,onlyVisible:false});await writeFile(`${out}/${kind}${low?'-low':''}.glb`,Buffer.from(data));console.log(kind,low?'LOD':'near',data.byteLength);
}
