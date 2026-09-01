/**
 * Lightweight client-side profanity check. The authoritative check is the
 * database trigger (see migration 20260515120000_app_store_moderation.sql) —
 * this helper provides instant UI feedback before submit. Keep the list small
 * and conservative; expand on the server side if needed.
 */
const BANNED = [
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'asshole',
  'dick',
  'pussy',
  'nigger',
  'faggot',
  'retard',
  'whore',
  'slut',
  'rape',
  'molest',
  'kill yourself',
  'kys',
];

export function containsProfanity(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return BANNED.some((word) => normalized.includes(word));
}

/**
 * Returns null when input is clean, or a short reason string when it contains
 * banned language. Caller decides whether to display it as an inline form error.
 */
export function validateClean(text: string | null | undefined): string | null {
  return containsProfanity(text) ? 'Please remove prohibited language and try again.' : null;
}
