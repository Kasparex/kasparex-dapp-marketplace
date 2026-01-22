/**
 * Genesis Dapp Simulator
 * Simulates Genesis Dapp functionality for testing before vProgs launch
 */

import type { GenesisMessage, GenesisDappState, LeaveMessageParams } from './genesis-types';
import { getVProgsSimulator } from './simulator';

const GENESIS_DAPP_ID = 1; // First dApp ID
const DEFAULT_MESSAGE_FEE = '10000000000000000'; // 0.01 KAS
const MAX_MESSAGE_LENGTH = 280;

class GenesisDappSimulator {
  private messages: Map<number, GenesisMessage>;
  private messageCount: number;
  private state: GenesisDappState;

  constructor() {
    // Load from localStorage
    const stored = typeof window !== 'undefined' 
      ? localStorage.getItem('genesis_dapp_state') 
      : null;
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.messages = new Map(parsed.messages || []);
        this.messageCount = parsed.messageCount || 0;
        this.state = parsed.state || this.getDefaultState();
      } catch {
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  private getDefaultState(): GenesisDappState {
    return {
      messageCount: 0,
      messageFee: DEFAULT_MESSAGE_FEE,
      maxMessageLength: MAX_MESSAGE_LENGTH,
    };
  }

  private reset() {
    this.messages = new Map();
    this.messageCount = 0;
    this.state = this.getDefaultState();
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    
    const serializable = {
      messages: Array.from(this.messages.entries()),
      messageCount: this.messageCount,
      state: this.state,
    };
    
    localStorage.setItem('genesis_dapp_state', JSON.stringify(serializable));
  }

  async leaveMessage(params: LeaveMessageParams): Promise<GenesisMessage> {
    // Validate
    if (!params.message || params.message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (params.message.length > this.state.maxMessageLength) {
      throw new Error(
        `Message too long. Maximum ${this.state.maxMessageLength} characters`
      );
    }

    // Check fee
    if (BigInt(params.fee) < BigInt(this.state.messageFee)) {
      throw new Error(`Insufficient fee. Required: ${this.state.messageFee}`);
    }

    // Create message
    this.messageCount++;
    const message: GenesisMessage = {
      id: this.messageCount,
      message: params.message.trim(),
      author: params.author,
      timestamp: Date.now(),
    };

    this.messages.set(message.id, message);
    this.state.messageCount = this.messageCount;
    this.saveState();

    // Record usage event
    const simulator = getVProgsSimulator();
    simulator.recordUsageEvent({
      user: params.author,
      dAppContract: 'genesis-dapp',
      dAppId: GENESIS_DAPP_ID,
      actionType: 'leave-message',
      timestamp: message.timestamp,
    });

    return message;
  }

  async getMessage(messageId: number): Promise<GenesisMessage | null> {
    return this.messages.get(messageId) || null;
  }

  async getMessages(offset: number = 0, limit: number = 50): Promise<GenesisMessage[]> {
    const allMessages = Array.from(this.messages.values())
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
    
    return allMessages.slice(offset, offset + limit);
  }

  getState(): GenesisDappState {
    return { ...this.state };
  }

  getMessageCount(): number {
    return this.messageCount;
  }

  clearMessages() {
    this.reset();
    this.saveState();
  }
}

// Singleton instance
let genesisSimulatorInstance: GenesisDappSimulator | null = null;

export function getGenesisDappSimulator(): GenesisDappSimulator {
  if (!genesisSimulatorInstance) {
    genesisSimulatorInstance = new GenesisDappSimulator();
  }
  return genesisSimulatorInstance;
}

export default GenesisDappSimulator;
