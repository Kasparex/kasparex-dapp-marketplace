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
}

interface Connection {
  from: string;
  to: string;
  label: string;
  active: boolean;
}

interface RevenueTreeFlowStoryProps {
  currentStep: number;
}

export function RevenueTreeFlowStory({ currentStep }: RevenueTreeFlowStoryProps) {
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);

  // Define nodes
  const nodes: Node[] = [
    { id: 'alice', name: 'Alice (You)', level: 0, status: currentStep >= 1 ? 'active' : 'inactive' },
    { id: 'bob', name: 'Bob', level: 1, status: currentStep >= 3 ? 'active' : 'inactive' },
    { id: 'charlie', name: 'Charlie', level: 2, status: currentStep >= 5 ? 'active' : 'inactive' },
    { id: 'genesis', name: 'Genesis Treasury', level: -1, status: 'active' },
  ];

  // Define connections (who refers whom)
  // Alice -> Bob -> Charlie
  // Payment flows upwards: Charlie -> Bob (L1) -> Alice (L2) -> ... -> Genesis

  const [pulses, setPulses] = useState<{ id: number; from: string; to: string; amount: string }[]>([]);
  const [pulseId, setPulseId] = useState(0);

  useEffect(() => {
    // Trigger pulses based on steps
    if (currentStep === 4) {
      // Bob just paid (after action in Step 3), Alice gets 2%
      triggerPulse('bob', 'alice', `2 ${symbol}`);
    } else if (currentStep === 5) {
      // Charlie just activated (after action in Step 4), Bob gets 2%, Alice gets 5%
      triggerPulse('charlie', 'bob', `2 ${symbol}`);
      setTimeout(() => triggerPulse('bob', 'alice', `5 ${symbol}`), 400);
    }
  }, [currentStep]);

  const triggerPulse = (from: string, to: string, amount: string) => {
    const id = pulseId;
    setPulseId(prev => prev + 1);
    setPulses(prev => [...prev, { id, from, to, amount }]);
    setTimeout(() => {
      setPulses(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const getNodePos = (id: string) => {
      switch(id) {
          case 'alice': return { x: '50%', y: '20%' };
          case 'bob': return { x: '50%', y: '50%' };
          case 'charlie': return { x: '50%', y: '80%' };
          case 'genesis': return { x: '85%', y: '20%' };
          default: return { x: '0%', y: '0%' };
      }
  };

  return (
    <div className="relative w-full h-[400px] bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(#02abb8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Title */}
      <div className="absolute top-4 left-6">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live Flow Simulation</h4>
          <p className="text-[9px] text-zinc-500 uppercase font-bold">Network Interaction Storyboard</p>
      </div>

      {/* Connections (Lines) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
          </defs>
          
          {/* Bob to Alice */}
          <line x1="50%" y1="45%" x2="50%" y2="25%" 
                className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-500 ${currentStep >= 3 ? 'stroke-[#02abb8]/40' : ''}`}
                strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Charlie to Bob */}
          <line x1="50%" y1="75%" x2="50%" y2="55%" 
                className={`stroke-zinc-200 dark:stroke-zinc-800 transition-colors duration-500 ${currentStep >= 5 ? 'stroke-[#02abb8]/40' : ''}`}
                strokeWidth="2" strokeDasharray="4 4" />

          {/* Genesis Redirect Lines */}
          {currentStep < 1 && (
               <path d="M 50% 20% L 80% 20%" className="stroke-red-500/20 fill-none" strokeWidth="2" strokeDasharray="2 2" markerEnd="url(#arrow)" />
          )}
          {currentStep < 3 && currentStep >= 2 && (
               <path d="M 50% 50% L 80% 20%" className="stroke-red-500/20 fill-none" strokeWidth="2" strokeDasharray="2 2" markerEnd="url(#arrow)" />
          )}

          {/* Active Pulses */}
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
                    <text fontSize="10" fontWeight="bold" fill="#02abb8" textAnchor="middle" className="animate-bounce">
                        <animate attributeName="x" from={fromPos.x} to={toPos.x} dur="0.8s" repeatCount="1" fill="freeze" />
                        <animate attributeName="y" from={fromPos.y} to={toPos.y} dur="0.8s" repeatCount="1" fill="freeze" />
                        {pulse.amount}
                    </text>
                  </g>
              );
          })}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
          const pos = getNodePos(node.id);
          const isActive = node.status === 'active';
          const isGenesis = node.id === 'genesis';
          
          return (
              <div 
                key={node.id}
                className="absolute transition-all duration-700 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                style={{ left: pos.x, top: pos.y }}
              >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl scale-90 group-hover:scale-100 ${
                      isGenesis 
                        ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                        : isActive 
                            ? 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/20' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-60'
                  }`}>
                      {node.id === 'alice' && (
                          <div className={`text-2xl ${isActive ? 'grayscale-0' : 'grayscale'}`}>👩‍💻</div>
                      )}
                      {node.id === 'bob' && (
                          <div className={`text-2xl ${isActive ? 'grayscale-0' : 'grayscale'}`}>👨‍🔬</div>
                      )}
                      {node.id === 'charlie' && (
                          <div className={`text-2xl ${isActive ? 'grayscale-0' : 'grayscale'}`}>🧑‍🎨</div>
                      )}
                      {isGenesis && (
                          <div className="text-2xl">🏛️</div>
                      )}
                  </div>
                  <div className="mt-2 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-tighter sm:tracking-widest ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                          {node.name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5 justify-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className={`text-[8px] font-bold uppercase ${isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                              {isActive ? 'Active' : (node.id === 'alice' ? 'Genesis Mode' : 'Inactive')}
                          </span>
                      </div>
                  </div>
              </div>
          );
      })}

      {/* Legend / Key */}
      <div className="absolute bottom-4 right-6 text-right hidden sm:block">
          <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 justify-end">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Revenue Flow</span>
                  <div className="w-8 h-[1px] bg-[#02abb8] border-t border-dashed" />
              </div>
              <p className="text-[9px] text-zinc-400 font-medium max-w-[140px] leading-tight">
                  Payments from bottom move up the tree. Inactive levels redirect to Genesis.
              </p>
          </div>
      </div>
    </div>
  );
}
