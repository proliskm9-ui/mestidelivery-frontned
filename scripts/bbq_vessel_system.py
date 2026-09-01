# -*- coding: utf-8 -*-
"""BBQ Garden vessel lock — summer terrace cafe on locked wood templates.

Vessels: warm matte cream ceramic (pops on dark wood, cozy terrace — not fancy stoneware).
V1 plate 72% | V2 bowl 72% | V3 ramekin 48% | C1 cup 54%
Bottles: white studio.
"""
from __future__ import annotations

from pathlib import Path

REPO = Path(r"C:\MestiDelivery\Frontend")
TPL = REPO / "Assets" / "bbq_templates"
BG_45 = TPL / "bg_45deg.png"
BG_TOP = TPL / "bg_topdown.png"
ASSETS = REPO / "Assets"
USER_ASSETS = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
MASTER_DIR = ASSETS / "bbq_vessels"
BBQ_REFS = REPO / "BBQ Garden"
SIZE = 1024
RESTAURANT_ID = "rest-1785110335267403964"

VESSEL_FRAC = {"V1": 0.75, "V2": 0.75, "V3": 0.48, "C1": 0.54}
VESSEL_CY = {"V1": 0.50, "V2": 0.50, "V3": 0.50, "C1": 0.52}

# Top-down: flat bakery, cheese, bread, churchkhela, peanuts, ice cream scoops optional
TOPDOWN = {
    # mains all 45° (khachapuri included) per BBQ regen
    "bbq-24-cheese-plate",
    "bbq-25-bread",
    "bbq-33-churchkhela",
    "bbq-34-peanuts",
    "bbq-04-cheese-sandwich",
    "bbq-05-ham-cheese-sandwich",
}

# stem -> vessel (skip bottles)
VESSEL_MAP: dict[str, str] = {
    # breakfast
    "bbq-01-oatmeal": "V2",
    "bbq-02-cottage-cheese": "V2",
    "bbq-03-omelet": "V1",
    "bbq-04-cheese-sandwich": "V1",
    "bbq-05-ham-cheese-sandwich": "V1",
    # soups
    "bbq-06-borscht": "V2",
    "bbq-07-matsoni-soup": "V2",
    # mains / grill
    "bbq-08-pork-bbq": "V1",
    "bbq-09-chicken-bbq": "V1",
    "bbq-10-kebab-lavash": "V1",
    "bbq-11-khachapuri": "V1",
    "bbq-12-trout": "V1",
    "bbq-13-grilled-veg": "V1",
    "bbq-14-wings": "V1",
    "bbq-15-kupati": "V1",
    "bbq-16-sausages": "V1",
    "bbq-17-fries": "V1",
    # salads / zakuski
    "bbq-18-tomato-cucumber": "V2",
    "bbq-19-salad-walnuts": "V2",
    "bbq-20-beetroot": "V2",
    "bbq-21-carrot": "V2",
    "bbq-22-beans-walnut": "V2",
    "bbq-23-pickles": "V1",
    "bbq-24-cheese-plate": "V1",
    # sides / sauces
    "bbq-25-bread": "V1",
    "bbq-26-tkemali": "V3",
    "bbq-27-ketchup": "V3",
    "bbq-28-mayo": "V3",
    # desserts
    "bbq-29-pudding": "V2",
    "bbq-30-cake": "V1",
    "bbq-31-icecream-vanilla": "V2",
    "bbq-32-cream-fruit": "V2",
    "bbq-33-churchkhela": "V1",
    "bbq-34-peanuts": "V1",
    "bbq-45-icecream-chocolate": "V2",
    # coffee / tea
    "bbq-35-espresso": "C1",
    "bbq-36-americano": "C1",
    "bbq-37-cappuccino": "C1",
    "bbq-38-tea-black": "C1",
    "bbq-46-tea-green": "C1",
}

# bottles — white studio, no vessel
BOTTLE_STEMS = {
    "bbq-39-lemonade",
    "bbq-40-cola",
    "bbq-41-water",
    "bbq-42-sparkling",
    "bbq-43-juice",
    "bbq-44-kompot",
}

