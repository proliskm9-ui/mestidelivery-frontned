# -*- coding: utf-8 -*-
"""Place real drink product photos onto clean 1:1 white studio canvases."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

OUT = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
REFS = Path(r"C:\MestiDelivery\Frontend\Luizastan")
ASSETS = Path(r"C:\MestiDelivery\Frontend\Assets")


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
                if val < 245 or chroma > 12:
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
    height_ratio: float = 0.84,
    max_width_ratio: float = 0.52,
    bg: tuple[int, int, int] = (252, 252, 252),
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
    canvas = Image.new("RGB", (size, size), bg)
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def main() -> None:
    mapping = [
        ("вода без газа.png", "luizastan-64-still-water.png", "luiza_64_still_water.png"),
        ("минеральная вода.jpg", "luizastan-63-mineral.png", "luiza_63_mineral.png"),
        ("кока кола.jpg", "luizastan-62-cola.png", "luiza_62_cola.png"),
    ]
    for src_name, out_name, assets_name in mapping:
        src = Image.open(REFS / src_name)
        out = product_on_white(src)
        out_path = OUT / out_name
        assets_path = ASSETS / assets_name
        out.save(out_path, "PNG")
        out.save(assets_path, "PNG")
        print(f"saved {out_path.name} and {assets_path.name} {out.size}")


if __name__ == "__main__":
    main()
