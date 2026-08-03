from app.schemas.psa_chat import PsaChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- effectiveDate, governingLaw, chosenCourts
- customerPolicies: any customer policies Provider must comply with (optional)
- deliverables: description of SOW Deliverables, if any
- rejectionPeriod, resubmissionPeriod: for Deliverable acceptance
- fees, paymentPeriod
- timeOfAssignment: when IP in Deliverables assigns to Customer
- sowTerm: duration of the Statement of Work
- customerObligations: what Customer must do to enable the Services (optional)
- securityPolicy, insuranceMinimums (optional)
- generalCapAmount, increasedCapAmount (optional), additionalWarranties
- partyOne = Provider, partyTwo = Customer
"""

GREETING = (
    "Hi! I can help you put together a Professional Services Agreement. To "
    "start, could you tell me the names of the provider and customer companies "
    "and what services will be provided?"
)

register(
    "psa",
    DocumentChatSpec(
        turn_schema=PsaChatTurn,
        system_prompt=build_system_prompt("Professional Services Agreement (PSA)", "psa", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
