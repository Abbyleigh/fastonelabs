import {getCircuitTransform} from './circuit/CircuitCoordinates';
import {useState as useCircuitViewModeState} from 'react';
import React,{useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls,Html} from '@react-three/drei';
import * as THREE from 'three';
import CircuitWorld from './CircuitWorld';
import type {CarState,UnifiedRaceState} from './race/unifiedRaceState';
type XY=[number,number];
function scenePosition(
  x: number,
  y: number,
  coordinates: XY[],
  height = .4
) {
  const transform = getCircuitTransform(coordinates);
  const [sx, sz] = transform.toScene(x, y);

  return new THREE.Vector3(sx, height, sz);
}


function replayPoseAt(
  car: CarState | undefined,
  coordinates: XY[],
  calibration?: SilverstoneCalibration | null
) {
  if (!car?.pose) return null;
  let position: THREE.Vector3;

  if (calibration) {
    const t = calibration.transform;
    const x = car.pose.x;
    const y = t.mirror_y ? -car.pose.y : car.pose.y;

    const sx = t.real * x - t.imag * y + t.offset_x;
    const sz = t.imag * x + t.real * y + t.offset_y;

    // Geographic reference coordinates use provider-style [X,Y]
    // internally, so scenePosition performs the same conversion
    // as CircuitWorld.
    position = scenePosition(sx, -sz, coordinates, 0.101);
  } else {
    position = scenePosition(
      car.pose.x, car.pose.y, coordinates
    );
  }

  // Transform the car's forward vector using the same
  // reflection and rotation as its geographic position.
  let rotationY = car.pose.headingRad;

  if (calibration) {
    const t = calibration.transform;

    // Original heading: +Z forward in Three.js.
    const dx = Math.sin(rotationY);
    const dy = -Math.cos(rotationY);

    const reflectedY = t.mirror_y ? -dy : dy;

    const forwardX =
      t.real * dx - t.imag * reflectedY;

    const forwardZ =
      t.imag * dx + t.real * reflectedY;

    rotationY = Math.atan2(forwardX, forwardZ);
  }

  return {
    position,
    rotationY
  };
}

/** A stylised, lightweight F1-inspired model. All car parts are local to the replay pose. */
function F1CarModel({ color }: { color: string; code: string }) {
  return (
    <group>
      {/* Body, tapered nose and cockpit: forward is local +Z. */}
      <mesh castShadow receiveShadow position={[0, 0.10, 0]}>
        <boxGeometry args={[0.78, 0.30, 3.80]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.10, 1.75]}>
        <boxGeometry args={[0.34, 0.18, 1.50]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.45} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.38, -0.22]}>
        <boxGeometry args={[0.60, 0.38, 0.85]} />
        <meshStandardMaterial color="#141820" roughness={0.35} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.53, -0.18]}>
        <sphereGeometry args={[0.24, 10, 8]} />
        <meshStandardMaterial color="#f4f6fb" roughness={0.4} />
      </mesh>
      {/* Front and rear wings. */}
      <mesh castShadow receiveShadow position={[0, 0.03, 2.55]}>
        <boxGeometry args={[1.95, 0.10, 0.44]} />
        <meshStandardMaterial color="#151922" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.40, -2.55]}>
        <boxGeometry args={[1.65, 0.10, 0.40]} />
        <meshStandardMaterial color="#151922" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.21, -2.55]}>
        <boxGeometry args={[0.12, 0.4, 0.25]} />
        <meshStandardMaterial color="#151922" />
      </mesh>
      {/* Four tyres. Cylinder axle runs along the local X axis. */}
      {([-1, 1] as const).flatMap(side =>
        ([-1.75, 1.75] as const).map(z => (
          <mesh castShadow receiveShadow key={`${side}:${z}`} position={[side * 0.86, 0.36, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.36, 0.36, 0.28, 20]} />
            <meshStandardMaterial color="#08090b" roughness={0.95} />
          </mesh>
        ))
      )}

    </group>
  );
}

