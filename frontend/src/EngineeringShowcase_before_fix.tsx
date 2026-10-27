import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type PartId = 'body' | 'frontWing' | 'rearWing' | 'floor' | 'power' | 'wheels' | 'suspension';
type View = 'threeQuarter' | 'top' | 'side' | 'front';
const PARTS: {id:PartId; label:string; description:string; fact:string}[] = [
 {id:'body',label:'Monocoque & bodywork',description:'The survival cell protects the driver; sidepods and engine cover guide airflow.',fact:'Carbon-fibre composite survival structure'},
 {id:'frontWing',label:'Front wing',description:'Shapes airflow around the front tyres while managing downforce and drag.',fact:'Multi-element aerodynamic assembly'},
 {id:'rearWing',label:'Rear wing',description:'Controls rear aerodynamic load. Modern regulations allow active aero configurations.',fact:'Rear aerodynamic assembly'},
 {id:'floor',label:'Floor & diffuser',description:'Manages airflow under the car and contributes to total downforce.',fact:'Aerodynamic underbody'},
 {id:'power',label:'Hybrid power unit',description:'Combines combustion and electrical energy systems; this model shows only a conceptual housing.',fact:'Combustion and electrical systems'},
 {id:'wheels',label:'Wheels & tyres',description:'Tyre behaviour influences grip, braking, degradation and race strategy.',fact:'Four wheel assemblies'},
 {id:'suspension',label:'Suspension',description:'Connects wheels to the chassis and controls wheel movement and loading.',fact:'Wishbones and suspension links'},
];
const buttonStyle:React.CSSProperties={border:'1px solid #42536e',borderRadius:9,padding:'9px 11px',background:'#243249',color:'#f3f6fd',cursor:'pointer',fontSize:12};
const cameraPositions:Record<View,[number,number,number]>={threeQuarter:[9,6,12],top:[0,15,0.01],side:[14,3,0],front:[0,3,-14]};
const partOffsets:Record<PartId,[number,number,number]>={body:[0,0,0],frontWing:[0,0,-3.0],rearWing:[0,1.4,2.9],floor:[0,-1.3,0],power:[0,2.0,.85],wheels:[2.1,.3,0],suspension:[-2,.3,0]};
function CameraRig({view}:{view:View}){
 const {camera}=useThree();
 const elapsed=useRef(0);
 const target=useMemo(()=>new THREE.Vector3(...cameraPositions[view]),[view]);
 useEffect(()=>{elapsed.current=0;},[view]);
 useFrame((_,dt)=>{
  if(elapsed.current>=1.3)return;
  elapsed.current+=dt;
  camera.position.lerp(target,1-Math.exp(-5*dt));
 });
 return null;
}
function ComponentGroup({id,exploded,selected,isolate,onSelect,children}:{id:PartId;exploded:boolean;selected:PartId|null;isolate:boolean;onSelect:(id:PartId)=>void;children:React.ReactNode}){
 const group=useRef<THREE.Group>(null);
 const goal=useMemo(()=>new THREE.Vector3(...partOffsets[id]),[id]);
 useFrame((_,dt)=>{if(group.current){const v=exploded?goal:new THREE.Vector3();group.current.position.lerp(v,1-Math.exp(-5*dt));}});
 return <group ref={group} visible={!isolate||selected===null||selected===id} onClick={e=>{e.stopPropagation();onSelect(id)}}>
   <group scale={selected===id?1.04:1}>{children}</group>
   {selected===id&&<Html center position={[0,1.8,0]} style={{pointerEvents:'none',background:'#14233fe8',padding:'5px 8px',color:'white',border:'1px solid #7691b7',borderRadius:7,fontSize:12,whiteSpace:'nowrap'}}>{PARTS.find(p=>p.id===id)?.label}</Html>}
 </group>;
}
function Paint({color,metalness=.4,roughness=.36}:{color:string;metalness?:number;roughness?:number}){return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness}/>;}
function Car({exploded,selected,isolate,onSelect}:{exploded:boolean;selected:PartId|null;isolate:boolean;onSelect:(id:PartId)=>void}){
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
  <mesh position={[0,.81,-.25]}><sphereGeometry args={[.35,16,12]}/><Paint color="#171d2a" roughness={.13}/></mesh>
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
  fetch(url, { method: 'HEAD', signal: controller.signal })
   .then(r => { if (!controller.signal.aborted) setExists(r.ok && (r.headers.get('content-type') || '').toLowerCase().includes('model') || (r.ok && url.endsWith('.glb'))); })
   .catch(() => {});
  return () => controller.abort();
 }, [url]);
 return exists;
}

