import json
import os
import re
import urllib.error
import urllib.request
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db import get_db
from app.models import Product
from app.schemas.chat import ChatRequest, ChatResponse, ChatTurn


router = APIRouter(tags=["Chat"])


# --- RAG: same row slice is rendered as text (compact) and JSON (for the stylist persona) -----------------------------

_CATALOG_JSON_MAX_CHARS = 18_000


def _catalog_row_dicts(db: Session, message: str, limit: int = 80) -> list[dict[str, Any]]:
    """
    Relevant catalog slice for the user message. Shared by text + JSON prompt paths.
    Keep limits modest for Groq TPM.
    """
    keywords = _extract_keywords(message)
    q = db.query(
        Product.id,
        Product.name,
        Product.price,
        Product.category,
        Product.aesthetic_tag,
        Product.description,
        Product.image_url,
    )
    if keywords:
        clauses: list = []
        for kw in keywords:
            like = f"%{kw}%"
            clauses.extend(
                [
                    Product.name.ilike(like),
                    Product.description.ilike(like),
                    Product.category.ilike(like),
                    Product.aesthetic_tag.ilike(like),
                ]
            )
        q = q.filter(or_(*clauses))

    rows = q.order_by(Product.views_count.desc(), Product.created_at.desc(), Product.id.desc()).limit(limit).all()
    if not rows:
        rows = (
            db.query(
                Product.id,
                Product.name,
                Product.price,
                Product.category,
                Product.aesthetic_tag,
                Product.description,
                Product.image_url,
            )
            .order_by(Product.views_count.desc(), Product.created_at.desc(), Product.id.desc())
            .limit(limit)
            .all()
        )

    out: list[dict[str, Any]] = []
    for r in rows:
        desc = (r.description or "").strip().replace("\n", " ")
        if len(desc) > 220:
            desc = desc[:217] + "..."
        out.append(
            {
                "id": r.id,
                "name": r.name,
                "price": float(r.price),
                "category": r.category,
                "aesthetic_tag": r.aesthetic_tag,
                "description": desc,
                "image_url": r.image_url,
            }
        )
    return out


def _fetch_catalog_for_prompt(db: Session, message: str, limit: int = 80) -> str:
    """Line-oriented catalog for any legacy / debugging paths."""
    items = _catalog_row_dicts(db, message, limit)
    if not items:
        return "- (no products in catalog for this query)"
    lines: list[str] = []
    for d in items:
        raw = (d.get("description") or "").strip()
        desc = raw if len(raw) <= 90 else raw[:87] + "..."
        lines.append(
            f"- id={d['id']} | name={d['name']} | price=${float(d['price']):.2f} | category={d['category']} | "
            f"aesthetic_tag={d['aesthetic_tag']} | image_url={d['image_url']} | description={desc}"
        )
    return "\n".join(lines)


def _fetch_catalog_json_for_prompt(db: Session, message: str, limit: int = 80) -> str:
    items = _catalog_row_dicts(db, message, limit)
    s = json.dumps(items, ensure_ascii=True)
    while len(s) > _CATALOG_JSON_MAX_CHARS and len(items) > 5:
        items = items[:-1]
        s = json.dumps(items, ensure_ascii=True)
    if len(s) > _CATALOG_JSON_MAX_CHARS:
        s = s[: _CATALOG_JSON_MAX_CHARS] + "…"
    return s

def _extract_keywords(message: str) -> list[str]:
    words = re.findall(r"[a-zA-Z][a-zA-Z\-']+", (message or "").lower())
    stop = {
        "the",
        "and",
        "for",
        "with",
        "that",
        "this",
        "want",
        "need",
        "like",
        "look",
        "style",
        "wear",
        "going",
        "feel",
        "please",
        "budget",
        "price",
        "under",
        "over",
        "from",
        "into",
        "very",
        "more",
        "less",
        "month",
        "week",
        "today",
        "tomorrow",
        "graduation",
        "wedding",
    }
    out: list[str] = []
    for w in words:
        if len(w) < 3 or w in stop:
            continue
        if w not in out:
            out.append(w)
    return out[:10]


