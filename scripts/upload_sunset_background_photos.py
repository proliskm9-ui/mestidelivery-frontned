# -*- coding: utf-8 -*-
"""Upload Sunset background-template photos and attach them to products."""
from __future__ import annotations

import getpass
import json
import mimetypes
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from PIL import Image

BASE = "https://mestidelivery.com/api"
RESTAURANT_ID = "rest-1785108442716453469"
ASSETS = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
REPO_ASSETS = Path(r"C:\MestiDelivery\Frontend\Assets")
OUTPUT = Path(__file__).resolve().parent / "menu_photos" / "sunset_background"

# stem (without extension) -> RU name needle (unique within Sunset)
PHOTO_MAP = [
    ("sunset-01-bread", "Хлеб"),
    ("sunset-02-pickles", "Ассорти солений"),
    ("sunset-03-suluguni", "Сулугуни"),
    ("sunset-04-fries", "Картофель фри"),
    ("sunset-05-cheese-board", "Сырная тарелка"),
    ("sunset-07-cucumber-walnut", "огурцов и помидоров с грецкими"),
    ("sunset-06-cucumber-tomato", "огурцов и помидоров по-домашнему"),
    ("sunset-08-caesar", "Цезарь"),
    ("sunset-09-greek", "Греческий"),
    ("sunset-10-green-salad", "Зелёный салат"),
    ("sunset-11-chicken-salad", "Салат с курицей"),
    ("sunset-12-eggplant-walnut", "ореховой начинкой"),
    ("sunset-13-eggplant-garlic", "Баклажаны с чесноком"),
    ("sunset-14-bean-corn", "фасоли и кукурузы"),
    ("sunset-15-quinoa", "киноа"),
    ("sunset-16-couscous", "кускуса"),
    ("sunset-17-kharcho", "харчо"),
    ("sunset-19-veg-cream", "Овощной крем-суп"),
    ("sunset-18-veg-soup", "Овощной суп"),
    ("sunset-21-mushroom-cream", "Грибной крем-суп"),
    ("sunset-20-mushroom-soup", "Грибной суп"),
    ("sunset-22-chikhirtma", "Чихиртма"),
    ("sunset-23-borscht", "Борщ"),
    ("sunset-24-pumpkin-cream", "Тыквенный"),
    ("sunset-25-tashmijabi", "Ташмиджаби (картофель"),
    ("sunset-27-chvishtari-millet", "Чвиштари с просом"),
    ("sunset-26-chvishtari", "Чвиштари (кукурузная"),
    ("sunset-28-kubdari", "Кубдари"),
    ("sunset-30-royal-khachapuri", "королевский"),
    ("sunset-29-millet-khachapuri", "Хачапури с просом"),
    ("sunset-31-fried-chicken", "Цыплёнок табака"),
    ("sunset-33-chkmeruli", "чкмерули"),
    ("sunset-35-stewed-tashmijabi", "Тушёное мясо с ташмиджаби"),
    ("sunset-34-stewed-beef", "Тушёная говядина"),
    ("sunset-36-khashlama", "Хашлама"),
    ("sunset-37-pork-mtsvadi", "Шашлык из свинины"),
    ("sunset-38-pork-ribs", "рёбра"),
    ("sunset-39-trout", "Форель"),
    ("sunset-40-stewed-mushrooms", "Тушёные грибы"),
    ("sunset-41-chicken-liver-ketsi", "печень"),
    ("sunset-42-chicken-bbq-rice", "Шашлык из курицы с рисом"),
    ("sunset-43-ajapsandali", "Аджапсандали"),
    ("sunset-45-lobio-walnut", "Лобио в горшочке с грецкими"),
    ("sunset-44-lobio-pot", "Лобио в горшочке"),
    ("sunset-46-ojakhuri", "Оджахури"),
    ("sunset-47-carbonara", "Карбонара"),
    ("sunset-48-bolognese", "Болоньезе"),
    ("sunset-49-imeretian-khachapuri", "имеретински"),
    ("sunset-50-megrelian-khachapuri", "мегрельски"),
    ("sunset-51-mchadi", "Мчади"),
    ("sunset-52-lobiani", "Лобиани"),
    ("sunset-54-cheese-khinkali", "Хинкали с сыром"),
    ("sunset-53-khinkali", "Хинкали"),
    ("sunset-55-pepperoni", "Пепперони"),
    ("sunset-56-mushroom-pizza", "грибами, сыром"),
    ("sunset-57-margherita", "Маргарита"),
    ("sunset-58-homestyle-potato", "Картофель по-домашнему"),
    ("sunset-59-rice", "Рис"),
    ("sunset-60-spaghetti", "Спагетти"),
    ("sunset-61-buckwheat", "Гречка"),
    ("sunset-62-tkemali", "Ткемали"),
    ("sunset-63-tomato-sauce", "Томатный"),
    ("sunset-64-ketchup", "Кетчуп"),
    ("sunset-65-sour-cream", "Сметана"),
    ("sunset-66-bazhe", "баже"),
    ("sunset-67-cola", "Coca-Cola"),
    ("sunset-68-borjomi", "Боржоми"),
    ("sunset-70-natakhtari", "Natakhtari"),
    ("sunset-71-zedazeni", "Zedazeni"),
    ("sunset-69-water", "Вода 0.5"),
    ("sunset-73-cappuccino", "Капучино"),
    ("sunset-74-espresso", "Эспрессо"),
    ("sunset-75-americano", "Американо"),
    ("sunset-76-latte", "Латте"),
    ("sunset-77-instant-coffee", "Растворимый"),
    ("sunset-78-tea", "Чай"),
]

