export type KpxNet = 'mainnet' | 'testnet';

export type KpxType = 'pf' | 'cm' | 'lnk' | 'ver';

export type KpxOpPf = 'set' | 'clear';
export type KpxOpCm = 'create' | 'edit';
export type KpxOpLnk = 'set' | 'clear';
export type KpxOpVer = 'set' | 'clear';

export type KpxOp = KpxOpPf | KpxOpCm | KpxOpLnk | KpxOpVer;

export interface KpxEnvelopeBase {
  p: 'kpx';
  t: KpxType | (string & {});
  v: 1;
  net: KpxNet | (string & {});
  op: string;
  addr: string;
  seq: number;
  data?: unknown;
}

export interface KpxPfDataV1 {
  display?: string;
  bio?: string;
  tags?: string[];
}

export interface KpxPfRecordV1 extends KpxEnvelopeBase {
  t: 'pf';
  op: KpxOpPf;
  data?: KpxPfDataV1;
}

export type KpxResourceTypeCodeV1 = 'vb' | 'ck' | 'st' | 'dp' | 'mg' | 'ad' | 'gm';

export interface KpxCmDataV1 {
  rt: KpxResourceTypeCodeV1;
  rid: string;
  ch: string; // 64-char lowercase hex
  sv: number;
}

export interface KpxCmRecordV1 extends KpxEnvelopeBase {
  t: 'cm';
  op: KpxOpCm;
  data: KpxCmDataV1;
}

export interface KpxLnkDataV1 {
  evm: string; // 0x...
}

export interface KpxLnkRecordV1 extends KpxEnvelopeBase {
  t: 'lnk';
  op: KpxOpLnk;
  data?: KpxLnkDataV1;
}

export interface KpxVerRecordV1 extends KpxEnvelopeBase {
  t: 'ver';
  op: KpxOpVer;
  data?: undefined;
}

export type KpxRecordV1 = KpxPfRecordV1 | KpxCmRecordV1 | KpxLnkRecordV1 | KpxVerRecordV1;

export interface KpxParsedRecord {
  record: KpxRecordV1;
  raw: unknown;
  rawJson: string;
  byteLength: number;
}

