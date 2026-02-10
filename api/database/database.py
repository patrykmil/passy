from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

from api.config import SQLITE_FILE

sqlite_url = f"sqlite:///{SQLITE_FILE}"


engine = create_engine(sqlite_url, echo=True)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
