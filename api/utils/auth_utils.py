from time import time

from config import ALLOWED_LOGIN_ATTEMPTS, ALLOWED_LOGIN_ATTEMPTS_TIME_WINDOW
from database.database import SessionDep
from models.login import LoginAttempt
from models.user import User
from sqlmodel import select
from utils.password_utils import ph


def get_user(username: str, session: SessionDep) -> User | None:
    return session.exec(select(User).where(User.username == username)).first()


def add_login_attempt(username: str, session: SessionDep) -> None:
    session.add(LoginAttempt(username=username))
    session.commit()


def waiting_login_allowed(username: str, session: SessionDep) -> int:
    attempts = list(
        session.exec(
            select(LoginAttempt)
            .where(LoginAttempt.username == username)
            .where(
                LoginAttempt.timestamp >= time() - ALLOWED_LOGIN_ATTEMPTS_TIME_WINDOW
            )
        ).all()
    )
    if len(attempts) >= ALLOWED_LOGIN_ATTEMPTS:
        return ALLOWED_LOGIN_ATTEMPTS_TIME_WINDOW - int(time() - attempts[0].timestamp)
    return 0


def authenticate_user(user: User | None, password: str) -> User | None:
    if not user or not ph.verify(user.hashed_password, password):
        return None
    return user
