import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Shared by the app and web (keep both copies identical). The generated
// database types predate the stays migration, so stays access goes through
// an untyped client here.
export const stayDb = supabase as unknown as SupabaseClient;

export type StayKind = 'hotel' | 'guest_house' | 'apartment' | 'lodge';
export const STAY_KINDS: StayKind[] = ['hotel', 'guest_house', 'apartment', 'lodge'];
/**
 * What a stay can offer guests, stored as these keys in properties.amenities.
 * Labels live under stays.amenities.<key>; older free-text amenities show as typed.
 */
export const STAY_AMENITIES = [
  'wifi', 'parking', 'air_conditioning', 'hot_water', 'breakfast', 'restaurant',
  'pool', 'backup_power', 'tv', 'security', 'laundry', 'kitchen',
] as const;
export type StayAmenity = (typeof STAY_AMENITIES)[number];
export type BlockReason = 'offline_booking' | 'maintenance' | 'other';
export type StayStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'expired';
/** Deposit lifecycle: due after the host accepts, paid by the guest, released to the host on check-in day. */
export type StayPaymentStatus = 'not_required' | 'due' | 'paid' | 'released' | 'refund_due' | 'refunded';

export interface StayRoomType {
  id: string;
  property_id: string;
  name: string;
  description: string;
  nightly_price: number;
  max_guests: number;
  beds: string;
  amenities: string[];
  sort_order: number;
  active: boolean;
}

export interface StayRoom {
  id: string;
  room_type_id: string;
  property_id: string;
  label: string;
  active: boolean;
}

export interface StayBooking {
  id: string;
  property_id: string;
  room_type_id: string;
  room_id: string;
  kind: 'guest' | 'block';
  guest_id: string | null;
  status: StayStatus;
  check_in: string;
  check_out: string;
  guests: number;
  nightly_price: number;
  total_amount: number;
  guest_note: string;
  host_note: string;
  block_reason: BlockReason | null;
  expires_at: string | null;
  created_at: string;
  deposit_amount: number;
  commission_amount: number;
  payment_status: StayPaymentStatus;
  payment_due_at: string | null;
  property?: { id: string; title: string; location: string; town: string | null; images: string[] | null; owner_id: string; check_in_time: string | null; check_out_time: string | null } | null;
  room_type?: { name: string } | null;
  room?: { label: string } | null;
  guest?: { id: string; full_name: string | null; avatar_url: string | null; phone: string | null } | null;
}

export interface RoomAvailability {
  room_type_id: string;
  name: string;
  description: string;
  nightly_price: number;
  max_guests: number;
  beds: string;
  amenities: string[];
  total_rooms: number;
  available_rooms: number;
}

// ---------------------------------------------------------------------------
// Dates. Stays are nights [check_in, check_out) as local calendar days.
// ---------------------------------------------------------------------------
export const toISODate = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};
export const fromISODate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s: string, n: number) => {
  const d = fromISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};
export const todayISO = () => toISODate(new Date());
export const nightsBetween = (checkIn: string, checkOut: string) =>
  Math.round((fromISODate(checkOut).getTime() - fromISODate(checkIn).getTime()) / 86400000);
export const formatStayDay = (s: string, locale: string) =>
  fromISODate(s).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
export const formatStayRange = (checkIn: string, checkOut: string, locale: string) => {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${fromISODate(checkIn).toLocaleDateString(locale, opts)} – ${fromISODate(checkOut).toLocaleDateString(locale, opts)}`;
};
export const formatTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);

/** True when the night `day` falls inside the booking. */
export const coversNight = (b: Pick<StayBooking, 'check_in' | 'check_out'>, day: string) =>
  b.check_in <= day && day < b.check_out;

const depositLapsed = (b: Pick<StayBooking, 'payment_status' | 'payment_due_at'>) =>
  b.payment_status === 'due' && !!b.payment_due_at && new Date(b.payment_due_at) <= new Date();

/** An active booking or block holds its room (lapsed requests and unpaid deposits do not). */
export const isHolding = (b: Pick<StayBooking, 'status' | 'expires_at' | 'payment_status' | 'payment_due_at'>) =>
  (b.status === 'confirmed' && !depositLapsed(b)) ||
  (b.status === 'pending' && (!b.expires_at || new Date(b.expires_at) > new Date()));

export type StayDisplayStatus = StayStatus | 'completed' | 'staying' | 'awaiting_payment';

/** Display status: accepted-but-unpaid reads as awaiting payment; finished stays read as completed. */
export const displayStatus = (b: StayBooking): StayDisplayStatus => {
  if (b.status === 'pending' && b.expires_at && new Date(b.expires_at) <= new Date()) return 'expired';
  if (b.status !== 'confirmed') return b.status;
  if (b.payment_status === 'due') return depositLapsed(b) ? 'expired' : 'awaiting_payment';
  const today = todayISO();
  if (b.check_out <= today) return 'completed';
  if (b.check_in <= today) return 'staying';
  return 'confirmed';
};

export const stayRef = (id: string) => `#${String(id).slice(0, 8).toUpperCase()}`;

/** Supabase errors from the stay functions carry a readable message. */
export const stayErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { message?: string } | null)?.message;
  if (!message) return fallback;
  if (message.includes('stay_bookings_no_overlap')) return fallback;
  return message;
};

