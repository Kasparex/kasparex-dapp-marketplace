import type { ToastInput, ToastData } from '@/components/ui/Toaster';

export type HubNotifyBridge = {
  toast: (options: ToastInput) => string;
  update: (id: string, options: Partial<Omit<ToastData, 'id'>>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

let api: HubNotifyBridge | null = null;

export function bindHubNotifyApi(next: HubNotifyBridge | null) {
  api = next;
}

export function getHubNotifyApi(): HubNotifyBridge | null {
  return api;
}
