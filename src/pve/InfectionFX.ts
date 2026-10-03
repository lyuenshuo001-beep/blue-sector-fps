import * as T from 'three';
import { AudioManager } from '../audio/AudioManager';
// Fixed pools: visible ballistic acid, persistent puddles and short-lived smoke/debris.
export class InfectionFX {
    projectiles: {
        mesh: T.Mesh;
        velocity: T.Vector3;
        life: number;
    }[] = [];
    pools: {
        mesh: T.Mesh;
        life: number;
        tick: number;
    }[] = [];
    particles: {
        mesh: T.Mesh;
        velocity: T.Vector3;
        life: number;
        max: number;
        smoke: boolean;
    }[] = [];
    ray = new T.Raycaster();
    shake = 0;
    constructor(scene: T.Scene, readonly solids: T.Object3D[], readonly floor: (x: number, z: number) => number, readonly audio: AudioManager) {
        const acidGeo = new T.SphereGeometry(.17, 8, 6), acidMat = new T.MeshBasicMaterial({ color: 0xc6fa65 });
        for (let i = 0; i < 12; i++) {
            const mesh = new T.Mesh(acidGeo, acidMat);
            mesh.visible = false;
            scene.add(mesh);
            this.projectiles.push({ mesh, velocity: new T.Vector3(), life: 0 });
        }
        for (let i = 0; i < 12; i++) {
            const mesh = new T.Mesh(new T.CircleGeometry(2.15, 24), new T.MeshBasicMaterial({ color: 0x7d9a23, transparent: true, opacity: .65, depthWrite: false, side: T.DoubleSide }));
            mesh.rotation.x = -Math.PI / 2;
            mesh.visible = false;
            scene.add(mesh);
            this.pools.push({ mesh, life: 0, tick: 0 });
        }
        const particleGeo = new T.IcosahedronGeometry(.1, 0);
        for (let i = 0; i < 72; i++) {
            const mesh = new T.Mesh(particleGeo, new T.MeshBasicMaterial({ color: 0xdeb08c, transparent: true, depthWrite: false }));
            mesh.visible = false;
            scene.add(mesh);
            this.particles.push({ mesh, velocity: new T.Vector3(), life: 0, max: 1, smoke: false });
        }
    }
    reset() { this.projectiles.forEach(p => { p.life = 0; p.mesh.visible = false; }); this.pools.forEach(p => { p.life = 0; p.mesh.visible = false; }); this.particles.forEach(p => { p.life = 0; p.mesh.visible = false; }); this.shake = 0; }
    spit(from: T.Vector3, target: T.Vector3) { const p = this.projectiles.find(p => p.life <= 0); if (!p)
        return; const t = T.MathUtils.clamp(from.distanceTo(target) / 12, .55, 1.5); p.mesh.position.copy(from); p.velocity.subVectors(target, from).divideScalar(t); p.velocity.y += 4.5 * t; p.life = 3; p.mesh.visible = true; this.audio.creature('spit'); }
    puddle(point: T.Vector3) { const p = this.pools.find(p => p.life <= 0) || this.pools[0]; p.mesh.position.copy(point); p.mesh.position.y = this.floor(point.x, point.z) + .05; p.life = 7; p.tick = 0; p.mesh.visible = true; this.burst(point, 0xa4d147, 10); }
    burst(point: T.Vector3, color: number, count: number, smoke = false) { for (const p of this.particles) {
        if (p.life > 0)
            continue;
        p.mesh.position.copy(point);
        p.life = p.max = smoke ? 1.3 : .45;
        p.smoke = smoke;
        p.mesh.visible = true;
        p.mesh.scale.setScalar(smoke ? 2 : 1);
        (p.mesh.material as T.MeshBasicMaterial).color.setHex(color);
        p.velocity.set((Math.random() - .5) * (smoke ? 3 : 8), Math.random() * 5, (Math.random() - .5) * (smoke ? 3 : 8));
        if (--count <= 0)
            break;
    } }
    explosion(point: T.Vector3, viewer: T.Vector3, low: boolean) { this.burst(point, 0xffb056, low ? 8 : 18); this.burst(point, 0x494a43, low ? 4 : 12, true); this.shake = Math.max(this.shake, Math.max(0, 1 - point.distanceTo(viewer) / 18) * .7); this.audio.creature('explode'); }
    update(dt: number, player: T.Vector3, hurt: (n: number) => void) {
        this.shake = Math.max(0, this.shake - dt * 1.5);
        for (const p of this.projectiles) {
            if (p.life <= 0)
                continue;
            p.life -= dt;
            const move = p.velocity.clone().multiplyScalar(dt);
            this.ray.set(p.mesh.position, move.clone().normalize());
            this.ray.far = move.length();
            const hit = this.ray.intersectObjects(this.solids, false)[0];
            if (hit)
                p.mesh.position.copy(hit.point);
            else
                p.mesh.position.add(move);
            p.velocity.y -= 9 * dt;
            if (hit || p.mesh.position.y <= this.floor(p.mesh.position.x, p.mesh.position.z) + .15 || p.life <= 0) {
                this.puddle(p.mesh.position);
                p.life = 0;
                p.mesh.visible = false;
            }
        }
        for (const p of this.pools) {
            if (p.life <= 0)
                continue;
            p.life -= dt;
            p.tick -= dt;
            p.mesh.visible = p.life > 0;
            (p.mesh.material as T.MeshBasicMaterial).opacity = Math.min(.65, p.life * .2);
            if (p.tick <= 0) {
                p.tick = .45;
                if (Math.hypot(player.x - p.mesh.position.x, player.z - p.mesh.position.z) < 2.15 && Math.abs(player.y - p.mesh.position.y) < 1.4)
                    hurt(5);
                this.burst(p.mesh.position.clone().add(new T.Vector3(Math.random() * 2 - 1, .1, Math.random() * 2 - 1)), 0x9aaa53, 1, true);
            }
        }
        for (const p of this.particles) {
            if (p.life <= 0)
                continue;
            p.life -= dt;
            p.mesh.visible = p.life > 0;
            p.mesh.position.addScaledVector(p.velocity, dt);
            p.velocity.y += dt * (p.smoke ? .8 : -12);
            if (p.smoke)
                p.mesh.scale.multiplyScalar(1 + dt * .7);
            (p.mesh.material as T.MeshBasicMaterial).opacity = Math.max(0, p.life / p.max);
        }
    }
}
