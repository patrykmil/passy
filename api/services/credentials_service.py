from models.credential import (
    Credential,
    CredentialCreate,
    CredentialPublic,
    CredentialSecret,
    CredentialUpdate,
)
from models.user import User
from services.base_service import BaseService
from sqlmodel import select
from utils.exceptions import exception_forbidden, exception_not_found


class CredentialsService(BaseService):
    # --- helpers ---

    @staticmethod
    def _to_public(
        credential: Credential, secret: CredentialSecret
    ) -> CredentialPublic:
        return CredentialPublic.model_validate(
            {
                **credential.model_dump(),
                "password": secret.password,
                "user_id": secret.user_id,
            }
        )

    def _apply_update_fields(
        self,
        credential: Credential,
        secret: CredentialSecret,
        update_data: dict,
    ) -> None:
        for key, value in update_data.items():
            if key == "password":
                setattr(secret, key, value)
            elif key == "user_id":
                continue
            else:
                setattr(credential, key, value)

    def _build_secret(
        self, password: str, user_id: int | None, credential_id: int, owner_id: int
    ) -> CredentialSecret:
        return CredentialSecret(
            password=password,
            user_id=user_id if user_id else owner_id,
            credential_id=credential_id,
        )

    def _get_user_secret(
        self, credential_id: int, user_id: int
    ) -> CredentialSecret | None:
        return self.session.exec(
            select(CredentialSecret).where(
                CredentialSecret.credential_id == credential_id,
                CredentialSecret.user_id == user_id,
            )
        ).first()

    def _get_secrets_for_credential(self, credential_id: int) -> list[CredentialSecret]:
        return list(
            self.session.exec(
                select(CredentialSecret).where(
                    CredentialSecret.credential_id == credential_id
                )
            ).all()
        )

    def _find_credential_by_group(self, group: str) -> Credential | None:
        return self.session.exec(
            select(Credential).where(Credential.group == group)
        ).first()

    def _ensure_credential(self, credential_data: CredentialCreate) -> Credential:
        if credential_data.group:
            db_credential = self._find_credential_by_group(credential_data.group)
            if db_credential:
                return db_credential

        db_credential = Credential.model_validate(credential_data.model_dump())
        self.session.add(db_credential)
        self.session.flush()
        return db_credential

    def _add_one(
        self, credential_data: CredentialCreate, user: User
    ) -> tuple[Credential, CredentialSecret]:
        db_credential = self._ensure_credential(credential_data)
        db_secret = self._build_secret(
            password=credential_data.password,
            user_id=credential_data.user_id,
            credential_id=db_credential.id,
            owner_id=user.id,
        )
        self.session.add(db_secret)
        return db_credential, db_secret

    def _persist_and_refresh(self, *objects) -> None:
        for obj in objects:
            self.session.add(obj)
        self.session.commit()
        for obj in objects:
            self.session.refresh(obj)

    # --- permissions ---

    def is_permitted_to_add(self, user: User, team_id: int | None = None) -> bool:
        if team_id is None or team_id == 0:
            return True
        from services.teams_service import TeamsService

        return TeamsService._is_team_admin(user, team_id)

    def is_permitted_to_delete_one(
        self, user: User, credential_id: int
    ) -> Credential | None:
        db_credential = self.session.get_one(Credential, credential_id)
        db_secret = self._get_user_secret(credential_id, user.id)
        if db_secret:
            return db_credential
        return None

    def is_permitted_to_delete_admin(self, user: User, credential_group: str) -> bool:
        db_credential = self._find_credential_by_group(credential_group)
        if not db_credential or db_credential.team_id is None:
            return False
        from services.teams_service import TeamsService

        return TeamsService._is_team_admin(user, db_credential.team_id)

    # --- create ---

    def add_credential(
        self, credential_data: CredentialCreate, user: User
    ) -> CredentialPublic:
        if not self.is_permitted_to_add(user=user, team_id=credential_data.team_id):
            raise exception_forbidden()

        db_credential, db_secret = self._add_one(credential_data, user)
        self.session.commit()
        return self._to_public(db_credential, db_secret)

    def add_credentials_batch(
        self, credentials: list[CredentialCreate], user: User
    ) -> list[CredentialPublic]:
        for cred in credentials:
            if not self.is_permitted_to_add(user=user, team_id=cred.team_id):
                raise exception_forbidden()

        cred_secret_pairs = [
            self._add_one(cred_data, user) for cred_data in credentials
        ]

        self.session.commit()

        for cred, secret in cred_secret_pairs:
            self.session.refresh(cred)
            self.session.refresh(secret)

        return [self._to_public(cred, secret) for cred, secret in cred_secret_pairs]

    # --- read ---

    def get_my_credentials(self, user: User) -> list[CredentialPublic]:
        user_credentials = self.session.exec(
            select(Credential, CredentialSecret)
            .join(CredentialSecret)
            .where(CredentialSecret.user_id == user.id)
        ).all()

        return [self._to_public(cred, secret) for cred, secret in user_credentials]

    def get_credential_by_id(self, credential_id: int, user: User) -> CredentialPublic:
        db_credential = self.session.get_one(Credential, credential_id)
        if not db_credential:
            raise exception_not_found("Credential not found")

        db_secret = self._get_user_secret(credential_id, user.id)
        if not db_secret:
            raise exception_forbidden()

        return self._to_public(db_credential, db_secret)

    def get_credential_by_group(
        self, credential_group: str, user: User
    ) -> list[CredentialPublic]:
        db_credential = self.session.exec(
            select(Credential).where(Credential.group == credential_group)
        ).one()
        if not db_credential:
            raise exception_not_found("Credential not found")

        admin_team_ids = [team.id for team in user.admin_teams]
        if db_credential.team_id not in admin_team_ids:
            raise exception_forbidden()

        db_secrets = self.session.exec(
            select(CredentialSecret).where(
                CredentialSecret.credential_id == db_credential.id,
                CredentialSecret.user_id == user.id,
            )
        ).all()

        return [self._to_public(db_credential, secret) for secret in db_secrets]

    # --- delete ---

    def delete_credential_one(self, credential_id: int, user: User) -> dict:
        cred = self.is_permitted_to_delete_one(user=user, credential_id=credential_id)

        if not cred:
            raise exception_forbidden()

        cred_sec = self.session.exec(
            select(CredentialSecret).where(CredentialSecret.credential_id == cred.id)
        ).one()

        self.session.delete(cred)
        self.session.delete(cred_sec)
        self.session.commit()
        return {"detail": "Credential deleted successfully"}

    def _delete_orphaned_credential(self, credential: Credential) -> None:
        remaining = self._get_secrets_for_credential(credential.id)
        if not remaining:
            self.session.delete(credential)
            self.session.commit()

    def delete_credential_group(self, credential_group: str, user: User) -> dict:
        if not self.is_permitted_to_delete_admin(
            user=user, credential_group=credential_group
        ):
            raise exception_forbidden()

        team_credential = self.session.exec(
            select(Credential).where(Credential.group == credential_group)
        ).one()

        cred_secs = self._get_secrets_for_credential(team_credential.id)

        for cred in cred_secs:
            self.session.delete(cred)
        self.session.commit()

        self._delete_orphaned_credential(team_credential)
        return {"detail": "All credentials in the group deleted successfully"}

    # --- update ---

    def update_credential_one(
        self, credential_id: int, credential_data: CredentialUpdate, user: User
    ) -> CredentialPublic:
        db_credential = self.session.get_one(Credential, credential_id)
        db_secret = self._get_user_secret(credential_id, user.id)

        if not db_secret:
            raise exception_forbidden()

        update_data = credential_data.model_dump(exclude_unset=True)
        self._apply_update_fields(db_credential, db_secret, update_data)
        self._persist_and_refresh(db_credential, db_secret)

        return self._to_public(db_credential, db_secret)

    def update_credential_group(
        self, credential_group: str, credential_data: CredentialUpdate, user: User
    ) -> CredentialPublic:
        if not self.is_permitted_to_delete_admin(
            user=user, credential_group=credential_group
        ):
            raise exception_forbidden()

        update_data = credential_data.model_dump(exclude_unset=True)

        db_credential = self.session.exec(
            select(Credential, CredentialSecret)
            .join(CredentialSecret)
            .where(
                Credential.group == credential_group,
                CredentialSecret.user_id == credential_data.user_id,
            )
        ).one()

        cred, secret = db_credential

        self._apply_update_fields(cred, secret, update_data)
        self._persist_and_refresh(cred, secret)

        return self._to_public(cred, secret)

    def update_private_credentials_batch(
        self, credentials: list[CredentialUpdate], user: User
    ) -> list[CredentialPublic]:
        return [
            self.update_credential_one(cred.id, cred, user)
            for cred in credentials
            if cred.id is not None
        ]

    # --- purge ---

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
            remaining = self._get_secrets_for_credential(secret.credential_id)
            if not remaining:
                self.session.delete(cred)
        self.session.commit()
