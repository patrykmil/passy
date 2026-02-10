from typing import Annotated

from fastapi import Depends
from services.teams_service import TeamsService

from api.database.database import SessionDep


def get_teams_service(session: SessionDep) -> TeamsService:
    return TeamsService(session)


TeamsServiceDep = Annotated[TeamsService, Depends(get_teams_service)]
