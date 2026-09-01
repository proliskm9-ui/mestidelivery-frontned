# -*- coding: utf-8 -*-
"""
Selling / marketing descriptions for the Luizastan menu (Mestia, Svaneti).

DESCRIPTIONS is keyed by the exact Georgian ("ka") product name found in
luizastan_menu.json. Each value contains "ka", "ru" and "en" copy — warm,
appetizing marketing text (minimum two lines, separated by "\n") written in
the voice of a beloved local Svan family restaurant: homemade, authentic,
mountain Georgian hospitality.

Run this file directly to apply the descriptions to luizastan_menu.json
(updates "desc" [ru], "desc_en" and "desc_ka" for every matching product).
"""

import json
import os

MENU_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "luizastan_menu.json")

DESCRIPTIONS: dict[str, dict[str, str]] = {
    # ---------------------------------------------------------------- Салаты
    "კიტრი-პომიდორი": {
        "ka": "ხრაშუნა კიტრი და ტკბილი, მომწიფებული პომიდორი — მარტივი სალათი, რომელიც არასდროს გებეზება.\nზეთისა და მწვანილის მსუბუქი საწებელი კიდევ უფრო უსვამს ხაზს ბაღის ბოსტნეულის სიახლეს.",
        "ru": "Хрустящие огурцы и сладкие спелые помидоры — простой салат, который никогда не приедается.\nЛёгкая заправка из масла и зелени подчёркивает свежесть овощей, будто с собственного огорода.",
        "en": "Crisp cucumbers and sweet ripe tomatoes — a simple salad you never get tired of.\nA light dressing of oil and herbs brings out the freshness of garden-grown vegetables.",
    },
    "კიტრი-პომიდორი ნიგვზით": {
        "ka": "იგივე საყვარელი ბოსტნეულის სალათი, ნაზი ნიგვზის საწებლით, უფრო მდიდარი გემოსთვის.\nკიტრისა და პომიდვრის სიახლე ხვდება ნიგვზის ხავერდოვან, სვანურ ნოტს.",
        "ru": "Тот же любимый овощной салат, но с нежной ореховой заправкой для более насыщенного вкуса.\nСвежесть огурцов и помидоров встречается с бархатистой сванской нотой грецкого ореха.",
        "en": "The same beloved vegetable salad, now with a delicate walnut dressing for extra depth.\nCrisp cucumbers and tomatoes meet the velvety, nutty note so loved in Svan cooking.",
    },
    "ქათმის სალათი": {
        "ka": "წვნიანი ქათმის ხორცი, ახალი ბოსტნეული და ნაზი სოუსი — გამაძღარი სალათი, რომელიც ნამდვილად აღავსებს.\nსანატები არჩევანია, როცა გვინდა გემრიელი, თუმცა არც ისე მძიმე საჭმელი დღის ნებისმიერ დროს.",
        "ru": "Сочная курица, свежие овощи и мягкий соус — сытный салат, которым легко насытиться.\nОтличный выбор для тех, кто хочет вкусно и не тяжело перекусить в любое время дня.",
        "en": "Juicy chicken, fresh vegetables and a mild dressing — a hearty salad that truly satisfies.\nA great choice whenever you want something tasty without feeling too heavy.",
    },
    "ცეზარი": {
        "ka": "კლასიკა, რომელიც ყველას უყვარს: ნაზი ქათმის ხორცი, ხრაშუნა კრუტონები და ჩვენი საავტორო სოუსი.\nგამაძღარი და ამავდროულად მსუბუქი სალათი — იდეალურია ლანჩად თუ ვახშმად.",
        "ru": "Классика, которую любят все: нежная курица, хрустящие крутоны и наш фирменный соус.\nСытный и в то же время лёгкий салат — идеальное блюдо на обед или ужин.",
        "en": "A classic everyone loves: tender chicken, crunchy croutons and our house-made dressing.\nHearty yet light — the perfect choice for lunch or dinner.",
    },
    "ნიგვზიანი ბადრიჯანი": {
        "ka": "ნაზად შემწვარი ბადრიჯანი, გახვეული სქელ ნიგვზისა და ნიორის პასტაში.\nსაქართველოს ერთ-ერთი ყველაზე საყვარელი ცივი კერძი — მიირთვით პურთან და ღვინოსთან ერთად.",
        "ru": "Нежные обжаренные баклажаны, свёрнутые с густой ореховой пастой и чесноком.\nОдна из самых любимых холодных закусок Грузии — подавайте к хлебу и вину.",
        "en": "Tender fried eggplant rolled with a rich walnut-and-garlic paste.\nOne of Georgia's most beloved cold starters — best enjoyed with fresh bread and wine.",
    },
    "ფხალი": {
        "ka": "ტრადიციული ფხალი მწვანილითა და ბოსტნეულით, ნიგვზით, ნიორითა და არომატული სანელებლებით.\nნათელი, ცხარე გემო, რომელიც მყისვე გადაგიყვანთ საქართველოს გულში.",
        "ru": "Традиционное пхали из зелени и овощей с орехами, чесноком и ароматными специями.\nЯркий, пряный вкус, который сразу переносит вас в самое сердце Грузии.",
        "en": "Traditional pkhali of greens and vegetables blended with walnuts, garlic and fragrant spices.\nA bright, spicy flavour that instantly transports you to the heart of Georgia.",
    },
    # ----------------------------------------------------------------- Супы
    "სუპ-ხარჩო": {
        "ka": "გამაძღარი ხარჩოს სუპი საქონლის ხორცით, ბრინჯითა და ტყემალით — დამახასიათებელი მჟავე ნოტით.\nათბობს ნებისმიერ ამინდში და გაგახსენებთ ბებიის სახლის ლანჩს.",
        "ru": "Наваристый суп харчо с говядиной, рисом и ткемали — с той самой узнаваемой кислинкой.\nСогревает в любую погоду и напоминает домашний обед у грузинской бабушки.",
        "en": "A hearty kharcho soup with beef, rice and tkemali, carrying that signature tangy note.\nWarming in any weather — just like a home-cooked lunch at a Georgian grandmother's table.",
    },
    "ხაშლამა": {
        "ka": "ხორცი, საათობით ჩაშუშული ბოსტნეულთან ერთად არომატულ ბულიონში სრულ სირბილემდე.\nმარტივი, სახლისებური და ძალიან გამაძღარი კერძი — ის, რაც გჭირდებათ მთაში გატარებული დღის შემდეგ.",
        "ru": "Мясо, часами томлёное с овощами в ароматном бульоне до полной мягкости.\nПростое, домашнее и очень сытное блюдо — то, что нужно после долгого дня в горах.",
        "en": "Meat slow-simmered for hours with vegetables in a fragrant broth until melt-in-the-mouth tender.\nSimple, homely and deeply filling — exactly what you need after a long mountain day.",
    },
    "ჩიხირთმა": {
        "ka": "ნაზი ქათმის სუპი, კვერცხით გასქელებული, მსუბუქი მჟავიანობითა და ქინძის ნოტით.\nერთ-ერთი ყველაზე გულთბილი ქართული სუპი — მოსანელებელი და ნამდვილად სახლისებური.",
        "ru": "Нежный куриный суп, загущённый яйцом, с лёгкой кислинкой и ноткой кориандра.\nОдин из самых душевных грузинских супов — обволакивающий и по-настоящему домашний.",
        "en": "A delicate chicken soup thickened with egg, with a gentle tang and a hint of coriander.\nOne of the most soulful Georgian soups — comforting and truly homemade.",
    },
    "სოკოს კრემ სუპი": {
        "ka": "ხავერდოვანი სოკოს კრემ-სუპი ახალი სოკოთი და ნაღებით — რბილი, არომატული, კომფორტული.\nსაუკეთესო კერძია გასათბობად და ნამდვილი სახლისებური კომფორტის საგემოვნებლად.",
        "ru": "Бархатистый крем-суп из свежих грибов со сливками — мягкий, ароматный, уютный.\nИдеальное блюдо, чтобы согреться и почувствовать вкус настоящего домашнего уюта.",
        "en": "A velvety cream of mushroom soup with fresh mushrooms and cream — soft, fragrant, cosy.\nThe perfect dish to warm up with and enjoy true homemade comfort.",
    },
    "ბოსტნეულის სუპი": {
        "ka": "მსუბუქი სუპი სეზონური ბოსტნეულით — ახალი, სასარგებლო და ნამდვილად გამათბობელი.\nსაუკეთესო არჩევანია მათთვის, ვისაც უნდა გემრიელად ჭამა ზედმეტი სიმძიმის გარეშე.",
        "ru": "Лёгкий суп из сезонных овощей — свежий, полезный и по-настоящему согревающий.\nОтличный выбор для тех, кто хочет вкусно поесть без лишней тяжести.",
        "en": "A light soup of seasonal vegetables — fresh, wholesome and truly warming.\nA great choice for anyone who wants a tasty meal without any heaviness.",
    },
    "ოსტრი": {
        "ka": "ცხარე ხორცის ჩაშუშული პომიდვრის სქელ სოუსში — მდიდარი, სანელებლებიანი და ნამდვილად ქართული.\nკერძია მათთვის, ვისაც უყვარს ნათელი გემო და არ ეშინია მსუბუქი სიცხარის.",
        "ru": "Острое мясное рагу в густом томатном соусе — насыщенно, пряно, по-настоящему по-грузински.\nБлюдо для тех, кто любит яркие вкусы и не боится лёгкой остроты.",
        "en": "A spicy meat stew in a rich tomato sauce — bold, aromatic and unmistakably Georgian.\nA dish for those who love vivid flavours and don't shy away from a little heat.",
    },
    "ქათმის ბაჟე": {
        "ka": "ნაზი ქათმის ხორცი ნიგვზის სქელ ბაჟეს სოუსში — საქართველოს ერთ-ერთი ყველაზე ცნობადი გემო.\nხავერდოვანი ტექსტურა და ნიორის არომატი პირველივე კოვზიდან დაგატყვევებთ.",
        "ru": "Нежная курица в густом ореховом соусе баже — один из самых узнаваемых вкусов Грузии.\nБархатистая текстура и пряный аромат чеснока покорят вас с первой ложки.",
        "en": "Tender chicken in a rich walnut bazhe sauce — one of Georgia's most iconic flavours.\nIts velvety texture and fragrant garlic will win you over from the very first spoonful.",
    },
    # -------------------------------------------------------------- Горячее
    "ხინკალი": {
        "ka": "ხელით ნაძერწი წვნიანი ხინკალი არომატული ხორცის გულსართით — ფასი მითითებულია 1 ცალზე.\nჭამეთ ხელით, ძველებურად, და ბოლო ლუკმამდე შეინარჩუნეთ წვენი შიგნით.",
        "ru": "Сочные хинкали ручной лепки с ароматной мясной начинкой — цена указана за 1 штуку.\nЕшьте руками по старинке и не забудьте оставить весь бульон внутри до последнего укуса.",
        "en": "Juicy handmade khinkali with a fragrant meat filling — price is per piece.\nEat them the traditional way with your hands, and save all the broth for the very last bite.",
    },
    "სოკოს ხინკალი": {
        "ka": "ხინკალი ნაზი, არომატული სოკოს გულსართით — შესანიშნავი არჩევანი ვეგეტარიანელებისთვის.\nმსუბუქი, წვნიანი და ტყის ნათელი გემოთი — ფასი მითითებულია 1 ცალზე.",
        "ru": "Хинкали с нежной ароматной грибной начинкой — идеальный выбор для вегетарианцев.\nЛёгкие, сочные, с ярким лесным вкусом — цена указана за 1 штуку.",
        "en": "Khinkali filled with a delicate, fragrant mushroom mix — a perfect choice for vegetarians.\nLight, juicy and full of earthy flavour — price is per piece.",
    },
    "ქაბაბი": {
        "ka": "წვნიანი ქაბაბი, ცეცხლზე შემწვარი ოქროსფერ ქერქამდე, კვამლის ნოტით.\nსანელებლებიანი ხორცის ფარში და მსუბუქი შებოლილი გემო — საყვარელი ყველა ხორცის მოყვარულისთვის.",
        "ru": "Сочный люля-кебаб, обжаренный на живом огне до румяной корочки с дымком.\nПряный фарш и лёгкая копчёная нотка — блюдо, которое любят все мясоеды.",
        "en": "Juicy lula kebab grilled over an open flame until golden, with a smoky finish.\nSpiced minced meat and a hint of char — a favourite among all meat lovers.",
    },
    "მწვადი ღორის": {
        "ka": "ღორის მწვადი მანგალიდან — გარედან ხრაშუნა ოქროსფერი ქერქი, შიგნით კი წვნიანი და ნაზი ხორცი.\nდამარინადებული ხორცი, ნახშირზე მომზადებული ისე, როგორც მთაში საუკუნეების განმავლობაში ამზადებდნენ.",
        "ru": "Свиной мцвади с мангала — румяная корочка снаружи и сочная нежная мякоть внутри.\nМаринованное мясо, приготовленное на углях так, как готовили его в горах веками.",
        "en": "Pork mtsvadi straight from the grill — crisp golden crust outside, juicy and tender inside.\nMarinated meat cooked over coals the way it has been made in the mountains for centuries.",
    },
    "მწვადი ქათმის": {
        "ka": "ნაზი ქათმის მწვადი ნახშირზე — არომატული, წვნიანი და საზომად სანელებლებიანი.\nღორის მწვადის მსუბუქი ალტერნატივა, თუმცა ისევე გემრიელი, ნამდვილად ქართულად.",
        "ru": "Нежный куриный шашлык на углях — ароматный, сочный и в меру пряный.\nЛёгкая альтернатива свиному мцвади, но такая же по-грузински вкусная.",
        "en": "Tender chicken skewers grilled over coals — aromatic, juicy and just spicy enough.\nA lighter alternative to pork mtsvadi, yet every bit as deliciously Georgian.",
    },
    "ოჯახური": {
        "ka": "სახლის სტილის ჩაშუშული ხორცი კარტოფილთან ერთად, ტაფაზე შემწვარი ოქროსფერ ქერქამდე.\nგამაძღარი და სვანური სითბოთი სავსე კერძი — ისეთი, რომ ისევ და ისევ გინდა შეკვეთა.",
        "ru": "«Домашнее» рагу из мяса с картофелем, обжаренное до румяной корочки на сковороде.\nСытно, ароматно и по-свански душевно — блюдо, которое хочется заказывать снова и снова.",
        "en": "A home-style meat and potato stew, pan-fried until golden and irresistibly aromatic.\nHearty and warmly Svan — a dish you'll want to order again and again.",
    },
    "ოჯახური ქათმის": {
        "ka": "ოჯახური ნაზი ქათმის ხორცითა და ოქროსფერი კარტოფილით — ცხელი კერძი დიდი კომპანიისთვის.\nკლასიკური რეცეპტის მსუბუქი ვერსია, რომელიც ყველაზე მომთხოვნ სტუმარსაც კი მოეწონება.",
        "ru": "Оджахури с нежной курицей и золотистым картофелем — горячее блюдо для большой компании.\nЛёгкая версия классического рецепта, которая понравится даже самым привередливым гостям.",
        "en": "Ojakhuri with tender chicken and golden potatoes — a hot dish perfect for sharing.\nA lighter take on the classic recipe that will win over even the pickiest guests.",
    },
    "შქმერული": {
        "ka": "ქათამი ნაღებისა და ნიორის სქელ სოუსში — რაჭის ლეგენდარული კერძი, რომელსაც სტუმრები აღტაცებით მიირთმევენ.\nარომატული, ნაზი და მდიდარი ნიორის გემოთი — კერძი, რომლის დავიწყებაც შეუძლებელია.",
        "ru": "Курица в густом сливочно-чесночном соусе — легенда Рачи, которую обожают наши гости.\nАроматный, нежный, с насыщенным чесночным вкусом — блюдо, которое невозможно забыть.",
        "en": "Chicken in a rich creamy garlic sauce — a Racha legend adored by our guests.\nFragrant and tender with a bold garlicky finish — an unforgettable dish.",
    },
    "ჩახოხბილი": {
        "ka": "ქათამი ჩაშუშული წვნიან პომიდვრით, ხახვითა და ახალი მწვანილით სრულ სირბილემდე.\nსახლისებური ქართული გემო, რომელიც ათბობს და ოჯახურ სუფრას გაგახსენებთ.",
        "ru": "Курица, тушённая с сочными помидорами, луком и свежей зеленью до полной мягкости.\nДомашний грузинский вкус, который согревает и напоминает семейный ужин.",
        "en": "Chicken slow-stewed with juicy tomatoes, onions and fresh herbs until wonderfully tender.\nA homely Georgian flavour that feels just like a family dinner.",
    },
    "სოკო კეცზე ყველით": {
        "ka": "სოკო გამომცხვარი თიხის კეცზე, გამდნარი ყველის ქვეშ, ოქროსფერ ქერქამდე.\nარომატული, მადისაღმძვრელი და ნამდვილად ქართული — იდეალურია სახლის ღვინის ჭიქასთან ერთად.",
        "ru": "Грибы, запечённые на глиняном кеци под расплавленным сыром до золотистой корочки.\nАроматно, аппетитно и очень по-грузински — идеально к бокалу домашнего вина.",
        "en": "Mushrooms baked on a clay ketsi under melted cheese until golden and bubbling.\nFragrant, tempting and truly Georgian — perfect alongside a glass of homemade wine.",
    },
    "აჯაფსანდალი": {
        "ka": "ბოსტნეულის ჩაშუშული ბადრიჯნით, წიწაკითა და პომიდვრით, საკუთარ წვენში მოხარშული.\nკავკასიის მსუბუქი ზაფხულის გემო — გემრიელია როგორც ცხელი, ისე ცივი.",
        "ru": "Овощное рагу из баклажанов, перца и томатов, томлённое в собственном соку.\nЛёгкий летний вкус Кавказа — блюдо, которое хорошо и горячим, и холодным.",
        "en": "A vegetable stew of eggplant, pepper and tomatoes, slow-simmered in their own juices.\nA light summer taste of the Caucasus — delicious served warm or cold.",
    },
    "ლობიო": {
        "ka": "ლობიო ქართულად, სანელებლებითა და მწვანილით ხავერდოვან სისქემდე ჩაშუშული.\nმარტივი, მაგრამ ძალიან დამახასიათებელი კერძი — იდეალურია მჭადთან და დამარინადებულ ბოსტნეულთან.",
        "ru": "Фасоль по-грузински, томлённая со специями и травами до бархатистой густоты.\nПростое, но невероятно характерное блюдо — идеально с мчади и маринованными овощами.",
        "en": "Georgian-style beans slow-simmered with spices and herbs to a velvety richness.\nSimple yet deeply characterful — perfect with mchadi and pickled vegetables.",
    },
    # -------------------------------------------------------------- Выпечка
    "იმერული ხაჭაპური": {
        "ka": "მრგვალი იმერული ხაჭაპური ნაზი ყველის გულსართით, ოქროსფერ ქერქამდე გამომცხვარი.\nიმერეთის კლასიკა, რომელიც პირში დნება — გემო, რომელსაც ყველა ქართველი ბავშვობიდან იცნობს.",
        "ru": "Круглый хачапури с нежной сырной начинкой, запечённый до золотистой корочки.\nКлассика Имерети, которая тает во рту — вкус, знакомый каждому грузину с детства.",
        "en": "Round khachapuri with a tender cheese filling, baked to a golden crust.\nAn Imeretian classic that melts in your mouth — a flavour every Georgian grows up with.",
    },
    "მეგრული ხაჭაპური": {
        "ka": "მეგრული ხაჭაპური ყველით შიგნით და ხრაშუნა ყველის ქერქით ზემოდან — ორმაგი ყველის ტკბობა.\nიმერულზე გამაძღარიც კი და კიდევ უფრო მდიდარი გემოთი.",
        "ru": "Хачапури с сыром внутри и хрустящей сырной корочкой сверху — вдвойне сырный восторг.\nЕщё сытнее имеретинского и с ещё более насыщенным вкусом.",
        "en": "Khachapuri with cheese inside and a crisp cheesy crust on top — double the cheesy delight.\nEven heartier than the Imeretian version, with an even richer flavour.",
    },
    "აჭარული ხაჭაპური": {
        "ka": "ნავისებრი აჭარული ხაჭაპური ყველით, კარაქითა და კვერცხით — ქართული სამზარეულოს ყველაზე ცნობადი სიმბოლო.\nაურიეთ ყველაფერი შემწვარი კვერცხი მიირთმევის წინ და დატკბით თბილი, წებოვანი ყველით.",
        "ru": "Хачапури-лодочка с сыром, маслом и яйцом — самый узнаваемый символ грузинской кухни.\nРазмешайте всё вместе прямо перед подачей и наслаждайтесь тягучим сырным теплом.",
        "en": "Boat-shaped khachapuri with cheese, butter and egg — the most iconic symbol of Georgian cuisine.\nStir everything together right before eating and enjoy the warm, stretchy cheese.",
    },
    "მჭადი": {
        "ka": "სიმინდის მჭადი ხრაშუნა ქერქითა და რბილი შიგთავსით.\nიდეალური წყვილი ლობიოსა და სულგუნისთვის — მარტივი, მაგრამ შეუცვლელი.",
        "ru": "Кукурузная лепёшка с хрустящей корочкой снаружи и мягкой серединкой.\nИдеальный компаньон к лобио и сулугуни — просто, но незаменимо.",
        "en": "A corn flatbread with a crisp crust outside and a soft centre inside.\nThe perfect companion for lobio and suluguni cheese — simple yet irreplaceable.",
    },
    "ლობიანი": {
        "ka": "ლობიანი ნაზი ლობიოს გულსართით, ოქროსფერ ქერქამდე გამომცხვარი.\nგამაძღარი რაჭა-სვანური კლასიკა, რომელიც ათბობს და მთელი დღის ენერგიით გავსებთ.",
        "ru": "Пирог с нежной фасолевой начинкой, испечённый до румяной корочки.\nСытная рача-сванская классика, которая согревает и наполняет энергией на весь день.",
        "en": "A pie with a tender bean filling, baked until beautifully golden.\nA hearty Racha–Svan classic that warms you up and keeps you energised all day.",
    },
    "პური": {
        "ka": "ახალი, სახლისებური პური — თბილი, არომატული და ყოველთვის საჭირო ქართულ სუფრაზე.\nმიირთვით ნებისმიერ კერძთან ერთად, გემოს სისრულისთვის.",
        "ru": "Свежий домашний хлеб — тёплый, ароматный и всегда к месту за грузинским столом.\nПодавайте к любому блюду, чтобы дособрать вкус до идеала.",
        "en": "Fresh homemade bread — warm, fragrant and always welcome at a Georgian table.\nServe alongside any dish to round out the meal perfectly.",
    },
    "პიცა მარგარიტა": {
        "ka": "კლასიკური პიცა წვნიანი პომიდვრითა და წებოვანი, გამდნარი ყველით.\nმარტივი და ყველასთვის საყვარელი გემო, რომელიც ნებისმიერ დღეს გაგაცისკროვნებთ.",
        "ru": "Классическая пицца с сочными томатами и тягучим расплавленным сыром.\nПростой и любимый всеми вкус, который поднимет настроение в любой день.",
        "en": "Classic pizza with juicy tomatoes and gooey melted cheese.\nA simple, beloved flavour that brightens up any day.",
    },
    "ბოსტნეულის პიცა": {
        "ka": "პიცა ნათელი ბოსტნეულის გულსართით — წვნიანი, ახალი და ზაფხულურად მსუბუქი.\nშესანიშნავი არჩევანია მათთვის, ვისაც უნდა პიცა ზედმეტი სიმძიმის გარეშე.",
        "ru": "Пицца с яркой овощной начинкой — сочно, свежо и по-летнему легко.\nОтличный выбор для тех, кто хочет пиццу без лишней тяжести.",
        "en": "Pizza topped with vibrant vegetables — juicy, fresh and summer-light.\nA great choice for anyone craving pizza without the heaviness.",
    },
    # -------------------------------------------------------- Сванские блюда
    "კუბდარი": {
        "ka": "სვანური კუბდარი, არომატული სანელებლებითა და ცნობილი სვანური მარილით.\nსვანეთის სავიზიტო ბარათი — კუბდარი, რომლის გამოც ღირს მთაში ჩამოსვლა.",
        "ru": "Сванский мясной пирог с ароматными специями и знаменитой сванской солью.\nВизитная карточка Сванетии — пирог, ради которого стоит приехать в горы.",
        "en": "A Svan meat pie seasoned with fragrant spices and the famous Svan salt.\nThe calling card of Svaneti — a pie worth travelling to the mountains for.",
    },
    "ხაჭაპური კარტოფილით": {
        "ka": "ხაჭაპური ნაზი კარტოფილისა და ყველის გულსართით — მარტივი და ნამდვილად სახლისებური კერძი.\nგამაძღარი გემო, რომელიც ათბობს მთის ბილიკებზე ხანგრძლივი სეირნობის შემდეგ.",
        "ru": "Хачапури с нежной картофельно-сырной начинкой — простое и очень домашнее блюдо.\nСытный вкус, который согревает после долгой прогулки по горным тропам.",
        "en": "Khachapuri with a soft potato-and-cheese filling — simple and truly homely.\nA hearty flavour that warms you up after a long walk on mountain trails.",
    },
    "ხაჭაპური ფეტვით": {
        "ka": "ხაჭაპური იშვიათი სვანური ფეტვით — სვანეთის ნამდვილად ადგილობრივი გემო.\nგასინჯეთ ის, რასაც მხოლოდ მთის სოფლებში მიირთმევენ — ავთენტური და უჩვეულო.",
        "ru": "Хачапури с редким сванским просом фецви — по-настоящему локальный вкус Сванетии.\nПопробуйте то, что подают только в горных сёлах — аутентично и необычно.",
        "en": "Khachapuri with rare Svan millet (fetvi) — a truly local Svaneti flavour.\nTry something served only in the mountain villages — authentic and unlike anything else.",
    },
    "ჭვიშტარი": {
        "ka": "სიმინდის ჭვიშტარი ყველით შიგნით — გარედან ხრაშუნა, შიგნით წებოვანი.\nმიირთვით ცხელ-ცხელი, სანამ ყველი ჯერ კიდევ გამდნარია — ეს ამ კერძის ყველაზე გემრიელი წამია.",
        "ru": "Кукурузные лепёшки с сыром внутри — хрустящие снаружи и тягучие внутри.\nПодаются горячими, пока сыр не остыл, — самый вкусный момент этого блюда.",
        "en": "Corn cakes with melted cheese inside — crisp on the outside, stretchy within.\nBest served piping hot while the cheese is still molten — the tastiest moment of all.",
    },
    "ჭვიშტარი ფეტვით": {
        "ka": "ჭვიშტარი სვანური ფეტვის დამატებით — კიდევ უფრო ღრმა და ავთენტიკური გემო.\nერთ-ერთი იმ კერძთაგანია, რომლის ნამდვილი გემოც მხოლოდ აქ, სვანეთის მთებში შეიცნობა.",
        "ru": "Чвиштари с добавлением сванского проса — ещё более глубокий и аутентичный вкус.\nОдно из тех блюд, которые можно попробовать только здесь, в горах Сванетии.",
        "en": "Chvishtari made with Svan millet — an even deeper, more authentic flavour.\nOne of those dishes you can only truly taste here, in the mountains of Svaneti.",
    },
    "თაშმიჯაბი": {
        "ka": "კარტოფილის პიურე გამდნარ ყველთან ერთად გაწელილი წებოვან სირბილემდე.\nსაკულტო სვანური კერძი — მარტივი შემადგენლობით, მაგრამ წარმოუდგენლად კომფორტული გემოთი.",
        "ru": "Картофельное пюре, растянутое с расплавленным сыром до тягучей нежности.\nКультовое сванское блюдо — простое по составу, но невероятно уютное на вкус.",
        "en": "Mashed potato stretched with melted cheese into a wonderfully gooey, tender texture.\nAn iconic Svan dish — simple in ingredients yet incredibly comforting in taste.",
    },
    # -------------------------------------------------------------- Гарниры
    "ბრინჯი": {
        "ka": "ფაფარა, მარცვალ-მარცვალი ბრინჯი — მსუბუქი გარნირი, რომელიც ხაზს უსვამს ნებისმიერი ხორცის კერძის გემოს.\nმარტივი, მაგრამ აუცილებელი თანმხლები მდიდარი ქართული სოუსებისთვის.",
        "ru": "Рассыпчатый рис — лёгкий гарнир, который подчёркивает вкус любого мясного блюда.\nПростой, но необходимый спутник для насыщенных грузинских соусов.",
        "en": "Fluffy, separate-grain rice — a light side that lets any meat dish shine.\nSimple yet essential alongside rich Georgian sauces.",
    },
    "ფრი": {
        "ka": "ხრაშუნა კარტოფილი ფრი, ოქროსფერ ქერქამდე შემწვარი.\nშესანიშნავი დამატებაა ნებისმიერი ცხელი კერძისთვის, ან გემრიელია დამოუკიდებლადაც.",
        "ru": "Хрустящий картофель фри, обжаренный до золотистой корочки.\nОтличное дополнение к любому горячему блюду или закуска сама по себе.",
        "en": "Crispy French fries, fried to a perfect golden crunch.\nA great addition to any main dish, or delicious on their own.",
    },
    "მაკარონი": {
        "ka": "მარტივი მაკარონის გარნირი — უნივერსალური დამატება ხორცისა და სოუსებისთვის.\nმსუბუქი არჩევანია, როცა გინდათ რაღაც ნაცნობი და გამაძღარი.",
        "ru": "Простой гарнир из макарон — универсальное дополнение к мясу и соусам.\nЛёгкий выбор, когда хочется чего-то знакомого и сытного.",
        "en": "A simple pasta side — a versatile match for meats and sauces.\nAn easy choice when you want something familiar and filling.",
    },
    "წიწიბურა": {
        "ka": "ფაფარა წიწიბურას ფაფა — სასარგებლო და მკვებავი გარნირი.\nმსუბუქი არჩევანია მათთვის, ვინც საკვების ბალანსზე ზრუნავს.",
        "ru": "Рассыпчатая гречневая каша — полезный и питательный гарнир.\nЛёгкий выбор для тех, кто следит за балансом в своём рационе.",
        "en": "Fluffy buckwheat — a wholesome and nourishing side dish.\nA light choice for anyone mindful of a balanced meal.",
    },
    "სულგუნი": {
        "ka": "ახალი, მლაშე სულგუნის ყველი — დრეკადი, ნაზი და საზომად მარილიანი.\nჩინებულად ეხამება მჭადს, ლობიოს ან უბრალოდ სახლის ღვინის ჭიქას.",
        "ru": "Свежий рассольный сыр сулугуни — упругий, нежный и в меру солёный.\nОтлично сочетается с мчади, лобио или просто с бокалом домашнего вина.",
        "en": "Fresh brined suluguni cheese — springy, tender and pleasantly salty.\nPairs wonderfully with mchadi, lobio, or simply a glass of homemade wine.",
    },
    # --------------------------------------------------------------- Соусы
    "ტყემალი": {
        "ka": "მჟავე ქლიავის ტყემალი, ტრადიციული რეცეპტით მომზადებული.\nაუცილებელია ხორცთან და ხინკალთან — კერძებს სძენს იმ ნამდვილ ქართულ სიცხოველეს.",
        "ru": "Кислый сливовый соус ткемали, приготовленный по традиционному рецепту.\nMust-have к мясу и хинкали — придаёт блюдам ту самую грузинскую яркость.",
        "en": "A tangy plum tkemali sauce, made according to a traditional recipe.\nA must with meat and khinkali — it gives every dish that signature Georgian brightness.",
    },
    "მაიონეზი": {
        "ka": "კლასიკური მაიონეზი — ნაზი და უნივერსალური სოუსი გარნირისა და ხორცისთვის.\nმარტივი დამატება, რომელიც ნებისმიერ კერძს გახდის უფრო მდიდარს.",
        "ru": "Классический майонез — нежный и универсальный соус к гарнирам и мясу.\nПростое дополнение, которое сделает любое блюдо чуть более насыщенным.",
        "en": "Classic mayonnaise — a smooth, versatile sauce for sides and meat.\nA simple addition that makes any dish a little richer.",
    },
    "საწებელი": {
        "ka": "პომიდვრის საწებელი არომატული მწვანილითა და ნიორით — ცხარე და მდიდარი.\nჩინებულად ავსებს ხორცის კერძებსა და მჭადს, თითოეულ ლუკმას სიცხოველეს სძენს.",
        "ru": "Томатный соус сацебели с ароматными травами и чесноком — острый и насыщенный.\nИдеально дополняет мясные блюда и мчади, добавляя яркости каждому кусочку.",
        "en": "A tomato satsebeli sauce with fragrant herbs and garlic — bold and full-bodied.\nPerfectly complements meat dishes and mchadi, adding zest to every bite.",
    },
    "არაჟანი": {
        "ka": "ახალი, სახლისებური არაჟანი — რბილი, ნაზმორბილო და საზომად სქელი.\nარბილებს ცხარე გემოს და შესანიშნავად ეხამება ხინკალსა და ცომეულს.",
        "ru": "Свежая домашняя сметана — мягкая, кремовая и в меру густая.\nСмягчает остроту блюд и прекрасно дополняет хинкали и выпечку.",
        "en": "Fresh homemade sour cream — mild, creamy and pleasantly thick.\nSoftens spicy notes and pairs beautifully with khinkali and baked goods.",
    },
    "კეტჩუპი": {
        "ka": "კლასიკური პომიდვრის კეტჩუპი — ტკბილ-ცხარე სოუსი ყველასთვის.\nმარტივი და ბევრისთვის საყვარელი დამატება ცხელი კერძებისა და გარნირისთვის.",
        "ru": "Классический томатный кетчуп — сладковато-пряный соус на любой вкус.\nПростое и любимое многими дополнение к горячим блюдам и гарнирам.",
        "en": "Classic tomato ketchup — a sweet-and-spicy sauce for every taste.\nA simple, well-loved addition to hot dishes and sides.",
    },
    # -------------------------------------------------------------- Десерты
    "ეკლერი": {
        "ka": "ნაზი საფუარგამოშვებული ეკლერი ჰაეროვანი კრემით შიგნით.\nტკბილი დასასრული სუფრისთვის, რომლის ნელა მიტკბობაც მოგინდებათ.",
        "ru": "Нежный заварной эклер с воздушным кремом внутри.\nСладкое завершение трапезы, которое хочется растянуть на подольше.",
        "en": "A delicate choux pastry éclair filled with airy cream.\nA sweet finishing touch to your meal that you'll want to savour slowly.",
    },
    "ვაშლის ღვეზელი": {
        "ka": "სახლის ვაშლის ღვეზელი ნაზი ცომითა და არომატული გულსართით.\nბავშვობის გემო, რომელიც ნებისმიერ საბანზე უკეთ ათბობს.",
        "ru": "Домашний яблочный пирог с нежной корочкой и ароматной начинкой.\nВкус детства, который согревает лучше любого пледа.",
        "en": "Homemade apple pie with a tender crust and fragrant filling.\nA taste of childhood that warms you better than any blanket.",
    },
    "ბლინი": {
        "ka": "თხელი, ოქროსფერი ბლინები — იდეალურია ჩაისთან ან მსუბუქ დესერტად.\nმიირთვით არაჟნით, ჯემით ან თაფლით — თქვენი გემოვნებისამებრ.",
        "ru": "Тонкие румяные блины — идеальны к чаю или в качестве лёгкого десерта.\nПодавайте со сметаной, вареньем или мёдом — на ваш вкус.",
        "en": "Thin, golden blini — perfect with tea or as a light dessert.\nServe with sour cream, jam or honey — whichever you prefer.",
    },
    "მაჭკატები": {
        "ka": "ფუმფულა, სახლისებური მაჭკატები — ფასი მითითებულია 1 ცალზე.\nრბილი და არომატული, ყველაზე გემრიელია თბილ-თბილი, პირდაპირ ტაფიდან.",
        "ru": "Пышные домашние оладьи — цена указана за 1 штуку.\nМягкие, ароматные и лучше всего вкусны ещё тёплыми, прямо со сковороды.",
        "en": "Fluffy homemade pancakes — price is per piece.\nSoft and fragrant, they're at their best warm, straight off the pan.",
    },
    # -------------------------------------------------------------- Напитки
    "ჩაი": {
        "ka": "არომატული ცხელი ჩაი — გათბობის მარტივი და კომფორტული საშუალება.\nჩინებული დამატებაა დესერტთან ან მსუბუქი დასასრული გამაძღარი სუფრისთვის.",
        "ru": "Ароматный горячий чай — простой и уютный способ согреться.\nОтличное дополнение к десерту или лёгкий финал сытной трапезы.",
        "en": "Aromatic hot tea — a simple, cosy way to warm up.\nA great companion to dessert or a light finish to a hearty meal.",
    },
    "ამერიკანო": {
        "ka": "კლასიკური ამერიკანო — მდიდარი ყავის გემო ზედმეტი სიმწარის გარეშე.\nამხნევებს და შესანიშნავად ეხამება დესერტს ან ცომეულს.",
        "ru": "Классический американо — насыщенный кофейный вкус без лишней горечи.\nБодрит и прекрасно сочетается с десертом или выпечкой.",
        "en": "A classic Americano — rich coffee flavour without excess bitterness.\nInvigorating, and pairs beautifully with dessert or fresh pastry.",
    },
    "ესპრესო": {
        "ka": "ძლიერი და მდიდარი ესპრესო ნამდვილი ყავის მოყვარულთათვის.\nენერგიის სწრაფი მუხტი პატარა, მაგრამ ძლიერ ფინჯანში.",
        "ru": "Крепкий насыщенный эспрессо для настоящих ценителей кофе.\nБыстрый заряд бодрости в маленькой, но мощной чашке.",
        "en": "A strong, full-bodied espresso for true coffee lovers.\nA quick shot of energy in a small but powerful cup.",
    },
    "თურქული ყავა": {
        "ka": "მდიდარი თურქული ყავა, ჯაზვში ტრადიციული რეცეპტით მოხარშული.\nსქელი, არომატული და უჩქარო რიტუალი ნამდვილი გურმანებისთვის.",
        "ru": "Насыщенный кофе по-турецки, сваренный в турке по традиционному рецепту.\nГустой, ароматный и неспешный ритуал для истинных гурманов.",
        "en": "Rich Turkish-style coffee, brewed in a cezve the traditional way.\nA thick, aromatic and unhurried ritual for true coffee lovers.",
    },
    "ლატე": {
        "ka": "ნაზი ლატე რძეზე — რბილი ყავის გემო ხავერდოვანი ქაფით.\nჩინებული არჩევანია მათთვის, ვისაც უყვარს ყავა მკვეთრი სიმწარის გარეშე.",
        "ru": "Нежный латте на молоке — мягкий кофейный вкус с бархатистой пенкой.\nОтличный выбор для тех, кто любит кофе без резкой горечи.",
        "en": "A smooth milk latte — mild coffee flavour with a velvety foam.\nA great choice for anyone who likes coffee without sharp bitterness.",
    },
    "კაპუჩინო": {
        "ka": "კლასიკური კაპუჩინო სქელი რძის ქაფით.\nყავისა და რძის დაბალანსებული გემო — იდეალურია ნებისმიერ დესერტთან.",
        "ru": "Классический капучино с плотной молочной пенкой.\nСбалансированный вкус кофе и молока — идеально к любому десерту.",
        "en": "A classic cappuccino with rich, thick milk foam.\nA balanced coffee-and-milk flavour — perfect alongside any dessert.",
    },
    "ლიმონათი": {
        "ka": "გამაგრილებელი, სახლისებური ლიმონათი ციტრუსის ნათელი ნოტით.\nიდეალურია ცხელ დღეს ან როგორც მსუბუქი დამატება გამაძღარ საკვებთან.",
        "ru": "Освежающий домашний лимонад с яркой цитрусовой ноткой.\nИдеален в жаркий день или как лёгкое дополнение к сытной еде.",
        "en": "A refreshing homemade lemonade with a bright citrus note.\nPerfect on a hot day or as a light match for a hearty meal.",
    },
    "კომპოტი 1 ლიტ.": {
        "ka": "სახლის კომპოტი სეზონური ხილისგან, ბებიის რეცეპტით მოხარშული.\nტკბილი, არომატული სასმელი მთელი ლიტრით — ეყოფათ ყველას კომპანიაში.",
        "ru": "Домашний компот из сезонных фруктов, сваренный по бабушкиному рецепту.\nСладкий, ароматный напиток на целый литр — хватит на всю компанию.",
        "en": "Homemade fruit compote made from seasonal fruit, following grandma's recipe.\nA sweet, fragrant drink by the full litre — enough to share with everyone.",
    },
    "კოკა-კოლა": {
        "ka": "გამაგრილებელი კლასიკური კოკა-კოლა — კარგად გაცივებული, როგორც საჭიროა.\nჩინებული თანმხლებია პიცასთან, მწვადთან თუ ნებისმიერ ცხელ კერძთან.",
        "ru": "Освежающая классическая Кока-Кола — хорошо охлаждённая, как и полагается.\nОтличный компаньон к пицце, шашлыку или любому горячему блюду.",
        "en": "Classic refreshing Coca-Cola — served ice-cold, just the way it should be.\nA great companion to pizza, mtsvadi or any hot dish.",
    },
    "მინერალური წყალი": {
        "ka": "ბუნებრივი მინერალური წყალი მსუბუქი ბუშტუკებით.\nგამაგრილებელია და შესანიშნავად ავსებს ნებისმიერ ლანჩს თუ ვახშამს.",
        "ru": "Природная минеральная вода с лёгкими пузырьками.\nОсвежает и прекрасно дополняет любой обед или ужин.",
        "en": "Natural mineral water with a gentle sparkle.\nRefreshing, and a wonderful match for any lunch or dinner.",
    },
    "უგაზო წყალი": {
        "ka": "სუფთა, უგაზო სასმელი წყალი.\nმარტივი და აუცილებელი თანმხლები ჩვენი მენიუს ნებისმიერი კერძისთვის.",
        "ru": "Чистая питьевая вода без газа.\nПростой и необходимый спутник к любому блюду нашего меню.",
        "en": "Pure still drinking water.\nA simple, essential companion to any dish on our menu.",
    },
}


def apply_to_menu_json(menu_path: str = MENU_PATH) -> int:
    """Update desc / desc_en / desc_ka for every product in the menu JSON
    whose "ka" field matches a key in DESCRIPTIONS, then write the file back.

    Returns the number of products updated.
    """
    with open(menu_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = 0
    for product in data.get("products", []):
        entry = DESCRIPTIONS.get(product.get("ka"))
        if not entry:
            continue
        product["desc"] = entry["ru"]
        product["desc_en"] = entry["en"]
        product["desc_ka"] = entry["ka"]
        updated += 1

    with open(menu_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    return updated


if __name__ == "__main__":
    count = apply_to_menu_json()
    print(f"Updated {count} products in {MENU_PATH}")
