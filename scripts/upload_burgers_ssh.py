# -*- coding: utf-8 -*-
"""Upload BURGERS photos via SSH + attach to products."""
import sys, json, time, uuid, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path
import paramiko
from PIL import Image

BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"
RID = "rest-1785203738440428065"
REPO = Path(r"c:\MestiDelivery\Frontend")
USER = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
ASSETS = [USER, REPO / "Assets"]
OUT = REPO / "scripts" / "menu_photos" / "burgers"
OUT.mkdir(parents=True, exist_ok=True)
PHOTO_MAP = json.loads((REPO / "scripts" / "_burgers_photo_map.json").read_text(encoding="utf-8"))

def login():
    for attempt in range(6):
        try:
            req = urllib.request.Request(
                f"{BASE}/auth/login",
                data=json.dumps({"username": "admin", "password": "423Qq!cv"}).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            return json.loads(urllib.request.urlopen(req, timeout=90).read())["token"]
        except Exception as e:
            print("login retry", attempt, e)
            time.sleep(2 + attempt)
    raise RuntimeError("login failed")

def api(method, path, token, body=None):
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
    raise RuntimeError(f"api {method} {path}: {last}")

def localized_ru(name):
    if isinstance(name, dict):
        return name.get("ru") or name.get("en") or ""
    if not name:
        return ""
    try:
        return json.loads(name).get("ru") or name
    except Exception:
        return str(name)

def find_src(stem):
    for d in ASSETS:
        for name in (stem, stem.replace("-", "_")):
            for ext in (".png", ".jpg", ".jpeg", ".webp"):
                p = d / f"{name}{ext}"
                if p.exists():
                    return p
    raise FileNotFoundError(stem)

def compress(stem):
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

def product_payload(p, img):
    body = dict(p)
    body["img"] = img
    # keep required fields stable
    return body

token = login()
prods = api("GET", f"/products/?restaurant_id={RID}&limit=1000", token)
if isinstance(prods, dict):
    prods = prods.get("products") or prods.get("items") or prods.get("data") or []
by_ru = {localized_ru(p.get("name")): p for p in prods}
print("products", len(by_ru), list(by_ru.keys()))

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password="IW42VUUxBlQgRc1I", timeout=40)

ok = fail = 0
for stem, ru in PHOTO_MAP:
    try:
        local = compress(stem)
        name = f"{uuid.uuid4().hex}.jpg"
        sftp = client.open_sftp()
        sftp.put(str(local), f"/tmp/{name}")
        sftp.close()
        _, o, e = client.exec_command(
            f"cp /tmp/{name} /opt/mestigo/uploads/{name} && chmod 644 /opt/mestigo/uploads/{name}",
            timeout=60,
        )
        _ = o.read(), e.read()
        remote = f"/uploads/{name}"
        p = by_ru.get(ru)
        if not p:
            print("NO MATCH", ru)
            fail += 1
            continue
        body = dict(p)
        body["img"] = remote
        api("PUT", f"/products/{p['id']}", token, body)
        print("OK", ru, "->", remote, local.stat().st_size)
        ok += 1
    except Exception as ex:
        print("FAIL", stem, ru, ex)
        fail += 1

client.close()
print(f"DONE ok={ok} fail={fail}")
