import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, OrthographicCamera } from '@react-three/drei';
import { StaticEnvironment } from '../r3f/StaticEnvironment';
import { AgentSprite } from '../r3f/AgentSprite';
import type { SimulationState } from '../types/simulation';
import { useSimulationStore } from '../store/useSimulationStore';
import { preloadAllTextures } from '../services/texturePipeline';

interface WorldCanvasProps {
  simulationState: SimulationState;
  selectedAgentId?: string | null;
  onSelectAgent?: (id: string | null) => void;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  simulationState,
  selectedAgentId = null,
  onSelectAgent,
}) => {
  const regenerateMap = useSimulationStore((s) => s.regenerateMap);

  // Preload all pixel-art textures from /public/assets/
  useEffect(() => {
    preloadAllTextures();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1E2328',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Left Title Bar & Procedural Controls */}
      <header
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(30, 35, 40, 0.92)',
            border: '1px solid #C6A664',
            borderRadius: '8px',
            padding: '12px 18px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: '#C6A664',
              fontWeight: 700,
            }}
          >
            Civilization Systems // 2.5D Isometric Engine
          </div>
          <h1
            style={{
              margin: '2px 0 0 0',
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#EDF5FC',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Procedural Territory
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginTop: '6px',
              fontSize: '11px',
              color: '#B8C5D6',
            }}
          >
            <span>Grid: <strong>40×40 Tiles</strong></span>
            <span>Citizens: <strong style={{ color: '#4E9A62' }}>{simulationState.agents.length} Active</strong></span>
            <span>Textures: <strong style={{ color: '#C6A664' }}>File-Based (.png)</strong></span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => regenerateMap()}
            style={{
              backgroundColor: 'rgba(30, 35, 40, 0.9)',
              border: '1px solid rgba(198, 166, 100, 0.5)',
              color: '#C6A664',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#C6A664';
              e.currentTarget.style.color = '#1E2328';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(30, 35, 40, 0.9)';
              e.currentTarget.style.color = '#C6A664';
            }}
          >
            <span>⟳</span>
            <span>Regenerate Map</span>
          </button>
        </div>
      </header>

      {/* R3F WebGL Canvas */}
      <Canvas
        orthographic
        shadows
        onPointerDown={(e) => {
          // Deselect when clicking background ground
          if (e.target === e.currentTarget) {
            onSelectAgent?.(null);
          }
        }}
      >
        {/* 1. 2.5D ISOMETRIC ORTHOGRAPHIC CAMERA */}
        <OrthographicCamera
          makeDefault
          position={[38, 38, 38]}
          zoom={32}
          near={-200}
          far={400}
        />

        {/* 2. CAMERA CONTROLS: Pan & Zoom Only (Strictly Locked Rotation) */}
        <MapControls
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          screenSpacePanning={false}
          minZoom={14}
          maxZoom={80}
          target={[0, 0, 0]}
        />

        {/* 3. LIGHTING (Atmospheric Warm Sun & Soft Ambient Fill) */}
        <ambientLight intensity={1.15} color="#edf5fc" />
        <directionalLight
          position={[35, 55, 25]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={200}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          color="#fff8e7"
        />

        {/* 4. PROCEDURAL STATIC ENVIRONMENT (Flat Ground Tiles, Shadows, Upright Props) */}
        <StaticEnvironment worldObjects={simulationState.worldObjects} />

        {/* 5. DYNAMIC UPRIGHT AGENTS */}
        {simulationState.agents.map((agent) => (
          <AgentSprite
            key={agent.id}
            id={agent.id}
            name={agent.name}
            x={agent.position.x}
            z={agent.position.y}
            visualProfile={agent.visual_profile}
            animationState={agent.state || agent.action || 'idle'}
            isSelected={selectedAgentId === agent.id}
            onClick={() => onSelectAgent?.(agent.id)}
          />
        ))}
      </Canvas>
    </div>
  );
};
