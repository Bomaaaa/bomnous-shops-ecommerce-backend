"""Shared product search query for /products/search and /api/products/search."""

import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import and_, case, desc, func, literal, or_
from sqlalchemy.orm import Session

from app.models import Product, Shop
from app.schemas.product import ProductResponse

ALLOWED_AESTHETIC_TAGS = frozenset(
    {"soft-luxury", "event-ready", "smart-casual", "cultural-blend"}
)

# Everyday search words → catalog vocabulary (name/description ILIKE OR expansion).
SYNONYMS: dict[str, list[str]] = {
    "bags": ["tote", "bag", "pouch", "clutch", "handbag"],
    "bag": ["tote", "bag", "pouch", "clutch", "handbag"],
    "shoes": ["sneaker", "court", "boot", "heel", "loafer"],
    "dress": ["gown", "midi", "shift", "playsuit", "romper"],
    "dresses": ["gown", "midi", "shift", "playsuit", "romper"],
    "trousers": ["cargo", "jeans", "pants", "chino"],
    "pants": ["cargo", "jeans", "trousers", "chino"],
    "top": ["shell", "tee", "knit", "henley", "hoodie", "pullover"],
    "tops": ["shell", "tee", "knit", "henley", "hoodie", "pullover"],
    "scarf": ["scarf", "wrap", "gele"],
    "headwrap": ["gele", "scarf", "wrap"],
    "jewelry": ["necklace", "earring", "hoop", "choker", "bead"],
    "jewellery": ["necklace", "earring", "hoop", "choker", "bead"],
    "necklace": ["necklace", "choker", "bead", "strand"],
    "earrings": ["hoop", "earring", "stud"],
    "belt": ["belt", "strap"],
    "jacket": ["parka", "jacket", "coat"],
    "skirt": ["skirt", "wrap", "midi"],
    "shirt": ["tee", "dashiki", "henley", "shell"],
    "african": ["ankara", "agbada", "dashiki", "boubou", "aso-ebi", "gele"],
    "kids": ["children", "baby", "girl", "boy", "tulle", "romper"],
    "children": ["children", "baby", "kids", "tulle", "romper", "playsuit"],
}


def _escape_ilike_fragment(fragment: str) -> str:
    """Escape % and _ so user input cannot broaden a LIKE pattern."""
    return fragment.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _like_needle(fragment: str) -> str:
    return f"%{_escape_ilike_fragment(fragment)}%"


def _prefix_needle(fragment: str) -> str:
    return f"{_escape_ilike_fragment(fragment)}%"


def _token_variants(token: str) -> list[str]:
    """
    Return the raw token plus simple English-ish singular/plural relaxations
    so queries like "dresses" also match rows containing "dress".
    """
    raw = token.strip()
    if len(raw) < 1:
        return []
    if len(raw) < 2:
        return [raw]
    variants: list[str] = [raw]
    t = raw.lower()

    stem: str | None = None
    if len(t) >= 5 and t.endswith("ies"):
        stem = raw[:-3] + "y"
    elif len(t) >= 6 and t.endswith("es"):
        stem = raw[:-2]
    elif len(t) >= 6 and t.endswith("s") and not t.endswith("ss"):
        stem = raw[:-1]

    if stem and stem.lower() != t:
        variants.append(stem)
    return variants


def _split_search_tokens(q: str) -> list[str]:
    """Split on whitespace; drop noise tokens."""
    parts = re.split(r"\s+", q.strip())
    return [p for p in parts if len(p) >= 2]


def _token_matches_any_field(token: str) -> Any:
    """
    Each search token must hit name, description, or tag (ILIKE + stem variants).

    Category / aesthetic are controlled via explicit filter params, not loose text
    matches — that cuts unrelated rows (e.g. belts) when searching product words
    like \"trousers\" that only appeared as a weak category-style match.
    """
    field_cols = (
        Product.name,
        Product.description,
        Product.tag,
    )
    needles: list[str] = []
    for v in _token_variants(token):
        needles.append(_like_needle(v))
    seen: set[str] = set()
    uniq_needles: list[str] = []
    for n in needles:
        if n not in seen:
            seen.add(n)
            uniq_needles.append(n)

    clauses: list[Any] = []
    for needle in uniq_needles:
        for col in field_cols:
            clauses.append(col.ilike(needle, escape="\\"))
    return or_(*clauses) if clauses else None


