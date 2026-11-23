// Synthetic data for the stays demo: made-up hosts, guests, stays and bookings.
// Dates are relative to the day the demo runs.
const IMG = (name) => `http://demo.supabase.test/storage/v1/object/public/demo/${name}.jpg`;

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const day = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); };
const hours = (n) => new Date(Date.now() + n * 3600e3).toISOString();
const nightsBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400e3);

const GUEST = { id: 'u-guest-amara', email: 'amara@demo.test', full_name: 'Amara Nkeng', role: 'user', phone: '+237670000001', avatar_url: null };
const HOST = { id: 'u-host-fako', email: 'host@demo.test', full_name: 'Mount Fako Lodge', role: 'host', phone: '+237690000002', avatar_url: null };
const OTHER_HOSTS = [
  { id: 'u-host-seaside', full_name: 'Seaside Guest House', role: 'host' },
  { id: 'u-host-bona', full_name: 'Bonapriso Suites', role: 'host' },
  { id: 'u-host-akwa', full_name: 'Akwa Business Hotel', role: 'host' },
  { id: 'u-host-kribi', full_name: 'Kribi Beach Lodge', role: 'host' },
];
const OTHER_GUESTS = ['Jean-Paul Ebong', 'Grace Tabi', 'Ngozi Achu', 'Samuel Kum', 'Fatima Bello', 'Eric Mbah', 'Linda Ojong', 'Paul Ndi', 'Sandrine Fon', 'Kevin Tanyi']
  .map((full_name, i) => ({ id: `u-g-${i}`, full_name, role: 'user', email: `guest${i}@demo.test`, phone: `+2376700001${pad(i)}`, avatar_url: null }));

const STAY_DEFAULTS = {
  type: 'stay', property_type: 'hotel', status: 'available', reserved_by: null, owner_review_pending: false, category: 'standard',
  bedrooms: null, bathrooms: null, kitchen: null, area: null, rent_period: null, reservation_fee: 0, advance_months_min: null, advance_months_max: null,
  verification_status: 'verified', latitude: null, longitude: null, video_url: null, videos: [], check_in_time: '14:00', check_out_time: '11:00',
  availability_confirmed_at: hours(-20), created_at: hours(-24 * 30), views: 0,
};
function stay(p) { return { ...STAY_DEFAULTS, ...p, image: p.images[0] }; }

const PROPERTIES = [
  stay({ id: 'p-fako', owner_id: HOST.id, title: 'Mount Fako Lodge', town: 'Buea', location: 'Molyko, Buea', stay_kind: 'hotel', category: 'premium', price: 18000,
    description: 'A quiet lodge at the foot of Mount Cameroon, ten minutes from the university. Breakfast on the terrace, hot water and backup power all night.',
    amenities: ['wifi', 'parking', 'hot_water', 'breakfast', 'backup_power', 'security', 'restaurant'],
    images: [IMG('fako-ext'), IMG('fako-dlx'), IMG('fako-lounge'), IMG('fako-std')], created_at: hours(-24 * 3) }),
  stay({ id: 'p-soppo', owner_id: HOST.id, title: 'Great Soppo Guest House', town: 'Buea', location: 'Great Soppo, Buea', stay_kind: 'guest_house', price: 12000,
    description: 'Three garden rooms run by the Mount Fako Lodge team.', amenities: ['wifi', 'hot_water', 'security'], images: [IMG('soppo-ext'), IMG('soppo-room')], created_at: hours(-24 * 8) }),
  stay({ id: 'p-seaside', owner_id: 'u-host-seaside', title: 'Seaside Guest House', town: 'Limbe', location: 'Down Beach, Limbe', stay_kind: 'guest_house', category: 'premium', price: 22000,
    description: 'Wake up to the sea at Down Beach.', amenities: ['wifi', 'air_conditioning', 'breakfast', 'parking'], images: [IMG('seaside-ext'), IMG('seaside-room')], created_at: hours(-24 * 5) }),
  stay({ id: 'p-bona', owner_id: 'u-host-bona', title: 'Bonapriso Furnished Apartment', town: 'Douala', location: 'Bonapriso, Douala', stay_kind: 'apartment', price: 35000,
    description: 'Two-bedroom apartment with a kitchen.', amenities: ['wifi', 'air_conditioning', 'kitchen', 'tv', 'backup_power'], images: [IMG('bonapriso-ext'), IMG('bonapriso-lounge')], created_at: hours(-24 * 6) }),
  stay({ id: 'p-akwa', owner_id: 'u-host-akwa', title: 'Akwa Business Hotel', town: 'Douala', location: 'Akwa, Douala', stay_kind: 'hotel', category: 'luxury', price: 40000,
    description: 'Business hotel close to the port.', amenities: ['wifi', 'air_conditioning', 'restaurant', 'pool', 'parking', 'security'], images: [IMG('akwa-ext'), IMG('akwa-room')], created_at: hours(-24 * 2) }),
  stay({ id: 'p-kribi', owner_id: 'u-host-kribi', title: 'Kribi Beach Lodge', town: 'Kribi', location: 'Grand Batanga, Kribi', stay_kind: 'lodge', price: 30000,
    description: 'Huts on the beach south of Kribi.', amenities: ['breakfast', 'restaurant', 'parking'], images: [IMG('kribi-ext'), IMG('kribi-room')], created_at: hours(-24 * 9) }),
];

