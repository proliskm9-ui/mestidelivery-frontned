# -*- coding: utf-8 -*-
"""Status report for menu photo / description pipeline (local, no prod)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def check_menu(name: str) -> dict:
    p = ROOT / name
    data = json.loads(p.read_text(encoding="utf-8"))
    products = data["products"]
    short = []
    for x in products:
        for key in ("desc", "desc_en", "desc_ka"):
            val = x.get(key) or ""
            if val.count("\n") < 1:
                short.append((x.get("ru"), key, val[:40]))
                break
    return {
        "restaurant": data.get("restaurant", {}).get("name"),
        "products": len(products),
        "short_descs": len(short),
        "samples_short": short[:5],
    }


def check_photos(folder: str, expected: int) -> dict:
    d = ROOT / "menu_photos" / folder
    jpgs = list(d.glob("*.jpg")) if d.exists() else []
    return {"folder": folder, "jpgs": len(jpgs), "expected": expected, "ok": len(jpgs) >= expected}


def main() -> None:
    report = {
        "menus": [
            check_menu("sunset_menu.json"),
            check_menu("luizastan_menu.json"),
            check_menu("burgers_menu.json"),
        ],
        "photos": [
            check_photos("sunset", 78),
            check_photos("luizastan", 64),
            check_photos("burgers", 20),
        ],
        "scripts_ready": [
            "upload_burgers.py",
            "deploy_sunset_luiza_burgers.py",
            "compress_all_menu_photos.py",
        ],
        "awaiting_approval": [
            "python scripts/upload_burgers.py admin <pass>",
            "python scripts/deploy_sunset_luiza_burgers.py admin <pass> <ssh_pass>",
        ],
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
