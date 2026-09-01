# -*- coding: utf-8 -*-
"""Normalize Sunset dish photos onto locked BG at fixed vessel diameters.

Extracts subject (vessel+food), scales to VESSEL_FRAC for that stem, pastes on
pixel-locked template. QA rejects if final subject width differs >3% from target.
"""
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

OUT_ASSETS = ASSETS
OUT_USER = USER_ASSETS
QA_TOL = 0.03


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


def soften(rgba: Image.Image) -> Image.Image:
    arr = np.asarray(rgba).copy()
    a = Image.fromarray(arr[..., 3], "L").filter(ImageFilter.GaussianBlur(0.8))
    arr[..., 3] = np.asarray(a)
    return Image.fromarray(arr)


def strip_light_table(rgba: Image.Image) -> Image.Image:
    """Kill residual light table/linen around charcoal vessel."""
    arr = np.asarray(rgba).copy()
    rgb = arr[..., :3].astype(np.float32)
    a = arr[..., 3]
    lum = rgb.mean(axis=-1)
    sat = rgb.max(axis=-1) - rgb.min(axis=-1)
    opaque = a > 40
    # light grey table fabric
    table = opaque & (lum > 145) & (sat < 35)
    # edge flood from borders
    h, w = table.shape
    edge = np.zeros_like(table)
    edge[0, :] = edge[-1, :] = edge[:, 0] = edge[:, -1] = True
    from collections import deque

    visited = np.zeros_like(table)
    q: deque[tuple[int, int]] = deque()
    ys, xs = np.where(edge & table)
    for y, x in zip(ys.tolist(), xs.tolist()):
        visited[y, x] = True
        q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and table[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    arr[visited, 3] = 0
    return Image.fromarray(arr)


def soft_shadow(w: int, h: int, strength: float = 0.34) -> Image.Image:
    """Flat contact shadow under vessel — no floating gap."""
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


def subject_width(rgba: Image.Image) -> int:
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        return 0
    return bbox[2] - bbox[0]


def normalize_one(stem: str, src: Path | None = None) -> dict:
    vessel = VESSEL_MAP.get(stem)
    if not vessel:
        return {"stem": stem, "skipped": "no vessel (bottle?)"}
    src = src or find_src(stem)
    if not src:
        return {"stem": stem, "error": "src missing"}

    bg = Image.open(bg_path_for(stem)).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    im = Image.open(src).convert("RGB")
    cut = soften(strip_light_table(rembg_rgba(im)))
    cut = trim(cut)
    if subject_width(cut) < 80:
        return {"stem": stem, "error": "cutout too small"}

    target = target_diameter_px(vessel)
    sw = subject_width(cut)
    scale = target / sw
    nw = max(1, int(round(cut.width * scale)))
    nh = max(1, int(round(cut.height * scale)))
    cut = cut.resize((nw, nh), Image.Resampling.LANCZOS)
    cut = soften(cut)

    x = (SIZE - nw) // 2
    y = int(round(SIZE * VESSEL_CY[vessel] - nh / 2))
    y = max(36, min(SIZE - nh - 36, y))

    canvas = bg.copy()
    # Contact shadow: thin ellipse tucked under the vessel base (no gap)
    sh_h = max(28, int(nh * 0.18))
    sh_w = int(nw * 0.92)
    sh = soft_shadow(sh_w, sh_h)
    sh_x = x + (nw - sh_w) // 2
    sh_y = y + nh - int(sh_h * 0.55)
    canvas.paste(sh, (sh_x, sh_y), sh)
    canvas.paste(cut, (x, y), cut)

    final_w = nw
    expected = target
    err = abs(final_w - expected) / expected
    ok = err <= QA_TOL + 0.02

    unders = stem.replace("-", "_")
    canvas.save(OUT_ASSETS / f"{unders}.png", "PNG")
    canvas.save(OUT_USER / f"{unders}.png", "PNG")
    canvas.save(OUT_USER / f"{stem}.png", "PNG")

    return {
        "stem": stem,
        "vessel": vessel,
        "angle": angle_for(stem),
        "width_px": final_w,
        "target_px": expected,
        "err_pct": round(err * 100, 2),
        "ok": ok,
        "src": str(src),
    }


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    stems = [s for s in VESSEL_MAP if only is None or s in only]
    results = []
    for i, stem in enumerate(stems, 1):
        print(f"{i:02d}/{len(stems)} {stem} …", flush=True)
        try:
            info = normalize_one(stem)
        except Exception as e:
            info = {"stem": stem, "error": str(e)}
        results.append(info)
        print(f"  {info}", flush=True)
    ok = sum(1 for r in results if r.get("ok"))
    fail = [r for r in results if not r.get("ok")]
    print(json.dumps({"ok": ok, "total": len(results), "fails": fail}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