const ROOM_TYPES = [];
const ROOMS = [];
function roomType(property_id, id, name, nightly_price, max_guests, beds, labels, images, description, sort_order) {
  ROOM_TYPES.push({ id, property_id, name, nightly_price, max_guests, beds, amenities: [], description, sort_order, active: true, images, created_at: hours(-24 * 20) });
  labels.forEach((label) => ROOMS.push({ id: `${id}-${label}`, room_type_id: id, property_id, label, active: true, created_at: hours(-24 * 20) }));
}
roomType('p-fako', 'rt-std', 'Standard Single', 18000, 1, '1 single bed', ['101', '102', '103'], [IMG('fako-std')], 'Quiet room facing the garden, with a desk.', 1);
roomType('p-fako', 'rt-dlx', 'Deluxe Double', 27500, 2, '1 queen bed', ['201', '202', '203', '204'], [IMG('fako-dlx'), IMG('fako-lounge')], 'Mountain view, queen bed and a work corner.', 2);
roomType('p-fako', 'rt-fam', 'Family Suite', 45000, 4, '1 queen + 2 singles', ['301', '302'], [IMG('fako-fam')], 'Two rooms for families, with a sitting area.', 3);
roomType('p-soppo', 'rt-garden', 'Garden Room', 12000, 2, '1 double bed', ['G1', 'G2', 'G3'], [IMG('soppo-room')], 'Opens onto the garden.', 1);
for (const [pid, price, img] of [['p-seaside', 22000, 'seaside-room'], ['p-bona', 35000, 'bonapriso-lounge'], ['p-akwa', 40000, 'akwa-room'], ['p-kribi', 30000, 'kribi-room']]) {
  roomType(pid, `rt-${pid}`, 'Double Room', price, 2, '1 double bed', ['1', '2', '3'], [IMG(img)], 'A comfortable double room.', 1);
}

