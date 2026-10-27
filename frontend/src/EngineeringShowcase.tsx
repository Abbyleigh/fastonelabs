import {GARAGE_PHOTO,coverRect} from './garagePhoto';
import EngineeringCar, { useEngineeringMap } from './EngineeringCar';
import { garageCars, matchGarageCar } from './GarageAssets';
import EngineeringDetails from './EngineeringDetails';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

const Identity=createContext({primary:'#bd233b',helmet:'#f5d368',number:'',name:'Driver',team:'Study finish'});
function teamColour(team:string){
 const t=team.toLowerCase();
 return /ferrari/.test(t)?'#d9213b':/mclaren/.test(t)?'#ff8700':/mercedes/.test(t)?'#23bba8':/red bull/.test(t)?'#243a89':/williams/.test(t)?'#2468dd':/aston/.test(t)?'#137c64':/alpine|renault/.test(t)?'#398dda':/haas/.test(t)?'#e6e8ee':/sauber|audi/.test(t)?'#b2d630':'#b32643';
}
function CockpitDriver(){const identity=useContext(Identity);return <group position={[0,.76,-.4]}>
 <mesh scale={[1,.65,.85]}><sphereGeometry args={[.28,24,16]}/><Paint color={identity.primary}/></mesh>
 <mesh position={[0,.23,0]}><sphereGeometry args={[.23,32,24]}/><Paint color={identity.helmet} roughness={.18}/></mesh>
 <mesh position={[0,.25,-.18]} scale={[1,.35,.5]}><sphereGeometry args={[.19,24,12]}/><meshStandardMaterial color="#18364d" metalness={.85} roughness={.1}/></mesh>
 <mesh position={[0,.15,-.4]} rotation={[.5,0,0]}><torusGeometry args={[.18,.035,8,24]}/><Paint color="#12151e"/></mesh>
</group>;}
function GarageCapture({capture,filename,caption,credit,onReady,onError,backdrop}:{backdrop:boolean;capture:React.MutableRefObject<(()=>void)|null>;filename:string;caption:string;credit:string;onReady:(url:string)=>void;onError:(message:string)=>void}) {
 const {gl,scene,camera}=useThree();
 const photoImage=useRef<HTMLImageElement|null>(null);
 useEffect(()=>{const image=new Image();image.onload=()=>{photoImage.current=image;};image.src=GARAGE_PHOTO.path;return()=>{image.onload=null;photoImage.current=null;};},[]);
 useEffect(()=>{
  capture.current=()=>{try{gl.render(scene,camera);const canvas=document.createElement('canvas');canvas.width=gl.domElement.width;const font=Math.max(14,Math.round(canvas.width/85));canvas.height=gl.domElement.height+font*9;const context=canvas.getContext('2d')!;context.fillStyle='#101722';context.fillRect(0,0,canvas.width,canvas.height);if(backdrop){const image=photoImage.current;if(!image)throw Error('Photo still loading');const rect=coverRect(image.naturalWidth,image.naturalHeight,canvas.width,gl.domElement.height);context.save();context.beginPath();context.rect(0,0,canvas.width,gl.domElement.height);context.clip();context.drawImage(image,rect.x,rect.y,rect.width,rect.height);const shade=context.createLinearGradient(0,0,0,gl.domElement.height);shade.addColorStop(0,'rgba(8,15,25,.18)');shade.addColorStop(.55,'rgba(8,15,25,.4)');shade.addColorStop(1,'rgba(8,15,25,.94)');context.fillStyle=shade;context.fillRect(0,0,canvas.width,gl.domElement.height);context.restore();}context.drawImage(gl.domElement,0,0);context.fillStyle='white';context.font=`bold ${font*1.2}px sans-serif`;context.fillText(caption,16,gl.domElement.height+font*2,canvas.width-32);context.font=`${font}px sans-serif`;context.fillText(credit,16,gl.domElement.height+font*3.7,canvas.width-32);context.fillText('F1 Strategy Lab · creator representation / generic study figures · original liveries may differ by driver',16,gl.domElement.height+font*5.2,canvas.width-32);context.fillText('Attribution licence: https://creativecommons.org/licenses/by/4.0/',16,gl.domElement.height+font*6.5,canvas.width-32);if(backdrop)context.fillText('Photo: Jen Ross · AlphaTauri garage, Silverstone 2021 · CC BY 2.0 · creativecommons.org/licenses/by/2.0/',16,gl.domElement.height+font*8,canvas.width-32);canvas.toBlob(blob=>{if(blob){onReady(URL.createObjectURL(blob));onError('');}else onError('The image could not be prepared. Please try again.');},'image/png');}catch{onError('The image could not be saved. Try again once the model has finished loading.');}};
  return ()=>{capture.current=null;};
 },[gl,scene,camera,capture,filename,caption,credit,onReady,onError,backdrop]);
 return null;
}
class ModelBoundary extends React.Component<{children:React.ReactNode;fallback:React.ReactNode;onFailure?:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){this.props.onFailure?.();}
 render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function ModelLoading(){return <mesh position={[0,1,0]}><icosahedronGeometry args={[.6,1]}/><meshBasicMaterial color="#86c8ff" wireframe/></mesh>;}
