# -*- coding: utf-8 -*-
"""Fast prod deploy: shell + static + SEO. Keeps remote Assets/hero-frames."""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import paramiko

HOST = "62.60.148.232"
USER = "root"
PASSWORD = sys.argv[1]
LOCAL_DIST = Path(__file__).resolve().parents[1] / "dist"
REMOTE_DIST = "/var/www/mestidelivery/dist"
TS = int(time.time())


def log(msg: str) -> None:
    print(msg, flush=True)


def ensure_remote_dir(sftp: paramiko.SFTPClient, path: str) -> None:
    parts = path.strip("/").split("/")
    cur = ""
    for p in parts:
        cur += "/" + p
        try:
            sftp.stat(cur)
        except FileNotFoundError:
            sftp.mkdir(cur)


def upload_tree(sftp: paramiko.SFTPClient, local: Path, remote: str) -> int:
    count = 0
    for root, dirs, files in os.walk(local):
        rel = os.path.relpath(root, local).replace("\\", "/")
        rdir = remote if rel == "." else f"{remote}/{rel}"
        ensure_remote_dir(sftp, rdir)
        for d in dirs:
            ensure_remote_dir(sftp, f"{rdir}/{d}")
        for f in files:
            lp = Path(root) / f
            rp = f"{rdir}/{f}"
            sftp.put(str(lp), rp)
            count += 1
            if count % 20 == 0:
                log(f"  uploaded {count} files...")
    return count


def main() -> None:
    index = (LOCAL_DIST / "index.html").read_text(encoding="utf-8")
    for needle in ("GA_MEASUREMENT_ID", 'name="description"', "og:title", "application/ld+json"):
        if needle not in index:
            raise SystemExit(f"SEO missing: {needle}")
    for name in ("robots.txt", "sitemap.xml", "manifest.json"):
        if not (LOCAL_DIST / name).exists():
            raise SystemExit(f"missing {name}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    log(f"connecting {HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30, banner_timeout=30)
    log("connected")

    backup_cmd = (
        f"mkdir -p /var/www/mestidelivery/backups && "
        f"cp -a {REMOTE_DIST}/index.html /var/www/mestidelivery/backups/index.html.{TS} && "
        f"cp -a {REMOTE_DIST}/static /var/www/mestidelivery/backups/static.{TS} && "
        f"echo BACKUP_OK"
    )
    log("backing up index.html + static...")
    _, stdout, stderr = client.exec_command(backup_cmd, timeout=180)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if "BACKUP_OK" not in out:
        raise SystemExit(f"backup failed: {out}\n{err}")
    log("backup ok")

    log("replacing remote static/...")
    _, stdout, stderr = client.exec_command(
        f"rm -rf {REMOTE_DIST}/static && mkdir -p {REMOTE_DIST}/static && echo CLEARED",
        timeout=60,
    )
    if "CLEARED" not in stdout.read().decode():
        raise SystemExit("failed to clear static")

    sftp = client.open_sftp()

    # Upload critical shell / SEO files
    for name in ("index.html", "robots.txt", "sitemap.xml", "manifest.json", "sw.js"):
        lp = LOCAL_DIST / name
        if lp.exists():
            log(f"put {name}")
            sftp.put(str(lp), f"{REMOTE_DIST}/{name}")

    # Upload hashed assets
    log("uploading static/...")
    n = upload_tree(sftp, LOCAL_DIST / "static", f"{REMOTE_DIST}/static")
    log(f"static files: {n}")

    # Ensure default images exist (don't wipe Assets)
    for rel in (
        "Assets/default-food.png",
        "Assets/default-restaurant.png",
        "Assets/apple-touch-icon.png",
        "Assets/banner_ru.jpg",
    ):
        lp = LOCAL_DIST / rel
        if lp.exists():
            ensure_remote_dir(sftp, str(Path(REMOTE_DIST, rel).parent).replace("\\", "/"))
            log(f"put {rel}")
            sftp.put(str(lp), f"{REMOTE_DIST}/{rel}")

    sftp.close()

    log("fixing permissions...")
    client.exec_command(
        f"chown -R www-data:www-data {REMOTE_DIST}/index.html {REMOTE_DIST}/static "
        f"{REMOTE_DIST}/robots.txt {REMOTE_DIST}/sitemap.xml {REMOTE_DIST}/manifest.json "
        f"{REMOTE_DIST}/sw.js 2>/dev/null; echo PERMS_OK",
        timeout=60,
    )[1].channel.recv_exit_status()

    _, stdout, stderr = client.exec_command(
        f"grep -c GA_MEASUREMENT_ID {REMOTE_DIST}/index.html; "
        f"grep -c 'name=\"description\"' {REMOTE_DIST}/index.html; "
        f"grep -c og:title {REMOTE_DIST}/index.html; "
        f"test -f {REMOTE_DIST}/robots.txt && test -f {REMOTE_DIST}/sitemap.xml && echo SEO_OK; "
        f"ls {REMOTE_DIST}/static/index-*.js | head -1; "
        f"grep -o 'mestidelivery.com/api' {REMOTE_DIST}/static/index-*.js | head -1; "
        f"grep -c mestigo.opik.net {REMOTE_DIST}/static/index-*.js || true",
        timeout=30,
    )
    log(stdout.read().decode())
    log(stderr.read().decode())
    log("DEPLOY_DONE")
    client.close()


if __name__ == "__main__":
    main()
