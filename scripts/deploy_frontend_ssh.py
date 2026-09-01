# -*- coding: utf-8 -*-
"""Build is assumed done. Upload dist/ to production nginx root via SSH."""
from __future__ import annotations

import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = "62.60.148.232"
USER = "root"
REMOTE_ROOT = "/var/www/mestidelivery"
DIST = Path(__file__).resolve().parents[1] / "dist"


def main() -> None:
    password = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("MESTI_SSH_PASSWORD", "")
    if not password:
        raise SystemExit("Usage: python scripts/deploy_frontend_ssh.py <ssh_password>")

    if not (DIST / "index.html").exists():
        raise SystemExit(f"Missing build: {DIST / 'index.html'}")

    tmp = Path(tempfile.gettempdir()) / "mestidelivery-frontend-dist.tar.gz"
    with tarfile.open(tmp, "w:gz") as tar:
        tar.add(DIST, arcname="dist")
    print(f"packed {tmp} ({tmp.stat().st_size} bytes)")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=password, timeout=30)
    sftp = client.open_sftp()
    remote_tar = "/tmp/mestidelivery-frontend-dist.tar.gz"
    sftp.put(str(tmp), remote_tar)
    sftp.close()
    print("uploaded tar")

    script = f"""
set -e
TS=$(date +%s)
mkdir -p {REMOTE_ROOT}/backups
cp -a {REMOTE_ROOT}/dist {REMOTE_ROOT}/backups/dist.$TS
rm -rf /tmp/md-dist-new
mkdir -p /tmp/md-dist-new
tar -xzf {remote_tar} -C /tmp/md-dist-new
rm -rf {REMOTE_ROOT}/dist/*
cp -a /tmp/md-dist-new/dist/. {REMOTE_ROOT}/dist/
chown -R www-data:www-data {REMOTE_ROOT}/dist
test -f {REMOTE_ROOT}/dist/index.html
ls -la {REMOTE_ROOT}/dist | head -15
echo DEPLOY_OK
"""
    stdin, stdout, stderr = client.exec_command(script)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    print(out)
    if err.strip():
        print(err)
    client.close()
    if code != 0:
        raise SystemExit(code)
    print("deployed")


if __name__ == "__main__":
    main()
