export class Spring {
  value:number
  target:number
  velocity:number
  stiffness:number
  damping:number

  constructor(value=0, stiffness=120, damping=20){
    this.value=value
    this.target=value
    this.velocity=0
    this.stiffness=stiffness
    this.damping=damping
  }

  setTarget(target:number){
    this.target=target
  }

  impulse(deltaVelocity:number){
    this.velocity+=deltaVelocity
  }

  step(dt:number){
    const safeDt=Math.min(dt,0.035)
    const acceleration=(this.target-this.value)*this.stiffness-this.velocity*this.damping
    this.velocity+=acceleration*safeDt
    this.value+=this.velocity*safeDt
    return this.value
  }
}

export const damp=(current:number,target:number,speed:number,dt:number)=>{
  const t=1-Math.exp(-speed*dt)
  return current+(target-current)*t
}
