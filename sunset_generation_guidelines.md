# Sunset Visual Assets - Generation Protocol

## 1. Архитектурные ограничения (CRITICAL)
- **Целевая платформа:** Нативное мобильное приложение, ширина вьюпорта строго 393px. 
- **Формат:** Строго автономные графические ассеты. КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕТСЯ накладывать изображения на готовые контекстные шаблоны (no superimposing). 
- **Стиль UI:** Уникальная айдентика бренда (Matte Graphite / Dark Mode). Изображения должны бесшовно сливаться с темным фоном приложения.
- **Запретные слова:** В промптах для генерации КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать слово "Sunset", чтобы избежать галлюцинаций модели (солнце, логотипы, пейзажи на тарелках).

## 2. Метод генерации (Lightweight API)
Отказаться от локального рендера (PyTorch/diffusers) и платных API (Replicate/Stability). 
Использовать открытый бесплатный эндпоинт Pollinations AI, который возвращает готовое изображение по GET-запросу.
URL формат: `https://image.pollinations.ai/prompt/{URL_ENCODED_PROMPT}?width=400&height=400&nologo=true`

## 3. Формула идеального промпта
Каждый промпт для блюда должен строиться по следующей жесткой структуре:

**[БАЗА БЛЮДА]**, served on a matte dark graphite ceramic plate. 
**[РАКУРС]** 
Placed on a perfectly solid, uniform dark charcoal background (matching HEX #1A1A1A). 
Hyperrealistic food photography, professional studio lighting, macro details. 
Isolated standalone UI asset. No background clutter, no napkins, no cutlery, no text, no logos.

### Правила ракурсов ([РАКУРС]):
- Для объемных блюд (бургеры, салаты, горячее): `45-degree isometric angle perspective.`
- Для плоских блюд (пицца, выпечка, хачапури): `Strictly 90-degree top-down flatlay perspective.`

## 4. Задача
Скрипт должен брать название и описание блюда из JSON, подставлять в формулу, делать GET-запрос к Pollinations API и сохранять полученный `.jpg` прямо в папку `assets/sunset_menu/`.