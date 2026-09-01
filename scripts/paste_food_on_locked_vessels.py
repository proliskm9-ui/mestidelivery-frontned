# -*- coding: utf-8 -*-
"""Paste food into locked empty-vessel scenes (pixel-locked BG + vessel)."""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sunset_vessel_system import (  # noqa: E402
    ASSETS,
    MASTER_DIR,
    SIZE,
    USER_ASSETS,
    VESSEL_FRAC,
    VESSEL_MAP,
    angle_for,
)

MENU = Path(r"C:\MestiDelivery\Frontend\scripts\menu_photos\sunset")
MENU_BG = Path(r"C:\MestiDelivery\Frontend\scripts\menu_photos\sunset_background")
SKIP = {"sunset-46-ojakhuri"}  # already good GenerateImage


def rembg_rgba(im: Image.Image) -> Image.Image:
    from rembg import remove

    buf = io.BytesIO()
    im.convert("RGB").save(buf, format="PNG")
    return Image.open(io.BytesIO(remove(buf.getvalue()))).convert("RGBA")


def trim(rgba: Image.Image, pad: int = 2) -> Image.Image:
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        return rgba
    x0, y0, x1, y1 = bbox
    return rgba.crop(
        (max(0, x0 - pad), max(0, y0 - pad), min(rgba.width, x1 + pad), min(rgba.height, y1 + pad))
    )


def food_only(rgba: Image.Image) -> Image.Image:
    arr = np.asarray(rgba).copy()
    rgb = arr[..., :3].astype(np.float32)
    a = arr[..., 3]
    opaque = a > 40
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    food = opaque & (
        ((sat > 20) & (lum < 225))
        | ((lum < 75) & (sat > 6))
        | ((rgb[..., 1] > rgb[..., 0] + 5) & (rgb[..., 1] > rgb[..., 2] + 3))
    )
    food_m = np.asarray(Image.fromarray((food.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(11))) > 0
    kill = opaque & (~food_m) & (
        ((lum > 120) & (sat < 42))
        | ((lum > 85) & (sat < 20))
        | ((lum < 100) & (sat < 22))  # empty charcoal leftovers
    )
    arr[kill, 3] = 0
    return trim(Image.fromarray(arr))


def soften(rgba: Image.Image) -> Image.Image:
    arr = np.asarray(rgba).copy()
    a = Image.fromarray(arr[..., 3], "L").filter(ImageFilter.GaussianBlur(0.7))
    arr[..., 3] = np.asarray(a)
    return Image.fromarray(arr)


def locked_scene(vessel: str, angle: str) -> Path:
    ang = "top" if angle == "top" and vessel == "V1" else "45"
    if vessel != "V1":
        ang = "45"
    name = f"locked_{vessel}_{ang}.png"
    for d in (MASTER_DIR, USER_ASSETS):
        p = d / name
        if p.exists():
            return p
    raise FileNotFoundError(name)


def find_food_src(stem: str) -> Path | None:
    unders = stem.replace("-", "_")
    for d in (MENU, MENU_BG, ASSETS, USER_ASSETS):
        for name in (unders, stem):
            for ext in (".jpg", ".jpeg", ".png", ".webp"):
                p = d / f"{name}{ext}"
                if p.exists():
                    return p
    return None


def paste_food(stem: str) -> dict:
    if stem in SKIP:
        return {"stem": stem, "skipped": "protected"}
    vessel = VESSEL_MAP[stem]
    if vessel not in ("V1", "V2"):
        return {"stem": stem, "skipped": "not main"}
    angle = angle_for(stem)
    src = find_food_src(stem)
    if not src:
        return {"stem": stem, "error": "no src"}

    scene = Image.open(locked_scene(vessel, angle)).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    food = soften(food_only(rembg_rgba(Image.open(src).convert("RGB"))))
    if food.getchannel("A").getbbox() is None:
        return {"stem": stem, "error": "empty food"}

    # Food diameter ~58-62% of frame inside 72% vessel
    target = int(SIZE * VESSEL_FRAC[vessel] * (0.78 if vessel == "V2" else 0.82))
    bw = food.width
    scale = target / max(bw, 1)
    nw = max(1, int(food.width * scale))
    nh = max(1, int(food.height * scale))
    # clamp height
    max_h = int(SIZE * 0.55)
    if nh > max_h:
        scale = max_h / food.height
        nw = max(1, int(food.width * scale))
        nh = max_h
    food = food.resize((nw, nh), Image.Resampling.LANCZOS)

    x = (SIZE - nw) // 2
    # sit food in vessel well — slightly above geometric center for 45° bowls
    y = int(SIZE * (0.50 if vessel == "V1" else 0.48) - nh / 2)
    y = max(int(SIZE * 0.22), min(SIZE - nh - int(SIZE * 0.18), y))

    canvas = scene.copy()
    canvas.paste(food, (x, y), food)

    unders = stem.replace("-", "_")
    canvas.save(ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{stem}.png", "PNG")
    return {"stem": stem, "vessel": vessel, "ok": True, "food": str(src.name)}


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    stems = [s for s, v in VESSEL_MAP.items() if v in ("V1", "V2") and (only is None or s in only)]
    results = []
    for i, stem in enumerate(stems, 1):
        print(f"{i:02d}/{len(stems)} {stem} …", flush=True)
        try:
            info = paste_food(stem)
        except Exception as e:
            info = {"stem": stem, "error": str(e)}
        results.append(info)
        print(f"  {info}", flush=True)
    ok = sum(1 for r in results if r.get("ok"))
    print(json.dumps({"ok": ok, "total": len(results), "fails": [r for r in results if not r.get("ok")]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
