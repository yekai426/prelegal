from app.schemas.software_license_chat import SoftwareLicenseChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- effectiveDate, governingLaw, chosenCourts
- subscriptionPeriod: duration + unit
- orderDate, nonRenewalNoticeDate
- permittedUses: what Customer is licensed to do with the software
- licenseLimits: any usage limits
- paymentProcess: "invoicing" or "automatic"
- warrantyPeriod, deletionProcedure: how Customer removes the software on termination
- generalCapAmount, increasedCapAmount (optional), additionalWarranties
- partyOne = Provider, partyTwo = Customer
"""

GREETING = (
    "Hi! I can help you put together a Software License Agreement. To start, "
    "could you tell me the names of the provider and customer companies "
    "involved?"
)

register(
    "software_license_agreement",
    DocumentChatSpec(
        turn_schema=SoftwareLicenseChatTurn,
        system_prompt=build_system_prompt("Software License Agreement", "software_license_agreement", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
