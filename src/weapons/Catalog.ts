export type Scope = 'iron' | 'red' | 'holo' | '2x' | '4x' | 'sniper';
export interface Attachments {
    scope: Scope;
    muzzle: 'standard' | 'compensator' | 'suppressor';
    grip: 'vertical' | 'angled';
    magazine: 'standard' | 'extended';
}
export const DEFAULT_ATTACHMENTS: Attachments = { scope: 'iron', muzzle: 'standard', grip: 'vertical', magazine: 'standard' };
export interface WeaponSpec {
    id: string;
    name: string;
    damage: number;
    fireRate: number;
    magazine: number;
    reserve: number;
    reloadTime: number;
    spread: number;
    recoil: number;
    adsFov: number;
    hipAccuracy: number;
    adsAccuracy: number;
    automatic: boolean;
    length: number;
    category: 'AR' | 'SMG' | 'SNIPER' | 'DMR' | 'SHOTGUN' | 'PISTOL';
    horizontal: number;
    adsSpeed: number;
    mobility: number;
    range: number;
    headshot: number;
    pellets: number;
    cost: number;
}
const make = (id: string, name: string, category: WeaponSpec['category'], damage: number, fireRate: number, magazine: number, cost: number, extra: Partial<WeaponSpec> = {}): WeaponSpec => ({ id, name, category, damage, fireRate, magazine, cost, reserve: magazine * 4, reloadTime: 1.9, spread: .013, recoil: .027, adsFov: 57, hipAccuracy: 1, adsAccuracy: .23, automatic: true, length: 1, horizontal: .009, adsSpeed: 12, mobility: 1, range: 35, headshot: 2, pellets: 1, ...extra });
export const SPECS: WeaponSpec[] = [
    make('AR-01', '先锋 / ASSAULT', 'AR', 30, 9, 30, 0),
    make('SMG-9', '蜂鸟 / SMG', 'SMG', 21, 13, 30, 1000, { recoil: .016, horizontal: .006, mobility: 1.12, range: 19, reloadTime: 1.5, length: .75 }),
    make('SR-50', '远星 / PRECISION', 'SNIPER', 90, .85, 5, 2500, { automatic: false, recoil: .065, adsFov: 25, spread: .045, adsAccuracy: .018, range: 80, mobility: .8, adsSpeed: 6, reloadTime: 2.6, length: 1.35 }),
    make('PX-12', '信标 / SIDEARM', 'PISTOL', 36, 4.5, 12, 0, { automatic: false, recoil: .03, range: 24, mobility: 1.16, reloadTime: 1.25, length: .48 }),
    make('AR-02', '曙光 / AR', 'AR', 34, 7.6, 30, 1500, { recoil: .032, horizontal: .006, range: 44 }),
    make('KA-47', '铁杉 / HEAVY AR', 'AR', 39, 6.4, 25, 1750, { recoil: .043, horizontal: .014, range: 42, mobility: .94 }),
    make('CB-7', '游隼 / CARBINE', 'AR', 27, 10.2, 28, 1350, { mobility: 1.08, adsSpeed: 16, range: 29, recoil: .022 }),
    make('VX-45', '涡流 / VECTOR', 'SMG', 20, 15, 26, 1800, { recoil: .015, horizontal: .004, range: 17, mobility: 1.13, adsSpeed: 17, length: .7 }),
    make('CX-6', '雨燕 / COMPACT', 'SMG', 23, 11.5, 32, 1400, { recoil: .019, mobility: 1.17, range: 21, length: .65 }),
    make('BA-90', '极光 / BOLT ACTION', 'SNIPER', 110, .65, 5, 2800, { automatic: false, recoil: .08, range: 95, adsSpeed: 5, mobility: .77, adsFov: 20, adsAccuracy: .015, reloadTime: 3.1, length: 1.4 }),
    make('DMR-21', '守夜 / MARKSMAN', 'DMR', 52, 3.4, 16, 2000, { automatic: false, recoil: .042, range: 62, adsAccuracy: .08, mobility: .94, adsFov: 38 }),
    make('SG-8', '破门 / PUMP', 'SHOTGUN', 14, 1.1, 8, 1200, { automatic: false, pellets: 8, spread: .11, adsAccuracy: .65, range: 12, headshot: 1.3, recoil: .07, reloadTime: 2.8 }),
    make('SG-12', '雷鸣 / AUTO SHOT', 'SHOTGUN', 11, 2.5, 10, 1900, { automatic: false, pellets: 7, spread: .12, adsAccuracy: .65, range: 10, headshot: 1.3, recoil: .06, reloadTime: 3 }),
    make('HP-45', '重锤 / HEAVY PISTOL', 'PISTOL', 58, 2.6, 8, 900, { automatic: false, recoil: .06, horizontal: .013, range: 35, mobility: 1.1, reloadTime: 1.6, length: .5 })
];
export const SCOPE_ZOOM: Record<Scope, number> = { iron: 1.12, red: 1.25, holo: 1.35, '2x': 2, '4x': 4, sniper: 7 };
export function modified(base: WeaponSpec, a: Attachments): WeaponSpec { return { ...base, magazine: a.magazine === 'extended' ? Math.round(base.magazine * 1.34) : base.magazine, reloadTime: base.reloadTime * (a.magazine === 'extended' ? 1.18 : 1), recoil: base.recoil * (a.grip === 'vertical' ? .82 : 1) * (a.muzzle === 'compensator' ? .76 : 1), horizontal: base.horizontal * (a.grip === 'angled' ? .65 : 1), range: base.range * (a.muzzle === 'suppressor' ? .9 : 1), adsSpeed: base.adsSpeed * (a.grip === 'angled' ? 1.2 : 1), adsFov: 2 * Math.atan(Math.tan(78 * Math.PI / 360) / SCOPE_ZOOM[a.scope]) * 180 / Math.PI }; }
export class Weapon {
    ammo: number;
    reserve: number;
    spec: WeaponSpec;
    attachments: Attachments = { ...DEFAULT_ATTACHMENTS };
    constructor(readonly base: WeaponSpec) { this.spec = { ...base }; this.ammo = base.magazine; this.reserve = base.reserve; }
    configure(a: Attachments) { this.attachments = { ...a }; this.spec = modified(this.base, a); this.ammo = Math.min(this.ammo, this.spec.magazine); }
    reset() { this.ammo = this.spec.magazine; this.reserve = this.spec.reserve; }
}
