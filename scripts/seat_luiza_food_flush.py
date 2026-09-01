# -*- coding: utf-8 -*-
"""Seat Luiza food flush into Sunset charcoal wells (no foreign bowls, no sticker oval)."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))

import repair_sunset_on_locked_vessels as R  # noqa: E402
from sunset_vessel_system import (  # noqa: E402
    ASSETS,
    SIZE,
    TOPDOWN_STEMS,
    USER_ASSETS,
    VESSEL_CY,
    VESSEL_MAP,
    bg_path_for,
    target_diameter_px,
)

JOBS = {
    "sunset-33-chkmeruli": ASSETS / "luiza_21_chkmeruli.png",
    "sunset-46-ojakhuri": ASSETS / "luiza_19_ojakhuri.png",
    "sunset-17-kharcho": ASSETS / "luiza_07_kharcho.png",
    "sunset-22-chikhirtma": ASSETS / "luiza_09_chikhirtma.png",
    "sunset-36-khashlama": ASSETS / "luiza_08_khashlama.png",
    "sunset-21-mushroom-cream": ASSETS / "luiza_10_mushroom_cream.png",
    "sunset-18-veg-soup": ASSETS / "luiza_11_veg_soup.png",
    "sunset-43-ajapsandali": ASSETS / "luiza_24_ajapsandali.png",
    "sunset-44-lobio-pot": ASSETS / "luiza_25_lobio.png",
    "sunset-08-caesar": ASSETS / "luiza_04_caesar.png",
    "sunset-12-eggplant-walnut": ASSETS / "luiza_05_eggplant_walnut.png",
    "sunset-25-tashmijabi": ASSETS / "luiza_39_tashmijabi.png",
    "sunset-49-imeretian-khachapuri": ASSETS / "luiza_26_imeretian_khachapuri.png",
    "sunset-50-megrelian-khachapuri": ASSETS / "luiza_27_megrelian_khachapuri.png",
    "sunset-28-kubdari": ASSETS / "luiza_34_kubdari.png",
    "sunset-57-margherita": ASSETS / "luiza_32_margherita.png",
    "sunset-51-mchadi": ASSETS / "luiza_29_mchadi.png",
    "sunset-52-lobiani": ASSETS / "luiza_30_lobiani.png",
    "sunset-03-suluguni": ASSETS / "luiza_44_suluguni.png",
    "sunset-26-chvishtari": ASSETS / "luiza_37_chvishtari.png",
    "sunset-37-pork-mtsvadi": ASSETS / "luiza_17_pork_mtsvadi.png",
    "sunset-53-khinkali": ASSETS / "luiza_14_khinkali.png",
}


def extract_food(src: Path) -> Image.Image:
    rgba = R.rembg_rgba(Image.open(src).convert("RGB"))
    arr = np.asarray(rgba).copy()
    rgb = arr[..., :3].astype(np.float32)
    a = arr[..., 3]
    opaque = a > 40
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)

    food = opaque & (
        ((sat > 26) & (lum < 215))
        | ((lum < 80) & (sat > 8))
        | ((g > r + 7) & (g > b + 5))
        | ((r > g + 18) & (r > b + 22) & (lum < 200))
        | ((r > 160) & (g > 130) & (b < 125) & (sat > 35))
    )
    food_m = np.asarray(Image.fromarray((food.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(9))) > 0

    # Drop pale ceramics and mid sat brown rims when not strong food chroma
    pale = opaque & (lum > 150) & (sat < 42)
    brown_rim = opaque & (r > 95) & (r < 175) & (g > 60) & (g < 135) & (b < 105) & (sat > 18) & (sat < 60)
    kill = opaque & (~food_m) & (pale | ((lum > 95) & (sat < 20)) | brown_rim)
    arr[kill, 3] = 0
    # If brown rim weakly tagged as food, kill low-sat brown bands
    weak_brown = opaque & brown_rim & (sat < 48) & ~(
        ((r > g + 25) & (r > b + 30)) | ((g > r + 10) & (g > b + 8))
    )
    arr[weak_brown, 3] = 0
    # Erode soft rim crumbs (white/brown vessel edges stuck to food)
    eroded = Image.fromarray(arr[..., 3], "L").filter(ImageFilter.MinFilter(7))
    arr[..., 3] = np.asarray(eroded)
    return R.trim(Image.fromarray(arr))


def well_ellipse_mask(vw: int, vh: int, rx_frac: float, ry_frac: float) -> Image.Image:
    mask = Image.new("L", (vw, vh), 0)
    draw = ImageDraw.Draw(mask)
    cx, cy = vw / 2, vh * 0.48
    rx, ry = vw * rx_frac / 2, vh * ry_frac / 2
    box = [cx - rx, cy - ry, cx + rx, cy + ry]
    draw.ellipse(box, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(1.2))


def seat(food: Image.Image, vessel: Image.Image, bowl: bool) -> Image.Image:
    v = vessel.convert("RGBA")
    vw, vh = v.size
    f = R.trim(food)

    # Cover the well: food scaled to FILL ellipse (may crop sides slightly)
    rx_frac, ry_frac = (0.78, 0.72) if bowl else (0.82, 0.82)
    well_w = int(vw * rx_frac)
    well_h = int(vh * ry_frac)
    scale = max(well_w / max(f.width, 1), well_h / max(f.height, 1))
    nw = max(1, int(f.width * scale))
    nh = max(1, int(f.height * scale))
    f = f.resize((nw, nh), Image.Resampling.LANCZOS)

    food_layer = Image.new("RGBA", (vw, vh), (0, 0, 0, 0))
    fx = (vw - nw) // 2
    fy = int(vh * 0.48 - nh / 2)
    food_layer.paste(f, (fx, fy), f)

    well = well_ellipse_mask(vw, vh, rx_frac, ry_frac)
    # Apply well mask to food
    fa = np.array(food_layer, copy=True)
    wa = np.asarray(well).astype(np.float32) / 255.0
    fa[..., 3] = (fa[..., 3].astype(np.float32) * wa).astype(np.uint8)
    food_masked = Image.fromarray(fa)

    out = Image.new("RGBA", (vw, vh), (0, 0, 0, 0))
    out.paste(v, (0, 0), v)
    out.paste(food_masked, (0, 0), food_masked)
    return out


def build(stem: str, src: Path) -> dict:
    vessel_id = VESSEL_MAP[stem]
    angle = "top" if stem in TOPDOWN_STEMS else "45"
    ang_key = "top" if angle == "top" and vessel_id == "V1" else "45"
    if vessel_id == "V2":
        ang_key = "45"
    cut = R.load_cutout(vessel_id, ang_key)
    if cut is None:
        return {"stem": stem, "error": "no cutout"}

    food = extract_food(src)
    if food.getchannel("A").getbbox() is None:
        return {"stem": stem, "error": "empty food"}

    subject = seat(food, cut, bowl=(vessel_id == "V2"))
    target = target_diameter_px(vessel_id)
    bb = subject.getchannel("A").getbbox()
    width = (bb[2] - bb[0]) if bb else subject.width
    scale = target / max(width, 1)
    nw = max(1, int(subject.width * scale))
    nh = max(1, int(subject.height * scale))
    subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.open(bg_path_for(stem)).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    x = (SIZE - nw) // 2
    y = int(SIZE * VESSEL_CY[vessel_id] - nh / 2)
    y = max(36, min(SIZE - nh - 36, y))
    sh_h = max(28, int(nh * 0.16))
    sh_w = int(nw * 0.90)
    sh = R.soft_shadow(sh_w, sh_h)
    canvas.paste(sh, (x + (nw - sh_w) // 2, y + nh - int(sh_h * 0.55)), sh)
    canvas.paste(subject, (x, y), subject)

    unders = stem.replace("-", "_")
    canvas.save(ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{stem}.png", "PNG")
    return {"stem": stem, "ok": True, "px": nw}


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    for stem, src in JOBS.items():
        if only and stem not in only:
            continue
        print(stem, "…", flush=True)
        try:
            print(" ", build(stem, src), flush=True)
        except Exception as e:
            print(" ", {"stem": stem, "error": str(e)}, flush=True)


if __name__ == "__main__":
    main()
