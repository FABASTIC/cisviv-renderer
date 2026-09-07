import type { SimulationState, AgentState, WorldObjectState } from '../types/simulation';

export const generateMockSimulationState = (
  agentCount = 350,
  foliageCount = 1400,
  pathCount = 400
): SimulationState => {
  const agents: AgentState[] = [];
  const worldObjects: WorldObjectState[] = [];

  // 1. DUSTY DIRT TRAILS & CRACKED EARTH (Flat Ground Decals)
  for (let i = 0; i < pathCount; i++) {
    const isMainStreet = i < 200;
    const x = isMainStreet ? -80 + (i * 0.8) : ((i % 14) - 7) * 2.2;
    const y = isMainStreet ? ((i % 5) - 2) * 0.9 : -60 + ((i - 200) * 0.7);

    worldObjects.push({
      id: `trail_${i}`,
      position: { x, y },
      elevation: 0.002,
      visual_profile: i % 4 === 0 ? 'cracked_earth_patch' : 'dusty_dirt_trail',
      scale: [2.0, 2.0, 1],
      rotation: Math.random() * Math.PI * 2,
    });
  }

  // 2. 19th-CENTURY FRONTIER LANDMARKS & WOODEN BUILDINGS (Standing 2D Billboards)
  const frontierStructures = [
    { profile: 'weathered_saloon', x: -8, y: -8, scale: 1.0 },
    { profile: 'general_store_wood', x: 12, y: -8, scale: 1.0 },
    { profile: 'sheriff_office', x: -26, y: -8, scale: 1.0 },
    { profile: 'blacksmith_furnace', x: 28, y: -8, scale: 1.0 },
    { profile: 'windpump_water_well', x: 0, y: 14, scale: 1.0 },
    { profile: 'hitching_post_wood', x: -5, y: -3, scale: 1.0 },
    { profile: 'hitching_post_wood', x: 15, y: -3, scale: 1.0 },
  ];

  frontierStructures.forEach((b, idx) => {
    worldObjects.push({
      id: `structure_${idx}`,
      position: { x: b.x, y: b.y },
      visual_profile: b.profile,
      scale: b.scale,
    });
  });

  // Outlying Frontier Wooden Cabins
  for (let c = 0; c < 16; c++) {
    const col = c % 4;
    const row = Math.floor(c / 4);
    worldObjects.push({
      id: `cabin_${c}`,
      position: { x: 35 + col * 12, y: 15 + row * 12 },
      visual_profile: 'frontier_cabin',
      scale: 0.9 + Math.random() * 0.2,
    });
  }

  // 3. ARID FOLIAGE & SCATTERED DEADWOOD (Standing 2D Billboards)
  const foliageProfiles = ['dead_tree_01', 'dead_pine_01', 'dry_scrub_brush', 'desert_cactus_saguaro'];

  for (let f = 0; f < foliageCount; f++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 85;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    const profile = foliageProfiles[f % foliageProfiles.length];
    const scale = 0.75 + Math.random() * 0.5;

    worldObjects.push({
      id: `foliage_${f}`,
      position: { x, y },
      visual_profile: profile,
      scale: [scale, scale, 1],
    });
  }

  // 4. FRONTIER POPULATION AGENTS (2.5D Animated Billboards)
  const agentProfiles = ['frontier_settler', 'deputy_marshal', 'rancher_cowboy', 'saloon_barkeeper'];
  const agentActions = ['walk', 'idle', 'work', 'patrol'];

  for (let a = 0; a < agentCount; a++) {
    const profile = agentProfiles[a % agentProfiles.length];
    let posX = 0;
    let posY = 0;

    if (profile === 'deputy_marshal') {
      posX = -26 + (Math.random() * 20 - 10);
      posY = -8 + (Math.random() * 12 - 6);
    } else if (profile === 'saloon_barkeeper') {
      posX = -8 + (Math.random() * 10 - 5);
      posY = -8 + (Math.random() * 10 - 5);
    } else if (profile === 'rancher_cowboy') {
      posX = (Math.random() * 60 - 30);
      posY = 25 + (Math.random() * 30 - 15);
    } else {
      posX = (Math.random() * 70 - 35);
      posY = (Math.random() * 40 - 20);
    }

    agents.push({
      id: `frontier_agent_${a.toString().padStart(4, '0')}`,
      position: { x: posX, y: posY },
      visual_profile: profile,
      action: agentActions[a % agentActions.length],
      state: agentActions[a % agentActions.length],
      needs: {
        hunger: parseFloat((0.2 + Math.random() * 0.6).toFixed(2)),
        fatigue: parseFloat((0.1 + Math.random() * 0.7).toFixed(2)),
        health: 1.0,
      },
    });
  }

  return {
    tick: 1,
    timestamp: Date.now(),
    worldBounds: { width: 220, height: 220 },
    agents,
    worldObjects,
  };
};
