'use client';

import { useState, useEffect } from 'react';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { useChainId } from 'wagmi';

interface Node {
  id: string;
  level: number;
  status: 'inactive' | 'active';
  x: string;
  y: string;
  isGenesis?: boolean;
}

interface RevenueTreeFlowStoryProps {
  currentStep: number;
}

export function RevenueTreeFlowStory({ currentStep }: RevenueTreeFlowStoryProps) {
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);
  const [isGenesisModalOpen, setIsGenesisModalOpen] = useState(false);

  // Define a dense tree structure
  const nodes: Node[] = [
    { id: 'alice', level: 0, status: currentStep >= 1 ? 'active' : 'inactive', x: '50%', y: '10%' },
    
    // Level 1
    { id: 'b1', level: 1, status: currentStep >= 2 ? 'active' : 'inactive', x: '35%', y: '25%' },
    { id: 'b2', level: 1, status: currentStep >= 2 ? 'active' : 'inactive', x: '50%', y: '25%' },
    { id: 'b3', level: 1, status: currentStep >= 2 ? 'active' : 'inactive', x: '65%', y: '25%' },
    
    // Level 2
    { id: 'c1', level: 2, status: currentStep >= 4 ? 'active' : 'inactive', x: '25%', y: '40%' },
    { id: 'c2', level: 2, status: currentStep >= 4 ? 'active' : 'inactive', x: '35%', y: '40%' },
    { id: 'c3', level: 2, status: currentStep >= 4 ? 'active' : 'inactive', x: '45%', y: '40%' },
    { id: 'c4', level: 2, status: currentStep >= 4 ? 'active' : 'inactive', x: '55%', y: '40%' },
    { id: 'c5', level: 2, status: currentStep >= 4 ? 'active' : 'inactive', x: '65%', y: '40%' },
    { id: 'c6', level: 2, status: currentStep >= 4 ? 'active' : 'inactive', x: '75%', y: '40%' },
    
    // Level 3 (Denser)
    { id: 'd1', level: 3, status: currentStep >= 5 ? 'active' : 'inactive', x: '20%', y: '55%' },
    { id: 'd2', level: 3, status: currentStep >= 5 ? 'active' : 'inactive', x: '35%', y: '55%' },
    { id: 'd3', level: 3, status: currentStep >= 5 ? 'active' : 'inactive', x: '50%', y: '55%' },
    { id: 'd4', level: 3, status: currentStep >= 5 ? 'active' : 'inactive', x: '65%', y: '55%' },
    { id: 'd5', level: 3, status: currentStep >= 5 ? 'active' : 'inactive', x: '80%', y: '55%' },
    
    // Level 4
    { id: 'e1', level: 4, status: currentStep >= 5 ? 'active' : 'inactive', x: '25%', y: '70%' },
    { id: 'e2', level: 4, status: currentStep >= 5 ? 'active' : 'inactive', x: '40%', y: '70%' },
    { id: 'e3', level: 4, status: currentStep >= 5 ? 'active' : 'inactive', x: '55%', y: '70%' },
    { id: 'e4', level: 4, status: currentStep >= 5 ? 'active' : 'inactive', x: '70%', y: '70%' },
    
    // Level 5
    { id: 'f1', level: 5, status: currentStep >= 5 ? 'active' : 'inactive', x: '30%', y: '85%' },
    { id: 'f2', level: 5, status: currentStep >= 5 ? 'active' : 'inactive', x: '50%', y: '85%' },
    { id: 'f3', level: 5, status: currentStep >= 5 ? 'active' : 'inactive', x: '70%', y: '85%' },
    
    { id: 'genesis', level: -1, status: 'active', x: '90%', y: '10%', isGenesis: true },
  ];

  const [pulses, setPulses] = useState<{ id: number; from: string; to: string; amount: string }[]>([]);
  const [pulseId, setPulseId] = useState(0);

  const triggerPulse = (from: string, to: string, amount: string) => {
    const id = Date.now() + Math.random();
    setPulses(prev => [...prev, { id, from, to, amount }]);
    setTimeout(() => {
      setPulses(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  useEffect(() => {
    if (currentStep === 4) {
      triggerPulse('b1', 'alice', `2% ${symbol}`);
    } else if (currentStep === 5) {
      triggerPulse('c1', 'b1', `2% ${symbol}`);
      setTimeout(() => triggerPulse('b1', 'alice', `5% ${symbol}`), 400);
    } else if (currentStep === 6) {
        // Propagation from deeply nested f2
        const delay = 300;
        triggerPulse('f2', 'e2', `2%`);
        setTimeout(() => triggerPulse('e2', 'd3', `5%`), delay);
        setTimeout(() => triggerPulse('d3', 'c4', `10%`), delay * 2);
        setTimeout(() => triggerPulse('c4', 'b2', `20%`), delay * 3);
        setTimeout(() => triggerPulse('b2', 'alice', `45%`), delay * 4);
    }
  }, [currentStep]);

  return (
    <div className="relative w-full h-[550px] bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-inner font-sans">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" 
           style={{ backgroundImage: 'radial-gradient(#02abb8 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Header */}
      <div className="absolute top-6 left-8 z-10">
          <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Live Flow Simulation</h4>
          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-tight opacity-70">Interactive Network Topology</p>
      </div>

      {/* Level Labels on the Left */}
      <div className="absolute inset-y-0 left-6 flex flex-col justify-between py-[12%] py-10 pointer-events-none opacity-40">
          {[0, 1, 2, 3, 4, 5].map(lv => (
              <div key={lv} className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-zinc-400 uppercase w-6">L{lv}</span>
                  <div className="h-[1px] w-4 bg-zinc-300 dark:bg-zinc-800" />
              </div>
          ))}
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Dashboard Connections */}
          {/* Alice to Level 1 */}
          <line x1="50%" y1="10%" x2="35%" y2="25%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 2 ? 'stroke-[#02abb8]/30' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50%" y1="10%" x2="50%" y2="25%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 2 ? 'stroke-[#02abb8]/30' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50%" y1="10%" x2="65%" y2="25%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 2 ? 'stroke-[#02abb8]/30' : ''}`} strokeWidth="1" strokeDasharray="3 3" />

          {/* Vertical connections for deeper levels */}
          <line x1="35%" y1="25%" x2="25%" y2="40%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 4 ? 'stroke-[#02abb8]/20' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="35%" y1="25%" x2="35%" y2="40%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 4 ? 'stroke-[#02abb8]/20' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50%" y1="25%" x2="45%" y2="40%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 4 ? 'stroke-[#02abb8]/20' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50%" y1="25%" x2="55%" y2="40%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 4 ? 'stroke-[#02abb8]/20' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          
          <line x1="25%" y1="40%" x2="20%" y2="55%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 5 ? 'stroke-[#02abb8]/15' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="45%" y1="40%" x2="50%" y2="55%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 5 ? 'stroke-[#02abb8]/15' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50%" y1="55%" x2="50%" y2="70%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 5 ? 'stroke-[#02abb8]/10' : ''}`} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50%" y1="70%" x2="50%" y2="85%" className={`stroke-zinc-200 dark:stroke-zinc-800 duration-1000 transition-colors ${currentStep >= 5 ? 'stroke-[#02abb8]/5' : ''}`} strokeWidth="1" strokeDasharray="3 3" />

          {/* Genesis Redirect */}
          {currentStep < 1 && (
               <line x1="50%" y1="10%" x2="90%" y2="10%" className="stroke-red-500/10" strokeWidth="1" strokeDasharray="2 2" />
          )}

          {/* Pulses */}
          {pulses.map(pulse => {
              const fromN = nodes.find(n => n.id === pulse.from);
              const toN = nodes.find(n => n.id === pulse.to);
              if (!fromN || !toN) return null;
              return (
                  <g key={pulse.id}>
                    <circle r="4" fill="#02abb8" className="animate-pulse">
                        <animate attributeName="cx" from={fromN.x} to={toN.x} dur="0.8s" repeatCount="1" fill="freeze" />
                        <animate attributeName="cy" from={fromN.y} to={toN.y} dur="0.8s" repeatCount="1" fill="freeze" />
                    </circle>
                    <text fontSize="10" fontWeight="900" fill="#02abb8" textAnchor="middle" className="filter drop-shadow-sm font-black">
                        <animate attributeName="x" from={fromN.x} to={toN.x} dur="0.8s" repeatCount="1" fill="freeze" />
                        <animate attributeName="y" from={fromN.y} to={toN.y} dur="0.8s" repeatCount="1" fill="freeze" />
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
          const isGenesis = node.isGenesis;
          
          if (isGenesis) {
              return (
                  <button 
                    key={node.id}
                    onClick={() => setIsGenesisModalOpen(true)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 hover:scale-110"
                    style={{ left: node.x, top: node.y }}
                  >
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm shadow-lg group-hover:border-[#02abb8]/50">
                          🏛️
                      </div>
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase text-zinc-400 tracking-widest whitespace-nowrap">Genesis</span>
                  </button>
              );
          }

          return (
              <div 
                key={node.id}
                className="absolute transition-all duration-1000 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ left: node.x, top: node.y }}
              >
                  <div className={`transition-all duration-1000 rounded-full ${
                      node.id === 'alice' 
                        ? 'w-4 h-4 shadow-[0_0_15px_rgba(2,171,184,0.3)]' 
                        : 'w-2 h-2'
                  } ${
                      isActive 
                        ? 'bg-[#02abb8] shadow-[0_0_8px_rgba(2,171,184,0.5)]' 
                        : 'bg-zinc-200 dark:bg-zinc-800'
                  }`} />
                  {node.id === 'alice' && (
                      <span className="absolute -bottom-5 text-[8px] font-black uppercase text-[#02abb8] tracking-widest">Alice</span>
                  )}
              </div>
          );
      })}

      {/* Genesis Modal Overlay */}
      {isGenesisModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
                  <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                      <div>
                          <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Genesis Platform</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">Revenue Safeguard</p>
                      </div>
                      <button onClick={() => setIsGenesisModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors">✕</button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                          The Genesis Platform acts as a temporary destination for revenue when a node in the tree is inactive or missing. This ensures volume is always recorded and ready to be claimed once branches activate.
                      </p>
                      <div className="space-y-2">
                          <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Global Genesis Nodes</h4>
                          <div className="space-y-1">
                              {[
                                  { level: 'Main', addr: '0xAb03...E6D3' },
                                  { level: 'L2', addr: '0xC0CD...B201' },
                                  { level: 'L3', addr: '0x33cE...3bf85' },
                                  { level: 'L4', addr: '0xa6E0...B0e0' },
                                  { level: 'L5', addr: '0xcde1...f7da' }
                              ].map(gen => (
                                  <div key={gen.level} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                      <span className="text-[9px] font-black text-zinc-800 dark:text-zinc-200">{gen.level}</span>
                                      <span className="text-[9px] font-mono text-zinc-400">{gen.addr}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-900 flex justify-center">
                      <button 
                        onClick={() => setIsGenesisModalOpen(false)}
                        className="text-[10px] font-black uppercase text-[#02abb8] tracking-widest"
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
