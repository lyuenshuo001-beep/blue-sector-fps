import {soldierModel} from './SoldierModel';
import * as T from 'three';
export type EnemyState = 'IDLE' | 'PATROL' | 'CHASE' | 'ATTACK' | 'DEAD';
const bodyMaterial = new T.MeshStandardMaterial({ color: 0xb2634f, roughness: .7 });
const armorMaterial = new T.MeshStandardMaterial({ color: 0x34434d });
const redMaterial = new T.MeshBasicMaterial({ color: 0xff7052 });
const bodyGeo = new T.BoxGeometry(.7, .85, .4), headGeo = new T.BoxGeometry(.44, .4, .42), limbGeo = new T.BoxGeometry(.23, .55, .25);
let nameMaterial: T.SpriteMaterial;
function labelMaterial() { if (!nameMaterial) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'rgba(9,17,25,.8)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffe4d6';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('路一号', 128, 45);
    const map = new T.CanvasTexture(c);
    map.colorSpace = T.SRGBColorSpace;
    nameMaterial = new T.SpriteMaterial({ map, depthTest: true });
} return nameMaterial; }
export class Enemy {
    root = new T.Group();
    body: T.Mesh;
    head: T.Mesh;
    legs: T.Mesh[] = [];
    active = false;
    hp = 100;
    slow=0;reveal=0;outline:T.LineSegments;lod=new T.LOD();
    state: EnemyState = 'DEAD';
    path: T.Vector3[] = [];
    think = 0;
    attack = 0;
    age = 0;
    alert = 0;
    flash: T.Mesh;
    constructor(readonly id: number, scene: T.Scene) {
        this.body = new T.Mesh(bodyGeo, bodyMaterial);
        this.body.position.y = 1.05;
        this.head = new T.Mesh(headGeo, armorMaterial);
        this.head.position.y = 1.7;
        this.body.userData = { enemy: this, head: false };
        this.head.userData = { enemy: this, head: true };
        this.root.add(this.body, this.head);
        for (const x of [-.22, .22]) {
            const leg = new T.Mesh(limbGeo, armorMaterial);
            leg.position.set(x, .35, 0);
            this.root.add(leg);
            this.legs.push(leg);
            const arm = new T.Mesh(limbGeo, bodyMaterial);
            arm.position.set(x * 2, 1.08, 0);
            arm.userData = { enemy: this, head: false };
            this.root.add(arm);
        }
        const visor = new T.Mesh(new T.BoxGeometry(.38, .09, .04), redMaterial);
        visor.position.set(0, 1.72, .23);
        this.root.add(visor);
        const gun = new T.Mesh(new T.BoxGeometry(.18, .16, .65), armorMaterial);
        gun.position.set(.37, 1.08, .3);
        this.root.add(gun);
        this.flash = new T.Mesh(new T.OctahedronGeometry(.15), new T.MeshBasicMaterial({ color: 0xffb25c }));
        this.flash.position.set(.37, 1.08, .68);
        this.flash.visible = false;
        this.root.add(this.flash);
        const label = new T.Sprite(labelMaterial());
        label.position.y = 2.2;
        label.scale.set(1.35, .34, 1);
        this.root.add(label);
        this.root.visible = false;
        this.body.castShadow = true;
        this.head.castShadow = true;
        const hidden=new T.MeshBasicMaterial({visible:false});for(const o of this.root.children)if(o instanceof T.Mesh&&o!==this.flash)o.material=hidden;
        const near=soldierModel(0xb97957);const far=new T.Group();const farBody=new T.Mesh(new T.CapsuleGeometry(.32,1.1,2,5),new T.MeshStandardMaterial({color:0xbb7154,roughness:1}));farBody.position.y=1;far.add(farBody);this.lod.addLevel(near,0);this.lod.addLevel(far,24);this.root.add(this.lod);
        this.outline=new T.LineSegments(new T.EdgesGeometry(new T.CapsuleGeometry(.38,1.3,2,6)),new T.LineBasicMaterial({color:0x7cf1ff,depthTest:false,transparent:true,opacity:.9}));this.outline.position.y=1;this.outline.visible=false;this.outline.renderOrder=5;this.root.add(this.outline);
        scene.add(this.root);
    }
    spawn(p: T.Vector3, wave: number) { this.root.position.copy(p); this.root.visible = true; this.active = true; this.hp = 100 + Math.min(45, (wave - 1) * 3); this.state = 'IDLE'; this.path = []; this.age = 0; this.think = 0; this.attack = 1.4; this.alert = 0;this.slow=0;this.reveal=0;this.outline.visible=false; }
    die() { this.active = false; this.state = 'DEAD'; this.root.visible = false; }
    get hitboxes() { return this.root.children.filter(o => o.userData.enemy); }
}
