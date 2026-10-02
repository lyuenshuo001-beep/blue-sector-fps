import * as T from 'three';
import { BlueRoomMap } from './BlueRoomMap';
import { Player } from '../player/Player';
import { WeaponManager } from '../weapons/WeaponManager';
export class Pickups {
    items: {
        mesh: T.Group;
        type: 'health' | 'ammo';
        active: boolean;
        timer: number;
    }[] = [];
    elapsed = 0;
    constructor(scene: T.Scene, readonly map: BlueRoomMap) {
        for (let i = 0; i < 8; i++) {
            const type = i % 2 ? 'ammo' : 'health', mesh = new T.Group(), color = type === 'health' ? 0x77ffd1 : 0xffc277;
            const base = new T.Mesh(new T.BoxGeometry(.6, .36, .5), new T.MeshStandardMaterial({ color: 0x223b47 }));
            mesh.add(base);
            const mat = new T.MeshBasicMaterial({ color });
            const a = new T.Mesh(new T.BoxGeometry(.35, .045, .07), mat);
            a.position.y = .19;
            mesh.add(a);
            const b = new T.Mesh(new T.BoxGeometry(.07, .045, .35), mat);
            b.position.y = .2;
            mesh.add(b);
            const ring = new T.Mesh(new T.TorusGeometry(.48, .025, 4, 16), mat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = -.24;
            mesh.add(ring);
            scene.add(mesh);
            this.items.push({ mesh, type, active: false, timer: 0 });
        }
        this.reset();
    }
    reset() { this.elapsed = 0; this.items.forEach((item, i) => { item.active = true; item.timer = 0; const spots = [[-8, 20], [8, 20], [-18, 9], [18, 9], [-8, -12], [8, -12], [-18, -27], [18, -27]]; let x=spots[i][0],z=spots[i][1];if(this.map.blocked(x,z,.7)){const n=this.map.nav[(i*89)%this.map.nav.length];x=n.x;z=n.z;}item.mesh.position.set(x,this.map.groundAt(x,z)+.6,z); item.mesh.visible = true; }); }
    update(dt: number, player: Player, weapons: WeaponManager, notify: (s: string) => void) {
        this.elapsed += dt;
        for (const item of this.items) {
            if (!item.active) {
                item.timer -= dt;
                if (item.timer <= 0) {
                    const p = this.map.nav[Math.floor(Math.random() * this.map.nav.length)];
                    item.mesh.position.set(p.x, .6, p.z);
                    item.active = true;
                    item.mesh.visible = true;
                }
                continue;
            }
            item.mesh.position.y = this.map.groundAt(item.mesh.position.x,item.mesh.position.z)+.55 + Math.sin(this.elapsed * 2) * .08;
            item.mesh.rotation.y += dt * .6;
            if (item.mesh.position.distanceTo(player.position) < 1.4) {
                if (item.type === 'health' && player.hp >= 100)
                    continue;
                if (item.type === 'health') {
                    player.hp = Math.min(100, player.hp + 35);
                    notify('HEALTH +35');
                }
                else {
                    weapons.weapons.forEach(w => w.reserve = Math.min(w.spec.reserve * 3, w.reserve + w.spec.magazine * 2));
                    notify('AMMO RESUPPLIED');
                }
                item.active = false;
                item.mesh.visible = false;
                item.timer = 22 + Math.random() * 12;
            }
        }
    }
}
