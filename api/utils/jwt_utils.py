from datetime import datetime, timedelta, timezone

import jwt
from config import JWT_ALGORITHM, JWT_SECRET_KEY
from fastapi import HTTPException
from jwt.exceptions import InvalidTokenError


def create_access_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = {**data, "exp": datetime.now(timezone.utc) + expires_delta}
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_username_from_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except InvalidTokenError:
        raise HTTPException(
            401, "Unauthorized access", headers={"WWW-Authenticate": "Bearer"}
        )
    username = payload.get("sub")
    if username is None:
        raise HTTPException(
            401, "Unauthorized access", headers={"WWW-Authenticate": "Bearer"}
        )
    return str(username)
