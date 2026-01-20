/**
 * Mint Info Box Component
 * 
 * Information panel explaining mint process
 */

interface MintInfoBoxProps {
  mintPrice: number;
  tokensPerMint: number;
}

export function MintInfoBox({ mintPrice, tokensPerMint }: MintInfoBoxProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
        Minting Information
      </h3>
      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
        <li>• Mint price is fixed at {mintPrice} KAS per mint</li>
        <li>• You receive {tokensPerMint} tokens per mint</li>
        <li>• Tokens are minted directly to your wallet</li>
        <li>• KAS is distributed instantly to listed wallets</li>
        <li>• Network fees are paid to miners and are separate from the mint price</li>
        <li>• No refunds</li>
      </ul>
    </div>
  );
}
