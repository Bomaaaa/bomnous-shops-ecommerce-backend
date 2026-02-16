from pydantic import BaseModel
from typing import Optional


class ShopBase(BaseModel):
    name: str
    location: str

class ShopCreate(ShopBase):
    pass

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None

class ShopResponse(ShopBase):
    id: int
  

    class Config:
        from_attributes = True


