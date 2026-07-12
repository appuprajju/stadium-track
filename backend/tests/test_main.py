import sys
import os
import unittest
import asyncio
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add root folder and backend folder to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create clean, isolated in-memory SQLite database for test runs
testing_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=testing_engine)

# Patch connection variables BEFORE importing app or orchestrator to intercept database sessions
import app.database.connection
app.database.connection.engine = testing_engine
app.database.connection.SessionLocal = TestingSessionLocal

import app.agents.orchestrator
app.agents.orchestrator.SessionLocal = TestingSessionLocal

import app.services.rag_pipeline
app.services.rag_pipeline.SessionLocal = TestingSessionLocal

# Mock the telemetry simulator loop to prevent background tasks during tests
async def mock_telemetry_simulator():
    pass
import app.services.event_stream
app.services.event_stream.start_stadium_telemetry_simulator = mock_telemetry_simulator

from app.main import app
from app.database.connection import Base, get_db
from app.database.models import Incident, GateStatus, StaffVolunteer, SopDocument
from app.services.rag_pipeline import rag_service, SOP_DATABASE
from app.agents.orchestrator import orchestrator

# Re-create clean tables for the in-memory engine
Base.metadata.create_all(bind=testing_engine)

# Override FastAPI dependency injection
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


def seed_testing_database():
    """Wipes and seeds the in-memory database with standard fixtures for testing."""
    # Clear subscribers to prevent duplicate registrations from multiple TestClient startups
    from app.services.event_stream import event_stream
    event_stream.subscribers.clear()
    
    db = TestingSessionLocal()
    try:
        # Wipe existing tables
        db.query(Incident).delete()
        db.query(GateStatus).delete()
        db.query(StaffVolunteer).delete()
        db.query(SopDocument).delete()
        db.commit()

        # Seed SOPs
        for sop in SOP_DATABASE:
            doc = SopDocument(
                title=sop["title"],
                category=sop["category"],
                content=sop["content"]
            )
            db.add(doc)

        # Seed Gates
        gates = [
            GateStatus(gate_name="Gate A", status="OPEN", flow_rate=45, current_queue_size=120, stampede_risk_percentage=5.0),
            GateStatus(gate_name="Gate B", status="OPEN", flow_rate=50, current_queue_size=180, stampede_risk_percentage=12.0),
            GateStatus(gate_name="Gate C", status="OPEN", flow_rate=30, current_queue_size=280, stampede_risk_percentage=22.0),
            GateStatus(gate_name="Gate D", status="OPEN", flow_rate=40, current_queue_size=90, stampede_risk_percentage=2.0),
            GateStatus(gate_name="Gate E", status="OPEN", flow_rate=35, current_queue_size=60, stampede_risk_percentage=0.0)
        ]
        db.add_all(gates)

        # Seed Staff & Volunteers
        personnel = [
            StaffVolunteer(name="Officer Miller", role="SECURITY", status="AVAILABLE", current_location="Gate F Lobby"),
            StaffVolunteer(name="Dr. Vance", role="MEDICAL", status="AVAILABLE", current_location="Medical Station A"),
            StaffVolunteer(name="Volunteer Marcus", role="VOLUNTEER", status="AVAILABLE", current_location="Gate B Entryway"),
            StaffVolunteer(name="Eco-Rep Henderson", role="ECO", status="AVAILABLE", current_location="Compost Plaza South")
        ]
        db.add_all(personnel)
        db.commit()
    finally:
        db.close()


