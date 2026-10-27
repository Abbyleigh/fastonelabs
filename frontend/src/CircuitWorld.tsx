import {useEffect,useMemo,useRef} from 'react';
import {Sky} from '@react-three/drei';
import * as THREE from 'three';
type XY=[number,number];
function surfaceTexture(grass:boolean){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const context=canvas.getContext('2d')!,pixels=context.createImageData(128,128);let seed=731;
 for(let i=0;i<pixels.data.length;i+=4){seed=(1664525*seed+1013904223)>>>0;const n=seed/4294967296;pixels.data[i]=grass?35+n*24:47+n*25;pixels.data[i+1]=grass?66+n*32:49+n*25;pixels.data[i+2]=grass?29+n*20:52+n*25;pixels.data[i+3]=255;}
 context.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.repeat.set(grass?90:1,grass?90:1);return texture;
}
export default function CircuitWorld({coordinates,daylight=true}:{coordinates:XY[];daylight?:boolean}){
 const barriers=useRef<THREE.InstancedMesh>(null);
 const textures=useMemo(()=>({grass:surfaceTexture(true),asphalt:surfaceTexture(false)}),[]);
 const world=useMemo(()=>{
  const xs=coordinates.map(p=>p[0]),ys=coordinates.map(p=>p[1]);const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,scale=120/Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),1);
  const curve=new THREE.CatmullRomCurve3(coordinates.map(([x,y])=>new THREE.Vector3((x-cx)*scale,.06,-(y-cy)*scale)),true,'centripetal');
  const count=720,points=curve.getSpacedPoints(count).slice(0,count);
  function ribbon(inner:number,outer:number,height:number,striped=false){const positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
   for(let i=0;i<=count;i++){const p=points[i%count],before=points[(i+count-1)%count],after=points[(i+1)%count];const tangent=after.clone().sub(before).normalize(),normal=new THREE.Vector3(-tangent.z,0,tangent.x);for(const w of [inner,outer]){positions.push(p.x+normal.x*w,height,p.z+normal.z*w);uv.push(w===inner?0:1,i/count*90);const colour=striped&&Math.floor(i/3)%2===0?new THREE.Color('#d93838'):new THREE.Color('#eee9df');colors.push(colour.r,colour.g,colour.b);}if(i<count){const a=i*2,b=a+2;indices.push(a,b,a+1,a+1,b,b+1);}}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(striped)geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }
  const fixtures:THREE.Matrix4[]=[];for(let i=0;i<120;i++){const t=i/120,p=curve.getPointAt(t),tangent=curve.getTangentAt(t),normal=new THREE.Vector3(-tangent.z,0,tangent.x);for(const side of [-1,1]){const dummy=new THREE.Object3D();dummy.position.copy(p).addScaledVector(normal,side*2.6);dummy.position.y=.25;const length=curve.getLength()/120;const probes=[-.5,0,.5].map(f=>dummy.position.clone().addScaledVector(tangent,length*f));if(probes.some(probe=>points.some(road=>Math.hypot(probe.x-road.x,probe.z-road.z)<1.85)))continue;dummy.rotation.y=Math.atan2(tangent.x,tangent.z);dummy.scale.z=length;dummy.updateMatrix();fixtures.push(dummy.matrix.clone());}}
  return {road:ribbon(1.35,-1.35,.08),runoff:ribbon(2.5,-2.5,.035),left:ribbon(1.35,1.58,.095,true),right:ribbon(-1.35,-1.58,.095,true),fixtures};
 },[coordinates]);
 useEffect(()=>{world.fixtures.forEach((matrix,i)=>barriers.current?.setMatrixAt(i,matrix));if(barriers.current){barriers.current.instanceMatrix.needsUpdate=true;barriers.current.computeBoundingSphere();}},[world]);
 useEffect(()=>()=>{world.road.dispose();world.runoff.dispose();world.left.dispose();world.right.dispose();},[world]);
 useEffect(()=>()=>{textures.grass.dispose();textures.asphalt.dispose();},[textures]);
 return <group>
  <Sky distance={900} sunPosition={daylight?[100,70,40]:[100,8,-80]} turbidity={daylight?6:12} rayleigh={2}/>
  <hemisphereLight args={['#d6e7ff','#74755b',daylight?1.3:.5]}/>
  <directionalLight castShadow position={[45,80,-35]} intensity={daylight?2.3:.9} shadow-mapSize={[2048,2048]} shadow-camera-left={-85} shadow-camera-right={85} shadow-camera-top={85} shadow-camera-bottom={-85} shadow-camera-far={250} shadow-bias={-.001}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.02,0]} receiveShadow><planeGeometry args={[800,800]}/><meshStandardMaterial map={textures.grass} roughness={1}/></mesh>
  <mesh geometry={world.runoff} receiveShadow><meshStandardMaterial color="#78786e" roughness={1} side={THREE.DoubleSide}/></mesh>
  <mesh geometry={world.road} receiveShadow><meshStandardMaterial map={textures.asphalt} roughness={.92} side={THREE.DoubleSide}/></mesh>
  {[world.left,world.right].map((geometry,i)=><mesh key={i} geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={.85} side={THREE.DoubleSide}/></mesh>)}
  <instancedMesh ref={barriers} args={[undefined,undefined,world.fixtures.length]} castShadow receiveShadow><boxGeometry args={[.12,.45,1]}/><meshStandardMaterial color="#bac0c2" roughness={.55} metalness={.25}/></instancedMesh>
 </group>;
}
