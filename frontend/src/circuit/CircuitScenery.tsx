import {getCircuitTransform} from './CircuitCoordinates';
import {Grandstand,PaddockBuilding} from './TracksideStructures';
import SilverstoneWing from './SilverstoneWing';
import {useMemo} from 'react';
import * as THREE from 'three';

type XY=[number,number];

type Props={
  coordinates:XY[];
  eventName?:string;
  year?:number;
};

function classifyVenue(name:string){
  const value=name.toLowerCase();

  if(/monaco|singapore|las vegas|azerbaijan|baku/.test(value))
    return 'urban';

  if(/belgian|spa|austrian|japanese|suzuka/.test(value))
    return 'woodland';

  return 'parkland';
}

export default function CircuitScenery({
  coordinates,
  eventName='',
  year
}:Props){

  const scenery=useMemo(()=>{

    if(coordinates.length<4)return null;

    const {cx,cy,scale}=getCircuitTransform(coordinates);

    const curve=new THREE.CatmullRomCurve3(
      coordinates.map(([x,y])=>
        new THREE.Vector3(
          (x-cx)*scale,
          0,
          -(y-cy)*scale
        )
      ),
      true,
      'centripetal'
    );

    const points=curve.getSpacedPoints(360).slice(0,360);

    const normalAt=(i:number)=>{
      const before=points[(i+359)%360];
      const after=points[(i+1)%360];
      const tangent=after.clone().sub(before).normalize();

      return new THREE.Vector3(
        -tangent.z,0,tangent.x
      );
    };

    const location=(i:number,side:number,distance:number)=>
      points[i].clone().addScaledVector(
        normalAt(i),side*distance
      );

    const clearance=(p:THREE.Vector3)=>
      Math.min(...points.map(q=>
        Math.hypot(p.x-q.x,p.z-q.z)
      ));

    // Find an approximately straight section for paddock scenery.
    let best=0;
    let lowest=Infinity;

    for(let i=0;i<360;i++){
      const a=points[(i+354)%360];
      const b=points[i];
      const c=points[(i+6)%360];

      const first=b.clone().sub(a).normalize();
      const second=c.clone().sub(b).normalize();
      const bend=1-first.dot(second);

      if(bend<lowest){
        lowest=bend;
        best=i;
      }
    }

    const structures:{
      position:[number,number,number];
      rotation:number;
      size:[number,number,number];
      kind:'stand'|'paddock'|'city';
    }[]=[];

    const place=(i:number,side:number,distance:number,
      kind:'stand'|'paddock'|'city',
      size:[number,number,number])=>{

      const p=location(i,side,distance);

      // Check the whole building footprint, not just its centre.
      const direction=points[(i+1)%360]
        .clone()
        .sub(points[(i+359)%360])
        .normalize();

      const across=new THREE.Vector3(
        direction.z,0,-direction.x
      );

      const halfWidth=size[0]/2;
      const halfDepth=size[2]/2;

      const corners=[
        [-halfWidth,-halfDepth],
        [-halfWidth,halfDepth],
        [halfWidth,-halfDepth],
        [halfWidth,halfDepth],
        [0,0]
      ];

      const minimumClearance=kind==='stand'?5:4;

      const footprintSafe=corners.every(([x,z])=>{
        const sample=p.clone()
          .addScaledVector(direction,x)
          .addScaledVector(across,z);

        return clearance(sample)>minimumClearance;
      });

      if(!footprintSafe)return;

      // Prevent buildings from overlapping existing structures.
      const overlaps=structures.some(existing=>{
        const distance=Math.hypot(
          p.x-existing.position[0],
          p.z-existing.position[2]
        );

        const radiusA=Math.hypot(size[0],size[2])/2;
        const radiusB=Math.hypot(
          existing.size[0],
          existing.size[2]
        )/2;

        return distance<radiusA+radiusB+2;
      });

      if(overlaps)return;

      const tangent=points[(i+1)%360]
        .clone()
        .sub(points[(i+359)%360])
        .normalize();

      structures.push({
        position:[p.x,size[1]/2,p.z],
        rotation:Math.atan2(tangent.x,tangent.z),
        size,
        kind
      });
    };

    const venue=classifyVenue(eventName);

    const isSilverstone=/silverstone|british grand prix/i
      .test(eventName);

      // Activate geographic infrastructure only for the
      // known Silverstone geographic centreline.
      const isGeographicSilverstone =
        isSilverstone &&
        coordinates.length >= 500 &&
        Math.abs(coordinates[0][0] + 34.414914) < 0.1 &&
        Math.abs(coordinates[0][1] + 26.334641) < 0.1;

    if(venue==='urban'){
      for(let i=12;i<360;i+=24){
        place(i,1,16,'city',[7,8+(i%4)*3,6]);
        place(i,-1,18,'city',[8,10+(i%3)*4,7]);
      }
    }else if(isSilverstone){

      // SILVERSTONE SCENERY PROFILE V1
      // Select a long, relatively straight section.
      // This is provisional until pit-lane location data
      // is available for precise circuit placement.

      const straightness=(i:number)=>{
        const a=points[(i+348)%360];
        const b=points[i];
        const c=points[(i+12)%360];

        const first=b.clone().sub(a).normalize();
        const second=c.clone().sub(b).normalize();

        return first.dot(second);
      };

      const candidates=Array.from(
        {length:360},(_,i)=>i
      ).sort((a,b)=>
        straightness(b)-straightness(a)
      );

      // Try both sides and several suitable straights.
      // Existing footprint checks reject unsafe placements.
      for(const i of (
          isGeographicSilverstone
            ? []
            : candidates.slice(0,100)
        )){
        if(structures.some(s=>s.kind==='paddock'))break;

        for(const side of [1,-1]){
          place(i,side,15,'paddock',[23,5.5,7.5]);

          if(structures.some(s=>s.kind==='paddock')){
            break;
          }
        }
      }

      // Distributed spectator areas, with clearance
      // and overlap validation handled by place().
      for(const i of [24,68,112,158,204,250,296,340]){
        const size:[number,number,number]=
          i%2===0?[15,3.6,5]:[12,3.2,4.5];

        place(i,-1,15,'stand',size);
      }

    }else{
      place(best,1,14,'paddock',[20,5,7]);

      for(const i of [32,94,158,222,286,340]){
        place(i,-1,13,'stand',[13,3.2,4.5]);
      }
    }

    // Deterministic vegetation: same race, same scenery.
    const trees:{x:number;z:number;size:number}[]=[];
    let seed=12579;

    const random=()=>{
      seed=(seed*1664525+1013904223)>>>0;
      return seed/4294967296;
    };

    if(venue!=='urban'){
      const target=isSilverstone
        ?12
        :venue==='woodland'?110:55;

      for(let attempt=0;attempt<600&&trees.length<target;attempt++){
        const x=(random()-.5)*175;
        const z=(random()-.5)*175;
        const p=new THREE.Vector3(x,0,z);

        if(clearance(p)<9)continue;

        if(structures.some(s=>
          Math.hypot(x-s.position[0],z-s.position[2])<14
        ))continue;

        trees.push({
          x,z,
          size:1.5+random()*2.4
        });
      }
    }

    return {
        structures,
        trees,
        venue,
        geographicWing: isGeographicSilverstone
      };

  },[coordinates,eventName,year]);

  if(!scenery)return null;

  return <group name="fastone-circuit-scenery">

    {scenery.structures.map((s,i)=>
      <group
        key={i}
        position={s.position}
        rotation={[0,s.rotation,0]}
      >
        {s.kind==='stand'?
          <Grandstand size={s.size}/>:
         s.kind==='paddock'?
          (/silverstone|british grand prix/i.test(eventName)
            ? <SilverstoneWing size={s.size}/>
            : <PaddockBuilding size={s.size}/>):
          <mesh castShadow receiveShadow>
            <boxGeometry args={s.size}/>
            <meshStandardMaterial
              color="#8a939d"
              roughness={.8}
            />
          </mesh>
        }
      </group>
    )}

    {scenery.geographicWing && (
        <group
          name="fastone-geographic-silverstone-wing"
          position={[-25.676, 0.66, 19.619]}
          rotation={[0, -125.13 * Math.PI / 180, 0]}
          scale={[0.18, 0.24, 0.48]}
        >
          <SilverstoneWing size={[23, 5.5, 3.5]}/>
        </group>
      )}


    {scenery.trees.map((tree,i)=>
      <group key={i} position={[tree.x,0,tree.z]}>
        <mesh position={[0,tree.size*.4,0]} castShadow>
          <cylinderGeometry args={[.13,.22,tree.size*.8,5]}/>
          <meshStandardMaterial color="#584735"/>
        </mesh>
        <mesh position={[0,tree.size*1.05,0]} castShadow>
          <coneGeometry args={[tree.size*.42,tree.size*1.5,6]}/>
          <meshStandardMaterial
            color={i%3===0?'#365b37':'#477345'}
            roughness={1}
          />
        </mesh>
      </group>
    )}

  </group>;
}
