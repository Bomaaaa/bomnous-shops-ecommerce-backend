#!/usr/bin/env python3
"""One-time helper: replace legacy nav-container with partials/bomnous-nav.html (already applied)."""
from __future__ import annotations

import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
NAV = (ROOT / "partials" / "bomnous-nav.html").read_text(encoding="utf-8")


def find_nav_block(text: str) -> tuple[int, int] | None:
    d = re.search(r'<div\s+class="nav-container"\s*>', text, re.I)
    if not d:
        return None
    start_div = d.start()
    c = text.rfind("<!--", 0, start_div)
    if c != -1 and c < start_div and (start_div - c) < 60 and "Navbar" in text[c:start_div]:
        start_all = c
    else:
        start_all = start_div
    pos = d.end()
    depth = 1
    n = len(text)
    while depth > 0 and pos < n:
        nxt_open = text.find("<div", pos)
        nxt_close = text.find("</div>", pos)
        if nxt_close < 0:
            return None
        if nxt_open >= 0 and nxt_open < nxt_close:
            depth += 1
            pos = nxt_open + 4
        else:
            depth -= 1
            pos = nxt_close + 6
    return (start_all, pos)


def patch_file(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    span = find_nav_block(text)
    if not span:
        print(f"skip (no nav-container): {path.name}")
        return False
    a, b = span
    new_text = text[:a] + "\n" + NAV + text[b:]

    new_text = re.sub(
        r'href="styles\.css(\?[^"]*)?"', 'href="styles.css?v=20260422-spotlight"', new_text, count=1
    )
    if "js/bomnous-nav.js" not in new_text and 'src="js/script.js"' in new_text:
        new_text = new_text.replace(
            '<script src="js/script.js">',
            '<script src="js/bomnous-nav.js"></script>\n    <script src="js/script.js">',
        )
    new_text = re.sub(
        r"https://cdn\.jsdelivr\.net/npm/bootstrap@5\.3\.3/dist/js/bootstrap\.min\.js",
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
        new_text,
    )
    path.write_text(new_text, encoding="utf-8")
    print(f"patched: {path.name}")
    return True


if __name__ == "__main__":
    for name in [
        "shop.html",
        "product.html",
        "search.html",
        "wishlist.html",
        "carts.html",
        "about.html",
        "Contact.html",
        "blog.html",
        "checkout.html",
        "myaccount.html",
    ]:
        patch_file(ROOT / name)
