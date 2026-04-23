from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    aesthetic_routes,
    shop_routes,
    product_routes,
    order_routes,
    user_routes,
    auth_routes,
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Bomnous Shops Backend is running!🚀"}


app.include_router(shop_routes.router)
app.include_router(aesthetic_routes.router)
app.include_router(product_routes.router)
app.include_router(order_routes.router)
app.include_router(user_routes.router)
app.include_router(auth_routes.router)


