# -*- coding: utf-8 -*-
"""Audit BBQ Garden products: missing imgs + names."""
from __future__ import annotations

import json
import urllib.request

BASE = "https://mestidelivery.com/api"


def main() -> None:
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": "admin", "password": "423Qq!cv"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        token = json.loads(resp.read().decode())["token"]

    req = urllib.request.Request(f"{BASE}/restaurants/", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        rests = json.loads(resp.read().decode())
    bbq = next(r for r in rests if "bbq" in str(r.get("name", "")).lower())
    rid = bbq["id"]

    req = urllib.request.Request(
        f"{BASE}/products/?restaurant_id={rid}&limit=1000",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        products = json.loads(resp.read().decode())

    print(f"count={len(products)}")
    for p in products:
        name = p.get("name") or ""
        desc = p.get("description") or ""
        try:
            nj = json.loads(name) if str(name).startswith("{") else {"raw": name}
        except Exception:
            nj = {"raw": name}
        try:
            dj = json.loads(desc) if str(desc).startswith("{") else {"raw": desc}
        except Exception:
            dj = {"raw": desc}
        img = p.get("img") or ""
        broken = False
        if not img or "default" in img:
            broken = True
        else:
            url = f"https://mestidelivery.com{img}" if img.startswith("/") else img
            try:
                r = urllib.request.urlopen(url, timeout=15)
                if r.status != 200:
                    broken = True
            except Exception:
                broken = True
        print(
            json.dumps(
                {
                    "id": p.get("id"),
                    "cat": p.get("category"),
                    "ka": nj.get("ka"),
                    "ru": nj.get("ru"),
                    "en": nj.get("en"),
                    "desc_ru": (dj.get("ru") or "")[:60],
                    "desc_en": (dj.get("en") or "")[:60],
                    "img": img,
                    "img_ok": not broken,
                },
                ensure_ascii=False,
            )
        )


if __name__ == "__main__":
    main()
