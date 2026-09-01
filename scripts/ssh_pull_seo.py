# -*- coding: utf-8 -*-
"""Pull live SEO-related files from prod."""
from __future__ import annotations

import sys
from pathlib import Path

import paramiko

HOST = "62.60.148.232"
USER = "root"
PASSWORD = sys.argv[1]
OUT = Path(__file__).resolve().parents[1] / "scripts" / "_prod_seo"

FILES = [
    "/var/www/mestidelivery/dist/index.html",
    "/var/www/mestidelivery/dist/robots.txt",
    "/var/www/mestidelivery/dist/sitemap.xml",
    "/var/www/mestidelivery/dist/manifest.json",
    "/etc/nginx/sites-enabled/mestidelivery.com",
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()
    for remote in FILES:
        name = remote.replace("/", "_").lstrip("_")
        local = OUT / name
        try:
            sftp.get(remote, str(local))
            print(f"OK {remote} -> {local.name} ({local.stat().st_size} bytes)")
        except Exception as e:
            print(f"MISS {remote}: {e}")
    # list dist top
    stdin, stdout, stderr = client.exec_command("ls -la /var/www/mestidelivery/dist | head -60", timeout=30)
    print(stdout.read().decode())
    stdin, stdout, stderr = client.exec_command(
        "ls /var/www/mestidelivery/dist | rg -i 'robot|sitemap|manifest|favicon|apple|og|seo' || ls /var/www/mestidelivery/dist",
        timeout=30,
    )
    print(stdout.read().decode())
    sftp.close()
    client.close()


if __name__ == "__main__":
    main()
