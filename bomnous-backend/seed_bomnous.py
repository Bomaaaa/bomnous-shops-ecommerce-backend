#!/usr/bin/env python3
"""
Seed Bomnous with 4 seller shops and a full catalog of products (categories, aesthetics, tags).

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

# Remote fashion photography (Unsplash / Pexels) — main + hover
_GOOD = [
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1441986300917-64664a580a2c?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78a?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617137968427-85924c2a5504?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900&auto=format&fit=crop",
    "https://images.pexels.com/photos/985285/pexels-photo-985285.jpeg?w=900",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6c2e4?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560769629-975b94a02729?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503341455253-b2b723a3d2a1?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1601925260368-8822a6e5c6d6?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583743814966-8936f0d5e4d5?w=900&auto=format&fit=crop",
    "https://images.pexels.com/photos/6311666/pexels-photo-6311666.jpeg?w=900",
    "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?w=900&h=1200&fit=crop",
]


def _img_pair(i: int) -> tuple[str, str | None]:
    a = _GOOD[(i - 1) % len(_GOOD)]
    b = _GOOD[i % len(_GOOD)]
    return a, b if a != b else b


def seed(db: Session) -> None:
    if db.query(Product).count() > 0:
        print("Seed skipped: products table is not empty.")
        return

    pwd = hash_password("demo12345")

    # (username, email) per shop owner — order matches shop index 0..3
    owner_specs: list[tuple[str, str, str, str]] = [
        ("zara_lefkos_seller", "zara.lefkosa@bomnous.test", "Zara Lefkoşa", "Lefkoşa"),
        ("urban_thread_seller", "urban.thread@bomnous.test", "Urban Thread", "Gazimağusa"),
        ("little_luxe_seller", "little.luxe@bomnous.test", "Little Luxe", "Girne"),
        ("aso_ebi_seller", "asoebi.house@bomnous.test", "Aso-Ebi House", "Lefkoşa"),
    ]

    shops: list[Shop] = []
    for username, email, shop_name, location in owner_specs:
        user = User(username=username, email=email, hashed_password=pwd, role="seller")
        db.add(user)
        db.flush()
        shop = Shop(name=shop_name, location=location, owner_id=user.id)
        db.add(shop)
        db.flush()
        shops.append(shop)

    shop_by_name = {s.name: s for s in shops}

    # 30 products: name, price, stock, category, tag, aesthetic, shop_name, compare_at, description
    TREND, DROP, PICKS = "trending", "just-dropped", "editors-picks"

    rows: list[dict] = [
        # Zara Lefkoşa — women's + accessories (8)
        {
            "name": "Camel Wool Wrap Skirt",
            "price": 88.0,
            "stock": 22,
            "category": "women",
            "tag": TREND,
            "aesthetic": "soft-luxury",
            "shop": "Zara Lefkoşa",
            "compare": 105.0,
            "description": "Buttery hand-feel in a clean midi length, cut to skim the hips and pool gently at the calf. Layer with knits for North Cyprus winter evenings or a silk cami when the light stays golden longer.",
        },
        {
            "name": "Midnight Satin Bias Midi",
            "price": 128.0,
            "stock": 18,
            "category": "women",
            "tag": DROP,
            "aesthetic": "event-ready",
            "shop": "Zara Lefkoşa",
            "compare": 158.0,
            "description": "A fluid bias-cut slip that catches candlelight with every turn—perfect for gallery openings in old-town Lefkoşa or a reservations-only dinner. Adjustable straps, concealed side zip, lined bodice for confidence.",
        },
        {
            "name": "Ivory Ribbed Knit Shell",
            "price": 42.0,
            "stock": 40,
            "category": "women",
            "tag": PICKS,
            "aesthetic": "smart-casual",
            "shop": "Zara Lefkoşa",
            "compare": None,
            "description": "Your everyday “quiet luxury” layer: dense rib, slightly cropped, reads polished under a blazer or alone with high-rise denim. Washes beautifully without losing its shape—made for repeat wears.",
        },
        {
            "name": "Black Tweed Event Shift",
            "price": 168.0,
            "stock": 14,
            "category": "women",
            "tag": TREND,
            "aesthetic": "event-ready",
            "shop": "Zara Lefkoşa",
            "compare": 199.0,
            "description": "Mini-length tweed with subtle metallic thread—structured but never stiff. Pair with sheer tights and a pointed heel, or break the formality with chunky loafers. Feels at home at cultural fundraisers and after-dark rooftops.",
        },
        {
            "name": "18k Gold-Plated Hoop Trio",
            "price": 38.0,
            "stock": 60,
            "category": "accessories",
            "tag": TREND,
            "aesthetic": "soft-luxury",
            "shop": "Zara Lefkoşa",
            "compare": 48.0,
            "description": "Three graduated hoops for mix-and-match styling—hollow-core so they stay light on the ear. Warm gold tone that flatters a range of skin tones. Comes in a soft travel pouch, gift-ready.",
        },
        {
            "name": "Cognac Structured Day Tote",
            "price": 112.0,
            "stock": 25,
            "category": "accessories",
            "tag": DROP,
            "aesthetic": "smart-casual",
            "shop": "Zara Lefkoşa",
            "compare": 135.0,
            "description": "A relaxed structured silhouette with a relaxed grab handle and optional shoulder strap. Fits a laptop, water bottle, and a light scarf. Pebbled finish hides everyday scuffs; interior slip pockets keep keys findable.",
        },
        {
            "name": "Dusty Rose Italian Silk Scarf 90",
            "price": 64.0,
            "stock": 33,
            "category": "accessories",
            "tag": PICKS,
            "aesthetic": "soft-luxury",
            "shop": "Zara Lefkoşa",
            "compare": None,
            "description": "A generous square in washed rose—drape it at the neck, thread through bag handles, or wear as a soft headwrap on breezy Girne promenades. The print is an abstract terrazzo, subtle enough to pair with workwear or linen.",
        },
        {
            "name": "Tortoiseshell Oversize Sunglasses",
            "price": 52.0,
            "stock": 45,
            "category": "accessories",
            "tag": TREND,
            "aesthetic": "event-ready",
            "shop": "Zara Lefkoşa",
            "compare": 68.0,
            "description": "Oversize acetate with UV400 lenses and a flattering lifted browline. A modern classic that makes tired eyes look like a styling choice, not a schedule. Includes a slim hard case and cleaning cloth.",
        },
        {
            "name": "Calf-Hair & Leather Reversible Belt",
            "price": 46.0,
            "stock": 30,
            "category": "accessories",
            "tag": DROP,
            "aesthetic": "smart-casual",
            "shop": "Zara Lefkoşa",
            "compare": 58.0,
            "description": "Reversible: smooth black leather one side, tonal calf-hair the other. Polished double-prong hardware. Cuts a clean line through suiting, denim, or a wrap dress—an instant outfit anchor.",
        },
        # Urban Thread — men's & street (7), Gazimağusa, no accessories
        {
            "name": "Heavyweight Fleece Street Hoodie",
            "price": 72.0,
            "stock": 50,
            "category": "men",
            "tag": TREND,
            "aesthetic": "smart-casual",
            "shop": "Urban Thread",
            "compare": 89.0,
            "description": "Densely knit fleece with a dropped shoulder and a generous hood. Built for coastal evenings in Gazimağusa—soft inside, clean outside. Ribbed hem and cuffs keep the silhouette intentional, not slouchy.",
        },
        {
            "name": "Relaxed Tapered Cargo (Stone)",
            "price": 98.0,
            "stock": 35,
            "category": "men",
            "tag": DROP,
            "aesthetic": "event-ready",
            "shop": "Urban Thread",
            "compare": None,
            "description": "Tonal utility pockets sit flush for a city-ready line—pair with a crisp white tee and leather sneakers for a dinner that leans modern without trying too hard. Mid-weight cotton twill with a touch of stretch.",
        },
        {
            "name": "Monochrome Archive Graphic Tee",
            "price": 32.0,
            "stock": 80,
            "category": "men",
            "tag": TREND,
            "aesthetic": "soft-luxury",
            "shop": "Urban Thread",
            "compare": 42.0,
            "description": "Soft ringspun cotton with a washed feel from day one. Tonal graphic, slightly oversized—tucks neatly or billows out over cargos. The kind of tee you reach for on repeat, wash after wash.",
        },
        {
            "name": "Technical Black City Parka",
            "price": 198.0,
            "stock": 20,
            "category": "men",
            "tag": PICKS,
            "aesthetic": "event-ready",
            "shop": "Urban Thread",
            "compare": 245.0,
            "description": "Streamlined parka with water-repellent shell, hidden placket, and a collar that stands when you need presence. Lined, not puffy—sharp enough to wear over a blazer, relaxed enough for weekend promenades.",
        },
        {
            "name": "Vintage Wash Selvedge Jeans",
            "price": 108.0,
            "stock": 28,
            "category": "men",
            "tag": TREND,
            "aesthetic": "smart-casual",
            "shop": "Urban Thread",
            "compare": None,
            "description": "A straight-leaning cut with a gentle fade hand-finished in small batch. Sits at the true waist, breaks clean over a low-top sneaker. Durable enough for real life, soft enough for the first wear.",
        },
        {
            "name": "Quarter-Zip Fleece Pullover (Bone)",
            "price": 84.0,
            "stock": 32,
            "category": "men",
            "tag": PICKS,
            "aesthetic": "soft-luxury",
            "shop": "Urban Thread",
            "compare": 99.0,
            "description": "Micro-fleece with a refined drape, warm without bulk. Collar zips to a stand that frames the face. Soft enough to live in after campus days or early ferry rides—an elevated basic that reads intentional.",
        },
        {
            "name": "Perforated Leather Court Sneaker",
            "price": 118.0,
            "stock": 24,
            "category": "men",
            "tag": TREND,
            "aesthetic": "event-ready",
            "shop": "Urban Thread",
            "compare": 145.0,
            "description": "Minimal low-profile sole, supple leather, subtle perforation for breath. Dresses up with cropped trousers, dresses down with joggers. A versatile anchor for the man who lives between meetings and music nights.",
        },
        # Little Luxe — children (6), soft luxury, Girne, no accessories
        {
            "name": "Pima Cotton Henley & Short Set",
            "price": 48.0,
            "stock": 40,
            "category": "children",
            "tag": DROP,
            "aesthetic": "smart-casual",
            "shop": "Little Luxe",
            "compare": 59.0,
            "description": "Breathable pima in a two-piece set that feels as soft as sleepwear but looks day-ready. Pearl snaps, gentle stretch at the neck—parent-approved for beach-town mornings in Girne.",
        },
        {
            "name": "Merino Ruffle Playsuit (Cloud)",
            "price": 56.0,
            "stock": 28,
            "category": "children",
            "tag": TREND,
            "aesthetic": "soft-luxury",
            "shop": "Little Luxe",
            "compare": 68.0,
            "description": "A whisper of merino-blend knit, delicate ruffle at the shoulder, snaps for quick changes. Temperature-regulating in spring breezes, cozy in air-conditioned playrooms. Machine-wash on delicate; lay flat to dry.",
        },
        {
            "name": "Tulle Garden Party Dress (Blush)",
            "price": 64.0,
            "stock": 22,
            "category": "children",
            "tag": TREND,
            "aesthetic": "event-ready",
            "shop": "Little Luxe",
            "compare": 79.0,
            "description": "Layered soft tulle with a cotton-linen lining so nothing itches. Perfect for name-day celebrations and family portraits—moves with twirls, photographs like a dream. Satin bow at the back is fully tacked for safety.",
        },
        {
            "name": "Linen Sailor Knit Romper (Navy Stripe)",
            "price": 44.0,
            "stock": 35,
            "category": "children",
            "tag": PICKS,
            "aesthetic": "smart-casual",
            "shop": "Little Luxe",
            "compare": None,
            "description": "A coastal classic with shoulder buttons and leg snaps. Lightweight linen-cotton blend keeps small adventurers cool. Pair with a sun hat and tiny boat shoes for a yacht-day look without the fuss.",
        },
        {
            "name": "Hooded Cashmere Cardigan (Oat)",
            "price": 92.0,
            "stock": 18,
            "category": "children",
            "tag": TREND,
            "aesthetic": "soft-luxury",
            "shop": "Little Luxe",
            "compare": 110.0,
            "description": "Featherlight cashmere blend, relaxed hood, wooden buttons. The layer you hand down because it only gets better. Gentle cycle or hand-wash; invest in a mesh bag to protect the knit for seasons to come.",
        },
        {
            "name": "Velvet Smocked Party Dress (Forest)",
            "price": 58.0,
            "stock": 26,
            "category": "children",
            "tag": TREND,
            "aesthetic": "event-ready",
            "shop": "Little Luxe",
            "compare": 72.0,
            "description": "Deep green stretch velvet with a smocked bodice that flexes with growth. Tea-length, twirl-weight—ideal for recitals and Eid open houses. Fully lined, hidden zipper with a grosgrain pull a little hand can find.",
        },
        # Aso-Ebi House — West African & diaspora pieces (9), Lefkoşa, mostly cultural-blend
        {
            "name": "Royal Agbada Three-Piece Set (Indigo & Silver)",
            "price": 225.0,
            "stock": 10,
            "category": "men",
            "tag": TREND,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": 250.0,
            "description": "Statement embroidery on flowing cotton, tailored inner robe, and a generous outer layer that moves with purpose. Worn for weddings, naming days, and community homecomings—serves the North Cyprus African diaspora with respect and style.",
        },
        {
            "name": "Emerald Aso-Ebi Five-Piece Lace & Wrap Set",
            "price": 198.0,
            "stock": 8,
            "category": "women",
            "tag": PICKS,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": 235.0,
            "description": "Lace in layers, designed for the guest who leads the aso-ebi line. Cool greens flatter a range of undertones; the wrap panel can be styled to taste. Dry clean before first wear to set the drape; steam gently.",
        },
        {
            "name": "Amber Ankara Mermaid Gown (Custom Fit)",
            "price": 165.0,
            "stock": 12,
            "category": "women",
            "tag": TREND,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": None,
            "description": "A vibrant wax-print story in fitted bodice and flared mermaid—made for the dance floor at hall receptions. Pair with a gele from our headwrap range or a sleek up-do; alter locally for a precision hem.",
        },
        {
            "name": "Charcoal Boubou Robe (Hand-Tacked Trim)",
            "price": 142.0,
            "stock": 11,
            "category": "women",
            "tag": DROP,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": 175.0,
            "description": "Floor-skimming flow with a subtle V and contrast trim picked by our atelier. Dress it up with heels or ground it with flat sandals. Cotton-rich blend breathes in warm Lefkoşa nights—elegant without ceremony-only stiffness.",
        },
        {
            "name": "Gold-Print Short-Sleeve Dashiki",
            "price": 68.0,
            "stock": 20,
            "category": "men",
            "tag": DROP,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": 85.0,
            "description": "A relaxed celebration shirt with authentic geometry in metallic gold on deep ink. Pairs with slim trousers for parties or linen shorts for a harbor-side iftar gathering. Generous cut; size down for a neater line.",
        },
        {
            "name": "Sunset Gele (Pre-Pleated Ready Tie)",
            "price": 35.0,
            "stock": 45,
            "category": "accessories",
            "tag": PICKS,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": 44.0,
            "description": "A structured, photo-ready headwrap in ombré sunset—pre-pleated for faster styling while still looking couture. Comes with a video QR for drape options. A celebration staple for the diaspora bride squad on both sides of the line.",
        },
        {
            "name": "Coral Glass Bead Layered Statement Necklace",
            "price": 45.0,
            "stock": 38,
            "category": "accessories",
            "tag": TREND,
            "aesthetic": "soft-luxury",
            "shop": "Aso-Ebi House",
            "compare": 58.0,
            "description": "Hand-strung graduated beads with a gold-tone clasp. Layer over necklines of lace, boubou, or a simple white tee to bridge heritage and high street. Lightweight enough for all-night wear, bold enough to carry the look.",
        },
        {
            "name": "Glass Waist-Bead Strand (Adjustable Tie)",
            "price": 18.0,
            "stock": 70,
            "category": "accessories",
            "tag": DROP,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": 24.0,
            "description": "Color-rich seed beads on cotton cord—tie to fit, mix with other strands, gift to a new mum or a new chapter. A quiet nod to tradition that sits as comfortably under a gown as over swim at a private beach club.",
        },
        {
            "name": "Ankara Tote with Leather Handles (Lagos Teal)",
            "price": 55.0,
            "stock": 30,
            "category": "accessories",
            "tag": TREND,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": 69.0,
            "description": "A structured rectangular tote in bold teal wax print, lined in cotton, with bridle-inspired leather handles. Folds flat for a suitcase, opens wide for a weekend market. Celebrates the pattern—wear it like a flex, carry it with pride.",
        },
        {
            "name": "Aso-Éyì Choker (Ivory & Gold Beads)",
            "price": 15.0,
            "stock": 55,
            "category": "accessories",
            "tag": PICKS,
            "aesthetic": "cultural-blend",
            "shop": "Aso-Ebi House",
            "compare": 22.0,
            "description": "A delicate collar of ivory seeds and faceted gold-tone accents—sits at the true neckline for iro & buba, slip dresses, or a crisp shirt. A finishing touch for registry portraits and the warm receiving line that follows.",
        },
    ]

    n_products = len(rows)
    for idx, spec in enumerate(rows, start=1):
        shop = shop_by_name[spec["shop"]]
        img, hover = _img_pair(idx)
        p = Product(
            name=spec["name"],
            description=spec.get("description"),
            price=spec["price"],
            stock=spec["stock"],
            category=spec["category"],
            tag=spec["tag"],
            aesthetic_tag=spec["aesthetic"],
            image_url=img,
            image_hover_url=hover,
            compare_at_price=spec.get("compare"),
            shop_id=shop.id,
            seller_id=shop.owner_id,
        )
        db.add(p)

    db.commit()
    print(
        f"Seeded {n_products} products across 4 shops "
        "(Zara Lefkoşa, Urban Thread, Little Luxe, Aso-Ebi House)."
    )


def main() -> None:
    os.chdir(ROOT)
    db = SessionLocal()
    try:
        seed(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
