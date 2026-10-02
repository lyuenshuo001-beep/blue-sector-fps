import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export interface Obstacle {
    x: number;
    z: number;
    w: number;
    d: number;
    h: number;
}
export class BlueRoomMap {
    obstacles: Obstacle[] = [];
    solids: T.Object3D[] = [];
    private batches = new Map<number, T.BufferGeometry[]>();
    spawns = [new T.Vector3(-20, 0, -25), new T.Vector3(20, 0, -25), new T.Vector3(-21, 0, 8), new T.Vector3(21, 0, 8), new T.Vector3(0, 0, -28), new T.Vector3(-20, 0, 24), new T.Vector3(20, 0, 24)];
    nav: T.Vector3[] = [];
    links: number[][] = [];
    constructor(readonly scene: T.Scene, build = true) { if (!build) return;
        this.box(0, -.25, 0, 52, .5, 64, 0x263e4b, false);
        this.box(-26, 2.7, 0, .6, 5.4, 64, 0x314657);
        this.box(26, 2.7, 0, .6, 5.4, 64, 0x314657);
        this.box(0, 2.7, -32, 52, 5.4, .6, 0x314657);
        this.box(0, 2.7, 32, 52, 5.4, .6, 0x314657);
        for (const x of [-13, 13])
            for (const z of [-25, 0, 25])
                this.box(x, 2.4, z, .6, 4.8, z === 0 ? 16 : 12, 0x344d60);
        for (const z of [-17, 17]) {
            this.box(-8.5, 2.4, z, 8.5, 4.8, .6, 0x344d60);
            this.box(8.5, 2.4, z, 8.5, 4.8, .6, 0x344d60);
        }
        for (const x of [-20, 20])
            this.box(x, 2.4, -12, 8, 4.8, .5, 0x344d60);
        this.box(0, .22, 0, 6, .44, 8, 0x152532);
        this.box(0, 1.2, 0, 3.4, 2.4, 4.6, 0x334f5d);
        this.box(0, 2.55, 0, 2.5, .22, 3.5, 0x55cbe3, false);
        for (const x of [-9, 9])
            for (const z of [-11, 11]) {
                this.box(x, 2.5, z, .7, 5, .7, 0x476275);
                this.box(x - .37, 2.3, z, .04, 3.7, .3, 0x59d9ff, false);
            }
        for (const x of [-7, 7]) {
            this.box(x, .75, -7, 3, 1.5, 1.5, 0x405865);
            this.box(x, 1.53, -7, 2.7, .12, 1.3, 0x36728b, false);
            this.box(x, .7, 8, 2.8, 1.4, 1.8, 0x59636a);
        }
        for (const x of [-22, 22])
            for (const z of [-23, -19, 16, 20]) {
                this.box(x, 1.45, z, 2, 2.9, 1.6, 0x172b3b);
                for (let y = .5; y < 2.6; y += .5)
                    this.box(x, y, z + .82, 1.5, .1, .04, 0x55b4d2, false);
            }
        for (const x of [-19, 19])
            this.box(x, .7, 1, 3, 1.4, 4, 0x596570);
        for (const z of [-26, 25]) {
            this.box(-6, .75, z, 2.4, 1.5, 2, 0x4a5b63);
            this.box(7, .75, z, 2.4, 1.5, 2, 0x4a5b63);
        }
        for (let z = -30; z <= 30; z += 4) {
            this.box(0, .015, z, 51, .02, .035, 0x102631, false);
            this.box(0, 5.4, z, 51, .18, .16, 0x263947, false);
        }
        for (let x = -24; x <= 24; x += 4)
            this.box(x, .017, 0, .035, .02, 63, 0x102631, false);
        for (const x of [-24.8, -11.5, 11.5, 24.8]) {
            this.box(x, .08, 0, .09, .04, 62, 0x31b8f4, false);
            for (const z of [-25, -10, 5, 20])
                this.box(x, 4.9, z, .18, .08, 7, 0xa3e6ff, false);
        }
        for (const x of [-25.3, 25.3]) {
            this.box(x, 4.1, 0, .35, .35, 62, 0x456171, false);
            this.box(x, 3.55, 0, .2, .2, 62, 0x637b8b, false);
        }
        this.box(0, 5.65, 0, 52, .2, 64, 0x162735, false);
        for (const z of [-17, 17]) {
            for (const x of [-4.1, 4.1]) {
                this.box(x, 2.4, z, .3, 4.8, .85, 0x637b8b, false);
                this.box(x, 2.5, z + .44, .07, 3.8, .06, 0x59d9ff, false);
            }
            this.box(0, 4.5, z, 8.5, .55, .85, 0x476275, false);
        }
        for (const x of [-12.65, 12.65])
            for (const z of [-4, 0, 4]) {
                this.box(x, 1.8, z, .08, 2.2, 2.9, 0x263947, false);
                this.box(x, 3.15, z, .09, .06, 2.9, 0x55b4d2, false);
            }
        for (const x of [-7, 7])
            for (const z of [8, -26, 25]) {
                this.box(x, .75, z, 2.82, .12, 1.84, 0x172b3b, false);
            }
        for (const x of [-7, 7]) {
            this.box(x, 1.95, -7.4, 1.35, .75, .12, 0x172b3b, false);
            this.box(x, 1.95, -7.32, 1.17, .57, .025, 0x36728b, false);
            this.box(x, 1.72, -7.29, .9, .025, .025, 0x55b4d2, false);
        }
        for (const x of [-5, 5])
            for (const z of [-12, 0, 12])
                this.box(x, 5.22, z, 2.4, .05, .65, 0xa3e6ff, false);
        this.flush();
        const core = new T.Mesh(new T.CylinderGeometry(.68, .68, 1.7, 12), new T.MeshStandardMaterial({ color: 0x70d8ef, emissive: 0x1d7eb0, emissiveIntensity: .65, metalness: .4, roughness: .3 }));
        core.position.set(0, 3.45, 0);
        scene.add(core);
        for (const y of [2.7, 3.6, 4.3]) {
            const ring = new T.Mesh(new T.TorusGeometry(1.05, .075, 6, 20), new T.MeshStandardMaterial({ color: 0x87dcef, emissive: 0x28769a, emissiveIntensity: .4 }));
            ring.rotation.x = Math.PI / 2;
            ring.position.set(0, y, 0);
            scene.add(ring);
        }
        const glass = new T.Mesh(new T.BoxGeometry(5, 2, .12), new T.MeshStandardMaterial({ color: 0x64b5d7, transparent: true, opacity: .2, roughness: .15, depthWrite: false }));
        glass.position.set(-7, 2.5, 3);
        scene.add(glass);
        this.solids.push(glass);
        this.obstacles.push({ x: -7, z: 3, w: 5, d: .12, h: 3.5 });
        this.label('BLUE ROOM', 0, 3.45, -16.6, 6, 1.1);
        this.label('SYSTEM ONLINE', 0, 2.75, -16.58, 4, .45);
        this.label('SECTOR B / 01', 0, 3.6, -31.65, 7, 1);
        this.label('LAB-01', -19, 3.5, -31.6, 4, .8);
        this.label('CONTROL', 19, 3.5, -31.6, 4, .8);
        this.label('BLUE SECTOR', 0, 3.4, 31.6, 7, 1, Math.PI);
        this.buildNav();
    }
    box(x: number, y: number, z: number, w: number, h: number, d: number, c: number, solid = true) { const g = new T.BoxGeometry(w, h, d); g.translate(x, y, z); const a = this.batches.get(c) || []; a.push(g); this.batches.set(c, a); if (solid)
        this.obstacles.push({ x, z, w, d, h: y + h / 2 }); }
    flush() { for (const [c, gs] of this.batches) {
        const glow = [0x55cbe3, 0x59d9ff, 0x55b4d2, 0x31b8f4, 0xa3e6ff].includes(c);
        const mesh = new T.Mesh(mergeGeometries(gs), new T.MeshStandardMaterial({ color: c, roughness: .75, metalness: .3, emissive: glow ? c : 0, emissiveIntensity: glow ? 1 : 0 }));
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.solids.push(mesh);
        gs.forEach(g => g.dispose());
    } this.batches.clear(); }
    label(text: string, x: number, y: number, z: number, w: number, h: number, rot = 0) { const c = document.createElement('canvas'); c.width = 1024; c.height = 192; const ctx = c.getContext('2d')!; ctx.fillStyle = '#091d2b'; ctx.fillRect(0, 0, 1024, 192); ctx.fillStyle = '#a0edff'; ctx.font = 'bold 100px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 512, 96); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t })); m.position.set(x, y, z); m.rotation.y = rot; this.scene.add(m); }
    groundAt(x:number,z:number){return 0;}
    blocked(x: number, z: number, r = .38) { return this.obstacles.some(o => Math.abs(x - o.x) < o.w / 2 + r && Math.abs(z - o.z) < o.d / 2 + r); }
    move(p: T.Vector3, dx: number, dz: number, r = .38) { if (!this.blocked(p.x + dx, p.z, r))
        p.x += dx; if (!this.blocked(p.x, p.z + dz, r))
        p.z += dz; }
    clear(a: T.Vector3, b: T.Vector3, r = .35) { const n = Math.ceil(a.distanceTo(b) / .4); for (let i = 0; i <= n; i++) {
        const t = i / Math.max(1, n);
        if (this.blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, r))
            return false;
    } return true; }
    buildNav() { for (let z = -29; z <= 29; z += 2)
        for (let x = -23; x <= 23; x += 2)
            if (!this.blocked(x, z, .6))
                this.nav.push(new T.Vector3(x, 0, z)); this.links = this.nav.map((p, i) => this.nav.flatMap((q, j) => i !== j && p.distanceTo(q) < 2.9 && this.clear(p, q, .5) ? [j] : [])); }
    path(a: T.Vector3, b: T.Vector3) { if (this.clear(a, b, .5))
        return [b.clone()]; const nearest = (p: T.Vector3) => { let best = 0, d = Infinity; this.nav.forEach((n, i) => { const nd = n.distanceToSquared(p); if (nd < d) {
        d = nd;
        best = i;
    } }); return best; }; const start = nearest(a), end = nearest(b), queue = [start], prev = new Map<number, number>([[start, -1]]); for (let k = 0; k < queue.length; k++) {
        const v = queue[k];
        if (v === end)
            break;
        for (const n of this.links[v])
            if (!prev.has(n)) {
                prev.set(n, v);
                queue.push(n);
            }
    } if (!prev.has(end))
        return []; const out: T.Vector3[] = []; for (let n = end; n !== start; n = prev.get(n)!)
        out.unshift(this.nav[n].clone()); return out; }
}

