from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    RESTAURANT_ADMIN = "restaurant_admin"
    COURIER = "courier"


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    icon = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)

    restaurants = relationship("Restaurant", back_populates="category")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    rating = Column(String, nullable=False)
    delivery = Column(String, nullable=False)
    img = Column(String, nullable=False)
    screen = Column(String, nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    is_featured = Column(Boolean, default=False)
    is_recommended = Column(Boolean, default=False)
    has_promo = Column(Boolean, default=False)
    min_order = Column(Integer, default=0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, default="")

    category = relationship("Category", back_populates="restaurants")
    products = relationship("Product", back_populates="restaurant")


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    img = Column(String, default="")
    category = Column(String, default="")
    weight = Column(String, default="")
    calories = Column(String, default="")
    proteins = Column(String, default="")
    fats = Column(String, default="")
    carbs = Column(String, default="")
    ingredients = Column(Text, default="")

    restaurant = relationship("Restaurant", back_populates="products")


class Store(Base):
    __tablename__ = "stores"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    img = Column(String, nullable=False)
    delivery = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    restaurant_id = Column(String, nullable=False)
    items = Column(Text, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, server_default=func.now())
    customer_name = Column(String, nullable=False, default="")
    phone = Column(String, nullable=False, default="")
    address = Column(String, nullable=False, default="")
    comment = Column(Text, default="")
    # Координаты доставки
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    # Тип и время
    place_type = Column(String, default="")  # apartment, house, office, other
    scheduled_time = Column(DateTime, nullable=True)  # Время доставки "ко времени"
    promo_code = Column(String, default="")  # Использованный промокод
    discount = Column(Float, default=0)  # Размер скидки
    tips = Column(Float, default=0)  # Чаевые курьеру
    delivery_fee = Column(Float, default=5)  # Стоимость доставки
    # Скрытая комиссия и курьер
    service_fee = Column(Float, default=0)  # Скрытая комиссия сервиса
    courier_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    courier_taken_at = Column(DateTime, nullable=True)  # Время когда курьер взял заказ
    # Подтверждение выдачи
    restaurant_confirmed = Column(Boolean, default=False)  # Ресторан подтвердил выдачу
    courier_confirmed = Column(Boolean, default=False)  # Курьер подтвердил получение
    restaurant_confirmed_at = Column(DateTime, nullable=True)
    courier_confirmed_at = Column(DateTime, nullable=True)
    rating = Column(Integer, nullable=True)
    rating_comment = Column(Text, nullable=True)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    # Для курьеров
    is_online = Column(Boolean, default=False)  # Курьер онлайн
    push_token = Column(String, nullable=True)  # Токен для push-уведомлений


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class CourierLocation(Base):
    """Текущее местоположение курьера (обновляется в реальном времени)"""
    __tablename__ = "courier_locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    courier_id = Column(Integer, ForeignKey("admin_users.id"), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    heading = Column(Float, nullable=True)  # Направление движения
    speed = Column(Float, nullable=True)  # Скорость
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    courier = relationship("AdminUser")


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False)
    discount_percent = Column(Integer, default=0)  # Скидка в процентах
    discount_amount = Column(Float, default=0)  # Фиксированная скидка
    min_order = Column(Float, default=0)  # Минимальная сумма заказа
    max_uses = Column(Integer, default=0)  # 0 = безлимит
    current_uses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=True)  # null = для всех
    created_at = Column(DateTime, server_default=func.now())
