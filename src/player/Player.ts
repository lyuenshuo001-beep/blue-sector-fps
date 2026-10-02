import * as T from 'three';
import { InputManager } from '../core/InputManager';
import { BlueRoomMap } from '../world/BlueRoomMap';
export class Player {
    position = new T.Vector3(0, 0, 27);
    hp = 100;
    yaw = 0;
    pitch = 0;
    height = 1.65;
    vy = 0;
    moving = false;
    ground = true;
    walk = 0;
    recoil = 0;
    reset() { this.position.set(0, 0, 27); this.hp = 100; this.yaw = 0; this.pitch = 0; this.height = 1.65; this.vy = 0; this.ground = true; this.recoil = 0; }
    update(dt: number, input: InputManager, map: BlueRoomMap, camera: T.PerspectiveCamera) {
        this.yaw -= input.look.x * .0024 * input.sensitivity * (input.ads ? .55 : 1);
        this.pitch = T.MathUtils.clamp(this.pitch - input.look.y * .0024 * input.sensitivity * (input.ads ? .55 : 1), -1.4, 1.4);
        input.look = { x: 0, y: 0 };
        const a = input.axes(), l = Math.max(1, Math.hypot(a.x, a.y)), speed = input.crouch ? 2.3 : input.ads ? 3 : 5;
        this.moving = Math.hypot(a.x, a.y) > .08;
        map.move(this.position, (a.x * Math.cos(this.yaw) - a.y * Math.sin(this.yaw)) / l * speed * dt, (-a.x * Math.sin(this.yaw) - a.y * Math.cos(this.yaw)) / l * speed * dt);
        if (input.jump && this.ground) {
            this.vy = 5;
            this.ground = false;
        }
        input.jump = false;
        this.vy -= 14 * dt;
        this.position.y += this.vy * dt;
        if (this.position.y <= map.groundAt(this.position.x,this.position.z)) {
            this.position.y = map.groundAt(this.position.x,this.position.z);
            this.vy = 0;
            this.ground = true;
        }
        this.height = T.MathUtils.damp(this.height, input.crouch ? 1.03 : 1.65, 12, dt);
        this.walk += this.moving ? dt * 10 : 0;
        this.recoil = T.MathUtils.damp(this.recoil, 0, 8, dt);
        camera.position.copy(this.position);
        camera.position.y += this.height + (this.moving && this.ground ? Math.sin(this.walk) * .035 : 0);
        camera.rotation.set(this.pitch + this.recoil, this.yaw, 0, 'YXZ');
    }
}