type PartId = 'body' | 'frontWing' | 'rearWing' | 'floor' | 'power' | 'wheels' | 'suspension';
type View = 'threeQuarter' | 'top' | 'side' | 'front';
const PARTS: {id:PartId; label:string; description:string; fact:string}[] = [
 {id:'body',label:'Monocoque & bodywork',description:'The survival cell protects the driver; sidepods and engine cover guide airflow.',fact:'Carbon-fibre composite survival structure'},
 {id:'frontWing',label:'Front wing',description:'Shapes airflow around the front tyres while managing downforce and drag.',fact:'Multi-element aerodynamic assembly'},
 {id:'rearWing',label:'Rear wing',description:'Controls rear aerodynamic load. Modern regulations allow active aero configurations.',fact:'Rear aerodynamic assembly'},
 {id:'floor',label:'Floor & diffuser',description:'Manages airflow under the car and contributes to total downforce.',fact:'Aerodynamic underbody'},
 {id:'power',label:'Hybrid power unit',description:'The real power unit combines combustion and electrical energy systems. The detailed exterior model shows the exhaust outlet; the internal systems are explained below.',fact:'Exhaust exterior shown; internal hybrid systems are not modelled'},
 {id:'wheels',label:'Wheels & tyres',description:'Tyre behaviour influences grip, braking, degradation and race strategy.',fact:'Four wheel assemblies'},
 {id:'suspension',label:'Suspension',description:'Connects wheels to the chassis and controls wheel movement and loading.',fact:'Wishbones and suspension links'},
];
const STRATEGY_NOTES:Record<PartId,string>={
 body:'Bodywork and cooling influence airflow and temperature control. Strategy takeaway: sustained traffic can change cooling demands and the pace a driver can maintain.',
 frontWing:'Front-wing balance influences cornering response and front-tyre loading. Strategy takeaway: balance problems can shorten the useful life of a front-tyre stint.',
 rearWing:'Aerodynamic load supports cornering while drag affects straight-line pace. Strategy takeaway: compare cornering benefit with overtaking and defending needs.',
 floor:'The floor contributes aerodynamic load and depends on how the car runs above the track. Strategy takeaway: a stable platform helps the driver repeat consistent laps.',
 power:'Energy deployment and recovery influence available acceleration. Strategy takeaway: energy use matters when attacking or defending; this workbench does not simulate energy deployment.',
 wheels:'Grip changes with compound, age, temperature and conditions. Strategy takeaway: balance fresh-tyre pace against the time lost in a pit stop. Try compounds, pit laps and degradation in the workbench.',
 suspension:'Suspension influences the tyre contact patch and the aerodynamic platform. Strategy takeaway: tyre loading and consistency affect how long a stint remains competitive.'
};
const buttonStyle:React.CSSProperties={border:'1px solid #42536e',borderRadius:9,padding:'9px 11px',background:'#243249',color:'#f3f6fd',cursor:'pointer',fontSize:12};
const cameraPositions:Record<View,[number,number,number]>={threeQuarter:[6,3.6,-7.4],top:[0,11,0.01],side:[10,2.6,0],front:[0,2.5,-10]};
const partOffsets:Record<PartId,[number,number,number]>={body:[0,0,0],frontWing:[0,0,-3.0],rearWing:[0,1.4,2.9],floor:[0,-1.3,0],power:[0,2.0,.85],wheels:[2.1,.3,0],suspension:[-2,.3,0]};
function CameraRig({view,distance=1}:{view:View;distance?:number}){
 const {camera}=useThree();
 const elapsed=useRef(0);
 const target=useMemo(()=>new THREE.Vector3(...cameraPositions[view]).multiplyScalar(distance),[view,distance]);
 useEffect(()=>{elapsed.current=0;},[view,distance]);
 useFrame((_,dt)=>{
  if(elapsed.current>=1.3)return;
  elapsed.current+=dt;
  camera.position.lerp(target,1-Math.exp(-5*dt));
 });
 return null;
}
function ComponentGroup({id,exploded,selected,isolate,onSelect,children}:{id:PartId;exploded:number;selected:PartId|null;isolate:boolean;onSelect:(id:PartId)=>void;children:React.ReactNode}){
 const group=useRef<THREE.Group>(null);
 const goal=useMemo(()=>new THREE.Vector3(...partOffsets[id]),[id]);
 useFrame((_,dt)=>{if(group.current){const v=goal.clone().multiplyScalar(exploded);group.current.position.lerp(v,1-Math.exp(-5*dt));}});
 return <group ref={group} visible={!isolate||selected===null||selected===id} onClick={e=>{e.stopPropagation();onSelect(id)}}>
   <group scale={selected===id?1.04:1}>{children}</group>
   
 </group>;
}
function Paint({color,metalness=.4,roughness=.36}:{color:string;metalness?:number;roughness?:number}){const identity=useContext(Identity);if(['#bd233b','#da3346','#c72d41','#eb5261','#cc2942','#b82340','#c52a46'].includes(color))color=identity.primary;return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness}/>;}
function Car({exploded,selected,isolate,onSelect}:{exploded:number;selected:PartId|null;isolate:boolean;onSelect:(id:PartId)=>void}){
 const colored=(id:PartId,base:string)=>selected===id?'#ffd36d':base;
 const wheels:[number,number,number][]=[[-1.13,.1,-1.65],[1.13,.1,-1.65],[-1.17,.1,1.6],[1.17,.1,1.6]];
 return <group position={[0,.48,0]}>
 <ComponentGroup id="floor" exploded={exploded} selected={selected} isolate={isolate} onSelect={onSelect}>
  <mesh position={[0,-.23,0]}><boxGeometry args={[1.52,.10,4.3]}/><Paint color={colored('floor','#161b24')}/></mesh>
  <mesh position={[0,-.34,1.72]} rotation={[.15,0,0]}><boxGeometry args={[1.5,.07,1.1]}/><Paint color={colored('floor','#242a34')}/></mesh>
 </ComponentGroup>
 <ComponentGroup id="body" exploded={exploded} selected={selected} isolate={isolate} onSelect={onSelect}>
  <RoundedBox args={[.85,.49,3.45]} radius={.17} smoothness={3} position={[0,.33,.15]}><Paint color={colored('body','#bd233b')}/></RoundedBox>
  <mesh position={[0,.31,-1.72]} rotation={[-Math.PI/2,0,0]}><coneGeometry args={[.34,2.15,6]}/><Paint color={colored('body','#da3346')}/></mesh>
  {[-1,1].map(s=><group key={s}>
    <mesh position={[s*.65,.32,.35]} rotation={[0,s*-.08,0]}><boxGeometry args={[.48,.38,1.65]}/><Paint color={colored('body','#c72d41')}/></mesh>
    <mesh position={[s*.67,.57,-.09]} rotation={[0,0,s*.22]}><boxGeometry args={[.35,.07,1.3]}/><Paint color={colored('body','#eb5261')}/></mesh>
  </group>)}
  <CockpitDriver/>
  <mesh position={[0,.95,-.27]} rotation={[0,0,Math.PI]}><torusGeometry args={[.43,.065,8,32,Math.PI]}/><Paint color="#0b0f17"/></mesh>
  <mesh position={[0,.53,1.68]}><boxGeometry args={[.67,.29,.72]}/><Paint color={colored('body','#bd233b')}/></mesh>
 </ComponentGroup>
 <ComponentGroup id="frontWing" exploded={exploded} selected={selected} isolate={isolate} onSelect={onSelect}>
  {[0,.2,.39].map((z,i)=><mesh key={i} position={[0,.05+i*.08,-2.56+z]}><boxGeometry args={[2.55-i*.24,.07,.31]}/><Paint color={colored('frontWing',i===0?'#171d29':'#303a4a')}/></mesh>)}
  {[-1,1].map(s=><mesh key={s} position={[s*1.24,.24,-2.48]}><boxGeometry args={[.08,.43,.61]}/><Paint color={colored('frontWing','#cc2942')}/></mesh>)}
 </ComponentGroup>
 <ComponentGroup id="rearWing" exploded={exploded} selected={selected} isolate={isolate} onSelect={onSelect}>
  {[-1,1].map(s=><mesh key={s} position={[s*.75,.74,2.22]}><boxGeometry args={[.08,.85,.4]}/><Paint color={colored('rearWing','#2d3543')}/></mesh>)}
  {[0,.3].map((y,i)=><mesh key={i} position={[0,1.02+y,2.21]}><boxGeometry args={[2.17,.09,.48-i*.14]}/><Paint color={colored('rearWing','#151e2b')}/></mesh>)}
 </ComponentGroup>
 <ComponentGroup id="power" exploded={exploded} selected={selected} isolate={isolate} onSelect={onSelect}>
  <RoundedBox args={[.64,.48,.85]} radius={.08} smoothness={3} position={[0,.46,.92]}><Paint color={colored('power','#9fa9b7')} metalness={.85}/></RoundedBox>
  <mesh position={[0,.77,.95]}><boxGeometry args={[.36,.16,.5]}/><Paint color={colored('power','#56677a')}/></mesh>
 </ComponentGroup>
 <ComponentGroup id="suspension" exploded={exploded} selected={selected} isolate={isolate} onSelect={onSelect}>
  {wheels.flatMap(([x,y,z],i)=>[0,1].map(j=>{const start=new THREE.Vector3(Math.sign(x)*.42,.20+j*.23,z+(j?-.16:.16));const end=new THREE.Vector3(x,y+.22,z);const vector=end.clone().sub(start);return <mesh key={`${i}-${j}`} position={start.clone().add(end).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),vector.clone().normalize())}><cylinderGeometry args={[.035,.035,vector.length(),6]}/><Paint color={colored('suspension','#aeb8c6')} metalness={.8}/></mesh>;}))}
 </ComponentGroup>
 <ComponentGroup id="wheels" exploded={exploded} selected={selected} isolate={isolate} onSelect={onSelect}>
  {wheels.map(([x,y,z],i)=><group key={i} position={[x,y+.24,z]}>
   <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.53,.53,.33,32]}/><Paint color={colored('wheels','#12151c')} roughness={.94}/></mesh>
   <mesh position={[x>0?.17:-.17,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.24,.24,.015,24]}/><Paint color={colored('wheels','#747f8f')} metalness={.7}/></mesh>
   <mesh rotation={[0,0,Math.PI/2]}><torusGeometry args={[.43,.024,8,40]}/><meshStandardMaterial color="#debb65"/></mesh>
  </group>)}
 </ComponentGroup>
 </group>;
}

