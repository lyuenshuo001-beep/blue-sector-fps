import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {material} from '../world/Materials';
export function weaponModel(id:string,scope='iron',muzzle='standard',grip='vertical',extended=false,view=false){
 const root=new T.Group(),parts=new Map<T.Material,T.BufferGeometry[]>();const pistol=/PX|HP/.test(id),sniper=/SR|BA|DMR/.test(id),smg=/SMG|VX|CX/.test(id),shotgun=/SG/.test(id),ak=id==='KA-47';
 const steel=material('metal',0x50595d).clone(),trim=material('metal',0x879096).clone(),poly=material('rubber',ak?0x6e4935:0x3e4847).clone(),gripMat=material('rubber',0x20292b).clone();
 for(const m of[steel,trim,poly,gripMat]){m.depthTest=!view;m.depthWrite=!view;}
 const add=(geo:T.BufferGeometry,mat:T.Material,x:number,y:number,z:number,rx=0,ry=0,rz=0)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}geo.rotateX(rx);geo.rotateY(ry);geo.rotateZ(rz);geo.translate(x,y,z);const a=parts.get(mat)||[];a.push(geo);parts.set(mat,a);};
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material,r=0)=>add(new RoundedBoxGeometry(w,h,d,1,Math.min(w,h,d)*.14),m,x,y,z,0,0,r);
 const tube=(r:number,len:number,x:number,y:number,z:number,m:T.Material)=>add(new T.CylinderGeometry(r,r,len,12),m,x,y,z,Math.PI/2);
 const len=pistol?.34:smg?.57:sniper?1.02:shotgun?.91:.77;
 // Receiver profile and separate upper, slide, barrel, shroud, grip, stock, rail and trigger guard.
 const s=new T.Shape();s.moveTo(-.075,-.09);s.lineTo(.075,-.09);s.lineTo(.08,.055);s.lineTo(.045,.095);s.lineTo(-.045,.095);s.lineTo(-.08,.055);s.closePath();
 const rec=new T.ExtrudeGeometry(s,{depth:pistol?.26:.38,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.008,bevelThickness:.008});add(rec,steel,0,0,-.37);
 tube(.032,len*.65,0,.035,-.34-len*.32,trim);
 if(!pistol){box(.145,.14,len*.4,0,.005,-.4-len*.2,poly);for(let i=0;i<7;i++){box(.16,.016,.018,0,.102,-.17-i*.045,steel);box(.008,.025,.038,.077,.018,-.43-i*.035,gripMat);}
 tube(.034,.18,0,.015,.05,steel);box(.13,.22,.18,0,-.035,.19,poly);box(.14,.25,.035,0,-.035,.29,gripMat);}
 box(.10,.21,.115,0,-.175,-.11,gripMat,-.12);
 // Curved magazine for KA, straight box or pistol magazine for others.
 if(!pistol){for(let i=0;i<(ak?4:1);i++)box(.083,ak?.085:extended?.29:.22,.13,0,-.20-i*.045,-.30-(ak?i*.025:0),poly,ak?-.1:0);}
 const guard=new T.TorusGeometry(.063,.011,5,12,Math.PI*1.6);guard.rotateY(Math.PI/2);add(guard,steel,0,-.13,-.205);box(.018,.065,.016,0,-.12,-.215,trim);
 if(!pistol&&grip==='vertical')box(.072,.16,.095,0,-.14,-.53,gripMat);if(grip==='angled')box(.075,.065,.19,0,-.10,-.49,gripMat);
 tube(muzzle==='suppressor'?.058:.039,muzzle==='suppressor'?.22:.07,0,.035,-.36-len*.65,steel);
 // Ejection port, selector, charging handle and screws create readable mechanical detail.
 box(.005,.045,.10,.082,.025,-.235,gripMat);box(.045,.018,.05,.095,.033,-.16,trim);
 for(const z of[-.12,-.3])add(new T.CylinderGeometry(.012,.012,.012,8),trim,.084,-.023,z,0,0,Math.PI/2);
 if(scope==='iron'){box(.045,.035,.024,0,.126,-.1,steel);box(.012,.055,.025,0,.13,-.52,trim);}
 else if(scope==='red'||scope==='holo'){const ring=new T.TorusGeometry(scope==='holo'?.061:.047,.014,6,12);add(ring,steel,0,.168,-.23);box(.085,.06,.08,0,.115,-.23,steel);}
 else{tube(.053,.24,0,.175,-.22,steel);for(const z of[-.1,-.34])tube(.065,.035,0,.175,z,trim);box(.07,.065,.13,0,.11,-.22,steel);}
 if(shotgun)tube(.035,.56,0,-.045,-.53,steel);
 for(const[m,gs]of parts){const mesh=new T.Mesh(mergeGeometries(gs),m);mesh.renderOrder=view?10:0;mesh.castShadow=!view;root.add(mesh);gs.forEach(g=>g.dispose());}
 root.userData.materials=[steel,trim,poly,gripMat];root.userData.muzzleZ=-.36-len*.65;return root;
}
export function disposeWeapon(root:T.Group){root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});for(const m of root.userData.materials||[])m.dispose();}


