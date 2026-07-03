from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from utils.exceptions import exception_unauthorized

from api.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except InvalidTokenError:
        raise exception_unauthorized()


def get_username_from_token(token: str) -> str:
    payload = decode_access_token(token)
    username = payload.get("sub")
    if username is None:
        raise exception_unauthorized()
    return str(username)
