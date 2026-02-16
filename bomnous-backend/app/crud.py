from sqlalchemy.orm import Session
from app.models import  Shop
from app.models import Product
from app.models import Order, User, OrderItem
from app.schemas.shop import ShopCreate, ShopResponse
from fastapi import HTTPException


#-------------Shop CRUD operations-------------#
def create_shop(db: Session, shop: ShopCreate):
    db_shop = Shop(name=shop.name, location=shop.location)
    
    db.add(db_shop)
    db.commit()
    db.refresh(db_shop)
    return db_shop

def get_shops(db: Session):
    return db.query(Shop).all() 

#-------------Product CRUD operations-------------#
def create_product(db: Session, name: str, price: float, stock: int, shop_id: int):
    product = Product(name=name, price=price, stock=stock, shop_id=shop_id)
    db.add(product) #prepare to add the product to the database
    db.commit() #add the product to the database
    db.refresh(product)
    return product

def get_products_by_shop(db: Session, shop_id: int):
    return db.query(Product).filter(Product.shop_id == shop_id).all()


#-------------Order CRUD operations-------------#
def create_order(db: Session, user_id: int):

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    order = Order(user_id=user_id, total_price=0.0)

    db.add(order)
    db.commit()
    db.refresh(order)

    return order


# Add product to order

def add_product_to_order(db: Session, order_id: int, product_id: int, quantity: int):

    # 1️⃣ Check order exists
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # 2️⃣ Check product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 3️⃣ Validate quantity
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    # 4️⃣ Check stock
    if product.stock < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough stock available for {product.name}"
        )

    # 5️⃣ Check if product already exists in this order
    existing_item = (
        db.query(OrderItem)
        .filter(
            OrderItem.order_id == order_id,
            OrderItem.product_id == product_id
        )
        .first()
    )

    # 6️⃣ Deduct stock
    product.stock -= quantity

    if existing_item:
        # Update quantity
        existing_item.quantity += quantity
    else:
        # Create new order item
        new_item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            quantity=quantity
        )
        db.add(new_item)

    # 7️⃣ Update order total
    order.total_price = sum(
    item.product.price * item.quantity
    for item in order.items
)


    db.commit()
    db.refresh(order)

    return order


# Get order with products
def get_order_items(db: Session, order_id: int):
    return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

#Get products in an order
def get_products_in_order(db: Session, order_id: int):
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    return [(item.product.name, item.quantity) for item in items]


#Search for products by name
def search_products(db: Session, keyword: str):
    return db.query(Product).filter(Product.name.ilike(f"%{keyword}%")).all()


# generate digital receipt 
def get_order_details(db: Session, order_id: int):
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

    receipt = []
    total = 0

    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        line_total = product.price * item.quantity
        total += line_total

        receipt.append({
            "product": product.name,
            "price": product.price,
            "quantity": item.quantity,
            "line_total": line_total

        })

    return{
            "order_id": order_id,
            "items": receipt, 
            "total_cost": total 
        }
    
