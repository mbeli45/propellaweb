// Records the Propella Stays demo (guest and host) against the local web app,
// with synthetic data from data.cjs, then builds the video with FFmpeg.
//   node film.cjs            -> out/propella-stays-demo.mp4 (+ guest / host cuts)
const { createMock } = require('./mock.cjs');
const D = require('./data.cjs');
const K = require('./kit.cjs');
const { chromium, fs, path, ROOT, WORK, OUT, sleep, TAP_SCRIPT, startRecording, save, load, stopRecording, mark, closeSoon, show, tap, glide, buildSegment, buildCard, join } = K;

const APP = 'http://localhost:3100';
const MODE = process.argv[2] || 'all'; // record | build | all
if (MODE !== 'build') fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

// --- The story. ----------------------------------------------------------------
const db = D.buildDb();
const checkIn = D.day(4);

async function newPhone(browser, asUser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'en-GB' });
  await createMock({ db, rpc: D.rpc, functions: D.functions, views: D.views, asUser, assetsDir: path.join(ROOT, 'assets') }).install(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('propella.market', 'stays'); localStorage.setItem('i18nextLng', 'en'); } catch {} });
  await ctx.addInitScript(TAP_SCRIPT);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('  page error:', e.message));
  return { ctx, page };
}

async function guestBooks(browser) {
  const { ctx, page } = await newPhone(browser, D.GUEST);
  await page.goto(APP + '/user', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByText('Mount Fako Lodge').first().waitFor({ timeout: 20000 });
  await sleep(800);
  const rec = await startRecording(page, 'guest');
  mark(rec, 1, 'Find a stay', 'Switch Home to Stays. Each town has a row of places with rooms free tonight.');
  await sleep(2600);
  await glide(page, 520, 1800);
  await glide(page, -520, 1200);

  mark(rec, 2, 'Search by town', 'Tap the search and pick a town to see every stay there, with the price per night.');
  await tap(page, page.locator('.browse-search input').first(), 1300);
  await tap(page, page.locator('.browse-pick', { hasText: 'Buea' }).first(), 2200);
  await glide(page, 380, 1600);

  mark(rec, 3, 'Look around', 'Photos, amenities, check-in times and the host, all on one page.');
  await tap(page, page.getByText('Mount Fako Lodge').first(), 2400);
  await glide(page, 420, 1500);
  await glide(page, 420, 1500);

  mark(rec, 4, 'Choose dates and a room', 'Pick the check-in day and the number of nights. Each room type shows how many are left.');
  await show(page.locator('#stay-rooms-title'), 1200);
  await tap(page, page.locator('.stay-rooms-change').first(), 1000);
  await tap(page, page.locator(`.stay-days button`).nth(4), 900);
  await tap(page, page.locator('.stay-stepper').first().locator('button').last(), 1200);
  await tap(page, page.locator('.stay-rooms-change').first(), 1500);
  const deluxe = page.locator('.stay-rooms-item', { hasText: 'Deluxe Double' }).first();
  const pick = (await deluxe.count()) ? deluxe.getByRole('button', { name: /^Select/ }) : page.getByRole('button', { name: /^Select/ }).nth(1);
  await show(pick, 1400);

  mark(rec, 5, 'Book it now', 'A room that shows as free can be booked straight away. Add a note for the host.');
  await tap(page, pick, 1300);
  const note = page.locator('textarea').first();
  await tap(page, note, 400);
  await note.pressSequentially('We arrive around 6 pm. A quiet room, please.', { delay: 45 });
  await sleep(900);
  await tap(page, page.getByRole('button', { name: 'Book and pay deposit', exact: true }).first(), 2200);

  mark(rec, 6, 'Pay the deposit', 'The room is held for 30 minutes. Pay by MTN or Orange Money and approve on your phone.');
  await sleep(1600);
  await tap(page, page.getByRole('button', { name: 'Send payment request', exact: true }).first(), 2600);
  await tap(page, page.getByRole('button', { name: 'Check payment', exact: true }).first(), 2400);

  mark(rec, 7, 'You\u2019re booked', 'A booking ID, what\u2019s left to pay at the property, and directions.');
  await show(page.locator('.stay-confirm').first(), 3200);

  mark(rec, 8, 'Message the host', 'Confirm availability and your arrival time with the host, right from here.');
  await show(page.locator('.stay-confirm-remind').first(), 3600);

  mark(rec, 9, 'Track it in My stays', 'Every booking in one place, with the host one tap away.');
  await tap(page, page.getByRole('button', { name: /View booking/ }).first(), 3600);
  await stopRecording(rec);
  await closeSoon(ctx);
  return save(rec);
}

async function hostSees(browser) {
  const { ctx, page } = await newPhone(browser, D.HOST);
  await page.goto(APP + '/agent', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('.host-charts').first().waitFor({ timeout: 20000 });
  await sleep(1200);
  const rec = await startRecording(page, 'host');
  mark(rec, 1, 'Your stays at a glance', 'Rooms free tonight, arrivals and what is coming up.');
  await sleep(2600);

  mark(rec, 2, 'Occupancy and revenue', 'How full the next 14 nights are, and confirmed bookings month by month.');
  await show(page.locator('.host-charts').first(), 3600);

  mark(rec, 3, 'Bookings arrive confirmed', 'No requests to answer. Amara booked and paid the deposit, so the stay is in Upcoming.');
  const amara = page.locator('#host-upcoming').getByText('Amara Nkeng').first();
  await show(amara, 3800);

  mark(rec, 4, 'Your properties', 'Each stay with its rooms free tonight, plus Rooms, Calendar, Edit and Delete.');
  await show(page.locator('.host-row').first(), 3200);

  mark(rec, 5, 'The rooms calendar', 'Every room, night by night. Amara\u2019s room is already blocked for those nights.');
  await tap(page, page.locator('.host-row').first().getByRole('button', { name: /Calendar/ }), 2400);
  await show(page.locator('.stay-cal, table').first(), 2600);

  mark(rec, 6, 'Booked outside Propella?', 'Tap a night to mark the room taken, so it can\u2019t be double-booked.');
  // Room 103, two nights from now: free, and in view on a phone.
  const night = new Date(D.day(2) + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const cell = page.locator(`button.stay-cell[aria-label^="103, ${night}"]`);
  await tap(page, cell, 1200);
  await page.locator(`button.stay-cell--block[aria-label^="103, ${night}"]`).waitFor({ timeout: 8000 });
  await sleep(3200);
  await stopRecording(rec);
  await closeSoon(ctx);
  return save(rec);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    if (MODE !== 'build') {
      console.log('recording guest booking…');
      await guestBooks(browser);
      console.log('recording host…');
      await hostSees(browser);
    }
    if (MODE === 'record') return;
    const g = load('guest'), h = load('host');

    console.log('building video…');
    const intro = await buildCard(browser, 'intro', { kicker: 'Propella Stays', title: 'How booking a stay works', body: 'A free room can be booked and paid for straight away. Then the guest messages the host to confirm.', foot: 'Demo recorded with made-up guests, hosts and bookings.' }, 4.2);
    const gCard = await buildCard(browser, 'card-guest', { kicker: 'Part 1 · For guests', title: 'Find a room, book and pay', body: 'Amara is looking for two nights in Buea.', foot: 'Propella Stays' });
    const hCard = await buildCard(browser, 'card-host', { kicker: 'Part 2 · For hosts', title: 'Bookings in, rooms managed', body: 'Mount Fako Lodge sees Amara\u2019s booking on its dashboard.', foot: 'Propella Stays' });
    const outro = await buildCard(browser, 'outro', { kicker: 'Propella Stays', title: 'Hotels, guest houses and apartments', body: 'Book instantly, pay the deposit by Mobile Money, then message the host. Hosts manage every room and night in one place.', foot: 'All names, places and bookings in this video are made up.' }, 4.2);

    const gv = await buildSegment(browser, g, 'For guests');
    const hv = await buildSegment(browser, h, 'For hosts');

    join([intro, gCard, gv, hCard, hv, outro], path.join(OUT, 'propella-stays-demo.mp4'));
    join([gCard, gv], path.join(OUT, 'propella-stays-guests.mp4'));
    join([hCard, hv], path.join(OUT, 'propella-stays-hosts.mp4'));
    console.log('done');
  } catch (e) {
    console.error('FAILED:', e.message.split(/\r?\n/)[0]);
    for (const c of browser.contexts()) for (const pg of c.pages()) await pg.screenshot({ path: path.join(OUT, 'failed.png') }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await Promise.race([browser.close(), sleep(5000)]);
    process.exit(process.exitCode || 0);
  }
})().catch((e) => { console.error(e); process.exit(1); });
