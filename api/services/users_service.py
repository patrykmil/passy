from fastapi import HTTPException
from models.team import TeamPublic
from models.user import User, UserCreate, UserPrivate, UserPublic
from services.base_service import BaseService
from sqlmodel import select
from utils.password_utils import ph


class UsersService(BaseService):
    def get_current_user_info(self, user: User) -> UserPrivate:
        return UserPrivate(
            id=user.id,
            username=user.username,
            public_key=user.public_key,
            encrypted_private_key=user.encrypted_private_key,
            member_teams=[
                TeamPublic(id=t.id, name=t.name, code=t.code) for t in user.member_teams
            ],
            admin_teams=[
                TeamPublic(id=t.id, name=t.name, code=t.code) for t in user.admin_teams
            ],
        )

    def get_user_by_id(self, user_id: int) -> UserPublic:
        user = self.session.get_one(User, user_id)
        return UserPublic.model_validate(user.model_dump())

    def get_all_users(self) -> list[UserPublic]:
        users = self.session.exec(select(User)).all()
        return [UserPublic.model_validate(user.model_dump()) for user in users]

    def create_user(self, user_data: UserCreate) -> UserPublic:
        if self.session.exec(
            select(User).where(User.username == user_data.username)
        ).first():
            raise HTTPException(400, "Username already exists")

        db_user = User(
            username=user_data.username,
            hashed_password=ph.hash(user_data.password),
            public_key=user_data.public_key,
            encrypted_private_key=user_data.encrypted_private_key,
        )

        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)

        return UserPublic.model_validate(db_user.model_dump())

    def change_user_password(
        self,
        user: User,
        old_password: str,
        new_password: str,
        encrypted_private_key: str,
    ) -> None:
        if not ph.verify(user.hashed_password, old_password):
            raise HTTPException(400, "Old password is incorrect")

        user.hashed_password = ph.hash(new_password)
        user.encrypted_private_key = encrypted_private_key

        self.session.add(user)
        self.session.commit()

    def change_user_keys(
        self,
        user: User,
        public_key: str,
        encrypted_private_key: str,
    ) -> None:
        user.public_key = public_key
        user.encrypted_private_key = encrypted_private_key

        self.session.add(user)
        self.session.commit()
