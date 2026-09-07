import { WorldCanvas } from './components/WorldCanvas';
import { AgentInspector } from './components/AgentInspector';
import { useSimulationStore } from './store/useSimulationStore';

export default function App() {
  const simulationState = useSimulationStore((state) => state.simulationState);
  const selectedAgentId = useSimulationStore((state) => state.selectedAgentId);
  const selectAgent = useSimulationStore((state) => state.selectAgent);

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
      <WorldCanvas
        simulationState={simulationState}
        selectedAgentId={selectedAgentId}
        onSelectAgent={selectAgent}
      />
      <AgentInspector />
    </main>
  );
}