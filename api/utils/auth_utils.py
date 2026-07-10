from time import time

from models.user import User
from sqlmodel import select
from utils.password_utils import PasswordUtils

from api.config import ALLOWED_LOGIN_ATTEMPTS, ALLOWED_LOGIN_ATTEMPTS_TIME_WINDOW
from api.database.database import SessionDep
from api.models.login import LoginAttempt


def get_user(username: str, session: SessionDep) -> User | None:
    result = session.exec(select(User).where(User.username == username)).first()
    return result


def add_login_attempt(username: str, session: SessionDep) -> None:
    login_attempt = LoginAttempt(username=username)
    session.add(login_attempt)
    session.commit()


def get_new_failed_login_attempts(
    username: str, time_window: int, session: SessionDep
) -> list[LoginAttempt]:
    return list(
        session.exec(
            select(LoginAttempt)
            .where(LoginAttempt.username == username)
            .where(LoginAttempt.timestamp >= time() - time_window)
        ).all()
    )


def waiting_login_allowed(
    username: str,
    session: SessionDep,
    max_attempts: int = ALLOWED_LOGIN_ATTEMPTS,
    time_window: int = ALLOWED_LOGIN_ATTEMPTS_TIME_WINDOW,
) -> int:
    attempts = get_new_failed_login_attempts(username, time_window, session)
    if len(attempts) >= max_attempts:
        return time_window - int(time() - attempts[0].timestamp)
    return 0


def authenticate_user(user: User, password: str, session: SessionDep) -> User | None:
    password_utils = PasswordUtils()
    if not user or not password_utils.verify_password(user.hashed_password, password):
        return None
    return user
