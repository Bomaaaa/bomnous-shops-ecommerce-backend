"""Public browse routes under /products (not /api/products)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Product
from app.schemas.product import ProductResponse

router = APIRouter(prefix="/products", tags=["Products — browse"])

ALLOWED_AESTHETIC_TAGS = frozenset(
    {"soft-luxury", "event-ready", "smart-casual", "cultural-blend"}
)


@router.get("/aesthetic/{tag}", response_model=list[ProductResponse])
def list_products_by_aesthetic(tag: str, db: Session = Depends(get_db)):
    if tag not in ALLOWED_AESTHETIC_TAGS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid aesthetic tag. Allowed: {', '.join(sorted(ALLOWED_AESTHETIC_TAGS))}",
        )
    return db.query(Product).filter(Product.aesthetic_tag == tag).order_by(Product.id).all()
