# -*- coding: utf-8 -*-
"""Add desc_en / desc_ka to luizastan_menu.json and PATCH products on prod."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

MENU_PATH = Path(__file__).with_name("luizastan_menu.json")
BASE = "https://mestidelivery.com/api"

# EN / KA descriptions keyed by Russian dish name
DESC_I18N: dict[str, dict[str, str]] = {
    "Огурцы и помидоры": {
        "en": "A light fresh salad of crisp cucumbers and ripe tomatoes — a classic of the Georgian table.",
        "ka": "მსუბუქი სალათი ხრაშუნა კიტრითა და მომწიფებული პომიდვრით — ქართული სუფრის კლასიკა.",
    },
    "Огурцы и помидоры с орехами": {
        "en": "Vegetable salad with a delicate walnut dressing — freshness with a classic Caucasian taste.",
        "ka": "ბოსტნეულის სალათი ნაზი ნიგვზის საწებელით — სიახლე და კავკასიური გემო.",
    },
    "Салат с курицей": {
        "en": "A hearty salad with chicken and fresh vegetables — a great lunch choice.",
        "ka": "გამაძღარი სალათი ქათმითა და ახალი ბოსტნეულით — შესანიშნავი არჩევანი ლანჩზე.",
    },
    "Цезарь": {
        "en": "Classic Caesar with chicken, crunchy croutons and house dressing.",
        "ka": "კლასიკური ცეზარი ქათმით, ხრაშუნა კრუტონებითა და საავტორო სოუსით.",
    },
    "Баклажаны с орехами": {
        "en": "Baked eggplant with rich walnut paste — one of Georgia’s most loved cold dishes.",
        "ka": "შემწვარი ბადრიჯანი სქელი ნიგვზის პასტით — ერთ-ერთი ყველაზე საყვარელი ცივი ქართული კერძი.",
    },
    "Пхали": {
        "en": "Traditional pkhali of greens or vegetables with walnuts — bright, spicy and unmistakably Georgian.",
        "ka": "ტრადიციული ფხალი მწვანილით ან ბოსტნეულით ნიგვზთან ერთად — ნათელი, სანელებლებიანი ქართული გემო.",
    },
    "Суп харчо": {
        "en": "Hearty kharcho with meat, rice and tkemali — a warming soup with signature sourness.",
        "ka": "გამაძღარი ხარჩო ხორცით, ბრინჯითა და ტყემალით — გამათბობელი სუპი დამახასიათებელი მჟავე ნოტით.",
    },
    "Хашлама": {
        "en": "Meat slow-cooked with vegetables in an aromatic broth — simple and very filling.",
        "ka": "ხორცი ბოსტნეულთან ერთად არომატულ ბულიონში — მარტივი და ძალიან გამაძღარი კერძი.",
    },
    "Чихиртма": {
        "en": "Delicate chicken soup thickened with egg and a hint of coriander — a Georgian classic.",
        "ka": "ნაზი ქათმის სუპი კვერცხით გასქელებული და ქინძის ნოტით — ქართული კლასიკა.",
    },
    "Грибной крем-суп": {
        "en": "Velvety cream of mushroom soup — soft flavour and a comforting texture.",
        "ka": "ხავერდოვანი სოკოს კრემ-სუპი — რბილი გემო და კომფორტული ტექსტურა.",
    },
    "Овощной суп": {
        "en": "A light soup of seasonal vegetables — fresh, wholesome and filling without heaviness.",
        "ka": "მსუბუქი სუპი სეზონური ბოსტნეულით — ახალი, სასარგებლო და გამაძღარი სიმძიმის გარეშე.",
    },
    "Остри": {
        "en": "Spicy meat stew in tomato sauce — rich, aromatic and Georgian through and through.",
        "ka": "ცხარე ხორცის ჩაშუშული პომიდვრის სოუსში — მდიდარი, სანელებლებიანი ქართული გემო.",
    },
    "Курица в соусе баже": {
        "en": "Tender chicken in walnut bazhe sauce — a signature taste of Georgian cuisine.",
        "ka": "ნაზი ქათამი ნიგვზის ბაჟეს სოუსში — ქართული სამზარეულოს ერთ-ერთი საავტორო გემო.",
    },
    "Хинкали": {
        "en": "Juicy meat khinkali — price per piece. Eat with your hands; keep the broth inside!",
        "ka": "წვნიანი ხინკალი ხორცის გულსართით — ფასი 1 ცალზე. ჭამეთ ხელებით, წვენი შიგნით დატოვეთ!",
    },
    "Хинкали с грибами": {
        "en": "Khinkali with aromatic mushroom filling — price per piece.",
        "ka": "ხინკალი არომატული სოკოს გულსართით — ფასი 1 ცალზე.",
    },
    "Кебаб": {
        "en": "Juicy lula kebab grilled over fire — smoky and spiced.",
        "ka": "წვნიანი ქაბაბი ცეცხლზე — კვამლიანი და სანელებლებიანი.",
    },
    "Шашлык из свинины": {
        "en": "Pork mtsvadi from the grill — crisp outside, juicy inside.",
        "ka": "ღორის მწვადი მანგალიდან — გარედან ხრაშუნა, შიგნიდან წვნიანი.",
    },
    "Шашлык из курицы": {
        "en": "Chicken skewers over coals — tender and aromatic.",
        "ka": "ქათმის მწვადი ნახშირზე — ნაზი და არომატული.",
    },
    "Оджахури": {
        "en": "Home-style meat and potato stew — hearty and warmly Svan.",
        "ka": "სახლის სტილის ჩაშუშული ხორცი კარტოფილით — გამაძღარი და სვანური სითბოთი.",
    },
    "Оджахури с курицей": {
        "en": "Chicken ojakhuri with potatoes — a hot dish for sharing.",
        "ka": "ოჯახური ქათმითა და კარტოფილით — ცხელი კერძი დიდი კომპანიისთვის.",
    },
    "Чкмерули": {
        "en": "Chicken in creamy garlic sauce — a Racha legend guests adore.",
        "ka": "ქათამი ნაღებისა და ნიორის სოუსში — რაჭის ლეგენდა, რომელსაც სტუმრები უყვართ.",
    },
    "Чахохбили": {
        "en": "Chicken stewed with tomatoes and herbs — homely Georgian flavour.",
        "ka": "ქათამი ჩაშუშული პომიდვრითა და მწვანილით — სახლის ქართული გემო.",
    },
    "Грибы с сыром на кеци": {
        "en": "Mushrooms baked on a ketsi under melted cheese — fragrant and tempting.",
        "ka": "სოკო კეცზე გამომცხვარი გამდნარი ყველით — არომატული და მადისაღმძვრელი.",
    },
    "Аджапсандали": {
        "en": "Vegetable stew of eggplant, pepper and tomatoes — summer taste of the Caucasus.",
        "ka": "ბოსტნეულის ჩაშუშული ბადრიჯნით, წიწაკითა და პომიდვრით — კავკასიის ზაფხულის გემო.",
    },
    "Лобио": {
        "en": "Georgian-style beans with spices — simple and deeply characteristic.",
        "ka": "ლობიო ქართულად სანელებლებით — მარტივი და ძალიან დამახასიათებელი კერძი.",
    },
    "Хачапури по-имеретински": {
        "en": "Round khachapuri with tender cheese filling — an Imeretian classic.",
        "ka": "მრგვალი იმერული ხაჭაპური ნაზი ყველის გულსართით — იმერეთის კლასიკა.",
    },
    "Хачапури по-мегрельски": {
        "en": "Khachapuri with cheese inside and a cheesy crust on top — even heartier than Imeretian.",
        "ka": "მეგრული ხაჭაპური ყველით შიგნით და ყველის ქერქით ზემოდან — იმერულზე გამაძღარიც კი.",
    },
    "Хачапури по-аджарски": {
        "en": "Boat-shaped khachapuri with cheese, butter and egg — the most recognisable style.",
        "ka": "ნავისებრი აჭარული ხაჭაპური ყველით, კარაქითა და კვერცხით — ყველაზე ცნობადი ხაჭაპური.",
    },
    "Мчади": {
        "en": "Corn flatbread — the perfect partner for lobio and cheese.",
        "ka": "სიმინდის მჭადი — იდეალური წყვილი ლობიოსა და ყველთან.",
    },
    "Лобиани": {
        "en": "Bean-filled pie — hearty Racha–Svan classic.",
        "ka": "ლობიანი ლობიოს გულსართით — გამაძღარი რაჭა-სვანური კლასიკა.",
    },
    "Хлеб": {
        "en": "Fresh bread for the table.",
        "ka": "ახალი პური სუფრაზე.",
    },
    "Пицца «Маргарита»": {
        "en": "Classic pizza with tomatoes and cheese.",
        "ka": "კლასიკური პიცა პომიდვრითა და ყველით.",
    },
    "Овощная пицца": {
        "en": "Pizza with a vegetable topping — juicy and colourful.",
        "ka": "პიცა ბოსტნეულის გულსართით — წვნიანი და ნათელი.",
    },
    "Кубдари": {
        "en": "Svan meat pie with spices — the calling card of Svaneti.",
        "ka": "სვანური კუბდარი სანელებლებით — სვანეთის სავიზიტო ბარათი.",
    },
    "Хачапури с картофелем": {
        "en": "Khachapuri with potato–cheese filling — hearty and homely.",
        "ka": "ხაჭაპური კარტოფილისა და ყველის გულსართით — გამაძღარი და სახლისებური.",
    },
    "Хачапури с просом": {
        "en": "Khachapuri with fetvi (Svan millet) — a rare local Svaneti flavour.",
        "ka": "ხაჭაპური ფეტვით (სვანური ფეტვი) — იშვიათი ადგილობრივი სვანური გემო.",
    },
    "Чвиштари": {
        "en": "Corn cakes with cheese inside — crisp outside, stretchy inside.",
        "ka": "სიმინდის ჭვიშტარი ყველით შიგნით — გარედან ხრაშუნა, შიგნით წებოვანი.",
    },
    "Чвиштари с просом": {
        "en": "Chvishtari with Svan millet — an even more authentic taste.",
        "ka": "ჭვიშტარი სვანური ფეტვით — კიდევ უფრო ავთენტიკური გემო.",
    },
    "Ташмиджаби": {
        "en": "Mashed potato stretched with cheese — an iconic Svan hot dish.",
        "ka": "თაშმიჯაბი — კარტოფილის პიურე ყველით გაწელილი, საკულტო სვანური ცხელი კერძი.",
    },
    "Рис": {"en": "Rice side.", "ka": "ბრინჯის გარნირი."},
    "Картофель фри": {"en": "Crispy French fries.", "ka": "ხრაშუნა კარტოფილი ფრი."},
    "Макароны": {"en": "Pasta side.", "ka": "მაკარონის გარნირი."},
    "Гречка": {"en": "Buckwheat side.", "ka": "წიწიბურას გარნირი."},
    "Сулугуни": {"en": "Fresh Georgian suluguni cheese.", "ka": "ახალი ქართული სულგუნი."},
    "Ткемали": {
        "en": "Sour plum tkemali sauce — a must with meat and khinkali.",
        "ka": "მჟავე ქლიავის ტყემალი — აუცილებელი ხორცთან და ხინკალთან.",
    },
    "Майонез": {"en": "Mayonnaise for sides and meat.", "ka": "მაიონეზი გარნირებისა და ხორცისთვის."},
    "Сацебели": {
        "en": "Tomato satsebeli sauce with herbs and garlic.",
        "ka": "პომიდვრის საწებელი მწვანილითა და ნიორით.",
    },
    "Сметана": {"en": "Sour cream.", "ka": "არაჟანი."},
    "Кетчуп": {"en": "Ketchup.", "ka": "კეტჩუპი."},
    "Эклер": {"en": "Delicate cream éclair.", "ka": "ნაზი ეკლერი კრემით."},
    "Яблочный пирог": {"en": "Homemade apple pie.", "ka": "სახლის ვაშლის ღვეზელი."},
    "Блины": {"en": "Thin blini — with tea or as dessert.", "ka": "თხელი ბლინები — ჩაისთან ან დესერტად."},
    "Оладьи": {"en": "Fluffy pancakes — price per piece.", "ka": "ფუმფულა მაჭკატები — ფასი 1 ცალზე."},
    "Чай": {"en": "Tea.", "ka": "ჩაი."},
    "Американо": {"en": "Americano.", "ka": "ამერიკანო."},
    "Эспрессо": {"en": "Espresso.", "ka": "ესპრესო."},
    "Кофе по-турецки": {"en": "Rich Turkish-style coffee.", "ka": "მდიდარი თურქული ყავა."},
    "Латте": {"en": "Milk latte.", "ka": "ლატე რძეზე."},
    "Капучино": {"en": "Cappuccino.", "ka": "კაპუჩინო."},
    "Лимонад": {"en": "Refreshing lemonade.", "ka": "გამაგრილებელი ლიმონათი."},
    "Компот 1 л": {"en": "Homemade kompot, 1 litre.", "ka": "სახლის კომპოტი, 1 ლიტრი."},
    "Кока-Кола": {"en": "Coca-Cola.", "ka": "Coca-Cola."},
    "Минеральная вода": {"en": "Mineral water.", "ka": "მინერალური წყალი."},
    "Вода без газа": {"en": "Still drinking water.", "ka": "უგაზო სასმელი წყალი."},
    "Чача (бокал)": {
        "en": "Georgian chacha, glass. Carafe is listed separately.",
        "ka": "ქართული ჭაჭა, ჭიქა. დოქი ცალკეა მენიუში.",
    },
    "Чача (графин)": {"en": "Chacha, carafe.", "ka": "ჭაჭა, დოქი."},
    "Фруктовая водка (бокал)": {"en": "Fruit vodka, glass.", "ka": "ხილის არაყი, ჭიქა."},
    "Фруктовая водка (графин)": {"en": "Fruit vodka, carafe.", "ka": "ხილის არაყი, დოქი."},
    "Домашнее вино 1 л": {"en": "House wine, 1 litre.", "ka": "სახლის ღვინო, 1 ლიტრი."},
    "Домашнее красное вино": {"en": "House red wine.", "ka": "სახლის წითელი ღვინო."},
    "Белое полусладкое (бокал)": {
        "en": "White semi-sweet wine, glass. Bottle — 35₾.",
        "ka": "თეთრი ნახევრადტკბილი ღვინო, ჭიქა. ბოთლი — 35₾.",
    },
    "Белое полусладкое (бутылка)": {
        "en": "White semi-sweet wine, bottle.",
        "ka": "თეთრი ნახევრადტკბილი ღვინო, ბოთლი.",
    },
    "Красное полусладкое (бокал)": {
        "en": "Red semi-sweet wine, glass. Bottle — 35₾.",
        "ka": "წითელი ნახევრადტკბილი ღვინო, ჭიქა. ბოთლი — 35₾.",
    },
    "Красное полусладкое (бутылка)": {
        "en": "Red semi-sweet wine, bottle.",
        "ka": "წითელი ნახევრადტკბილი ღვინო, ბოთლი.",
    },
    "Белое сухое (бокал)": {
        "en": "White dry wine, glass. Bottle — 40₾.",
        "ka": "თეთრი მშრალი ღვინო, ჭიქა. ბოთლი — 40₾.",
    },
    "Белое сухое (бутылка)": {"en": "White dry wine, bottle.", "ka": "თეთრი მშრალი ღვინო, ბოთლი."},
    "Красное сухое (бокал)": {
        "en": "Red dry wine, glass. Bottle — 40₾.",
        "ka": "წითელი მშრალი ღვინო, ჭიქა. ბოთლი — 40₾.",
    },
    "Красное сухое (бутылка)": {"en": "Red dry wine, bottle.", "ka": "წითელი მშრალი ღვინო, ბოთლი."},
    "Пиво": {"en": "Beer.", "ka": "ლუდი."},
    "Сараджишвили 0,5 л (бокал)": {
        "en": "Sarajishvili brandy, glass. 0.5 L bottle — 60₾.",
        "ka": "სარაჯიშვილის კონიაკი, ჭიქა. ბოთლი 0,5 ლ — 60₾.",
    },
    "Сараджишвили 0,5 л (бутылка)": {
        "en": "Sarajishvili brandy, 0.5 L bottle.",
        "ka": "სარაჯიშვილის კონიაკი, ბოთლი 0,5 ლ.",
    },
    "Егермейстер (бокал)": {"en": "Jägermeister, one glass.", "ka": "Jägermeister, 1 ჭიქა."},
}


def req(method: str, path: str, token: str | None = None, body: dict | list | None = None):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=90) as resp:
                raw = resp.read().decode("utf-8")
                return resp.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} {path}: {err}") from e
        except Exception:
            if attempt == 3:
                raise
            time.sleep(1.2 + attempt)
    raise RuntimeError("unreachable")


def enrich_menu() -> list[dict]:
    payload = json.loads(MENU_PATH.read_text(encoding="utf-8"))
    missing = []
    for p in payload["products"]:
        tr = DESC_I18N.get(p["ru"])
        if not tr:
            missing.append(p["ru"])
            continue
        p["desc_en"] = tr["en"]
        p["desc_ka"] = tr["ka"]
    if missing:
        raise SystemExit(f"Missing translations for: {missing}")
    MENU_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return payload["products"]


def main() -> None:
    products = enrich_menu()
    print(f"menu enriched: {len(products)} products")

    if len(sys.argv) < 3:
        print("menu updated only (pass admin user pass to PATCH prod)")
        return

    user, password = sys.argv[1], sys.argv[2]
    _, auth = req("POST", "/auth/login", body={"username": user, "password": password})
    token = auth["token"]

    _, restaurants = req("GET", "/restaurants/", token=token)
    rest = next((r for r in restaurants if str(r.get("name", "")).lower() == "luizastan"), None)
    if not rest:
        raise SystemExit("Luizastan not found")
    rid = rest["id"]

    _, existing = req("GET", f"/products/?restaurant_id={rid}&limit=1000", token=token)
    by_ru: dict[str, dict] = {}
    for p in existing:
        name = p.get("name") or ""
        try:
            if str(name).startswith("{"):
                ru = json.loads(name).get("ru", "")
            else:
                ru = name
        except json.JSONDecodeError:
            ru = name
        if ru:
            by_ru[ru] = p

    ok = fail = skip = 0
    for p in products:
        cur = by_ru.get(p["ru"])
        if not cur:
            print(f"SKIP not on server: {p['ru']}")
            skip += 1
            continue
        body = {
            "restaurant_id": rid,
            "name": json.dumps({"ka": p["ka"], "ru": p["ru"], "en": p["en"]}, ensure_ascii=False),
            "description": json.dumps(
                {"ru": p.get("desc", ""), "en": p["desc_en"], "ka": p["desc_ka"]},
                ensure_ascii=False,
            ),
            "price": p["price"],
            "img": cur.get("img") or "/Assets/default-food.png",
            "category": p["category"],
            "weight": p.get("weight", ""),
            "calories": str(p.get("calories", "0")),
            "proteins": str(p.get("proteins", "0")),
            "fats": str(p.get("fats", "0")),
            "carbs": str(p.get("carbs", "0")),
            "ingredients": p.get("ingredients", ""),
            "is_available": True,
        }
        try:
            req("PUT", f"/products/{cur['id']}", token=token, body=body)
            ok += 1
            if ok % 10 == 0:
                print(f"progress {ok}")
            time.sleep(0.05)
        except Exception as e:
            fail += 1
            print(f"FAIL {p['ru']}: {e}")

    # verify one
    sample = by_ru.get("Огурцы и помидоры с орехами")
    if sample:
        _, refreshed = req("GET", f"/products/?restaurant_id={rid}&limit=1000", token=token)
        hit = next((x for x in refreshed if x["id"] == sample["id"]), None)
        print("sample desc:", hit.get("description") if hit else None)

    print(json.dumps({"ok": ok, "fail": fail, "skip": skip}, ensure_ascii=False))


if __name__ == "__main__":
    main()
