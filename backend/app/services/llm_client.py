import litellm
from litellm import acompletion
from pydantic import BaseModel, ValidationError

from app.core.config import Settings

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}
MAX_MALFORMED_RETRIES = 1  # one bounded re-ask if the model returns invalid JSON/schema


class LlmRateLimitedError(Exception):
    pass


class LlmTimeoutError(Exception):
    pass


class LlmResponseInvalidError(Exception):
    pass


class LlmUnavailableError(Exception):
    pass


async def call_llm_structured(messages: list[dict], schema: type[BaseModel], settings: Settings) -> BaseModel:
    last_error: Exception | None = None

    for _ in range(MAX_MALFORMED_RETRIES + 1):
        try:
            response = await acompletion(
                model=MODEL,
                messages=messages,
                response_format=schema,
                reasoning_effort="low",
                extra_body=EXTRA_BODY,
                api_key=settings.openrouter_api_key,
                timeout=20,
            )
        except litellm.exceptions.RateLimitError as exc:
            raise LlmRateLimitedError() from exc
        except litellm.exceptions.Timeout as exc:
            raise LlmTimeoutError() from exc
        except (litellm.exceptions.APIConnectionError, litellm.exceptions.ServiceUnavailableError) as exc:
            raise LlmUnavailableError() from exc
        except litellm.exceptions.APIError as exc:
            raise LlmUnavailableError() from exc
        except Exception as exc:  # never leak an unexpected exception as a bare 500
            raise LlmUnavailableError() from exc

        content = response.choices[0].message.content
        if not content:
            last_error = LlmResponseInvalidError("empty LLM response content")
            continue
        try:
            return schema.model_validate_json(content)
        except ValidationError as exc:
            last_error = LlmResponseInvalidError(str(exc))
            continue

    raise last_error or LlmResponseInvalidError("no content returned")
