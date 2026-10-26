import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, LION } from './config'
import { Spring, damp } from './motion'
import { createPaperNormal, createRoughness } from './textures'

type MaterialSet = {
  paper: THREE.MeshPhysicalMaterial
  lacquer: THREE.MeshPhysicalMaterial
  lacquerDark: THREE.MeshPhysicalMaterial
  black: THREE.MeshPhysicalMaterial
  ivory: THREE.MeshPhysicalMaterial
  teal: THREE.MeshPhysicalMaterial
  jade: THREE.MeshPhysicalMaterial
  gold: THREE.MeshPhysicalMaterial
  fur: THREE.MeshStandardMaterial
  furDark: THREE.MeshStandardMaterial
  bamboo: THREE.MeshStandardMaterial
  wood: THREE.MeshStandardMaterial
}

const faceOutline: Array<[number, number]> = [
  [-1.30,.48],[-1.18,.88],[-.82,1.14],[-.38,1.30],[0,1.35],
  [.38,1.30],[.82,1.14],[1.18,.88],[1.30,.48],[1.26,.08],
  [1.10,-.38],[.78,-.72],[.34,-.91],[0,-.96],[-.34,-.91],
  [-.78,-.72],[-1.10,-.38],[-1.26,.08],
]

const cheekShape: Array<[number, number]> = [
  [-.48,.18],[-.32,.42],[0,.50],[.34,.40],[.48,.16],[.42,-.20],
  [.18,-.40],[-.12,-.42],[-.40,-.18],
]

const mouthShape: Array<[number, number]> = [
  [-.82,.12],[-.50,.28],[0,.34],[.50,.28],[.82,.12],[.72,-.22],
  [.38,-.36],[0,-.42],[-.38,-.36],[-.72,-.22],
]

function shapeFrom(points:Array<[number,number]>){
  const shape=new THREE.Shape()
  points.forEach(([x,y],i)=>i===0?shape.moveTo(x,y):shape.lineTo(x,y))
  shape.closePath()
  return shape
}

function FacePlate({
  points,
  position,
  rotation=[0,0,0],
  scale=[1,1,1],
  depth=.24,
  material,
  bevel=.05,
}:{
  points:Array<[number,number]>
  position:[number,number,number]
  rotation?:[number,number,number]
  scale?:[number,number,number]
  depth?:number
  material:THREE.Material
  bevel?:number
}){
  const shape=useMemo(()=>shapeFrom(points),[points])
  const settings=useMemo(()=>({
    depth,
    bevelEnabled:true,
    bevelSegments:4,
    steps:1,
    bevelSize:bevel,
    bevelThickness:bevel*.7,
  }),[depth,bevel])
  return <mesh castShadow receiveShadow position={position} rotation={rotation} scale={scale} material={material}>
    <extrudeGeometry args={[shape,settings]}/>
  </mesh>
}

function Tube({
  points,
  radius,
  material,
}:{
  points:Array<[number,number,number]>
  radius:number
  material:THREE.Material
}){
  const geometry=useMemo(()=>{
    const curve=new THREE.CatmullRomCurve3(points.map((p)=>new THREE.Vector3(...p)),false,'catmullrom',.45)
    return new THREE.TubeGeometry(curve,52,radius,10,false)
  },[points,radius])
  return <mesh geometry={geometry} material={material} castShadow/>
}

function Eye({
  side,
  eyeRef,
  materials,
}:{
  side:-1|1
  eyeRef:React.RefObject<THREE.Group|null>
  materials:MaterialSet
}){
  return <group ref={eyeRef} position={[side*.56,.34,.50]} rotation={[0,0,side*.07]}>
    <mesh material={materials.gold} scale={[1.34,.92,.20]}>
      <sphereGeometry args={[.34,56,40]}/>
    </mesh>
    <mesh position={[0,0,.085]} material={materials.ivory} scale={[1.15,.78,.46]}>
      <sphereGeometry args={[.31,56,40]}/>
    </mesh>
    <mesh position={[0,0,.25]} material={materials.teal} scale={[1,.92,.48]}>
      <sphereGeometry args={[.13,40,30]}/>
    </mesh>
    <mesh position={[0,0,.315]} material={materials.black}>
      <sphereGeometry args={[.056,32,24]}/>
    </mesh>
    <mesh position={[-.038,.05,.36]}>
      <sphereGeometry args={[.021,16,12]}/>
      <meshBasicMaterial color="#fff6dc"/>
    </mesh>
  </group>
}

