import * as T from 'three';
import { soldierModel } from '../enemy/SoldierModel';
import { CampaignMap } from '../world/CampaignMap';
import { Player } from '../player/Player';
import { ZombiePool } from './ZombiePool';
import { Enemy } from '../enemy/Enemy';
export class Companion {
    names:Record<string,string>={jiying:'疾影',tiansun:'天隼',yuehen:'月痕',shouwang:'守望'};
    labelCanvas=document.createElement('canvas');labelTexture=new T.CanvasTexture(this.labelCanvas);
    root=new T.Group();hp=100;state:'following'|'downed'|'dead'='following';bleed=45;revive=0;holding=false;path:T.Vector3[]=[];think=0;shot=0;skill=20;operator='shouwang';enabled=false;
    say:(text:string,key?:string)=>void=()=>{};
    tracer=new T.Mesh(new T.CylinderGeometry(.014,.014,1,4),new T.MeshBasicMaterial({color:0x9ffff0}));
    get position(){return this.root.position;}
    constructor(scene:T.Scene,readonly map:CampaignMap){this.root.add(soldierModel(0x4c899a));this.labelCanvas.width=256;this.labelCanvas.height=64;const label=new T.Sprite(new T.SpriteMaterial({map:this.labelTexture}));label.position.y=2.25;label.scale.set(1.6,.4,1);this.root.add(label);scene.add(this.root,this.tracer);this.tracer.visible=false;this.root.visible=false;}
    reset(position:T.Vector3,operator:string){this.operator=operator;const c=this.labelCanvas.getContext('2d')!;c.clearRect(0,0,256,64);c.fillStyle='#92f6d5';c.font='bold 29px sans-serif';c.textAlign='center';c.fillText('队友 · '+this.names[operator],128,43);this.labelTexture.needsUpdate=true;this.hp=100;this.state='following';this.bleed=45;this.revive=0;this.holding=false;this.think=0;this.shot=0;this.skill=20;this.path=[];this.root.position.copy(position).add(new T.Vector3(2,0,0));this.root.rotation.set(0,0,0);this.root.visible=this.enabled;}
    clear(){this.enabled=false;this.root.visible=false;this.tracer.visible=false;this.holding=false;this.path=[];}
    damage(n:number){if(this.state!=='following'||!this.enabled)return;this.hp=Math.max(0,this.hp-n);if(!this.hp){this.state='downed';this.bleed=45;this.root.rotation.z=-1.1;this.say('我倒了！靠近并按住救援！','down');}}
    update(dt:number,player:Player,pool:ZombiePool,hurt:(e:Enemy,n:number)=>void){
        if(!this.enabled)return;this.tracer.visible=false;
        const distance=this.position.distanceTo(player.position),near=distance<2.6;
        if(this.state==='downed'){
            this.bleed-=dt;
            if(near&&this.holding)this.revive+=dt;else this.revive=0;
            if(this.revive>=4){this.hp=45;this.state='following';this.root.rotation.z=0;this.revive=0;this.holding=false;this.say('谢了，我还能打。','thanks');}
            else if(this.bleed<=0){this.state='dead';this.root.visible=false;this.say('队友信号丢失。','lost');}
        } else if(this.state==='following') {
            this.think-=dt;this.shot-=dt;this.skill-=dt;
            if(this.think<=0){this.path=distance>3?this.map.path(this.position,player.position):[];this.think=.65;}
            this.root.children[0].position.y=distance>3?Math.sin(performance.now()*.008)*.025:0;
            const target=this.path[0];if(target&&distance>2.8){const d=target.clone().sub(this.position).setY(0),l=d.length();if(l<.5)this.path.shift();else{this.map.move(this.position,d.x/l*4.4*dt,d.z/l*4.4*dt);this.position.y=this.map.groundAt(this.position.x,this.position.z);this.root.rotation.y=Math.atan2(d.x,d.z);}}
            if(this.shot<=0){this.shot=1.15;const e=pool.active.find(e=>e.root.position.distanceTo(this.position)<18&&pool.visible(this.position.clone().add(new T.Vector3(0,1.5,0)),e.root.position.clone().add(new T.Vector3(0,1,0))));if(e){this.root.rotation.y=Math.atan2(e.root.position.x-this.position.x,e.root.position.z-this.position.z);if(Math.random()<.6)hurt(e,14);const a=this.position.clone().add(new T.Vector3(0,1.2,0)),b=e.root.position.clone().add(new T.Vector3(0,1,0));this.tracer.position.copy(a).lerp(b,.5);this.tracer.scale.y=a.distanceTo(b);this.tracer.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());this.tracer.visible=true;}}
            if(this.skill<=0&&distance<7){this.skill=30;if(this.operator==='shouwang'){player.hp=Math.min(100,player.hp+12);this.say('撑住，我来支援。','support');}else if(this.operator==='yuehen'){pool.active.filter(e=>e.root.position.distanceTo(this.position)<12).forEach(e=>e.reveal=3);this.say('前方有感染者！','contact');}else{pool.active.filter(e=>e.root.position.distanceTo(this.position)<6).forEach(e=>e.slow=2);this.say('我掩护你！','cover');}}
        }
        const ui=document.getElementById('buddy-status')!;ui.textContent=this.state==='downed'?`队友倒地 · ${Math.ceil(this.bleed)}s · ${near?'按住救援 '+this.revive.toFixed(1)+'/4s':'靠近队友 '+Math.ceil(distance)+'m'}`:this.state==='dead'?'队友阵亡':`队友 · HP ${Math.ceil(this.hp)} · ${Math.ceil(distance)}m`;
        const button=document.getElementById('revive')!;button.classList.toggle('hidden',!(near&&this.state==='downed'));button.textContent='按住救援 / F '+this.revive.toFixed(1)+'/4s';
    }
}
