from pydantic import BaseModel
from typing import List


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    user_id: int
    items: List[OrderItemCreate]


class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: str
    total_price: float
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
