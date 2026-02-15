from pydantic import BaseModel
from typing import Optional


# Base schema (shared fields)
class ProductBase(BaseModel):
    name: str
    price: float
    stock: int = 0
    shop_id: int


# For creating a product
class ProductCreate(ProductBase):
    pass


# For updating a product
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None


# For returning product data
class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
