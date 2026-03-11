'use client';

import { useState, useEffect } from 'react';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { useChainId } from 'wagmi';
import { DEFAULT_REVENUE_WALLETS } from '@/lib/revenue-tree/utils';

interface Node {
  id: string;
  name: string;
  level: number;
  type: 'upline' | 'user' | 'downline';
  status: 'inactive' | 'active';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  address?: string;
  pct?: number;
}

interface RevenueTreeFlowStoryProps {
  currentStep: number;
}

export function RevenueTreeFlowStory({ currentStep }: RevenueTreeFlowStoryProps) {
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);
  const [isGenesisModalOpen, setIsGenesisModalOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Define the core flow participants
  const nodes: Node[] = [
    // Platform & Genesis Uplines (Above Alice)
    { id: 'platform', name: 'Platform Wallet', level: 0, type: 'upline', status: 'active', x: 80, y: 8, address: DEFAULT_REVENUE_WALLETS.PLATFORM },
    { id: 'u5', name: 'Genesis Wallet 5', level: 5, type: 'upline', status: 'active', x: 65, y: 15, address: DEFAULT_REVENUE_WALLETS.LEVEL_5, pct: 45 },
    { id: 'u4', name: 'Genesis Wallet 4', level: 4, type: 'upline', status: 'active', x: 55, y: 15, address: DEFAULT_REVENUE_WALLETS.LEVEL_4, pct: 20 },
    { id: 'u3', name: 'Genesis Wallet 3', level: 3, type: 'upline', status: 'active', x: 45, y: 15, address: DEFAULT_REVENUE_WALLETS.LEVEL_3, pct: 10 },
    { id: 'u2', name: 'Genesis Wallet 2', level: 2, type: 'upline', status: 'active', x: 35, y: 15, address: DEFAULT_REVENUE_WALLETS.LEVEL_2, pct: 5 },
    { id: 'u1', name: 'Genesis Wallet 1', level: 1, type: 'upline', status: 'active', x: 25, y: 15, address: DEFAULT_REVENUE_WALLETS.LEVEL_1, pct: 2 },

    // The Central User (Alice)
    { id: 'alice', name: 'Alice (You)', level: 0, type: 'user', status: currentStep >= 1 ? 'active' : 'inactive', x: 50, y: 35 },

    // Downlines (Below Alice)
    // Level 1 (2%)
    { id: 'bob', name: 'Bob', level: 1, type: 'downline', status: currentStep >= 2 ? 'active' : 'inactive', x: 35, y: 52, pct: 2 },
    { id: 'dave', name: 'Dave', level: 1, type: 'downline', status: currentStep >= 2 ? 'active' : 'inactive', x: 65, y: 52, pct: 2 },
    
    // Level 2 (5%)
    { id: 'charlie', name: 'Charlie', level: 2, type: 'downline', status: currentStep >= 4 ? 'active' : 'inactive', x: 25, y: 64, pct: 5 },
    { id: 'eve', name: 'Eve', level: 2, type: 'downline', status: currentStep >= 4 ? 'active' : 'inactive', x: 45, y: 64, pct: 5 },
    
    // Level 3 (10%)
    { id: 'frank', name: 'Frank', level: 3, type: 'downline', status: currentStep >= 5 ? 'active' : 'inactive', x: 40, y: 74, pct: 10 },
    
    // Level 4 (20%)
    { id: 'grace', name: 'Grace', level: 4, type: 'downline', status: currentStep >= 5 ? 'active' : 'inactive', x: 30, y: 82, pct: 20 },

    // Level 5 (45%)
    { id: 'henry', name: 'Henry', level: 5, type: 'downline', status: currentStep >= 5 ? 'active' : 'inactive', x: 35, y: 92, pct: 45 },
  ];

  const levels = [
    { label: 'Platform', y: 8 },
    { label: 'Uplines', y: 15 },
    { label: 'You', y: 35 },
    { label: 'Level 1', y: 52 },
    { label: 'Level 2', y: 64 },
    { label: 'Level 3', y: 74 },
    { label: 'Level 4', y: 82 },
    { label: 'Level 5', y: 92 },
  ];

  const [pulses, setPulses] = useState<{ id: number; from: string; to: string; amount: string; color?: string }[]>([]);
  
  const triggerPulse = (from: string, to: string, amount: string, color?: string) => {
    const id = Date.now() + Math.random();
    setPulses(prev => [...prev, { id, from, to, amount, color }]);
    setTimeout(() => setPulses(prev => prev.filter(p => p.id !== id)), 1000);
  };

  useEffect(() => {
    if (currentStep === 1) {
        // Alice activates. Visualization of tree creation above her
        triggerPulse('alice', 'u1', 'Link', '#02abb8');
        setTimeout(() => triggerPulse('u1', 'u2', '', '#02abb8'), 200);
        setTimeout(() => triggerPulse('u2', 'u3', '', '#02abb8'), 400);
        setTimeout(() => triggerPulse('u3', 'u4', '', '#02abb8'), 600);
        setTimeout(() => triggerPulse('u4', 'u5', '', '#02abb8'), 800);
    } else if (currentStep === 4) {
      // Bob pays 100 KAS. 
      // Alice (L1) gets 2%. Alice's Uplines get the rest.
      triggerPulse('bob', 'alice', `2%`, '#10b981');
      setTimeout(() => triggerPulse('alice', 'u1', `5%`, '#02abb8'), 200);
      setTimeout(() => triggerPulse('u1', 'u2', `10%`, '#10b981'), 400);
    } else if (currentStep === 5) {
      // Charlie pays. Charlie -> Bob (2%), Bob -> Alice (5% L2)
      triggerPulse('charlie', 'bob', `2%`, '#10b981');
      setTimeout(() => triggerPulse('bob', 'alice', `5%`, '#10b981'), 400);
    } else if (currentStep === 6) {
      // Henry at L5 pays. Henry -> ... -> Alice (45%).
      const delay = 200;
      triggerPulse('henry', 'charlie', `2%`, '#10b981');
      setTimeout(() => triggerPulse('charlie', 'bob', `20%`, '#10b981'), delay * 2);
      setTimeout(() => triggerPulse('bob', 'alice', `45%`, '#10b981'), delay * 4);
    }
  }, [currentStep]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  return (
    <div className="relative w-full h-[600px] bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-inner select-none">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(#02abb8 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Header */}
      <div className="absolute top-6 left-8 z-10">
          <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Live Flow Simulation</h4>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight opacity-70">Upline & Downline Interaction</p>
      </div>

      {/* Side Labels and Row Strips */}
      <div className="absolute inset-x-0 inset-y-0 pointer-events-none opacity-[0.05] dark:opacity-[0.1]">
          {levels.map(lv => (
              <div key={lv.label} className="absolute inset-x-0 h-px bg-zinc-400" style={{ top: `${lv.y}%` }} />
          ))}
      </div>
      
      <div className="absolute inset-y-0 left-6 flex flex-col pointer-events-none py-10 w-24">
          {levels.map(lv => (
              <div 
                key={lv.label} 
                className="absolute flex items-center gap-2 group" 
                style={{ top: `${lv.y}%`, transform: 'translateY(-50%)' }}
              >
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter sm:tracking-normal whitespace-nowrap bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded">
                      {lv.label}
                  </span>
              </div>
          ))}
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Connection Lines */}
          {/* Alice to Uplines (The creation of her tree) */}
          <line x1="50%" y1="35%" x2="25%" y2="15%" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="25%" y1="15%" x2="35%" y2="15%" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="35%" y1="15%" x2="45%" y2="15%" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="45%" y1="15%" x2="55%" y2="15%" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="55%" y1="15%" x2="65%" y2="15%" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="65%" y1="15%" x2="80%" y2="8%" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="4 4" />

          {/* Alice to Downlines */}
          {/* L1 */}
          <line x1="50%" y1="35%" x2="35%" y2="52%" className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-1000 ${currentStep >= 2 ? 'stroke-[#02abb8]/30' : ''}`} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="50%" y1="35%" x2="65%" y2="52%" className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-1000 ${currentStep >= 2 ? 'stroke-[#02abb8]/30' : ''}`} strokeWidth="1.5" strokeDasharray="3 3" />
          
          {/* L2 */}
          <line x1="35%" y1="52%" x2="25%" y2="64%" className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-1000 ${currentStep >= 4 ? 'stroke-[#02abb8]/20' : ''}`} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="35%" y1="52%" x2="45%" y2="64%" className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-1000 ${currentStep >= 4 ? 'stroke-[#02abb8]/20' : ''}`} strokeWidth="1.5" strokeDasharray="3 3" />
          
          {/* Deep Path to L5 */}
          <line x1="25%" y1="64%" x2="40%" y2="74%" className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-1000 ${currentStep >= 5 ? 'stroke-[#02abb8]/10' : ''}`} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="40%" y1="74%" x2="30%" y2="82%" className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-1000 ${currentStep >= 5 ? 'stroke-[#02abb8]/10' : ''}`} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="30%" y1="82%" x2="35%" y2="92%" className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-1000 ${currentStep >= 5 ? 'stroke-[#02abb8]/10' : ''}`} strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Active Pulses */}
          {pulses.map(pulse => {
              const fromN = nodes.find(n => n.id === pulse.from);
              const toN = nodes.find(n => n.id === pulse.to);
              if (!fromN || !toN) return null;
              return (
                  <g key={pulse.id}>
                    <circle r="4" fill={pulse.color || '#02abb8'} className="animate-pulse">
                        <animate attributeName="cx" from={`${fromN.x}%`} to={`${toN.x}%`} dur="0.8s" repeatCount="1" fill="freeze" />
                        <animate attributeName="cy" from={`${fromN.y}%`} to={`${toN.y}%`} dur="0.8s" repeatCount="1" fill="freeze" />
                    </circle>
                    <text fontSize="10" fontWeight="900" fill={pulse.color || '#02abb8'} textAnchor="middle" className="font-black filter drop-shadow-sm">
                        <animate attributeName="x" from={`${fromN.x}%`} to={`${toN.x}%`} dur="0.8s" repeatCount="1" fill="freeze" />
                        <animate attributeName="y" from={`${fromN.y}%`} to={`${toN.y}%`} dur="0.8s" repeatCount="1" fill="freeze" />
                        {pulse.amount}
                        <animate attributeName="opacity" values="1;1;0" dur="1s" repeatCount="1" />
                    </text>
                  </g>
              );
          })}
      </svg>

      {/* Nodes Map */}
      {nodes.map(node => {
          const isActive = node.status === 'active';
          const isUpline = node.type === 'upline';
          const isUser = node.type === 'user';
          
          return (
              <div 
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={isUpline ? () => setIsGenesisModalOpen(true) : undefined}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 ${isUpline ? 'cursor-help' : 'cursor-default'}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                  {/* Tooltip */}
                  {hoveredNode === node.id && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-20 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                          <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-wider">{node.name}</p>
                          {node.address && <p className="text-[8px] font-mono text-zinc-400 mt-0.5">{node.address.slice(0, 6)}...{node.address.slice(-4)}</p>}
                          {node.pct && <p className="text-[9px] font-bold text-[#02abb8] mt-1">{node.pct}% Share</p>}
                      </div>
                  )}

                  <div className={`transition-all duration-500 rounded-full flex items-center justify-center ${
                      isUser 
                        ? 'w-6 h-6 border-2 border-[#02abb8] bg-white dark:bg-zinc-950' 
                        : isUpline 
                            ? 'w-3 h-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900' 
                            : 'w-2 h-2'
                  } ${
                      isActive 
                        ? (isUser ? 'shadow-[0_0_15px_rgba(2,171,184,0.4)]' : 'bg-[#02abb8]') 
                        : 'bg-zinc-200 dark:bg-zinc-800 opacity-40'
                  }`}>
                      {isUser && <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#02abb8] animate-pulse' : 'bg-red-500'}`} />}
                      {isUpline && node.id === 'platform' && <div className="text-[8px]">🏛️</div>}
                  </div>
                  
                  <div className={`mt-2 text-center transition-opacity duration-300 ${hoveredNode === node.id ? 'opacity-100' : 'opacity-60'}`}>
                      <span className={`text-[8px] font-black uppercase tracking-tight sm:tracking-widest whitespace-nowrap ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                          {node.name}
                      </span>
                  </div>
              </div>
          );
      })}

      {/* Genesis Modal Overlay */}
      {isGenesisModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-6 animate-in fade-in duration-300" onClick={() => setIsGenesisModalOpen(false)}>
              <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden shadow-2xl scale-in-center" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                      <div>
                          <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Genesis Wallets</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">System Upline Structure</p>
                      </div>
                      <button onClick={() => setIsGenesisModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors">✕</button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                          These wallets represent the platform&apos;s default upline. When a user activates without a referrer, their revenue tree is linked to these addresses to ensure persistent network stability.
                      </p>
                      <div className="space-y-2">
                          <div className="space-y-1">
                              {[
                                  { name: 'Genesis Wallet 1', level: 'L1 (2%)', addr: DEFAULT_REVENUE_WALLETS.LEVEL_1 },
                                  { name: 'Genesis Wallet 2', level: 'L2 (5%)', addr: DEFAULT_REVENUE_WALLETS.LEVEL_2 },
                                  { name: 'Genesis Wallet 3', level: 'L3 (10%)', addr: DEFAULT_REVENUE_WALLETS.LEVEL_3 },
                                  { name: 'Genesis Wallet 4', level: 'L4 (20%)', addr: DEFAULT_REVENUE_WALLETS.LEVEL_4 },
                                  { name: 'Genesis Wallet 5', level: 'L5 (45%)', addr: DEFAULT_REVENUE_WALLETS.LEVEL_5 },
                                  { name: 'Platform Wallet', level: 'Platform (18%)', addr: DEFAULT_REVENUE_WALLETS.PLATFORM }
                              ].map(gen => (
                                  <div 
                                    key={gen.name} 
                                    onClick={() => copyToClipboard(gen.addr)}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-[#02abb8]/50 transition-all cursor-pointer group"
                                  >
                                      <div>
                                          <p className="text-[9px] font-black text-zinc-800 dark:text-zinc-200 uppercase">{gen.name}</p>
                                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">{gen.level}</span>
                                      </div>
                                      <div className="text-right">
                                          <span className="text-[9px] font-mono text-[#02abb8] group-hover:underline">{gen.addr.slice(0, 6)}...{gen.addr.slice(-4)}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-900 flex justify-center">
                      <button 
                        onClick={() => setIsGenesisModalOpen(false)}
                        className="text-[10px] font-black uppercase text-[#02abb8] tracking-[0.2em] animate-pulse"
                      >
                         Continue Simulation
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
