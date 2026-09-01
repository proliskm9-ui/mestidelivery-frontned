# -*- coding: utf-8 -*-
"""Upload the new Luizastan background-template photos and attach them to products."""
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
RESTAURANT_ID = "rest-1785095837937828031"
ASSETS = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
OUTPUT = Path(__file__).resolve().parent / "menu_photos" / "luizastan_background"

PHOTO_MAP = [
    ("luizastan-cucumber-tomato", "Огурцы и помидоры"),
    ("luizastan-cucumber-tomato-walnut", "Огурцы и помидоры с орехом"),
    ("luizastan-chicken-salad", "Салат с курицей"),
    ("luizastan-caesar-salad", "Цезарь"),
    ("luizastan-eggplant-walnuts", "Баклажаны с орехами"),
    ("luizastan-pkhali", "Пхали"),
    ("luizastan-07-kharcho", "Суп харчо"),
    ("luizastan-08-khashlama", "Хашлама"),
    ("luizastan-09-chikhirtma", "Чихиртма"),
    ("luizastan-10-mushroom-cream-soup", "Грибной крем-суп"),
    ("luizastan-11-vegetable-soup", "Овощной суп"),
    ("luizastan-12-ostri", "Остри"),
    ("luizastan-13-chicken-bazhe", "Курица в соусе баже"),
    ("luizastan-14-khinkali", "Хинкали"),
    ("luizastan-15-mushroom-khinkali", "Хинкали с грибами"),
    ("luizastan-16-kebab", "Кебаб"),
    ("luizastan-17-pork-mtsvadi", "Шашлык из свинины"),
    ("luizastan-18-chicken-mtsvadi", "Шашлык из курицы"),
    ("luizastan-19-ojakhuri", "Оджахури"),
    ("luizastan-20-chicken-ojakhuri", "Оджахури с курицей"),
    ("luizastan-21-chkmeruli", "Чкмерули"),
    ("luizastan-22-chakhokhbili", "Чахохбили"),
    ("luizastan-23-mushrooms-ketsi", "Грибы с сыром на кеци"),
    ("luizastan-24-ajapsandali", "Аджапсандал"),
    ("luizastan-25-lobio", "Лобио"),
    ("luizastan-26-imeretian-khachapuri", "Хачапури по-имеретински"),
    ("luizastan-27-megrelian-khachapuri", "Хачапури по-мегрельски"),
    ("luizastan-28-adjarian-khachapuri", "Хачапури по-аджарски"),
    ("luizastan-29-mchadi", "Мчади"),
    ("luizastan-30-lobiani", "Лобиани"),
    ("luizastan-31-bread", "Хлеб"),
    ("luizastan-32-margherita", "Пицца «Маргарита»"),
    ("luizastan-33-vegetable-pizza", "Овощная пицца"),
    ("luizastan-34-kubdari", "Кубдари"),
    ("luizastan-35-potato-khachapuri", "Хачапури с картофелем"),
    ("luizastan-36-millet-khachapuri", "Хачапури с просом"),
    ("luizastan-37-chvishtari", "Чвиштари"),
    ("luizastan-38-chvishtari-millet", "Чвиштари с просом"),
    ("luizastan-39-tashmijabi", "Ташмиджаби"),
    ("luizastan-40-rice", "Рис"),
    ("luizastan-41-fries", "Картофель фри"),
    ("luizastan-42-pasta", "Макароны"),
    ("luizastan-43-buckwheat", "Гречка"),
    ("luizastan-44-suluguni", "Сулугуни"),
    ("luizastan-45-tkemali", "Ткемали"),
    ("luizastan-46-mayonnaise", "Майонез"),
    ("luizastan-47-satsebeli", "Сацебели"),
    ("luizastan-48-sour-cream", "Сметана"),
    ("luizastan-49-ketchup", "Кетчуп"),
    ("luizastan-50-eclair", "Эклер"),
    ("luizastan-51-apple-pie", "Яблочный пирог"),
    ("luizastan-52-blini", "Блины"),
    ("luizastan-53-pancakes", "Оладьи"),
    ("luizastan-54-tea", "Чай"),
    ("luizastan-55-americano", "Американо"),
    ("luizastan-56-espresso", "Эспрессо"),
    ("luizastan-57-turkish-coffee", "Кофе по-турецки"),
    ("luizastan-58-latte", "Латте"),
    ("luizastan-59-cappuccino", "Капучино"),
    ("luizastan-60-lemonade", "Лимонад"),
    ("luizastan-62-cola", "Кока-Кола"),
    ("luizastan-63-mineral", "Минеральная вода"),
    ("luizastan-64-still-water", "Вода без газа"),
]

# Latest visual fixes.
REUPLOAD_MAP = [
    ("luizastan-15-mushroom-khinkali", "Хинкали с грибами"),
    ("luizastan-20-chicken-ojakhuri", "Оджахури с курицей"),
]


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
    for extension in (".png", ".webp", ".jpg", ".jpeg"):
        candidate = ASSETS / f"{stem}{extension}"
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


def main() -> None:
    if len(sys.argv) > 3:
        raise SystemExit(
            "Usage: python scripts/upload_luizastan_background_photos.py [admin_username] [admin_password]"
        )

    username = sys.argv[1] if len(sys.argv) >= 2 else input("Admin username: ").strip()
    if len(sys.argv) >= 3:
        password = sys.argv[2]
    else:
        password = getpass.getpass("Admin password: ")
    auth = request(
        "POST",
        "/auth/login",
        body={"username": username, "password": password},
    )
    token = auth["token"]
    products = request(
        "GET",
        f"/products/?restaurant_id={RESTAURANT_ID}&limit=1000",
        token=token,
    )
    products_by_ru = {localized_ru(product.get("name")): product for product in products}

    missing_products = [ru for _, ru in REUPLOAD_MAP if ru not in products_by_ru]
    missing_assets = [stem for stem, _ in REUPLOAD_MAP if not any((ASSETS / f"{stem}{ext}").exists() for ext in (".png", ".webp", ".jpg", ".jpeg"))]
    if missing_products or missing_assets:
        raise RuntimeError(
            json.dumps(
                {"missing_products": missing_products, "missing_assets": missing_assets},
                ensure_ascii=False,
                indent=2,
            )
        )

    completed = 0
    for stem, ru_name in REUPLOAD_MAP:
        local_file = compress(find_source(stem), stem)
        remote_path = upload(local_file, token)
        product = products_by_ru[ru_name]
        request(
            "PUT",
            f"/products/{product['id']}",
            token=token,
            body=product_payload(product, remote_path),
        )
        completed += 1
        print(f"{completed:02d}/{len(REUPLOAD_MAP)} {ru_name} -> {remote_path}", flush=True)

    print(json.dumps({"updated": completed, "restaurant_id": RESTAURANT_ID}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
