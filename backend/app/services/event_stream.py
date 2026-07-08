import asyncio
import json
import logging
from typing import Callable, List, Dict
import random
from app.config import settings

logger = logging.getLogger("stadiummind.event_stream")

class EventStreamManager:
    """
    Manages event streaming. Interfaces with Kafka in production,
    and falls back to an in-memory/Redis PubSub emulator in development.
    """
    def __init__(self):
        self.use_kafka = False
        self.producer = None
        self.subscribers: Dict[str, List[Callable]] = {}
        
        # In-memory history for local tracking
        self.event_history: List[dict] = []

    def start(self):
        logger.info("Initializing EventStreamManager...")
        # In production, we'd do self.connect_kafka() inside try/except

    def subscribe(self, topic: str, callback: Callable):
        if topic not in self.subscribers:
            self.subscribers[topic] = []
        self.subscribers[topic].append(callback)
        logger.info(f"Subscribed to topic: {topic}")

    async def publish(self, topic: str, payload: dict):
        # Format payload with metadata
        event = {
            "topic": topic,
            "payload": payload,
            "timestamp": payload.get("timestamp", None)
        }
        self.event_history.append(event)
        if len(self.event_history) > 200:
            self.event_history.pop(0)

        # Trigger in-memory subscribers asynchronously
        if topic in self.subscribers:
            for callback in self.subscribers[topic]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(payload)
                    else:
                        callback(payload)
                except Exception as e:
                    logger.error(f"Error executing callback on topic {topic}: {e}")

        # Also push to Redis or real Kafka if they were configured
        logger.info(f"Published event to [{topic}]: {json.dumps(payload)}")

    def get_history(self) -> List[dict]:
        return self.event_history

event_stream = EventStreamManager()
event_stream.start()

# Background simulator tasks
async def start_stadium_telemetry_simulator():
    """
    Simulates live IoT, CCTV, WiFi, and sensor feeds.
    Pushes mock telemetry at regular intervals to drive the Multi-Agent orchestrator.
    """
    gates = ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E"]
    categories = ["CROWD", "SECURITY", "MEDICAL", "TRANSPORT", "ECO"]
    
    while True:
        await asyncio.sleep(8)  # Generate a telemetry tick every 8 seconds
        
        sim_type = random.choice(["GATES", "INCIDENT", "METRICS"])
        
        if sim_type == "GATES":
            # Simulate a gate telemetry update
            gate = random.choice(gates)
            flow_rate = random.randint(15, 80)
            queue_size = random.randint(50, 450)
            stampede_risk = round(max(0.0, (queue_size - 250) * 0.2 + random.uniform(-5, 5)), 1)
            
            await event_stream.publish("stadium.gates", {
                "gate_name": gate,
                "status": "CONGESTED" if queue_size > 300 else "OPEN",
                "flow_rate": flow_rate,
                "current_queue_size": queue_size,
                "stampede_risk_percentage": stampede_risk
            })
            
        elif sim_type == "INCIDENT":
            # Random lower-priority telemetry warning (that agents might escalate or solve)
            cat = random.choice(categories)
            if cat == "CROWD":
                desc = "Sensor alert: Sudden crowd compression detected near Gate C corridors."
                loc = "Gate C South Escalator"
            elif cat == "SECURITY":
                desc = "CCTV metadata: Unattended backpack detected under row 42, Sector F."
                loc = "Sector F - Lower Deck"
            elif cat == "MEDICAL":
                desc = "Alert: High ambient temperature index reported in Sector B East wing. Heat stroke risk elevation."
                loc = "Sector B - East Deck"
            elif cat == "TRANSPORT":
                desc = "Transit telemetry: Bus shuttle link delayed by 14 minutes due to arterial route blockages."
                loc = "North Transit Plaza"
            else:
                desc = "Eco telemetry: Sudden energy surge in concessions cluster 4. Potential transformer strain."
                loc = "Concessions Sector 4"
                
            await event_stream.publish("stadium.telemetry", {
                "event_type": f"{cat}_ANOMALY",
                "description": desc,
                "location": loc,
                "metric_value": round(random.uniform(70, 95), 1),
                "severity": random.choice(["LOW", "MEDIUM", "HIGH"])
            })
        else:
            # General stadium vital stats
            await event_stream.publish("stadium.vitals", {
                "total_attendance": 68500 + random.randint(-200, 200),
                "energy_grid_load_kw": 4200 + random.randint(-150, 150),
                "waste_capacity_percent": 34.2 + random.uniform(0.1, 1.2),
                "shuttles_in_operation": 24,
                "water_usage_gpm": 850 + random.randint(-30, 30)
            })
