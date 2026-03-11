'use client';

import { useState, useEffect } from 'react';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { useChainId } from 'wagmi';

interface Node {
  id: string;
  name: string;
  level: number;
  status: 'inactive' | 'active';
  avatar?: string;
  role?: string;
}

interface RevenueTreeFlowStoryProps {
  currentStep: number;
}

export function RevenueTreeFlowStory({ currentStep }: RevenueTreeFlowStoryProps) {
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);

  // Define nodes for a full 5-level tree with horizontal expansion
  const nodes: Node[] = [
    { id: 'alice', name: 'Alice (You)', level: 0, status: currentStep >= 1 ? 'active' : 'inactive', role: 'Root' },
    
    // Level 1
    { id: 'bob', name: 'Bob', level: 1, status: currentStep >= 2 ? 'active' : 'inactive', role: 'Direct' },
    { id: 'dave', name: 'Dave', level: 1, status: currentStep >= 2 ? 'active' : 'inactive', role: 'Direct' },
    
    // Level 2
    { id: 'charlie', name: 'Charlie', level: 2, status: currentStep >= 4 ? 'active' : 'inactive', role: 'Sub-network' },
    { id: 'eve', name: 'Eve', level: 2, status: currentStep >= 4 ? 'active' : 'inactive', role: 'Sub-network' },
    
    // Level 3
    { id: 'frank', name: 'Frank', level: 3, status: currentStep >= 5 ? 'active' : 'inactive', role: 'Deep Network' },
    
    // Level 4
    { id: 'grace', name: 'Grace', level: 4, status: currentStep >= 5 ? 'active' : 'inactive', role: 'Deep Network' },
    
    // Level 5
    { id: 'henry', name: 'Henry', level: 5, status: currentStep >= 5 ? 'active' : 'inactive', role: 'Network Edge' },
    
    { id: 'genesis', name: 'Genesis', level: -1, status: 'active', role: 'Platform' },
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
    // Phase 3: Bob pays, Alice gets 2% (L1 share)
    if (currentStep === 4) {
      triggerPulse('bob', 'alice', `2% ${symbol}`);
    } 
    // Phase 4: Charlie activates/pays. Charlie -> Bob (2%), Bob -> Alice (5% L2)
    else if (currentStep === 5) {
      triggerPulse('charlie', 'bob', `2% ${symbol}`);
      setTimeout(() => triggerPulse('bob', 'alice', `5% ${symbol}`), 400);
    }
    // Phase 5: Henry pays all the way up (L5 example)
    else if (currentStep === 6) {
        // Henry -> Grace (2%) -> Frank (5%) -> Charlie (10%) -> Bob (20%) -> Alice (45%)
        const delay = 300;
        triggerPulse('henry', 'grace', `2%`);
        setTimeout(() => triggerPulse('grace', 'frank', `5%`), delay);
        setTimeout(() => triggerPulse('frank', 'charlie', `10%`), delay * 2);
        setTimeout(() => triggerPulse('charlie', 'bob', `20%`), delay * 3);
        setTimeout(() => triggerPulse('bob', 'alice', `45%`), delay * 4);
    }
  }, [currentStep]);

  const getNodePos = (id: string) => {
      switch(id) {
          case 'alice': return { x: '50%', y: '10%' };
          case 'bob': return { x: '35%', y: '25%' };
          case 'dave': return { x: '65%', y: '25%' };
          case 'charlie': return { x: '35%', y: '40%' };
          case 'eve': return { x: '65%', y: '40%' };
          case 'frank': return { x: '35%', y: '55%' };
          case 'grace': return { x: '35%', y: '70%' };
          case 'henry': return { x: '35%', y: '85%' };
          case 'genesis': return { x: '90%', y: '10%' };
          default: return { x: '0%', y: '0%' };
      }
  };

  return (
    <div className="relative w-full h-[550px] bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-inner">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(#02abb8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Header */}
      <div className="absolute top-6 left-8 z-10">
          <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#02abb8] animate-pulse" />
              <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Multi-Level Network Simulation</h4>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Level 1 - Level 5 Vertical & Horizontal Scale</p>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
          </defs>

          {/* Vertical Connections (Alice -> Bob -> Charlie -> Frank -> Grace -> Henry) */}
          <path d="M 50% 15% L 35% 20%" className={`stroke-zinc-200 dark:stroke-zinc-800 fill-none transition-colors duration-500 ${currentStep >= 2 ? 'stroke-[#02abb8]/40' : ''}`} strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 35% 30% L 35% 35%" className={`stroke-zinc-200 dark:stroke-zinc-800 fill-none transition-colors duration-500 ${currentStep >= 4 ? 'stroke-[#02abb8]/40' : ''}`} strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 35% 45% L 35% 50%" className={`stroke-zinc-200 dark:stroke-zinc-800 fill-none transition-colors duration-500 ${currentStep >= 5 ? 'stroke-[#02abb8]/40' : ''}`} strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 35% 60% L 35% 65%" className={`stroke-zinc-200 dark:stroke-zinc-800 fill-none transition-colors duration-500 ${currentStep >= 5 ? 'stroke-[#02abb8]/40' : ''}`} strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 35% 75% L 35% 80%" className={`stroke-zinc-200 dark:stroke-zinc-800 fill-none transition-colors duration-500 ${currentStep >= 5 ? 'stroke-[#02abb8]/40' : ''}`} strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Horizontal Connection (Alice -> Dave -> Eve) */}
          <path d="M 50% 15% L 65% 20%" className={`stroke-zinc-200 dark:stroke-zinc-800 fill-none transition-colors duration-500 ${currentStep >= 2 ? 'stroke-purple-500/40' : ''}`} strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 65% 30% L 65% 35%" className={`stroke-zinc-200 dark:stroke-zinc-800 fill-none transition-colors duration-500 ${currentStep >= 4 ? 'stroke-purple-500/40' : ''}`} strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Genesis Redirect Paths */}
          {currentStep < 1 && (
               <path d="M 50% 10% L 85% 10%" className="stroke-red-500/20 fill-none" strokeWidth="1" strokeDasharray="2 2" markerEnd="url(#arrow)" />
          )}

          {/* Pulses */}
          {pulses.map(pulse => {
              const fromPos = getNodePos(pulse.from);
              const toPos = getNodePos(pulse.to);
              return (
                  <g key={pulse.id}>
                    <circle r="6" fill="#02abb8" className="animate-ping">
                        <animate attributeName="cx" from={fromPos.x} to={toPos.x} dur="0.8s" repeatCount="1" fill="freeze" />
                        <animate attributeName="cy" from={fromPos.y} to={toPos.y} dur="0.8s" repeatCount="1" fill="freeze" />
                    </circle>
                    <circle r="4" fill="#02abb8">
                        <animate attributeName="cx" from={fromPos.x} to={toPos.x} dur="0.8s" repeatCount="1" fill="freeze" />
                        <animate attributeName="cy" from={fromPos.y} to={toPos.y} dur="0.8s" repeatCount="1" fill="freeze" />
                    </circle>
                    <text fontSize="12" fontWeight="900" fill="#02abb8" textAnchor="middle" className="filter drop-shadow-sm">
                        <animate attributeName="x" from={fromPos.x} to={toPos.x} dur="0.8s" repeatCount="1" fill="freeze" />
                        <animate attributeName="y" from={fromPos.y} to={toPos.y} dur="0.8s" repeatCount="1" fill="freeze" />
                        {pulse.amount}
                        <animate attributeName="opacity" values="1;1;0" dur="1s" repeatCount="1" />
                    </text>
                  </g>
              );
          })}
      </svg>

      {/* Nodes Map */}
      {nodes.map(node => {
          const pos = getNodePos(node.id);
          const isActive = node.status === 'active';
          const isGenesis = node.id === 'genesis';
          
          return (
              <div 
                key={node.id}
                className="absolute transition-all duration-700 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-default"
                style={{ left: pos.x, top: pos.y }}
              >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-lg group-hover:scale-110 ${
                      isGenesis 
                        ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                        : isActive 
                            ? 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/20' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-40'
                  }`}>
                      <span className="text-xl">
                          {node.id === 'alice' ? '👩‍💻' : 
                           node.id === 'bob' ? '👨‍🔬' : 
                           node.id === 'dave' ? '🧑‍🚀' : 
                           node.id === 'charlie' ? '🧑‍🎨' : 
                           node.id === 'eve' ? '👩‍✈️' : 
                           node.id === 'frank' ? '👨‍🚒' : 
                           node.id === 'grace' ? '👩‍⚕️' : 
                           node.id === 'henry' ? '🧑‍🌾' : '🏛️'}
                      </span>
                  </div>
                  <div className="mt-2 text-center pointer-events-none">
                      <div className="flex flex-col items-center">
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                              {node.name}
                          </span>
                          <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{node.role}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 justify-center">
                          <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className={`text-[7px] font-black uppercase ${isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                              {isActive ? 'Active' : 'Missing'}
                          </span>
                      </div>
                  </div>
              </div>
          );
      })}

      {/* Info Panel Right */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 hidden xl:block w-48 space-y-4">
          <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h5 className="text-[10px] font-black text-zinc-400 uppercase mb-2">Network Depth</h5>
              <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(lv => (
                      <div key={lv} className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-zinc-500">Level 0{lv}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${currentStep >= (lv === 1 ? 2 : lv === 2 ? 4 : 5) ? 'bg-[#02abb8]' : 'bg-zinc-300'}`} />
                      </div>
                  ))}
              </div>
          </div>
          <p className="text-[8px] text-zinc-400 font-medium leading-relaxed px-2">
              Alice receives increasing percentage shares from deeper network levels (45% from L5).
          </p>
      </div>
    </div>
  );
}
