from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import search_products
from app.db import get_db
from app.schemas.product import ProductResponse
from app.schemas.search import SearchRequest


router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/", response_model=list[ProductResponse])
def search(data: SearchRequest, db: Session = Depends(get_db)):
    keyword = (data.keyword or "").strip()
    if not keyword:
        return []
    return search_products(db, keyword)

