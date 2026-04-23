from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal, get_db
from app.models import Product, User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.utils.security import get_current_user



router = APIRouter(prefix="/api/products", tags=["Products"])



# CREATE PRODUCT
@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db),  current_user: User = Depends(get_current_user)):

      # Role check
    if current_user.role != "seller":
        raise HTTPException(
            status_code=403,
            detail="Only sellers can create products"
        )
    
    new_product = Product(**product.model_dump(), seller_id=current_user.id)
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


# GET ALL PRODUCTS
@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

# Sellers can see only their products
@router.get("/my-products", response_model=list[ProductResponse])
def get_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "seller":
        raise HTTPException(
            status_code=403,
            detail="Only sellers can view their products"
        )

    products = db.query(Product).filter(Product.seller_id == current_user.id).all()

    return products


# GET PRODUCT BY ID
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# UPDATE PRODUCT
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db),  current_user: User = Depends(get_current_user)):
    existing_product = db.query(Product).filter(Product.id == product_id).first()
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    #  Only sellers can update
    if current_user.role != "seller":
        raise HTTPException(
            status_code=403,
            detail="Only sellers can update products"
        )

    # Seller must own the product
    if existing_product.seller_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this product"
        )

    update_data = product.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(existing_product, key, value)

    db.commit()
    db.refresh(existing_product)
    return existing_product


# DELETE PRODUCT
@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db),  current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
      # Only sellers can delete
    if current_user.role != "seller":
        raise HTTPException(
            status_code=403,
            detail="Only sellers can delete products"
        )

    # Must own product
    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this product"
        )

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


