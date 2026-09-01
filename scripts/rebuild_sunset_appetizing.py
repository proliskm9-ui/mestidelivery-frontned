# -*- coding: utf-8 -*-
"""
Rebuild Sunset dishes appetizingly (Luizastan-quality cutouts on locked Sunset templates).

Rules:
  - Background = exact locked template pixels (never redraw)
  - Food from REAL originals (never from previous locked composites)
  - Prefer food-only cut + realistic white ceramic / clay vessel (like Luizastan)
  - Soft contact shadow; tall cheese-pulls must fit fully in frame
"""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from rembg import remove

REPO = Path(r"C:\MestiDelivery\Frontend")
sys.path.insert(0, str(REPO / "scripts"))

from composite_sunset_locked import (  # noqa: E402
    ANGLE45,
    ASSETS_OUT,
    BG_45,
    BG_TOP,
    BOWLS,
    CORNER_REGIONS,
    MAX_CORNER_MAE,
    OUT,
    SAUCES,
    SRC,
    TOPDOWN,
    corner_mae,
    publish,
    soften_edges,
    strip_edge_bg,
    trim_alpha,
)

ORIG = REPO / "scripts" / "menu_photos" / "sunset"
LUIZA_DIR = REPO / "Luizastan"
SUNSET_DIR = REPO / "Sunset restaraunt"

