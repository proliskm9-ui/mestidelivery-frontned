# -*- coding: utf-8 -*-
"""Sunset vessel lock system — living full-frame scale canon.

See scripts/sunset_tech_card.py for pipeline rules.
V1 flat plate 78% | V2 = Luizastan white shallow coupe 80% | V3 ramekin 48% | C1 cup 54%
Bottles stay white-studio (no vessel).
"""
from __future__ import annotations

from pathlib import Path

REPO = Path(r"C:\MestiDelivery\Frontend")
TPL = REPO / "Assets" / "sunset_templates"
BG_45 = TPL / "bg_45deg.png"
BG_TOP = TPL / "bg_topdown.png"
ASSETS = REPO / "Assets"
USER_ASSETS = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
MASTER_DIR = ASSETS / "sunset_vessels"

SIZE = 1024

# STRICT outer diameter as fraction of frame width (tech card)
VESSEL_FRAC = {
    "V1": 0.78,  # flat plate
    "V2": 0.80,  # deep bowl
    "V3": 0.48,  # ramekin
    "C1": 0.54,  # cup + saucer
}

# Vertical center bias (fraction of height) — slightly below geometric center for 45°
VESSEL_CY = {
    "V1": 0.54,
    "V2": 0.55,
    "V3": 0.54,
    "C1": 0.52,
}

TOPDOWN_STEMS = {
    "sunset-01-bread",
    "sunset-03-suluguni",
    "sunset-05-cheese-board",
    "sunset-26-chvishtari",
    "sunset-27-chvishtari-millet",
    "sunset-28-kubdari",
    "sunset-29-millet-khachapuri",
    "sunset-30-royal-khachapuri",
    "sunset-49-imeretian-khachapuri",
    "sunset-50-megrelian-khachapuri",
    "sunset-51-mchadi",
    "sunset-52-lobiani",
    "sunset-55-pepperoni",
    "sunset-56-mushroom-pizza",
    "sunset-57-margherita",
}

# stem -> vessel id (skip bottles)
VESSEL_MAP: dict[str, str] = {
    # appetizers / sides — plate
    "sunset-01-bread": "V1",
    "sunset-02-pickles": "V1",
    "sunset-03-suluguni": "V1",
    "sunset-04-fries": "V1",
    "sunset-05-cheese-board": "V1",
    # salads — bowl
    "sunset-06-cucumber-tomato": "V2",
    "sunset-07-cucumber-walnut": "V2",
    "sunset-08-caesar": "V2",
    "sunset-09-greek": "V2",
    "sunset-10-green-salad": "V2",
    "sunset-11-chicken-salad": "V2",
    "sunset-12-eggplant-walnut": "V2",
    "sunset-13-eggplant-garlic": "V2",
    "sunset-14-bean-corn": "V2",
    "sunset-15-quinoa": "V2",
    "sunset-16-couscous": "V2",
    # soups — bowl
    "sunset-17-kharcho": "V2",
    "sunset-18-veg-soup": "V2",
    "sunset-19-veg-cream": "V2",
    "sunset-20-mushroom-soup": "V2",
    "sunset-21-mushroom-cream": "V2",
    "sunset-22-chikhirtma": "V2",
    "sunset-23-borscht": "V2",
    "sunset-24-pumpkin-cream": "V2",
    # hot / bakery flats
    "sunset-25-tashmijabi": "V2",
    "sunset-26-chvishtari": "V1",
    "sunset-27-chvishtari-millet": "V1",
    "sunset-28-kubdari": "V1",
    "sunset-29-millet-khachapuri": "V1",
    "sunset-30-royal-khachapuri": "V1",
    "sunset-31-fried-chicken": "V1",
    "sunset-33-chkmeruli": "V2",
    "sunset-34-stewed-beef": "V2",
    "sunset-35-stewed-tashmijabi": "V2",
    "sunset-36-khashlama": "V2",
    "sunset-37-pork-mtsvadi": "V1",
    "sunset-38-pork-ribs": "V1",
    "sunset-39-trout": "V1",
    "sunset-40-stewed-mushrooms": "V2",
    "sunset-41-chicken-liver-ketsi": "V2",
    "sunset-42-chicken-bbq-rice": "V1",
    "sunset-43-ajapsandali": "V2",
    "sunset-44-lobio-pot": "V2",
    "sunset-45-lobio-walnut": "V2",
    "sunset-46-ojakhuri": "V2",
    "sunset-47-carbonara": "V2",
    "sunset-48-bolognese": "V2",
    "sunset-49-imeretian-khachapuri": "V1",
    "sunset-50-megrelian-khachapuri": "V1",
    "sunset-51-mchadi": "V1",
    "sunset-52-lobiani": "V1",
    "sunset-53-khinkali": "V1",
    "sunset-54-cheese-khinkali": "V1",
    "sunset-55-pepperoni": "V1",
    "sunset-56-mushroom-pizza": "V1",
    "sunset-57-margherita": "V1",
    "sunset-58-homestyle-potato": "V1",
    "sunset-59-rice": "V2",
    "sunset-60-spaghetti": "V2",
    "sunset-61-buckwheat": "V2",
    # sauces — ramekin
    "sunset-62-tkemali": "V3",
    "sunset-63-tomato-sauce": "V3",
    "sunset-64-ketchup": "V3",
    "sunset-65-sour-cream": "V3",
    "sunset-66-bazhe": "V3",
    # coffee / tea
    "sunset-73-cappuccino": "C1",
    "sunset-74-espresso": "C1",
    "sunset-75-americano": "C1",
    "sunset-76-latte": "C1",
    "sunset-77-instant-coffee": "C1",
    "sunset-78-tea": "C1",
}

MASTER_FILES = {
    ("V1", "45"): "vessel_master_v1_plate_45.png",
    ("V1", "top"): "vessel_master_v1_plate_top.png",
    ("V2", "45"): "vessel_master_v2_bowl_45.png",
    ("V3", "45"): "vessel_master_v3_ramekin_45.png",
    ("C1", "45"): "vessel_master_c1_cup_45.png",
}


def angle_for(stem: str) -> str:
    return "top" if stem in TOPDOWN_STEMS else "45"


def bg_path_for(stem: str) -> Path:
    return BG_TOP if angle_for(stem) == "top" else BG_45


def target_diameter_px(vessel: str) -> int:
    return int(round(SIZE * VESSEL_FRAC[vessel]))


def find_src(stem: str) -> Path | None:
    names = [stem, stem.replace("-", "_")]
    for d in (ASSETS, USER_ASSETS, USER_ASSETS / "sunset_locked"):
        for n in names:
            for ext in (".png", ".jpg", ".jpeg", ".webp"):
                p = d / f"{n}{ext}"
                if p.exists():
                    return p
    return None
