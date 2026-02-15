from fastapi import FastAPI
from app.routes import shop_routes, product_routes, order_routes, user_routes, auth_routes


app = FastAPI()

@app.get("/")
def home():
    return {"message": "Bomnous Shops Backend is running!🚀"}


app.include_router(shop_routes.router)
app.include_router(product_routes.router)
app.include_router(order_routes.router)
app.include_router(user_routes.router)
app.include_router(auth_routes.router)