function Brow({
  side,
  browRef,
  materials,
}:{
  side:-1|1
  browRef:React.RefObject<THREE.Group|null>
  materials:MaterialSet
}){
  return <group ref={browRef} position={[side*.55,.70,.48]} rotation={[0,0,side*.14]}>
    <Tube
      points={[[side*-.36,-.01,0],[0,.16,.05],[side*.36,.01,0]]}
      radius={.070}
      material={materials.furDark}
    />
    <Tube
      points={[[side*-.33,.03,.055],[0,.18,.08],[side*.33,.03,.055]]}
      radius={.019}
      material={materials.gold}
    />
  </group>
}

function Ear({
  side,
  earRef,
  materials,
}:{
  side:-1|1
  earRef:React.RefObject<THREE.Group|null>
  materials:MaterialSet
}){
  const shape:Array<[number,number]> = [[0,.47],[.36,.22],[.43,-.18],[.10,-.42],[-.28,-.30],[-.38,.08]]
  return <group ref={earRef} position={[side*1.22,.42,.02]} rotation={[0,side*.16,side*-.18]} scale={[side,1,1]}>
    <FacePlate points={shape} position={[0,0,0]} depth={.15} bevel={.04} material={materials.lacquer}/>
    <FacePlate points={shape.map(([x,y])=>[x*.60,y*.60])} position={[0,0,.16]} depth={.045} bevel={.02} material={materials.teal}/>
    <mesh position={[.03,.03,.23]} material={materials.gold}>
      <sphereGeometry args={[.075,24,18]}/>
    </mesh>
  </group>
}

function Mane({materials}:{materials:MaterialSet}){
  const group=useRef<THREE.Group>(null)
  const pieces=useMemo(()=>{
    const items:Array<{x:number;y:number;z:number;r:number;s:number;dark:boolean;gold:boolean;phase:number}>=[]
    const segments=118
    for(let i=0;i<segments;i++){
      const t=i/(segments-1)
      const angle=THREE.MathUtils.lerp(Math.PI*.84,Math.PI*2.16,t)
      const x=Math.cos(angle)*1.36
      const y=Math.sin(angle)*1.00+.10
      const edgeBoost=Math.sin(t*Math.PI)
      items.push({
        x,y,z:-.05+(i%4)*.012,
        r:angle-Math.PI/2,
        s:.70+edgeBoost*.28+(i%5)*.025,
        dark:i%7===0,
        gold:i%19===0,
        phase:(i*.67)%6.28,
      })
    }
    return items
  },[])
  useFrame(({clock})=>{
    if(!group.current)return
    group.current.rotation.z=Math.sin(clock.elapsedTime*.52)*.006
  })
  return <group ref={group} position={[0,0,-.04]}>
    {pieces.map((p,i)=><group key={i} position={[p.x,p.y,p.z]} rotation={[0,0,p.r]}>
      <mesh material={p.gold?materials.gold:p.dark?materials.furDark:materials.fur} scale={[.052*p.s,.30*p.s,.045]}>
        <coneGeometry args={[1,1,5]}/>
      </mesh>
    </group>)}
  </group>
}

