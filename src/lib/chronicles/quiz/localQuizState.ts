import type { ChronicleQuizEntry, ChronicleQuizWalletState } from './types';
import { CHRONICLE_QUIZ_STORAGE_KEY } from './constants';

type Store = Record<string, Record<string, ChronicleQuizWalletState>>;

function readStore(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CHRONICLE_QUIZ_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  localStorage.setItem(CHRONICLE_QUIZ_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent('chronicles-quiz-updated'));
}

function normalizeWallet(address: string): string {
  const t = address.trim();
  return (t.startsWith('kaspa:') ? t : `kaspa:${t}`).toLowerCase();
}

export function getQuizWalletState(address: string | null | undefined, slug: string): ChronicleQuizWalletState {
  if (!address) return { completedSlugs: [] };
  const wallet = normalizeWallet(address);
  return readStore()[wallet]?.[slug] ?? { completedSlugs: [] };
}

export function isChapterQuizCompleted(address: string | null | undefined, slug: string): boolean {
  return getQuizWalletState(address, slug).completedSlugs.includes(slug);
}

export function hasActiveQuizEntry(address: string | null | undefined, slug: string): boolean {
  const state = getQuizWalletState(address, slug);
  return Boolean(state.activeEntry && !state.activeEntry.used);
}

export function recordQuizEntryPaid(address: string, slug: string, txHash: string) {
  const wallet = normalizeWallet(address);
  const store = readStore();
  const row = store[wallet]?.[slug] ?? { completedSlugs: [] };
  row.activeEntry = { txHash, used: false, paidAt: new Date().toISOString() };
  store[wallet] = { ...store[wallet], [slug]: row };
  writeStore(store);
}

export function markQuizEntryUsed(address: string, slug: string) {
  const wallet = normalizeWallet(address);
  const store = readStore();
  const row = store[wallet]?.[slug];
  if (!row?.activeEntry) return;
  row.activeEntry = { ...row.activeEntry, used: true };
  store[wallet] = { ...store[wallet], [slug]: row };
  writeStore(store);
}

export function markChapterQuizCompleted(address: string, slug: string) {
  const wallet = normalizeWallet(address);
  const store = readStore();
  const row = store[wallet]?.[slug] ?? { completedSlugs: [] };
  if (!row.completedSlugs.includes(slug)) {
    row.completedSlugs = [...row.completedSlugs, slug];
  }
  store[wallet] = { ...store[wallet], [slug]: row };
  writeStore(store);
}

export function getActiveQuizEntry(address: string | null | undefined, slug: string): ChronicleQuizEntry | null {
  const entry = getQuizWalletState(address, slug).activeEntry;
  return entry && !entry.used ? entry : null;
}
