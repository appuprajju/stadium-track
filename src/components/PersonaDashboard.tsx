import React, { useState } from 'react';
import { Persona, Gate, Staff } from '../types';
import { 
  HeartPulse, Send, Truck, Bus, 
  Trash2, Flame, Languages, CheckSquare, AlertTriangle, Ticket,
  ShieldCheck, Volume2, Database, Lock, Radio
} from 'lucide-react';

interface PersonaDashboardProps {
  activePersona: Persona;
  gates: Gate[];
  staff: Staff[];
  onTriggerSOS: (desc: string, loc: string) => void;
}

export default function PersonaDashboard({ activePersona, staff, onTriggerSOS }: PersonaDashboardProps) {
  // Mobile Fan Copilot Chat Mockup
  const [fanChatQuery, setFanChatQuery] = useState('');
  const [fanChatHistory, setFanChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Welcome to StadiumMind Fan Copilot! Ask me about tickets, gates, restaurants, or safety.' }
  ]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Volunteer translation mockup
  const [transInput, setTransInput] = useState('');
  const [transOutput, setTransOutput] = useState('');

  // Operations hub mock states
  const [alertBroadcasted, setAlertBroadcasted] = useState(false);
  const [gatesLockedDown, setGatesLockedDown] = useState(false);
  const [backupDispatched, setBackupDispatched] = useState(false);
  const [systemAlarmActive, setSystemAlarmActive] = useState(false);

  const handleFanChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fanChatQuery.trim()) return;

    const userText = fanChatQuery;
    setFanChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setFanChatQuery('');

    // Simulated Fan intelligence response
    setTimeout(() => {
      let reply = "I can guide you! Let me check the database.";
      const queryLower = userText.toLowerCase();

      if (queryLower.includes('gate')) {
        reply = "Gate C is congested (wait time 25 mins). I suggest entering through Gate D or Gate E where wait times are under 5 minutes.";
      } else if (queryLower.includes('food') || queryLower.includes('eat') || queryLower.includes('taco')) {
        reply = "Nearest Food trucks are Zone B Tacos (5 min wait) and Stadium Burger (15 min wait). I recommend Zone B Tacos for quick access.";
      } else if (queryLower.includes('restroom') || queryLower.includes('toilet')) {
        reply = "Restrooms are situated behind row 12 of Sector F and adjacent to Concessions Hub 3.";
      } else if (queryLower.includes('ticket')) {
        reply = "Your ticket QR code is valid for Gate B entry. Since Gate B is near normal flow, proceed there directly.";
      }

      setFanChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 800);
  };

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      setTimeout(() => {
        setFanChatHistory(prev => [...prev, { sender: 'user', text: "[Voice Input]: Where is the nearest AED?" }]);
        setFanChatHistory(prev => [...prev, { sender: 'ai', text: "The nearest AED unit is mounted directly behind row 14 of Sector B, just 40 meters from your current GPS location." }]);
        setIsVoiceActive(false);
      }, 2000);
    }
  };

  const handleTranslation = () => {
    if (!transInput.trim()) return;
    let trans = "Translating...";
    const val = transInput.toLowerCase();
    
    if (val.includes('ticket')) {
      trans = "Por favor, tenga su boleto listo para escanear en la puerta.";
    } else if (val.includes('exit') || val.includes('way out')) {
      trans = "La salida de emergencia está bajando las escaleras a la derecha.";
    } else if (val.includes('water')) {
      trans = "La estación de agua potable más cercana está al lado del Sector C.";
    } else {
      trans = "Disculpe, ¿necesita ayuda para encontrar su asiento?";
    }
    setTransOutput(trans);
  };

  return (
    <div className="h-full">
      {/* OPERATIONS PERSISTENT VIEW */}
      {activePersona === 'OPERATIONS' && (
        <div className={`glass-panel rounded-2xl p-6 h-full flex flex-col justify-between transition-all duration-500 ${systemAlarmActive ? 'border-red-500/40 bg-red-950/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}`}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Radio className={`h-5 w-5 ${systemAlarmActive ? 'text-red-500 animate-pulse' : 'text-fifa-gold animate-bounce'}`} />
                COO Operations Command Center
              </h3>
              <span className={`w-2.5 h-2.5 rounded-full ${systemAlarmActive ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></span>
            </div>
            <p className="text-xs text-slate-400 mb-5">Real-time Multi-Agent pipelines & executive intervention console</p>

            {/* Pipeline and RAG indicators */}
            <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2">
                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wide">Data pipeline</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">KAFKA OK</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2">
                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wide">RAG Embeddings</div>
                <div className="text-xs font-bold text-fifa-gold mt-0.5 flex items-center justify-center gap-1">
                  <Database className="h-3 w-3" />
                  45 SOPs
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2">
                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wide">Model Node</div>
                <div className="text-xs font-bold text-cyan-400 mt-0.5">Gemini 1.5</div>
              </div>
            </div>

            {/* Active alerts warnings */}
            <div className="space-y-3">
              {systemAlarmActive && (
                <div className="bg-red-950/20 border border-red-500/35 rounded-xl p-3.5 text-xs text-red-400 font-bold animate-pulse">
                  CRITICAL SYSTEM ALARM ACTIVE: Operations team notified. Lockdowns authorized. Zero-Trust protocol engaged.
                </div>
              )}

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block">System Event Statuses</span>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PA ALERT SYSTEM:</span>
                    <span className={alertBroadcasted ? 'text-fifa-gold font-bold' : 'text-slate-500'}>
                      {alertBroadcasted ? '⚠️ LEVEL 1 ALERT BROADCASTING' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">INGRESS BYPASS LOCK:</span>
                    <span className={gatesLockedDown ? 'text-red-400 font-bold' : 'text-slate-500'}>
                      {gatesLockedDown ? '🔐 GATES REDIRECTED / LOCKED' : 'NORMAL ROUTING'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">STANDBY REINFORCEMENTS:</span>
                    <span className={backupDispatched ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                      {backupDispatched ? '🚑 ALL STANDBY CREWS DISPATCHED' : 'READY (12 TEAMS)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Override Buttons */}
          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-3">Executive Dispatch & Override Controls</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button 
                onClick={() => setAlertBroadcasted(!alertBroadcasted)}
                className={`py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                  alertBroadcasted 
                    ? 'bg-fifa-gold/20 border-fifa-gold text-fifa-gold shadow-md shadow-fifa-gold/10' 
                    : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Volume2 className="h-3.5 w-3.5" />
                PA Alert Broadcast
              </button>
              <button 
                onClick={() => setGatesLockedDown(!gatesLockedDown)}
                className={`py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                  gatesLockedDown 
                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-md shadow-red-500/10' 
                    : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Gate Lock Overrides
              </button>
              <button 
                onClick={() => setBackupDispatched(!backupDispatched)}
                className={`py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                  backupDispatched 
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10' 
                    : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                Dispatch Standby
              </button>
              <button 
                onClick={() => setSystemAlarmActive(!systemAlarmActive)}
                className={`py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                  systemAlarmActive 
                    ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-lg' 
                    : 'bg-red-950/20 hover:bg-red-950/40 border-red-900/50 text-red-400 animate-pulse'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Toggle Master Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAN ROLE (Mobile View Sandbox) */}
      {activePersona === 'FAN' && (
        <div className="flex justify-center items-center h-full">
          <div className="w-full max-w-[340px] bg-slate-950 rounded-[36px] border-[6px] border-slate-800 p-4 shadow-2xl relative flex flex-col h-[520px] overflow-hidden justify-between">
            {/* Phone notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-slate-950 mr-2"></span>
              <span className="w-6 h-1 rounded bg-slate-950"></span>
            </div>

            {/* Mobile Header */}
            <div className="pt-4 pb-2 border-b border-slate-900 flex justify-between items-center text-xs px-2 z-10 bg-slate-950">
              <span className="font-extrabold text-fifa-gold flex items-center gap-1">
                <Ticket className="h-3.5 w-3.5" />
                FIFA FanPass
              </span>
              <span className="text-[10px] text-slate-500 font-mono">15:52</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[310px] mt-2">
              {fanChatHistory.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-2xl text-[11px] leading-relaxed max-w-[85%] ${
                    chat.sender === 'user' 
                      ? 'bg-fifa-gold text-slate-950 font-bold ml-auto rounded-tr-none' 
                      : 'bg-slate-900 text-slate-200 mr-auto rounded-tl-none border border-slate-800/80'
                  }`}
                >
                  {chat.text}
                </div>
              ))}
              {isVoiceActive && (
                <div className="flex items-center gap-2 text-cyan-400 text-[10px] bg-cyan-950/20 p-2 rounded-xl border border-cyan-500/20 animate-pulse">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-3 bg-cyan-400 rounded animate-bounce"></span>
                    <span className="w-1.5 h-4.5 bg-cyan-400 rounded animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-2 bg-cyan-400 rounded animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span>Listening for voice commands...</span>
                </div>
              )}
            </div>

            {/* Mobile controls & Input */}
            <div className="space-y-2 pt-2 border-t border-slate-900 bg-slate-950">
              <div className="grid grid-cols-2 gap-1.5 text-[9px] px-1">
                <button 
                  onClick={handleVoiceToggle}
                  className="py-1 px-2 rounded-lg bg-cyan-950/35 border border-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center gap-1"
                >
                  Voice Assist
                </button>
                <button 
                  onClick={() => onTriggerSOS("Emergency: Medical heat collapse reported by Fan in Section B concourse.", "Sector B East concourse")}
                  className="py-1 px-2 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400 font-bold flex items-center justify-center gap-1 animate-pulse"
                >
                  <AlertTriangle className="h-3 w-3" />
                  SOS EMERGENCY
                </button>
              </div>

              <form onSubmit={handleFanChatSubmit} className="flex gap-1">
                <input 
                  type="text" 
                  value={fanChatQuery}
                  onChange={(e) => setFanChatQuery(e.target.value)}
                  placeholder="Ask Fan Copilot..."
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-100 text-[11px] outline-none"
                />
                <button type="submit" className="p-2 rounded-xl bg-fifa-gold text-slate-950">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY DASHBOARD VIEW */}
      {activePersona === 'SECURITY' && (
        <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-red-500" />
              Security Intel Dispatch
            </h3>
            <p className="text-xs text-slate-400 mb-4">CCTV analytical indicators and tactical cordon overrides</p>

            <div className="space-y-3">
              <div className="bg-red-950/15 border border-red-500/30 rounded-xl p-3.5 text-xs">
                <span className="text-red-400 font-bold flex items-center gap-1 uppercase tracking-wide text-[10px] mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Active CCTV Incidents
                </span>
                <p className="text-slate-300">CCTV metadata flagging suspicious parcel near Sector F rows. Police patrols routed.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-400 font-semibold text-xs block mb-2">Sector Boundary Override Status</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition-colors">
                    Lock Gate C Corridor
                  </button>
                  <button className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition-colors">
                    Evacuate Sector F
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-2">Available Security Staff</span>
            <div className="space-y-1.5">
              {staff.filter(s => s.role === 'SECURITY').map((officer, i) => (
                <div key={i} className="flex justify-between text-xs bg-slate-950/20 px-3 py-1.5 rounded-lg border border-slate-900">
                  <span className="font-bold text-slate-200">{officer.name}</span>
                  <span className="text-slate-400">{officer.current_location} &bull; {officer.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MEDICAL STAFF VIEW */}
      {activePersona === 'MEDICAL' && (
        <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-cyan-400" />
              Medical Response AI Coordinator
            </h3>
            <p className="text-xs text-slate-400 mb-4">AED proximity tracking and heat risk warnings</p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Ambient Temperature</div>
                  <div className="text-lg font-bold text-amber-400 flex items-center gap-1">
                    <Flame className="h-4 w-4 text-amber-500" />
                    31.4&deg;C
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">High heat risk index in Sector B rows.</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Ambulance Ingress</div>
                  <div className="text-lg font-bold text-cyan-400">Gate D Route</div>
                  <p className="text-[9px] text-slate-400 mt-1">Cleared response lane active.</p>
                </div>
              </div>

              <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-xl p-3 text-xs leading-relaxed text-slate-300">
                <strong>AED Shortest Path Search:</strong> Medical Response Team 3 dispatch path selected. Estimated time of arrival: <strong>1m 45s</strong>.
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-2">Available Medics</span>
            <div className="space-y-1.5">
              {staff.filter(s => s.role === 'MEDICAL').map((medic, i) => (
                <div key={i} className="flex justify-between text-xs bg-slate-950/20 px-3 py-1.5 rounded-lg border border-slate-900">
                  <span className="font-bold text-slate-200">{medic.name}</span>
                  <span className="text-slate-400">{medic.current_location} &bull; {medic.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRANSPORT AUTHORITIES VIEW */}
      {activePersona === 'TRANSPORT' && (
        <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Bus className="h-5 w-5 text-amber-500" />
              Transit Intelligence Portal
            </h3>
            <p className="text-xs text-slate-400 mb-4">Shuttle dispatch metrics and road delays</p>

            <div className="space-y-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs">
                <span className="text-slate-400 font-semibold block mb-2">Shuttle Schedules</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Metro Line Link A</span>
                    <span className="text-emerald-400 font-bold">On Time (5 min freq)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Plaza Express Bus</span>
                    <span className="text-amber-400 font-bold">Delayed (+12 mins)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Parking Lot Load</div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden mb-1">
                  <div className="bg-fifa-gold h-full" style={{ width: '84%' }}></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                  <span>Lot A: 84% Occupied</span>
                  <span>Lot B: 52% Occupied</span>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 bg-fifa-gold text-slate-950 font-bold rounded-lg text-xs hover:bg-yellow-500 transition-colors flex items-center justify-center gap-1">
            <Truck className="h-4 w-4" />
            Dispatch Shuttle Reinforcements
          </button>
        </div>
      )}

      {/* SUSTAINABILITY TEAM VIEW */}
      {activePersona === 'ECO' && (
        <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-emerald-500" />
              Sustainability & Carbon Metrics
            </h3>
            <p className="text-xs text-slate-400 mb-4">Grid loads, waste compactor states, and carbon accounting</p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Energy Saving</div>
                  <div className="text-lg font-bold text-emerald-400 text-glow-green">14.2% Saved</div>
                  <p className="text-[9px] text-slate-400 mt-1">Suite dimming cycles active.</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Graywater Flow</div>
                  <div className="text-lg font-bold text-emerald-400">820 gal/min</div>
                  <p className="text-[9px] text-slate-400 mt-1">Recycle valve operational.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 font-semibold">Waste Bin Occupancy</span>
                  <span className="text-slate-400 font-bold text-[10px]">Compactor Zone 3</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                  <div className="bg-emerald-500 h-full" style={{ width: '74%' }}></div>
                </div>
                <span className="text-[9px] text-slate-400">Capacity: 74% (compaction recommended in 20 mins).</span>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5">
            <Trash2 className="h-4 w-4" />
            Dispatch Eco-Cleanup Crews
          </button>
        </div>
      )}

      {/* VOLUNTEER VIEW */}
      {activePersona === 'VOLUNTEER' && (
        <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Languages className="h-5 w-5 text-fifa-gold" />
              Volunteer Copilot Assistant
            </h3>
            <p className="text-xs text-slate-400 mb-4">Live translations and assigned shift checklists</p>

            <div className="space-y-4">
              {/* Task list */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-400 font-semibold text-xs block mb-2 flex items-center gap-1">
                  <CheckSquare className="h-4 w-4 text-fifa-gold" />
                  Assigned Shift Tasks
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-fifa-gold" defaultChecked />
                    <span className="line-through text-slate-500">Report to information desk at Gate B</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-fifa-gold" />
                    <span>Divert crowd arrivals toward Gate A (Congestion alert active)</span>
                  </div>
                </div>
              </div>

              {/* Translation Widget */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <span className="text-slate-400 font-semibold text-xs block">AI Translation Helper (English &rarr; Spanish)</span>
                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    value={transInput} 
                    onChange={(e) => setTransInput(e.target.value)}
                    placeholder="Enter English guidance..."
                    className="flex-1 glass-input rounded-lg p-2 text-xs text-slate-200 outline-none"
                  />
                  <button onClick={handleTranslation} className="py-1 px-3 bg-fifa-gold text-slate-950 font-bold rounded-lg text-xs hover:bg-yellow-500">
                    Translate
                  </button>
                </div>
                {transOutput && (
                  <div className="p-2 bg-slate-950/40 rounded border border-slate-850 text-xs text-glow-gold text-fifa-gold font-bold">
                    {transOutput}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
