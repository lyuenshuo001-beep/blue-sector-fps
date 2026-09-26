import * as T from 'three';
export class HitEffect {
    pool: {
        mesh: T.Mesh;
        life: number;
        velocity: T.Vector3;
    }[] = [];
    constructor(scene: T.Scene) { const geometry = new T.BoxGeometry(.035, .035, .035); for (let i = 0; i < 36; i++) {
        const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial({ color: 0xffc477 }));
        mesh.visible = false;
        scene.add(mesh);
        this.pool.push({ mesh, life: 0, velocity: new T.Vector3() });
    } }
    emit(p: T.Vector3, count: number, color = 0xffc477) { let left = count; for (const v of this.pool) {
        if (v.life > 0)
            continue;
        v.life = .22;
        v.mesh.visible = true;
        v.mesh.position.copy(p);
        (v.mesh.material as T.MeshBasicMaterial).color.setHex(color);
        v.velocity.set((Math.random() - .5) * 3, Math.random() * 3, (Math.random() - .5) * 3);
        if (--left <= 0)
            break;
    } }
    update(dt: number) { for (const v of this.pool)
        if (v.life > 0) {
            v.life -= dt;
            v.mesh.position.addScaledVector(v.velocity, dt);
            v.velocity.y -= 9 * dt;
            v.mesh.visible = v.life > 0;
        } }
    reset() { this.pool.forEach(p => { p.life = 0; p.mesh.visible = false; }); }
}
