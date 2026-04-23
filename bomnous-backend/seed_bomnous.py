#!/usr/bin/env python3
"""
Seed Bomnous with 3 seller shops and 12+ products (mixed aesthetic_tag).

Run from backend root with DATABASE_URL set (e.g. in .env):
  cd bomnous-backend && python seed_bomnous.py

Skips if products already exist. To re-seed, delete products (and dependent rows) first
or use a fresh database.
"""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from sqlalchemy.orm import Session  # noqa: E402

from app.db import SessionLocal  # noqa: E402
from app.models import Product, Shop, User  # noqa: E402
from app.utils.security import hash_password  # noqa: E402


def _img(n: int) -> tuple[str, str | None]:
    i = ((n - 1) % 8) + 1
    return f"image/product-{i}-1.jpg", f"image/product-{i}-2.jpg"


def seed(db: Session) -> None:
    if db.query(Product).count() > 0:
        print("Seed skipped: products table is not empty.")
        return

    pwd = hash_password("demo12345")
    sellers: list[tuple[str, str, str, str]] = [
        ("nicosia_edit", "nicosia.edit@bomnous.test", "Nicosia Edit House", "North Cyprus"),
        ("lagos_lane", "lagos.lane@bomnous.test", "Lagos Lane Collective", "Lagos, Nigeria"),
        ("lisbon_thread", "lisbon.thread@bomnous.test", "Lisbon Thread Atelier", "Lisbon, Portugal"),
    ]

    shops: list[Shop] = []
    for username, email, shop_name, location in sellers:
        user = User(username=username, email=email, hashed_password=pwd, role="seller")
        db.add(user)
        db.flush()
        shop = Shop(name=shop_name, location=location, owner_id=user.id)
        db.add(shop)
        db.flush()
        shops.append(shop)

    rows: list[dict] = [
        # soft-luxury (3)
        {
            "name": "Ivory Silk Slip Dress",
            "price": 248.0,
            "stock": 12,
            "category": "women",
            "tag": "editors",
            "aesthetic_tag": "soft-luxury",
            "compare_at_price": 289.0,
        },
        {
            "name": "Cashmere Wrap Cardigan",
            "price": 198.0,
            "stock": 20,
            "category": "women",
            "tag": "trending",
            "aesthetic_tag": "soft-luxury",
            "compare_at_price": 230.0,
        },
        {
            "name": "Pearl Accent Evening Clutch",
            "price": 132.0,
            "stock": 30,
            "category": "accessories",
            "tag": "just-dropped",
            "aesthetic_tag": "soft-luxury",
            "compare_at_price": None,
        },
        # event-ready (3)
        {
            "name": "Structured Gala Midi",
            "price": 310.0,
            "stock": 8,
            "category": "women",
            "tag": "trending",
            "aesthetic_tag": "event-ready",
            "compare_at_price": 360.0,
        },
        {
            "name": "Midnight Tux Blazer",
            "price": 275.0,
            "stock": 10,
            "category": "men",
            "tag": "editors",
            "aesthetic_tag": "event-ready",
            "compare_at_price": 320.0,
        },
        {
            "name": "Crystal Strap Heels",
            "price": 189.0,
            "stock": 15,
            "category": "accessories",
            "tag": "trending",
            "aesthetic_tag": "event-ready",
            "compare_at_price": 220.0,
        },
        # smart-casual (3)
        {
            "name": "Tailored Linen Shirt",
            "price": 118.0,
            "stock": 40,
            "category": "men",
            "tag": "just-dropped",
            "aesthetic_tag": "smart-casual",
            "compare_at_price": 145.0,
        },
        {
            "name": "Relaxed Pleat Trousers",
            "price": 142.0,
            "stock": 25,
            "category": "women",
            "tag": "trending",
            "aesthetic_tag": "smart-casual",
            "compare_at_price": None,
        },
        {
            "name": "Minimal Leather Sneaker",
            "price": 165.0,
            "stock": 35,
            "category": "men",
            "tag": "editors",
            "aesthetic_tag": "smart-casual",
            "compare_at_price": 195.0,
        },
        # cultural-blend (3)
        {
            "name": "Adire-Inspired Maxi Skirt",
            "price": 156.0,
            "stock": 18,
            "category": "women",
            "tag": "editors",
            "aesthetic_tag": "cultural-blend",
            "compare_at_price": 188.0,
        },
        {
            "name": "Embroidered Festival Tunic",
            "price": 128.0,
            "stock": 22,
            "category": "women",
            "tag": "just-dropped",
            "aesthetic_tag": "cultural-blend",
            "compare_at_price": None,
        },
        {
            "name": "Heritage Bead Collar Necklace",
            "price": 96.0,
            "stock": 28,
            "category": "accessories",
            "tag": "trending",
            "aesthetic_tag": "cultural-blend",
            "compare_at_price": 120.0,
        },
    ]

    for idx, spec in enumerate(rows, start=1):
        shop = shops[idx % len(shops)]
        seller_id = shop.owner_id
        img, hover = _img(idx)
        p = Product(
            name=spec["name"],
            price=spec["price"],
            stock=spec["stock"],
            category=spec["category"],
            tag=spec["tag"],
            aesthetic_tag=spec["aesthetic_tag"],
            image_url=img,
            image_hover_url=hover,
            compare_at_price=spec["compare_at_price"],
            shop_id=shop.id,
            seller_id=seller_id,
        )
        db.add(p)

    db.commit()
    print(f"Seeded {len(rows)} products across {len(shops)} shops.")


def main() -> None:
    os.chdir(ROOT)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
