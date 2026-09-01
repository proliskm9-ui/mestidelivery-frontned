# Задача: зональный расчёт стоимости доставки

## Контекст проекта
- Стек: React + TypeScript + Vite + Tailwind + Firebase (Firestore)
- Firebase project: `mestidelivery`
- Уже есть кастомный i18n (RU/EN/KA), хук `useLanguage()`
- Нужно добавить расчёт стоимости доставки на основе геозон (без адресов улиц — в Местии у улиц часто нет названий)

## Общая логика
1. Клиент выбирает точку на карте (координаты) вместо ввода адреса.
2. Точка проверяется на попадание в один из заранее нарисованных полигонов-зон.
3. Каждой зоне соответствует фиксированная цена доставки.
4. Если точка не попала ни в одну зону — fallback-логика (см. ниже).

## 1. Установка зависимостей
```bash
npm install leaflet react-leaflet @turf/boolean-point-in-polygon @turf/helpers
npm install -D @types/leaflet
```

## 2. Структура данных в Firestore

Гибридная схема: зоны бывают двух типов.
- `circle` — центр + радиус в метрах. Для правильных круглых зон (центр посёлка, аэропорт) — НЕ нужно рисовать в geojson.io, просто вбить координату центра и радиус вручную.
- `polygon` — произвольная форма. Только для зон, которые реально не круг (деревни вдоль долины/дороги). Рисуется в geojson.io инструментом Polygon (НЕ Circle) — 5-8 точек руками, без лишней точности.

```ts
interface DeliveryZoneCircle {
  id: string;
  type: 'circle';
  name: { ru: string; en: string; ka: string };
  price: number; // в лари
  priority: number;
  center: [number, number]; // [lng, lat]
  radiusMeters: number;
  active: boolean;
}

interface DeliveryZonePolygon {
  id: string;
  type: 'polygon';
  name: { ru: string; en: string; ka: string };
  price: number;
  priority: number;
  polygon: [number, number][]; // [lng, lat][] — формат GeoJSON, из geojson.io
  active: boolean;
}

type DeliveryZone = DeliveryZoneCircle | DeliveryZonePolygon;
```

Полигон-зоны рисуются вручную на geojson.io (Polygon tool, не Circle tool), координаты копируются в Firestore. Circle-зоны заполняются напрямую — центр и радиус, без внешнего инструмента.

Финальные координаты и цены зон — см. Приложение A в конце документа (готовый TS-массив для сидинга Firestore).

## 3. Компонент выбора точки на карте

Файл: `src/components/delivery/LocationPicker.tsx`

