/**
 * Genesis Dapp Simulator
 * Simulates Genesis Dapp functionality before covenant / vProgs production deploy.
 */

import { htmlToPlainText, normalizeQuillHtml } from '@/lib/richText/html';
import { validateGenesisMessageHtml, GENESIS_MESSAGE_LIMITS } from '@/lib/genesis/limits';
import type { GenesisMessage, GenesisDappState, LeaveMessageParams } from './genesis-types';
import { getVProgsSimulator } from './simulator';

const GENESIS_DAPP_ID = 1;

class GenesisDappSimulator {
  private messages: Map<number, GenesisMessage> = new Map();
  private messageCount: number = 0;
  private state: GenesisDappState;

  constructor() {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('genesis_dapp_state') : null;

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          messages?: [number, GenesisMessage][];
          messageCount?: number;
          state?: GenesisDappState;
        };
        this.messages = new Map(parsed.messages || []);
        this.messageCount = parsed.messageCount || 0;
        this.state = parsed.state || this.getDefaultState();
        this.migrateLegacyMessages();
      } catch {
        this.state = this.getDefaultState();
        this.reset();
      }
    } else {
      this.state = this.getDefaultState();
      this.reset();
    }
  }

  private getDefaultState(): GenesisDappState {
    return {
      messageCount: 0,
      maxMessageLength: GENESIS_MESSAGE_LIMITS.max,
    };
  }

  private reset() {
    this.messages.clear();
    this.messageCount = 0;
    this.state = this.getDefaultState();
  }

  private migrateLegacyMessages() {
    for (const [id, msg] of this.messages.entries()) {
      if (!msg.contentHtml && msg.message) {
        this.messages.set(id, {
          ...msg,
          contentHtml: msg.message,
          payloadBytes: msg.payloadBytes ?? new TextEncoder().encode(msg.message).length,
          chunkCount: msg.chunkCount ?? 1,
          feeKas: msg.feeKas ?? 0,
        });
      }
    }
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
    const contentHtml = normalizeQuillHtml(params.contentHtml);
    const validationError = validateGenesisMessageHtml(contentHtml);
    if (validationError) throw new Error(validationError);

    const plain = htmlToPlainText(contentHtml);
    if (params.feeKas <= 0) throw new Error('Invalid fee quote');

    this.messageCount++;
    const txRef = `genesis:sim:${Date.now()}:${this.messageCount}`;
    const message: GenesisMessage = {
      id: this.messageCount,
      message: plain,
      contentHtml,
      author: params.author,
      timestamp: Date.now(),
      payloadBytes: params.payloadBytes,
      chunkCount: params.chunkCount,
      feeKas: params.feeKas,
      txRef,
    };

    this.messages.set(message.id, message);
    this.state.messageCount = this.messageCount;
    this.saveState();

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

  async getMessages(offset: number = 0, limit: number = 200): Promise<GenesisMessage[]> {
    const allMessages = Array.from(this.messages.values()).sort((a, b) => b.timestamp - a.timestamp);
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

let genesisSimulatorInstance: GenesisDappSimulator | null = null;

export function getGenesisDappSimulator(): GenesisDappSimulator {
  if (!genesisSimulatorInstance) {
    genesisSimulatorInstance = new GenesisDappSimulator();
  }
  return genesisSimulatorInstance;
}

export default GenesisDappSimulator;
