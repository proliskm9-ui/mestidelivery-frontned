from sqlalchemy.ext.asyncio import AsyncSession
from models import Category, Restaurant, Product, Store

categories_data = [
    {"id": "fastfood", "name": "Фастфуд", "icon": "icons/Ellipse 18.png", "sort_order": 1},
    {"id": "local", "name": "Местная", "icon": "icons/Ellipse 35.png", "sort_order": 2},
    {"id": "georgian", "name": "Грузинская", "icon": "icons/Ellipse 33.png", "sort_order": 3},
    {"id": "european", "name": "Европа", "icon": "icons/Ellipse 34.png", "sort_order": 4},
    {"id": "eastern", "name": "Восток", "icon": "icons/Ellipse 36.png", "sort_order": 5},
    {"id": "italian", "name": "Италия", "icon": "icons/Ellipse 37.png", "sort_order": 6},
    {"id": "japanese", "name": "Япония", "icon": "icons/Ellipse 39.png", "sort_order": 7},
    {"id": "burgers", "name": "Бургеры", "icon": "icons/Ellipse 19.png", "sort_order": 8},
    {"id": "pizza", "name": "Пицца", "icon": "icons/Ellipse 20.png", "sort_order": 9},
    {"id": "shawarma", "name": "Шаурма", "icon": "icons/Ellipse 21.png", "sort_order": 10},
    {"id": "sandwiches", "name": "Сэндвичи", "icon": "icons/Ellipse 23.png", "sort_order": 11},
    {"id": "bakery", "name": "Выпечка", "icon": "icons/Ellipse 24.png", "sort_order": 12},
    {"id": "pancakes", "name": "Блины", "icon": "icons/Ellipse 25.png", "sort_order": 13},
    {"id": "desserts", "name": "Десерты", "icon": "icons/Ellipse 26.png", "sort_order": 14},
    {"id": "bbq", "name": "Шашлык", "icon": "icons/Ellipse 28.png", "sort_order": 15},
    {"id": "pasta", "name": "Паста", "icon": "icons/Ellipse 29.png", "sort_order": 16},
    {"id": "soups", "name": "Супы", "icon": "icons/Ellipse 30.png", "sort_order": 17},
    {"id": "salads", "name": "Салаты", "icon": "icons/Ellipse 31.png", "sort_order": 18},
]

restaurants_data = [
    {"id": "sunset", "name": "SUNSET RESTAURANT", "rating": "4.7", "delivery": "25–30 мин", "img": "icons/sunset.png", "screen": "restaurant-sunset", "category_id": "european", "is_featured": True, "is_recommended": False, "has_promo": True},
    {"id": "bbq", "name": "BBQ GARDEN", "rating": "4.5", "delivery": "25–30 мин", "img": "icons/bbq.png", "screen": "restaurant-bbq", "category_id": "bbq", "is_featured": True, "is_recommended": True, "has_promo": False},
    {"id": "kubdari", "name": "ДОМ КУБДАРИ", "rating": "4.9", "delivery": "20–25 мин", "img": "icons/кудбари.png", "screen": "restaurant-kubdari", "category_id": "georgian", "is_featured": True, "is_recommended": True, "has_promo": True},
    {"id": "laila", "name": "CAFE LAILA", "rating": "4.8", "delivery": "15–20 мин", "img": "icons/laila.png", "screen": "restaurant-laila", "category_id": "local", "is_featured": True, "is_recommended": True, "has_promo": False},
    {"id": "ushba", "name": "CAFE USHBA", "rating": "4.6", "delivery": "30–35 мин", "img": "icons/ushba.png", "screen": "restaurant-ushba", "category_id": "georgian", "is_featured": False, "is_recommended": True, "has_promo": True},
]

