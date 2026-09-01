# -*- coding: utf-8 -*-
"""Sunset menu assets via free anonymous backends (no registration / no user tokens).

Primary: AI Horde anonymous API key ``0000000000`` (public anonymous access).
Fallback: g4f providers when available (BFL / etc).

Follows sunset_generation_guidelines.md.
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import time
from pathlib import Path

import requests

sys.stdout.reconfigure(encoding="utf-8")

REPO = Path(__file__).resolve().parents[1]
MENU_JSON = Path(__file__).resolve().parent / "sunset_menu.json"
OUT_DIR = REPO / "assets" / "sunset_menu"
WIDTH = 512  # Horde prefers multiples of 64
HEIGHT = 512

# Public anonymous Horde key — NOT a personal token, no signup required
HORDE_URL = "https://stablehorde.net/api/v2"
HORDE_ANON_KEY = "0000000000"
HORDE_HEADERS = {
    "apikey": HORDE_ANON_KEY,
    "Client-Agent": "MestiDeliveryAssetBot:1.0:anonymous",
    "Content-Type": "application/json",
}

FLAT_KEYWORDS = (
    "pizza",
    "khachapuri",
    "bread",
    "pie",
    "flatbread",
    "lobiani",
    "kubdari",
    "mchadi",
    "chvishtari",
    "pepperoni",
    "margherita",
)

BANNED = re.compile(
    r"\bsunset\b|\bmestidelivery\b|\bmesti\s*delivery\b|\brestaurant\b",
    re.IGNORECASE,
)


def sanitize(text: str) -> str:
    if not text:
        return ""
    out = BANNED.sub(" ", text)
    out = re.sub(r"[ \t]{2,}", " ", out).strip(" ,;.-")
    return out


def is_flat(en: str, ru: str = "") -> bool:
    blob = f"{en} {ru}".lower()
    return any(k in blob for k in FLAT_KEYWORDS)


def build_prompt(product: dict) -> tuple[str, str]:
    """Return (positive, negative) prompts per guidelines."""
    en = sanitize(product.get("en") or product.get("ru") or "food dish")
    if len(en) > 100:
        en = en[:100].rsplit(" ", 1)[0]
    angle = (
        "Strictly 90-degree top-down flatlay perspective."
        if is_flat(en, product.get("ru") or "")
        else "45-degree isometric angle perspective."
    )
    positive = (
        f"{en}, served on a matte dark graphite ceramic plate. "
        f"{angle} "
        "Placed on a perfectly solid, uniform dark charcoal background matching hex color 1A1A1A. "
        "Hyperrealistic food photography, professional studio lighting, macro details. "
        "Isolated standalone UI asset"
    )
    positive = sanitize(positive)
    negative = (
        "text, watermark, logo, napkins, cutlery, clutter, hands, "
        "purple sky, ocean, landscape, white plate, glossy plate"
    )
    if "sunset" in positive.lower():
        raise RuntimeError(f"Banned token in prompt: {positive!r}")
    return positive, negative


def slugify(en: str, idx: int, category: str = "") -> str:
    cat = re.sub(r"[^a-z0-9]+", "-", (category or "item").lower()).strip("-") or "item"
    if re.search(r"[^a-z0-9-]", cat):
        cat = f"cat{abs(hash(category)) % 10000:04d}"
    s = re.sub(r"[^a-z0-9]+", "-", (en or "dish").lower()).strip("-")
    return f"{cat}_{idx:02d}_{s}"[:96]


def load_category(category: str) -> list[dict]:
    data = json.loads(MENU_JSON.read_text(encoding="utf-8"))
    items = [p for p in data.get("products") or [] if p.get("category") == category]
    if not items:
        cats = sorted({p.get("category") for p in data.get("products") or []})
        raise SystemExit(f"Category {category!r} empty. Available: {cats}")
    return items


def first_category_name() -> str:
    data = json.loads(MENU_JSON.read_text(encoding="utf-8"))
    return (data.get("products") or [{}])[0].get("category") or "Закуски"


def category_order() -> list[str]:
    data = json.loads(MENU_JSON.read_text(encoding="utf-8"))
    seen: list[str] = []
    for p in data.get("products") or []:
        c = p.get("category")
        if c and c not in seen:
            seen.append(c)
    return seen


def generate_via_g4f(prompt: str) -> bytes | None:
    try:
        from g4f.client import Client
        from g4f.Provider import BlackForestLabs_Flux1Dev
    except Exception as exc:
        print(f"  g4f unavailable: {exc}", flush=True)
        return None
    try:
        client = Client(image_provider=BlackForestLabs_Flux1Dev)
        resp = client.images.generate(
            prompt=prompt,
            response_format="b64_json",
            width=400,
            height=400,
        )
        b64 = resp.data[0].b64_json
        raw = base64.b64decode(b64)
        if len(raw) >= 800:
            print("  backend=g4f/BlackForestLabs_Flux1Dev", flush=True)
            return raw
    except Exception as exc:
        print(f"  g4f fail: {exc}", flush=True)
    return None


def generate_via_horde(prompt: str, negative: str, timeout_s: int = 2400) -> bytes:
    """AI Horde anonymous generation — no signup."""
    payload = {
        "prompt": f"{prompt} ### {negative}",
        "params": {
            "width": WIDTH,
            "height": HEIGHT,
            "steps": 20,
            "cfg_scale": 7.0,
            "sampler_name": "k_euler",
            "n": 1,
        },
        "nsfw": False,
        "censor_nsfw": True,
        "models": ["stable_diffusion"],
        "r2": True,
    }
    print("  backend=ai-horde(anon) submit…", flush=True)
    r = requests.post(
        f"{HORDE_URL}/generate/async",
        json=payload,
        headers=HORDE_HEADERS,
        timeout=60,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"Horde submit {r.status_code}: {r.text[:300]}")
    jid = r.json().get("id")
    if not jid:
        raise RuntimeError(f"Horde no job id: {r.text[:300]}")
    print(f"  horde job={jid}", flush=True)

    deadline = time.time() + timeout_s
    while time.time() < deadline:
        time.sleep(8)
        c = requests.get(
            f"{HORDE_URL}/generate/check/{jid}",
            headers=HORDE_HEADERS,
            timeout=30,
        )
        info = c.json() if c.ok else {}
        done = info.get("done")
        wait = info.get("wait_time")
        q = info.get("queue_position")
        faulted = info.get("faulted")
        print(f"  horde check done={done} wait={wait}s queue={q}", flush=True)
        if faulted:
            raise RuntimeError(f"Horde faulted: {info}")
        if done:
            s = requests.get(
                f"{HORDE_URL}/generate/status/{jid}",
                headers=HORDE_HEADERS,
                timeout=60,
            ).json()
            gens = s.get("generations") or []
            if not gens:
                raise RuntimeError(f"Horde done but empty: {s}")
            img_field = gens[0].get("img")
            if not img_field:
                raise RuntimeError(f"Horde missing img: {gens[0]}")
            # r2=True → URL; else base64
            if str(img_field).startswith("http"):
                img = requests.get(img_field, timeout=120)
                img.raise_for_status()
                data = img.content
            else:
                data = base64.b64decode(img_field)
            if len(data) < 800:
                raise RuntimeError("Horde returned tiny image")
            return data
    raise TimeoutError(f"Horde timeout after {timeout_s}s job={jid}")


def generate_image_bytes(prompt: str, negative: str) -> bytes:
    # Fast path when free GPU still available
    data = generate_via_g4f(prompt)
    if data:
        return data
    return generate_via_horde(prompt, negative)


def save_jpg(data: bytes, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(dest.name + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(dest)


def run(
    category: str = "",
    force: bool = False,
    limit: int | None = None,
    sleep_s: float = 2.0,
    all_cats: bool = False,
) -> tuple[int, int]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cats = category_order() if all_cats else [category.strip() or first_category_name()]
    ok = fail = 0
    produced = 0

    for cat in cats:
        items = load_category(cat)
        print(f"\n======== CATEGORY: {cat} ({len(items)}) ========", flush=True)
        for i, product in enumerate(items, 1):
            if limit is not None and produced >= limit:
                print(f"Limit {limit} reached.", flush=True)
                return ok, fail
            en = product.get("en") or product.get("ru") or f"item-{i}"
            stem = slugify(en, i, cat)
            dest = OUT_DIR / f"{stem}.jpg"
            positive, negative = build_prompt(product)
            (OUT_DIR / f"{stem}.prompt.txt").write_text(
                positive + "\n\nNEGATIVE:\n" + negative + "\n", encoding="utf-8"
            )

            if dest.exists() and dest.stat().st_size > 800 and not force:
                print(f"[{i}/{len(items)}] SKIP {en} → {dest.name}", flush=True)
                ok += 1
                produced += 1
                continue

            print(f"[{i}/{len(items)}] GEN {en} …", flush=True)
            print(f"  prompt: {positive[:150]}", flush=True)
            try:
                data = generate_image_bytes(positive, negative)
                save_jpg(data, dest)
                print(f"  → {dest} ({dest.stat().st_size} bytes)", flush=True)
                ok += 1
                produced += 1
            except Exception as exc:
                print(f"  FAIL {en}: {exc}", flush=True)
                fail += 1
            time.sleep(sleep_s)

    print(f"\nDone: ok={ok} fail={fail} out={OUT_DIR}", flush=True)
    return ok, fail


def main() -> None:
    ap = argparse.ArgumentParser(description="Keyless Sunset menu image generator")
    ap.add_argument("--category", default="")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--sleep", type=float, default=2.0)
    args = ap.parse_args()
    ok, fail = run(
        category=args.category,
        force=args.force,
        limit=args.limit,
        sleep_s=args.sleep,
        all_cats=args.all,
    )
    if fail and ok == 0:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