# Optional: only reupload these if set via argv --only
REUPLOAD_MAP = PHOTO_MAP


def request(method: str, path: str, token: str | None = None, body: dict | None = None):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code} {path}: {detail}") from error


def localized_ru(value: object) -> str:
    if isinstance(value, str) and value.strip().startswith("{"):
        try:
            return str(json.loads(value).get("ru") or "")
        except json.JSONDecodeError:
            pass
    return str(value or "")


def find_source(stem: str) -> Path:
    for base in (ASSETS, REPO_ASSETS):
        for extension in (".png", ".webp", ".jpg", ".jpeg"):
            candidate = base / f"{stem}{extension}"
            if candidate.exists():
                return candidate
        # also accept underscore naming in Assets
        alt = stem.replace("-", "_")
        for extension in (".png", ".webp", ".jpg", ".jpeg"):
            candidate = base / f"{alt}{extension}"
            if candidate.exists():
                return candidate
    raise FileNotFoundError(f"Generated asset not found: {stem}")


def compress(source: Path, stem: str) -> Path:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT / f"{stem}.jpg"
    image = Image.open(source).convert("RGB")
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    image = image.crop((left, top, left + side, top + side))
    if side > 900:
        image = image.resize((900, 900), Image.Resampling.LANCZOS)
    image.save(destination, "JPEG", quality=82, optimize=True)
    return destination


def upload(file_path: Path, token: str) -> str:
    boundary = f"----MestiDelivery{uuid.uuid4().hex}"
    mime_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    payload = b"".join(
        [
            f"--{boundary}\r\n".encode(),
            (
                f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
            ).encode(),
            f"Content-Type: {mime_type}\r\n\r\n".encode(),
            file_path.read_bytes(),
            f"\r\n--{boundary}--\r\n".encode(),
        ]
    )
    req = urllib.request.Request(
        f"{BASE}/upload/",
        data=payload,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as response:
        result = json.loads(response.read().decode("utf-8"))
    value = str(result.get("url") or result.get("file_path") or "")
    if not value:
        raise RuntimeError(f"Upload returned no path for {file_path.name}: {result}")
    parsed = urllib.parse.urlparse(value)
    return parsed.path if parsed.scheme and parsed.path else value


def product_payload(product: dict, image_path: str) -> dict:
    return {
        "restaurant_id": product.get("restaurant_id") or RESTAURANT_ID,
        "name": product.get("name") or "",
        "description": product.get("description") or "",
        "price": float(product.get("price") or 0),
        "img": image_path,
        "category": product.get("category") or "",
        "weight": product.get("weight") or "",
        "calories": str(product.get("calories") or "0"),
        "proteins": str(product.get("proteins") or "0"),
        "fats": str(product.get("fats") or "0"),
        "carbs": str(product.get("carbs") or "0"),
        "ingredients": product.get("ingredients") or "",
        "is_available": True,
    }


def match_product(products_by_ru: dict[str, dict], needle: str) -> dict:
    needle_l = needle.lower()
    # Prefer exact, then contains
    for name, product in products_by_ru.items():
        if name == needle:
            return product
    hits = [p for name, p in products_by_ru.items() if needle_l in name.lower()]
    if len(hits) == 1:
        return hits[0]
    if not hits:
        raise KeyError(needle)
    # Prefer shortest name among hits (more specific needles usually)
    return min(hits, key=lambda p: len(localized_ru(p.get("name"))))


def main() -> None:
    global REUPLOAD_MAP
    args = sys.argv[1:]
    only_stems: set[str] = set()
    if "--only" in args:
        idx = args.index("--only")
        only_stems = set(args[idx + 1].split(","))
        args = args[:idx] + args[idx + 2 :]
        REUPLOAD_MAP = [(s, n) for s, n in PHOTO_MAP if s in only_stems]

    username = args[0] if len(args) >= 1 else input("Admin username: ").strip()
    password = args[1] if len(args) >= 2 else getpass.getpass("Admin password: ")

    auth = request("POST", "/auth/login", body={"username": username, "password": password})
    token = auth["token"]
    products = request(
        "GET",
        f"/products/?restaurant_id={RESTAURANT_ID}&limit=1000",
        token=token,
    )
    products_by_ru = {localized_ru(product.get("name")): product for product in products}

    missing_products = []
    missing_assets = []
    resolved: list[tuple[str, str, dict]] = []
    for stem, needle in REUPLOAD_MAP:
        try:
            product = match_product(products_by_ru, needle)
        except KeyError:
            missing_products.append(needle)
            continue
        try:
            find_source(stem)
        except FileNotFoundError:
            missing_assets.append(stem)
            continue
        resolved.append((stem, needle, product))

    if missing_products or missing_assets:
        raise RuntimeError(
            json.dumps(
                {"missing_products": missing_products, "missing_assets": missing_assets},
                ensure_ascii=False,
                indent=2,
            )
        )

    completed = 0
    for stem, needle, product in resolved:
        local_file = compress(find_source(stem), stem)
        remote_path = upload(local_file, token)
        request(
            "PUT",
            f"/products/{product['id']}",
            token=token,
            body=product_payload(product, remote_path),
        )
        completed += 1
        ru = localized_ru(product.get("name"))
        print(f"{completed:02d}/{len(resolved)} {ru} -> {remote_path}", flush=True)

    print(
        json.dumps({"updated": completed, "restaurant_id": RESTAURANT_ID}, ensure_ascii=False),
        flush=True,
    )


if __name__ == "__main__":
    main()
