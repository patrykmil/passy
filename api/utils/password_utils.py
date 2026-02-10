from argon2 import PasswordHasher


class PasswordUtils:
    def __init__(self):
        self.ph = PasswordHasher()

    def hash_password(self, password: str) -> str:
        return self.ph.hash(password)

    def verify_password(
        self,
        hashed_password: str,
        plain_password: str,
    ) -> bool:
        return self.ph.verify(hashed_password, plain_password)
