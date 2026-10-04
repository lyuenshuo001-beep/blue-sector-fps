import * as T from 'three';
import type { Companion } from './Companion';
import { EnemyManager } from '../enemy/EnemyManager';
import { Enemy } from '../enemy/Enemy';
import { Zombie } from './Zombie';
import { ZombieKind } from './InfectedAssets';
import { BlueRoomMap } from '../world/BlueRoomMap';
import { AudioManager } from '../audio/AudioManager';
import { Player } from '../player/Player';
import { InfectionFX } from './InfectionFX';
export class ZombiePool extends EnemyManager {
    companion:Companion|null=null;
    nearBudget = 8;
    detailTick = 0;
    baseCap = 30;
    slowFrames = 0;
    groanAt = 5;
    elapsed = 0;
    nextHorde = 35;
    warning = false;
    pressure = 0;
    specialKills = 0;
    pinned: Zombie | null = null;
    pinTime = 0;
    escapeTaps = 0;
    immunity = 0;
    spawnIndex = 0;
    pathBudget = 0;
    ammoRatio = 1;
    low = false;
    enabled = false;
    hurtEnemy: (e: Enemy, n: number) => void = () => { };
    notify: (s: string) => void = () => { };
    visionBoxes: T.Box3[] = [];
    visionRay = new T.Ray();
    visionDirection = new T.Vector3();
    visionHit = new T.Vector3();
    fx: InfectionFX;
    constructor(scene: T.Scene, map: BlueRoomMap, audio: AudioManager) { super(scene, map, audio, 48, i => new Zombie(i, scene, i<5?'spitter':i<10?'bomber':i<15?'pouncer':i<18?'brute':i<23?'runner':i<25?'screamer':i<27?'stalker':i===47?'titan':'infected')); this.fx = new InfectionFX(scene, map.solids, (x, z) => map.groundAt(x, z), audio); this.maxActive = 30; this.refreshVision(); }
    refreshVision(){this.visionBoxes=this.map.obstacles.map(o=>new T.Box3(new T.Vector3(o.x-o.w/2,-12,o.z-o.d/2),new T.Vector3(o.x+o.w/2,o.h,o.z+o.d/2)));}
    // AI uses navigation collision volumes; player shots retain exact mesh raycasts.
    visible(a: T.Vector3, b: T.Vector3) { this.visionDirection.subVectors(b, a); const length = this.visionDirection.length(); this.visionRay.set(a, this.visionDirection.normalize()); for (const box of this.visionBoxes) {
        const hit = this.visionRay.intersectBox(box, this.visionHit);
        if (hit && hit.distanceToSquared(a) < length * length - .01)
            return false;
    } return true; }
    adapt(frame: number) { this.slowFrames = frame > .034 ? this.slowFrames + Math.min(.1, frame) : Math.max(0, this.slowFrames - frame * .4); if (this.slowFrames > 6) {
        this.maxActive = Math.max(12, this.maxActive - 4);
        this.slowFrames = 0;
    } }
    get zombies() { return this.pool as Zombie[]; }
    reset() { this.zombies.forEach(z => z.clear()); this.wave = 1; this.remaining = 18; this.kills = 0; this.specialKills = 0; this.elapsed = 0; this.slowFrames = 0; this.groanAt = 5; this.maxActive = this.baseCap; this.nextHorde = 35; this.warning = false; this.spawnTimer = 1.5; this.pressure = 0; this.spawnIndex = 0; this.pinned = null; this.pinTime = 0; this.escapeTaps = 0; this.immunity = 0; this.fx.reset(); }
    clear() { this.zombies.forEach(z => z.clear()); this.fx.reset(); this.pinned = null; }
    spawnKind(kind: ZombieKind, p: T.Vector3) { const z = this.zombies.find(z => z.kind === kind && !z.active && z.corpse <= 0); if (!z)
        return null; z.spawn(p, this.wave); return z; }
    spawn(camera: T.PerspectiveCamera) {
        // Along-route ambushes sample reachable navigation space, rather than relying only on fixed sockets.
        const roaming: T.Vector3[] = [];
        for(let i=0;i<40;i++){const p=this.map.nav[Math.floor(Math.random()*this.map.nav.length)];if(p&&p.distanceTo(camera.position)>14&&p.distanceTo(camera.position)<35)roaming.push(p);}
        const gates=(this.map as BlueRoomMap & {gates?:{open:boolean;obstacle:{z:number}}[]}).gates||[];
        const candidate = [...this.map.spawns,...roaming].filter(p => p.distanceTo(camera.position) > 12 && p.distanceTo(camera.position)<48 && !gates.some(g=>!g.open&&(p.z-g.obstacle.z)*(camera.position.z-g.obstacle.z)<0) && !this.active.some(z => z.root.position.distanceTo(p) < 1.5)).sort((a, b) => a.distanceToSquared(camera.position) - b.distanceToSquared(camera.position));
        const safe = candidate.filter(p => { const v = p.clone().add(new T.Vector3(0, 1.6, 0)), q = v.clone().project(camera); return Math.abs(q.x) > 1.15 || q.z > 1 || q.z < -1 || !this.visible(camera.position, v); });
        if (!safe.length)
            return false;
        const sequence: ZombieKind[] = ['infected','runner','bomber','infected','spitter','brute','pouncer','infected','stalker','screamer','runner','infected'];
        let kind = sequence[this.spawnIndex % sequence.length];
        if (this.pressure < .3 && this.spawnIndex % 2 === 0)
            kind = 'infected';
        const z = this.spawnKind(kind, safe[Math.floor(Math.random()*Math.min(6,safe.length))]) || this.spawnKind('infected', safe[0]) || this.spawnKind('spitter', safe[0]) || this.spawnKind('bomber', safe[0]) || this.spawnKind('pouncer', safe[0]);
        if (!z)
            return false;
        this.spawnIndex++;
        return true;
    }
    detonate(z: Zombie, player: T.Vector3) { if (z.detonated)
        return; z.detonated = true; const at = z.root.position.clone().add(new T.Vector3(0, .8, 0)); this.fx.explosion(at, player, this.low); for (const other of this.zombies) {
        if (other === z || !other.active)
            continue;
        const d = other.root.position.distanceTo(z.root.position);
        if (d < 6 && this.visible(at, other.root.position.clone().add(new T.Vector3(0, 1, 0))))
            this.hurtEnemy(other, 170 * (1 - d / 7));
    } }
    onDeath(enemy: Enemy, player: T.Vector3) { const z = enemy as Zombie; if (z.kind !== 'infected')
        this.specialKills++; if (z === this.pinned)
        this.release(); if (z.kind === 'bomber')
        this.detonate(z, player); this.fx.burst(z.root.position.clone().add(new T.Vector3(0, 1.25, 0)), 0x864343, this.low ? 2 : 6); }
    struggle() { if (!this.pinned)
        return; this.escapeTaps++; this.fx.shake = .35; if (this.escapeTaps >= 5) {
        const z = this.pinned;
        this.release();
        z.slow = 3;
        this.hurtEnemy(z, 35);
        this.notify('挣脱成功 · 立即转移！');
    } }
    release() { this.pinned = null; this.pinTime = 0; this.escapeTaps = 0; this.immunity = 5; }
    update(dt: number, player: Player, camera: T.PerspectiveCamera, onDamage: (n: number) => void, onWave: (n: number) => void) {
        if (!this.enabled)
            return;
        this.elapsed += dt;
        this.immunity = Math.max(0, this.immunity - dt);
        this.pathBudget = 2;
        this.detailTick -= dt;
        if (this.detailTick <= 0) {
            this.detailTick = .2;
            const nearest = this.active.sort((a, b) => a.root.position.distanceToSquared(camera.position) - b.root.position.distanceToSquared(camera.position));
            this.zombies.forEach(z => z.detailAllowed = false);
            nearest.slice(0, this.nearBudget).forEach(z => (z as Zombie).detailAllowed = true);
        }
        if (this.elapsed > this.groanAt) {
            this.groanAt = this.elapsed + 6 + Math.random() * 5;
            this.audio.creature('groan');
        }
        this.pressure = T.MathUtils.clamp((player.hp / 100) * .65 + this.ammoRatio * .35, 0, 1);
        if (this.elapsed > this.nextHorde - 4 && !this.warning) {
            this.warning = true;
            this.notify('WARNING / HORDE INCOMING · 尸潮来袭');
            this.audio.creature('alarm');
        }
        if (this.elapsed >= this.nextHorde) {
            this.wave++;
            this.remaining += 18 + Math.min(24, this.wave * 3);
            this.nextHorde = this.elapsed + 45;
            this.warning = false;
            onWave(this.wave);
        }
        // Adapt only future spawns; never remove visible enemies to meet a lower cap.
        const target = Math.max(10, Math.floor(this.maxActive * (player.hp < 25 ? .65 : 1)));
        this.spawnTimer -= dt;
        if (this.remaining > 0 && this.active.length < target && this.spawnTimer <= 0) {
            if (this.spawn(camera))
                this.remaining--;
            this.spawnTimer = player.hp < 25 ? 1.4 : .34;
        }
        if (this.pinned) {
            this.pinTime += dt;
            if (!this.pinned.active || this.pinTime > 4)
                this.release();
            else {
                onDamage(dt * 7);
                this.fx.shake = Math.max(this.fx.shake, .25);
            }
        }
        for (const z of this.zombies) {
            if(z.active && z.kind !== 'titan' && z.root.position.distanceTo(player.position)>75){z.clear();continue;}
            if(!z.active&&z.corpse>0)z.root.position.y=Math.max(this.map.groundAt(z.root.position.x,z.root.position.z),z.root.position.y-dt*3);
            z.animate(dt, camera);
            if (!z.active)
                continue;
            z.age += dt;
            z.attack -= dt;
            z.think -= dt;
            z.slow = Math.max(0, z.slow - dt);
            z.reveal = Math.max(0, z.reveal - dt);
            z.specialCooldown -= dt;
            const ally=this.companion;const target=ally?.enabled&&ally.state==='following'&&!['pouncer','brute','titan','spitter','bomber'].includes(z.kind)&&z.root.position.distanceTo(ally.position)<z.root.position.distanceTo(player.position)*.85?ally:null;
            const targetPosition=target?target.position:player.position;
            const targetEye=targetPosition.clone().add(new T.Vector3(0,1.5,0));
            const p = z.root.position, delta = targetPosition.clone().sub(p), dist = delta.length(), eye = p.clone().add(new T.Vector3(0, 1.4, 0));
            z.root.rotation.y = Math.atan2(delta.x, delta.z);
            if (z === this.pinned)
                continue;
            if(z.charge>0){z.charge-=dt;const start=p.clone();for(let k=0;k<4;k++)this.map.move(p,z.leapDirection.x*12*dt/4,z.leapDirection.z*12*dt/4,.8);p.y=this.map.groundAt(p.x,p.z);if(start.distanceTo(p)<dt*2)z.charge=0;if(dist<2.2&&sightForCharge()){onDamage(24);this.map.move(player.position,z.leapDirection.x*2,z.leapDirection.z*2);z.charge=0;this.fx.shake=.6;}continue;}
            function sightForCharge(){return Math.abs(p.y-player.position.y)<2;}
            if (z.leap > 0) {
                const travel = Math.min(dt, z.leap);
                p.y=this.map.groundAt(p.x,p.z);
                z.leap -= dt;
                const steps = Math.ceil(travel * 15 / .25);
                for (let i = 0; i < steps; i++)
                    this.map.move(p, z.leapDirection.x * 15 * travel / steps, z.leapDirection.z * 15 * travel / steps, .34);
                p.y=this.map.groundAt(p.x,p.z)+Math.sin(Math.max(0,z.leap)/.55*Math.PI)*.9;
                if (dist < 1.35 && Math.abs(p.y - player.position.y) < 1 && this.immunity === 0 && !this.pinned) {
                    this.pinned = z;
                    this.pinTime = 0;
                    this.escapeTaps = 0;
                    z.leap = 0;
                    p.y=this.map.groundAt(p.x,p.z);
                    this.notify('被扑倒！连续点击挣脱 / F / SPACE');
                    this.audio.creature('pounce');
                }
                if (z.leap <= 0)
                    p.y=this.map.groundAt(p.x,p.z);
                continue;
            }
            if (z.windup > 0) {
                z.windup -= dt;
                if (z.windup <= 0) {
                    if (z.kind === 'titan' || z.kind === 'brute') {
                        if (z.strike === 'slam') {
                            this.fx.explosion(p.clone(), player.position, this.low);
                            if (dist < 4.5 && this.visible(eye, camera.position)) {
                                onDamage(z.kind === 'titan' ? 32 : 20);
                                const away = player.position.clone().sub(p).setY(0).normalize();
                                this.map.move(player.position, away.x * 2.5, away.z * 2.5);
                            }
                        } else {
                            z.charge = .85;
                            this.audio.creature('explode');
                        }
                        z.specialCooldown = 7;
                    } else if (z.kind === 'spitter') {
                        this.fx.spit(eye, player.position.clone());
                        z.specialCooldown = 5;
                    }
                    else if (z.kind === 'bomber') {
                        if (dist < 4.5 && this.visible(eye, camera.position))
                            onDamage(38 * (1 - dist / 6));
                        z.die();
                        this.detonate(z, player.position);
                    }
                    else if (z.kind === 'pouncer') {
                        z.leapDirection.copy(delta).setY(0).normalize();
                        z.leap = .55;
                        z.specialCooldown = 6;
                    }
                }
                continue;
            }
            if (z.age >= z.nextSight) {
                z.sight = dist < 22 && this.visible(eye, targetEye);
                z.nextSight = z.age + (dist < 18 ? .12 : .4);
            }
            if(['runner','stalker','brute','titan'].includes(z.kind)&&dist<28&&z.age>z.voiceAt){this.audio.creature(z.kind as 'runner'|'stalker'|'brute'|'titan',Math.max(.15,1-dist/30));z.voiceAt=z.age+(z.kind==='titan'?2:6);}
            const sight = z.sight;
            if(z.kind==='stalker'&&dist>9&&!z.called){z.state='IDLE';continue;}if(z.kind==='stalker'&&dist<9){z.called=true;z.speed=5;}
            if(z.kind==='screamer'&&sight&&!z.called){z.called=true;this.remaining+=12;this.audio.creature('screamer');this.notify('尖啸者呼叫尸潮！');for(const n of this.zombies)if(n.active&&n.root.position.distanceTo(p)<12)n.speed*=1.2;}
            if((z.kind==='brute'||z.kind==='titan')&&dist<18&&sight&&z.specialCooldown<=0){z.strike=dist<5?'slam':'charge';z.leapDirection.copy(delta).setY(0).normalize();z.windup=z.kind==='titan'?1.4:1.1;z.state='ATTACK';this.audio.creature('groan');this.notify(z.kind==='titan'?'TITAN 蓄力！侧向躲避冲撞 / 离开砸地区域':'重型感染者蓄力！拉开距离');this.fx.burst(p.clone().add(new T.Vector3(0,.1,0)),0xff6b48,8);continue;}

            if (z.kind === 'spitter' && dist > 4 && dist < 19 && sight && z.specialCooldown <= 0) {
                z.windup = .75;
                z.state = 'ATTACK';
                this.audio.creature('spit');
                continue;
            }
            if (z.kind === 'bomber' && dist < 2.8 && sight) {
                z.windup = 1.1;
                z.state = 'ATTACK';
                this.notify('爆裂者正在膨胀 · 拉开距离！');
                this.audio.creature('fuse');
                continue;
            }
            if (z.kind === 'pouncer' && dist > 3 && dist < 10 && sight && z.specialCooldown <= 0) {
                z.windup = .65;
                z.state = 'ATTACK';
                this.audio.creature('pounce');
                continue;
            }
            if (dist < 1.55 && Math.abs(p.y - player.position.y) < 1.2 && sight) {
                z.state = 'ATTACK';
                if (z.attack <= 0) {
                    if(target)target.damage(z.kind==='infected'?7:10);else onDamage(z.kind==='titan'?22:z.kind==='brute'?15:z.kind === 'infected' ? 7 : 10);
                    z.attack = 1.2;
                    this.audio.creature('bite');
                }
                continue;
            }
            if (z.kind === 'spitter' && dist < 12 && dist > 6 && sight) {
                z.state = 'IDLE';
                continue;
            }
            z.state = 'CHASE';
            if (z.think <= 0 && this.pathBudget > 0) {
                z.path = this.map.path(p, targetPosition);
                z.think = dist < 18 ? .5 : 1.1;
                this.pathBudget--;
            }
            const t = z.path[0];
            if (t) {
                const dx = t.x - p.x, dz = t.z - p.z, l = Math.hypot(dx, dz);
                if (l < .45)
                    z.path.shift();
                else {
                    const speed = z.speed * (z.slow > 0 ? .3 : 1);
                    let mx = dx / l * speed * dt, mz = dz / l * speed * dt;
                    for (const o of this.zombies) {
                        if (o === z || !o.active)
                            continue;
                        const ox = p.x - o.root.position.x, oz = p.z - o.root.position.z, d2 = ox * ox + oz * oz;
                        if (d2 > .001 && d2 < .7) {
                            mx += ox / d2 * dt * .18;
                            mz += oz / d2 * dt * .18;
                        }
                    }
                    this.map.move(p, mx, mz, .34);
                    p.y = this.map.groundAt(p.x, p.z);
                }
            }
        }
        this.fx.update(dt, player.position, onDamage);
    }
}
