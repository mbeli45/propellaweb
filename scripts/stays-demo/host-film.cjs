// The detailed host demo with a voice-over: listing a stay, adding rooms, the
// calendar, bookings, messages, the wallet and analytics.
//   node host-film.cjs          voice + record + build -> out/propella-stays-host-guide.mp4
//   node host-film.cjs voice    only generate the narration (ElevenLabs, cached in assets/voice)
//   node host-film.cjs record   only record (needs the narration for timing)
//   node host-film.cjs build    only rebuild the video from work/host-guide
// FAST=1 records without waiting for the narration (for checking the clicks).
const path = require('path');
process.env.DEMO_WORK = process.env.DEMO_WORK || path.join(__dirname, 'work', 'host-guide');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { createMock } = require('./mock.cjs');
const D = require('./data.cjs');
const K = require('./kit.cjs');
const { chromium, fs, ROOT, WORK, OUT, sleep, now, TAP_SCRIPT, startRecording, save, load, stopRecording, closeSoon, show, tap, glide, captionHtml, cardHtml, renderPng, ff, X264, buildSegment, join } = K;

const APP = 'http://localhost:3100';
const MODE = process.argv[2] || 'all';
const FAST = process.env.FAST === '1';
const VOICE_ID = process.env.VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2'; // Alice: clear, engaging educator
const MODEL = 'eleven_multilingual_v2';
const VOICE_DIR = path.join(ROOT, 'assets', 'voice');
const asset = (name) => path.join(ROOT, 'assets', name);

