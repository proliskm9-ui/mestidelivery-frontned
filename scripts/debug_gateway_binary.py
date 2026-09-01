# -*- coding: utf-8 -*-
from __future__ import annotations

import sys
import paramiko

HOST = "62.60.148.232"


def main() -> None:
    pw = sys.argv[1]
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=pw, timeout=30)
    cmds = [
        "docker exec gateway_service sh -c 'strings ./service-binary | grep auto-confirm | head'",
        "docker exec gateway_service sh -c 'strings ./service-binary | grep failed.to.auto-confirm | head'",
        'journalctl -u mesti-partners-bot --no-pager --since "2026-07-27 11:33" -n 40',
        "cd /opt/mestigo && docker compose logs gateway-service --since 30m 2>&1 | tail -40",
    ]
    for cmd in cmds:
        print(f"=== {cmd} ===")
        _, stdout, stderr = client.exec_command(cmd, timeout=90)
        print((stdout.read().decode("utf-8", "replace") + stderr.read().decode("utf-8", "replace"))[:10000] or "(empty)")
    client.close()


if __name__ == "__main__":
    main()
