/** Restaurant working hours helpers (Asia/Tbilisi). */

export type WorkingHoursMap = Record<string, string>;

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const DEFAULT_HOURS: WorkingHoursMap = {
  mon: '10:00-22:00',
  tue: '10:00-22:00',
  wed: '10:00-22:00',
  thu: '10:00-22:00',
  fri: '10:00-22:00',
  sat: '10:00-22:00',
  sun: '10:00-22:00',
};

export function getTbilisiNow(date = new Date()): Date {
  // Interpret "now" in Asia/Tbilisi wall clock.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  return new Date(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
    Number(get('hour')),
    Number(get('minute')),
    Number(get('second')),
  );
}

export function parseWorkingHours(raw?: string | null): WorkingHoursMap {
  if (!raw || !String(raw).trim()) return { ...DEFAULT_HOURS };
  try {
    const parsed = JSON.parse(String(raw));
    if (parsed && typeof parsed === 'object') return { ...DEFAULT_HOURS, ...parsed };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_HOURS };
}

function parseHHMM(s: string): { h: number; m: number } | null {
  const m = String(s).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function windowForDay(hours: WorkingHoursMap, day: Date): { start: number; end: number } | null {
  const key = DAY_KEYS[day.getDay()];
  const raw = (hours[key] || '').trim();
  if (!raw || raw.toLowerCase() === 'closed') return null;
  const [a, b] = raw.split('-');
  const start = parseHHMM(a || '');
  const end = parseHHMM(b || '');
  if (!start || !end) return null;
  const startMin = start.h * 60 + start.m;
  const endMin = end.h * 60 + end.m;
  if (endMin <= startMin) return null;
  return { start: startMin, end: endMin };
}

export function isRestaurantOpenNow(workingHours?: string | null, at = new Date()): boolean {
  const local = getTbilisiNow(at);
  const win = windowForDay(parseWorkingHours(workingHours), local);
  if (!win) return false;
  const mins = local.getHours() * 60 + local.getMinutes();
  return mins >= win.start && mins < win.end;
}

export function nextOpenAt(workingHours?: string | null, at = new Date()): Date | null {
  const hours = parseWorkingHours(workingHours);
  const local = getTbilisiNow(at);
  for (let offset = 0; offset < 14; offset++) {
    const day = new Date(local);
    day.setDate(local.getDate() + offset);
    day.setHours(0, 0, 0, 0);
    const win = windowForDay(hours, day);
    if (!win) continue;
    const open = new Date(day);
    open.setHours(Math.floor(win.start / 60), win.start % 60, 0, 0);
    if (offset === 0) {
      const mins = local.getHours() * 60 + local.getMinutes();
      if (mins < win.start) return open;
      if (mins < win.end) return null; // already open
      continue;
    }
    return open;
  }
  return null;
}

export function formatOpenLabel(openAt: Date | null, lang: string = 'ru'): string {
  if (!openAt) return '';
  const now = getTbilisiNow();
  const hh = String(openAt.getHours()).padStart(2, '0');
  const mm = String(openAt.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;
  const sameDay =
    openAt.getFullYear() === now.getFullYear() &&
    openAt.getMonth() === now.getMonth() &&
    openAt.getDate() === now.getDate();
  if (lang === 'en') {
    return sameDay ? `Opens today at ${time}` : `Opens tomorrow at ${time}`;
  }
  if (lang === 'ka') {
    return sameDay ? `იხსნება დღეს ${time}-ზე` : `იხსნება ხვალ ${time}-ზე`;
  }
  // If not today and not tomorrow — show date
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    openAt.getFullYear() === tomorrow.getFullYear() &&
    openAt.getMonth() === tomorrow.getMonth() &&
    openAt.getDate() === tomorrow.getDate();
  if (sameDay) return `Откроется сегодня в ${time}`;
  if (isTomorrow) return `Откроется завтра в ${time}`;
  const dd = String(openAt.getDate()).padStart(2, '0');
  const mo = String(openAt.getMonth() + 1).padStart(2, '0');
  return `Откроется ${dd}.${mo} в ${time}`;
}

export type TimeSlot = {
  /** Display label e.g. 10:30-10:50 */
  label: string;
  /** API value with date: 2026-08-08 10:30 */
  value: string;
  start: Date;
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Generate bookable slots for a restaurant from working hours. */
export function generateRestaurantSlots(
  workingHours?: string | null,
  opts?: { slotStepMin?: number; slotLenMin?: number; daysAhead?: number; from?: Date },
): TimeSlot[] {
  const step = opts?.slotStepMin ?? 30;
  const len = opts?.slotLenMin ?? 20;
  const daysAhead = opts?.daysAhead ?? 3;
  const hours = parseWorkingHours(workingHours);
  const now = getTbilisiNow(opts?.from);
  const slots: TimeSlot[] = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    day.setHours(0, 0, 0, 0);
    const win = windowForDay(hours, day);
    if (!win) continue;

    for (let mins = win.start; mins + len <= win.end; mins += step) {
      const start = new Date(day);
      start.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      // Only future slots (at least ~5 min ahead)
      if (start.getTime() <= now.getTime() + 5 * 60 * 1000) continue;
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + len);
      const label = `${hm(start)}-${hm(end)}`;
      const value = `${ymd(start)} ${hm(start)}`;
      slots.push({ label, value, start });
    }
  }
  return slots;
}

export function closedBadgeText(workingHours?: string | null, lang: string = 'ru'): string | null {
  if (isRestaurantOpenNow(workingHours)) return null;
  const next = nextOpenAt(workingHours);
  const openLbl = formatOpenLabel(next, lang);
  if (openLbl) return openLbl;
  if (lang === 'en') return 'Temporarily not accepting orders';
  if (lang === 'ka') return 'დროებით არ იღებს შეკვეთებს';
  return 'Временно не принимает заказы';
}
