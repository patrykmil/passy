from datetime import timedelta

from fastapi import Response
from models.user import User
from services.base_service import BaseService
from utils.auth_utils import (
    add_login_attempt,
    authenticate_user,
    get_user,
    waiting_login_allowed,
)
from utils.exceptions import exception_incorrect_credentials
from utils.jwt_utils import create_access_token

from api.utils.exceptions import exception_too_many_login_attempts


class AuthService(BaseService):
    def login_user(self, username: str, password: str) -> tuple[User, str]:
        time = waiting_login_allowed(username=username, session=self.session)
        if time:
            raise exception_too_many_login_attempts(time_left=time)
        user = get_user(username, self.session)
        user = authenticate_user(user, password, self.session)
        if not user:
            add_login_attempt(username=username, session=self.session)
            raise exception_incorrect_credentials()

        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
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
