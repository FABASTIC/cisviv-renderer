import React from 'react';
import { Billboard } from '@react-three/drei';
import { useSimulationStore } from '../store/useSimulationStore';

interface Props {
  id: string;
  x: number;
  z: number;
  visualProfile: string;
}

// Location & Designation Strict Attire (AI Town Style)
const GET_STRICT_ATTIRE = (profile: string) => {
  switch (profile) {
    case 'doctor_01':
      return { shirt: '#f8fafc', pants: '#0284c7', hat: '#e0f2fe', accessory: 'stethoscope' }; // Medical Scrub/Coat
    case 'teacher_01':
      return { shirt: '#475569', pants: '#1e293b', hat: undefined, accessory: 'glasses' }; // Formal Uniform
    case 'farmer_01':
      return { shirt: '#ca8a04', pants: '#713f12', hat: '#fef08a', accessory: undefined }; // Straw Hat & Dungarees
    case 'shopkeeper_01':
      return { shirt: '#15803d', pants: '#334155', hat: '#facc15', accessory: 'apron' }; // Commercial Apron
    default:
      return { shirt: '#2563eb', pants: '#0f172a', hat: undefined, accessory: undefined }; // Citizen Casual
  }
};

export const SpriteBillboard: React.FC<Props> = ({ id, x, z, visualProfile }) => {
  const selectAgent = useSimulationStore((state) => state.selectAgent);
  const selectedAgentId = useSimulationStore((state) => state.selectedAgentId);
  const isSelected = selectedAgentId === id;

  const style = GET_STRICT_ATTIRE(visualProfile);

  return (
    <group position={[x, 0, z]}>
      <group onClick={(e) => { e.stopPropagation(); selectAgent(id); }}>
        {/* Head */}
        <mesh position={[0, 1.45, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#fed7aa" />
        </mesh>

        {/* Designation Hat / Headwear */}
        {style.hat && (
          <mesh position={[0, 1.68, 0]}>
            <cylinderGeometry args={[0.28, 0.35, 0.08, 16]} />
            <meshStandardMaterial color={style.hat} />
          </mesh>
        )}

        {/* Torso / Uniform Shirt */}
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[0.42, 0.6, 0.25]} />
          <meshStandardMaterial color={isSelected ? '#22d3ee' : style.shirt} />
        </mesh>

        {/* Apron Layer for Shopkeepers */}
        {style.accessory === 'apron' && (
          <mesh position={[0, 0.8, 0.14]}>
            <planeGeometry args={[0.35, 0.5]} />
            <meshStandardMaterial color="#fef08a" />
          </mesh>
        )}

        {/* Arms */}
        <mesh position={[-0.28, 0.95, 0]}>
          <boxGeometry args={[0.12, 0.55, 0.15]} />
          <meshStandardMaterial color="#fed7aa" />
        </mesh>
        <mesh position={[0.28, 0.95, 0]}>
          <boxGeometry args={[0.12, 0.55, 0.15]} />
          <meshStandardMaterial color="#fed7aa" />
        </mesh>

        {/* Pants */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.38, 0.6, 0.22]} />
          <meshStandardMaterial color={style.pants} />
        </mesh>
      </group>

      {/* Octopath Style Target Ring */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      )}

      {/* Floating Indicator */}
      <Billboard position={[0, 2.1, 0]}>
        {isSelected && (
          <mesh position={[0, 0.2, 0]}>
            <coneGeometry args={[0.15, 0.25, 3]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
        )}
      </Billboard>
    </group>
  );
};