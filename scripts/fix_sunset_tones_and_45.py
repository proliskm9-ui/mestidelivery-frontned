# -*- coding: utf-8 -*-
"""Cool-normalize Sunset top-down cards + composite 45° dishes onto clean bg."""
from __future__ import annotations

import statistics as st
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SRC = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
REPO = Path(r"C:\MestiDelivery\Frontend\Assets")
BG45 = REPO / "sunset_templates" / "bg_45deg.png"
BGTD = REPO / "sunset_templates" / "bg_topdown_cropped.png"
OUT = SRC / "sunset_fixed"
OUT.mkdir(exist_ok=True)

TOPDOWN = [
    "sunset-01-bread",
    "sunset-03-suluguni",
    "sunset-26-chvishtari",
    "sunset-27-chvishtari-millet",
    "sunset-28-kubdari",
    "sunset-30-royal-khachapuri",
    "sunset-49-imeretian-khachapuri",
    "sunset-50-megrelian-khachapuri",
    "sunset-51-mchadi",
    "sunset-52-lobiani",
    "sunset-55-pepperoni",
    "sunset-56-mushroom-pizza",
    "sunset-57-margherita",
]

# All non-drink, non-topdown menu cards use 45° (sauces included)
ANGLE45 = [
    "sunset-02-pickles",
    "sunset-04-fries",
    "sunset-05-cheese-board",
    "sunset-06-cucumber-tomato",
    "sunset-07-cucumber-walnut",
    "sunset-08-caesar",
    "sunset-09-greek",
    "sunset-10-green-salad",
    "sunset-11-chicken-salad",
    "sunset-12-eggplant-walnut",
    "sunset-13-eggplant-garlic",
    "sunset-14-bean-corn",
    "sunset-15-quinoa",
    "sunset-16-couscous",
    "sunset-17-kharcho",
    "sunset-18-veg-soup",
    "sunset-19-veg-cream",
    "sunset-20-mushroom-soup",
    "sunset-21-mushroom-cream",
    "sunset-22-chikhirtma",
    "sunset-23-borscht",
    "sunset-24-pumpkin-cream",
    "sunset-25-tashmijabi",
    "sunset-31-fried-chicken",
    "sunset-32-chicken-adjika",
    "sunset-33-chkmeruli",
    "sunset-34-stewed-beef",
    "sunset-35-stewed-tashmijabi",
    "sunset-36-khashlama",
    "sunset-37-pork-mtsvadi",
    "sunset-38-pork-ribs",
    "sunset-39-trout",
    "sunset-40-stewed-mushrooms",
    "sunset-41-chicken-liver-ketsi",
    "sunset-42-chicken-bbq-rice",
    "sunset-43-ajapsandali",
    "sunset-44-lobio-pot",
    "sunset-45-lobio-walnut",
    "sunset-46-ojakhuri",
    "sunset-47-carbonara",
    "sunset-48-bolognese",
    "sunset-53-khinkali",
    "sunset-54-cheese-khinkali",
    "sunset-58-homestyle-potato",
    "sunset-59-rice",
    "sunset-60-spaghetti",
    "sunset-61-buckwheat",
    "sunset-62-tkemali",
    "sunset-63-tomato-sauce",
    "sunset-64-ketchup",
    "sunset-65-sour-cream",
    "sunset-66-bazhe",
]

SAUCE = {
    "sunset-62-tkemali",
    "sunset-63-tomato-sauce",
    "sunset-64-ketchup",
    "sunset-65-sour-cream",
    "sunset-66-bazhe",
}


def find(stem: str) -> Path:
    for base in (SRC, REPO):
        for ext in (".png", ".jpg", ".jpeg", ".webp"):
            p = base / f"{stem}{ext}"
            if p.exists():
                return p
            p2 = base / f"{stem.replace('-', '_')}{ext}"
            if p2.exists():
                return p2
    raise FileNotFoundError(stem)


def table_means(im: Image.Image, regions: list[tuple[int, int, int, int]]):
    w, h = im.size
    px = im.load()
    rs, gs, bs = [], [], []
    for x0, y0, x1, y1 in regions:
        for y in range(max(0, y0), min(h, y1), 5):
            for x in range(max(0, x0), min(w, x1), 5):
                r, g, b = px[x, y]
                if r + g + b < 180 or r + g + b > 700:
                    continue
                if abs(r - g) < 45 and abs(g - b) < 45:
                    rs.append(r)
                    gs.append(g)
                    bs.append(b)
    if not rs:
        return None
    return st.mean(rs), st.mean(gs), st.mean(bs)


