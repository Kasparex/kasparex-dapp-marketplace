import type { DAppBlock, DAppBlockPlacement } from './types';

const blocks = new Map<string, DAppBlock>();

export function registerDAppBlock(block: DAppBlock): void {
  blocks.set(block.id, block);
}

export function getDAppBlocks(placement?: DAppBlockPlacement): DAppBlock[] {
  const list = Array.from(blocks.values());
  const filtered = placement ? list.filter((b) => b.placement === placement) : list;
  return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getDAppBlock(id: string): DAppBlock | undefined {
  return blocks.get(id);
}
