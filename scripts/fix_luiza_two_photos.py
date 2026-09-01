# -*- coding: utf-8 -*-
"""Fix Luizastan eggplant/cucumber walnut photo mixup."""
from __future__ import annotations

import json
import uuid
import urllib.request
from pathlib import Path

import paramiko
from PIL import Image

from compress_all_menu_photos import find_src

BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"
ROOT = Path(__file__).resolve().parent
RID = "rest-1785095837937828031"


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


def compress(stem: str) -> Path:
    src = find_src(stem)
    assert src, stem
    im = Image.open(src).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    if side > 900:
        im = im.resize((900, 900), Image.Resampling.LANCZOS)
    dest = ROOT / "menu_photos" / "luizastan" / f"{stem}.jpg"
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "JPEG", quality=80, optimize=True)
    return dest


def upload(client: paramiko.SSHClient, local: Path) -> str:
    name = f"{uuid.uuid4().hex}.jpg"
    sftp = client.open_sftp()
    sftp.put(str(local), f"/tmp/{name}")
    sftp.close()
    _, o, e = client.exec_command(
        f"cp /tmp/{name} /opt/mestigo/uploads/{name} && chmod 644 /opt/mestigo/uploads/{name}",
        timeout=60,
    )
    _ = o.read(), e.read()
    return f"/uploads/{name}"


def main() -> None:
    import sys

    token = login(sys.argv[1], sys.argv[2])
    ssh_pw = sys.argv[3]
    products = api("GET", f"/products?restaurant_id={RID}", token)
    by_ru = {}
    for p in products:
        n = json.loads(p["name"]) if str(p.get("name", "")).startswith("{") else {"ru": p.get("name")}
        by_ru[n.get("ru", "")] = (p, n)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)

    fixes = [
        ("luiza_05_eggplant_walnut", "Баклажаны с орехами"),
        ("luiza_02_cucumber_walnut", "Огурцы и помидоры с орехами"),
    ]
    for stem, ru in fixes:
        p, nj = by_ru[ru]
        img = upload(client, compress(stem))
        dj = (
            json.loads(p["description"])
            if str(p.get("description", "")).startswith("{")
            else {"ru": p.get("description")}
        )
        body = {
            "restaurant_id": RID,
            "name": json.dumps(nj, ensure_ascii=False),
            "description": json.dumps(dj, ensure_ascii=False),
            "price": float(p["price"]),
            "img": img,
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
        print("fixed", ru, img)

    client.close()


if __name__ == "__main__":
    main()
