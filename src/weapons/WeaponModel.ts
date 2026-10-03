import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { material } from '../world/Materials';
export function weaponModel(id: string, scope = 'iron', muzzle = 'standard', grip = 'vertical', extended = false, view = false) {
    const root = new T.Group(), parts = new Map<T.Material, T.BufferGeometry[]>();
    const pistol = ['G17', 'Desert Eagle'].includes(id), sniper = ['AWM', 'M700', 'SR-25'].includes(id), smg = ['MP5', 'MP7', 'Vector'].includes(id), shotgun = ['M870', 'M1014'].includes(id), ak = id === 'AKM' || id === 'AK-12', lmg = id === 'M249';
    const steel = material('metal', 0x50595d).clone(), trim = material('metal', 0x879096).clone(), poly = material(id === 'AKM' ? 'wood' : 'rubber', id === 'AKM' ? 0x8d5932 : id === 'MCX LT' ? 0x82765c : 0x3e4847).clone(), gripMat = material('rubber', 0x20292b).clone();
    for (const m of [steel, trim, poly, gripMat]) {
        m.depthTest = !view;
        m.depthWrite = !view;
    }
    const add = (geo: T.BufferGeometry, mat: T.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
        if (geo.index) {
            const old = geo;
            geo = geo.toNonIndexed();
            old.dispose();
        }
        geo.rotateX(rx);
        geo.rotateY(ry);
        geo.rotateZ(rz);
        geo.translate(x, y, z);
        const a = parts.get(mat) || [];
        a.push(geo);
        parts.set(mat, a);
    };
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material, r = 0) => add(new RoundedBoxGeometry(w, h, d, 1, Math.min(w, h, d) * .14), m, x, y, z, 0, 0, r);
    const tube = (r: number, len: number, x: number, y: number, z: number, m: T.Material) => add(new T.CylinderGeometry(r, r, len, 12), m, x, y, z, Math.PI / 2);
    // Extruded side silhouettes give receivers, stocks and magazines distinct contours.
    const profile = (points: number[][], width: number, m: T.Material) => { const shape = new T.Shape(); points.forEach(([z, y], i) => i ? shape.lineTo(-z, y) : shape.moveTo(-z, y)); shape.closePath(); const geo = new T.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 1, steps: 1 }); geo.translate(0, 0, -width / 2); geo.rotateY(Math.PI / 2); add(geo, m, 0, 0, 0); };
    const len = pistol ? .34 : lmg ? 1.10 : smg ? (id === 'MP7' ? .43 : .58) : sniper ? 1.02 : shotgun ? .91 : id === 'MCX LT' ? .64 : .77;
    // Receiver profile and separate upper, slide, barrel, shroud, grip, stock, rail and trigger guard.
    if (pistol) {
        box(.105, .095, .29, 0, .032, -.23, steel);
        profile([[-.365, -.02], [-.1, -.02], [-.05, -.10], [-.07, -.13], [-.24, -.09], [-.33, -.065]], .09, poly);
    }
    else {
        profile([[-.40, .065], [-.09, .065], [.015, .02], [.01, -.055], [-.13, -.085], [-.17, -.15], [-.31, -.15], [-.37, -.09], [-.40, -.035]], .12, steel);
        box(.125, .042, .33, 0, .067, -.225, trim);
    }
    tube(.032, len * .65, 0, .035, -.34 - len * .32, trim);
    if (!pistol) {
        add(new T.CylinderGeometry(.070, .065, len * .39, 8), poly, 0, .014, -.4 - len * .195, Math.PI / 2);
        for (let row = 0; row < 2; row++)
            for (let j = 0; j < 5; j++)
                box(.007, .015, .038, .068, -.017 + row * .043, -.43 - j * .036, gripMat);
        for (let i = 0; i < 7; i++) {
            box(.16, .016, .018, 0, .102, -.17 - i * .045, steel);
            box(.008, .025, .038, .077, .018, -.43 - i * .035, gripMat);
        }
        tube(.023, .21, 0, .015, .075, trim);
        profile([[.09, .04], [.28, .045], [.30, -.18], [.255, -.19], [.20, -.085], [.09, -.04]], .095, poly);
        box(.11, .235, .025, 0, -.070, .30, gripMat);
        box(.10, .035, .15, 0, .048, .19, poly);
        box(.006, .03, .08, .052, -.045, .195, gripMat);
    }
    profile([[-.155, -.075], [-.07, -.07], [-.015, -.275], [-.10, -.29], [-.15, -.12]], .078, gripMat);
    for (let i = 0; i < 5; i++)
        box(.083, .010, .059, 0, -.145 - i * .025, -.080 + i * .007, poly);
    // Curved magazine for KA, straight box or pistol magazine for others.
    if (!pistol && !lmg) {
        const drop = extended ? .34 : .27, curve = ak ? .065 : smg ? -.02 : .015;
        profile([[-.33, -.08], [-.225, -.09], [-.223 - curve * .25, -.20], [-.235 - curve, -drop], [-.34 - curve, -drop - .015], [-.335 - curve * .3, -.20]], smg ? .052 : .075, poly);
        for (let i = 0; i < 3; i++)
            box(.079, .009, .088, 0, -.175 - i * .040, -.284 - curve * i / 3, trim);
    }
    if (lmg) {
        box(.23, extended ? .30 : .24, .23, -.035, -.20, -.26, poly);
        box(.16, .08, .38, 0, .115, -.25, steel);
        for (let i = 0; i < 7; i++)
            tube(.014, .07, -.12 - i * .009, .06 - i * .011, -.25 + i * .022, trim);
        box(.018, .25, .025, -.09, -.08, -.73, steel, .32);
        box(.018, .25, .025, .09, -.08, -.73, steel, -.32);
    }
    if (id === 'MP5') {
        tube(.064, .25, 0, .013, -.48, gripMat);
        add(new T.TorusGeometry(.044, .008, 5, 12), steel, 0, .09, -.65);
    }
    if (id === 'Vector') {
        profile([[-.42, -.04], [-.19, -.04], [-.16, -.20], [-.24, -.25], [-.44, -.17]], .14, poly);
    }
    if (id === 'MP7') {
        box(.015, .018, .30, -.052, .045, .07, trim);
        box(.015, .018, .30, .052, .045, .07, trim);
    }
    if (id === 'AKM') {
        tube(.022, .36, 0, .083, -.57, steel);
        profile([[.035, .03], [.29, .035], [.30, -.15], [.20, -.10], [.07, -.04]], .09, poly);
    }
    if (shotgun) {
        tube(.061, .23, 0, -.027, -.62, gripMat);
        for (let i = 0; i < 7; i++)
            tube(.065, .01, 0, -.027, -.53 - i * .026, poly);
    }
    const guard = new T.TorusGeometry(.063, .011, 5, 12, Math.PI * 1.6);
    guard.rotateY(Math.PI / 2);
    add(guard, steel, 0, -.13, -.205);
    box(.018, .065, .016, 0, -.12, -.215, trim);
    if (!pistol && grip === 'vertical')
        box(.072, .16, .095, 0, -.14, -.53, gripMat);
    if (grip === 'angled')
        box(.075, .065, .19, 0, -.10, -.49, gripMat);
    tube(muzzle === 'suppressor' ? .058 : .039, muzzle === 'suppressor' ? .22 : .07, 0, .035, -.36 - len * .65, steel);
    // Ejection port, selector, charging handle and screws create readable mechanical detail.
    box(.005, .045, .10, .082, .025, -.235, gripMat);
    box(.045, .018, .05, .095, .033, -.16, trim);
    for (const z of [-.12, -.3])
        add(new T.CylinderGeometry(.012, .012, .012, 8), trim, .084, -.023, z, 0, 0, Math.PI / 2);
    if (scope === 'iron') {
        box(.045, .035, .024, 0, .126, -.1, steel);
        box(.012, .055, .025, 0, .13, -.52, trim);
    }
    else if (scope === 'red' || scope === 'holo') {
        const ring = new T.TorusGeometry(scope === 'holo' ? .061 : .047, .014, 6, 12);
        add(ring, steel, 0, .168, -.23);
        box(.085, .06, .08, 0, .115, -.23, steel);
    }
    else {
        tube(.053, .24, 0, .175, -.22, steel);
        for (const z of [-.1, -.34])
            tube(.065, .035, 0, .175, z, trim);
        box(.07, .065, .13, 0, .11, -.22, steel);
    }
    if (scope !== 'iron') {
        const lens = new T.MeshStandardMaterial({ color: 0x38748a, emissive: 0x092c35, metalness: .5, roughness: .12, depthTest: !view, depthWrite: !view });
        parts.set(lens, []);
        add(new T.CircleGeometry(scope === 'holo' ? .049 : scope === 'red' ? .035 : .050, 16), lens, 0, scope === 'red' || scope === 'holo' ? .168 : .175, scope === 'red' || scope === 'holo' ? -.231 : -.363, 0, Math.PI);
        root.userData.lens = lens;
    }
    if (shotgun)
        tube(.035, .56, 0, -.045, -.53, steel);
    for (const [m, gs] of parts) {
        const mesh = new T.Mesh(mergeGeometries(gs), m);
        mesh.renderOrder = view ? 10 : 0;
        mesh.castShadow = !view;
        root.add(mesh);
        gs.forEach(g => g.dispose());
    }
    root.userData.materials = [steel, trim, poly, gripMat, ...(root.userData.lens ? [root.userData.lens] : [])];
    root.userData.muzzleZ = -.36 - len * .65;
    return root;
}
export function disposeWeapon(root: T.Group) {
    root.traverse(o => {
        if (o instanceof T.Mesh)
            o.geometry.dispose();
    });
    for (const m of root.userData.materials || [])
        m.dispose();
}
