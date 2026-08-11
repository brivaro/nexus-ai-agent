export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  fewShotExamples?: { user: string; model: string }[];
}

import { buscadorConcesionarios } from './buscador-concesionarios';

export const agentTemplates: AgentTemplate[] = [
  buscadorConcesionarios,
];
