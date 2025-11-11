/**
 * vProgs Contract Simulator
 * In-memory simulator for testing before vProgs launch
 */

import type {
  VProgsDApp,
  VProgsToken,
  VProgsUsageEvent,
  VProgsTransaction,
} from './types';
import type { TokenDeploymentConfig } from '@/lib/contracts/abstraction';

interface SimulatorState {
  dApps: Map<number, VProgsDApp>;
  tokens: Map<string, VProgsToken>;
  events: VProgsUsageEvent[];
  transactions: VProgsTransaction[];
  dAppCount: number;
}

class VProgsSimulator {
  private state: SimulatorState;

  constructor() {
    // Load from localStorage if available
    const stored = typeof window !== 'undefined' ? localStorage.getItem('vprogs_simulator_state') : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.state = {
          dApps: new Map(parsed.dApps || []),
          tokens: new Map(parsed.tokens || []),
          events: parsed.events || [],
          transactions: parsed.transactions || [],
          dAppCount: parsed.dAppCount || 0,
        };
      } catch {
        this.state = this.getInitialState();
      }
    } else {
      this.state = this.getInitialState();
    }
  }

  private getInitialState(): SimulatorState {
    return {
      dApps: new Map(),
      tokens: new Map(),
      events: [],
      transactions: [],
      dAppCount: 0,
    };
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    
    const serializable = {
      dApps: Array.from(this.state.dApps.entries()),
      tokens: Array.from(this.state.tokens.entries()),
      events: this.state.events,
      transactions: this.state.transactions,
      dAppCount: this.state.dAppCount,
    };
    
    localStorage.setItem('vprogs_simulator_state', JSON.stringify(serializable));
  }

  async registerDApp(
    name: string,
    version: string,
    category: string,
    contractAddress: string
  ): Promise<number> {
    this.state.dAppCount++;
    const dAppId = this.state.dAppCount;

    const dApp: VProgsDApp = {
      id: dAppId,
      name,
      version,
      category,
      contractAddress,
      deployer: '0x' + '0'.repeat(40), // Placeholder
      isActive: true,
      createdAt: Date.now(),
    };

    this.state.dApps.set(dAppId, dApp);
    this.saveState();

    return dAppId;
  }

  async deployToken(config: TokenDeploymentConfig): Promise<string> {
    // Generate a mock address
    const tokenAddress = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const token: VProgsToken = {
      address: tokenAddress,
      name: config.name,
      symbol: config.symbol,
      totalSupply: config.maxSupply,
    };

    this.state.tokens.set(tokenAddress, token);
    this.saveState();

    return tokenAddress;
  }

  async checkAccess(user: string, dAppContract: string): Promise<boolean> {
    // Simulate access check
    // In real implementation, this would query the AccessControl contract
    return true; // Placeholder
  }

  async distributeRewards(
    user: string,
    dAppContract: string,
    actionValue: string
  ): Promise<boolean> {
    // Simulate reward distribution
    return true; // Placeholder
  }

  recordUsageEvent(event: VProgsUsageEvent) {
    this.state.events.push(event);
    this.saveState();
  }

  getDApp(dAppId: number): VProgsDApp | undefined {
    return this.state.dApps.get(dAppId);
  }

  getAllDApps(): VProgsDApp[] {
    return Array.from(this.state.dApps.values());
  }

  getToken(tokenAddress: string): VProgsToken | undefined {
    return this.state.tokens.get(tokenAddress);
  }

  getUserEvents(user: string): VProgsUsageEvent[] {
    return this.state.events.filter((e) => e.user.toLowerCase() === user.toLowerCase());
  }

  clearState() {
    this.state = this.getInitialState();
    this.saveState();
  }
}

// Singleton instance
let simulatorInstance: VProgsSimulator | null = null;

export function getVProgsSimulator(): VProgsSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new VProgsSimulator();
  }
  return simulatorInstance;
}

export default VProgsSimulator;

