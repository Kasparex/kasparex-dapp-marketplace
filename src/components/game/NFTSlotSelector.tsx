import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useDiamondMining } from '@/hooks/useDiamondMining';

interface NFTSlotSelectorProps {
  slotIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function NFTSlotSelector({ slotIndex, isOpen, onClose }: NFTSlotSelectorProps) {
  const { nfts, isLoading } = useNFTStatus();
  const { slots, deployNFT } = useDiamondMining();
  
  const slot = slots[slotIndex];
  if (!slot || !isOpen) return null;

  // Filter NFTs based on slot requirements
  const filteredNFTs = nfts.filter(nft => {
      if (slot.type === 'worker') return nft.collection === 'KREXPRIME';
      if (slot.type === 'operator') return nft.collection === 'PIXELKREX';
      return true; // Booster could be anything
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight">Deploying {slot.type}</h2>
                <p className="text-zinc-500 text-sm">Select an NFT from your wallet to activate the core.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Scanning Blockchain...</p>
                </div>
            ) : filteredNFTs.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-zinc-800/50 flex items-center justify-center text-2xl opacity-50">🛰️</div>
                    <div>
                        <p className="font-bold text-zinc-400">No Compatible NFTs Found</p>
                        <p className="text-zinc-600 text-sm mt-1">You need {slot.collection || 'specified'} NFTs to fill this slot.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredNFTs.map((nft) => (
                        <div 
                            key={`${nft.collection}-${nft.tokenId}`}
                            onClick={() => {
                                deployNFT(slotIndex, nft.tokenId, nft.collection);
                                onClose();
                            }}
                            className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/50 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                        >
                            <div className="aspect-square rounded-xl bg-zinc-700/50 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                                🤖
                            </div>
                            <h4 className="font-bold text-sm truncate">{nft.collectionConfig.name}</h4>
                            <p className="text-emerald-500 font-bold text-xs">#{nft.tokenId}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="p-6 bg-zinc-800/20 border-t border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">Deployment requires a minor KAS transaction (0.01 KAS)</p>
        </div>
      </div>
    </div>
  );
}
