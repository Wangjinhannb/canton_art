class WanxiangAudio {
  private ctx:AudioContext|null=null
  private master:GainNode|null=null
  enabled=false

  async ensure(){
    if(!this.ctx){
      this.ctx=new AudioContext()
      this.master=this.ctx.createGain()
      this.master.gain.value=.46
      this.master.connect(this.ctx.destination)
    }
    if(this.ctx.state==='suspended')await this.ctx.resume()
    return this.ctx
  }

  async drum(intensity=.7){
    if(!this.enabled)return
    const ctx=await this.ensure()
    const now=ctx.currentTime

    const body=ctx.createOscillator()
    const bodyGain=ctx.createGain()
    body.type='sine'
    body.frequency.setValueAtTime(148,now)
    body.frequency.exponentialRampToValueAtTime(49,now+.24)
    bodyGain.gain.setValueAtTime(.0001,now)
    bodyGain.gain.exponentialRampToValueAtTime(.62*intensity,now+.007)
    bodyGain.gain.exponentialRampToValueAtTime(.0001,now+.7)
    body.connect(bodyGain).connect(this.master!)
    body.start(now)
    body.stop(now+.72)

    const length=Math.floor(ctx.sampleRate*.18)
    const buffer=ctx.createBuffer(1,length,ctx.sampleRate)
    const data=buffer.getChannelData(0)
    for(let i=0;i<length;i++){
      data[i]=(Math.random()*2-1)*Math.exp(-i/(length*.13))
    }
    const source=ctx.createBufferSource()
    const band=ctx.createBiquadFilter()
    const gain=ctx.createGain()
    source.buffer=buffer
    band.type='bandpass'
    band.frequency.value=430
    band.Q.value=.9
    gain.gain.value=.11*intensity
    source.connect(band).connect(gain).connect(this.master!)
    source.start(now)
  }
}

export const audioEngine=new WanxiangAudio()
