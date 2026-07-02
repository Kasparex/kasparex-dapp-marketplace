const html = await (await fetch('https://kasnfthub.com/', { signal: AbortSignal.timeout(20000) })).text();

function extractFn(name) {
  const re = new RegExp(`function ${name}[\\s\\S]{0,800}`);
  const m = html.match(re);
  return m ? m[0] : null;
}

for (const fn of [
  'buildWalletApiUrl',
  'buildHomeCollectionsApiUrl',
  'buildCollectionApiUrl',
  'buildNftsApiUrl',
  'getApiBase',
  'API_BASE',
]) {
  const chunk = extractFn(fn) || (html.includes(fn) ? html.slice(html.indexOf(fn) - 20, html.indexOf(fn) + 300) : 'missing');
  console.log('\n---', fn, '---\n', chunk);
}

const consts = [...html.matchAll(/const [A-Z_]+ = ["'`][^"'`]+["'`]/g)].slice(0, 40).map((m) => m[0]);
console.log('\nconst strings:', consts.filter((s) => /API|URL|BASE|STREAM|KRC/i.test(s)));
