export interface AgentHistoryEntry {
  tick: number;
  wealth: number;
  energy: number;
  stress: number;
}

export interface AgentState {
  id: string;
  name?: string;
  position: { x: number; y: number }; // 2.5D coordinates (x, z in 3D world space)
  visual_profile: string; // "settler" | "merchant" | "ranger"
  action?: string; // e.g. "Trading goods", "Patrolling boundary"
  state?: string; // "idle" | "walk" | "work"
  facing_direction?: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  needs?: {
    hunger: number;
    fatigue: number;
    health: number;
  };
  // AI Town Stats
  wealth?: number; // 0 - 1000
  energy?: number; // 0 - 100
  stress?: number; // 0 - 100
  history?: AgentHistoryEntry[];
}

export interface WorldObjectState {
  id: string;
  position: { x: number; y: number }; // 2.5D coordinates (x, z in 3D world space)
  elevation?: number; // y height in 3D world space (defaults to 0)
  visual_profile: string; // e.g. "grass", "water", "dirt", "pine_tree", "rock", "shack"
  rotation?: number; // rotation in radians around Y-axis
  scale?: [number, number, number] | number;
  tint?: string;
}

export interface SimulationState {
  tick: number;
  timestamp: number;
  worldBounds: { width: number; height: number };
  agents: AgentState[];
  worldObjects: WorldObjectState[];
}
