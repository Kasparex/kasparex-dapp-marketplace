/**
 * GitBook API Types
 */

export interface GitBookConfig {
  apiToken: string;
  spaceId: string;
  organizationId?: string;
}

export interface GitBookPage {
  id: string;
  title: string;
  path: string;
  content?: string;
  parentId?: string;
}

export interface GitBookPageCreate {
  title: string;
  path: string;
  content: string;
  parentId?: string;
}

export interface GitBookPageUpdate {
  title?: string;
  path?: string;
  content?: string;
}

export interface GitBookSpace {
  id: string;
  name: string;
  organizationId?: string;
}

export interface GitBookAPIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

