from fastapi import HTTPException
from models.credential import (
    Credential,
    CredentialCreate,
    CredentialPublic,
    CredentialSecret,
    CredentialUpdate,
)
from models.user import User
from sqlmodel import Session, select


class CredentialsService:
    def __init__(self, session: Session):
        self.session = session

    def is_permitted_to_add(self, user: User, team_id: int | None = None) -> bool:
        if team_id is None or team_id == 0:
            return True
        if any(team.id == team_id for team in user.admin_teams):
            return True
        return False

    def is_permitted_to_delete_one(
        self, user: User, credential_id: int
    ) -> Credential | None:
        db_credential = self.session.get_one(Credential, credential_id)
        db_secret = self.session.exec(
            select(CredentialSecret).where(
                CredentialSecret.credential_id == credential_id,
                CredentialSecret.user_id == user.id,
            )
        ).first()
        if db_secret:
            return db_credential
        return None

    def is_permitted_to_delete_admin(self, user: User, credential_group: str):
        db_credential = self.session.exec(
            select(Credential).where(Credential.group == credential_group)
        ).first()
        if not db_credential or db_credential.team_id is None:
            return False
        if any(team.id == db_credential.team_id for team in user.admin_teams):
            return True
        return False

    def add_credential(
        self, credential_data: CredentialCreate, user: User
    ) -> CredentialPublic:
        if not self.is_permitted_to_add(user=user, team_id=credential_data.team_id):
            raise HTTPException(status_code=403, detail="Unauthorized access")

        db_credential = None

        if credential_data.group:
            db_credential = self.session.exec(
                select(Credential).where(Credential.group == credential_data.group)
            ).first()

        if not db_credential:
            db_credential = Credential.model_validate(credential_data.model_dump())
            self.session.add(db_credential)
            self.session.commit()
            self.session.refresh(db_credential)

        db_secret = CredentialSecret(
            password=credential_data.password,
            user_id=credential_data.user_id if credential_data.user_id else user.id,
            credential_id=db_credential.id,
        )
        self.session.add(db_secret)
        self.session.commit()

        return CredentialPublic.model_validate(
            {
                **db_credential.model_dump(),
                "password": db_secret.password,
                "user_id": db_secret.user_id,
            }
        )

    def get_my_credentials(self, user: User) -> list[CredentialPublic]:
        user_credentials = self.session.exec(
            select(Credential, CredentialSecret)
            .join(CredentialSecret)
            .where(CredentialSecret.user_id == user.id)
        ).all()

        return [
            CredentialPublic.model_validate(
                {**cred.model_dump(), "password": secret.password, "user_id": user.id}
            )
            for cred, secret in user_credentials
        ]

    def get_credential_by_id(self, credential_id: int, user: User) -> CredentialPublic:
        db_credential = self.session.get_one(Credential, credential_id)
        if not db_credential:
            raise HTTPException(status_code=404, detail="Credential not found")

        db_secret = self.session.exec(
            select(CredentialSecret).where(
                CredentialSecret.credential_id == credential_id,
                CredentialSecret.user_id == user.id,
            )
        ).first()

        if not db_secret:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        return CredentialPublic.model_validate(
            {
                **db_credential.model_dump(),
                "password": db_secret.password,
                "user_id": user.id,
            }
        )

    def get_credential_by_group(
        self, credential_group: str, user: User
    ) -> list[CredentialPublic]:
        db_credential = self.session.exec(
            select(Credential).where(Credential.group == credential_group)
        ).one()
        if not db_credential:
            raise HTTPException(status_code=404, detail="Credential not found")

        admin_team_ids = [team.id for team in user.admin_teams]
        if db_credential.team_id not in admin_team_ids:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        db_secrets = self.session.exec(
            select(CredentialSecret).where(
                CredentialSecret.credential_id == db_credential.id,
                CredentialSecret.user_id == user.id,
            )
        ).all()

        creds = [
            CredentialPublic.model_validate(
                {
                    **db_credential.model_dump(),
                    "password": db_secret.password,
                    "user_id": user.id,
                }
            )
            for db_secret in db_secrets
        ]
        return creds

    def delete_credential_one(self, credential_id: int, user: User) -> dict:
        cred = self.is_permitted_to_delete_one(user=user, credential_id=credential_id)

        if not cred:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        cred_sec = self.session.exec(
            select(CredentialSecret).where(CredentialSecret.credential_id == cred.id)
        ).one()

        self.session.delete(cred)
        self.session.delete(cred_sec)
        self.session.commit()
        return {"detail": "Credential deleted successfully"}

    def delete_credential_group(self, credential_group: str, user: User) -> dict:
        perm = self.is_permitted_to_delete_admin(
            user=user, credential_group=credential_group
        )

        if not perm:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        team_credential = self.session.exec(
            select(Credential).where(Credential.group == credential_group)
        ).one()

        cred_secs = self.session.exec(
            select(CredentialSecret).where(
                CredentialSecret.credential_id == team_credential.id
            )
        ).all()

        for cred in cred_secs:
            self.session.delete(cred)
        self.session.commit()

        left = self.session.exec(
            select(CredentialSecret).where(
                CredentialSecret.credential_id == team_credential.id
            )
        ).all()

        if not left:
            self.session.delete(team_credential)
            self.session.commit()
        return {"detail": "All credentials in the group deleted successfully"}

    def update_credential_one(
        self, credential_id: int, credential_data: CredentialUpdate, user: User
    ) -> CredentialPublic:
        db_credential = self.session.get_one(Credential, credential_id)
        db_secret = self.session.exec(
            select(CredentialSecret).where(
                CredentialSecret.credential_id == credential_id,
                CredentialSecret.user_id == user.id,
            )
        ).first()

        if not db_secret:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        update_data = credential_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            if key == "password":
                setattr(db_secret, key, value)
            elif key == "user_id":
                continue
            else:
                setattr(db_credential, key, value)

        self.session.add(db_credential)
        self.session.add(db_secret)
        self.session.commit()
        self.session.refresh(db_credential)
        self.session.refresh(db_secret)

        return CredentialPublic.model_validate(
            {
                **db_credential.model_dump(),
                "password": db_secret.password,
                "user_id": db_secret.user_id,
            }
        )

    def update_credential_group(
        self, credential_group: str, credential_data: CredentialUpdate, user: User
    ) -> CredentialPublic:
        if not self.is_permitted_to_delete_admin(
            user=user, credential_group=credential_group
        ):
            raise HTTPException(status_code=403, detail="Unauthorized access")

        update_data = credential_data.model_dump(exclude_unset=True)
        print(update_data)

        db_credential = self.session.exec(
            select(Credential, CredentialSecret)
            .join(CredentialSecret)
            .where(
                Credential.group == credential_group,
                CredentialSecret.user_id == credential_data.user_id,
            )
        ).one()

        cred, secret = db_credential

        for key, value in update_data.items():
            if key == "password":
                setattr(secret, key, value)
            elif key == "user_id":
                continue
            else:
                setattr(cred, key, value)

        self.session.add(cred)
        self.session.add(secret)
        self.session.commit()

        self.session.refresh(cred)
        self.session.refresh(secret)

        return CredentialPublic.model_validate(
            {
                **cred.model_dump(),
                "password": secret.password,
                "user_id": secret.user_id,
            }
        )

    def update_private_credentials_batch(
        self, credentials: list[CredentialUpdate], user: User
    ) -> list[CredentialPublic]:
        updated_credentials = []

        for credential_data in credentials:
            if credential_data.id is None:
                continue
            updated_credentials.append(
                self.update_credential_one(credential_data.id, credential_data, user)
            )

        return updated_credentials

    def purge_credentials(self, user_id: int, team_id: int) -> None:
        credentials = self.session.exec(
            select(Credential, CredentialSecret)
            .join(CredentialSecret)
            .where(
                (CredentialSecret.user_id == user_id) & (Credential.team_id == team_id)
            )
        ).all()

        for cred, secret in credentials:
            self.session.delete(secret)
            if not self.session.exec(
                select(CredentialSecret).where(
                    CredentialSecret.credential_id == secret.credential_id
                )
            ).all():
                self.session.delete(cred)
        self.session.commit()
