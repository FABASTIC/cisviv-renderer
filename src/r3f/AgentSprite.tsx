import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getAssetDefinition } from '../services/assetDictionary';
import { loadPixelTexture } from '../services/texturePipeline';

interface AgentSpriteProps {
  id: string;
  name?: string;
  x: number;
  z: number;
  visualProfile: string;
  animationState?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const ISOMETRIC_Y_ROTATION = Math.PI / 4;

export const AgentSprite: React.FC<AgentSpriteProps> = ({
  id: _id,
  name,
  x = 0,
  z = 0,
  visualProfile,
  animationState = 'idle',
  isSelected = false,
  onClick,
}) => {
  const def = useMemo(() => getAssetDefinition(visualProfile), [visualProfile]);
  const [hovered, setHovered] = useState(false);
  const [, setLoadedTick] = useState(0);

  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const [width, height] = def.size;
  const posY = height / 2;

  // Load real file-based character texture from /public/assets/agents/...
  const texture = useMemo(() => {
    return loadPixelTexture(def.textureUrl, () => setLoadedTick((t) => t + 1));
  }, [def.textureUrl]);

  const shadowTexture = useMemo(() => {
    return loadPixelTexture('/assets/props/shadow.png', () => setLoadedTick((t) => t + 1));
  }, []);

  // Subtle breathing / walking bob animation
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    if (animationState === 'walk') {
      meshRef.current.position.y = posY + Math.abs(Math.sin(time * 8)) * 0.08;
    } else {
      meshRef.current.position.y = posY + Math.sin(time * 2.5 + x) * 0.02;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. GROUND CONTACT DROP SHADOW */}
      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, ISOMETRIC_Y_ROTATION]}
      >
        <planeGeometry args={[def.shadowScale ? def.shadowScale[0] : 0.7, def.shadowScale ? def.shadowScale[1] : 0.35]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. GOLDEN SELECTION RING ON GROUND */}
      {isSelected && (
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial color="#C6A664" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 3. UPRIGHT STANDING BILLBOARD (Y-AXIS LOCKED TO ISOMETRIC ANGLE) */}
      <mesh
        ref={meshRef}
        position={[0, posY, 0]}
        rotation={[0, ISOMETRIC_Y_ROTATION, 0]}
      >
        <planeGeometry args={[width, height]} />
        {/* STRICT REQUIREMENT: transparent: true, alphaTest: 0.5 to eliminate black boxes */}
        <meshBasicMaterial
          map={texture}
          transparent={true}
          alphaTest={0.5}
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. SELECTION / HOVER INDICATOR CHEVRON */}
      {(isSelected || hovered) && (
        <group position={[0, height + 0.35, 0]} rotation={[0, ISOMETRIC_Y_ROTATION, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshBasicMaterial color={isSelected ? '#C6A664' : '#ffffff'} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* 5. FLOATING NAME TAG */}
      {isSelected && name && (
        <group position={[0, height + 0.6, 0]} rotation={[0, ISOMETRIC_Y_ROTATION, 0]}>
          <mesh>
            <planeGeometry args={[1.6, 0.32]} />
            <meshBasicMaterial color="#1E2328" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
};
