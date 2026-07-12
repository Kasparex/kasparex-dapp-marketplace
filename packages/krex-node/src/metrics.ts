/** In-process request counter (reported in heartbeats as requests_served_total). */

let baseTotal = 0;
let sessionServed = 0;

export function initMetrics(initialTotal = 0): void {
  baseTotal = Math.max(0, Math.floor(Number(initialTotal) || 0));
  sessionServed = 0;
}

export function recordRequest(count = 1): void {
  sessionServed += Math.max(0, Math.floor(count));
}

export function getRequestsServedTotal(): number {
  return baseTotal + sessionServed;
}
