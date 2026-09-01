# -*- coding: utf-8 -*-
"""Lock empty vessel masters onto exact template pixels at fixed diameters."""
from __future__ import annotations

import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sunset_vessel_system import (  # noqa: E402
    ASSETS,
    BG_45,
    BG_TOP,
    MASTER_DIR,
    MASTER_FILES,
    SIZE,
    USER_ASSETS,
    VESSEL_CY,
    VESSEL_FRAC,
    target_diameter_px,
)


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
    return rgba.crop((max(0, x0 - pad), max(0, y0 - pad), min(rgba.width, x1 + pad), min(rgba.height, y1 + pad)))


def soft_shadow(w: int, h: int, strength: float = 0.28) -> Image.Image:
    shade = Image.new("L", (w, h), 0)
    # elliptical soft contact shadow
    arr = np.zeros((h, w), dtype=np.float32)
    cy, cx = h * 0.62, w * 0.5
    ry, rx = h * 0.22, w * 0.42
    ys, xs = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xs - cx) / max(rx, 1)) ** 2 + ((ys - cy) / max(ry, 1)) ** 2)
    arr = np.clip(1.0 - r, 0, 1) ** 1.6
    shade = Image.fromarray((arr * 255 * strength).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(12))
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.putalpha(shade)
    return out


def place_on_locked(vessel: Image.Image, bg: Image.Image, frac: float, cy_frac: float) -> Image.Image:
    v = trim(vessel)
    target = int(round(SIZE * frac))
    scale = target / max(v.width, 1)
    # keep aspect — scale so max side = target for plates; for tall cups use width
    nw = max(1, int(round(v.width * scale)))
    nh = max(1, int(round(v.height * scale)))
    if nw > target:
        scale = target / v.width
        nw = target
        nh = max(1, int(round(v.height * scale)))
    v = v.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = bg.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS).copy()
    x = (SIZE - nw) // 2
    y = int(round(SIZE * cy_frac - nh / 2))
    y = max(40, min(SIZE - nh - 40, y))
    # shadow
    sh = soft_shadow(nw + 40, nh + 30)
    canvas.paste(sh, (x - 20, y + nh // 3), sh)
    canvas.paste(v, (x, y), v)
    return canvas


def load_raw_master(name: str) -> Image.Image:
    for d in (USER_ASSETS, ASSETS, MASTER_DIR):
        p = d / name
        if p.exists():
            return Image.open(p).convert("RGB")
    raise FileNotFoundError(name)


def main() -> None:
    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    jobs = [
        ("V1", "45", BG_45, MASTER_FILES[("V1", "45")]),
        ("V1", "top", BG_TOP, MASTER_FILES[("V1", "top")]),
        ("V2", "45", BG_45, MASTER_FILES[("V2", "45")]),
        ("V3", "45", BG_45, MASTER_FILES[("V3", "45")]),
        ("C1", "45", BG_45, MASTER_FILES[("C1", "45")]),
    ]
    for vid, angle, bg_path, raw_name in jobs:
        print(f"locking {vid}/{angle} …", flush=True)
        raw = load_raw_master(raw_name)
        cut = rembg_rgba(raw)
        # Prefer darkest central blob (vessel) — drop light table leftovers
        arr = np.asarray(cut)
        a = arr[..., 3]
        rgb = arr[..., :3].astype(np.float32)
        lum = rgb.mean(axis=-1)
        # keep opaque mid-dark charcoal
        keep = (a > 40) & (lum < 160)
        arr2 = arr.copy()
        arr2[~keep, 3] = 0
        cut = trim(Image.fromarray(arr2))
        bg = Image.open(bg_path)
        out = place_on_locked(cut, bg, VESSEL_FRAC[vid], VESSEL_CY[vid])
        out_name = f"locked_{vid}_{angle}.png"
        out.save(MASTER_DIR / out_name, "PNG")
        out.save(USER_ASSETS / out_name, "PNG")
        # also save cutout alone for GenerateImage refs
        cut_path = MASTER_DIR / f"cutout_{vid}_{angle}.png"
        # remake cutout at exact diameter on transparent
        target = target_diameter_px(vid)
        c = trim(cut)
        scale = target / max(c.width, 1)
        c = c.resize((max(1, int(c.width * scale)), max(1, int(c.height * scale))), Image.Resampling.LANCZOS)
        c.save(cut_path, "PNG")
        diam = max(c.size)
        print(f"  saved {out_name} diam~{diam}px ({100*diam/SIZE:.1f}%)", flush=True)


if __name__ == "__main__":
    main()
