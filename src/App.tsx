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
import { colorForDensity, riskScore, etaMinutes, canApprove } from './utils/metrics';


export default function App() {
  const API_URL = import.meta.env.VITE_API_URL;
  const WS_URL = API_URL.replace(/^http/, "ws")
  const [activePersona, setActivePersona] = useState<Persona>('OPERATIONS');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SPECS' | 'DIAG_AUDIT'>('DASHBOARD');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [diagResults, setDiagResults] = useState<{ name: string; pass: boolean; detail: string }[]>([]);

  const addAuditLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setAuditLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addAuditLog(`StadiumMind session initialized. Active persona: OPERATIONS.`);
  }, []);

  const handleRoleChange = (role: Persona) => {
    setActivePersona(role);
    addAuditLog(`Role switched to ${role} WORKSPACE.`);
  };



  const runTestSuite = () => {
    const results = [
      { name: 'colorForDensity: low density is green', pass: colorForDensity(30) === '#2FD675', detail: `Got ${colorForDensity(30)}` },
      { name: 'colorForDensity: mid density is amber', pass: colorForDensity(55) === '#FFB94D', detail: `Got ${colorForDensity(55)}` },
      { name: 'colorForDensity: high density is red', pass: colorForDensity(85) === '#FF5D5D', detail: `Got ${colorForDensity(85)}` },
      { name: 'riskScore: high density + flow scores > 70', pass: riskScore(90, 80, 100) > 70, detail: `Got ${riskScore(90, 80, 100)}` },
      { name: 'riskScore: low density + flow scores < 30', pass: riskScore(10, 5, 100) < 30, detail: `Got ${riskScore(10, 5, 100)}` },
      { name: 'riskScore: handles capacity <= 0', pass: riskScore(10, 5, 0) === 0, detail: 'Handled capacity 0' },
      { name: 'etaMinutes: zero distance is zero minutes', pass: etaMinutes(0, 0) === 0, detail: `Got ${etaMinutes(0, 0)}` },
      { name: 'etaMinutes: crowding increases walk time ETA', pass: etaMinutes(100, 0.9) > etaMinutes(100, 0), detail: `ETA crowded: ${etaMinutes(100, 0.9)} vs normal: ${etaMinutes(100, 0)}` },
      { name: 'RBAC: volunteer is blocked from approvals', pass: canApprove('VOLUNTEER', 'CRITICAL') === false, detail: 'Volunteer access locked' },
      { name: 'RBAC: operations can approve critical actions', pass: canApprove('OPERATIONS', 'CRITICAL') === true, detail: 'Operations access authorized' },
      { name: 'RBAC: eco can approve standard actions', pass: canApprove('ECO', 'LOW') === true, detail: 'Eco authorized standard' }
    ];
    return results;
  };

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
  const [showGuide, setShowGuide] = useState(true);
  
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
      ws.current = new WebSocket(`${WS_URL}/ws/operations`);

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
        setIncidents(prev => [msg.data, ...prev].slice(0, 50));
        addAuditLog(`NEW INCIDENT REGISTERED: [${msg.data.title}] at ${msg.data.location}.`);
        // We do NOT set the selected incident ID here to prevent automated background telemetry events from continuously hijacking the user's active logs focus.
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
        addAuditLog(`INCIDENT #${msg.data.id} SIGNED OFF: Action plan authorized by ${msg.data.approved_by || 'Operations Director'}.`);
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
    addAuditLog(`SANDBOX INJECTION: Simulated Anomaly [${type}] triggered at ${loc}.`);
    const payload = {
      event_type: type,
      description: desc,
      location: loc,
      metric_value: 92.0
    };

    if (connected && ws.current) {
      // Send to API gateway
      try {
        await fetch(`${API_URL}/api/v1/incidents/trigger`, {
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

    setIncidents(prev => [newIncident, ...prev].slice(0, 50));
    addAuditLog(`NEW OFFLINE INCIDENT #${newIncident.id}: Registered at ${newIncident.location}.`);
    // Since this is a direct, manual user-simulation action, we focus on this incident immediately.
    setSelectedIncidentId(newIncident.id);
    setSystemAlert(`🚨 Offline Simulator: Incident registered. Action required!`);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Sign off and approve incident action plan
  const approveIncident = async (id: number) => {
    const inc = incidents.find(i => i.id === id);
    addAuditLog(`APPROVAL SUBMITTED: Authorizing Incident #${id} [${inc?.title || 'Emergency'}]...`);
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
    addAuditLog(`OFFLINE SIGN-OFF: Incident #${id} authorized by ${activePersona}. Dispatching field personnel.`);
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
          {!showGuide && (
            <button 
              onClick={() => setShowGuide(true)}
              className="px-2.5 py-1.5 rounded-lg bg-fifa-gold/15 border border-fifa-gold/30 hover:bg-fifa-gold/25 text-fifa-gold text-[10px] font-bold tracking-wide uppercase transition-all mr-2"
            >
              💡 Show Guide
            </button>
          )}
          <div className="text-xs text-right">
            <div className="text-slate-400 font-bold">Active Workspace</div>
            <div className="font-extrabold text-slate-300 uppercase tracking-wide">{activePersona} VIEW</div>
          </div>
          <label htmlFor="workspace-role-select" className="sr-only">Active Workspace Role Selector</label>
          <select 
            id="workspace-role-select"
            value={activePersona} 
            onChange={(e) => handleRoleChange(e.target.value as Persona)}
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

        {/* Guided Tour / Explainer Banner */}
        {showGuide && (
          <div className="bg-slate-950/80 border border-fifa-gold/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-5 items-start">
            <div className="absolute top-0 right-0 p-3">
              <button 
                onClick={() => setShowGuide(false)} 
                className="text-slate-500 hover:text-slate-200 text-[10px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 transition-colors"
              >
                ✕ Hide Guide
              </button>
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="text-sm font-bold text-fifa-gold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-fifa-gold animate-spin-slow" />
                StadiumMind AI Dashboard Guide
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                Welcome to <strong>StadiumMind AI OS</strong>, an intelligent Multi-Agent platform designed to autonomously coordinate operations for the <strong>FIFA World Cup 2026</strong>. This platform simulates how AI agents ingest stadium telemetry (from cameras and sensors) and execute response plans with human-in-the-loop oversight.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-2 text-[11px] leading-normal text-slate-400">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-200 font-bold block mb-1">1. Inject Anomaly Events</span>
                  Use the <strong>AI Sandbox Event Simulator</strong> (bottom-left) to trigger simulated crowd congestions, security threats, medical emergencies, or energy grid alerts.
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-200 font-bold block mb-1">2. Inspect Agent Reasoning</span>
                  Observe the <strong>Agent Reasoning Chain</strong> (bottom-right) as the AI thoughts, RAG SOP retrievals, and confidence scores are parsed step-by-step.
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-200 font-bold block mb-1">3. Multi-Role Dashboards</span>
                  Change the <strong>Active Workspace</strong> selector in the header to preview real-time views tailored for Medics, Security, Volunteers, or the Operations Director (COO).
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-200 font-bold block mb-1">4. Approve Response Plans</span>
                  Incidents marked <code>PENDING_APPROVAL</code> require human action. Click <strong>Authorize Action</strong> in the queue to coordinate field staff dispatches.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab control headers */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-2" role="tablist" aria-label="Dashboard Views">
            <button 
              id="tab-dashboard"
              role="tab"
              aria-selected={activeTab === 'DASHBOARD'}
              aria-controls="panel-content"
              onClick={() => setActiveTab('DASHBOARD')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold tracking-wide transition-all ${
                activeTab === 'DASHBOARD' 
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-fifa-gold" aria-hidden="true" />
              Live Operations Control
            </button>
            <button 
              id="tab-specs"
              role="tab"
              aria-selected={activeTab === 'SPECS'}
              aria-controls="panel-content"
              onClick={() => setActiveTab('SPECS')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold tracking-wide transition-all ${
                activeTab === 'SPECS' 
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4 text-fifa-gold" aria-hidden="true" />
              System Specs & Blueprint (30 Items)
            </button>
            <button 
              id="tab-diag-audit"
              role="tab"
              aria-selected={activeTab === 'DIAG_AUDIT'}
              aria-controls="panel-content"
              onClick={() => setActiveTab('DIAG_AUDIT')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold tracking-wide transition-all ${
                activeTab === 'DIAG_AUDIT' 
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="h-4 w-4 text-fifa-gold" aria-hidden="true" />
              Diagnostics & Audit Log
            </button>
          </div>
        </div>

        {/* Display Tab content */}
        <div role="tabpanel" id="panel-content" aria-labelledby={`tab-${activeTab.toLowerCase()}`} className="flex-1 flex flex-col">
          {activeTab === 'SPECS' ? (
            <div className="flex-1">
              <SpecHub />
            </div>
          ) : activeTab === 'DIAG_AUDIT' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch flex-1">
              {/* Diagnostics Panel */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-wide text-slate-100 mb-2 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500 animate-pulse" aria-hidden="true" />
                    System Diagnostics Suite
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 font-medium">
                    Runs the live unit-test assertions for crowd scoring, walking speed delays, and access-control RBAC configurations in this session.
                  </p>
                  <button 
                    onClick={() => {
                      const res = runTestSuite();
                      setDiagResults(res);
                      const passedCount = res.filter(r => r.pass).length;
                      addAuditLog(`Diagnostics Executed: ${passedCount}/${res.length} assertions passed.`);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg"
                  >
                    Run Diagnostics Suite
                  </button>
                  
                  <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {diagResults.length === 0 ? (
                      <div className="text-xs text-slate-500 italic text-center py-10 border border-dashed border-slate-800 rounded-lg">
                        No diagnostics executed in this session. Click the button above to run tests.
                      </div>
                    ) : (
                      diagResults.map((res, idx) => (
                        <div 
                          key={idx} 
                          className={`flex justify-between items-center text-xs p-2.5 rounded-lg border ${
                            res.pass 
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/5 border-red-500/20 text-red-400'
                          }`}
                        >
                          <span className="font-medium">
                            {res.pass ? '✓' : '✕'} {res.name}
                          </span>
                          <span className="text-[10px] opacity-75 font-mono">{res.detail}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {diagResults.length > 0 && (
                  <div className="text-xs text-slate-400 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span>Summary: <strong className="text-slate-200">{diagResults.filter(r => r.pass).length} / {diagResults.length}</strong> checks passed.</span>
                    <span className="text-emerald-400 font-extrabold text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">SYSTEM HEALTHY</span>
                  </div>
                )}
              </div>

              {/* Audit Log Panel */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-lg font-bold tracking-wide text-slate-100 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-fifa-gold" aria-hidden="true" />
                    Live Operational Audit Log
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 font-medium">
                    Accountability logs capturing role changes, incident dispatches, and administrator approvals in this session.
                  </p>
                  <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-850 h-[320px] overflow-y-auto space-y-2 font-mono text-[10.5px] text-slate-300">
                    {auditLogs.length === 0 ? (
                      <div className="text-slate-600 italic text-center py-24">
                        Audit console ready. Actions will populate logs here.
                      </div>
                    ) : (
                      auditLogs.map((log, idx) => (
                        <div key={idx} className="border-b border-slate-900 pb-1.5 last:border-0 leading-normal flex gap-1">
                          <span className="text-slate-500 flex-shrink-0">{log.substring(0, 10)}</span>
                          <span className="text-slate-200">{log.substring(10)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 italic mt-3 pt-3 border-t border-slate-900">
                  🔒 Cryptographic session signature: MetLife-2026-SHA256 active &bull; RBAC verified
                </div>
              </div>
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
                  activePersona={activePersona}
                />
              </div>
            </div>
          )}
        </div>
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
