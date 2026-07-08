import datetime
import logging
from typing import List, Dict, Any, Optional
from app.database.connection import SessionLocal
from app.database.models import Incident, StaffVolunteer, GateStatus
from app.services.rag_pipeline import rag_service

logger = logging.getLogger("stadiummind.orchestrator")

class AgentReasoningStep:
    """Represents a single step in the ReAct loop of an agent."""
    def __init__(self, agent_name: str, step_type: str, content: str):
        self.agent_name = agent_name
        self.step_type = step_type # THOUGHT, ACTION, OBSERVATION, OUTCOME
        self.content = content
        self.timestamp = datetime.datetime.utcnow().isoformat()

class MultiAgentOrchestrator:
    """
    Coordinates LangGraph nodes (Agents) and manages execution flow,
    RAG loading, and Human-in-the-Loop routing.
    """
    def __init__(self):
        self.agent_roles = {
            "CROWD": "Crowd Intelligence & Redistribution Agent",
            "SECURITY": "Counter-Terrorism & Physical Threat Security Agent",
            "MEDICAL": "Emergency Medical Response & AED Dispatch Agent",
            "TRANSPORT": "Transit Grid & Parking Logistical Coordinator",
            "ECO": "Sustainability & Smart-Grid Energy Coordinator"
        }

    async def process_telemetry_event(self, event: dict) -> Optional[Incident]:
        """
        Receives raw telemetry events, processes them through the Multi-Agent flow,
        queries the RAG pipeline, and registers/updates incidents.
        """
        db = SessionLocal()
        try:
            event_type = event.get("event_type", "GENERAL_ANOMALY")
            description = event.get("description", "Unknown raw event telemetry")
            location = event.get("location", "Main Bowl")
            severity = event.get("severity", "MEDIUM")
            
            # Determine category
            category = "GENERAL"
            for cat in self.agent_roles.keys():
                if cat in event_type or cat in description.upper():
                    category = cat
                    break
            
            # 1. RAG Retrieval Step
            sops = rag_service.search_sops(description, category)
            sop_context = "\n".join([f"- {s['title']}: {s['content']}" for s in sops])
            
            # 2. Multi-Agent Reasoning Execution (Simulated ReAct Chain)
            agent_name = self.agent_roles.get(category, "Operations Orchestrator")
            reasoning_steps = []
            
            reasoning_steps.append(AgentReasoningStep(
                agent_name, "THOUGHT",
                f"Analyzing anomaly report: '{description}' in {location}. Severity: {severity}. Retrieving relevant SOP guides..."
            ))
            
            reasoning_steps.append(AgentReasoningStep(
                agent_name, "OBSERVATION",
                f"SOP vector search retrieved standard guides:\n{sop_context}"
            ))
            
            # Calculate agent outputs based on standard SOP guidelines
            confidence = 0.85
            explanation = ""
            recommendation = ""
            
            if category == "CROWD":
                confidence = 0.94
                explanation = "Based on flow rate decline and queue compression data, Gate B and C corridors are approaching bottle-neck capacity. Triggering redistribution prevents localized stampede risks."
                recommendation = "Open emergency bypass gates at Gate B and D. Divert inbound fans via automated dynamic signage to Gate A."
            elif category == "SECURITY":
                confidence = 0.91
                explanation = "CCTV camera object detection identified a stationary package in a high-traffic lobby corridor for over 15 minutes. This triggers standard security suspicious object protocol SEC-202."
                recommendation = "Establish a 50-meter safety zone around Sector F corridor. Coordinate with security officer patrols to confirm container contents."
            elif category == "MEDICAL":
                confidence = 0.97
                explanation = "A medical distress alert was received. Heat fatigue indices indicate zone B is a hotspot. Shortest response route planning indicates Dispatch Team 3 is nearest."
                recommendation = "Dispatch Medical Response Team 3 equipped with mobile AED to Sector B corridor entrance. Set route clearance protocols on Transit Zone B."
            elif category == "ECO":
                confidence = 0.89
                explanation = "Power consumption metrics in concession grid section 4 show an unexpected 28% peak surge. Eco energy conservation SOP recommends minor cooling reduction."
                recommendation = "Dim suite air-conditioning cycles by 10% in luxury rows 1-12. Clear trash bin overload in Sector C concession cluster."
            else:
                confidence = 0.80
                explanation = "General anomaly received. Operations coordinator reviewing options."
                recommendation = "Alert sector supervisor for on-site assessment."

            reasoning_steps.append(AgentReasoningStep(
                agent_name, "ACTION",
                f"Proposing mitigation strategy: '{recommendation}' with a confidence score of {confidence * 100}%."
            ))
            
            # Determine status based on safety guidelines (Human in the Loop approval required for High/Critical)
            status = "PENDING_APPROVAL" if severity in ["HIGH", "CRITICAL"] else "EXECUTING"
            
            reasoning_steps.append(AgentReasoningStep(
                agent_name, "OUTCOME",
                f"Action plan registered. Status: {status}. awaiting manager confirmation: {'Yes' if status == 'PENDING_APPROVAL' else 'No'}."
            ))

            # Store in Database
            incident = Incident(
                title=f"Potential {category.capitalize()} Issue - {location}",
                description=description,
                category=category,
                severity=severity,
                status=status,
                confidence_score=confidence,
                agent_explanation=json_serialize_steps(reasoning_steps) + f"\n\n[Analysis Summary]: {explanation}",
                location=location,
                recommendation=recommendation,
                timestamp=datetime.datetime.utcnow()
            )
            
            db.add(incident)
            db.commit()
            db.refresh(incident)
            
            logger.info(f"Multi-Agent system completed analysis. Registered Incident #{incident.id} with status {status}")
            return incident
            
        except Exception as e:
            logger.error(f"Error in Multi-Agent reasoning cycle: {e}")
            db.rollback()
            return None
        finally:
            db.close()

    async def approve_incident_action(self, incident_id: int, manager_name: str) -> Optional[Incident]:
        """Approves a pending incident action plan and dispatches resources."""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident:
                return None
            
            incident.status = "EXECUTING"
            incident.approved_by = manager_name
            incident.approved_at = datetime.datetime.utcnow()
            
            # Simulate dispatch of a resource
            resource = db.query(StaffVolunteer).filter(
                StaffVolunteer.role == incident.category,
                StaffVolunteer.status == "AVAILABLE"
            ).first()
            
            if resource:
                resource.status = "DISPATCHED"
                resource.assigned_incident_id = incident.id
                logger.info(f"Dispatched {resource.name} ({resource.role}) to incident #{incident.id}")
            
            db.commit()
            db.refresh(incident)
            return incident
        except Exception as e:
            logger.error(f"Error approving incident: {e}")
            db.rollback()
            return None
        finally:
            db.close()

def json_serialize_steps(steps: List[AgentReasoningStep]) -> str:
    import json
    return json.dumps([
        {
            "agent": s.agent_name,
            "step": s.step_type,
            "content": s.content,
            "time": s.timestamp
        }
        for s in steps
    ])

orchestrator = MultiAgentOrchestrator()
