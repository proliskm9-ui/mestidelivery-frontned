# -*- coding: utf-8 -*-
"""BBQ Garden: split tea/ice cream, fix water+espresso photos, long selling descriptions."""
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

# Selling descriptions RU/EN (2+ lines). Keys = current Georgian name on product.
DESCRIPTIONS: dict[str, dict[str, str]] = {
    "შვრიის ფაფა ხილით": {
        "ru": "Тёплая овсяная каша с нежной кремовой текстурой.\nСвежие фрукты и лёгкая сладость мёда — сытный старт дня.",
        "en": "Warm creamy oatmeal with a soft texture.\nFresh fruit and a touch of honey for a hearty start to the day.",
    },
    "ხაჭო თაფლით და ჩირით": {
        "ru": "Домашний зернистый творог с натуральным мёдом.\nСухофрукты добавляют сладость и делают завтрак по-настоящему сытным.",
        "en": "Homestyle cottage cheese with natural honey.\nDried fruit adds sweetness and makes breakfast truly satisfying.",
    },
    "ყველის ომლეტი": {
        "ru": "Пышный омлет с тянущимся сыром внутри.\nГорячий, воздушный и идеальный к утреннему чаю или кофе.",
        "en": "A fluffy omelette with melted cheese inside.\nHot, airy, and perfect with morning tea or coffee.",
    },
    "შემწვარი სენდვიჩი ყველით": {
        "ru": "Хрустящий тост с расплавленным сыром.\nПростой и любимый завтрак — золотистая корочка и тянущаяся начинка.",
        "en": "Crispy toast with melted cheese.\nA simple favourite — golden crust and a gooey cheesy centre.",
    },
    "შემწვარი სენდვიჩი ლორით და ყველით": {
        "ru": "Горячий тост с ветчиной и сыром.\nСочная начинка под хрустящей корочкой — быстрый и сытный перекус.",
        "en": "Hot toast with ham and melted cheese.\nA juicy filling under a crispy crust — quick and filling.",
    },
    "ბორში": {
        "ru": "Наваристый овощной борщ насыщенного цвета.\nПодаём горячим — согревает и отлично сочетается с хлебом.",
        "en": "A rich vegetable borscht with deep colour.\nServed hot — warming and perfect with fresh bread.",
    },
    "მაწვნის ცივი სუპი კიტრით": {
        "ru": "Освежающий холодный суп на нежном мацони.\nСвежий огурец и зелень — лёгкость после жары и шашлыка.",
        "en": "A refreshing cold soup based on soft matsoni.\nCucumber and herbs — light and cooling after the grill.",
    },
    "ღორის მწვადი": {
        "ru": "Сочный свиной шашлык с ароматом углей.\nМягкое мясо с румяной корочкой — главная причина прийти в BBQ Garden.",
        "en": "Juicy pork shashlik with charcoal aroma.\nTender meat with a roasted crust — the reason to visit BBQ Garden.",
    },
    "ქათმის მწვადი": {
        "ru": "Нежный куриный шашлык с мангала.\nЗолотистая корочка снаружи и сочность внутри — классика гриля.",
        "en": "Tender chicken shashlik from the charcoal grill.\nGolden outside, juicy inside — a grill classic.",
    },
    "ქაბაბი ლავაშში (საქონლის)": {
        "ru": "Говяжий люля-кебаб, обжаренный на углях.\nСочный фарш на шампуре и свежий лаваш — сытно и по-кавказски.",
        "en": "Beef lula kebab grilled over coals.\nJuicy minced meat on a skewer with fresh lavash — hearty Caucasian style.",
    },
    "ხაჭაპური გრილზე": {
        "ru": "Хачапури на вертеле: сулугуни в слоёном тесте.\nЖарится на шампуре до золотой корочки — сыр тянется, тесто хрустит.",
        "en": "Khachapuri on a spit: sulguni in flaky pastry.\nGrilled on a skewer until golden — molten cheese, crisp dough.",
    },
    "გრილზე შემწვარი კალმახი": {
        "ru": "Целая форель с хрустящей корочкой с гриля.\nНежное мясо рыбы и лёгкий дымный аромат углей.",
        "en": "Whole trout with a crispy grilled skin.\nDelicate fish and a light charcoal aroma.",
    },
    "გრილზე შემწვარი ბოსტნეული": {
        "ru": "Ассорти овощей с яркими следами гриля.\nЛёгкий гарнир к шашлыку — сочно, ароматно и по делу.",
        "en": "Assorted vegetables with bold grill marks.\nA light side for shashlik — juicy, fragrant, and simple.",
    },
    "გრილზე შემწვარი ქათმის ფრთები": {
        "ru": "Куриные крылышки с румяной корочкой.\nХруст снаружи, сочность внутри — отличная закуска к грилю.",
        "en": "Chicken wings with a golden crust.\nCrispy outside, juicy inside — a great grill snack.",
    },
    "კუპატი გრილზე": {
        "ru": "Домашние купаты, обжаренные на мангале.\nНасыщенный мясной вкус и аромат углей в каждой порции.",
        "en": "Homemade kupati grilled over charcoal.\nRich meat flavour and smoke in every bite.",
    },
    "გრილზე შემწვარი სოსისი (2 ცალი)": {
        "ru": "Сосиски с мангала с аппетитной корочкой.\nПростое и любимое блюдо к шашлыку и овощам.",
        "en": "Grilled sausages with an appetising crust.\nA simple favourite alongside shashlik and vegetables.",
    },
    "კარტოფილი ფრი": {
        "ru": "Хрустящий картофель фри с золотистой корочкой.\nИдеальный гарнир к любым блюдам с гриля.",
        "en": "Crispy golden French fries.\nThe perfect side for anything from the grill.",
    },
    "პომიდორ-კიტრის სალათი": {
        "ru": "Свежий салат из помидоров и огурцов.\nЛёгкая зелень и сочность — классика к шашлыку.",
        "en": "Fresh tomato and cucumber salad.\nLight herbs and crunch — a classic with shashlik.",
    },
    "პომიდორ-კიტრის სალათი ნიგვზით": {
        "ru": "Салат из помидоров и огурцов с грецкими орехами.\nСвежесть овощей и ореховая насыщенность в одной тарелке.",
        "en": "Tomato and cucumber salad with walnuts.\nFresh vegetables and rich nutty flavour in one bowl.",
    },
    "ჭარხლის სალათი": {
        "ru": "Нежный салат из свёклы.\nСладковатый вкус и лёгкость — отличный баланс к мясным блюдам.",
        "en": "A soft beetroot salad.\nMild sweetness and lightness — a great balance to grilled meat.",
    },
    "სტაფილოს სალათი": {
        "ru": "Свежий морковный салат.\nХрустящий, яркий и освежающий гарнир к грилю.",
        "en": "Fresh carrot salad.\nCrunchy, bright, and refreshing next to the grill.",
    },
    "ლობიო ნიგვზით": {
        "ru": "Фасоль с грецкими орехами по-грузински.\nСытная закуска с ореховым вкусом и домашним характером.",
        "en": "Georgian-style beans with walnuts.\nA hearty appetiser with nutty depth and homemade feel.",
    },
    "მწნილი ბოსტნეული": {
        "ru": "Ассорти маринованных овощей.\nКислинка и хруст — идеальный компаньон к шашлыку и купатам.",
        "en": "Assorted pickled vegetables.\nTangy crunch — the perfect partner for shashlik and kupati.",
    },
    "ქართული ყველის ასორტი": {
        "ru": "Тарелка грузинских сыров.\nРазные сорта в одной подаче — к вину, чаю или просто так.",
        "en": "A platter of Georgian cheeses.\nSeveral varieties in one serving — with tea or on its own.",
    },
    "პური": {
        "ru": "Свежий хлеб к столу.\nМягкий внутри — чтобы макать в соус и есть с шашлыком.",
        "en": "Fresh bread for the table.\nSoft inside — perfect with sauces and shashlik.",
    },
    "ტყემალი": {
        "ru": "Классический соус ткемали.\nКисло-сладкая нота сливы — must-have к мясу с мангала.",
        "en": "Classic tkemali sauce.\nSweet-sour plum notes — a must with charcoal meat.",
    },
    "კეტჩუპი": {
        "ru": "Кетчуп в порционной подаче.\nПривычный вкус к фри, крылышкам и сосискам.",
        "en": "Portion ketchup.\nThe familiar match for fries, wings and sausages.",
    },
    "მაიონეზი": {
        "ru": "Майонез в порционной подаче.\nМягкий соус к картофелю фри и закускам.",
        "en": "Portion mayonnaise.\nA soft sauce for fries and snacks.",
    },
    "შოკოლადის პუდინგი თხილით": {
        "ru": "Нежный шоколадный пудинг с фундуком.\nПлотный какао-вкус и хруст орехов — сладкий финал ужина.",
        "en": "Silky chocolate pudding with hazelnuts.\nDeep cocoa and nutty crunch — a sweet finish.",
    },
    "დღის ნამცხვარი": {
        "ru": "Домашний торт дня от кухни.\nМягкий бисквит и свежая выпечка — успейте, пока есть.",
        "en": "Homemade cake of the day.\nSoft sponge and fresh baking — while it lasts.",
    },
    "კრემი ხილით": {
        "ru": "Воздушный крем со свежими фруктами.\nЛёгкая сладость и свежесть — десерт без тяжести.",
        "en": "Airy cream with fresh fruit.\nLight sweetness and freshness — dessert without heaviness.",
    },
    "ჩურჩხელა": {
        "ru": "Классическая грузинская чурчхела.\nОрехи в виноградной оболочке — сладкий сувенир Кавказа.",
        "en": "Classic Georgian churchkhela.\nNuts in grape coating — a sweet taste of the Caucasus.",
    },
    "არაქისი": {
        "ru": "Хрустящий жареный арахис.\nПростая закуска к чаю или как перекус между блюдами.",
        "en": "Crispy roasted peanuts.\nA simple snack with tea or between courses.",
    },
    "ესპრესო": {
        "ru": "Крепкий эспрессо с плотной крема.\nКороткий удар бодрости после шашлыка или на завтрак.",
        "en": "A strong espresso with dense crema.\nA short boost after the grill or with breakfast.",
    },
    "ამერიკანო": {
        "ru": "Классический американо на основе эспрессо.\nМягче и объёмнее — для неспешного кофе-брейка.",
        "en": "Classic americano based on espresso.\nMilder and larger — for a slower coffee break.",
    },
    "კაპუჩინო": {
        "ru": "Капучино с бархатной молочной пенкой.\nБаланс эспрессо и молока — уют в каждой чашке.",
        "en": "Cappuccino with velvet milk foam.\nEspresso and milk in balance — comfort in every cup.",
    },
    "ქართული ლიმონათი": {
        "ru": "Освежающий грузинский лимонад.\nЯркий вкус и лёд — спасение в жаркий день в Местии.",
        "en": "Refreshing Georgian lemonade.\nBright flavour and ice — a cool break on a hot Mestia day.",
    },
    "კოკა-კოლა": {
        "ru": "Классическая Coca-Cola со льдом.\nПривычный вкус к шашлыку, фри и крылышкам.",
        "en": "Classic Coca-Cola with ice.\nThe familiar match for shashlik, fries and wings.",
    },
    "გაზიანი მინერალური წყალი": {
        "ru": "Газированная минеральная вода.\nЛёгкие пузырьки освежают и хорошо идут после мяса.",
        "en": "Sparkling mineral water.\nLight bubbles that refresh after grilled meat.",
    },
    "წვენი": {
        "ru": "Свежий сок в порции.\nСладкая фруктовая нота к завтраку или десерту.",
        "en": "A serving of juice.\nA sweet fruit note with breakfast or dessert.",
    },
    "კომპოტი": {
        "ru": "Домашний компот из сухофруктов.\nМягкая сладость и уют — как в гестхаусе в горах.",
        "en": "Homemade dried-fruit kompot.\nGentle sweetness — like a mountain guesthouse drink.",
    },
}

