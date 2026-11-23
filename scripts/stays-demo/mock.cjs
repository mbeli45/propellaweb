// A tiny in-memory stand-in for Supabase (PostgREST + Auth + Storage), served
// through Playwright's request routing. Only the fake host demo.supabase.test
// is answered; every other non-localhost request is blocked.
const fs = require('fs');
const path = require('path');

const API = 'http://demo.supabase.test';

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function fakeJwt(user) {
  const now = Math.floor(Date.now() / 1000);
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', exp: now + 86400, iat: now })}.c2lnbmF0dXJl`;
}
function sessionFor(user) {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: fakeJwt(user),
    refresh_token: 'demo-refresh',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: now + 86400,
    user: {
      id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email,
      email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email' },
      user_metadata: { full_name: user.full_name, role: user.role }, created_at: '2026-01-01T00:00:00Z',
    },
  };
}

// --- PostgREST-ish filtering --------------------------------------------------
function parseList(v) {
  // in.(a,b,"c d")
  const inner = v.replace(/^\(|\)$/g, '');
  return inner.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
}
function cmp(a, b) {
  if (a == null) return -1;
  if (typeof a === 'number' || !isNaN(Number(a)) && !isNaN(Number(b)) && typeof a !== 'string') return Number(a) - Number(b);
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}
function test(row, col, expr) {
  const val = col.includes('->') ? undefined : row[col];
  let neg = false;
  if (expr.startsWith('not.')) { neg = true; expr = expr.slice(4); }
  const dot = expr.indexOf('.');
  const op = expr.slice(0, dot);
  const arg = expr.slice(dot + 1);
  let r;
  switch (op) {
    case 'eq': r = String(val) === arg; break;
    case 'neq': r = String(val) !== arg; break;
    case 'gt': r = typeof val === 'number' ? val > Number(arg) : String(val) > arg; break;
    case 'gte': r = typeof val === 'number' ? val >= Number(arg) : String(val) >= arg; break;
    case 'lt': r = typeof val === 'number' ? val < Number(arg) : String(val) < arg; break;
    case 'lte': r = typeof val === 'number' ? val <= Number(arg) : String(val) <= arg; break;
    case 'in': r = parseList(arg).includes(String(val)); break;
    case 'is': r = arg === 'null' ? val == null : arg === 'true' ? val === true : arg === 'false' ? val === false : true; break;
    case 'ilike': case 'like': {
      const re = new RegExp('^' + decodeURIComponent(arg).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*%]/g, '.*') + '$', 'i');
      r = re.test(String(val ?? ''));
      break;
    }
    case 'cs': { // array contains
      const want = parseList(arg.replace(/^\{|\}$/g, ''));
      r = Array.isArray(val) && want.every((w) => val.includes(w));
      break;
    }
    case 'ov': {
      const want = parseList(arg.replace(/^\{|\}$/g, ''));
      r = Array.isArray(val) && want.some((w) => val.includes(w));
      break;
    }
    default: r = true; // unknown operator: don't filter
  }
  return neg ? !r : r;
}
function splitTop(s) {
  const out = []; let depth = 0; let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
function testOr(row, expr) {
  // or=(a.eq.1,b.ilike.*x*,and(c.eq.2,d.eq.3))
  const parts = splitTop(expr.replace(/^\(|\)$/g, ''));
  return parts.some((p) => evalExpr(row, p));
}
function evalExpr(row, p) {
  if (p.startsWith('and(')) return splitTop(p.slice(4, -1)).every((q) => evalExpr(row, q));
  if (p.startsWith('or(')) return splitTop(p.slice(3, -1)).some((q) => evalExpr(row, q));
  return testCond(row, p);
}
function testCond(row, p) {
  const i = p.indexOf('.');
  return test(row, p.slice(0, i), p.slice(i + 1));
}

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'or', 'and', 'on_conflict', 'columns']);

function query(rows, params) {
  let out = rows.slice();
  for (const [k, v] of params) {
    if (RESERVED.has(k)) continue;
    if (k.includes('.')) continue; // filters on embedded resources: ignore
    out = out.filter((r) => test(r, k, v));
  }
  const or = params.get('or');
  if (or) out = out.filter((r) => testOr(r, or));
  const order = params.get('order');
  if (order) {
    const keys = order.split(',').map((o) => { const [c, dir, nulls] = o.split('.'); return { c, desc: dir === 'desc' }; });
    out.sort((a, b) => { for (const { c, desc } of keys) { const d = cmp(a[c], b[c]); if (d) return desc ? -d : d; } return 0; });
  }
  const offset = Number(params.get('offset') || 0);
  const limit = params.get('limit') ? Number(params.get('limit')) : undefined;
  return { total: out.length, rows: out.slice(offset, limit != null ? offset + limit : undefined) };
}

