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
        "grep -E 'BOT_BASE|BOT_HTTP|PARTNERS' /opt/mestigo/.env /opt/mestigo/docker-compose.yml 2>/dev/null",
        "cd /opt/mestigo && docker compose exec -T gateway-service sh -c 'printenv | grep BOT'",
        "ss -lntp | grep -E '5006[0-2]' || netstat -lntp | grep -E '5006[0-2]'",
        "cd /opt/mestigo && docker compose logs gateway-service 2>&1 | grep -i 'bot dispatcher\\|NotifyNewOrder\\|bot hook' | tail -20",
    ]
    for cmd in cmds:
        print(f"=== {cmd} ===")
        _, stdout, stderr = client.exec_command(cmd, timeout=90)
        print((stdout.read().decode("utf-8", "replace") + stderr.read().decode("utf-8", "replace"))[:10000] or "(empty)")
    client.close()


if __name__ == "__main__":
    main()
