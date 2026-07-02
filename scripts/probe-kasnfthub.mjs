const html = await (await fetch('https://kasnfthub.com/', { signal: AbortSignal.timeout(15000) })).text();
const scripts = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
console.log('scripts:', scripts);

for (const path of [
  '/api/collections',
  '/api/stats',
  '/api/listings',
  '/api/wallets',
  '/wallet/kaspa:qz5k4jzhggxy3dyrukezkj4ys5hdqjgw0xtkpcj4ar393z99rp5xq9c2m8utk',
  '/w/kaspa:qz5k4jzhggxy3dyrukezkj4ys5hdqjgw0xtkpcj4ar393z99rp5xq9c2m8utk',
]) {
  try {
    const r = await fetch('https://kasnfthub.com' + path, { signal: AbortSignal.timeout(10000) });
    const t = await r.text();
    console.log(path, r.status, t.startsWith('<!') ? 'html' : t.slice(0, 250));
  } catch (e) {
    console.log(path, 'ERR', e.message);
  }
}

if (scripts[0]) {
  const jsUrl = scripts[0].startsWith('http') ? scripts[0] : 'https://kasnfthub.com' + scripts[0];
  const js = await (await fetch(jsUrl, { signal: AbortSignal.timeout(15000) })).text();
  const apis = [...js.matchAll(/https?:\/\/[^\s"'`]+/g)]
    .map((m) => m[0])
    .filter((u) => /api|kaspa|krc721|backend/i.test(u));
  console.log('api urls in js:', [...new Set(apis)].slice(0, 30));
  const rel = [...js.matchAll(/\/api\/[a-zA-Z0-9_\-\/\?=&]+/g)].map((m) => m[0]).slice(0, 30);
  console.log('relative api paths:', [...new Set(rel)]);
}
