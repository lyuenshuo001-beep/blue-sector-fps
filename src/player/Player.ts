import * as T from 'three';
import { InputManager } from '../core/InputManager';
import { BlueRoomMap } from '../world/BlueRoomMap';
export class Player {
    position = new T.Vector3(0, 0, 27);
    hp = 100;
    mobility=1;speedBoost=1;sprinting=false;armor=0;
    yaw = 0;
    pitch = 0;
    height = 1.65;
    vy = 0;
    moving = false;
    moveIntensity=0;vaultLeft=0;vaultStart=new T.Vector3();vaultEnd=new T.Vector3();
    ground = true;
    walk = 0;
    recoil = 0;
    reset() {this.vaultLeft=0;this.moveIntensity=0; this.position.set(0, 0, 27); this.hp = 100; this.yaw = 0; this.pitch = 0; this.height = 1.65; this.vy = 0; this.ground = true; this.recoil = 0; }
    update(dt: number, input: InputManager, map: BlueRoomMap, camera: T.PerspectiveCamera) {
        this.yaw -= input.look.x * .0024 * input.sensitivity * (input.ads ? .55 : 1);
        this.pitch = T.MathUtils.clamp(this.pitch - input.look.y * .0024 * input.sensitivity * (input.ads ? .55 : 1), -1.4, 1.4);
        input.look = { x: 0, y: 0 };
        const a = input.axes(), l = Math.max(1, Math.hypot(a.x, a.y)), speed = (input.crouch ? 2.3 : input.ads ? 3 : input.sprint||input.keys.has('ShiftLeft')?7:5)*this.mobility*this.speedBoost;this.sprinting=(input.sprint||input.keys.has('ShiftLeft'))&&!input.ads&&!input.crouch;
        this.moving = Math.hypot(a.x, a.y) > .08;this.moveIntensity=T.MathUtils.damp(this.moveIntensity,Math.min(1,Math.hypot(a.x,a.y)),9,dt);
        map.move(this.position, (a.x * Math.cos(this.yaw) - a.y * Math.sin(this.yaw)) / l * speed * dt, (-a.x * Math.sin(this.yaw) - a.y * Math.cos(this.yaw)) / l * speed * dt);
        if(input.jump&&this.ground){const dir=new T.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),probe=this.position.clone().addScaledVector(dir,1.1);const cover=map.obstacles.find(o=>Math.abs(probe.x-o.x)<o.w/2+.3&&Math.abs(probe.z-o.z)<o.d/2+.3&&o.h-this.position.y>.5&&o.h-this.position.y<1.5);const end=this.position.clone().addScaledVector(dir,3.3);if(cover&&!map.blocked(end.x,end.z,.4)&&Math.abs(map.groundAt(end.x,end.z)-this.position.y)<.5){const highWall=map.obstacles.some(o=>o.h-this.position.y>1.6&&[.5,1,1.5,2,2.5,3].some(d=>Math.abs(this.position.x+dir.x*d-o.x)<o.w/2+.4&&Math.abs(this.position.z+dir.z*d-o.z)<o.d/2+.4));if(!highWall){this.vaultStart.copy(this.position);this.vaultEnd.copy(end);this.vaultLeft=.48;}}}
        if(this.vaultLeft>0){this.vaultLeft=Math.max(0,this.vaultLeft-dt);const t=1-this.vaultLeft/.48;this.position.copy(this.vaultStart).lerp(this.vaultEnd,t);this.position.y+=Math.sin(t*Math.PI)*1.6;camera.position.copy(this.position).add(new T.Vector3(0,this.height,0));camera.rotation.set(this.pitch,this.yaw,0,'YXZ');input.jump=false;return;}
        if (input.jump && this.ground) {
            this.vy = 5;
            this.ground = false;
        }
        input.jump = false;
        if(this.position.y>map.groundAt(this.position.x,this.position.z)+.05)this.ground=false;
        this.vy -= 14 * dt;
        this.position.y += this.vy * dt;
        if (this.position.y <= map.groundAt(this.position.x,this.position.z)) {
            this.position.y = map.groundAt(this.position.x,this.position.z);
            this.vy = 0;
            this.ground = true;
        }
        this.height = T.MathUtils.damp(this.height, input.crouch ? 1.03 : 1.65, 12, dt);
        this.walk += dt * (this.sprinting?13:9)*this.moveIntensity;
        this.recoil = T.MathUtils.damp(this.recoil, 0, 8, dt);
        camera.position.copy(this.position);
        camera.position.y += this.height + (this.ground ? Math.sin(this.walk) * .025*this.moveIntensity*(input.ads?.35:1) : 0);
        camera.rotation.set(this.pitch + this.recoil, this.yaw, 0, 'YXZ');
    }
}
