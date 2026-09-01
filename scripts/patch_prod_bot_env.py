# -*- coding: utf-8 -*-
"""Patch prod docker-compose env so gateway reaches Partners Bot on :50061."""
from __future__ import annotations

import re
import sys
import paramiko

HOST = "62.60.148.232"
COMPOSE = "/opt/mestigo/docker-compose.yml"
ENV_FILE = "/opt/mestigo/.env"

BOT_BASE_URL = "http://172.17.0.1:50061"
PARTNERS_BASE_URL = "https://mestidelivery.com/partners"


def main() -> None:
    pw = sys.argv[1]
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=pw, timeout=30)

    sftp = client.open_sftp()
    with sftp.open(COMPOSE, "r") as f:
        compose = f.read().decode("utf-8")

    gateway_block = re.search(r"(gateway-service:\s*\n(?:[ \t].*\n)+)", compose)
    if not gateway_block:
        raise SystemExit("gateway-service block not found in docker-compose.yml")

    block = gateway_block.group(1)
    env_lines = [
        f"      BOT_BASE_URL: {BOT_BASE_URL}",
        f"      PARTNERS_BASE_URL: {PARTNERS_BASE_URL}",
    ]
    if "environment:" in block:
        for line in env_lines:
            key = line.split(":")[0].strip()
            if re.search(rf"^\s*{re.escape(key)}:", block, re.M):
                block = re.sub(rf"^\s*{re.escape(key)}:.*$", line, block, flags=re.M)
            else:
                block = block.replace("environment:\n", "environment:\n" + line + "\n", 1)
    else:
        insert = "    environment:\n" + "\n".join(env_lines) + "\n"
        block = block.replace("gateway-service:\n", "gateway-service:\n" + insert, 1)

    compose = compose[: gateway_block.start()] + block + compose[gateway_block.end() :]
    with sftp.open(COMPOSE, "w") as f:
        f.write(compose.encode("utf-8"))

    # .env hints for bots (optional documentation)
    try:
        with sftp.open(ENV_FILE, "r") as f:
            env_text = f.read().decode("utf-8")
    except FileNotFoundError:
        env_text = ""
    for key, val in [("BOT_BASE_URL", BOT_BASE_URL), ("PARTNERS_BASE_URL", PARTNERS_BASE_URL)]:
        if re.search(rf"^{key}=", env_text, re.M):
            env_text = re.sub(rf"^{key}=.*$", f"{key}={val}", env_text, flags=re.M)
        else:
            env_text += f"\n{key}={val}\n"
    with sftp.open(ENV_FILE, "w") as f:
        f.write(env_text.encode("utf-8"))

    sftp.close()

    _, stdout, stderr = client.exec_command(
        "cd /opt/mestigo && docker compose up -d gateway-service && "
        "docker compose exec -T gateway-service printenv BOT_BASE_URL PARTNERS_BASE_URL",
        timeout=120,
    )
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print(err, file=sys.stderr)
    client.close()
    print("PATCH_DONE")


if __name__ == "__main__":
    main()
