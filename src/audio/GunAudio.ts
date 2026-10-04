/** Original layered synthesis: muzzle impulse, bolt, low body and environment tail.
 * No sampled commercial game or real recording is embedded. */
export class GunAudio {
    buffers:AudioBuffer[]=[];voices=new Set<AudioScheduledSourceNode>();
    constructor(readonly ctx:AudioContext){for(let v=0;v<4;v++){const b=ctx.createBuffer(1,ctx.sampleRate*.9,ctx.sampleRate),d=b.getChannelData(0);let brown=0;for(let i=0;i<d.length;i++){const n=Math.random()*2-1;brown=(brown+n*.08)/1.02;d[i]=n*.7+brown*.8;}this.buffers.push(b);}}
    play(id:string,category:string,volume:number,suppressed:boolean,indoor:boolean){
        const c=this.ctx,t=c.currentTime,heavy=id==='AKM'||id==='AK-12',sniper=category==='SNIPER',lmg=category==='LMG',shotgun=category==='SHOTGUN';
        const hash=[...id].reduce((n,c)=>n+c.charCodeAt(0),0),tone=.9+(hash%23)/100,smg=category==='SMG';
        const body=sniper?65:lmg?85:heavy?95:shotgun?72:smg?155:125;
        const tail=sniper?.65:shotgun?.35:lmg?.22:heavy?.19:smg?.095:.13;
        const amp=volume*(suppressed?.26:1)*.34;
        const noise=(delay:number,duration:number,frequency:number,level:number,high=false)=>{const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();src.buffer=this.buffers[Math.floor(Math.random()*4)];src.playbackRate.value=.92+Math.random()*.16;filter.type=high?'highpass':'lowpass';filter.frequency.value=frequency;gain.gain.setValueAtTime(Math.max(.001,amp*level),t+delay);gain.gain.exponentialRampToValueAtTime(.001,t+delay+duration);src.connect(filter);filter.connect(gain);gain.connect(c.destination);src.start(t+delay);src.stop(t+delay+duration);this.voices.add(src);src.onended=()=>{this.voices.delete(src);src.disconnect();filter.disconnect();gain.disconnect();};};
        noise(0,.025,suppressed?1400:heavy?2800:5500*tone,1.5,!suppressed);
        noise(.009,tail,suppressed?700:heavy?1100:2300*tone,1);
        noise(.037,.038,4200,.2,true); // mechanical bolt action
        noise(indoor?.055:.12,tail+.15,indoor?1900:750,indoor?.27:.14);
        const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(body,t);o.frequency.exponentialRampToValueAtTime(body*.6,t+.09);g.gain.setValueAtTime(amp*(sniper?1.7:1),t);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(c.destination);o.start();o.stop(t+.14);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};
    }
    stop(){for(const source of this.voices){try{source.stop();}catch{}}this.voices.clear();}
}
