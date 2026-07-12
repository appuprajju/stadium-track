import { useState } from 'react';
import { Gate, Incident } from '../types';
import { Info, Users, ShieldAlert, HeartPulse, Activity, Bus, Trash2 } from 'lucide-react';
import { riskScore, etaMinutes } from '../utils/metrics';

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
  const [showGates, setShowGates] = useState(true);
  const [showSecurity, setShowSecurity] = useState(true);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showTransport, setShowTransport] = useState(false);
  const [showSustainability, setShowSustainability] = useState(false);
  const [selectedGateName, setSelectedGateName] = useState<string | null>(null);

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

  const securityPosts = [
    { id: 1, name: "Security Post North", x: 400, y: 110 },
    { id: 2, name: "Security Post East", x: 550, y: 250 },
    { id: 3, name: "Security Post South", x: 400, y: 390 },
    { id: 4, name: "Security Post West", x: 250, y: 250 }
  ];

  const transportHubs = [
    { id: 1, name: "Metro Station North", x: 400, y: 15, type: "🚆" },
    { id: 2, name: "Bus Depot East", x: 670, y: 250, type: "🚌" },
    { id: 3, name: "Rideshare South", x: 400, y: 485, type: "🚕" },
    { id: 4, name: "Parking Lot West", x: 130, y: 250, type: "🅿️" }
  ];

  const sustainStations = [
    { id: 1, name: "Waste Hub Sector C", x: 480, y: 370 },
    { id: 2, name: "Compost Zone Sector G", x: 320, y: 370 }
  ];

  const accessRoutes = [
    { id: 1, name: "Accessible Lift A", x: 310, y: 160 },
    { id: 2, name: "Accessible Ramp B", x: 490, y: 160 }
  ];

  const getZoneDensity = (zone: string): number => {
    if (zone === 'North Zone') return Math.min(100, Math.round((gates.find(g => g.gate_name === 'Gate A')?.current_queue_size || 120) / 3));
    if (zone === 'East Zone') return Math.min(100, Math.round((gates.find(g => g.gate_name === 'Gate B')?.current_queue_size || 180) / 3));
    if (zone === 'South Zone') {
      const qC = gates.find(g => g.gate_name === 'Gate C')?.current_queue_size || 280;
      const qD = gates.find(g => g.gate_name === 'Gate D')?.current_queue_size || 90;
      return Math.min(100, Math.round((qC + qD) / 6));
    }
    if (zone === 'West Zone') return Math.min(100, Math.round((gates.find(g => g.gate_name === 'Gate E')?.current_queue_size || 60) / 3));
    return 30;
  };

  const getZoneColor = (zone: string, isSelected: boolean): string => {
    if (isSelected) return 'rgba(197, 160, 89, 0.35)';
    const dens = getZoneDensity(zone);
    if (dens < 45) return 'rgba(16, 185, 129, 0.12)';
    if (dens < 70) return 'rgba(245, 158, 11, 0.12)';
    return 'rgba(239, 68, 68, 0.16)';
  };

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
        <div className="flex flex-wrap gap-1.5 max-w-[60%] justify-end text-[10px]">
          <button 
            onClick={() => setShowGates(!showGates)}
            className={`px-2 py-0.5 rounded-md border font-bold transition-all ${
              showGates ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            Gates
          </button>
          <button 
            onClick={() => setShowSecurity(!showSecurity)}
            className={`px-2. py-0.5 rounded-md border font-bold transition-all ${
              showSecurity ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            Security
          </button>
          <button 
            onClick={() => setShowAccessibility(!showAccessibility)}
            className={`px-2 py-0.5 rounded-md border font-bold transition-all ${
              showAccessibility ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            Accessibility
          </button>
          <button 
            onClick={() => setShowTransport(!showTransport)}
            className={`px-2 py-0.5 rounded-md border font-bold transition-all ${
              showTransport ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            Transport
          </button>
          <button 
            onClick={() => setShowSustainability(!showSustainability)}
            className={`px-2 py-0.5 rounded-md border font-bold transition-all ${
              showSustainability ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            Eco
          </button>
          <button 
            onClick={() => setShowAeds(!showAeds)}
            className={`px-2 py-0.5 rounded-md border font-bold transition-all ${
              showAeds ? 'bg-teal-500/10 border-teal-500/40 text-teal-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            AEDs
          </button>
          <button 
            onClick={() => setShowPower(!showPower)}
            className={`px-2 py-0.5 rounded-md border font-bold transition-all ${
              showPower ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            Power Grid
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 bg-slate-950/40 rounded-xl border border-slate-800/80 map-bg-grid flex items-center justify-center p-4" style={{ minHeight: '380px' }}>
        <svg role="img" aria-label="Digital twin layout of the stadium and its sensor points" viewBox="0 0 800 500" className="w-full h-full max-h-[440px]">
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
          {/* North Zone */}
          <path d="M 330,160 C 370,140 430,140 470,160 L 480,105 C 430,85 370,85 320,105 Z" 
                className="transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-fifa-gold"
                role="button"
                tabIndex={0}
                aria-label="Select North Zone Seating Tier"
                style={{ fill: getZoneColor('North Zone', selectedZone === 'North Zone'), stroke: selectedZone === 'North Zone' ? '#c5a059' : 'rgba(255,255,255,0.08)', strokeWidth: selectedZone === 'North Zone' ? 2 : 1 }}
                onClick={() => { setSelectedZone(selectedZone === 'North Zone' ? null : 'North Zone'); setSelectedGateName(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedZone(selectedZone === 'North Zone' ? null : 'North Zone'); setSelectedGateName(null); } }}
          />
          {/* East Zone */}
          <path d="M 530,200 C 560,220 560,280 530,300 L 590,320 C 630,280 630,220 590,180 Z" 
                className="transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-fifa-gold"
                role="button"
                tabIndex={0}
                aria-label="Select East Zone Seating Tier"
                style={{ fill: getZoneColor('East Zone', selectedZone === 'East Zone'), stroke: selectedZone === 'East Zone' ? '#c5a059' : 'rgba(255,255,255,0.08)', strokeWidth: selectedZone === 'East Zone' ? 2 : 1 }}
                onClick={() => { setSelectedZone(selectedZone === 'East Zone' ? null : 'East Zone'); setSelectedGateName(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedZone(selectedZone === 'East Zone' ? null : 'East Zone'); setSelectedGateName(null); } }}
          />
          {/* South Zone */}
          <path d="M 330,340 C 370,360 430,360 470,340 L 480,395 C 430,415 370,415 320,395 Z" 
                className="transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-fifa-gold"
                role="button"
                tabIndex={0}
                aria-label="Select South Zone Seating Tier"
                style={{ fill: getZoneColor('South Zone', selectedZone === 'South Zone'), stroke: selectedZone === 'South Zone' ? '#c5a059' : 'rgba(255,255,255,0.08)', strokeWidth: selectedZone === 'South Zone' ? 2 : 1 }}
                onClick={() => { setSelectedZone(selectedZone === 'South Zone' ? null : 'South Zone'); setSelectedGateName(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedZone(selectedZone === 'South Zone' ? null : 'South Zone'); setSelectedGateName(null); } }}
          />
          {/* West Zone */}
          <path d="M 270,200 C 240,220 240,280 270,300 L 210,320 C 170,280 170,220 210,180 Z" 
                className="transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-fifa-gold"
                role="button"
                tabIndex={0}
                aria-label="Select West Zone Seating Tier"
                style={{ fill: getZoneColor('West Zone', selectedZone === 'West Zone'), stroke: selectedZone === 'West Zone' ? '#c5a059' : 'rgba(255,255,255,0.08)', strokeWidth: selectedZone === 'West Zone' ? 2 : 1 }}
                onClick={() => { setSelectedZone(selectedZone === 'West Zone' ? null : 'West Zone'); setSelectedGateName(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedZone(selectedZone === 'West Zone' ? null : 'West Zone'); setSelectedGateName(null); } }}
          />

          {/* Gate status lines & text */}
          {/* Gate status lines & text */}
          {showGates && Object.entries(gateCoords).map(([name, coords]) => {
            const gate = gates.find(g => g.gate_name === name);
            const size = gate ? Math.min(22, 10 + gate.current_queue_size / 20) : 12;
            const isGateSelected = selectedGateName === name;
            
            return (
              <g 
                key={name} 
                className="cursor-pointer group focus:outline-none" 
                role="button"
                tabIndex={0}
                aria-label={`Select ${name} sensor metrics`}
                onClick={() => { setSelectedGateName(isGateSelected ? null : name); setSelectedZone(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedGateName(isGateSelected ? null : name); setSelectedZone(null); } }}
              >
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
                  className={`stroke-[2.5] transition-all duration-500 ${isGateSelected ? 'stroke-[#c5a059] fill-[#c5a059]/10' : getGateColor(name)}`} 
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

          {/* Security sentinels */}
          {showSecurity && securityPosts.map(post => (
            <g key={post.id} className="cursor-help group">
              <circle cx={post.x} cy={post.y} r="8" className="fill-red-950/40 stroke-red-500/60 stroke-[1]" />
              <text x={post.x} y={post.y + 3} textAnchor="middle" className="text-[9px] pointer-events-none select-none">🛡️</text>
              <rect x={post.x - 45} y={post.y - 24} width="90" height="14" rx="3" className="fill-slate-950/95 stroke-slate-800 stroke-[1] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <text x={post.x} y={post.y - 14} textAnchor="middle" className="fill-slate-300 font-bold text-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{post.name}</text>
            </g>
          ))}

          {/* Accessibility routes */}
          {showAccessibility && accessRoutes.map(route => (
            <g key={route.id} className="cursor-help group">
              <circle cx={route.x} cy={route.y} r="8" className="fill-cyan-950/40 stroke-cyan-500/60 stroke-[1]" />
              <text x={route.x} y={route.y + 3} textAnchor="middle" className="text-[9px] pointer-events-none select-none">♿</text>
              <rect x={route.x - 45} y={route.y - 24} width="90" height="14" rx="3" className="fill-slate-950/95 stroke-slate-800 stroke-[1] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <text x={route.x} y={route.y - 14} textAnchor="middle" className="fill-slate-300 font-bold text-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{route.name}</text>
            </g>
          ))}

          {/* Transport hubs */}
          {showTransport && transportHubs.map(hub => (
            <g key={hub.id} className="cursor-help group">
              <circle cx={hub.x} cy={hub.y} r="10" className="fill-blue-950/40 stroke-blue-500/60 stroke-[1.5]" />
              <text x={hub.x} y={hub.y + 3.5} textAnchor="middle" className="text-[10px] pointer-events-none select-none">{hub.type}</text>
              <rect x={hub.x - 50} y={hub.y - 26} width="100" height="14" rx="3" className="fill-slate-950/95 stroke-slate-800 stroke-[1] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <text x={hub.x} y={hub.y - 16} textAnchor="middle" className="fill-slate-300 font-bold text-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{hub.name}</text>
            </g>
          ))}

          {/* Sustainability stations */}
          {showSustainability && sustainStations.map(stn => (
            <g key={stn.id} className="cursor-help group">
              <circle cx={stn.x} cy={stn.y} r="8" className="fill-purple-950/40 stroke-purple-500/60 stroke-[1]" />
              <text x={stn.x} y={stn.y + 3} textAnchor="middle" className="text-[9px] pointer-events-none select-none">♻️</text>
              <rect x={stn.x - 50} y={stn.y - 24} width="100" height="14" rx="3" className="fill-slate-950/95 stroke-slate-800 stroke-[1] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <text x={stn.x} y={stn.y - 14} textAnchor="middle" className="fill-slate-300 font-bold text-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{stn.name}</text>
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
              <g 
                key={inc.id} 
                className="cursor-pointer focus:outline-none" 
                role="button"
                tabIndex={0}
                aria-label={`Select active incident: ${inc.title} at ${inc.location}`}
                onClick={() => onIncidentSelect && onIncidentSelect(inc)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onIncidentSelect && onIncidentSelect(inc); } }}
              >
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

        {/* Floating Map Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-950/95 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-400 space-y-2 pointer-events-none backdrop-blur-md shadow-2xl">
          <div className="font-extrabold text-slate-200 uppercase tracking-wider text-[8px] border-b border-slate-900 pb-1 mb-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]"></span>
            Map Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-400/30"></span>
            <span>Normal Gates (Flowing wait times &lt; 5m)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-400/30"></span>
            <span>Busy Gates (Flowing wait times &gt; 15m)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-red-400/30"></span>
            <span>Congested Gates / Active Incidents</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>AED Emergency Defibrillators</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500/80 border border-purple-400/30"></span>
            <span>Power Grid Substations</span>
          </div>
        </div>
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

      {/* Dynamic Selected Gate Metrics Card */}
      {selectedGateName && (() => {
        const gate = gates.find(g => g.gate_name === selectedGateName);
        const queueSize = gate?.current_queue_size || 50;
        const flowRate = gate?.flow_rate || 15;
        const score = riskScore(Math.min(100, queueSize / 4), flowRate, 300);
        const walkTime = etaMinutes(180, queueSize / 500);
        return (
          <div className="mt-3 bg-slate-900/90 border border-[#c5a059]/40 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between gap-3 items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl animate-pulse">🚧</span>
              <div>
                <div className="text-[11px] font-bold text-[#c5a059] uppercase tracking-wider">{selectedGateName} Operational Metrics</div>
                <div className="text-[10px] text-slate-400">Wait Queue: <strong className="text-slate-200">{queueSize}</strong> fans · Flow Rate: <strong className="text-slate-200">{flowRate}/min</strong></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-semibold">Composite Risk</span>
                <span className={`text-sm font-bold ${score > 70 ? 'text-red-400' : score > 45 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {score}/100 ({score > 70 ? 'CRITICAL' : score > 45 ? 'BUSY' : 'LOW'})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-semibold">Walk Time ETA</span>
                <span className="text-sm font-bold text-cyan-400">{walkTime} min</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dynamic Selected Zone Metrics Card */}
      {selectedZone && (() => {
        const dens = getZoneDensity(selectedZone);
        const score = riskScore(dens, dens * 2.2, 300);
        const walkTime = etaMinutes(200, dens / 100);
        return (
          <div className="mt-3 bg-slate-900/90 border border-[#c5a059]/40 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between gap-3 items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl animate-pulse">🏟️</span>
              <div>
                <div className="text-[11px] font-bold text-[#c5a059] uppercase tracking-wider">{selectedZone} Seating Tier Analytics</div>
                <div className="text-[10px] text-slate-400">Estimated Density: <strong className="text-slate-200">{dens}%</strong> Capacity &bull; Safety Status: <strong className={dens > 70 ? 'text-red-400' : 'text-emerald-400'}>{dens > 70 ? 'CROWD CONGESTION' : 'COMFORTABLE'}</strong></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-semibold">Zone Risk Index</span>
                <span className={`text-sm font-bold ${score > 70 ? 'text-red-400' : score > 45 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {score}/100 ({score > 70 ? 'CRITICAL' : score > 45 ? 'ELEVATED' : 'LOW'})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-semibold">Cross-Concourse ETA</span>
                <span className="text-sm font-bold text-cyan-400">{walkTime} min</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
