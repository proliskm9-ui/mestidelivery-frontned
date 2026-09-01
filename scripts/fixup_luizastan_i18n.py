# -*- coding: utf-8 -*-
"""Cleanup slash-format products and finish JSON i18n upload for Luizastan."""
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
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=90) as resp:
                raw = resp.read().decode("utf-8")
                return resp.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} {path}: {err_body}") from e
        except Exception:
            if attempt == 3:
                raise
            time.sleep(1.5 + attempt)
    raise RuntimeError("unreachable")


def main() -> None:
    payload = json.loads(MENU_PATH.read_text(encoding="utf-8"))
    user = sys.argv[1]
    password = sys.argv[2]

    _, auth = req("POST", "/auth/login", body={"username": user, "password": password})
    token = auth["token"]

    _, restaurants = req("GET", "/restaurants/", token=token)
    rest = next((r for r in restaurants if str(r.get("name", "")).lower() == "luizastan"), None)
    if not rest:
        raise SystemExit("Luizastan not found")
    rid = rest["id"]

    _, products = req("GET", f"/products/?restaurant_id={rid}&limit=1000", token=token)
    json_n = sum(1 for p in products if str(p.get("name", "")).strip().startswith("{"))
    print(f"before total={len(products)} json={json_n}")

    deleted = 0
    for p in products:
        name = str(p.get("name", ""))
        if name.strip().startswith("{"):
            continue
        req("DELETE", f"/products/{p['id']}", token=token)
        deleted += 1
        time.sleep(0.05)
    print(f"deleted_old={deleted}")

    _, products = req("GET", f"/products/?restaurant_id={rid}&limit=1000", token=token)
    present: set[str] = set()
    for p in products:
        name = str(p.get("name", ""))
        if name.startswith("{"):
            try:
                present.add(json.loads(name).get("ru", ""))
            except json.JSONDecodeError:
                pass

    ok = fail = 0
    for p in payload["products"]:
        if p["ru"] in present:
            continue
        body = {
            "restaurant_id": rid,
            "name": json.dumps({"ka": p["ka"], "ru": p["ru"], "en": p["en"]}, ensure_ascii=False),
            "description": json.dumps(
                {"ru": p.get("desc", ""), "en": p.get("desc", ""), "ka": p.get("desc", "")},
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
            present.add(p["ru"])
            time.sleep(0.08)
        except Exception as e:
            fail += 1
            print(f"FAIL {p['ru']}: {e}")

    _, check = req("GET", f"/products/?restaurant_id={rid}&limit=1000", token=token)
    json_n = sum(1 for p in check if str(p.get("name", "")).strip().startswith("{"))
    sample = check[0].get("name") if check else None
    print(json.dumps({"added": ok, "fail": fail, "visible": len(check), "json": json_n, "sample": sample}, ensure_ascii=False))


if __name__ == "__main__":
    main()
