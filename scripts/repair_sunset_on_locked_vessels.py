# -*- coding: utf-8 -*-
"""Seat food onto locked empty vessel masters (fixes rembg eating charcoal)."""
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
    VESSEL_CY,
    VESSEL_FRAC,
    VESSEL_MAP,
    angle_for,
    bg_path_for,
    find_src,
    target_diameter_px,
)

MENU = Path(r"C:\MestiDelivery\Frontend\scripts\menu_photos\sunset")
MENU_BG = Path(r"C:\MestiDelivery\Frontend\scripts\menu_photos\sunset_background")


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
    """Keep colorful/food mass; drop grey table and dark empty vessel rings."""
    arr = np.asarray(rgba).copy()
    rgb = arr[..., :3].astype(np.float32)
    a = arr[..., 3]
    opaque = a > 40
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    food = opaque & (
        ((sat > 22) & (lum < 220))
        | ((lum < 70) & (sat > 8))  # dark meat
        | ((rgb[..., 1] > rgb[..., 0] + 6) & (rgb[..., 1] > rgb[..., 2] + 4))  # herbs
    )
    food_m = np.asarray(Image.fromarray((food.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(9))) > 0
    # kill pale table + mid-grey linen
    kill = opaque & (~food_m) & (((lum > 130) & (sat < 40)) | ((lum > 90) & (sat < 18)))
    arr[kill, 3] = 0
    # kill large flat charcoal plate leftovers without food chroma (keep food-dark)
    charcoal_empty = opaque & (~food_m) & (lum < 95) & (sat < 25)
    arr[charcoal_empty, 3] = 0
    return trim(Image.fromarray(arr))


def soft_shadow(w: int, h: int, strength: float = 0.32) -> Image.Image:
    arr = np.zeros((h, w), dtype=np.float32)
    cy, cx = h * 0.55, w * 0.5
    ry, rx = h * 0.45, w * 0.46
    ys, xs = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xs - cx) / max(rx, 1)) ** 2 + ((ys - cy) / max(ry, 1)) ** 2)
    arr = np.clip(1.0 - r, 0, 1) ** 1.8
    shade = Image.fromarray((arr * 255 * strength).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(10))
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.putalpha(shade)
    return out


def load_locked_scene(vessel: str, angle: str) -> Image.Image:
    name = f"locked_{vessel}_{angle}.png"
    for d in (MASTER_DIR, USER_ASSETS, ASSETS / "sunset_vessels"):
        p = d / name
        if p.exists():
            return Image.open(p).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    # fallback: empty BG only
    return Image.open(bg_path_for("sunset-08-caesar" if angle == "45" else "sunset-55-pepperoni")).convert("RGB")


def load_cutout(vessel: str, angle: str) -> Image.Image | None:
    p = MASTER_DIR / f"cutout_{vessel}_{angle}.png"
    if p.exists():
        return Image.open(p).convert("RGBA")
    return None


def find_food_src(stem: str) -> Path | None:
    unders = stem.replace("-", "_")
    for d in (MENU, MENU_BG, ASSETS, USER_ASSETS):
        for name in (unders, stem, stem.replace("-", "_")):
            for ext in (".jpg", ".jpeg", ".png", ".webp"):
                p = d / f"{name}{ext}"
                if p.exists():
                    return p
    return find_src(stem)


def place_food_in_vessel(food: Image.Image, vessel_cut: Image.Image, fill: float = 0.78) -> Image.Image:
    v = vessel_cut.convert("RGBA")
    vw, vh = v.size
    f = trim(food)
    # fit food inside vessel well
    max_w = int(vw * fill)
    max_h = int(vh * fill * 0.92)
    scale = min(max_w / max(f.width, 1), max_h / max(f.height, 1))
    nw = max(1, int(f.width * scale))
    nh = max(1, int(f.height * scale))
    f = f.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (vw, vh), (0, 0, 0, 0))
    out.paste(v, (0, 0), v)
    fx = (vw - nw) // 2
    fy = int(vh * 0.42 - nh / 2) + int(vh * 0.06)
    fy = max(int(vh * 0.12), min(vh - nh - 8, fy))
    out.paste(f, (fx, fy), f)
    return out


def repair_one(stem: str) -> dict:
    vessel = VESSEL_MAP.get(stem)
    if not vessel or vessel in ("V3", "C1"):
        return {"stem": stem, "skipped": True}
    angle = angle_for(stem)
    # V1 top uses top cutout; else 45
    ang_key = "top" if angle == "top" and vessel == "V1" else "45"
    if vessel == "V2":
        ang_key = "45"

    src = find_food_src(stem)
    if not src:
        return {"stem": stem, "error": "no src"}

    cut = load_cutout(vessel, ang_key)
    scene = load_locked_scene(vessel, ang_key)
    if cut is None:
        # extract vessel from locked scene via rembg
        cut = trim(rembg_rgba(scene))

    food = food_only(rembg_rgba(Image.open(src).convert("RGB")))
    if food.getchannel("A").getbbox() is None:
        return {"stem": stem, "error": "empty food"}

    subject = place_food_in_vessel(food, cut, fill=0.80 if vessel == "V2" else 0.84)
    # scale subject to target diameter
    target = target_diameter_px(vessel)
    sw = subject.getchannel("A").getbbox()
    width = (sw[2] - sw[0]) if sw else subject.width
    scale = target / max(width, 1)
    nw = max(1, int(subject.width * scale))
    nh = max(1, int(subject.height * scale))
    subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.open(bg_path_for(stem)).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    x = (SIZE - nw) // 2
    y = int(SIZE * VESSEL_CY[vessel] - nh / 2)
    y = max(40, min(SIZE - nh - 40, y))
    sh_h = max(28, int(nh * 0.16))
    sh_w = int(nw * 0.90)
    sh = soft_shadow(sh_w, sh_h)
    canvas.paste(sh, (x + (nw - sh_w) // 2, y + nh - int(sh_h * 0.55)), sh)
    canvas.paste(subject, (x, y), subject)

    unders = stem.replace("-", "_")
    canvas.save(ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{stem}.png", "PNG")
    return {"stem": stem, "vessel": vessel, "ok": True, "src": str(src)}


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    stems = [s for s, v in VESSEL_MAP.items() if v in ("V1", "V2") and (only is None or s in only)]
    results = []
    for i, stem in enumerate(stems, 1):
        print(f"{i:02d}/{len(stems)} {stem} …", flush=True)
        try:
            info = repair_one(stem)
        except Exception as e:
            info = {"stem": stem, "error": str(e)}
        results.append(info)
        print(f"  {info}", flush=True)
    ok = sum(1 for r in results if r.get("ok"))
    print(json.dumps({"ok": ok, "total": len(results), "fails": [r for r in results if not r.get("ok")]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