const BOOKINGS = [];
function booking({ guest, room, from, to, status = 'confirmed', payment = 'paid', kind = 'guest', reason = null, note = '' }) {
  const r = ROOMS.find((x) => x.id === room);
  const rt = ROOM_TYPES.find((x) => x.id === r.room_type_id);
  const nights = nightsBetween(from, to);
  const total = rt.nightly_price * nights;
  const deposit = kind === 'guest' ? Math.min(total, Math.max(rt.nightly_price, Math.round(total * 0.1))) : 0;
  BOOKINGS.push({
    id: require('crypto').randomUUID(), property_id: r.property_id, room_type_id: rt.id, room_id: r.id, kind, guest_id: guest ? guest.id : null,
    status, check_in: from, check_out: to, guests: Math.min(rt.max_guests, 2), nightly_price: rt.nightly_price, total_amount: kind === 'guest' ? total : 0,
    guest_note: note, host_note: '', block_reason: reason, expires_at: status === 'pending' ? hours(20) : null, created_at: hours(-48),
    deposit_amount: deposit, commission_amount: Math.round(total * 0.1), payment_status: kind === 'guest' ? payment : 'not_required', payment_due_at: null,
  });
}
const G = OTHER_GUESTS;
// Who is staying at the host's lodge over the next two weeks.
booking({ guest: G[0], room: 'rt-std-101', from: day(0), to: day(3) });
booking({ guest: G[2], room: 'rt-dlx-202', from: day(0), to: day(2) });
booking({ guest: G[1], room: 'rt-dlx-201', from: day(1), to: day(4) });
booking({ guest: G[3], room: 'rt-fam-301', from: day(3), to: day(6) });
booking({ guest: G[4], room: 'rt-std-102', from: day(5), to: day(9) });
booking({ guest: G[5], room: 'rt-dlx-203', from: day(6), to: day(8) });
booking({ guest: G[6], room: 'rt-garden-G1', from: day(0), to: day(5) });
booking({ guest: G[7], room: 'rt-dlx-204', from: day(9), to: day(12) });
booking({ guest: G[8], room: 'rt-std-103', from: day(10), to: day(13) });
booking({ guest: G[9], room: 'rt-garden-G2', from: day(2), to: day(4) });
booking({ room: 'rt-fam-302', from: day(1), to: day(3), kind: 'block', reason: 'maintenance' });
// Earlier months, for the revenue chart.
const past = [[-150, 2], [-120, 4], [-95, 3], [-70, 6], [-45, 5], [-20, 7]];
past.forEach(([start, count], m) => {
  for (let i = 0; i < count; i++) {
    const rooms = ['rt-std-101', 'rt-dlx-201', 'rt-dlx-202', 'rt-fam-301', 'rt-std-102', 'rt-dlx-203', 'rt-garden-G1'];
    const from = day(start + i * 3);
    booking({ guest: G[(m + i) % G.length], room: rooms[i % rooms.length], from, to: day(start + i * 3 + 2 + (i % 2)), payment: 'released' });
  }
});
// The guest's own earlier trip.
booking({ guest: GUEST, room: 'rt-p-seaside-1', from: day(-26), to: day(-24) });

function buildDb() {
  const profiles = [GUEST, HOST, ...OTHER_HOSTS, ...OTHER_GUESTS].map((p) => ({
    email: `${p.id}@demo.test`, phone: null, avatar_url: null, is_verified_agent: false, eula_accepted_at: hours(-24 * 30), created_at: hours(-24 * 60), updated_at: hours(-24), bio: '', ...p,
  }));
  return {
    profiles,
    properties: PROPERTIES.map((p) => ({ ...p })),
    stay_room_types: ROOM_TYPES.map((r) => ({ ...r })),
    stay_rooms: ROOMS.map((r) => ({ ...r })),
    stay_bookings: BOOKINGS.map((b) => ({ ...b })),
    stay_settings: [{ id: 1, payments_enabled: true, commission_bps: 1000, free_cancel_days: 2, checkout_window: '00:30:00' }],
    ...hostExtras(),
  };
}

