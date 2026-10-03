import * as T from 'three';
import { Player } from '../player/Player';
import { InputManager } from '../core/InputManager';
import { EnemyManager } from '../enemy/EnemyManager';
import { Enemy } from '../enemy/Enemy';
import { SkywardMap } from '../world/SkywardMap';
import { AudioManager } from '../audio/AudioManager';
type Zone = {
    mesh: T.Mesh;
    active: boolean;
    type: 'grenade' | 'sticky' | 'arc' | 'scan' | 'shock' | 'heal' | 'shield';
    life: number;
    age: number;
    radius: number;
    tick: number;
    velocity: T.Vector3;
    flying: boolean;
};
export class Skills {
    operator = 'jiying';
    cooldowns = [0, 0, 0];
    overload = 0;
    shield = 0;
    armorTime = 0;
    dashLeft = 0;
    slideLeft = 0;
    dashDirection = new T.Vector3();
    zones: Zone[] = [];
    lastCrouch = false;
    ray = new T.Raycaster();
    readonly times: Record<string, number[]> = { jiying: [22, 14, 10], tiansun: [14, 18, 22], yuehen: [18, 22, 24], shouwang: [20, 25, 30] };
    constructor(readonly scene: T.Scene, readonly player: Player, public enemies: EnemyManager, readonly map: SkywardMap, readonly audio: AudioManager, readonly hurt: (e: Enemy, d: number) => void, readonly notify: (s: string) => void, readonly burst: (p: T.Vector3, color: number) => void) { for (let i = 0; i < 10; i++) {
        const mesh = new T.Mesh(new T.RingGeometry(.88, 1, 32), new T.MeshBasicMaterial({ color: 0x8cdeff, transparent: true, opacity: .6, side: T.DoubleSide, depthWrite: false }));
        mesh.rotation.x = -Math.PI / 2;
        mesh.visible = false;
        scene.add(mesh);
        this.zones.push({ mesh, active: false, type: 'scan', life: 0, age: 0, radius: 1, tick: 0, velocity: new T.Vector3(), flying: false });
    } }
    reset(id: string) { this.operator = id; this.cooldowns = [0, 0, 0]; this.overload = this.shield = this.armorTime = this.dashLeft = this.slideLeft = 0; this.player.armor = 0; this.player.speedBoost = 1; this.zones.forEach(z => { z.active = false; z.mesh.visible = false; }); }
    cast(slot: number, input: InputManager, camera: T.PerspectiveCamera) {
        if (slot < 0 || slot > 2 || this.cooldowns[slot] > 0)
            return false;
        this.cooldowns[slot] = this.times[this.operator][slot];
        this.audio.play('ui');
        if (this.operator === 'jiying') {
            if (slot === 0) {
                this.overload = 8;
                this.notify('超载 / 移动速度提升');
            }
            if (slot === 1)
                this.projectile('grenade', camera);
            if (slot === 2)
                this.slide(input);
        }
        else if (this.operator === 'tiansun') {
            if (slot === 0) {
                const a = input.axes();
                this.dashDirection.set(a.x || a.y ? a.x : 0, 0, a.x || a.y ? -a.y : -1).normalize().applyAxisAngle(new T.Vector3(0, 1, 0), this.player.yaw);
                this.dashLeft = .22;
                this.notify('动能推进');
            }
            if (slot === 1)
                this.projectile('sticky', camera);
            if (slot === 2) {
                this.area('shock', this.player.position, 6, 1);
                for (const e of this.enemies.active)
                    if (e.root.position.distanceTo(this.player.position) < 6)
                        e.slow = 4;
                this.notify('冲击弹 / 目标减速');
            }
        }
        else if (this.operator === 'yuehen') {
            if (slot === 0)
                this.projectile('scan', camera);
            if (slot === 1)
                this.projectile('arc', camera);
            if (slot === 2) {
                this.area('scan', this.player.position, 12, 4);
                this.notify('敌情标记');
            }
        }
        else {
            if (slot === 0)
                this.area('heal', this.player.position, 4, 6);
            if (slot === 1) {
                this.shield = 7;
                this.area('shield', this.player.position, 4, 7);
                this.notify('防护装置 / 近域减伤');
            }
            if (slot === 2) {
                this.player.armor = 60;
                this.armorTime = 10;
                this.notify('战术护甲 +60');
            }
        }
        return true;
    }
    slide(input: InputManager) { this.slideLeft = .65; this.dashDirection.set(0, 0, -1).applyAxisAngle(new T.Vector3(0, 1, 0), this.player.yaw); input.crouch = true; this.notify('战术滑铲'); }
    onKill() { if (this.operator === 'jiying' && this.overload > 0)
        this.overload = Math.min(12, this.overload + 1.5); }
    mark(e: Enemy) { if (this.operator === 'yuehen')
        e.reveal = 3; }
    area(type: Zone['type'], p: T.Vector3, radius: number, life: number) { const z = this.zones.find(z => !z.active) || this.zones[0]; z.type = type; z.active = true; z.life = life; z.age = 0; z.tick = 0; z.radius = radius; z.flying = false; z.mesh.visible = true; z.mesh.position.copy(p); z.mesh.position.y = this.map.groundAt(p.x, p.z) + .08; z.mesh.scale.setScalar(radius); (z.mesh.material as T.MeshBasicMaterial).color.setHex(type === 'heal' ? 0x7bffc2 : type === 'arc' ? 0xc59aff : type === 'grenade' || type === 'sticky' ? 0xffa24f : 0x86eaff); return z; }
    projectile(type: Zone['type'], camera: T.PerspectiveCamera) { const z = this.area(type, camera.position, .14, type === 'grenade' ? 2 : type === 'sticky' ? 2.7 : 9); z.mesh.position.copy(camera.position); z.flying = true; camera.getWorldDirection(z.velocity); z.velocity.multiplyScalar(type === 'scan' ? 24 : 17); this.notify(type === 'scan' ? '侦察箭已发射' : type === 'arc' ? '电弧箭已发射' : type === 'sticky' ? '吸附炸弹已投掷' : '微型榴弹已发射'); }
    explode(z: Zone) { this.burst(z.mesh.position, 0xffad55); for (const e of this.enemies.active) {
        const dist = e.root.position.distanceTo(z.mesh.position);
        if (dist < 6 && this.enemies.visible(z.mesh.position.clone().add(new T.Vector3(0, .25, 0)), e.root.position.clone().add(new T.Vector3(0, 1, 0))))
            this.hurt(e, 110 * (1 - dist / 8));
    } this.area('shock', z.mesh.position.clone(), 6, .5); this.audio.play('sniper'); }
    damageScale() { return this.shield > 0 && this.zones.some(z => z.active && z.type === 'shield' && z.mesh.position.distanceTo(this.player.position) < 4) ? .45 : 1; }
    update(dt: number, input: InputManager, camera: T.PerspectiveCamera) {
        this.cooldowns = this.cooldowns.map(t => Math.max(0, t - dt));
        this.overload = Math.max(0, this.overload - dt);
        this.shield = Math.max(0, this.shield - dt);
        this.armorTime = Math.max(0, this.armorTime - dt);
        if (this.armorTime === 0)
            this.player.armor = 0;
        this.player.speedBoost = this.overload > 0 ? 1.45 : 1;
        if (input.skill >= 0) {
            this.cast(input.skill, input, camera);
            input.skill = -1;
        }
        if (this.operator === 'jiying' && input.crouch && !this.lastCrouch && (input.sprint || input.keys.has('ShiftLeft')) && this.cooldowns[2] === 0) {
            this.cooldowns[2] = 10;
            this.slide(input);
        }
        this.lastCrouch = input.crouch;
        if (this.dashLeft > 0 || this.slideLeft > 0) {
            const speed = this.dashLeft > 0 ? 40 : 12;
            this.dashLeft = Math.max(0, this.dashLeft - dt);
            this.slideLeft = Math.max(0, this.slideLeft - dt);
            const steps = Math.ceil(speed * dt / .2);
            for (let i = 0; i < steps; i++)
                this.map.move(this.player.position, this.dashDirection.x * speed * dt / steps, this.dashDirection.z * speed * dt / steps);
            camera.fov = Math.min(90, camera.fov + 2);
        }
        for (const z of this.zones) {
            if (!z.active)
                continue;
            z.age += dt;
            z.life -= dt;
            z.tick -= dt;
            if (z.flying) {
                const movement = z.velocity.clone().multiplyScalar(dt), len = movement.length();
                this.ray.set(z.mesh.position, movement.normalize());
                this.ray.far = len;
                const hit = this.ray.intersectObjects(this.map.solids, false)[0];
                if (hit) {
                    z.mesh.position.copy(hit.point).addScaledVector(hit.face?.normal || new T.Vector3(0, 1, 0), .09);
                    z.flying = false;
                    if (z.type === 'grenade') {
                        this.explode(z);
                        z.active = false;
                        z.mesh.visible = false;
                        continue;
                    }
                    if (z.type === 'scan' || z.type === 'arc') {
                        z.life = 6;
                        z.radius = z.type === 'scan' ? 13 : 4;
                        z.mesh.position.y = this.map.groundAt(z.mesh.position.x, z.mesh.position.z) + .08;
                    }
                }
                else
                    z.mesh.position.addScaledVector(z.velocity, dt);
                if (z.type !== 'scan')
                    z.velocity.y -= 10 * dt;
                if (z.mesh.position.y < this.map.groundAt(z.mesh.position.x, z.mesh.position.z) + .05) {
                    z.flying = false;
                    z.mesh.position.y = this.map.groundAt(z.mesh.position.x, z.mesh.position.z) + .08;
                    if (z.type === 'arc' || z.type === 'scan') {
                        z.radius = z.type === 'scan' ? 13 : 4;
                        z.life = 6;
                    }
                    if (z.type === 'grenade') {
                        this.explode(z);
                        z.active = false;
                        z.mesh.visible = false;
                    }
                }
            }
            else {
                z.mesh.scale.setScalar(z.radius * (z.type === 'scan' ? .3 + (z.age * .4 % 1) : 1));
                if (z.tick <= 0) {
                    z.tick = .4;
                    for (const e of this.enemies.active)
                        if (e.root.position.distanceTo(z.mesh.position) < z.radius) {
                            if (z.type === 'scan')
                                e.reveal = 1;
                            if (z.type === 'arc') {
                                this.hurt(e, 12);
                                this.burst(e.root.position.clone().add(new T.Vector3(0, 1, 0)), 0xc59aff);
                            }
                        }
                    if (z.type === 'heal' && this.player.position.distanceTo(z.mesh.position) < 4)
                        this.player.hp = Math.min(100, this.player.hp + 5);
                }
            }
            if (z.life <= 0) {
                if (z.type === 'sticky' || z.type === 'grenade')
                    this.explode(z);
                z.active = false;
                z.mesh.visible = false;
            }
        }
        document.querySelectorAll<HTMLElement>('.skill-action').forEach((b, i) => { const label = (this.cooldowns[i] > 0 ? Math.ceil(this.cooldowns[i]) : ['Q', 'E', 'X'][i]) + '<small>' + (['技能 1', '技能 2', '特殊'][i]) + '</small>'; if(b.innerHTML!==label)b.innerHTML=label; b.classList.toggle('cooling', this.cooldowns[i] > 0); });
        document.getElementById('skill-status')!.textContent = this.overload > 0 ? '超载 ' + this.overload.toFixed(1) + 's' : this.player.armor > 0 ? '护甲 ' + Math.ceil(this.player.armor) : this.shield > 0 ? '防护装置 ' + this.shield.toFixed(1) + 's' : 'Q / E / X · 技能就绪';
    }
}
