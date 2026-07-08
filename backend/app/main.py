import asyncio
import logging
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.config import settings
from app.database.connection import engine, Base, get_db
from app.database.models import GateStatus, StaffVolunteer, Incident
from app.database.schemas import IncidentResponse, IncidentUpdate, EventPayload
from app.services.event_stream import event_stream, start_stadium_telemetry_simulator
from app.services.rag_pipeline import rag_service
from app.agents.orchestrator import orchestrator

# Initialize logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("stadiummind.main")

# Initialize database tables
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)

# Seed SOP documents
rag_service.initialize_sop_db()

# Seed initial operational data if database is empty
def seed_initial_data():
    db = Session(bind=engine)
    try:
        if db.query(GateStatus).count() == 0:
            logger.info("Seeding default gates...")
            gates = [
                GateStatus(gate_name="Gate A", status="OPEN", flow_rate=45, current_queue_size=120, stampede_risk_percentage=5.0),
                GateStatus(gate_name="Gate B", status="OPEN", flow_rate=50, current_queue_size=180, stampede_risk_percentage=12.0),
                GateStatus(gate_name="Gate C", status="OPEN", flow_rate=30, current_queue_size=280, stampede_risk_percentage=22.0),
                GateStatus(gate_name="Gate D", status="OPEN", flow_rate=40, current_queue_size=90, stampede_risk_percentage=2.0),
                GateStatus(gate_name="Gate E", status="OPEN", flow_rate=35, current_queue_size=60, stampede_risk_percentage=0.0)
            ]
            db.add_all(gates)

        if db.query(StaffVolunteer).count() == 0:
            logger.info("Seeding default personnel...")
            personnel = [
                StaffVolunteer(name="Officer Miller", role="SECURITY", status="AVAILABLE", current_location="Gate F Lobby"),
                StaffVolunteer(name="Officer Cooper", role="SECURITY", status="AVAILABLE", current_location="Gate C Corridor"),
                StaffVolunteer(name="Dr. Vance", role="MEDICAL", status="AVAILABLE", current_location="Medical Station A"),
                StaffVolunteer(name="Paramedic Diaz", role="MEDICAL", status="AVAILABLE", current_location="First Aid Zone B"),
                StaffVolunteer(name="Volunteer Marcus", role="VOLUNTEER", status="AVAILABLE", current_location="Gate B Entryway"),
                StaffVolunteer(name="Volunteer Chloe", role="VOLUNTEER", status="AVAILABLE", current_location="Gate A Concourses"),
                StaffVolunteer(name="Eco-Rep Henderson", role="ECO", status="AVAILABLE", current_location="Compost Plaza South")
            ]
            db.add_all(personnel)

        db.commit()
    except Exception as e:
        logger.error(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

seed_initial_data()

# FastAPI application configuration
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket manager class
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Connection might be closed, handled gracefully
                pass

manager = ConnectionManager()

# Background simulator loop registration
simulator_task = None

@app.on_event("startup")
async def startup_event():
    global simulator_task
    # Start the simulator background task
    simulator_task = asyncio.create_task(start_stadium_telemetry_simulator())
    
    # Subscribe event streams to WebSocket broadcast
    def on_telemetry_publish(payload):
        asyncio.create_task(manager.broadcast({
            "type": "TELEMETRY_ALERT",
            "data": payload
        }))
        
    def on_gate_publish(payload):
        asyncio.create_task(manager.broadcast({
            "type": "GATE_UPDATE",
            "data": payload
        }))
        # Sync with database
        db = Session(bind=engine)
        try:
            gate = db.query(GateStatus).filter(GateStatus.gate_name == payload["gate_name"]).first()
            if gate:
                gate.status = payload["status"]
                gate.flow_rate = payload["flow_rate"]
                gate.current_queue_size = payload["current_queue_size"]
                gate.stampede_risk_percentage = payload["stampede_risk_percentage"]
                db.commit()
        except Exception as e:
            logger.error(f"Error updating gate DB: {e}")
        finally:
            db.close()

    def on_vital_publish(payload):
        asyncio.create_task(manager.broadcast({
            "type": "VITALS_UPDATE",
            "data": payload
        }))

    event_stream.subscribe("stadium.telemetry", on_telemetry_publish)
    event_stream.subscribe("stadium.gates", on_gate_publish)
    event_stream.subscribe("stadium.vitals", on_vital_publish)

    # Listen on telemetry events to trigger multi-agent analysis automatically!
    async def run_agent_analysis_on_anomaly(payload):
        incident = await orchestrator.process_telemetry_event(payload)
        if incident:
            # Broadcast the new incident to clients
            await manager.broadcast({
                "type": "NEW_INCIDENT",
                "data": {
                    "id": incident.id,
                    "title": incident.title,
                    "description": incident.description,
                    "category": incident.category,
                    "severity": incident.severity,
                    "status": incident.status,
                    "confidence_score": incident.confidence_score,
                    "agent_explanation": incident.agent_explanation,
                    "location": incident.location,
                    "recommendation": incident.recommendation,
                    "timestamp": incident.timestamp.isoformat()
                }
            })

    event_stream.subscribe("stadium.telemetry", run_agent_analysis_on_anomaly)

@app.on_event("shutdown")
async def shutdown_event():
    if simulator_task:
        simulator_task.cancel()

# --- API ENDPOINTS ---

@app.get(f"{settings.API_V1_STR}/incidents", response_model=List[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.timestamp.desc()).all()

@app.post(f"{settings.API_V1_STR}/incidents/trigger", response_model=IncidentResponse)
async def trigger_custom_incident(payload: EventPayload):
    """Allows manual simulation of raw events (e.g. security breach, medical shock)."""
    event_payload = {
        "event_type": payload.event_type,
        "description": payload.description,
        "location": payload.location,
        "severity": "HIGH", # Critical scenarios triggered manually require HITL
        "metric_value": payload.metric_value or 90.0
    }
    
    # Send it to the telemetry stream
    await event_stream.publish("stadium.telemetry", event_payload)
    
    # The subscription triggers orchestrator and writes to DB, fetch last incident
    db = Session(bind=engine)
    try:
        incident = db.query(Incident).order_by(Incident.id.desc()).first()
        if not incident:
            raise HTTPException(status_code=500, detail="Incident registration failed")
        return incident
    finally:
        db.close()

@app.post(f"{settings.API_V1_STR}/incidents/{{incident_id}}/approve", response_model=IncidentResponse)
async def approve_incident(incident_id: int, manager_name: str = "Chief Operations Officer", db: Session = Depends(get_db)):
    """Handles Human-in-the-Loop decision approval."""
    incident = await orchestrator.approve_incident_action(incident_id, manager_name)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found or approval failed")
    
    # Broadcast status change to clients
    await manager.broadcast({
        "type": "INCIDENT_APPROVED",
        "data": {
            "id": incident.id,
            "status": incident.status,
            "approved_by": incident.approved_by,
            "approved_at": incident.approved_at.isoformat() if incident.approved_at else None,
            "recommendation": incident.recommendation
        }
    })
    
    return incident

@app.get(f"{settings.API_V1_STR}/gates", response_model=List[dict])
def get_gates(db: Session = Depends(get_db)):
    gates = db.query(GateStatus).all()
    return [
        {
            "id": g.id,
            "gate_name": g.gate_name,
            "status": g.status,
            "flow_rate": g.flow_rate,
            "current_queue_size": g.current_queue_size,
            "stampede_risk_percentage": g.stampede_risk_percentage,
            "updated_at": g.updated_at.isoformat()
        } for g in gates
    ]

@app.get(f"{settings.API_V1_STR}/staff", response_model=List[dict])
def get_staff(db: Session = Depends(get_db)):
    staff = db.query(StaffVolunteer).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "role": s.role,
            "status": s.status,
            "current_location": s.current_location,
            "assigned_incident_id": s.assigned_incident_id
        } for s in staff
    ]

