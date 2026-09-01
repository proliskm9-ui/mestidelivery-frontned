# -*- coding: utf-8 -*-
"""Re-upload corrected realistic dish photos to Sunset / Luizastan."""
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
ROOT = Path(__file__).resolve().parent
ASSET_DIRS = [
    Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets"),
    Path(r"c:\MestiDelivery\Frontend\Assets"),
]

# stem -> (restaurant_key, RU needle)
# Luizastan Горячее — researched QC batch
FIXES = [
    ("luiza_14_khinkali", "luizastan", "Хинкали"),
    ("luiza_19_ojakhuri", "luizastan", "Оджахури"),
    ("luiza_22_chakhokhbili", "luizastan", "Чахохбили"),
    ("luiza_21_chkmeruli", "luizastan", "Чкмерули"),
]


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
    for attempt in range(5):
        try:
            req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=120) as resp:
                raw = resp.read().decode()
                return json.loads(raw) if raw else {}
        except Exception:
            import time

            time.sleep(1.5 + attempt)
    raise RuntimeError(f"api fail {method} {path}")


def parse_name(val) -> dict:
    if isinstance(val, str) and val.strip().startswith("{"):
        try:
            return json.loads(val)
        except Exception:
            return {"ru": val}
    return {"ru": str(val or "")}


def find_src(stem: str) -> Path | None:
    for d in ASSET_DIRS:
        for ext in (".png", ".jpg", ".webp"):
            p = d / f"{stem}{ext}"
            if p.exists():
                return p
    return None


def compress(stem: str, folder: str) -> Path:
    src = find_src(stem)
    assert src, stem
    out = ROOT / "menu_photos" / folder
    out.mkdir(parents=True, exist_ok=True)
    dest = out / f"{stem}.jpg"
    im = Image.open(src).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    if side > 900:
        im = im.resize((900, 900), Image.Resampling.LANCZOS)
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
    user, password, ssh_pw = sys.argv[1], sys.argv[2], sys.argv[3]
    token = login(user, password)
    rests = api("GET", "/restaurants/", token)
    by_key = {}
    for r in rests:
        name = str(r.get("name", "")).lower()
        if "sunset" in name:
            by_key["sunset"] = r
        elif "luiza" in name:
            by_key["luizastan"] = r

    products_cache: dict[str, list] = {}
    for key, r in by_key.items():
        products_cache[key] = api("GET", f"/products?restaurant_id={r['id']}", token)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)

    for stem, rkey, needle in FIXES:
        folder = "luizastan" if rkey == "luizastan" else "sunset"
        local = compress(stem, folder)
        img = upload(client, local)
        rid = by_key[rkey]["id"]
        match = None
        needle_l = needle.lower().strip()
        # Prefer exact RU name, then substring
        for p in products_cache[rkey]:
            ru = (parse_name(p.get("name")).get("ru") or "").strip()
            if ru.lower() == needle_l:
                match = p
                break
        if match is None:
            for p in products_cache[rkey]:
                ru = (parse_name(p.get("name")).get("ru") or "").lower()
                if needle_l in ru:
                    match = p
                    break
        if not match:
            print("MISS product", stem, needle)
            continue
        nj = parse_name(match.get("name"))
        dj = parse_name(match.get("description"))
        body = {
            "restaurant_id": rid,
            "name": json.dumps(nj, ensure_ascii=False),
            "description": json.dumps(dj, ensure_ascii=False),
            "price": float(match.get("price") or 0),
            "img": img,
            "category": match.get("category") or "",
            "weight": match.get("weight") or "",
            "calories": str(match.get("calories") or "0"),
            "proteins": str(match.get("proteins") or "0"),
            "fats": str(match.get("fats") or "0"),
            "carbs": str(match.get("carbs") or "0"),
            "ingredients": match.get("ingredients") or "",
            "is_available": True,
        }
        api("PUT", f"/products/{match['id']}", token, body)
        print("OK", nj.get("ru"), "<-", stem)

    client.close()
    print("DONE")


if __name__ == "__main__":
    main()