products_data = [
    # Kubdari products
    {"id": "kubdari-1", "restaurant_id": "kubdari", "name": "Кубдари классический", "description": "Традиционный сванский пирог с мясом, приготовленный по старинному рецепту", "price": 25.0, "img": "icons/кудбари.png", "category": "main", "weight": "350г", "calories": "420", "proteins": "18", "fats": "22", "carbs": "38", "ingredients": "Мука, говядина, свинина, лук, чеснок, специи"},
    {"id": "kubdari-2", "restaurant_id": "kubdari", "name": "Хачапури по-аджарски", "description": "Лодочка с сыром сулугуни, яйцом и маслом", "price": 18.0, "img": "", "category": "main", "weight": "320г", "calories": "380", "proteins": "15", "fats": "20", "carbs": "35", "ingredients": "Мука, сыр сулугуни, яйцо, масло сливочное"},
    {"id": "kubdari-3", "restaurant_id": "kubdari", "name": "Хинкали (5 шт)", "description": "Классические грузинские хинкали с сочной начинкой", "price": 15.0, "img": "", "category": "main", "weight": "400г", "calories": "350", "proteins": "16", "fats": "14", "carbs": "40", "ingredients": "Мука, говядина, свинина, лук, кинза, специи"},
    {"id": "kubdari-4", "restaurant_id": "kubdari", "name": "Лобио", "description": "Пряная фасоль по-грузински", "price": 12.0, "img": "", "category": "appetizers", "weight": "250г", "calories": "180", "proteins": "10", "fats": "6", "carbs": "25", "ingredients": "Фасоль, лук, грецкий орех, специи"},
    {"id": "kubdari-5", "restaurant_id": "kubdari", "name": "Пхали ассорти", "description": "Набор из 4 видов пхали", "price": 14.0, "img": "", "category": "appetizers", "weight": "200г", "calories": "150", "proteins": "8", "fats": "8", "carbs": "12", "ingredients": "Шпинат, свекла, капуста, грецкий орех"},
    
    # Laila products  
    {"id": "laila-1", "restaurant_id": "laila", "name": "Шашлык из свинины", "description": "Сочный шашлык на углях с луком", "price": 28.0, "img": "", "category": "main", "weight": "200г", "calories": "290", "proteins": "25", "fats": "18", "carbs": "5", "ingredients": "Свинина, лук, специи"},
    {"id": "laila-2", "restaurant_id": "laila", "name": "Салат Цезарь", "description": "С курицей, пармезаном и соусом", "price": 16.0, "img": "", "category": "salads", "weight": "250г", "calories": "220", "proteins": "18", "fats": "12", "carbs": "10", "ingredients": "Салат романо, курица, пармезан, гренки, соус цезарь"},
    {"id": "laila-3", "restaurant_id": "laila", "name": "Харчо", "description": "Острый грузинский суп с говядиной", "price": 14.0, "img": "", "category": "soups", "weight": "350г", "calories": "180", "proteins": "12", "fats": "8", "carbs": "15", "ingredients": "Говядина, рис, ткемали, грецкий орех, специи"},
    {"id": "laila-4", "restaurant_id": "laila", "name": "Люля-кебаб", "description": "Рубленый кебаб из баранины", "price": 22.0, "img": "", "category": "main", "weight": "180г", "calories": "250", "proteins": "20", "fats": "15", "carbs": "8", "ingredients": "Баранина, лук, специи"},
    
    # BBQ products
    {"id": "bbq-1", "restaurant_id": "bbq", "name": "Ребрышки BBQ", "description": "Томленые свиные ребрышки в фирменном соусе", "price": 35.0, "img": "icons/bbq.png", "category": "main", "weight": "400г", "calories": "520", "proteins": "28", "fats": "35", "carbs": "18", "ingredients": "Свиные ребра, соус BBQ, специи"},
    {"id": "bbq-2", "restaurant_id": "bbq", "name": "Стейк рибай", "description": "Мраморная говядина средней прожарки", "price": 45.0, "img": "", "category": "main", "weight": "300г", "calories": "450", "proteins": "35", "fats": "32", "carbs": "0", "ingredients": "Говядина рибай, соль, перец"},
    {"id": "bbq-3", "restaurant_id": "bbq", "name": "Куриные крылья BBQ", "description": "Хрустящие крылья в остром соусе", "price": 18.0, "img": "", "category": "appetizers", "weight": "300г", "calories": "380", "proteins": "22", "fats": "25", "carbs": "12", "ingredients": "Куриные крылья, соус BBQ, специи"},
    {"id": "bbq-4", "restaurant_id": "bbq", "name": "Картофель фри", "description": "С фирменным соусом", "price": 8.0, "img": "", "category": "sides", "weight": "200г", "calories": "280", "proteins": "4", "fats": "15", "carbs": "35", "ingredients": "Картофель, масло, соль"},
    
    # Sunset products
    {"id": "sunset-1", "restaurant_id": "sunset", "name": "Паста Карбонара", "description": "Классическая итальянская паста с беконом", "price": 22.0, "img": "", "category": "main", "weight": "300г", "calories": "420", "proteins": "18", "fats": "22", "carbs": "40", "ingredients": "Спагетти, бекон, яйцо, пармезан, черный перец"},
    {"id": "sunset-2", "restaurant_id": "sunset", "name": "Стейк из лосося", "description": "Филе лосося на гриле с овощами", "price": 38.0, "img": "", "category": "main", "weight": "250г", "calories": "350", "proteins": "30", "fats": "20", "carbs": "8", "ingredients": "Лосось, лимон, овощи гриль, травы"},
    {"id": "sunset-3", "restaurant_id": "sunset", "name": "Тирамису", "description": "Классический итальянский десерт", "price": 12.0, "img": "", "category": "desserts", "weight": "150г", "calories": "280", "proteins": "6", "fats": "15", "carbs": "30", "ingredients": "Маскарпоне, савоярди, кофе, какао"},
    {"id": "sunset-4", "restaurant_id": "sunset", "name": "Греческий салат", "description": "Свежие овощи с фетой и оливками", "price": 14.0, "img": "", "category": "salads", "weight": "280г", "calories": "180", "proteins": "8", "fats": "12", "carbs": "10", "ingredients": "Помидоры, огурцы, фета, оливки, лук"},
    
    # Ushba products
    {"id": "ushba-1", "restaurant_id": "ushba", "name": "Оджахури", "description": "Жареная свинина с картофелем", "price": 24.0, "img": "", "category": "main", "weight": "350г", "calories": "450", "proteins": "22", "fats": "25", "carbs": "35", "ingredients": "Свинина, картофель, лук, зелень"},
    {"id": "ushba-2", "restaurant_id": "ushba", "name": "Чахохбили", "description": "Курица в томатном соусе", "price": 20.0, "img": "", "category": "main", "weight": "300г", "calories": "280", "proteins": "25", "fats": "12", "carbs": "15", "ingredients": "Курица, томаты, лук, чеснок, зелень"},
    {"id": "ushba-3", "restaurant_id": "ushba", "name": "Чкмерули", "description": "Цыпленок в чесночно-сливочном соусе", "price": 26.0, "img": "", "category": "main", "weight": "400г", "calories": "420", "proteins": "28", "fats": "30", "carbs": "8", "ingredients": "Цыпленок, сливки, чеснок, специи"},
    {"id": "ushba-4", "restaurant_id": "ushba", "name": "Лимонад домашний", "description": "Освежающий лимонад", "price": 6.0, "img": "", "category": "drinks", "weight": "400мл", "calories": "80", "proteins": "0", "fats": "0", "carbs": "20", "ingredients": "Лимон, сахар, мята, вода"},
]

