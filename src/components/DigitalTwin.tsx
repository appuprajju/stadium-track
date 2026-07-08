import { useState } from 'react';
import { Gate, Incident } from '../types';
import { Info, Users, ShieldAlert, HeartPulse, Activity, Bus, Trash2 } from 'lucide-react';

interface DigitalTwinProps {
  gates: Gate[];
  incidents: Incident[];
  selectedIncidentId?: number | null;
  onGateSelect?: (gateName: string) => void;
  onIncidentSelect?: (incident: Incident) => void;
}

export default function DigitalTwin({ gates, incidents, selectedIncidentId, onIncidentSelect }: DigitalTwinProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showAeds, setShowAeds] = useState(true);
  const [showPower, setShowPower] = useState(false);

  // Coordinate mappings for Gates
  const gateCoords: Record<string, { x: number; y: number; zone: string }> = {
    "Gate A": { x: 400, y: 70, zone: "North Zone" },
    "Gate B": { x: 580, y: 180, zone: "East Zone" },
    "Gate C": { x: 500, y: 430, zone: "South-East Zone" },
    "Gate D": { x: 280, y: 420, zone: "South-West Zone" },
    "Gate E": { x: 220, y: 190, zone: "West Zone" }
  };

  // AED Mock Locations (X, Y coordinates on map)
  const aedLocations = [
    { id: 1, name: "AED Concourse A1", x: 380, y: 110 },
    { id: 2, name: "AED Concourse B2", x: 520, y: 220 },
    { id: 3, name: "AED Concourse C3", x: 460, y: 390 },
    { id: 4, name: "AED Concourse D4", x: 320, y: 380 },
    { id: 5, name: "AED Concourse E5", x: 260, y: 220 }
  ];

  // Grid Power node overlays
  const powerNodes = [
    { id: 1, name: "Transformer Grid 1", x: 400, y: 30, load: "Normal" },
    { id: 2, name: "Substation East", x: 620, y: 250, load: "Peak (Suite Strain)" },
    { id: 3, name: "Substation West", x: 180, y: 250, load: "Normal" }
  ];

  // Get color for gate status
  const getGateColor = (gateName: string) => {
    const gate = gates.find(g => g.gate_name === gateName);
    if (!gate) return 'stroke-slate-500 fill-slate-500/20';
    if (gate.status === 'CONGESTED') return 'stroke-red-500 fill-red-500/30';
    if (gate.current_queue_size > 200) return 'stroke-amber-500 fill-amber-500/30';
    return 'stroke-emerald-500 fill-emerald-500/30';
  };

  // Map category to SVG colors
  const getIncidentMarker = (category: string) => {
    switch (category) {
      case 'SECURITY': return { color: 'text-red-500', fill: '#ef4444', icon: ShieldAlert };
      case 'MEDICAL': return { color: 'text-cyan-400', fill: '#22d3ee', icon: HeartPulse };
      case 'CROWD': return { color: 'text-amber-500', fill: '#f59e0b', icon: Users };
      case 'TRANSPORT': return { color: 'text-amber-400', fill: '#fbbf24', icon: Bus };
      case 'ECO': return { color: 'text-emerald-400', fill: '#34d399', icon: Trash2 };
      default: return { color: 'text-purple-500', fill: '#a855f7', icon: Info };
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-fifa-gold" />
            Digital Twin Stadium Simulator
          </h2>
          <p className="text-xs text-slate-400">Real-time spatial projection of sensors, gates & active logs</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button 
            onClick={() => setShowAeds(!showAeds)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              showAeds 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            AED Units
          </button>
          <button 
            onClick={() => setShowPower(!showPower)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              showPower 
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            Power Nodes
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 bg-slate-950/40 rounded-xl border border-slate-800/80 map-bg-grid flex items-center justify-center p-4" style={{ minHeight: '380px' }}>
        <svg viewBox="0 0 800 500" className="w-full h-full max-h-[440px]">
          <defs>
            {/* Glow filters */}
            <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Ring / Boundary */}
          <ellipse cx="400" cy="250" rx="350" ry="220" className="stroke-slate-800 fill-none stroke-[2] stroke-dasharray-[10,5]" />

          {/* Stadium Structure outer envelope */}
          <path d="M 180,250 C 180,100 620,100 620,250 C 620,400 180,400 180,250 Z" 
                className="stroke-slate-700/60 fill-[#0f172a]/30 stroke-[3]" />

          {/* Seating Tiers */}
          <path d="M 230,250 C 230,130 570,130 570,250 C 570,370 230,370 230,250 Z" 
                className="stroke-slate-800 fill-none stroke-[12]" />
          
          <path d="M 270,250 C 270,160 530,160 530,250 C 530,340 270,340 270,250 Z" 
                className="stroke-slate-800/80 fill-none stroke-[8]" />

          {/* Central Pitch (Green Glow) */}
          <rect x="330" y="190" width="140" height="120" rx="6" 
                className="fill-emerald-950/20 stroke-emerald-500/40 stroke-[2]" filter="url(#glow-cyan)" />
          {/* Pitch center mark */}
          <circle cx="400" cy="250" r="25" className="stroke-emerald-500/20 fill-none" />

          {/* SECTORS / ZONE SHAPES - Interactive */}
          {/* Zone North */}
          <path d="M 230,250 C 230,130 570,130 570,250 L 530,250 C 530,160 270,160 270,250 Z" 
                className={`transition-colors cursor-pointer ${
                  selectedZone === 'North' ? 'fill-fifa-gold/20 stroke-fifa-gold/60' : 'fill-slate-800/10 hover:fill-slate-700/25 stroke-transparent'
                }`}
                onClick={() => setSelectedZone(selectedZone === 'North' ? null : 'North')}
          />

          {/* Gate status lines & text */}
          {Object.entries(gateCoords).map(([name, coords]) => {
            const gate = gates.find(g => g.gate_name === name);
            const size = gate ? Math.min(22, 10 + gate.current_queue_size / 20) : 12;
            
            return (
              <g key={name} className="cursor-pointer group">
                {/* Connection Line */}
                <line x1="400" y1="250" x2={coords.x} y2={coords.y} 
                      className={`stroke-[1.5] stroke-dasharray-[4,4] ${
                        gate?.status === 'CONGESTED' ? 'stroke-red-500/50' : 'stroke-slate-600/30'
                      }`} 
                />

                {/* Gate Sensor circle */}
                <circle 
                  cx={coords.x} 
                  cy={coords.y} 
                  r={size} 
                  className={`stroke-[2.5] transition-all duration-500 ${getGateColor(name)}`} 
                />
                
                {/* Stampede Risk Ring */}
                {gate && gate.stampede_risk_percentage > 15 && (
                  <circle 
                    cx={coords.x} 
                    cy={coords.y} 
                    r={size + 6} 
                    className="stroke-red-500 fill-none stroke-[1] animate-ping"
                  />
                )}

                {/* Label Overlay */}
                <rect 
                  x={coords.x - 30} 
                  y={coords.y - size - 22} 
                  width="60" 
                  height="16" 
                  rx="4" 
                  className="fill-slate-900/90 stroke-slate-800 stroke-[1] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                />
                <text 
                  x={coords.x} 
                  y={coords.y - size - 10} 
                  textAnchor="middle" 
                  className="fill-slate-200 font-bold text-[9px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  {name} ({gate?.current_queue_size || 0} Q)
                </text>

                {/* Always visible brief label */}
                <text 
                  x={coords.x} 
                  y={coords.y + 4} 
                  textAnchor="middle" 
                  className="fill-slate-300 font-semibold text-[8px] pointer-events-none"
                >
                  {name.split(' ')[1]}
                </text>
              </g>
            );
          })}

          {/* AED Checkpoint Overlays */}
          {showAeds && aedLocations.map(aed => (
            <g key={aed.id} className="radar-glow">
              <circle cx={aed.x} cy={aed.y} r="4.5" className="fill-cyan-400 stroke-slate-950 stroke-[1]" filter="url(#glow-cyan)" />
              {/* Pulse */}
              <circle cx={aed.x} cy={aed.y} r="8" className="fill-none stroke-cyan-400/40 stroke-[1] animate-ping" />
            </g>
          ))}

          {/* Energy Grid Overlays */}
          {showPower && powerNodes.map(node => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r="5" className="fill-purple-400 stroke-slate-950 stroke-[1]" />
              <circle cx={node.x} cy={node.y} r="10" className="fill-none stroke-purple-400/30 stroke-[1] animate-pulse" />
              <text x={node.x + 8} y={node.y + 3} className="fill-purple-300 text-[8px] font-medium">{node.name}</text>
            </g>
          ))}

          {/* Incident Overlay Marks */}
          {incidents.filter(inc => inc.status !== 'RESOLVED').map(inc => {
            // Coordinate mappings for Locations/Zones
            const locationCoords: Record<string, { x: number; y: number }> = {
              "Gate A": { x: 400, y: 70 },
              "Gate B": { x: 580, y: 180 },
              "Gate C": { x: 500, y: 430 },
              "Gate D": { x: 280, y: 420 },
              "Gate E": { x: 220, y: 190 },
              "Sector F": { x: 490, y: 110 },
              "Sector B": { x: 510, y: 310 },
              "Zone B": { x: 510, y: 310 },
              "Sector C": { x: 400, y: 440 },
              "Retail Cluster C": { x: 400, y: 440 },
              "Sector D": { x: 290, y: 310 },
              "Sector A": { x: 310, y: 110 },
              "Main Bowl": { x: 400, y: 250 }
            };

            // Resolve coordinates
            let pos = { x: 400, y: 250 };
            const matchedLocation = Object.keys(locationCoords).find(key => 
              inc.location.toLowerCase().includes(key.toLowerCase())
            );
            if (matchedLocation) {
              pos = { ...locationCoords[matchedLocation] };
            }
            
            // Jitter coordinates deterministically to prevent overlapping pins from blocking each other
            const angle = (inc.id * 137.5) % 360; // Golden ratio angle dispersion
            const radius = 15; // 15px radius dispersion offset
            const rad = (angle * Math.PI) / 180;
            pos.x += Math.cos(rad) * radius;
            pos.y += Math.sin(rad) * radius;
            
            const marker = getIncidentMarker(inc.category);
            
            const isSelected = selectedIncidentId === inc.id;
            return (
              <g key={inc.id} className="cursor-pointer" onClick={() => onIncidentSelect && onIncidentSelect(inc)}>
                {/* Selected highlight border ring */}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y + 12} r="24" className="fill-none stroke-[#c5a059] stroke-[2.5] animate-pulse" filter="url(#glow-gold)" />
                )}
                {/* Hazard ring */}
                <circle cx={pos.x} cy={pos.y + 12} r="18" className={`fill-none stroke-[2] ${isSelected ? 'stroke-[#c5a059]' : 'stroke-red-500/40 animate-ping'}`} />
                <path 
                  d={`M ${pos.x} ${pos.y + 4} L ${pos.x - 8} ${pos.y + 18} L ${pos.x + 8} ${pos.y + 18} Z`}
                  fill={isSelected ? '#c5a059' : marker.fill}
                  className={`stroke-slate-950 stroke-[1] transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}
                />
                <circle cx={pos.x} cy={pos.y + 14} r="2.5" className="fill-slate-950" />
                <line x1={pos.x} y1={pos.y + 8} x2={pos.x} y2={pos.y + 12} className="stroke-slate-950 stroke-[1.5]" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info panel footer */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Peak Congestion</div>
          <div className="text-lg font-bold text-red-400 text-glow-red">
            {gates.some(g => g.status === 'CONGESTED') ? 'Gate C Critical' : 'Moderate'}
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">AED Ready Units</div>
          <div className="text-lg font-bold text-cyan-400 text-glow-cyan">{showAeds ? '5 Active' : 'Hidden'}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Active Incidents</div>
          <div className="text-lg font-bold text-slate-100">
            {incidents.filter(i => i.status !== 'RESOLVED').length} Active
          </div>
        </div>
      </div>
    </div>
  );
}
