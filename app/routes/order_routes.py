from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal, get_db
from app.utils.security import get_current_user
from app.models import User
import app.crud as crud


router = APIRouter(prefix="/orders", tags=["Orders"])



@router.post("/")
def create_order(db: Session = Depends(get_db),  current_user: User = Depends(get_current_user)):
    return crud.create_order(db, current_user.id)


@router.post("/{order_id}/add")
def add_product(order_id: int, product_id: int, quantity: int, db: Session = Depends(get_db),  current_user: User = Depends(get_current_user)):
    return crud.add_product_to_order(db, order_id, product_id, quantity)


@router.get("/{order_id}/receipt")
def get_receipt(order_id: int, db: Session = Depends(get_db),  current_user: User = Depends(get_current_user)):
    return crud.get_order_details(db, order_id)
