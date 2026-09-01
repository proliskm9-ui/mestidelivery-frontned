# -*- coding: utf-8 -*-
import json
import urllib.request

BASE = "https://mestidelivery.com/api"


def req(method, path, token=None, body=None):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode()
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


auth = req("POST", "/auth/login", body={"username": "admin", "password": "423Qq!cv"})
token = auth["token"]
rests = req("GET", "/restaurants/", token=token)
luiz = next(r for r in rests if r.get("name", "").lower() == "luizastan")
body = {
    "name": luiz["name"],
    "rating": luiz.get("rating") or "4.8",
    "delivery": luiz.get("delivery") or "25-30 мин",
    "img": luiz.get("img") or "/Assets/default-restaurant.png",
    "screen": luiz.get("screen") or "restaurant-default",
    "address": luiz.get("address") or "",
    "latitude": float(luiz.get("latitude") or 0),
    "longitude": float(luiz.get("longitude") or 0),
    "min_order": int(luiz.get("min_order") or 0),
    "filter_tags": "georgian,svaneti,reviews:55+",
    "is_must_try": bool(luiz.get("is_must_try")),
    "is_worth_trying": bool(luiz.get("is_worth_trying")),
}
req("PUT", f"/restaurants/{luiz['id']}", token=token, body=body)

rests = req("GET", "/restaurants/", token=token)
for r in rests:
    if r.get("name", "").lower() in ("luizastan", "sunset restaraunt"):
        prods = req("GET", f"/products/?restaurant_id={r['id']}&limit=1000", token=token)
        print(json.dumps({
            "name": r["name"],
            "id": r["id"],
            "tags": r.get("filter_tags"),
            "rating": r.get("rating"),
            "delivery": r.get("delivery"),
            "products": len(prods),
        }, ensure_ascii=False))
