from database.database import get_session
from fastapi import Depends
from sqlmodel import Session


class BaseService:
    def __init__(self, session: Session = Depends(get_session)):
        self.session = session
