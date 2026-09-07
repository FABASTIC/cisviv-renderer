import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { WorldObjectState } from '../types/simulation';
import { getAssetDefinition } from '../services/assetDictionary';
import { loadPixelTexture } from '../services/texturePipeline';

interface StaticEnvironmentProps {
  worldObjects: WorldObjectState[];
}

// Reusable math scratch objects
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempEuler = new THREE.Euler();
const tempMatrix = new THREE.Matrix4();

// Fixed isometric horizontal angle (45 degrees for orthographic [50, 50, 50] camera)
const ISOMETRIC_Y_ROTATION = Math.PI / 4;

export const StaticEnvironment: React.FC<StaticEnvironmentProps> = ({ worldObjects }) => {
  // Separate ground tiles, standing props, and contact shadows
  const { groundGroups, propGroups, shadowList } = useMemo(() => {
    const ground: Record<string, WorldObjectState[]> = {};
    const props: Record<string, WorldObjectState[]> = {};
    const shadows: { x: number; z: number; scale: [number, number] }[] = [];

    for (let i = 0; i < worldObjects.length; i++) {
      const obj = worldObjects[i];
      const def = getAssetDefinition(obj.visual_profile);

      if (def.isGround) {
        if (!ground[def.id]) ground[def.id] = [];
        ground[def.id].push(obj);
      } else {
        if (!props[def.id]) props[def.id] = [];
        props[def.id].push(obj);

        if (def.hasShadow && def.shadowScale) {
          const s = typeof obj.scale === 'number' ? obj.scale : 1.0;
          shadows.push({
            x: obj.position.x,
            z: obj.position.y,
            scale: [def.shadowScale[0] * s, def.shadowScale[1] * s],
          });
        }
      }
    }

    return { groundGroups: ground, propGroups: props, shadowList: shadows };
  }, [worldObjects]);

  return (
    <group name="ProceduralWorldEnvironment">
      {/* Foundation border plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#141a17" roughness={1} />
      </mesh>

      {/* 1. FLAT GROUND TILES (InstancedMesh) */}
      {Object.entries(groundGroups).map(([tileId, objects]) => (
        <InstancedGroundTileGroup key={tileId} tileId={tileId} objects={objects} />
      ))}

      {/* 2. GROUND CONTACT DROP SHADOWS */}
      {shadowList.length > 0 && (
        <InstancedShadowGroup shadows={shadowList} />
      )}

      {/* 3. UPRIGHT STANDING PROPS (InstancedMesh, Y-Axis Locked, Alpha-Tested) */}
      {Object.entries(propGroups).map(([propId, objects]) => (
        <InstancedStandingPropGroup key={propId} propId={propId} objects={objects} />
      ))}
    </group>
  );
};

// ============================================================================
// 1. INSTANCED FLAT GROUND TILES
// ============================================================================
interface InstancedGroundTileGroupProps {
  tileId: string;
  objects: WorldObjectState[];
}

const InstancedGroundTileGroup: React.FC<InstancedGroundTileGroupProps> = ({ tileId, objects }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const def = useMemo(() => getAssetDefinition(tileId), [tileId]);
  const count = objects.length;
  const [, setLoadedTick] = useState(0);

  const geometry = useMemo(() => new THREE.PlaneGeometry(def.size[0], def.size[1]), [def.size]);

  // Load real .png file texture with nearest-neighbor filtering
  const texture = useMemo(() => {
    return loadPixelTexture(def.textureUrl, () => setLoadedTick((t) => t + 1));
  }, [def.textureUrl]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: tileId === 'water' ? 0.2 : 0.85,
      metalness: tileId === 'water' ? 0.1 : 0.0,
      side: THREE.FrontSide,
    });
  }, [texture, tileId]);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const posX = obj.position.x;
      const posZ = obj.position.y;
      const elev = obj.elevation ?? def.elevation;

      // Perfectly flat on ground plane: rotation.x = -Math.PI / 2
      tempPosition.set(posX, elev, posZ);
      tempEuler.set(-Math.PI / 2, 0, 0, 'YXZ');
      tempQuaternion.setFromEuler(tempEuler);
      tempScale.set(1, 1, 1);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [objects, def.elevation]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      receiveShadow
    />
  );
};

// ============================================================================
// 2. INSTANCED CONTACT DROP SHADOWS
// ============================================================================
interface InstancedShadowGroupProps {
  shadows: { x: number; z: number; scale: [number, number] }[];
}

const InstancedShadowGroup: React.FC<InstancedShadowGroupProps> = ({ shadows }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = shadows.length;
  const [, setLoadedTick] = useState(0);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const texture = useMemo(() => {
    return loadPixelTexture('/assets/props/shadow.png', () => setLoadedTick((t) => t + 1));
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [texture]);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < shadows.length; i++) {
      const s = shadows[i];
      tempPosition.set(s.x, 0.003, s.z);
      tempEuler.set(-Math.PI / 2, 0, ISOMETRIC_Y_ROTATION, 'YXZ');
      tempQuaternion.setFromEuler(tempEuler);
      tempScale.set(s.scale[0], s.scale[1], 1);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [shadows]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
    />
  );
};

// ============================================================================
// 3. INSTANCED STANDING PROPS (Y-AXIS LOCKED BILLBOARDS WITH ALPHA TEST)
// ============================================================================
interface InstancedStandingPropGroupProps {
  propId: string;
  objects: WorldObjectState[];
}

const InstancedStandingPropGroup: React.FC<InstancedStandingPropGroupProps> = ({ propId, objects }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const def = useMemo(() => getAssetDefinition(propId), [propId]);
  const count = objects.length;
  const [, setLoadedTick] = useState(0);

  const [width, height] = def.size;
  const geometry = useMemo(() => new THREE.PlaneGeometry(width, height), [width, height]);

  // Load real .png texture file from /public/assets/props/...
  const texture = useMemo(() => {
    return loadPixelTexture(def.textureUrl, () => setLoadedTick((t) => t + 1));
  }, [def.textureUrl]);

  // STRICT REQUIREMENT: transparent: true, alphaTest: 0.5 to prevent black boxes and z-fighting
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.5,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
  }, [texture]);

  useEffect(() => {
    if (!meshRef.current) return;

    // Feet anchored: posY = height / 2 so sprite base sits firmly on y = 0
    const basePosY = height / 2;

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const posX = obj.position.x;
      const posZ = obj.position.y;
      const s = typeof obj.scale === 'number' ? obj.scale : 1.0;

      tempPosition.set(posX, basePosY * s, posZ);

      // Stands upright, Y-axis locked to camera angle (rotation.x = 0, rotation.z = 0)
      tempEuler.set(0, ISOMETRIC_Y_ROTATION, 0, 'YXZ');
      tempQuaternion.setFromEuler(tempEuler);
      tempScale.set(s, s, 1);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [objects, height]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
    />
  );
};
