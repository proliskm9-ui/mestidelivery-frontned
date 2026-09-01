# -*- coding: utf-8 -*-
"""Compress all BBQ Garden AI photos, upload into gateway, attach to products,
and make /app/uploads persistent via docker volume."""
from __future__ import annotations

import json
import re
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

# (local stem without ext, RU name needle) — order matters for ambiguous matches
PHOTO_MAP = [
    ("bbq_01_oatmeal", "Овсяная каша"),
    ("bbq_02_cottage_cheese", "Творог с мёдом"),
    ("bbq_03_omelet", "Омлет с сыром"),
    ("bbq_04_cheese_sandwich", "Тост-сэндвич с сыром"),
    ("bbq_05_ham_cheese_sandwich", "Тост-сэндвич с ветчиной"),
    ("bbq_06_borscht", "Борщ"),
    ("bbq_07_matsoni_soup", "мацони"),
    ("bbq_08_pork_bbq", "свинины"),
    ("bbq_09_chicken_bbq", "курицы"),
    ("bbq_10_kebab_lavash", "Кебаб"),
    ("bbq_11_khachapuri", "Хачапури"),
    ("bbq_12_trout", "Форель"),
    ("bbq_13_grilled_veg", "Овощи на гриле"),
    ("bbq_14_wings", "крылышки"),
    ("bbq_15_kupati", "Купаты"),
    ("bbq_16_sausages", "Сосиски"),
    ("bbq_17_fries", "Картофель фри"),
    ("bbq_19_salad_walnuts", "огурцов с орехами"),  # tomato cucumber with nuts first
    ("bbq_18_tomato_cucumber", "помидоров и огурцов"),
    ("bbq_20_beetroot", "свёклы"),
    ("bbq_21_carrot", "Морковный"),
    ("bbq_22_beans_walnut", "Фасоль"),
    ("bbq_23_pickles", "Маринованные"),
    ("bbq_24_cheese_plate", "сыров"),
    ("bbq_25_bread", "Хлеб"),
    ("bbq_26_tkemali", "Ткемали"),
    ("bbq_27_ketchup", "Кетчуп"),
    ("bbq_28_mayo", "Майонез"),
    ("bbq_29_pudding", "пудинг"),
    ("bbq_30_cake", "Торт дня"),
    ("bbq_31_icecream", "Мороженое"),
    ("bbq_32_cream_fruit", "Крем с фруктами"),
    ("bbq_33_churchkhela", "Чурчхела"),
    ("bbq_34_peanuts", "Арахис"),
    ("bbq_35_espresso", "Эспрессо"),
    ("bbq_36_americano", "Американо"),
    ("bbq_37_cappuccino", "Капучино"),
    ("bbq_38_tea", "чай"),
    ("bbq_39_lemonade", "лимонад"),
    ("bbq_40_cola", "Coca-Cola"),
    ("bbq_42_sparkling", "Газированная"),
    ("bbq_41_water", "Минеральная вода"),
    ("bbq_43_juice", "Сок"),
    ("bbq_44_kompot", "Компот"),
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


def compress_all() -> dict[str, Path]:
    OUT.mkdir(parents=True, exist_ok=True)
    out: dict[str, Path] = {}
    for stem, _ in PHOTO_MAP:
        src = ASSETS / f"{stem}.webp"
        if not src.exists():
            # also try jpg already in OUT from first batch
            alt = OUT / f"{stem.replace('bbq_', '').split('_', 1)[-1]}.jpg"
            # map first 5 old names
            legacy = {
                "bbq_01_oatmeal": "01_oatmeal.jpg",
                "bbq_02_cottage_cheese": "02_cottage_cheese.jpg",
                "bbq_03_omelet": "03_omelet.jpg",
                "bbq_04_cheese_sandwich": "04_cheese_sandwich.jpg",
                "bbq_05_ham_cheese_sandwich": "05_ham_cheese_sandwich.jpg",
            }
            if stem in legacy and (OUT / legacy[stem]).exists():
                out[stem] = OUT / legacy[stem]
                continue
            print(f"MISSING {src}")
            continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        im = im.crop((left, top, left + side, top + side))
        if side > 900:
            im = im.resize((900, 900), Image.Resampling.LANCZOS)
        dest = OUT / f"{stem}.jpg"
        im.save(dest, "JPEG", quality=80, optimize=True)
        out[stem] = dest
        print(f"compressed {stem} {dest.stat().st_size // 1024}KB")
    return out


def ensure_uploads_volume(client: paramiko.SSHClient) -> None:
    # copy existing uploads out, patch compose, recreate with bind mount
    cmds_pre = [
        "mkdir -p /opt/mestigo/uploads && chmod 777 /opt/mestigo/uploads",
        "docker exec gateway_service sh -c 'ls /app/uploads 2>/dev/null | wc -l' || true",
        "docker cp gateway_service:/app/uploads/. /opt/mestigo/uploads/ 2>/dev/null || true",
    ]
    for cmd in cmds_pre:
        _, o, e = client.exec_command(cmd, timeout=60)
        print(cmd, "->", (o.read() + e.read()).decode()[:200])

    sftp = client.open_sftp()
    with sftp.open("/opt/mestigo/docker-compose.yml", "r") as f:
        compose = f.read().decode("utf-8")
    if "/opt/mestigo/uploads:/app/uploads" not in compose:
        # insert volume under gateway-service volumes
        if "volumes:\n      - sqlite_data:/app/data" in compose:
            compose = compose.replace(
                "volumes:\n      - sqlite_data:/app/data",
                "volumes:\n      - sqlite_data:/app/data\n      - /opt/mestigo/uploads:/app/uploads",
                1,
            )
        else:
            print("WARN: could not patch compose volumes automatically")
        with sftp.open("/opt/mestigo/docker-compose.yml", "w") as f:
            f.write(compose.encode("utf-8"))
        print("compose patched")
    sftp.close()

    _, o, e = client.exec_command(
        "cd /opt/mestigo && docker compose up -d gateway-service && "
        "docker exec -u root gateway_service sh -c 'mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads && ls -la /app/uploads | head'",
        timeout=120,
    )
    print((o.read() + e.read()).decode()[:3000])


def main() -> None:
    user, password, ssh_pw = sys.argv[1], sys.argv[2], sys.argv[3]
    files = compress_all()
    token = login(user, password)
    print("login ok")

    rests = api("GET", "/restaurants/", token)
    bbq = next(r for r in rests if "bbq" in str(r.get("name", "")).lower())
    rid = bbq["id"]
    products = api("GET", f"/products/?restaurant_id={rid}&limit=1000", token)
    print("products", len(products))

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)
    ensure_uploads_volume(client)

    sftp = client.open_sftp()
    remote_tmp = "/tmp/bbq_menu_photos"
    try:
        sftp.mkdir(remote_tmp)
    except IOError:
        pass

    used_ids: set[str] = set()
    ok = fail = 0
    for stem, needle in PHOTO_MAP:
        local = files.get(stem)
        if not local or not local.exists():
            print("SKIP file", stem)
            fail += 1
            continue
        matches = [
            p
            for p in products
            if needle.lower() in product_ru(p).lower() and p["id"] not in used_ids
        ]
        if not matches:
            print("SKIP product", needle)
            fail += 1
            continue
        # prefer exact-ish: for tomato cucumber without nuts exclude "орехами"
        if stem == "bbq_18_tomato_cucumber":
            matches = [p for p in matches if "орех" not in product_ru(p).lower()]
        if stem == "bbq_41_water":
            matches = [p for p in matches if "газир" not in product_ru(p).lower()]
        if stem == "bbq_09_chicken_bbq":
            matches = [p for p in matches if "крыл" not in product_ru(p).lower()]
        if not matches:
            print("SKIP filtered", needle)
            fail += 1
            continue
        p = sorted(matches, key=lambda x: len(product_ru(x)))[0]
        used_ids.add(p["id"])
        new_name = f"{uuid.uuid4().hex}.jpg"
        remote_file = f"{remote_tmp}/{new_name}"
        sftp.put(str(local), remote_file)
        # host bind mount path
        _, o, e = client.exec_command(
            f"cp {remote_file} /opt/mestigo/uploads/{new_name} && "
            f"docker exec -u root gateway_service chown appuser:appgroup /app/uploads/{new_name} 2>/dev/null; "
            f"chmod 644 /opt/mestigo/uploads/{new_name}",
            timeout=60,
        )
        _ = o.read(), e.read()
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
        try:
            api("PUT", f"/products/{p['id']}", token, body)
            ok += 1
            print(f"OK {product_ru(p)} -> {url}")
        except Exception as ex:
            fail += 1
            print(f"FAIL {product_ru(p)}: {ex}")

    sftp.close()
    client.close()
    print(json.dumps({"ok": ok, "fail": fail}))


if __name__ == "__main__":
    main()
