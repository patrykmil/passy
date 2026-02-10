from sqlmodel import Field, SQLModel


class CredentialBase(SQLModel):
    login: str | None = None
    record_name: str | None = None
    url: str | None = None
    edited: bool = False
    group: str | None = ""


class Credential(CredentialBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    team_id: int | None = None


class CredentialSecret(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    password: str
    user_id: int
    credential_id: int = Field(foreign_key="credential.id")


class CredentialPublic(CredentialBase):
    id: int | None = Field(default=None, primary_key=True)
    password: str
    team_id: int | None = None
    user_id: int | None = None


class CredentialCreate(CredentialBase):
    password: str
    team_id: int | None = None
    user_id: int | None = None


class CredentialUpdate(CredentialBase):
    id: int | None = None
    password: str | None = None
    user_id: int | None = None
