import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, LION } from './config'
import { Spring, damp } from './motion'
import { createPaperNormal, createRoughness } from './textures'

function tube(points:Array<[number,number,number]>,radius:number,material:THREE.Material){
  const curve=new THREE.CatmullRomCurve3(points.map((p)=>new THREE.Vector3(...p)))
  return <mesh geometry={new THREE.TubeGeometry(curve,48,radius,8,false)} material={material} castShadow />
}

export function LionScene({
  pointer,
  drag,
  structure,
  impulse,
}:{
  pointer:{x:number;y:number}
  drag:{x:number;y:number}
  structure:boolean
  impulse:number
}){
  const root=useRef<THREE.Group>(null)
  const leftEye=useRef<THREE.Group>(null)
  const rightEye=useRef<THREE.Group>(null)
  const jaw=useRef<THREE.Group>(null)
  const leftBrow=useRef<THREE.Group>(null)
  const rightBrow=useRef<THREE.Group>(null)
  const leftEar=useRef<THREE.Group>(null)
  const rightEar=useRef<THREE.Group>(null)
  const lastImpulse=useRef(impulse)
  const headShock=useRef(new Spring(0,80,4.8))
  const jawSpring=useRef(new Spring(0,120,18))
  const browSpring=useRef(new Spring(0,180,20))
  const earSpring=useRef(new Spring(0,85,10))
  const idle=useRef(0)

  const materials=useMemo(()=>{
    const paperNormal=createPaperNormal()
    const paperRough=createRoughness(384,'paper')
    const lacquerRough=createRoughness(384,'lacquer')
    const goldRough=createRoughness(384,'gold')
    return {
      paper:new THREE.MeshPhysicalMaterial({
        color:COLORS.vermilion,roughness:.62,roughnessMap:paperRough,
        normalMap:paperNormal,normalScale:new THREE.Vector2(.18,.18),
        clearcoat:.07,clearcoatRoughness:.72,
      }),
      lacquer:new THREE.MeshPhysicalMaterial({
        color:COLORS.lacquer,roughness:.43,roughnessMap:lacquerRough,
        clearcoat:.28,clearcoatRoughness:.27,
      }),
      black:new THREE.MeshPhysicalMaterial({
        color:'#080706',roughness:.31,clearcoat:.55,clearcoatRoughness:.13,
      }),
      ivory:new THREE.MeshPhysicalMaterial({
        color:'#eee3c7',roughness:.48,sheen:.45,sheenColor:new THREE.Color('#ffe7bb'),
      }),
      teal:new THREE.MeshPhysicalMaterial({
        color:COLORS.teal,roughness:.52,clearcoat:.13,
      }),
      jade:new THREE.MeshPhysicalMaterial({
        color:COLORS.jade,roughness:.56,clearcoat:.1,
      }),
      gold:new THREE.MeshPhysicalMaterial({
        color:COLORS.gold,roughness:.31,roughnessMap:goldRough,metalness:.52,clearcoat:.12,
      }),
      fur:new THREE.MeshStandardMaterial({color:'#7d211d',roughness:.94,side:THREE.DoubleSide}),
      furDark:new THREE.MeshStandardMaterial({color:'#19110f',roughness:.97,side:THREE.DoubleSide}),
      bamboo:new THREE.MeshStandardMaterial({color:COLORS.bamboo,roughness:.8,transparent:true,opacity:.74}),
    }
  },[])

  const mane=useMemo(()=>{
    const items=[]
    for(let i=0;i<LION.maneCount;i++){
      const a=i/LION.maneCount*Math.PI*2
      const r=1.29+(i%5)*.014+Math.sin(i*.71)*.025
      items.push({
        x:Math.cos(a)*r,
        y:Math.sin(a)*.98+.1,
        z:.01+(i%4)*.016,
        rot:a-Math.PI/2,
        phase:(i*1.37)%6.28,
        scale:.78+(i%7)*.035,
        dark:i%6===0,
      })
    }
    return items
  },[])

  useFrame(({clock},dt)=>{
    if(impulse!==lastImpulse.current){
      lastImpulse.current=impulse
      headShock.current.impulse(.58)
      jawSpring.current.impulse(.35)
      browSpring.current.impulse(.24)
      earSpring.current.impulse(.25)
    }
    headShock.current.setTarget(0)
    jawSpring.current.setTarget(0)
    browSpring.current.setTarget(0)
    earSpring.current.setTarget(0)

    const sh=headShock.current.step(dt)
    const j=jawSpring.current.step(dt)
    const b=browSpring.current.step(dt)
    const e=earSpring.current.step(dt)
    idle.current=clock.elapsedTime

    if(root.current){
      root.current.rotation.y=damp(root.current.rotation.y,-.05+pointer.x*LION.headYaw+drag.x*.08+sh*.045,5.2,dt)
      root.current.rotation.x=damp(root.current.rotation.x,pointer.y*LION.headPitch+drag.y*.035-sh*.028,5.2,dt)
      root.current.position.y=.12+Math.sin(clock.elapsedTime*.78)*.008+Math.abs(sh)*.045
    }
    const eyeYaw=pointer.x*LION.eyeYaw+drag.x*.07
    const eyePitch=-pointer.y*LION.eyePitch-drag.y*.025
    if(leftEye.current){leftEye.current.rotation.y=eyeYaw;leftEye.current.rotation.x=eyePitch}
    if(rightEye.current){rightEye.current.rotation.y=eyeYaw;rightEye.current.rotation.x=eyePitch}
    if(jaw.current)jaw.current.rotation.x=.035+j*.34
    if(leftBrow.current)leftBrow.current.rotation.z=.12+b*.22
    if(rightBrow.current)rightBrow.current.rotation.z=-.12-b*.22
    if(leftEar.current)leftEar.current.rotation.z=-.08-e*.24
    if(rightEar.current)rightEar.current.rotation.z=.08+e*.24
  })

  return <group ref={root} position={[1.35,.12,0]}>
    {structure ? <Structure material={materials.bamboo}/> : <>
      <group>
        {mane.map((m,i)=><group key={i} position={[m.x,m.y,m.z]} rotation={[0,0,m.rot+Math.sin(idle.current*1.1+m.phase)*.016]}>
          <mesh scale={[.065*m.scale,.34*m.scale,.065]} material={m.dark?materials.furDark:materials.fur}>
            <coneGeometry args={[1,1,5]}/>
          </mesh>
        </group>)}
      </group>

      <mesh castShadow material={materials.paper} scale={[1.33,1.07,.64]} position={[0,.12,.02]}>
        <sphereGeometry args={[1,96,72]}/>
      </mesh>
      <mesh castShadow material={materials.lacquer} scale={[1.04,.75,.33]} position={[0,.52,.58]}>
        <sphereGeometry args={[1,72,54]}/>
      </mesh>

      {[-1,1].map((side)=><mesh key={side} castShadow material={materials.paper}
        scale={[.58,.43,.27]} position={[side*.67,-.21,.66]} rotation={[0,0,side*.13]}>
        <sphereGeometry args={[1,52,38]}/>
      </mesh>)}

      <mesh material={materials.ivory} scale={[.72,.31,.25]} position={[0,-.41,.85]}>
        <sphereGeometry args={[1,56,36]}/>
      </mesh>
      <mesh material={materials.black} scale={[.27,.19,.19]} position={[0,-.16,1.07]}>
        <sphereGeometry args={[1,42,30]}/>
      </mesh>

      <group ref={jaw} position={[0,-.58,.68]} rotation={[.035,0,0]}>
        <mesh castShadow material={materials.lacquer} scale={[.74,.29,.3]}>
          <sphereGeometry args={[1,56,32]}/>
        </mesh>
        <mesh material={materials.ivory} scale={[.5,.085,.13]} position={[0,.02,.29]}>
          <sphereGeometry args={[1,32,20]}/>
        </mesh>
      </group>

      <Eye side={-1} eyeRef={leftEye} materials={materials}/>
      <Eye side={1} eyeRef={rightEye} materials={materials}/>
      <Brow side={-1} browRef={leftBrow} materials={materials}/>
      <Brow side={1} browRef={rightBrow} materials={materials}/>
      <Ear side={-1} earRef={leftEar} materials={materials}/>
      <Ear side={1} earRef={rightEar} materials={materials}/>

      <mesh material={materials.gold} position={[0,1.39,.18]}>
        <coneGeometry args={[.23,.79,7]}/>
      </mesh>
      <mesh material={materials.ivory} position={[0,1.38,.34]}>
        <coneGeometry args={[.085,.55,7]}/>
      </mesh>

      <mesh material={materials.teal} position={[0,.95,.84]} rotation={[0,0,Math.PI/4]}>
        <boxGeometry args={[.42,.42,.12]}/>
      </mesh>
      <mesh material={materials.gold} position={[0,.95,.94]} rotation={[0,0,Math.PI/4]}>
        <boxGeometry args={[.18,.18,.08]}/>
      </mesh>

      {tube([[-.92,.08,.84],[-1.01,-.13,.7],[-.78,-.49,.7]],.027,materials.gold)}
      {tube([[.92,.08,.84],[1.01,-.13,.7],[.78,-.49,.7]],.027,materials.gold)}
      {tube([[-.84,.69,.75],[-.52,.92,.84],[-.14,.72,.9]],.024,materials.gold)}
      {tube([[.84,.69,.75],[.52,.92,.84],[.14,.72,.9]],.024,materials.gold)}
      {tube([[-.8,-.17,.86],[-.62,-.3,.9],[-.4,-.21,.91]],.035,materials.teal)}
      {tube([[.8,-.17,.86],[.62,-.3,.9],[.4,-.21,.91]],.035,materials.teal)}
    </>}
  </group>
}

