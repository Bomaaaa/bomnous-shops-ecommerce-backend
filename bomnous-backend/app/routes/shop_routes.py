from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.db import SessionLocal, get_db
from app.schemas.product import ProductResponse
from app.schemas.shop import ShopCreate, ShopResponse, ShopUpdate
from app.models import Product, Shop, User
from app.utils.security import get_current_user



router = APIRouter(prefix="/shops", tags=["Shops"])

def _decode_categories(shop: Shop) -> None:
    if not getattr(shop, "categories", None):
        return
    if isinstance(shop.categories, list):
        return
    try:
        shop.categories = json.loads(shop.categories)
    except Exception:
        pass


# CREATE SHOP
@router.post("/", response_model=ShopResponse)
def create_shop(shop: ShopCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    
    # Only sellers can create shops
    if current_user.role != "seller":
        raise HTTPException(
            status_code=403,
            detail="Only sellers can create shops"
        )
    
    payload = shop.model_dump()
    if isinstance(payload.get("categories"), list):
        payload["categories"] = json.dumps(payload["categories"])
    new_shop = Shop(**payload, owner_id=current_user.id)
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    _decode_categories(new_shop)
    return new_shop

# Alias route for onboarding flow
@router.post("/create", response_model=ShopResponse)
def create_shop_alias(shop: ShopCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_shop(shop, db, current_user)


# GET ALL SHOPS
@router.get("/", response_model=list[ShopResponse])
def get_all_shops(db: Session = Depends(get_db)):
    shops = db.query(Shop).all()
    for s in shops:
        _decode_categories(s)
    return shops


@router.get("/new", response_model=list[ShopResponse])
def get_new_shops(db: Session = Depends(get_db)):
    shops = db.query(Shop).order_by(Shop.created_at.desc(), Shop.id.desc()).limit(8).all()
    for s in shops:
        _decode_categories(s)
    return shops

@router.get("/my", response_model=ShopResponse)
def get_my_shop(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can view their shop")
    shop = db.query(Shop).filter(Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found for this seller")
    # decode categories JSON into list for responses
    _decode_categories(shop)
    return shop


# GET SHOP BY ID
@router.get("/{shop_id}", response_model=ShopResponse)
def get_shop(shop_id: int, db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    _decode_categories(shop)
    return shop


@router.get("/{shop_id}/products", response_model=list[ProductResponse])
def get_shop_products(shop_id: int, db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return db.query(Product).filter(Product.shop_id == shop_id).order_by(Product.id).all()


# UPDATE SHOP
@router.put("/{shop_id}", response_model=ShopResponse)
def update_shop(shop_id: int, shop: ShopUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    existing_shop = db.query(Shop).filter(Shop.id == shop_id).first()

    if not existing_shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    
  
    if current_user.role != "seller":
        raise HTTPException(
            status_code=403,
            detail="Only sellers can update shops"
        )

    if existing_shop.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own shops"
        )

    update_data = shop.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(existing_shop, key, value)

    db.commit()
    db.refresh(existing_shop)

    return existing_shop


# DELETE SHOP
@router.delete("/{shop_id}")
def delete_shop(shop_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()

    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    if current_user.role != "seller":
        raise HTTPException(
            status_code=403,
            detail="Only sellers can delete shops"
        )

    if shop.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own shops"
        )


    db.delete(shop)
    db.commit()

    return {"message": "Shop deleted successfully"}
