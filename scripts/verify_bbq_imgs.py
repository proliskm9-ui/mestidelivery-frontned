# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import urllib.error
import urllib.request

BASE = "https://mestidelivery.com"


def main() -> None:
    req = urllib.request.Request(
        f"{BASE}/api/auth/login",
        data=json.dumps({"username": "admin", "password": "423Qq!cv"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        token = json.loads(resp.read().decode())["token"]

    req = urllib.request.Request(
        f"{BASE}/api/products/?restaurant_id=rest-1785110335267403964&limit=1000",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        products = json.loads(resp.read().decode())

    for p in products[:5]:
        name = p.get("name") or ""
        if str(name).startswith("{"):
            name = json.loads(name).get("ru", name)
        img = p.get("img") or ""
        print(f"PRODUCT {name} => {img}")
        for prefix in [BASE, f"{BASE}/api"]:
            url = img if img.startswith("http") else f"{prefix}{img if img.startswith('/') else '/' + img}"
            try:
                with urllib.request.urlopen(url, timeout=20) as r:
                    print(f"  OK {url} {r.status} {r.headers.get('content-type')} len={r.headers.get('content-length')}")
            except urllib.error.HTTPError as e:
                print(f"  FAIL {url} HTTP {e.code}")
            except Exception as e:
                print(f"  FAIL {url} {e}")


if __name__ == "__main__":
    main()