// ---------------------------------------------------------------------------
// Deposit terms. Mirrors public.stay_quote in the database.
// ---------------------------------------------------------------------------
export interface StayTerms {
  payments_enabled: boolean;
  commission_bps: number;
  free_cancel_days: number;
}
export const NO_DEPOSIT_TERMS: StayTerms = { payments_enabled: false, commission_bps: 0, free_cancel_days: 0 };

export async function fetchStayTerms(): Promise<StayTerms> {
  const { data, error } = await stayDb.from('stay_settings').select('payments_enabled,commission_bps,free_cancel_days').maybeSingle();
  if (error || !data) return NO_DEPOSIT_TERMS;
  return data as StayTerms;
}

/** Deposit = first night, at least Propella's commission, at most the whole stay. */
export function stayQuote(terms: StayTerms, nightlyPrice: number, nights: number) {
  const total = nightlyPrice * nights;
  if (!terms.payments_enabled || total <= 0) return { total, deposit: 0, commission: 0, atProperty: total };
  const commission = Math.round((total * terms.commission_bps) / 10000);
  const deposit = Math.min(total, Math.max(nightlyPrice, commission));
  return { total, deposit, commission, atProperty: total - deposit };
}

/** Amount the host receives from the deposit (the rest is paid to them at the property). */
export const hostDepositShare = (b: Pick<StayBooking, 'deposit_amount' | 'commission_amount'>) =>
  Math.max(0, Number(b.deposit_amount || 0) - Number(b.commission_amount || 0));

export type MobileMoneyService = 'MTN' | 'ORANGE';
/** Orange numbers start 655-659 or 69x; everything else defaults to MTN. */
export const guessService = (phone: string): MobileMoneyService => {
  const n = phone.replace(/\D/g, '').replace(/^237/, '');
  return /^(69|65[5-9])/.test(n) ? 'ORANGE' : 'MTN';
};

