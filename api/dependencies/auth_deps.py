from typing import Annotated

from database.database import SessionDep
from fastapi import Cookie, Depends, HTTPException
from models.user import User
from utils.auth_utils import get_user
from utils.jwt_utils import get_username_from_token

TokenDep = Annotated[str | None, Cookie(alias="session")]


async def get_current_user(session: SessionDep, token: TokenDep = None) -> User:
    if not token:
        raise HTTPException(
            401, "Unauthorized access", headers={"WWW-Authenticate": "Bearer"}
        )

    user = get_user(get_username_from_token(token), session)
    if user is None:
        raise HTTPException(
            401, "Unauthorized access", headers={"WWW-Authenticate": "Bearer"}
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
