from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal, get_db
from app.schemas.shop import ShopCreate, ShopResponse, ShopUpdate
from app.models import Shop, User
from app.utils.security import get_current_user



router = APIRouter(prefix="/shops", tags=["Shops"])


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
    
    new_shop = Shop(**shop.model_dump())
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    return new_shop


# GET ALL SHOPS
@router.get("/", response_model=list[ShopResponse])
def get_all_shops(db: Session = Depends(get_db)):
    return db.query(Shop).all()


# GET SHOP BY ID
@router.get("/{shop_id}", response_model=ShopResponse)
def get_shop(shop_id: int, db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop


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
