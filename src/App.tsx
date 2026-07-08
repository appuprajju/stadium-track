import { useState, useEffect, useRef } from 'react';
import { Persona, Incident, Gate, Staff, Vitals } from './types';
import DigitalTwin from './components/DigitalTwin';
import AgentTerminal from './components/AgentTerminal';
import SpecHub from './components/SpecHub';
import PersonaDashboard from './components/PersonaDashboard';
import { 
  ShieldAlert, Activity, Users, 
  Sparkles, FileText, LayoutDashboard 
} from 'lucide-react';

export default function App() {
  const [activePersona, setActivePersona] = useState<Persona>('OPERATIONS');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SPECS'>('DASHBOARD');

  // Core state synced via WebSocket or mock loop
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [gates, setGates] = useState<Gate[]>([
    { gate_name: "Gate A", status: "OPEN", flow_rate: 45, current_queue_size: 120, stampede_risk_percentage: 5.0 },
    { gate_name: "Gate B", status: "OPEN", flow_rate: 50, current_queue_size: 180, stampede_risk_percentage: 12.0 },
    { gate_name: "Gate C", status: "OPEN", flow_rate: 30, current_queue_size: 280, stampede_risk_percentage: 22.0 },
    { gate_name: "Gate D", status: "OPEN", flow_rate: 40, current_queue_size: 90, stampede_risk_percentage: 2.0 },
    { gate_name: "Gate E", status: "OPEN", flow_rate: 35, current_queue_size: 60, stampede_risk_percentage: 0.0 }
  ]);
  const [staff, setStaff] = useState<Staff[]>([
    { name: "Officer Miller", role: "SECURITY", status: "AVAILABLE", current_location: "Gate F Lobby" },
    { name: "Officer Cooper", role: "SECURITY", status: "AVAILABLE", current_location: "Gate C Corridor" },
    { name: "Dr. Vance", role: "MEDICAL", status: "AVAILABLE", current_location: "Medical Station A" },
    { name: "Paramedic Diaz", role: "MEDICAL", status: "AVAILABLE", current_location: "First Aid Zone B" },
    { name: "Volunteer Marcus", role: "VOLUNTEER", status: "AVAILABLE", current_location: "Gate B Entryway" },
    { name: "Volunteer Chloe", role: "VOLUNTEER", status: "AVAILABLE", current_location: "Gate A Concourses" },
    { name: "Eco-Rep Henderson", role: "ECO", status: "AVAILABLE", current_location: "Compost Plaza South" }
  ]);
  const [vitals, setVitals] = useState<Vitals>({
    total_attendance: 68500,
    energy_grid_load_kw: 4200,
    waste_capacity_percent: 34.2,
    shuttles_in_operation: 24,
    water_usage_gpm: 850
  });

  const [connected, setConnected] = useState(false);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  
  // WebSocket reference
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initialize WebSockets and Offline Failback simulation
  useEffect(() => {
    connectWebSocket();

    // Offline simulation telemetry interval (runs if backend is not started)
    const offlineSim = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) return; // Skip if live websocket connected

      // Randomly update gate capacities and vital loads
      setGates(prev => prev.map(g => {
        const delta = Math.floor(Math.random() * 21) - 10;
        const newQueue = Math.max(20, g.current_queue_size + delta);
        const risk = Math.max(0.0, (newQueue - 250) * 0.2 + (Math.random() * 4 - 2));
        return {
          ...g,
          current_queue_size: newQueue,
          status: newQueue > 300 ? 'CONGESTED' : 'OPEN',
          stampede_risk_percentage: parseFloat(risk.toFixed(1))
        };
      }));

      setVitals(prev => ({
        ...prev,
        energy_grid_load_kw: prev.energy_grid_load_kw + Math.floor(Math.random() * 51) - 25,
        water_usage_gpm: prev.water_usage_gpm + Math.floor(Math.random() * 11) - 5
      }));
    }, 5000);

    return () => {
      clearInterval(offlineSim);
      if (ws.current) ws.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket('ws://localhost:3000/ws/operations');

      ws.current.onopen = () => {
        setConnected(true);
        setSystemAlert("Connected to live stadium telemetry feed.");
        setTimeout(() => setSystemAlert(null), 3000);
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Retry connection in 10 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 10000);
      };

      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleSocketMessage(msg);
      };
    } catch (e) {
      setConnected(false);
    }
  };

  const handleSocketMessage = (msg: any) => {
    switch (msg.type) {
      case 'INITIAL_STATE':
        setIncidents(msg.data.incidents);
        setGates(msg.data.gates);
        setStaff(msg.data.staff);
        setVitals(msg.data.vitals);
        break;
      case 'NEW_INCIDENT':
        setIncidents(prev => [msg.data, ...prev]);
        setSelectedIncidentId(msg.data.id);
        setSystemAlert(`🚨 New Multi-Agent Event: ${msg.data.title}`);
        break;
      case 'INCIDENT_APPROVED':
        setIncidents(prev => prev.map(inc => {
          if (inc.id === msg.data.id) {
            return {
              ...inc,
              status: msg.data.status,
              approved_by: msg.data.approved_by,
              approved_at: msg.data.approved_at,
              recommendation: msg.data.recommendation
            };
          }
          return inc;
        }));
        break;
      case 'GATE_UPDATE':
        setGates(prev => prev.map(g => g.gate_name === msg.data.gate_name ? msg.data : g));
        break;
      case 'VITALS_UPDATE':
        setVitals(msg.data);
        break;
      default:
        break;
    }
  };

  // Trigger custom incident event
  const triggerSimulationEvent = async (type: string, desc: string, loc: string) => {
    const payload = {
      event_type: type,
      description: desc,
      location: loc,
      metric_value: 92.0
    };

    if (connected && ws.current) {
      // Send to API gateway
      try {
        await fetch('http://localhost:3000/api/v1/incidents/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        loggerOfflineTrigger(payload);
      }
    } else {
      loggerOfflineTrigger(payload);
    }
  };

  // Fallback offline simulator if FastAPI backend is not running
  const loggerOfflineTrigger = (payload: any) => {
    let category = payload.event_type.split('_')[0];
    if (category === 'TRANSIT') {
      category = 'TRANSPORT';
    }
    
    // Simulate RAG text and ReAct output
    let rec = "Alert local supervisor for immediate review.";
    let Xai = "Standard operation guidelines suggest immediate site verification.";
    let conf = 0.85;

    if (category === 'CROWD') {
      rec = "Open auxiliary bypass tourniquets at Gate B & C. Guide traffic toward Gate A.";
      Xai = "Flow metrics indicate severe bottleneck queues. Gate redistribution prevents stampede dangers.";
      conf = 0.94;
    } else if (category === 'SECURITY') {
      rec = "Establish 50-meter safety cordon. Dispatch security officer patrols to inspect package.";
      Xai = "Suspicious parcel located in corridor. Security SOP SEC-202 requires evacuation grid clearance.";
      conf = 0.91;
    } else if (category === 'MEDICAL') {
      rec = "Dispatch Medical Response Unit 3 with portable AED. Clear pedestrian lanes on West Transit Plaza.";
      Xai = "Distress alert issued for cardiovascular discomfort. Dispatching closest responders.";
      conf = 0.97;
    } else if (category === 'TRANSPORT') {
      rec = "Deploy 2 standby Plaza Express buses. Adjust route delays to bypass highway queue.";
      Xai = "Transit flow analytics indicate gridlock delay of 12+ minutes near main highway intersection.";
      conf = 0.88;
    } else if (category === 'ECO') {
      rec = "De-energize auxiliary suite ventilation nodes in Sectors 1-6. Compact waste bins in Food Cluster C.";
      Xai = "Concessions power grid load exceeds peak thresholds by 22%. Compactor capacities exceed 75%.";
      conf = 0.92;
    }

    const reasoningSteps = [
      { agent: "Orchestrator Agent", step: "THOUGHT", content: `Evaluating raw event details: ${payload.description}`, time: new Date().toISOString() },
      { agent: "Orchestrator Agent", step: "OBSERVATION", content: "Retrieved local SOP templates from mock Vector storage.", time: new Date().toISOString() },
      { agent: "Orchestrator Agent", step: "ACTION", content: `Dispatch recommendation: '${rec}' with ${conf*100}% confidence.`, time: new Date().toISOString() },
      { agent: "Orchestrator Agent", step: "OUTCOME", content: "Human approval required. Dispatch task queued.", time: new Date().toISOString() }
    ];

    const newIncident: Incident = {
      id: Math.floor(Math.random() * 1000) + 10,
      title: `Potential ${capitalize(category)} Issue - ${payload.location}`,
      description: payload.description,
      category: category as any,
      severity: 'HIGH',
      status: 'PENDING_APPROVAL',
      confidence_score: conf,
      agent_explanation: JSON.stringify(reasoningSteps) + `\n\n[Analysis Summary]: ${Xai}`,
      location: payload.location,
      recommendation: rec,
      timestamp: new Date().toISOString()
    };

    setIncidents(prev => [newIncident, ...prev]);
    setSelectedIncidentId(newIncident.id);
    setSystemAlert(`🚨 Offline Simulator: Incident registered. Action required!`);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Sign off and approve incident action plan
  const approveIncident = async (id: number) => {
    if (connected && ws.current) {
      try {
        await fetch(`http://localhost:3000/api/v1/incidents/${id}/approve?manager_name=COO_Stadium_Operations`, {
          method: 'POST'
        });
      } catch (e) {
        approveOfflineIncident(id);
      }
    } else {
      approveOfflineIncident(id);
    }
  };

  const approveOfflineIncident = (id: number) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status: 'EXECUTING',
          approved_by: "COO Operations (Offline Sign)",
          approved_at: new Date().toISOString()
        };
      }
      return inc;
    }));
    
    // Simulate assigning/dispatching staff
    setStaff(prev => prev.map(s => {
      if (s.status === 'AVAILABLE') {
        return { ...s, status: 'DISPATCHED' };
      }
      return s;
    }));

    setSystemAlert("Action authorized! Field personnel dispatched.");
    setTimeout(() => setSystemAlert(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Banner Navigation */}
      <header className="glass-panel border-b border-slate-800/80 px-6 py-4 flex flex-wrap justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-fifa-gold/15 rounded-xl border border-fifa-gold/40 flex items-center justify-center relative radar-glow">
            <Sparkles className="h-5 w-5 text-fifa-gold" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-slate-100 flex items-center gap-1.5 uppercase">
              StadiumMind AI
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-extrabold normal-case tracking-normal border border-emerald-500/20">
                OS v1.0
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">FIFA World Cup 2026 Operations System</p>
          </div>
        </div>

        {/* Global Vital Stats ticker */}
        <div className="hidden xl:flex items-center gap-6 text-xs bg-slate-950/40 px-6 py-2 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-fifa-gold" />
            <span className="text-slate-400">Gate Attendance:</span>
            <span className="font-bold text-slate-200">{vitals.total_attendance.toLocaleString()}</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400">Power Grid:</span>
            <span className="font-bold text-slate-200">{vitals.energy_grid_load_kw} kW</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <span className="text-slate-400">Telemetry Feed:</span>
            <span className={`font-bold flex items-center gap-1 ${connected ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`}></span>
              {connected ? 'KAFKA ACTIVE' : 'SIMULATION MODE'}
            </span>
          </div>
        </div>

        {/* Role Switcher Selector */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-right">
            <div className="text-slate-400 font-bold">Active Workspace</div>
            <div className="font-extrabold text-slate-300 uppercase tracking-wide">{activePersona} VIEW</div>
          </div>
          <select 
            value={activePersona} 
            onChange={(e) => setActivePersona(e.target.value as Persona)}
            className="rounded-lg glass-input p-2 text-xs font-bold text-slate-200"
          >
            <option value="OPERATIONS">Operations Director (COO)</option>
            <option value="FAN">Fan Copilot View (Mobile)</option>
            <option value="SECURITY">Security Division</option>
            <option value="MEDICAL">Medical Response Team</option>
            <option value="TRANSPORT">Transit Authorities</option>
            <option value="ECO">Sustainability Team</option>
            <option value="VOLUNTEER">Volunteers Dispatch</option>
          </select>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Floating System notification banner */}
        {systemAlert && (
          <div className="bg-gradient-to-r from-fifa-gold/20 to-amber-500/10 border border-fifa-gold/40 rounded-xl p-3 text-center text-xs font-bold text-fifa-gold text-glow-gold flex items-center justify-center gap-2 animate-bounce">
            <Sparkles className="h-4 w-4" />
            {systemAlert}
          </div>
        )}

        {/* Tab control headers */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('DASHBOARD')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold tracking-wide transition-all ${
                activeTab === 'DASHBOARD' 
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-fifa-gold" />
              Live Operations Control
            </button>
            <button 
              onClick={() => setActiveTab('SPECS')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold tracking-wide transition-all ${
                activeTab === 'SPECS' 
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4 text-fifa-gold" />
              System Specs & Blueprint (30 Items)
            </button>
          </div>
        </div>

        {/* Display Tab content */}
        {activeTab === 'SPECS' ? (
          <div className="flex-1">
            <SpecHub />
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Top Grid: Stadium twin and persona sub-dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="h-full">
                <DigitalTwin 
                  gates={gates} 
                  incidents={incidents} 
                  selectedIncidentId={selectedIncidentId}
                  onIncidentSelect={(inc) => setSelectedIncidentId(inc.id)}
                />
              </div>
              <div className="h-full">
                <PersonaDashboard 
                  activePersona={activePersona} 
                  gates={gates} 
                  staff={staff}
                  onTriggerSOS={(desc, loc) => triggerSimulationEvent('MEDICAL_EMERGENCY', desc, loc)}
                />
              </div>
            </div>

            {/* Bottom Grid: Agent Terminal logs queue & simulated incident trigger */}
            <div>
              <AgentTerminal 
                incidents={incidents} 
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={setSelectedIncidentId}
                onApproveIncident={approveIncident}
                onSimulateEvent={triggerSimulationEvent}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500">
        StadiumMind AI Operating System &bull; Designed for FIFA World Cup 2026 Stadium Operations. Zero Trust Network Active.
      </footer>
    </div>
  );
}

// Type-safe capitalization helper function
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
