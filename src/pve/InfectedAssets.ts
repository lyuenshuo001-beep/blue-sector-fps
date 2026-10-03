import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
export type ZombieKind = 'infected' | 'spitter' | 'bomber' | 'pouncer';
export const ZOMBIE_NAMES: Record<ZombieKind, string> = { infected: '感染者', spitter: '腐液者', bomber: '爆裂者', pouncer: '扑袭者' };
const assets = new Map<string, {
    scene: T.Group;
    animations: T.AnimationClip[];
}>();
export async function loadInfected(progress: (n: number) => void) {
    const loader = new GLTFLoader(), texture = new T.TextureLoader(), base = import.meta.env.BASE_URL + 'assets/infected/';
    const maps = await Promise.all(['tissue-color.png', 'tissue-normal.png', 'tissue-roughness.png'].map(p => texture.loadAsync(base + p)));
    maps[0].colorSpace = T.SRGBColorSpace;
    maps.forEach(t => { t.flipY = false; t.wrapS = t.wrapT = T.RepeatWrapping; });
    let done = 0;
    // Limit parallel parsing on mobile; glTF geometry, textures and clips remain shared across the pool.
    for (const kind of ['infected', 'spitter', 'bomber', 'pouncer'])
        for (const suffix of ['', '-low']) {
            const g = await loader.loadAsync(base + kind + suffix + '.glb');
            g.scene.traverse(o => { if (o instanceof T.Mesh) {
                const m = o.material as T.MeshStandardMaterial;
                if (m.name !== 'EyesAndSacs') {
                    m.map = maps[0];
                    m.normalMap = maps[1];
                    m.normalScale.set(.45, .45);
                    m.roughnessMap = maps[2];
                }
                o.castShadow = false;
                o.frustumCulled = false;
            } });
            assets.set(kind + suffix, { scene: g.scene, animations: g.animations });
            progress(++done / 8);
        }
}
export function infectedModel(kind: ZombieKind, low = false) { const a = assets.get(kind + (low ? '-low' : '')); if (!a)
    throw Error('Infected assets not loaded'); const model = clone(a.scene) as T.Group, mixer = new T.AnimationMixer(model); mixer.clipAction(a.animations[0]).play(); return { model, mixer }; }