stores_data = [
    {"id": "store1", "name": "Продукты 24", "img": "icons/Rectangle 16.png", "delivery": "15–25 мин", "sort_order": 1},
    {"id": "store2", "name": "Фермерский рынок", "img": "icons/Rectangle 17.png", "delivery": "20–30 мин", "sort_order": 2},
    {"id": "store3", "name": "Винный погреб", "img": "icons/Rectangle 20.png", "delivery": "20–30 мин", "sort_order": 3},
]


async def seed_database(db: AsyncSession):
    from sqlalchemy import select
    from models import AdminUser, UserRole
    import bcrypt
    
    result = await db.execute(select(Category))
    if result.scalars().first():
        return
    
    for cat in categories_data:
        db.add(Category(**cat))
    
    for rest in restaurants_data:
        db.add(Restaurant(**rest))
    
    for prod in products_data:
        db.add(Product(**prod))
    
    for store in stores_data:
        db.add(Store(**store))
    
    super_admin = AdminUser(
        username="admin",
        password_hash=bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode(),
        role=UserRole.SUPER_ADMIN,
        restaurant_id=None
    )
    db.add(super_admin)
    
    restaurant_admin = AdminUser(
        username="kubdari_admin",
        password_hash=bcrypt.hashpw("kubdari123".encode(), bcrypt.gensalt()).decode(),
        role=UserRole.RESTAURANT_ADMIN,
        restaurant_id="kubdari"
    )
    db.add(restaurant_admin)
    
    await db.commit()
    print("Database seeded successfully")