function PaintedOrnaments({materials}:{materials:MaterialSet}){
  const rosettes=[
    [-.90,.03,.42],[.90,.03,.42],[-.74,-.36,.42],[.74,-.36,.42],
    [-.23,.93,.43],[.23,.93,.43],
  ] as Array<[number,number,number]>
  return <group>
    <Tube points={[[-.95,.16,.43],[-.83,-.12,.48],[-.60,-.42,.45]]} radius={.025} material={materials.gold}/>
    <Tube points={[[.95,.16,.43],[.83,-.12,.48],[.60,-.42,.45]]} radius={.025} material={materials.gold}/>
    <Tube points={[[-.90,.68,.42],[-.60,.94,.49],[-.20,.78,.50]]} radius={.026} material={materials.gold}/>
    <Tube points={[[.90,.68,.42],[.60,.94,.49],[.20,.78,.50]]} radius={.026} material={materials.gold}/>
    <Tube points={[[-.78,-.10,.47],[-.57,-.26,.52],[-.35,-.16,.51]]} radius={.034} material={materials.teal}/>
    <Tube points={[[.78,-.10,.47],[.57,-.26,.52],[.35,-.16,.51]]} radius={.034} material={materials.teal}/>
    {rosettes.map((p,i)=><group key={i} position={p}>
      <mesh material={i%2?materials.jade:materials.gold}>
        <sphereGeometry args={[.075,22,16]}/>
      </mesh>
      <mesh position={[0,0,.055]} material={materials.lacquerDark}>
        <sphereGeometry args={[.028,16,12]}/>
      </mesh>
    </group>)}
  </group>
}

function Structure({materials}:{materials:MaterialSet}){
  const ribs=useMemo(()=>{
    const out:Array<Array<[number,number,number]>>=[]
    for(let i=0;i<12;i++){
      const phase=i/12*Math.PI*2
      const pts:Array<[number,number,number]>=[]
      for(let j=0;j<=22;j++){
        const t=j/22*Math.PI*2
        pts.push([
          Math.cos(t)*1.24,
          Math.sin(t)*.92+.08,
          Math.sin(t*2+phase)*.14-.08,
        ])
      }
      out.push(pts)
    }
    return out
  },[])
  return <group position={[0,0,.02]}>
    {ribs.map((p,i)=><Tube key={'rib'+i} points={p} radius={.012} material={materials.bamboo}/>)}
    {Array.from({length:16},(_,i)=>{
      const a=i/16*Math.PI*2
      return <Tube
        key={'spoke'+i}
        points={[[0,.08,-.13],[Math.cos(a)*1.18,Math.sin(a)*.86+.08,-.03]]}
        radius={.013}
        material={materials.bamboo}
      />
    })}
    <Tube points={[[-.70,.34,.0],[-.35,.62,.1],[0,.72,.14],[.35,.62,.1],[.70,.34,.0]]} radius={.017} material={materials.bamboo}/>
  </group>
}

