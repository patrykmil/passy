from models.user import User
from sqlmodel import select
from utils.password_utils import PasswordUtils

from api.database.database import SessionDep


def get_user(username: str, session: SessionDep) -> User | None:
    result = session.exec(select(User).where(User.username == username)).first()
    return result


def authenticate_user(username: str, password: str, session: SessionDep) -> User | None:
    password_utils = PasswordUtils()
    user = get_user(username, session)
    if not user or not password_utils.verify_password(user.hashed_password, password):
        return None
    return user
