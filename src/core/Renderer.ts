import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as T from 'three';
export type Quality = 'LOW' | 'MEDIUM' | 'HIGH';
export class Renderer {
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(78, innerWidth / innerHeight, .06, 115);
    gl: T.WebGLRenderer;
    quality: Quality = 'MEDIUM';
    scale = 1;
    slowTime = 0;
    adaptive = false;
    mobile = matchMedia('(pointer:coarse)').matches;
    sun = new T.DirectionalLight(0xc6e8ff, 2.1);
    constructor() { this.gl = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); this.gl.setClearColor(0x94c9e0);const pmrem=new T.PMREMGenerator(this.gl);const room=new RoomEnvironment();this.scene.environment=pmrem.fromScene(room,.04).texture;this.scene.environmentIntensity=.7;room.dispose();pmrem.dispose(); this.gl.outputColorSpace = T.SRGBColorSpace; this.gl.toneMapping = T.ACESFilmicToneMapping; this.gl.toneMappingExposure = 1.25; this.gl.shadowMap.type = T.PCFSoftShadowMap; this.gl.domElement.id = 'viewport'; document.querySelector('#app')!.append(this.gl.domElement); this.scene.fog = new T.Fog(0xb4d7e4, 55, 150); this.scene.add(new T.HemisphereLight(0xc9e9ff, 0x827654, 2.5)); this.scene.add(new T.AmbientLight(0xffffff, .45)); this.sun.color.setHex(0xffe2b3);this.sun.position.set(-25, 48, 20); this.sun.shadow.mapSize.set(1024, 1024); Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 120 }); this.sun.shadow.bias = -.001; this.scene.add(this.sun); this.camera.rotation.order = 'YXZ'; this.scene.add(this.camera); addEventListener('resize', () => this.resize()); this.setQuality('MEDIUM'); }
    setQuality(q: Quality) { this.quality = q; this.scale = 1; this.adaptive = false; this.slowTime = 0; this.gl.shadowMap.enabled=q!=='LOW';this.gl.shadowMap.autoUpdate=q==='HIGH';this.gl.shadowMap.needsUpdate=true;this.sun.castShadow=q!=='LOW'; this.resize(); }
    resize() { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.gl.setPixelRatio(Math.min(devicePixelRatio, this.quality === 'LOW' ? 1 : this.quality === 'MEDIUM' ? 1.35 : this.mobile ? 1.5 : 2) * this.scale); this.gl.setSize(innerWidth, innerHeight); }
    adapt(dt: number) { if (dt > .026)
        this.slowTime += dt;
    else
        this.slowTime = Math.max(0, this.slowTime - dt * .4); if (this.slowTime > 6 && this.scale > .66) {
        this.scale = Math.max(.65, this.scale - .1);
        this.adaptive = true;
        this.slowTime = 0;
        this.resize();
    } }
    render() { this.gl.render(this.scene, this.camera); }
}


