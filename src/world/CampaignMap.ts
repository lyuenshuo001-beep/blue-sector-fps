import * as T from 'three';
import { SkywardMap } from './SkywardMap';
import { material } from './Materials';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Original connected campaign: height changes are spatially separate, so navigation
 * and collision share exactly the same walkable surfaces on mobile. */
export class CampaignMap extends SkywardMap {
    override readonly name = 'QUARANTINE / 隔离区';
    gates: { mesh: T.Mesh; obstacle: {x:number;z:number;w:number;d:number;h:number}; open:boolean }[] = [];
    chunks: {objects:T.Object3D[]; z:number}[]=[];
    routes = [new T.Vector3(0,0,27),new T.Vector3(-12,0,-4),new T.Vector3(12,0,-34),new T.Vector3(-12,4,-64),new T.Vector3(12,4,-94),new T.Vector3(-12,-5,-124),new T.Vector3(12,-5,-154),new T.Vector3(-12,-5,-184),new T.Vector3(12,-2,-214),new T.Vector3(-12,0,-244),new T.Vector3(0,0,-274)];
    constructor(scene:T.Scene) {
        super(scene,false); this.spawns=[];
        const titles=['SAFE HOUSE / 安全屋','街区 / SERVICE ROAD','HOSPITAL / 医院二楼','ROOF LINK / 屋顶通道','PARKING / 地下停车场','GENERATOR / 备用电源','LAB / 实验设施','BLACKOUT / 地下收容','CONTAINMENT / 隔离大厅','EXTRACTION / 撤离'];
        for(let section=0;section<10;section++) {
            const before=new Set(scene.children), z=20-section*30;
            // Individual short floor strips give real stair/ramp elevation, not a larger flat plane.
            for(let step=0;step<30;step++) {
                const zz=z+9.5-step,y=this.groundAt(0,zz);
                this.addBox(0,y-.25,zz,40,.5,1.02,section===2||section===6?'tile':section===4||section===5?'rubber':'stone',section>3?0x606968:0x89877e,false);
            }
            for(const side of [-1,1]) {
                if(section===3||section===9){
                    this.addBox(side*20,this.groundAt(0,z-5)+.6,z-5,.7,1.2,30,'stone',0x727f81,false);
                    this.obstacles.push({x:side*20,z:z-5,w:.7,d:30,h:20});
                    for(let n=0;n<3;n++)this.addBox(side*(27+n*3),-2,z-8+n*9,5,12+n*3,6,'plaster',0x596773,false);
                }else this.addBox(side*20,1,z-5,.7,24,30,'plaster',section>3?0x555e60:0x999180);
                for(let j=0;j<3;j++) {
                    const zz=z+3-j*9,y=this.groundAt(0,zz);
                    this.addBox(side*19.5,y+2.1,zz,.15,2.2,2,'metal',0x273d43,false);
                    this.addBox(side*19.3,y+3.4,zz,.3,.15,2.5,'metal',0x87b0ad,false);
                    this.spawns.push(new T.Vector3(side*17,y,zz));
                }
            }
            if(section>0) {
                // Alternating entrances force movement across each interior, with open rooms around cover.
                const opening=section%2?-12:12, border=z+10;
                for(const [left,right] of [[-20,opening-3],[opening+3,20]])
                    this.addBox((left+right)/2,2,border,right-left,24,.6,'brick',0x6d726f);
                this.addBox(opening,this.groundAt(0,border)+4.2,border,6,1,.7,'metal',0x455158,false);
            }
            if(section===0||section===2||(section>=4&&section<=8)) this.addBox(0,this.groundAt(0,z-5)+5,z-5,40,.4,30,'stone',0x424d53,false);
            const floor=this.groundAt(0,z-5);
            const prop=(x:number,y:number,zz:number,w:number,h:number,d:number,color:number)=>{const g=new RoundedBoxGeometry(w,h,d,1,.09);g.translate(x,y,zz);this.part(g,material('metal',color));if(h>.8)this.obstacles.push({x,z:zz,w,d,h:y+h/2});};
            // Repeated fixtures are merged with each sector, keeping interiors readable without per-prop draw calls.
            if(section>=4&&section<=8){
                for(const x of [-17,17]){const pipe=new T.CylinderGeometry(.11,.11,28,10);pipe.rotateX(Math.PI/2);pipe.translate(x,floor+4.35,z-5);this.part(pipe,material('metal',0x607678));}
                for(const zz of [z+2,z-12])this.addBox(0,floor+4.3,zz,36,.17,.2,'metal',0x3c4a53,false);
            }
            if(section===2){
                for(const side of [-1,1])for(const dz of [-1,-10]){
                    const x=side*15,zz=z+dz;
                    prop(x,floor+.55,zz,2,.22,3.3,0x687e83);prop(x,floor+.8,zz,1.8,.3,3,0xc0c7be);
                    prop(x,floor+1.2,zz-1.6,2.1,1,.16,0x648087);
                    for(const dx of [-.8,.8])this.cylinder(x+dx,floor+.27,zz+1,.06,.55,0x707e80);
                    this.addBox(side*9,floor+1.6,zz,.2,3.2,5,'plaster',0x909e9b);
                }
                this.sign('WARD 02 / 医疗区',0,floor+3,z,6,.8);
            }
            if(section===4||section===5){
                for(const x of [-15,-8,8,15])this.addBox(x,floor+.015,z-4,.12,.02,20,'plaster',0xb9b49a,false);
                for(const zz of [z+3,z-12])this.addBox(0,floor+.02,zz,32,.025,.13,'plaster',0xb9b49a,false);
                prop(13,floor+1,z-6,3,1.5,5.8,0x5f6662);prop(13,floor+1.85,z-6,2.8,.8,2.5,0x344950);
                this.sign(section===4?'P2 / UNDERGROUND PARKING':'POWER GRID / 发电机',0,floor+3,z-3,8,.9);
            }
            if(section===5){prop(-12,floor+1.1,-144,2.8,2.2,2.5,0x586e65);for(let i=0;i<7;i++)this.addBox(-12,floor+.4+i*.22,-142.73,2,.065,.08,'metal',0x202d33,false);this.sign('HOLD F / 启动备用电源',-12,floor+2.8,-144,4,.6);}
            if(section===6||section===7){for(const x of [-15,15]){prop(x,floor+.9,z-6,5,1.8,1.8,0x879694);for(let i=0;i<3;i++){const glass=new T.CylinderGeometry(.32,.32,1.6,12);glass.translate(x-1.5+i*1.5,floor+2.6,z-6);this.part(glass,material('metal',section===6?0x75b3b1:0x8b5b59));}}this.sign('TWINKLE LAB / CONTAINMENT',0,floor+3.5,z,9,.7);}
            if(section===3){for(const side of [-1,1])for(let j=0;j<9;j++)this.cylinder(side*18,floor+.8,z+7-j*3,.06,1.6,0x6c7c7e);}
            if(section===8){this.sign('DANGER / HEAVY CONTAINMENT',0,floor+3,z-7,11,1);for(const x of[-15,15])prop(x,floor+1.6,z-5,3,3.2,3,0x4d5e61);}
            // Partitions create two flanking paths and small treatment / service rooms.
            this.addBox(section%2?4:-4,floor+1.6,z-5,.55,3.2,12,'plaster',0x78817c);
            this.addBox(section%2?-5:5,floor+.6,z-9,4,1.2,2,'metal',0x3c5057);
            for(const x of [-14,14]) {
                this.cylinder(x,floor+2.1,z-6,.25,4.2,0x626e71);
                this.addBox(x,floor+4.15,z-6,3,.12,.6,'metal',section>=7?0xe46048:0x96d1cf,false);
            }
            this.sign(titles[section],0,this.groundAt(0,z+7)+3.5,z+7,9,1);
            if(section===1||section===4) {
                // Abandoned vehicles with rounded wheels and distinct hood/cabin silhouettes.
                this.addBox(-11,floor+.75,z-7,3,1.1,5.6,'metal',0x4a6264);
                this.addBox(-11,floor+1.6,z-7.5,2.7,.9,2.7,'metal',0x33454d,false);
                for(const x of [-12.4,-9.6]) for(const zz of [z-9,z-5]) {
                    const tire=new T.Mesh(new T.TorusGeometry(.48,.16,6,12),material('rubber',0x25292b));
                    tire.rotation.y=Math.PI/2;tire.position.set(x,floor+.5,zz);scene.add(tire);
                }
            }
            if(section===5||section===7) for(const x of [-16,16]) {
                this.addBox(x,floor+1.3,z,2,2.6,2,'metal',0x33454f);
                for(let j=0;j<4;j++) this.addBox(x,floor+.5+j*.5,z+1.02,1.5,.08,.04,'metal',0x5fafb0,false);
            }
            this.flushParts();
            this.chunks.push({objects:scene.children.filter(o=>!before.has(o)),z:z-5});
        }
        this.addBox(0,2,30,40,24,.6,'stone',0x777c7c);
        this.addBox(0,2,-270,40,24,.6,'stone',0x777c7c);
        this.flushParts();
        this.spawns=this.spawns.filter(p=>p.z<20&&p.z>-265&&!this.blocked(p.x,p.z,.6));
        for(const z of [-150,-210]) {
            const opening=z===-150?12:12;
            const obstacle={x:opening,z,w:6,d:.8,h:20};
            const mesh=new T.Mesh(new T.BoxGeometry(6,6,.8),material('metal',0x40535d));
            mesh.position.set(opening,this.groundAt(opening,z)+3,z);scene.add(mesh);
            this.gates.push({mesh,obstacle,open:false});this.solids.push(mesh);
        }
        this.resetGates();
    }
    resetGates(){for(const g of this.gates){g.open=false;g.mesh.visible=true;if(!this.solids.includes(g.mesh))this.solids.push(g.mesh);if(!this.obstacles.includes(g.obstacle))this.obstacles.push(g.obstacle);}this.buildNav();}
    openGate(i:number){const g=this.gates[i];if(!g||g.open)return;g.open=true;g.mesh.visible=false;this.obstacles=this.obstacles.filter(o=>o!==g.obstacle);const index=this.solids.indexOf(g.mesh);if(index>=0)this.solids.splice(index,1);this.buildNav();}
    override groundAt(_x:number,z:number) {
        if(z>-30)return 0;
        if(z>-45)return (-30-z)*4/15;
        if(z>-90)return 4;
        if(z>-120)return 4+(z+90)*.3;
        if(z>-195)return -5;
        if(z>-225)return -5+(-195-z)/6;
        return 0;
    }
    override zone(p:T.Vector3){return p.z>0?'安全屋 / 街区':p.z>-60?'医院 / 楼梯间':p.z>-90?'屋顶连廊':p.z>-150?'地下停车场 / 发电机':p.z>-210?'实验设施 / 黑暗收容区':'隔离大厅 / 撤离平台';}
    override buildNav(){this.nav=[];this.links=[];const grid=new Map<string,number>();for(let z=28;z>=-268;z-=2)for(let x=-18;x<=18;x+=2)if(!this.blocked(x,z,.65)){grid.set(x+','+z,this.nav.length);this.nav.push(new T.Vector3(x,this.groundAt(x,z),z));}this.links=this.nav.map(p=>{const a:number[]=[];for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2]]){const n=grid.get((p.x+dx)+','+(p.z+dz));if(n!==undefined&&this.clear(p,this.nav[n],.5))a.push(n);}return a;});}
    updateChunks(p:T.Vector3){for(const c of this.chunks)for(const o of c.objects)o.visible=Math.abs(c.z-p.z)<78;}
}
