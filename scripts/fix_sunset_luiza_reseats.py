# -*- coding: utf-8 -*-
"""Fix reseats where Luiza bowl/plate leaked into Sunset charcoal vessel.

Keeps only a central food disk (no foreign rim), pastes into locked V1/V2 at 75%.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

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

REPO = Path(r"C:\MestiDelivery\Frontend")

# stems that still showed foreign vessels after first reseat
FIX = {
    "sunset-33-chkmeruli": ASSETS / "luiza_21_chkmeruli.png",
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


def strip_vessels(rgba: Image.Image) -> Image.Image:
    """Aggressive: drop white/grey/brown ceramic; keep food chroma + meat."""
    arr = np.asarray(rgba).copy()
    rgb = arr[..., :3].astype(np.float32)
    a = arr[..., 3]
    opaque = a > 40
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)

    food = opaque & (
        ((sat > 28) & (lum < 210) & ~((r > 150) & (g > 140) & (b > 130)))  # colorful food, not pale ceramic
        | ((lum < 85) & (sat > 10))  # dark meat / crust
        | ((g > r + 8) & (g > b + 6) & (lum < 180))  # herbs
        | ((r > g + 20) & (r > b + 25) & (lum < 190))  # tomato/red sauces
        | ((r > 170) & (g > 140) & (b < 120) & (sat > 40))  # cheese/golden bread
    )
    food_m = np.asarray(Image.fromarray((food.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(7))) > 0

    # kill ceramics of any colour when not food
    whiteish = opaque & (lum > 145) & (sat < 45)
    greylish = opaque & (lum > 90) & (lum < 170) & (sat < 22)
    brown_ceramic = opaque & (r > 90) & (r < 180) & (g > 55) & (g < 140) & (b < 110) & (sat > 20) & (sat < 70) & (
        abs(r - g) < 55
    )
    kill = opaque & (~food_m) & (whiteish | greylish | brown_ceramic)
    # also kill brown ceramic even if weakly tagged food, near edges later
    arr[kill, 3] = 0
    arr[brown_ceramic & opaque & (sat < 55) & (lum > 80) & (lum < 150) & (~((sat > 40) & (r > g + 25))), 3] = 0
    return R.trim(Image.fromarray(arr))


def central_food_disk(rgba: Image.Image, keep_frac: float = 0.70) -> Image.Image:
    """Keep only inner disk of subject — drops foreign rim even if residual."""
    bb = rgba.getchannel("A").getbbox()
    if not bb:
        return rgba
    crop = rgba.crop(bb)
    arr = np.asarray(crop).copy()
    h, w = arr.shape[:2]
    cy, cx = h / 2, w / 2
    rad = keep_frac * min(h, w) / 2
    ys, xs = np.ogrid[:h, :w]
    dist = np.sqrt((ys - cy) ** 2 + (xs - cx) ** 2)
    # soft edge
    alpha = arr[..., 3].astype(np.float32)
    edge = np.clip((rad - dist) / max(rad * 0.08, 1), 0, 1)
    arr[..., 3] = (alpha * edge).astype(np.uint8)
    return R.trim(Image.fromarray(arr))


def place_food_flush(food: Image.Image, vessel_cut: Image.Image, fill: float, bowl: bool) -> Image.Image:
    """Seat food deeper into vessel — larger fill, centered in well."""
    v = vessel_cut.convert("RGBA")
    vw, vh = v.size
    f = R.trim(food)
    max_w = int(vw * fill)
    max_h = int(vh * (0.78 if bowl else 0.88))
    scale = min(max_w / max(f.width, 1), max_h / max(f.height, 1))
    nw = max(1, int(f.width * scale))
    nh = max(1, int(f.height * scale))
    f = f.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (vw, vh), (0, 0, 0, 0))
    out.paste(v, (0, 0), v)
    fx = (vw - nw) // 2
    # bowls: sink food into well; plates: sit on surface
    fy = int(vh * (0.50 if bowl else 0.48) - nh / 2)
    fy = max(int(vh * 0.14), min(vh - nh - 6, fy))
    out.paste(f, (fx, fy), f)
    return out


def fix_one(stem: str, src: Path) -> dict:
    vessel = VESSEL_MAP[stem]
    angle = "top" if stem in TOPDOWN_STEMS else "45"
    ang_key = "top" if angle == "top" and vessel == "V1" else "45"
    if vessel == "V2":
        ang_key = "45"
    cut = R.load_cutout(vessel, ang_key)
    if cut is None:
        return {"stem": stem, "error": "no cutout"}

    raw = R.rembg_rgba(Image.open(src).convert("RGB"))
    food = central_food_disk(strip_vessels(raw), keep_frac=0.68 if vessel == "V2" else 0.74)
    if food.getchannel("A").getbbox() is None:
        return {"stem": stem, "error": "empty"}

    subject = place_food_flush(food, cut, fill=0.88 if vessel == "V2" else 0.90, bowl=(vessel == "V2"))
    target = target_diameter_px(vessel)
    bb = subject.getchannel("A").getbbox()
    width = (bb[2] - bb[0]) if bb else subject.width
    scale = target / max(width, 1)
    nw = max(1, int(subject.width * scale))
    nh = max(1, int(subject.height * scale))
    subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.open(bg_path_for(stem)).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    x = (SIZE - nw) // 2
    y = int(SIZE * VESSEL_CY[vessel] - nh / 2)
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
    return {"stem": stem, "ok": True, "px": nw, "src": src.name}


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    for stem, src in FIX.items():
        if only and stem not in only:
            continue
        if not src.exists():
            print("MISS", stem, src)
            continue
        print(stem, "…", flush=True)
        try:
            print(" ", fix_one(stem, src), flush=True)
        except Exception as e:
            print(" ", {"stem": stem, "error": str(e)}, flush=True)


if __name__ == "__main__":
    main()
