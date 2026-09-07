export interface AgentState {
  id: string;
  position: { x: number; y: number };
  visual_profile: string;
  action: string;
  state: string;
  needs?: { hunger: number; fatigue: number; health: number };
}

export interface BuildingState {
  id: string;
  type: string;
  position: { x: number; y: number };
  color: string;
  scale?: [number, number, number];
}

export const generateMockAgents = (count = 300): AgentState[] => {
  const agents: AgentState[] = [];

  for (let i = 0; i < count; i++) {
    let profile = 'citizen_01';
    let posX = 0;
    let posZ = 0;

    // Distribute agents by specialized city district
    if (i < 50) {
      profile = 'doctor_01'; // Medical District
      posX = -35 + (Math.random() * 20 - 10);
      posZ = -30 + (Math.random() * 20 - 10);
    } else if (i < 100) {
      profile = 'teacher_01'; // Education District
      posX = 35 + (Math.random() * 20 - 10);
      posZ = -30 + (Math.random() * 20 - 10);
    } else if (i < 160) {
      profile = 'farmer_01'; // Agricultural District
      posX = -40 + (Math.random() * 25 - 12);
      posZ = 35 + (Math.random() * 25 - 12);
    } else if (i < 230) {
      profile = 'shopkeeper_01'; // Commercial Market Square
      posX = (Math.random() * 30 - 15);
      posZ = (Math.random() * 20 - 10);
    } else {
      profile = 'citizen_01'; // Residential Zone
      posX = 20 + (Math.random() * 30 - 15);
      posZ = 30 + (Math.random() * 30 - 15);
    }

    agents.push({
      id: `agent_${i.toString().padStart(3, '0')}`,
      position: { x: posX, y: posZ },
      visual_profile: profile,
      action: 'on_duty',
      state: 'active',
      needs: {
        hunger: parseFloat(Math.random().toFixed(2)),
        fatigue: parseFloat(Math.random().toFixed(2)),
        health: 1.0,
      },
    });
  }
  return agents;
};

export const MOCK_BUILDINGS: BuildingState[] = [
  // Medical District
  { id: 'b_hospital', type: 'Hospital Complex', position: { x: -35, y: -30 }, color: '#38bdf8', scale: [10, 5, 8] },
  
  // Education District
  { id: 'b_school', type: 'City Academy', position: { x: 35, y: -30 }, color: '#818cf8', scale: [12, 4, 8] },
  
  // Agricultural District
  { id: 'b_farm', type: 'Central Plantation', position: { x: -40, y: 35 }, color: '#a16207', scale: [16, 0.4, 16] },

  // Commercial Market Square (Shops)
  { id: 'b_shop1', type: 'General Market', position: { x: -8, y: 0 }, color: '#22c55e', scale: [5, 3, 5] },
  { id: 'b_shop2', type: 'Grand Bakery', position: { x: 0, y: 0 }, color: '#f59e0b', scale: [5, 3, 5] },
  { id: 'b_shop3', type: 'Apothecary', position: { x: 8, y: 0 }, color: '#06b6d4', scale: [5, 3, 5] },
  { id: 'b_shop4', type: 'Blacksmith', position: { x: 0, y: -10 }, color: '#64748b', scale: [6, 3, 5] },

  // Residential Neighborhood
  ...Array.from({ length: 16 }).map((_, i) => ({
    id: `b_house_${i}`,
    type: 'House',
    position: { x: 15 + (i % 4) * 8, y: 15 + Math.floor(i / 4) * 8 },
    color: '#94a3b8',
    scale: [4, 2.8, 4] as [number, number, number],
  })),
];