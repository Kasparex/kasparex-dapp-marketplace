/**
 * Builds docs/minecore/Minecore-Specification.pdf from Minecore-Specification.csv
 * Run: node scripts/generate-minecore-spec-pdf.mjs
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'docs', 'minecore', 'Minecore-Specification.csv');
const outPath = path.join(root, 'docs', 'minecore', 'Minecore-Specification.pdf');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ',') {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function trimTrailingEmpty(cells) {
  let end = cells.length;
  while (end > 0 && !cells[end - 1]) end--;
  return cells.slice(0, end);
}

const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/);

/** @type {{ section: string; rows: string[][] }[]} */
const chunks = [];
let i = 0;
while (i < lines.length) {
  while (i < lines.length && parseCsvLine(lines[i]).every((c) => !c)) i++;
  if (i >= lines.length) break;

  const first = parseCsvLine(lines[i]);
  const section = first[0];
  const rows = [];
  while (i < lines.length) {
    const cells = parseCsvLine(lines[i]);
    if (cells.every((c) => !c)) {
      i++;
      break;
    }
    if (cells[0] !== section) break;
    rows.push(cells);
    i++;
  }
  if (rows.length) chunks.push({ section, rows });
}

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const margin = 14;
let y = 18;

doc.setFont('helvetica', 'bold');
doc.setFontSize(16);
doc.text('Minecore specification', margin, y);
y += 8;
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(80, 80, 80);
doc.text('Kasparex codebase — derived from game config and hooks', margin, y);
y += 6;
doc.setTextColor(0, 0, 0);

for (const { section, rows } of chunks) {
  if (section === 'META') {
    for (const row of rows) {
      const parts = trimTrailingEmpty(row.slice(1)).filter(Boolean);
      const line = parts.join(' — ');
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(8);
      doc.text(line, margin, y);
      y += 4;
    }
    y += 4;
    continue;
  }

  const title = section.replace(/_/g, ' ');
  if (y > 265) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, margin, y);
  y += 2;
  doc.setFont('helvetica', 'normal');

  const head = trimTrailingEmpty(rows[0].slice(1)).map((c) => c || ' ');
  const body = rows.slice(1).map((r) => trimTrailingEmpty(r.slice(1)).map((c) => c || ''));

  autoTable(doc, {
    startY: y + 4,
    head: [head],
    body,
    styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', cellWidth: 'wrap' },
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: margin, right: margin },
    tableWidth: 'auto',
  });

  y = doc.lastAutoTable.finalY + 10;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
doc.save(outPath);
console.log('Wrote', outPath);
