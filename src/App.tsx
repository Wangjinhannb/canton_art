import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CAMERA, COLORS, LIGHTING } from './config'
import { LionScene } from './LionScene'
import { UI } from './ui'
import { audioEngine } from './audio'
import { damp } from './motion'

function Stage({
  pointer,drag,structure,impulse,
}:{
  pointer:{x:number;y:number}
  drag:{x:number;y:number}
  structure:boolean
  impulse:number
}){
  const yaw=useRef(CAMERA.baseYaw)
  const pitch=useRef(0)
  useFrame(({camera},dt)=>{
    const targetYaw=CAMERA.baseYaw+pointer.x*CAMERA.pointerYaw+drag.x*CAMERA.dragYaw
    const targetPitch=-pointer.y*CAMERA.pointerPitch-drag.y*CAMERA.dragPitch
    yaw.current=damp(yaw.current,targetYaw,CAMERA.damping,dt)
    pitch.current=damp(pitch.current,targetPitch,CAMERA.damping,dt)
    camera.position.x=Math.sin(yaw.current)*CAMERA.baseZ
    camera.position.z=Math.cos(yaw.current)*CAMERA.baseZ
    camera.position.y=CAMERA.baseY+pitch.current*3.4
    camera.lookAt(1.34,-.02,.04)
  })

  return <>
    <fog attach="fog" args={[COLORS.ink,7.8,15.2]} />
    <hemisphereLight args={['#d9c4a2','#090b0c',.48]} />
    <spotLight
      castShadow
      position={[-4.8,5.7,5.4]}
      color="#ffd09a"
      intensity={LIGHTING.key}
      angle={Math.PI*.22}
      penumbra={.48}
      distance={18}
      decay={1.25}
      shadow-mapSize={[1536,1536]}
    />
    <spotLight
      position={[5.5,3.3,1.6]}
      color="#6e98a0"
      intensity={LIGHTING.rim}
      angle={Math.PI*.25}
      penumbra={.68}
      distance={16}
      decay={1.5}
    />
    <pointLight position={[1.0,-1.6,3.4]} color="#9b3f2f" intensity={LIGHTING.fill} distance={7} decay={2}/>
    <pointLight position={[-1.1,1.1,4.2]} color="#fff0cf" intensity={.62} distance={5} decay={2}/>

    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[1.2,-2.18,-.4]}>
      <circleGeometry args={[6,96]}/>
      <meshStandardMaterial color="#0d0c0a" roughness={.9}/>
    </mesh>
    <mesh receiveShadow position={[1.3,-2.04,-.2]}>
      <cylinderGeometry args={[1.8,2.05,.24,72]}/>
      <meshStandardMaterial color="#15120e" roughness={.69}/>
    </mesh>

    <LionScene pointer={pointer} drag={drag} structure={structure} impulse={impulse}/>

    <EffectComposer multisampling={0}>
      <SMAA/>
      <Bloom intensity={.13} luminanceThreshold={1.16} luminanceSmoothing={.15} mipmapBlur/>
      <Vignette eskil={false} offset={.25} darkness={.42}/>
    </EffectComposer>
  </>
}

export default function App(){
  const [pointer,setPointer]=useState({x:0,y:0})
  const [drag,setDrag]=useState({x:0,y:0})
  const [sound,setSound]=useState(false)
  const [structure,setStructure]=useState(false)
  const [impulse,setImpulse]=useState(0)
  const pressed=useRef(false)
  const start=useRef({x:0,y:0})
  const moved=useRef(0)

  const normalized=(x:number,y:number)=>({
    x:x/window.innerWidth*2-1,
    y:-(y/window.innerHeight*2-1),
  })

  const onPointerDown=(e:React.PointerEvent)=>{
    pressed.current=true
    start.current={x:e.clientX,y:e.clientY}
    moved.current=0
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove=(e:React.PointerEvent)=>{
    setPointer(normalized(e.clientX,e.clientY))
    if(!pressed.current)return
    const dx=(e.clientX-start.current.x)/window.innerWidth
    const dy=(e.clientY-start.current.y)/window.innerHeight
    moved.current+=Math.abs(dx)+Math.abs(dy)
    setDrag((d)=>({
      x:THREE.MathUtils.clamp(d.x+dx*1.4,-.8,.8),
      y:THREE.MathUtils.clamp(d.y+dy*1.4,-.55,.55),
    }))
    start.current={x:e.clientX,y:e.clientY}
  }
  const onPointerUp=(e:React.PointerEvent)=>{
    pressed.current=false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    if(moved.current<.018){
      setImpulse((v)=>v+1)
      void audioEngine.drum(.75)
    }
  }

  const toggleSound=async()=>{
    audioEngine.enabled=!sound
    if(!sound)await audioEngine.ensure()
    setSound(!sound)
  }

  const fullscreen=async()=>{
    try{
      if(!document.fullscreenElement)await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    }catch{}
  }

  return <main
    className="app"
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={()=>{pressed.current=false}}
    onDoubleClick={()=>setDrag({x:0,y:0})}
  >
    <Canvas
      dpr={[1,1.5]}
      shadows
      gl={{antialias:true,powerPreference:'high-performance'}}
      camera={{position:[-0.95,CAMERA.baseY,CAMERA.baseZ],fov:36,near:.1,far:60}}
      onCreated={({gl})=>{
        gl.setClearColor(COLORS.ink,1)
        gl.outputColorSpace=THREE.SRGBColorSpace
        gl.toneMapping=THREE.ACESFilmicToneMapping
        gl.toneMappingExposure=LIGHTING.exposure
        gl.shadowMap.enabled=true
        gl.shadowMap.type=THREE.PCFSoftShadowMap
      }}
    >
      <Stage pointer={pointer} drag={drag} structure={structure} impulse={impulse}/>
    </Canvas>

    <div className="grain"/>
    <div className="vignette"/>
    <UI
      sound={sound}
      structure={structure}
      onSound={toggleSound}
      onStructure={()=>setStructure((v)=>!v)}
      onFullscreen={fullscreen}
    />
  </main>
}
