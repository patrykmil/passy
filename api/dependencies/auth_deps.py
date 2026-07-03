from typing import Annotated

from fastapi import Cookie, Depends
from models.user import User
from services.auth_service import AuthService
from utils.auth_utils import get_user
from utils.exceptions import exception_unauthorized
from utils.jwt_utils import get_username_from_token

from api.database.database import SessionDep

TokenDep = Annotated[str | None, Cookie(alias="session")]


async def get_current_user(session: SessionDep, token: TokenDep = None) -> User:
    if not token:
        raise exception_unauthorized()

    username = get_username_from_token(token)
    user = get_user(username, session)
    if user is None:
        raise exception_unauthorized()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_auth(user: CurrentUser) -> User:
    if not user:
        raise exception_unauthorized(detail="Authentication required")
    return user


def get_auth_service(session: SessionDep) -> AuthService:
    return AuthService(session)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
