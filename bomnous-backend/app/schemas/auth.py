from pydantic import BaseModel, EmailStr
from typing import Literal

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Literal["buyer", "seller"] = "buyer"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
