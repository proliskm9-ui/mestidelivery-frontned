# -*- coding: utf-8 -*-
"""Confirm pending cash orders via admin API (workaround when gateway lacks auto-confirm)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "https://mestidelivery.com/api"


def req(method: str, path: str, token: str, body: dict | None = None) -> dict | list:
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def login(user: str, password: str) -> str:
    auth = req("POST", "/auth/login", "", body={"username": user, "password": password})
    return auth["token"]


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: confirm_pending_cash_orders.py <admin_user> <admin_password>", file=sys.stderr)
        sys.exit(2)

    token = login(sys.argv[1], sys.argv[2])
    orders = req("GET", "/orders/admin?limit=100", token)
    if not isinstance(orders, list):
        print("unexpected orders response", orders)
        sys.exit(1)

    confirmed = 0
    for o in orders:
        if o.get("status") != "pending":
            continue
        if str(o.get("payment_method", "")).lower() != "cash":
            continue
        oid = o.get("id")
        if not oid:
            continue
        try:
            req("PATCH", f"/orders/{oid}/status", token, body={"status": "confirmed:cash"})
            confirmed += 1
            print(f"confirmed order #{oid} restaurant={o.get('restaurant_id')}")
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            print(f"FAIL order #{oid}: HTTP {e.code} {err}", file=sys.stderr)

    print(json.dumps({"checked": len(orders), "confirmed": confirmed}))


if __name__ == "__main__":
    main()
