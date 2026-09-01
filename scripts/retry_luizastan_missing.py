# -*- coding: utf-8 -*-
import json
import urllib.request
from pathlib import Path

BASE = "https://mestidelivery.com/api"
MENU = json.loads(Path(__file__).with_name("luizastan_menu.json").read_text(encoding="utf-8"))
RID = "rest-1785095837937828031"


def call(method, path, token=None, body=None):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def main():
    import sys
    auth = call("POST", "/auth/login", body={"username": sys.argv[1], "password": sys.argv[2]})
    token = auth["token"]
    prods = call("GET", f"/products/?restaurant_id={RID}&limit=1000", token=token)
    existing = {p["name"] for p in prods}
    missing = []
    for p in MENU["products"]:
        name = f"{p['ka']} / {p['ru']}"
        if name not in existing:
            missing.append(p)
    print(f"visible={len(prods)} missing={len(missing)}")
    for p in missing:
        body = {
            "restaurant_id": RID,
            "name": f"{p['ka']} / {p['ru']}",
            "description": f"{p['en']}. {p['desc']}",
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
        call("POST", "/products/", token=token, body=body)
        print("uploaded", p["ru"])
    prods2 = call("GET", f"/products/?restaurant_id={RID}&limit=1000", token=token)
    out = {
        "id": RID,
        "count": len(prods2),
        "categories": sorted({p.get("category") for p in prods2}),
        "sample_names": [p.get("name") for p in prods2[:5]],
    }
    Path(__file__).with_name("_luizastan_verify.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("final", len(prods2))


if __name__ == "__main__":
    main()
