export type EntryType = 'deployment' | 'feature' | 'improvement' | 'fix' | 'other';
export type EntryStatus = 'completed' | 'in-progress' | 'pending';
export type EntryPriority = 'high' | 'medium' | 'low';
export type Category = 'updates' | 'tasks' | 'ideas' | 'bugFixes';

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  type: EntryType;
  status?: EntryStatus; // For tasks and bug fixes
  priority?: EntryPriority; // For tasks, ideas, and bug fixes
}

export interface UpdatesData {
  updates: TimelineEntry[];
  tasks: TimelineEntry[];
  ideas: TimelineEntry[];
  bugFixes: TimelineEntry[];
}

export function getCategoryLabel(category: Category): string {
  const labels: Record<Category, string> = {
    updates: 'Updates',
    tasks: 'Tasks to Do',
    ideas: 'Potential Ideas',
    bugFixes: 'Bug Fixes',
  };
  return labels[category];
}

export function sortEntriesByDate(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

