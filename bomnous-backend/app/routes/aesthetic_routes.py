"""Public browse routes under /products (not /api/products)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Product
from app.product_search import ALLOWED_AESTHETIC_TAGS, search_products_public
from app.schemas.product import ProductResponse

router = APIRouter(prefix="/products", tags=["Products — browse"])

@router.get("/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id).all()


@router.get("/trending", response_model=list[ProductResponse])
def trending_this_week(db: Session = Depends(get_db)):
    # Simple MVP: sort by views_count DESC, prefer items created in last 7 days when available.
    # (views_count is a basic counter; we can evolve to an events table later.)
    try:
        from datetime import datetime, timedelta

        cutoff = datetime.utcnow() - timedelta(days=7)
        recent = (
            db.query(Product)
            .filter(Product.created_at >= cutoff)
            .order_by(Product.views_count.desc(), Product.id.desc())
            .limit(12)
            .all()
        )
        if recent:
            return recent
    except Exception:
        pass
    return db.query(Product).order_by(Product.views_count.desc(), Product.id.desc()).limit(12).all()


@router.get("/aesthetic/{tag}", response_model=list[ProductResponse])
def list_products_by_aesthetic(tag: str, db: Session = Depends(get_db)):
    if tag not in ALLOWED_AESTHETIC_TAGS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid aesthetic tag. Allowed: {', '.join(sorted(ALLOWED_AESTHETIC_TAGS))}",
        )
    return db.query(Product).filter(Product.aesthetic_tag == tag).order_by(Product.id).all()


@router.get("/search", response_model=list[ProductResponse])
def search_products(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, max_length=120),
    category: str | None = Query(default=None, max_length=40),
    aesthetic: str | None = Query(default=None, max_length=40),
    tag: str | None = Query(default=None, max_length=40),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort: str | None = Query(default=None, max_length=30),
    limit: int = Query(default=200, ge=1, le=500),
):
    """GET /products/search — same behavior as GET /api/products/search (legacy path)."""
    return search_products_public(
        db,
        q=q,
        category=category,
        aesthetic=aesthetic,
        tag=tag,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        limit=limit,
    )
