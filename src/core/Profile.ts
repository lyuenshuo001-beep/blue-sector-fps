import { SPECS, Attachments, DEFAULT_ATTACHMENTS } from '../weapons/Weapon';
export const OPERATORS = [
    { id: 'jiying', name: '疾影', role: 'ASSAULT / MOBILITY', color: 0xe3a665, skills: ['超载 · 8 秒加速，击杀延长', '微型榴弹 · 撞击爆炸', '战术滑铲 · 冲刺蹲下'] },
    { id: 'tiansun', name: '天隼', role: 'MOBILITY / BREACHER', color: 0x7fc7da, skills: ['动能推进 · 定向冲刺', '吸附炸弹 · 延时爆破', '冲击弹 · 区域减速'] },
    { id: 'yuehen', name: '月痕', role: 'RECON / INTELLIGENCE', color: 0xaf9dda, skills: ['侦察箭 · 区域标记', '电弧箭 · 持续伤害', '敌情标记 · 命中显形'] },
    { id: 'shouwang', name: '守望', role: 'SUPPORT / DEFENCE', color: 0x8cb99d, skills: ['医疗包 · 恢复生命', '防护装置 · 减免伤害', '战术护甲 · 临时护甲'] }
];
export interface Save {
    version: 2;
    credits: number;
    unlocked: string[];
    primary: string;
    secondary: string;
    operator: string;
    attachments: Record<string, Attachments>;
    best: {
        kills: number;
        wave: number;
        time: number;
    };
    runs: number;
}
export class Profile {
    data: Save = { version: 2, credits: 0, unlocked: ['AR-01', 'PX-12'], primary: 'AR-01', secondary: 'PX-12', operator: 'jiying', attachments: {}, best: { kills: 0, wave: 0, time: 0 }, runs: 0 };
    storageAvailable = true;
    constructor() { try {
        const raw = JSON.parse(localStorage.getItem('twinkle-ops-profile-v2') || 'null');
        if (raw && raw.version === 2) {
            this.data.credits = this.integer(raw.credits);
            this.data.unlocked = [...new Set(['AR-01', 'PX-12', ...(Array.isArray(raw.unlocked) ? raw.unlocked.filter((s: string) => SPECS.some(w => w.id === s)) : [])])] as string[];
            this.data.primary = this.data.unlocked.includes(raw.primary) && SPECS.find(w => w.id === raw.primary)?.category !== 'PISTOL' ? raw.primary : 'AR-01';
            this.data.secondary = this.data.unlocked.includes(raw.secondary) && SPECS.find(w => w.id === raw.secondary)?.category === 'PISTOL' ? raw.secondary : 'PX-12';
            this.data.operator = OPERATORS.some(o => o.id === raw.operator) ? raw.operator : 'jiying';
            this.data.runs = this.integer(raw.runs);
            this.data.best = { kills: this.integer(raw.best?.kills), wave: this.integer(raw.best?.wave), time: this.integer(raw.best?.time) };
            for (const w of SPECS) {
                const a = raw.attachments?.[w.id];
                if (a)
                    this.data.attachments[w.id] = this.validate(a);
            }
        }
    }
    catch {
        this.storageAvailable = false;
    } }
    private integer(v: unknown) { return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(10000000, Math.floor(v))) : 0; }
    validate(a: Partial<Attachments>): Attachments { return { scope: ['iron', 'red', 'holo', '2x', '4x', 'sniper'].includes(a.scope || '') ? a.scope! : 'iron', muzzle: ['standard', 'compensator', 'suppressor'].includes(a.muzzle || '') ? a.muzzle! : 'standard', grip: a.grip === 'angled' ? 'angled' : 'vertical', magazine: a.magazine === 'extended' ? 'extended' : 'standard' }; }
    getAttachments(id: string) { return { ...DEFAULT_ATTACHMENTS, ...this.data.attachments[id] }; }
    save() { try {
        localStorage.setItem('twinkle-ops-profile-v2', JSON.stringify(this.data));
        this.storageAvailable = true;
    }
    catch {
        this.storageAvailable = false;
    } }
    buy(id: string) { const w = SPECS.find(w => w.id === id); if (!w || this.data.unlocked.includes(id) || this.data.credits < w.cost)
        return false; this.data.credits -= w.cost; this.data.unlocked.push(id); this.save(); return true; }
    equip(id: string) { if (!this.data.unlocked.includes(id))
        return false; const w = SPECS.find(w => w.id === id)!; if (w.category === 'PISTOL')
        this.data.secondary = id;
    else
        this.data.primary = id; this.save(); return true; }
    award(kills: number, headshots: number, wave: number, time: number) { const earned = kills * 25 + headshots * 10 + Math.max(0, wave - 1) * 100 + Math.floor(time / 10) * 5; this.data.credits += earned; this.data.runs++; this.data.best = { kills: Math.max(kills, this.data.best.kills), wave: Math.max(wave, this.data.best.wave), time: Math.max(time, this.data.best.time) }; this.save(); return earned; }
}
