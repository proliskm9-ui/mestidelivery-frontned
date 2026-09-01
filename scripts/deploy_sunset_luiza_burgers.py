# -*- coding: utf-8 -*-
"""
Deploy Sunset + Luizastan descriptions and all photos; attach BURGERS photos.
Requires: admin password + SSH password.
Run after compress_all_menu_photos.py.
"""
from __future__ import annotations

import json
import sys
import uuid
import urllib.request
from pathlib import Path

import paramiko

from compress_all_menu_photos import BURGERS_MAP, LUIZA_MAP, SUNSET_MAP
from luizastan_selling_descriptions import DESCRIPTIONS as LUIZA_DESC
from sunset_selling_descriptions import DESCRIPTIONS as SUNSET_DESC

BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"
ROOT = Path(__file__).resolve().parent


def login(user: str, password: str) -> str:
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": user, "password": password}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())["token"]


def api(method: str, path: str, token: str, body: dict | None = None):
    data = None
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    last_err: Exception | None = None
    for attempt in range(5):
        try:
            req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=120) as resp:
                raw = resp.read().decode()
                return json.loads(raw) if raw else {}
        except Exception as ex:
            last_err = ex
            import time

            time.sleep(1.5 + attempt)
    raise RuntimeError(f"api failed {method} {path}: {last_err}")


def find_all(token: str) -> dict[str, dict]:
    rests = api("GET", "/restaurants/", token)
    out: dict[str, dict] = {}
    for r in rests:
        name = str(r.get("name", "")).lower()
        if "sunset" in name:
            out["sunset"] = r
        elif "luiza" in name:
            out["luizastan"] = r
        elif name == "burgers":
            out["burgers"] = r
    return out


def parse_name(val) -> dict:
    if isinstance(val, str) and val.strip().startswith("{"):
        try:
            return json.loads(val)
        except Exception:
            return {"ru": val}
    return {"ru": str(val or "")}


def product_ru(p: dict) -> str:
    return parse_name(p.get("name")).get("ru") or ""


def upload_jpg(client: paramiko.SSHClient, local: Path) -> str:
    new_name = f"{uuid.uuid4().hex}.jpg"
    remote = f"/tmp/{new_name}"
    sftp = client.open_sftp()
    sftp.put(str(local), remote)
    sftp.close()
    _, o, e = client.exec_command(
        f"cp {remote} /opt/mestigo/uploads/{new_name} && chmod 644 /opt/mestigo/uploads/{new_name}",
        timeout=60,
    )
    _ = o.read(), e.read()
    return f"/uploads/{new_name}"


def put_product(token: str, rid: str, p: dict, *, desc: dict | None = None, img: str | None = None):
    nj = parse_name(p.get("name"))
    dj = parse_name(p.get("description"))
    if desc:
        dj = {"ka": desc.get("ka", dj.get("ka", "")), "ru": desc.get("ru", ""), "en": desc.get("en", "")}
    body = {
        "restaurant_id": rid,
        "name": json.dumps(nj, ensure_ascii=False),
        "description": json.dumps(dj, ensure_ascii=False),
        "price": float(p.get("price") or 0),
        "img": img if img is not None else (p.get("img") or "/Assets/default-food.png"),
        "category": p.get("category") or "",
        "weight": p.get("weight") or "",
        "calories": str(p.get("calories") or "0"),
        "proteins": str(p.get("proteins") or "0"),
        "fats": str(p.get("fats") or "0"),
        "carbs": str(p.get("carbs") or "0"),
        "ingredients": p.get("ingredients") or "",
        "is_available": True,
    }
    api("PUT", f"/products/{p['id']}", token, body)


def match_unused(products: list[dict], needle: str, used: set[str]) -> dict | None:
    needle_l = needle.lower()
    for p in products:
        if p["id"] in used:
            continue
        ru = product_ru(p)
        if needle_l in ru.lower():
            return p
    return None


def attach_photos(token: str, rid: str, photo_map: list[tuple[str, str]], folder: str, client: paramiko.SSHClient):
    products = api("GET", f"/products?restaurant_id={rid}", token)
    used: set[str] = set()
    ok = miss = 0
    photo_dir = ROOT / "menu_photos" / folder
    for stem, needle in photo_map:
        local = photo_dir / f"{stem}.jpg"
        p = match_unused(products, needle, used)
        if not local.exists() or not p:
            miss += 1
            print("MISS", stem, needle, "product" if not p else "file")
            continue
        img = upload_jpg(client, local)
        put_product(token, rid, p, img=img)
        used.add(p["id"])
        ok += 1
        print("IMG", product_ru(p), "<-", stem)
    return ok, miss


def update_descs(token: str, rid: str, desc_by_ka: dict[str, dict[str, str]]):
    products = api("GET", f"/products?restaurant_id={rid}", token)
    ok = miss = 0
    for p in products:
        ka = parse_name(p.get("name")).get("ka") or ""
        d = desc_by_ka.get(ka)
        if not d:
            miss += 1
            continue
        put_product(token, rid, p, desc=d)
        ok += 1
        print("DESC", product_ru(p))
    return ok, miss


def main() -> None:
    user, password, ssh_pw = sys.argv[1], sys.argv[2], sys.argv[3]
    token = login(user, password)
    found = find_all(token)
    for key in ("sunset", "luizastan", "burgers"):
        if key not in found:
            raise SystemExit(f"missing restaurant: {key}")
    sunset, luiza, burgers = found["sunset"], found["luizastan"], found["burgers"]
    print("restaurants", sunset["id"], luiza["id"], burgers["id"])

    print("--- descriptions ---")
    print("sunset", update_descs(token, sunset["id"], SUNSET_DESC))
    print("luiza", update_descs(token, luiza["id"], LUIZA_DESC))

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)

    print("--- photos ---")
    print("sunset photos", attach_photos(token, sunset["id"], SUNSET_MAP, "sunset", client))
    print("luiza photos", attach_photos(token, luiza["id"], LUIZA_MAP, "luizastan", client))
    print("burgers photos", attach_photos(token, burgers["id"], BURGERS_MAP, "burgers", client))

    client.close()
    print("DONE")


if __name__ == "__main__":
    main()
