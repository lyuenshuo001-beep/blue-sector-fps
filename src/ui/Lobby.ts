import * as T from 'three';
import { Profile, OPERATORS } from '../core/Profile';
import { Renderer } from '../core/Renderer';
import { SPECS, modified, Attachments } from '../weapons/Weapon';
import { weaponModel, disposeWeapon } from '../weapons/WeaponModel';
import { soldierModel } from '../enemy/SoldierModel';
export class Lobby {
    mode: 'survival' | 'last-sector' = 'last-sector';
    buddy='shouwang';
    tab = 'home';
    selected = 'M4A1';
    deploying = false;
    previewScene = new T.Scene();
    previewCamera = new T.PerspectiveCamera(38, 1, .05, 20);
    object: T.Group | null = null;
    angle = .5;
    drag = false;
    lastX = 0;
    onSettings = () => { };
    constructor(readonly profile: Profile, readonly renderer: Renderer, readonly launch: () => void) {
        const menu = document.getElementById('menu')!;
        menu.innerHTML = `<nav class="lobby-nav"><div class="twinkle-brand">✦ <b>闪烁行动</b><small>TWINKLE OPS</small></div><div class="lobby-tabs"><button data-tab="home">PLAY</button><button data-tab="operators">OPERATORS</button><button data-tab="weapons">WEAPONS</button><button data-tab="loadout">LOADOUT</button><button data-tab="gunsmith">GUNSMITH</button><button id="settings-open">SETTINGS</button></div><span id="credit-balance"></span></nav><div id="lobby-content"></div><div id="preview-drag" aria-label="拖动旋转 3D 模型"></div><footer class="lobby-footer"><span id="profile-status"></span><span>LAST SECTOR / 绝境行动 · 单人 PVE</span><button id="play" class="primary">开始游戏 ↗</button></footer>`;
        menu.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => b.onclick = () => { this.deploying = false; this.show(b.dataset.tab!); });
        const area = document.getElementById('preview-drag')!;
        area.onpointerdown = e => { this.drag = true; this.lastX = e.clientX; area.setPointerCapture(e.pointerId); };
        area.onpointermove = e => {
            if (this.drag) {
                this.angle += (e.clientX - this.lastX) * .012;
                this.lastX = e.clientX;
            }
        };
        area.onpointerup = area.onpointercancel = () => this.drag = false;
        this.previewScene.add(new T.HemisphereLight(0xe5f5ff, 0x4a5968, 3));
        const light = new T.DirectionalLight(0xffe1b8, 4);
        light.position.set(2, 4, 3);
        this.previewScene.add(light);
        this.previewScene.environment = renderer.scene.environment;
        this.previewScene.environmentIntensity = 1;
        try{const b=localStorage.getItem('twinkle-buddy');if(OPERATORS.some(o=>o.id===b))this.buddy=b!;}catch{}this.selected = profile.data.primary;
        this.show('home');
    }
    openDeploy() { this.deploying = true; this.show('modes'); }
    show(tab: string) {
        this.tab = tab;
        document.getElementById('preview-drag')!.style.display = tab === 'modes' ? 'none' : '';
        const d = this.profile.data;
        document.getElementById('credit-balance')!.textContent = '◈ ' + d.credits.toLocaleString() + ' C';
        document.getElementById('profile-status')!.textContent = this.profile.storageAvailable ? '本地档案 · BEST WAVE ' + d.best.wave : '存储不可用 · 本次进度仅保留到关闭页面';
        document.querySelectorAll<HTMLElement>('[data-tab]').forEach(b => b.classList.toggle('selected', b.dataset.tab === tab));
        const container = document.getElementById('lobby-content')!;
        const op = OPERATORS.find(o => o.id === d.operator)!;
        if (tab === 'modes') {
            container.innerHTML = '<div class="mode-select"><p class="eyebrow">MODE SELECT / 选择行动</p><button class="mode-card" data-mode="last-sector"><small>CO-OP STYLE / SOLO PVE</small><h2>绝境行动</h2><b>LAST SECTOR</b><p>线性战役 · AI 队友 · 特殊感染体 · TITAN · 撤离</p><span>进入隔离区战役 ↗</span></button><button class="mode-card" data-mode="survival"><small>CLASSIC</small><h2>悬空城生存</h2><b>SKYWARD SURVIVAL</b><p>保留原版「路一号」枪战与无尽波次</p><span>继续经典模式 ↗</span></button></div>';
            container.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.onclick = () => { this.mode = b.dataset.mode as 'survival' | 'last-sector'; this.show('operators'); });
            this.clearPreview();
        }
        else if (tab === 'home') {
            container.innerHTML = `<div class="home-intro"><p class="eyebrow">OPERATION 02 / LAST SECTOR</p><h1>闪烁行动</h1><h2>TWINKLE OPS</h2><p class="home-tagline">每一次闪烁，都是突破。</p><p>进入感染街区，寻找样本，守住撤离点。<br>面对腐液、爆裂与扑袭，突破尸潮。</p><div class="mission-chips"><span>真实名称武器库</span><span>4 名战术干员</span><span>尸潮 PVE / 经典生存</span></div></div><aside class="lobby-right home-card"><small>ACTIVE OPERATOR</small><h2>${op.name}</h2><p>${op.role}</p><hr><span>PRIMARY</span><h3>${d.primary}</h3><span>SECONDARY</span><h3>${d.secondary}</h3><p class="hint">击杀、爆头、完成波次获得 Credits。<br>武器解锁和配件配置自动保存。</p></aside>`;
            this.setOperatorPreview(op.color);
        }
        else if (tab === 'operators') {
            container.innerHTML = `<aside class="lobby-left"><p class="eyebrow">${this.deploying ? '01 / SELECT OPERATOR' : 'OPERATORS'}</p>${OPERATORS.map(o => `<button class="selection-card ${o.id === d.operator ? 'chosen' : ''}" data-op="${o.id}"><b>${o.name}</b><small>${o.role}</small></button>`).join('')}</aside><aside class="lobby-right"><small>OPERATOR DOSSIER</small><h2>${op.name}</h2><p>${op.role}</p>${op.skills.map((s, i) => `<div class="skill-card"><b>${['Q', 'E', 'X'][i]}</b><span>${s}</span></div>`).join('')}${this.mode==='last-sector'?`<label>AI 队友<select id="buddy-select">${OPERATORS.map(o=>`<option value="${o.id}" ${this.buddy===o.id?'selected':''}>${o.name}</option>`).join('')}</select></label>`:''}<button id="operator-equip" class="primary">${this.deploying ? '下一步：配装 →' : 'EQUIPPED / 已装备'}</button></aside>`;
            container.querySelectorAll<HTMLButtonElement>('[data-op]').forEach(b => b.onclick = () => { d.operator = b.dataset.op!; this.profile.save(); this.show('operators'); });
            const buddySelect=document.getElementById('buddy-select') as HTMLSelectElement|null;if(buddySelect)buddySelect.onchange=()=>{this.buddy=buddySelect.value;try{localStorage.setItem('twinkle-buddy',this.buddy);}catch{}};
            document.getElementById('operator-equip')!.onclick = () => {
                if (this.deploying)
                    this.show('loadout');
            };
            this.setOperatorPreview(op.color);
        }
        else {
            const w = SPECS.find(w => w.id === this.selected) || SPECS[0], a = this.profile.getAttachments(w.id), s = modified(w, a), owned = d.unlocked.includes(w.id), equipped = d.primary === w.id || d.secondary === w.id;
            container.innerHTML = `<aside class="lobby-left"><p class="eyebrow">${this.deploying ? '02 / SELECT LOADOUT' : tab.toUpperCase()}</p><div class="weapon-list">${SPECS.map(g => `<button class="weapon-choice ${g.id === w.id ? 'chosen' : ''}" data-weapon="${g.id}"><b>${g.id}</b><small>${g.category} <span>${d.unlocked.includes(g.id) ? 'OWNED' : g.cost + ' C'}</span></small></button>`).join('')}</div></aside><div class="preview-caption"><span>拖动旋转 / DRAG TO ROTATE</span><h2>${w.id}</h2><p>${w.name}</p></div><aside class="lobby-right"><small>WEAPON CONFIGURATION</small><h2>${w.id}</h2><div class="weapon-stats">${[['DAMAGE', s.damage * (s.pellets > 1 ? s.pellets : 1), 120], ['FIRE RATE', s.fireRate, 16], ['RANGE', s.range, 100], ['ACCURACY', Math.round(100 - s.spread * 500), 100], ['MOBILITY', Math.round(s.mobility * 70), 100]].map(([n, v, max]) => `<label>${n}<b>${v}</b><i style="--value:${Math.min(100, Number(v) / Number(max) * 100)}%"></i></label>`).join('')}</div>
 <div class="attachment-fields"><label>倍镜<select data-attachment="scope">${[['iron', 'Iron Sight'], ['red', 'Red Dot'], ['holo', 'Holo'], ['2x', '2×'], ['4x', '4×'], ['sniper', '7× Sniper']].map(([v, n]) => `<option value="${v}" ${a.scope === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label>枪口<select data-attachment="muzzle">${['standard', 'compensator', 'suppressor'].map(v => `<option ${a.muzzle === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>握把<select data-attachment="grip">${['vertical', 'angled'].map(v => `<option ${a.grip === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>弹匣<select data-attachment="magazine">${['standard', 'extended'].map(v => `<option ${a.magazine === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div><p class="hint">${s.magazine} 发 · 换弹 ${s.reloadTime.toFixed(1)}s · 纵向后坐力 ${s.recoil.toFixed(3)}</p><button id="equip-weapon" class="primary" ${!owned && d.credits < w.cost ? 'disabled' : ''}>${owned ? (equipped ? 'EQUIPPED / 已装备' : 'EQUIP / 装备') : 'BUY / ' + w.cost + ' C'}</button><p id="loadout-summary">${d.primary} + ${d.secondary}</p>${this.deploying ? '<button id="deploy-start" class="primary">START / 开始行动 ↗</button>' : ''}</aside>`;
            container.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(b => b.onclick = () => { this.selected = b.dataset.weapon!; this.show(tab); });
            container.querySelectorAll<HTMLSelectElement>('[data-attachment]').forEach(select => select.onchange = () => { const next = { ...a, [select.dataset.attachment!]: select.value }; d.attachments[w.id] = this.profile.validate(next); this.profile.save(); this.show(tab); });
            document.getElementById('equip-weapon')!.onclick = () => {
                if (!owned) {
                    if (!this.profile.buy(w.id))
                        return;
                }
                this.profile.equip(w.id);
                this.show(tab);
            };
            if (this.deploying)
                document.getElementById('deploy-start')!.onclick = () => this.launch();
            this.setWeaponPreview(w.id, a);
        }
    }
    clearPreview() {
        if (this.object) {
            this.previewScene.remove(this.object);
            if (this.object.userData.materials)
                disposeWeapon(this.object);
            else
                this.object.traverse(o => {
                    if (o instanceof T.Mesh) {
                        o.geometry.dispose();
                        if (Array.isArray(o.material))
                            o.material.forEach(m => m.dispose());
                        else
                            o.material.dispose();
                    }
                });
        }
        this.object = null;
    }
    setWeaponPreview(id: string, a: Attachments) { this.clearPreview(); this.object = weaponModel(id, a.scope, a.muzzle, a.grip, a.magazine === 'extended'); this.object.position.z = .15; this.previewScene.add(this.object); this.angle = 1.05; this.previewCamera.position.set(0, .18, 1.7); this.previewCamera.lookAt(0, 0, 0); }
    setOperatorPreview(color: number) { this.clearPreview(); this.object = soldierModel(color); this.object.position.y = -1; this.previewScene.add(this.object); this.angle = .4; this.previewCamera.position.set(0, .15, 3.5); this.previewCamera.lookAt(0, .05, 0); }
    render(dt: number) {
        if (!this.object)
            return;
        if (!this.drag)
            this.angle += dt * .12;
        this.object.rotation.y = this.angle;
        const rect = document.getElementById('preview-drag')!.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1)
            return;
        const gl = this.renderer.gl;
        this.previewCamera.aspect = rect.width / rect.height;
        this.previewCamera.updateProjectionMatrix();
        gl.autoClear = false;
        gl.clearDepth();
        gl.setScissorTest(true);
        gl.setScissor(rect.left, innerHeight - rect.bottom, rect.width, rect.height);
        gl.setViewport(rect.left, innerHeight - rect.bottom, rect.width, rect.height);
        gl.render(this.previewScene, this.previewCamera);
        gl.setScissorTest(false);
        gl.setViewport(0, 0, innerWidth, innerHeight);
        gl.autoClear = true;
    }
}
