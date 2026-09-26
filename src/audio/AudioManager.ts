export class AudioManager {
    ctx: AudioContext | null = null;
    volume = .45;
    private noise: AudioBuffer | null = null;
    init() { const Constructor = window.AudioContext || (window as unknown as {
        webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext; if (!Constructor)
        return; if (!this.ctx) {
        this.ctx = new Constructor();
        this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * .25, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < d.length; i++)
            d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    } void this.ctx.resume().catch(() => { }); }
    play(kind: 'shot' | 'sniper' | 'enemy' | 'reload' | 'hit' | 'head' | 'kill' | 'ui' | 'step' | 'pickup') {
        const c = this.ctx;
        if (!c || c.state !== 'running' || this.volume === 0)
            return;
        const gain = c.createGain();
        gain.connect(c.destination);
        const gun = ['shot', 'sniper', 'enemy', 'step'].includes(kind), dur = kind === 'sniper' ? .23 : gun ? .09 : kind === 'reload' ? .17 : .08;
        gain.gain.setValueAtTime(this.volume * (kind === 'step' ? .09 : kind === 'enemy' ? .18 : gun ? .36 : .13), c.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, c.currentTime + dur);
        if (gun) {
            const src = c.createBufferSource();
            src.buffer = this.noise;
            const f = c.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = kind === 'step' ? 180 : kind === 'sniper' ? 850 : 1800;
            src.connect(f);
            f.connect(gain);
            src.start();
            src.stop(c.currentTime + dur);
        }
        else {
            const o = c.createOscillator();
            o.type = kind === 'reload' ? 'triangle' : 'sine';
            o.frequency.setValueAtTime(kind === 'head' ? 1100 : kind === 'kill' ? 750 : kind === 'hit' ? 450 : kind === 'pickup' ? 900 : 250, c.currentTime);
            o.frequency.exponentialRampToValueAtTime(kind === 'kill' ? 1200 : 120, c.currentTime + dur);
            o.connect(gain);
            o.start();
            o.stop(c.currentTime + dur);
        }
    }
}
