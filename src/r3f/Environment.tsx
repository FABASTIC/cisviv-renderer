import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { StaticEnvironment } from './StaticEnvironment';

export const Environment: React.FC = () => {
  const worldObjects = useSimulationStore((state) => state.simulationState.worldObjects);
  return <StaticEnvironment worldObjects={worldObjects} />;
};