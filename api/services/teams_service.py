import secrets

from fastapi import HTTPException
from models.team import (
    Team,
    TeamAdminLink,
    TeamApplicationAction,
    TeamApplicationResponse,
    TeamAwaiting,
    TeamDetailed,
    TeamMemberLink,
    TeamPublic,
)
from models.user import User
from services.base_service import BaseService
from services.credentials_service import CredentialsService
from sqlmodel import select


class TeamsService(BaseService):
    @property
    def credentials_service(self) -> CredentialsService:
        return CredentialsService(self.session)

    @staticmethod
    def _is_team_admin(user: User, team_id: int | None) -> bool:
        if team_id is None:
            return False
        return any(team.id == team_id for team in user.admin_teams)

    def _is_user_admin_of_team(self, user: User, team: Team) -> bool:
        return any(admin.id == user.id for admin in team.admins)

    def _is_user_member_of_team(self, user: User, team: Team) -> bool:
        return any(member.id == user.id for member in team.members)

    def _is_user_awaiting_team(self, user: User, team: Team) -> bool:
        return any(awaiting.id == user.id for awaiting in team.awaiting)

    def _format_user_dict(self, user: User) -> dict:
        return {"id": user.id, "username": user.username}

    def _require_admin(self, user: User, team: Team) -> None:
        if not self._is_user_admin_of_team(user, team):
            raise HTTPException(403, "You are not an admin of this team")

    def _build_team_detailed(self, team: Team, is_admin: bool) -> TeamDetailed:
        return TeamDetailed(
            id=team.id,
            name=team.name,
            code=team.code,
            admins=[self._format_user_dict(admin) for admin in team.admins],
            members=[self._format_user_dict(member) for member in team.members]
            if is_admin
            else [],
            awaiting=[self._format_user_dict(awaiting) for awaiting in team.awaiting]
            if is_admin
            else [],
        )

    def _get_unique_user_teams(self, user: User) -> list[Team]:
        seen_ids: set[int | None] = set()
        unique_teams: list[Team] = []
        for team in user.admin_teams + user.member_teams:
            if team.id not in seen_ids:
                seen_ids.add(team.id)
                unique_teams.append(team)
        return unique_teams

    def _to_application_response(
        self, team: Team, user_app: User
    ) -> TeamApplicationResponse:
        return TeamApplicationResponse(
            application_id=f"{team.id}_{user_app.id}",
            user_id=user_app.id or 0,
            username=user_app.username,
            team_id=team.id or 0,
            team_name=team.name,
        )

    def _find_application(self, team_id: int, user_id: int) -> TeamAwaiting | None:
        return self.session.exec(
            select(TeamAwaiting).where(
                TeamAwaiting.team_id == team_id, TeamAwaiting.user_id == user_id
            )
        ).first()

    def _add_role_link(self, team_id: int, user_id: int, role: str) -> None:
        link = TeamAdminLink if role == "admin" else TeamMemberLink
        self.session.add(link(team_id=team_id, user_id=user_id))

    def get_my_applications(self, user: User) -> list[dict]:
        return [
            {
                "team_id": team.id,
                "team_name": team.name,
                "team_code": team.code,
                "application_date": "pending",
            }
            for team in user.awaiting_teams
        ]

    def get_my_teams(self, user: User) -> list[TeamDetailed]:
        unique_teams = self._get_unique_user_teams(user)
        return [
            self._build_team_detailed(team, self._is_user_admin_of_team(user, team))
            for team in unique_teams
        ]

    def apply_to_team(self, team_code: str, user: User) -> dict[str, str]:
        team = self.session.exec(select(Team).where(Team.code == team_code)).first()

        if not team:
            raise HTTPException(400, "Invalid team code")

        if self._is_user_member_of_team(user, team) or self._is_user_admin_of_team(
            user, team
        ):
            raise HTTPException(400, "You are already a member of this team")

        if self._is_user_awaiting_team(user, team):
            raise HTTPException(
                400, "You already have a pending application for this team"
            )

        self.session.add(TeamAwaiting(team_id=team.id, user_id=user.id))
        self.session.commit()

        return {"message": "Application submitted successfully"}

    def get_team_applications(
        self, team_id: int, user: User
    ) -> list[TeamApplicationResponse]:
        team = self.session.get_one(Team, team_id)

        if not self._is_user_admin_of_team(user, team):
            return []

        return [
            self._to_application_response(team, user_app) for user_app in team.awaiting
        ]

    def respond_to_application(
        self,
        team_id: int,
        user_id: int,
        action: TeamApplicationAction,
        current_user: User,
    ) -> dict[str, str]:
        team = self.session.get_one(Team, team_id)
        self._require_admin(current_user, team)

        application = self._find_application(team_id, user_id)
        if not application:
            raise HTTPException(404, "Application not found")

        self.session.delete(application)

        if action.action == "accept":
            self._add_role_link(team_id, user_id, action.role)
            self.session.commit()
            return {"message": f"User accepted as {action.role}"}
        else:
            self.session.commit()
            return {"message": "Application declined"}

    def add_team(self, team_name: str, user: User) -> TeamPublic:
        team_code = secrets.token_hex(12).upper()
        db_team = Team(name=team_name, code=team_code)

        self.session.add(db_team)
        self.session.commit()
        self.session.refresh(db_team)

        self.session.add(TeamAdminLink(team_id=db_team.id, user_id=user.id))
        self.session.commit()

        return TeamPublic(id=db_team.id, name=db_team.name, code=db_team.code)

    def remove_team_member(
        self,
        team_id: int,
        user_id: int,
        current_user: User,
    ) -> dict:
        db_team = self.session.get_one(Team, team_id)
        self._require_admin(current_user, db_team)

        team_member_link = self.session.exec(
            select(TeamMemberLink).where(
                TeamMemberLink.user_id == user_id,
                TeamMemberLink.team_id == team_id,
            )
        ).first()

        if not team_member_link:
            raise HTTPException(404, "Member not found in a team")

        self.session.delete(team_member_link)
        self.session.commit()

        self.credentials_service.purge_credentials(user_id=user_id, team_id=team_id)

        return {"message": "Member removed from team successfully"}

    def quit_team(
        self,
        team_id: int,
        current_user: User,
    ) -> dict:
        link = self._find_user_team_link(current_user.id, team_id)

        if not link:
            raise HTTPException(404, "Member not found in a team")

        self.session.delete(link)
        self.session.commit()

        if current_user.id:
            self.credentials_service.purge_credentials(
                user_id=current_user.id, team_id=team_id
            )

        return {"message": "Member removed from team successfully"}

    def _find_user_team_link(
        self, user_id: int | None, team_id: int
    ) -> TeamMemberLink | TeamAdminLink | None:
        member_link = self.session.exec(
            select(TeamMemberLink).where(
                TeamMemberLink.user_id == user_id,
                TeamMemberLink.team_id == team_id,
            )
        ).first()
        if member_link:
            return member_link

        return self.session.exec(
            select(TeamAdminLink).where(
                TeamAdminLink.user_id == user_id,
                TeamAdminLink.team_id == team_id,
            )
        ).first()
