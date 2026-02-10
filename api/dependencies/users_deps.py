from typing import Annotated

from fastapi import Depends
from services.users_service import UsersService

from api.database.database import SessionDep


def get_users_service(session: SessionDep) -> UsersService:
    return UsersService(session)


UsersServiceDep = Annotated[UsersService, Depends(get_users_service)]