# Best appetizing food sources (real photos / Luizastan masters — NOT locked composites)
SOURCE_PRIORITY: dict[str, list[Path]] = {
    "sunset-25-tashmijabi": [
        ASSETS_OUT / "luiza_39_tashmijabi.png",
        ORIG / "sunset_25_tashmijabi.jpg",
    ],
    "sunset-26-chvishtari": [
        ASSETS_OUT / "luiza_37_chvishtari.png",
        ORIG / "sunset_26_chvishtari.jpg",
    ],
    "sunset-27-chvishtari-millet": [
        ASSETS_OUT / "luiza_38_chvishtari_millet.png",
        ORIG / "sunset_27_chvishtari_millet.jpg",
    ],
    "sunset-28-kubdari": [
        ASSETS_OUT / "luiza_34_kubdari.png",
        LUIZA_DIR / "кубдари.jfif",
        ORIG / "sunset_28_kubdari.jpg",
    ],
    "sunset-29-millet-khachapuri": [
        ASSETS_OUT / "luiza_36_millet_khachapuri.png",
        LUIZA_DIR / "хачапури с пшеном.jfif",
        ORIG / "sunset_29_millet_khachapuri.jpg",
    ],
    "sunset-30-royal-khachapuri": [
        ASSETS_OUT / "luiza_35_potato_khachapuri.png",
        ORIG / "sunset_30_royal_khachapuri.jpg",
    ],
    "sunset-49-imeretian-khachapuri": [
        ASSETS_OUT / "luiza_26_imeretian_khachapuri.png",
        LUIZA_DIR / "хачапури.jfif",
        ORIG / "sunset_49_imeretian_khachapuri.jpg",
    ],
    "sunset-50-megrelian-khachapuri": [
        ASSETS_OUT / "luiza_27_megrelian_khachapuri.png",
        ORIG / "sunset_50_megrelian_khachapuri.jpg",
    ],
    "sunset-51-mchadi": [
        ASSETS_OUT / "luiza_29_mchadi.png",
        LUIZA_DIR / "мчади.jfif",
        ORIG / "sunset_51_mchadi.jpg",
    ],
    "sunset-52-lobiani": [
        ASSETS_OUT / "luiza_30_lobiani.png",
        LUIZA_DIR / "лобиани.jpg",
        ORIG / "sunset_52_lobiani.jpg",
    ],
    "sunset-53-khinkali": [
        ASSETS_OUT / "luiza_14_khinkali.png",
        LUIZA_DIR / "Хинкали.jpg",
        ORIG / "sunset_53_khinkali.jpg",
    ],
    "sunset-54-cheese-khinkali": [
        ASSETS_OUT / "luiza_15_mushroom_khinkali.png",
        ORIG / "sunset_54_cheese_khinkali.jpg",
    ],
    "sunset-33-chkmeruli": [
        ASSETS_OUT / "luiza_21_chkmeruli.png",
        LUIZA_DIR / "чкмерули.jpg",
        SUNSET_DIR / "курица чкмерули.jpg",
        ORIG / "sunset_33_chkmeruli.jpg",
    ],
    "sunset-37-pork-mtsvadi": [
        ASSETS_OUT / "luiza_17_pork_mtsvadi.png",
        LUIZA_DIR / "шашлык из свинины.jpg",
        ORIG / "sunset_37_pork_mtsvadi.jpg",
    ],
    "sunset-42-chicken-bbq-rice": [
        ASSETS_OUT / "luiza_18_chicken_mtsvadi.png",
        LUIZA_DIR / "шашлык из курицы.jpg",
        ORIG / "sunset_42_chicken_bbq_rice.jpg",
    ],
    "sunset-46-ojakhuri": [
        ASSETS_OUT / "luiza_19_ojakhuri.png",
        LUIZA_DIR / "оджухари.jpg",
        ORIG / "sunset_46_ojakhuri.jpg",
    ],
    "sunset-43-ajapsandali": [
        ASSETS_OUT / "luiza_24_ajapsandali.png",
        LUIZA_DIR / "аджапсандал.jfif",
        ORIG / "sunset_43_ajapsandali.jpg",
    ],
    "sunset-44-lobio-pot": [
        ASSETS_OUT / "luiza_25_lobio.png",
        LUIZA_DIR / "лобио.jfif",
        ORIG / "sunset_44_lobio_pot.jpg",
    ],
    "sunset-45-lobio-walnut": [
        ASSETS_OUT / "luiza_25_lobio.png",
        ORIG / "sunset_45_lobio_walnut.jpg",
    ],
    "sunset-08-caesar": [
        ASSETS_OUT / "luiza_04_caesar.png",
        ORIG / "sunset_08_caesar.jpg",
    ],
    "sunset-06-cucumber-tomato": [
        ASSETS_OUT / "luiza_01_cucumber_tomato.png",
        ORIG / "sunset_06_cucumber_tomato.jpg",
    ],
    "sunset-07-cucumber-walnut": [
        ASSETS_OUT / "luiza_02_cucumber_walnut.png",
        ORIG / "sunset_07_cucumber_walnut.jpg",
    ],
    "sunset-11-chicken-salad": [
        ASSETS_OUT / "luiza_03_chicken_salad.png",
        ORIG / "sunset_11_chicken_salad.jpg",
    ],
    "sunset-12-eggplant-walnut": [
        ASSETS_OUT / "luiza_05_eggplant_walnut.png",
        ORIG / "sunset_12_eggplant_walnut.jpg",
    ],
    "sunset-17-kharcho": [
        ASSETS_OUT / "luiza_07_kharcho.png",
        LUIZA_DIR / "харчо.jpg",
        ORIG / "sunset_17_kharcho.jpg",
    ],
    "sunset-22-chikhirtma": [
        ASSETS_OUT / "luiza_09_chikhirtma.png",
        LUIZA_DIR / "чихиртма.jpg",
        ORIG / "sunset_22_chikhirtma.jpg",
    ],
    "sunset-36-khashlama": [
        ASSETS_OUT / "luiza_08_khashlama.png",
        LUIZA_DIR / "хашлама.jpg",
        ORIG / "sunset_36_khashlama.jpg",
    ],
    "sunset-21-mushroom-cream": [
        ASSETS_OUT / "luiza_10_mushroom_cream.png",
        ORIG / "sunset_21_mushroom_cream.jpg",
    ],
    "sunset-18-veg-soup": [
        ASSETS_OUT / "luiza_11_veg_soup.png",
        ORIG / "sunset_18_veg_soup.jpg",
    ],
    "sunset-40-stewed-mushrooms": [
        ASSETS_OUT / "luiza_23_mushrooms_ketsi.png",
        ORIG / "sunset_40_stewed_mushrooms.jpg",
    ],
    "sunset-55-pepperoni": [ORIG / "sunset_55_pepperoni.jpg"],
    "sunset-56-mushroom-pizza": [ORIG / "sunset_56_mushroom_pizza.jpg"],
    "sunset-57-margherita": [
        ASSETS_OUT / "luiza_32_margherita.png",
        ORIG / "sunset_57_margherita.jpg",
    ],
    "sunset-01-bread": [
        ASSETS_OUT / "luiza_31_bread.png",
        ORIG / "sunset_01_bread.jpg",
    ],
    "sunset-03-suluguni": [
        ASSETS_OUT / "luiza_44_suluguni.png",
        ORIG / "sunset_03_suluguni.jpg",
    ],
    "sunset-04-fries": [
        ASSETS_OUT / "luiza_41_fries.png",
        ORIG / "sunset_04_fries.jpg",
    ],
    "sunset-59-rice": [
        ASSETS_OUT / "luiza_40_rice.png",
        ORIG / "sunset_59_rice.jpg",
    ],
    "sunset-61-buckwheat": [
        ASSETS_OUT / "luiza_43_buckwheat.png",
        ORIG / "sunset_61_buckwheat.jpg",
    ],
    "sunset-62-tkemali": [
        ASSETS_OUT / "luiza_45_tkemali.png",
        ORIG / "sunset_62_tkemali.jpg",
    ],
    "sunset-64-ketchup": [
        ASSETS_OUT / "luiza_49_ketchup.png",
        ORIG / "sunset_64_ketchup.jpg",
    ],
    "sunset-65-sour-cream": [
        ASSETS_OUT / "luiza_48_sour_cream.png",
        ORIG / "sunset_65_sour_cream.jpg",
    ],
}


