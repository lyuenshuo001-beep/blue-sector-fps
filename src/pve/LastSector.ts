import * as T from 'three';
import { CampaignMap } from '../world/CampaignMap';
import { Player } from '../player/Player';
export type GameMode='survival'|'last-sector';
type Stop={title:string;pos:T.Vector3;seconds:number;action:'enter'|'hold'|'defend';radio:string};
export class LastSector {
 bossDone=false;stage=0;progress=0;complete=false;interact=false;group=new T.Group();markers:T.Mesh[]=[];
 route:T.Vector3[]=[];routeTimer=0;next=new T.Vector3();onStage:(stage:number)=>void=()=>{};
 readonly stops:Stop[]=[
 {title:'穿过废弃街区，进入医院',pos:new T.Vector3(-12,0,-4),seconds:1,action:'enter',radio:'前方主路封锁。从左侧医院入口进入。'},
 {title:'沿楼梯登上医院二楼',pos:new T.Vector3(12,4,-48),seconds:1,action:'enter',radio:'穿过病房，沿楼梯向上。屋顶连廊可以通向停车场。'},
 {title:'穿过屋顶连廊',pos:new T.Vector3(-12,4,-78),seconds:1,action:'enter',radio:'保持移动。前方右侧坡道通往地下停车场。'},
 {title:'进入地下停车场',pos:new T.Vector3(12,-5,-128),seconds:1,action:'enter',radio:'寻找备用发电机。留意车辆后方。'},
 {title:'启动备用发电机',pos:new T.Vector3(-12,-5,-142),seconds:4,action:'hold',radio:'启动备用电源，防爆门需要充电。'},
 {title:'守住发电机，等待防爆门开启',pos:new T.Vector3(-12,-5,-142),seconds:60,action:'defend',radio:'警报触发！大量感染者接近，守住发电机六十秒。'},
 {title:'进入实验室并取回样本',pos:new T.Vector3(-12,-5,-176),seconds:4,action:'hold',radio:'防爆门已开启。进入实验设施，取回样本。'},
 {title:'穿过停电收容区，恢复门禁',pos:new T.Vector3(12,-3,-207),seconds:5,action:'hold',radio:'照明中断。保持警惕，有重脚步正在靠近。'},
 {title:'击败 TITAN，突破隔离大厅',pos:new T.Vector3(-12,0,-237),seconds:1,action:'enter',radio:'前方发现大型感染体！避开正面冲撞。'},
 {title:'登上撤离平台并坚守',pos:new T.Vector3(0,0,-263),seconds:75,action:'defend',radio:'撤离点已开放。守住平台，运输机正在接近。'}
 ];
 ring=new T.Mesh(new T.RingGeometry(2.6,3,40),new T.MeshBasicMaterial({color:0x7fffe0,side:T.DoubleSide,transparent:true,opacity:.65,depthWrite:false}));
 constructor(scene:T.Scene,readonly map:CampaignMap){scene.add(this.group);this.ring.rotation.x=-Math.PI/2;this.group.add(this.ring);for(const s of this.stops){s.pos.y=map.groundAt(s.pos.x,s.pos.z);const marker=new T.Mesh(new T.OctahedronGeometry(.45),new T.MeshBasicMaterial({color:0x82ffe1,depthTest:false}));marker.renderOrder=20;this.group.add(marker);this.markers.push(marker);}this.group.visible=false;}
 reset(){this.bossDone=false;this.stage=0;this.progress=0;this.complete=false;this.interact=false;this.routeTimer=0;this.route=[];this.map.resetGates();this.group.visible=true;this.onStage(0);}
 update(dt:number,player:Player,notify:(s:string)=>void){
 const s=this.stops[this.stage];if(!s||this.complete)return;
 const distance=s.pos.distanceTo(player.position),near=distance<3.2;
 this.ring.position.copy(s.pos).add(new T.Vector3(0,.06,0));this.ring.material.opacity=.45+Math.sin(performance.now()*.004)*.2;
 this.markers.forEach((m,i)=>{m.visible=i===this.stage;m.position.copy(s.pos).add(new T.Vector3(0,3+Math.sin(performance.now()*.003)*.15,0));m.rotation.y+=dt;});
 if(near&&(this.stage!==8||this.bossDone)&&(s.action!=='hold'||this.interact)){this.progress+=dt;if(this.progress>=s.seconds){this.stage++;this.progress=0;this.interact=false;this.routeTimer=0;if(this.stage===6)this.map.openGate(0);if(this.stage===8)this.map.openGate(1);if(this.stage===this.stops.length){this.complete=true;notify('MISSION COMPLETE / 撤离成功');}else{this.onStage(this.stage);notify(this.stops[this.stage].radio);}return;}}
 else if(s.action==='hold')this.progress=0;
 this.routeTimer-=dt;if(this.routeTimer<=0){this.routeTimer=.7;this.route=this.map.path(player.position,s.pos);}
 while(this.route.length&&this.route[0].distanceTo(player.position)<1.6)this.route.shift();
 this.next.copy(this.route[Math.min(2,this.route.length-1)]||s.pos);
 const delta=this.next.clone().sub(player.position),angle=Math.atan2(delta.x*Math.cos(player.yaw)-delta.z*Math.sin(player.yaw),-delta.x*Math.sin(player.yaw)-delta.z*Math.cos(player.yaw));
 const arrow=Math.abs(angle)<.35?'↑':Math.abs(angle)>2.7?'↓':angle>0?'→':'←';
 document.getElementById('pve-objective')!.textContent=`OBJECTIVE ${this.stage+1}/${this.stops.length} · ${s.title}\n${near?'◆ STAND HERE / 任务区域':arrow+' 沿通道前进 · '+Math.ceil(distance)+'m'}${near?' · '+(s.action==='hold'?'按住 F / 交互':'坚守')+' '+Math.ceil(s.seconds-this.progress)+'s':''}`;
 const b=document.getElementById('interact')!;b.classList.toggle('hidden',!near||s.action!=='hold');b.textContent=this.interact?'正在操作…':'按住启动 / F';
 const marker=document.getElementById('route-marker');if(marker)marker.textContent=arrow+' '+(near?'任务区域':'下一路口');
 }
}
