# -*- coding: utf-8 -*-
"""Upload Sunset Restaraunt; strip Luizastan alcohol; set reviews labels."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://mestidelivery.com/api"
SUNSET_PATH = Path(__file__).with_name("sunset_menu.json")

# Soft drinks / coffee keep; everything else in Напитки that looks alcoholic is removed.
ALCOHOL_RU = {
    "Чача (бокал)",
    "Чача (графин)",
    "Фруктовая водка (бокал)",
    "Фруктовая водка (графин)",
    "Домашнее вино 1 л",
    "Домашнее красное вино",
    "Белое полусладкое (бокал)",
    "Белое полусладкое (бутылка)",
    "Красное полусладкое (бокал)",
    "Красное полусладкое (бутылка)",
    "Белое сухое (бокал)",
    "Белое сухое (бутылка)",
    "Красное сухое (бокал)",
    "Красное сухое (бутылка)",
    "Пиво",
    "Сараджишвили 0,5 л (бокал)",
    "Сараджишвили 0,5 л (бутылка)",
    "Егермейстер (бокал)",
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


def product_ru_name(raw: str) -> str:
    try:
        if str(raw).startswith("{"):
            return json.loads(raw).get("ru", "") or ""
    except json.JSONDecodeError:
        pass
    return str(raw)


def upload_products(token: str, rest_id: str, products: list[dict]) -> tuple[int, int]:
    ok = fail = 0
    for i, p in enumerate(products, 1):
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
                print(f"  progress {i}/{len(products)}")
            time.sleep(0.05)
        except Exception as e:
            fail += 1
            print(f"FAIL {p['ru']}: {e}")
    return ok, fail


def main() -> None:
    payload = json.loads(SUNSET_PATH.read_text(encoding="utf-8"))
    user, password = sys.argv[1], sys.argv[2]
    _, auth = req("POST", "/auth/login", body={"username": user, "password": password})
    token = auth["token"]
    print("login ok")

    _, restaurants = req("GET", "/restaurants/", token=token)

    # --- Luizastan: reviews + alcohol cleanup ---
    luiz = next((r for r in restaurants if str(r.get("name", "")).lower() == "luizastan"), None)
    if luiz:
        tags = str(luiz.get("filter_tags") or "")
        parts = [p for p in tags.split(",") if p and not p.startswith("reviews:")]
        parts.append("reviews:55+")
        body = {
            "name": luiz["name"],
            "rating": luiz.get("rating") or "4.8",
            "delivery": luiz.get("delivery") or "25-30 мин",
            "img": luiz.get("img") or "/Assets/default-restaurant.png",
            "screen": luiz.get("screen") or "restaurant-default",
            "address": luiz.get("address") or "",
            "latitude": luiz.get("latitude") or 0,
            "longitude": luiz.get("longitude") or 0,
            "min_order": luiz.get("min_order") or 0,
            "filter_tags": ",".join(parts),
            "is_must_try": bool(luiz.get("is_must_try")),
            "is_worth_trying": bool(luiz.get("is_worth_trying")),
        }
        req("PUT", f"/restaurants/{luiz['id']}", token=token, body=body)
        print(f"luizastan tags -> {body['filter_tags']}")

        _, products = req("GET", f"/products/?restaurant_id={luiz['id']}&limit=1000", token=token)
        deleted = 0
        for p in products:
            ru = product_ru_name(p.get("name", ""))
            if ru in ALCOHOL_RU:
                try:
                    req("DELETE", f"/products/{p['id']}", token=token)
                    deleted += 1
                    print(f"deleted alcohol: {ru}")
                    time.sleep(0.05)
                except Exception as e:
                    print(f"delete fail {ru}: {e}")
        print(f"luizastan alcohol removed: {deleted}")
    else:
        print("Luizastan not found")

    # --- Sunset: recreate ---
    for r in restaurants:
        if str(r.get("name", "")).lower() in {"sunset restaraunt", "sunset restaurant"}:
            print(f"deleting old sunset {r['id']}")
            req("DELETE", f"/restaurants/{r['id']}", token=token)

    status, created = req("POST", "/restaurants/", token=token, body=payload["restaurant"])
    rest = created.get("restaurant") if isinstance(created, dict) and "restaurant" in created else created
    rest_id = rest["id"]
    print(f"sunset created status={status} id={rest_id}")

    ok, fail = upload_products(token, rest_id, payload["products"])
    _, check = req("GET", f"/products/?restaurant_id={rest_id}&limit=1000", token=token)
    print(json.dumps({
        "restaurant_id": rest_id,
        "ok": ok,
        "fail": fail,
        "visible": len(check),
        "sample": check[0].get("name") if check else None,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
