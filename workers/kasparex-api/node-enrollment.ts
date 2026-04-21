/**
 * Wallet binding: challenge → verify signature → enrollment token → enroll creates node + HMAC secret.
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import { randomHex, signJwtHs256, verifyJwtHs256 } from './node-crypto';
import { verifySignature } from '@kluster/kaspa-signature';
import { KaspaAddress } from '@kluster/kaspa-address';

function enrollmentSecret(env: Env): string | null {
  return env.NODE_ENROLLMENT_SECRET?.trim() || null;
}

function normalizeWallet(addr: string): string {
  const a = addr.trim();
  if (!a) return '';
  return a.toLowerCase().startsWith('kaspa:') ? a : `kaspa:${a}`;
}

export async function handleNodeChallenge(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  const secret = enrollmentSecret(env);
  if (!secret) {
    return new Response(JSON.stringify({ error: 'NODE_ENROLLMENT_SECRET not configured' }), {
      status: 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  const nonce = randomHex(16);
  const exp = Math.floor(Date.now() / 1000) + 15 * 60;
  const message = `Kasparex Krex Node wallet binding\nNonce: ${nonce}\nExpires (unix): ${exp}\nSign this message to prove wallet ownership.`;
  const challengeToken = await signJwtHs256(secret, {
    typ: 'krex-challenge',
    nonce,
    exp,
    message,
  });
  return new Response(JSON.stringify({ message, challengeToken }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

type VerifyBody = {
  challengeToken?: string;
  address?: string;
  signature?: string;
};

export async function handleNodeVerifyWallet(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  const secret = enrollmentSecret(env);
  if (!secret) {
    return new Response(JSON.stringify({ error: 'NODE_ENROLLMENT_SECRET not configured' }), {
      status: 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = (await request.json()) as VerifyBody;
    const challengeToken = body.challengeToken?.trim();
    const address = normalizeWallet(body.address ?? '');
    const signature = body.signature?.trim();
    if (!challengeToken || !address || !signature) {
      return new Response(JSON.stringify({ error: 'Missing challengeToken, address, or signature' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const payload = await verifyJwtHs256(secret, challengeToken);
    if (!payload || payload.typ !== 'krex-challenge' || typeof payload.message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or expired challenge' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const kaspaAddress = KaspaAddress.fromString(address);
    const valid = await verifySignature(payload.message as string, signature, kaspaAddress);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const enrollExp = Math.floor(Date.now() / 1000) + 15 * 60;
    const enrollmentToken = await signJwtHs256(secret, {
      typ: 'krex-enroll',
      wallet: address,
      exp: enrollExp,
      nonce: randomHex(12),
    });
    return new Response(JSON.stringify({ ok: true, enrollmentToken, wallet: address }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('verify-wallet', e);
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

type EnrollBody = {
  enrollmentToken?: string;
  node_name?: string;
  role?: 'light' | 'mirror' | 'super';
  url?: string;
  region?: string;
  version?: string;
};

type UpdateBody = {
  enrollmentToken?: string;
  node_id?: string;
  node_name?: string;
  role?: 'light' | 'mirror' | 'super';
  url?: string;
  region?: string;
  version?: string;
};

export async function handleNodeEnroll(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  const secret = enrollmentSecret(env);
  if (!secret) {
    return new Response(JSON.stringify({ error: 'NODE_ENROLLMENT_SECRET not configured' }), {
      status: 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = (await request.json()) as EnrollBody;
    const token = body.enrollmentToken?.trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing enrollmentToken' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const pl = await verifyJwtHs256(secret, token);
    if (!pl || pl.typ !== 'krex-enroll' || typeof pl.wallet !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or expired enrollment token' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const wallet = pl.wallet as string;
    if (!body.node_name || !body.role || !body.url) {
      return new Response(JSON.stringify({ error: 'Missing node_name, role, or url' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (!['light', 'mirror', 'super'].includes(body.role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const nodeId = `krex-${randomHex(8)}`;
    const nodeSecret = randomHex(32);
    const now = Date.now();
    const pinned = JSON.stringify([]);
    const region = body.region || 'unknown';
    const version = body.version || '1.0.0';

    await env.NODES_DB.prepare(
      `INSERT INTO nodes (
        node_id, node_name, role, owner_wallet, region, version, url,
        last_ping, uptime_hours, pinned_cids, created_at, status,
        requests_served_total, requests_served_epoch, last_seq, binding_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'active', 0, 0, 0, 1)`
    )
      .bind(
        nodeId,
        body.node_name,
        body.role,
        wallet,
        region,
        version,
        body.url.trim(),
        0,
        pinned,
        now
      )
      .run();

    await env.KASPAREX_CACHE.put(`node:hmac:${nodeId}`, nodeSecret, { expirationTtl: 60 * 60 * 24 * 365 * 5 });

    return new Response(
      JSON.stringify({
        ok: true,
        node_id: nodeId,
        owner_wallet: wallet,
        requires_onchain: true,
        message: 'Complete on-chain verification to unlock your node secret.',
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('enroll', e);
    return new Response(JSON.stringify({ error: 'Enrollment failed' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleNodeUpdateDetails(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  const secret = enrollmentSecret(env);
  if (!secret) {
    return new Response(JSON.stringify({ error: 'NODE_ENROLLMENT_SECRET not configured' }), {
      status: 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = (await request.json()) as UpdateBody;
    const token = body.enrollmentToken?.trim();
    const nodeId = body.node_id?.trim();
    if (!token || !nodeId) {
      return new Response(JSON.stringify({ error: 'Missing enrollmentToken or node_id' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const pl = await verifyJwtHs256(secret, token);
    if (!pl || pl.typ !== 'krex-enroll' || typeof pl.wallet !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or expired enrollment token' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const wallet = pl.wallet as string;

    const existing = await env.NODES_DB.prepare(`SELECT owner_wallet, verified_txid FROM nodes WHERE node_id = ?`)
      .bind(nodeId)
      .first<{ owner_wallet: string; verified_txid: string | null }>();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Node not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (normalizeWallet(existing.owner_wallet) !== normalizeWallet(wallet)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (!existing.verified_txid) {
      return new Response(JSON.stringify({ error: 'Complete on-chain verification before editing node details.' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const sets: string[] = [];
    const binds: unknown[] = [];

    if (typeof body.node_name === 'string' && body.node_name.trim()) {
      sets.push('node_name = ?');
      binds.push(body.node_name.trim());
    }
    if (typeof body.role === 'string' && ['light', 'mirror', 'super'].includes(body.role)) {
      sets.push('role = ?');
      binds.push(body.role);
    }
    if (typeof body.region === 'string' && body.region.trim()) {
      sets.push('region = ?');
      binds.push(body.region.trim());
    }
    if (typeof body.url === 'string' && body.url.trim()) {
      sets.push('url = ?');
      binds.push(body.url.trim());
    }
    if (typeof body.version === 'string' && body.version.trim()) {
      sets.push('version = ?');
      binds.push(body.version.trim());
    }

    if (!sets.length) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    await env.NODES_DB.prepare(`UPDATE nodes SET ${sets.join(', ')} WHERE node_id = ?`)
      .bind(...binds, nodeId)
      .run();

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('update-details', e);
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

type RotateBody = { node_id?: string; node_secret?: string };

export async function handleNodeRotateSecret(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const body = (await request.json()) as RotateBody;
    const nodeId = body.node_id?.trim();
    const oldSecret = body.node_secret?.trim();
    if (!nodeId || !oldSecret) {
      return new Response(JSON.stringify({ error: 'Missing node_id or node_secret' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const row = await env.NODES_DB.prepare(`SELECT verified_txid FROM nodes WHERE node_id = ?`)
      .bind(nodeId)
      .first<{ verified_txid: string | null }>();
    if (!row || !row.verified_txid) {
      return new Response(JSON.stringify({ error: 'Complete on-chain verification before rotating secret.' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const cur = await env.KASPAREX_CACHE.get(`node:hmac:${nodeId}`);
    if (!cur || cur !== oldSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const nodeSecret = randomHex(32);
    await env.KASPAREX_CACHE.put(`node:hmac:${nodeId}`, nodeSecret, { expirationTtl: 60 * 60 * 24 * 365 * 5 });
    return new Response(JSON.stringify({ ok: true, node_secret: nodeSecret }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('rotate-secret', e);
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}
