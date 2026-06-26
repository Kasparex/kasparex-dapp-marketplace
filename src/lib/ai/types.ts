export type AiAgentToken = 'KAS' | 'KREX' | 'ARIA';

export type AiAgentCategory =
  | 'content-creation'
  | 'productivity'
  | 'research'
  | 'finance'
  | 'lifestyle'
  | 'utilities';

export type AiAgentStatus = 'online' | 'offline' | 'soon';

export interface AiAgent {
  id: string;
  slug: string;
  name: string;
  category: AiAgentCategory;
  description: string;
  token: AiAgentToken;
  creator: string;
  usageCount: number;
  rating: number;
  reviewCount: number;
  status: AiAgentStatus;
  /** Placeholder for future Kaspa L1 programmability hooks. */
  programmabilityReady?: boolean;
}

export type AiListingTab =
  | 'all'
  | 'my-agents'
  | 'content-creation'
  | 'productivity'
  | 'research'
  | 'finance'
  | 'lifestyle'
  | 'utilities';

export type AiHubSection =
  | 'agents'
  | 'workflow-templates'
  | 'my-templates'
  | 'mpcs'
  | 'new-trending'
  | 'marketplace'
  | 'integrations'
  | 'community'
  | 'documentation'
  | 'developer-tools'
  | 'announcements';
