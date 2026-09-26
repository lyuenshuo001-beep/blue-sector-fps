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
}
export const SPECS: WeaponSpec[] = [
    { id: 'AR-01', name: 'ASSAULT RIFLE', damage: 30, fireRate: 9, magazine: 30, reserve: 120, reloadTime: 1.9, spread: .012, recoil: .026, adsFov: 57, hipAccuracy: 1, adsAccuracy: .22, automatic: true, length: 1 },
    { id: 'SMG-9', name: 'SUBMACHINE GUN', damage: 21, fireRate: 13, magazine: 30, reserve: 150, reloadTime: 1.5, spread: .016, recoil: .016, adsFov: 62, hipAccuracy: 1, adsAccuracy: .3, automatic: true, length: .75 },
    { id: 'SR-50', name: 'PRECISION RIFLE', damage: 90, fireRate: .85, magazine: 5, reserve: 25, reloadTime: 2.6, spread: .045, recoil: .065, adsFov: 25, hipAccuracy: 1, adsAccuracy: .018, automatic: false, length: 1.35 },
    { id: 'PX-12', name: 'SIDEARM', damage: 36, fireRate: 4.5, magazine: 12, reserve: 72, reloadTime: 1.25, spread: .016, recoil: .03, adsFov: 60, hipAccuracy: 1, adsAccuracy: .25, automatic: false, length: .48 }
];
export class Weapon {
    ammo: number;
    reserve: number;
    constructor(readonly spec: WeaponSpec) { this.ammo = spec.magazine; this.reserve = spec.reserve; }
    reset() { this.ammo = this.spec.magazine; this.reserve = this.spec.reserve; }
}
