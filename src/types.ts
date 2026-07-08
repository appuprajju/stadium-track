export type Persona = 'OPERATIONS' | 'FAN' | 'SECURITY' | 'MEDICAL' | 'TRANSPORT' | 'ECO' | 'VOLUNTEER';

export interface Incident {
  id: number;
  title: string;
  description: string;
  category: 'CROWD' | 'SECURITY' | 'MEDICAL' | 'TRANSPORT' | 'ECO' | 'GENERAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'RESOLVED';
  confidence_score: number;
  agent_explanation: string; // Stringified JSON steps or raw text
  location: string;
  recommendation: string;
  timestamp: string;
  approved_by?: string;
  approved_at?: string;
}

export interface Gate {
  gate_name: string;
  status: 'OPEN' | 'CLOSED' | 'CONGESTED';
  flow_rate: number;
  current_queue_size: number;
  stampede_risk_percentage: number;
}

export interface Staff {
  name: string;
  role: 'SECURITY' | 'MEDICAL' | 'VOLUNTEER' | 'OPERATIONS' | 'ECO';
  status: 'AVAILABLE' | 'DISPATCHED' | 'BREAK';
  current_location: string;
}

export interface Vitals {
  total_attendance: number;
  energy_grid_load_kw: number;
  waste_capacity_percent: number;
  shuttles_in_operation: number;
  water_usage_gpm: number;
}

export interface AgentStep {
  agent: string;
  step: 'THOUGHT' | 'ACTION' | 'OBSERVATION' | 'OUTCOME';
  content: string;
  time: string;
}
