export function usageMinuteBucketKey(isoMinute: string, dimension: string): string {
  // isoMinute: YYYY-MM-DDTHH:MM (UTC)
  return `usage:v1:minute:${isoMinute}:${dimension}`;
}

export function usageLockKey(name: string): string {
  return `usage:v1:lock:${name}`;
}

