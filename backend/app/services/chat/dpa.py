from app.schemas.dpa_chat import DpaChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- partyOne = Provider, partyTwo = Customer
- categoriesOfPersonalData, categoriesOfDataSubjects
- specialCategoryData, specialCategoryRestrictions (optional)
- approvedSubprocessors: names/locations/tasks of approved subprocessors
- frequencyNatureAndPurpose, durationOfProcessing
- governingMemberState: only if EEA SCCs apply (optional)
- providerSecurityContact
This DPA has its own Cover Page identifying the parties, but do NOT ask about
governing law, liability caps, or term/duration; those live in the host
Agreement referenced by this DPA, not here.
"""

GREETING = (
    "Hi! I can help you put together a Data Processing Agreement. To start, "
    "could you describe what categories of personal data will be processed?"
)

register(
    "dpa",
    DocumentChatSpec(
        turn_schema=DpaChatTurn,
        system_prompt=build_system_prompt("Data Processing Agreement (DPA)", "dpa", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
