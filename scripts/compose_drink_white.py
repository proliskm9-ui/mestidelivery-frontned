# -*- coding: utf-8 -*-
"""Pad drink product photos onto pure white 1:1 canvases without grey mats."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

OUT = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
ASSETS = Path(r"C:\MestiDelivery\Frontend\Assets")
REFS = Path(r"C:\MestiDelivery\Frontend\Luizastan")
USER = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")


def content_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    br = sum(sum(c) / 3 for c in corners) / 4
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            val = (r + g + b) / 3
            chroma = max(abs(r - g), abs(g - b), abs(r - b))
            if br > 200:
                if val < 248 or chroma > 8:
                    xs.append(x)
                    ys.append(y)
            elif br < 40:
                if val > 20 or chroma > 12:
                    xs.append(x)
                    ys.append(y)
            else:
                if abs(val - br) > 18 or chroma > 12:
                    xs.append(x)
                    ys.append(y)
    if not xs:
        return (0, 0, w, h)
    pad = 8
    return (
        max(0, min(xs) - pad),
        max(0, min(ys) - pad),
        min(w, max(xs) + pad),
        min(h, max(ys) + pad),
    )


def on_pure_white(src: Image.Image, size: int = 1024, height_ratio: float = 0.86) -> Image.Image:
    cropped = src.convert("RGBA").crop(content_bbox(src))
    target_h = int(size * height_ratio)
    scale = target_h / cropped.height
    new_w = max(1, int(cropped.width * scale))
    new_h = target_h
    max_w = int(size * 0.48)
    if new_w > max_w:
        scale = max_w / cropped.width
        new_w = max_w
        new_h = max(1, int(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(resized, (x, y), resized if resized.mode == "RGBA" else None)
    return canvas


def main() -> None:
    jobs = [
        (
            USER
            / "c__Users_sxclipse_AppData_Roaming_Cursor_User_workspaceStorage_c898333788977c6ec68420474be99ea8_images_7-2017-coca-cola-coca-cola-105731300-5d5037ae-14db-4709-ad2e-b7f109b23d33.png",
            "luizastan-62-cola.png",
            "luiza_62_cola.png",
        ),
        (
            USER
            / "c__Users_sxclipse_AppData_Roaming_Cursor_User_workspaceStorage_c898333788977c6ec68420474be99ea8_images_cddb3aebf5c9f843940bb21d1da66c6d-91cb5068-a9c3-4eb0-9143-d790347433e7.png",
            "luizastan-60-lemonade.png",
            "luiza_60_lemonade.png",
        ),
    ]
    # Prefer Luizastan lemonade photo if present and better framed
    local_lemon = REFS / "лимонад.jfif"
    if local_lemon.exists():
        jobs[1] = (local_lemon, "luizastan-60-lemonade.png", "luiza_60_lemonade.png")

    for src_path, out_name, assets_name in jobs:
        out = on_pure_white(Image.open(src_path))
        out.save(OUT / out_name, "PNG")
        out.save(ASSETS / assets_name, "PNG")
        print("saved", out_name, out.size)


if __name__ == "__main__":
    main()
