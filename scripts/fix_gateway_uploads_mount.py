# -*- coding: utf-8 -*-
"""Force recreate gateway with uploads bind-mount; sync all jpg files."""
from __future__ import annotations

import sys
import paramiko

HOST = "62.60.148.232"


def main() -> None:
    pw = sys.argv[1]
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=pw, timeout=30)

    cmds = [
        # copy any container uploads into host dir
        "mkdir -p /opt/mestigo/uploads && chmod 777 /opt/mestigo/uploads",
        "docker cp gateway_service:/app/uploads/. /opt/mestigo/uploads/ 2>/dev/null || true",
        "ls /opt/mestigo/uploads | wc -l",
        # ensure compose has bind mount
        "grep -n uploads /opt/mestigo/docker-compose.yml || true",
        # recreate gateway so mount applies
        "cd /opt/mestigo && docker compose up -d --force-recreate gateway-service",
        "sleep 3",
        "docker exec -u root gateway_service sh -c 'ls /app/uploads | wc -l; ls -la /app/uploads | head -15'",
        "docker inspect gateway_service --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{\"\\n\"}}{{end}}'",
        # quick HTTP check
        "curl -sI http://127.0.0.1:8080/uploads/$(ls /opt/mestigo/uploads | head -1) | head -5",
    ]
    for cmd in cmds:
        print("===", cmd)
        _, o, e = c.exec_command(cmd, timeout=180)
        print((o.read() + e.read()).decode()[:4000])
    c.close()


if __name__ == "__main__":
    main()
