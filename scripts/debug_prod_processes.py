# -*- coding: utf-8 -*-
"""Find gateway/backend process logs on prod."""
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
        "ps aux | grep -E 'gateway|order|auth|catalog|server_v2' | grep -v grep",
        "systemctl list-units --all | grep -iE 'mesti|gateway|order|auth|catalog'",
        "ls -la /opt /opt/mesti* /root 2>/dev/null | head -40",
        "find /opt -maxdepth 3 -type f -name '*.log' 2>/dev/null",
        "tail -n 80 /opt/bots/err.log 2>/dev/null",
        "tail -n 80 /opt/bots/e.log 2>/dev/null",
        "grep -R --include='*.service' -l 'gateway\\|server_v2\\|mesti' /etc/systemd/system 2>/dev/null | head -20",
    ]
    for cmd in cmds:
        print(f"\n=== {cmd} ===")
        _, stdout, stderr = client.exec_command(cmd, timeout=90)
        print((stdout.read().decode("utf-8", "replace") + stderr.read().decode("utf-8", "replace"))[:15000] or "(empty)")
    client.close()


if __name__ == "__main__":
    main()
