# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, r"C:\MestiDelivery\Frontend\scripts")
from upload_sunset_background_photos import localized_ru, product_payload  # noqa: E402

BASE = "https://mestidelivery.com/api"
RID = "rest-1785108442716453469"


def main() -> None:
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": "admin", "password": "423Qq!cv"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    token = json.loads(urllib.request.urlopen(req, timeout=60).read())["token"]
    req = urllib.request.Request(
        f"{BASE}/products/?restaurant_id={RID}&limit=1000",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    products = json.loads(urllib.request.urlopen(req, timeout=90).read())
    p = next(x for x in products if localized_ru(x.get("name")) == "Жареная курица")
    name = p.get("name")
    if isinstance(name, str) and name.strip().startswith("{"):
        name = json.loads(name)
    elif not isinstance(name, dict):
        name = {"ru": str(name)}
    name.update({"ru": "Цыплёнок табака", "en": "Chicken tabaka", "ka": "წიწილა ტაბაკა"})
    desc = p.get("description")
    if isinstance(desc, str) and desc.strip().startswith("{"):
        desc = json.loads(desc)
    elif isinstance(desc, str):
        desc = {"ru": desc}
    if not isinstance(desc, dict):
        desc = {}
    desc.update(
        {
            "ru": "Хрустящий цыплёнок табака, зажаренный под прессом до золотистой корочки.\nСочное мясо и ароматная корочка — классика грузинской кухни.",
            "en": "Crispy chicken tabaka pressed and fried to a golden crust.\nJuicy meat and fragrant skin — a Georgian classic.",
            "ka": "ხრაშუნა წიწილა ტაბაკა პრესის ქვეშ ოქროსფერ ქერქამდე შემწვარი.\nწვნიანი ხორცი და არომატული ქერქი — ქართული კლასიკა.",
        }
    )
    body = product_payload(p, p.get("img") or "")
    body["name"] = json.dumps(name, ensure_ascii=False)
    body["description"] = json.dumps(desc, ensure_ascii=False)
    req = urllib.request.Request(
        f"{BASE}/products/{p['id']}",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
        },
        method="PUT",
    )
    try:
        urllib.request.urlopen(req, timeout=90)
    except Exception as e:
        err = e.read().decode() if hasattr(e, "read") else str(e)
        print("ERR", err)
        raise
    print("renamed", p["id"], "->", name["ru"])


if __name__ == "__main__":
    main()
