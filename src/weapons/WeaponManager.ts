import { Profile } from '../core/Profile';
import { disposeWeapon } from './WeaponModel';
import { weaponModel } from './WeaponModel';
import * as T from 'three';
import { Weapon, SPECS } from './Weapon';
import { InputManager } from '../core/InputManager';
import { Player } from '../player/Player';
import { AudioManager } from '../audio/AudioManager';
export class WeaponManager {
    weapons = SPECS.map(s => new Weapon(s));
    index = 0;
    equipped = [0, 1, 2, 3];
    configureLoadout(profile: Profile) { this.equipped = [profile.data.primary, profile.data.secondary].map(id => SPECS.findIndex(w => w.id === id)); this.weapons.forEach((w, i) => { const a = profile.getAttachments(w.spec.id); w.configure(a); this.root.remove(this.models[i]); disposeWeapon(this.models[i]); const model = weaponModel(w.spec.id, a.scope, a.muzzle, a.grip, a.magazine === 'extended', true); model.visible = false; this.root.add(model); this.models[i] = model; }); this.index = this.equipped[0]; }
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
        SPECS.forEach((s, i) => { const g = weaponModel(s.id, i === 2 ? 'sniper' : 'iron', 'standard', 'vertical', false, true); g.visible = i === 0; this.root.add(g); this.models.push(g); });
        this.flash = new T.Mesh(new T.ConeGeometry(.10, .25, 5), new T.MeshBasicMaterial({ color: 0xffd07d, depthTest: false, transparent: true, opacity: .95 }));
        this.flash.rotation.x = -Math.PI / 2;
        this.flash.renderOrder = 11;
        this.flash.visible = false;
        this.root.add(this.flash);
        camera.add(this.root);
        this.root.scale.setScalar(.85);
        this.root.position.set(.25, -.23, -.38);
    }
    get current() { return this.weapons[this.index]; }
    reset() { this.weapons.forEach(w => w.reset()); this.index = this.equipped[0]; this.cooldown = 0; this.reloadLeft = 0; this.bloom = 0; this.kick = 0; this.shots = 0; this.hits = 0; this.models.forEach((m, i) => m.visible = i === this.index); }
    switch(i: number) {
        if (i < 0 || i >= this.weapons.length || i === this.index)
            return;
        this.index = i;
        this.reloadLeft = 0;
        this.cooldown = .22;
        this.kick = .12;
        this.models.forEach((m, j) => m.visible = j === i);
        this.audio.play('ui');
    }
    reload() {
        const w = this.current;
        if (!this.reloadLeft && w.ammo < w.spec.magazine && w.reserve > 0) {
            this.reloadLeft = w.spec.reloadTime;
            this.audio.play('reload');
        }
    }
    update(dt: number, input: InputManager, player: Player, shoot: (spread: number) => void) {
        if (input.switchTo >= 0) {
            if (input.switchTo < this.equipped.length)
                this.switch(this.equipped[input.switchTo]);
            input.switchTo = -1;
        }
        if (input.cycle) {
            this.switch(this.equipped[(this.equipped.indexOf(this.index) + 1) % this.equipped.length]);
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
                player.yaw += (Math.random() - .5) * w.spec.horizontal;
                player.recoil += w.spec.recoil * (1 + this.bloom * .4);
                this.kick = .07;
                this.flashLeft = w.attachments.muzzle === 'suppressor' ? .015 : .045;
                this.audio.play(w.spec.category === 'SNIPER' ? 'sniper' : 'shot', w.attachments.muzzle === 'suppressor' ? .35 : 1);
            }
            else
                this.reload();
        }
        const fov = input.ads ? w.spec.adsFov : 78;
        this.camera.fov = T.MathUtils.damp(this.camera.fov, fov, w.spec.adsSpeed, dt);
        this.camera.updateProjectionMatrix();
        this.root.position.x = T.MathUtils.damp(this.root.position.x, input.ads ? 0 : .25, 14, dt);
        this.root.position.y = T.MathUtils.damp(this.root.position.y, input.ads ? -.17 : -.23, 14, dt) - (this.reloadLeft > 0 ? Math.sin(this.reloadLeft / w.spec.reloadTime * Math.PI) * .015 : 0);
        this.root.position.z = -.38 + this.kick;
        this.root.position.y += (Math.sin(performance.now() * .0018) * .0015) + (player.moving ? Math.sin(player.walk) * (player.sprinting ? .008 : .003) : 0);
        this.root.rotation.x = this.reloadLeft > 0 ? Math.sin(this.reloadLeft / w.spec.reloadTime * Math.PI) * .45 : 0;
        this.root.rotation.z = this.reloadLeft > 0 ? -.6 : Math.sin(player.walk) * .015 * (player.moving ? 1 : 0);
        this.flashLeft -= dt;
        this.flash.visible = this.flashLeft > 0;
        this.flash.position.set(0, .03, Number(this.models[this.index].userData.muzzleZ || -.95));
        this.flash.rotation.z = Math.random() * Math.PI;
        this.root.visible = !(input.ads && ['2x', '4x', 'sniper'].includes(w.attachments.scope));
    }
}