function Eye({side,eyeRef,materials}:any){
  return <group ref={eyeRef} position={[side*.53,.29,.84]}>
    <mesh material={materials.ivory} scale={[1.13,.88,.58]}>
      <sphereGeometry args={[.31,48,34]}/>
    </mesh>
    <mesh position={[0,0,.275]} material={materials.teal}>
      <sphereGeometry args={[.145,40,30]}/>
    </mesh>
    <mesh position={[0,0,.36]} material={materials.black}>
      <sphereGeometry args={[.068,32,24]}/>
    </mesh>
    <mesh position={[-.047,.056,.421]}>
      <sphereGeometry args={[.028,16,12]}/>
      <meshBasicMaterial color="#fff7df"/>
    </mesh>
    <mesh position={[0,.04,.27]} rotation={[0,0,side*.08]} material={materials.gold}>
      <torusGeometry args={[.315,.04,12,72,Math.PI]}/>
    </mesh>
  </group>
}

function Brow({side,browRef,materials}:any){
  return <group ref={browRef} position={[side*.53,.68,.83]} rotation={[0,0,side*.12]}>
    {tube([[side*-.38,0,0],[0,.16,.05],[side*.38,.01,0]],.065,materials.furDark)}
    {tube([[side*-.34,.02,.04],[0,.18,.07],[side*.34,.02,.04]],.018,materials.gold)}
  </group>
}