def _first_turn_prompt_block(username: str | None) -> str:
    if username and str(username).strip():
        n = str(username).strip()[:80]
        return (
            f"This is the user's FIRST message in this chat. Greet them warmly by name using “{n}” "
            "and introduce yourself as Bomnous, their personal stylist for Bomnous Shops. "
            "If they also ask a question in the same message, keep the greeting brief, then help.\n\n"
        )
    return (
        "This is the user's FIRST message in this chat. Greet them warmly and introduce yourself as Bomnous, "
        "their personal stylist. If the message includes a name (e.g. a “User name:” line), use it. "
        "If they ask a question too, greet then answer.\n\n"
    )


def _build_stylist_system_prompt(
    products_json: str,
    *,
    is_first_user_message: bool,
    username: str | None,
) -> str:
    first = _first_turn_prompt_block(username) if is_first_user_message else ""
    return (
        "You are Bomnous, the personal AI stylist for Bomnous Shops — a curated fashion marketplace in North Cyprus "
        "celebrating global, African, and European fashion.\n\n"
        "You are warm, stylish, encouraging and knowledgeable like a real personal stylist. You do not just list products — "
        "you BUILD outfits, explain WHY pieces work together, consider the occasion, body confidence, cultural context, and the user's vibe.\n\n"
        f"{first}"
        "HARD RULES (non-negotiable):\n"
        "- You are a stylist, not checkout. NEVER claim you placed an order, processed payment, created an order number, charged a card, sent an email, generated a confirmation code, shipped an order, or created tracking.\n"
        "- If the user asks you to checkout/pay/place the order, politely explain you can help them add items to cart and then they should complete checkout on the website/app.\n"
        "- You MAY say you can help them add an item to cart (or that the site can add it to cart), but do NOT invent backend actions.\n\n"
        "When recommending products from the catalog:\n"
        "- Recommend only items that exist in the JSON catalog below. Prefer exact product names. Recommend 2–3 products maximum per response — quality over quantity.\n"
        "- Always explain WHY you chose each piece.\n"
        "- Suggest how to style them together as a complete outfit.\n"
        "- Mention the occasion it suits.\n"
        "- Add a personal stylist touch — e.g. pair with nude heels for an elongated silhouette, or this print will photograph beautifully.\n"
        "- Be specific about colours, fabrics, and fit when you can.\n"
        "- If the user mentions a cultural event, lean into cultural fashion proudly and respectfully.\n"
        "- If budget is mentioned, always stay within it.\n"
        "- Include product names and prices from the catalog in your text.\n"
        "- End each recommendation with an encouraging closing line as a real stylist would.\n\n"
        "If the user says thank you, goodbye, done, or seems finished, close warmly, e.g.: "
        "It was absolutely my pleasure styling you today! You are going to look incredible. "
        "Come back to Bomnous anytime you need a fresh look. Happy shopping! ✨\n\n"
        "If asked if you are an AI, say exactly: I am Bomnous, your personal stylist — powered by a little AI magic ✨\n\n"
        "If no products match perfectly, be honest but suggest the closest options from the catalog and explain how to style them.\n"
        "You have deep knowledge of global fashion, colour theory, body types, styling, cultural fashion and current trends. Use that fully.\n\n"
        "Conversation flow — follow in order:\n"
        "1) If the user did NOT mention an occasion, ask: “What are you dressing for / what’s the occasion?” (give a few examples) and wait.\n"
        "2) If the user message is vague (e.g. only an occasion like “graduation”), ask for at least: budget range, and preferred colors (or colors to avoid). "
        "Then add ONE more useful question (modest vs bold OR heels vs flats). "
        "Do NOT recommend products until you have at least budget (unless the user explicitly says “just suggest”).\n"
        "3) If the user provides enough details, recommend quickly: give 2–3 specific products from the JSON catalog only.\n"
        "4) Ask at most ONE follow-up question after the recommendations (only if it materially improves the next picks).\n"
        "5) If the user says “just suggest” / “pick for me”, do NOT ask questions — just pick from the catalog and explain the vibe.\n\n"
        "Bomnous product catalog (JSON array):\n"
        f"{products_json}"
    )


