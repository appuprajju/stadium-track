import logging
from typing import List, Dict, Any
from app.database.connection import SessionLocal
from app.database.models import SopDocument

logger = logging.getLogger("stadiummind.rag_pipeline")

# Preloaded SOP guidelines
SOP_DATABASE = [
    {
        "title": "Crowd Congestion and Stampede Mitigation Protocol (CROWD-101)",
        "category": "CROWD_SOP",
        "content": (
            "If crowd density exceeds 4 people per square meter or gate queue wait times cross 25 minutes:\n"
            "1. Activate gate bypass flow by opening auxiliary tourniquets at Gate B and D.\n"
            "2. Dispatch volunteer teams to guide fans toward lighter sectors (e.g., Gate A).\n"
            "3. Broadcast dynamic overhead signage messages recommending alternative entrances.\n"
            "4. Human operations manager must sign off on gate bypass redirects."
        )
    },
    {
        "title": "Unattended / Suspicious Package Protocol (SEC-202)",
        "category": "SECURITY_SOP",
        "content": (
            "Upon detecting an unattended backpack or suspicious package:\n"
            "1. Establish a 50-meter safety cordon immediately. Do not move or touch the object.\n"
            "2. Alert local stadium security staff and dispatch nearest available response unit.\n"
            "3. Request operations control center verification via high-resolution PTZ camera zoom.\n"
            "4. Contact municipal explosive ordnance disposal (EOD) if verified threat level is high.\n"
            "5. Prepare sector evacuation channels quietly to avoid mass panic."
        )
    },
    {
        "title": "Cardiac Arrest and AED Location Medical Protocol (MED-303)",
        "category": "MEDICAL_SOP",
        "content": (
            "When a medical emergency (unresponsive casualty / potential arrest) is reported:\n"
            "1. Locate and dispatch the nearest automated external defibrillator (AED). AEDs are situated at 100-meter intervals along major corridors.\n"
            "2. Alert the closest medical response team on foot and dispatch field ambulance to the sector ingress point.\n"
            "3. Reroute pedestrian traffic away from corridor access points to clear path for emergency stretchers."
        )
    },
    {
        "title": "Eco-Grid Energy Strain and Waste Optimization (ECO-404)",
        "category": "ECO_SOP",
        "content": (
            "When localized energy loads exceed 4500 kW or waste facilities report 85% capacity limits:\n"
            "1. Deploy waste cleaning crew modules to high-capacity dining sectors.\n"
            "2. Trigger automated HVAC dimming of non-essential luxury suites and retail zones by 10%.\n"
            "3. Redirect graywater recycling systems to relieve strain on municipal piping systems.\n"
            "4. Consolidate vendor garbage bins into compaction stations."
        )
    }
]

class RagPipelineService:
    """
    RAG service representing vector embedding index lookup.
    Uses database-backed keywords or embeddings search, with local in-memory
    definitions for offline reliability.
    """
    def __init__(self):
        # Initialized externally in main.py startup to ensure database tables exist first
        pass

    def initialize_sop_db(self):
        """Pre-seeds the PostgreSQL DB with critical FIFA operational SOPs if empty."""
        db = SessionLocal()
        try:
            count = db.query(SopDocument).count()
            if count == 0:
                logger.info("Seeding SOP documents into local database...")
                for sop in SOP_DATABASE:
                    doc = SopDocument(
                        title=sop["title"],
                        category=sop["category"],
                        content=sop["content"]
                    )
                    db.add(doc)
                db.commit()
        except Exception as e:
            logger.error(f"Error seeding SOPs: {e}")
            db.rollback()
        finally:
            db.close()

    def search_sops(self, query: str, category: str = None) -> List[Dict[str, Any]]:
        """
        Simulates vector search (retrieval) matching the query criteria.
        Extracts relevant SOP segments to feed into the Agent prompts as system context.
        """
        db = SessionLocal()
        try:
            # Query all SOPs
            sops = db.query(SopDocument).all()
            matches = []
            
            # Simple keyword-based scoring model to act as fallback vector similarity
            query_words = set(query.lower().split())
            for sop in sops:
                score = 0.0
                sop_text = (sop.title + " " + sop.category + " " + sop.content).lower()
                
                # Check for direct word intersections
                for word in query_words:
                    if len(word) > 3 and word in sop_text:
                        score += 1.0
                
                if category and category.lower() in sop.category.lower():
                    score += 2.0  # Category match weight
                
                if score > 0 or not query_words:
                    matches.append({
                        "id": sop.id,
                        "title": sop.title,
                        "category": sop.category,
                        "content": sop.content,
                        "score": round(score / max(1, len(query_words)), 2)
                    })
            
            # Sort by score descending
            matches.sort(key=lambda x: x["score"], reverse=True)
            return matches[:2] # Return top 2 matching SOP segments
        except Exception as e:
            logger.error(f"Error executing vector SOP search: {e}")
            return []
        finally:
            db.close()

rag_service = RagPipelineService()
