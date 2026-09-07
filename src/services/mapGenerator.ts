import type { SimulationState, AgentState, WorldObjectState } from '../types/simulation';
import { getAssetDefinition } from './assetDictionary';

export interface MapGeneratorOptions {
  gridSize?: number; // default 40
  treeClusters?: number;
  rockClusters?: number;
  agentCount?: number;
}

/**
 * Smart Procedural Map Generator
 * Generates a structured 40x40 world grid with flat ground plane and upright props.
 */
export const generateProceduralMap = (options: MapGeneratorOptions = {}): SimulationState => {
  const {
    gridSize = 40,
    agentCount = 14,
  } = options;

  const halfSize = gridSize / 2;
  const worldObjects: WorldObjectState[] = [];
  const agents: AgentState[] = [];

  // 40x40 tile grid matrix: maps [gx][gz] -> tileId
  const tileGrid: string[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill('grass')
  );

  // Set of occupied grid coordinates for standing props to guarantee no overlap
  const occupiedCells = new Set<string>();
  const cellKey = (gx: number, gz: number) => `${gx},${gz}`;

  // =========================================================================
  // STEP 1: BASE TERRAIN (Filled with 'grass' tiles by default above)
  // =========================================================================

  // =========================================================================
  // STEP 2: WATER FEATURES (Carve winding river + lake)
  // =========================================================================
  for (let gz = 0; gz < gridSize; gz++) {
    // Smooth natural meander for the river
    const riverCenter = Math.round(18 + Math.sin(gz * 0.18) * 6 + Math.cos(gz * 0.09) * 2);
    const riverHalfWidth = gz > 12 && gz < 28 ? 1 : 2; // River widens at bends

    for (let dx = -riverHalfWidth; dx <= riverHalfWidth; dx++) {
      const gx = riverCenter + dx;
      if (gx >= 0 && gx < gridSize) {
        tileGrid[gx][gz] = 'water';
      }
    }
  }

  // Carve a small lake in the North-East quadrant (around gx: 32, gz: 8)
  const lakeCenter = { x: 31, z: 8 };
  const lakeRadius = 4.5;
  for (let gx = lakeCenter.x - 6; gx <= lakeCenter.x + 6; gx++) {
    for (let gz = lakeCenter.z - 6; gz <= lakeCenter.z + 6; gz++) {
      if (gx >= 0 && gx < gridSize && gz >= 0 && gz < gridSize) {
        const dist = Math.hypot(gx - lakeCenter.x, gz - lakeCenter.z);
        if (dist <= lakeRadius + (Math.sin(gx * 1.5) * 0.5)) {
          tileGrid[gx][gz] = 'water';
        }
      }
    }
  }

  // =========================================================================
  // STEP 3: PATHS (Dirt roads connecting center (20, 20) to edges + Bridges)
  // =========================================================================
  const centerCoord = Math.floor(gridSize / 2); // 20

  // East-West Main Thoroughfare (gz = 20)
  for (let gx = 0; gx < gridSize; gx++) {
    if (tileGrid[gx][centerCoord] === 'water') {
      tileGrid[gx][centerCoord] = 'bridge'; // Wooden bridge over river
    } else {
      tileGrid[gx][centerCoord] = 'dirt';
    }
  }

  // North-South Main Thoroughfare (gx = 20)
  for (let gz = 0; gz < gridSize; gz++) {
    if (tileGrid[centerCoord][gz] === 'water') {
      tileGrid[centerCoord][gz] = 'bridge';
    } else {
      tileGrid[centerCoord][gz] = 'dirt';
    }
  }

  // Branch path towards lake landing (from center (20, 20) towards (31, 14))
  let curX = centerCoord;
  let curZ = centerCoord;
  while (curZ > 14) {
    curZ--;
    if (tileGrid[curX][curZ] !== 'water' && tileGrid[curX][curZ] !== 'bridge') {
      tileGrid[curX][curZ] = 'dirt';
    }
  }
  while (curX < 30) {
    curX++;
    if (tileGrid[curX][curZ] !== 'water' && tileGrid[curX][curZ] !== 'bridge') {
      tileGrid[curX][curZ] = 'dirt';
    }
  }

  // Town Square widening around crossroads center (19..21, 19..21)
  for (let gx = centerCoord - 1; gx <= centerCoord + 1; gx++) {
    for (let gz = centerCoord - 1; gz <= centerCoord + 1; gz++) {
      if (tileGrid[gx][gz] !== 'water' && tileGrid[gx][gz] !== 'bridge') {
        tileGrid[gx][gz] = 'dirt';
      }
    }
  }

  // Emit all Ground Tiles to worldObjects
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gz = 0; gz < gridSize; gz++) {
      const tileType = tileGrid[gx][gz];
      const assetDef = getAssetDefinition(tileType);
      const worldX = gx - halfSize + 0.5;
      const worldZ = gz - halfSize + 0.5;

      worldObjects.push({
        id: `ground_${gx}_${gz}`,
        position: { x: worldX, y: worldZ },
        elevation: assetDef.elevation,
        visual_profile: tileType,
        rotation: 0,
        scale: 1,
      });

      // Mark non-walkable or path cells so props don't block roads or sink in water
      if (tileType === 'water' || tileType === 'dirt' || tileType === 'bridge') {
        occupiedCells.add(cellKey(gx, gz));
      }
    }
  }

  // =========================================================================
  // STEP 4: FLORA & STANDING PROPS (Forests & Rocks on Grass ONLY)
  // =========================================================================

  // Helper to place a standing prop safely
  const placeStandingProp = (gx: number, gz: number, propType: string, scale = 1.0) => {
    if (gx < 0 || gx >= gridSize || gz < 0 || gz >= gridSize) return false;
    if (tileGrid[gx][gz] !== 'grass') return false; // STRICT RULE: Only on grass tiles!
    if (occupiedCells.has(cellKey(gx, gz))) return false;

    const worldX = gx - halfSize + 0.5;
    const worldZ = gz - halfSize + 0.5;

    worldObjects.push({
      id: `${propType}_${gx}_${gz}`,
      position: { x: worldX, y: worldZ },
      elevation: 0,
      visual_profile: propType,
      scale,
    });

    occupiedCells.add(cellKey(gx, gz));
    return true;
  };

  // 1. Village Frontier Shacks around the crossroads
  const shacks = [
    { gx: centerCoord - 3, gz: centerCoord - 3 },
    { gx: centerCoord + 4, gz: centerCoord - 3 },
    { gx: centerCoord - 3, gz: centerCoord + 3 },
    { gx: centerCoord + 4, gz: centerCoord + 3 },
  ];
  shacks.forEach((s) => placeStandingProp(s.gx, s.gz, 'shack', 1.0));

  // 2. North-West Ancient Pine Forest Cluster (centered around gx: 8, gz: 8)
  for (let i = 0; i < 70; i++) {
    const angle = (i * 137.5 * Math.PI) / 180; // Golden angle distribution
    const r = Math.sqrt(i) * 1.5;
    const gx = Math.round(8 + Math.cos(angle) * r);
    const gz = Math.round(8 + Math.sin(angle) * r);
    placeStandingProp(gx, gz, 'pine_tree', 0.9 + Math.random() * 0.3);
  }

  // 3. South-East Pine Grove Cluster (centered around gx: 32, gz: 32)
  for (let i = 0; i < 60; i++) {
    const angle = (i * 137.5 * Math.PI) / 180;
    const r = Math.sqrt(i) * 1.4;
    const gx = Math.round(31 + Math.cos(angle) * r);
    const gz = Math.round(31 + Math.sin(angle) * r);
    placeStandingProp(gx, gz, 'pine_tree', 0.85 + Math.random() * 0.35);
  }

  // 4. Riverbank Pine Trees (scattered along natural riparian zone)
  for (let gz = 2; gz < gridSize - 2; gz += 2) {
    const riverCenter = Math.round(18 + Math.sin(gz * 0.18) * 6 + Math.cos(gz * 0.09) * 2);
    // Place on left bank or right bank
    placeStandingProp(riverCenter - 4, gz, 'pine_tree', 0.9);
    placeStandingProp(riverCenter + 4, gz, 'pine_tree', 0.9);
  }

  // 5. Granite Boulders clustered near Lake Shore and Rocky Outcrops
  const rockPositions = [
    { gx: 26, gz: 7 },
    { gx: 27, gz: 10 },
    { gx: 36, gz: 13 },
    { gx: 35, gz: 5 },
    { gx: 5, gz: 32 },
    { gx: 6, gz: 35 },
    { gx: 12, gz: 26 },
  ];
  rockPositions.forEach((r) => placeStandingProp(r.gx, r.gz, 'rock', 0.9 + Math.random() * 0.25));

  // =========================================================================
  // STEP 5: AI TOWN AGENTS & RICH STATS
  // =========================================================================
  const agentNames = [
    'Eleanor Vance', 'Arthur Pendelton', 'Clara Oswin', 'Silas Thorne',
    'Beatrice Sterling', 'Julian Marsh', 'Dorothy Gale', 'Gideon Cross',
    'Amelia Croft', 'Finnian Drake', 'Rowan Blackwood', 'Evangeline Fox',
    'Thomas Weaver', 'Maeve Callahan'
  ];

  const profiles = ['settler', 'merchant', 'ranger'];
  const actions = [
    'Bartering supplies at crossroad',
    'Inspecting timber yield',
    'Surveying northern perimeter',
    'Resting by cedar cabin',
    'Carrying freshwater buckets',
    'Patrolling river bridge',
    'Planning farm expansion',
    'Observing wildlife activity',
  ];

  // Pick walkable spawn spots along roads and village green
  const spawnCoordinates = [
    { gx: centerCoord, gz: centerCoord },
    { gx: centerCoord - 1, gz: centerCoord },
    { gx: centerCoord + 1, gz: centerCoord },
    { gx: centerCoord, gz: centerCoord - 2 },
    { gx: centerCoord, gz: centerCoord + 2 },
    { gx: centerCoord - 4, gz: centerCoord },
    { gx: centerCoord + 4, gz: centerCoord },
    { gx: centerCoord, gz: centerCoord - 5 },
    { gx: centerCoord, gz: centerCoord + 5 },
    { gx: 25, gz: 14 },
    { gx: 28, gz: 14 },
    { gx: 12, gz: centerCoord },
    { gx: centerCoord, gz: 28 },
    { gx: centerCoord - 2, gz: centerCoord - 1 },
  ];

  for (let a = 0; a < Math.min(agentCount, spawnCoordinates.length); a++) {
    const spawn = spawnCoordinates[a];
    const worldX = spawn.gx - halfSize + 0.5;
    const worldZ = spawn.gz - halfSize + 0.5;

    const profile = profiles[a % profiles.length];
    const wealth = Math.round(250 + (a * 73) % 650);
    const energy = Math.round(65 + (a * 19) % 35);
    const stress = Math.round(15 + (a * 23) % 40);

    // Generate 5-tick history trend
    const history = [
      { tick: 1, wealth: Math.max(0, wealth - 40), energy: Math.min(100, energy + 10), stress: Math.max(0, stress - 5) },
      { tick: 2, wealth: Math.max(0, wealth - 20), energy: Math.min(100, energy + 5), stress: stress },
      { tick: 3, wealth: wealth - 10, energy: energy, stress: stress + 4 },
      { tick: 4, wealth: wealth + 15, energy: energy - 4, stress: stress - 2 },
      { tick: 5, wealth: wealth, energy: energy, stress: stress },
    ];

    agents.push({
      id: `agent_${a + 1}`,
      name: agentNames[a % agentNames.length],
      position: { x: worldX, y: worldZ },
      visual_profile: profile,
      action: actions[a % actions.length],
      state: a % 3 === 0 ? 'walk' : (a % 3 === 1 ? 'work' : 'idle'),
      needs: {
        hunger: parseFloat((0.15 + (a * 0.07) % 0.4).toFixed(2)),
        fatigue: parseFloat(((100 - energy) / 100).toFixed(2)),
        health: 1.0,
      },
      wealth,
      energy,
      stress,
      history,
    });
  }

  return {
    tick: 5,
    timestamp: Date.now(),
    worldBounds: { width: gridSize, height: gridSize },
    agents,
    worldObjects,
  };
};