def cool_match(im: Image.Image, target: tuple[float, float, float], regions) -> Image.Image:
    cur = table_means(im, regions)
    if not cur:
        return im
    # gains to push current table toward cooler target
    gains = [target[i] / max(cur[i], 1e-3) for i in range(3)]
    # dampen: don't overshoot
    gains = [1 + (g - 1) * 0.85 for g in gains]
    # extra cool: slightly pull blue up / red down if still warm
    yel = (cur[0] + cur[1]) / 2 - cur[2]
    if yel > 12:
        gains[0] *= 0.97
        gains[1] *= 0.985
        gains[2] *= 1.04
    out = im.convert("RGB")
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            nr = min(255, max(0, int(r * gains[0])))
            ng = min(255, max(0, int(g * gains[1])))
            nb = min(255, max(0, int(b * gains[2])))
            px[x, y] = (nr, ng, nb)
    # slight desat of warmth
    out = ImageEnhance.Color(out).enhance(0.96)
    return out


def content_bbox(rgba: Image.Image) -> tuple[int, int, int, int]:
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return (0, 0, rgba.size[0], rgba.size[1])
    return bbox


def composite_on_bg(
    dish_rgba: Image.Image,
    bg: Image.Image,
    target_width_frac: float = 0.70,
) -> Image.Image:
    bg = bg.convert("RGBA").resize((1024, 1024), Image.Resampling.LANCZOS)
    bbox = content_bbox(dish_rgba)
    dish = dish_rgba.crop(bbox)
    # scale
    tw = int(1024 * target_width_frac)
    scale = tw / dish.size[0]
    nh = int(dish.size[1] * scale)
    dish = dish.resize((tw, nh), Image.Resampling.LANCZOS)
    # center slightly above geometric center for 45° feel
    x = (1024 - tw) // 2
    y = (1024 - nh) // 2 + 20
    # soft shadow
    shadow = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    sh = dish.split()[-1].point(lambda a: int(a * 0.35))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    shadow.paste((0, 0, 0, 0), (x + 8, y + 14))
    shadow_layer = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    shadow_layer.paste((0, 0, 0, 90), (x + 10, y + 16), sh)
    out = Image.alpha_composite(bg, shadow_layer)
    out.alpha_composite(dish, (x, y))
    return out.convert("RGB")


def cool_bg45(bg: Image.Image) -> Image.Image:
    """Push 45 template toward cooler top-down template tone."""
    bg = bg.convert("RGB")
    # mild cool: reduce yellow cast in template itself
    px = bg.load()
    w, h = bg.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            # sofa keep dark
            if r + g + b < 120:
                continue
            nr = min(255, max(0, int(r * 0.96)))
            ng = min(255, max(0, int(g * 0.98)))
            nb = min(255, max(0, int(b * 1.03)))
            px[x, y] = (nr, ng, nb)
    return ImageEnhance.Color(bg).enhance(0.95)


def main():
    td_regions = [(20, 20, 220, 180), (800, 20, 1000, 180), (800, 850, 1000, 1000), (20, 850, 220, 1000)]
    target = table_means(Image.open(BGTD).convert("RGB"), td_regions)
    print("target WB", target)

    # 1) cool top-downs
    for stem in TOPDOWN:
        im = Image.open(find(stem)).convert("RGB")
        before = table_means(im, td_regions)
        fixed = cool_match(im, target, td_regions)
        after = table_means(fixed, td_regions)
        path = OUT / f"{stem}.png"
        fixed.save(path, "PNG")
        # also overwrite working assets
        fixed.save(SRC / f"{stem}.png", "PNG")
        fixed.save(REPO / f"{stem.replace('-', '_')}.png", "PNG")
        print(f"TD {stem}: {before} -> {after}")

    # 2) prepare cool 45 bg
    bg45 = cool_bg45(Image.open(BG45))
    bg45.save(OUT / "bg_45_cool.png")
    bg45.save(SRC / "sunset-bg-45deg.png")

    print("top-down done; bg45 cooled")


if __name__ == "__main__":
    main()
