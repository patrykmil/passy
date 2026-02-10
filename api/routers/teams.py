from dependencies.auth_deps import CurrentUser
from dependencies.teams_deps import TeamsServiceDep
from fastapi import APIRouter
from models.team import (
    TeamApplication,
    TeamApplicationAction,
    TeamApplicationResponse,
    TeamCreate,
    TeamDetailed,
    TeamPublic,
)

router = APIRouter()


@router.post("/", response_model=TeamPublic)
async def add_team(
    team: TeamCreate, teams_service: TeamsServiceDep, current_user: CurrentUser
):
    return teams_service.add_team(team.name, current_user)


@router.get("/", response_model=list[TeamDetailed])
def get_my_teams(teams_service: TeamsServiceDep, current_user: CurrentUser):
    return teams_service.get_my_teams(current_user)


@router.post("/applications")
async def apply_to_team(
    application: TeamApplication,
    teams_service: TeamsServiceDep,
    current_user: CurrentUser,
):
    return teams_service.apply_to_team(application.team_code, current_user)


@router.get("/{team_id}/applications", response_model=list[TeamApplicationResponse])
async def get_team_applications(
    team_id: int, teams_service: TeamsServiceDep, current_user: CurrentUser
):
    return teams_service.get_team_applications(team_id, current_user)


@router.post("/{team_id}/applications/{user_id}/respond", response_model=dict)
async def respond_to_application(
    team_id: int,
    user_id: int,
    action: TeamApplicationAction,
    teams_service: TeamsServiceDep,
    current_user: CurrentUser,
):
    return teams_service.respond_to_application(team_id, user_id, action, current_user)


@router.get("/applications/my", response_model=list[dict])
async def get_my_applications(
    teams_service: TeamsServiceDep, current_user: CurrentUser
):
    return teams_service.get_my_applications(current_user)


@router.get("/{id}", response_model=TeamPublic)
async def get_teams_by_id(
    id: int, teams_service: TeamsServiceDep, current_user: CurrentUser
):
    return teams_service.get_team_by_id(id, current_user)


@router.delete("/{team_id}/members/{user_id}", response_model=dict)
async def remove_team_member(
    team_id: int,
    user_id: int,
    teams_service: TeamsServiceDep,
    current_user: CurrentUser,
):
    return teams_service.remove_team_member(team_id, user_id, current_user)


@router.delete("/{team_id}/membership", response_model=dict)
async def quit_team(
    team_id: int, teams_service: TeamsServiceDep, current_user: CurrentUser
):
    return teams_service.quit_team(team_id, current_user)
