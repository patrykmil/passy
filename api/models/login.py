from time import time

from sqlmodel import Field, SQLModel


class LoginAttempt(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str
    timestamp: float = Field(default=time())
