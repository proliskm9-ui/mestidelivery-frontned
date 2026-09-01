# -*- coding: utf-8 -*-
"""Debug prod orders + admin users + optional SSH logs."""
from __future__ import annotations

import json
import sys
import urllib.request

import paramiko

BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"


def api_req(method: str, path: str, token: str | None = None, body: dict | None = None):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def main() -> None:
    password = sys.argv[1]
    ssh_pass = sys.argv[2] if len(sys.argv) > 2 else password

    auth = api_req("POST", "/auth/login", body={"username": "admin", "password": password})
    token = auth["token"]
    print("=== ORDERS ===")
    orders = api_req("GET", "/orders/admin?limit=20", token=token)
    for o in orders:
        print(
            json.dumps(
                {
                    "id": o.get("id"),
                    "status": o.get("status"),
                    "restaurant_id": o.get("restaurant_id"),
                    "payment_method": o.get("payment_method"),
                    "comment": o.get("comment"),
                    "total": o.get("total"),
                },
                ensure_ascii=False,
            )
        )

    print("\n=== ADMIN USERS ===")
    users = api_req("GET", "/admin/users", token=token)
    for u in users:
        print(
            json.dumps(
                {
                    "id": u.get("id"),
                    "username": u.get("username"),
                    "role": u.get("role"),
                    "restaurant_id": u.get("restaurant_id"),
                    "telegram_id": u.get("telegram_id"),
                },
                ensure_ascii=False,
            )
        )

    print("\n=== SSH LOGS (gateway) ===")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pass, timeout=30)
    cmds = [
        "systemctl list-units --type=service --state=running | grep -i mest || true",
        "journalctl -u gateway --no-pager -n 300 2>/dev/null | tail -80",
        "journalctl --no-pager -n 500 2>/dev/null | grep -i 'auto-confirm\\|NotifyNewOrder\\|Order successfully created\\|failed to auto-confirm' | tail -30",
        "ls -la /var/log/ 2>/dev/null | head -20",
        "find /opt /var/www /root -maxdepth 4 -name '*.log' 2>/dev/null | head -20",
    ]
    for cmd in cmds:
        print(f"\n--- {cmd[:100]} ---")
        _, stdout, stderr = client.exec_command(cmd, timeout=90)
        out = stdout.read().decode("utf-8", "replace")
        err = stderr.read().decode("utf-8", "replace")
        print((out + err)[:12000] or "(empty)")
    client.close()


if __name__ == "__main__":
    main()
