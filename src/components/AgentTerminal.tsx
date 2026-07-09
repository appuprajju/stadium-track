import React, { useState } from 'react';
import { Incident, AgentStep, Persona } from '../types';
import { Terminal, ShieldCheck, ShieldAlert, Cpu, Sparkles, UserCheck, Play } from 'lucide-react';

const formatTimeSafely = (timeStr: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

interface AgentTerminalProps {
  incidents: Incident[];
  selectedIncidentId: number | null;
  onSelectIncident: (id: number | null) => void;
  onApproveIncident: (id: number) => void;
  onSimulateEvent: (type: string, desc: string, loc: string) => void;
  activePersona: Persona;
}

export default function AgentTerminal({ 
  incidents, 
  selectedIncidentId, 
  onSelectIncident, 
  onApproveIncident, 
  onSimulateEvent,
  activePersona
}: AgentTerminalProps) {
  
  // Custom event simulation selections
  const [simType, setSimType] = useState('CROWD_ALERT');
  const [simLoc, setSimLoc] = useState('Gate C corridor');
  const [simDesc, setSimDesc] = useState('WiFi analytics show crowd density crossing 4.8 people/sqm.');

  // Find currently selected incident
  const activeIncident = incidents.find(i => i.id === selectedIncidentId) || (incidents.length > 0 ? incidents[0] : null);

  // Parse reasoning steps from incident JSON content
  const getReasoningSteps = (incident: Incident): AgentStep[] => {
    try {
      if (incident.agent_explanation && (incident.agent_explanation.startsWith('[') || incident.agent_explanation.startsWith('{'))) {
        // Strip out the trailing summary block if it's there
        const jsonPart = incident.agent_explanation.split('\n\n[Analysis Summary]:')[0];
        return JSON.parse(jsonPart);
      }
    } catch (e) {
      // Fallback
    }
    
    // Fallback static steps if not JSON formatted
    return [
      { agent: "Operations Orchestrator", step: "THOUGHT", content: `Evaluating incoming event: ${incident.description}`, time: incident.timestamp },
      { agent: "Operations Orchestrator", step: "OBSERVATION", content: `SOP protocols loaded for ${incident.category}.`, time: incident.timestamp },
      { agent: "Operations Orchestrator", step: "ACTION", content: `Recommend: ${incident.recommendation}`, time: incident.timestamp }
    ];
  };

  const getStepColor = (stepType: string) => {
    switch (stepType) {
      case 'THOUGHT': return 'text-slate-400 border-slate-700/60 bg-slate-900/40';
      case 'OBSERVATION': return 'text-cyan-400 border-cyan-500/20 bg-cyan-950/10';
      case 'ACTION': return 'text-fifa-gold border-fifa-gold/20 bg-fifa-gold/10';
      case 'OUTCOME': return 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10';
      default: return 'text-slate-300 border-slate-700 bg-slate-800/30';
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulateEvent(simType, simDesc, simLoc);
  };

  // Preset scenarios to make selection easy
  const handlePresetSelect = (preset: string) => {
    if (preset === 'crowd') {
      setSimType('CROWD_ALERT');
      setSimLoc('Gate B bypass corridor');
      setSimDesc('Crowd camera metadata indicates flow bottleneck; ingress queues exceed 320 people.');
    } else if (preset === 'security') {
      setSimType('SECURITY_BREACH');
      setSimLoc('Sector F under seating');
      setSimDesc('Thermal scanner alerts: Unidentified backpack left unattended in corridor F for 15 minutes.');
    } else if (preset === 'medical') {
      setSimType('MEDICAL_EMERGENCY');
      setSimLoc('Zone B concourse');
      setSimDesc('Mobile app distress: Fan reports potential cardiovascular arrest; immediate responder needed.');
    } else if (preset === 'eco') {
      setSimType('ECO_ANOMALY');
      setSimLoc('Retail Cluster C');
      setSimDesc('Grid metrics: Concessions sector C water main reporting water pressure pressure drop.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Simulation Trigger Panel (Left) */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-wide text-slate-100 mb-2 flex items-center gap-2">
            <Play className="h-5 w-5 text-emerald-500" />
            AI Sandbox Event Simulator
          </h3>
          <p className="text-xs text-slate-400">Inject synthetic CCTV & IoT events to trigger Multi-Agent cascades</p>
          <p className="text-[10px] text-slate-500 mb-4">Choose a scenario preset or type parameters manually to see the system ingest telemetry.</p>

          <div className="flex gap-1.5 mb-4">
            <button onClick={() => handlePresetSelect('crowd')} className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20 hover:bg-amber-500/20">CROWD</button>
            <button onClick={() => handlePresetSelect('security')} className="px-2.5 py-1 rounded bg-red-500/10 text-red-300 text-[10px] font-bold border border-red-500/20 hover:bg-red-500/20">SECURITY</button>
            <button onClick={() => handlePresetSelect('medical')} className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-bold border border-cyan-500/20 hover:bg-cyan-500/20">MEDICAL</button>
            <button onClick={() => handlePresetSelect('eco')} className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 text-[10px] font-bold border border-purple-500/20 hover:bg-purple-500/20">ECO</button>
          </div>

          <form onSubmit={handleSimulateSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Anomaly Type</label>
              <select 
                value={simType} 
                onChange={(e) => setSimType(e.target.value)}
                className="w-full rounded-lg glass-input p-2.5 text-xs text-slate-200"
              >
                <option value="CROWD_ALERT">CROWD_ALERT (Stampede & Congestion)</option>
                <option value="SECURITY_BREACH">SECURITY_BREACH (Threats & Suspicious Items)</option>
                <option value="MEDICAL_EMERGENCY">MEDICAL_EMERGENCY (AED dispatch & heat risk)</option>
                <option value="TRANSIT_DELAY">TRANSIT_DELAY (Transit overload)</option>
                <option value="ECO_ANOMALY">ECO_ANOMALY (Energy/Waste levels)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Spatial Location</label>
              <input 
                type="text" 
                value={simLoc} 
                onChange={(e) => setSimLoc(e.target.value)}
                className="w-full rounded-lg glass-input p-2.5 text-xs text-slate-200" 
                placeholder="e.g. Gate C East escalator"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Raw Telemetry Alert Description</label>
              <textarea 
                rows={3}
                value={simDesc} 
                onChange={(e) => setSimDesc(e.target.value)}
                className="w-full rounded-lg glass-input p-2.5 text-xs text-slate-200 resize-none" 
                placeholder="Describe the incident detail..."
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Inject Alert to Event Bus
            </button>
          </form>
        </div>

        <div className="border-t border-slate-800/80 mt-6 pt-4 text-[10px] text-slate-400 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-slate-500" />
          <span>Ingress: Kafka stream: <code>stadium.telemetry</code></span>
        </div>
      </div>

      {/* Incident Queue List (Center) */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col">
        <h3 className="text-lg font-bold tracking-wide text-slate-100 mb-2 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-fifa-gold" />
          Agent Execution Queue
        </h3>
        <p className="text-xs text-slate-400">Active operational alerts generated by autonomous sensors</p>
        <p className="text-[10px] text-slate-500 mb-4">Select an incident below to examine the active AI response plan, agent logic, and dispatch status.</p>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px]">
          {incidents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <ShieldCheck className="h-12 w-12 text-slate-700 mb-2" />
              <span className="text-xs">No active anomalies detected. Stadium operations green.</span>
            </div>
          ) : (
            incidents.map((inc) => {
              const isActive = activeIncident?.id === inc.id;
              
              return (
                <div 
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-800/60 border-fifa-gold/50 shadow-md' 
                      : 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      inc.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-slate-700/35 text-slate-300'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatTimeSafely(inc.timestamp)}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate mb-1">{inc.title}</h4>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">{inc.location}</span>
                    <span className={`font-semibold ${
                      inc.status === 'PENDING_APPROVAL' ? 'text-amber-400 text-glow-gold' :
                      inc.status === 'RESOLVED' ? 'text-slate-500' : 'text-emerald-400'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Deep Agent Reasoning Logs & HITL Approval (Right) */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
        {activeIncident ? (
          <div className="flex flex-col h-full justify-between">
            {/* Reasoning Trace */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-fifa-gold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Agent Reasoning Chain
                </span>
                <span className="text-[10px] text-slate-500">Confidence: {(activeIncident.confidence_score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-4 leading-normal">
                Inspect the agent's <strong>ReAct (Reasoning & Action)</strong> logs: 
                <span className="text-slate-500"> Thought &rarr; Observation &rarr; Proposed Action &rarr; Plan Outcome.</span>
              </p>

              {/* Steps container */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 mb-4">
                {getReasoningSteps(activeIncident).map((step, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border text-xs leading-relaxed ${getStepColor(step.step)}`}>
                    <div className="flex justify-between items-center mb-1 text-[9px] font-extrabold uppercase tracking-wide opacity-80">
                      <span>{step.agent} &bull; {step.step}</span>
                      <span>{formatTimeSafely(step.time)}</span>
                    </div>
                    <div>{step.content}</div>
                  </div>
                ))}
              </div>

              {/* RAG Explainable block */}
              {activeIncident.agent_explanation.includes('[Analysis Summary]:') && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-4 text-xs">
                  <div className="text-slate-400 font-semibold mb-1">Explainable AI Analysis</div>
                  <div className="text-slate-300 leading-relaxed">
                    {activeIncident.agent_explanation.split('[Analysis Summary]:')[1].trim()}
                  </div>
                </div>
              )}
            </div>

            {/* Human in the Loop Card */}
            <div>
              {activeIncident.status === 'PENDING_APPROVAL' ? (
                <div className="bg-gradient-to-br from-amber-500/10 to-red-500/5 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 text-amber-500 animate-pulse">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                    <ShieldAlert className="h-4 w-4" />
                    Pending Operations Director Signature
                  </h4>
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    <strong>Mitigation Plan:</strong> {activeIncident.recommendation}
                  </p>
                  {(() => {
                    const isAuthorized = 
                      activePersona === 'OPERATIONS' || 
                      activePersona === 'SECURITY' || 
                      (activePersona === 'ECO' && activeIncident.severity !== 'CRITICAL' && activeIncident.severity !== 'HIGH');
                    
                    return (
                      <>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => isAuthorized && onApproveIncident(activeIncident.id)}
                            disabled={!isAuthorized}
                            className={`flex-1 py-1.5 text-slate-950 text-xs font-extrabold rounded-lg transition-colors ${
                              isAuthorized 
                                ? 'bg-amber-500 hover:bg-amber-400 text-glow-gold' 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            Authorize Action
                          </button>
                          <button 
                            disabled={!isAuthorized} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                              isAuthorized 
                                ? 'bg-slate-850 hover:bg-slate-700 border-slate-700 text-slate-300' 
                                : 'border-slate-850 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            Decline
                          </button>
                        </div>
                        {!isAuthorized && (
                          <div className="text-[10px] text-red-400 mt-2 font-semibold bg-red-950/20 border border-red-900/30 rounded-lg p-2 leading-relaxed">
                            ⚠️ Signature Block Locked: Current role ({activePersona}) is unauthorized to sign off on {activeIncident.severity} severity incidents. Switch active workspace to Operations Director or Security Lead.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : activeIncident.status === 'EXECUTING' ? (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" />
                      Plan Executing
                    </div>
                    <div className="text-slate-400 text-[10px] mt-0.5">Approved by: {activeIncident.approved_by || 'System Auto'}</div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 font-bold">In Field</span>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                    Incident fully resolved
                  </div>
                  <span className="text-[10px] font-bold">ARCHIVED</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
            <Cpu className="h-10 w-10 text-slate-700 mb-2" />
            <span className="text-xs">Select an active incident from the queue to view reasoning steps.</span>
          </div>
        )}
      </div>
    </div>
  );
}