// These are assets YOU provide. If absent, the existing interactive concept meshes render safely.
function useLocalAsset(url: string) {
  const [exists, setExists] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setExists(false);

    fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })
      .then(response => {
        if (controller.signal.aborted) return;

        const type = (
          response.headers.get('content-type') || ''
        ).toLowerCase();

        const valid =
          response.ok &&
          !type.includes('text/html') &&
          (
            type.includes('model/') ||
            type.includes('gltf') ||
            type.includes('octet-stream')
          );

        setExists(valid);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setExists(false);
        }
      });

    return () => controller.abort();
  }, [url]);

  return exists;
}

function classifyMesh(name: string): PartId | null {
 const n = name.toLowerCase().replace(/[^a-z0-9]/g, '');
 if (/frontwing|nosewing/.test(n)) return 'frontWing';
 if (/rearwing|drswing/.test(n)) return 'rearWing';
 if (/floor|diffuser|undertray/.test(n)) return 'floor';
 if (/enginecover|halo|mirror/.test(n)) return 'body';
 if (/engine|powerunit|motor|turbo|battery|exhaust/.test(n)) return 'power';
 if (/suspension|wishbone|pushrod|pullrod|steeringarm/.test(n)) return 'suspension';
 if (/wheel|tyre|tire|rim/.test(n)) return 'wheels';
 if (/body|chassis|sidepod|monocoque|enginecover|nose/.test(n)) return 'body';
 return null;
}

