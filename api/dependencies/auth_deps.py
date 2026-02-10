from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from models.user import User
from services.auth_service import AuthService
from utils.auth_utils import get_user
from utils.jwt_utils import get_username_from_token

from api.database.database import SessionDep

TokenDep = Annotated[str | None, Cookie(alias="session")]


async def get_current_user(session: SessionDep, token: TokenDep = None) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    username = get_username_from_token(token)
    user = get_user(username, session)
    if user is None:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_auth(user: CurrentUser) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


def get_auth_service(session: SessionDep) -> AuthService:
    return AuthService(session)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
