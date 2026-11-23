// Synthetic "photos" for the demo stays: flat illustrated scenes drawn as SVG
// and rendered to JPEG. No real places or people.
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const fs = require('fs');
const OUT = __dirname + '/assets/';
fs.mkdirSync(OUT, { recursive: true });

const W = 1200, H = 800;

function sky(id, top, bottom) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
}
function palm(x, y, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})">
    <path d="M0 0 C 8 -80, 18 -160, 6 -250" stroke="#7a5a3a" stroke-width="16" fill="none" stroke-linecap="round"/>
    ${[[-110, -40], [-80, -95], [10, -120], [95, -80], [120, -20], [-40, -130]].map(([dx, dy]) => `<path d="M6 -250 Q ${dx / 2} ${-250 + dy / 2 - 30} ${dx} ${-250 - dy * -0.4}" stroke="#2f7d4f" stroke-width="22" fill="none" stroke-linecap="round"/>`).join('')}
  </g>`;
}
function windows(x, y, cols, rows, w, h, gx, gy, lit) {
  let s = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const on = (r * 7 + c * 3) % 5 === 0;
    s += `<rect x="${x + c * (w + gx)}" y="${y + r * (h + gy)}" width="${w}" height="${h}" rx="4" fill="${on ? lit : '#a9c7de'}" stroke="#ffffff" stroke-width="3"/>`;
  }
  return s;
}

const scenes = {
  // Hotel at the foot of a mountain.
  hotel: ({ wall = '#f3efe6', accent = '#004aad', name = 'LODGE' }) => `
    <defs>${sky('s', '#8fc3ef', '#e7f2fb')}<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa86b"/><stop offset="1" stop-color="#4b8a50"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#s)"/>
    <path d="M0 470 L 260 300 L 420 360 L 640 170 L 820 330 L 980 260 L 1200 420 L1200 560 L0 560Z" fill="#7d93a8" opacity=".75"/>
    <path d="M590 215 L640 170 L 700 225 L 670 215 L 640 232 L 615 214Z" fill="#fff" opacity=".9"/>
    <circle cx="1020" cy="120" r="54" fill="#fff6d6"/>
    <rect y="560" width="${W}" height="240" fill="url(#g)"/>
    <rect x="300" y="300" width="600" height="300" fill="${wall}"/>
    <rect x="280" y="282" width="640" height="26" rx="6" fill="#6b4f3a"/>
    ${windows(332, 330, 6, 3, 66, 52, 22, 26, '#ffe7a3')}
    <rect x="555" y="508" width="90" height="92" rx="6" fill="#5b4330"/>
    <rect x="470" y="470" width="260" height="26" rx="6" fill="${accent}"/>
    <text x="600" y="490" font-family="Segoe UI, Arial" font-weight="700" font-size="18" fill="#fff" text-anchor="middle" letter-spacing="4">${name}</text>
    <rect x="200" y="600" width="800" height="18" fill="#d9d1bf"/>
    ${palm(220, 610, 1)}${palm(1000, 615, 0.9)}
    <ellipse cx="420" cy="640" rx="70" ry="22" fill="#3f7a45"/><ellipse cx="790" cy="645" rx="80" ry="24" fill="#3f7a45"/>`,

  // Small guest house by the sea.
  beach: ({ wall = '#fff3e0', roof = '#c0563b' }) => `
    <defs>${sky('s', '#6db6e8', '#d9f0fb')}<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a8fbf"/><stop offset="1" stop-color="#5cc0d9"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#s)"/>
    <circle cx="200" cy="140" r="60" fill="#fff4c4"/>
    <rect y="420" width="${W}" height="150" fill="url(#sea)"/>
    <path d="M0 470 Q 150 455 300 470 T 600 470 T 900 470 T 1200 470" stroke="#bfe9f5" stroke-width="5" fill="none" opacity=".7"/>
    <path d="M0 560 Q 300 520 600 545 T 1200 535 L1200 800 L0 800Z" fill="#f1dcae"/>
    <rect x="560" y="400" width="420" height="230" fill="${wall}"/>
    <path d="M530 410 L 770 290 L 1010 410Z" fill="${roof}"/>
    <rect x="610" y="450" width="90" height="80" rx="6" fill="#9fd0ea" stroke="#fff" stroke-width="5"/>
    <rect x="840" y="450" width="90" height="80" rx="6" fill="#9fd0ea" stroke="#fff" stroke-width="5"/>
    <rect x="725" y="510" width="80" height="120" rx="6" fill="#6b4a33"/>
    <rect x="540" y="630" width="460" height="14" fill="#d8c08f"/>
    ${palm(430, 650, 1.05)}${palm(1090, 660, 0.85)}
    <ellipse cx="300" cy="700" rx="110" ry="14" fill="#e2c98f"/>`,

  // Apartment block in town.
  apartment: ({ wall = '#e9edf3', accent = '#2f6f8f' }) => `
    <defs>${sky('s', '#9cc9ea', '#eef6fc')}</defs>
    <rect width="${W}" height="${H}" fill="url(#s)"/>
    <rect x="80" y="330" width="220" height="330" fill="#cfd6df"/><rect x="900" y="300" width="240" height="360" fill="#d6dce4"/>
    <rect x="360" y="170" width="480" height="490" fill="${wall}"/>
    <rect x="360" y="170" width="480" height="22" fill="${accent}"/>
    ${windows(392, 215, 4, 5, 86, 62, 28, 22, '#ffe2a0')}
    ${[0, 1, 2, 3, 4].map((r) => `<rect x="380" y="${282 + r * 84}" width="440" height="8" fill="#b9c2cd"/>`).join('')}
    <rect x="560" y="590" width="80" height="70" rx="4" fill="#5c6b7a"/>
    <rect y="660" width="${W}" height="140" fill="#8a9099"/>
    <rect y="700" width="${W}" height="8" fill="#e6e6e6" opacity=".7"/>
    <circle cx="200" cy="640" r="44" fill="#4f8f58"/><circle cx="1000" cy="640" r="50" fill="#4f8f58"/>`,

  // Bedroom interior.
  bedroom: ({ wall = '#efe7da', bed = '#ffffff', throwC = '#004aad', floor = '#c49a6c', view = 'mountain', art = '#e3a857' }) => `
    <defs>
      <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall}"/><stop offset="1" stop-color="${shade(wall, -10)}"/></linearGradient>
      <linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8cc6ee"/><stop offset="1" stop-color="#e5f3fb"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#w)"/>
    <rect y="600" width="${W}" height="200" fill="${floor}"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 200}" y="600" width="4" height="200" fill="${shade(floor, -14)}"/>`).join('')}
    <rect x="780" y="120" width="300" height="300" rx="8" fill="url(#v)" stroke="#ffffff" stroke-width="14"/>
    ${view === 'sea'
      ? `<rect x="787" y="300" width="286" height="113" fill="#3b9bc8"/><circle cx="900" cy="200" r="34" fill="#fff4c4"/>`
      : `<path d="M787 340 L 860 250 L 920 300 L 990 200 L 1073 330 L1073 413 L787 413Z" fill="#7e98ae"/><path d="M972 222 L990 200 L1008 224Z" fill="#fff"/>`}
    <rect x="928" y="120" width="6" height="300" fill="#ffffff"/>
    <rect x="740" y="100" width="40" height="350" rx="6" fill="${shade(throwC, 40)}" opacity=".55"/>
    <rect x="1080" y="100" width="40" height="350" rx="6" fill="${shade(throwC, 40)}" opacity=".55"/>
    <rect x="200" y="160" width="190" height="130" rx="6" fill="${art}" stroke="#5b4636" stroke-width="10"/>
    <circle cx="260" cy="220" r="28" fill="#fff" opacity=".6"/><path d="M215 280 L 290 220 L 330 250 L 375 210 L 375 280Z" fill="#fff" opacity=".35"/>
    <rect x="120" y="330" width="560" height="170" rx="22" fill="#6b4f3a"/>
    <rect x="100" y="460" width="600" height="160" rx="18" fill="${bed}"/>
    <rect x="100" y="520" width="600" height="110" rx="18" fill="${throwC}"/>
    <rect x="100" y="520" width="600" height="18" fill="${shade(throwC, 25)}"/>
    <rect x="150" y="410" width="200" height="80" rx="30" fill="#ffffff" stroke="#e6e1d8" stroke-width="3"/>
    <rect x="450" y="410" width="200" height="80" rx="30" fill="#ffffff" stroke="#e6e1d8" stroke-width="3"/>
    <rect x="96" y="620" width="20" height="40" fill="#4a3628"/><rect x="684" y="620" width="20" height="40" fill="#4a3628"/>
    <rect x="720" y="500" width="120" height="120" rx="8" fill="#7a5a43"/>
    <rect x="770" y="440" width="20" height="60" fill="#c9b79c"/>
    <path d="M740 440 L 820 440 L 800 390 L 760 390Z" fill="#fff1cf"/>
    <ellipse cx="780" cy="470" rx="90" ry="40" fill="#fff6d8" opacity=".25"/>
    <rect x="1010" y="520" width="70" height="90" rx="10" fill="#b88a5e"/>
    <path d="M1045 520 C 1000 470 1010 430 1045 410 C 1080 430 1090 470 1045 520Z" fill="#3f8a55"/>
    <path d="M1045 520 C 1060 460 1100 450 1110 440 C 1105 490 1080 510 1045 520Z" fill="#2f7a47"/>`,

  // Lounge / breakfast room.
  lounge: ({ wall = '#f1ece3', sofa = '#2f6f8f', floor = '#b98d62' }) => `
    <defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8cc6ee"/><stop offset="1" stop-color="#e5f3fb"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="${wall}"/>
    <rect y="590" width="${W}" height="210" fill="${floor}"/>
    ${[0, 1, 2].map((i) => `<rect x="${140 + i * 330}" y="110" width="260" height="300" rx="10" fill="url(#v)" stroke="#fff" stroke-width="12"/>
      <path d="M${146 + i * 330} 330 L ${200 + i * 330} 280 L ${260 + i * 330} 310 L ${320 + i * 330} 260 L ${394 + i * 330} 320 L${394 + i * 330} 404 L${146 + i * 330} 404Z" fill="#5f9a62"/>`).join('')}
    <rect x="160" y="470" width="420" height="140" rx="26" fill="${sofa}"/>
    <rect x="160" y="430" width="420" height="80" rx="26" fill="${shade(sofa, 15)}"/>
    <rect x="200" y="455" width="110" height="60" rx="18" fill="#f2c46d"/>
    <rect x="430" y="455" width="110" height="60" rx="18" fill="#ffffff"/>
    <ellipse cx="370" cy="690" rx="190" ry="34" fill="${shade(floor, -18)}"/>
    <rect x="300" y="620" width="140" height="18" rx="9" fill="#5b4330"/>
    <rect x="720" y="520" width="340" height="18" rx="9" fill="#6b4f3a"/>
    <rect x="740" y="538" width="14" height="90" fill="#5b4330"/><rect x="1026" y="538" width="14" height="90" fill="#5b4330"/>
    <circle cx="800" cy="505" r="16" fill="#ffffff"/><circle cx="890" cy="505" r="16" fill="#ffffff"/><rect x="960" y="480" width="30" height="40" rx="6" fill="#d9543a"/>
    <rect x="690" y="540" width="70" height="110" rx="14" fill="${sofa}"/><rect x="1020" y="540" width="70" height="110" rx="14" fill="${sofa}"/>
    <circle cx="640" cy="160" r="0"/>
    <rect x="1080" y="470" width="60" height="140" rx="10" fill="#b88a5e"/>
    <path d="M1110 470 C 1060 420 1070 370 1110 340 C 1150 370 1160 420 1110 470Z" fill="#3f8a55"/>`,
};

function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (pct / 100) * (pct > 0 ? 255 - c : c))));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((c) => c.toString(16).padStart(2, '0')).join('');
}

const PHOTOS = {
  'fako-ext': ['hotel', { name: 'MOUNT FAKO LODGE' }],
  'fako-std': ['bedroom', { throwC: '#004aad', art: '#e3a857' }],
  'fako-dlx': ['bedroom', { wall: '#e6ecef', throwC: '#2f6f8f', floor: '#a9825c', art: '#d97757' }],
  'fako-fam': ['bedroom', { wall: '#f2e6d8', throwC: '#8a5a2b', art: '#6aa86b' }],
  'fako-lounge': ['lounge', {}],
  'seaside-ext': ['beach', {}],
  'seaside-room': ['bedroom', { view: 'sea', wall: '#eef4f2', throwC: '#1f8a8a', floor: '#d1b58a', art: '#3b9bc8' }],
  'soppo-ext': ['beach', { wall: '#eef3e6', roof: '#4b7a3b' }],
  'soppo-room': ['bedroom', { wall: '#f0e9f0', throwC: '#7a4f8a', art: '#e3a857' }],
  'bonapriso-ext': ['apartment', {}],
  'bonapriso-lounge': ['lounge', { sofa: '#8a3b3b', wall: '#ece9e4' }],
  'akwa-ext': ['hotel', { wall: '#e9edf3', accent: '#1f2937', name: 'AKWA BUSINESS HOTEL' }],
  'akwa-room': ['bedroom', { wall: '#e8e8ea', throwC: '#1f2937', floor: '#9b7a5a', art: '#c9a227' }],
  'kribi-ext': ['beach', { wall: '#fff8ec', roof: '#a8742f' }],
  'kribi-room': ['bedroom', { view: 'sea', wall: '#fbf3e6', throwC: '#d9733a', art: '#3b9bc8' }],
  // The stay the host lists during the host demo.
  'limbe-ext': ['beach', { wall: '#f4efe3', roof: '#b4532a' }],
  'limbe-garden': ['lounge', { sofa: '#2f6f8f', wall: '#f1ece2' }],
  'limbe-sea': ['bedroom', { view: 'sea', wall: '#eef3f6', throwC: '#2f6f8f', floor: '#c9a77d', art: '#e3a857' }],
  'limbe-family': ['bedroom', { wall: '#f3ebe1', throwC: '#b4532a', art: '#6aa86b' }],
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const [name, [kind, opts]] of Object.entries(PHOTOS)) {
    await p.setContent(`<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${scenes[kind](opts)}</svg></body></html>`);
    await p.screenshot({ path: `${OUT}${name}.jpg`, type: 'jpeg', quality: 88 });
  }
  await b.close();
  console.log(Object.keys(PHOTOS).length, 'photos');
})();