def find_original(stem: str) -> Path:
    if stem in SOURCE_PRIORITY:
        for p in SOURCE_PRIORITY[stem]:
            if p.exists():
                return p
    underscored = stem.replace("-", "_")
    p = ORIG / f"{underscored}.jpg"
    if p.exists():
        return p
    raise FileNotFoundError(stem)


def remove_bg(im: Image.Image) -> Image.Image:
    buf = io.BytesIO()
    im.convert("RGB").save(buf, format="PNG")
    return Image.open(io.BytesIO(remove(buf.getvalue()))).convert("RGBA")


def looks_like_locked_composite(im: Image.Image) -> bool:
    rgb = im.convert("RGB").resize((256, 256))
    a = np.asarray(rgb).astype(np.float32)
    for bg_path in (BG_TOP, BG_45):
        b = np.asarray(Image.open(bg_path).convert("RGB").resize((256, 256))).astype(np.float32)
        maes = [
            float(np.mean(np.abs(a[y0 // 4 : y1 // 4, x0 // 4 : x1 // 4] - b[y0 // 4 : y1 // 4, x0 // 4 : x1 // 4])))
            for x0, y0, x1, y1 in CORNER_REGIONS
        ]
        if float(np.mean(maes)) < 8.0:
            return True
    return False


def boost_appetite(rgba: Image.Image) -> Image.Image:
    rgb = rgba.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(1.10)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.15)
    out = rgb.convert("RGBA")
    out.putalpha(rgba.split()[-1])
    return out


def radial(w: int, h: int, cx: float, cy: float, rx: float, ry: float) -> np.ndarray:
    ys, xs = np.mgrid[0:h, 0:w]
    return np.sqrt(((xs - cx) / max(rx, 1)) ** 2 + ((ys - cy) / max(ry, 1)) ** 2)


def make_white_plate(width: int = 860) -> Image.Image:
    """Luizastan-style matte white ceramic with soft rim depth (not flat gray oval)."""
    height = int(width * 0.78)
    cx, cy = width / 2, height / 2 + 6
    rx, ry = width * 0.465, height * 0.445
    shade = radial(width, height, cx, cy, rx, ry)
    mask = shade <= 1.0
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    # base porcelain
    lum = 242 - shade * 18
    # soft top-left highlight
    ys, xs = np.mgrid[0:height, 0:width]
    hl = np.clip(
        1.0 - np.sqrt(((xs - cx + rx * 0.22) / (rx * 1.1)) ** 2 + ((ys - cy - ry * 0.2) / (ry * 1.1)) ** 2),
        0,
        1,
    )
    lum = np.clip(lum + hl * 10, 0, 255)
    # subtle center well (not a graphic gray disk)
    well = radial(width, height, cx, cy + 4, rx * 0.78, ry * 0.72)
    lum = np.where(well <= 1.0, lum - 8 * (1 - well), lum)
    for c, mul in enumerate((0.995, 0.998, 1.0)):
        arr[..., c] = np.where(mask, np.clip(lum * mul, 0, 255), 0).astype(np.uint8)
    # darker rim ring
    rim = mask & (shade > 0.86)
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[rim] *= 0.78
        arr[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    # thin outer lip highlight
    lip = mask & (shade > 0.93) & (shade <= 1.0)
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[lip] = np.minimum(255, ch[lip] + 18)
        arr[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    arr[..., 3] = np.where(mask, 255, 0).astype(np.uint8)
    return Image.fromarray(arr, "RGBA").filter(ImageFilter.GaussianBlur(0.45))


def make_clay_bowl(width: int = 780) -> Image.Image:
    height = int(width * 0.82)
    cx, cy = width / 2, height / 2 + 10
    rx, ry = width * 0.44, height * 0.40
    shade = radial(width, height, cx, cy, rx, ry)
    mask = shade <= 1.0
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    # warm clay
    base = np.array([118.0, 78.0, 52.0])
    lum_mul = 1.15 - shade * 0.55
    ys, xs = np.mgrid[0:height, 0:width]
    hl = np.clip(
        1.0 - np.sqrt(((xs - cx + rx * 0.25) / rx) ** 2 + ((ys - cy - ry * 0.2) / ry) ** 2),
        0,
        1,
    )
    for c in range(3):
        val = base[c] * lum_mul + hl * 28
        arr[..., c] = np.where(mask, np.clip(val, 0, 255), 0).astype(np.uint8)
    inner = radial(width, height, cx, cy + 12, rx * 0.68, ry * 0.55)
    well = (inner <= 1.0) & mask
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[well] = ch[well] * 0.72 - 8
        arr[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    rim = mask & (shade > 0.84)
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[rim] *= 0.75
        arr[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    arr[..., 3] = np.where(mask, 255, 0).astype(np.uint8)
    return Image.fromarray(arr, "RGBA").filter(ImageFilter.GaussianBlur(0.5))


def make_ramekin(width: int = 420) -> Image.Image:
    height = int(width * 0.85)
    cx, cy = width / 2, height / 2
    rx, ry = width * 0.42, height * 0.38
    shade = radial(width, height, cx, cy, rx, ry)
    mask = shade <= 1.0
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    lum = 236 - shade * 22
    for c, mul in enumerate((0.99, 0.995, 1.0)):
        arr[..., c] = np.where(mask, np.clip(lum * mul, 0, 255), 0).astype(np.uint8)
    arr[..., 3] = np.where(mask, 255, 0).astype(np.uint8)
    inner = radial(width, height, cx, cy + 4, rx * 0.62, ry * 0.52)
    well = (inner <= 1.0) & mask
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[well] = ch[well] * 0.88 - 8
        arr[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def strip_light_plate(rgba: Image.Image) -> Image.Image:
    """Remove pale ceramic plate / table leftovers; keep colorful food + dark bowls."""
    arr = np.asarray(rgba).copy()
    rgb = arr[..., :3].astype(np.float32)
    alpha = arr[..., 3]
    opaque = alpha > 40
    if not opaque.any():
        return rgba
    lum = rgb.mean(axis=-1)
    sat = rgb.max(axis=-1) - rgb.min(axis=-1)
    # pale plate / linen
    pale = opaque & (lum > 175) & (sat < 38)
    # keep warm food near pale
    food = opaque & (((sat > 28) & (lum < 210)) | (lum < 90) | ((rgb[..., 0] > rgb[..., 2] + 18) & (sat > 18)))
    # dilate food protect
    food_m = Image.fromarray((food.astype(np.uint8) * 255), mode="L").filter(ImageFilter.MaxFilter(9))
    protect = np.asarray(food_m) > 0
    # also protect dark clay/wood vessels
    vessel = opaque & (lum < 140) & (sat < 55) & (rgb[..., 0] >= rgb[..., 2] - 5)
    vessel_m = Image.fromarray((vessel.astype(np.uint8) * 255), mode="L").filter(ImageFilter.MaxFilter(7))
    protect |= np.asarray(vessel_m) > 0
    kill = pale & (~protect)
    # flood from edges only
    h, w = kill.shape
    edge = np.zeros_like(kill)
    edge[0, :] = edge[-1, :] = edge[:, 0] = edge[:, -1] = True
    from collections import deque

    q: deque[tuple[int, int]] = deque()
    visited = np.zeros_like(kill)
    ys, xs = np.where(edge & kill)
    for y, x in zip(ys.tolist(), xs.tolist()):
        visited[y, x] = True
        q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and kill[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    arr[visited, 3] = 0
    return Image.fromarray(arr)


def has_dark_vessel(rgba: Image.Image) -> bool:
    arr = np.asarray(rgba)
    a = arr[..., 3] > 40
    if not a.any():
        return False
    rgb = arr[..., :3].astype(np.float32)
    lum = rgb.mean(axis=-1)
    sat = rgb.max(axis=-1) - rgb.min(axis=-1)
    eroded = Image.fromarray((a.astype(np.uint8) * 255), mode="L").filter(ImageFilter.MinFilter(15))
    rim = a & (~(np.asarray(eroded) > 0))
    if not rim.any():
        return False
    dark = float((rim & (lum < 130) & (sat < 60)).sum()) / float(rim.sum())
    return dark > 0.22


def place_on_vessel(food: Image.Image, vessel: Image.Image, fill: float = 0.78) -> Image.Image:
    food = trim_alpha(food)
    vw, vh = vessel.size
    scale = min((vw * fill) / food.size[0], (vh * fill) / food.size[1])
    nw, nh = max(1, int(food.size[0] * scale)), max(1, int(food.size[1] * scale))
    food = food.resize((nw, nh), Image.Resampling.LANCZOS)
    out = vessel.copy()
    alpha = food.split()[-1]
    sh = alpha.point(lambda v: int(v * 0.28)).filter(ImageFilter.GaussianBlur(8))
    sh_layer = Image.new("RGBA", food.size, (0, 0, 0, 55))
    sh_layer.putalpha(sh)
    x = (vw - nw) // 2
    y = (vh - nh) // 2 - int(vh * 0.03)
    out.alpha_composite(sh_layer, (x + 2, y + 4))
    out.alpha_composite(food, (x, y))
    return out


def composite_fit(subject: Image.Image, bg: Image.Image, width_frac: float) -> Image.Image:
    """Paste subject onto EXACT bg; fit tall cheese-pulls by height too."""
    canvas = bg.convert("RGBA").resize((1024, 1024), Image.Resampling.LANCZOS).copy()
    subject = trim_alpha(subject)
    tw = int(1024 * width_frac)
    scale = tw / subject.size[0]
    nh = max(1, int(subject.size[1] * scale))
    # keep clear of napkin/bowl/cutlery; allow tall subjects by shrinking
    max_h = int(1024 * 0.72)
    if nh > max_h:
        nh = max_h
        scale = nh / subject.size[1]
        tw = max(1, int(subject.size[0] * scale))
    subject = subject.resize((tw, nh), Image.Resampling.LANCZOS)
    x = (1024 - tw) // 2
    y = (1024 - nh) // 2 + 28
    y = min(max(y, 110), 1024 - nh - 36)

    alpha = subject.split()[-1]
    # richer contact shadow (Luizastan-like grounding)
    sh = alpha.point(lambda v: int(v * 0.55)).filter(ImageFilter.GaussianBlur(22))
    sh_layer = Image.new("RGBA", subject.size, (0, 0, 0, 120))
    sh_layer.putalpha(sh)
    soft = alpha.point(lambda v: int(v * 0.25)).filter(ImageFilter.GaussianBlur(40))
    soft_layer = Image.new("RGBA", subject.size, (0, 0, 0, 70))
    soft_layer.putalpha(soft)

    shadow = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    shadow.alpha_composite(soft_layer, (x + 4, y + 22))
    shadow.alpha_composite(sh_layer, (x + 3, y + 12))
    out = Image.alpha_composite(canvas, shadow)
    out.alpha_composite(subject, (x, y))
    return out.convert("RGB")


def prepare_subject(stem: str, src: Path) -> tuple[Image.Image, float]:
    raw = Image.open(src).convert("RGB")
    if looks_like_locked_composite(raw):
        raise RuntimeError(f"Refusing locked composite source: {src}")

    # center square crop
    w, h = raw.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, (h - side) // 2 - int(side * 0.02))
    raw = raw.crop((left, top, left + side, min(h, top + side)))
    if side < 800:
        s = 1000 / side
        raw = raw.resize((int(raw.size[0] * s), int(raw.size[1] * s)), Image.Resampling.LANCZOS)

    cut = remove_bg(raw)
    # peel leftover table / wood rectangle (esp. Luizastan masters)
    for tol in (40.0, 55.0, 68.0):
        cut = strip_edge_bg(cut, tol=tol)
    cut = soften_edges(trim_alpha(cut, pad=4))
    cut = boost_appetite(cut)

    keep_vessel = has_dark_vessel(cut)

    if stem in SAUCES:
        frac = 0.48
        if keep_vessel:
            return cut, frac
        food = strip_light_plate(cut)
        return place_on_vessel(trim_alpha(food), make_ramekin(440), 0.72), frac

    if stem in BOWLS or stem == "sunset-25-tashmijabi":
        # cheese-pull needs headroom
        frac = 0.58 if stem == "sunset-25-tashmijabi" else 0.70
        if keep_vessel:
            return cut, frac
        food = strip_light_plate(cut)
        return place_on_vessel(trim_alpha(food), make_clay_bowl(820), 0.80), frac

    # bakery / flat — Luizastan style: food on white ceramic
    frac = 0.72
    if keep_vessel:
        return cut, frac
    food = strip_light_plate(cut)
    food = trim_alpha(food)
    return place_on_vessel(food, make_white_plate(860), 0.80), frac


def process(stem: str, kind: str, bg: Image.Image) -> dict:
    src = find_original(stem)
    subject, frac = prepare_subject(stem, src)
    out = composite_fit(subject, bg, frac)
    mae = corner_mae(out, bg)
    if mae > MAX_CORNER_MAE:
        out = composite_fit(subject, bg, max(0.40, frac - 0.10))
        mae = corner_mae(out, bg)
    publish(out, stem)
    return {
        "stem": stem,
        "kind": kind,
        "src": str(src),
        "corner_mae": round(mae, 2),
        "ok": mae <= MAX_CORNER_MAE,
    }


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    bg_top = Image.open(BG_TOP).convert("RGB")
    bg_45 = Image.open(BG_45).convert("RGB")

    jobs: list[tuple[str, str, Image.Image]] = []
    for stem in TOPDOWN:
        if only is None or stem in only:
            jobs.append((stem, "topdown", bg_top))
    for stem in ANGLE45:
        if only is None or stem in only:
            jobs.append((stem, "45", bg_45))

    print(f"rebuild v2 jobs={len(jobs)}", flush=True)
    results, fails = [], []
    for i, (stem, kind, bg) in enumerate(jobs, 1):
        print(f"{i:02d}/{len(jobs)} [{kind}] {stem}", flush=True)
        try:
            info = process(stem, kind, bg)
            results.append(info)
            print(f"  {'OK' if info['ok'] else 'WARN'} mae={info['corner_mae']} src={Path(info['src']).name}", flush=True)
            if not info["ok"]:
                fails.append(info)
        except Exception as e:
            print(f"  ERR {e}", flush=True)
            fails.append({"stem": stem, "error": str(e)})

    summary = {"total": len(results), "ok": sum(1 for r in results if r.get("ok")), "fails": len(fails)}
    print(json.dumps(summary, ensure_ascii=False), flush=True)
    OUT.mkdir(exist_ok=True)
    (OUT / "_rebuild_v2.json").write_text(
        json.dumps({"summary": summary, "results": results, "fails": fails}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
