from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    displayname: str = ""
    email: str = ""
    groups: list[str] = []
    password: str
    disabled: bool = False


class UserUpdate(BaseModel):
    displayname: str = ""
    email: str = ""
    groups: list[str] = []
    disabled: bool = False


class PasswordReset(BaseModel):
    password: str
