// Shared pieces of the demo films: recorder, gentle taps, captions, title cards and FFmpeg assembly.
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const WORK = process.env.DEMO_WORK || path.join(ROOT, 'work');
const OUT = path.join(ROOT, 'out');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now() / 1000;

// --- Taps are shown as a ripple so viewers can follow along. -----------------
const TAP_SCRIPT = () => {
  const add = () => {
    if (document.getElementById('demo-tap-style')) return;
    const st = document.createElement('style');
    st.id = 'demo-tap-style';
    st.textContent = `.demo-tap{position:fixed;z-index:2147483647;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
      background:rgba(0,74,173,.28);border:2px solid rgba(0,74,173,.75);pointer-events:none;animation:demo-tap .6s ease-out forwards}
      @keyframes demo-tap{from{transform:scale(.4);opacity:1}to{transform:scale(1.5);opacity:0}}
      ::-webkit-scrollbar{width:0!important;height:0!important}`;
    document.documentElement.appendChild(st);
  };
  document.addEventListener('pointerdown', (e) => {
    add();
    const d = document.createElement('div');
    d.className = 'demo-tap';
    d.style.left = e.clientX + 'px';
    d.style.top = e.clientY + 'px';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }, true);
  document.addEventListener('DOMContentLoaded', add);
};

