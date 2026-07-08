import datetime
from pydantic import BaseModel
from typing import Optional, List

# Incidents
class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    severity: str
    location: str
    recommendation: Optional[str] = None

class IncidentCreate(IncidentBase):
    confidence_score: Optional[float] = 1.0
    agent_explanation: Optional[str] = None

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime.datetime] = None
    recommendation: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: int
    status: str
    confidence_score: float
    agent_explanation: Optional[str]
    timestamp: datetime.datetime
    approved_by: Optional[str]
    approved_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True

# Gates
class GateStatusBase(BaseModel):
    status: str
    flow_rate: int
    current_queue_size: int
    stampede_risk_percentage: float

class GateStatusUpdate(GateStatusBase):
    pass

class GateStatusResponse(GateStatusBase):
    id: int
    gate_name: str
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Staff
class StaffVolunteerBase(BaseModel):
    name: str
    role: str
    status: str
    current_location: str
    assigned_incident_id: Optional[int] = None

class StaffVolunteerUpdate(BaseModel):
    status: Optional[str] = None
    current_location: Optional[str] = None
    assigned_incident_id: Optional[int] = None

class StaffVolunteerResponse(StaffVolunteerBase):
    id: int
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# SOPs
class SopDocumentCreate(BaseModel):
    title: str
    category: str
    content: str

class SopDocumentResponse(SopDocumentCreate):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Event payload models
class EventPayload(BaseModel):
    event_type: str # CROWD_ALERT, SECURITY_BREACH, MEDICAL_EMERGENCY, TRANSIT_DELAY, ENERGY_SPIKE
    gate_name: Optional[str] = None
    metric_value: Optional[float] = None
    description: str
    location: str
