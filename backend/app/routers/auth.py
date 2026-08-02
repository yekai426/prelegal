from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserPublic, UserSignIn
from app.services import auth_service

router = APIRouter()


@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def signup(
    payload: UserCreate,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    try:
        user = auth_service.create_user(db, payload.email, payload.password)
    except auth_service.EmailAlreadyRegisteredError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    auth_service.issue_session_cookie(response, user, settings)
    return user


@router.post("/signin", response_model=UserPublic)
def signin(
    payload: UserSignIn,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    auth_service.issue_session_cookie(response, user, settings)
    return user


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
def signout(response: Response) -> None:
    auth_service.clear_session_cookie(response)


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(auth_service.get_current_user)) -> User:
    return user
