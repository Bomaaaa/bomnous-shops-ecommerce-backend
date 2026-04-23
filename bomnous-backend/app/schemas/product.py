from pydantic import BaseModel
from typing import Optional


# Base schema (shared fields)
class ProductBase(BaseModel):
    name: str
    price: float
    stock: int = 0
    shop_id: int
    category: str = "women"
    tag: str = "trending"
    image_url: str = "image/product-1-1.jpg"
    image_hover_url: str | None = None
    compare_at_price: float | None = None
    aesthetic_tag: str = "soft-luxury"


# For creating a product
class ProductCreate(ProductBase):
    pass


# For updating a product
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    tag: Optional[str] = None
    image_url: Optional[str] = None
    image_hover_url: Optional[str] = None
    compare_at_price: Optional[float] = None
    aesthetic_tag: Optional[str] = None


# For returning product data
class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