// --- The script: what the narrator says, and the caption beside the phone. ---
const INTRO = { id: 'intro', say: 'Here is everything you can do as a host on Propella Stays: list a property, set up its rooms, manage the calendar, follow your bookings, talk to guests, and get paid.' };
const OUTRO = { id: 'outro', say: 'That\u2019s Propella Stays for hosts. List your first stay today, and let guests book and pay in minutes.' };
const STEPS = [
  { id: 'dash', title: 'Your dashboard', body: 'Rooms free tonight, arrivals, upcoming stays and your wallet.',
    say: 'This is your host dashboard. At the top, you can see how many rooms are free tonight, who is arriving today, your upcoming stays, and a shortcut to your wallet.' },
  { id: 'charts', title: 'Occupancy and revenue', body: 'The next 14 nights, and booked revenue month by month.',
    say: 'Below are your numbers. The first chart shows how full your rooms are, for each of the next fourteen nights. The second shows your booked revenue, month by month.' },
  { id: 'props', title: 'Your properties', body: 'Each stay with its rooms free tonight, plus Rooms, Calendar, Edit and Delete.',
    say: 'Further down are your properties. Each card shows the rooms free tonight, with shortcuts to its rooms, its calendar, and to edit or delete it.' },
  { id: 'list', title: 'List a new stay', body: 'Give it a name and a description guests will read.',
    say: 'Let\u2019s add a new property. Tap List a stay, then give it a name, and a description. This is what guests read first, so say what makes your place special.' },
  { id: 'where', title: 'Where it is', body: 'The town, then the address from the search.',
    say: 'Next, the location. Type the town, then search for the address and pick it from the list. Guests use it to find you, and to get directions.' },
  { id: 'kind', title: 'Kind of stay and times', body: 'Hotel, guest house, apartment or lodge, with check-in and check-out times.',
    say: 'Choose the kind of stay. Here, it\u2019s a guest house. Then set your check-in and check-out times, if you have them.' },
  { id: 'amen', title: 'Amenities and price', body: 'Tick what you offer and set a starting price per night.',
    say: 'Tick the amenities you offer, like Wi-Fi, hot water, or breakfast. Then set a starting price per night. Guests see it on your listing.' },
  { id: 'photos', title: 'Photos, then submit', body: 'Add photos of the place. Next stop: its rooms.',
    say: 'Finally, add a few photos, and tap Submit. Your stay is saved, and Propella takes you straight to its rooms.' },
  { id: 'type1', title: 'Add a room type', body: 'Name, price per night, how many guests and the beds.',
    say: 'Now, the rooms. Tap Add room type. Give it a name, like Sea View Double, a price per night, how many guests it sleeps, and the beds.' },
  { id: 'type1b', title: 'Photos and how many rooms', body: 'Propella numbers the rooms. Each one is booked on its own.',
    say: 'Add a short description, and photos of the room. Then say how many rooms of this type you have. Propella numbers them for you, and each room can be booked on its own.' },
  { id: 'type2', title: 'As many types as you need', body: 'Here, a Family Room for four, with two rooms.',
    say: 'Add as many room types as you need. Here\u2019s a Family Room, for up to four guests.' },
  { id: 'rooms', title: 'Your rooms', body: 'Rename a room, add more, or edit a type at any time.',
    say: 'Each type lists its rooms. Tap a room number to rename it, add more rooms, or edit the type at any time. Your new stay is now open for booking.' },
  { id: 'cal', title: 'The calendar', body: 'Every room, night by night: booked, unavailable or free.',
    say: 'Now let\u2019s manage a stay that already has guests: Mount Fako Lodge. Its calendar shows every room, night by night. Blue nights are booked, grey nights are unavailable, and white nights are free.' },
  { id: 'block', title: 'Booked outside Propella?', body: 'Tap a free night to mark it taken. Tap again to free it.',
    say: 'Took a booking by phone, or closing a room for repairs? Tap a free night to mark it taken, so it can\u2019t be double-booked. Tap it again to free it.' },
  { id: 'range', title: 'Block several nights', body: 'Choose the rooms, the first night, how many nights and why.',
    say: 'To close several rooms or nights at once, use Block dates. Choose the rooms, the first night, how many nights, and the reason.' },
  { id: 'bookings', title: 'Every booking', body: 'Who is staying, who is coming, and what\u2019s been paid.',
    say: 'The Bookings tab lists every guest: who is staying now, and who is coming. You see the dates, the room, the deposit paid, and what\u2019s left to collect at the property.' },
  { id: 'msg', title: 'Talk to your guests', body: 'Guests confirm arrival times and ask questions here.',
    say: 'Guests are asked to message you after they book, to confirm their arrival. You\u2019ll find them in Messages. Open a chat, and reply.' },
  { id: 'wallet', title: 'Your earnings', body: 'Deposits reach your wallet on check-in day, minus commission.',
    say: 'Guests pay a deposit by Mobile Money when they book. Propella holds it, and releases it to your wallet on check-in day, minus the commission. Your wallet shows the balance, and every payment.' },
  { id: 'withdraw', title: 'Withdraw to Mobile Money', body: 'The amount, MTN or Orange Money, and your number.',
    say: 'To cash out, tap Withdraw. Enter the amount, choose MTN or Orange Money, and your number. The money is sent straight to your phone.' },
  { id: 'analytics', title: 'Listing analytics', body: 'Views this week and unique visitors for each stay.',
    say: 'From your profile, open Analytics, to see how many people viewed each listing this week, and how many different visitors they were.' },
  { id: 'edit', title: 'Edit or delete', body: 'Change details and photos any time, or remove a stay.',
    say: 'Need to change something? Edit updates a listing\u2019s details and photos at any time. And Delete removes a stay you no longer offer.' },
];

// --- Narration: ElevenLabs text to speech, cached by text. -----------------------
const voiceFile = (line) => path.join(VOICE_DIR, `${line.id}-${crypto.createHash('sha1').update(VOICE_ID + MODEL + line.say).digest('hex').slice(0, 10)}.mp3`);
const duration = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

const { execFile, spawnSync } = require('child_process');
const curl = (args) => new Promise((resolve) => execFile('curl', args, { maxBuffer: 1 << 20 }, (err, stdout, stderr) => resolve({ code: err ? err.code : 0, out: String(stdout), err: String(stderr) })));
/**
 * A whole clip: it decodes without errors and ends on a short natural pause.
 * A download cut short either fails to decode or stops mid-word.
 */