function ReplayCar({
  car, coordinates, calibration, showLabel = true
}: {
  car: CarState;
  coordinates: XY[];
  calibration?: SilverstoneCalibration | null;
  showLabel?: boolean;
}) {
  const pose = useMemo(() => replayPoseAt(car,coordinates,calibration),[car,coordinates,calibration]);
  if (!pose) return null;
  return (

    <group position={pose.position} rotation={[0, pose.rotationY, 0]}>
      <group scale={calibration ? 0.07 : 1}>
        <F1CarModel color={car.color} code={car.code} />
      </group>
      {showLabel && <Html position={[0, calibration ? 0.38 : 1.45, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ background: '#0c1421e8', color: '#fff', border: `1px solid ${car.color}`,
          borderRadius: 5, padding: '2px 5px', fontWeight: 800, fontSize: 11,
          whiteSpace: 'nowrap', boxShadow: '0 2px 10px #0008' }}>
          <span style={{ color: car.color }}>● </span>{car.code}
        </div>
      </Html>}
    </group>
  );
}


/**
 * Camera-aware label collision avoidance.
 * All recorded cars remain rendered.
 * The readonly race-state array is never modified.
 */
function AdaptiveReplayCars({
  cars, selected, coordinates, calibration
}: {
  cars: readonly CarState[];
  selected: CarState | null;
  coordinates: XY[];
  calibration?: SilverstoneCalibration | null;
}) {
  const { camera, size } = useThree();

  const [visibleIds, setVisibleIds] = React.useState<Set<string>>(
    () => new Set<string>()
  );

  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;

    if (elapsed.current < 0.12) return;
    elapsed.current = 0;

    camera.updateMatrixWorld();

    const chosen = new Set<string>();
    const occupied: { x: number; y: number }[] = [];
    const limit = selected?.pose ? 6 : 5;

    const candidates = cars.filter(car => car.pose !== null);

    if (selected?.pose) {
      candidates.sort((a, b) => {
        if (a.id === selected.id) return -1;
        if (b.id === selected.id) return 1;
        return 0;
      });
    }

    for (const car of candidates) {
      if (chosen.size >= limit) break;

      const pose = replayPoseAt(car, coordinates, calibration);
      if (!pose) continue;

      const point = pose.position.clone();
      point.y += calibration ? 0.38 : 1.45;
      point.project(camera);

      if (
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y) ||
        point.x < -1 ||
        point.x > 1 ||
        point.y < -1 ||
        point.y > 1 ||
        point.z < -1 ||
        point.z > 1
      ) {
        continue;
      }

      const x = (point.x + 1) * size.width / 2;
      const y = (1 - point.y) * size.height / 2;

      const isSelected = car.id === selected?.id;

      const overlaps = occupied.some(previous =>
        Math.abs(previous.x - x) < 65 &&
        Math.abs(previous.y - y) < 27
      );

      if (overlaps && !isSelected) continue;

      chosen.add(car.id);
      occupied.push({ x, y });
    }

    setVisibleIds(previous => {
      if (
        previous.size === chosen.size &&
        [...previous].every(id => chosen.has(id))
      ) {
        return previous;
      }

      return chosen;
    });
  });

  return (
    <>
      {cars.map(car => (
        <ReplayCar
          key={car.id}
          car={car}
          coordinates={coordinates}
          calibration={calibration}
          showLabel={visibleIds.has(car.id)}
        />
      ))}
    </>
  );
}

