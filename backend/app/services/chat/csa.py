from app.schemas.csa_chat import CsaChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- effectiveDate, governingLaw, chosenCourts
- subscriptionPeriod: duration + unit
- orderDate, nonRenewalNoticeDate
- technicalSupport: how/when support is provided
- paymentProcess: "invoicing" or "automatic"
- generalCapAmount, increasedCapAmount (optional), additionalWarranties
- partyOne = Provider, partyTwo = Customer
"""

GREETING = (
    "Hi! I can help you put together a Cloud Service Agreement. To start, could "
    "you tell me the names of the provider and customer companies involved?"
)

register(
    "csa",
    DocumentChatSpec(
        turn_schema=CsaChatTurn,
        system_prompt=build_system_prompt("Cloud Service Agreement (CSA)", "csa", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
