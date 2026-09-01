# -*- coding: utf-8 -*-
"""Docker logs for mestigo backend on prod."""
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
        "cd /opt/mestigo && docker compose ps -a",
        "cd /opt/mestigo && docker compose logs gateway --tail 200 2>&1",
        "cd /opt/mestigo && docker compose logs order --tail 120 2>&1",
        "cd /opt/mestigo && docker compose logs partners-bot --tail 80 2>&1 || true",
        "journalctl -u mesti-partners-bot --no-pager -n 80",
    ]
    for cmd in cmds:
        print(f"\n=== {cmd} ===")
        _, stdout, stderr = client.exec_command(cmd, timeout=120)
        print((stdout.read().decode("utf-8", "replace") + stderr.read().decode("utf-8", "replace"))[:20000] or "(empty)")
    client.close()


if __name__ == "__main__":
    main()
