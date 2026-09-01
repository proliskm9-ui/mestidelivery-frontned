# -*- coding: utf-8 -*-
"""Compress menu photos + prepare upload maps for Sunset / Luizastan / BURGERS."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
ASSET_DIRS = [
    Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets"),
    Path(r"c:\MestiDelivery\Frontend\Assets"),
]

# stem -> RU needle (unique enough within restaurant)
SUNSET_MAP = [
    ("sunset_01_bread", "Хлеб"),
    ("sunset_02_pickles", "Ассорти солений"),
    ("sunset_03_suluguni", "Сулугуни"),
    ("sunset_04_fries", "Картофель фри"),
    ("sunset_05_cheese_board", "Сырная тарелка"),
    ("sunset_06_cucumber_tomato", "по-домашнему"),
    ("sunset_07_cucumber_walnut", "с грецкими орехами"),
    ("sunset_08_caesar", "Цезарь"),
    ("sunset_09_greek", "Греческий"),
    ("sunset_10_green_salad", "Зелёный салат"),
    ("sunset_11_chicken_salad", "Салат с курицей"),
    ("sunset_12_eggplant_walnut", "ореховой начинкой"),
    ("sunset_13_eggplant_garlic", "с чесноком"),
    ("sunset_14_bean_corn", "фасоли и кукурузы"),
    ("sunset_15_quinoa", "киноа"),
    ("sunset_16_couscous", "кускуса"),
    ("sunset_17_kharcho", "харчо"),
    ("sunset_18_veg_soup", "Овощной суп"),
    ("sunset_19_veg_cream", "Овощной крем-суп"),
    ("sunset_20_mushroom_soup", "Грибной суп"),
    ("sunset_21_mushroom_cream", "Грибной крем-суп"),
    ("sunset_22_chikhirtma", "Чихиртма"),
    ("sunset_23_borscht", "Борщ"),
    ("sunset_24_pumpkin_cream", "Тыквенный"),
    ("sunset_25_tashmijabi", "Ташмиджаби"),
    ("sunset_26_chvishtari", "Чвиштари (кукурузная"),
    ("sunset_27_chvishtari_millet", "просом"),
    ("sunset_28_kubdari", "Кубдари"),
    ("sunset_29_millet_khachapuri", "Хачапури с просом"),
    ("sunset_30_royal_khachapuri", "королевский"),
    ("sunset_31_fried_chicken", "Жареная курица"),
    ("sunset_32_chicken_adjika", "аджикой"),
    ("sunset_33_chkmeruli", "чкмерули"),
    ("sunset_34_stewed_beef", "Тушёная говядина"),
    ("sunset_35_stewed_tashmijabi", "с ташмиджаби"),
    ("sunset_36_khashlama", "Хашлама"),
    ("sunset_37_pork_mtsvadi", "Шашлык из свинины"),
    ("sunset_38_pork_ribs", "рёбра"),
    ("sunset_39_trout", "Форель"),
    ("sunset_40_stewed_mushrooms", "Тушёные грибы"),
    ("sunset_41_chicken_liver_ketsi", "печень"),
    ("sunset_42_chicken_bbq_rice", "с рисом"),
    ("sunset_43_ajapsandali", "Аджапсандали"),
    ("sunset_44_lobio_pot", "Лобио в горшочке"),
    ("sunset_45_lobio_walnut", "с грецкими орехами"),
    ("sunset_46_ojakhuri", "Оджахури"),
    ("sunset_47_carbonara", "Карбонара"),
    ("sunset_48_bolognese", "Болоньезе"),
    ("sunset_49_imeretian_khachapuri", "имеретински"),
    ("sunset_50_megrelian_khachapuri", "мегрельски"),
    ("sunset_51_mchadi", "Мчади"),
    ("sunset_52_lobiani", "Лобиани"),
    ("sunset_53_khinkali", "Хинкали"),
    ("sunset_54_cheese_khinkali", "Хинкали с сыром"),
    ("sunset_55_pepperoni", "Пепперони"),
    ("sunset_56_mushroom_pizza", "грибами, сыром"),
    ("sunset_57_margherita", "Маргарита"),
    ("sunset_58_homestyle_potato", "Картофель по-домашнему"),
    ("sunset_59_rice", "Рис"),
    ("sunset_60_spaghetti", "Спагетти"),
    ("sunset_61_buckwheat", "Гречка"),
    ("sunset_62_tkemali", "Ткемали"),
    ("sunset_63_tomato_sauce", "Томатный"),
    ("sunset_64_ketchup", "Кетчуп"),
    ("sunset_65_sour_cream", "Сметана"),
    ("sunset_66_bazhe", "баже"),
    ("sunset_67_cola", "Coca-Cola"),
    ("sunset_68_borjomi", "Боржоми"),
    ("sunset_69_water", "Вода 0.5"),
    ("sunset_70_natakhtari", "Natakhtari"),
    ("sunset_71_zedazeni", "Zedazeni"),
    ("sunset_72_juice", "сок"),
    ("sunset_73_cappuccino", "Капучино"),
    ("sunset_74_espresso", "Эспрессо"),
    ("sunset_75_americano", "Американо"),
    ("sunset_76_latte", "Латте"),
    ("sunset_77_instant_coffee", "Растворимый"),
    ("sunset_78_tea", "Чай"),
]

# Fix ambiguous sunset matches - order matters; more specific first
# Reorder critical ones: lobio walnut before lobio pot, cheese khinkali before khinkali, etc.
SUNSET_MAP = [
    ("sunset_01_bread", "Хлеб"),
    ("sunset_02_pickles", "Ассорти солений"),
    ("sunset_03_suluguni", "Сулугуни"),
    ("sunset_04_fries", "Картофель фри"),
    ("sunset_05_cheese_board", "Сырная тарелка"),
    ("sunset_07_cucumber_walnut", "огурцов и помидоров с грецкими"),
    ("sunset_06_cucumber_tomato", "огурцов и помидоров по-домашнему"),
    ("sunset_08_caesar", "Цезарь"),
    ("sunset_09_greek", "Греческий"),
    ("sunset_10_green_salad", "Зелёный салат"),
    ("sunset_11_chicken_salad", "Салат с курицей"),
    ("sunset_12_eggplant_walnut", "ореховой начинкой"),
    ("sunset_13_eggplant_garlic", "Баклажаны с чесноком"),
    ("sunset_14_bean_corn", "фасоли и кукурузы"),
    ("sunset_15_quinoa", "киноа"),
    ("sunset_16_couscous", "кускуса"),
    ("sunset_17_kharcho", "харчо"),
    ("sunset_19_veg_cream", "Овощной крем-суп"),
    ("sunset_18_veg_soup", "Овощной суп"),
    ("sunset_21_mushroom_cream", "Грибной крем-суп"),
    ("sunset_20_mushroom_soup", "Грибной суп"),
    ("sunset_22_chikhirtma", "Чихиртма"),
    ("sunset_23_borscht", "Борщ"),
    ("sunset_24_pumpkin_cream", "Тыквенный"),
    ("sunset_25_tashmijabi", "Ташмиджаби"),
    ("sunset_27_chvishtari_millet", "Чвиштари с просом"),
    ("sunset_26_chvishtari", "Чвиштари (кукурузная"),
    ("sunset_28_kubdari", "Кубдари"),
    ("sunset_30_royal_khachapuri", "королевский"),
    ("sunset_29_millet_khachapuri", "Хачапури с просом"),
    ("sunset_32_chicken_adjika", "аджикой"),
    ("sunset_31_fried_chicken", "Жареная курица"),
    ("sunset_33_chkmeruli", "чкмерули"),
    ("sunset_35_stewed_tashmijabi", "с ташмиджаби"),
    ("sunset_34_stewed_beef", "Тушёная говядина"),
    ("sunset_36_khashlama", "Хашлама"),
    ("sunset_37_pork_mtsvadi", "Шашлык из свинины"),
    ("sunset_38_pork_ribs", "рёбра"),
    ("sunset_39_trout", "Форель"),
    ("sunset_40_stewed_mushrooms", "Тушёные грибы"),
    ("sunset_41_chicken_liver_ketsi", "печень"),
    ("sunset_42_chicken_bbq_rice", "Шашлык из курицы с рисом"),
    ("sunset_43_ajapsandali", "Аджапсандали"),
    ("sunset_45_lobio_walnut", "Лобио в горшочке с грецкими"),
    ("sunset_44_lobio_pot", "Лобио в горшочке"),
    ("sunset_46_ojakhuri", "Оджахури"),
    ("sunset_47_carbonara", "Карбонара"),
    ("sunset_48_bolognese", "Болоньезе"),
    ("sunset_49_imeretian_khachapuri", "имеретински"),
    ("sunset_50_megrelian_khachapuri", "мегрельски"),
    ("sunset_51_mchadi", "Мчади"),
    ("sunset_52_lobiani", "Лобиани"),
    ("sunset_54_cheese_khinkali", "Хинкали с сыром"),
    ("sunset_53_khinkali", "Хинкали"),
    ("sunset_55_pepperoni", "Пепперони"),
    ("sunset_56_mushroom_pizza", "грибами, сыром"),
    ("sunset_57_margherita", "Маргарита"),
    ("sunset_58_homestyle_potato", "Картофель по-домашнему"),
    ("sunset_59_rice", "Рис"),
    ("sunset_60_spaghetti", "Спагетти"),
    ("sunset_61_buckwheat", "Гречка"),
    ("sunset_62_tkemali", "Ткемали"),
    ("sunset_63_tomato_sauce", "Томатный"),
    ("sunset_64_ketchup", "Кетчуп"),
    ("sunset_65_sour_cream", "Сметана"),
    ("sunset_66_bazhe", "баже"),
    ("sunset_67_cola", "Coca-Cola"),
    ("sunset_68_borjomi", "Боржоми"),
    ("sunset_70_natakhtari", "Natakhtari"),
    ("sunset_71_zedazeni", "Zedazeni"),
    ("sunset_69_water", "Вода 0.5"),
    ("sunset_72_juice", "сок"),
    ("sunset_73_cappuccino", "Капучино"),
    ("sunset_74_espresso", "Эспрессо"),
    ("sunset_75_americano", "Американо"),
    ("sunset_76_latte", "Латте"),
    ("sunset_77_instant_coffee", "Растворимый"),
    ("sunset_78_tea", "Чай"),
]

LUIZA_MAP = [
    ("luiza_02_cucumber_walnut", "Огурцы и помидоры с орехами"),
    ("luiza_01_cucumber_tomato", "Огурцы и помидоры"),
    ("luiza_03_chicken_salad", "Салат с курицей"),
    ("luiza_04_caesar", "Цезарь"),
    ("luiza_05_eggplant_walnut", "Баклажаны с орехами"),
    ("luiza_06_pkhali", "Пхали"),
    ("luiza_07_kharcho", "харчо"),
    ("luiza_08_khashlama", "Хашлама"),
    ("luiza_09_chikhirtma", "Чихиртма"),
    ("luiza_10_mushroom_cream", "Грибной крем"),
    ("luiza_11_veg_soup", "Овощной суп"),
    ("luiza_12_ostri", "Остри"),
    ("luiza_13_chicken_bazhe", "баже"),
    ("luiza_15_mushroom_khinkali", "Хинкали с грибами"),
    ("luiza_14_khinkali", "Хинкали"),
    ("luiza_16_kebab", "Кебаб"),
    ("luiza_17_pork_mtsvadi", "свинины"),
    ("luiza_18_chicken_mtsvadi", "курицы"),
    ("luiza_20_ojakhuri_chicken", "Оджахури с курицей"),
    ("luiza_19_ojakhuri", "Оджахури"),
    ("luiza_21_chkmeruli", "Чкмерули"),
    ("luiza_22_chakhokhbili", "Чахохбили"),
    ("luiza_23_mushrooms_ketsi", "Грибы с сыром"),
    ("luiza_24_ajapsandali", "Аджапсандали"),
    ("luiza_25_lobio", "Лобио"),
    ("luiza_26_imeretian_khachapuri", "имеретински"),
    ("luiza_27_megrelian_khachapuri", "мегрельски"),
    ("luiza_28_adjarian_khachapuri", "аджарски"),
    ("luiza_29_mchadi", "Мчади"),
    ("luiza_30_lobiani", "Лобиани"),
    ("luiza_31_bread", "Хлеб"),
    ("luiza_32_margherita", "Маргарита"),
    ("luiza_33_veg_pizza", "Овощная пицца"),
    ("luiza_34_kubdari", "Кубдари"),
    ("luiza_35_potato_khachapuri", "с картофелем"),
    ("luiza_36_millet_khachapuri", "с просом"),
    ("luiza_38_chvishtari_millet", "Чвиштари с просом"),
    ("luiza_37_chvishtari", "Чвиштари"),
    ("luiza_39_tashmijabi", "Ташмиджаби"),
    ("luiza_40_rice", "Рис"),
    ("luiza_41_fries", "Картофель фри"),
    ("luiza_42_pasta", "Макароны"),
    ("luiza_43_buckwheat", "Гречка"),
    ("luiza_44_suluguni", "Сулугуни"),
    ("luiza_45_tkemali", "Ткемали"),
    ("luiza_46_mayo", "Майонез"),
    ("luiza_47_satsebeli", "Сацебели"),
    ("luiza_48_sour_cream", "Сметана"),
    ("luiza_49_ketchup", "Кетчуп"),
    ("luiza_50_eclair", "Эклер"),
    ("luiza_51_apple_pie", "Яблочный"),
    ("luiza_52_blini", "Блины"),
    ("luiza_53_pancakes", "Оладьи"),
    ("luiza_54_tea", "Чай"),
    ("luiza_55_americano", "Американо"),
    ("luiza_56_espresso", "Эспрессо"),
    ("luiza_57_turkish_coffee", "турецки"),
    ("luiza_58_latte", "Латте"),
    ("luiza_59_cappuccino", "Капучино"),
    ("luiza_60_lemonade", "Лимонад"),
    ("luiza_61_kompot", "Компот"),
    ("luiza_62_cola", "Кока-Кола"),
    ("luiza_63_mineral", "Минеральная"),
    ("luiza_64_still_water", "без газа"),
]

BURGERS_MAP = [
    ("burgers_01_cheeseburger", "Чизбургер"),
    ("burgers_02_hamburger", "Гамбургер"),
    ("burgers_03_chickenburger", "Чикенбургер"),
    ("burgers_04_vegburger", "Вегетарианский"),
    ("burgers_05_fries", "Картофель фри"),
    ("burgers_06_garlic_sauce", "Чесночный"),
    ("burgers_07_ketchup", "Кетчуп"),
    ("burgers_08_cheese_sauce", "Сырный соус"),
    ("burgers_09_bbq_sauce", "BBQ"),
    ("burgers_10_chili_sauce", "чили"),
    ("burgers_11_honey_mustard", "Медово"),
    ("burgers_12_jalapenos", "Халапеньо"),
    ("burgers_13_beer", "Пиво"),
    ("burgers_14_naal_beer", "Безалкогольное"),
    ("burgers_15_cola", "Coca-Cola"),
    ("burgers_16_cola_zero", "Zero"),
    ("burgers_17_water", "Вода"),
    ("burgers_18_borjomi", "Боржоми"),
    ("burgers_19_borjomi_lemonade", "Лимонад Боржоми"),
    ("burgers_20_cold_tea", "Холодный чай"),
]


def find_src(stem: str) -> Path | None:
    for d in ASSET_DIRS:
        for ext in (".png", ".webp", ".jpg", ".jpeg"):
            p = d / f"{stem}{ext}"
            if p.exists():
                return p
    return None


def compress(stem: str, out_dir: Path) -> Path | None:
    src = find_src(stem)
    if not src:
        return None
    out_dir.mkdir(parents=True, exist_ok=True)
    dest = out_dir / f"{stem}.jpg"
    im = Image.open(src).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    if side > 900:
        im = im.resize((900, 900), Image.Resampling.LANCZOS)
    im.save(dest, "JPEG", quality=80, optimize=True)
    return dest


def compress_restaurant(key: str, photo_map: list[tuple[str, str]]) -> dict:
    out_dir = ROOT / "menu_photos" / key
    ok, missing = [], []
    for stem, needle in photo_map:
        path = compress(stem, out_dir)
        if path:
            ok.append(stem)
        else:
            missing.append(stem)
    return {"ok": len(ok), "missing": missing, "dir": str(out_dir)}


def main() -> None:
    results = {
        "sunset": compress_restaurant("sunset", SUNSET_MAP),
        "luizastan": compress_restaurant("luizastan", LUIZA_MAP),
        "burgers": compress_restaurant("burgers", BURGERS_MAP),
    }
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
