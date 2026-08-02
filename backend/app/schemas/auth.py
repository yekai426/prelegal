from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# bcrypt silently ignores bytes beyond this length in some versions and raises
# ValueError in others (5.0+) — reject upfront so both behave as a clean 422.
MAX_PASSWORD_BYTES = 72


def _validate_password_bytes(password: str) -> str:
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(f"password must be at most {MAX_PASSWORD_BYTES} bytes")
    return password


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    _validate_password = field_validator("password")(_validate_password_bytes)


class UserSignIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    _validate_password = field_validator("password")(_validate_password_bytes)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime
