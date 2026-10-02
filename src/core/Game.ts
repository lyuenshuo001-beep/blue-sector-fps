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
    input = new InputManager(this.renderer.gl.domElement);
    audio = new AudioManager();
    player = new Player();
    weapons = new WeaponManager(this.renderer.camera, this.audio);
    enemies = new EnemyManager(this.renderer.scene, this.map, this.audio);
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
        $('play').onclick = () => this.lobby.openDeploy();
        $('restart').onclick = () => this.start();
        $('resume').onclick = () => this.resume();
        $('pause-button').onclick = () => this.pause();
        $('back-menu').onclick = () => { this.state = 'menu'; this.lobby.show('home'); $('gameover').classList.add('hidden'); $('menu').classList.remove('hidden'); $('hud').classList.add('hidden'); };
        $('settings-open').onclick = () => this.settings('menu');
        $('pause-settings').onclick = () => this.settings('pause');
        $('settings-close').onclick = () => { $('settings').classList.add('hidden'); $(this.settingsFrom).classList.remove('hidden'); this.audio.play('ui'); };
        $<HTMLSelectElement>('quality').onchange = e => { this.renderer.setQuality((e.target as HTMLSelectElement).value as Quality); this.enemies.maxActive = this.renderer.quality === 'LOW' ? 8 : 15; this.saveSettings(); };
        $<HTMLInputElement>('sensitivity').oninput = e => { this.input.sensitivity = Number((e.target as HTMLInputElement).value); this.saveSettings(); };
        $<HTMLInputElement>('volume').oninput = e => { this.audio.volume = Number((e.target as HTMLInputElement).value); this.saveSettings(); };
        if (/MicroMessenger/i.test(navigator.userAgent))
            $('wechat').classList.remove('hidden');
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
            $<HTMLInputElement>('sensitivity').value = String(this.input.sensitivity);
            $<HTMLInputElement>('volume').value = String(this.audio.volume);
        }
        catch { }
        this.enemies.maxActive = this.renderer.quality === 'LOW' ? 8 : 15;
    }
    saveSettings() {
        try {
            localStorage.setItem('blue-sector-settings', JSON.stringify({ quality: this.renderer.quality, sensitivity: this.input.sensitivity, volume: this.audio.volume }));
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
    start() { this.audio.init(); this.audio.play('ui'); this.input.reset(); this.input.crouch = false; this.input.pause = false; this.player.reset(); this.weapons.configureLoadout(this.profile); this.weapons.reset(); this.headshots = 0; this.settled = false; this.skills.reset(this.profile.data.operator); this.enemies.reset(); this.pickups.reset(); this.effects.reset(); this.elapsed = 0; this.step = 0; this.state = 'playing'; this.input.enabled = true; ['menu', 'gameover', 'pause', 'settings'].forEach(id => $(id).classList.add('hidden')); $('hud').classList.remove('hidden'); this.hud.toast('SKYWARD / 悬空城 · Q E X 技能 · Shift 冲刺'); this.capture(); }
    pause() {
        if (this.state !== 'playing')
            return;
        this.state = 'paused';
        this.input.enabled = false;
        this.input.reset();
        this.input.pause = false;
        document.exitPointerLock?.();
        $('pause').classList.remove('hidden');
    }
    resume() { this.audio.init(); this.state = 'playing'; this.input.enabled = true; this.input.pause = false; $('pause').classList.add('hidden'); this.capture(); }
    hitEnemy(enemy: Enemy, damage: number, head = false) { if (!enemy.active)
        return; enemy.hp -= damage; enemy.alert = 8; this.skills.mark(enemy); this.hud.hit(head); this.audio.play(head ? 'head' : 'hit'); if (enemy.hp <= 0) {
        enemy.die();
        this.enemies.kills++;
        if (head)
            this.headshots++;
        this.skills.onKill();
        this.hud.toast('路一号 eliminated' + (head ? ' · HEADSHOT' : ''));
        this.audio.play('kill');
    } }
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
                this.hitEnemy(enemy, w.damage * falloff * (head ? w.headshot : 1), head);
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
    over() { if (this.settled)
        return; this.settled = true; this.state = 'over'; this.input.enabled = false; this.input.reset(); document.exitPointerLock?.(); $('gameover').classList.remove('hidden'); const time = Math.floor(this.elapsed), accuracy = this.weapons.shots ? Math.min(100, Math.round(this.weapons.hits / this.weapons.shots * 100)) : 0, earned = this.profile.award(this.enemies.kills, this.headshots, this.enemies.wave, time); $('results').innerHTML = [['KILLS', this.enemies.kills], ['HEADSHOTS', this.headshots], ['WAVE', this.enemies.wave], ['ACCURACY', accuracy + '%'], ['SURVIVAL', Math.floor(time / 60) + ':' + String(time % 60).padStart(2, '0')], ['CREDITS EARNED', '+' + earned]].map(([label, value]) => '<div><span>' + label + '</span><b>' + value + '</b></div>').join(''); }
    updateHud() { const w = this.weapons.current; $('scope').dataset.reticle = w.attachments.scope; $('crosshair').dataset.reticle = this.input.ads ? w.attachments.scope : 'hip'; document.querySelector('.sector-label span')!.textContent = ' / ' + this.map.zone(this.player.position); $('wave').textContent = String(this.enemies.wave).padStart(2, '0'); $('enemies').textContent = String(this.enemies.active.length + this.enemies.remaining); $('kills').textContent = String(this.enemies.kills); $('hp').textContent = String(Math.ceil(this.player.hp)); $('hp-bar').style.width = this.player.hp + '%'; $('hp-bar').style.background = this.player.hp < 30 ? '#ff795f' : '#88e8ff'; $('weapon').textContent = w.spec.id; $('weapon-type').textContent = w.spec.name; $('ammo').textContent = String(w.ammo); $('reserve').textContent = String(w.reserve); $('reload-status').textContent = this.weapons.reloadLeft > 0 ? 'RELOADING ' + this.weapons.reloadLeft.toFixed(1) + 's' : w.ammo === 0 ? 'RELOAD / R' : 'READY'; $('crosshair').style.setProperty('--gap', (this.input.ads ? 2 : 5 + (this.player.moving ? 5 : 0) + this.weapons.bloom * 9) + 'px'); $('scope').style.display = this.input.ads && ['2x', '4x', 'sniper'].includes(w.attachments.scope) ? 'block' : 'none'; document.querySelector('[data-action="ads"]')!.classList.toggle('active', this.input.ads); document.querySelector('[data-action="crouch"]')!.classList.toggle('active', this.input.crouch); $('perf').textContent = `${Math.round(this.fps)} FPS / ${this.renderer.quality}${this.renderer.adaptive ? ' · AUTO SCALE' : ''}`; }
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
            this.player.update(dt, this.input, this.map, this.renderer.camera);
            this.weapons.update(dt, this.input, this.player, s => this.shoot(s));
            this.renderer.scene.updateMatrixWorld(true);
            this.enemies.update(dt, this.player, this.renderer.camera, n => this.damage(n), n => { this.hud.wave(n); this.audio.play('ui'); });
            if (this.state !== 'playing') {
                this.updateHud();
                this.renderer.render();
                return;
            }
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
