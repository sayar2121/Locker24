from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email_or_username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