Требования:
- Использует `react-leaflet`, тайлы OpenStreetMap
- Центр карты по умолчанию — центр Местии (координаты уточнить)
- Draggable-маркер, который клиент может перетащить или поставить кликом
- При изменении позиции — колбэк `onLocationChange(lat: number, lng: number)`
- Поддержка автокомплита по отелям/гестхаусам: если у клиента выбран отель из существующего поля (уже есть на сайте), подставлять его сохранённые координаты автоматически и центрировать карту на нём, но оставлять возможность скорректировать пин вручную
- Стилизация в брендовой палитре проекта (тёмный фон #0D0D0D–#14161A, акцент #21EA7C), тайлы карты — со slight dark filter через CSS, если возможно

## 4. Функция расчёта зоны и цены

Файл: `src/lib/delivery/calculateZonePrice.ts`

```ts
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import type { DeliveryZone } from '../../types/delivery';

interface ZonePriceResult {
  zoneId: string;
  zoneName: string;
  price: number;
}

// расстояние между двумя точками в метрах (Haversine)
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function calculateZonePrice(
  lat: number,
  lng: number,
  zones: DeliveryZone[]
): ZonePriceResult | null {
  const sortedZones = [...zones]
    .filter(z => z.active)
    .sort((a, b) => a.priority - b.priority);

  for (const zone of sortedZones) {
    let hit = false;

    if (zone.type === 'circle') {
      const [centerLng, centerLat] = zone.center;
      hit = distanceMeters(lat, lng, centerLat, centerLng) <= zone.radiusMeters;
    } else {
      const pt = point([lng, lat]); // turf: сначала lng, потом lat
      const poly = polygon([zone.polygon]);
      hit = booleanPointInPolygon(pt, poly);
    }

    if (hit) {
      return {
        zoneId: zone.id,
        zoneName: zone.name.ru, // подставлять по текущему языку через useLanguage
        price: zone.price,
      };
    }
  }

  return null; // точка вне всех зон — обработать fallback
}
```

## 5. Fallback для точек вне зон

Если `calculateZonePrice` вернул `null`:
- Показать клиенту сообщение: "Точная стоимость доставки для вашего адреса уточняется" (на 3 языках через i18n)
- Дать кнопку "Уточнить в Telegram" со ссылкой на бот/оператора
- НЕ блокировать оформление заказа полностью — либо ставить дефолтную максимальную цену зоны (например, 25 GEL) с пометкой "предварительно", либо переводить заказ в статус "требует подтверждения цены"

## 6. Кеширование зон

Зоны не меняются часто — загружать их из Firestore один раз при старте checkout-флоу (не на каждый чек), кешировать в React state/context. Использовать `onSnapshot` только если нужно живое обновление зон из админки, иначе — обычный `getDocs`.

## 7. Интеграция в существующий checkout

- Найти текущий компонент выбора адреса в checkout-флоу и заменить/дополнить его `LocationPicker`
- Итоговая цена доставки (`price` из `calculateZonePrice`) должна попадать в объект заказа, сохраняемый в Firestore, вместе с `zoneId` и raw-координатами (для последующей аналитики и возможного пересчёта зон)

## 8. Автоматическое определение геолокации пользователя

На шаге оформления заказа система должна попытаться определить местоположение клиента автоматически, дать подтвердить/поправить, и пересчитывать цену доставки в реальном времени при любом изменении точки.

### 8.1 Инструмент
Использовать **только** `navigator.geolocation` (Browser Geolocation API), НЕ IP-геолокацию. IP-геолокация в Местии даёт точность максимум "город/регион" (из-за роутинга мобильных операторов), это бесполезно и может показать соседний регион или даже Тбилиси. IP-based сервис (например ipapi.co) можно использовать по желанию только для того, чтобы примерно навести камеру карты до получения GPS-координат — но не для расчёта цены.

### 8.2 Поток
1. При входе на шаг с картой — вызвать `navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 10000 })`.
2. **Успех** → поставить пин в полученные `coords.latitude / coords.longitude`, показать баннер/модалку: "Это ваше местоположение?" с кнопками "Да, всё верно" / "Указать вручную". Пин в любом случае должен оставаться draggable — GPS может ошибаться на 20-50м в помещении.
3. **Отказ / ошибка / таймаут** → пина нет, карта центрируется на дефолтной точке (центр Местии), пользователь ставит пин вручную. Заказ нельзя продолжить оформлять, пока пин не установлен.
4. **Если выбран отель** из существующего поля выбора отеля — шаг геолокации полностью пропускается, координаты берутся из сохранённых данных отеля (`hotels` коллекция), но пин всё равно остаётся перетаскиваемым для точной корректировки.

### 8.3 Live-пересчёт цены
`LocationPicker` уже вызывает `onLocationChange(lat, lng)` при каждом перемещении пина (см. раздел 3). На этот колбэк нужно повесить вызов `calculateZonePrice(lat, lng, zones)` и сразу обновлять стоимость доставки в state заказа — без отдельной кнопки "рассчитать". Двигает пин → сумма в чеке меняется мгновенно.

```ts
function handleLocationChange(lat: number, lng: number) {
  setOrderLocation({ lat, lng });
  const zoneResult = calculateZonePrice(lat, lng, zones);
  setDeliveryPrice(zoneResult?.price ?? null); // null → показать fallback-UI (см. раздел 5)
}
```

## 9. Что НЕ делать
- Не парсить/не завязываться на текстовые адреса или названия улиц
- Не считать расстояние по прямой (Haversine) как основной метод определения зоны для полигонов — Haversine используется только внутри `calculateZonePrice` для circle-зон (см. раздел 4)
- Не использовать IP-геолокацию для расчёта цены доставки — только для необязательного предварительного наведения камеры карты (см. раздел 8.1)

## 10. Приоритет реализации
1. Firestore структура зон + сидинг стартовых зон (координаты и цены — см. приложенные данные зон ниже, если есть)
2. `calculateZonePrice` + юнит-тест на пару известных координат
3. `LocationPicker` компонент
4. Geolocation-флоу (раздел 8) + live-пересчёт цены
5. Интеграция в checkout + fallback UI

## Приложение A: финальные данные зон (готово для seed-скрипта)

Границы нарисованы вручную в geojson.io и проверены на карте. Приоритет аэропорта ниже (проверяется раньше центра), т.к. на границе (район Boris Kakhiani St / Svanland) полигоны слегка соприкасаются — в спорной точке должен побеждать аэропорт.

**Цена зоны "Ближайшие деревни" пока не финализирована** — изначально называлась "20+", берётся 20 GEL как рабочее значение. Уточнить у sxclipse перед деплоем в прод.

```ts
import type { DeliveryZonePolygon } from '../types/delivery';

export const deliveryZonesSeed: DeliveryZonePolygon[] = [
  {
    id: 'center',
    type: 'polygon',
    name: { ru: 'Центр', en: 'Center', ka: 'ცენტრი' },
    price: 6,
    priority: 10,
    active: true,
    polygon: [
      [42.7196428, 43.0457764],
      [42.7359313, 43.0496754],
      [42.7430402, 43.0488665],
      [42.7432624, 43.0464762],
      [42.7313297681886, 43.03972305635591],
      [42.7187464, 43.0387727],
      [42.7109163, 43.0406114],
      [42.7124842, 43.0431491],
      [42.7196428, 43.0457764],
    ],
  },
  {
    id: 'airport',
    type: 'polygon',
    name: { ru: 'Аэропорт', en: 'Airport', ka: 'აეროპორტი' },
    price: 10,
    priority: 5,
    active: true,
    polygon: [
      [42.7359232, 43.0496743],
      [42.7430921, 43.0488016],
      [42.7433128, 43.0465062],
      [42.7501654, 43.0532702],
      [42.7553204, 43.0560789],
      [42.7568654, 43.0632547],
      [42.754471, 43.0664274],
      [42.7484947, 43.0659379],
      [42.74565336348752, 43.059324132959574],
      [42.7437913, 43.058875],
      [42.7376402, 43.0542696],
      [42.7356013, 43.0522719],
      [42.7359232, 43.0496743],
    ],
  },
  {
    id: 'nearby_villages',
    type: 'polygon',
    name: { ru: 'Ближайшие деревни', en: 'Nearby villages', ka: 'ახლომდებარე სოფლები' },
    price: 20, // TODO: уточнить точную цену перед продом (было "20+")
    priority: 20,
    active: true,
    polygon: [
      [42.6853955, 43.0326456],
      [42.6879751, 43.0295077],
      [42.6879766, 43.0293913],
      [42.6934836, 43.0303123],
      [42.6965897, 43.0294926],
      [42.7012472, 43.0305394],
      [42.7060705, 43.0341872],
      [42.7187084, 43.0387588],
      [42.7110041, 43.0406371],
      [42.71237261473104, 43.04306926101026],
      [42.6968161, 43.0399311],
      [42.6892699, 43.0379006],
      [42.6829552, 43.0355462],
      [42.6853955, 43.0326456],
    ],
  },
];
```

Покрывает: Центр (плотная застройка Местии), Аэропорт (UGMS + Ланчвали/Лалаиди/Лагами/Сванланд), Ближайшие деревни (Ленджери, Несгуни, Лемсия, Лашткхери, Кашвети). Точки вне всех трёх зон обрабатываются по fallback-логике из раздела 5.
