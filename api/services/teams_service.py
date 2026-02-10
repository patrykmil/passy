import secrets
from typing import Any, Dict, List

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
from services.credentials_service import CredentialsService
from sqlmodel import Session, select


class TeamsService:
    def __init__(self, session: Session):
        self.session = session
        self.credentials_service = CredentialsService(session)

    def _is_user_admin_of_team(self, user: User, team: Team) -> bool:
        return any(admin.id == user.id for admin in team.admins)

    def _is_user_member_of_team(self, user: User, team: Team) -> bool:
        return any(member.id == user.id for member in team.members)

    def _is_user_awaiting_team(self, user: User, team: Team) -> bool:
        return any(awaiting.id == user.id for awaiting in team.awaiting)

    def _format_user_dict(self, user: User) -> dict:
        return {"id": user.id, "username": user.username}

    def get_all_teams(self) -> List[TeamPublic]:
        teams = self.session.exec(select(Team)).all()
        return [TeamPublic.model_validate(team.model_dump()) for team in teams]

    def get_my_teams(self, user: User) -> List[TeamDetailed]:
        teams = []
        seen_team_ids = set()

        all_user_teams = user.admin_teams + user.member_teams

        for team in all_user_teams:
            if team.id in seen_team_ids:
                continue
            seen_team_ids.add(team.id)

            is_admin = self._is_user_admin_of_team(user, team)

            teams.append(
                TeamDetailed(
                    id=team.id,
                    name=team.name,
                    code=team.code,
                    admins=[self._format_user_dict(admin) for admin in team.admins],
                    members=[self._format_user_dict(member) for member in team.members]
                    if is_admin
                    else [],
                    awaiting=[
                        self._format_user_dict(awaiting) for awaiting in team.awaiting
                    ]
                    if is_admin
                    else [],
                )
            )

        return teams

    def apply_to_team(self, team_code: str, user: User) -> Dict[str, str]:
        team = self.session.exec(select(Team).where(Team.code == team_code)).first()

        if not team:
            raise HTTPException(status_code=400, detail="Invalid team code")

        if self._is_user_member_of_team(user, team) or self._is_user_admin_of_team(
            user, team
        ):
            raise HTTPException(
                status_code=400, detail="You are already a member of this team"
            )

        if self._is_user_awaiting_team(user, team):
            raise HTTPException(
                status_code=400,
                detail="You already have a pending application for this team",
            )

        team_await = TeamAwaiting(team_id=team.id, user_id=user.id)
        self.session.add(team_await)
        self.session.commit()

        return {"message": "Application submitted successfully"}

    def get_team_applications(
        self, team_id: int, user: User
    ) -> List[TeamApplicationResponse]:
        team = self.session.get_one(Team, team_id)

        if not self._is_user_admin_of_team(user, team):
            return []

        result = [
            TeamApplicationResponse(
                application_id=f"{team.id}_{user_app.id}",
                user_id=user_app.id or 0,
                username=user_app.username,
                team_id=team.id or 0,
                team_name=team.name,
            )
            for user_app in team.awaiting
        ]

        return result

    def respond_to_application(
        self,
        team_id: int,
        user_id: int,
        action: TeamApplicationAction,
        current_user: User,
    ) -> Dict[str, str]:
        team = self.session.get_one(Team, team_id)

        if not self._is_user_admin_of_team(current_user, team):
            raise HTTPException(
                status_code=403, detail="You are not an admin of this team"
            )

        application = self.session.exec(
            select(TeamAwaiting).where(
                TeamAwaiting.team_id == team_id, TeamAwaiting.user_id == user_id
            )
        ).first()

        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        self.session.delete(application)

        if action.action == "accept":
            if action.role == "admin":
                team_admin_link = TeamAdminLink(team_id=team_id, user_id=user_id)
                self.session.add(team_admin_link)
            else:
                team_member_link = TeamMemberLink(team_id=team_id, user_id=user_id)
                self.session.add(team_member_link)

            self.session.commit()
            return {"message": f"User accepted as {action.role}"}
        else:
            self.session.commit()
            return {"message": "Application declined"}

    def get_my_applications(self, user: User) -> List[Dict[str, Any]]:
        result = [
            {
                "team_id": team.id,
                "team_name": team.name,
                "team_code": team.code,
                "application_date": "pending",
            }
            for team in user.awaiting_teams
        ]

        return result

    def get_team_by_id(
        self,
        team_id: int,
        current_user: User,
    ) -> TeamPublic:
        if not team_id or team_id <= 0 or not self.session.get(Team, team_id):
            raise HTTPException(status_code=400, detail="Invalid team ID")

        current_user_admin_team_ids = {team.id for team in current_user.admin_teams}

        if team_id not in current_user_admin_team_ids:
            raise HTTPException(
                status_code=403, detail="You are not an admin of this team"
            )

        team = self.session.get_one(Team, team_id)
        return TeamPublic.model_validate(team.model_dump())

    def add_team(self, team_name: str, user: User) -> TeamPublic:
        team_code = secrets.token_hex(12).upper()
        db_team = Team(name=team_name, code=team_code)

        self.session.add(db_team)
        self.session.commit()
        self.session.refresh(db_team)

        team_admin_link = TeamAdminLink(team_id=db_team.id, user_id=user.id)
        self.session.add(team_admin_link)
        self.session.commit()

        return TeamPublic(id=db_team.id, name=db_team.name, code=db_team.code)

    def remove_team_member(
        self,
        team_id: int,
        user_id: int,
        current_user: User,
    ) -> dict:
        db_team = self.session.get_one(Team, team_id)

        if not self._is_user_admin_of_team(current_user, db_team):
            raise HTTPException(
                status_code=403, detail="You are not an admin of this team"
            )

        team_member_link = self.session.exec(
            select(TeamMemberLink).where(
                TeamMemberLink.user_id == user_id,
                TeamMemberLink.team_id == team_id,
            )
        ).first()

        if not team_member_link:
            raise HTTPException(status_code=404, detail="Member not found in a team")

        self.session.delete(team_member_link)
        self.session.commit()

        self.credentials_service.purge_credentials(user_id=user_id, team_id=team_id)

        return {"message": "Member removed from team successfully"}

    def quit_team(
        self,
        team_id: int,
        current_user: User,
    ) -> dict:
        team_member_link = self.session.exec(
            select(TeamMemberLink).where(
                TeamMemberLink.user_id == current_user.id,
                TeamMemberLink.team_id == team_id,
            )
        ).first()

        team_admin_link = None
        if not team_member_link:
            team_admin_link = self.session.exec(
                select(TeamAdminLink).where(
                    TeamAdminLink.user_id == current_user.id,
                    TeamAdminLink.team_id == team_id,
                )
            ).first()

        if not team_member_link and not team_admin_link:
            raise HTTPException(status_code=404, detail="Member not found in a team")

        if team_member_link:
            self.session.delete(team_member_link)
        else:
            self.session.delete(team_admin_link)

        self.session.commit()

        if current_user.id:
            self.credentials_service.purge_credentials(
                user_id=current_user.id, team_id=team_id
            )

        return {"message": "Member removed from team successfully"}
