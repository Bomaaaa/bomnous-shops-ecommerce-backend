from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    location = Column(String, nullable=False)
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False) 
    owner = relationship("User") 

    products = relationship("Product", back_populates="shop")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    category = Column(String, nullable=False, default="women", index=True)
    tag = Column(String, nullable=False, default="trending", index=True)
    image_url = Column(String, nullable=False, default="image/product-1-1.jpg")
    image_hover_url = Column(String, nullable=True)
    compare_at_price = Column(Float, nullable=True)
    aesthetic_tag = Column(String, nullable=False, default="soft-luxury", index=True)

    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id")) 

    shop = relationship("Shop", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, server_default="buyer")

    orders = relationship("Order", back_populates="user")



class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    total_price = Column(Float, nullable=False, default=0.0)


    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
