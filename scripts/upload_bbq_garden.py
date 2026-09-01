# -*- coding: utf-8 -*-
"""Upload BBQ Garden; set working hours tags for Luizastan & Sunset."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://mestidelivery.com/api"
MENU_PATH = Path(__file__).with_name("bbq_garden_menu.json")

HOURS_BY_NAME = {
    "luizastan": "10:00-23:00",
    "sunset restaraunt": "10:30-23:00",
    "sunset restaurant": "10:30-23:00",
    "bbq garden": "10:00-23:00",
}
REVIEWS_BY_NAME = {
    "luizastan": "55+",
    "sunset restaraunt": "980+",
    "sunset restaurant": "980+",
    "bbq garden": "230+",
}


def req(method: str, path: str, token: str | None = None, body: dict | list | None = None):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=90) as resp:
                raw = resp.read().decode("utf-8")
                return resp.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} {path}: {err}") from e
        except Exception:
            if attempt == 3:
                raise
            time.sleep(1.2 + attempt)
    raise RuntimeError("unreachable")


def merge_tags(existing: str | None, **kv: str) -> str:
    parts = []
    seen = set()
    for p in str(existing or "").split(","):
        p = p.strip()
        if not p:
            continue
        key = p.split(":", 1)[0].lower()
        if key in {k.lower() for k in kv}:
            continue
        if key not in seen:
            parts.append(p)
            seen.add(key)
    for k, v in kv.items():
        parts.append(f"{k}:{v}")
    return ",".join(parts)


def restaurant_body(r: dict, filter_tags: str) -> dict:
    return {
        "name": r["name"],
        "rating": r.get("rating") or "",
        "delivery": r.get("delivery") or "",
        "img": r.get("img") or "/Assets/default-restaurant.png",
        "screen": r.get("screen") or "restaurant-default",
        "address": r.get("address") or "",
        "latitude": float(r.get("latitude") or 0),
        "longitude": float(r.get("longitude") or 0),
        "min_order": int(r.get("min_order") or 0),
        "filter_tags": filter_tags,
        "is_must_try": bool(r.get("is_must_try")),
        "is_worth_trying": bool(r.get("is_worth_trying")),
    }


def main() -> None:
    payload = json.loads(MENU_PATH.read_text(encoding="utf-8"))
    user, password = sys.argv[1], sys.argv[2]
    _, auth = req("POST", "/auth/login", body={"username": user, "password": password})
    token = auth["token"]
    print("login ok")

    _, restaurants = req("GET", "/restaurants/", token=token)

    # Update hours/reviews tags on existing places
    for r in restaurants:
        key = str(r.get("name", "")).lower()
        if key not in HOURS_BY_NAME:
            continue
        tags = merge_tags(
            r.get("filter_tags"),
            hours=HOURS_BY_NAME[key],
            reviews=REVIEWS_BY_NAME.get(key, "100+"),
        )
        # keep cuisine tags if missing
        if "georgian" not in tags:
            tags = "georgian," + tags
        req("PUT", f"/restaurants/{r['id']}", token=token, body=restaurant_body(r, tags))
        print(f"updated tags {r['name']}: {tags}")

    # Recreate BBQ Garden
    for r in restaurants:
        if str(r.get("name", "")).lower() == "bbq garden":
            print(f"deleting old BBQ Garden {r['id']}")
            req("DELETE", f"/restaurants/{r['id']}", token=token)

    status, created = req("POST", "/restaurants/", token=token, body=payload["restaurant"])
    rest = created.get("restaurant") if isinstance(created, dict) and "restaurant" in created else created
    rest_id = rest["id"]
    print(f"BBQ Garden created status={status} id={rest_id}")

    ok = fail = 0
    for i, p in enumerate(payload["products"], 1):
        body = {
            "restaurant_id": rest_id,
            "name": json.dumps({"ka": p["ka"], "ru": p["ru"], "en": p["en"]}, ensure_ascii=False),
            "description": json.dumps(
                {
                    "ru": p.get("desc", ""),
                    "en": p.get("desc_en", p.get("desc", "")),
                    "ka": p.get("desc_ka", p.get("desc", "")),
                },
                ensure_ascii=False,
            ),
            "price": p["price"],
            "img": "/Assets/default-food.png",
            "category": p["category"],
            "weight": p.get("weight", ""),
            "calories": str(p.get("calories", "0")),
            "proteins": str(p.get("proteins", "0")),
            "fats": str(p.get("fats", "0")),
            "carbs": str(p.get("carbs", "0")),
            "ingredients": p.get("ingredients", ""),
            "is_available": True,
        }
        try:
            req("POST", "/products/", token=token, body=body)
            ok += 1
            if i % 10 == 0:
                print(f"progress {i}/{len(payload['products'])}")
            time.sleep(0.05)
        except Exception as e:
            fail += 1
            print(f"FAIL {p['ru']}: {e}")

    _, check = req("GET", f"/products/?restaurant_id={rest_id}&limit=1000", token=token)
    print(json.dumps({"ok": ok, "fail": fail, "visible": len(check)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
