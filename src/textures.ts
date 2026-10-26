import * as THREE from 'three'

const makeCanvas=(size:number)=>{
  const canvas=document.createElement('canvas')
  canvas.width=size
  canvas.height=size
  const ctx=canvas.getContext('2d')
  if(!ctx)throw new Error('Canvas 2D unavailable')
  return {canvas,ctx}
}

export function createPaperNormal(size=512){
  const {canvas,ctx}=makeCanvas(size)
  const image=ctx.createImageData(size,size)
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const i=(y*size+x)*4
      const grain=(Math.random()-.5)*7
      image.data[i]=128+Math.sin(x*.35)*4+grain
      image.data[i+1]=128+Math.sin(y*.28)*4+grain
      image.data[i+2]=244
      image.data[i+3]=255
    }
  }
  ctx.putImageData(image,0,0)
  const texture=new THREE.CanvasTexture(canvas)
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping
  texture.repeat.set(5,5)
  texture.colorSpace=THREE.NoColorSpace
  return texture
}

export function createRoughness(size=384, mode:'paper'|'lacquer'|'gold'='paper'){
  const {canvas,ctx}=makeCanvas(size)
  const image=ctx.createImageData(size,size)
  for(let i=0;i<image.data.length;i+=4){
    const n=Math.random()
    let value=165+n*62
    if(mode==='lacquer')value=110+n*45
    if(mode==='gold')value=n>.9?225:125+n*70
    image.data[i]=image.data[i+1]=image.data[i+2]=value
    image.data[i+3]=255
  }
  ctx.putImageData(image,0,0)
  const texture=new THREE.CanvasTexture(canvas)
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping
  texture.repeat.set(mode==='gold'?2:3,mode==='gold'?2:3)
  texture.colorSpace=THREE.NoColorSpace
  return texture
}
