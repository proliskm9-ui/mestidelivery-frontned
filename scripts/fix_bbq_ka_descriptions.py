# -*- coding: utf-8 -*-
"""Update BBQ Garden product descriptions with full Georgian (ka) selling copy."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

BASE = "https://mestidelivery.com/api"
MENU_JSON = Path(__file__).resolve().parent / "bbq_garden_menu.json"

# Full 2-line selling descriptions keyed by Georgian product name (as on prod now).
KA_BY_NAME: dict[str, dict[str, str]] = {
    "შვრიის ფაფა ხილით": {
        "ka": "თბილი შვრიის ფაფა ნაზი, კრემისებრი ტექსტურით.\nახალი ხილი და თაფლის მსუბუქი სიტკბო — გემრიელი დღის დასაწყისი.",
        "ru": "Тёплая овсяная каша с нежной кремовой текстурой.\nСвежие фрукты и лёгкая сладость мёда — сытный старт дня.",
        "en": "Warm creamy oatmeal with a soft texture.\nFresh fruit and a touch of honey for a hearty start to the day.",
    },
    "ხაჭო თაფლით და ჩირით": {
        "ka": "სახლის ხაჭო ნატურალური თაფლით.\nჩირი ამატებს სიტკბოს და საუზმეს ნამდვილად გაჯერებულს ხდის.",
        "ru": "Домашний зернистый творог с натуральным мёдом.\nСухофрукты добавляют сладость и делают завтрак по-настоящему сытным.",
        "en": "Homestyle cottage cheese with natural honey.\nDried fruit adds sweetness and makes breakfast truly satisfying.",
    },
    "ყველის ომლეტი": {
        "ka": "ფუმფულა ომლეტი შიგნით გამდნარი ყველით.\nცხელი და ჰაეროვანი — იდეალურია დილის ჩაისთან ან ყავასთან.",
        "ru": "Пышный омлет с тянущимся сыром внутри.\nГорячий, воздушный и идеальный к утреннему чаю или кофе.",
        "en": "A fluffy omelette with melted cheese inside.\nHot, airy, and perfect with morning tea or coffee.",
    },
    "შემწვარი სენდვიჩი ყველით": {
        "ka": "ხრაშუნა ტოსტი გამდნარი ყველით.\nმარტივი და საყვარელი საუზმე — ოქროსფერი ქერქი და წვნიანი შიგთავსი.",
        "ru": "Хрустящий тост с расплавленным сыром.\nПростой и любимый завтрак — золотистая корочка и тянущаяся начинка.",
        "en": "Crispy toast with melted cheese.\nA simple favourite — golden crust and a gooey cheesy centre.",
    },
    "შემწვარი სენდვიჩი ლორით და ყველით": {
        "ka": "ცხელი ტოსტი ლორითა და ყველით.\nწვნიანი შიგთავსი ხრაშუნა ქერქის ქვეშ — სწრაფი და მაძღარი საჭმელი.",
        "ru": "Горячий тост с ветчиной и сыром.\nСочная начинка под хрустящей корочкой — быстрый и сытный перекус.",
        "en": "Hot toast with ham and melted cheese.\nA juicy filling under a crispy crust — quick and filling.",
    },
    "ბორში": {
        "ka": "მდიდარი ბოსტნეულის ბორში ღრმა ფერით.\nცხლად მიირთმევა — ათბობს და შესანიშნავად ერწყმის პურს.",
        "ru": "Наваристый овощной борщ насыщенного цвета.\nПодаём горячим — согревает и отлично сочетается с хлебом.",
        "en": "A rich vegetable borscht with deep colour.\nServed hot — warming and perfect with fresh bread.",
    },
    "მაწვნის ცივი სუპი კიტრით": {
        "ka": "გამაგრილებელი ცივი სუპი ნაზ მაწვნზე.\nახალი კიტრი და მწვანილი — სიმსუბუქე სიცხის და მწვადის შემდეგ.",
        "ru": "Освежающий холодный суп на нежном мацони.\nСвежий огурец и зелень — лёгкость после жары и шашлыка.",
        "en": "A refreshing cold soup based on soft matsoni.\nCucumber and herbs — light and cooling after the grill.",
    },
    "ღორის მწვადი": {
        "ka": "წვნიანი ღორის მწვადი ნახშირის არომატით.\nრბილი ხორცი მოწითალო ქერქით — BBQ Garden-ში მოსვლის მთავარი მიზეზი.",
        "ru": "Сочный свиной шашлык с ароматом углей.\nМягкое мясо с румяной корочкой — главная причина прийти в BBQ Garden.",
        "en": "Juicy pork shashlik with charcoal aroma.\nTender meat with a roasted crust — the reason to visit BBQ Garden.",
    },
    "ქათმის მწვადი": {
        "ka": "ნაზი ქათმის მწვადი მანგლიდან.\nოქროსფერი ქერქი გარედან და სიწვნიანე შიგნით — გრილის კლასიკა.",
        "ru": "Нежный куриный шашлык с мангала.\nЗолотистая корочка снаружи и сочность внутри — классика гриля.",
        "en": "Tender chicken shashlik from the charcoal grill.\nGolden outside, juicy inside — a grill classic.",
    },
    "ქაბაბი ლავაშში (საქონლის)": {
        "ka": "საქონლის ქაბაბი ნახშირზე შემწვარი.\nწვნიანი ფარში შამფურზე და ახალი ლავაში — გემრიელი და კავკასიურად.",
        "ru": "Говяжий люля-кебаб, обжаренный на углях.\nСочный фарш на шампуре и свежий лаваш — сытно и по-кавказски.",
        "en": "Beef lula kebab grilled over coals.\nJuicy minced meat on a skewer with fresh lavash — hearty Caucasian style.",
    },
    "ხაჭაპური გრილზე": {
        "ka": "ხაჭაპური შამფურზე: სულგუნი ფენოვან ცომში.\nნახშირზე იწვება ოქროსფერ ქერქამდე — ყველი იწელება, ცომი ხრაშუნებს.",
        "ru": "Хачапури на вертеле: сулугуни в слоёном тесте.\nЖарится на шампуре до золотой корочки — сыр тянется, тесто хрустит.",
        "en": "Khachapuri on a spit: sulguni in flaky pastry.\nGrilled on a skewer until golden — molten cheese, crisp dough.",
    },
    "გრილზე შემწვარი კალმახი": {
        "ka": "მთლიანი კალმახი ხრაშუნა ქერქით გრილიდან.\nნაზი თევზის ხორცი და ნახშირის მსუბუქი არომატი.",
        "ru": "Целая форель с хрустящей корочкой с гриля.\nНежное мясо рыбы и лёгкий дымный аромат углей.",
        "en": "Whole trout with a crispy grilled skin.\nDelicate fish and a light charcoal aroma.",
    },
    "გრილზე შემწვარი ბოსტნეული": {
        "ka": "ბოსტნეულის ასორტი გრილის კვალით.\nმსუბუქი გარნირი მწვადთან — წვნიანი, არომატული და საქმიანი.",
        "ru": "Ассорти овощей с яркими следами гриля.\nЛёгкий гарнир к шашлыку — сочно, ароматно и по делу.",
        "en": "Assorted vegetables with bold grill marks.\nA light side for shashlik — juicy, fragrant, and simple.",
    },
    "გრილზე შემწვარი ქათმის ფრთები": {
        "ka": "ქათმის ფრთები მოწითალო ქერქით.\nხრაშუნა გარედან, წვნიანი შიგნით — შესანიშნავი საჭმელი გრილთან.",
        "ru": "Куриные крылышки с румяной корочкой.\nХруст снаружи, сочность внутри — отличная закуска к грилю.",
        "en": "Chicken wings with a golden crust.\nCrispy outside, juicy inside — a great grill snack.",
    },
    "კუპატი გრილზე": {
        "ka": "სახლის კუპატი მანგალზე შემწვარი.\nმდიდარი ხორცის გემო და ნახშირის არომატი ყოველ ნაკბენში.",
        "ru": "Домашние купаты, обжаренные на мангале.\nНасыщенный мясной вкус и аромат углей в каждой порции.",
        "en": "Homemade kupati grilled over charcoal.\nRich meat flavour and smoke in every bite.",
    },
    "გრილზე შემწვარი სოსისი (2 ცალი)": {
        "ka": "სოსისები მანგალიდან მადისაღმძვრელი ქერქით.\nმარტივი და საყვარელი კერძი მწვადთან და ბოსტნეულთან.",
        "ru": "Сосиски с мангала с аппетитной корочкой.\nПростое и любимое блюдо к шашлыку и овощам.",
        "en": "Grilled sausages with an appetising crust.\nA simple favourite alongside shashlik and vegetables.",
    },
    "კარტოფილი ფრი": {
        "ka": "ხრაშუნა კარტოფილი ფრი ოქროსფერი ქერქით.\nიდეალური გარნირი გრილის ნებისმიერ კერძთან.",
        "ru": "Хрустящий картофель фри с золотистой корочкой.\nИдеальный гарнир к любым блюдам с гриля.",
        "en": "Crispy golden French fries.\nThe perfect side for anything from the grill.",
    },
    "პომიდორ-კიტრის სალათი": {
        "ka": "ახალი პომიდორ-კიტრის სალათი.\nმსუბუქი მწვანილი და სიწვნიანე — კლასიკა მწვადთან.",
        "ru": "Свежий салат из помидоров и огурцов.\nЛёгкая зелень и сочность — классика к шашлыку.",
        "en": "Fresh tomato and cucumber salad.\nLight herbs and crunch — a classic with shashlik.",
    },
    "პომიდორ-კიტრის სალათი ნიგვზით": {
        "ka": "პომიდორ-კიტრის სალათი ნიგვზით.\nბოსტნეულის სიახლე და ნიგვზის სიმდიდრე ერთ თეფშზე.",
        "ru": "Салат из помидоров и огурцов с грецкими орехами.\nСвежесть овощей и ореховая насыщенность в одной тарелке.",
        "en": "Tomato and cucumber salad with walnuts.\nFresh vegetables and rich nutty flavour in one bowl.",
    },
    "ჭარხლის სალათი": {
        "ka": "ნაზი ჭარხლის სალათი.\nტკბილე გემო და სიმსუბუქე — შესანიშნავი ბალანსი ხორცის კერძებთან.",
        "ru": "Нежный салат из свёклы.\nСладковатый вкус и лёгкость — отличный баланс к мясным блюдам.",
        "en": "A soft beetroot salad.\nMild sweetness and lightness — a great balance to grilled meat.",
    },
    "სტაფილოს სალათი": {
        "ka": "ახალი სტაფილოს სალათი.\nხრაშუნა, ნათელი და გამაგრილებელი გარნირი გრილთან.",
        "ru": "Свежий морковный салат.\nХрустящий, яркий и освежающий гарнир к грилю.",
        "en": "Fresh carrot salad.\nCrunchy, bright, and refreshing next to the grill.",
    },
    "ლობიო ნიგვზით": {
        "ka": "ლობიო ნიგვზით ქართულად.\nმაძღარი საჭმელი ნიგვზის გემოთი და სახლის ხასიათით.",
        "ru": "Фасоль с грецкими орехами по-грузински.\nСытная закуска с ореховым вкусом и домашним характером.",
        "en": "Georgian-style beans with walnuts.\nA hearty appetiser with nutty depth and homemade feel.",
    },
    "მწნილი ბოსტნეული": {
        "ka": "მწნილი ბოსტნეულის ასორტი.\nმჟავე და ხრაშუნა — იდეალური კომპანიონი მწვადისა და კუპატისთვის.",
        "ru": "Ассорти маринованных овощей.\nКислинка и хруст — идеальный компаньон к шашлыку и купатам.",
        "en": "Assorted pickled vegetables.\nTangy crunch — the perfect partner for shashlik and kupati.",
    },
    "ქართული ყველის ასორტი": {
        "ka": "ქართული ყველების თეფში.\nსხვადასხვა ჯიში ერთ მიწოდებაში — ღვინოსთან, ჩაისთან ან უბრალოდ ასე.",
        "ru": "Тарелка грузинских сыров.\nРазные сорта в одной подаче — к вину, чаю или просто так.",
        "en": "A platter of Georgian cheeses.\nSeveral varieties in one serving — with tea or on its own.",
    },
    "პური": {
        "ka": "ახალი პური მაგიდაზე.\nრბილი შიგნით — სოუსში ჩასაწვეთებლად და მწვადთან საჭმელად.",
        "ru": "Свежий хлеб к столу.\nМягкий внутри — чтобы макать в соус и есть с шашлыком.",
        "en": "Fresh bread for the table.\nSoft inside — perfect with sauces and shashlik.",
    },
    "ტყემალი": {
        "ka": "კლასიკური ტყემალის სოუსი.\nქლიავის მჟავეტკბილი ნოტა — აუცილებელი მანგალის ხორცთან.",
        "ru": "Классический соус ткемали.\nКисло-сладкая нота сливы — must-have к мясу с мангала.",
        "en": "Classic tkemali sauce.\nSweet-sour plum notes — a must with charcoal meat.",
    },
    "კეტჩუპი": {
        "ka": "კეტჩუპი პორციულ მიწოდებაში.\nჩვეული გემო ფრისთან, ფრთებთან და სოსისებთან.",
        "ru": "Кетчуп в порционной подаче.\nПривычный вкус к фри, крылышкам и сосискам.",
        "en": "Portion ketchup.\nThe familiar match for fries, wings and sausages.",
    },
    "მაიონეზი": {
        "ka": "მაიონეზი პორციულ მიწოდებაში.\nრბილი სოუსი კარტოფილ ფრისა და საჭმელებისთვის.",
        "ru": "Майонез в порционной подаче.\nМягкий соус к картофелю фри и закускам.",
        "en": "Portion mayonnaise.\nA soft sauce for fries and snacks.",
    },
    "შოკოლადის პუდინგი თხილით": {
        "ka": "ნაზი შოკოლადის პუდინგი თხილით.\nმკვრივი კაკაოს გემო და თხილის ხრაშუნა — ტკბილი ვახშმის ფინალი.",
        "ru": "Нежный шоколадный пудинг с фундуком.\nПлотный какао-вкус и хруст орехов — сладкий финал ужина.",
        "en": "Silky chocolate pudding with hazelnuts.\nDeep cocoa and nutty crunch — a sweet finish.",
    },
    "დღის ნამცხვარი": {
        "ka": "დღის სახლის ნამცხვარი სამზარეულოდან.\nრბილი ბისკვიტი და ახალი ცხობა — მოასწარით, სანამ არის.",
        "ru": "Домашний торт дня от кухни.\nМягкий бисквит и свежая выпечка — успейте, пока есть.",
        "en": "Homemade cake of the day.\nSoft sponge and fresh baking — while it lasts.",
    },
    "ნაყინი (ვანილი)": {
        "ka": "ნაზი ვანილის ნაყინი.\nკრემისებრი სიტკბო — მარტივი და საყვარელი დესერტი ვახშმის შემდეგ.",
        "ru": "Нежное ванильное мороженое.\nКремовая сладость — простой и любимый десерт после ужина.",
        "en": "Soft vanilla ice cream.\nCreamy sweetness — a simple favourite after dinner.",
    },
    "ნაყინი (შოკოლადი)": {
        "ka": "მდიდარი შოკოლადის ნაყინი.\nღრმა კაკაოს გემო — მათთვის, ვინც შოკოლადს ირჩევს.",
        "ru": "Насыщенное шоколадное мороженое.\nГлубокий какао-вкус — для тех, кто выбирает шоколад.",
        "en": "Rich chocolate ice cream.\nDeep cocoa flavour — for those who choose chocolate.",
    },
    "კრემი ხილით": {
        "ka": "ჰაეროვანი კრემი ახალი ხილით.\nმსუბუქი სიტკბო და სიახლე — დესერტი სიმძიმის გარეშე.",
        "ru": "Воздушный крем со свежими фруктами.\nЛёгкая сладость и свежесть — десерт без тяжести.",
        "en": "Airy cream with fresh fruit.\nLight sweetness and freshness — dessert without heaviness.",
    },
    "ჩურჩხელა": {
        "ka": "კლასიკური ქართული ჩურჩხელა.\nთხილი ყურძნის გარსში — კავკასიის ტკბილი სუვენირი.",
        "ru": "Классическая грузинская чурчхела.\nОрехи в виноградной оболочке — сладкий сувенир Кавказа.",
        "en": "Classic Georgian churchkhela.\nNuts in grape coating — a sweet taste of the Caucasus.",
    },
    "არაქისი": {
        "ka": "ხრაშუნა შემწვარი არაქისი.\nმარტივი საჭმელი ჩაისთან ან კერძებს შორის.",
        "ru": "Хрустящий жареный арахис.\nПростая закуска к чаю или как перекус между блюдами.",
        "en": "Crispy roasted peanuts.\nA simple snack with tea or between courses.",
    },
    "ესპრესო": {
        "ka": "ძლიერი ესპრესო მკვრივი კრემით.\nმოკლე ენერგიის დარტყმა მწვადის შემდეგ ან საუზმეზე.",
        "ru": "Крепкий эспрессо с плотной крема.\nКороткий удар бодрости после шашлыка или на завтрак.",
        "en": "A strong espresso with dense crema.\nA short boost after the grill or with breakfast.",
    },
    "ამერიკანო": {
        "ka": "კლასიკური ამერიკანო ესპრესოს საფუძველზე.\nუფრო რბილი და მოცულობითი — ნელი ყავის შესვენებისთვის.",
        "ru": "Классический американо на основе эспрессо.\nМягче и объёмнее — для неспешного кофе-брейка.",
        "en": "Classic americano based on espresso.\nMilder and larger — for a slower coffee break.",
    },
    "კაპუჩინო": {
        "ka": "კაპუჩინო ხავერდოვანი რძის ქაფით.\nესპრესოსა და რძის ბალანსი — სითბო ყოველ ფინჯანში.",
        "ru": "Капучино с бархатной молочной пенкой.\nБаланс эспрессо и молока — уют в каждой чашке.",
        "en": "Cappuccino with velvet milk foam.\nEspresso and milk in balance — comfort in every cup.",
    },
    "ქართული შავი ჩაი": {
        "ka": "არომატული ქართული შავი ჩაი.\nძლიერი და გამათბობელი — ხაჭაპურთან, დესერტთან ან უბრალოდ ასე.",
        "ru": "Ароматный грузинский чёрный чай.\nКрепкий и согревающий — к хачапури, десерту или просто так.",
        "en": "Fragrant Georgian black tea.\nStrong and warming — with khachapuri, dessert, or on its own.",
    },
    "ქართული მწვანე ჩაი": {
        "ka": "მსუბუქი ქართული მწვანე ჩაი.\nრბილი გემო სიმძიმის გარეშე — აცივებს გრილის შემდეგ.",
        "ru": "Лёгкий грузинский зелёный чай.\nМягкий вкус без тяжести — освежает после гриля.",
        "en": "Light Georgian green tea.\nSoft and easy — refreshing after the grill.",
    },
    "ქართული ლიმონათი": {
        "ka": "გამაგრილებელი ქართული ლიმონათი.\nნათელი გემო და ყინული — გადარჩენა მესტიაში ცხელ დღეს.",
        "ru": "Освежающий грузинский лимонад.\nЯркий вкус и лёд — спасение в жаркий день в Местии.",
        "en": "Refreshing Georgian lemonade.\nBright flavour and ice — a cool break on a hot Mestia day.",
    },
    "კოკა-კოლა": {
        "ka": "კლასიკური Coca-Cola ყინულით.\nჩვეული გემო მწვადთან, ფრისთან და ფრთებთან.",
        "ru": "Классическая Coca-Cola со льдом.\nПривычный вкус к шашлыку, фри и крылышкам.",
        "en": "Classic Coca-Cola with ice.\nThe familiar match for shashlik, fries and wings.",
    },
    "მინერალური წყალი": {
        "ka": "გაუზავებელი მინერალური წყალი ჭიქაში.\nსუფთა გემო — მსუბუქი და სწორი არჩევანი ნებისმიერ კერძთან.",
        "ru": "Минеральная вода без газа в стакане.\nЧистый вкус — лёгкий и правильный выбор к любому блюду.",
        "en": "Still mineral water served in a glass.\nClean taste — a light match for any dish.",
    },
    "გაზიანი მინერალური წყალი": {
        "ka": "გაზიანი მინერალური წყალი.\nმსუბუქი ბუშტუკები აცივებს და კარგად მიდის ხორცის შემდეგ.",
        "ru": "Газированная минеральная вода.\nЛёгкие пузырьки освежают и хорошо идут после мяса.",
        "en": "Sparkling mineral water.\nLight bubbles that refresh after grilled meat.",
    },
    "წვენი": {
        "ka": "ახალი წვენი პორციაში.\nტკბილი ხილის ნოტა საუზმესთან ან დესერტთან.",
        "ru": "Свежий сок в порции.\nСладкая фруктовая нота к завтраку или десерту.",
        "en": "A serving of juice.\nA sweet fruit note with breakfast or dessert.",
    },
    "კომპოტი": {
        "ka": "სახლის კომპოტი ჩირისგან.\nრბილი სიტკბო და სითბო — როგორც მთის გესთჰაუსში.",
        "ru": "Домашний компот из сухофруктов.\nМягкая сладость и уют — как в гестхаусе в горах.",
        "en": "Homemade dried-fruit kompot.\nGentle sweetness — like a mountain guesthouse drink.",
    },
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
    if isinstance(val, dict):
        return val
    return {"ru": str(val or "")}


def sync_local_json() -> None:
    menu = json.loads(MENU_JSON.read_text(encoding="utf-8"))
    for p in menu["products"]:
        ka = p.get("ka") or ""
        d = KA_BY_NAME.get(ka)
        if not d:
            continue
        p["desc"] = d["ru"]
        p["desc_en"] = d["en"]
        p["desc_ka"] = d["ka"]
    MENU_JSON.write_text(json.dumps(menu, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("local json synced", len(menu["products"]))


def main() -> None:
    user, password = sys.argv[1], sys.argv[2]
    token = login(user, password)
    rests = api("GET", "/restaurants/", token)
    bbq = next(r for r in rests if "bbq" in str(r.get("name", "")).lower())
    rid = bbq["id"]
    products = api("GET", f"/products?restaurant_id={rid}", token)

    ok = fail = skip = 0
    missing: list[str] = []
    for p in products:
        nj = parse_field(p.get("name"))
        ka = nj.get("ka") or ""
        d = KA_BY_NAME.get(ka)
        if not d:
            missing.append(ka or nj.get("ru") or p.get("id"))
            skip += 1
            continue
        body = {
            "restaurant_id": rid,
            "name": json.dumps(nj, ensure_ascii=False),
            "description": json.dumps(d, ensure_ascii=False),
            "price": float(p.get("price") or 0),
            "img": p.get("img") or "/Assets/default-food.png",
            "category": p.get("category") or "",
            "weight": p.get("weight") or "",
            "calories": str(p.get("calories") or "0"),
            "proteins": str(p.get("proteins") or "0"),
            "fats": str(p.get("fats") or "0"),
            "carbs": str(p.get("carbs") or "0"),
            "ingredients": p.get("ingredients") or "",
            "is_available": True,
        }
        try:
            api("PUT", f"/products/{p['id']}", token, body)
            ok += 1
            print("UPD", nj.get("ru") or ka)
        except Exception as ex:
            fail += 1
            print("FAIL", nj.get("ru") or ka, ex)

    sync_local_json()
    print(json.dumps({"updated": ok, "fail": fail, "skip": skip, "missing": missing}, ensure_ascii=False))


if __name__ == "__main__":
    main()
