/**
 * Kaspa Capsule local message registry (Hub archive until covenant indexer ships).
 */

import { htmlToPlainText, normalizeQuillHtml } from '@/lib/richText/html';
import { validateGenesisMessageHtml, GENESIS_MESSAGE_LIMITS } from '@/lib/genesis/limits';
import type { GenesisMessage, GenesisDappState, SaveMessageParams } from './genesis-types';
import { getVProgsSimulator } from './simulator';

const KASPA_CAPSULE_DAPP_ID = 1;
const STORAGE_KEY = 'kaspa_capsule_state';
const LEGACY_STORAGE_KEY = 'genesis_dapp_state';

class GenesisDappSimulator {
  private messages: Map<number, GenesisMessage> = new Map();
  private messageCount: number = 0;
  private state: GenesisDappState;

  constructor() {
    const stored =
      typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
        : null;

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
        this.saveState();
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
      const txHash = msg.txHash ?? msg.txRef ?? '';
      const messageId = msg.messageId ?? `legacy-${id}`;
      const contentHtml = msg.contentHtml || msg.message || '';
      this.messages.set(id, {
        ...msg,
        messageId,
        contentHtml,
        txHash,
        payloadBytes: msg.payloadBytes ?? new TextEncoder().encode(contentHtml).length,
        chunkCount: msg.chunkCount ?? 1,
        feeKas: msg.feeKas ?? 0,
      });
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;

    const serializable = {
      messages: Array.from(this.messages.entries()),
      messageCount: this.messageCount,
      state: this.state,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  async saveMessage(params: SaveMessageParams): Promise<GenesisMessage> {
    const contentHtml = normalizeQuillHtml(params.contentHtml);
    const validationError = validateGenesisMessageHtml(contentHtml);
    if (validationError) throw new Error(validationError);

    const plain = htmlToPlainText(contentHtml);
    if (params.feeKas <= 0) throw new Error('Invalid fee quote');
    if (!params.txHash.trim()) throw new Error('Missing on-chain transaction reference');

    this.messageCount++;
    const message: GenesisMessage = {
      id: this.messageCount,
      messageId: params.messageId,
      message: plain,
      contentHtml,
      author: params.author,
      timestamp: Date.now(),
      payloadBytes: params.payloadBytes,
      chunkCount: params.chunkCount,
      feeKas: params.feeKas,
      txHash: params.txHash.trim(),
    };

    this.messages.set(message.id, message);
    this.state.messageCount = this.messageCount;
    this.saveState();

    const simulator = getVProgsSimulator();
    simulator.recordUsageEvent({
      user: params.author,
      dAppContract: 'kaspa-capsule',
      dAppId: KASPA_CAPSULE_DAPP_ID,
      actionType: 'leave-message',
      timestamp: message.timestamp,
    });

    return message;
  }

  async deleteMessage(messageId: number, author: string): Promise<void> {
    const msg = this.messages.get(messageId);
    if (!msg || msg.deletedAt) throw new Error('Message not found');
    if (msg.author.trim().toLowerCase() !== author.trim().toLowerCase()) {
      throw new Error('You can only delete your own messages');
    }
    this.messages.set(messageId, { ...msg, deletedAt: Date.now() });
    this.saveState();
  }

  async getMessage(messageId: number): Promise<GenesisMessage | null> {
    const msg = this.messages.get(messageId);
    if (!msg || msg.deletedAt) return null;
    return msg;
  }

  async getMessages(offset: number = 0, limit: number = 200): Promise<GenesisMessage[]> {
    const allMessages = Array.from(this.messages.values())
      .filter((m) => !m.deletedAt)
      .sort((a, b) => b.timestamp - a.timestamp);
    return allMessages.slice(offset, offset + limit);
  }

  getState(): GenesisDappState {
    return { ...this.state };
  }

  getMessageCount(): number {
    return Array.from(this.messages.values()).filter((m) => !m.deletedAt).length;
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
