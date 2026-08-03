from app.schemas.sla_chat import SlaChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- targetUptimePercent: e.g. "99.9%"
- targetResponseTime: e.g. "4 business hours"
- supportChannel: how support requests are submitted
- uptimeCreditFormula, responseTimeCreditFormula: how service credits are calculated
This is an addendum to a host Cloud Service Agreement — do NOT ask about
governing law, liability caps, parties, or term; those live in the host
Agreement's Cover Page, not here.
"""

GREETING = (
    "Hi! I can help you put together a Service Level Agreement. To start, what "
    "uptime target are you looking to commit to?"
)

register(
    "sla",
    DocumentChatSpec(
        turn_schema=SlaChatTurn,
        system_prompt=build_system_prompt("Service Level Agreement (SLA)", "sla", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
