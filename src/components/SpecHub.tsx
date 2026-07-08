import { useState } from 'react';
import { BookOpen, Database, Code, ShieldCheck, Cloud, FileText, ArrowRight } from 'lucide-react';

export default function SpecHub() {
  const [activeTab, setActiveTab] = useState<'ARCH' | 'DB_API' | 'AGENT_RAG' | 'SEC_GOV' | 'SCALE_OPS' | 'ROADMAP'>('ARCH');

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
      {/* SpecHub header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-fifa-gold" />
            System Blueprint & Spec Hub
          </h2>
          <p className="text-xs text-slate-400">Enterprise manuals, API specs, database models & GCP architecture guidelines</p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4">
        {[
          { id: 'ARCH', label: 'Architecture & Flows', icon: Cloud },
          { id: 'DB_API', label: 'Database & OpenAPI', icon: Database },
          { id: 'AGENT_RAG', label: 'Multi-Agent & RAG', icon: Code },
          { id: 'SEC_GOV', label: 'Security & Governance', icon: ShieldCheck },
          { id: 'SCALE_OPS', label: 'Scalability & Cloud', icon: FileText },
          { id: 'ROADMAP', label: 'UX & Roadmaps', icon: ArrowRight },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-fifa-gold text-slate-950 font-extrabold shadow-lg shadow-fifa-gold/20' 
                : 'bg-slate-900/40 text-slate-400 border border-slate-800/80 hover:text-slate-200'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
           {tab.label}
          </button>
        ))}
      </div>

      {/* Documentation Render Area */}
      <div className="flex-1 overflow-y-auto space-y-6 text-sm text-slate-300 pr-2 max-h-[500px]">
        {activeTab === 'ARCH' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">1. System Architecture (Enterprise Grid)</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                StadiumMind AI relies on a modular, asynchronous architecture designed for 99.99% availability. It uses an **API Gateway (GCP Cloud Armor + Apigee)** to route requests, an **Apache Kafka Event Bus** to stream real-time stadium metrics, and a **LangGraph state machine** to orchestrate autonomous agents.
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre">
{`+-----------------------------------------------------------------------------------+
|                            GCP Apigee API Gateway                                 |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
       +------------+------------+                   +------------+------------+
       |   FastAPI Service Layer |                   |   Kafka Ingress Gateway |
       | (Incident, Staff, SOPs) |                   |  (IoT, CCTV, Ticketing) |
       +------------+------------+                   +------------+------------+
                    |                                             |
                    | [WebSockets / HTTP]                         | [Stream Publish]
                    v                                             v
       +------------+------------+                   +------------+------------+
       | Redis Cache (WebSockets)|                   |   Apache Kafka Event Bus|
       | & Session State Manager |                   |  Topics: gates, telemetry|
       +-------------------------+                   +------------+------------+
                                                                  |
                                                                  v
                                                     +------------+------------+
                                                     | Event Processing Engine |
                                                     +------------+------------+
                                                                  | [Trigger Agent Node]
                                                                  v
                                                     +------------+------------+
                                                     | LangGraph Orchestrator  |
                                                     | (CrewAI specialization) |
                                                     +------------+------------+
                                                                  |
                                            +---------------------+---------------------+
                                            |                     |                     |
                                            v                     v                     v
                                      +-----+-----+         +-----+-----+         +-----+-----+
                                      |SecurityAg |         | CrowdAgent|         | MedicalAg |
                                      +-----------+         +-----------+         +-----------+`}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">2. Event Processing Architecture & Data Flows</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                Every sensor action (CCTV tracking box, ticket scanner queue, smart waste bin) emits an event to Kafka. The Event Processing Engine consolidates and filters events using sliding window analytics before escalating to the LangGraph Orchestrator.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                <li><strong>Ingestion:</strong> CCTV cameras analyze video feed on the edge and send metadata tags (e.g. <code>CCTV_CONGESTION</code>) to the Kafka <code>stadium.telemetry</code> topic.</li>
                <li><strong>State Evaluation:</strong> The Orchestrator polls the state and queries the vector database (PGVector) for relevant emergency SOP guides.</li>
                <li><strong>Human Check (HITL):</strong> If the incident is High Severity, a blocking token is written to Redis and a WebSocket update triggers a dashboard confirmation pop-up.</li>
                <li><strong>Dispatch Routing:</strong> On approval, the database updates the status to <code>EXECUTING</code> and sends an alert to the Volunteer/Staff dispatch terminal.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">3. Sequence Diagram (HITL Redistribution Action)</h3>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre">
{`IoT Sensors            Kafka Topic          OrchestratorAgent       OCC Dashboard       Volunteer App
    |                       |                       |                     |                   |
    |--[Congestion Event]-->|                       |                     |                   |
    |   Flow rate < 15/min  |--[Evaluate Alert]---->|                     |                   |
    |                       |                       |--[Check RAG SOP]    |                   |
    |                       |                       |--[Formulate Plan]-->|                   |
    |                       |                       |   Confidence: 94%   |--[Flashing Alert] |
    |                       |                       |   Status: Pending   |   "Approve Bypass"|
    |                       |                       |                     |                   |
    |                       |                       |<--[Manager Approve]-|                   |
    |                       |                       |   (Signature: COO)  |                   |
    |                       |                       |--[Status: Executing]------------------->|
    |                       |                       |                                         |--[Reroute Ingress]`}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'DB_API' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">1. PostgreSQL Database Schema</h3>
              <p className="text-xs text-slate-400 mb-3">Relational tables storing state indicators for incidents, security logs, and personnel listings.</p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto">
{`CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- CROWD, SECURITY, MEDICAL, TRANSPORT, ECO, GENERAL
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL', -- PENDING_APPROVAL, APPROVED, REJECTED, EXECUTING, RESOLVED
    confidence_score FLOAT DEFAULT 1.0,
    agent_explanation TEXT, -- ReAct Reasoning Log (JSON formatted)
    location VARCHAR(100) NOT NULL,
    recommendation TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP
);

CREATE TABLE gate_statuses (
    id SERIAL PRIMARY KEY,
    gate_name VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CLOSED, CONGESTED
    flow_rate INTEGER DEFAULT 0, -- people per minute
    current_queue_size INTEGER DEFAULT 0,
    stampede_risk_percentage FLOAT DEFAULT 0.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_volunteers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- SECURITY, MEDICAL, VOLUNTEER, OPERATIONS, ECO
    status VARCHAR(30) DEFAULT 'AVAILABLE', -- AVAILABLE, DISPATCHED, BREAK
    current_location VARCHAR(100) NOT NULL,
    assigned_incident_id INTEGER REFERENCES incidents(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">2. Vector Database Schema (PGVector)</h3>
              <p className="text-xs text-slate-400 mb-3">Indexes operational procedures and security guides for cosine similarity search (RAG Pipeline).</p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto">
{`-- Enable the PGVector extension in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE sop_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- SECURITY_SOP, CROWD_SOP, MEDICAL_SOP, ECO_SOP
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- 1536 dimensions matching Vertex AI text-embedding-004
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cosine index optimized for fast similarity search
CREATE INDEX sop_embedding_cosine_idx ON sop_documents 
USING hnsw (embedding vector_cosine_ops);`}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">3. OpenAPI API Specifications (JSON Snippet)</h3>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto max-h-[220px] overflow-y-auto">
{`{
  "openapi": "3.1.0",
  "info": {
    "title": "StadiumMind AI - Core API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/v1/incidents": {
      "get": {
        "summary": "Retrieve active and historical incidents",
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/IncidentResponse" }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/incidents/{incident_id}/approve": {
      "post": {
        "summary": "Approve incident action plan (Human-in-the-Loop signature)",
        "parameters": [
          {
            "name": "incident_id",
            "in": "path",
            "required": true,
            "schema": { "type": "integer" }
          },
          {
            "name": "manager_name",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": { "description": "Incident approved and dispatch executed" }
        }
      }
    }
  }
}`}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'AGENT_RAG' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">1. Multi-Agent Reasoning Flow</h3>
              <p className="text-xs text-slate-400 mb-3">Agents follow a structured ReAct (Reasoning & Action) pattern, checking internal SOP rules before emitting alerts.</p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre">
{`Raw IoT Alert ---> [Orchestrator Agent Node]
                         |
                         v (Retrieve Context)
                  [Query Vector SOP] 
                         |
                         v (Combine SOP + Metrics)
             +-----------+-----------+
             |   ReAct Loop Node     |
             |   - THOUGHT: Assess   |
             |   - ACTION: SOP match |
             |   - OUTCOME: Plan     |
             +-----------+-----------+
                         |
                         v (Severity Check)
                 Is Severity HIGH/CRITICAL?
                   /                    \\
               (Yes)                     (No)
                 /                        \\
     +-----------+-----------+    +-------+-------+
     | Write PENDING to Redis |    | Direct Status |
     | Fire WebSocket alert  |    |  "EXECUTING"  |
     | Wait for COO Sign-off  |    | Dispatch Unit |
     +-----------------------+    +---------------+`}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">2. Prompt Engineering Strategy & System Prompts</h3>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                Agents are structured using role-based contextual prompting. The LLM (Gemini 1.5 Pro) is configured at <strong>temperature = 0.2</strong> to avoid hallucinations.
              </p>
              
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-3">
                <div>
                  <div className="text-slate-400 font-bold mb-1"># Security Agent System Prompt</div>
                  <div className="text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800 max-h-[140px] overflow-y-auto">
{`You are the Senior Security Intelligence Agent for FIFA World Cup 2026 Stadium Operations.
Your objective is to identify potential physical threat vectors, coordinate cordons, and draft response actions.

CONTEXTUAL PROCEDURES:
{sop_context}

INPUT INCIDENT:
{incident_telemetry}

You must respond in structured JSON format representing your step-by-step reasoning cycle:
[
  {"step": "THOUGHT", "content": "Analyze the location of the threat and lookup proximity to seating corridors..."},
  {"step": "OBSERVATION", "content": "RAG SOP SEC-202 instructs to establish a 50m cordon..."},
  {"step": "ACTION", "content": "Dispatch nearest Security Officers and lock gates in sector..."},
  {"step": "OUTCOME", "content": "Deploy Cordon Plan F. Severity: HIGH. HITL verification required."}
]`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SEC_GOV' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">1. Security Architecture & Network Boundaries</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                StadiumMind AI adheres to a Zero Trust Network Architecture. All backend microservices run in private VPC networks behind **GCP Cloud Armor** (anti-DDoS) and **Identity-Aware Proxy (IAP)** to guarantee isolation from the stadium's public WiFi grids.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Public Access (Fan App):</strong> Encrypted HTTPS/WSS routed via Cloud Armor with strict rate-limiting (max 60 queries/min/IP).</li>
                <li><strong>Internal Operations (OCC Dashboards):</strong> Accessible only via corporate VPN protected by Google Workspace OAuth 2.0 with Hardware FIDO2 keys required.</li>
                <li><strong>IoT Telemetry Feeds:</strong> MQTT/Kafka bridges authenticate using mutual TLS (mTLS) with dedicated hardware certificates on sensors.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">2. Role-Based Access Control (RBAC)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2 border-b border-slate-800">Role</th>
                      <th className="p-2 border-b border-slate-800">Dashboard View</th>
                      <th className="p-2 border-b border-slate-800">Trigger Alert</th>
                      <th className="p-2 border-b border-slate-800">Approve HITL Action</th>
                      <th className="p-2 border-b border-slate-800">Edit SOP RAG DB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
                    <tr>
                      <td className="p-2 font-bold text-slate-200">Operations Director (COO)</td>
                      <td className="p-2 text-emerald-400">Full Access</td>
                      <td className="p-2 text-emerald-400">Yes</td>
                      <td className="p-2 text-emerald-400">Yes (All)</td>
                      <td className="p-2 text-emerald-400">Yes</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-200">Security / Medical Lead</td>
                      <td className="p-2 text-emerald-400">Domain Only</td>
                      <td className="p-2 text-emerald-400">Yes</td>
                      <td className="p-2 text-emerald-400">Yes (Domain Only)</td>
                      <td className="p-2 text-red-400">No</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-200">Volunteer / Staff</td>
                      <td className="p-2 text-emerald-400">Mobile Task Only</td>
                      <td className="p-2 text-red-400">No</td>
                      <td className="p-2 text-red-400">No</td>
                      <td className="p-2 text-red-400">No</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">3. Responsible AI & Governance Framework</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                We establish guardrails to prevent algorithmic bias, decision loops, and hallucinated operations.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong>No Autonomous Physical Action:</strong> No agent can activate physical locks, public announcement speakers, or emergency sirens directly. The system proposes; Humans approve.</li>
                <li><strong>PII Redaction:</strong> CCTV stream processors strip facial identities, converting feeds to box bounding-box metadata before sending coordinates to the LLM agent.</li>
                <li><strong>Log Auditing:</strong> Every recommendation, including prompt payloads and the manager's approval signature, is archived in a read-only PostgreSQL table for audit compliance.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'SCALE_OPS' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">1. Cloud Architecture & Scalability Plan (5+ Million Users)</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                To coordinate multiple matches across North America during the 2026 World Cup, StadiumMind AI scales horizontally using GCP Serverless structures.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Global API Ingress:</strong> Deploy FastAPI containers across **GCP Cloud Run** instances globally. Cloud Run auto-scales from 0 to 1,000 instances in response to ingress bursts.</li>
                <li><strong>Data Pipelines:</strong> Telemetry streams flow through **Cloud Pub/Sub** to **BigQuery** for long-term predictive models, while Redis handles volatile WebSocket states.</li>
                <li><strong>CDN Caching:</strong> Static fan recommendations, stadium layouts, and map layers are cached globally on Cloud CDN edges, reducing load by 80%.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">2. Disaster Recovery Plan (RTO / RPO)</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-fifa-gold mb-1">Recovery Time Objective (RTO)</div>
                  <div className="text-xl font-black text-slate-100">&lt; 30 Seconds</div>
                  <p className="text-[10px] text-slate-400 mt-1">Automatic traffic failover to secondary cloud region (Multi-region active-active deployment).</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-fifa-gold mb-1">Recovery Point Objective (RPO)</div>
                  <div className="text-xl font-black text-slate-100">&lt; 5 Seconds</div>
                  <p className="text-[10px] text-slate-400 mt-1">Transaction streaming logs backed up continuously to Cloud Storage archive zones.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">3. Monthly Cost Optimization Forecast</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-800 rounded-xl text-left overflow-hidden">
                  <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="p-2 border-b border-slate-800">Service Area</th>
                      <th className="p-2 border-b border-slate-800">GCP Resource</th>
                      <th className="p-2 border-b border-slate-800">Scale Metrics (Peak)</th>
                      <th className="p-2 border-b border-slate-800">Est. Cost (Per Month)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
                    <tr>
                      <td className="p-2 font-bold text-slate-200">API & Web Layer</td>
                      <td className="p-2">Cloud Run + Cloud Load Balancing</td>
                      <td className="p-2">12 Billion Requests</td>
                      <td className="p-2 text-slate-200">$4,200</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-200">Event Stream</td>
                      <td className="p-2">Cloud Pub/Sub (Managed Kafka)</td>
                      <td className="p-2">250 TB processed</td>
                      <td className="p-2 text-slate-200">$5,800</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-200">AI Core</td>
                      <td className="p-2">Vertex AI (Gemini 1.5 Flash batch)</td>
                      <td className="p-2">150 Million Tokens</td>
                      <td className="p-2 text-slate-200">$8,500</td>
                    </tr>
                    <tr className="bg-slate-900/40">
                      <td className="p-2 font-bold text-slate-200" colSpan={3}>Total Operational Budget</td>
                      <td className="p-2 font-black text-fifa-gold">$18,500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ROADMAP' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">1. UX Wireframe & Persona Roles</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                StadiumMind AI alters its dashboard skin based on target roles. You can toggle these using the top role switcher:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                <li><strong>Mobile Fan App:</strong> Focuses on navigation paths, ticket QR loading, emergency reporting, and localized food truck recommendations.</li>
                <li><strong>Security Dashboard:</strong> Filters map layers for suspicious packages, active cordons, camera metadata feeds, and police dispatch rosters.</li>
                <li><strong>Medical Interface:</strong> Displays closest AEDs, field paramedic availability status, and transit corridor clearance commands.</li>
                <li><strong>Eco/Sustainability Control:</strong> Renders power graphs, trash accumulation heatmaps, and carbon offsets reports.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1">2. Hackathon MVP vs. Enterprise Platform Roadmap</h3>
              <div className="space-y-3 text-xs">
                <div className="border border-slate-800/80 rounded-xl p-3.5 bg-slate-900/40">
                  <div className="font-bold text-emerald-400 uppercase tracking-wide text-[10px] mb-1">Phase 1: Hackathon MVP (Current Stage)</div>
                  <p className="text-slate-300 leading-relaxed">
                    Build core API routes, seed default configurations, construct the Digital Twin simulator, model the multi-agent logic, and verify local compilation.
                  </p>
                </div>
                <div className="border border-slate-800/80 rounded-xl p-3.5 bg-slate-900/40">
                  <div className="font-bold text-fifa-gold uppercase tracking-wide text-[10px] mb-1">Phase 2: Live Trials & Integrations (Q4 2025)</div>
                  <p className="text-slate-300 leading-relaxed">
                    Integrate live Mapbox GL feeds, establish connection lines to stadium security CCTV cameras, connect local databases, and test telemetry latency.
                  </p>
                </div>
                <div className="border border-slate-800/80 rounded-xl p-3.5 bg-slate-900/40">
                  <div className="font-bold text-slate-400 uppercase tracking-wide text-[10px] mb-1">Phase 3: Multi-Stadium Rollout (Q2 2026)</div>
                  <p className="text-slate-300 leading-relaxed">
                    Deploy active-active clusters across the 16 Host Cities, certify accessibility features, verify failovers, and transition control to FIFA operations staff.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
