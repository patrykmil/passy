from datetime import timedelta

from database.database import SessionDep
from fastapi import HTTPException, Response
from models.user import User
from services.base_service import BaseService
from utils.auth_utils import (
    add_login_attempt,
    authenticate_user,
    get_user,
    waiting_login_allowed,
)
from utils.jwt_utils import create_access_token


class AuthService(BaseService):
    def login_user(self, username: str, password: str) -> tuple[User, str]:
        time = waiting_login_allowed(username, self.session)
        if time:
            raise HTTPException(
                429,
                f"Too many failed login attempts. Please try again in {time} seconds.",
                headers={"Retry-After": str(time)},
            )
        user = authenticate_user(get_user(username, self.session), password)
        if not user:
            add_login_attempt(username, self.session)
            raise HTTPException(
                400,
                "Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=timedelta(minutes=30)
        )
        return user, access_token

    def set_auth_cookie(self, response: Response, token: str) -> None:
        response.set_cookie(
            key="session",
            value=token,
            max_age=30 * 60,
            httponly=True,
            samesite="strict",
            secure=False,
        )

    def clear_auth_cookie(self, response: Response) -> None:
        response.delete_cookie(key="session")
