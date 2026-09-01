# -*- coding: utf-8 -*-
from __future__ import annotations

import sys
import paramiko

HOST = "62.60.148.232"


def run(client: paramiko.SSHClient, cmd: str) -> str:
    _, stdout, stderr = client.exec_command(cmd, timeout=120)
    return stdout.read().decode("utf-8", "replace") + stderr.read().decode("utf-8", "replace")


def main() -> None:
    pw = sys.argv[1]
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=pw, timeout=30)

    logs = run(client, "cd /opt/mestigo && docker compose logs gateway-service --since 4h 2>&1")
    needles = ("order", "confirm", "cash", "Notify", "failed", "POST", "orders", "payment")
    print("=== FILTERED GATEWAY LOGS ===")
    for line in logs.splitlines():
        low = line.lower()
        if any(n in low for n in needles):
            print(line)

    print("\n=== ORDER SERVICE LOGS ===")
    print(run(client, "cd /opt/mestigo && docker compose logs order-service --since 4h 2>&1"))

    print("\n=== ENV BOT SETTINGS ===")
    print(run(client, "grep -E 'BOT|PARTNER|WEBHOOK' /opt/mestigo/.env 2>/dev/null || true"))

    client.close()


if __name__ == "__main__":
    main()
