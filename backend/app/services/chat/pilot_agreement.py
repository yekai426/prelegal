from app.schemas.pilot_chat import PilotChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- effectiveDate, governingLaw, chosenCourts
- pilotPeriod: duration + unit
- evaluationPurposes: what Customer is evaluating the product for
- generalCapAmount
- partyOne = Provider, partyTwo = Customer
(This agreement has no additional-warranties section — leave
additionalWarranties blank.)
"""

GREETING = (
    "Hi! I can help you put together a Pilot Agreement. To start, could you "
    "tell me the names of the provider and customer companies involved?"
)

register(
    "pilot_agreement",
    DocumentChatSpec(
        turn_schema=PilotChatTurn,
        system_prompt=build_system_prompt("Pilot Agreement", "pilot_agreement", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
