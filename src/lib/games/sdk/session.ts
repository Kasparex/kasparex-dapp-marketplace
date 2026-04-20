export function newGameSessionId(): string {
  return crypto.randomUUID();
}

