from typing import TYPE_CHECKING, List, Optional

from models.team import TeamAdminLink, TeamAwaiting, TeamMemberLink, TeamPublic
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models.team import Team


class UserBase(SQLModel):
    username: str


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    public_key: Optional[str] = Field(default=None)
    encrypted_private_key: Optional[str] = Field(default=None)
    member_teams: list["Team"] = Relationship(
        back_populates="members", link_model=TeamMemberLink
    )
    admin_teams: list["Team"] = Relationship(
        back_populates="admins", link_model=TeamAdminLink
    )
    awaiting_teams: list["Team"] = Relationship(
        back_populates="awaiting", link_model=TeamAwaiting
    )


class UserPrivate(UserBase):
    id: Optional[int] = Field(default=None, primary_key=True)
    public_key: Optional[str] = Field(default=None)
    encrypted_private_key: Optional[str] = Field(default=None)
    member_teams: List[TeamPublic] = Field(default_factory=list)
    admin_teams: List[TeamPublic] = Field(default_factory=list)


class UserPublic(UserBase):
    id: Optional[int] = Field(default=None, primary_key=True)
    public_key: Optional[str] = Field(default=None)
    encrypted_private_key: Optional[str] = Field(default=None)
    member_teams: List[TeamPublic] = Field(default_factory=list)
    admin_teams: List[TeamPublic] = Field(default_factory=list)


class UserCreate(UserBase):
    password: str
    public_key: str
    encrypted_private_key: str


class ChangePasswordRequest(SQLModel):
    old_password: str
    new_password: str
    encrypted_private_key: str


class ChangeKeysRequest(SQLModel):
    public_key: str
    encrypted_private_key: str
