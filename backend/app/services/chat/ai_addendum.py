from app.schemas.ai_addendum_chat import AiAddendumChatTurn

from .prompts import build_system_prompt
from .registry import DocumentChatSpec, register

FIELD_GUIDE = """
- trainingData: data Provider may use to train a Model, if any (leave blank if
  the user doesn't want to permit any model training)
- trainingPurposes: what the training is for, if training is permitted
- trainingRestrictions: any restrictions on how training data is used (optional)
- improvementRestrictions: restrictions on using Input/Output for non-training
  product improvement (optional)
This is an addendum to a host Agreement — do NOT ask about governing law,
liability caps, or term; those live in the host Agreement.
"""

GREETING = (
    "Hi! I can help you put together an AI Addendum. To start, will the "
    "provider be permitted to use your data to train their AI models?"
)

register(
    "ai_addendum",
    DocumentChatSpec(
        turn_schema=AiAddendumChatTurn,
        system_prompt=build_system_prompt("AI Addendum", "ai_addendum", FIELD_GUIDE),
        greeting=GREETING,
    ),
)
