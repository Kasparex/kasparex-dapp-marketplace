export type ModuleId = 'confirmed_reads' | 'nft_slots';

export type ModuleConfig = {
  id: ModuleId;
  label: string;
  /** Multiplies module points before summing into global score. */
  weight: number;
};

