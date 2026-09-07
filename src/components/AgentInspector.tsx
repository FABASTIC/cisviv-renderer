import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';

export const AgentInspector: React.FC = () => {
  const selectedAgentId = useSimulationStore((state) => state.selectedAgentId);
  const agents = useSimulationStore((state) => state.simulationState.agents);
  const selectAgent = useSimulationStore((state) => state.selectAgent);

  const agentIndex = agents.findIndex((a) => a.id === selectedAgentId);
  const agent = agentIndex !== -1 ? agents[agentIndex] : null;

  if (!agent) {
    return (
      <aside
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(30, 35, 40, 0.85)',
          border: '1px solid rgba(198, 166, 100, 0.3)',
          borderRadius: '8px',
          padding: '12px 18px',
          color: '#B8C5D6',
          fontSize: '13px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ color: '#C6A664', fontSize: '15px' }}>✦</span>
        <span>Click any citizen or prop to inspect dossier</span>
      </aside>
    );
  }

  const handlePrev = () => {
    const prevIdx = (agentIndex - 1 + agents.length) % agents.length;
    selectAgent(agents[prevIdx].id);
  };

  const handleNext = () => {
    const nextIdx = (agentIndex + 1) % agents.length;
    selectAgent(agents[nextIdx].id);
  };

  // Extract stats
  const wealth = agent.wealth ?? 350;
  const energy = agent.energy ?? Math.round((1 - (agent.needs?.fatigue ?? 0.3)) * 100);
  const stress = agent.stress ?? Math.round((agent.needs?.hunger ?? 0.25) * 100);

  // Sparkline data points
  const history = agent.history || [
    { tick: 1, wealth: wealth - 30, stress: stress - 5, energy: energy + 5 },
    { tick: 2, wealth: wealth - 15, stress: stress + 2, energy: energy },
    { tick: 3, wealth: wealth - 5, stress: stress, energy: energy - 2 },
    { tick: 4, wealth: wealth + 10, stress: stress - 3, energy: energy - 4 },
    { tick: 5, wealth: wealth, stress: stress, energy: energy },
  ];

  // SVG Sparkline calculation
  const sparkWidth = 240;
  const sparkHeight = 55;
  const padding = 6;
  const maxW = Math.max(...history.map((h) => h.wealth), 1000);
  const minW = Math.min(...history.map((h) => h.wealth), 0);

  const wealthPoints = history
    .map((h, i) => {
      const x = padding + (i / (history.length - 1)) * (sparkWidth - padding * 2);
      const norm = (h.wealth - minW) / Math.max(maxW - minW, 1);
      const y = sparkHeight - padding - norm * (sparkHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const stressPoints = history
    .map((h, i) => {
      const x = padding + (i / (history.length - 1)) * (sparkWidth - padding * 2);
      const norm = h.stress / 100;
      const y = sparkHeight - padding - norm * (sparkHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <aside
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '320px',
        maxHeight: 'calc(100vh - 40px)',
        backgroundColor: 'rgba(30, 35, 40, 0.94)',
        border: '1px solid #C6A664',
        borderRadius: '10px',
        color: '#EDF5FC',
        padding: '20px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7), inset 0 0 1px rgba(198, 166, 100, 0.3)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        fontFamily: "'Inter', sans-serif",
        overflowY: 'auto',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(198, 166, 100, 0.25)',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: '#C6A664',
              fontWeight: 600,
              marginBottom: '2px',
            }}
          >
            AI Town Dossier // {agent.id.toUpperCase()}
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#FAF7F2',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            {agent.name || agent.id}
          </h2>
          <span
            style={{
              display: 'inline-block',
              marginTop: '4px',
              fontSize: '11px',
              backgroundColor: 'rgba(198, 166, 100, 0.15)',
              color: '#C6A664',
              border: '1px solid rgba(198, 166, 100, 0.3)',
              borderRadius: '4px',
              padding: '2px 8px',
              textTransform: 'capitalize',
            }}
          >
            {agent.visual_profile}
          </span>
        </div>

        <button
          onClick={() => selectAgent(null)}
          title="Close dossier"
          style={{
            background: 'transparent',
            border: '1px solid rgba(198, 166, 100, 0.4)',
            color: '#C6A664',
            cursor: 'pointer',
            fontSize: '14px',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(198, 166, 100, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ✕
        </button>
      </div>

      {/* CURRENT ACTIVITY */}
      <div
        style={{
          backgroundColor: 'rgba(15, 18, 22, 0.6)',
          border: '1px solid rgba(198, 166, 100, 0.15)',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '12px',
        }}
      >
        <div style={{ color: '#A39BA8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
          Current Task & Objective
        </div>
        <div style={{ color: '#EDF5FC', fontWeight: 500 }}>
          {agent.action || 'Wandering frontier perimeter'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: agent.state === 'walk' ? '#C6A664' : (agent.state === 'work' ? '#4E9A62' : '#A39BA8'),
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '11px', color: '#B8C5D6', textTransform: 'capitalize' }}>
            State: {agent.state || 'idle'}
          </span>
        </div>
      </div>

      {/* HORIZONTAL STATS CHARTS */}
      <div style={{ marginBottom: '18px' }}>
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#C6A664',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          Vital State Metrics
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 1. WEALTH BAR (Gold #C6A664) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#C6A664', fontWeight: 600 }}>✦ Wealth</span>
              <span style={{ color: '#EDF5FC', fontWeight: 600 }}>{wealth} Gold</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (wealth / 1000) * 100)}%`,
                  height: '100%',
                  backgroundColor: '#C6A664',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease-out',
                }}
              />
            </div>
          </div>

          {/* 2. ENERGY BAR (Green #4E9A62) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#4E9A62', fontWeight: 600 }}>♥ Energy / Stamina</span>
              <span style={{ color: '#EDF5FC', fontWeight: 600 }}>{energy}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, energy))}%`,
                  height: '100%',
                  backgroundColor: '#4E9A62',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease-out',
                }}
              />
            </div>
          </div>

          {/* 3. STRESS / HUNGER BAR (Red #C53D3D) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#C53D3D', fontWeight: 600 }}>⚡ Stress / Fatigue</span>
              <span style={{ color: '#EDF5FC', fontWeight: 600 }}>{stress}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, stress))}%`,
                  height: '100%',
                  backgroundColor: '#C53D3D',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease-out',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5-TICK SPARKLINE HISTORY */}
      <div
        style={{
          backgroundColor: 'rgba(15, 18, 22, 0.6)',
          border: '1px solid rgba(198, 166, 100, 0.15)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#A39BA8' }}>
            5-Tick Progression
          </span>
          <div style={{ display: 'flex', gap: '10px', fontSize: '10px' }}>
            <span style={{ color: '#C6A664' }}>— Wealth</span>
            <span style={{ color: '#C53D3D' }}>— Stress</span>
          </div>
        </div>

        <svg width="100%" height={sparkHeight} viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}>
          {/* Subtle Grid Lines */}
          <line x1="0" y1={sparkHeight / 2} x2={sparkWidth} y2={sparkHeight / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1="0" y1={sparkHeight - 2} x2={sparkWidth} y2={sparkHeight - 2} stroke="rgba(255,255,255,0.1)" />

          {/* Wealth Sparkline (Gold) */}
          <polyline
            fill="none"
            stroke="#C6A664"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={wealthPoints}
          />

          {/* Stress Sparkline (Red) */}
          <polyline
            fill="none"
            stroke="#C53D3D"
            strokeWidth="1.6"
            strokeDasharray="2 2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={stressPoints}
          />
        </svg>
      </div>

      {/* AGENT CYCLE NAVIGATION */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(198, 166, 100, 0.2)',
          paddingTop: '14px',
        }}
      >
        <button
          onClick={handlePrev}
          style={{
            backgroundColor: 'rgba(198, 166, 100, 0.1)',
            border: '1px solid rgba(198, 166, 100, 0.3)',
            color: '#C6A664',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(198, 166, 100, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(198, 166, 100, 0.1)';
          }}
        >
          ← Previous
        </button>

        <span style={{ fontSize: '11px', color: '#B8C5D6' }}>
          {agentIndex + 1} of {agents.length} Citizens
        </span>

        <button
          onClick={handleNext}
          style={{
            backgroundColor: 'rgba(198, 166, 100, 0.1)',
            border: '1px solid rgba(198, 166, 100, 0.3)',
            color: '#C6A664',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(198, 166, 100, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(198, 166, 100, 0.1)';
          }}
        >
          Next →
        </button>
      </div>
    </aside>
  );
};