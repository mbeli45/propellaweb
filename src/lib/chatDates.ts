/**
 * WhatsApp-style dates for chats.
 *
 * Conversation separators: Today · Yesterday · weekday (last 7 days) ·
 * "12 September" (this year) · "12 September 2025" (older).
 * Chat list timestamps:    14:32 · Yesterday · weekday (last 7 days) · 12/09/2025.
 *
 * Kept identical in propellaweb/src/lib/chatDates.ts.
 */

type DateInput = string | number | Date | null | undefined;

const toDate = (value: DateInput): Date | null => {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Whole calendar days between the date and today (0 = today, 1 = yesterday). */
export function calendarDaysAgo(value: DateInput, now: Date = new Date()): number | null {
  const date = toDate(value);
  if (!date) return null;
  return Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
}

export function isSameDay(a: DateInput, b: DateInput): boolean {
  const first = toDate(a);
  const second = toDate(b);
  return !!first && !!second && startOfDay(first) === startOfDay(second);
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Label for the day separator shown between messages in a conversation. */
export function chatDayLabel(
  value: DateInput,
  locale: string,
  labels: { today: string; yesterday: string },
): string {
  const date = toDate(value);
  const days = calendarDaysAgo(value);
  if (!date || days == null) return '';
  if (days <= 0) return labels.today;
  if (days === 1) return labels.yesterday;
  if (days < 7) return capitalise(date.toLocaleDateString(locale, { weekday: 'long' }));
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(locale, sameYear
    ? { day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Timestamp shown on a conversation row in the chat list. */
export function chatListTimestamp(value: DateInput, locale: string, yesterdayLabel: string): string {
  const date = toDate(value);
  const days = calendarDaysAgo(value);
  if (!date || days == null) return '';
  if (days <= 0) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return yesterdayLabel;
  if (days < 7) return capitalise(date.toLocaleDateString(locale, { weekday: 'long' }));
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
