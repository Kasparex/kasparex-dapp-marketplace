for (const file of ['search.js?v=20260625195001', 'components.js?v=20260625195001']) {
  const js = await (await fetch('https://kasnfthub.com/' + file, { signal: AbortSignal.timeout(20000) })).text();
  console.log('\n===', file, 'len', js.length);
  const fetchCalls = [...js.matchAll(/fetch\(\s*[`'"]([^`'"]+)[`'"]/g)].map((m) => m[1]);
  console.log('fetch:', fetchCalls);
}

const html = await (await fetch('https://kasnfthub.com/', { signal: AbortSignal.timeout(15000) })).text();
const inlineScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((s) => s.trim().length > 20);
console.log('\ninline scripts', inlineScripts.length);
for (const s of inlineScripts) {
  const f = [...s.matchAll(/fetch\(\s*[`'"]([^`'"]+)[`'"]/g)].map((m) => m[1]);
  if (f.length) console.log('inline fetch', f);
  if (/kaspa\.stream|krc721|api\./i.test(s)) console.log('snippet', s.slice(0, 500));
}

// probe kaspa.stream API used by hub
const addr = 'kaspa:qz5k4jzhggxy3dyrukezkj4ys5hdqjgw0xtkpcj4ar393z99rp5xq9c2m8utk';
const streamPaths = [
  'https://kaspa.stream/addresses/' + encodeURIComponent(addr),
  'https://kaspa.stream/api/v1/krc721/mainnet/address/' + encodeURIComponent(addr),
  'https://kaspa.stream/krc721/address/' + encodeURIComponent(addr),
];
for (const u of streamPaths) {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
    console.log('\n', u, r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.log(u, e.message);
  }
}