function RaceCamera({
  driver, coordinates, calibration
}: {
  driver: CarState | null;
  coordinates: XY[];
  calibration?: SilverstoneCalibration | null;
}) {
  const { camera } = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const wasFollowing = useRef(false);

  useFrame((_, delta) => {
    const control = controls.current;
    if (!control) return;
    if (!driver) {
      if (wasFollowing.current) {
        camera.position.set(0, 145, 155);
        control.target.set(0, 0, 0);
        control.update();
        wasFollowing.current = false;
      }
      return;
    }
    wasFollowing.current = true;
    const pose = replayPoseAt(driver,coordinates,calibration);
    if (!pose) return;
    const damping = 1 - Math.exp(-4 * Math.min(delta, 0.1));
    // Stage 9B: physically calibrated Silverstone chase camera.
    // Geographic Silverstone uses approximately 0.069975 scene units
    // per real-world metre. The procedural car faces local +Z.
    const heading = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      pose.rotationY
    );

    if (calibration) {
      // Roughly 8.6 m behind and 2.9 m above the car reference.
      const behind = new THREE.Vector3(0, 0.20, -0.60)
        .applyQuaternion(heading);

      // Look ahead in the vehicle's local +Z direction.
      const ahead = new THREE.Vector3(0, 0.08, 0.65)
        .applyQuaternion(heading);

      camera.position.lerp(
        pose.position.clone().add(behind),
        damping
      );

      control.target.lerp(
        pose.position.clone().add(ahead),
        damping
      );
    } else {
      // Preserve existing camera behaviour on other circuits.
      const destination = pose.position.clone().add(
        new THREE.Vector3(0, 18, 28)
      );

      camera.position.lerp(destination, damping);
      control.target.lerp(pose.position, damping);
    }

    control.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 0, 0]}
      minDistance={driver && calibration ? 0.15 : 8}
      maxDistance={300}
      maxPolarAngle={Math.PI / 2.05}
      enableDamping
      enabled={!driver}
    />
  );
}



// FASTONE_REPLAY_GEOGRAPHIC_V1
type SilverstoneCalibration = {
  transform: {
    mirror_y: boolean;
    real: number;
    imag: number;
    offset_x: number;
    offset_y: number;
  };
};

export function RecordedScene({
  coordinates, frame, selected, eventName, year
}: {
  coordinates: XY[];
  eventName?: string;
  year?: number;
  frame: UnifiedRaceState;
  selected: CarState | null;
}) {
  const isSilverstone =
    year === 2024 &&
    /silverstone|british/i.test(eventName ?? '');

  const [geographic, setGeographic] = React.useState<{
    coordinates: XY[];
    calibration: SilverstoneCalibration;
  } | null>(null);

  const [replayGeographicError, setReplayGeographicError] = React.useState<string | null>(null);


  useEffect(() => {
    if (!isSilverstone) {
      setGeographic(null);
      return;
    }

    let cancelled = false;
    setGeographic(null);
    setReplayGeographicError(null);

    const base = '/geographic/silverstone/';

    Promise.all([
      fetch(base + 'silverstone-scene-reference.json'),
      fetch(base + 'silverstone-openf1-transform.json')
    ])
      .then(async responses => {
        for (const response of responses) {
          if (!response.ok) {
            throw new Error(
              'Geographic asset HTTP ' + response.status
            );
          }
        }

        return Promise.all(responses.map(r => r.json()));
      })
      .then(([reference, calibration]) => {
        if (
          !Array.isArray(reference.coordinates) ||
          reference.coordinates.length < 4
        ) {
          throw new Error('Invalid Silverstone centreline');
        }

        const points: XY[] = reference.coordinates.map(
          (p: unknown): XY => {
            if (
              !Array.isArray(p) ||
              p.length < 2 ||
              !Number.isFinite(p[0]) ||
              !Number.isFinite(p[1])
            ) {
              throw new Error('Invalid centreline point');
            }
            return [p[0], -p[1]];
          }
        );

        if (
          points.length > 1 &&
          points[0][0] === points[points.length - 1][0] &&
          points[0][1] === points[points.length - 1][1]
        ) {
          points.pop();
        }

        const t = calibration?.transform;
        if (
          !t ||
          typeof t.mirror_y !== 'boolean' ||
          ![
            t.real, t.imag, t.offset_x, t.offset_y
          ].every(Number.isFinite)
        ) {
          throw new Error('Invalid calibration coefficients');
        }

        if (!cancelled) {
          setGeographic({
            coordinates: points,
            calibration
          });
            setReplayGeographicError(null);

          console.info(
            '[FastOne Labs] Geographic Silverstone replay active'
          );
        }
      })
      .catch(error => {
        if (!cancelled) {
            setReplayGeographicError(String(error));
          console.warn(
            '[FastOne Labs] Using original replay geometry:',
            error
          );
          setGeographic(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSilverstone]);

  const renderCoordinates =
    isSilverstone && geographic
      ? geographic.coordinates
      : coordinates;

  const calibration =
    isSilverstone ? geographic?.calibration : null;

  const geographicStatus = !isSilverstone
    ? 'OTHER CIRCUIT'
    : geographic
      ? 'GEOGRAPHIC SILVERSTONE ACTIVE'
      : replayGeographicError
        ? 'GEOGRAPHIC SILVERSTONE FALLBACK'
        : 'GEOGRAPHIC SILVERSTONE LOADING';

  console.info(
    '[FastOne Labs] Replay geometry:',
    geographicStatus,
    { year, eventName, points: renderCoordinates.length }
  );

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%'
    }}>
      <div
        role="status"
        data-fastone-geographic-status={geographicStatus}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 10,
          padding: '9px 13px',
          borderRadius: 7,
          background: 'rgba(8,15,25,0.92)',
          color: geographic
            ? '#70e5b1'
            : replayGeographicError
              ? '#ff9b91'
              : '#e5edf8',
          fontSize: 12,
          fontFamily: 'monospace',
          pointerEvents: 'none',
          maxWidth: '85%'
        }}
      >
        {geographicStatus}
        {' · ' + renderCoordinates.length + ' points'}
        {replayGeographicError && (
          <div style={{fontSize: 10, marginTop: 4}}>
            {replayGeographicError}
          </div>
        )}
      </div>
      <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: [0, 145, 155],
        fov: 50,
        near: .1,
        far: 1500
      }}
    >
      <color attach="background" args={['#0d141c']} />
      <ambientLight intensity={1} />

      <CircuitWorld
        coordinates={renderCoordinates}
        eventName={eventName}
        year={year}
      />

      <AdaptiveReplayCars
        cars={frame.cars}
        selected={selected}
        coordinates={renderCoordinates}
        calibration={calibration}
      />

      <RaceCamera
        driver={selected}
        coordinates={renderCoordinates}
        calibration={calibration}
      />
    </Canvas>
    </div>
  );
}

