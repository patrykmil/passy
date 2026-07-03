from datetime import timedelta

from fastapi import Response
from models.team import map_teams_to_public
from models.user import User, UserPrivate
from services.base_service import BaseService
from utils.auth_utils import authenticate_user
from utils.exceptions import exception_incorrect_credentials
from utils.jwt_utils import create_access_token


class AuthService(BaseService):
    def login_user(self, username: str, password: str) -> tuple[User, str]:
        user = authenticate_user(username, password, self.session)
        if not user:
            raise exception_incorrect_credentials()

        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        return user, access_token

    def create_user_response(self, user: User) -> UserPrivate:
        return UserPrivate(
            id=user.id,
            username=user.username,
            public_key=user.public_key,
            encrypted_private_key=user.encrypted_private_key,
            member_teams=map_teams_to_public(user.member_teams),
            admin_teams=map_teams_to_public(user.admin_teams),
        )

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
