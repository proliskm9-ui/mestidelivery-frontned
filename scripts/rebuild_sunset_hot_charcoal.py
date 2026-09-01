# -*- coding: utf-8 -*-
"""
Sunset HOT dishes — Luizastan plating logic:
  1) Take REAL reference photo (Sunset / Luizastan folders)
  2) Cut FOOD ONLY (discard old plate/board/background)
  3) Generate UNIFIED premium charcoal stoneware
  4) Seat food inside vessel
  5) Paste onto LOCKED Sunset template (pixels untouched)
"""
from __future__ import annotations

import io
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from rembg import remove

REPO = Path(r"C:\MestiDelivery\Frontend")
sys.path.insert(0, str(REPO / "scripts"))

from composite_sunset_locked import (  # noqa: E402
    ASSETS_OUT,
    BG_45,
    MAX_CORNER_MAE,
    OUT,
    SRC,
    corner_mae,
    publish,
    soften_edges,
    strip_edge_bg,
    trim_alpha,
)

ORIG = REPO / "scripts" / "menu_photos" / "sunset"
LUIZA_DIR = REPO / "Luizastan"
SUNSET_DIR = REPO / "Sunset restaraunt"

# Unified premium vessel: warm charcoal matte stoneware (contrasts on grey fabric)
VESSEL = {
    "base": np.array([58.0, 56.0, 54.0]),  # charcoal
    "rim": np.array([42.0, 40.0, 38.0]),
    "speckle": 0.045,
}

# stem -> vessel type + preferred sources (first existing wins)
HOT = {
    "sunset-31-fried-chicken": {
        "vessel": "plate",
        "fill": 0.78,
        "frac": 0.72,
        "srcs": [
            ORIG / "sunset_31_fried_chicken.jpg",
            ASSETS_OUT / "luiza_13_chicken_bazhe.png",
        ],
    },
    "sunset-32-chicken-adjika": {
        "vessel": "plate",
        "fill": 0.78,
        "frac": 0.72,
        "srcs": [ORIG / "sunset_32_chicken_adjika.jpg"],
    },
    "sunset-33-chkmeruli": {
        "vessel": "bowl",
        "fill": 0.82,
        "frac": 0.72,
        "srcs": [
            ASSETS_OUT / "luiza_21_chkmeruli.png",
            LUIZA_DIR / "чкмерули.jpg",
            SUNSET_DIR / "курица чкмерули.jpg",
            ORIG / "sunset_33_chkmeruli.jpg",
        ],
    },
    "sunset-34-stewed-beef": {
        "vessel": "bowl",
        "fill": 0.80,
        "frac": 0.70,
        "srcs": [
            ASSETS_OUT / "luiza_12_ostri.png",
            LUIZA_DIR / "остри.jpg",
            ORIG / "sunset_34_stewed_beef.jpg",
        ],
    },
    "sunset-35-stewed-tashmijabi": {
        "vessel": "plate",  # two components on one serving plate
        "fill": 0.86,
        "frac": 0.72,
        "srcs": [
            SUNSET_DIR / "ташмиджаби с тушенной говядиной.jpg",
            ORIG / "sunset_35_stewed_tashmijabi.jpg",
        ],
    },
    "sunset-36-khashlama": {
        "vessel": "bowl",
        "fill": 0.84,
        "frac": 0.72,
        "srcs": [
            ASSETS_OUT / "luiza_08_khashlama.png",
            LUIZA_DIR / "хашлама.jpg",
            ORIG / "sunset_36_khashlama.jpg",
        ],
    },
    "sunset-37-pork-mtsvadi": {
        "vessel": "plate",
        "fill": 0.78,
        "frac": 0.70,
        "srcs": [
            ASSETS_OUT / "luiza_17_pork_mtsvadi.png",
            LUIZA_DIR / "шашлык из свинины.jpg",
            SUNSET_DIR / "шашлык из свинины.jpg",
            ORIG / "sunset_37_pork_mtsvadi.jpg",
        ],
    },
    "sunset-38-pork-ribs": {
        "vessel": "plate",
        "fill": 0.80,
        "frac": 0.72,
        "srcs": [ORIG / "sunset_38_pork_ribs.jpg"],
    },
    "sunset-39-trout": {
        "vessel": "plate",
        "fill": 0.82,
        "frac": 0.72,
        "srcs": [ORIG / "sunset_39_trout.jpg"],
    },
    "sunset-40-stewed-mushrooms": {
        "vessel": "bowl",
        "fill": 0.80,
        "frac": 0.70,
        "srcs": [
            ASSETS_OUT / "luiza_23_mushrooms_ketsi.png",
            LUIZA_DIR / "тушенные грибы с овощами.jfif",
            ORIG / "sunset_40_stewed_mushrooms.jpg",
        ],
    },
    "sunset-41-chicken-liver-ketsi": {
        "vessel": "bowl",
        "fill": 0.80,
        "frac": 0.68,
        "srcs": [ORIG / "sunset_41_chicken_liver_ketsi.jpg"],
    },
    "sunset-42-chicken-bbq-rice": {
        "vessel": "plate",
        "fill": 0.82,
        "frac": 0.72,
        "srcs": [
            ASSETS_OUT / "luiza_18_chicken_mtsvadi.png",
            LUIZA_DIR / "шашлык из курицы.jpg",
            ORIG / "sunset_42_chicken_bbq_rice.jpg",
        ],
    },
    "sunset-43-ajapsandali": {
        "vessel": "bowl",
        "fill": 0.82,
        "frac": 0.70,
        "srcs": [
            ASSETS_OUT / "luiza_24_ajapsandali.png",
            LUIZA_DIR / "аджапсандал.jfif",
            ORIG / "sunset_43_ajapsandali.jpg",
        ],
    },
    "sunset-44-lobio-pot": {
        "vessel": "bowl",
        "fill": 0.78,
        "frac": 0.62,
        "srcs": [
            ASSETS_OUT / "luiza_25_lobio.png",
            LUIZA_DIR / "лобио.jfif",
            ORIG / "sunset_44_lobio_pot.jpg",
        ],
    },
    "sunset-45-lobio-walnut": {
        "vessel": "bowl",
        "fill": 0.78,
        "frac": 0.62,
        "srcs": [
            ASSETS_OUT / "luiza_25_lobio.png",
            ORIG / "sunset_45_lobio_walnut.jpg",
        ],
    },
    "sunset-46-ojakhuri": {
        "vessel": "bowl",
        "fill": 0.84,
        "frac": 0.72,
        "srcs": [
            ASSETS_OUT / "luiza_19_ojakhuri.png",
            LUIZA_DIR / "оджухари.jpg",
            ORIG / "sunset_46_ojakhuri.jpg",
        ],
    },
    "sunset-47-carbonara": {
        "vessel": "plate",
        "fill": 0.80,
        "frac": 0.72,
        "srcs": [ORIG / "sunset_47_carbonara.jpg"],
    },
    "sunset-48-bolognese": {
        "vessel": "plate",
        "fill": 0.80,
        "frac": 0.72,
        "srcs": [ORIG / "sunset_48_bolognese.jpg"],
    },
}


