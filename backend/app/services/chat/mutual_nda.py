from app.schemas.mnda_chat import MndaChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- purpose: why confidential info may be shared/used
- effectiveDate: YYYY-MM-DD
- mndaTermChoice: "expires" (with a duration) or "continues" until terminated
- confidentialityTermChoice: "duration" (with a duration) or "perpetuity"
- governingLaw, jurisdiction
- modifications: any special terms (optional)
- partyOne / partyTwo: printName, title, company, noticeAddress (for BOTH parties)
"""

GREETING = (
    "Hi! I can help you put together a Mutual NDA. To start, could you tell me "
    "the names of the two companies involved and why you're considering sharing "
    "confidential information?"
)

register(
    "mutual_nda",
    DocumentChatSpec(
        turn_schema=MndaChatTurn,
        system_prompt=build_system_prompt("Mutual Non-Disclosure Agreement (Mutual NDA)", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