def _looks_like_checkout_claim(text: str) -> bool:
    s = (text or "").lower()
    if not s:
        return False
    red_flags = [
        "order number",
        "confirmation code",
        "successfully processed",
        "payment method",
        "payment has been",
        "charged",
        "you'll receive an email",
        "tracking",
        "shipped within",
        "return policy",
        "processed your order",
        "checkout",
        "#bom",
    ]
    return any(k in s for k in red_flags)


def _sanitize_stylist_reply(text: str) -> str:
    """
    Defense-in-depth: if the model hallucinates checkout/order fulfillment, replace with a safe stylist response.
    """
    if not _looks_like_checkout_claim(text):
        return text
    return (
        "I can’t process checkout or create orders — I’m Bomnous, your personal stylist.\n\n"
        "What I *can* do is help you build the perfect outfit and help you add the right items to your cart. "
        "Once your cart is ready, you can complete checkout directly on Bomnous.\n\n"
        "Tell me the occasion + your budget + colours (or say “just suggest”), and I’ll style you with 2–3 perfect picks."
    )


def _local_stylist_reply(db: Session, message: str) -> str:
    """
    Local fallback if external AI providers are blocked.
    Still uses RAG (catalog query) and returns 2–3 specific products by name + price.
    """
    msg = (message or "").strip()
    has_occasion = bool(
        re.search(
            r"\b(graduation|wedding|dinner|date|party|birthday|work|office|interview|church|eid|holiday|vacation|brunch|casual|everyday|event)\b",
            msg,
            flags=re.IGNORECASE,
        )
    )
    has_budget = bool(re.search(r"(\$|usd|dollars|\\b\\d{2,4}\\b)", msg, flags=re.IGNORECASE))
    has_color = bool(
        re.search(
            r"\\b(black|white|ivory|cream|beige|nude|brown|tan|gold|silver|grey|gray|navy|blue|sky|teal|green|emerald|olive|pink|blush|rose|red|burgundy|wine|purple|lilac|lavender|plum|yellow|mustard|orange)\\b",
            msg,
            flags=re.IGNORECASE,
        )
    )

    if not has_occasion:
        return (
            "Absolutely — I can style you for anything. Quick question first: what are you dressing for / what’s the occasion?\n"
            "Examples: graduation, dinner, wedding, work/office, casual day out, birthday, date night."
        )

    # If the user is vague ("graduation") and hasn't shared budget/colors yet, ask guiding questions first.
    if not has_budget or not has_color:
        missing = []
        if not has_budget:
            missing.append("- Budget range? (e.g., under $80 / under $150 / under $250)")
        if not has_color:
            missing.append("- Preferred colors? (or colors to avoid)")
        missing.append("- Modest or bold?")
        missing.append("- Heels, flats, or both?")
        occasion_hint = "your look"
        m = re.search(r"\b(graduation|wedding|dinner|date|party|birthday|work|office|interview|church|eid|holiday|vacation|brunch|casual|everyday|event)\b", msg, flags=re.IGNORECASE)
        if m:
            occasion_hint = f"your {m.group(1).lower()} look"
        return (
            f"Love that — let’s style {occasion_hint}.\n\n"
            "Quick questions so I can recommend the perfect pieces:\n"
            + "\n".join(missing[:4])
        )

    keywords = _extract_keywords(msg)
    q = db.query(Product)
    if keywords:
        clauses = []
        for kw in keywords:
            like = f"%{kw}%"
            clauses.extend(
                [
                    Product.name.ilike(like),
                    Product.description.ilike(like),
                    Product.category.ilike(like),
                    Product.aesthetic_tag.ilike(like),
                ]
            )
        q = q.filter(or_(*clauses))

    items = (
        q.order_by(Product.views_count.desc(), Product.created_at.desc(), Product.id.desc())
        .limit(3)
        .all()
    )

    if not items:
        items = (
            db.query(Product)
            .order_by(Product.views_count.desc(), Product.created_at.desc(), Product.id.desc())
            .limit(3)
            .all()
        )

    rec_lines = []
    for p in items:
        rec_lines.append(f"- {p.name} — ${float(p.price):.2f}")

    recs = "\n".join(rec_lines) if rec_lines else "- (No products found yet)"
    return (
        "Okay — I’m going to make smart picks based on what you shared.\n\n"
        "Here are 2–3 Bomnous pieces I’d start with:\n"
        f"{recs}\n\n"
        "Quick question (so I can refine it perfectly): do you want the look to feel more modest or more bold?"
    )