function PreviewCamera({low}:{low:boolean}){const {camera}=useThree();useEffect(()=>{camera.position.set(...(low?[55,16,55]:[0,125,135]) as [number,number,number]);camera.lookAt(0,0,0);},[camera,low]);return null;}
export function CircuitScene({
 coordinates,daylight,low,revision,rotation,eventName,year
}:{
 coordinates:XY[];
 eventName?:string;
 year?:number;
 daylight:boolean;
 low:boolean;
 revision:number;
 rotation:boolean;
}){
 const [mode,setMode]=useCircuitViewModeState<
   'realistic'|'engineering'|'geographic'
 >('realistic');


  // FASTONE LABS — GEOGRAPHIC SILVERSTONE
  const isSilverstone =
    year === 2024 &&
    /silverstone|british/i.test(eventName ?? '');

  const [geographicCoordinates, setGeographicCoordinates] =
    React.useState<XY[] | null>(null);

  const [geographicError, setGeographicError] =
    React.useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'geographic' || !isSilverstone) return;

    let cancelled = false;

    setGeographicError(null);

    fetch('/geographic/silverstone/silverstone-scene-reference.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data.coordinates)) {
          throw new Error('Missing geographic coordinates');
        }

        const points: XY[] = data.coordinates.map(
          (p: unknown): XY => {
            if (
              !Array.isArray(p) ||
              p.length < 2 ||
              !Number.isFinite(p[0]) ||
              !Number.isFinite(p[1])
            ) {
              throw new Error('Invalid geographic coordinate');
            }

            return [p[0], -p[1]];
          }
        );

        if (
          points.length > 1 &&
          points[0][0] === points[points.length - 1][0] &&
          points[0][1] === points[points.length - 1][1]
        ) {
          points.pop();
        }

        if (points.length < 4) {
          throw new Error('Insufficient geographic points');
        }

        if (!cancelled) setGeographicCoordinates(points);
      })
      .catch(error => {
        if (!cancelled) setGeographicError(String(error));
      });

    return () => {
      cancelled = true;
    };
  }, [mode, isSilverstone]);

  const viewCoordinates =
    mode === 'geographic' &&
    isSilverstone &&
    geographicCoordinates
      ? geographicCoordinates
      : coordinates;

  const reduced=window.matchMedia(
   '(prefers-reduced-motion: reduce)'
 ).matches;

 return (
  <div style={{
    position:'relative',
    width:'100%',
    height:'100%',
    minHeight:420
  }}>
   <div style={{
     position:'absolute',
     top:14,
     right:14,
     zIndex:5,
     display:'flex',
     alignItems:'center',
     gap:10,
     padding:'9px 12px',
     background:'rgba(8,17,29,.93)',
     border:'1px solid #425569',
     borderRadius:8,
     color:'#f1f5f9'
   }}>
    <label htmlFor="fastone-circuit-view-mode"
      style={{fontSize:12,fontWeight:700}}>
      VIEW MODE
    </label>
    <select
      id="fastone-circuit-view-mode"
      aria-label="Circuit visual mode"
      value={mode}
      onChange={event=>setMode(
        event.target.value as 'realistic'|'engineering'|'geographic'
      )}
      style={{
        background:'#203247',
        color:'#ffffff',
        border:'1px solid #64748b',
        borderRadius:5,
        padding:'7px 10px',
        fontSize:13,
        cursor:'pointer'
      }}
    >
     <option value="realistic">Realistic</option>
     <option value="engineering">Engineering</option>
        <option value="geographic" disabled={!isSilverstone}>
          Geographic Silverstone
        </option>
    </select>
   </div>

   {mode==='engineering'&&
    <div style={{
      position:'absolute',
      bottom:14,
      left:14,
      zIndex:4,
      background:'rgba(8,17,29,.88)',
      border:'1px solid #35516a',
      borderRadius:6,
      color:'#b9d8ef',
      padding:'10px 14px',
      fontSize:12,
      pointerEvents:'none'
    }}>
      FASTONE LABS / ENGINEERING VIEW
      <div style={{opacity:.75,marginTop:4}}>
        Circuit geometry • Technical grid • Simplified scenery
      </div>
    </div>
   }


   {mode === 'geographic' && (
     <div style={{
       position: 'absolute',
       bottom: 14,
       left: 14,
       zIndex: 6,
       background: 'rgba(8,17,29,.9)',
       color: geographicError ? '#ff9b9b' : '#d6f5ed',
       padding: '10px 14px',
       borderRadius: 6,
       fontSize: 12,
       pointerEvents: 'none'
     }}>
       {geographicError
         ? `Geographic data unavailable: ${geographicError}`
         : geographicCoordinates
           ? 'SILVERSTONE / GEOGRAPHIC CENTRELINE / 5.881 KM'
           : 'Loading Silverstone geographic geometry...'}
     </div>
   )}

   <Canvas
     shadows
     dpr={[1,1.5]}
     camera={{
       position:[0,125,135],
       fov:45,
       near:.1,
       far:2500
     }}
   >
     <color attach="background"
       args={[mode==='engineering'?'#0c1624':'#88a4bb']}/>
     <ambientLight intensity={mode==='engineering'?.9:.25}/>
     <CircuitWorld
       coordinates={viewCoordinates}
        eventName={eventName}
        year={year}
       daylight={daylight}
       mode={mode === 'engineering' ? 'engineering' : 'realistic'}
     />
     <PreviewCamera
       key={`${low}-${revision}`}
       low={low}
     />
     <OrbitControls
       makeDefault
       autoRotate={rotation&&!reduced}
       autoRotateSpeed={.5}
       target={[0,0,0]}
       minDistance={5}
       maxDistance={350}
       maxPolarAngle={Math.PI/2-.025}
     />
   </Canvas>
  </div>
 );
}