# Upload map: stem -> RU needle
PHOTO_MAP = [
    ("bbq-01-oatmeal", "Овсяная каша"),
    ("bbq-02-cottage-cheese", "Творог с мёдом"),
    ("bbq-03-omelet", "Омлет с сыром"),
    ("bbq-04-cheese-sandwich", "Сэндвич с сыром"),
    ("bbq-05-ham-cheese-sandwich", "Сэндвич с ветчиной"),
    ("bbq-06-borscht", "Борщ"),
    ("bbq-07-matsoni-soup", "мацони"),
    ("bbq-08-pork-bbq", "свинины"),
    ("bbq-09-chicken-bbq", "Шашлык из курицы"),
    ("bbq-10-kebab-lavash", "Кебаб"),
    ("bbq-11-khachapuri", "Хачапури на вертеле"),
    ("bbq-12-trout", "Форель"),
    ("bbq-13-grilled-veg", "Овощи на гриле"),
    ("bbq-14-wings", "крылышки"),
    ("bbq-15-kupati", "Купаты"),
    ("bbq-16-sausages", "Сосиски"),
    ("bbq-17-fries", "Картофель фри"),
    ("bbq-18-tomato-cucumber", "Салат из помидоров и огурцов"),
    ("bbq-19-salad-walnuts", "Салат из помидоров и огурцов с орехами"),
    ("bbq-20-beetroot", "свёклы"),
    ("bbq-21-carrot", "Морковный"),
    ("bbq-22-beans-walnut", "Фасоль"),
    ("bbq-23-pickles", "Маринованные"),
    ("bbq-24-cheese-plate", "сыров"),
    ("bbq-25-bread", "Хлеб"),
    ("bbq-26-tkemali", "Ткемали"),
    ("bbq-27-ketchup", "Кетчуп"),
    ("bbq-28-mayo", "Майонез"),
    ("bbq-29-pudding", "пудинг"),
    ("bbq-30-cake", "Торт дня"),
    ("bbq-31-icecream-vanilla", "Мороженое ванильное"),
    ("bbq-45-icecream-chocolate", "Мороженое шоколадное"),
    ("bbq-32-cream-fruit", "Крем с фруктами"),
    ("bbq-33-churchkhela", "Чурчхела"),
    ("bbq-34-peanuts", "Арахис"),
    ("bbq-35-espresso", "Эспрессо"),
    ("bbq-36-americano", "Американо"),
    ("bbq-37-cappuccino", "Капучино"),
    ("bbq-38-tea-black", "чёрный чай"),
    ("bbq-46-tea-green", "зелёный чай"),
    ("bbq-39-lemonade", "лимонад"),
    ("bbq-40-cola", "Coca-Cola"),
    ("bbq-42-sparkling", "Газированная"),
    ("bbq-41-water", "Минеральная вода"),
    ("bbq-43-juice", "Сок"),
    ("bbq-44-kompot", "Компот"),
]

# Local food refs (first existing wins)
FOOD_REFS: dict[str, list[Path]] = {
    "bbq-09-chicken-bbq": [BBQ_REFS / "шашлык из курицы.jpg"],
    "bbq-13-grilled-veg": [BBQ_REFS / "овощи гриль.jpg"],
    "bbq-18-tomato-cucumber": [BBQ_REFS / "салат огурцы помидоры.jpg"],
    "bbq-19-salad-walnuts": [BBQ_REFS / "салат с орехами.jfif"],
    "bbq-22-beans-walnut": [BBQ_REFS / "пхали.jfif"],
    "bbq-11-khachapuri": [
        BBQ_REFS / "хачапури.jfif",
        BBQ_REFS / "хачапури пр аджарски.jfif",
        BBQ_REFS / "хачапури с сыром и картошкой.jfif",
    ],
    "bbq-24-cheese-plate": [BBQ_REFS / "салпт с копченым сулугуни.jpg"],
}


def angle_for(stem: str) -> str:
    return "top" if stem in TOPDOWN else "45"


def bg_path_for(stem: str) -> Path:
    return BG_TOP if angle_for(stem) == "top" else BG_45


def target_diameter_px(vessel: str) -> int:
    return int(round(SIZE * VESSEL_FRAC[vessel]))


def find_src(stem: str) -> Path | None:
    names = [stem, stem.replace("-", "_")]
    for d in (ASSETS, USER_ASSETS, MASTER_DIR):
        for n in names:
            for ext in (".png", ".jpg", ".jpeg", ".webp"):
                p = d / f"{n}{ext}"
                if p.exists():
                    return p
    return None


def find_food_ref(stem: str) -> Path | None:
    for p in FOOD_REFS.get(stem, []):
        if p.exists():
            return p
    # fallback: existing generated / menu photos
    menu = REPO / "scripts" / "menu_photos" / "bbq_garden"
    unders = stem.replace("-", "_")
    for d in (menu, ASSETS, USER_ASSETS):
        for ext in (".jpg", ".png", ".jpeg", ".webp"):
            p = d / f"{unders}{ext}"
            if p.exists():
                return p
    return None
