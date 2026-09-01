# -*- coding: utf-8 -*-
"""Fix docker-compose uploads mount + restore photos into gateway."""
from __future__ import annotations

import sys
import paramiko

HOST = "62.60.148.232"


def main() -> None:
    pw = sys.argv[1]
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=pw, timeout=30)

    # Show compose gateway section
    _, o, _ = c.exec_command("sed -n '1,80p' /opt/mestigo/docker-compose.yml", timeout=30)
    print("COMPOSE:\n", o.read().decode())

    # Rewrite gateway volumes cleanly via python on remote
    fix = r'''
python3 - <<'PY'
from pathlib import Path
p = Path("/opt/mestigo/docker-compose.yml")
text = p.read_text()
# backup
Path("/opt/mestigo/docker-compose.yml.bak-uploads").write_text(text)
lines = text.splitlines(True)
out = []
i = 0
in_gateway = False
gateway_indent = None
volumes_done = False
while i < len(lines):
    line = lines[i]
    stripped = line.lstrip(" ")
    indent = len(line) - len(stripped)
    if stripped.startswith("gateway-service:"):
        in_gateway = True
        gateway_indent = indent
        volumes_done = False
        out.append(line)
        i += 1
        continue
    if in_gateway:
        # left gateway block
        if stripped and not stripped.startswith("#") and indent <= gateway_indent and not stripped.startswith("-"):
            in_gateway = False
        elif stripped.startswith("volumes:"):
            out.append(line)
            i += 1
            # collect existing volume lines
            vols = []
            while i < len(lines) and (lines[i].startswith(" ") and lines[i].lstrip().startswith("-")):
                vols.append(lines[i])
                i += 1
            # ensure both mounts
            joined = "".join(vols)
            if "sqlite_data:/app/data" not in joined:
                vols.insert(0, "      - sqlite_data:/app/data\n")
            if "/opt/mestigo/uploads:/app/uploads" not in joined:
                vols.append("      - /opt/mestigo/uploads:/app/uploads\n")
            out.extend(vols)
            volumes_done = True
            continue
        out.append(line)
        i += 1
        continue
    out.append(line)
    i += 1

# if gateway had no volumes key, inject before depends_on end — fallback append after container_name
text2 = "".join(out)
if "/opt/mestigo/uploads:/app/uploads" not in text2:
    text2 = text2.replace(
        "container_name: gateway_service\n",
        "container_name: gateway_service\n    volumes:\n      - sqlite_data:/app/data\n      - /opt/mestigo/uploads:/app/uploads\n",
        1,
    )
p.write_text(text2)
print("patched ok")
print("--- gateway snippet ---")
inside=False
for line in text2.splitlines():
    if line.strip().startswith("gateway-service:"):
        inside=True
    if inside:
        print(line)
        if line.strip().startswith("catalog-service:") or (inside and line.strip().startswith("auth-service:")):
            break
        if inside and line.startswith("  ") is False and line.strip() and not line.strip().startswith("gateway"):
            # top-level key after gateway
            if not line.startswith(" ") and "gateway" not in line:
                break
PY
'''
    _, o, e = c.exec_command(fix, timeout=30)
    print(o.read().decode())
    print(e.read().decode())

    cmds = [
        "mkdir -p /opt/mestigo/uploads && chmod 777 /opt/mestigo/uploads",
        "cd /opt/mestigo && docker compose up -d --force-recreate gateway-service",
        "sleep 4",
        "docker inspect gateway_service --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}\n{{end}}'",
        "docker exec -u root gateway_service sh -c 'ls /app/uploads | wc -l; ls /app/uploads | head'",
        "NAME=$(ls /opt/mestigo/uploads | head -1); curl -sI http://127.0.0.1:8080/uploads/$NAME | head -3",
    ]
    for cmd in cmds:
        print("===", cmd)
        _, o, e = c.exec_command(cmd, timeout=180)
        print((o.read() + e.read()).decode()[:3000])
    c.close()


if __name__ == "__main__":
    main()
