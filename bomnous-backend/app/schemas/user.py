from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: Literal["buyer", "seller"]


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=200)
    username: Optional[str] = Field(default=None, min_length=1, max_length=80)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=40)
    city: Optional[str] = Field(default=None, max_length=80)
    bio: Optional[str] = Field(default=None, max_length=150)
    # Base64 / data-URL can be large; cap to ~3MB string
    profile_picture: Optional[str] = Field(default=None, max_length=3_000_000)


class UserResponse(UserBase):
    id: int
    role: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True
