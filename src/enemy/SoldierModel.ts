import { material } from '../world/Materials';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export function soldierModel(color = 0xb97659) {
    const root = new T.Group();
    const fabric = material('rubber', color).clone(), armor = material('metal', 0x56666b).clone(), dark = new T.MeshStandardMaterial({ color: 0x1c292f, roughness: .5 }), visor = new T.MeshStandardMaterial({ color: 0x87cddb, emissive: 0x245765, metalness: .65, roughness: .2 });
    const mesh = (g: T.BufferGeometry, m: T.Material, x: number, y: number, z: number) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; root.add(o); return o; };
    mesh(new RoundedBoxGeometry(.67, .75, .39, 2, .07), fabric, 0, 1.12, 0);
    mesh(new RoundedBoxGeometry(.54, .46, .12, 2, .035), armor, 0, 1.19, .23);
    mesh(new T.SphereGeometry(.255, 12, 8), armor, 0, 1.75, 0);
    mesh(new RoundedBoxGeometry(.41, .13, .10, 2, .035), visor, 0, 1.77, .22);
    mesh(new T.CylinderGeometry(.13, .13, .12, 8), dark, 0, 1.5, 0);
    for (const side of [-1, 1]) {
        mesh(new T.CapsuleGeometry(.12, .39, 3, 8), fabric, side * .22, .52, 0);
        mesh(new RoundedBoxGeometry(.24, .18, .36, 1, .045), dark, side * .22, .12, .05);
        mesh(new T.CapsuleGeometry(.105, .34, 3, 8), fabric, side * .45, 1.1, 0);
        mesh(new T.SphereGeometry(.12, 8, 6), armor, side * .4, 1.36, 0);
        mesh(new RoundedBoxGeometry(.16, .18, .09, 1, .02), armor, side * .15, .96, .25);
    }
    mesh(new RoundedBoxGeometry(.48, .55, .22, 1, .04), armor, 0, 1.12, -.28);
    for (const x of [-.18, 0, .18])
        mesh(new RoundedBoxGeometry(.14, .21, .12, 1, .025), dark, x, 1.06, .30);
    for (const x of [-.22, .22])
        mesh(new RoundedBoxGeometry(.18, .19, .1, 1, .04), armor, x, .48, .14);
    mesh(new T.CylinderGeometry(.05, .05, .18, 8), dark, .22, 1.8, .13);
    if (color === 0x7fc7da) {
        for (const x of [-.22, .22])
            mesh(new T.CylinderGeometry(.10, .08, .42, 10), armor, x, 1.15, -.35);
    }
    if (color === 0x8cb99d) {
        mesh(new T.BoxGeometry(.22, .055, .03), visor, 0, 1.3, .31);
        mesh(new T.BoxGeometry(.055, .22, .03), visor, 0, 1.3, .31);
    }
    const batches = new Map<T.Material, T.BufferGeometry[]>();
    for (const o of [...root.children])
        if (o instanceof T.Mesh) {
            o.updateMatrix();
            let g = o.geometry.clone().applyMatrix4(o.matrix);
            if (g.index)
                g = g.toNonIndexed();
            const list = batches.get(o.material as T.Material) || [];
            list.push(g);
            batches.set(o.material as T.Material, list);
            root.remove(o);
            o.geometry.dispose();
        }
    for (const [m, gs] of batches) {
        const model = new T.Mesh(mergeGeometries(gs), m);
        model.castShadow = true;
        root.add(model);
        gs.forEach(g => g.dispose());
    }
    return root;
}