@app.get(f"{settings.API_V1_STR}/sops/search")
def search_sops(q: str, category: str = None):
    """Exposes vector SOP search to UI."""
    return rag_service.search_sops(q, category)

# --- WEBSOCKET ENDPOINT ---

@app.websocket("/ws/operations")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial state dump
        db = Session(bind=engine)
        try:
            incidents = db.query(Incident).order_by(Incident.timestamp.desc()).limit(10).all()
            gates = db.query(GateStatus).all()
            staff = db.query(StaffVolunteer).all()
            
            await websocket.send_json({
                "type": "INITIAL_STATE",
                "data": {
                    "incidents": [{
                        "id": i.id,
                        "title": i.title,
                        "description": i.description,
                        "category": i.category,
                        "severity": i.severity,
                        "status": i.status,
                        "confidence_score": i.confidence_score,
                        "agent_explanation": i.agent_explanation,
                        "location": i.location,
                        "recommendation": i.recommendation,
                        "timestamp": i.timestamp.isoformat()
                    } for i in incidents],
                    "gates": [{
                        "gate_name": g.gate_name,
                        "status": g.status,
                        "flow_rate": g.flow_rate,
                        "current_queue_size": g.current_queue_size,
                        "stampede_risk_percentage": g.stampede_risk_percentage
                    } for g in gates],
                    "staff": [{
                        "name": s.name,
                        "role": s.role,
                        "status": s.status,
                        "current_location": s.current_location
                    } for s in staff],
                    "vitals": {
                        "total_attendance": 68500,
                        "energy_grid_load_kw": 4200,
                        "waste_capacity_percent": 34.2,
                        "shuttles_in_operation": 24,
                        "water_usage_gpm": 850
                    }
                }
            })
        finally:
            db.close()

        # Handle client messages if any
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received WebSocket message: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
