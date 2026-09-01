# -*- coding: utf-8 -*-
"""Create BURGERS restaurant + products on prod."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://mestidelivery.com/api"
MENU_PATH = Path(__file__).with_name("burgers_menu.json")


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


def main() -> None:
    payload = json.loads(MENU_PATH.read_text(encoding="utf-8"))
    user, password = sys.argv[1], sys.argv[2]
    _, auth = req("POST", "/auth/login", body={"username": user, "password": password})
    token = auth["token"]
    print("login ok")

    _, restaurants = req("GET", "/restaurants/", token=token)
    existing = next((r for r in restaurants if str(r.get("name", "")).upper() == "BURGERS"), None)
    if existing:
        print("BURGERS already exists", existing.get("id"), "— skip create restaurant")
        rid = existing["id"]
    else:
        r = payload["restaurant"]
        tags = r.get("filter_tags") or "burgers,fastfood,reviews:60+,hours:10:00-23:00"
        body = {
            "name": r["name"],
            "rating": r.get("rating") or "4.8",
            "delivery": r.get("delivery") or "15-20 мин",
            "img": r.get("img") or "/Assets/default-restaurant.png",
            "screen": r.get("screen") or "restaurant-default",
            "address": r.get("address") or "",
            "latitude": float(r.get("latitude") or 0),
            "longitude": float(r.get("longitude") or 0),
            "min_order": int(r.get("min_order") or 0),
            "filter_tags": tags,
            "is_must_try": bool(r.get("is_must_try")),
            "is_worth_trying": bool(r.get("is_worth_trying")),
        }
        status, created = req("POST", "/restaurants/", token=token, body=body)
        print("create status", status, created)
        rest = created.get("restaurant") if isinstance(created, dict) and "restaurant" in created else created
        rid = (rest or {}).get("id") if isinstance(rest, dict) else None
        if not rid:
            _, restaurants = req("GET", "/restaurants/", token=token)
            found = next((r for r in restaurants if str(r.get("name", "")).upper() == "BURGERS"), None)
            rid = found["id"] if found else None
        print("created BURGERS", rid)
        if not rid:
            raise SystemExit("BURGERS created but id not found")

    _, products = req("GET", f"/products?restaurant_id={rid}", token=token)
    existing_ru = set()
    for p in products:
        n = p.get("name") or ""
        try:
            existing_ru.add(json.loads(n).get("ru") or n)
        except Exception:
            existing_ru.add(str(n))

    ok = skip = fail = 0
    for item in payload["products"]:
        if item["ru"] in existing_ru:
            skip += 1
            continue
        body = {
            "restaurant_id": rid,
            "name": json.dumps({"ka": item["ka"], "ru": item["ru"], "en": item["en"]}, ensure_ascii=False),
            "description": json.dumps(
                {"ka": item.get("desc_ka", ""), "ru": item.get("desc", ""), "en": item.get("desc_en", "")},
                ensure_ascii=False,
            ),
            "price": float(item["price"]),
            "img": "/Assets/default-food.png",
            "category": item.get("category") or "",
            "weight": item.get("weight") or "",
            "calories": str(item.get("calories") or "0"),
            "proteins": str(item.get("proteins") or "0"),
            "fats": str(item.get("fats") or "0"),
            "carbs": str(item.get("carbs") or "0"),
            "ingredients": item.get("ingredients") or "",
            "is_available": True,
        }
        try:
            req("POST", "/products/", token=token, body=body)
            ok += 1
            print("CREATE", item["ru"])
        except Exception as ex:
            fail += 1
            print("FAIL", item["ru"], ex)
        time.sleep(0.05)

    print(json.dumps({"restaurant_id": rid, "created": ok, "skipped": skip, "fail": fail}))


if __name__ == "__main__":
    main()
