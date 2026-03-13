import { useState } from 'react';
import { useDiamondMining } from '@/hooks/useDiamondMining';
import { NFTSlotSelector } from './NFTSlotSelector';
import { getBonusForTrait } from '@/lib/game/diamond-bonuses';

export function MiningDashboard() {
  const { diamonds, slots, stats, refineDiamonds, buyBoost, slottedMetadata } = useDiamondMining();
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Left Column: Mining Area */}
      <div className="lg:col-span-8 flex flex-col space-y-8">
        {/* Diamond Counter & Refine */}
        <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -mr-32 -mt-32" />
          
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">System Status: Mining Active</span>
              <div className="flex items-baseline gap-3">
                <h2 className="text-6xl font-black tabular-nums">{Math.floor(diamonds).toLocaleString()}</h2>
                <span className="text-zinc-500 font-medium italic">DIAMONDS</span>
              </div>
              <p className="text-zinc-500 text-sm">
                Next Refinement Level: <span className="text-zinc-300 font-bold">10,000 pts</span>
              </p>
            </div>

            <button 
              onClick={refineDiamonds}
              disabled={diamonds < 100}
              className="k-cta-primary h-20 px-10 text-xl group relative active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
              REFINE NOW
              <svg className="w-6 h-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* NFT Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {slots.map((slot, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedSlotIndex(idx)}
              className="aspect-square relative flex flex-col items-center justify-center p-6 rounded-[2rem] bg-zinc-900/30 border-2 border-dashed border-zinc-800/50 hover:border-emerald-500/50 transition-all group overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {!slot.nftId ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-zinc-500 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-300 uppercase tracking-wide">{slot.type}</h3>
                    <p className="text-zinc-500 text-xs mt-1">Deploy {slot.collection || 'Any NFT'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                    {/* Simplified placeholder for NFT view */}
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 ring-4 ring-emerald-500/10 transition-all group-hover:ring-emerald-500/30">
                        <span className="text-3xl">💎</span>
                    </div>
                    <h3 className="font-bold text-white">#{slot.nftId}</h3>
                    
                    {/* Trait Bonus Display */}
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                        {slottedMetadata[slot.nftId]?.traits?.map((trait, i) => {
                            const bonus = getBonusForTrait(String(trait.value));
                            if (!bonus) return null;
                            return (
                                <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">
                                    {bonus.type} +{(bonus.value * 100).toFixed(0)}%
                                </span>
                            );
                        })}
                    </div>
                    <p className="text-emerald-500 text-[10px] font-black uppercase mt-2">ACTIVE</p>
                </div>
              )}

              {/* Holographic Border Accent */}
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/50 blur-[2px] translate-y-full group-hover:translate-y-0 transition-transform" />
            </div>
          ))}
        </div>

        {/* Lore / Production Summary */}
        <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-800/50 flex items-center justify-between text-xs tracking-wider uppercase font-black">
           <div className="flex gap-8">
               <div className="flex flex-col gap-1">
                   <span className="text-zinc-600">Flow Rate</span>
                   <span className="text-emerald-500">{stats.yieldPerSecond.toFixed(2)} D/s</span>
               </div>
               <div className="flex flex-col gap-1">
                   <span className="text-zinc-600">Efficiency</span>
                   <span className="text-zinc-300">{(stats.totalMultiplier * 100).toFixed(0)}%</span>
               </div>
           </div>
           <div className="text-zinc-500 italic">
               SECURED BY KASPA BlockDAG
           </div>
        </div>
      </div>

      {/* Right Column: Garage Shop */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        <div className="flex-1 p-6 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black italic">GARAGE SHOP</h2>
              <span className="px-3 py-1 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 border border-zinc-700">LVL 01</span>
           </div>

           <div className="space-y-4">
              {[
                { name: 'Nitrogen Overclock', price: 100, desc: '+25% Yield (1h)', icon: '⚡', type: 'yield', mult: 0.25 },
                { name: 'Crystal Resonance', price: 500, desc: '+50% Rare Drops', icon: '📡', type: 'luck', mult: 0.50 },
                { name: 'AI Auto-Refiner', price: 2500, desc: 'Auto-claim every 4h', icon: '🤖', type: 'efficiency', mult: 0.10 },
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => buyBoost(item.name, item.price, item.type as any, item.mult)}
                  className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center text-xl active:scale-95 transition-transform">{item.icon}</div>
                      <div>
                        <h4 className="font-bold text-sm tracking-tight">{item.name}</h4>
                        <p className="text-[10px] text-zinc-500">{item.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="block text-xs font-black text-emerald-500">{item.price} KAS</span>
                       <span className="text-[8px] text-zinc-600 uppercase font-black">Buy Item</span>
                    </div>
                  </div>
                </div>
              ))}
           </div>

           <div className="mt-8 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-[10px] text-center text-emerald-500/60 uppercase font-black">Garage Revenue is recycled into the rewards pool</p>
           </div>
        </div>
      </div>

      {/* NFT Selector Modal */}
      {selectedSlotIndex !== null && (
        <NFTSlotSelector 
          slotIndex={selectedSlotIndex}
          isOpen={true}
          onClose={() => setSelectedSlotIndex(null)}
        />
      )}
    </div>
  );
}