// The host's wallet, listing views and a guest conversation.
function hostExtras() {
  const tx = (type, amount, daysAgo, status = 'completed') => ({ id: require('crypto').randomUUID(), user_id: HOST.id, type, amount, status, currency: 'XAF',
    description: '', created_at: hours(-24 * daysAgo), updated_at: hours(-24 * daysAgo) });
  const transactions = [
    tx('stay_host_income', 24750, 1), tx('stay_host_income', 16200, 2), tx('stay_host_income', 40500, 4), tx('withdrawal', 60000, 6),
    tx('stay_host_income', 16200, 9), tx('stay_host_income', 24750, 12), tx('stay_host_income', 10800, 15), tx('withdrawal', 50000, 20),
  ];
  const balance = transactions.reduce((n, t) => n + (t.type === 'withdrawal' ? -t.amount : t.amount), 0) + 163000;
  const summary = (property_id, title, view_count, views_this_week, unique_viewers) => ({ property_id, owner_id: HOST.id, title, view_count, views_this_week, unique_viewers, views_today: Math.round(views_this_week / 6) });
  const samuel = OTHER_GUESTS[3];
  const msg = (from, to, content, minsAgo, read = true) => ({ id: require('crypto').randomUUID(), sender_id: from.id, receiver_id: to.id, content, property_id: 'p-fako',
    created_at: new Date(Date.now() - minsAgo * 60e3).toISOString(), read, status: 'sent', attachment_url: null, attachment_type: null, voice_url: null });
  return {
    wallets: [{ id: 'w-host', user_id: HOST.id, balance, currency: 'XAF', created_at: hours(-24 * 90), updated_at: hours(-24) }],
    transactions,
    property_analytics_summary: [summary('p-fako', 'Mount Fako Lodge', 1284, 212, 167), summary('p-soppo', 'Great Soppo Guest House', 436, 64, 51)],
    property_views: [],
    messages: [
      msg(samuel, HOST, 'Good evening! We booked the Family Suite from the 26th. Is it OK if we arrive around 8 pm?', 95),
      msg(HOST, samuel, 'Good evening Samuel, yes of course. The reception is open all night.', 80),
      msg(samuel, HOST, 'Thank you! Is breakfast included for the children too?', 12, false),
    ],
  };
}

// Defaults the database fills in on insert.
const defaults = {
  properties: { ...STAY_DEFAULTS, created_at: undefined, availability_confirmed_at: undefined, views: 0, owner_review_pending: false },
  stay_room_types: { active: true, amenities: [], images: [], description: '', sort_order: 0 },
  stay_rooms: { active: true },
};

// Embedded resources, filled in when a table is read.
const views = {
  properties: (row, db) => {
    const owner = db.profiles.find((p) => p.id === row.owner_id) || null;
    return { ...row, profiles: owner, owner };
  },
  stay_bookings: (row, db) => {
    const p = db.properties.find((x) => x.id === row.property_id);
    return {
      ...row,
      property: p ? { id: p.id, title: p.title, location: p.location, town: p.town, images: p.images, owner_id: p.owner_id, check_in_time: p.check_in_time, check_out_time: p.check_out_time } : null,
      room_type: (() => { const t = db.stay_room_types.find((x) => x.id === row.room_type_id); return t ? { name: t.name } : null; })(),
      room: (() => { const r = db.stay_rooms.find((x) => x.id === row.room_id); return r ? { label: r.label } : null; })(),
      guest: (() => { const g = db.profiles.find((x) => x.id === row.guest_id); return g ? { id: g.id, full_name: g.full_name, avatar_url: g.avatar_url, phone: g.phone } : null; })(),
    };
  },
};

// The parts of the server logic the flow touches, in JavaScript.
const lapsed = (b) => b.payment_status === 'due' && b.payment_due_at && new Date(b.payment_due_at) <= new Date();
const holds = (b) => (b.status === 'confirmed' && !lapsed(b)) || (b.status === 'pending' && (!b.expires_at || new Date(b.expires_at) > new Date()));
const overlaps = (b, from, to) => b.check_in < to && b.check_out > from;