# Special keys for renamed/split items (after update)
TEA_BLACK = {
    "ka": "ქართული შავი ჩაი",
    "ru": "Грузинский чёрный чай",
    "en": "Georgian black tea",
    "desc": "Ароматный грузинский чёрный чай.\nКрепкий и согревающий — к хачапури, десерту или просто так.",
    "desc_en": "Fragrant Georgian black tea.\nStrong and warming — with khachapuri, dessert, or on its own.",
    "desc_ka": "არომატული ქართული შავი ჩაი.",
    "price": 4,
    "weight": "300 мл",
    "calories": "2",
    "proteins": "0",
    "fats": "0",
    "carbs": "0",
    "category": "Напитки",
}
TEA_GREEN = {
    "ka": "ქართული მწვანე ჩაი",
    "ru": "Грузинский зелёный чай",
    "en": "Georgian green tea",
    "desc": "Лёгкий грузинский зелёный чай.\nМягкий вкус без тяжести — освежает после гриля.",
    "desc_en": "Light Georgian green tea.\nSoft and easy — refreshing after the grill.",
    "desc_ka": "მსუბუქი ქართული მწვანე ჩაი.",
    "price": 4,
    "weight": "300 мл",
    "calories": "2",
    "proteins": "0",
    "fats": "0",
    "carbs": "0",
    "category": "Напитки",
}
ICE_VANILLA = {
    "ka": "ნაყინი (ვანილი)",
    "ru": "Мороженое ванильное",
    "en": "Vanilla ice cream",
    "desc": "Нежное ванильное мороженое.\nКремовая сладость — простой и любимый десерт после ужина.",
    "desc_en": "Soft vanilla ice cream.\nCreamy sweetness — a simple favourite after dinner.",
    "desc_ka": "ნაზი ვანილის ნაყინი.",
    "price": 5,
    "weight": "100 г",
    "calories": "210",
    "proteins": "3",
    "fats": "12",
    "carbs": "22",
    "category": "Десерты",
}
ICE_CHOCO = {
    "ka": "ნაყინი (შოკოლადი)",
    "ru": "Мороженое шоколадное",
    "en": "Chocolate ice cream",
    "desc": "Насыщенное шоколадное мороженое.\nГлубокий какао-вкус — для тех, кто выбирает шоколад.",
    "desc_en": "Rich chocolate ice cream.\nDeep cocoa flavour — for those who choose chocolate.",
    "desc_ka": "გემრიელი შოკოლადის ნაყინი.",
    "price": 5,
    "weight": "100 г",
    "calories": "210",
    "proteins": "3",
    "fats": "12",
    "carbs": "22",
    "category": "Десерты",
}
WATER = {
    "desc": "Минеральная вода без газа в стакане.\nЧистый вкус — лёгкий и правильный выбор к любому блюду.",
    "desc_en": "Still mineral water served in a glass.\nClean taste — a light match for any dish.",
    "ru": "Минеральная вода",
    "en": "Still mineral water",
}


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