// A detailed imported GLB must have semantic mesh/group names so parts can move separately.
function ImportedCar({path,exploded,selected,isolate,onSelect}:{path:string;exploded:number;selected:PartId|null;isolate:boolean;onSelect:(id:PartId)=>void}) {
 const {scene} = useGLTF(path);
 const identity=useContext(Identity);
 const copy=useMemo(()=>{
  const source=scene.clone(true);source.updateMatrixWorld(true);
  const flat=new THREE.Group();
  source.traverse(object=>{
   const mesh=object as THREE.Mesh;if(!mesh.isMesh||mesh.name==='garage-display-floor')return;
   const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
   const materials=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(material=>{
    const m=material.clone() as THREE.MeshStandardMaterial;
    if(m.color&&m.color.r>m.color.g*2&&m.color.r>m.color.b*2)m.color.set(identity.primary);
    return m;
   });
   const part=new THREE.Mesh(geometry,materials.length===1?materials[0]:materials);part.name=mesh.name||mesh.parent?.name||'body';flat.add(part);
  });
  // Installed source runs nose-to-tail along X in millimetres; viewer uses Z.
  const rawSize=new THREE.Box3().setFromObject(flat).getSize(new THREE.Vector3());
  const turn=rawSize.x>rawSize.z?new THREE.Matrix4().makeRotationY(-Math.PI/2):new THREE.Matrix4();
  flat.children.forEach(o=>(o as THREE.Mesh).geometry.applyMatrix4(turn));
  const box=new THREE.Box3().setFromObject(flat),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
  const scale=6/Math.max(size.z,.001);
  const normalise=new THREE.Matrix4().makeScale(scale,scale,scale).multiply(new THREE.Matrix4().makeTranslation(-centre.x,-box.min.y,-centre.z));
  flat.children.forEach(o=>(o as THREE.Mesh).geometry.applyMatrix4(normalise));
  return flat;
 },[scene,identity.primary]);
 const parts = useMemo(() => {
  const result: {object:THREE.Object3D; id:PartId; original:THREE.Vector3; offset:THREE.Vector3}[]=[];
  copy.traverse(obj => {
   if (!(obj as THREE.Mesh).isMesh) return;
   const id = classifyMesh(obj.name) ?? (obj.parent ? classifyMesh(obj.parent.name) : null);
   if(id){
    const centre=new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
    const offset=new THREE.Vector3(...partOffsets[id]);
    if(id==='wheels')offset.set(Math.sign(centre.x)*2,.3,Math.sign(centre.z)*.7);
    if(id==='suspension')offset.set(0,1.3,Math.sign(centre.z)*1.2);
    if(/sidepod/i.test(obj.name))offset.set(Math.sign(centre.x)*1.8,.5,0);
    if(/engine.cover/i.test(obj.name))offset.set(0,1.7,.3);
    if(/halo/i.test(obj.name))offset.set(0,2.3,-.2);
    result.push({object:obj,id,original:obj.position.clone(),offset});
   }
  });
  return result;
 }, [copy]);
 useFrame((_,dt) => {
  const alpha=1-Math.exp(-4*dt);
  parts.forEach(p => {
   const offset = p.offset.clone().multiplyScalar(exploded);
   p.object.position.lerp(p.original.clone().add(offset),alpha);
  });
 });
 useEffect(() => {
  parts.forEach(p => { p.object.visible = !isolate || selected === null || p.id === selected;const mesh=p.object as THREE.Mesh;const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];materials.forEach(m=>{const material=m as THREE.MeshStandardMaterial;if(material.emissive)material.emissive.set(selected===p.id?'#665020':'#000000');}); });
 },[parts,isolate,selected]);
 return <group onClick={e => {
  let node:THREE.Object3D|null=e.object;
  while(node && node!==copy){const id=classifyMesh(node.name); if(id){e.stopPropagation();onSelect(id);return;}node=node.parent;}
 }}><primitive object={copy}/>{!isolate&&exploded<.05&&<CockpitDriver/>}</group>;
}
// Track newly loaded meshes as well as the concept geometry.
function Wireframe({enabled}:{enabled:boolean}) {
 const {scene}=useThree();
 const materials=useRef(new Map<THREE.MeshStandardMaterial,boolean>());
 useFrame(()=>scene.traverse(object=>{
  const mesh=object as THREE.Mesh;
  if(!mesh.isMesh)return;
  const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  list.forEach(material=>{
   const m=material as THREE.MeshStandardMaterial;
   if(!('wireframe' in m))return;
   if(!materials.current.has(m))materials.current.set(m,m.wireframe);
   m.wireframe=enabled || materials.current.get(m)!;
  });
 }));
 useEffect(()=>()=>{materials.current.forEach((value,material)=>{material.wireframe=value;});},[]);
 return null;
}
// Preserve the downloaded car's hierarchy, UVs and original livery.
function ArchiveCar({path}:{path:string}) {
 const {scene}=useGLTF(path);
 const fitted=useMemo(()=>{
  const object=scene.clone(true);object.updateMatrixWorld(true);
  const size=new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  if(size.x>size.z)object.rotation.y+=Math.PI/2;
  object.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(object),dimensions=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
  const scale=6/Math.max(dimensions.z,.001);
  const group=new THREE.Group();group.scale.setScalar(scale);object.position.add(new THREE.Vector3(-centre.x,-box.min.y,-centre.z));group.add(object);group.rotation.y=Math.PI;return group;
 },[scene]);
 return <primitive object={fitted}/>;
}
function ImportedDriver({path,personal=false}:{path:string;personal?:boolean}) {
 const {scene}=useGLTF(path);
 const identity=useContext(Identity);
 const numberTexture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#101722';ctx.fillRect(0,0,256,256);ctx.fillStyle='white';ctx.font='bold 128px sans-serif';ctx.textAlign='center';ctx.fillText(identity.number||'F1',128,150);ctx.font='bold 26px sans-serif';ctx.fillText('STUDY',128,210);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;},[identity.number]);
 useEffect(()=>()=>numberTexture.dispose(),[numberTexture]);
 const copy=useMemo(()=>{const result=cloneSkeleton(scene);result.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;const materials=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>{const material=m.clone() as THREE.MeshStandardMaterial;if(!personal&&material.name==='Personalised suit')material.color.set(identity.primary);if(!personal&&mesh.name==='Helmet')material.color.set(identity.helmet);return material;});mesh.material=materials.length===1?materials[0]:materials;});if(path.endsWith('/helmeted-study.glb')){const torso=(result.getObjectByName('Racing_suit_torso')||result.getObjectByName('Racing suit torso'));if(torso){const patch=new THREE.Mesh(new THREE.PlaneGeometry(.40,.40),new THREE.MeshStandardMaterial({map:numberTexture,roughness:.8}));patch.userData.studyPatch=true;patch.rotation.y=Math.PI;patch.position.set(0,.12,-.448);torso.add(patch);}}result.updateMatrixWorld(true);result.traverse(o=>{const mesh=o as THREE.SkinnedMesh;if(mesh.isSkinnedMesh)mesh.skeleton.update();});const bounds=new THREE.Box3().setFromObject(result,true),centre=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());const scale=4.8/Math.max(size.y,.001);const wrapper=new THREE.Group();const offset=new THREE.Group();offset.position.set(-centre.x,-bounds.min.y,-centre.z);offset.add(result);wrapper.scale.setScalar(scale);if(path.includes('/portraits/')||path.endsWith('/racing-driver.glb'))wrapper.rotation.y=Math.PI;wrapper.add(offset);return wrapper;},[scene,identity.primary,identity.helmet,personal,path,numberTexture]);
 useEffect(()=>()=>{copy.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;if(mesh.userData.studyPatch)mesh.geometry.dispose();(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>m.dispose());});},[copy]);
 return <group position={[0,-1.7,0]}><primitive object={copy}/></group>;
}
function DriverFigure({driverName}:{driverName:string}){
 return <group position={[0,-1.1,0]}>
  <mesh position={[0,3.55,0]}><sphereGeometry args={[.36,24,18]}/><Paint color="#f7f7fc" roughness={.16}/></mesh>
  <mesh position={[0,3.52,-.31]}><sphereGeometry args={[.28,16,12]}/><Paint color="#171c26" roughness={.1}/></mesh>
  <mesh position={[0,3.43,.17]}><boxGeometry args={[.54,.20,.12]}/><Paint color="#1b2938" roughness={.1}/></mesh>
  <mesh position={[0,2.38,0]}><capsuleGeometry args={[.46,.98,10,20]}/><Paint color="#b82340"/></mesh>
  {[-1,1].map(s=><React.Fragment key={s}>
   <mesh position={[s*.59,2.36,0]} rotation={[0,0,s*.14]}><capsuleGeometry args={[.15,.85,8,16]}/><Paint color="#c52a46"/></mesh>
   <mesh position={[s*.26,.96,0]}><capsuleGeometry args={[.20,1.27,8,16]}/><Paint color="#b82340"/></mesh>
   <mesh position={[s*.27,.19,.16]}><boxGeometry args={[.43,.24,.65]}/><Paint color="#131820"/></mesh>
  </React.Fragment>)}
  <mesh position={[0,2.86,.47]}><boxGeometry args={[.48,.11,.025]}/><Paint color="#ffffff" roughness={.85}/></mesh>
  
 </group>;
}
export default function EngineeringShowcase({driverName,driverId,teamName='',driverNumber='',season}:{driverName:string;driverId?:string;teamName?:string;driverNumber?:string;season?:number}){
 const [carChoice,setCarChoice]=useState(()=>matchGarageCar(driverId,teamName,season)?.id||'concept');
 useEffect(()=>setCarChoice(matchGarageCar(driverId,teamName,season)?.id||'concept'),[driverId,teamName,season]);
 const archiveCar=garageCars.find(car=>car.id===carChoice);
 const {map:engineeringMap,error:groupingError}=useEngineeringMap(archiveCar?.path);
 const [archiveFailure,setArchiveFailure]=useState(false);
 useEffect(()=>setArchiveFailure(false),[carChoice]);
 const [lighting,setLighting]=useState<'night'|'studio'>('studio');
 const [background,setBackground]=useState<'photo'|'plain'>('photo');
 const [photoError,setPhotoError]=useState(false);
 const photoBackdrop=background==='photo'&&!photoError;
 const [cameraDistance,setCameraDistance]=useState(1);
 const capture=useRef<(()=>void)|null>(null);
 const [captureError,setCaptureError]=useState('');
 const [capturedImage,setCapturedImage]=useState('');
 useEffect(()=>()=>{if(capturedImage)URL.revokeObjectURL(capturedImage);},[capturedImage]);
 const [helmetOverride,setHelmetOverride]=useState('');
 useEffect(()=>setHelmetOverride(''),[driverId,driverName]);
 const identity=useMemo(()=>({primary:teamColour(teamName),helmet:helmetOverride||new THREE.Color().setHSL(((driverId||driverName).split('').reduce((n,c)=>n+c.charCodeAt(0),0)%360)/360,.75,.58).getStyle(),number:driverNumber,name:driverName,team:teamName}),[teamName,driverName,driverId,driverNumber,helmetOverride]);
 const [driverStyle,setDriverStyle]=useState<'helmeted'|'original'>('helmeted');
 const personalDriverPath=`/models/drivers/${encodeURIComponent(driverId||'unknown')}.glb`;
 const hasPersonalDriver=useLocalAsset(personalDriverPath);
 const driverPath=hasPersonalDriver?personalDriverPath:driverStyle==='helmeted'?'/models/drivers/helmeted-study.glb':'/models/drivers/racing-driver.glb';
 const carPath='/models/cars/f1-assembly.glb';
 const hasCar=useLocalAsset(carPath);
 const [carCredit,setCarCredit]=useState<{name:string;author:string;source:string;license:string;licenseUrl:string;note:string}|null>(null);
 useEffect(()=>{const controller=new AbortController();fetch('/models/cars/model-info.json',{signal:controller.signal}).then(r=>r.ok?r.json():null).then(info=>{if(info&&typeof info.name==='string'&&typeof info.author==='string')setCarCredit(info);}).catch(()=>{});return()=>controller.abort();},[]);
 const hasDriver=useLocalAsset(driverPath);
 const [mode,setMode]=useState<'car'|'driver'|'garage'|'portrait'>('garage');
 const [exploded,setExploded]=useState(0);
 const [autoRotate,setAutoRotate]=useState(false);
 const [wireframe,setWireframe]=useState(false);
 const [query,setQuery]=useState('');
 const [expanded,setExpanded]=useState(false);
 const [cameraRevision,setCameraRevision]=useState(0);
 const expandButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!expanded)return;
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setExpanded(false);expandButton.current?.focus();}};
  window.addEventListener('keydown',close);
  return ()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',close);};
 },[expanded]);
 const filteredParts=PARTS.filter(p=>`${p.label} ${p.description} ${p.fact}`.toLowerCase().includes(query.trim().toLowerCase()));
 const [selected,setSelected]=useState<PartId|null>(null);
 const [isolate,setIsolate]=useState(false);
 const [view,setView]=useState<View>('threeQuarter');
 const detail=PARTS.find(p=>p.id===selected);
 useEffect(()=>{setSelected(null);setIsolate(false);setExploded(0);setCapturedImage('');},[carChoice]);
 const canInspect=!archiveCar||!!engineeringMap;
 const separatedSelection=selected&&(!archiveCar||engineeringMap?.manifest.available.includes(selected))?selected:null;
 useEffect(()=>{if(archiveCar&&selected&&!separatedSelection)setIsolate(false);},[archiveCar,selected,separatedSelection]);
 const archiveView=archiveCar&&!archiveFailure?<ModelBoundary key={`${archiveCar.path}-${!!engineeringMap}`} onFailure={()=>setArchiveFailure(true)} fallback={<group/>}><React.Suspense fallback={<ModelLoading/>}>{engineeringMap?<EngineeringCar path={archiveCar.path} mapping={engineeringMap} exploded={mode==='car'?exploded:0} selected={mode==='car'?separatedSelection:null} isolate={mode==='car'&&isolate&&!!separatedSelection} onSelect={part=>{setSelected(part);setMode('car');}}/>:<ArchiveCar path={archiveCar.path}/>}</React.Suspense></ModelBoundary>:null;
 return <Identity.Provider value={identity}><section style={{border:'1px solid #314158',background:'#151c28',borderRadius:16,padding:18,marginBottom:18,color:'#f5f8fc',...(expanded?{position:'fixed' as const,inset:12,zIndex:10000,overflowY:'auto' as const,marginBottom:0}: {})}}>
  <h2 style={{margin:'0 0 6px'}}>{driverName} · 3D garage {driverNumber?`#${driverNumber}`:''}</h2><p style={{color:'#b5e3db',fontSize:13}}>{teamName?`${teamName}${season?` · ${season}`:''} · selected team and season`:'Interactive engineering study'} · car and driver studies</p>
  <p style={{fontSize:13,color:'#b4c3d6',marginTop:0}}>Drag to orbit · scroll to zoom · inspect parts in Engineering. A blue wireframe placeholder appears while a model loads.</p>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
   <button style={{...buttonStyle,background:mode==='garage'?'#a92540':'#243249'}} onClick={()=>{setMode('garage');setExploded(0);setIsolate(false);setSelected(null);}}>🏁 Car & driver</button>
   <button style={{...buttonStyle,background:mode==='car'?'#a92540':'#243249'}} onClick={()=>setMode('car')}>🏎️ Engineering</button>
   <button style={{...buttonStyle,background:mode==='driver'?'#a92540':'#243249'}} onClick={()=>setMode('driver')}>🧍 Driver model</button>
   {driverId==='hamilton'&&<button style={{...buttonStyle,background:mode==='portrait'?'#a92540':'#243249'}} onClick={()=>setMode('portrait')}>Hamilton head study</button>}
   {mode==='car'&&<><button style={buttonStyle} disabled={!canInspect} aria-pressed={exploded>0} onClick={()=>setExploded(x=>x>0?0:1)}>{exploded?'↘ Assemble':'↗ Animate disassembly'}</button><button disabled={!canInspect||!!selected&&!separatedSelection} style={{...buttonStyle,background:isolate?'#a92540':'#243249'}} onClick={()=>setIsolate(x=>!x)}>{isolate?'Show all parts':'Isolate selected part'}</button></>}
   <button style={buttonStyle} onClick={()=>{setView('threeQuarter');setExploded(0);setSelected(null);setIsolate(false);setAutoRotate(false);setWireframe(false);setLighting('studio');setBackground('photo');setPhotoError(false);setCameraDistance(1);setHelmetOverride('');setQuery('');setCameraRevision(x=>x+1);}}>Reset</button>
  </div>
  {(mode==='garage'||mode==='driver')&&!hasPersonalDriver&&<label style={{display:'block',marginBottom:12}}>Driver figure <select aria-label="Driver figure" style={buttonStyle} value={driverStyle} onChange={e=>setDriverStyle(e.target.value as 'helmeted'|'original')}><option value="helmeted">Helmeted team-colour study</option><option value="original">Downloaded generic driver</option></select></label>}
  {(mode==='garage'||mode==='car')&&<div style={{marginBottom:12}}><label>Display car <select aria-label="Display car" style={buttonStyle} value={carChoice} onChange={e=>setCarChoice(e.target.value)}><option value="concept">2026 concept · team colour study</option>{garageCars.map(car=><option key={car.id} value={car.id}>{car.season} {car.name} · archive model</option>)}</select></label>{archiveCar&&<p style={{fontSize:13,color:'#c3d2e5'}}>{archiveCar.season} {archiveCar.team} exterior. {matchGarageCar(driverId,teamName,season)?.id===archiveCar.id?'Matched to this profile’s archived team and season.':'Manually selected archive car for comparison.'} Original livery retained; its painted number and driver-specific details may differ from this profile. The same model is used in Engineering. Its surface groups are approximate inspection regions, not manufacturer part boundaries.</p>}</div>}
  <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
   {mode==='car'&&<label style={{fontSize:13}}>Explosion {Math.round(exploded*100)}% <input aria-label="Explosion amount" disabled={!canInspect} type="range" min="0" max="1" step="0.01" value={exploded} onChange={e=>setExploded(Number(e.target.value))}/></label>}
   <button style={buttonStyle} aria-pressed={autoRotate} onClick={()=>setAutoRotate(x=>!x)}>Auto rotation: {autoRotate?'On':'Off'}</button>
   <button style={buttonStyle} aria-pressed={wireframe} onClick={()=>setWireframe(x=>!x)}>Wireframe: {wireframe?'On':'Off'}</button>
   {mode!=='portrait'&&<label style={{fontSize:13}}>Study helmet colour <input aria-label="Concept cockpit helmet colour" type="color" value={identity.helmet.startsWith('#')?identity.helmet:'#'+new THREE.Color(identity.helmet).getHexString()} onChange={e=>setHelmetOverride(e.target.value)}/></label>}
   <label style={{fontSize:13}}>Background <select aria-label="Garage background" style={buttonStyle} value={background} onChange={e=>{setBackground(e.target.value as 'photo'|'plain');setPhotoError(false);}}><option value="photo">Real F1 garage photograph</option><option value="plain">Plain inspection studio</option></select></label>
   <label style={{fontSize:13}}>Lighting <select aria-label="Garage lighting" style={buttonStyle} value={lighting} onChange={e=>setLighting(e.target.value as 'night'|'studio')}><option value="night">Night garage</option><option value="studio">Bright studio</option></select></label>
   <label style={{fontSize:13}}>Camera distance <input aria-label="Garage camera distance" type="range" min=".65" max="1.6" step=".05" value={cameraDistance} onChange={e=>{setCameraDistance(Number(e.target.value));setCameraRevision(x=>x+1);}}/></label>
   <button style={buttonStyle} onClick={()=>{if(capture.current)capture.current();else setCaptureError('Wait for the 3D viewer to finish loading, then try again.');}}>Save 3D image</button>
   <button ref={expandButton} style={buttonStyle} aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>{expanded?'Close expanded viewer':'Expand viewer'}</button>
  </div>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10,alignItems:'center'}}><span style={{fontSize:12,color:'#9cb0c9'}}>Camera:</span>{(['threeQuarter','top','side','front'] as View[]).map(v=><button key={v} style={{...buttonStyle,background:view===v?'#355378':'#243249'}} onClick={()=>{setView(v);setCameraRevision(x=>x+1);}}>{v==='threeQuarter'?'3/4':v[0].toUpperCase()+v.slice(1)}</button>)}</div>
  {capturedImage&&<div style={{padding:10,marginBottom:12,background:'#243249',borderRadius:8}}><a style={{color:'#86c8ff'}} href={capturedImage} download={`${driverId||'driver'}-${season||'study'}-garage.png`}>Download saved 3D image (PNG)</a><button style={{...buttonStyle,marginLeft:12}} onClick={()=>setCapturedImage('')}>Close saved image</button><img src={capturedImage} alt="Saved 3D garage preview" style={{display:'block',maxWidth:'100%',width:320,marginTop:10}}/></div>}
  {captureError&&<p role="alert">{captureError}</p>}
  <p aria-live="polite" style={{fontSize:12,color:'#b5e3db'}}>Viewing {mode==='car'?`${archiveCar?.name||'Engineering concept'} · ${detail?.label||'choose a component'}`:mode==='portrait'?'Hamilton historical head study':`${archiveCar?.name||'engineering concept'} · ${driverName}${driverNumber?` #${driverNumber}`:''} · generic standing figure`}</p>
  <div style={{position:'relative',height:expanded?'65vh':410,background:'#0a131f',borderRadius:12,overflow:'hidden'}}>
   {photoBackdrop&&<><img src={GARAGE_PHOTO.path} alt="Historic AlphaTauri F1 garage at Silverstone, photographed in 2021" onError={()=>setPhotoError(true)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/><div aria-hidden="true" style={{position:'absolute',inset:0,background:'linear-gradient(rgba(8,15,25,.18),rgba(8,15,25,.4) 55%,rgba(8,15,25,.94))'}}/></>}
   <Canvas camera={{position:cameraPositions.threeQuarter,fov:40,near:.1,far:150}}>{!photoBackdrop&&<color attach="background" args={[lighting==='studio'?'#dce4ec':'#0a131f']}/>}<ambientLight intensity={lighting==='studio'?2:1.25}/><directionalLight position={[6,9,5]} intensity={2.1}/><directionalLight position={[-4,3,-5]} intensity={1.6}/>{!photoBackdrop&&<gridHelper args={[20,20,'#375064','#1c2d3f']}/>} {photoBackdrop&&<><mesh name="garage-display-floor" rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]}><planeGeometry args={[8,9]}/><meshStandardMaterial color="#252a30" roughness={.92}/></mesh><ContactShadows position={[0,-.025,0]} opacity={.65} scale={15} blur={2.5} far={5} resolution={256}/></>}
    {mode==='garage'&&<group position={[2.25,.646,0]} scale={.38}><ModelBoundary key={driverPath} fallback={<DriverFigure driverName={driverName}/>}><React.Suspense fallback={<ModelLoading/>}>{hasDriver?<ImportedDriver path={driverPath} personal={hasPersonalDriver}/>:<DriverFigure driverName={driverName}/>}</React.Suspense></ModelBoundary></group>}
    {mode==='portrait'?<ModelBoundary key="hamilton-portrait" fallback={<DriverFigure driverName={driverName}/>}><React.Suspense fallback={<ModelLoading/>}><ImportedDriver path="/models/drivers/portraits/hamilton.glb" personal/></React.Suspense></ModelBoundary>:mode!=='driver'?(archiveCar?archiveView:hasCar ? <ModelBoundary fallback={<Car exploded={exploded} selected={selected} isolate={isolate} onSelect={setSelected}/>}><React.Suspense fallback={<ModelLoading/>}><ImportedCar path={carPath} exploded={exploded} selected={selected} isolate={isolate} onSelect={setSelected}/></React.Suspense></ModelBoundary> : <Car exploded={exploded} selected={selected} isolate={isolate} onSelect={setSelected}/>):(hasDriver ? <ModelBoundary key={driverPath} fallback={<DriverFigure driverName={driverName}/>}><React.Suspense fallback={<ModelLoading/>}><ImportedDriver path={driverPath} personal={hasPersonalDriver}/></React.Suspense></ModelBoundary> : <DriverFigure driverName={driverName}/>)}
    <Wireframe enabled={wireframe}/><GarageCapture backdrop={photoBackdrop} capture={capture} filename={`${driverId||'driver'}-${season||'study'}-${mode}.png`} caption={`${driverName} · ${season||'study'} · ${mode==='portrait'?'Historical head study':mode==='driver'?'Generic driver study':(mode==='garage'||mode==='car')&&archiveCar?archiveCar.name:'Engineering concept'}`} credit={mode==='portrait'?'Lewis Hamilton Head — Sroxyn · CC BY 4.0 · sketchfab.com/models/c69461d659434988be815d2164b81043':mode==='driver'?(driverStyle==='original'?'Race driver — BELAZ · CC BY 4.0 · sketchfab.com/models/e4e97df9865d466c8359fbb23e757308':'Original helmeted study figure — F1 Strategy Lab'):(mode==='garage'||mode==='car')&&archiveCar?`${archiveCar.name} — ${archiveCar.author} · ${archiveCar.license} · ${archiveCar.source}`:'2026 concept — Qvist_designs / APEX · CC BY 4.0 · sketchfab.com/models/ea3bde709b1e4dc9b0ec8557d106ed42'} onReady={setCapturedImage} onError={setCaptureError}/><CameraRig key={`${cameraRevision}-${mode}`} view={view} distance={cameraDistance}/><OrbitControls autoRotate={autoRotate} autoRotateSpeed={1.3} makeDefault target={[0,mode==='driver'||mode==='portrait'?1.4:0,0]} enableDamping minDistance={3.4} maxDistance={33}/>
   </Canvas>
  </div>
  {photoBackdrop&&<p style={{fontSize:12,color:'#b5c8dc'}}>Photographic backdrop: <a href={GARAGE_PHOTO.source} target="_blank" rel="noreferrer" style={{color:'#86c8ff'}}>{GARAGE_PHOTO.title} by {GARAGE_PHOTO.author}</a> · <a href={GARAGE_PHOTO.licenseUrl} target="_blank" rel="noreferrer" style={{color:'#86c8ff'}}>{GARAGE_PHOTO.license}</a>. Resized and shaded for display. Historical setting shared across teams, with a rendered display floor; the photograph stays fixed while you orbit the 3D model.</p>}
  {photoError&&<p role="alert">The garage photograph could not load. Plain inspection background shown; choose the photo again to retry.</p>}
  {archiveCar&&archiveFailure&&<p role="alert">The selected car could not load. Choose another car above; no different car has been substituted.</p>}
  {archiveCar&&mode==='car'&&<p role="status" style={{fontSize:13,color:'#b5e3db'}}>{groupingError||(!engineeringMap?'Preparing the selected car’s component groups…':selected&&!separatedSelection?'This component is not separated in this exterior model. Its explanation is shown below; the same complete car remains visible.':'Inspecting surface groups from the selected car. Some adjoining details remain in the body group. Explosion spacing is illustrative, not a workshop disassembly.')}</p>}
  {mode==='car'&&<><label style={{display:'block',marginTop:12,fontSize:13}}>Search components <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Wing, tyres, power…" style={{...buttonStyle,cursor:'text',maxWidth:'100%',boxSizing:'border-box'}}/></label>{filteredParts.length===0&&<p role="status">No components match your search.</p>}<div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:12}}>{filteredParts.map(p=><button key={p.id} style={{...buttonStyle,background:selected===p.id?'#a92540':'#243249'}} onClick={()=>setSelected(p.id)}>{p.label}{archiveCar&&engineeringMap&&!engineeringMap.manifest.available.includes(p.id)?' · explanation only':''}</button>)}</div><div style={{background:'#1d293a',padding:13,borderRadius:10,marginTop:12}}><strong>{detail?.label??'Choose a component'}</strong><p style={{fontSize:13,marginBottom:detail?8:0,color:'#c3d2e5'}}>{detail?.description??`Select a component to read how it works and why F1 uses it. You are inspecting ${archiveCar?.name||'the engineering concept'}. Exploded spacing and surface grouping are teaching aids, not a workshop disassembly sequence. This exterior model does not simulate airflow, crashes, heat or tyre deformation.`}</p>{detail&&<><small style={{color:'#92b8db'}}>{detail.fact}</small><EngineeringDetails id={detail.id}/><p style={{fontSize:13,lineHeight:1.6,color:'#b5e3db',marginBottom:0}}><strong>Engineering → strategy: </strong>{STRATEGY_NOTES[detail.id]}</p></>}</div></>}
  {mode==='garage'&&<p style={{fontSize:13,color:'#c3d2e5'}}>Car and standing driver shown together at an illustrative relative scale. The concept car includes a helmeted cockpit figure; downloaded cars retain their original contents. Choose Engineering to explore the individual car parts, or Driver model for a closer look.</p>}
  {mode==='portrait'&&<p style={{fontSize:13,color:'#c3d2e5'}}>Lewis Hamilton head study by <a href="https://sketchfab.com/3d-models/lewis-hamilton-head-c69461d659434988be815d2164b81043" target="_blank" rel="noreferrer" style={{color:'#86c8ff'}}>Sroxyn</a> · CC BY 4.0. Head only, released in 2023; eye detail is incomplete. Not a full-body or season-specific driver model. Display fitted for this viewer.</p>}
  {(mode==='driver'||mode==='garage')&&<p style={{fontSize:13,color:'#c3d2e5'}}>{hasDriver ? (hasPersonalDriver?'Profile-specific driver model loaded.':driverStyle==='helmeted'?'Original helmeted figure with team-colour suit and study helmet. Not an authentic suit, helmet or driver likeness.':'Generic rigged racing-driver model by BELAZ, with original outfit and face. Not a likeness of this profile’s driver.') : `Generic driver mannequin shown until a licensed GLB model of ${driverName} is installed.`}</p>}
  {(mode==='driver'||mode==='garage')&&!hasPersonalDriver&&driverStyle==='original'&&<p style={{fontSize:11,color:'#91a4ba'}}>Generic driver: <a style={{color:'#86c8ff'}} href="https://sketchfab.com/3d-models/race-driver-e4e97df9865d466c8359fbb23e757308" target="_blank" rel="noreferrer">BELAZ</a> · <a style={{color:'#86c8ff'}} href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Fitted for this viewer; no animations supplied.</p>}
  {(mode==='garage'||mode==='car')&&archiveCar&&<p style={{fontSize:12}}>Archive car: <a style={{color:'#86c8ff'}} href={archiveCar.source} target="_blank" rel="noreferrer">{archiveCar.name} by {archiveCar.author}</a> · <a style={{color:'#86c8ff'}} href={archiveCar.licenseUrl} target="_blank" rel="noreferrer">{archiveCar.license}</a>. Display fitted and oriented; original materials preserved.</p>}
  {!archiveCar&&<p style={{fontSize:11,color:'#91a4ba',marginBottom:0}}>{hasCar ? (carCredit?`${carCredit.name} · ${carCredit.note}`:'Custom car model. Component disassembly depends on named, separate meshes.') : 'Concept geometry shown until a component-separated car GLB is added. Not an authentic car.'}</p>}
  {!archiveCar&&hasCar&&carCredit&&<p style={{fontSize:11}}>{carCredit.source?.startsWith('https://')?<a href={carCredit.source} target="_blank" rel="noreferrer" style={{color:'#86c8ff'}}>Car by {carCredit.author}</a>:`Car by ${carCredit.author}`} · {carCredit.licenseUrl?.startsWith('https://')?<a href={carCredit.licenseUrl} target="_blank" rel="noreferrer" style={{color:'#86c8ff'}}>{carCredit.license}</a>:carCredit.license}</p>}
 </section></Identity.Provider>;
}
