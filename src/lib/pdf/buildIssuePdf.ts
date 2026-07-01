import { htmlToPlainText } from '@/lib/richText/html';
import type { ComposedSection } from '@/lib/magazines/composeIssue';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const LINE_H = 5.5;
const MAX_W = PAGE_W - MARGIN * 2;

function splitLines(doc: import('jspdf').jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function ensureSpace(doc: import('jspdf').jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_H - MARGIN) return y;
  doc.addPage();
  return MARGIN;
}

export async function buildIssuePdf(args: {
  magazineName: string;
  issueNumber: number;
  issueTitle: string;
  sections: ComposedSection[];
}): Promise<import('jspdf').jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  let y = MARGIN;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(args.magazineName, MARGIN, y);
  y += 10;

  doc.setFontSize(14);
  doc.text(`Issue #${args.issueNumber}`, MARGIN, y);
  y += 8;

  doc.setFontSize(16);
  const titleLines = splitLines(doc, args.issueTitle, MAX_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 7 + 6;

  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  for (const section of args.sections) {
    if (section.kind === 'text' && section.title) {
      y = ensureSpace(doc, y, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      const headerLines = splitLines(doc, section.title, MAX_W);
      doc.text(headerLines, MARGIN, y);
      y += headerLines.length * 6 + 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }

    if (section.kind === 'article') {
      y = ensureSpace(doc, y, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      const artTitleLines = splitLines(doc, section.article.title, MAX_W);
      doc.text(artTitleLines, MARGIN, y);
      y += artTitleLines.length * 6 + 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`vBlog · ${section.article.category}`, MARGIN, y);
      doc.setTextColor(0);
      y += 6;
    }

    const html = section.kind === 'article' ? section.html : section.html;
    if (html) {
      const plain = htmlToPlainText(html);
      if (plain) {
        const lines = splitLines(doc, plain, MAX_W);
        for (const line of lines) {
          y = ensureSpace(doc, y, LINE_H);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(line, MARGIN, y);
          y += LINE_H;
        }
        y += 4;
      }
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `${args.magazineName} · Issue ${args.issueNumber} · Page ${i}/${pageCount}`,
      MARGIN,
      PAGE_H - 8,
    );
    doc.setTextColor(0);
  }

  return doc;
}

export async function downloadIssuePdf(args: {
  magazineName: string;
  issueNumber: number;
  issueTitle: string;
  sections: ComposedSection[];
  filename?: string;
}): Promise<void> {
  const doc = await buildIssuePdf(args);
  const slug = args.magazineName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  doc.save(args.filename ?? `${slug}-issue-${args.issueNumber}.pdf`);
}