def parse_field(val) -> dict:
    if isinstance(val, str) and val.strip().startswith("{"):
        try:
            return json.loads(val)
        except Exception:
            return {"ru": val}
    return {"ru": str(val or "")}


def compress(webp_name: str) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    src = ASSETS / webp_name
    im = Image.open(src).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    if side > 900:
        im = im.resize((900, 900), Image.Resampling.LANCZOS)
    dest = OUT / webp_name.replace(".webp", ".jpg")
    im.save(dest, "JPEG", quality=80, optimize=True)
    return dest


def upload_jpg(client: paramiko.SSHClient, local: Path) -> str:
    new_name = f"{uuid.uuid4().hex}.jpg"
    remote = f"/tmp/{new_name}"
    sftp = client.open_sftp()
    sftp.put(str(local), remote)
    sftp.close()
    _, o, e = client.exec_command(
        f"cp {remote} /opt/mestigo/uploads/{new_name} && chmod 644 /opt/mestigo/uploads/{new_name}",
        timeout=60,
    )
    _ = o.read(), e.read()
    return f"/uploads/{new_name}"


def product_body(rid: str, p: dict, *, name: dict, desc: dict, img: str | None = None, extra: dict | None = None) -> dict:
    src = extra or p
    return {
        "restaurant_id": rid,
        "name": json.dumps(name, ensure_ascii=False),
        "description": json.dumps(desc, ensure_ascii=False),
        "price": float(src.get("price") or p.get("price") or 0),
        "img": img if img is not None else (p.get("img") or "/Assets/default-food.png"),
        "category": src.get("category") or p.get("category") or "",
        "weight": src.get("weight") or p.get("weight") or "",
        "calories": str(src.get("calories") or p.get("calories") or "0"),
        "proteins": str(src.get("proteins") or p.get("proteins") or "0"),
        "fats": str(src.get("fats") or p.get("fats") or "0"),
        "carbs": str(src.get("carbs") or p.get("carbs") or "0"),
        "ingredients": p.get("ingredients") or "",
        "is_available": True,
    }


