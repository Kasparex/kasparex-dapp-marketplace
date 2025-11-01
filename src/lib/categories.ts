export type Category = 
  | 'all'
  | 'tracker'
  | 'general'
  | 'minting'
  | 'defi'
  | 'games'
  | 'promotion'
  | 'subscription'
  | 'dao'
  | 'tools'
  | 'collabs'
  | 'airdrops';

export interface CategoryInfo {
  id: Category;
  name: string;
  emoji: string;
}

export const categories: CategoryInfo[] = [
  { id: 'all', name: 'All', emoji: '⚡' },
  { id: 'tracker', name: 'Tracker', emoji: '⚙️' },
  { id: 'general', name: 'General', emoji: '⚡' },
  { id: 'minting', name: 'Minting', emoji: '🍃' },
  { id: 'defi', name: 'DeFi', emoji: '🎫' },
  { id: 'games', name: 'Games', emoji: '🎮' },
  { id: 'promotion', name: 'Promotion', emoji: '📢' },
  { id: 'subscription', name: 'Subscription', emoji: '🔔' },
  { id: 'dao', name: 'DAO', emoji: '🗳️' },
  { id: 'tools', name: 'Tools', emoji: '🛠️' },
  { id: 'collabs', name: 'Collabs', emoji: '🤝' },
  { id: 'airdrops', name: 'Airdrops', emoji: '🪂' },
];

export const getCategoryById = (id: Category): CategoryInfo | undefined => {
  return categories.find((cat) => cat.id === id);
};

