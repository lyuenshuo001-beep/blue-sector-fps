import * as T from 'three';
import { Enemy } from '../enemy/Enemy';
import { infectedModel, ZombieKind, ZOMBIE_NAMES } from './InfectedAssets';
const labels = new Map<string, T.SpriteMaterial>();
function nameplate(kind: ZombieKind) { if (!labels.has(kind)) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 72;
    const x = c.getContext('2d')!;
    x.shadowColor = '#000';
    x.shadowBlur = 5;
    x.fillStyle = kind === 'spitter' ? '#c5e585' : kind === 'bomber' ? '#ffb874' : kind === 'pouncer' ? '#dbb1fa' : '#ddd7c9';
    x.textAlign = 'center';
    x.font = 'bold 26px sans-serif';
    x.fillText('路一号 · ' + ZOMBIE_NAMES[kind], 128, 45,248);
    const map = new T.CanvasTexture(c);
    map.colorSpace = T.SRGBColorSpace;
    labels.set(kind, new T.SpriteMaterial({ map, depthTest: true }));
} return labels.get(kind)!; }
export class Zombie extends Enemy {
    detailAllowed = true;
    sight = false;
    voiceAt=2;
    nextSight = 0;
    kind: ZombieKind;
    speed = 2.4;charge=0;called=false;strike:'slam'|'charge'='slam';
    windup = 0;
    specialCooldown = 0;
    leap = 0;
    leapDirection = new T.Vector3();
    corpse = 0;
    deathAngle = 0;
    detonated = false;
    animTick = 0;
    animTime = 0;
    bodySway = 0;
    near: ReturnType<typeof infectedModel>;
    far: ReturnType<typeof infectedModel>;
    weak: T.Mesh;
    danger=new T.Mesh(new T.RingGeometry(.85,1,24),new T.MeshBasicMaterial({color:0xff7454,transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false}));
    constructor(id: number, scene: T.Scene, kind: ZombieKind) {
        super(id, scene, false);
        this.kind = kind;
        const visual=kind==='infected'?['infected','civilian','worker'][id%3]:kind;this.near = infectedModel(visual);
        this.far = infectedModel(visual, true);
        this.lod.addLevel(this.near.model, 0);
        this.lod.addLevel(this.far.model, 18);
        this.root.add(this.lod);this.danger.rotation.x=-Math.PI/2;this.danger.position.y=.06;this.danger.visible=false;this.root.add(this.danger);
        this.root.children.filter(o => o instanceof T.Sprite).forEach(o => { (o as T.Sprite).material = nameplate(kind); o.position.y = kind === 'pouncer' ? 1.9 : 2.25; (o as T.Sprite).scale.set(1.5, .42, 1); });
        this.weak = new T.Mesh(new T.SphereGeometry(.34, 8, 6), new T.MeshBasicMaterial({ visible: false }));
        this.weak.position.set(0, 1.10, .35);
        this.weak.userData = { enemy: this, weak: true };
        if (kind === 'bomber')
            this.root.add(this.weak);
        if (kind === 'spitter' || kind === 'bomber')
            this.body.scale.set(kind === 'bomber' ? 1.2 : .95, 1.25, 1.5);
        if (kind === 'pouncer') {
            this.lod.scale.set(.95, .84, 1.1);
            this.head.position.y = 1.43;
            this.head.position.z = .12;
            this.body.position.y = .88;
            this.body.scale.y = .86;
        }
        if (kind === 'infected') {
            this.root.scale.set(.94 + (id % 4) * .035, .94 + (id % 5) * .025, 1);
            for (const a of [this.near, this.far])
                a.model.traverse(o => { if (o instanceof T.Mesh && o.name === 'TornFabric') {
                    o.material = (o.material as T.MeshStandardMaterial).clone();
                    (o.material as T.MeshStandardMaterial).color.setHex([0xafb897, 0xffffff, 0xb59572][id % 3]);
                } });
        }
        if(kind==='titan')this.root.scale.set(2.1,2.7,2);if(kind==='brute')this.root.scale.set(1.35,1.45,1.3);if(kind==='runner')this.root.scale.set(.8,1.08,.9);
        this.root.visible = false;
    }
    spawn(p: T.Vector3, wave: number) { super.spawn(p, wave); this.nextSight = 0; this.sight = false;this.charge=0;this.called=false; this.hp = ({ infected: 66, spitter: 115, bomber: 130, pouncer: 85,brute:360,runner:42,screamer:100,stalker:80,titan:1800 }[this.kind]) * (1 + Math.min(1, (wave - 1) * .07)); this.speed = ({ infected: 2.35, spitter: 1.65, bomber: 1.85, pouncer: 3.6,brute:1.5,runner:5.8,screamer:1.6,stalker:1.2,titan:1.5 }[this.kind]) * (.88 + (this.id % 7) * .04); this.windup = 0; this.specialCooldown = 2 + (this.id % 4); this.leap = 0; this.corpse = 0; this.deathAngle = 0; this.detonated = false; this.root.rotation.x = this.root.rotation.z = 0; this.lod.position.y = 0; this.near.model.scale.setScalar(1); this.far.model.scale.setScalar(1); this.near.mixer.setTime(this.id * .13); this.far.mixer.setTime(this.id * .13); this.attack = .6; }
    die() { if (!this.active)
        return; this.danger.visible=false;this.active = false; this.state = 'DEAD'; this.corpse = 3.5; this.deathAngle = (this.id % 2 ? 1 : -1) * 1.48; this.root.children.filter(o => o instanceof T.Sprite).forEach(o => o.visible = false); this.outline.visible = false; }
    clear() { this.active = false; this.corpse = 0; this.root.visible = false; this.state = 'DEAD'; }
    animate(dt: number, camera: T.PerspectiveCamera) {
        if (this.corpse > 0) {
            this.corpse -= dt;
            this.root.rotation.x = T.MathUtils.damp(this.root.rotation.x, this.deathAngle, 6, dt);
            if (this.corpse < 1)
                this.lod.position.y = -(1 - this.corpse) * 1.7;
            if (this.corpse <= 0)
                this.root.visible = false;
            return;
        }
        if (!this.active)
            return;
        this.danger.visible=(this.kind==='titan'||this.kind==='brute')&&this.windup>0;this.danger.scale.setScalar(this.kind==='titan'?1.7:2.8);
        const dist = this.root.position.distanceTo(camera.position);
        this.root.children.filter(o => o instanceof T.Sprite).forEach(o => o.visible = dist < (this.kind === 'infected' ? 7 : 25));
        const near = this.detailAllowed && dist < this.lod.levels[1].distance;
        this.near.model.visible = near;
        this.far.model.visible = !near;
        this.lod.autoUpdate = false;
        this.lod.visible = dist < 75;
        this.animTime += dt;
        this.animTick -= dt;
        if (this.animTick <= 0) {
            this.animTick = near ? 1 / 20 : 1 / 5;
            const model = near ? this.near : this.far;
            model.mixer.update(this.animTime * (this.state === 'ATTACK' ? .25 : this.speed / 2.4));
            this.animTime = 0;
            const arm = model.model.getObjectByName('upperR');
            if (arm && this.attack < .25)
                arm.rotation.x = -1.5;
        }
        if (this.kind === 'bomber') {
            const pulse = 1 + Math.sin(this.age * (this.windup > 0 ? 24 : 4)) * .025;
            this.near.model.scale.set(pulse, 1, pulse);
        }
        this.outline.visible = this.reveal > 0;
    }
}
