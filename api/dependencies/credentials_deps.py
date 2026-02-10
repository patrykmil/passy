from typing import Annotated

from fastapi import Depends
from services.credentials_service import CredentialsService

from api.database.database import SessionDep


def get_credentials_service(session: SessionDep) -> CredentialsService:
    return CredentialsService(session)


CredentialsServiceDep = Annotated[CredentialsService, Depends(get_credentials_service)]