class TestStadiumMindAPI(unittest.TestCase):
    def setUp(self):
        seed_testing_database()
        self.client = TestClient(app)

    def test_get_incidents(self):
        """Verifies GET /api/v1/incidents fetches incidents correctly."""
        response = self.client.get("/api/v1/incidents")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_get_gates(self):
        """Verifies GET /api/v1/gates returns default gate listings."""
        response = self.client.get("/api/v1/gates")
        self.assertEqual(response.status_code, 200)
        gates = response.json()
        self.assertIsInstance(gates, list)
        self.assertEqual(len(gates), 5)
        self.assertEqual(gates[0]["gate_name"], "Gate A")

    def test_get_staff(self):
        """Verifies GET /api/v1/staff returns all default personnel."""
        response = self.client.get("/api/v1/staff")
        self.assertEqual(response.status_code, 200)
        staff = response.json()
        self.assertIsInstance(staff, list)
        self.assertEqual(len(staff), 4)

    def test_search_sops(self):
        """Verifies GET /api/v1/sops/search matches standard keywords correctly."""
        response = self.client.get("/api/v1/sops/search?q=cardiac")
        self.assertEqual(response.status_code, 200)
        matches = response.json()
        self.assertIsInstance(matches, list)
        self.assertGreater(len(matches), 0)
        self.assertIn("Cardiac Arrest", matches[0]["title"])

    def test_trigger_incident_pipeline(self):
        """Tests POST /api/v1/incidents/trigger parses anomalies, queries RAG, and persists logs."""
        payload = {
            "event_type": "CROWD_CONGESTION",
            "description": "WiFi telemetry indicates crowd density exceeding 4.2 people/sqm near ingress lines.",
            "location": "Gate B concourse",
            "metric_value": 94.0
        }
        response = self.client.post("/api/v1/incidents/trigger", json=payload)
        self.assertEqual(response.status_code, 200)
        
        incident = response.json()
        self.assertEqual(incident["category"], "CROWD")
        self.assertEqual(incident["severity"], "HIGH")
        self.assertEqual(incident["status"], "PENDING_APPROVAL")
        self.assertEqual(incident["location"], "Gate B concourse")
        self.assertIsNotNone(incident["agent_explanation"])
        self.assertIn("Orchestrator Agent", incident["agent_explanation"])

    def test_approve_incident_pipeline(self):
        """Tests POST /api/v1/incidents/{incident_id}/approve executes HITL actions and dispatches staff."""
        # 1. Trigger an incident to establish a PENDING_APPROVAL record
        payload = {
            "event_type": "SECURITY_ALERT",
            "description": "Suspicious package reported left unattended under the seating benches.",
            "location": "Sector F",
            "metric_value": 90.0
        }
        trigger_res = self.client.post("/api/v1/incidents/trigger", json=payload)
        self.assertEqual(trigger_res.status_code, 200)
        incident_id = trigger_res.json()["id"]

        # 2. Approve the incident
        approve_res = self.client.post(
            f"/api/v1/incidents/{incident_id}/approve?manager_name=Chief Security Officer"
        )
        self.assertEqual(approve_res.status_code, 200)
        
        approved_incident = approve_res.json()
        self.assertEqual(approved_incident["status"], "EXECUTING")
        self.assertEqual(approved_incident["approved_by"], "Chief Security Officer")
        self.assertIsNotNone(approved_incident["approved_at"])

        # 3. Verify matching personnel was dispatched
        staff_res = self.client.get("/api/v1/staff")
        staff_list = staff_res.json()
        # Find Officer Miller (SECURITY)
        officer = next(s for s in staff_list if s["name"] == "Officer Miller")
        self.assertEqual(officer["status"], "DISPATCHED")
        self.assertEqual(officer["assigned_incident_id"], incident_id)

    def test_approve_nonexistent_incident(self):
        """Tests that approving a non-existent incident returns a 404 error."""
        response = self.client.post("/api/v1/incidents/99999/approve?manager_name=COO")
        self.assertEqual(response.status_code, 404)


class TestStadiumMindServices(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        seed_testing_database()

    def test_rag_pipeline_scoring_direct(self):
        """Tests the keyword similarity scoring algorithm of the RAG pipeline directly."""
        # Test exact keyword match
        matches = rag_service.search_sops("AED defibrillator location", "MEDICAL")
        self.assertGreater(len(matches), 0)
        self.assertIn("MED-303", matches[0]["title"])
        self.assertEqual(matches[0]["category"], "MEDICAL_SOP")

        # Test query with no match doesn't crash and returns empty list
        no_matches = rag_service.search_sops("random unmatched term query string", "ECO")
        self.assertEqual(len(no_matches), 0)

    async def test_orchestrator_general_fallback(self):
        """Tests that orchestrator maps unknown anomalies to the GENERAL category safely."""
        event = {
            "event_type": "UNKNOWN_ANOMALY",
            "description": "A generic system glitch was reported on the display boards.",
            "location": "North Display Tower",
            "severity": "LOW"
        }
        
        # Run async function using direct await keyword within IsolatedAsyncioTestCase
        incident = await orchestrator.process_telemetry_event(event)
        
        self.assertIsNotNone(incident)
        self.assertEqual(incident.category, "GENERAL")
        self.assertEqual(incident.status, "EXECUTING")  # LOW severity bypasses PENDING_APPROVAL
        self.assertEqual(incident.confidence_score, 0.80)


if __name__ == "__main__":
    unittest.main()
