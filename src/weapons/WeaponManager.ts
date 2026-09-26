import * as T from 'three';
import { Weapon, SPECS } from './Weapon';
import { InputManager } from '../core/InputManager';
import { Player } from '../player/Player';
import { AudioManager } from '../audio/AudioManager';
export class WeaponManager {
    weapons = SPECS.map(s => new Weapon(s));
    index = 0;
    cooldown = 0;
    reloadLeft = 0;
    bloom = 0;
    kick = 0;
    shots = 0;
    hits = 0;
    root = new T.Group();
    models: T.Group[] = [];
    flash: T.Mesh;
    flashLeft = 0;
    constructor(readonly camera: T.PerspectiveCamera, readonly audio: AudioManager) {
        const dark = new T.MeshStandardMaterial({ color: 0x263b49, metalness: .65, roughness: .42, depthTest: false }), trim = new T.MeshStandardMaterial({ color: 0x778b94, metalness: .5, depthTest: false }), blue = new T.MeshBasicMaterial({ color: 0x66dcff, depthTest: false });
        SPECS.forEach((s, i) => { const g = new T.Group(); const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material) => { const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); mesh.renderOrder = 10; g.add(mesh); }; box(.15, .18, .46 * s.length, 0, 0, -.22, dark); box(.065, .065, .48 * s.length, 0, .025, -.5 * s.length, trim); box(.10, .2, .11, 0, -.15, -.18, dark); box(.1, .14, .18, 0, -.07, .05, dark); box(.16, .02, .25, 0, .10, -.2, trim); box(.035, .035, .04, 0, .14, -.17, blue); box(.13, .035, .11, 0, .13, -.38, dark); if (i === 2)
            box(.12, .12, .3, 0, .18, -.25, dark); box(.045, .025, .18, .08, .01, -.22, blue); g.visible = i === 0; this.root.add(g); this.models.push(g); });
        this.flash = new T.Mesh(new T.ConeGeometry(.10, .25, 5), new T.MeshBasicMaterial({ color: 0xffd07d, depthTest: false, transparent: true, opacity: .95 }));
        this.flash.rotation.x = -Math.PI / 2;
        this.flash.renderOrder = 11;
        this.flash.visible = false;
        this.root.add(this.flash);
        camera.add(this.root);
        this.root.scale.setScalar(.8);
        this.root.position.set(.25, -.23, -.38);
    }
    get current() { return this.weapons[this.index]; }
    reset() { this.weapons.forEach(w => w.reset()); this.index = 0; this.cooldown = 0; this.reloadLeft = 0; this.bloom = 0; this.kick = 0; this.shots = 0; this.hits = 0; this.models.forEach((m, i) => m.visible = i === 0); }
    switch(i: number) { if (i < 0 || i > 3 || i === this.index)
        return; this.index = i; this.reloadLeft = 0; this.cooldown = .22; this.kick = .12; this.models.forEach((m, j) => m.visible = j === i); this.audio.play('ui'); }
    reload() { const w = this.current; if (!this.reloadLeft && w.ammo < w.spec.magazine && w.reserve > 0) {
        this.reloadLeft = w.spec.reloadTime;
        this.audio.play('reload');
    } }
    update(dt: number, input: InputManager, player: Player, shoot: (spread: number) => void) {
        if (input.switchTo >= 0) {
            this.switch(input.switchTo);
            input.switchTo = -1;
        }
        if (input.cycle) {
            this.switch((this.index + 1) % 4);
            input.cycle = false;
        }
        if (input.reload) {
            this.reload();
            input.reload = false;
        }
        this.cooldown = Math.max(0, this.cooldown - dt);
        this.bloom = T.MathUtils.damp(this.bloom, 0, 4, dt);
        this.kick = T.MathUtils.damp(this.kick, 0, 12, dt);
        if (this.reloadLeft > 0) {
            this.reloadLeft = Math.max(0, this.reloadLeft - dt);
            if (this.reloadLeft === 0) {
                const w = this.current, n = Math.min(w.spec.magazine - w.ammo, w.reserve);
                w.ammo += n;
                w.reserve -= n;
            }
        }
        const w = this.current, press = input.consumePress();
        if ((w.spec.automatic ? (input.fire || press) : press) && this.cooldown === 0 && this.reloadLeft === 0) {
            if (w.ammo > 0) {
                w.ammo--;
                this.shots++;
                this.cooldown = 1 / w.spec.fireRate;
                shoot(w.spec.spread * (input.ads ? w.spec.adsAccuracy : w.spec.hipAccuracy) * (1 + this.bloom * 2 + (player.moving ? 1 : 0)));
                this.bloom = Math.min(1.5, this.bloom + .18);
                player.recoil += w.spec.recoil * (1 + this.bloom * .4);
                this.kick = .07;
                this.flashLeft = .045;
                this.audio.play(this.index === 2 ? 'sniper' : 'shot');
            }
            else
                this.reload();
        }
        const fov = input.ads ? w.spec.adsFov : 78;
        this.camera.fov = T.MathUtils.damp(this.camera.fov, fov, 14, dt);
        this.camera.updateProjectionMatrix();
        this.root.position.x = T.MathUtils.damp(this.root.position.x, input.ads ? 0 : .25, 14, dt);
        this.root.position.y = T.MathUtils.damp(this.root.position.y, input.ads ? -.17 : -.23, 14, dt) - (this.reloadLeft > 0 ? Math.sin(this.reloadLeft / w.spec.reloadTime * Math.PI) * .015 : 0);
        this.root.position.z = -.38 + this.kick;
        this.root.rotation.z = this.reloadLeft > 0 ? -.4 : Math.sin(player.walk) * .015 * (player.moving ? 1 : 0);
        this.flashLeft -= dt;
        this.flash.visible = this.flashLeft > 0;
        this.flash.position.set(0, .03, -.77 * w.spec.length);
        this.flash.rotation.z = Math.random() * Math.PI;
        this.root.visible = !(input.ads && this.index === 2);
    }
}
