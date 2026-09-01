# -*- coding: utf-8 -*-
"""Fix BBQ Garden RU/EN names+descs (keep KA), reupload fixed photos."""
from __future__ import annotations

import json
import sys
import uuid
import urllib.request
from pathlib import Path

import paramiko
from PIL import Image

BASE = "https://mestidelivery.com/api"
HOST = "62.60.148.232"
ASSETS = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
OUT = Path(__file__).resolve().parent / "menu_photos" / "bbq_garden"

# Match by Georgian name (unchanged). Update only ru/en + descriptions.
NAME_FIXES = {
    "ღორის მწვადი": {
        "ru": "Шашлык из свинины",
        "en": "Pork shashlik",
        "desc": "Свиной шашлык, жареный на мангале.",
        "desc_en": "Pork shashlik grilled over charcoal.",
    },
    "ქათმის მწვადი": {
        "ru": "Шашлык из курицы",
        "en": "Chicken shashlik",
        "desc": "Куриный шашлык, жареный на мангале.",
        "desc_en": "Chicken shashlik grilled over charcoal.",
    },
    "ქაბაბი ლავაშში (საქონლის)": {
        "ru": "Люля-кебаб из говядины с лавашом",
        "en": "Beef lula kebab with lavash",
        "desc": "Говяжий люля-кебаб на мангале, подаётся с лавашом.",
        "desc_en": "Grilled beef lula kebab served with lavash.",
    },
    "ხაჭაპური გრილზე": {
        "ru": "Хачапури на вертеле",
        "en": "Khachapuri on a spit",
        "desc": "Хачапури на шампуре: сулугуни в слоёном тесте, жареное на углях.",
        "desc_en": "Sulguni cheese wrapped in pastry and grilled on a skewer over coals.",
    },
    "გრილზე შემწვარი კალმახი": {
        "ru": "Форель на гриле",
        "en": "Grilled whole trout",
        "desc": "Целая форель, запечённая на гриле.",
        "desc_en": "Whole trout grilled over charcoal.",
    },
    "გრილზე შემწვარი ბოსტნეული": {
        "ru": "Овощи на гриле",
        "en": "Grilled vegetables",
        "desc": "Ассорти овощей, обжаренных на гриле.",
        "desc_en": "Assorted vegetables grilled over charcoal.",
    },
    "გრილზე შემწვარი ქათმის ფრთები": {
        "ru": "Куриные крылышки на гриле",
        "en": "Grilled chicken wings",
        "desc": "Куриные крылышки с мангала.",
        "desc_en": "Chicken wings from the charcoal grill.",
    },
    "კუპატი გრილზე": {
        "ru": "Купаты на гриле",
        "en": "Grilled kupati",
        "desc": "Домашние купаты, жареные на гриле.",
        "desc_en": "Homemade kupati sausages grilled over charcoal.",
    },
    "გრილზე შემწვარი სოსისი (2 ცალი)": {
        "ru": "Сосиски на гриле (2 шт.)",
        "en": "Grilled sausages (2 pcs)",
        "desc": "Две сосиски с мангала.",
        "desc_en": "Two sausages from the charcoal grill.",
    },
    "კარტოფილი ფრი": {
        "ru": "Картофель фри",
        "en": "French fries",
        "desc": "Хрустящий картофель фри.",
        "desc_en": "Crispy French fries.",
    },
    "შვრიის ფაფა ხილით": {
        "ru": "Овсяная каша с фруктами",
        "en": "Oatmeal with fruit",
        "desc": "Тёплая овсяная каша со свежими фруктами.",
        "desc_en": "Warm oatmeal topped with fresh fruit.",
    },
    "ხაჭო თაფლით და ჩირით": {
        "ru": "Творог с мёдом и сухофруктами",
        "en": "Cottage cheese with honey and dried fruit",
        "desc": "Нежный творог с мёдом и сухофруктами.",
        "desc_en": "Soft cottage cheese with honey and dried fruit.",
    },
    "ყველის ომლეტი": {
        "ru": "Омлет с сыром",
        "en": "Cheese omelette",
        "desc": "Пышный омлет с сыром.",
        "desc_en": "Fluffy omelette with cheese.",
    },
    "შემწვარი სენდვიჩი ყველით": {
        "ru": "Сэндвич с сыром (тост)",
        "en": "Toasted cheese sandwich",
        "desc": "Горячий тост-сэндвич с сыром.",
        "desc_en": "Hot toasted sandwich with cheese.",
    },
    "შემწვარი სენდვიჩი ლორით და ყველით": {
        "ru": "Сэндвич с ветчиной и сыром (тост)",
        "en": "Toasted ham and cheese sandwich",
        "desc": "Горячий тост-сэндвич с ветчиной и сыром.",
        "desc_en": "Hot toasted sandwich with ham and cheese.",
    },
    "ბორში": {
        "ru": "Борщ",
        "en": "Borscht",
        "desc": "Овощной борщ.",
        "desc_en": "Vegetable borscht.",
    },
    "მაწვნის ცივი სუპი კიტრით": {
        "ru": "Холодный суп из мацони с огурцами",
        "en": "Cold matsoni soup with cucumber",
        "desc": "Освежающий холодный суп на мацони с огурцами.",
        "desc_en": "Refreshing cold matsoni soup with cucumber.",
    },
    "პომიდორ-კიტრის სალათი": {
        "ru": "Салат из помидоров и огурцов",
        "en": "Tomato and cucumber salad",
        "desc": "Свежий салат из помидоров и огурцов.",
        "desc_en": "Fresh tomato and cucumber salad.",
    },
    "პომიდორ-კიტრის სალათი ნიგვზით": {
        "ru": "Салат из помидоров и огурцов с орехами",
        "en": "Tomato and cucumber salad with walnuts",
        "desc": "Салат из помидоров и огурцов с грецкими орехами.",
        "desc_en": "Tomato and cucumber salad with walnuts.",
    },
    "ჭარხლის სალათი": {
        "ru": "Салат из свёклы",
        "en": "Beetroot salad",
        "desc": "Салат из свёклы.",
        "desc_en": "Beetroot salad.",
    },
    "სტაფილოს სალათი": {
        "ru": "Морковный салат",
        "en": "Carrot salad",
        "desc": "Свежий морковный салат.",
        "desc_en": "Fresh carrot salad.",
    },
    "ლობიო ნიგვზით": {
        "ru": "Фасоль с орехами",
        "en": "Beans with walnuts",
        "desc": "Фасоль с грецкими орехами.",
        "desc_en": "Beans with walnuts.",
    },
    "მწნილი ბოსტნეული": {
        "ru": "Маринованные овощи",
        "en": "Pickled vegetables",
        "desc": "Ассорти маринованных овощей.",
        "desc_en": "Assorted pickled vegetables.",
    },
    "ქართული ყველის ასორტი": {
        "ru": "Ассорти грузинских сыров",
        "en": "Georgian cheese platter",
        "desc": "Тарелка грузинских сыров.",
        "desc_en": "A platter of Georgian cheeses.",
    },
    "პური": {
        "ru": "Хлеб",
        "en": "Bread",
        "desc": "Свежий хлеб.",
        "desc_en": "Fresh bread.",
    },
    "ტყემალი": {
        "ru": "Ткемали",
        "en": "Tkemali",
        "desc": "Соус ткемали.",
        "desc_en": "Tkemali plum sauce.",
    },
    "კეტჩუპი": {
        "ru": "Кетчуп",
        "en": "Ketchup",
        "desc": "Кетчуп.",
        "desc_en": "Ketchup.",
    },
    "მაიონეზი": {
        "ru": "Майонез",
        "en": "Mayonnaise",
        "desc": "Майонез.",
        "desc_en": "Mayonnaise.",
    },
    "შოკოლადის პუდინგი თხილით": {
        "ru": "Шоколадный пудинг с фундуком",
        "en": "Chocolate pudding with hazelnuts",
        "desc": "Шоколадный пудинг с фундуком.",
        "desc_en": "Chocolate pudding with hazelnuts.",
    },
    "დღის ნამცხვარი": {
        "ru": "Торт дня",
        "en": "Cake of the day",
        "desc": "Домашний торт дня.",
        "desc_en": "Homemade cake of the day.",
    },
    "ნაყინი (ვანილი/შოკოლადი)": {
        "ru": "Мороженое (ваниль / шоколад)",
        "en": "Ice cream (vanilla / chocolate)",
        "desc": "Мороженое на выбор: ваниль или шоколад.",
        "desc_en": "Ice cream — vanilla or chocolate.",
    },
    "კრემი ხილით": {
        "ru": "Крем с фруктами",
        "en": "Cream with fruit",
        "desc": "Нежный крем со свежими фруктами.",
        "desc_en": "Delicate cream with fresh fruit.",
    },
    "ჩურჩხელა": {
        "ru": "Чурчхела",
        "en": "Churchkhela",
        "desc": "Классическая грузинская чурчхела.",
        "desc_en": "Classic Georgian churchkhela.",
    },
    "არაქისი": {
        "ru": "Арахис",
        "en": "Roasted peanuts",
        "desc": "Жареный арахис.",
        "desc_en": "Roasted peanuts.",
    },
    "ესპრესო": {
        "ru": "Эспрессо",
        "en": "Espresso",
        "desc": "Эспрессо.",
        "desc_en": "Espresso.",
    },
    "ამერიკანო": {
        "ru": "Американо",
        "en": "Americano",
        "desc": "Американо.",
        "desc_en": "Americano.",
    },
    "კაპუჩინო": {
        "ru": "Капучино",
        "en": "Cappuccino",
        "desc": "Капучино.",
        "desc_en": "Cappuccino.",
    },
    "ქართული ჩაი (შავი/მწვანე)": {
        "ru": "Грузинский чай (чёрный / зелёный)",
        "en": "Georgian tea (black / green)",
        "desc": "Грузинский чай — чёрный или зелёный.",
        "desc_en": "Georgian tea — black or green.",
    },
    "ქართული ლიმონათი": {
        "ru": "Грузинский лимонад",
        "en": "Georgian lemonade",
        "desc": "Грузинский лимонад.",
        "desc_en": "Georgian lemonade.",
    },
    "კოკა-კოლა": {
        "ru": "Coca-Cola",
        "en": "Coca-Cola",
        "desc": "Coca-Cola.",
        "desc_en": "Coca-Cola.",
    },
    "მინერალური წყალი": {
        "ru": "Минеральная вода",
        "en": "Still mineral water",
        "desc": "Минеральная вода без газа.",
        "desc_en": "Still mineral water.",
    },
    "გაზიანი მინერალური წყალი": {
        "ru": "Газированная минеральная вода",
        "en": "Sparkling mineral water",
        "desc": "Газированная минеральная вода.",
        "desc_en": "Sparkling mineral water.",
    },
    "წვენი": {
        "ru": "Сок",
        "en": "Juice",
        "desc": "Сок.",
        "desc_en": "Juice.",
    },
    "კომპოტი": {
        "ru": "Компот",
        "en": "Homemade kompot",
        "desc": "Домашний компот.",
        "desc_en": "Homemade kompot.",
    },
}

