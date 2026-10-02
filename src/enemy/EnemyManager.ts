import * as T from 'three';
import { Enemy } from './Enemy';
import { BlueRoomMap } from '../world/BlueRoomMap';
import { Player } from '../player/Player';
import { AudioManager } from '../audio/AudioManager';
export class EnemyManager {
    pool: Enemy[];
    wave = 0;
    remaining = 0;
    waveDelay = 1.5;
    spawnTimer = 0;
    maxActive = 15;
    kills = 0;
    private ray = new T.Raycaster();
    private direction = new T.Vector3();
    constructor(readonly scene: T.Scene, readonly map: BlueRoomMap, readonly audio: AudioManager) { this.pool = Array.from({ length: 15 }, (_, i) => new Enemy(i, scene)); }
    get active() { return this.pool.filter(e => e.active); }
    reset() { this.pool.forEach(e => e.die()); this.wave = 0; this.remaining = 0; this.waveDelay = 0; this.spawnTimer = 0; this.kills = 0; }
    visible(a: T.Vector3, b: T.Vector3) { this.direction.subVectors(b, a); const distance = this.direction.length(); this.ray.set(a, this.direction.normalize()); this.ray.far = distance; return this.ray.intersectObjects(this.map.solids, false).length === 0; }
    spawn(camera: T.PerspectiveCamera) { const available = this.map.spawns.filter(p => { if (p.distanceTo(camera.position) < 12)
        return false; if (this.active.some(e => e.root.position.distanceTo(p) < 2))
        return false; const target = p.clone().add(new T.Vector3(0, 1.5, 0)), screen = target.clone().project(camera); const inView = screen.z >= -1 && screen.z <= 1 && Math.abs(screen.x) < 1.2 && Math.abs(screen.y) < 1.2; return !inView || !this.visible(camera.position, target); }); if (!available.length)
        return false; const e = this.pool.find(e => !e.active); if (!e)
        return false; e.spawn(available[Math.floor(Math.random() * available.length)], this.wave); return true; }
    update(dt: number, player: Player, camera: T.PerspectiveCamera, onDamage: (n: number) => void, onWave: (n: number) => void) {
        if (this.remaining === 0 && this.active.length === 0) {
            this.waveDelay -= dt;
            if (this.waveDelay <= 0) {
                this.wave++;
                this.remaining = Math.min(3 + (this.wave - 1) * 2, 45);
                this.waveDelay = 4;
                onWave(this.wave);
            }
        }
        this.spawnTimer -= dt;
        if (this.remaining > 0 && this.active.length < this.maxActive && this.spawnTimer <= 0) {
            if (this.spawn(camera))
                this.remaining--;
            this.spawnTimer = .65;
        }
        for (const e of this.active) {
            e.age += dt;
            e.think -= dt;
            e.attack -= dt;
            e.flash.visible = e.attack > 1.05 && e.attack < 1.12;
            const p = e.root.position, dist = p.distanceTo(player.position);
            if (e.think <= 0) {
                e.think = .45 + e.id * .013;
                const eye = p.clone().add(new T.Vector3(0, 1.55, 0)), sight = dist < 25 && this.visible(eye, camera.position);
                if (sight)
                    e.alert = 6;
                else
                    e.alert = Math.max(0, e.alert - .5);
                if (sight && dist < 15)
                    e.state = 'ATTACK';
                else if (e.alert > 0 || dist < 19) {
                    e.state = 'CHASE';
                    e.path = this.map.path(p, player.position);
                }
                else if (e.age > .7) {
                    e.state = 'PATROL';
                    if (e.path.length === 0)
                        e.path = this.map.path(p, this.map.spawns[(e.id + Math.floor(e.age / 12)) % this.map.spawns.length]);
                }
            }
            if (e.state === 'ATTACK') {
                e.root.rotation.y = Math.atan2(player.position.x - p.x, player.position.z - p.z);
                if (e.attack <= 0) {
                    e.attack = 1.12 + Math.random() * .65;
                    this.audio.play('enemy');
                    if (this.visible(p.clone().add(new T.Vector3(0, 1.55, 0)), camera.position) && Math.random() < (player.moving ? .48 : .72))
                        onDamage(6 + Math.min(6, this.wave));
                }
            }
            else if (e.path.length) {
                const target = e.path[0], dx = target.x - p.x, dz = target.z - p.z, l = Math.hypot(dx, dz);
                if (l < .25)
                    e.path.shift();
                else {
                    const speed = e.state === 'CHASE' ? 2.5 : 1.65;
                    this.map.move(p, dx / l * speed * dt, dz / l * speed * dt, .43);
                    p.y=this.map.groundAt(p.x,p.z);e.root.rotation.y = Math.atan2(dx, dz);
                    e.legs.forEach((leg, i) => leg.rotation.x = Math.sin(e.age * 8 + i * Math.PI) * .35);
                }
            }
        }
    }
}

