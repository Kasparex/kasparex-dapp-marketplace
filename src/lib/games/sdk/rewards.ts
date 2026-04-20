export async function recordL1Reward(params: {
  userAddress: string;
  dappId: string;
  actionType: string;
  actionValue: number;
  txHash: string;
  network?: 'L1';
}): Promise<{ ok: boolean }> {
  const res = await fetch('/api/rewards/l1/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      userAddress: params.userAddress,
      dappId: params.dappId,
      actionType: params.actionType,
      actionValue: params.actionValue,
      txHash: params.txHash,
      network: params.network ?? 'L1',
    }),
  });
  return { ok: res.ok };
}

