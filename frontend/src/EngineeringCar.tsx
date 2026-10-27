import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
export type CarPart='body'|'frontWing'|'rearWing'|'floor'|'power'|'wheels'|'suspension';
type Bounds={min:number[];max:number[]};
type Manifest={version:number;method:string;entries:{name:string;offset:number;triangles:number;bounds:Record<string,Bounds>}[];normalization:{turn:number[];centre:number[];scale:number};available:CarPart[];triangle_count:number};
export type EngineeringMap={path:string;manifest:Manifest;labels:Uint8Array};
const ids:CarPart[]=['body','frontWing','rearWing','floor','power','wheels','wheels','wheels','wheels','suspension'];
export function useEngineeringMap(path:string|undefined){
 const [state,setState]=useState<{map:EngineeringMap|null;error:string}>({map:null,error:''});
 useEffect(()=>{setState({map:null,error:''});if(!path)return;const controller=new AbortController();const folder=path.slice(0,path.lastIndexOf('/'));
  Promise.all([fetch(`${folder}/engineering-parts.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('mapping');return r.json();}),fetch(`${folder}/engineering-parts.bin`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('mapping');return r.arrayBuffer();})]).then(([manifest,binary]:[Manifest,ArrayBuffer])=>{
   const labels=new Uint8Array(binary);if(manifest.version!==1||manifest.triangle_count!==labels.length||!Array.isArray(manifest.entries)||manifest.entries.some(e=>e.offset<0||e.offset+e.triangles>labels.length)||labels.some(code=>code>=ids.length))throw Error('mapping');if(!controller.signal.aborted)setState({map:{path,manifest,labels},error:''});
  }).catch(()=>{if(!controller.signal.aborted)setState({map:null,error:'Component grouping could not load. The same selected car remains visible.'});});return()=>controller.abort();
 },[path]);
 return {map:state.map?.path===path?state.map:null,error:state.error};
}
export default function EngineeringCar({path,mapping,exploded,selected,isolate,onSelect}:{path:string;mapping:EngineeringMap;exploded:number;selected:CarPart|null;isolate:boolean;onSelect:(part:CarPart)=>void}){
 const {scene}=useGLTF(path);
 const parts=useMemo(()=>{
  const root=scene.clone(true);root.updateMatrixWorld(true);const {turn:t,centre:c,scale:s}=mapping.manifest.normalization;
  const turn=new THREE.Matrix4().set(t[0],t[1],t[2],0,t[3],t[4],t[5],0,t[6],t[7],t[8],0,0,0,0,1);
  const fit=new THREE.Matrix4().makeScale(-s,s,-s).multiply(new THREE.Matrix4().makeTranslation(-c[0],-c[1],-c[2])).multiply(turn);
  const entries=new Map(mapping.manifest.entries.map(e=>[e.name,e]));const result:{mesh:THREE.Mesh;id:CarPart;offset:THREE.Vector3;emissive:THREE.Color[]}[]=[];
  root.traverse(object=>{const original=object as THREE.Mesh;if(!original.isMesh)return;const entry=entries.get(original.name);if(!entry)throw Error('Source mesh does not match component grouping');const base=original.geometry.clone().applyMatrix4(original.matrixWorld).applyMatrix4(fit);const index=base.getIndex();const length=index?.count??base.getAttribute('position').count;if(length!==entry.triangles*3)throw Error('Source triangles do not match component grouping');
   const triangles=new Map<number,number[]>();for(let i=0;i<entry.triangles;i++){const code=mapping.labels[entry.offset+i];if(!triangles.has(code))triangles.set(code,[]);const group=triangles.get(code)!;for(let k=0;k<3;k++)group.push(index?index.getX(i*3+k):i*3+k);}
   triangles.forEach((indices,code)=>{const geometry=new THREE.BufferGeometry();Object.entries(base.attributes).forEach(([name,attribute])=>geometry.setAttribute(name,attribute));geometry.setIndex(indices);const b=entry.bounds[String(code)];geometry.boundingBox=new THREE.Box3(new THREE.Vector3(...b.min as [number,number,number]),new THREE.Vector3(...b.max as [number,number,number]));geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
    const materials=(Array.isArray(original.material)?original.material:[original.material]).map(m=>m.clone() as THREE.MeshStandardMaterial);const mesh=new THREE.Mesh(geometry,materials.length===1?materials[0]:materials);mesh.name=`${original.name}-${ids[code]}-${code}`;mesh.userData.part=ids[code];mesh.castShadow=mesh.receiveShadow=true;
    const centre=geometry.boundingBox.getCenter(new THREE.Vector3());const offset=code>=5&&code<=8?new THREE.Vector3(code%2===1?-1.8:1.8,.3,code<7?-.6:.6):new THREE.Vector3(...({body:[0,1.5,0],frontWing:[0,.2,-2.2],rearWing:[0,1.2,2],floor:[0,-.6,0],power:[0,2,.6],suspension:[0,1.2,Math.sign(centre.z)*.8],wheels:[0,0,0]}[ids[code]] as [number,number,number]));
    result.push({mesh,id:ids[code],offset,emissive:materials.map(m=>m.emissive?.clone()||new THREE.Color())});
   });
  });return result;
 },[scene,mapping]);
 const target=useRef(new THREE.Vector3());
 useFrame((_,dt)=>parts.forEach(p=>p.mesh.position.lerp(target.current.copy(p.offset).multiplyScalar(exploded),1-Math.exp(-4*dt))));
 useEffect(()=>{parts.forEach(p=>{p.mesh.visible=!isolate||!selected||p.id===selected;(Array.isArray(p.mesh.material)?p.mesh.material:[p.mesh.material]).forEach((material,i)=>{const m=material as THREE.MeshStandardMaterial;if(m.emissive){m.emissive.copy(p.emissive[i]);if(p.id===selected&&!isolate)m.emissive.add(new THREE.Color('#493000').multiplyScalar(.15));}});});},[parts,selected,isolate]);
 useEffect(()=>()=>{parts.forEach(p=>{p.mesh.geometry.dispose();(Array.isArray(p.mesh.material)?p.mesh.material:[p.mesh.material]).forEach(m=>m.dispose());});},[parts]);
 return <group onClick={event=>{const id=event.object.userData.part as CarPart|undefined;if(id){event.stopPropagation();onSelect(id);}}}>{parts.map(p=><primitive key={p.mesh.name} object={p.mesh}/>)}</group>;
}
