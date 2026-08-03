from app.schemas.baa_chat import BaaChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- baaEffectiveDate
- breachNotificationPeriod: how long Provider has to report a breach
- limitations: any restrictions on Provider offshoring, de-identifying, or
  aggregating PHI (optional)
- partyOne = Provider, partyTwo = Company
This is an addendum to a host Agreement — do NOT ask about governing law,
liability caps, or the general term; those live in the host Agreement.
"""

GREETING = (
    "Hi! I can help you put together a Business Associate Agreement. To "
    "start, could you tell me the names of the provider and company involved?"
)

register(
    "baa",
    DocumentChatSpec(
        turn_schema=BaaChatTurn,
        system_prompt=build_system_prompt("Business Associate Agreement (BAA)", "baa", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
