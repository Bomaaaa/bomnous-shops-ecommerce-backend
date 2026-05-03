#!/usr/bin/env python3
"""
Update Bomnous product images using the Pexels API.

Run from your backend root:
  cd bomnous-backend
  conda activate bomnous-ai-shop
  python update_product_images.py
"""

import os
import sys
import time
import requests

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from app.db import SessionLocal
from app.models import Product

PEXELS_API_KEY = "a9W8GYNbFLEKt9QnE63ryPyHyio0RMNhOM4FIMQWfV6H7lzbrjEddE9f"
PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"

HEADERS = {
    "Authorization": PEXELS_API_KEY
}

# Custom search queries per product name for best results
CUSTOM_QUERIES = {
    "Camel Wool Wrap Skirt":                        "women camel wool midi skirt fashion",
    "Midnight Satin Bias Midi":                     "women satin slip dress evening fashion",
    "Ivory Ribbed Knit Shell":                      "women ribbed knit top ivory fashion",
    "Black Tweed Event Shift":                      "women black tweed dress fashion",
    "18k Gold-Plated Hoop Trio":                    "gold hoop earrings jewelry",
    "Cognac Structured Day Tote":                   "cognac leather tote bag fashion",
    "Dusty Rose Italian Silk Scarf 90":             "silk scarf rose women fashion",
    "Tortoiseshell Oversize Sunglasses":            "tortoiseshell oversized sunglasses fashion",
    "Calf-Hair & Leather Reversible Belt":          "leather belt fashion accessory",
    "Heavyweight Fleece Street Hoodie":             "men oversized hoodie streetwear",
    "Relaxed Tapered Cargo (Stone)":                "men stone cargo pants street fashion",
    "Monochrome Archive Graphic Tee":               "men graphic tee oversized streetwear",
    "Technical Black City Parka":                   "men black city parka jacket fashion",
    "Vintage Wash Selvedge Jeans":                  "men selvedge jeans denim fashion",
    "Quarter-Zip Fleece Pullover (Bone)":           "men quarter zip pullover fleece",
    "Perforated Leather Court Sneaker":             "men leather court sneaker minimal",
    "Pima Cotton Henley & Short Set":               "children cotton outfit set kids fashion",
    "Merino Ruffle Playsuit (Cloud)":               "baby girl ruffle playsuit soft knit",
    "Tulle Garden Party Dress (Blush)":             "girl blush tulle party dress kids",
    "Linen Sailor Knit Romper (Navy Stripe)":       "children navy stripe linen romper kids",
    "Hooded Cashmere Cardigan (Oat)":               "children oat cashmere cardigan soft",
    "Velvet Smocked Party Dress (Forest)":          "girl green velvet smocked dress kids",
    "Royal Agbada Three-Piece Set (Indigo & Silver)": "african agbada men traditional fashion",
    "Emerald Aso-Ebi Five-Piece Lace & Wrap Set":  "african lace aso ebi women fashion",
    "Amber Ankara Mermaid Gown (Custom Fit)":       "ankara print mermaid gown african fashion",
    "Charcoal Boubou Robe (Hand-Tacked Trim)":      "african boubou robe women fashion",
    "Gold-Print Short-Sleeve Dashiki":              "men dashiki african print shirt",
    "Sunset Gele (Pre-Pleated Ready Tie)":          "african gele headwrap women",
    "Coral Glass Bead Layered Statement Necklace":  "coral bead layered necklace jewelry",
    "Glass Waist-Bead Strand (Adjustable Tie)":     "african waist beads colorful",
    "Ankara Tote with Leather Handles (Lagos Teal)":"ankara print tote bag african fashion",
    "Aso-Éyì Choker (Ivory & Gold Beads)":         "ivory gold bead choker necklace jewelry",
}


def search_pexels(query: str) -> tuple[str | None, str | None]:
    """Search Pexels and return (main_url, hover_url)."""
    try:
        response = requests.get(
            PEXELS_SEARCH_URL,
            headers=HEADERS,
            params={"query": query, "per_page": 5, "orientation": "portrait"},
            timeout=10
        )
        if response.status_code != 200:
            print(f"  ⚠️  Pexels error {response.status_code} for query: '{query}'")
            return None, None

        photos = response.json().get("photos", [])
        if not photos:
            print(f"  ⚠️  No results for query: '{query}'")
            return None, None

        main_url  = photos[0]["src"]["large"]
        hover_url = photos[1]["src"]["large"] if len(photos) > 1 else None
        return main_url, hover_url

    except Exception as e:
        print(f"  ❌ Exception for query '{query}': {e}")
        return None, None


def main():
    db = SessionLocal()
    try:
        products = db.query(Product).order_by(Product.id).all()
        print(f"Found {len(products)} products. Starting image update...\n")

        updated = 0
        skipped = 0

        for product in products:
            query = CUSTOM_QUERIES.get(product.name)

            if not query:
                # Fallback: build query from name + category
                query = f"{product.name} {product.category} fashion"

            print(f"[{product.id:02d}] {product.name}")
            print(f"      🔍 Query: {query}")

            main_url, hover_url = search_pexels(query)

            if main_url:
                product.image_url = main_url
                product.image_hover_url = hover_url
                print(f"      ✅ Updated")
                updated += 1
            else:
                print(f"      ⏭️  Skipped (no image found)")
                skipped += 1

            # Respect Pexels rate limit (200 req/hour = ~1 req per 18s to be safe)
            # But since we only have 32 products, a small delay is fine
            time.sleep(0.5)

        db.commit()
        print(f"\n🎉 Done! {updated} products updated, {skipped} skipped.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()