def _call_groq(
    db: Session,
    message: str,
    history: list[ChatTurn] | None = None,
    *,
    is_first_user_message: bool = False,
    username: str | None = None,
) -> str | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    products_json = _fetch_catalog_json_for_prompt(db, message)
    system_prompt = _build_stylist_system_prompt(
        products_json,
        is_first_user_message=is_first_user_message,
        username=username,
    )

    payload = {
        "model": model_name,
        "temperature": 0.7,
        "max_tokens": 700,
        "messages": (
            [{"role": "system", "content": system_prompt}]
            + [
                {"role": t.role, "content": t.content}
                for t in (history or [])[-10:]
                if t and t.role in ("user", "assistant") and t.content
            ]
            + [{"role": "user", "content": message}]
        ),
    }

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {api_key}",
            "accept": "application/json",
            "user-agent": "BomnousShops/1.0 (+https://bomnous.local)",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            choices = data.get("choices") or []
            if not choices:
                return None
            msg = choices[0].get("message") or {}
            content = msg.get("content")
            return content.strip() if isinstance(content, str) else None
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = ""
        if e.code == 401:
            raise HTTPException(status_code=401, detail="Invalid GROQ_API_KEY (unauthorized).")
        if e.code == 400 and "model_decommissioned" in body:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Groq model is decommissioned. Set GROQ_MODEL in .env to a supported model like "
                    "'llama-3.1-8b-instant' or 'llama-3.3-70b-versatile'."
                ),
            )
        if e.code == 403:
            # Many environments hit Cloudflare 1010 (access denied). Provide a local fallback.
            if "1010" in body or "error code: 1010" in body or body.strip() == "":
                return _local_stylist_reply(db, message)
            raise HTTPException(status_code=403, detail=f"Groq API rejected the request (HTTP 403). {body[:500]}")
        if e.code == 429:
            # Rate limit. Extract suggested retry delay if present.
            retry_s = None
            m = re.search(r"try again in\s+(\d+(?:\.\d+)?)s", body, flags=re.IGNORECASE)
            if m:
                retry_s = m.group(1)
            raise HTTPException(
                status_code=429,
                detail=(
                    "Bomnous AI Stylist is styling a lot of shoppers right now (rate limited). "
                    f"Please try again in {retry_s}s." if retry_s else
                    "Bomnous AI Stylist is styling a lot of shoppers right now (rate limited). Please try again in a few seconds."
                ),
            )
        raise HTTPException(status_code=502, detail=f"Groq API error (HTTP {e.code}). {body[:500]}")
    except urllib.error.URLError:
        raise HTTPException(status_code=502, detail="Could not reach Groq API. Check internet connectivity and retry.")
    except Exception:
        raise HTTPException(status_code=502, detail="Groq API call failed unexpectedly. Please retry.")


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    message = (req.message or "").strip()
    try:
        reply = _call_groq(
            db,
            message,
            history=req.history,
            is_first_user_message=req.is_first_user_message,
            username=req.username,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Stylist model failed to respond. Please retry.")
    if not reply:
        raise HTTPException(status_code=502, detail="Stylist model returned no text. Please retry.")
    return ChatResponse(reply=_sanitize_stylist_reply(reply))

