# -*- coding: utf-8 -*-
"""Upload BBQ Garden menu photos for first 5 breakfast dishes and attach to products."""
from __future__ import annotations

import json
import mimetypes
import sys
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://mestidelivery.com/api"
PHOTOS = Path(__file__).with_name("menu_photos") / "bbq_garden"

# Match by Russian name substring → local jpg
PHOTO_MAP = [
    ("Овсяная каша", "01_oatmeal.jpg"),
    ("Творог с мёдом", "02_cottage_cheese.jpg"),
    ("Омлет с сыром", "03_omelet.jpg"),
    ("Тост-сэндвич с сыром", "04_cheese_sandwich.jpg"),
    ("Тост-сэндвич с ветчиной", "05_ham_cheese_sandwich.jpg"),
]


def api_json(method: str, path: str, token: str, body: dict | None = None):
    data = None
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def upload_file(token: str, path: Path) -> str:
    boundary = "----MestiBoundary7MA4YWxkTrZu0gW"
    ctype = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    file_bytes = path.read_bytes()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{path.name}"\r\n'
        f"Content-Type: {ctype}\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
    req = urllib.request.Request(
        f"{BASE}/upload/",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Accept": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    url = data.get("url") or data.get("file_path")
    if not url:
        raise RuntimeError(f"upload returned no url: {data}")
    return url


def product_ru_name(p: dict) -> str:
    name = p.get("name") or ""
    if isinstance(name, str) and name.strip().startswith("{"):
        try:
            return json.loads(name).get("ru") or name
        except Exception:
            return name
    return str(name)


def main() -> None:
    user, password = sys.argv[1], sys.argv[2]
    data = json.dumps({"username": user, "password": password}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        auth = json.loads(resp.read().decode("utf-8"))
    token = auth["token"]
    print("login ok")

    rests = api_json("GET", "/restaurants/", token)
    bbq = next(r for r in rests if "bbq" in str(r.get("name", "")).lower())
    rid = bbq["id"]
    print(f"restaurant {bbq['name']} {rid}")

    products = api_json("GET", f"/products/?restaurant_id={rid}&limit=1000", token)
    print(f"products {len(products)}")

    by_ru = {product_ru_name(p): p for p in products}

    for needle, filename in PHOTO_MAP:
        matches = [p for p in products if needle.lower() in product_ru_name(p).lower()]
        if not matches:
            print(f"SKIP no product for {needle}")
            continue
        # prefer exact-ish shortest name match
        p = sorted(matches, key=lambda x: len(product_ru_name(x)))[0]
        local = PHOTOS / filename
        if not local.exists():
            print(f"SKIP missing file {local}")
            continue
        try:
            url = upload_file(token, local)
            print(f"uploaded {filename} -> {url}")
        except Exception as e:
            print(f"UPLOAD FAIL {filename}: {e}")
            continue

        body = {
            "restaurant_id": p.get("restaurant_id") or rid,
            "name": p.get("name") or "",
            "description": p.get("description") or "",
            "price": float(p.get("price") or 0),
            "img": url,
            "category": p.get("category") or "",
            "weight": p.get("weight") or "",
            "calories": str(p.get("calories") or "0"),
            "proteins": str(p.get("proteins") or "0"),
            "fats": str(p.get("fats") or "0"),
            "carbs": str(p.get("carbs") or "0"),
            "ingredients": p.get("ingredients") or "",
            "is_available": bool(p.get("is_available", True)),
        }
        try:
            api_json("PUT", f"/products/{p['id']}", token, body)
            print(f"UPDATED {product_ru_name(p)} ({p['id']}) img={url}")
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", "replace")
            print(f"PUT FAIL {p['id']}: {e.code} {err}")


if __name__ == "__main__":
    main()