def _token_search_clause(token: str) -> Any:
    """
    If the token matches a SYNONYMS key, OR across each synonym value on `name` and
    `description` (ILIKE). Always OR with the normal token match (name/description/tag)
    so literal product copy still hits.
    """
    key = token.strip().lower()
    desc_coalesced = func.coalesce(Product.description, literal(""))
    syn_clauses: list[Any] = []

    if key in SYNONYMS:
        for v in SYNONYMS[key]:
            sv = (v or "").strip()
            if len(sv) < 1:
                continue
            n = _like_needle(sv)
            syn_clauses.append(Product.name.ilike(n, escape="\\"))
            syn_clauses.append(desc_coalesced.ilike(n, escape="\\"))

    direct = _token_matches_any_field(token)
    if syn_clauses:
        syn_or = or_(*syn_clauses)
        if direct is not None:
            return or_(syn_or, direct)
        return syn_or
    return direct


def _relevance_for_variant(variant: str) -> Any:
    """Integer score for one phrase variant (higher = more relevant)."""
    v = variant.strip()
    if not v:
        return literal(0)

    esc = _escape_ilike_fragment(v)
    needle = f"%{esc}%"
    prefix = f"{esc}%"
    vl = v.lower()

    desc_coalesced = func.coalesce(Product.description, literal(""))

    return (
        case((func.lower(Product.name) == literal(vl), 1_000_000), else_=0)
        + case((Product.name.ilike(prefix, escape="\\"), 500_000), else_=0)
        + case((Product.name.ilike(needle, escape="\\"), 250_000), else_=0)
        + case((desc_coalesced.ilike(needle, escape="\\"), 120_000), else_=0)
        + case((Product.tag.ilike(needle, escape="\\"), 60_000), else_=0)
        + case((Product.category.ilike(needle, escape="\\"), 25_000), else_=0)
        + case((Product.aesthetic_tag.ilike(needle, escape="\\"), 8_000), else_=0)
    )


def _combined_relevance_score(phrase: str) -> Any:
    """Greatest score across the raw phrase and simple singular/plural variants."""
    p = phrase.strip()
    if not p:
        return literal(0)
    variants = _token_variants(p) if len(p) >= 2 else [p]
    exprs = [_relevance_for_variant(v) for v in variants if v and v.strip()]
    if not exprs:
        return literal(0)
    if len(exprs) == 1:
        return exprs[0]
    return func.greatest(*exprs)


def search_products_public(
    db: Session,
    *,
    q: str | None = None,
    category: str | None = None,
    aesthetic: str | None = None,
    tag: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort: str | None = None,
    limit: int = 200,
) -> list[dict[str, Any]]:
    """
    - No `q` (or blank): return all products matching facet/price filters only (no text filter).
    - With `q`: AND across whitespace tokens. Each token uses `SYNONYMS` expansion on
      `name`/`description` when the token matches a key, ORed with the usual token match
      on name, description, and tag (ILIKE, escaped wildcards, stem variants).
    - With `q`: results ordered by relevance score (see `_relevance_for_variant`).
    """
    query = db.query(Product, Shop.name.label("shop_name")).join(Shop, Product.shop_id == Shop.id)

    q_stripped = (q or "").strip()
    has_text = bool(q_stripped)

    if has_text:
        tokens = _split_search_tokens(q_stripped)
        if not tokens:
            tokens = [q_stripped]
        token_clauses: list[Any] = []
        for tok in tokens:
            clause = _token_search_clause(tok)
            if clause is not None:
                token_clauses.append(clause)
        if token_clauses:
            query = query.filter(and_(*token_clauses))

    if category and category.strip().lower() != "all":
        query = query.filter(Product.category == category.strip().lower())

    if aesthetic and aesthetic.strip().lower() != "all":
        a = aesthetic.strip().lower()
        if a not in ALLOWED_AESTHETIC_TAGS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid aesthetic tag. Allowed: {', '.join(sorted(ALLOWED_AESTHETIC_TAGS))}",
            )
        query = query.filter(Product.aesthetic_tag == a)

    if tag and tag.strip().lower() != "all":
        query = query.filter(Product.tag == tag.strip().lower())

    if min_price is not None:
        query = query.filter(Product.price >= float(min_price))
    if max_price is not None:
        query = query.filter(Product.price <= float(max_price))

    s = (sort or "").strip().lower()
    rel = _combined_relevance_score(q_stripped) if has_text else literal(0)

    if has_text:
        if s in ("newest", "latest"):
            query = query.order_by(desc(rel), Product.created_at.desc(), Product.id.desc())
        else:
            query = query.order_by(desc(rel), Product.id.desc())
    elif s in ("newest", "latest"):
        query = query.order_by(Product.created_at.desc(), Product.id.desc())
    else:
        query = query.order_by(Product.id.desc())

    cap = max(1, min(int(limit), 500))
    rows = query.limit(cap).all()
    out: list[dict[str, Any]] = []
    for p, shop_name in rows:
        data = ProductResponse.model_validate(p).model_dump()
        data["shop_name"] = shop_name
        out.append(data)
    return out
