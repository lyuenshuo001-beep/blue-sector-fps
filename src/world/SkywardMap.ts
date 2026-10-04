import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BlueRoomMap } from './BlueRoomMap';
import { material, worldUV, Surface } from './Materials';
export class SkywardMap extends BlueRoomMap {
    private parts = new Map<T.Material, T.BufferGeometry[]>();
    private trims: {
        g: T.BufferGeometry;
        m: T.Material;
        mat: T.Matrix4;
    }[] = [];
    readonly name: string = 'SKYWARD / 悬空城';
    readonly secrets: T.Vector3[] = [];
    constructor(scene: T.Scene, build=true) {
        super(scene, false); if(!build)return;
        this.spawns = [[-25, -29], [27, -29], [-28, 5], [28, 20], [0, -34], [-22, 28], [22, -17]].map(([x, z]) => new T.Vector3(x, this.groundAt(x, z), z));
        this.addBox(0, -.4, 0, 66, .8, 74, 'stone', 0xb4b0a2, false);
        // Original three-lane plan: staggered solid buildings with broad transverse links.
        this.building(-13, 15, 12, 13, 8, 0xe8c9a4);
        // East building becomes an enterable two-door service hall, joining south and middle lanes.
        for(const x of [8,20])this.addBox(x,3.5,18,.5,7,10,'plaster',0xe5b9a0);
        for(const z of [13,23])for(const x of [9.5,18.5])this.addBox(x,3.5,z,3,7,.5,'brick',0xb58d79);
        this.addBox(14,7,18,12,.35,10,'wood',0x706354,false);
        this.addBox(12,1,18,2,2,3,'metal',0x56656b);
        this.sign('EAST SERVICE / 捷径',14,3.8,23.3,5,.7);
        this.building(-13, -13, 10, 13, 8.5, 0xd7bc8e);
        this.building(13, -17, 11, 11, 9, 0xdba998);
        this.building(0, -28, 8, 9, 13, 0xe7d6b1);
        // Workshop is genuinely enterable, with east and south doorways.
        this.addBox(30, 3, -4, .5, 6, 14, 'plaster', 0xc7c5b5);
        this.addBox(23, 3, -11, 14, 6, .5, 'brick', 0xb8a088);
        this.addBox(16, 3, -7, .5, 6, 8, 'plaster', 0xd4c8b1);
        this.addBox(19, 3, 3, 6, 6, .5, 'plaster', 0xd4c8b1);
        this.addBox(28, 3, 3, 4, 6, .5, 'plaster', 0xd4c8b1);
        this.addBox(23, 6, -4, 14, .3, 14, 'wood', 0x776955, false);
        // Walkable elevated balcony, approached by a ramp from the south.
        this.addBox(21, 1.1, 8, 8, 2.2, 8, 'stone', 0xc2b79c, false);
        const ramp = new T.BufferGeometry();
        const a = [17, 0, 20, 25, 0, 20, 17, 2.4, 12, 25, 0, 20, 25, 2.4, 12, 17, 2.4, 12];
        ramp.setAttribute('position', new T.Float32BufferAttribute(a, 3));
        ramp.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 2, 0, 0, 2, 2, 0, 2, 2, 0, 2], 2));
        ramp.computeVertexNormals();
        this.part(ramp, material('stone', 0xc2b79c));
        this.addBox(21, 2.32, 8, 8, .16, 8, 'stone', 0xc2b79c, false);
        // Fountain courtyard, market, clock tower and tactical cover.
        this.fountain(-23, -20);
        this.arch(-22, 4, 8, 5, 0xdcc9ab);
        this.arch(1, 9, 9, 5.5, 0xdfc8a6);
        for (const [x, z] of [[-28, 19], [-5, 3], [6, -5], [-22, -5], [26, -25], [7, 29]])
            this.crate(x, z);
        for (const x of [-28, -23]) {
            this.addBox(x, 1.05, 9, 3, 2.1, 1.2, 'wood', 0x8e6745);
            this.addBox(x, 3, 9, 3.4, .16, 2.5, 'plaster', x === -28 ? 0x579a92 : 0xe2ad6c, false);
            for (const z of [8, 10])
                this.cylinder(x - 1.5, 1.5, z, .07, 3, 0x5f4939);
        }
        this.addBox(24, .65, -6, 6, 1.3, 1.6, 'metal', 0x68736d);
        this.addBox(28, 1.5, -8, 1, 3, 1, 'metal', 0x444d51);
        for (const [x, z] of [[-29, 30], [-27, -8], [-28, -30], [29, 29], [7, -32], [-5, -23]])
            this.tree(x, z);
        for (const x of [-32, 32])
            this.addBox(x, .65, 0, .5, 1.3, 73, 'stone', 0xd1c4ad);
        for (const z of [-36, 36])
            this.addBox(0, .65, z, 64, 1.3, .5, 'stone', 0xd1c4ad);
        // Invisible boundary above low perimeter walls keeps jumps inside the floating island.
        this.obstacles.push({ x: -33, z: 0, w: 1, d: 75, h: 50 }, { x: 33, z: 0, w: 1, d: 75, h: 50 }, { x: 0, z: -37, w: 68, d: 1, h: 50 }, { x: 0, z: 37, w: 68, d: 1, h: 50 });
        for (const x of [-30, 30])
            for (const z of [-25, 0, 25]) {
                this.cylinder(x, 2.3, z, .08, 4.6, 0x394c54);
                this.addBox(x, 4.5, z, .7, .2, .7, 'metal', 0x344751, false);
            }
        this.clock(0, 9, -23.4);
        this.sign('A  /  FONTANA', -23, 3, -13, 5, .8);
        this.sign('B  /  WORKSHOP', 23, 4, 3.3, 6, .8);
        this.sign('MERCATO', -25, 3.6, 11, 5, .8);
        this.sign('SKYWARD', 0, 4, -23.3, 6, 1);
        const eggs: [
            string,
            number,
            number,
            number,
            number
        ][] = [['Twinkle原创', -28, 1, 20, 0], ['TWINKLE LAB', 28, 2, -7, 0], ['PROPERTY OF TWINKLE', -12, 1, 21.6, 0], ['Created by Twinkle', 7, 1, 29.9, 0], ['TWINKLE INDUSTRIES', -22, 1, -4.1, 0], ['Twinkle原创', 1, 1, -23.4, 0]];
        for (const [t, x, y, z, rot] of eggs) {
            this.sign(t, x, y, z, 1.4, .28, rot);
            this.secrets.push(new T.Vector3(x, y, z));
        }
        this.flushParts();
        this.addAtmosphere();
        this.buildNav();
    }
    // Elevated surfaces can only be entered through a ramp, not by snapping up cliff edges.
    override move(p: T.Vector3, dx: number, dz: number, r = .38) { const can = (x: number, z: number) => !this.blocked(x, z, r) && this.groundAt(x, z) <= Math.max(p.y, this.groundAt(p.x, p.z)) + .32; if (can(p.x + dx, p.z))
        p.x += dx; if (can(p.x, p.z + dz))
        p.z += dz; }
    override clear(a: T.Vector3, b: T.Vector3, r = .35) { const n = Math.ceil(a.distanceTo(b) / .35); let previous = this.groundAt(a.x, a.z); for (let i = 0; i <= n; i++) {
        const t = i / Math.max(1, n), x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, h = this.groundAt(x, z);
        if (this.blocked(x, z, r) || Math.abs(h - previous) > .4)
            return false;
        previous = h;
    } return true; }
    addAtmosphere() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 256;
        const ctx = c.getContext('2d')!, gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#439dd2');
        gradient.addColorStop(.5, '#abd7e9');
        gradient.addColorStop(.7, '#e2e5dc');
        gradient.addColorStop(1, '#8a999f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);
        for (let i = 0; i < 14; i++) {
            ctx.fillStyle = 'rgba(255,255,255,.16)';
            ctx.beginPath();
            ctx.ellipse((i * 91) % 512, 55 + (i * 23) % 60, 25 + i % 4 * 9, 3 + i % 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        const sky = new T.CanvasTexture(c);
        sky.mapping = T.EquirectangularReflectionMapping;
        sky.colorSpace = T.SRGBColorSpace;
        this.scene.background = sky;
        const leaves = new T.InstancedMesh(new T.SphereGeometry(.17, 6, 4), material('plaster', 0x4f7656), 80), dummy = new T.Object3D();
        for (let i = 0; i < 80; i++) {
            const side = i < 40 ? -1 : 1, j = i % 40;
            dummy.position.set(side * 6.95, 3.1 + j * .1, 14 + Math.sin(j * .8) * .5);
            dummy.scale.set(1.5, 1, .5);
            dummy.rotation.z = j * .5;
            dummy.updateMatrix();
            leaves.setMatrixAt(i, dummy.matrix);
        }
        leaves.instanceMatrix.needsUpdate = true;
        this.scene.add(leaves);
    }
    groundAt(x: number, z: number) { if (x >= 17 && x <= 25) {
        if (z >= 4 && z <= 12)
            return 2.4;
        if (z > 12 && z <= 20)
            return (20 - z) * .3;
    } return 0; }
    zone(p: T.Vector3): string { return p.x < -17 ? (p.z < 0 ? 'A / FONTANA' : p.z < 18 ? 'MARKET' : 'GARDEN') : p.x > 16 ? (p.z < 4 ? 'B / WORKSHOP' : p.z < 20 ? 'BALCONY' : 'EAST LINK') : 'MID / CLOCK PLAZA'; }
    part(g: T.BufferGeometry, m: T.Material) { if (g.index) {
        const old = g;
        g = g.toNonIndexed();
        old.dispose();
    } const list = this.parts.get(m) || []; list.push(g); this.parts.set(m, list); }
    addBox(x: number, y: number, z: number, w: number, h: number, d: number, k: Surface, c: number, solid = true) { const g = worldUV(new T.BoxGeometry(w, h, d)); g.translate(x, y, z); this.part(g, material(k, c)); if (solid)
        this.obstacles.push({ x, z, w, d, h: y + h / 2 }); }
    cylinder(x: number, y: number, z: number, r: number, h: number, c: number) { const g = new T.CylinderGeometry(r, r, h, 12); g.translate(x, y, z); this.part(g, material('metal', c)); }
    building(x: number, z: number, w: number, d: number, h: number, c: number) {
        this.addBox(x, h / 2, z, w, h, d, 'plaster', c);
        this.addBox(x, .35, z, w + .2, .7, d + .2, 'stone', 0xb7ac94);
        this.addBox(x, h - .12, z, w + .5, .3, d + .5, 'stone', 0xf0dcc0, false);
        this.addBox(x, h + .3, z, w + .8, .45, d + .8, 'brick', 0xa9664e, false);
        for (const side of [-1, 1]) {
            for (let xx = -w / 2 + 1.5; xx < w / 2; xx += 2.8) {
                this.addBox(x + xx, 4.2, z + side * (d / 2 + .04), 1.25, 1.9, .12, 'wood', 0x426969, false);
                this.addBox(x + xx, 5.25, z + side * (d / 2 + .1), 1.6, .16, .35, 'stone', 0xd6c4a6, false);
                this.addBox(x + xx, 3.2, z + side * (d / 2 + .1), 1.6, .18, .4, 'stone', 0xd6c4a6, false);
                this.addBox(x + xx, 4.2, z + side * (d / 2 + .12), .06, 1.9, .07, 'wood', 0xbcc2aa, false);
            }
            this.addBox(x, h * .5, z + side * (d / 2 + .04), w, .05, .1, 'stone', 0xb5a18b, false);
        }
    }
    arch(x: number, z: number, w: number, h: number, c: number) { for (const s of [-1, 1])
        this.addBox(x + s * (w / 2 + .35), (h - w / 2) / 2, z, .7, h - w / 2, 1.2, 'stone', c); const shape = new T.Shape(); const r = w / 2; shape.absarc(0, 0, r + .65, 0, Math.PI, false); shape.lineTo(-r, 0); shape.absarc(0, 0, r, Math.PI, 0, true); shape.closePath(); const g = new T.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false, curveSegments: 18 }); g.translate(x, h - r, z - .6); this.part(g, material('stone', c)); this.obstacles.push({ x: x - w / 2 - .35, z, w: .7, d: 1.2, h }, { x: x + w / 2 + .35, z, w: .7, d: 1.2, h }); }
    fountain(x: number, z: number) { const m = material('stone', 0xd8d0b9); for (const [r, h, y] of [[2.5, .45, .225], [1.6, .2, .6], [.45, 1.8, 1.2], [1, .18, 2.05]]) {
        const g = new T.CylinderGeometry(r, r, h, 24);
        g.translate(x, y, z);
        this.part(g, m);
    } const water = new T.Mesh(new T.CircleGeometry(2.2, 24), new T.MeshStandardMaterial({ color: 0x4fbbcb, metalness: .3, roughness: .18 })); water.rotation.x = -Math.PI / 2; water.position.set(x, .47, z); this.scene.add(water); this.obstacles.push({ x, z, w: 4.8, d: 4.8, h: 2.2 }); }
    crate(x: number, z: number) { this.addBox(x, .7, z, 2.2, 1.4, 1.7, 'wood', 0x9e794c); for (const dx of [-.85, .85])
        this.addBox(x + dx, .72, z, .14, 1.5, 1.8, 'metal', 0x556064, false); this.addBox(x, .72, z + .86, 2.2, .14, .08, 'wood', 0x624b31, false); }
    tree(x: number, z: number) { this.cylinder(x, 1.8, z, .16, 3.6, 0x665644); const leaf = material('plaster', 0x527958); for (const [dx, dy, dz] of [[0, 3.7, 0], [-.7, 3.2, .2], [.7, 3.35, -.2]]) {
        const g = new T.IcosahedronGeometry(1.35, 1);
        g.scale(1, 1.4, 1);
        g.translate(x + dx, dy, z + dz);
        this.part(g, leaf);
    } this.addBox(x, .25, z, 2, .5, 2, 'stone', 0xc1b295); }
    sign(t: string, x: number, y: number, z: number, w: number, h: number, rot = 0) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const ctx = c.getContext('2d')!; ctx.fillStyle = '#203c40'; ctx.fillRect(0, 0, 512, 96); ctx.strokeStyle = '#d7b983'; ctx.lineWidth = 6; ctx.strokeRect(7, 7, 498, 82); ctx.fillStyle = '#f6e8c8'; ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, 256, 48, 470); const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex })); mesh.position.set(x, y, z); mesh.rotation.y = rot; this.scene.add(mesh); }
    clock(x: number, y: number, z: number) { const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d')!; ctx.fillStyle = '#ece4cd'; ctx.beginPath(); ctx.arc(128, 128, 125, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#354d50'; ctx.lineWidth = 6; ctx.stroke(); for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(128 + Math.sin(a) * 101, 128 + Math.cos(a) * 101);
        ctx.lineTo(128 + Math.sin(a) * 114, 128 + Math.cos(a) * 114);
        ctx.stroke();
    } ctx.beginPath(); ctx.moveTo(94, 74); ctx.lineTo(128, 128); ctx.lineTo(188, 112); ctx.stroke(); const tex = new T.CanvasTexture(c); const mesh = new T.Mesh(new T.PlaneGeometry(3, 3), new T.MeshBasicMaterial({ map: tex, transparent: true })); mesh.position.set(x, y, z); this.scene.add(mesh); }
    flushParts() { for (const [m, gs] of this.parts) {
        const mesh = new T.Mesh(mergeGeometries(gs), m);
        mesh.castShadow = mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.solids.push(mesh);
        gs.forEach(g => g.dispose());
    } this.parts.clear(); }
    override buildNav() { this.nav = []; this.links = []; const grid = new Map<string, number>(); for (let z = -34; z <= 34; z += 2)
        for (let x = -30; x <= 30; x += 2)
            if (!this.blocked(x, z, .6)) {
                grid.set(x + ',' + z, this.nav.length);
                this.nav.push(new T.Vector3(x, this.groundAt(x, z), z));
            } this.links = this.nav.map(p => { const list: number[] = []; for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2], [2, -2], [-2, 2]]) {
        const i = grid.get((p.x + dx) + ',' + (p.z + dz));
        if (i !== undefined && Math.abs(this.nav[i].y - p.y) < .8 && this.clear(p, this.nav[i], .5))
            list.push(i);
    } return list; }); }
}
