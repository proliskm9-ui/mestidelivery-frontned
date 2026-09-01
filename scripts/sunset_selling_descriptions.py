# -*- coding: utf-8 -*-
"""Selling (marketing) descriptions for Sunset Restaurant products.

DESCRIPTIONS is keyed by the exact Georgian ("ka") product name as it
appears in sunset_menu.json. Each entry has "ka" / "ru" / "en" selling
copy, at least two lines each (joined with \\n), written in an
appetizing, BBQ-Garden-style marketing tone while keeping authentic
Georgian food knowledge (khinkali broth, chkmeruli garlic-cream sauce,
kubdari spices, tashmijabi stretchy cheese, etc.).

apply_to_menu_json() rewrites desc / desc_en / desc_ka for every
product in sunset_menu.json using this dictionary and saves the file
back in place. Product names (ka/ru/en) are never touched.
"""
from __future__ import annotations

import json
from pathlib import Path

MENU_PATH = Path(__file__).resolve().parent / "sunset_menu.json"

DESCRIPTIONS: dict[str, dict[str, str]] = {
    # --- Закуски / Starters ---
    "პური": {
        "ka": "ცხელი, ახლად გამომცხვარი პური სუფრაზე.\nხრაშუნა ქერქი და რბილი გული — საუკეთესო თანხლება ნებისმიერი კერძისთვის.",
        "ru": "Тёплый, свежеиспечённый хлеб к столу.\nХрустящая корочка и мягкий мякиш — лучшее дополнение к любому блюду.",
        "en": "Warm, freshly baked bread for the table.\nCrisp crust and a soft centre — the perfect companion to any dish.",
    },
    "მწნილის ასორტი": {
        "ka": "სახლური მწნილის ასორტი ხრაშუნა ბოსტნეულით.\nმჟავე და საამო გემო, რომელიც მადას აღძრავს სვანურ სუფრაზე.",
        "ru": "Домашнее ассорти солёных овощей с приятной хрусткостью.\nКислинка пробуждает аппетит перед основными блюдами.",
        "en": "Homestyle assortment of crunchy pickled vegetables.\nA tangy bite that awakens the appetite before the main course.",
    },
    "სულგუნი": {
        "ka": "ახალი ქართული სულგუნი ნაზი, ელასტიური ტექსტურით.\nოდნავ მარილიანი გემო, რომელიც კარგად მიდის ღვინოსთან და პურთან.",
        "ru": "Свежий грузинский сыр сулугуни с нежной эластичной текстурой.\nЛёгкая солоноватость прекрасно сочетается с вином и хлебом.",
        "en": "Fresh Georgian suluguni cheese with a soft, elastic texture.\nA gently salty flavour that pairs beautifully with wine and bread.",
    },
    "ფრი": {
        "ka": "ხრაშუნა კარტოფილი ფრი ოქროსფერ ქერქამდე შემწვარი.\nცხელი და მარილიანი — საყვარელი გარნირი ყველასთვის.",
        "ru": "Хрустящий картофель фри, обжаренный до золотистой корочки.\nГорячий и в меру солёный — любимый гарнир для всех.",
        "en": "Crispy French fries fried to a golden crust.\nHot and lightly salted — a favourite side for everyone.",
    },
    "ყველის დაფა": {
        "ka": "სხვადასხვა ქართული ყველის ასორტი ერთ დაფაზე.\nსხვადასხვა გემო და ტექსტურა — შესანიშნავია ღვინოსთან ერთად.",
        "ru": "Ассорти разных грузинских сыров на одной тарелке.\nРазнообразие вкусов и текстур — отлично подходит к вину.",
        "en": "An assortment of different Georgian cheeses on one board.\nVaried flavours and textures — a wonderful match for wine.",
    },
    # --- Салаты / Salads ---
    "კიტრი-პომიდვრის სალათი ოჯახურად": {
        "ka": "ახალი კიტრი და მომწიფებული პომიდორი სახლურად დაჭრილი.\nმსუბუქი და გამაგრილებელი სალათი — ქართული სუფრის კლასიკა.",
        "ru": "Свежие огурцы и спелые помидоры, нарезанные по-домашнему.\nЛёгкий освежающий салат — классика грузинского стола.",
        "en": "Fresh cucumbers and ripe tomatoes cut homestyle.\nA light, refreshing salad — a classic of the Georgian table.",
    },
    "კიტრი-პომიდვრის სალათი ნიგვზით": {
        "ka": "ბოსტნეულის სალათი კიტრითა და პომიდვრით ნიგვზის საწებელით.\nსიახლე და ნიგვზის სიმდიდრე ერთად — გემო, რომელსაც ძნელად ივიწყებ.",
        "ru": "Овощной салат из огурцов и помидоров с ореховой заправкой.\nСвежесть овощей и ореховая насыщенность в одной тарелке.",
        "en": "A vegetable salad of cucumbers and tomatoes with walnut dressing.\nFreshness and nutty richness together — a flavour hard to forget.",
    },
    "ცეზარი ქათმით": {
        "ka": "კლასიკური ცეზარის სალათი ქათმის ხორცით და ხრაშუნა კრუტონებით.\nსაკმაოდ მაძღარი და დახვეწილი — საყვარელი არჩევანი ლანჩზე.",
        "ru": "Классический салат «Цезарь» с курицей и хрустящими крутонами.\nСытный и в меру пикантный — отличный выбор на обед.",
        "en": "Classic Caesar salad with chicken and crunchy croutons.\nHearty and pleasantly savoury — a great lunchtime choice.",
    },
    "ბერძნული სალათი": {
        "ka": "ახალი ბერძნული სალათი ფეტა ყველითა და ზეითუნით.\nზაფხულის ფერები და ხმელთაშუაზღვური მსუბუქი გემო.",
        "ru": "Свежий греческий салат с сыром фета и оливками.\nЛетние краски и лёгкий средиземноморский вкус.",
        "en": "Fresh Greek salad with feta cheese and olives.\nSummer colours and a light Mediterranean flavour.",
    },
    "მწვანე სალათი": {
        "ka": "მსუბუქი მწვანე სალათი ხრაშუნა ფოთლებით.\nსუფთა და ბუნებრივი გემო — შესანიშნავი დანამატი ნებისმიერ კერძთან.",
        "ru": "Лёгкий зелёный салат из хрустящих листьев.\nЧистый, натуральный вкус — отличное дополнение к любому блюду.",
        "en": "A light green salad of crisp leaves.\nA clean, natural flavour — a great addition to any dish.",
    },
    "ქათმის სალათი": {
        "ka": "გამაძღარი სალათი ქათმის ხორცითა და ახალი ბოსტნეულით.\nსრულფასოვანი კერძი, რომელიც კარგად ერგება მსუბუქ სადილს.",
        "ru": "Сытный салат с курицей и свежими овощами.\nПолноценное блюдо, отлично подходящее для лёгкого обеда.",
        "en": "A hearty salad with chicken and fresh vegetables.\nA well-rounded dish, perfect for a light meal.",
    },
    "ბადრიჯანი ნიგვზის სატენით": {
        "ka": "შემწვარი ბადრიჯანი სქელი ნიგვზის სატენით შევსებული.\nერთ-ერთი ყველაზე საყვარელი ცივი ქართული კერძი.",
        "ru": "Обжаренные баклажаны с густой ореховой начинкой.\nОдна из самых любимых холодных закусок грузинской кухни.",
        "en": "Fried eggplant filled with a rich walnut paste.\nOne of the most beloved cold appetisers of Georgian cuisine.",
    },
    "ბადრიჯანი ნივრით": {
        "ka": "ბადრიჯანი ნიორითა და მწვანილით ქართულად მომზადებული.\nცხარე და არომატული — შესანიშნავია ღვინოსთან.",
        "ru": "Баклажаны с чесноком и зеленью по-грузински.\nОстро и ароматно — отлично сочетается с вином.",
        "en": "Eggplant with garlic and herbs, prepared Georgian style.\nSpicy and aromatic — pairs wonderfully with wine.",
    },
    "ლობიოს და სიმინდის სალათი": {
        "ka": "ფერადი სალათი ლობიოთი და ტკბილი სიმინდით.\nმაძღარი და გემრიელი — შესანიშნავია ცალკე ან გარნირად.",
        "ru": "Яркий салат из фасоли и сладкой кукурузы.\nСытный и вкусный — хорош как отдельное блюдо или гарнир.",
        "en": "A colourful salad of beans and sweet corn.\nFilling and flavourful — great on its own or as a side.",
    },
    "კინოას სალათი ბოსტნეულით": {
        "ka": "მსუბუქი კინოას სალათი ახალი ბოსტნეულით.\nჯანსაღი და გამაცოცხლებელი არჩევანი მათთვის, ვინც სიმსუბუქეს ეძებს.",
        "ru": "Лёгкий салат из киноа со свежими овощами.\nПолезный и бодрящий выбор для тех, кто ищет лёгкость.",
        "en": "A light quinoa salad with fresh vegetables.\nA healthy, refreshing choice for those seeking something lighter.",
    },
    "კუსკუსის სალათი": {
        "ka": "კუსკუსის სალათი ახალი ბოსტნეულითა და მწვანილით.\nმსუბუქი მარცვლეულის ბაზაზე — გემრიელი და გამაძღარი.",
        "ru": "Салат из кускуса со свежими овощами и зеленью.\nНа основе лёгкой крупы — вкусно и сытно.",
        "en": "Couscous salad with fresh vegetables and herbs.\nBuilt on light grains — tasty and satisfying.",
    },
    # --- Супы / Soups ---
    "სუპ-ხარჩო": {
        "ka": "გამაძღარი ხარჩო ბრინჯით, სანელებლებითა და მწვანილით.\nცხარე, არომატული ბულიონი — ქართული სუფრის გული.",
        "ru": "Наваристый харчо с рисом, специями и свежей зеленью.\nОстрый ароматный бульон — сердце грузинского стола.",
        "en": "Hearty kharcho with rice, spices and fresh herbs.\nA spicy, fragrant broth at the heart of the Georgian table.",
    },
    "ბოსტნეულის წვნიანი": {
        "ka": "მსუბუქი სუპი სეზონური ბოსტნეულით.\nსუფთა, ბუნებრივი გემო — თბილი და გამაძღარი, სიმძიმის გარეშე.",
        "ru": "Лёгкий суп из сезонных овощей.\nЧистый натуральный вкус — тёплый и сытный, но без тяжести.",
        "en": "A light soup of seasonal vegetables.\nA clean, natural flavour — warm and filling without heaviness.",
    },
    "ბოსტნეულის კრემ-სუპი": {
        "ka": "ნაზი ბოსტნეულის კრემ-სუპი ხავერდოვანი ტექსტურით.\nთბილი და დამამშვიდებელი კერძი ნებისმიერ დღეს.",
        "ru": "Нежный крем-суп из овощей с бархатистой текстурой.\nТёплое и успокаивающее блюдо на любой день.",
        "en": "Delicate cream of vegetable soup with a velvety texture.\nA warm, comforting dish for any day.",
    },
    "სოკოს წვნიანი": {
        "ka": "არომატული სოკოს სუპი ღრმა, ტყის გემოთი.\nთბილი კერძი, რომელიც ათბობს ცივ დღეს.",
        "ru": "Ароматный грибной суп с глубоким лесным вкусом.\nТёплое блюдо, согревающее в прохладный день.",
        "en": "Aromatic mushroom soup with a deep forest flavour.\nA warming dish, perfect on a cool day.",
    },
    "სოკოს კრემ-სუპი": {
        "ka": "ხავერდოვანი სოკოს კრემ-სუპი რბილი ტექსტურით.\nსოკოს მდიდარი გემო თითოეულ კოვზში.",
        "ru": "Бархатистый крем-суп из грибов с мягкой текстурой.\nНасыщенный грибной вкус в каждой ложке.",
        "en": "Velvety cream of mushroom soup with a soft texture.\nA rich mushroom flavour in every spoonful.",
    },
    "ჩიხირთმა": {
        "ka": "ნაზი ქათმის სუპი კვერცხითა და ლიმონით გასქელებული.\nქართული სამზარეულოს კლასიკური, დამამშვიდებელი კერძი.",
        "ru": "Нежный куриный суп, загущённый яйцом и лимоном.\nКлассическое, успокаивающее блюдо грузинской кухни.",
        "en": "Delicate chicken soup thickened with egg and lemon.\nA classic, comforting dish of Georgian cuisine.",
    },
    "ბორში (საქონლის ხორცით)": {
        "ka": "კლასიკური ბორში საქონლის ხორცით, მდიდარი ფერითა და გემოთი.\nცხლად მიირთმევა — ათბობს და კარგად ერწყმის პურს.",
        "ru": "Классический борщ с говядиной насыщенного цвета и вкуса.\nПодаём горячим — согревает и отлично сочетается с хлебом.",
        "en": "Classic borscht with beef, rich in colour and flavour.\nServed hot — warming and perfect alongside fresh bread.",
    },
    "გოგრის კრემ სუპი": {
        "ka": "ნაზი გოგრის კრემ-სუპი ხავერდოვანი, ოდნავ ტკბილი გემოთი.\nთბილი და საამო კერძი შემოდგომის სულისკვეთებით.",
        "ru": "Нежный крем-суп из тыквы с бархатистой, слегка сладковатой ноткой.\nТёплое, уютное блюдо с осенним настроением.",
        "en": "Delicate pumpkin cream soup with a velvety, faintly sweet note.\nA warm, cosy dish with an autumn spirit.",
    },
    # --- Сванские блюда / Svan dishes ---
    "თაშმიჯაბი (კარტოფილი ყველით)": {
        "ka": "კარტოფილის პიურე ყველით გაწელილი — სვანური კლასიკა.\nცხელი, წებოვანი და უსასრულოდ მაძღარი კერძი.",
        "ru": "Картофельное пюре, растянутое с сыром — сванская классика.\nГорячее, тягучее и невероятно сытное блюдо.",
        "en": "Mashed potato stretched with cheese — a Svan classic.\nHot, stretchy, and endlessly satisfying.",
    },
    "ჭვიშტარი (სიმინდი ყველით)": {
        "ka": "სიმინდის ჭვიშტარი ყველით შიგნით — გარედან ხრაშუნა, შიგნით წებოვანი.\nსვანური სამზარეულოს საყვარელი ცხელი კერძი.",
        "ru": "Кукурузные лепёшки с сыром внутри — хрустящие снаружи, тягучие внутри.\nЛюбимое горячее блюдо сванской кухни.",
        "en": "Corn cakes with cheese inside — crisp outside, gooey within.\nA beloved hot dish of Svan cuisine.",
    },
    "ჭვიშტარი ფეტვით (ფეტვი ყველით)": {
        "ka": "ჭვიშტარი სვანური ფეტვითა და ყველით — უფრო ავთენტიკური გემო.\nიშვიათი ადგილობრივი კერძი, რომელსაც მხოლოდ სვანეთში დააგემოვნებთ.",
        "ru": "Чвиштари со сванским просом и сыром — ещё более аутентичный вкус.\nРедкое местное блюдо, которое стоит попробовать именно в Сванетии.",
        "en": "Chvishtari with Svan millet and cheese — an even more authentic flavour.\nA rare local dish best tasted right here in Svaneti.",
    },
    "კუბდარი": {
        "ka": "სვანური კუბდარი სანელებლებით სავსე — სვანეთის სავიზიტო ბარათი.\nხორცის წვნიანი გულსართი ცხელ, არომატულ ცომში.",
        "ru": "Сванский мясной пирог со специями — визитная карточка Сванетии.\nСочная мясная начинка в горячем ароматном тесте.",
        "en": "Svan meat pie packed with spices — the calling card of Svaneti.\nA juicy meat filling in hot, fragrant dough.",
    },
    "ფეტვიანი ხაჭაპური": {
        "ka": "ხაჭაპური ფეტვით — სვანეთის ადგილობრივი, იშვიათი გემო.\nყველისა და სვანური ფეტვის ჰარმონია ცხელ ცომში.",
        "ru": "Хачапури с просом — редкий местный вкус Сванетии.\nГармония сыра и сванского проса в горячем тесте.",
        "en": "Khachapuri with millet — a rare local flavour of Svaneti.\nA harmony of cheese and Svan millet in hot dough.",
    },
    "სვანური სამეფო ხაჭაპური": {
        "ka": "დიდი სვანური ხაჭაპური ფეტვით — სამეფო ფორმატი დიდი კომპანიისთვის.\nუხვი ყველი და ცომი, რომელიც კარგად ჯერდება ყველას.",
        "ru": "Большой сванский хачапури с просом — королевский формат для большой компании.\nЩедрая сырная начинка и тесто, которого хватит на всех.",
        "en": "A large Svan khachapuri with millet — the royal size for a big table.\nGenerous cheese and dough, plenty for everyone to share.",
    },
    # --- Горячее / Mains ---
    "შემწვარი ქათამი": {
        "ka": "წვნიანი შემწვარი ქათამი ოქროსფერი ქერქით.\nხრაშუნა გარედან, ნაზი და წვნიანი შიგნით.",
        "ru": "Сочная жареная курица с золотистой корочкой.\nХрустящая снаружи, нежная и сочная внутри.",
        "en": "Juicy fried chicken with a golden crust.\nCrispy outside, tender and juicy inside.",
    },
    "შემწვარი ქათამი აჯიკით": {
        "ka": "შემწვარი ქათამი ცხარე აჯიკის სოუსით.\nცეცხლოვანი გემო მათთვის, ვისაც ცხარე კერძები უყვარს.",
        "ru": "Жареная курица с острым соусом аджика.\nОгненный вкус для тех, кто любит поострее.",
        "en": "Fried chicken with fiery adjika sauce.\nA bold, spicy kick for those who like it hot.",
    },
    "ქათამი ჩქოერულად": {
        "ka": "ქათამი ნაღებისა და ნიორის მდიდარ სოუსში.\nრაჭული ლეგენდარული კერძი, რომელსაც სტუმრები ისევ და ისევ უკვეთავენ.",
        "ru": "Курица в насыщенном сливочно-чесночном соусе.\nЛегендарное рачинское блюдо, которое гости заказывают снова и снова.",
        "en": "Chicken in a rich creamy garlic sauce.\nA legendary Racha dish that guests keep coming back for.",
    },
    "საქონლის ხორცის ჩაშუშული": {
        "ka": "საქონლის ხორცი ნელა, რბილობამდე ჩაშუშული.\nმდიდარი სოუსი და ნაზი ხორცი — სახლის სითბოთი.",
        "ru": "Говядина, медленно тушённая до мягкости.\nНасыщенный соус и нежное мясо — с домашним теплом.",
        "en": "Beef slow-stewed until tender.\nA rich sauce and soft meat — with homely warmth.",
    },
    "ხორცის ჩაშუშული თაშმუჯაბით": {
        "ka": "ჩაშუშული ხორცი წვნიან თაშმიჯაბთან ერთად მიწოდებული.\nხორცის სისავსე და ყველიანი პიურეს ნაზი ტექსტურა ერთ თეფშზე.",
        "ru": "Тушёное мясо, поданное вместе с сочным ташмиджаби.\nСытность мяса и нежная сырная текстура пюре в одной тарелке.",
        "en": "Stewed meat served alongside rich, cheesy tashmijabi.\nHearty meat and the soft, cheesy texture of mashed potato on one plate.",
    },
    "საქონლის ხორცის ხაშლამა": {
        "ka": "მოხარშული საქონლის ხორცი ბოსტნეულით არომატულ ბულიონში.\nმარტივი და ძალიან გამაძღარი კერძი მთის ტრადიციებით.",
        "ru": "Отварная говядина с овощами в ароматном бульоне.\nПростое и очень сытное блюдо с горскими традициями.",
        "en": "Boiled beef with vegetables in an aromatic broth.\nA simple, deeply satisfying dish rooted in mountain tradition.",
    },
    "ღორის მწვადი": {
        "ka": "ღორის მწვადი — მომწვარი, წვნიანი და ნახშირის არომატით გაჯერებული.\nსვანური სუფრის კლასიკური მთავარი კერძი.",
        "ru": "Шашлык из свинины — румяный, сочный, с ароматом углей.\nКлассическое главное блюдо сванского застолья.",
        "en": "Pork mtsvadi — browned, juicy, and infused with charcoal aroma.\nA classic centrepiece of any Svan feast.",
    },
    "ღორის ნეკნი": {
        "ka": "წვნიანი ღორის ნეკნები რბილ, ძვალზე ჩამოცლილ ხორცით.\nმდიდარი გემო, რომელიც ხელით ჭამას ითხოვს.",
        "ru": "Сочные свиные рёбра с мясом, которое легко отходит от кости.\nНасыщенный вкус, который так и просит есть руками.",
        "en": "Juicy pork ribs with meat that falls off the bone.\nA rich flavour that practically begs to be eaten with your hands.",
    },
    "თევზი ბოსტნეულის სალათით (კალმახი)": {
        "ka": "ნაზი კალმახი ახალი ბოსტნეულის სალათთან ერთად.\nმსუბუქი და დახვეწილი კერძი მთის მდინარეების გემოთი.",
        "ru": "Нежная форель со свежим овощным салатом.\nЛёгкое и изысканное блюдо со вкусом горных рек.",
        "en": "Tender trout served with a fresh vegetable salad.\nA light, refined dish with the taste of mountain rivers.",
    },
    "სოკოს ჩაშუშული ბოსტნეულით": {
        "ka": "სოკო ჩაშუშული ბოსტნეულთან ერთად, არომატულ სოუსში.\nმსუბუქი, ვეგეტარიანული კერძი მდიდარი გემოთი.",
        "ru": "Грибы, тушённые с овощами в ароматном соусе.\nЛёгкое вегетарианское блюдо с насыщенным вкусом.",
        "en": "Mushrooms stewed with vegetables in an aromatic sauce.\nA light vegetarian dish with a rich, deep flavour.",
    },
    "ქათმის ღვიძლი კეცზე": {
        "ka": "ქათმის ღვიძლი ცხელ კეცზე მომზადებული.\nნაზი ტექსტურა და მდიდარი გემო ცხელ თიხის ჭურჭელში.",
        "ru": "Куриная печень, приготовленная на горячем кеци.\nНежная текстура и насыщенный вкус в горячей глиняной посуде.",
        "en": "Chicken liver cooked on a hot ketsi (clay dish).\nA tender texture and rich flavour, served sizzling hot.",
    },
    "ქათმის მწვადი ბრინჯის გარნირით": {
        "ka": "ქათმის მწვადი ბრინჯის გარნირით — სრულფასოვანი, მარტივი კერძი.\nნაზი ხორცი და მსუბუქი გარნირი ერთ თეფშზე.",
        "ru": "Куриный шашлык с гарниром из риса — простое и полноценное блюдо.\nНежное мясо и лёгкий гарнир в одной тарелке.",
        "en": "Chicken barbecue with a rice side — a simple, complete meal.\nTender meat and a light side, all on one plate.",
    },
    "აჯაფსანდალი": {
        "ka": "ბოსტნეულის ჩაშუშული ბადრიჯნით, წიწაკითა და პომიდვრით.\nკავკასიის ზაფხულის გემო, ცხელადაც და ცივადაც გემრიელი.",
        "ru": "Овощное рагу из баклажанов, перца и томатов.\nВкус кавказского лета — вкусно как горячим, так и холодным.",
        "en": "A vegetable stew of eggplant, pepper and tomatoes.\nThe taste of a Caucasian summer — delicious hot or cold.",
    },
    "ლობიო ქოთანში": {
        "ka": "ლობიო ქართულად ქოთანში, სანელებლებით გაჯერებული.\nსახლური, მარტივი და ძალიან დამახასიათებელი კერძი.",
        "ru": "Фасоль по-грузински в горшочке, насыщенная специями.\nДомашнее, простое и очень характерное блюдо.",
        "en": "Georgian-style beans in a pot, infused with spices.\nA homely, simple, and deeply characteristic dish.",
    },
    "ლობიო ქოთანში ნიგვზით": {
        "ka": "ლობიო ქოთანში ნიგვზით — ორეხის სიმდიდრით გაძლიერებული.\nმაძღარი და არომატული, ცხელი პურით საუკეთესო წყვილი.",
        "ru": "Лобио в горшочке с грецкими орехами — усиленное ореховой насыщенностью.\nСытное и ароматное, лучше всего с горячим хлебом.",
        "en": "Beans in a pot with walnuts — enriched with nutty depth.\nHearty and aromatic, best paired with warm bread.",
    },
    "ოჯახური კეცზე (კარტოფილი და ღორის ხორცი)": {
        "ka": "ოჯახური ღორის ხორცითა და კარტოფილით, ცხელ კეცზე მომზადებული.\nსახლის სტილის კერძი, რომელიც სუფრას მაძღარსა და გამაერთიანებელს ხდის.",
        "ru": "Оджахури из свинины с картофелем, приготовленное на горячем кеци.\nБлюдо в домашнем стиле, объединяющее сытость и уют застолья.",
        "en": "Ojakhuri of pork and potatoes, cooked on a sizzling ketsi.\nA home-style dish that brings hearty comfort to the table.",
    },
    "კარბონარა": {
        "ka": "პასტა კარბონარა კრემისებრი სოუსით და ხრაშუნა ბეკონით.\nიტალიური კლასიკა, რომელიც ყოველთვის მაძღარსა და საამო შეგრძნებას ტოვებს.",
        "ru": "Паста карбонара с кремовым соусом и хрустящим беконом.\nИтальянская классика, которая всегда оставляет сытое, приятное послевкусие.",
        "en": "Carbonara pasta with a creamy sauce and crispy bacon.\nAn Italian classic that always leaves a satisfying finish.",
    },
    "ბოლონეზე": {
        "ka": "პასტა ბოლონეზე მდიდარი ხორცის სოუსით.\nკლასიკური, გამაძღარი კერძი, რომელსაც ყველა სიამოვნებით მიირთმევს.",
        "ru": "Паста болоньезе с насыщенным мясным соусом.\nКлассическое сытное блюдо, которое любят все.",
        "en": "Bolognese pasta with a rich meat sauce.\nA classic, hearty dish that everyone enjoys.",
    },
    # --- Выпечка / Bakery ---
    "იმერული ხაჭაპური": {
        "ka": "მრგვალი იმერული ხაჭაპური ნაზი ყველის გულსართით.\nოქროსფერი ცომი და გამდნარი ყველი — ხაჭაპურის კლასიკური ფორმა.",
        "ru": "Круглый имеретинский хачапури с нежной сырной начинкой.\nЗолотистое тесто и расплавленный сыр — классическая форма хачапури.",
        "en": "Round Imeretian khachapuri with a soft cheese filling.\nGolden dough and melted cheese — the classic khachapuri shape.",
    },
    "მეგრული ხაჭაპური": {
        "ka": "მეგრული ხაჭაპური ყველით შიგნით და ზემოდან — იმერულზე გამაძღარიც კი.\nორმაგი ყველის ფენა ყოველ ნაჭერს განსაკუთრებულს ხდის.",
        "ru": "Мегрельский хачапури с сыром внутри и сверху — ещё сытнее имеретинского.\nДвойной слой сыра делает каждый кусок особенным.",
        "en": "Megrelian khachapuri with cheese inside and on top — even richer than Imeretian.\nA double layer of cheese makes every bite special.",
    },
    "მჭადი": {
        "ka": "სიმინდის მჭადი ოქროსფრად შემწვარი.\nმარტივი და საყვარელი ლეპტი — იდეალურია ლობიოსა და ყველთან.",
        "ru": "Кукурузная лепёшка мчади, обжаренная до золотистого цвета.\nПростая и любимая лепёшка — идеальна с лобио и сыром.",
        "en": "Corn flatbread mchadi, fried to a golden colour.\nA simple, beloved bread — perfect with lobio and cheese.",
    },
    "ლობიანი": {
        "ka": "ლობიანი ლობიოს ნაზი გულსართით ცხელ ცომში.\nგამაძღარი, სახლური გემო — შესანიშნავია ცხელი ჩაისთან.",
        "ru": "Лобиани с нежной фасолевой начинкой в горячем тесте.\nСытный домашний вкус — отлично сочетается с горячим чаем.",
        "en": "Lobiani with a soft bean filling in warm dough.\nA hearty, homely flavour — wonderful with hot tea.",
    },
    "ხინკალი": {
        "ka": "წვნიანი ხინკალი — ცომის კონუსში ჩაბმული არომატული წვენი და ხორცი.\nჭამეთ ხელით, ზედა კვანძი დატოვეთ და წვენი შიგნით შეინარჩუნეთ.",
        "ru": "Сочные хинкали — ароматный бульон и мясо, спрятанные в тесте.\nЕшьте руками, оставляя «хвостик», чтобы сохранить весь сок внутри.",
        "en": "Juicy khinkali — fragrant broth and meat sealed inside the dough.\nEat by hand, leave the knot, and keep every drop of the broth inside.",
    },
    "ყველის ხინკალი": {
        "ka": "ხინკალი გამდნარი ყველის გულსართით.\nცხელი, წებოვანი და ძალიან საყვარელი ვეგეტარიანული ვარიანტი.",
        "ru": "Хинкали с начинкой из расплавленного сыра.\nГорячий, тягучий и очень любимый вегетарианский вариант.",
        "en": "Khinkali filled with melted cheese.\nHot, stretchy, and a much-loved vegetarian option.",
    },
    "პიცა პეპერონი": {
        "ka": "პიცა ცხარე პეპერონისა და გამდნარი ყველით.\nხრაშუნა ცომი და მდიდარი გემო ერთ ნაჭერში.",
        "ru": "Пицца с острой пепперони и расплавленным сыром.\nХрустящее тесто и насыщенный вкус в каждом кусочке.",
        "en": "Pizza with spicy pepperoni and melted cheese.\nCrispy dough and bold flavour in every slice.",
    },
    "პიცა სოკოთი,ყველით და ბოსტნეულით": {
        "ka": "პიცა სოკოთი, ყველითა და ახალი ბოსტნეულით.\nსანელებლებით სავსე, ფერადი და ვეგეტარიანელებისთვისაც შესაფერისი.",
        "ru": "Пицца с грибами, сыром и свежими овощами.\nЯркая и ароматная — подходит и для вегетарианцев.",
        "en": "Pizza with mushrooms, cheese and fresh vegetables.\nColourful and fragrant — a great choice for vegetarians too.",
    },
    "პიცა მარგარიტა": {
        "ka": "კლასიკური პიცა პომიდვრითა და გამდნარი ყველით.\nმარტივი, მაგრამ სრულყოფილი გემოვნური ბალანსი.",
        "ru": "Классическая пицца с томатами и расплавленным сыром.\nПростой, но безупречный баланс вкуса.",
        "en": "Classic pizza with tomatoes and melted cheese.\nSimple, yet a perfectly balanced flavour.",
    },
    # --- Гарниры / Sides ---
    "კარტოფილი ოჯახურად": {
        "ka": "კარტოფილი სახლისებურად, ბოლომდე შემწვარი.\nმარტივი გარნირი, რომელიც ყველა მთავარ კერძს ერგება.",
        "ru": "Картофель по-домашнему, обжаренный до румяной корочки.\nПростой гарнир, который подходит к любому основному блюду.",
        "en": "Homestyle potatoes, fried to a golden finish.\nA simple side that pairs well with any main dish.",
    },
    "ბრინჯი": {
        "ka": "ჰაეროვანი ბრინჯის გარნირი, ცალკეულ მარცვლებად მოხარშული.\nნეიტრალური და მსუბუქი — იდეალურია სოუსიან კერძებთან.",
        "ru": "Воздушный рассыпчатый рис — гарнир из отдельных зёрен.\nНейтральный и лёгкий — идеален с блюдами в соусе.",
        "en": "Light, fluffy rice with each grain separate.\nNeutral and easy — ideal alongside saucy dishes.",
    },
    "სპაგეტი": {
        "ka": "სპაგეტის გარნირი, სწორად მოხარშული ტექსტურით.\nუნივერსალური არჩევანი, რომელიც ნებისმიერ სოუსს იმეორებს.",
        "ru": "Гарнир из спагетти правильной текстуры al dente.\nУниверсальный выбор, который прекрасно сочетается с любым соусом.",
        "en": "Spaghetti side cooked to the right texture.\nA versatile choice that works beautifully with any sauce.",
    },
    "წიწიბურა ბოსტნეულით": {
        "ka": "წიწიბურა ახალ ბოსტნეულთან ერთად, მსუბუქად შემწვარი.\nჯანსაღი და გამაძღარი გარნირი მარცვლეულის ბუნებრივი გემოთი.",
        "ru": "Гречка со свежими овощами, слегка обжаренная.\nПолезный и сытный гарнир с натуральным вкусом крупы.",
        "en": "Buckwheat with fresh vegetables, lightly sautéed.\nA healthy, filling side with the natural flavour of the grain.",
    },
    # --- Соусы / Sauces ---
    "ტყემალი": {
        "ka": "მჟავე ქლიავის ტყემალი — აუცილებელი თანხლება ხორცთან და ხინკალთან.\nმჟავე-ტკბილი ბალანსი, რომელიც ცომსა და ხორცს აცოცხლებს.",
        "ru": "Кислый сливовый соус ткемали — незаменимый спутник мяса и хинкали.\nКисло-сладкий баланс, который оживляет любое блюдо.",
        "en": "Sour plum tkemali sauce — an essential match for meat and khinkali.\nA sweet-and-sour balance that brings any dish to life.",
    },
    "პომიდვრის საწებელი": {
        "ka": "პომიდვრის საწებელი მწვანილითა და სანელებლებით.\nმდიდარი, არომატული სოუსი, რომელიც კარგად ერწყმის ხორცსა და პასტას.",
        "ru": "Томатный соус с зеленью и специями.\nНасыщенный ароматный соус, отлично сочетающийся с мясом и пастой.",
        "en": "Tomato sauce with herbs and spices.\nA rich, fragrant sauce that pairs well with meat and pasta.",
    },
    "კეტჩუპი": {
        "ka": "კლასიკური კეტჩუპი პორციულ მიწოდებაში.\nჩვეული, ტკბილ-მჟავე გემო ფრისა და მწვადისთვის.",
        "ru": "Классический кетчуп в порционной подаче.\nПривычный кисло-сладкий вкус к фри и шашлыку.",
        "en": "Classic ketchup in a portion serving.\nThe familiar sweet-and-sour match for fries and grilled meat.",
    },
    "არაჟანი": {
        "ka": "ნაზი არაჟანი, კრემისებრი და ოდნავ მჟავე გემოთი.\nსრულყოფს ცხელ კერძებსა და გამომცხვარ პურეულს.",
        "ru": "Нежная сметана с кремовой текстурой и лёгкой кислинкой.\nОтлично дополняет горячие блюда и выпечку.",
        "en": "Smooth sour cream with a creamy texture and a light tang.\nA perfect finishing touch for hot dishes and pastries.",
    },
    "ნიგვზის ბაჟე": {
        "ka": "ნიგვზის ბაჟე — მდიდარი ორეხის სოუსი ნიორისა და სანელებლების ნოტით.\nქართული სამზარეულოს ერთ-ერთი ყველაზე დამახასიათებელი გემო.",
        "ru": "Соус баже — насыщенный ореховый соус с нотками чеснока и специй.\nОдин из самых характерных вкусов грузинской кухни.",
        "en": "Walnut bazhe sauce — a rich nutty sauce with hints of garlic and spice.\nOne of the most distinctive flavours of Georgian cuisine.",
    },
    # --- Напитки / Drinks ---
    "Coca-cola 0.5 L": {
        "ka": "კლასიკური Coca-Cola 0.5 ლიტრი, ცივად მიწოდებული.\nჩვეული, გამაგრილებელი გემო ნებისმიერ კერძთან.",
        "ru": "Классическая Coca-Cola 0.5 л, подаётся охлаждённой.\nПривычный освежающий вкус к любому блюду.",
        "en": "Classic Coca-Cola 0.5 L, served chilled.\nThe familiar refreshing taste to go with any meal.",
    },
    "Borjomi 0.5": {
        "ka": "ბუნებრივი მინერალური წყალი ბორჯომი 0.5 ლიტრი.\nცნობილი ქართული წყარო — სუფთა გემო და გამაგრილებელი ბუშტუკები.",
        "ru": "Природная минеральная вода Боржоми 0.5 л.\nЗнаменитый грузинский источник — чистый вкус и освежающие пузырьки.",
        "en": "Natural mineral water Borjomi, 0.5 L.\nA famous Georgian spring — clean taste with refreshing bubbles.",
    },
    "Water 0.5 L": {
        "ka": "სუფთა სასმელი წყალი 0.5 ლიტრი.\nმარტივი და აუცილებელი არჩევანი ნებისმიერ საჭმელთან.",
        "ru": "Чистая питьевая вода 0.5 л.\nПростой и необходимый выбор к любому блюду.",
        "en": "Clean drinking water, 0.5 L.\nA simple, essential choice with any meal.",
    },
    "Natakhtari lemonad 0.5 L": {
        "ka": "ლიმონათი Natakhtari 0.5 ლიტრი, გამაგრილებელი და ტკბილი.\nცნობილი ქართული ბრენდის კლასიკური გემო.",
        "ru": "Лимонад Natakhtari 0.5 л — освежающий и в меру сладкий.\nКлассический вкус известного грузинского бренда.",
        "en": "Natakhtari lemonade, 0.5 L — refreshing and pleasantly sweet.\nThe classic taste of a well-known Georgian brand.",
    },
    "Zedazeni lemonad 0.5 L": {
        "ka": "ლიმონათი Zedazeni 0.5 ლიტრი, ნათელი ხილის გემოთი.\nგამაგრილებელი არჩევანი ცხელ დღეს.",
        "ru": "Лимонад Zedazeni 0.5 л с ярким фруктовым вкусом.\nОсвежающий выбор в жаркий день.",
        "en": "Zedazeni lemonade, 0.5 L, with a bright fruity flavour.\nA refreshing choice on a hot day.",
    },
    "Juice natural 1 L": {
        "ka": "ნატურალური წვენი 1 ლიტრი, ხილის ნამდვილი გემოთი.\nსანელებლების გარეშე — მხოლოდ ხილი და სისუფთავე.",
        "ru": "Натуральный сок 1 л с настоящим фруктовым вкусом.\nБез добавок — только фрукты и свежесть.",
        "en": "Natural juice, 1 L, with a true fruity taste.\nNo additives — just fruit and freshness.",
    },
    "Cappuccino": {
        "ka": "კაპუჩინო ხავერდოვანი რძის ქაფით.\nესპრესოსა და რძის ბალანსი — სითბო ყოველ ფინჯანში.",
        "ru": "Капучино с бархатной молочной пенкой.\nБаланс эспрессо и молока — уют в каждой чашке.",
        "en": "Cappuccino with velvety milk foam.\nEspresso and milk in perfect balance — comfort in every cup.",
    },
    "Espresso": {
        "ka": "ძლიერი ესპრესო მკვრივი კრემით.\nსწრაფი და ენერგიული არჩევანი ნებისმიერ დროს.",
        "ru": "Крепкий эспрессо с плотной кремой.\nБыстрый и бодрящий выбор в любое время.",
        "en": "A strong espresso with a dense crema.\nA quick, energising choice any time of day.",
    },
    "Americano": {
        "ka": "კლასიკური ამერიკანო ესპრესოს საფუძველზე.\nუფრო რბილი და მოცულობითი — ნელი ყავის შესვენებისთვის.",
        "ru": "Классический американо на основе эспрессо.\nМягче и объёмнее — для неспешного кофе-брейка.",
        "en": "Classic Americano based on espresso.\nMilder and larger — for a relaxed coffee break.",
    },
    "Latte": {
        "ka": "ლატე ნაზი რძის გემოთი და ესპრესოს ნოტით.\nრბილი და კრემისებრი — შესანიშნავია დღის ნებისმიერ დროს.",
        "ru": "Латте с нежным молочным вкусом и нотой эспрессо.\nМягкий и кремовый — отлично в любое время дня.",
        "en": "Latte with a soft milky taste and a hint of espresso.\nSmooth and creamy — great any time of day.",
    },
    "Coffee Instant": {
        "ka": "სწრაფად მომზადებული ხსნადი ყავა.\nმარტივი და ცნობილი გემო, როცა დრო შეზღუდულია.",
        "ru": "Быстрорастворимый кофе, готовый за пару секунд.\nПростой и знакомый вкус, когда время ограничено.",
        "en": "Quick instant coffee, ready in seconds.\nA simple, familiar taste when time is short.",
    },
    "TEA": {
        "ka": "არომატული ჩაი, თბილად მოხარშული.\nდამამშვიდებელი არჩევანი ნებისმიერ კერძთან ან უბრალოდ ასე.",
        "ru": "Ароматный чай, заваренный горячим способом.\nУспокаивающий выбор к любому блюду или просто так.",
        "en": "Aromatic tea, brewed hot.\nA soothing choice with any meal, or simply on its own.",
    },
}


def apply_to_menu_json() -> int:
    """Update desc / desc_en / desc_ka for every product in sunset_menu.json.

    Product names (ka/ru/en) are left untouched. Returns the number of
    products that were updated.
    """
    payload = json.loads(MENU_PATH.read_text(encoding="utf-8"))
    updated = 0
    missing: list[str] = []
    for product in payload["products"]:
        ka_name = product.get("ka") or ""
        tr = DESCRIPTIONS.get(ka_name)
        if not tr:
            missing.append(ka_name)
            continue
        product["desc"] = tr["ru"]
        product["desc_en"] = tr["en"]
        product["desc_ka"] = tr["ka"]
        updated += 1

    if missing:
        raise SystemExit(f"Missing descriptions for: {missing}")

    MENU_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return updated


if __name__ == "__main__":
    count = apply_to_menu_json()
    print(f"Updated {count} product descriptions in {MENU_PATH.name}")
