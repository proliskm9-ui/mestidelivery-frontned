# -*- coding: utf-8 -*-
"""Fix gateway uploads dir permissions, SFTP photos in, update product img fields."""
from __future__ import annotations

import json
import sys
import uuid
import urllib.request
from pathlib import Path

import paramiko

BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"
PHOTOS = Path(__file__).resolve().parent / "menu_photos" / "bbq_garden"
PHOTO_MAP = [
    ("Овсяная каша", "01_oatmeal.jpg"),
    ("Творог с мёдом", "02_cottage_cheese.jpg"),
    ("Омлет с сыром", "03_omelet.jpg"),
    ("Тост-сэндвич с сыром", "04_cheese_sandwich.jpg"),
    ("Тост-сэндвич с ветчиной", "05_ham_cheese_sandwich.jpg"),
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
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def product_ru(p: dict) -> str:
    name = p.get("name") or ""
    if isinstance(name, str) and name.strip().startswith("{"):
        try:
            return json.loads(name).get("ru") or name
        except Exception:
            return name
    return str(name)


def main() -> None:
    admin_user, admin_pw, ssh_pw = sys.argv[1], sys.argv[2], sys.argv[3]
    token = login(admin_user, admin_pw)
    print("login ok")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)

    # Inspect compose + create host uploads volume path
    _, out, _ = client.exec_command(
        "grep -A40 'gateway-service:' /opt/mestigo/docker-compose.yml | head -50; "
        "id=$(docker compose -f /opt/mestigo/docker-compose.yml ps -q gateway-service); "
        "echo CID=$id; docker inspect $id --format '{{json .Mounts}}'",
        timeout=60,
    )
    print(out.read().decode()[:4000])

    # Create uploads inside container as root, chown to appuser
    cmds = [
        "docker exec -u root gateway_service sh -c 'mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads && chmod 775 /app/uploads && ls -la /app'",
        "mkdir -p /opt/mestigo/uploads && chmod 777 /opt/mestigo/uploads",
    ]
    for cmd in cmds:
        print("===", cmd)
        _, o, e = client.exec_command(cmd, timeout=60)
        print((o.read().decode() + e.read().decode())[:2000])

    # Upload files into container via docker cp from host after sftp
    sftp = client.open_sftp()
    remote_tmp = "/tmp/bbq_menu_photos"
    try:
        sftp.mkdir(remote_tmp)
    except IOError:
        pass

    rests = api("GET", "/restaurants/", token)
    bbq = next(r for r in rests if "bbq" in str(r.get("name", "")).lower())
    rid = bbq["id"]
    products = api("GET", f"/products/?restaurant_id={rid}&limit=1000", token)
    print(f"products {len(products)}")

    for needle, filename in PHOTO_MAP:
        matches = [p for p in products if needle.lower() in product_ru(p).lower()]
        if not matches:
            print("SKIP", needle)
            continue
        p = sorted(matches, key=lambda x: len(product_ru(x)))[0]
        local = PHOTOS / filename
        new_name = f"{uuid.uuid4().hex}.jpg"
        remote_file = f"{remote_tmp}/{new_name}"
        sftp.put(str(local), remote_file)
        # copy into container uploads
        _, o, e = client.exec_command(
            f"docker cp {remote_file} gateway_service:/app/uploads/{new_name} && "
            f"docker exec -u root gateway_service chown appuser:appgroup /app/uploads/{new_name}",
            timeout=60,
        )
        print(o.read().decode(), e.read().decode())
        url = f"/uploads/{new_name}"
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
        }
        api("PUT", f"/products/{p['id']}", token, body)
        print(f"UPDATED {product_ru(p)} -> {url}")

    # verify one product + file exists
    _, o, _ = client.exec_command("docker exec gateway_service ls -la /app/uploads | head -20", timeout=30)
    print(o.read().decode())
    sftp.close()
    client.close()
    print("DONE")


if __name__ == "__main__":
    main()
