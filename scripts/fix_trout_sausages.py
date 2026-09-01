# -*- coding: utf-8 -*-
"""Update trout photo + remove (2 pcs) from sausages name."""
from __future__ import annotations

import json
import sys
import uuid
import urllib.request
from pathlib import Path

import paramiko
from PIL import Image

BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"
ASSETS = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
OUT = Path(__file__).resolve().parent / "menu_photos" / "bbq_garden"


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
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def parse_json_field(val: str) -> dict:
    if isinstance(val, str) and val.strip().startswith("{"):
        try:
            return json.loads(val)
        except Exception:
            return {"ru": val}
    return {"ru": str(val or "")}


def compress_trout() -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    src = ASSETS / "bbq_12_trout.webp"
    im = Image.open(src).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    if side > 900:
        im = im.resize((900, 900), Image.Resampling.LANCZOS)
    dest = OUT / "bbq_12_trout.jpg"
    im.save(dest, "JPEG", quality=80, optimize=True)
    return dest


def put_product(token: str, p: dict, rid: str, *, name: dict | None = None, img: str | None = None):
    nj = name or parse_json_field(p.get("name") or "")
    dj = parse_json_field(p.get("description") or "")
    body = {
        "restaurant_id": p.get("restaurant_id") or rid,
        "name": json.dumps(nj, ensure_ascii=False),
        "description": json.dumps(dj, ensure_ascii=False),
        "price": float(p.get("price") or 0),
        "img": img if img is not None else (p.get("img") or ""),
        "category": p.get("category") or "",
        "weight": p.get("weight") or "",
        "calories": str(p.get("calories") or "0"),
        "proteins": str(p.get("proteins") or "0"),
        "fats": str(p.get("fats") or "0"),
        "carbs": str(p.get("carbs") or "0"),
        "ingredients": p.get("ingredients") or "",
    }
    api("PUT", f"/products/{p['id']}", token, body)


def main() -> None:
    user, password, ssh_pw = sys.argv[1], sys.argv[2], sys.argv[3]
    token = login(user, password)
    rests = api("GET", "/restaurants/", token)
    bbq = next(r for r in rests if "bbq" in str(r.get("name", "")).lower())
    rid = bbq["id"]
    products = api("GET", f"/products/?restaurant_id={rid}&limit=1000", token)

    trout = sausages = None
    for p in products:
        nj = parse_json_field(p.get("name") or "")
        ka = nj.get("ka") or ""
        ru = (nj.get("ru") or "").lower()
        if ka == "გრილზე შემწვარი კალმახი" or "форель" in ru:
            trout = p
        if ka.startswith("გრილზე შემწვარი სოსისი") or ("сосиски" in ru and "гриле" in ru):
            sausages = p

    # Upload trout photo
    local = compress_trout()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)
    new_name = f"{uuid.uuid4().hex}.jpg"
    remote = f"/tmp/{new_name}"
    sftp = client.open_sftp()
    sftp.put(str(local), remote)
    sftp.close()
    _, o, e = client.exec_command(
        f"cp {remote} /opt/mestigo/uploads/{new_name} && chmod 644 /opt/mestigo/uploads/{new_name}",
        timeout=60,
    )
    print(o.read().decode(), e.read().decode())
    client.close()
    img_url = f"/uploads/{new_name}"

    if trout:
        put_product(token, trout, rid, img=img_url)
        print("trout photo updated", img_url)
    else:
        print("trout NOT FOUND")

    if sausages:
        nj = parse_json_field(sausages.get("name") or "")
        nj["ru"] = "Сосиски на гриле"
        nj["en"] = "Grilled sausages"
        # keep ka as-is
        put_product(token, sausages, rid, name=nj)
        print("sausages renamed", nj)
    else:
        print("sausages NOT FOUND")


if __name__ == "__main__":
    main()
