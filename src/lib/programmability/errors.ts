/** Thrown when L1 covenant txs are requested but wallet or artifacts are not ready. */
export class CovenantNotReadyError extends Error {
  readonly code = 'COVENANT_NOT_READY';

  constructor(message: string) {
    super(message);
    this.name = 'CovenantNotReadyError';
  }
}
