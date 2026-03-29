import type { ChroniclesLbEntityType } from './constants';

export type ChroniclesLbEvent =
  | {
      kind: 'slot:activate';
      entityType: ChroniclesLbEntityType;
      entityId: string;
      slotIndex: 2 | 3;
      payerKaspa: string;
    }
  | {
      kind: 'slot:set';
      entityType: ChroniclesLbEntityType;
      entityId: string;
      slotIndex: 1 | 2 | 3;
      nftRef: string;
      payerKaspa: string;
    }
  | {
      kind: 'slot:clear';
      entityType: ChroniclesLbEntityType;
      entityId: string;
      slotIndex: 1 | 2 | 3;
      payerKaspa: string;
    }
  | {
      kind: 'read';
      entityType: ChroniclesLbEntityType;
      entityId: string;
      payerKaspa: string;
    };

