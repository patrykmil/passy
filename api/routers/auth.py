from typing import Annotated

from database.database import SessionDep
from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from services.auth_service import AuthService
from services.users_service import UsersService

router = APIRouter()

AuthServiceDep = Annotated[AuthService, Depends(AuthService)]
UsersServiceDep = Annotated[UsersService, Depends(UsersService)]


@router.post("/login")
async def get_token(
    response: Response,
    session: SessionDep,
    auth_service: AuthServiceDep,
    users_service: UsersServiceDep,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user, access_token = auth_service.login_user(form_data.username, form_data.password)

    auth_service.set_auth_cookie(response, access_token)

    return users_service.get_current_user_info(user)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session")
    return {"message": "Logged out successfully"}
