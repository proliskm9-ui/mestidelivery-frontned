# -*- coding: utf-8 -*-
"""Replace Luizastan product names with JSON i18n maps (keep restaurant)."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://mestidelivery.com/api"
MENU_PATH = Path(__file__).with_name("luizastan_menu.json")


def req(method: str, path: str, token: str | None = None, body: dict | list | None = None):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} {path}: {err_body}") from e


def main() -> None:
    payload = json.loads(MENU_PATH.read_text(encoding="utf-8"))
    user = sys.argv[1]
    password = sys.argv[2]

    _, auth = req("POST", "/auth/login", body={"username": user, "password": password})
    token = auth["token"]
    print("login ok")

    _, restaurants = req("GET", "/restaurants/", token=token)
    rest = next((r for r in restaurants if str(r.get("name", "")).lower() == "luizastan"), None)
    if not rest:
        raise SystemExit("Luizastan not found")
    rest_id = rest["id"]
    print(f"restaurant {rest_id}")

    _, products = req("GET", f"/products/?restaurant_id={rest_id}&limit=1000", token=token)
    print(f"deleting {len(products)} old products")
    for p in products:
        try:
            req("DELETE", f"/products/{p['id']}", token=token)
        except Exception as e:
            print(f"delete fail {p.get('id')}: {e}")

    ok = 0
    fail = 0
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
            print(f"FAIL {i} {p['ru']}: {e}")

    _, check = req("GET", f"/products/?restaurant_id={rest_id}&limit=1000", token=token)
    sample = check[0].get("name") if check else None
    print(json.dumps({"restaurant_id": rest_id, "ok": ok, "fail": fail, "visible": len(check), "sample": sample}, ensure_ascii=False))


if __name__ == "__main__":
    main()
