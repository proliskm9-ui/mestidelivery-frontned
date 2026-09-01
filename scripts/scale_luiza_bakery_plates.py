# -*- coding: utf-8 -*-
"""Normalize Luizastan bakery/Svan WHITE plate diameter to millet ref (~75%).

Keeps the white plate (no rembg). Extracts the central plate disk, scales to
TARGET_FRAC, pastes onto empty scene derived from millet khachapuri.
Excludes tashmijabi.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")

BASE = "https://mestidelivery.com/api"
RID = "rest-1785095837937828031"
OUT = Path(r"c:\MestiDelivery\Frontend\scripts\menu_photos\luizastan_scale")
ASSETS = Path(r"c:\MestiDelivery\Frontend\Assets")
USER = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
SIZE = 1024
TARGET_FRAC = 0.75
TARGET_PX = int(SIZE * TARGET_FRAC)

JOBS = [
    ("luizastan-26-imeretian-khachapuri", "Хачапури по-имеретински", "luiza_26_imeretian_khachapuri"),
    ("luizastan-27-megrelian-khachapuri", "Хачапури по-мегрельски", "luiza_27_megrelian_khachapuri"),
    ("luizastan-28-adjarian-khachapuri", "Хачапури по-аджарски", "luiza_28_adjarian_khachapuri"),
    ("luizastan-29-mchadi", "Мчади", "luiza_29_mchadi"),
    ("luizastan-30-lobiani", "Лобиани", "luiza_30_lobiani"),
    ("luizastan-31-bread", "Хлеб", "luiza_31_bread"),
    ("luizastan-32-margherita", "Маргарита", "luiza_32_margherita"),
    ("luizastan-33-vegetable-pizza", "Овощная пицца", "luiza_33_veg_pizza"),
    ("luizastan-34-kubdari", "Кубдари", "luiza_34_kubdari"),
    ("luizastan-35-potato-khachapuri", "Хачапури с картофелем", "luiza_35_potato_khachapuri"),
    ("luizastan-36-millet-khachapuri", "Хачапури с просом", "luiza_36_millet_khachapuri"),
    ("luizastan-37-chvishtari", "Чвиштари", "luiza_37_chvishtari"),
    ("luizastan-38-chvishtari-millet", "Чвиштари с просом", "luiza_38_chvishtari_millet"),
]


def login() -> str:
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": "admin", "password": "423Qq!cv"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    return json.loads(urllib.request.urlopen(req, timeout=60).read())["token"]


def api(path: str, token: str):
    req = urllib.request.Request(
        f"{BASE}{path}", headers={"Authorization": f"Bearer {token}", "Accept": "application/json"}
    )
    return json.loads(urllib.request.urlopen(req, timeout=90).read())


def ru_name(p: dict) -> str:
    n = p.get("name")
    if isinstance(n, str):
        try:
            n = json.loads(n)
        except Exception:
            return n
    return (n or {}).get("ru", "") if isinstance(n, dict) else str(n or "")


def download(url: str, dest: Path) -> Path:
    if url.startswith("/"):
        url = "https://mestidelivery.com" + url
    dest.write_bytes(urllib.request.urlopen(url, timeout=90).read())
    return dest


def plate_outer_radius(rgb: np.ndarray) -> int:
    h, w = rgb.shape[:2]
    lum = rgb.astype(np.float32).mean(2)
    sat = rgb.max(2) - rgb.min(2)
    white = (lum > 185) & (sat < 40)
    cy = cx = h // 2
    ys, xs = np.mgrid[0:h, 0:w]
    rr = np.sqrt((ys - cy) ** 2 + (xs - cx) ** 2)
    outer = None
    for r in range(min(h, w) // 2 - 10, 80, -2):
        ring = (rr >= r - 2) & (rr < r + 2)
        if ring.any() and float(white[ring].mean()) > 0.15:
            outer = r
            break
    if outer is None:
        # fallback: bright central mass bbox
        center = white & (rr < 0.48 * w)
        ys2, xs2 = np.where(center)
        if len(xs2) == 0:
            return int(0.40 * w)
        return int(max(xs2.max() - xs2.min(), ys2.max() - ys2.min()) / 2)
    return int(outer)


def extract_plate_disk(im: Image.Image) -> tuple[Image.Image, int]:
    """Return RGBA disk of white plate + food, and diameter px."""
    rgb_im = im.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    arr = np.asarray(rgb_im)
    r_out = plate_outer_radius(arr)
    # slight pad so rim is fully included
    r_out = min(SIZE // 2 - 4, r_out + 4)
    diam = r_out * 2
    mask = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(mask)
    cx = cy = SIZE // 2
    draw.ellipse((cx - r_out, cy - r_out, cx + r_out, cy + r_out), fill=255)
    # feather edge slightly
    mask = mask.filter(ImageFilter.GaussianBlur(0.6))
    rgba = rgb_im.convert("RGBA")
    rgba.putalpha(mask)
    # crop to bbox
    bbox = mask.getbbox()
    disk = rgba.crop(bbox)
    return disk, diam


def soft_shadow(w: int, h: int, strength: float = 0.26) -> Image.Image:
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


def make_empty_scene(ref: Image.Image) -> Image.Image:
    """Clear center for plate paste — erase white plate + rim shadow fully."""
    im = ref.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    arr = np.asarray(im).copy().astype(np.float32)
    r_plate = plate_outer_radius(arr.astype(np.uint8))
    r_out = min(SIZE // 2 - 8, r_plate + 36)
    cy = cx = SIZE // 2
    ys, xs = np.mgrid[0:SIZE, 0:SIZE]
    rr = np.sqrt((ys - cy) ** 2 + (xs - cx) ** 2)
    lum = arr.mean(2)
    sat = arr.max(2) - arr.min(2)
    white = (lum > 175) & (sat < 42)
    wood_mask = (rr > r_out + 20) & (rr < min(SIZE // 2 - 5, r_out + 140)) & (~white)
    if not wood_mask.any():
        wood_mask = (rr > r_out + 10) & (rr < r_out + 160)
    mean = arr[wood_mask].mean(axis=0)
    rng = np.random.default_rng(2)
    noise = rng.normal(0, 7, (SIZE, SIZE, 3))
    fill = np.clip(mean[None, None, :] + noise, 0, 255)
    t = np.clip((r_out + 18 - rr) / 18.0, 0, 1)[..., None]
    arr = arr * (1 - t) + fill * t
    out = Image.fromarray(arr.astype(np.uint8))
    return out.filter(ImageFilter.GaussianBlur(0.4)).convert("RGB")


def normalize_one(src: Image.Image, empty_bg: Image.Image) -> tuple[Image.Image, dict]:
    disk, diam = extract_plate_disk(src)
    scale = TARGET_PX / diam
    nw = max(1, int(round(disk.width * scale)))
    nh = max(1, int(round(disk.height * scale)))
    disk = disk.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = empty_bg.copy()
    x = (SIZE - nw) // 2
    y = (SIZE - nh) // 2
    sh = soft_shadow(int(nw * 0.92), max(28, int(nh * 0.14)))
    canvas.paste(sh, (x + (nw - sh.width) // 2, y + nh - int(sh.height * 0.5)), sh)
    canvas.paste(disk, (x, y), disk)
    return canvas, {
        "before_px": diam,
        "before_pct": round(100 * diam / SIZE, 1),
        "after_px": nw,
        "after_pct": round(100 * nw / SIZE, 1),
        "scale": round(scale, 3),
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    token = login()
    products = api(f"/products/?restaurant_id={RID}&limit=1000", token)
    by_ru = {ru_name(p): p for p in products}

    millet = by_ru["Хачапури с просом"]
    ref_path = OUT / "ref_millet_khachapuri.jpg"
    if not ref_path.exists():
        download(millet.get("img") or "", ref_path)
    empty = make_empty_scene(Image.open(ref_path))
    empty.save(OUT / "empty_scene_v2.png", "PNG")
    print(f"target plate {TARGET_PX}px ({100*TARGET_FRAC:.1f}%)", flush=True)

    results = []
    for stem, needle, local in JOBS:
        print(f"{stem} …", flush=True)
        try:
            hits = [p for ru, p in by_ru.items() if needle.lower() in ru.lower()]
            if not hits:
                raise KeyError(needle)
            hits.sort(key=lambda p: len(ru_name(p)))
            p = hits[0]
            src_path = OUT / f"src_{stem}.jpg"
            if not src_path.exists():
                download(p.get("img") or "", src_path)
            out, info = normalize_one(Image.open(src_path), empty)
            out.save(OUT / f"{stem}.png", "PNG")
            out.save(ASSETS / f"{local}.png", "PNG")
            out.save(USER / f"{local}.png", "PNG")
            out.save(USER / f"{stem}.png", "PNG")
            info.update({"stem": stem, "ru": ru_name(p), "ok": True})
            results.append(info)
            print(info, flush=True)
        except Exception as e:
            results.append({"stem": stem, "ok": False, "error": str(e)})
            print("FAIL", e, flush=True)

    print(json.dumps({"ok": sum(1 for r in results if r.get("ok")), "total": len(results)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
