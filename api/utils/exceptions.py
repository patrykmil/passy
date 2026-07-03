from fastapi import HTTPException


def exception_forbidden(detail: str = "Unauthorized access"):
    return HTTPException(status_code=403, detail=detail)


def exception_not_found(detail: str = "Resource not found"):
    return HTTPException(status_code=404, detail=detail)


def exception_incorrect_credentials(detail: str = "Incorrect username or password"):
    return HTTPException(
        status_code=400,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def exception_invalid(detail: str = "Invalid request"):
    return HTTPException(status_code=400, detail=detail)


def exception_unauthorized(detail: str = "Unauthorized access"):
    return HTTPException(status_code=401, detail=detail, headers={"WWW-Authenticate": "Bearer"})