// --- The router -----------------------------------------------------------------
function createMock({ db, rpc = {}, functions = {}, views = {}, defaults = {}, asUser = null, log = false, assetsDir }) {
  const seen = [];
  let uid = 1;
  const newId = () => `00000000-0000-4000-8000-${String(Date.now() % 1e6).padStart(6, '0')}${String(uid++).padStart(6, '0')}`;

  async function handle(route) {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const p = url.pathname;
    const json = (status, body, headers = {}) =>
      route.fulfill({ status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': 'content-range', ...headers }, body: body === undefined ? '' : JSON.stringify(body) });

    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': 'content-range' } });

    // Auth
    if (p.startsWith('/auth/v1/')) {
      if (p === '/auth/v1/user') return asUser ? json(200, sessionFor(asUser).user) : json(401, { message: 'no session' });
      if (p === '/auth/v1/token') return asUser ? json(200, sessionFor(asUser)) : json(400, { error: 'invalid_grant' });
      if (p === '/auth/v1/logout') return json(204);
      return json(200, {});
    }
    // Storage: serve our generated pictures
    if (p.startsWith('/storage/v1/')) {
      const name = path.basename(p);
      const file = assetsDir && path.join(assetsDir, name);
      if (file && fs.existsSync(file)) return route.fulfill({ status: 200, headers: { 'content-type': name.endsWith('.png') ? 'image/png' : 'image/jpeg', 'access-control-allow-origin': '*' }, body: fs.readFileSync(file) });
      return json(200, {});
    }
    if (p.startsWith('/functions/v1/')) {
      const name = p.slice('/functions/v1/'.length);
      if (name === 'r2-media') {
        // Photo upload: the demo only uploads pictures from assets/, so serve them back by name.
        const raw = (req.postDataBuffer() || Buffer.alloc(0)).toString('latin1');
        const file = (raw.match(/filename="([^"]+)"/) || [])[1] || 'upload.jpg';
        const folder = (raw.match(/name="folder"\s+([^\s-]+)/) || [])[1] || 'uploads';
        return json(200, { url: `${API}/storage/v1/object/public/demo/${file}`, path: `${folder}/${file}` });
      }
      let body = {};
      try { body = req.postDataJSON() || {}; } catch {}
      if (log) seen.push(`FN ${name} ${JSON.stringify(body)}`);
      return json(200, functions[name] ? await functions[name](body, { db, asUser }) : {});
    }

    if (p.startsWith('/rest/v1/rpc/')) {
      const name = p.slice('/rest/v1/rpc/'.length);
      let body = {};
      try { body = req.postDataJSON() || {}; } catch { body = Object.fromEntries(url.searchParams); }
      if (log) seen.push(`RPC ${name} ${JSON.stringify(body)}`);
      if (rpc[name]) {
        try { return json(200, await rpc[name](body, { db, newId, asUser })); } catch (e) { return json(400, { message: String(e.message || e) }); }
      }
      return json(200, null);
    }

    if (p.startsWith('/rest/v1/')) {
      const table = p.slice('/rest/v1/'.length);
      const params = url.searchParams;
      const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
      const prefer = req.headers()['prefer'] || '';
      if (log) seen.push(`${method} ${table}?${decodeURIComponent(params.toString())}${single ? ' [single]' : ''}`);
      const rows = db[table] || (db[table] = []);

      if (method === 'GET' || method === 'HEAD') {
        const { total, rows: hit } = query(rows, params);
        const out = views[table] ? hit.map((r) => views[table](r, db)) : hit;
        const headers = { 'content-range': `${out.length ? `0-${out.length - 1}` : '*'}/${total}` };
        if (method === 'HEAD') return route.fulfill({ status: 200, headers: { ...headers, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' } });
        if (single) return out.length ? json(200, out[0], headers) : json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: 'The result contains 0 rows' });
        return json(200, out, headers);
      }
      let body = null;
      try { body = req.postDataJSON(); } catch { body = null; }
      if (method === 'POST') {
        const base = Object.fromEntries(Object.entries(defaults[table] || {}).filter(([, v]) => v !== undefined));
        const items = (Array.isArray(body) ? body : [body]).map((r) => {
          const row = { ...base, id: newId(), created_at: new Date().toISOString(), ...r };
          if (table === 'properties' && Array.isArray(row.images) && !row.image) row.image = row.images[0] || null;
          return row;
        });
        rows.push(...items);
        return json(201, prefer.includes('return=representation') ? (single ? items[0] : items) : undefined);
      }
      if (method === 'PATCH') {
        const { rows: hit } = query(rows, params);
        hit.forEach((r) => Object.assign(r, body));
        if (log) seen.push(`  -> patched ${hit.length}`);
        return json(200, prefer.includes('return=representation') ? (single ? hit[0] : hit) : undefined);
      }
      if (method === 'DELETE') {
        const { rows: hit } = query(rows, params);
        db[table] = rows.filter((r) => !hit.includes(r));
        return json(200, prefer.includes('return=representation') ? hit : undefined);
      }
    }
    return json(404, { message: 'not mocked' });
  }

  async function install(context) {
    // Block the outside world; answer the fake Supabase host.
    await context.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
      if (u.hostname === 'demo.supabase.test') return handle(route);
      if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return route.continue();
      if (u.hostname === 'api.mapbox.com' && u.pathname.includes('/geocoding/')) {
        // Address search: a few made-up places around Limbe.
        const places = [['Mile 4, Limbe, South-West, Cameroon', 'Limbe'], ['Mile 4 Junction, Limbe, Cameroon', 'Limbe'], ['Down Beach, Limbe, Cameroon', 'Limbe']];
        const features = places.map(([place_name, town], i) => ({ id: `place.${i}`, place_name, center: [9.2 + i / 100, 4.01], relevance: 1 - i / 10, type: 'Feature', context: [{ id: 'place.t', text: town }] }));
        return route.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: JSON.stringify({ features }) });
      }
      if (log) seen.push(`BLOCKED ${u.hostname}${u.pathname}`);
      return route.abort();
    });
    if (context.routeWebSocket) await context.routeWebSocket(/demo\.supabase\.test/, (ws) => { /* realtime: accept and stay quiet */ });
    if (asUser) {
      const session = sessionFor(asUser);
      await context.addInitScript(([key, value]) => {
        try { localStorage.setItem(key, value); } catch {}
      }, ['sb-demo-auth-token', JSON.stringify(session)]);
    }
  }

  return { install, seen, db };
}

module.exports = { createMock, API };
