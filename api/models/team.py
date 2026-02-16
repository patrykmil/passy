from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models.user import User


class TeamMemberLink(SQLModel, table=True):
    team_id: Optional[int] = Field(
        default=None, foreign_key="team.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )


class TeamAdminLink(SQLModel, table=True):
    team_id: Optional[int] = Field(
        default=None, foreign_key="team.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )


class TeamAwaiting(SQLModel, table=True):
    team_id: Optional[int] = Field(
        default=None, foreign_key="team.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )


class TeamBase(SQLModel):
    name: str


class Team(TeamBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str

    members: list["User"] = Relationship(
        back_populates="member_teams", link_model=TeamMemberLink
    )
    admins: list["User"] = Relationship(
        back_populates="admin_teams", link_model=TeamAdminLink
    )
    awaiting: list["User"] = Relationship(
        back_populates="awaiting_teams", link_model=TeamAwaiting
    )


class TeamPublic(TeamBase):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str


class TeamDetailed(TeamBase):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str
    members: list[dict]
    admins: list[dict]
    awaiting: list[dict] = []


class TeamCreate(TeamBase):
    admin_id: int


def map_teams_to_public(teams: list["Team"]) -> list["TeamPublic"]:
    return [TeamPublic(id=team.id, name=team.name, code=team.code) for team in teams]


class TeamApplication(SQLModel):
    team_code: str


class TeamApplicationResponse(SQLModel):
    application_id: str
    user_id: int
    username: str
    team_id: int
    team_name: str


class TeamApplicationAction(SQLModel):
    action: str = "decline"
    role: str = "member"


class UserRemove(SQLModel):
    user_id: int
    team_id: int
