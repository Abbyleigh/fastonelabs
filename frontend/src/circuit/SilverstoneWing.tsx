// FASTONE SILVERSTONE WING V1
// Architectural interpretation, not a surveyed building model.
// Position is supplied by CircuitScenery's provisional placement.

type Size = [number, number, number];

export default function SilverstoneWing({size}: {size: Size}) {
  const [width, height, depth] = size;
  const garages = 10;
  const glazing = 16;

  return (
    <group name="fastone-silverstone-wing">
      {/* Main garage and hospitality structure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]}/>
        <meshStandardMaterial color="#c6ced3" roughness={0.78}/>
      </mesh>

      {/* Paddock apron */}
      <mesh
        position={[0, -height / 2 + 0.045, -depth / 2 - 1.75]}
        receiveShadow
      >
        <boxGeometry args={[width + 3, 0.09, 3.5]}/>
        <meshStandardMaterial color="#737b80" roughness={0.95}/>
      </mesh>

      {/* Continuous garage frontage */}
      {Array.from({length: garages}, (_, i) => {
        const bay = width / garages;
        const x = -width / 2 + (i + 0.5) * bay;

        return (
          <group key={i}>
            <mesh position={[x, -height / 2 + 1.08, -depth / 2 - 0.07]}>
              <boxGeometry args={[bay * 0.86, 1.95, 0.12]}/>
              <meshStandardMaterial
                color={i % 2 === 0 ? '#293b48' : '#354b58'}
                metalness={0.45}
                roughness={0.55}
              />
            </mesh>
            <mesh position={[x, -height / 2 + 2.1, -depth / 2 - 0.14]}>
              <boxGeometry args={[bay * 0.9, 0.12, 0.14]}/>
              <meshStandardMaterial color="#e7edf0"/>
            </mesh>
          </group>
        );
      })}

      {/* Upper hospitality glazing */}
      {Array.from({length: glazing}, (_, i) => {
        const panel = width / glazing;
        const x = -width / 2 + (i + 0.5) * panel;

        return (
          <mesh
            key={i}
            position={[x, height / 2 - 1.15, -depth / 2 - 0.09]}
          >
            <boxGeometry args={[panel * 0.86, 1.55, 0.12]}/>
            <meshStandardMaterial
              color={i % 4 === 0 ? '#66889b' : '#35586b'}
              metalness={0.35}
              roughness={0.18}
            />
          </mesh>
        );
      })}

      {/* Angular roof silhouette */}
      <mesh
        position={[-width * 0.25, height / 2 + 0.5, 0]}
        rotation={[0, 0, 0.09]}
        castShadow
      >
        <boxGeometry args={[width * 0.55, 0.34, depth + 1.8]}/>
        <meshStandardMaterial
          color="#283744"
          metalness={0.62}
          roughness={0.38}
        />
      </mesh>

      <mesh
        position={[width * 0.25, height / 2 + 0.65, 0]}
        rotation={[0, 0, -0.08]}
        castShadow
      >
        <boxGeometry args={[width * 0.55, 0.34, depth + 1.8]}/>
        <meshStandardMaterial
          color="#344553"
          metalness={0.62}
          roughness={0.38}
        />
      </mesh>

      {/* Roofline fins */}
      {Array.from({length: 7}, (_, i) => {
        const x = -width * 0.42 + i * width * 0.14;
        return (
          <mesh
            key={i}
            position={[x, height / 2 + 0.98, 0]}
            rotation={[0, 0, i < 3 ? 0.09 : -0.08]}
            castShadow
          >
            <boxGeometry args={[0.11, 0.65, depth + 1.2]}/>
            <meshStandardMaterial
              color="#b3c0c8"
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
        );
      })}

      {/* Glazed side elevation */}
      {[-1, 1].map(side => (
        <mesh
          key={side}
          position={[side * (width / 2 + 0.055), 0.45, 0]}
        >
          <boxGeometry args={[0.11, 1.6, depth * 0.72]}/>
          <meshStandardMaterial
            color="#527b90"
            metalness={0.35}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
