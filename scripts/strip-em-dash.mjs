import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EM = '\u2014';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** Collapse `  -  ` (from em-dash replacement) to ` - ` for readable copy. */
function normalizeSpacedHyphen(s) {
  return s.replace(/ {2}- {2}/g, ' - ');
}

function walk(dir, fn) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      walk(p, fn);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(e.name)) {
      fn(p);
    }
  }
}

walk(ROOT, (p) => {
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  if (s.includes(EM)) {
    s = s.replace(`'${EM}'`, `'-'`).replace(`"${EM}"`, `"-"`);
    s = s.split(EM).join(' - ');
  }
  s = normalizeSpacedHyphen(s);
  if (s !== before) {
    fs.writeFileSync(p, s);
    console.log('patched', p);
  }
});