def find_src(cfg: dict) -> Path:
    for p in cfg["srcs"]:
        if p.exists():
            return p
    raise FileNotFoundError(cfg["srcs"][0] if cfg["srcs"] else "no sources")


def rembg(im: Image.Image) -> Image.Image:
    buf = io.BytesIO()
    im.convert("RGB").save(buf, format="PNG")
    return Image.open(io.BytesIO(remove(buf.getvalue()))).convert("RGBA")


def radial(w, h, cx, cy, rx, ry):
    ys, xs = np.mgrid[0:h, 0:w]
    return np.sqrt(((xs - cx) / max(rx, 1)) ** 2 + ((ys - cy) / max(ry, 1)) ** 2)


def _speckle(arr: np.ndarray, mask: np.ndarray, amount: float = 0.045) -> np.ndarray:
    rng = np.random.default_rng(42)
    noise = rng.normal(0, amount * 255, size=arr.shape[:2])
    out = arr.astype(np.float32)
    for c in range(3):
        ch = out[..., c]
        ch[mask] = np.clip(ch[mask] + noise[mask], 0, 255)
        out[..., c] = ch
    return out


def make_charcoal_plate(width: int = 880) -> Image.Image:
    """Premium matte charcoal stoneware dinner plate — soft rim, subtle well."""
    height = int(width * 0.78)
    cx, cy = width / 2, height / 2 + 8
    rx, ry = width * 0.465, height * 0.445
    shade = radial(width, height, cx, cy, rx, ry)
    mask = shade <= 1.0
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    base = VESSEL["base"]
    # body shading
    lum = 1.08 - shade * 0.42
    ys, xs = np.mgrid[0:height, 0:width]
    hl = np.clip(
        1.0 - np.sqrt(((xs - cx + rx * 0.22) / (rx * 1.05)) ** 2 + ((ys - cy - ry * 0.22) / (ry * 1.05)) ** 2),
        0,
        1,
    )
    well = radial(width, height, cx, cy + 6, rx * 0.78, ry * 0.72)
    for c in range(3):
        val = base[c] * lum + hl * 22
        val = np.where(well <= 1.0, val - 10 * (1 - well), val)
        arr[..., c] = np.where(mask, np.clip(val, 0, 255), 0).astype(np.uint8)
    # rim ring darker
    rim = mask & (shade > 0.86)
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[rim] = VESSEL["rim"][c] * (0.95 + 0.1 * hl[rim])
        arr[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    # thin lip highlight
    lip = mask & (shade > 0.94)
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[lip] = np.minimum(255, ch[lip] + 28)
        arr[..., c] = ch.astype(np.uint8)
    arr[..., 3] = np.where(mask, 255, 0).astype(np.uint8)
    arr = _speckle(arr, mask, VESSEL["speckle"])
    return Image.fromarray(arr.astype(np.uint8), "RGBA").filter(ImageFilter.GaussianBlur(0.45))


def make_charcoal_bowl(width: int = 820) -> Image.Image:
    """Deep charcoal coupe bowl — Luizastan-style seating for stews/sauces."""
    height = int(width * 0.82)
    cx, cy = width / 2, height / 2 + 12
    rx, ry = width * 0.45, height * 0.40
    shade = radial(width, height, cx, cy, rx, ry)
    mask = shade <= 1.0
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    base = VESSEL["base"]
    lum = 1.10 - shade * 0.50
    ys, xs = np.mgrid[0:height, 0:width]
    hl = np.clip(
        1.0 - np.sqrt(((xs - cx + rx * 0.25) / rx) ** 2 + ((ys - cy - ry * 0.2) / ry) ** 2),
        0,
        1,
    )
    for c in range(3):
        val = base[c] * lum + hl * 26
        arr[..., c] = np.where(mask, np.clip(val, 0, 255), 0).astype(np.uint8)
    inner = radial(width, height, cx, cy + 14, rx * 0.70, ry * 0.56)
    well = (inner <= 1.0) & mask
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[well] = ch[well] * 0.70 - 6
        arr[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    rim = mask & (shade > 0.84)
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[rim] = VESSEL["rim"][c] * 0.92
        arr[..., c] = np.clip(ch, 0, 255).astype(np.uint8)
    lip = mask & (shade > 0.93)
    for c in range(3):
        ch = arr[..., c].astype(np.float32)
        ch[lip] = np.minimum(255, ch[lip] + 24)
        arr[..., c] = ch.astype(np.uint8)
    arr[..., 3] = np.where(mask, 255, 0).astype(np.uint8)
    arr = _speckle(arr, mask, VESSEL["speckle"])
    return Image.fromarray(arr.astype(np.uint8), "RGBA").filter(ImageFilter.GaussianBlur(0.5))


def strip_to_food(rgba: Image.Image) -> Image.Image:
    """Remove plate/board/table leftovers — keep only the main food mass."""
    cut = rgba
    for tol in (38.0, 52.0, 68.0, 82.0):
        cut = strip_edge_bg(cut, tol=tol)

    arr = np.asarray(cut).copy()
    rgb = arr[..., :3].astype(np.float32)
    alpha = arr[..., 3]
    opaque = alpha > 40
    if not opaque.any():
        return cut

    lum = rgb.mean(axis=-1)
    sat = rgb.max(axis=-1) - rgb.min(axis=-1)

    # strong food signals (NOT pale ceramic)
    food = opaque & (
        ((sat > 30) & (lum < 220))
        | ((lum < 100) & (sat > 10))
        | ((rgb[..., 0] > rgb[..., 2] + 22) & (sat > 16) & (lum < 210))
        | ((rgb[..., 1] > rgb[..., 0] + 8) & (rgb[..., 1] > rgb[..., 2] + 6))  # herbs
        | ((rgb[..., 0] > 140) & (rgb[..., 1] > 100) & (rgb[..., 1] < rgb[..., 0] + 30) & (sat > 20) & (lum < 200))  # sauces/meat
    )
    food_m = np.asarray(Image.fromarray((food.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(11))) > 0

    # white / cream ceramic vessel
    pale_ceramic = opaque & (lum > 155) & (sat < 35)
    wood = opaque & (lum > 70) & (lum < 190) & (sat < 48) & (rgb[..., 0] >= rgb[..., 2] - 8)
    gray_ceramic = opaque & (lum > 110) & (lum < 210) & (sat < 26)
    dark_board = opaque & (lum < 95) & (sat < 38)

    kill_cand = (pale_ceramic | wood | gray_ceramic | dark_board) & (~food_m)

    h, w = kill_cand.shape
    edge = np.zeros_like(kill_cand)
    edge[0, :] = edge[-1, :] = edge[:, 0] = edge[:, -1] = True
    visited = np.zeros_like(kill_cand)
    q: deque[tuple[int, int]] = deque()
    ys, xs = np.where(edge & kill_cand)
    for y, x in zip(ys.tolist(), xs.tolist()):
        visited[y, x] = True
        q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and kill_cand[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    arr[visited, 3] = 0

    # also kill remaining pale ceramic even if not edge-connected (inner rim leftover)
    opaque2 = arr[..., 3] > 40
    lum2 = arr[..., :3].mean(axis=-1)
    sat2 = arr[..., :3].max(-1) - arr[..., :3].min(-1)
    food2 = opaque2 & (
        ((sat2 > 28) & (lum2 < 215))
        | (lum2 < 95)
        | ((arr[..., 1] > arr[..., 0] + 8) & (arr[..., 1] > arr[..., 2] + 6))
    )
    food2_m = np.asarray(Image.fromarray((food2.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(9))) > 0
    pale2 = opaque2 & (lum2 > 160) & (sat2 < 32) & (~food2_m)
    arr[pale2, 3] = 0

    # keep largest connected opaque component only (drop side ramekins)
    opaque3 = arr[..., 3] > 40
    if opaque3.any():
        from scipy import ndimage  # optional; fallback below

        try:
            labeled, n = ndimage.label(opaque3)
            if n > 1:
                sizes = ndimage.sum(opaque3, labeled, range(1, n + 1))
                keep = int(np.argmax(sizes)) + 1
                arr[labeled != keep, 3] = 0
        except Exception:
            # BFS largest component
            visited = np.zeros_like(opaque3)
            best = None
            best_n = 0
            ys, xs = np.where(opaque3)
            for y0, x0 in zip(ys.tolist(), xs.tolist()):
                if visited[y0, x0]:
                    continue
                q = deque([(y0, x0)])
                visited[y0, x0] = True
                comp = []
                while q:
                    y, x = q.popleft()
                    comp.append((y, x))
                    for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                        if 0 <= ny < h and 0 <= nx < w and opaque3[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            q.append((ny, nx))
                if len(comp) > best_n:
                    best_n = len(comp)
                    best = comp
            if best is not None:
                keep_m = np.zeros_like(opaque3)
                for y, x in best:
                    keep_m[y, x] = True
                arr[(~keep_m) & opaque3, 3] = 0

    return Image.fromarray(arr)


def boost(rgba: Image.Image) -> Image.Image:
    rgb = rgba.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(1.08)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.07)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.12)
    out = rgb.convert("RGBA")
    out.putalpha(rgba.split()[-1])
    return out


def place_food(food: Image.Image, vessel: Image.Image, fill: float) -> Image.Image:
    food = trim_alpha(food)
    vw, vh = vessel.size
    scale = min((vw * fill) / max(food.size[0], 1), (vh * fill) / max(food.size[1], 1))
    nw, nh = max(1, int(food.size[0] * scale)), max(1, int(food.size[1] * scale))
    food = food.resize((nw, nh), Image.Resampling.LANCZOS)
    out = vessel.copy()
    x = (vw - nw) // 2
    y = (vh - nh) // 2 - int(vh * 0.02)
    # soft food shadow inside vessel
    alpha = food.split()[-1]
    sh = alpha.point(lambda v: int(v * 0.30)).filter(ImageFilter.GaussianBlur(7))
    sh_layer = Image.new("RGBA", food.size, (0, 0, 0, 70))
    sh_layer.putalpha(sh)
    out.alpha_composite(sh_layer, (x + 2, y + 5))
    out.alpha_composite(food, (x, y))
    return out


def composite_locked(subject: Image.Image, bg: Image.Image, width_frac: float) -> Image.Image:
    canvas = bg.convert("RGBA").resize((1024, 1024), Image.Resampling.LANCZOS).copy()
    subject = trim_alpha(subject)
    tw = int(1024 * width_frac)
    scale = tw / subject.size[0]
    nh = max(1, int(subject.size[1] * scale))
    max_h = int(1024 * 0.74)
    if nh > max_h:
        nh = max_h
        scale = nh / subject.size[1]
        tw = max(1, int(subject.size[0] * scale))
    subject = subject.resize((tw, nh), Image.Resampling.LANCZOS)
    x = (1024 - tw) // 2
    y = (1024 - nh) // 2 + 30
    y = min(max(y, 115), 1024 - nh - 40)

    alpha = subject.split()[-1]
    soft = alpha.point(lambda v: int(v * 0.28)).filter(ImageFilter.GaussianBlur(36))
    hard = alpha.point(lambda v: int(v * 0.55)).filter(ImageFilter.GaussianBlur(18))
    soft_l = Image.new("RGBA", subject.size, (0, 0, 0, 80))
    soft_l.putalpha(soft)
    hard_l = Image.new("RGBA", subject.size, (0, 0, 0, 125))
    hard_l.putalpha(hard)
    shadow = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    shadow.alpha_composite(soft_l, (x + 4, y + 20))
    shadow.alpha_composite(hard_l, (x + 3, y + 12))
    out = Image.alpha_composite(canvas, shadow)
    out.alpha_composite(subject, (x, y))
    return out.convert("RGB")


def prepare(stem: str, cfg: dict) -> tuple[Image.Image, float, str]:
    src = find_src(cfg)
    raw = Image.open(src).convert("RGB")
    w, h = raw.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, (h - side) // 2 - int(side * 0.02))
    raw = raw.crop((left, top, left + side, min(h, top + side)))
    if side < 900:
        s = 1000 / side
        raw = raw.resize((int(raw.size[0] * s), int(raw.size[1] * s)), Image.Resampling.LANCZOS)

    cut = rembg(raw)
    cut = strip_to_food(cut)
    cut = soften_edges(trim_alpha(cut, pad=3))
    cut = boost(cut)

    if cfg["vessel"] == "bowl":
        vessel = make_charcoal_bowl(840)
    else:
        vessel = make_charcoal_plate(900)

    subject = place_food(cut, vessel, cfg["fill"])
    return subject, cfg["frac"], str(src)


def process(stem: str, bg: Image.Image) -> dict:
    cfg = HOT[stem]
    subject, frac, src = prepare(stem, cfg)
    out = composite_locked(subject, bg, frac)
    mae = corner_mae(out, bg)
    if mae > MAX_CORNER_MAE:
        out = composite_locked(subject, bg, max(0.50, frac - 0.08))
        mae = corner_mae(out, bg)
    publish(out, stem)
    return {"stem": stem, "src": src, "vessel": cfg["vessel"], "corner_mae": round(mae, 2), "ok": mae <= MAX_CORNER_MAE}


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    bg = Image.open(BG_45).convert("RGB")
    jobs = [s for s in HOT if only is None or s in only]
    print(f"hot charcoal plating jobs={len(jobs)}", flush=True)
    results, fails = [], []
    for i, stem in enumerate(jobs, 1):
        print(f"{i:02d}/{len(jobs)} {stem}", flush=True)
        try:
            info = process(stem, bg)
            results.append(info)
            print(f"  {'OK' if info['ok'] else 'WARN'} mae={info['corner_mae']} vessel={info['vessel']} src={Path(info['src']).name}", flush=True)
            if not info["ok"]:
                fails.append(info)
        except Exception as e:
            print(f"  ERR {e}", flush=True)
            fails.append({"stem": stem, "error": str(e)})
    summary = {"total": len(results), "ok": sum(1 for r in results if r.get("ok")), "fails": len(fails)}
    print(json.dumps(summary, ensure_ascii=False), flush=True)
    OUT.mkdir(exist_ok=True)
    (OUT / "_hot_charcoal.json").write_text(
        json.dumps({"summary": summary, "results": results, "fails": fails}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