const rpc = {
  available_withdrawable_balance: (_, { db }) => db.wallets[0].balance,
  get_agent_total_views: (_, { db }) => db.property_analytics_summary.reduce((n, r) => n + r.view_count, 0),
  identity_verification: () => ({ can_post: true, required: true, front: true, back: true, selfie: true, submitted: true, status: 'approved', rejection_reason: null }),
  stay_availability: ({ p_property, p_check_in, p_check_out }, { db }) =>
    db.stay_room_types.filter((t) => t.property_id === p_property && t.active).sort((a, b) => a.sort_order - b.sort_order).map((t) => {
      const rooms = db.stay_rooms.filter((r) => r.room_type_id === t.id && r.active);
      const free = rooms.filter((r) => !db.stay_bookings.some((b) => b.room_id === r.id && holds(b) && overlaps(b, p_check_in, p_check_out)));
      return { room_type_id: t.id, name: t.name, description: t.description, nightly_price: t.nightly_price, max_guests: t.max_guests, beds: t.beds, amenities: t.amenities, total_rooms: rooms.length, available_rooms: free.length, images: t.images };
    }),
  request_stay_booking: ({ p_room_type, p_check_in, p_check_out, p_guests, p_note }, { db, asUser }) => {
    const t = db.stay_room_types.find((x) => x.id === p_room_type);
    const room = db.stay_rooms.find((r) => r.room_type_id === t.id && r.active && !db.stay_bookings.some((b) => b.room_id === r.id && holds(b) && overlaps(b, p_check_in, p_check_out)));
    if (!room) throw new Error('No rooms of this type are free for those dates.');
    const nights = nightsBetween(p_check_in, p_check_out);
    const total = t.nightly_price * nights;
    const commission = Math.round(total * 0.1);
    const id = require('crypto').randomUUID();
    // Instant booking: confirmed at once, with 30 minutes to pay the deposit.
    const deposit = Math.min(total, Math.max(t.nightly_price, commission));
    db.stay_bookings.push({
      id, property_id: t.property_id, room_type_id: t.id, room_id: room.id, kind: 'guest', guest_id: asUser.id, status: 'confirmed',
      check_in: p_check_in, check_out: p_check_out, guests: p_guests, nightly_price: t.nightly_price, total_amount: total, guest_note: p_note || '', host_note: '',
      block_reason: null, expires_at: null, created_at: new Date().toISOString(), responded_at: new Date().toISOString(), deposit_amount: deposit,
      commission_amount: commission, payment_status: deposit > 0 ? 'due' : 'not_required', payment_due_at: deposit > 0 ? hours(0.5) : null,
    });
    return id;
  },
  respond_stay_booking: ({ p_booking, p_decision }, { db }) => {
    const b = db.stay_bookings.find((x) => x.id === p_booking);
    if (p_decision === 'confirm') Object.assign(b, { status: 'confirmed', expires_at: null, payment_status: b.deposit_amount > 0 ? 'due' : 'not_required', payment_due_at: hours(12) });
    else Object.assign(b, { status: 'declined', expires_at: null });
    return null;
  },
  cancel_stay_booking: ({ p_booking }, { db }) => { Object.assign(db.stay_bookings.find((x) => x.id === p_booking), { status: 'cancelled' }); return null; },
  set_stay_room_availability: ({ p_room, p_from, p_to, p_available, p_reason, p_note }, { db }) => {
    const r = db.stay_rooms.find((x) => x.id === p_room);
    if (p_available) {
      db.stay_bookings = db.stay_bookings.filter((b) => !(b.kind === 'block' && b.room_id === p_room && overlaps(b, p_from, p_to)));
    } else {
      db.stay_bookings.push({ id: require('crypto').randomUUID(), property_id: r.property_id, room_type_id: r.room_type_id, room_id: r.id, kind: 'block', guest_id: null, status: 'confirmed',
        check_in: p_from, check_out: p_to, guests: 0, nightly_price: 0, total_amount: 0, guest_note: '', host_note: p_note || '', block_reason: p_reason, expires_at: null,
        created_at: new Date().toISOString(), deposit_amount: 0, commission_amount: 0, payment_status: 'not_required', payment_due_at: null });
    }
    return nightsBetween(p_from, p_to);
  },
};

const functions = {
  'stay-payment': ({ action, bookingId }, { db }) => {
    const b = db.stay_bookings.find((x) => x.id === bookingId);
    if (action === 'collect') return { status: 'pending', message: 'Approve the payment on your phone to finish.' };
    if (b) Object.assign(b, { payment_status: 'paid' });
    return { status: 'successful', message: 'Deposit received. Your room is confirmed.' };
  },
};

module.exports = { buildDb, views, rpc, functions, defaults, GUEST, HOST, OTHER_GUESTS, day };