PHOTO_UPDATES = [
    ("ქაბაბი ლავაშში (საქონლის)", "bbq_10_kebab_lavash.webp"),
    ("ხაჭაპური გრილზე", "bbq_11_khachapuri.webp"),
    ("გრილზე შემწვარი კალმახი", "bbq_12_trout.webp"),
]


def login(user: str, password: str) -> str:
    req = urllib.request.Request(
        f"{BASE}/auth/login",
        data=json.dumps({"username": user, "password": password}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())["token"]


def api(method: str, path: str, token: str, body: dict | None = None):
    data = None
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def parse_name(p: dict) -> dict:
    name = p.get("name") or ""
    if isinstance(name, str) and name.strip().startswith("{"):
        try:
            return json.loads(name)
        except Exception:
            return {"ru": name}
    return {"ru": str(name)}


def parse_desc(p: dict) -> dict:
    desc = p.get("description") or ""
    if isinstance(desc, str) and desc.strip().startswith("{"):
        try:
            return json.loads(desc)
        except Exception:
            return {"ru": desc}
    return {"ru": str(desc)}


def compress(stem_webp: str) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    src = ASSETS / stem_webp
    im = Image.open(src).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    if side > 900:
        im = im.resize((900, 900), Image.Resampling.LANCZOS)
    dest = OUT / stem_webp.replace(".webp", ".jpg")
    im.save(dest, "JPEG", quality=80, optimize=True)
    return dest


def main() -> None:
    user, password, ssh_pw = sys.argv[1], sys.argv[2], sys.argv[3]
    token = login(user, password)
    rests = api("GET", "/restaurants/", token)
    bbq = next(r for r in rests if "bbq" in str(r.get("name", "")).lower())
    rid = bbq["id"]
    products = api("GET", f"/products/?restaurant_id={rid}&limit=1000", token)
    by_ka = {}
    for p in products:
        nj = parse_name(p)
        ka = nj.get("ka") or ""
        if ka:
            by_ka[ka] = p

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)
    sftp = client.open_sftp()
    remote_tmp = "/tmp/bbq_fix_photos"
    try:
        sftp.mkdir(remote_tmp)
    except IOError:
        pass

    photo_urls: dict[str, str] = {}
    for ka, webp in PHOTO_UPDATES:
        local = compress(webp)
        new_name = f"{uuid.uuid4().hex}.jpg"
        remote = f"{remote_tmp}/{new_name}"
        sftp.put(str(local), remote)
        _, o, e = client.exec_command(
            f"cp {remote} /opt/mestigo/uploads/{new_name} && chmod 644 /opt/mestigo/uploads/{new_name}",
            timeout=60,
        )
        _ = o.read(), e.read()
        photo_urls[ka] = f"/uploads/{new_name}"
        print(f"photo {ka} -> {photo_urls[ka]}")

    sftp.close()
    client.close()

    ok = fail = 0
    for ka, fix in NAME_FIXES.items():
        p = by_ka.get(ka)
        if not p:
            print("SKIP missing", ka)
            fail += 1
            continue
        nj = parse_name(p)
        dj = parse_desc(p)
        # keep ka / desc_ka untouched
        new_name = {
            "ka": nj.get("ka") or ka,
            "ru": fix["ru"],
            "en": fix["en"],
        }
        new_desc = {
            "ka": dj.get("ka") or "",
            "ru": fix["desc"],
            "en": fix["desc_en"],
        }
        img = photo_urls.get(ka) or p.get("img") or "/Assets/default-food.png"
        body = {
            "restaurant_id": p.get("restaurant_id") or rid,
            "name": json.dumps(new_name, ensure_ascii=False),
            "description": json.dumps(new_desc, ensure_ascii=False),
            "price": float(p.get("price") or 0),
            "img": img,
            "category": p.get("category") or "",
            "weight": p.get("weight") or "",
            "calories": str(p.get("calories") or "0"),
            "proteins": str(p.get("proteins") or "0"),
            "fats": str(p.get("fats") or "0"),
            "carbs": str(p.get("carbs") or "0"),
            "ingredients": p.get("ingredients") or "",
        }
        try:
            api("PUT", f"/products/{p['id']}", token, body)
            ok += 1
            print(f"OK {fix['ru']}")
        except Exception as ex:
            fail += 1
            print(f"FAIL {fix['ru']}: {ex}")

    print(json.dumps({"ok": ok, "fail": fail}))


if __name__ == "__main__":
    main()
