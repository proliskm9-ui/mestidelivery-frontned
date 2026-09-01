# -*- coding: utf-8 -*-
"""Hard-delete Sunset product «Жареная курица с аджикой»."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, r"C:\MestiDelivery\Frontend\scripts")
from upload_sunset_background_photos import localized_ru  # noqa: E402

BASE = "https://mestidelivery.com/api"
RID = "rest-1785108442716453469"
NEEDLE = "Жареная курица с аджикой"


def login() -> str:
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": "admin", "password": "423Qq!cv"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    return json.loads(urllib.request.urlopen(req, timeout=60).read())["token"]


def main() -> None:
    token = login()
    req = urllib.request.Request(
        f"{BASE}/products/?restaurant_id={RID}&limit=1000",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    products = json.loads(urllib.request.urlopen(req, timeout=90).read())
    hits = [p for p in products if NEEDLE.lower() in localized_ru(p.get("name")).lower()]
    if not hits:
        print("already gone")
        return
    for p in hits:
        pid = p["id"]
        # try DELETE
        req = urllib.request.Request(
            f"{BASE}/products/{pid}",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            method="DELETE",
        )
        try:
            urllib.request.urlopen(req, timeout=90)
            print("deleted", pid, localized_ru(p.get("name")))
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            print("DELETE fail", e.code, body[:300])
            # fallback hide
            from upload_sunset_background_photos import product_payload

            payload = product_payload(p, p.get("img") or "")
            payload["is_available"] = False
            req2 = urllib.request.Request(
                f"{BASE}/products/{pid}",
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json; charset=utf-8",
                },
                method="PUT",
            )
            urllib.request.urlopen(req2, timeout=90)
            print("hidden is_available=false", pid)


if __name__ == "__main__":
    main()
