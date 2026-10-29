import * as THREE from 'three';

type Size=[number,number,number];

export function Grandstand({size}:{size:Size}){
  const [width,height,depth]=size;
  const rows=6;
  const step=depth/rows;

  return <group>
    {/* Concrete foundation */}
    <mesh position={[0,-height/2+.15,0]} receiveShadow castShadow>
      <boxGeometry args={[width,.3,depth]}/>
      <meshStandardMaterial color="#8b9298"/>
    </mesh>

    {/* Stepped spectator seating */}
    {Array.from({length:rows},(_,i)=>{
      const z=-depth/2+step*(i+.5);
      const y=-height/2+.45+(i+1)*(height-1.1)/rows;

      return <group key={i}>
        <mesh position={[0,y-.20,z]} castShadow receiveShadow>
          <boxGeometry args={[width,.35,step*.95]}/>
          <meshStandardMaterial color="#717a83"/>
        </mesh>

        {Array.from({length:Math.max(6,Math.floor(width/.65))},
          (_,seat)=>{
            const total=Math.max(6,Math.floor(width/.65));
            const x=-width/2+(seat+.5)*width/total;

            return <mesh
              key={seat}
              position={[x,y+.12,z]}
              castShadow
            >
              <boxGeometry args={[width/total*.76,.12,step*.5]}/>
              <meshStandardMaterial
                color={
                  (seat+i)%7===0?'#e6e7e9':
                  (seat+i)%3===0?'#b32c37':'#263e57'
                }
              />
            </mesh>;
          }
        )}
      </group>;
    })}

    {/* Canopy roof */}
    <mesh position={[0,height/2+1.25,0]} castShadow>
      <boxGeometry args={[width+1,.24,depth+1.5]}/>
      <meshStandardMaterial
        color="#263646"
        metalness={.55}
        roughness={.42}
      />
    </mesh>

    {/* Steel canopy columns */}
    {[-1,1].flatMap(side=>
      [-1,0,1].map(column=>
        <mesh
          key={`${side}-${column}`}
          position={[
            column*(width/2-.45),
            height/2+.5,
            side*(depth/2-.35)
          ]}
          castShadow
        >
          <boxGeometry args={[.12,1.5,.12]}/>
          <meshStandardMaterial
            color="#b8c4cc"
            metalness={.7}
            roughness={.3}
          />
        </mesh>
      )
    )}

    {/* Front safety railing */}
    <mesh position={[0,-height/2+.9,-depth/2-.08]}>
      <boxGeometry args={[width,.07,.07]}/>
      <meshStandardMaterial color="#c5cbd1"/>
    </mesh>
  </group>;
}

export function PaddockBuilding({size}:{size:Size}){
  const [width,height,depth]=size;
  const garages=8;

  return <group>
    {/* Main building */}
    <mesh castShadow receiveShadow>
      <boxGeometry args={[width,height,depth]}/>
      <meshStandardMaterial
        color="#d6dce0"
        roughness={.75}
      />
    </mesh>

    {/* Modern roof */}
    <mesh position={[0,height/2+.18,0]} castShadow>
      <boxGeometry args={[width+.8,.36,depth+.8]}/>
      <meshStandardMaterial
        color="#25384a"
        metalness={.45}
        roughness={.42}
      />
    </mesh>

    {/* Ground-floor garage bays */}
    {Array.from({length:garages},(_,i)=>{
      const bayWidth=width/garages;
      const x=-width/2+(i+.5)*bayWidth;

      return <group key={i}>
        <mesh
          position={[x,-height/2+1.05,-depth/2-.04]}
        >
          <boxGeometry args={[bayWidth*.82,1.9,.08]}/>
          <meshStandardMaterial
            color="#344a5b"
            metalness={.55}
            roughness={.45}
          />
        </mesh>

        <mesh
          position={[x,-height/2+2.07,-depth/2-.12]}
        >
          <boxGeometry args={[bayWidth*.87,.12,.12]}/>
          <meshStandardMaterial color="#e7edf1"/>
        </mesh>
      </group>;
    })}

    {/* Upper glass-fronted hospitality level */}
    {Array.from({length:12},(_,i)=>{
      const panelWidth=width/12;
      const x=-width/2+(i+.5)*panelWidth;

      return <group key={i}>
        <mesh
          position={[x,height/2-.9,-depth/2-.07]}
        >
          <boxGeometry args={[panelWidth*.85,1.2,.08]}/>
          <meshStandardMaterial
            color="#4a788d"
            metalness={.25}
            roughness={.18}
          />
        </mesh>
      </group>;
    })}

    {/* Roofline parapet */}
    <mesh position={[0,height/2+.46,-depth/2]}>
      <boxGeometry args={[width+.8,.4,.18]}/>
      <meshStandardMaterial color="#415361"/>
    </mesh>

    {/* Side windows */}
    {[-1,1].map(side=>
      <mesh
        key={side}
        position={[side*(width/2+.045),.6,0]}
      >
        <boxGeometry args={[.08,1.1,depth*.65]}/>
        <meshStandardMaterial
          color="#507c91"
          metalness={.25}
          roughness={.2}
        />
      </mesh>
    )}
  </group>;
}
