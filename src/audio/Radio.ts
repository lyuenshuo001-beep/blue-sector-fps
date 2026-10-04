import { AudioManager } from './AudioManager';
export class Radio {
    cache=new Map<string,Promise<AudioBuffer>>();source:AudioBufferSourceNode|null=null;gain:GainNode|null=null;epoch=0;last=0;priority=0;busy=false;
    constructor(readonly audio:AudioManager){document.querySelector('#hud')!.insertAdjacentHTML('beforeend','<div id="radio-caption"></div>');}
    say(key:string,text:string,priority=1){
        const ctx=this.audio.ctx;if(!ctx)return;
        if(priority<2&&(this.busy||performance.now()-this.last<5000))return;
        if(this.busy&&priority<this.priority)return;
        this.stop();this.busy=true;this.priority=priority;this.last=performance.now();const epoch=this.epoch;
        document.getElementById('radio-caption')!.textContent=text;
        let clip=this.cache.get(key);if(!clip){clip=fetch(import.meta.env.BASE_URL+'assets/voice/'+key+'.wav').then(r=>{if(!r.ok)throw Error('Voice unavailable');return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b));this.cache.set(key,clip);}
        void clip.then(buffer=>{if(epoch!==this.epoch)return;const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1600;filter.Q.value=.45;gain.gain.value=this.audio.volume*this.audio.voiceVolume;source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);this.source=source;this.gain=gain;source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();if(this.source===source){this.source=null;this.busy=false;document.getElementById('radio-caption')!.textContent='';}};}).catch(()=>{this.busy=false;if(epoch===this.epoch)setTimeout(()=>{if(epoch===this.epoch)document.getElementById('radio-caption')!.textContent='';},6000);});
    }
    stop(){this.busy=false;this.epoch++;this.source?.stop();this.source=null;this.gain=null;document.getElementById('radio-caption')!.textContent='';}
    volume(){if(this.gain)this.gain.gain.value=this.audio.volume*this.audio.voiceVolume;}
}