function Workshop({materials}:{materials:MaterialSet}){
  const scraps=useMemo(()=>[
    [-2.3,-2.04,-.1,-.10],[3.0,-2.03,-.4,.12],[2.35,-2.02,.35,-.08],[-1.55,-2.03,.55,.06],
  ] as Array<[number,number,number,number]>,[])
  return <group>
    <mesh receiveShadow position={[.9,-2.23,-.35]} rotation={[-Math.PI/2,0,0]} material={materials.wood}>
      <planeGeometry args={[11,7]}/>
    </mesh>
    <mesh position={[.5,1.8,-2.8]} material={materials.wood}>
      <boxGeometry args={[11,.18,.26]}/>
    </mesh>
    <mesh position={[-3.8,.2,-2.5]} material={materials.wood}>
      <boxGeometry args={[.16,4.7,.22]}/>
    </mesh>
    <mesh position={[4.4,.2,-2.5]} material={materials.wood}>
      <boxGeometry args={[.16,4.7,.22]}/>
    </mesh>
    {scraps.map(([x,y,z,r],i)=><mesh key={i} position={[x,y,z]} rotation={[-Math.PI/2,r,0]}>
      <planeGeometry args={[1.0+i*.12,.48+i*.04]}/>
      <meshStandardMaterial color={i%2?'#ccbfa8':'#b9aa91'} roughness={.9} side={THREE.DoubleSide}/>
    </mesh>)}
    {[-1,0,1].map((i)=><group key={i} position={[2.85+i*.22,-1.92,.55-i*.14]} rotation={[0,.1+i*.06,.25+i*.08]}>
      <mesh material={materials.bamboo}>
        <cylinderGeometry args={[.025,.025,1.45,12]}/>
      </mesh>
      <mesh position={[0,.75,0]}>
        <coneGeometry args={[.055,.26,12]}/>
        <meshStandardMaterial color="#291b14" roughness={.95}/>
      </mesh>
    </group>)}
  </group>
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
  const headShock=useRef(new Spring(0,78,5.2))
  const jawSpring=useRef(new Spring(0,122,18))
  const browSpring=useRef(new Spring(0,186,21))
  const earSpring=useRef(new Spring(0,82,10))

  const materials=useMemo<MaterialSet>(()=>{
    const paperNormal=createPaperNormal()
    const paperRough=createRoughness(384,'paper')
    const lacquerRough=createRoughness(384,'lacquer')
    const goldRough=createRoughness(384,'gold')
    return {
      paper:new THREE.MeshPhysicalMaterial({
        color:COLORS.vermilion,roughness:.67,roughnessMap:paperRough,
        normalMap:paperNormal,normalScale:new THREE.Vector2(.21,.21),
        clearcoat:.045,clearcoatRoughness:.76,
      }),
      lacquer:new THREE.MeshPhysicalMaterial({
        color:COLORS.lacquer,roughness:.45,roughnessMap:lacquerRough,
        clearcoat:.27,clearcoatRoughness:.28,
      }),
      lacquerDark:new THREE.MeshPhysicalMaterial({
        color:COLORS.deepRed,roughness:.48,clearcoat:.16,clearcoatRoughness:.38,
      }),
      black:new THREE.MeshPhysicalMaterial({
        color:'#080706',roughness:.30,clearcoat:.62,clearcoatRoughness:.11,
      }),
      ivory:new THREE.MeshPhysicalMaterial({
        color:'#e8ddc5',roughness:.50,sheen:.42,sheenColor:new THREE.Color('#ffe4b0'),
      }),
      teal:new THREE.MeshPhysicalMaterial({color:COLORS.teal,roughness:.49,clearcoat:.16}),
      jade:new THREE.MeshPhysicalMaterial({color:COLORS.jade,roughness:.54,clearcoat:.12}),
      gold:new THREE.MeshPhysicalMaterial({
        color:COLORS.gold,roughness:.33,roughnessMap:goldRough,metalness:.56,clearcoat:.11,
      }),
      fur:new THREE.MeshStandardMaterial({color:'#7c211d',roughness:.95,side:THREE.DoubleSide}),
      furDark:new THREE.MeshStandardMaterial({color:'#18110f',roughness:.98,side:THREE.DoubleSide}),
      bamboo:new THREE.MeshStandardMaterial({color:COLORS.bamboo,roughness:.82,transparent:true,opacity:.77}),
      wood:new THREE.MeshStandardMaterial({color:'#21170f',roughness:.88,metalness:.01}),
    }
  },[])

  useFrame(({clock},dt)=>{
    if(impulse!==lastImpulse.current){
      lastImpulse.current=impulse
      headShock.current.impulse(.58)
      jawSpring.current.impulse(.34)
      browSpring.current.impulse(.23)
      earSpring.current.impulse(.24)
    }
    headShock.current.setTarget(0)
    jawSpring.current.setTarget(0)
    browSpring.current.setTarget(0)
    earSpring.current.setTarget(0)

    const sh=headShock.current.step(dt)
    const j=jawSpring.current.step(dt)
    const b=browSpring.current.step(dt)
    const e=earSpring.current.step(dt)

    if(root.current){
      root.current.rotation.y=damp(root.current.rotation.y,-.34+pointer.x*LION.headYaw+drag.x*.065+sh*.04,4.6,dt)
      root.current.rotation.x=damp(root.current.rotation.x,.045+pointer.y*LION.headPitch+drag.y*.026-sh*.026,4.6,dt)
      root.current.rotation.z=damp(root.current.rotation.z,-.035+pointer.x*.012,4.2,dt)
      root.current.position.y=-.03+Math.sin(clock.elapsedTime*.72)*.006+Math.abs(sh)*.038
    }
    const eyeYaw=pointer.x*LION.eyeYaw+drag.x*.055
    const eyePitch=-pointer.y*LION.eyePitch-drag.y*.020
    if(leftEye.current){leftEye.current.rotation.y=eyeYaw;leftEye.current.rotation.x=eyePitch}
    if(rightEye.current){rightEye.current.rotation.y=eyeYaw;rightEye.current.rotation.x=eyePitch}
    if(jaw.current)jaw.current.rotation.x=.04+j*.31
    if(leftBrow.current)leftBrow.current.rotation.z=.14+b*.20
    if(rightBrow.current)rightBrow.current.rotation.z=-.14-b*.20
    if(leftEar.current)leftEar.current.rotation.z=-.16-e*.19
    if(rightEar.current)rightEar.current.rotation.z=.16+e*.19
  })

  return <>
    <Workshop materials={materials}/>
    <group ref={root} position={[1.38,-.03,.05]} scale={1.13}>
      {structure ? <Structure materials={materials}/> : <>
        <Mane materials={materials}/>
        <FacePlate points={faceOutline} position={[0,0,-.02]} depth={.34} bevel={.075} material={materials.paper}/>

        <FacePlate
          points={faceOutline.map(([x,y])=>[x*.73,y*.57+.48])}
          position={[0,.12,.31]}
          depth={.11}
          bevel={.04}
          material={materials.lacquer}
        />

        <FacePlate points={cheekShape} position={[-.68,-.22,.33]} rotation={[0,0,-.10]} scale={[1.0,.94,1]} depth={.10} material={materials.lacquer}/>
        <FacePlate points={cheekShape} position={[.68,-.22,.33]} rotation={[0,0,.10]} scale={[1.0,.94,1]} depth={.10} material={materials.lacquer}/>

        <Eye side={-1} eyeRef={leftEye} materials={materials}/>
        <Eye side={1} eyeRef={rightEye} materials={materials}/>
        <Brow side={-1} browRef={leftBrow} materials={materials}/>
        <Brow side={1} browRef={rightBrow} materials={materials}/>
        <Ear side={-1} earRef={leftEar} materials={materials}/>
        <Ear side={1} earRef={rightEar} materials={materials}/>

        <mesh material={materials.black} position={[0,-.13,.58]} scale={[.44,.22,.20]}>
          <sphereGeometry args={[1,48,32]}/>
        </mesh>

        <FacePlate points={mouthShape} position={[0,-.57,.32]} depth={.14} bevel={.05} material={materials.black}/>
        <group ref={jaw} position={[0,-.66,.39]} rotation={[.04,0,0]}>
          <FacePlate points={mouthShape.map(([x,y])=>[x*.90,y*.50])} position={[0,-.05,0]} depth={.14} bevel={.045} material={materials.lacquer}/>
          {[-.42,-.14,.14,.42].map((x,i)=><mesh key={i} position={[x,.02,.18]} rotation={[Math.PI,0,0]} material={materials.ivory}>
            <coneGeometry args={[.055,.18,4]}/>
          </mesh>)}
        </group>

        <mesh material={materials.gold} position={[0,1.50,.00]} rotation={[0,0,.02]}>
          <coneGeometry args={[.20,.68,7]}/>
        </mesh>
        <mesh material={materials.ivory} position={[0,1.48,.11]}>
          <coneGeometry args={[.072,.48,7]}/>
        </mesh>

        <mesh material={materials.teal} position={[0,.99,.38]} rotation={[0,0,Math.PI/4]}>
          <boxGeometry args={[.38,.38,.10]}/>
        </mesh>
        <mesh material={materials.gold} position={[0,.99,.46]} rotation={[0,0,Math.PI/4]}>
          <boxGeometry args={[.15,.15,.06]}/>
        </mesh>

        <PaintedOrnaments materials={materials}/>
      </>}
    </group>
  </>
}
