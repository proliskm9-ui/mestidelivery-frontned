# -*- coding: utf-8 -*-
"""Upload cleaned hero-frames to prod (tar + extract)."""
from __future__ import annotations

import io
import sys
import tarfile
import time
from pathlib import Path

import paramiko

HOST = "62.60.148.232"
USER = "root"
PASSWORD = sys.argv[1]
LOCAL = Path(__file__).resolve().parents[1] / "public" / "hero-frames"
REMOTE_DIST = "/var/www/mestidelivery/dist"
REMOTE_TAR = f"/tmp/hero-frames-wm7-{int(time.time())}.tar"


def log(msg: str) -> None:
    print(msg, flush=True)


def main() -> None:
    if not LOCAL.is_dir():
        raise SystemExit(f"missing {LOCAL}")

    log(f"packing {LOCAL} ...")
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w") as tar:
        tar.add(str(LOCAL), arcname="hero-frames")
    data = buf.getvalue()
    log(f"tar size {len(data) / 1024 / 1024:.1f} MB")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    log(f"connecting {HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30, banner_timeout=30)
    log("connected")

    sftp = client.open_sftp()
    log(f"uploading {REMOTE_TAR}...")
    with sftp.file(REMOTE_TAR, "wb") as rf:
        rf.write(data)
    sftp.close()
    log("uploaded")

    cmd = (
        f"set -e; "
        f"mkdir -p {REMOTE_DIST}; "
        f"rm -rf {REMOTE_DIST}/hero-frames; "
        f"tar -xf {REMOTE_TAR} -C {REMOTE_DIST}; "
        f"chown -R www-data:www-data {REMOTE_DIST}/hero-frames; "
        f"rm -f {REMOTE_TAR}; "
        f"test -f {REMOTE_DIST}/hero-frames/poster.webp; "
        f"test -f {REMOTE_DIST}/hero-frames/desktop/frame_0001.webp; "
        f"ls {REMOTE_DIST}/hero-frames/desktop | wc -l; "
        f"echo HERO_OK"
    )
    log("extracting on server...")
    _, stdout, stderr = client.exec_command(cmd, timeout=300)
    out = stdout.read().decode()
    err = stderr.read().decode()
    log(out)
    if err.strip():
        log("stderr: " + err)
    if "HERO_OK" not in out:
        raise SystemExit("hero-frames deploy failed")
    log("HERO_FRAMES_DONE")
    client.close()


if __name__ == "__main__":
    main()