function healthy(file) {
  try {
    if (fs.statSync(file).size < 2000) return false;
    const d = duration(file);
    const dec = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { encoding: 'utf-8' });
    if (d < 0.3 || dec.status !== 0 || dec.stderr.trim()) return false;
    const sil = spawnSync('ffmpeg', ['-i', file, '-af', 'silencedetect=n=-40dB:d=0.15', '-f', 'null', '-'], { encoding: 'utf-8' }).stderr;
    const starts = [...sil.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
    const tail = starts.length ? d - starts[starts.length - 1] : 0;
    return tail >= 0.08 && tail <= 2;
  } catch {
    return false;
  }
}

async function speak(line) {
  const file = voiceFile(line);
  if (fs.existsSync(file)) {
    if (healthy(file)) return file;
    console.log(`  voice ${line.id}: cached clip is damaged, generating it again`);
    fs.rmSync(file);
  }
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('Set ELEVENLABS_API_KEY to generate the narration.');
  fs.mkdirSync(VOICE_DIR, { recursive: true });
  const body = JSON.stringify({ text: line.say, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true } });
  const part = `${file}.part`;
  const bodyFile = `${file}.json`;
  fs.writeFileSync(bodyFile, body, 'utf-8'); // a file keeps the text's UTF-8 intact on Windows
  // curl copes with this network's dropped connections; the key goes in a header, never on screen.
  // The with-timestamps answer is JSON: a cut-off download can't be parsed, and the timings say
  // where the speech should end, so a partial clip is never kept.
  for (let attempt = 1, failures = 0; failures < 4 && attempt <= 12; attempt++) {
    const r = await curl(['-sS', '--ssl-no-revoke', '-m', '300', '-o', part, '-w', '%{http_code}', '-X', 'POST',
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_64`,
      '-H', `xi-api-key: ${process.env.ELEVENLABS_API_KEY}`, '-H', 'content-type: application/json', '--data-binary', `@${bodyFile}`]);
    let problem = null;
    if (r.out.startsWith('200')) {
      try {
        const j = JSON.parse(fs.readFileSync(part, 'utf-8'));
        const ends = (j.alignment || j.normalized_alignment || {}).character_end_times_seconds || [];
        fs.writeFileSync(`${part}.mp3`, Buffer.from(j.audio_base64, 'base64'));
        const d = duration(`${part}.mp3`);
        const spoken = ends.length ? ends[ends.length - 1] : 0;
        if (!healthy(`${part}.mp3`)) problem = 'damaged audio';
        else if (!spoken || spoken > d + 0.3) problem = `audio ${d.toFixed(1)} s is shorter than the speech ${spoken.toFixed(1)} s`;
      } catch {
        problem = 'incomplete download';
      }
      if (!problem) {
        fs.renameSync(`${part}.mp3`, file);
        fs.rmSync(part, { force: true });
        fs.rmSync(bodyFile, { force: true });
        console.log(`  voice ${line.id}: ${duration(file).toFixed(1)} s`);
        return file;
      }
      fs.rmSync(`${part}.mp3`, { force: true });
    }
    const why = problem || `HTTP ${r.out} ${fs.existsSync(part) ? fs.readFileSync(part, 'utf-8').slice(0, 200) : r.err.slice(0, 200)}`;
    // Too many at once is refused before anything is generated: wait and ask again.
    if (r.out.startsWith('429')) { await sleep(8000); continue; }
    failures++;
    console.log(`  voice ${line.id}: attempt ${attempt} failed (${why})`);
    if (!r.out.startsWith('200') && r.out !== '000') break; // an API error won't fix itself
  }
  throw new Error(`Narration for "${line.id}" failed.`);
}
async function voiceAll() {
  const lines = [INTRO, ...STEPS, OUTRO];
  let next = 0;
  const worker = async () => { while (next < lines.length) await speak(lines[next++]); };
  await Promise.all([worker(), worker()]); // the plan allows two requests at a time
}

// --- Recording. -------------------------------------------------------------------
const db = D.buildDb();
let rec;
let stepAt = 0;
let stepLen = 0;
const byId = Object.fromEntries(STEPS.map((s, i) => [s.id, { ...s, step: i + 1 }]));

/** Starts a step: caption and narration begin now. */
async function step(id) {
  await settle();
  const s = byId[id];
  console.log(`  ${s.step}. ${s.title}`);
  rec.marks.push({ t: now(), step: s.step, title: s.title, body: s.body, voice: fs.existsSync(voiceFile(s)) ? voiceFile(s) : null });
  stepAt = now();
  stepLen = !FAST && fs.existsSync(voiceFile(s)) ? duration(voiceFile(s)) : 0;
}
/** Lets the narration of the current step finish, with a short breath after it. */
async function settle(extra = 0.7) {
  if (!stepAt) return;
  const left = stepAt + stepLen + extra - now();
  if (left > 0) await sleep(left * 1000);
}
async function type(page, loc, text, delay = 40) {
  await tap(page, loc, 300);
  await loc.pressSequentially(text, { delay });
  await sleep(400);
}
const dialog = (page) => page.locator('[role="dialog"]').last();
const field = (scope, label) => scope.locator('.rsv-field', { hasText: label }).first();

async function story(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'en-GB' });
  await createMock({ db, rpc: D.rpc, functions: D.functions, views: D.views, defaults: D.defaults, asUser: D.HOST, assetsDir: path.join(ROOT, 'assets') }).install(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('propella.market', 'stays'); localStorage.setItem('i18nextLng', 'en'); } catch {} });
  await ctx.addInitScript(TAP_SCRIPT);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('  page error:', e.message));
  await page.goto(APP + '/agent', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('.host-charts').first().waitFor({ timeout: 30000 });
  await sleep(1200);
  rec = await startRecording(page, 'host-guide');
  const nav = (name) => page.locator('nav').last().getByRole('link', { name, exact: true }).or(page.locator('nav').last().getByRole('button', { name, exact: true })).first();

  // Dashboard
  await step('dash');
  await sleep(2500);
  await step('charts');
  await show(page.locator('.host-charts').first(), 1200);
  await step('props');
  await show(page.locator('.host-row').first(), 1200);

  // List a stay
  await step('list');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(900);
  await tap(page, page.getByRole('button', { name: 'List a stay' }).first(), 1800);
  await type(page, page.locator('input[placeholder^="e.g., Modern"]'), 'Limbe Bay Guest House', 55);
  await type(page, page.locator('textarea').first(), 'A family-run guest house five minutes from the beach, with a garden, sea views and breakfast every morning.', 14);

  await step('where');
  await type(page, page.locator('input[placeholder^="e.g., Yaound"]'), 'Limbe', 70);
  await type(page, page.locator('input[placeholder^="Search for property location"]'), 'Mile 4', 90);
  await tap(page, page.locator('.location-search-suggestion-item').first(), 1000);

  await step('kind');
  const kind = page.locator('select').first();
  await show(kind, 600);
  await kind.selectOption('guest_house');
  await sleep(900);
  const times = page.locator('input[type="time"]');
  await tap(page, times.nth(0), 300);
  await times.nth(0).fill('14:00');
  await sleep(600);
  await tap(page, times.nth(1), 300);
  await times.nth(1).fill('11:00');
  await sleep(600);

  await step('amen');
  for (const a of ['Wi-Fi', 'Hot water', 'Breakfast', 'Backup power', '24h security']) await tap(page, page.getByRole('button', { name: a, exact: true }), 450);
  await type(page, page.locator('input[type="number"]').first(), '15000', 90);

  await step('photos');
  const files = page.locator('input[type="file"]').first();
  await show(page.getByText('Add photo or video').first(), 800);
  await files.setInputFiles([asset('limbe-ext.jpg'), asset('limbe-garden.jpg'), asset('limbe-sea.jpg')]);
  await sleep(1800);
  await tap(page, page.getByRole('button', { name: 'Submit', exact: true }).last(), 600);
  await page.getByRole('button', { name: 'Add room type' }).first().waitFor({ timeout: 20000 });
  await sleep(1500);

  // Rooms
  await step('type1');
  await tap(page, page.getByRole('button', { name: 'Add room type' }).first(), 1200);
  let d = dialog(page);
  await type(page, field(d, 'Room type name').locator('input'), 'Sea View Double', 55);
  await type(page, field(d, 'Price per night').locator('input'), '18000', 90);
  await tap(page, field(d, 'Max guests').locator('button').last(), 500);
  await type(page, field(d, 'Beds').locator('input'), '1 queen bed', 55);

  await step('type1b');
  await type(page, field(d, 'Description').locator('textarea'), 'Sea view, balcony and a private bathroom.', 22);
  await show(field(d, 'Photos'), 500);
  await d.locator('input[type="file"]').setInputFiles([asset('limbe-sea.jpg')]);
  await sleep(1200);
  const howMany = field(d, 'How many rooms').locator('button').last();
  await tap(page, howMany, 500);
  await tap(page, howMany, 900);
  await tap(page, d.getByRole('button', { name: 'Save', exact: true }), 1800);

  await step('type2');
  await tap(page, page.getByRole('button', { name: 'Add room type' }).last(), 1200);
  d = dialog(page);
  await type(page, field(d, 'Room type name').locator('input'), 'Family Room', 50);
  await type(page, field(d, 'Price per night').locator('input'), '30000', 80);
  const guests = field(d, 'Max guests').locator('button').last();
  await tap(page, guests, 350);
  await tap(page, guests, 350);
  await type(page, field(d, 'Beds').locator('input'), '1 double + 2 singles', 35);
  await d.locator('input[type="file"]').setInputFiles([asset('limbe-family.jpg')]);
  await sleep(800);
  await tap(page, field(d, 'How many rooms').locator('button').last(), 600);
  await tap(page, d.getByRole('button', { name: 'Save', exact: true }), 1800);

  await step('rooms');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1400);
  await glide(page, 420, 1600);
  await glide(page, 380, 1600);

  // Calendar on the lodge with guests
  await step('cal');
  await tap(page, nav('Stays'), 1800);
  await tap(page, page.locator('.host-row', { hasText: 'Mount Fako Lodge' }).first().getByRole('button', { name: /Calendar/ }), 2200);
  await show(page.locator('.stay-cal, table').first(), 1500);
  await tap(page, page.getByRole('button', { name: 'Next days' }), 1400);
  await tap(page, page.getByRole('button', { name: 'Previous days' }), 1200);

  await step('block');
  const night = new Date(D.day(2) + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  await tap(page, page.locator(`button.stay-cell[aria-label^="103, ${night}"]`), 1000);
  await page.locator(`button.stay-cell--block[aria-label^="103, ${night}"]`).waitFor({ timeout: 8000 });
  await sleep(1600);

  await step('range');
  await tap(page, page.getByRole('button', { name: 'Block dates' }).first(), 1300);
  d = dialog(page);
  for (const label of ['103', '204']) await tap(page, d.getByRole('checkbox', { name: label, exact: true }), 500);
  const stepper = d.locator('.stay-stepper').first().locator('button').last();
  if (await stepper.count()) await tap(page, stepper, 600);
  await tap(page, d.getByRole('radio', { name: 'Maintenance' }), 600);
  await tap(page, d.getByRole('button', { name: 'Mark unavailable', exact: true }), 1800);

  await step('bookings');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(800);
  await tap(page, page.getByRole('radio', { name: /^Bookings/ }).first(), 1800);
  await glide(page, 380, 1600);
  await glide(page, 380, 1600);

  // Messages
  await step('msg');
  await tap(page, nav('Messages'), 1800);
  await tap(page, page.getByRole('button', { name: /^Samuel Kum/ }).first(), 2000);
  const box = page.getByRole('textbox').last();
  await type(page, box, 'Yes, breakfast is included for everyone. See you on the 26th!', 35);
  await page.keyboard.press('Enter');
  await sleep(1800);

  // Wallet
  await step('wallet');
  await page.goBack();
  await sleep(1000);
  await tap(page, nav('Wallet'), 2000);
  await glide(page, 300, 1500);
  await glide(page, -300, 1000);

  await step('withdraw');
  await tap(page, page.getByRole('button', { name: 'Withdraw', exact: true }).first(), 1200);
  const sheet = page.locator('.withdrawal-modal-content');
  await type(page, sheet.locator('input[placeholder="0"]'), '50000', 90);
  await tap(page, sheet.getByRole('button', { name: /MTN/ }).first(), 600);
  await type(page, sheet.locator('input[type="tel"]'), '690000002', 70);
  await sleep(1400);
  await tap(page, sheet.getByRole('button', { name: 'Cancel' }).first(), 900);

  // Analytics
  await step('analytics');
  await tap(page, nav('Profile'), 1600);
  await tap(page, page.getByRole('button', { name: 'Analytics', exact: true }).first(), 2400);

  // Edit or delete
  await step('edit');
  await tap(page, nav('Stays'), 1800);
  const row = page.locator('.host-row', { hasText: 'Limbe Bay Guest House' }).first();
  await show(row, 1500);
  await tap(page, row.getByRole('button', { name: /Edit/ }).first(), 2600);
  await glide(page, 400, 1500);
  await settle(1.2);
  await stopRecording(rec);
  await closeSoon(ctx);
  return save(rec);
}

// --- Assembly: picture, captions and the voice. -------------------------------------
async function voicedCard(browser, name, card, line, min = 4) {
  const png = path.join(WORK, `${name}.png`);
  await renderPng(browser, cardHtml(card), png);
  const voice = voiceFile(line);
  const secs = Math.max(min, duration(voice) + 1.2);
  const out = path.join(WORK, `${name}.mp4`);
  ff(['-loop', '1', '-t', secs.toFixed(2), '-i', png, '-i', voice,
    '-filter_complex', `[0:v]fps=30,fade=t=in:st=0:d=0.4,fade=t=out:st=${(secs - 0.4).toFixed(2)}:d=0.4[v];[1:a]adelay=400|400,apad,atrim=0:${secs.toFixed(2)},aresample=44100[a]`,
    '-map', '[v]', '-map', '[a]', ...X264, '-c:a', 'aac', '-b:a', '160k', '-ac', '2', out]);
  return out;
}

async function voicedSegment(browser, recording) {
  const silent = await buildSegment(browser, recording, 'For hosts');
  const start = recording.frames[0].t;
  const dur = recording.stop - start;
  const voices = recording.marks.filter((m) => m.voice && fs.existsSync(m.voice));
  const inputs = voices.flatMap((m) => ['-i', m.voice]);
  const delays = voices.map((m, i) => { const ms = Math.max(0, Math.round((m.t - start) * 1000) + 150); return `[${i + 1}:a]adelay=${ms}|${ms}[a${i}]`; });
  const mix = `${delays.join(';')};${voices.map((_, i) => `[a${i}]`).join('')}amix=inputs=${voices.length}:normalize=0,apad,atrim=0:${dur.toFixed(3)},aresample=44100[a]`;
  const out = path.join(WORK, 'host-guide-voiced.mp4');
  ff(['-i', silent, ...inputs, '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ac', '2', out]);
  return out;
}

(async () => {
  if (MODE === 'record' || MODE === 'all') fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    if (MODE === 'voice' || MODE === 'all') {
      console.log('narration…');
      await voiceAll();
      if (MODE === 'voice') return;
    }
    if (MODE === 'record' || MODE === 'all') {
      console.log('recording host guide…');
      await story(browser);
      if (MODE === 'record') return;
    }
    console.log('building video…');
    const recording = load('host-guide');
    const intro = await voicedCard(browser, 'intro', { kicker: 'Propella Stays · For hosts', title: 'Run your stay on Propella', body: 'List a property, set up rooms, manage the calendar, follow bookings and get paid.', foot: 'Demo recorded with made-up guests, hosts and bookings.' }, INTRO, 5);
    const body = await voicedSegment(browser, recording);
    const outro = await voicedCard(browser, 'outro', { kicker: 'Propella Stays', title: 'List your first stay today', body: 'Guests book and pay a deposit by Mobile Money. You manage every room and night in one place.', foot: 'All names, places and bookings in this video are made up.' }, OUTRO, 5);
    join([intro, body, outro], path.join(OUT, 'propella-stays-host-guide.mp4'));
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
