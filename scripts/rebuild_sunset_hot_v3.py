# -*- coding: utf-8 -*-
"""
Sunset HOT — Luizastan plating logic (no invented food):
  - Prefer cutout of FOOD + REAL vessel from reference photo
  - Only if vessel missing → seat food on unified charcoal stoneware
  - Locked Sunset template pixels untouched
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
    ASSETS_OUT,
    BG_45,
    MAX_CORNER_MAE,
    OUT,
    corner_mae,
    publish,
    soften_edges,
    strip_edge_bg,
    trim_alpha,
)
from rebuild_sunset_hot_charcoal import (  # noqa: E402
    HOT,
    find_src,
    make_charcoal_bowl,
    make_charcoal_plate,
    place_food,
    composite_locked,
    boost,
    strip_to_food,
)


def rembg(im: Image.Image) -> Image.Image:
    buf = io.BytesIO()
    im.convert("RGB").save(buf, format="PNG")
    return Image.open(io.BytesIO(remove(buf.getvalue()))).convert("RGBA")


def has_real_vessel(rgba: Image.Image) -> bool:
    arr = np.asarray(rgba)
    a = arr[..., 3] > 40
    if a.mean() < 0.06:
        return False
    rgb = arr[..., :3].astype(np.float32)
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    eroded = Image.fromarray((a.astype(np.uint8) * 255), "L").filter(ImageFilter.MinFilter(17))
    rim = a & (~(np.asarray(eroded) > 0))
    if not rim.any():
        return False
    ceramic = float((rim & (lum > 150) & (sat < 45)).sum()) / float(rim.sum())
    clay = float((rim & (lum < 130) & (sat < 55) & (rgb[..., 0] >= rgb[..., 2] - 5)).sum()) / float(rim.sum())
    return ceramic > 0.18 or clay > 0.20


def clean_bg_only(rgba: Image.Image) -> Image.Image:
    """Strip table/wood leftovers but KEEP ceramic/clay vessel."""
    cut = rgba
    for tol in (36.0, 50.0, 64.0):
        cut = strip_edge_bg(cut, tol=tol)
    arr = np.asarray(cut).copy()
    rgb = arr[..., :3].astype(np.float32)
    a = arr[..., 3] > 40
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    # protect vessel + food
    protect = a & (
        (sat > 18)
        | (lum < 100)
        | ((lum > 160) & (sat < 40))  # pale ceramic
        | ((lum < 140) & (rgb[..., 0] >= rgb[..., 2] - 5))  # clay/wood vessel
    )
    prot = np.asarray(Image.fromarray((protect.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(7))) > 0
    # kill residual linen/table near edges
    h, w = a.shape
    edge = np.zeros_like(a)
    m = max(8, int(0.04 * min(h, w)))
    edge[:m, :] = edge[-m:, :] = edge[:, :m] = edge[:, -m:] = True
    table = a & (lum > 80) & (lum < 200) & (sat < 30) & edge & (~prot)
    arr[table, 3] = 0
    return Image.fromarray(arr)


def process(stem: str, bg: Image.Image) -> dict:
    cfg = HOT[stem]
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
    cut = soften_edges(trim_alpha(clean_bg_only(cut), pad=4))
    cut = boost(cut)

    if has_real_vessel(cut):
        subject = cut
        mode = "keep_ref_vessel"
        frac = max(cfg["frac"], 0.68)
    else:
        # food-only → unified charcoal
        food = strip_to_food(cut)
        food = soften_edges(trim_alpha(food))
        food = boost(food)
        vessel = make_charcoal_bowl(860) if cfg["vessel"] == "bowl" else make_charcoal_plate(900)
        subject = place_food(food, vessel, min(cfg["fill"], 0.78))
        mode = f"charcoal_{cfg['vessel']}"
        frac = cfg["frac"]

    out = composite_locked(subject, bg, frac)
    mae = corner_mae(out, bg)
    if mae > MAX_CORNER_MAE:
        out = composite_locked(subject, bg, max(0.50, frac - 0.08))
        mae = corner_mae(out, bg)
    publish(out, stem)
    return {
        "stem": stem,
        "src": str(src),
        "mode": mode,
        "corner_mae": round(mae, 2),
        "ok": mae <= MAX_CORNER_MAE,
    }


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    bg = Image.open(BG_45).convert("RGB")
    jobs = [s for s in HOT if only is None or s in only]
    print(f"hot luiza-plating jobs={len(jobs)}", flush=True)
    results, fails = [], []
    for i, stem in enumerate(jobs, 1):
        print(f"{i:02d}/{len(jobs)} {stem}", flush=True)
        try:
            info = process(stem, bg)
            results.append(info)
            print(
                f"  {'OK' if info['ok'] else 'WARN'} mae={info['corner_mae']} mode={info['mode']} src={Path(info['src']).name}",
                flush=True,
            )
            if not info["ok"]:
                fails.append(info)
        except Exception as e:
            print(f"  ERR {e}", flush=True)
            fails.append({"stem": stem, "error": str(e)})
    summary = {"total": len(results), "ok": sum(1 for r in results if r.get("ok")), "fails": len(fails)}
    print(json.dumps(summary, ensure_ascii=False), flush=True)
    OUT.mkdir(exist_ok=True)
    (OUT / "_hot_luiza_plating.json").write_text(
        json.dumps({"summary": summary, "results": results, "fails": fails}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
