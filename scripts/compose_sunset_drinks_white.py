# -*- coding: utf-8 -*-
"""Compose Sunset soft drinks onto pure white 1:1 canvases — Luizastan style."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

REPO = Path(r"C:\MestiDelivery\Frontend")
ASSETS = REPO / "Assets"
OUT = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
SUNSET = REPO / "Sunset restaraunt"
LUIZA = REPO / "Luizastan"

# Reuse proven Luizastan drink canvases where the product matches.
COPY_JOBS = [
    (ASSETS / "luiza_62_cola.png", "sunset_67_cola.png", "sunset-67-cola.png"),
    (ASSETS / "luiza_60_lemonade.png", "sunset_70_natakhtari.png", "sunset-70-natakhtari.png"),
    (ASSETS / "luiza_64_still_water.png", "sunset_69_water.png", "sunset-69-water.png"),
]

# New real product photos from Sunset folder → white studio like Luizastan.
COMPOSE_JOBS = [
    (SUNSET / "borjomi.jpeg", "sunset_68_borjomi.png", "sunset-68-borjomi.png"),
    (SUNSET / "лимонад zedazeni.jpg", "sunset_71_zedazeni.png", "sunset-71-zedazeni.png"),
]


def content_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    rgba = im.convert("RGBA")
    alpha = rgba.getchannel("A")
    if any(a < 250 for a in alpha.getdata()):
        bbox = rgba.getbbox()
        if bbox:
            return bbox

    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    br = sum(sum(c) / 3 for c in corners) / 4
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            val = (r + g + b) / 3
            chroma = max(abs(r - g), abs(g - b), abs(r - b))
            if br < 40:
                if val > 25 or chroma > 15:
                    xs.append(x)
                    ys.append(y)
            else:
                if val < 248 or chroma > 10:
                    xs.append(x)
                    ys.append(y)
    if not xs:
        return (0, 0, w, h)
    pad = 6
    return (
        max(0, min(xs) - pad),
        max(0, min(ys) - pad),
        min(w, max(xs) + pad),
        min(h, max(ys) + pad),
    )


def product_on_white(
    src: Image.Image,
    size: int = 1024,
    height_ratio: float = 0.86,
    max_width_ratio: float = 0.48,
) -> Image.Image:
    im = src.convert("RGBA")
    cropped = im.crop(content_bbox(im))
    target_h = int(size * height_ratio)
    scale = target_h / cropped.height
    new_w = max(1, int(cropped.width * scale))
    new_h = target_h
    max_w = int(size * max_width_ratio)
    if new_w > max_w:
        scale = max_w / cropped.width
        new_w = max_w
        new_h = max(1, int(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def save_both(img: Image.Image, assets_name: str, out_name: str) -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(ASSETS / assets_name, "PNG")
    img.save(OUT / out_name, "PNG")
    print("saved", assets_name, img.size)


def main() -> None:
    for src, assets_name, out_name in COPY_JOBS:
        if not src.exists():
            raise FileNotFoundError(src)
        img = Image.open(src).convert("RGB")
        save_both(img, assets_name, out_name)
        shutil.copy2(src, OUT / out_name)

    for src, assets_name, out_name in COMPOSE_JOBS:
        if not src.exists():
            raise FileNotFoundError(src)
        out = product_on_white(Image.open(src))
        save_both(out, assets_name, out_name)


if __name__ == "__main__":
    main()
