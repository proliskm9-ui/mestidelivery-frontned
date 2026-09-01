# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import uuid
import urllib.error
import urllib.request
from pathlib import Path

import paramiko

BASE = "https://mestidelivery.com/api"
PHOTO = Path(__file__).with_name("menu_photos") / "bbq_garden" / "01_oatmeal.jpg"
HOST = "62.60.148.232"


def main() -> None:
    user, password, ssh_pw = "admin", "423Qq!cv", "IW42VUUxBlQgRc1I"

    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": user, "password": password}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        token = json.loads(resp.read().decode())["token"]
    print("login ok")

    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex[:16]
    file_bytes = PHOTO.read_bytes()
    body = b"\r\n".join(
        [
            f"--{boundary}".encode(),
            b'Content-Disposition: form-data; name="file"; filename="01_oatmeal.jpg"',
            b"Content-Type: image/jpeg",
            b"",
            file_bytes,
            f"--{boundary}--".encode(),
            b"",
        ]
    )
    print("body", len(body))

    for url in [f"{BASE}/upload/", f"{BASE}/upload"]:
        r = urllib.request.Request(
            url,
            data=body,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(r, timeout=90) as resp:
                print(url, resp.status, resp.read()[:400])
        except urllib.error.HTTPError as e:
            print(url, "HTTP", e.code, e.read()[:800])

    # Check gateway logs + uploads dir
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)
    cmds = [
        "cd /opt/mestigo && docker compose logs gateway-service --tail 40 2>&1 | grep -iE 'upload|error|panic|failed' | tail -30",
        "cd /opt/mestigo && docker compose exec -T gateway-service ls -la uploads 2>&1 | head -20",
        "cd /opt/mestigo && docker compose exec -T gateway-service sh -c 'pwd; ls -la'",
    ]
    for cmd in cmds:
        print("===", cmd)
        _, out, err = client.exec_command(cmd, timeout=90)
        print((out.read().decode() + err.read().decode())[:5000])
    client.close()


if __name__ == "__main__":
    main()
