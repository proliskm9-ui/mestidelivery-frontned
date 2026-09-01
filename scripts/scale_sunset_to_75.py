# -*- coding: utf-8 -*-
"""Scale Sunset vessel subjects to locked VESSEL_FRAC (V1/V2 = 75%).

Extracts subject via pixel diff vs locked template (preferred) or rembg fallback,
rescales to target diameter, pastes onto fresh locked BG with soft contact shadow.
Bottles (absent from VESSEL_MAP) are skipped.
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
    target_diameter_px,
)

sys.stdout.reconfigure(encoding="utf-8")

OUT_ASSETS = ASSETS
OUT_USER = USER_ASSETS
OUT_LOCKED = USER_ASSETS / "sunset_locked"
OUT_LOCKED.mkdir(exist_ok=True)
QA_TOL = 0.035
DIFF_THR = 14.0
CORNER_MAE_OK = 12.0


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
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(rgba.width, x1 + pad),
            min(rgba.height, y1 + pad),
        )
    )


def soften_alpha(rgba: Image.Image, r: float = 0.7) -> Image.Image:
    arr = np.asarray(rgba).copy()
    a = Image.fromarray(arr[..., 3], "L").filter(ImageFilter.GaussianBlur(r))
    arr[..., 3] = np.asarray(a)
    return Image.fromarray(arr)


def corner_mae(rgb: np.ndarray, bg: np.ndarray, pad: int = 48) -> float:
    corners = [
        (rgb[:pad, :pad], bg[:pad, :pad]),
        (rgb[:pad, -pad:], bg[:pad, -pad:]),
        (rgb[-pad:, :pad], bg[-pad:, :pad]),
        (rgb[-pad:, -pad:], bg[-pad:, -pad:]),
    ]
    return float(np.mean([np.abs(a.astype(np.float32) - b.astype(np.float32)).mean() for a, b in corners]))


def extract_by_diff(rgb: Image.Image, bg: Image.Image) -> Image.Image | None:
    arr = np.asarray(rgb.convert("RGB")).astype(np.float32)
    bga = np.asarray(bg.convert("RGB").resize(rgb.size, Image.Resampling.LANCZOS)).astype(np.float32)
    if corner_mae(arr, bga) > CORNER_MAE_OK:
        return None
    diff = np.abs(arr - bga).mean(axis=-1)
    mask = diff > DIFF_THR
    # Keep central blob — drop floating edge noise
    h, w = mask.shape
    cy, cx = h // 2, w // 2
    from collections import deque

    visited = np.zeros_like(mask)
    if not mask[cy, cx]:
        # find nearest masked pixel to center
        ys, xs = np.where(mask)
        if len(xs) == 0:
            return None
        i = int(np.argmin((ys - cy) ** 2 + (xs - cx) ** 2))
        cy, cx = int(ys[i]), int(xs[i])
    q: deque[tuple[int, int]] = deque([(cy, cx)])
    visited[cy, cx] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    # Dilate slightly to keep edge pixels / soft shadow crumbs
    m = Image.fromarray((visited.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(5))
    alpha = np.asarray(m)
    # Feather: alpha proportional to how different from BG inside mask
    strength = np.clip((diff - DIFF_THR) / 40.0, 0, 1)
    a = (alpha > 0).astype(np.float32) * (0.55 + 0.45 * strength)
    a = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    rgba = np.dstack([arr.astype(np.uint8), a])
    return soften_alpha(trim(Image.fromarray(rgba)))


def soft_shadow(w: int, h: int, strength: float = 0.30) -> Image.Image:
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


def find_src(stem: str) -> Path | None:
    unders = stem.replace("-", "_")
    for d in (ASSETS, USER_ASSETS, OUT_LOCKED):
        for n in (unders, stem):
            for ext in (".png", ".jpg", ".jpeg", ".webp"):
                p = d / f"{n}{ext}"
                if p.exists():
                    return p
    return None


def scale_one(stem: str) -> dict:
    vessel = VESSEL_MAP.get(stem)
    if not vessel:
        return {"stem": stem, "skipped": "bottle"}
    src = find_src(stem)
    if not src:
        return {"stem": stem, "error": "src missing"}

    bg = Image.open(bg_path_for(stem)).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    im = Image.open(src).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)

    cut = extract_by_diff(im, bg)
    method = "diff"
    if cut is None or subject_width(cut) < 80:
        cut = soften_alpha(trim(rembg_rgba(im)))
        method = "rembg"
    if subject_width(cut) < 80:
        return {"stem": stem, "error": "cutout too small", "method": method}

    target = target_diameter_px(vessel)
    sw = subject_width(cut)
    scale = target / sw
    nw = max(1, int(round(cut.width * scale)))
    nh = max(1, int(round(cut.height * scale)))
    cut = cut.resize((nw, nh), Image.Resampling.LANCZOS)
    cut = soften_alpha(cut)

    x = (SIZE - nw) // 2
    y = int(round(SIZE * VESSEL_CY[vessel] - nh / 2))
    y = max(28, min(SIZE - nh - 28, y))

    canvas = bg.copy()
    sh_h = max(28, int(nh * 0.16))
    sh_w = int(nw * 0.90)
    sh = soft_shadow(sh_w, sh_h)
    sh_x = x + (nw - sh_w) // 2
    sh_y = y + nh - int(sh_h * 0.55)
    canvas.paste(sh, (sh_x, sh_y), sh)
    canvas.paste(cut, (x, y), cut)

    final_w = subject_width(cut)
    err = abs(final_w - target) / target
    ok = err <= QA_TOL

    unders = stem.replace("-", "_")
    canvas.save(OUT_ASSETS / f"{unders}.png", "PNG")
    canvas.save(OUT_USER / f"{unders}.png", "PNG")
    canvas.save(OUT_USER / f"{stem}.png", "PNG")
    canvas.save(OUT_LOCKED / f"{stem}.png", "PNG")

    return {
        "stem": stem,
        "vessel": vessel,
        "angle": angle_for(stem),
        "method": method,
        "width_px": final_w,
        "target_px": target,
        "frac": round(final_w / SIZE, 4),
        "err_pct": round(err * 100, 2),
        "ok": ok,
        "src": src.name,
    }


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    stems = [s for s in VESSEL_MAP if only is None or s in only]
    results = []
    for i, stem in enumerate(stems, 1):
        print(f"{i:02d}/{len(stems)} {stem} …", flush=True)
        try:
            info = scale_one(stem)
        except Exception as e:
            info = {"stem": stem, "error": str(e)}
        results.append(info)
        print(f"  {info}", flush=True)

    ok = sum(1 for r in results if r.get("ok"))
    fails = [r for r in results if not r.get("ok")]
    report = {
        "ok": ok,
        "total": len(results),
        "targets": VESSEL_FRAC,
        "fails": fails,
    }
    out = Path(__file__).with_name("_sunset_scale75_report.json")
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
