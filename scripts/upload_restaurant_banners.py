# -*- coding: utf-8 -*-
"""Upload restaurant preview banners and attach to restaurant.img + screen."""
import json, sys, time, uuid, urllib.request
from pathlib import Path
import paramiko
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"
USER_ASSETS = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
REPO_ASSETS = Path(r"c:\MestiDelivery\Frontend\Assets")
OUT = Path(r"c:\MestiDelivery\Frontend\scripts\menu_photos\banners")
OUT.mkdir(parents=True, exist_ok=True)

BANNERS = [
    ("rest-1785110335267403964", "BBQ Garden", "banner_bbq_garden.png"),
    ("rest-1785108442716453469", "Sunset Restaraunt", "banner_sunset.png"),
    ("rest-1785203738440428065", "BURGERS", "banner_burgers.png"),
    ("rest-1785095837937828031", "Luizastan", "banner_luizastan.png"),
]

def login():
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": "admin", "password": "423Qq!cv"}).encode(),
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
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}

def compress(src: Path, stem: str) -> Path:
    dest = OUT / f"{stem}.jpg"
    im = Image.open(src).convert("RGB")
    # target ~1376x768 (≈286/160 * scale) for sharp cards
    w, h = im.size
    target_ratio = 286 / 160
    cur = w / h
    if cur > target_ratio:
        nw = int(round(h * target_ratio))
        left = (w - nw) // 2
        im = im.crop((left, 0, left + nw, h))
    else:
        nh = int(round(w / target_ratio))
        top = (h - nh) // 2
        im = im.crop((0, top, w, top + nh))
    im = im.resize((1376, 768), Image.Resampling.LANCZOS)
    im.save(dest, "JPEG", quality=88, optimize=True)
    # also save to Assets
    for d in (USER_ASSETS, REPO_ASSETS):
        im.save(d / f"{stem}.jpg", "JPEG", quality=88, optimize=True)
        src_png = USER_ASSETS / f"{stem.replace('banner_', 'banner_').replace('.jpg','')}.png"
    return dest

def ssh_upload(client, local: Path) -> str:
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

token = login()
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password="IW42VUUxBlQgRc1I", timeout=40)

# fetch restaurants map
rests = api("GET", "/restaurants/?limit=50", token)
if isinstance(rests, dict):
    rests = rests.get("restaurants") or rests.get("items") or rests.get("data") or []
by_id = {r["id"]: r for r in rests}

for rid, label, fname in BANNERS:
    src = USER_ASSETS / fname
    if not src.exists():
        print("MISSING", src)
        continue
    stem = fname.replace(".png", "")
    local = compress(src, stem)
    remote = ssh_upload(client, local)
    r = dict(by_id[rid])
    r["img"] = remote
    r["screen"] = remote
    # keep required fields
    api("PUT", f"/restaurants/{rid}", token, r)
    print(f"OK {label} -> {remote} ({local.stat().st_size} bytes)")

client.close()
print("DONE")
