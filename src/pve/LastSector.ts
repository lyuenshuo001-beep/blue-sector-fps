import * as T from 'three';
import { SkywardMap } from '../world/SkywardMap';
import { Player } from '../player/Player';
export type GameMode = 'survival' | 'last-sector';
// Playable first district. The larger Quarantine Zone expansion is a later phase.
export class LastSector {
    stage = 0;
    progress = 0;
    complete = false;
    interact = false;
    group = new T.Group();
    markers: T.Mesh[] = [];
    readonly stops = [{ title: '启动街区电源', pos: new T.Vector3(-23, 0, 9), seconds: 3 }, { title: '进入维修室取回感染样本', pos: new T.Vector3(23, 0, -4), seconds: 3 }, { title: '守住上传终端', pos: new T.Vector3(-23, 0, -20), seconds: 20 }, { title: '返回安全屋并坚守撤离', pos: new T.Vector3(0, 0, 27), seconds: 60 }];
    constructor(scene: T.Scene, readonly map: SkywardMap) {
        scene.add(this.group);
        this.stops.forEach(s => { if (map.blocked(s.pos.x, s.pos.z, .6)) {
            const nearby = [...map.nav].sort((a, b) => a.distanceToSquared(s.pos) - b.distanceToSquared(s.pos))[0];
            s.pos.copy(nearby);
        } });
        const colors = [0x6bd6ff, 0xb3e07c, 0xffb86c, 0x8ef4c8];
        this.stops.forEach((s, i) => { const marker = new T.Mesh(new T.OctahedronGeometry(.4), new T.MeshBasicMaterial({ color: colors[i] })); marker.position.copy(s.pos); marker.position.y = 2.7; this.group.add(marker); this.markers.push(marker); const base = new T.Mesh(new T.CylinderGeometry(.55, .7, 1.1, 8), new T.MeshStandardMaterial({ color: 0x35454b, metalness: .5, roughness: .5 })); base.position.copy(s.pos); base.position.y = .55; this.group.add(base); });
        const posts = new T.InstancedMesh(new T.ConeGeometry(.19, .65, 8), new T.MeshStandardMaterial({ color: 0xaf6d30, roughness: .9 }), 20);
        const matrix = new T.Matrix4();
        for (let i = 0; i < 20; i++) {
            matrix.makeTranslation((i % 2 ? -1 : 1) * (4 + (i % 4) * .45), .325, 23 - Math.floor(i / 2) * .8);
            posts.setMatrixAt(i, matrix);
        }
        this.group.add(posts);
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 256;
        const x = c.getContext('2d')!;
        x.fillStyle = '#232b29';
        x.fillRect(0, 0, 512, 256);
        x.strokeStyle = '#c9ad60';
        x.lineWidth = 12;
        x.strokeRect(9, 9, 494, 238);
        x.fillStyle = '#d3bb77';
        x.font = 'bold 50px sans-serif';
        x.textAlign = 'center';
        x.fillText('QUARANTINE', 256, 95);
        x.font = '24px sans-serif';
        x.fillText('LAST SECTOR / 感染隔离前哨', 256, 160);
        x.fillText('NO CIVILIAN ACCESS', 256, 210);
        const texture = new T.CanvasTexture(c);
        texture.colorSpace = T.SRGBColorSpace;
        for (const side of [-1, 1]) {
            const sign = new T.Mesh(new T.PlaneGeometry(3.5, 1.75), new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide }));
            sign.position.set(side * 6.85, 2.8, 23);
            sign.rotation.y = -side * Math.PI / 2;
            this.group.add(sign);
        }
        this.group.visible = false;
    }
    reset() { this.stage = 0; this.progress = 0; this.complete = false; this.interact = false; this.group.visible = true; }
    update(dt: number, player: Player, notify: (s: string) => void) {
        const target = this.stops[this.stage];
        if (!target || this.complete)
            return;
        const distance = target.pos.distanceTo(player.position), near = distance < 3.2;
        this.markers.forEach((m, i) => { m.visible = i === this.stage; m.rotation.y += dt; m.position.y = 2.7 + Math.sin(performance.now() * .003) * .15; });
        if (near && (this.stage >= 2 || this.interact)) {
            this.progress += dt;
            if (this.progress >= target.seconds) {
                this.stage++;
                this.progress = 0;
                this.interact = false;
                if (this.stage === 4) {
                    this.complete = true;
                    notify('MISSION COMPLETE / 撤离成功');
                }
                else
                    notify(this.stage === 3 ? 'EXTRACTION AVAILABLE / 前往撤离点' : '任务完成 · ' + this.stops[this.stage].title);
            }
        }
        else if (this.stage < 2)
            this.progress = 0;
        const el = document.getElementById('pve-objective')!;
        const dx = target.pos.x - player.position.x, dz = target.pos.z - player.position.z, angle = Math.atan2(dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw), -dx * Math.sin(player.yaw) - dz * Math.cos(player.yaw));
        const arrow = Math.abs(angle) < .35 ? '↑' : Math.abs(angle) > 2.7 ? '↓' : angle > 0 ? '→' : '←';
        el.textContent = arrow + ' ' + target.title + ' · ' + Math.ceil(distance) + 'm' + (this.progress > 0 ? ' · ' + Math.ceil(Math.max(0, target.seconds - this.progress)) + 's' : '');
        const b = document.getElementById('interact')!;
        b.classList.toggle('hidden', !near || this.stage >= 2);
        b.textContent = this.interact ? '正在操作…' : '按住交互 / F';
    }
}