function Ear({side,earRef,materials}:any){
  return <group ref={earRef} position={[side*1.05,.45,.1]} rotation={[0,0,side*-.08]}>
    <mesh material={materials.paper} scale={[.42,.52,.19]} rotation={[0,0,side*.12]}>
      <sphereGeometry args={[1,36,26,0,Math.PI*2,0,Math.PI*.64]}/>
    </mesh>
    <mesh material={materials.teal} scale={[.23,.3,.09]} position={[0,.02,.17]}>
      <sphereGeometry args={[1,28,20]}/>
    </mesh>
  </group>
}

function Structure({material}:{material:THREE.Material}){
  const ribs=[]
  for(let i=0;i<10;i++){
    const phase=i/10*Math.PI*2
    const pts:Array<[number,number,number]>=[]
    for(let j=0;j<=18;j++){
      const t=j/18*Math.PI*2
      pts.push([Math.cos(t)*1.25,Math.sin(t)*.94+.08,Math.sin(t*2+phase)*.17-.04])
    }
    ribs.push(<group key={'rib'+i}>{tube(pts,.012,material)}</group>)
  }
  for(let i=0;i<14;i++){
    const a=i/14*Math.PI*2
    ribs.push(<group key={'spoke'+i}>{tube([[0,.08,-.12],[Math.cos(a)*1.2,Math.sin(a)*.88+.08,-.02]],.014,material)}</group>)
  }
  return <group>{ribs}</group>
}
