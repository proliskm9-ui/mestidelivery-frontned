# -*- coding: utf-8 -*-
"""Upload BBQ Garden locked photos via SSH + attach via admin API."""
from __future__ import annotations

import json
import sys
import time
import uuid
import urllib.request
from pathlib import Path

import paramiko
from PIL import Image

BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"
RESTAURANT_ID = "rest-1785110335267403964"
REPO = Path(r"C:\MestiDelivery\Frontend")
ASSETS = [
    Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets"),
    REPO / "Assets",
]
OUT = REPO / "scripts" / "menu_photos" / "bbq_garden"

sys.path.insert(0, str(REPO / "scripts"))
from bbq_vessel_system import PHOTO_MAP  # noqa: E402


def login(user: str, password: str) -> str:
    for attempt in range(6):
        try:
            req = urllib.request.Request(
                f"{BASE}/auth/login",
                data=json.dumps({"username": user, "password": password}).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=90) as resp:
                return json.loads(resp.read().decode())["token"]
        except Exception as e:
            print(f"login retry {attempt}: {e}", flush=True)
            time.sleep(2 + attempt)
    raise RuntimeError("login failed")


def api(method: str, path: str, token: str, body: dict | None = None):
    data = None
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    last = None
    for attempt in range(6):
        try:
            req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=120) as resp:
                raw = resp.read().decode()
                return json.loads(raw) if raw else {}
        except Exception as e:
            last = e
            time.sleep(1.5 + attempt)
    raise RuntimeError(f"api fail {method} {path}: {last}")


def ru_name(p: dict) -> str:
    n = p.get("name")
    if isinstance(n, str):
        try:
            n = json.loads(n)
        except Exception:
            return n
    if isinstance(n, dict):
        return n.get("ru") or ""
    return str(n or "")


def match_product(by_ru: dict[str, dict], needle: str):
    needle_l = needle.lower()
    # exact contains
    hits = [p for ru, p in by_ru.items() if needle_l in ru.lower()]
    if len(hits) == 1:
        return hits[0]
    if len(hits) > 1:
        # prefer shortest name (more specific needle match ranking)
        hits.sort(key=lambda p: len(ru_name(p)))
        return hits[0]
    raise KeyError(f"no product for needle={needle}")


def product_payload(product: dict, remote_img: str) -> dict:
    body = dict(product)
    body["img"] = remote_img
    if "image" in body:
        body["image"] = remote_img
    return body


def find_src(stem: str) -> Path:
    for d in ASSETS:
        for name in (stem, stem.replace("-", "_")):
            for ext in (".png", ".jpg", ".jpeg", ".webp"):
                p = d / f"{name}{ext}"
                if p.exists():
                    return p
    raise FileNotFoundError(stem)


def compress(stem: str) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{stem}.jpg"
    im = Image.open(find_src(stem)).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    if side > 900:
        im = im.resize((900, 900), Image.Resampling.LANCZOS)
    im.save(dest, "JPEG", quality=82, optimize=True)
    return dest


def ssh_upload(client: paramiko.SSHClient, local: Path) -> str:
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
    user = sys.argv[1] if len(sys.argv) > 1 else "admin"
    password = sys.argv[2] if len(sys.argv) > 2 else "423Qq!cv"
    ssh_pw = sys.argv[3] if len(sys.argv) > 3 else "IW42VUUxBlQgRc1I"
    only = set(sys.argv[4].split(",")) if len(sys.argv) > 4 else None

    token = login(user, password)
    products = api("GET", f"/products/?restaurant_id={RESTAURANT_ID}&limit=1000", token)
    by_ru = {ru_name(p): p for p in products}

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=40)

    items = [(s, n) for s, n in PHOTO_MAP if only is None or s in only]
    ok = 0
    fails = []
    for i, (stem, needle) in enumerate(items, 1):
        try:
            product = match_product(by_ru, needle)
            local = compress(stem)
            remote = ssh_upload(client, local)
            api("PUT", f"/products/{product['id']}", token, product_payload(product, remote))
            ok += 1
            print(f"{i:02d}/{len(items)} {ru_name(product)} -> {remote}", flush=True)
        except Exception as e:
            fails.append({"stem": stem, "error": str(e)})
            print(f"{i:02d}/{len(items)} FAIL {stem}: {e}", flush=True)
            time.sleep(2)

    client.close()
    print(json.dumps({"updated": ok, "fails": fails}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
