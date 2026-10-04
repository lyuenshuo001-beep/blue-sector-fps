import { Radio } from '../audio/Radio';
import { Companion } from '../pve/Companion';
import { HUDLayout } from '../ui/HUDLayout';
import { CampaignMap } from '../world/CampaignMap';
import { ZombiePool } from '../pve/ZombiePool';
import { LastSector, GameMode } from '../pve/LastSector';
import { Skills } from '../player/Skills';
import { Profile } from './Profile';
import { Lobby } from '../ui/Lobby';
import * as T from 'three';
import { Renderer, Quality } from './Renderer';
import { InputManager } from './InputManager';
import { Player } from '../player/Player';
import { SkywardMap } from '../world/SkywardMap';
import { WeaponManager } from '../weapons/WeaponManager';
import { EnemyManager } from '../enemy/EnemyManager';
import { Enemy } from '../enemy/Enemy';
import { AudioManager } from '../audio/AudioManager';
import { HUD, $ } from '../ui/HUD';
import { Pickups } from '../world/Pickups';
import { HitEffect } from '../effects/HitEffect';
export class Game {
    hud = new HUD();
    renderer = new Renderer();
    map = new SkywardMap(this.renderer.scene);
    classicObjects = this.renderer.scene.children.filter(o => !(o instanceof T.Light) && o !== this.renderer.camera);
    classicMap = this.map;
    campaignScene = new T.Scene();
    campaign = new CampaignMap(this.campaignScene);
    input = new InputManager(this.renderer.gl.domElement);
    audio = new AudioManager();
    radio=new Radio(this.audio);
    combo=0;lastKill=0;calloutAt=0;ambienceAt=0;
    emergencyLight=new T.PointLight(0xff6247,0,18,2);
    player = new Player();
    weapons = new WeaponManager(this.renderer.camera, this.audio);
    legacyEnemies = new EnemyManager(this.renderer.scene, this.map, this.audio);
    zombies = new ZombiePool(this.renderer.scene, this.campaign, this.audio);
    enemies: EnemyManager = this.legacyEnemies;
    operation = new LastSector(this.renderer.scene, this.campaign);
    buddy = new Companion(this.renderer.scene,this.campaign);
    hudLayout = new HUDLayout();
    crosshairGap=5;
    mode: GameMode = 'survival';
    normalBackground: T.Scene['background'] = this.renderer.scene.background;
    pickups = new Pickups(this.renderer.scene, this.map);
    effects = new HitEffect(this.renderer.scene);
    skills = new Skills(this.renderer.scene, this.player, this.enemies, this.map, this.audio, (e, d) => this.hitEnemy(e, d), s => this.hud.toast(s), (p, color) => this.effects.emit(p, this.renderer.quality === 'LOW' ? 4 : 10, color));
    profile = new Profile();
    lobby = new Lobby(this.profile, this.renderer, () => this.start());
    headshots = 0;
    settled = false;
    state: 'menu' | 'playing' | 'paused' | 'over' = 'menu';
    elapsed = 0;
    last = 0;
    step = 0;
    fps = 60;
    ray = new T.Raycaster();
    frameCount = 0;
    lastHud = 0;
    settingsFrom = 'menu';
    constructor() {
        this.renderer.camera.position.set(9, 3, 15);
        this.renderer.camera.lookAt(-3, 1, -8);
        this.zombies.hurtEnemy = (e, n) => this.hitEnemy(e, n);
        this.zombies.notify = s => this.hud.toast(s);
        this.renderer.camera.add(this.emergencyLight);this.emergencyLight.position.set(0,1,-2);this.renderer.scene.add(this.campaignScene); this.campaignScene.visible=false;
        this.buddy.say=(s,key)=>{this.hud.toast(s);this.radio.say(key||'contact',s,2);};
        this.operation.onStage=stage=>{this.zombies.refreshVision();const dark=stage===7;this.emergencyLight.intensity=dark?18:0;this.renderer.sun.intensity=dark?.15:stage>=5?1.4:1.05;this.renderer.scene.children.forEach(o=>{if(o instanceof T.HemisphereLight)o.intensity=dark?.55:2.5;});this.radio.say('objective'+stage,this.operation.stops[stage].radio,3);this.zombies.remaining+=stage===5||stage===9?30:5;if(stage===8)this.zombies.spawnKind('titan',new T.Vector3(-12,0,-230));};
        this.skills.explosion=p=>this.zombies.fx.explosion(p,this.player.position,this.renderer.quality==='LOW');this.zombies.companion=this.buddy;this.skills.say=(key,text)=>this.radio.say(key,text);
        this.bind();
        this.loadSettings();
        this.renderer.gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); this.pause(); this.hud.toast('图形上下文中断，请刷新页面。'); });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden)
                this.pause();
        });
        addEventListener('blur', () => this.pause());
        addEventListener('resize', () => {
            if (this.renderer.mobile && innerHeight > innerWidth)
                this.pause();
        });
        requestAnimationFrame(t => this.loop(t));
    }
    bind() {
        $('pause-restart').onclick=()=>this.start();
        $('pause-lobby').onclick=()=>{$('leave-confirm').classList.remove('hidden');};
        $('leave-cancel').onclick=()=>$('leave-confirm').classList.add('hidden');
        $('leave-yes').onclick=()=>this.returnLobby();
        const revive=$('revive');revive.onpointerdown=e=>{e.preventDefault();revive.setPointerCapture(e.pointerId);this.buddy.holding=true;};revive.onpointerup=revive.onpointercancel=()=>this.buddy.holding=false;
        document.querySelector('#volume')!.parentElement!.insertAdjacentHTML('afterend','<label>VOICE / 语音<input id="voice-volume" type="range" min="0" max="1" step=".05" value=".75"></label><label>SFX / 枪声音效<input id="sfx-volume" type="range" min="0" max="1" step=".05" value="1"></label>');
        $<HTMLInputElement>('voice-volume').oninput=e=>{this.audio.voiceVolume=Number((e.target as HTMLInputElement).value);this.radio.volume();this.saveSettings();};
        $<HTMLInputElement>('sfx-volume').oninput=e=>{this.audio.sfxVolume=Number((e.target as HTMLInputElement).value);this.saveSettings();};
        $('play').onclick = () => this.lobby.openDeploy();
        $('restart').onclick = () => this.start();
        $('resume').onclick = () => this.resume();
        $('pause-button').onclick = () => this.pause();
        $('back-menu').onclick = () => this.returnLobby();
        $('settings-open').onclick = () => this.settings('menu');
        $('pause-settings').onclick = () => this.settings('pause');
        $('settings-close').onclick = () => { $('settings').classList.add('hidden'); $(this.settingsFrom).classList.remove('hidden'); this.audio.play('ui'); };
        $<HTMLSelectElement>('quality').onchange = e => { this.renderer.setQuality((e.target as HTMLSelectElement).value as Quality); this.setEnemyBudget(); this.saveSettings(); };
        $<HTMLInputElement>('sensitivity').oninput = e => { this.input.sensitivity = Number((e.target as HTMLInputElement).value); this.saveSettings(); };
        $<HTMLInputElement>('volume').oninput = e => { this.audio.volume = Number((e.target as HTMLInputElement).value);this.radio.volume(); this.saveSettings(); };
        if (/MicroMessenger/i.test(navigator.userAgent))
            $('wechat').classList.remove('hidden');
        const interact = $('interact');
        interact.onpointerdown = e => { if (this.state !== 'playing')
            return; e.preventDefault(); interact.setPointerCapture(e.pointerId); this.operation.interact = true; };
        interact.onpointerup = interact.onpointercancel = () => this.operation.interact = false;
        $('struggle').onpointerdown = e => { if (this.state === 'playing') {
            e.preventDefault();
            this.zombies.struggle();
        } };
        addEventListener('keydown', e => { if (this.state !== 'playing' || e.repeat)
            return; if (this.zombies.pinned && (e.code === 'KeyF' || e.code === 'Space')) {
            e.preventDefault();
            this.zombies.struggle();
        }
        else if (e.code === 'KeyF')
            { this.operation.interact = true;this.buddy.holding=true; } });
        addEventListener('keyup', e => { if (e.code === 'KeyF')
            { this.operation.interact = false;this.buddy.holding=false; } });
        $('dismiss-wechat').onclick = () => $('wechat').classList.add('hidden');
    }
    loadSettings() {
        try {
            const s = JSON.parse(localStorage.getItem('blue-sector-settings') || '{}');
            if (['LOW', 'MEDIUM', 'HIGH'].includes(s.quality)) {
                this.renderer.setQuality(s.quality);
                $<HTMLSelectElement>('quality').value = s.quality;
            }
            if (Number.isFinite(s.sensitivity))
                this.input.sensitivity = T.MathUtils.clamp(s.sensitivity, .35, 2);
            if (Number.isFinite(s.volume))
                this.audio.volume = T.MathUtils.clamp(s.volume, 0, 1);
            if(Number.isFinite(s.voice))this.audio.voiceVolume=T.MathUtils.clamp(s.voice,0,1);
            if(Number.isFinite(s.sfx))this.audio.sfxVolume=T.MathUtils.clamp(s.sfx,0,1);
            $<HTMLInputElement>('voice-volume').value=String(this.audio.voiceVolume);
            $<HTMLInputElement>('sfx-volume').value=String(this.audio.sfxVolume);
            $<HTMLInputElement>('sensitivity').value = String(this.input.sensitivity);
            $<HTMLInputElement>('volume').value = String(this.audio.volume);
        }
        catch { }
        this.setEnemyBudget();
    }
    setEnemyBudget() { this.legacyEnemies.maxActive = this.renderer.quality === 'LOW' ? 8 : 15; this.zombies.maxActive = this.zombies.baseCap = this.renderer.quality === 'LOW' ? 20 : this.renderer.quality === 'HIGH' ? 42 : 30; this.zombies.low = this.renderer.quality === 'LOW'; this.zombies.nearBudget = this.zombies.low ? 4 : this.renderer.quality === 'HIGH' ? 12 : 8; this.zombies.zombies.forEach(z => z.lod.levels[1].distance = this.zombies.low ? 9 : 18); }
    saveSettings() {
        try {
            localStorage.setItem('blue-sector-settings', JSON.stringify({ quality: this.renderer.quality, sensitivity: this.input.sensitivity, volume: this.audio.volume,voice:this.audio.voiceVolume,sfx:this.audio.sfxVolume }));
        }
        catch { }
    }
    settings(from: string) { this.settingsFrom = from; $(from).classList.add('hidden'); $('settings').classList.remove('hidden'); this.audio.play('ui'); }
    capture() {
        if (this.renderer.mobile) {
            document.documentElement.requestFullscreen?.().catch(() => { });
            const o = screen.orientation as ScreenOrientation & {
                lock?: (v: string) => Promise<void>;
            };
            o?.lock?.('landscape').catch(() => { });
        }
        else {
            try {
                const p = this.renderer.gl.domElement.requestPointerLock();
                if (p instanceof Promise)
                    p.catch(() => this.hud.toast('点击画面以锁定鼠标'));
            }
            catch {
                this.hud.toast('点击画面以锁定鼠标');
            }
        }
    }
    start() {
        this.audio.indoor=false;
        this.emergencyLight.intensity=0;this.renderer.scene.children.forEach(o=>{if(o instanceof T.HemisphereLight)o.intensity=2.5;});this.radio.stop();this.audio.init();this.combo=0;this.lastKill=0;this.calloutAt=8;this.ambienceAt=7;
        this.mode = this.lobby.mode;
        this.map=this.mode==='last-sector'?this.campaign:this.classicMap;
        this.campaignScene.visible=this.mode==='last-sector';this.classicObjects.forEach(o=>o.visible=this.mode!=='last-sector');this.skills.map=this.map;this.pickups.map=this.map;
        this.legacyEnemies.reset();
        this.zombies.clear();
        this.zombies.enabled = this.mode === 'last-sector';
        this.enemies = this.zombies.enabled ? this.zombies : this.legacyEnemies;
        this.skills.enemies = this.enemies;
        this.operation.group.visible = this.zombies.enabled;
        if (this.zombies.enabled)
            this.operation.reset();
        this.setEnemyBudget();
        $('pve-objective').classList.toggle('hidden', !this.zombies.enabled);
        $('buddy-status').classList.toggle('hidden',!this.zombies.enabled);$('route-marker').classList.toggle('hidden',!this.zombies.enabled);
        $('struggle').classList.add('hidden');
        $('interact').classList.add('hidden');
        document.querySelector('.brand-small span')!.textContent = this.zombies.enabled ? '/ LAST SECTOR' : '/ SURVIVAL';
        this.renderer.scene.background = this.zombies.enabled ? new T.Color(0x7b8d90) : this.normalBackground;
        this.renderer.sun.intensity = this.zombies.enabled ? 1.05 : 2.1;
        this.renderer.gl.toneMappingExposure = this.zombies.enabled ? .92 : 1.25;
        this.renderer.scene.fog = new T.Fog(this.zombies.enabled ? 0x7b8d90 : 0xb4d7e4, this.zombies.enabled ? 22 : 55, this.zombies.enabled ? 85 : 150);
        this.audio.init();
        this.audio.play('ui');
        this.input.reset();
        this.input.crouch = false;
        this.input.pause = false;
        this.player.reset();this.buddy.enabled=this.zombies.enabled;this.buddy.reset(this.player.position,this.lobby.buddy);
        this.weapons.configureLoadout(this.profile);
        this.weapons.reset();
        this.headshots = 0;
        this.settled = false;
        this.skills.reset(this.profile.data.operator);
        this.enemies.reset();
        this.pickups.reset();
        this.effects.reset();
        this.elapsed = 0;
        this.step = 0;
        this.state = 'playing';
        this.input.enabled = true;
        ['menu', 'gameover', 'pause', 'settings'].forEach(id => $(id).classList.add('hidden'));
        $('hud').classList.remove('hidden');
        if (this.zombies.enabled) {
            this.weapons.weapons.forEach(w => w.reserve = w.spec.reserve * 2);
            this.hud.toast('LAST SECTOR · 向前推进，跟随路口导航' );
        }
        else
            this.hud.toast('SKYWARD / 悬空城 · Q E X 技能 · Shift 冲刺');
        this.capture();
    }
    returnLobby() {
        this.radio.stop();this.audio.stop();this.input.enabled=false;this.input.reset();this.input.pause=false;document.exitPointerLock?.();
        this.zombies.clear();this.zombies.enabled=false;this.legacyEnemies.reset();this.buddy.clear();this.operation.interact=false;this.operation.group.visible=false;
        this.skills.reset(this.profile.data.operator);this.effects.reset();this.pickups.items.forEach(i=>i.mesh.visible=false);this.weapons.root.visible=false;
        this.campaignScene.visible=false;this.classicObjects.forEach(o=>o.visible=true);this.map=this.classicMap;
        this.emergencyLight.intensity=0;this.renderer.scene.children.forEach(o=>{if(o instanceof T.HemisphereLight)o.intensity=2.5;});this.renderer.scene.background=this.normalBackground;this.renderer.scene.fog=new T.Fog(0xb4d7e4,55,150);this.renderer.sun.intensity=2.1;this.renderer.gl.toneMappingExposure=1.25;
        this.state='menu';['hud','pause','settings','gameover','leave-confirm','revive'].forEach(id=>$(id).classList.add('hidden'));this.lobby.show('home');$('menu').classList.remove('hidden');
    }
    pause() {
        if (this.state !== 'playing')
            return;
        this.radio.stop();this.audio.stop();this.state = 'paused';
        this.input.enabled = false;
        this.input.reset();
        this.buddy.holding = false;
        this.operation.interact = false;
        this.input.pause = false;
        document.exitPointerLock?.();
        $('pause').classList.remove('hidden');
    }
    resume() { this.audio.init(); this.state = 'playing'; this.input.enabled = true; this.input.pause = false; $('pause').classList.add('hidden'); this.capture(); }
    hitEnemy(enemy: Enemy, damage: number, head = false) {
        if (!enemy.active)
            return;
        enemy.hp -= damage;
        enemy.alert = 8;
        this.skills.mark(enemy);
        this.hud.hit(head);
        this.audio.play(head ? 'head' : 'hit');
        if (enemy.hp <= 0) {
            if(this.zombies.enabled&&(enemy as unknown as {kind:string}).kind==='titan'){this.operation.bossDone=true;this.radio.say('boss','大型感染体已清除。',3);}
            enemy.die();
            if (this.zombies.enabled)
                this.zombies.onDeath(enemy, this.player.position);
            this.combo=this.elapsed-this.lastKill<3?this.combo+1:1;this.lastKill=this.elapsed;if([2,3,6].includes(this.combo))this.radio.say(this.combo===2?'double':this.combo===3?'triple':'multi',this.combo===2?'DOUBLE KILL':this.combo===3?'TRIPLE KILL':'MULTI KILL');
            this.enemies.kills++;
            if (head)
                this.headshots++;
            this.skills.onKill();
            this.hud.toast('路一号 eliminated' + (head ? ' · HEADSHOT' : ''));
            this.audio.play('kill');
            if (this.zombies.enabled && this.enemies.kills % 3 === 0)
                this.hud.toast(this.enemies.kills % 9 === 0 ? 'MASSACRE / 尸群瓦解' : 'MULTI KILL / 连续击杀');
        }
    }
    shoot(spread: number) {
        const camera = this.renderer.camera;
        camera.updateMatrixWorld(true);
        this.renderer.scene.updateMatrixWorld(true);
        const w = this.weapons.current.spec;
        const targets = [...this.map.solids, ...this.enemies.active.flatMap(e => e.hitboxes)];
        let hitEnemy = false;
        for (let pellet = 0; pellet < w.pellets; pellet++) {
            this.ray.setFromCamera(new T.Vector2((Math.random() - .5) * spread, (Math.random() - .5) * spread), camera);
            this.ray.far = 110;
            const hit = this.ray.intersectObjects(targets, false)[0];
            if (!hit)
                continue;
            const enemy = hit.object.userData.enemy as Enemy | undefined, head = Boolean(hit.object.userData.head);
            this.effects.emit(hit.point, this.renderer.quality === 'LOW' ? 1 : 3, enemy ? 0xff9567 : 0xcceaff);
            if (enemy?.active) {
                hitEnemy = true;
                const falloff = hit.distance <= w.range ? 1 : Math.max(.25, 1 - (hit.distance - w.range) / (w.range * 1.5));
                this.hitEnemy(enemy, w.damage * falloff * (head ? w.headshot : hit.object.userData.weak ? 3.5 : 1), head);
                if (hit.object.userData.weak) {
                    $('hitmarker').textContent = '× CRITICAL';
                    $('hitmarker').className = 'headshot';
                }
            }
        }
        if (hitEnemy)
            this.weapons.hits++;
    }
    damage(n: number) {
        if (this.state !== 'playing')
            return;
        n *= this.skills.damageScale();
        const absorbed = Math.min(this.player.armor, n);
        this.player.armor -= absorbed;
        n -= absorbed;
        this.player.hp = Math.max(0, this.player.hp - n);
        this.hud.damage();
        this.renderer.camera.rotation.z = (Math.random() - .5) * .025;
        if (this.player.hp === 0)
            this.over();
    }
    over() {
        if (this.settled)
            return;
        this.audio.stop();this.radio.stop();if(this.operation.complete&&this.zombies.enabled)this.radio.say('complete','任务完成，我们回家。',3);this.settled = true;
        this.state = 'over';
        this.input.enabled = false;
        this.input.reset();
        document.exitPointerLock?.();
        $('gameover').classList.remove('hidden');
        $('struggle').classList.add('hidden');
        $('interact').classList.add('hidden');
        document.querySelector('#gameover h2')!.textContent = this.zombies.enabled && this.operation.complete ? 'MISSION COMPLETE' : 'GAME OVER';
        const time = Math.floor(this.elapsed), accuracy = this.weapons.shots ? Math.min(100, Math.round(this.weapons.hits / this.weapons.shots * 100)) : 0, earned = this.profile.award(this.enemies.kills, this.headshots, this.enemies.wave, time) + (this.zombies.enabled ? this.operation.stage * 100 + (this.operation.complete ? 500 : 0) : 0);
        if (this.zombies.enabled) {
            this.profile.data.credits += this.operation.stage * 100 + (this.operation.complete ? 500 : 0);
            this.profile.save();
        }
        $('results').innerHTML = [['KILLS', this.enemies.kills], ['HEADSHOTS', this.headshots], ['WAVE', this.enemies.wave], ['ACCURACY', accuracy + '%'], ['SURVIVAL', Math.floor(time / 60) + ':' + String(time % 60).padStart(2, '0')], ['CREDITS EARNED', '+' + earned]].map(([label, value]) => '<div><span>' + label + '</span><b>' + value + '</b></div>').join('');
    }
    updateHud() { const w = this.weapons.current; const boss=this.zombies.zombies.find(z=>z.active&&z.kind==='titan');$('boss-health').classList.toggle('hidden',!boss||!this.zombies.enabled);if(boss)$('boss-health').textContent='TITAN / 巨型感染者 · '+Math.ceil(boss.hp)+' HP'; $('scope').dataset.reticle = w.attachments.scope; $('crosshair').dataset.reticle = this.input.ads ? w.attachments.scope : 'hip'; document.querySelector('.sector-label')!.childNodes[1].textContent=this.zombies.enabled?' QUARANTINE ':' SKYWARD ';document.querySelector('.sector-label span')!.textContent = (this.zombies.enabled ? ' / 战役 · ' : ' / ') + this.map.zone(this.player.position); $('wave').textContent = String(this.enemies.wave).padStart(2, '0'); $('enemies').textContent = String(this.enemies.active.length + this.enemies.remaining); $('kills').textContent = String(this.enemies.kills); $('hp').textContent = String(Math.ceil(this.player.hp)); $('hp-bar').style.width = this.player.hp + '%'; $('hp-bar').style.background = this.player.hp < 30 ? '#ff795f' : '#88e8ff'; $('weapon').textContent = w.spec.id; $('weapon-type').textContent = w.spec.name; $('ammo').textContent = String(w.ammo); $('reserve').textContent = String(w.reserve); $('reload-status').textContent = this.weapons.reloadLeft > 0 ? 'RELOADING ' + this.weapons.reloadLeft.toFixed(1) + 's' : w.ammo === 0 ? 'RELOAD / R' : 'READY'; $('crosshair').style.setProperty('--gap', this.crosshairGap+'px'); $('scope').style.display = this.input.ads && ['2x', '4x', 'sniper'].includes(w.attachments.scope) ? 'block' : 'none'; document.querySelector('[data-action="ads"]')!.classList.toggle('active', this.input.ads); document.querySelector('[data-action="crouch"]')!.classList.toggle('active', this.input.crouch); $('perf').textContent = `${Math.round(this.fps)} FPS / ${this.renderer.quality}${this.renderer.adaptive ? ' · AUTO SCALE' : ''}`; }
    loop(now: number) {
        requestAnimationFrame(t => this.loop(t));
        const raw = this.last ? (now - this.last) / 1000 : 1 / 60, dt = Math.min(raw, .04);
        this.last = now;
        this.fps = T.MathUtils.lerp(this.fps, 1 / Math.max(.001, raw), .04);
        this.frameCount++;
        if (this.state === 'playing') {
            if (this.input.pause) {
                this.pause();
                return;
            }
            this.elapsed += dt;
            this.skills.update(dt, this.input, this.renderer.camera);
            this.player.mobility = this.weapons.current.spec.mobility;
            if (this.zombies.enabled && this.zombies.pinned) {
                this.player.speedBoost = 0;
                this.input.jump = false;
            }
            this.player.update(dt, this.input, this.map, this.renderer.camera);
            if (this.zombies.enabled && this.zombies.pinned)
                this.renderer.camera.position.y = this.player.position.y + .55;
            this.crosshairGap=T.MathUtils.damp(this.crosshairGap,this.input.ads?1.5:(this.input.crouch?3:5)+this.player.moveIntensity*(this.player.sprinting?9:5)+this.weapons.bloom*9,7,dt);
            this.weapons.update(dt, this.input, this.player, s => this.shoot(s));
            this.renderer.scene.updateMatrixWorld(true);
            this.zombies.ammoRatio = Math.min(1, (this.weapons.current.ammo + this.weapons.current.reserve) / Math.max(1, this.weapons.current.spec.magazine * 3));
            this.enemies.update(dt, this.player, this.renderer.camera, n => this.damage(n), n => { this.hud.wave(n); this.audio.play('ui'); });
            if (this.state !== 'playing') {
                this.updateHud();
                this.renderer.render();
                return;
            }
            if (this.zombies.enabled) {
                if(this.elapsed>this.calloutAt){const special=this.zombies.zombies.find(z=>z.active&&['pouncer','spitter','bomber','screamer','titan'].includes(z.kind)&&z.root.position.distanceTo(this.player.position)<18);if(special){this.radio.say(special.kind,'队友：小心特殊感染者！');this.calloutAt=this.elapsed+14;}else this.calloutAt=this.elapsed+3;}
                this.buddy.update(dt,this.player,this.zombies,(e,n)=>this.hitEnemy(e,n));
                if(this.elapsed>this.ambienceAt){this.ambienceAt=this.elapsed+(this.operation.stage===7?2.5:9);this.audio.creature(this.operation.stage===7?'titan':this.audio.indoor?'groan':'alarm');}
                this.audio.indoor=this.player.position.z<-95&&this.player.position.z>-225;
                this.campaign.updateChunks(this.player.position);
                this.operation.update(dt, this.player, s => {this.hud.toast(s); this.zombies.remaining+=12;});
                $('struggle').classList.toggle('hidden', !this.zombies.pinned);
                $('struggle').textContent = '挣脱 TAP! ' + this.zombies.escapeTaps + '/5';
                const shake = this.zombies.fx.shake;
                this.renderer.camera.rotation.z += (Math.random() - .5) * shake * .08;
                this.renderer.camera.rotation.x += (Math.random() - .5) * shake * .025;
                if (this.operation.complete) {
                    this.over();
                    return;
                }
            }
            if(!this.zombies.enabled)this.zombies.fx.update(dt,this.player.position,()=>{});
            this.pickups.update(dt, this.player, this.weapons, s => { this.hud.toast(s); this.audio.play('pickup'); });
            this.effects.update(dt);
            if (this.player.moving && this.player.ground) {
                this.step += dt;
                if (this.step > .43) {
                    this.step = 0;
                    this.audio.play('step');
                }
            }
            this.renderer.adapt(Math.min(raw, .1));
            if (this.zombies.enabled)
                this.zombies.adapt(raw);
            this.hud.update(dt);
            if (now - this.lastHud > 70) {
                this.updateHud();
                this.lastHud = now;
            }
        }
        else if (this.state === 'menu') {
            this.renderer.camera.position.set(9 + Math.sin(now * .00008) * 2, 3, 15);
            this.renderer.camera.lookAt(-3, 1, -8);
            this.weapons.root.visible = false;
        }
        this.renderer.render();
        if (this.state === 'menu')
            this.lobby.render(dt);
    }
}
