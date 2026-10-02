export class InputManager {
    keys = new Set<string>();
    move = { x: 0, y: 0 };
    look = { x: 0, y: 0 };
    fire = false;
    ads = false;
    crouch = false;
    jump = false;
    reload = false;
    switchTo = -1;
    cycle = false;
    pause = false;
    sprint=false;skill=-1;
    enabled = false;
    sensitivity = 1;
    private joyId = -1;
    private lookId = -1;
    private last = { x: 0, y: 0 };
    private fireIds = new Set<number>();
    private pressed = false;
    constructor(readonly canvas: HTMLCanvasElement) {
        addEventListener('keydown', e => { if (!this.enabled)
            return; if (['Space', 'ControlLeft', 'ControlRight', 'Tab'].includes(e.code))
            e.preventDefault(); this.keys.add(e.code); if (e.repeat)
            return; if(['KeyQ','KeyE','KeyX'].includes(e.code))this.skill=['KeyQ','KeyE','KeyX'].indexOf(e.code);
            if (e.code === 'KeyR')
            this.reload = true; if (e.code === 'Space')
            this.jump = true; if (e.code === 'KeyC' || e.code.startsWith('Control'))
            this.crouch = !this.crouch; if (/^Digit[1-4]$/.test(e.code))
            this.switchTo = Number(e.code.slice(-1)) - 1; if (e.code === 'Escape')
            this.pause = true; });
        addEventListener('keyup', e => this.keys.delete(e.code));
        canvas.addEventListener('mousedown', e => { if (!this.enabled)
            return; if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock?.();
            return;
        } if (e.button === 0) {
            this.fire = true;
            this.pressed = true;
        } if (e.button === 2)
            this.ads = true; });
        addEventListener('mouseup', e => { if (e.button === 0)
            this.fire = false; if (e.button === 2)
            this.ads = false; });
        addEventListener('mousemove', e => { if (this.enabled && document.pointerLockElement === canvas) {
            this.look.x += e.movementX;
            this.look.y += e.movementY;
        } });
        addEventListener('contextmenu', e => e.preventDefault());
        addEventListener('blur', () => this.reset());
        document.addEventListener('visibilitychange', () => { if (document.hidden)
            this.reset(); });
        document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && this.enabled && !matchMedia('(pointer:coarse)').matches)
            this.pause = true; });
        document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
        const joy = document.querySelector<HTMLElement>('#joystick')!, knob = document.querySelector<HTMLElement>('#knob')!;
        const update = (e: PointerEvent) => { const r = joy.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width * .36), y = (e.clientY - r.top - r.height / 2) / (r.height * .36), l = Math.max(1, Math.hypot(x, y)); this.move = { x: x / l, y: y / l }; knob.style.transform = `translate(${this.move.x * 32}px,${this.move.y * 32}px)`; };
        joy.addEventListener('pointerdown', e => { if (!this.enabled || this.joyId !== -1)
            return; e.preventDefault(); this.joyId = e.pointerId; joy.setPointerCapture(e.pointerId); update(e); });
        joy.addEventListener('pointermove', e => { if (e.pointerId === this.joyId)
            update(e); });
        const releaseJoy = (e: PointerEvent) => { if (e.pointerId === this.joyId) {
            this.joyId = -1;
            this.move = { x: 0, y: 0 };
            knob.style.transform = '';
        } };
        for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture'])
            joy.addEventListener(ev, releaseJoy as EventListener);
        const zone = document.querySelector<HTMLElement>('#look-zone')!;
        zone.addEventListener('pointerdown', e => { if (!this.enabled || this.lookId !== -1)
            return; this.lookId = e.pointerId; this.last = { x: e.clientX, y: e.clientY }; zone.setPointerCapture(e.pointerId); });
        zone.addEventListener('pointermove', e => { if (e.pointerId === this.lookId) {
            this.look.x += e.clientX - this.last.x;
            this.look.y += e.clientY - this.last.y;
            this.last = { x: e.clientX, y: e.clientY };
        } });
        const releaseLook = (e: PointerEvent) => { if (e.pointerId === this.lookId)
            this.lookId = -1; };
        for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture'])
            zone.addEventListener(ev, releaseLook as EventListener);
        document.querySelectorAll<HTMLElement>('[data-action]').forEach(b => { b.addEventListener('pointerdown', e => { if (!this.enabled)
            return; e.preventDefault(); b.setPointerCapture(e.pointerId); const a = b.dataset.action; if (a === 'fire') {
            this.fireIds.add(e.pointerId);
            this.fire = true;
            this.pressed = true;
        }
        else if(a==='sprint')this.sprint=!this.sprint;
                else if(a?.startsWith('skill'))this.skill=Number(a.slice(-1));
                else if (a === 'ads')
            this.ads = !this.ads;
        else if (a === 'crouch')
            this.crouch = !this.crouch;
        else if (a === 'jump')
            this.jump = true;
        else if (a === 'reload')
            this.reload = true;
        else if (a === 'switch')
            this.cycle = true; b.classList.add('held'); }); const release = (e: PointerEvent) => { this.fireIds.delete(e.pointerId); if (b.dataset.action === 'fire' && this.fireIds.size === 0)
            this.fire = false; b.classList.remove('held'); }; for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture'])
            b.addEventListener(ev, release as EventListener); });
    }
    consumePress() { const p = this.pressed; this.pressed = false; return p; }
    reset() { this.keys.clear();this.skill=-1;this.sprint=false; this.move = { x: 0, y: 0 }; this.look = { x: 0, y: 0 }; this.fire = false; this.ads = false; this.pressed = false; this.jump = false; this.reload = false; this.cycle = false; this.switchTo = -1; this.joyId = -1; this.lookId = -1; this.fireIds.clear(); document.querySelector<HTMLElement>('#knob')!.style.transform = ''; }
    axes() { return { x: Math.max(-1, Math.min(1, this.move.x + (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0))), y: Math.max(-1, Math.min(1, -this.move.y + (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0))) }; }
}
