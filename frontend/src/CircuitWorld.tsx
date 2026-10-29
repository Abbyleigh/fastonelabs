import {getCircuitTransform} from './circuit/CircuitCoordinates';
import {useEffect,useMemo,useRef} from 'react';
import {Sky} from '@react-three/drei';
import * as THREE from 'three';
import CircuitScenery from './circuit/CircuitScenery';
type XY=[number,number];
function surfaceTexture(grass:boolean){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const context=canvas.getContext('2d')!,pixels=context.createImageData(128,128);let seed=731;
 for(let i=0;i<pixels.data.length;i+=4){seed=(1664525*seed+1013904223)>>>0;const n=seed/4294967296;pixels.data[i]=grass?35+n*24:47+n*25;pixels.data[i+1]=grass?66+n*32:49+n*25;pixels.data[i+2]=grass?29+n*20:52+n*25;pixels.data[i+3]=255;}
 context.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.repeat.set(grass?90:1,grass?90:1);return texture;
}

// FASTONE GRAVEL TEXTURE V1
function gravelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(256, 256);
  let seed = 1977;

  function random() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  for (let i = 0; i < image.data.length; i += 4) {
    const variation = random() * 65;
    image.data[i] = 126 + variation;
    image.data[i + 1] = 115 + variation * .88;
    image.data[i + 2] = 96 + variation * .72;
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  for (let i = 0; i < 2600; i++) {
    const shade = random() > .5 ? 230 : 72;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${.1 + random() * .25})`;
    ctx.beginPath();
    ctx.ellipse(
      random() * 256,
      random() * 256,
      .3 + random() * 1.6,
      .3 + random() * 1.2,
      random() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export default function CircuitWorld({
 coordinates,
 daylight=true,
 mode='realistic',eventName,year
}:{
 coordinates:XY[];
 daylight?:boolean;
 mode?:'realistic'|'engineering';
 eventName?:string;
 year?:number;
}){
 const barriers=useRef<THREE.InstancedMesh>(null);
 const fencePosts=useRef<THREE.InstancedMesh>(null);
 const textures=useMemo(()=>({grass:surfaceTexture(true),asphalt:surfaceTexture(false),gravel:gravelTexture()}),[]);
 const world=useMemo(()=>{
  const {cx,cy,scale}=getCircuitTransform(coordinates);
  const curve=new THREE.CatmullRomCurve3(coordinates.map(([x,y])=>new THREE.Vector3((x-cx)*scale,.06,-(y-cy)*scale)),true,'centripetal');
  const count=720,points=curve.getSpacedPoints(count).slice(0,count);
  function ribbon(inner:number,outer:number,height:number,striped=false){const positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
   for(let i=0;i<=count;i++){const p=points[i%count],before=points[(i+count-1)%count],after=points[(i+1)%count];const tangent=after.clone().sub(before).normalize(),normal=new THREE.Vector3(-tangent.z,0,tangent.x);for(const w of [inner,outer]){positions.push(p.x+normal.x*w,height,p.z+normal.z*w);uv.push(w===inner?0:1,i/count*90);const colour=striped&&Math.floor(i/3)%2===0?new THREE.Color('#d93838'):new THREE.Color('#eee9df');colors.push(colour.r,colour.g,colour.b);}if(i<count){const a=i*2,b=a+2;indices.push(a,b,a+1,a+1,b,b+1);}}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(striped)geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }
  // FASTONE CIRCUIT SAFETY SYSTEM V2
  // Follow the existing track curve; exclude crowded parallel sections.

  const railMatrices:THREE.Matrix4[]=[];
  const postMatrices:THREE.Matrix4[]=[];
  const fenceLines:number[]=[];

  const safePoint=(index:number,side:number)=>{
    const p=points[index];
    const before=points[(index+count-1)%count];
    const after=points[(index+1)%count];
    const tangent=after.clone().sub(before).normalize();
    const normal=new THREE.Vector3(-tangent.z,0,tangent.x);
    const candidate=p.clone().addScaledVector(normal,side*3.1);

    for(let j=0;j<count;j++){
      const separation=Math.min(
        Math.abs(index-j),
        count-Math.abs(index-j)
      );
      if(separation<12)continue;
      const q=points[j];
      if(Math.hypot(candidate.x-q.x,candidate.z-q.z)<2.25){
        return false;
      }
    }
    return true;
  };

  for(const side of [-1,1]){
    const allowed=points.map((_,i)=>safePoint(i,side));

    const offsetPoint=(index:number,distance:number,height:number)=>{
      const p=points[index%count];
      const before=points[(index+count-1)%count];
      const after=points[(index+1)%count];
      const tangent=after.clone().sub(before).normalize();
      const normal=new THREE.Vector3(-tangent.z,0,tangent.x);
      return p.clone()
        .addScaledVector(normal,side*distance)
        .setY(height);
    };

    for(let i=0;i<count;i++){
      const next=(i+1)%count;
      if(!allowed[i]||!allowed[next])continue;

      const a=offsetPoint(i,2.75,.4);
      const b=offsetPoint(next,2.75,.4);
      const direction=b.clone().sub(a);
      const length=direction.length();
      if(length<.001||length>3)continue;

      for(const height of [.34,.57]){
        const dummy=new THREE.Object3D();
        dummy.position.copy(a).add(b).multiplyScalar(.5);
        dummy.position.y=height;
        dummy.rotation.y=Math.atan2(direction.x,direction.z);
        dummy.scale.z=length+.025;
        dummy.updateMatrix();
        railMatrices.push(dummy.matrix.clone());
      }
    }

    // FASTONE CONTINUOUS CATCH FENCING V3
    // Build the wire grid between adjacent track samples.
    // This prevents missing panels around tight corners.

    for(let i=0;i<count;i++){

      if(!allowed[i])continue;

      // Structural support posts every fourth sample.
      if(i%4===0){

        const post=offsetPoint(i,3.1,1.48);
        const dummy=new THREE.Object3D();

        dummy.position.copy(post);
        dummy.updateMatrix();

        postMatrices.push(dummy.matrix.clone());

      }

      const next=(i+1)%count;

      // Preserve safety exclusions around crowded track sections.
      if(!allowed[next])continue;

      const a=offsetPoint(i,3.1,0);
      const b=offsetPoint(next,3.1,0);
      const length=a.distanceTo(b);

      // Avoid invalid geometry or bridges across sharp corners.
      if(length<.001||length>3)continue;

      // Horizontal mesh wires.
      for(const height of [.72,.96,1.20,1.44,1.68,1.92,2.16]){

        fenceLines.push(
          a.x,height,a.z,
          b.x,height,b.z
        );

      }

      // Vertical mesh wires every second sample.
      if(i%2===0){

        fenceLines.push(
          a.x,.72,a.z,
          a.x,2.16,a.z
        );

      }

    }


  }

  const fenceGeometry=new THREE.BufferGeometry();
  fenceGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(fenceLines,3)
  );


  // FASTONE CORNER GRAVEL TRAPS V1
  // Illustrative gravel runoff, not surveyed circuit data.
  const trapPositions:number[]=[];
  const trapUV:number[]=[];

  const addTrapTriangle=(
    a:THREE.Vector3,
    b:THREE.Vector3,
    c:THREE.Vector3
  )=>{
    for(const p of [a,b,c]){
      trapPositions.push(p.x,p.y,p.z);
      trapUV.push(p.x*.35,p.z*.35);
    }
  };

  for(let i=0;i<count;i++){
    const next=(i+1)%count;

    const previous=points[(i+count-1)%count];
    const current=points[i];
    const following=points[next];
    const after=points[(i+2)%count];

    const incoming=current.clone().sub(previous).normalize();
    const outgoing=following.clone().sub(current).normalize();

    const turn=incoming.x*outgoing.z-incoming.z*outgoing.x;

    // Only create broad runoff around significant bends.
    if(Math.abs(turn)<.012)continue;

    const side=turn>0?-1:1;

    if(!safePoint(i,side)||!safePoint(next,side))continue;

    const makeOffset=(index:number,distance:number)=>{
      const p=points[index];
      const before=points[(index+count-1)%count];
      const after=points[(index+1)%count];

      const tangent=after.clone().sub(before).normalize();
      const normal=new THREE.Vector3(-tangent.z,0,tangent.x);

      return p.clone()
        .addScaledVector(normal,side*distance)
        .setY(.047);
    };

    const a=makeOffset(i,2.48);
    const b=makeOffset(next,2.48);
    const c=makeOffset(i,4.6);
    const d=makeOffset(next,4.6);

    // Avoid runoff crossing a nearby section of track.
    const outsideSafe=[c,d].every(candidate=>
      points.every((road,j)=>{
        const separation=Math.min(
          Math.abs(i-j),
          count-Math.abs(i-j)
        );
        return separation<12 ||
          Math.hypot(candidate.x-road.x,candidate.z-road.z)>2.4;
      })
    );

    if(!outsideSafe)continue;

    // Skip abnormally long triangles at complex corners.
    if(a.distanceTo(b)>3||c.distanceTo(d)>4)continue;

    addTrapTriangle(a,b,c);
    addTrapTriangle(b,d,c);
  }

  const trapGeometry=new THREE.BufferGeometry();

  trapGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(trapPositions,3)
  );

  trapGeometry.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(trapUV,2)
  );

  trapGeometry.computeVertexNormals();

  // FASTONE CIRCUIT SURFACE UPGRADE V1
  return {
    road: ribbon(1.35,-1.35,.08),
    runoff: ribbon(2.5,-2.5,.035),
    left: ribbon(1.35,1.58,.095,true),
    right: ribbon(-1.35,-1.58,.095,true),

    // Fine white boundary lines sit just inside the kerbs.
    edgeLeft: ribbon(1.27,1.33,.108),
    edgeRight: ribbon(-1.27,-1.33,.108),

    // Gravel-coloured shoulders outside the racing surface.
    gravelLeft: ribbon(1.62,2.42,.052),
    gravelRight: ribbon(-1.62,-2.42,.052),

    railMatrices,
    postMatrices,
    fenceGeometry,
    trapGeometry
  };
 },[coordinates]);
 useEffect(()=>{
   const rail=barriers.current;
   const posts=fencePosts.current;

   if(rail){
     world.railMatrices.forEach((matrix,i)=>rail.setMatrixAt(i,matrix));
     rail.instanceMatrix.needsUpdate=true;
     rail.computeBoundingSphere();
   }

   if(posts){
     world.postMatrices.forEach((matrix,i)=>posts.setMatrixAt(i,matrix));
     posts.instanceMatrix.needsUpdate=true;
     posts.computeBoundingSphere();
   }
 },[world]);

 useEffect(()=>()=>{
    world.road.dispose();
    world.runoff.dispose();
    world.left.dispose();
    world.right.dispose();
    world.edgeLeft.dispose();
    world.edgeRight.dispose();
    world.gravelLeft.dispose();
    world.gravelRight.dispose();
    world.fenceGeometry.dispose();
    world.trapGeometry.dispose();
  },[world]);
 useEffect(()=>()=>{textures.grass.dispose();textures.asphalt.dispose();textures.gravel.dispose();},[textures]);
 return <group>
  {mode==='realistic'&&
    <CircuitScenery
      coordinates={coordinates}
      eventName={eventName}
      year={year}
    />
  }
  {mode==='realistic'&&<Sky distance={900} sunPosition={daylight?[100,70,40]:[100,8,-80]} turbidity={daylight?6:12} rayleigh={2}/>}
  <hemisphereLight args={['#d6e7ff','#74755b',daylight?1.3:.5]}/>
  <directionalLight castShadow position={[45,80,-35]} intensity={daylight?2.3:.9} shadow-mapSize={[2048,2048]} shadow-camera-left={-85} shadow-camera-right={85} shadow-camera-top={85} shadow-camera-bottom={-85} shadow-camera-far={250} shadow-bias={-.001}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.02,0]} receiveShadow><planeGeometry args={[800,800]}/><meshStandardMaterial
       map={mode==='realistic'?textures.grass:undefined}
       color={mode==='engineering'?'#15263a':'#ffffff'}
       roughness={1}
     /></mesh>
  <mesh geometry={world.runoff} receiveShadow><meshStandardMaterial
      color={mode==='engineering'?'#22374c':'#78786e'}
      roughness={1} side={THREE.DoubleSide}/></mesh>
  <mesh geometry={world.road} receiveShadow>
    <meshStandardMaterial
      map={textures.asphalt}
      color={mode==='engineering'?'#d5e4f1':'#b9bdc2'}
      roughness={.98}
      metalness={0}
      side={THREE.DoubleSide}
    />
  </mesh>
  {[world.left,world.right].map((geometry,i)=>
    <mesh key={i} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={.92}
        side={THREE.DoubleSide}
      />
    </mesh>
  )}

  {mode==='realistic'&&[world.gravelLeft,world.gravelRight].map((geometry,i)=>
    <mesh key={`gravel-${i}`} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        map={textures.gravel} color="#e5ded0"
        roughness={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )}

  {[world.edgeLeft,world.edgeRight].map((geometry,i)=>
    <mesh key={`edge-${i}`} geometry={geometry}>
      <meshStandardMaterial
        color="#f3f3e9"
        roughness={.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  )}
  {mode==='engineering'&&
    <gridHelper
      args={[260,52,'#3b607b','#233c52']}
      position={[0,-.012,0]}
    />
  }

  {mode==='realistic'&&
    <mesh geometry={world.trapGeometry} receiveShadow>
      <meshStandardMaterial
        map={textures.gravel}
        color="#e2d1af"
        roughness={1}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  }

  {mode==='realistic'&&<>
  {/* Twin continuous-looking steel guardrails */}
  <instancedMesh
    ref={barriers}
    args={[undefined,undefined,world.railMatrices.length]}
    castShadow
    receiveShadow
  >
    <boxGeometry args={[.11,.14,1]}/>
    <meshStandardMaterial
      color="#aeb8c1"
      metalness={.7}
      roughness={.38}
    />
  </instancedMesh>

  {/* Vertical catch-fence posts */}
  <instancedMesh
    ref={fencePosts}
    args={[undefined,undefined,world.postMatrices.length]}
    castShadow
  >
    <boxGeometry args={[.085,1.65,.085]}/>
    <meshStandardMaterial
      color="#87949e"
      metalness={.65}
      roughness={.45}
    />
  </instancedMesh>

  {/* Lightweight catch-fencing wire grid */}
  <lineSegments geometry={world.fenceGeometry}>
    <lineBasicMaterial
      color="#a8b5c0"
      transparent
      opacity={.42}
      depthWrite={false}
    />
  </lineSegments>
  </>}
 </group>;
}
