import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False) # CROWD, SECURITY, MEDICAL, TRANSPORT, ECO, GENERAL
    severity = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="PENDING_APPROVAL") # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTING, RESOLVED
    confidence_score = Column(Float, default=1.0)
    agent_explanation = Column(Text, nullable=True)
    location = Column(String(100), nullable=False)
    recommendation = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)

class GateStatus(Base):
    __tablename__ = "gate_statuses"

    id = Column(Integer, primary_key=True, index=True)
    gate_name = Column(String(50), unique=True, nullable=False)
    status = Column(String(20), default="OPEN") # OPEN, CLOSED, CONGESTED
    flow_rate = Column(Integer, default=0) # people/min
    current_queue_size = Column(Integer, default=0)
    stampede_risk_percentage = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class StaffVolunteer(Base):
    __tablename__ = "staff_volunteers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False) # SECURITY, MEDICAL, VOLUNTEER, OPERATIONS, ECO
    status = Column(String(30), default="AVAILABLE") # AVAILABLE, DISPATCHED, BREAK
    current_location = Column(String(100), nullable=False)
    assigned_incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    incident = relationship("Incident")

class SopDocument(Base):
    __tablename__ = "sop_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False) # SECURITY_SOP, CROWD_SOP, MEDICAL_SOP, ECO_SOP
    content = Column(Text, nullable=False)
    # embedding = Column(Vector(1536)) # PGVector implementation format (simulated as text if needed)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
