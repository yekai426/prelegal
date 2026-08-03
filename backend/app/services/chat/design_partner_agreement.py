from app.schemas.design_partner_chat import DesignPartnerChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- effectiveDate, governingLaw, chosenCourts
- term: duration + unit for early access
- program: description of the design partner program/feedback expectations
- fees: any fees the partner pays (optional)
- partyOne = Provider, partyTwo = Partner
(This agreement has no liability cap or additional-warranties section — leave
generalCapAmount and additionalWarranties blank.)
"""

GREETING = (
    "Hi! I can help you put together a Design Partner Agreement. To start, could "
    "you tell me the names of the provider and design partner companies involved?"
)

register(
    "design_partner_agreement",
    DocumentChatSpec(
        turn_schema=DesignPartnerChatTurn,
        system_prompt=build_system_prompt("Design Partner Agreement", "design_partner_agreement", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
