# -*- coding: utf-8 -*-
"""Inspect prod frontend path + SEO on remote server."""
from __future__ import annotations

import sys
import paramiko

HOST = "62.60.148.232"
USER = "root"
PASSWORD = sys.argv[1] if len(sys.argv) > 1 else ""

CMDS = [
    "hostname; uname -a",
    "ls -la /var/www 2>/dev/null; ls -la /var/www/html 2>/dev/null; ls -la /usr/share/nginx/html 2>/dev/null",
    "nginx -t 2>&1 | head -20; ls /etc/nginx/sites-enabled 2>/dev/null; ls /etc/nginx/conf.d 2>/dev/null",
    "grep -R --include='*.conf' -n 'mestidelivery\\|root \\|server_name' /etc/nginx 2>/dev/null | head -80",
    "find /var/www /opt /home /srv -maxdepth 4 -name 'index.html' 2>/dev/null | head -40",
    "test -f /var/www/mestidelivery/index.html && head -c 8000 /var/www/mestidelivery/index.html; true",
]


def main() -> None:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    for cmd in CMDS:
        print(f"\n===== {cmd[:80]} =====")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        if out:
            print(out[:12000])
        if err:
            print("STDERR:", err[:2000])
    client.close()


if __name__ == "__main__":
    main()
