#!/usr/bin/env node
/**
 * Upsert MigrateTicket rows into data/krex-wrap/attestations-tn10.json via GitHub Contents API.
 * Used by GHA after ticket issue when Hub cannot persist.
 *
 * Keeps all unclaimed / ticket-pending rows. Prunes claimed rows to the latest 10.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const MAX_CLAIMED = 10;
const tipPath = join('tools/tn10-migrate/tkrex-migrate-deploy/TICKET_ISSUE_RESULT.json');
const statePath = join('tools/tn10-migrate/tkrex-deploy/migrate-attestor-state.json');
const attestPath = 'data/krex-wrap/attestations-tn10.json';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY || 'Kasparex/kasparex-dapp-marketplace';

if (!token) {
  console.log('No GH_TOKEN; skip sync');
  process.exit(0);
}

const tickets = [];
if (existsSync(tipPath)) {
  try {
    const ticket = JSON.parse(readFileSync(tipPath, 'utf8'));
    if (ticket.ticketId && ticket.burnTxId) tickets.push(ticket);
  } catch {
    /* ignore */
  }
}
if (existsSync(statePath)) {
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    for (const [burnTxId, entry] of Object.entries(state.nullifiers || {})) {
      if (!entry?.ticketId || !/^[a-f0-9]{64}:\d+$/i.test(entry.ticketId)) continue;
      if (tickets.some((t) => String(t.burnTxId).toLowerCase() === burnTxId.toLowerCase())) continue;
      tickets.push({
        burnTxId,
        ticketId: entry.ticketId,
        ticketTxId: entry.ticketTxId || String(entry.ticketId).split(':')[0],
        ticketIndex: entry.ticketIndex ?? 0,
        amountRaw: entry.amountRaw,
        from: entry.from,
      });
    }
  } catch {
    /* ignore */
  }
}
if (tickets.length === 0) {
  console.log('No ticket results; skip sync');
  process.exit(0);
}

function isClaimed(row) {
  return row?.status === 'claimed' || Boolean(row?.mintTxHash);
}

function pruneStore(store) {
  if (!Array.isArray(store.attestations)) store.attestations = [];
  const open = [];
  const claimed = [];
  for (const row of store.attestations) {
    if (isClaimed(row)) claimed.push(row);
    else open.push(row);
  }
  claimed.sort((a, b) => String(b.attestedAt || '').localeCompare(String(a.attestedAt || '')));
  store.attestations = [...open, ...claimed.slice(0, MAX_CLAIMED)].sort((a, b) =>
    String(b.attestedAt || '').localeCompare(String(a.attestedAt || '')),
  );
  return store;
}

function applyTickets(store, list) {
  if (!Array.isArray(store.attestations)) store.attestations = [];
  let changed = 0;
  for (const ticket of list) {
    const burn = String(ticket.burnTxId).toLowerCase();
    let row = store.attestations.find((a) => String(a.burnTxHash || '').toLowerCase() === burn);
    if (!row) {
      row = {
        network: 'testnet-10',
        tick: 'TKREX',
        burnTxHash: burn,
        amountRaw: String(ticket.amountRaw || '0'),
        amount: Number(ticket.amountRaw || 0) / 1e8,
        from: ticket.from || '',
        status: 'attested',
        attestedAt: new Date().toISOString(),
        migrateVersion: 3,
      };
      store.attestations.unshift(row);
      changed += 1;
    }
    if (row.ticketId === ticket.ticketId) continue;
    row.ticketId = ticket.ticketId;
    row.ticketTxId = ticket.ticketTxId || String(ticket.ticketId).split(':')[0];
    row.ticketIndex = Number(ticket.ticketIndex ?? 0);
    row.status = 'attested';
    row.note = 'TN10 v3: MigrateTicket issued; user Claims in Hub';
    row.migrateVersion = 3;
    if (ticket.amountRaw) {
      row.amountRaw = String(ticket.amountRaw);
      row.amount = Number(ticket.amountRaw) / 1e8;
    }
    if (ticket.from) row.from = ticket.from;
    changed += 1;
  }
  pruneStore(store);
  return changed;
}

async function loadRemote() {
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${attestPath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 404) {
    return {
      store: { network: 'testnet-10', updatedAt: new Date().toISOString(), attestations: [] },
      sha: undefined,
    };
  }
  if (!res.ok) throw new Error(`GET attestations ${res.status}`);
  const data = await res.json();
  const decoded = Buffer.from(data.content || '', data.encoding || 'base64').toString('utf8');
  return { store: JSON.parse(decoded), sha: data.sha };
}

async function putRemote(store, sha) {
  const body = `${JSON.stringify(store, null, 2)}\n`;
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${attestPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `chore(bridge): upsert TN10 migrate attestation (${store.updatedAt}) [skip vercel]`,
      content: Buffer.from(body, 'utf8').toString('base64'),
      sha,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT attestations ${res.status}: ${text.slice(0, 300)}`);
  }
}

let remote = await loadRemote();
let changed = applyTickets(remote.store, tickets);
if (!changed) {
  console.log('Attestations already have tickets; skip');
  process.exit(0);
}
remote.store.updatedAt = new Date().toISOString();
writeFileSync(attestPath, JSON.stringify(remote.store, null, 2) + '\n');
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    await putRemote(remote.store, remote.sha);
    console.log(
      'Pushed attestation tickets via Contents API',
      tickets.map((t) => t.ticketId).join(', '),
    );
    process.exit(0);
  } catch (err) {
    console.warn('PUT attempt failed', err instanceof Error ? err.message : err);
    remote = await loadRemote();
    applyTickets(remote.store, tickets);
    remote.store.updatedAt = new Date().toISOString();
  }
}
throw new Error('Failed to sync attestations after retries');
