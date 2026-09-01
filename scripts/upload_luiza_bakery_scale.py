# -*- coding: utf-8 -*-
"""Upload scaled Luizastan bakery/Svan plates."""
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
RID = "rest-1785095837937828031"
ASSETS = [
    Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets"),
    Path(r"c:\MestiDelivery\Frontend\Assets"),
]
OUT = Path(r"c:\MestiDelivery\Frontend\scripts\menu_photos\luizastan_scale")

JOBS = [
    ("luizastan-26-imeretian-khachapuri", "Хачапури по-имеретински", "luiza_26_imeretian_khachapuri"),
    ("luizastan-27-megrelian-khachapuri", "Хачапури по-мегрельски", "luiza_27_megrelian_khachapuri"),
    ("luizastan-28-adjarian-khachapuri", "Хачапури по-аджарски", "luiza_28_adjarian_khachapuri"),
    ("luizastan-29-mchadi", "Мчади", "luiza_29_mchadi"),
    ("luizastan-30-lobiani", "Лобиани", "luiza_30_lobiani"),
    ("luizastan-31-bread", "Хлеб", "luiza_31_bread"),
    ("luizastan-32-margherita", "Маргарита", "luiza_32_margherita"),
    ("luizastan-33-vegetable-pizza", "Овощная пицца", "luiza_33_veg_pizza"),
    ("luizastan-34-kubdari", "Кубдари", "luiza_34_kubdari"),
    ("luizastan-35-potato-khachapuri", "Хачапури с картофелем", "luiza_35_potato_khachapuri"),
    # millet is the size reference — leave as-is on prod
    ("luizastan-37-chvishtari", "Чвиштари", "luiza_37_chvishtari"),
    ("luizastan-38-chvishtari-millet", "Чвиштари с просом", "luiza_38_chvishtari_millet"),
]


def login(u, p):
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": u, "password": p}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    return json.loads(urllib.request.urlopen(req, timeout=60).read())["token"]


def api(method, path, token, body=None):
    data = None
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def ru_name(p):
    n = p.get("name")
    if isinstance(n, str):
        try:
            n = json.loads(n)
        except Exception:
            return n
    return (n or {}).get("ru", "") if isinstance(n, dict) else str(n or "")


def find_src(stem, local):
    for d in ASSETS:
        for name in (stem, local, stem.replace("-", "_"), local.replace("_", "-")):
            for ext in (".png", ".jpg"):
                p = d / f"{name}{ext}"
                if p.exists():
                    return p
    raise FileNotFoundError(stem)


def compress(stem, local):
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{stem}_upload.jpg"
    im = Image.open(find_src(stem, local)).convert("RGB")
    w, h = im.size
    side = min(w, h)
    im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    if side > 900:
        im = im.resize((900, 900), Image.Resampling.LANCZOS)
    im.save(dest, "JPEG", quality=85, optimize=True)
    return dest


def main():
    user = sys.argv[1] if len(sys.argv) > 1 else "admin"
    password = sys.argv[2] if len(sys.argv) > 2 else "423Qq!cv"
    ssh_pw = sys.argv[3] if len(sys.argv) > 3 else "IW42VUUxBlQgRc1I"
    tok = login(user, password)
    products = api("GET", f"/products/?restaurant_id={RID}&limit=1000", tok)
    by_ru = {ru_name(p): p for p in products}

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=40)

    ok, fails = 0, []
    for i, (stem, needle, local) in enumerate(JOBS, 1):
        try:
            hits = [p for ru, p in by_ru.items() if needle.lower() in ru.lower()]
            hits.sort(key=lambda p: len(ru_name(p)))
            product = hits[0]
            local_jpg = compress(stem, local)
            name = f"{uuid.uuid4().hex}.jpg"
            sftp = client.open_sftp()
            sftp.put(str(local_jpg), f"/tmp/{name}")
            sftp.close()
            client.exec_command(
                f"cp /tmp/{name} /opt/mestigo/uploads/{name} && chmod 644 /opt/mestigo/uploads/{name}",
                timeout=60,
            )[1].read()
            remote = f"/uploads/{name}"
            body = dict(product)
            body["img"] = remote
            api("PUT", f"/products/{product['id']}", tok, body)
            ok += 1
            print(f"{i:02d}/{len(JOBS)} {ru_name(product)} -> {remote}", flush=True)
        except Exception as e:
            fails.append({"stem": stem, "error": str(e)})
            print(f"{i:02d}/{len(JOBS)} FAIL {stem}: {e}", flush=True)
            time.sleep(1)
    client.close()
    print(json.dumps({"updated": ok, "fails": fails}, ensure_ascii=False))


if __name__ == "__main__":
    main()