// --- Recorder: Chrome screencast frames, timed by arrival. -------------------
async function startRecording(page, name) {
  const dir = path.join(WORK, name);
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const rec = { name, dir, frames: [], marks: [], cdp, start: now(), stop: null };
  cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
    const file = path.join(dir, `f${String(rec.frames.length).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    rec.frames.push({ file, t: now() });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  return rec;
}
function save(rec) {
  const { cdp, ...plain } = rec;
  fs.writeFileSync(path.join(WORK, `${rec.name}.json`), JSON.stringify(plain));
  return plain;
}
const load = (name) => JSON.parse(fs.readFileSync(path.join(WORK, `${name}.json`), 'utf-8'));
async function stopRecording(rec) {
  await sleep(300);
  rec.stop = now();
  await rec.cdp.send('Page.stopScreencast').catch(() => {});
}
const mark = (rec, step, title, body) => { console.log(`  ${rec.name} ${step}. ${title}`); rec.marks.push({ t: now(), step, title, body }); };
const closeSoon = (ctx) => Promise.race([ctx.close().catch(() => {}), sleep(5000)]);

// --- Gentle interactions. ------------------------------------------------------
async function show(loc, pause = 900) {
  await loc.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await sleep(pause);
}
async function tap(page, loc, after = 1400) {
  await loc.waitFor({ state: 'visible', timeout: 15000 });
  await show(loc, 700);
  // Wait for smooth scrolling and layout shifts to settle, so the tap lands on this button.
  let box = await loc.boundingBox();
  for (let i = 0; i < 20; i++) {
    await sleep(100);
    const next = await loc.boundingBox();
    const still = next && Math.abs(next.y - box.y) < 1 && Math.abs(next.x - box.x) < 1;
    box = next;
    if (still) break;
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  box = (await loc.boundingBox()) || box;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(after);
}
async function glide(page, dy, ms = 1400) {
  await page.evaluate(([dy]) => window.scrollBy({ top: dy, behavior: 'smooth' }), [dy]);
  await sleep(ms);
}

// --- Graphics: caption panels, phone bezel and title cards, drawn in HTML. ---
const BRAND = '#004aad';
const SCREEN = { x: 250, y: 60, w: 444, h: 960, r: 44 };
const css = `*{box-sizing:border-box;margin:0}body{width:1920px;height:1080px;font-family:'Segoe UI',Inter,Arial,sans-serif;overflow:hidden}`;
const background = `background:radial-gradient(1200px 800px at 15% 20%,#e6f0ff 0%,#f6f9ff 55%,#ffffff 100%)`;

function captionHtml({ part, step, steps, title, body }) {
  const dots = Array.from({ length: steps }, (_, i) => `<span style="width:${i + 1 === step ? 36 : 12}px;height:12px;border-radius:6px;background:${i + 1 <= step ? BRAND : '#c9d6ea'}"></span>`).join('');
  return `<html><head><style>${css}</style></head><body style="${background}">
    <div style="position:absolute;left:${SCREEN.x - 18}px;top:${SCREEN.y - 18}px;width:${SCREEN.w + 36}px;height:${SCREEN.h + 36}px;border-radius:${SCREEN.r + 18}px;box-shadow:0 40px 80px rgba(0,40,100,.25)"></div>
    <div style="position:absolute;left:860px;top:0;width:900px;height:1080px;display:flex;flex-direction:column;justify-content:center;gap:28px">
      <div style="display:flex;align-items:center;gap:14px;color:${BRAND};font-size:26px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">
        <span style="display:inline-flex;width:14px;height:14px;border-radius:50%;background:${BRAND}"></span>${part}
      </div>
      <div style="display:flex;align-items:center;gap:22px">
        <span style="flex-shrink:0;width:76px;height:76px;border-radius:50%;background:${BRAND};color:#fff;font-size:38px;font-weight:800;display:flex;align-items:center;justify-content:center">${step}</span>
        <h1 style="font-size:64px;line-height:1.08;font-weight:800;color:#0b1b33;letter-spacing:-.02em">${title}</h1>
      </div>
      <p style="font-size:34px;line-height:1.45;color:#3b4a60;max-width:820px">${body}</p>
      <div style="display:flex;gap:10px;margin-top:18px">${dots}</div>
    </div>
    <div style="position:absolute;right:56px;bottom:40px;font-size:20px;color:#7c8aa0">Propella Stays · demo with made-up data</div>
  </body></html>`;
}
function bezelHtml() {
  const o = { x: SCREEN.x - 16, y: SCREEN.y - 16, w: SCREEN.w + 32, h: SCREEN.h + 32, r: SCREEN.r + 16 };
  const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  return `<html><head><style>${css}body{background:transparent}</style></head><body>
    <svg width="1920" height="1080" style="position:absolute;inset:0"><path fill-rule="evenodd" fill="#10151d" d="${rr(o.x, o.y, o.w, o.h, o.r)} ${rr(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, SCREEN.r)}"/>
    <rect x="${SCREEN.x + SCREEN.w / 2 - 60}" y="${SCREEN.y - 9}" width="120" height="6" rx="3" fill="#2a323d"/></svg></body></html>`;
}
function cardHtml({ kicker, title, body, foot }) {
  return `<html><head><style>${css}</style></head><body style="background:linear-gradient(135deg,#003b8a 0%,${BRAND} 55%,#1f6fe0 100%);color:#fff">
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 200px;gap:30px">
      <div style="font-size:30px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.85">${kicker}</div>
      <h1 style="font-size:104px;line-height:1.02;font-weight:800;letter-spacing:-.03em;max-width:1400px">${title}</h1>
      <p style="font-size:38px;line-height:1.4;opacity:.92;max-width:1300px">${body}</p>
    </div>
    <div style="position:absolute;left:200px;bottom:70px;font-size:24px;opacity:.75">${foot}</div>
  </body></html>`;
}

async function renderPng(browser, html, file, transparent = false) {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.setContent(html);
  await p.screenshot({ path: file, omitBackground: transparent });
  await p.close();
}

// --- FFmpeg assembly. ------------------------------------------------------------
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const X264 = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30'];
const slash = (p) => p.replace(/\\/g, '/');

function concatList(file, items) {
  // items: [{ file, d }] -> ffconcat with the last file repeated (needed for its duration to count).
  const lines = ['ffconcat version 1.0'];
  for (const it of items) lines.push(`file '${slash(it.file)}'`, `duration ${Math.max(0.034, it.d).toFixed(3)}`);
  lines.push(`file '${slash(items[items.length - 1].file)}'`);
  fs.writeFileSync(file, lines.join('\n'));
  return file;
}

async function buildSegment(browser, rec, part) {
  const start = rec.frames[0].t;
  const end = rec.stop;
  // Resample the screencast to a steady 30 fps. (The concat demuxer stretches frames shorter
  // than 40 ms, which made the picture drift seconds behind the captions during typing.)
  const seq = path.join(WORK, `${rec.name}-seq`);
  fs.rmSync(seq, { recursive: true, force: true });
  fs.mkdirSync(seq);
  for (let k = 0, j = 0, n = Math.ceil((end - start) * 30); k < n; k++) {
    const t = start + k / 30;
    while (j + 1 < rec.frames.length && rec.frames[j + 1].t <= t) j++;
    const dest = path.join(seq, `s${String(k).padStart(5, '0')}.jpg`);
    try { fs.linkSync(rec.frames[j].file, dest); } catch { fs.copyFileSync(rec.frames[j].file, dest); }
  }
  const steps = rec.marks.length;
  const caps = [];
  for (let i = 0; i < rec.marks.length; i++) {
    const m = rec.marks[i];
    const file = path.join(WORK, `${rec.name}-cap${i}.png`);
    await renderPng(browser, captionHtml({ part, step: m.step, steps, title: m.title, body: m.body }), file);
    const from = i === 0 ? start : Math.max(start, m.t);
    const to = i + 1 < rec.marks.length ? Math.max(start, rec.marks[i + 1].t) : end;
    caps.push({ file, d: to - from });
  }
  const bezel = path.join(WORK, 'bezel.png');
  if (!fs.existsSync(bezel)) await renderPng(browser, bezelHtml(), bezel, true);
  const out = path.join(WORK, `${rec.name}.mp4`);
  const dur = end - start;
  ff([
    '-f', 'concat', '-safe', '0', '-i', concatList(path.join(WORK, `${rec.name}-caps.txt`), caps),
    '-framerate', '30', '-i', path.join(seq, 's%05d.jpg'),
    '-loop', '1', '-i', bezel,
    '-filter_complex',
    `[0:v]fps=30,format=rgb24[bg];[1:v]scale=${SCREEN.w}:${SCREEN.h}:flags=lanczos,format=rgb24[ph];` +
      `[bg][ph]overlay=${SCREEN.x}:${SCREEN.y}:shortest=1[a];[a][2:v]overlay=0:0:shortest=1,` +
      `fade=t=in:st=0:d=0.4,fade=t=out:st=${(dur - 0.45).toFixed(2)}:d=0.45[v]`,
    '-map', '[v]', '-t', dur.toFixed(3), ...X264, out,
  ]);
  return out;
}

async function buildCard(browser, name, card, seconds = 3.6) {
  const png = path.join(WORK, `${name}.png`);
  await renderPng(browser, cardHtml(card), png);
  const out = path.join(WORK, `${name}.mp4`);
  ff(['-loop', '1', '-t', String(seconds), '-i', png, '-vf', `fps=30,fade=t=in:st=0:d=0.4,fade=t=out:st=${seconds - 0.4}:d=0.4`, ...X264, out]);
  return out;
}

function join(files, out) {
  const list = path.join(WORK, path.basename(out) + '.txt');
  fs.writeFileSync(list, files.map((f) => `file '${slash(f)}'`).join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  return out;
}


module.exports = { chromium, fs, path, ROOT, WORK, OUT, sleep, now, TAP_SCRIPT, startRecording, save, load, stopRecording, mark, closeSoon, show, tap, glide,
  BRAND, SCREEN, captionHtml, cardHtml, renderPng, ff, X264, slash, buildSegment, buildCard, join };