function classifyMesh(name: string): PartId | null {
 const n = name.toLowerCase().replace(/[^a-z0-9]/g, '');
 if (/frontwing|nosewing/.test(n)) return 'frontWing';
 if (/rearwing|drswing/.test(n)) return 'rearWing';
 if (/floor|diffuser|undertray/.test(n)) return 'floor';
 if (/engine|powerunit|motor|turbo|battery/.test(n)) return 'power';
 if (/suspension|wishbone|pushrod|pullrod|steeringarm/.test(n)) return 'suspension';
 if (/wheel|tyre|tire|rim/.test(n)) return 'wheels';
 if (/body|chassis|sidepod|monocoque|enginecover|nose/.test(n)) return 'body';
 return null;
}

// A detailed imported GLB must have semantic mesh/group names so parts can move separately.
function ImportedCar({path,exploded,selected,isolate,onSelect}:{path:string;exploded:boolean;selected:PartId|null;isolate:boolean;onSelect:(id:PartId)=>void}) {
 const {scene} = useGLTF(path);
 const copy = useMemo(() => scene.clone(true), [scene]);
 const parts = useMemo(() => {
  const result: {object:THREE.Object3D; id:PartId; original:THREE.Vector3}[]=[];
  copy.traverse(obj => {
   if (!(obj as THREE.Mesh).isMesh) return;
   const id = classifyMesh(obj.name) ?? (obj.parent ? classifyMesh(obj.parent.name) : null);
   if (id) result.push({object:obj,id,original:obj.position.clone()});
  });
  return result;
 }, [copy]);
 useFrame((_,dt) => {
  const alpha=1-Math.exp(-4*dt);
  parts.forEach(p => {
   const offset = exploded ? new THREE.Vector3(...partOffsets[p.id]) : new THREE.Vector3();
   p.object.position.lerp(p.original.clone().add(offset),alpha);
  });
 });
 useEffect(() => {
  parts.forEach(p => { p.object.visible = !isolate || selected === null || p.id === selected; });
 },[parts,isolate,selected]);
 return <group scale={.9} onClick={e => {
  let node:THREE.Object3D|null=e.object;
  while(node && node!==copy){const id=classifyMesh(node.name); if(id){e.stopPropagation();onSelect(id);return;}node=node.parent;}
 }}><primitive object={copy}/></group>;
}
function ImportedDriver({path}:{path:string}) {
 const {scene}=useGLTF(path);
 const copy=useMemo(()=>scene.clone(true),[scene]);
 return <group position={[0,-1.9,0]} scale={1.8}><primitive object={copy}/></group>;
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
  <Html position={[0,4.25,0]} center style={{pointerEvents:'none',background:'#182b42d9',color:'white',padding:'4px 8px',borderRadius:6,whiteSpace:'nowrap'}}>{driverName} · concept figure</Html>
 </group>;
}
export default function EngineeringShowcase({driverName,driverId}:{driverName:string;driverId?:string}){
 const driverPath=`/models/drivers/${encodeURIComponent(driverId || 'unknown')}.glb`;
 const carPath='/models/cars/f1-assembly.glb';
 const hasCar=useLocalAsset(carPath);
 const hasDriver=useLocalAsset(driverPath);
 const [mode,setMode]=useState<'car'|'driver'>('car');
 const [exploded,setExploded]=useState(false);
 const [selected,setSelected]=useState<PartId|null>(null);
 const [isolate,setIsolate]=useState(false);
 const [view,setView]=useState<View>('threeQuarter');
 const detail=PARTS.find(p=>p.id===selected);
 return <section style={{border:'1px solid #314158',background:'#151c28',borderRadius:16,padding:18,marginBottom:18,color:'#f5f8fc'}}>
  <h2 style={{margin:'0 0 6px'}}>Interactive 3D engineering lab</h2>
  <p style={{fontSize:13,color:'#b4c3d6',marginTop:0}}>Drag to orbit · scroll to zoom · click a part to inspect it</p>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
   <button style={{...buttonStyle,background:mode==='car'?'#a92540':'#243249'}} onClick={()=>setMode('car')}>🏎️ Engineering</button>
   <button style={{...buttonStyle,background:mode==='driver'?'#a92540':'#243249'}} onClick={()=>setMode('driver')}>🧍 Driver concept</button>
   {mode==='car'&&<><button style={buttonStyle} onClick={()=>setExploded(x=>!x)}>{exploded?'↘ Assemble':'↗ Animate disassembly'}</button><button style={{...buttonStyle,background:isolate?'#a92540':'#243249'}} onClick={()=>setIsolate(x=>!x)}>{isolate?'Show all parts':'Isolate selected part'}</button></>}
   <button style={buttonStyle} onClick={()=>{setView('threeQuarter');setExploded(false);setSelected(null);setIsolate(false);}}>Reset</button>
  </div>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10,alignItems:'center'}}><span style={{fontSize:12,color:'#9cb0c9'}}>Camera:</span>{(['threeQuarter','top','side','front'] as View[]).map(v=><button key={v} style={{...buttonStyle,background:view===v?'#355378':'#243249'}} onClick={()=>setView(v)}>{v==='threeQuarter'?'3/4':v[0].toUpperCase()+v.slice(1)}</button>)}</div>
  <div style={{height:410,background:'#0a131f',borderRadius:12,overflow:'hidden'}}>
   <Canvas camera={{position:cameraPositions.threeQuarter,fov:45,near:.1,far:150}}><color attach="background" args={['#0a131f']}/><ambientLight intensity={1.25}/><directionalLight position={[6,9,5]} intensity={2.1}/><directionalLight position={[-4,3,-5]} intensity={.65}/><gridHelper args={[20,20,'#375064','#1c2d3f']}/>
    {mode==='car'?(hasCar ? <React.Suspense fallback={null}><ImportedCar path={carPath} exploded={exploded} selected={selected} isolate={isolate} onSelect={setSelected}/></React.Suspense> : <Car exploded={exploded} selected={selected} isolate={isolate} onSelect={setSelected}/>):(hasDriver ? <React.Suspense fallback={null}><ImportedDriver path={driverPath}/></React.Suspense> : <DriverFigure driverName={driverName}/>)}
    <CameraRig view={view}/><OrbitControls makeDefault target={[0,mode==='driver'?1.4:0,0]} enableDamping minDistance={3.4} maxDistance={33}/>
   </Canvas>
  </div>
  {mode==='car'&&<><div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:12}}>{PARTS.map(p=><button key={p.id} style={{...buttonStyle,background:selected===p.id?'#a92540':'#243249'}} onClick={()=>setSelected(p.id)}>{p.label}</button>)}</div><div style={{background:'#1d293a',padding:13,borderRadius:10,marginTop:12}}><strong>{detail?.label??'Choose a component'}</strong><p style={{fontSize:13,marginBottom:detail?8:0,color:'#c3d2e5'}}>{detail?.description??'Select a part on the car or use the component buttons below the viewer.'}</p>{detail&&<small style={{color:'#92b8db'}}>{detail.fact}</small>}</div></>}
  {mode==='driver'&&<p style={{fontSize:13,color:'#c3d2e5'}}>{hasDriver ? 'Imported 3D model.' : `Generic driver mannequin shown until a licensed GLB model of ${driverName} is installed.`}</p>}
  <p style={{fontSize:11,color:'#91a4ba',marginBottom:0}}>{hasCar ? 'Custom 3D assembly loaded. Disassembly needs individual, named mesh objects (frontWing, rearWing, etc.) for accurate motion.' : 'Concept geometry shown until a component-separated car GLB is added. Not an authentic car.'}</p>
 </section>;
}