async function invokeStayPayment(body: Record<string, unknown>) {
  const { data, error } = await stayDb.functions.invoke('stay-payment', { body });
  if (error) {
    const detail = await (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.().catch(() => null);
    throw new Error(detail?.error || error.message);
  }
  return data as { status: 'pending' | 'successful' | 'failed' | 'none'; message: string };
}

export const payStayDeposit = (bookingId: string, phone: string, service: MobileMoneyService) =>
  invokeStayPayment({ action: 'collect', bookingId, phone, service });
export const checkStayPayment = (bookingId: string) => invokeStayPayment({ action: 'check', bookingId });

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
const BOOKING_SELECT =
  '*, property:properties(id,title,location,town,images,owner_id,check_in_time,check_out_time), room_type:stay_room_types(name), room:stay_rooms(label)';

export async function fetchRoomSetup(propertyId: string) {
  const [types, rooms] = await Promise.all([
    stayDb.from('stay_room_types').select('*').eq('property_id', propertyId).order('sort_order').order('created_at'),
    stayDb.from('stay_rooms').select('*').eq('property_id', propertyId).order('label'),
  ]);
  if (types.error) throw types.error;
  if (rooms.error) throw rooms.error;
  return { roomTypes: (types.data || []) as StayRoomType[], rooms: (rooms.data || []) as StayRoom[] };
}

export async function fetchAvailability(propertyId: string, checkIn: string, checkOut: string) {
  const { data, error } = await stayDb.rpc('stay_availability', {
    p_property: propertyId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  });
  if (error) throw error;
  return (data || []) as RoomAvailability[];
}

/** Bookings and blocks touching [from, to) for one property (host view). */
export async function fetchPropertyCalendar(propertyId: string, from: string, to: string) {
  const { data, error } = await stayDb
    .from('stay_bookings')
    .select('*, guest:profiles!stay_bookings_guest_id_fkey(id,full_name,avatar_url,phone), room_type:stay_room_types(name), room:stay_rooms(label)')
    .eq('property_id', propertyId)
    .in('status', ['pending', 'confirmed'])
    .lt('check_in', to)
    .gt('check_out', from);
  if (error) throw error;
  return ((data || []) as StayBooking[]).filter(isHolding);
}

/** Guest bookings across all of a host's stays. */
export async function fetchHostBookings(propertyIds: string[]) {
  if (!propertyIds.length) return [] as StayBooking[];
  const { data, error } = await stayDb
    .from('stay_bookings')
    .select(`${BOOKING_SELECT}, guest:profiles!stay_bookings_guest_id_fkey(id,full_name,avatar_url,phone)`)
    .in('property_id', propertyIds)
    .eq('kind', 'guest')
    .gte('check_out', addDays(todayISO(), -30))
    .order('check_in', { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data || []) as StayBooking[];
}

export async function fetchMyStays(userId: string) {
  const { data, error } = await stayDb
    .from('stay_bookings')
    .select(BOOKING_SELECT)
    .eq('guest_id', userId)
    .eq('kind', 'guest')
    .order('check_in', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []) as StayBooking[];
}

export async function fetchHostStayProperties(ownerId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('id,title,location,town,images,price,status,owner_review_pending,owner_id,category,stay_kind,amenities,check_in_time,check_out_time,availability_confirmed_at')
    .eq('owner_id', ownerId)
    .eq('type', 'stay' as never)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Array<{
    id: string; title: string; location: string; town: string | null; images: string[] | null; price: number;
    status: string | null; owner_review_pending: boolean; owner_id: string; category: string | null;
    stay_kind: string | null; amenities: string[] | null; check_in_time: string | null; check_out_time: string | null;
    availability_confirmed_at: string | null;
  }>;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
export async function requestStayBooking(input: { roomTypeId: string; checkIn: string; checkOut: string; guests: number; note?: string }) {
  const { data, error } = await stayDb.rpc('request_stay_booking', {
    p_room_type: input.roomTypeId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_guests: input.guests,
    p_note: input.note || '',
  });
  if (error) throw error;
  return data as string;
}

export async function respondStayBooking(bookingId: string, decision: 'confirm' | 'decline', note = '') {
  const { error } = await stayDb.rpc('respond_stay_booking', { p_booking: bookingId, p_decision: decision, p_note: note });
  if (error) throw error;
}

export async function cancelStayBooking(bookingId: string, note = '') {
  const { error } = await stayDb.rpc('cancel_stay_booking', { p_booking: bookingId, p_note: note });
  if (error) throw error;
}

export async function setRoomAvailability(input: { roomId: string; from: string; to: string; available: boolean; reason?: BlockReason; note?: string }) {
  const { data, error } = await stayDb.rpc('set_stay_room_availability', {
    p_room: input.roomId,
    p_from: input.from,
    p_to: input.to,
    p_available: input.available,
    p_reason: input.reason || 'offline_booking',
    p_note: input.note || '',
  });
  if (error) throw error;
  return data as number;
}

export async function saveRoomType(propertyId: string, input: Partial<StayRoomType> & { name: string; nightly_price: number; max_guests: number }) {
  const row = {
    property_id: propertyId,
    name: input.name.trim(),
    description: (input.description || '').trim(),
    nightly_price: Math.round(input.nightly_price),
    max_guests: input.max_guests,
    beds: (input.beds || '').trim(),
    amenities: input.amenities || [],
    sort_order: input.sort_order ?? 0,
    active: input.active ?? true,
  };
  const query = input.id
    ? stayDb.from('stay_room_types').update(row).eq('id', input.id).select().single()
    : stayDb.from('stay_room_types').insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data as StayRoomType;
}

/** Room types with booking history are archived instead of deleted. */
export async function removeRoomType(id: string) {
  const { count } = await stayDb.from('stay_bookings').select('id', { count: 'exact', head: true }).eq('room_type_id', id).eq('kind', 'guest');
  if (count && count > 0) {
    const { error } = await stayDb.from('stay_room_types').update({ active: false }).eq('id', id);
    if (error) throw error;
    await stayDb.from('stay_rooms').update({ active: false }).eq('room_type_id', id);
    return 'archived' as const;
  }
  const { error } = await stayDb.from('stay_room_types').delete().eq('id', id);
  if (error) throw error;
  return 'deleted' as const;
}

export async function addRooms(propertyId: string, roomTypeId: string, labels: string[]) {
  const rows = labels.map((label) => ({ property_id: propertyId, room_type_id: roomTypeId, label: label.trim() })).filter((r) => r.label);
  if (!rows.length) return [] as StayRoom[];
  const { data, error } = await stayDb.from('stay_rooms').insert(rows).select();
  if (error) throw error;
  return (data || []) as StayRoom[];
}

export async function removeRoom(id: string) {
  const { count } = await stayDb.from('stay_bookings').select('id', { count: 'exact', head: true }).eq('room_id', id).eq('kind', 'guest');
  if (count && count > 0) {
    const { error } = await stayDb.from('stay_rooms').update({ active: false }).eq('id', id);
    if (error) throw error;
    return 'archived' as const;
  }
  const { error } = await stayDb.from('stay_rooms').delete().eq('id', id);
  if (error) throw error;
  return 'deleted' as const;
}

/** Suggest the next labels, e.g. after "101, 102" comes "103". */
export function suggestRoomLabels(existing: string[], count: number) {
  const numbers = existing.map((l) => Number(l)).filter((n) => Number.isFinite(n) && n > 0);
  let next = numbers.length ? Math.max(...numbers) + 1 : 1;
  const taken = new Set(existing);
  const out: string[] = [];
  while (out.length < count) {
    const label = String(next++);
    if (!taken.has(label)) out.push(label);
  }
  return out;
}
