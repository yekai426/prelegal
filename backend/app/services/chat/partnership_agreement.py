from app.schemas.partnership_chat import PartnershipChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- effectiveDate, endDate (fixed date the partnership ends, not a duration)
- obligations: what each party is committing to do
- territory: geographic scope of the trademark license (optional)
- brandGuidelines: any brand usage guidelines (optional)
- paymentProcess: how any fees are billed, if any (optional)
- governingLaw, chosenCourts
- generalCapAmount, additionalWarranties
- partyOne = Company, partyTwo = Partner
"""

GREETING = (
    "Hi! I can help you put together a Partnership Agreement. To start, could "
    "you tell me the names of the company and partner involved?"
)

register(
    "partnership_agreement",
    DocumentChatSpec(
        turn_schema=PartnershipChatTurn,
        system_prompt=build_system_prompt("Partnership Agreement", "partnership_agreement", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
