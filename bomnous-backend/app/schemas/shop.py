from pydantic import BaseModel
from typing import Optional


class ShopBase(BaseModel):
    name: str
    location: str
    description: str | None = None
    whatsapp: str | None = None
    phone: str | None = None
    categories: list[str] | None = None

class ShopCreate(ShopBase):
    pass

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    whatsapp: Optional[str] = None
    phone: Optional[str] = None
    categories: Optional[list[str]] = None

class ShopResponse(ShopBase):
    id: int
  

    class Config:
        from_attributes = True


