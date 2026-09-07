import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '../store/useSimulationStore';

// Procedurally generate dark asphalt road texture
const createAsphaltTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1a1e24';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#282e38';
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(Math.random() * 64);
    const y = Math.floor(Math.random() * 64);
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
};

// Procedurally generate modern sidewalk concrete paving grid
const createPavementTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillRect(0, 0, 2, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
};

// Multi-Floor Glass & Steel Skyscraper Component
interface ModularBuildingProps {
  position: [number, number, number];
  floors: number;
  width: number;
  depth: number;
  wallColor: string;
  windowTint: string;
}

const ModularBuilding: React.FC<ModularBuildingProps> = ({
  position,
  floors,
  width,
  depth,
  wallColor,
  windowTint,
}) => {
  const floorHeight = 1.8;
  const totalHeight = floors * floorHeight;

  return (
    <group position={position}>
      <mesh position={[0, totalHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width - 0.2, totalHeight, depth - 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.4} />
      </mesh>

      {Array.from({ length: floors }).map((_, f) => {
        const floorY = f * floorHeight;
        return (
          <group key={`floor_${f}`} position={[0, floorY, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[width + 0.1, 0.2, depth + 0.1]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
            </mesh>

            <mesh position={[0, floorHeight / 2 + 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, floorHeight - 0.3, depth]} />
              <meshPhysicalMaterial
                color={windowTint}
                roughness={0.1}
                metalness={0.8}
                transmission={0.4}
                clearcoat={1}
                clearcoatRoughness={0.1}
              />
            </mesh>

            {[-width / 2 + 0.2, 0, width / 2 - 0.2].map((xOffset, idx) => (
              <mesh
                key={`col_f_${idx}`}
                position={[xOffset, floorHeight / 2 + 0.1, depth / 2 + 0.05]}
                castShadow
              >
                <boxGeometry args={[0.2, floorHeight - 0.2, 0.1]} />
                <meshStandardMaterial color="#334155" metalness={0.7} />
              </mesh>
            ))}
          </group>
        );
      })}

      <group position={[0, totalHeight, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[width + 0.1, 0.4, depth + 0.1]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[-width / 4, 0.6, -depth / 4]} castShadow>
          <boxGeometry args={[1.5, 0.8, 1.5]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
};

// Interactive Animated City Agents & Traffic System
const InteractiveCityElements: React.FC<{ worldWidth: number; worldHeight: number }> = ({
  worldWidth,
  worldHeight,
}) => {
  const redLightRef = useRef<THREE.MeshBasicMaterial>(null);
  const greenLightRef = useRef<THREE.MeshBasicMaterial>(null);
  const yellowLightRef = useRef<THREE.MeshBasicMaterial>(null);

  const vehicleRefs = useRef<(THREE.Group | null)[]>([]);
  const pedestrianRefs = useRef<(THREE.Group | null)[]>([]);

  // Simulation Vehicles Configuration
  const vehicles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      axis: i % 2 === 0 ? 'X' : 'Z',
      direction: i % 4 < 2 ? 1 : -1,
      speed: 0.15 + Math.random() * 0.1,
      laneOffset: i % 2 === 0 ? (i % 4 < 2 ? 2.5 : -2.5) : (i % 4 < 2 ? 2.5 : -2.5),
      color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 5],
    }));
  }, []);

  // Simulation Pedestrians Configuration
  const pedestrians = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      startPos: [(Math.random() - 0.5) * (worldWidth - 10), 0.4, (Math.random() - 0.5) * (worldHeight - 10)] as [
        number,
        number,
        number
      ],
      speed: 0.04 + Math.random() * 0.03,
      direction: Math.random() > 0.5 ? 1 : -1,
      color: ['#f472b6', '#38bdf8', '#facc15', '#a7f3d0'][i % 4],
    }));
  }, [worldWidth, worldHeight]);

  // Main Loop for Traffic Signals & Movement Logic
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycle = Math.floor(time) % 10;
    const isGreenEW = cycle < 5;

    // Toggle Dynamic Traffic Lights
    if (redLightRef.current && greenLightRef.current && yellowLightRef.current) {
      if (isGreenEW) {
        greenLightRef.current.color.set('#22c55e');
        redLightRef.current.color.set('#450a0a');
      } else {
        greenLightRef.current.color.set('#052e16');
        redLightRef.current.color.set('#ef4444');
      }
    }

    // Move Vehicles
    vehicleRefs.current.forEach((veh, i) => {
      if (!veh) return;
      const config = vehicles[i];

      if (config.axis === 'X') {
        veh.position.x += config.speed * config.direction;
        if (veh.position.x > worldWidth / 2) veh.position.x = -worldWidth / 2;
        if (veh.position.x < -worldWidth / 2) veh.position.x = worldWidth / 2;
      } else {
        veh.position.z += config.speed * config.direction;
        if (veh.position.z > worldHeight / 2) veh.position.z = -worldHeight / 2;
        if (veh.position.z < -worldHeight / 2) veh.position.z = worldHeight / 2;
      }
    });

    // Move Pedestrians & Animate Walking Bounce
    pedestrianRefs.current.forEach((ped, i) => {
      if (!ped) return;
      const config = pedestrians[i];
      ped.position.x += config.speed * config.direction;
      ped.position.y = 0.4 + Math.sin(time * 8 + i) * 0.08;

      if (Math.abs(ped.position.x) > worldWidth / 2 - 2) {
        config.direction *= -1;
      }
    });
  });

  return (
    <group>
      {/* Dynamic Traffic Signals */}
      {[
        { pos: [8.5, 0, 8.5], rot: [0, -Math.PI / 4, 0] },
        { pos: [-8.5, 0, 8.5], rot: [0, Math.PI / 4, 0] },
      ].map((signal, idx) => (
        <group
          key={`traffic_signal_${idx}`}
          position={signal.pos as [number, number, number]}
          rotation={signal.rot as [number, number, number]}
        >
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 4.4, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[1.4, 4.0, 0]} castShadow>
            <boxGeometry args={[0.3, 0.9, 0.3]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[1.4, 4.3, 0.16]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial ref={redLightRef} color="#ef4444" />
          </mesh>
          <mesh position={[1.4, 4.0, 0.16]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial ref={yellowLightRef} color="#78350f" />
          </mesh>
          <mesh position={[1.4, 3.7, 0.16]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial ref={greenLightRef} color="#22c55e" />
          </mesh>
        </group>
      ))}

      {/* Dynamic Animated Vehicles */}
      {vehicles.map((v, i) => {
        const initialPos: [number, number, number] =
          v.axis === 'X'
            ? [(-worldWidth / 2) + i * 8, 0.4, v.laneOffset]
            : [v.laneOffset, 0.4, (-worldHeight / 2) + i * 8];

        const rotation: [number, number, number] =
          v.axis === 'X'
            ? [0, v.direction > 0 ? 0 : Math.PI, 0]
            : [0, v.direction > 0 ? Math.PI / 2 : -Math.PI / 2, 0];

        return (
          <group
            key={`veh_${i}`}
            ref={(el) => (vehicleRefs.current[i] = el)}
            position={initialPos}
            rotation={rotation}
          >
            {/* Vehicle Body */}
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[2.2, 0.7, 1.1]} />
              <meshStandardMaterial color={v.color} roughness={0.2} metalness={0.6} />
            </mesh>
            {/* Cabin Glass */}
            <mesh position={[-0.2, 0.8, 0]} castShadow>
              <boxGeometry args={[1.1, 0.5, 0.9]} />
              <meshPhysicalMaterial color="#38bdf8" roughness={0.1} transmission={0.6} />
            </mesh>
            {/* Headlights */}
            <mesh position={[1.1, 0.3, 0.35]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
            <mesh position={[1.1, 0.3, -0.35]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
          </group>
        );
      })}

      {/* Dynamic Animated Pedestrians */}
      {pedestrians.map((p, i) => (
        <group
          key={`ped_${i}`}
          ref={(el) => (pedestrianRefs.current[i] = el)}
          position={p.startPos}
        >
          {/* Head */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#fde047" />
          </mesh>
          {/* Torso */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.15, 0.5, 8]} />
            <meshStandardMaterial color={p.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const TerrainGrid: React.FC = () => {
  const worldBounds = useSimulationStore((state) => state.simulationState.worldBounds);
  const { width, height } = worldBounds || { width: 160, height: 160 };

  const asphaltTexture = useMemo(() => {
    const tex = createAsphaltTexture();
    tex.repeat.set(width / 4, height / 4);
    return tex;
  }, [width, height]);

  const pavementTexture = useMemo(() => {
    const tex = createPavementTexture();
    tex.repeat.set(width / 2, height / 2);
    return tex;
  }, [width, height]);

  return (
    <group>
      {/* 1. Base Pedestrian Sidewalk Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={pavementTexture} roughness={0.7} />
      </mesh>

      {/* 2. Road Network & Markings */}
      <group position={[0, 0.01, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, 16]} />
          <meshStandardMaterial map={asphaltTexture} roughness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[16, height]} />
          <meshStandardMaterial map={asphaltTexture} roughness={0.6} />
        </mesh>

        {/* Double Yellow Center Dividers */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.2]}>
          <planeGeometry args={[width, 0.2]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -0.2]}>
          <planeGeometry args={[width, 0.2]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.02, 0]}>
          <planeGeometry args={[0.2, height]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.2, 0.02, 0]}>
          <planeGeometry args={[0.2, height]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>

        {/* Zebra Crossings */}
        {[
          { pos: [0, 9.5], isHoriz: true },
          { pos: [0, -9.5], isHoriz: true },
          { pos: [9.5, 0], isHoriz: false },
          { pos: [-9.5, 0], isHoriz: false },
        ].map((crosswalk, idx) => (
          <group
            key={`zebra_${idx}`}
            position={[crosswalk.pos[0], 0.03, crosswalk.pos[1]]}
          >
            {Array.from({ length: 12 }).map((_, stripeIdx) => {
              const offset = -6.6 + stripeIdx * 1.2;
              return (
                <mesh
                  key={`stripe_${stripeIdx}`}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={crosswalk.isHoriz ? [offset, 0, 0] : [0, offset, 0]}
                >
                  <planeGeometry args={crosswalk.isHoriz ? [0.6, 2.5] : [2.5, 0.6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* 3. Buildings & Architecture */}
      <ModularBuilding
        position={[width / 4 + 2, 0, height / 4 + 2]}
        floors={10}
        width={10}
        depth={10}
        wallColor="#0284c7"
        windowTint="#0284c7"
      />
      <ModularBuilding
        position={[width / 4 + 2, 0, -height / 4 - 2]}
        floors={14}
        width={9}
        depth={9}
        wallColor="#0f172a"
        windowTint="#0ea5e9"
      />
      <ModularBuilding
        position={[-width / 4 - 2, 0, height / 4 + 2]}
        floors={6}
        width={12}
        depth={12}
        wallColor="#334155"
        windowTint="#38bdf8"
      />

      {/* 4. Urban Parkland Plaza & Flower Beds */}
      <group position={[-width / 4 - 2, 0.02, -height / 4 - 2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
        {[-5, 5].map((xOffset, bedIdx) => (
          <group key={`flower_bed_${bedIdx}`} position={[xOffset, 0.3, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[4, 0.6, 12]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[3.6, 11.6]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
            {Array.from({ length: 16 }).map((_, flowerIdx) => {
              const fx = -1 + (flowerIdx % 2) * 2;
              const fz = -5 + Math.floor(flowerIdx / 2) * 1.4;
              const flowerColor = flowerIdx % 2 === 0 ? '#f43f5e' : '#a855f7';

              return (
                <mesh key={`fl_${flowerIdx}`} position={[fx, 0.45, fz]}>
                  <sphereGeometry args={[0.2, 8, 8]} />
                  <meshStandardMaterial color={flowerColor} roughness={0.3} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* 5. Animated Traffic Lights, Vehicles & Pedestrians */}
      <InteractiveCityElements worldWidth={width} worldHeight={height} />
    </group>
  );
};