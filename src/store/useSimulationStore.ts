import { create } from 'zustand';
import { generateProceduralMap } from '../services/mapGenerator';
import type { SimulationState, AgentState } from '../types/simulation';

interface SimulationStore {
  simulationState: SimulationState;
  selectedAgentId: string | null;
  setSimulationState: (state: SimulationState) => void;
  updateAgents: (agents: AgentState[]) => void;
  selectAgent: (id: string | null) => void;
  regenerateMap: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  simulationState: generateProceduralMap({ gridSize: 40 }),
  selectedAgentId: 'agent_1',
  setSimulationState: (simulationState) => set({ simulationState }),
  updateAgents: (agents) =>
    set((s) => ({
      simulationState: {
        ...s.simulationState,
        agents,
      },
    })),
  selectAgent: (id) => set({ selectedAgentId: id }),
  regenerateMap: () => set({ simulationState: generateProceduralMap({ gridSize: 40 }) }),
}));