def main() -> None:
    user, password, ssh_pw = sys.argv[1], sys.argv[2], sys.argv[3]
    token = login(user, password)
    rests = api("GET", "/restaurants/", token)
    bbq = next(r for r in rests if "bbq" in str(r.get("name", "")).lower())
    rid = bbq["id"]
    products = api("GET", f"/products/?restaurant_id={rid}&limit=1000", token)

    by_ka: dict[str, dict] = {}
    for p in products:
        nj = parse_field(p.get("name"))
        ka = nj.get("ka") or ""
        if ka:
            by_ka[ka] = p

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=ssh_pw, timeout=30)

    photos = {
        "tea_green": upload_jpg(client, compress("bbq_tea_green.webp")),
        "ice_vanilla": upload_jpg(client, compress("bbq_icecream_vanilla.webp")),
        "ice_choco": upload_jpg(client, compress("bbq_icecream_chocolate.webp")),
        "water": upload_jpg(client, compress("bbq_41_water.webp")),
        "espresso": upload_jpg(client, compress("bbq_35_espresso.webp")),
    }
    print("photos", photos)
    client.close()

    # 1) Update all existing descriptions (and special renames)
    ok = fail = 0
    for ka, p in list(by_ka.items()):
        nj = parse_field(p.get("name"))
        dj = parse_field(p.get("description"))
        img = p.get("img")

        # Tea combined -> black tea
        if "ჩაი" in ka and ("შავი" in ka or "/" in ka or "მწვანე" in ka) and "ლიმონათი" not in ka:
            name = {"ka": TEA_BLACK["ka"], "ru": TEA_BLACK["ru"], "en": TEA_BLACK["en"]}
            desc = {"ka": TEA_BLACK["desc_ka"], "ru": TEA_BLACK["desc"], "en": TEA_BLACK["desc_en"]}
            # keep existing dark tea photo
        elif "ნაყინი" in ka:
            name = {"ka": ICE_VANILLA["ka"], "ru": ICE_VANILLA["ru"], "en": ICE_VANILLA["en"]}
            desc = {"ka": ICE_VANILLA["desc_ka"], "ru": ICE_VANILLA["desc"], "en": ICE_VANILLA["desc_en"]}
            img = photos["ice_vanilla"]
        elif ka == "მინერალური წყალი":
            name = {"ka": nj.get("ka") or ka, "ru": WATER["ru"], "en": WATER["en"]}
            desc = {"ka": dj.get("ka") or "", "ru": WATER["desc"], "en": WATER["desc_en"]}
            img = photos["water"]
        elif ka == "ესპრესო":
            d = DESCRIPTIONS[ka]
            name = {"ka": nj.get("ka") or ka, "ru": nj.get("ru") or "Эспрессо", "en": "Espresso"}
            desc = {"ka": dj.get("ka") or "", "ru": d["ru"], "en": d["en"]}
            img = photos["espresso"]
        elif ka in DESCRIPTIONS:
            d = DESCRIPTIONS[ka]
            name = {"ka": nj.get("ka") or ka, "ru": nj.get("ru") or "", "en": nj.get("en") or ""}
            desc = {"ka": dj.get("ka") or "", "ru": d["ru"], "en": d["en"]}
        else:
            continue

        try:
            api("PUT", f"/products/{p['id']}", token, product_body(rid, p, name=name, desc=desc, img=img))
            ok += 1
            print("UPD", name["ru"])
        except Exception as ex:
            fail += 1
            print("FAIL", name.get("ru"), ex)

    # 2) Create green tea + chocolate ice cream if missing
    existing_rus = {(parse_field(p.get("name")).get("ru") or "") for p in api("GET", f"/products/?restaurant_id={rid}&limit=1000", token)}

    def create_from(spec: dict, img: str):
        name = {"ka": spec["ka"], "ru": spec["ru"], "en": spec["en"]}
        desc = {"ka": spec["desc_ka"], "ru": spec["desc"], "en": spec["desc_en"]}
        body = {
            "restaurant_id": rid,
            "name": json.dumps(name, ensure_ascii=False),
            "description": json.dumps(desc, ensure_ascii=False),
            "price": spec["price"],
            "img": img,
            "category": spec["category"],
            "weight": spec["weight"],
            "calories": spec["calories"],
            "proteins": spec["proteins"],
            "fats": spec["fats"],
            "carbs": spec["carbs"],
            "ingredients": "",
            "is_available": True,
        }
        api("POST", "/products/", token, body)
        print("CREATE", spec["ru"])

    if TEA_GREEN["ru"] not in existing_rus:
        create_from(TEA_GREEN, photos["tea_green"])
    else:
        print("SKIP exists", TEA_GREEN["ru"])

    if ICE_CHOCO["ru"] not in existing_rus:
        # fix typo in weight if any
        ICE_CHOCO["weight"] = "100 г"
        create_from(ICE_CHOCO, photos["ice_choco"])
    else:
        print("SKIP exists", ICE_CHOCO["ru"])

    print(json.dumps({"updated": ok, "fail": fail}))


if __name__ == "__main__":
    main()
