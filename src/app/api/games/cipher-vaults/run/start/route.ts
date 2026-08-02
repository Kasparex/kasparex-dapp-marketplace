import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  isCipherVaultTierId,
  type CipherAddonId,
  type CipherVaultTierId,
} from '@/lib/game/cipher-vaults-config';
import { makeCipherRunSpec } from '@/lib/game/cipher-grid';
import { getCipherPlayerState, replaceCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';
import type { CipherPaymentType, CipherVaultsState } from '@/lib/game/cipher-vaults-types';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

const ADDON_IDS = new Set(['extra_moves', 'chrono_buffer', 'fragment_amp', 'second_seal']);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      address?: string;
      tierId?: string;
      paidBy?: CipherPaymentType;
      entryTxHash?: string;
      addonIds?: string[];
      moveLimit?: number;
      solveExpiresAt?: number;
      covenantExpiresAt?: number;
      fragmentMult?: number;
      retriesLeft?: number;
      clientState?: Partial<CipherVaultsState>;
    };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    const tierIdRaw = body.tierId?.trim() ?? '';
    if (!isCipherVaultTierId(tierIdRaw)) {
      return NextResponse.json({ error: 'Missing or invalid tierId' }, { status: 400 });
    }
    const tierId: CipherVaultTierId = tierIdRaw;
    const paidBy: CipherPaymentType =
      body.paidBy === 'VAULT_PASS' ? 'VAULT_PASS' : body.paidBy === 'KREX' ? 'KREX' : 'KAS';
    const entryTxHash = typeof body.entryTxHash === 'string' ? body.entryTxHash.trim() : undefined;
    const addonIds = (Array.isArray(body.addonIds) ? body.addonIds : []).filter(
      (id): id is CipherAddonId => typeof id === 'string' && ADDON_IDS.has(id),
    );
    const moveLimit = Math.max(8, Math.min(40, Math.floor(Number(body.moveLimit) || 20)));
    const now = Date.now();
    const solveExpiresAt = Math.max(now + 60_000, Math.floor(Number(body.solveExpiresAt) || now + 600_000));
    const covenantExpiresAt = Math.max(
      solveExpiresAt,
      Math.floor(Number(body.covenantExpiresAt) || now + 4 * 60 * 60 * 1000),
    );
    const fragmentMult = Math.max(1, Math.min(3, Number(body.fragmentMult) || 1));
    const retriesLeft = Math.max(0, Math.min(2, Math.floor(Number(body.retriesLeft) || 0)));
    const runId = randomUUID();
    const seed = randomUUID().replace(/-/g, '');

    const state = getCipherPlayerState(address);
    if (state.activeRun && (state.activeRun.solveExpiresAt ?? 0) > now) {
      return NextResponse.json(
        { error: 'Active run already in progress. Cancel it before starting a new one.' },
        { status: 409 },
      );
    }

    const client = body.clientState && typeof body.clientState === 'object' ? body.clientState : {};
    const next: CipherVaultsState = {
      ...state,
      version: (state.version ?? 1) + 1,
      cipherFragments: Math.max(0, Math.floor(client.cipherFragments ?? state.cipherFragments ?? 0)),
      fragmentsEarnedLifetime: Math.max(
        0,
        Math.floor(client.fragmentsEarnedLifetime ?? state.fragmentsEarnedLifetime ?? 0),
      ),
      inventory: {
        rune_hint: Math.max(0, Math.floor(client.inventory?.rune_hint ?? state.inventory?.rune_hint ?? 0)),
        vault_pass: Math.max(
          0,
          Math.floor(
            paidBy === 'VAULT_PASS'
              ? Math.max(0, (client.inventory?.vault_pass ?? state.inventory?.vault_pass ?? 1) - 1)
              : (client.inventory?.vault_pass ?? state.inventory?.vault_pass ?? 0),
          ),
        ),
      },
      booster: client.booster ?? state.booster ?? null,
      wardenSlots: Array.isArray(client.wardenSlots) ? client.wardenSlots : state.wardenSlots,
      ledger: Array.isArray(client.ledger) ? client.ledger : state.ledger,
      ownedAddons: addonIds,
      covenantExpiresAt,
      activeRun: {
        runId,
        tierId,
        seed,
        startedAt: now,
        solveExpiresAt,
        covenantExpiresAt,
        paidBy,
        entryTxHash: paidBy === 'VAULT_PASS' ? undefined : entryTxHash,
        addonIds,
        moveLimit,
        fragmentMult,
        retriesLeft,
      },
    };
    const saved = replaceCipherPlayerState(address, next);
    const spec = makeCipherRunSpec(seed, tierId);
    return NextResponse.json({
      ok: true,
      state: saved,
      run: saved.activeRun,
      puzzle: {
        size: spec.size,
        initial: spec.initial,
        target: spec.target,
        moveLimit,
      },
    });
  } catch (e) {
    console.error('[cipher-vaults/run/start]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
