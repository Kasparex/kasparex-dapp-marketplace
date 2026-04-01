export type SeasonId = `${number}-${string}`; // e.g. "2026-03"

export type SeasonWindow = {
  id: SeasonId;
  startUtcMs: number;
  endUtcMs: number;
  finalizeAfterMs: number;
  finalizeAtUtcMs: number;
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function seasonIdFromDateUtc(d: Date): SeasonId {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${pad2(m)}` as SeasonId;
}

export function seasonWindowFromSeasonId(
  id: SeasonId,
  options?: { finalizeAfterMs?: number }
): SeasonWindow {
  const [yStr, mStr] = id.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const finalizeAfterMs = options?.finalizeAfterMs ?? 60 * 60 * 1000; // 60 min grace by default

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error(`Invalid season id: ${id}`);
  }

  const startUtcMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const endUtcMs = Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1, 0, 0, 0, 0);
  const finalizeAtUtcMs = endUtcMs + finalizeAfterMs;
  return { id, startUtcMs, endUtcMs, finalizeAfterMs, finalizeAtUtcMs };
}

export function currentSeasonWindowUtc(nowUtcMs: number = Date.now(), options?: { finalizeAfterMs?: number }): SeasonWindow {
  const id = seasonIdFromDateUtc(new Date(nowUtcMs));
  return seasonWindowFromSeasonId(id, options);
}

export function isWithinSeason(txTimeUtcMs: number, season: SeasonWindow): boolean {
  return txTimeUtcMs >= season.startUtcMs && txTimeUtcMs < season.endUtcMs;
}

export function previousSeasonId(id: SeasonId): SeasonId {
  const [yStr, mStr] = id.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error(`Invalid season id: ${id}`);
  }
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  return `${prevYear}-${pad2(prevMonth)}` as SeasonId;
}

