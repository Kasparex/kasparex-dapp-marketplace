/**
 * Icon Library for dApp Icons
 * Provides deterministic icon selection based on identifiers
 */

// List of icon emojis for dApps
const dAppIcons = [
  '🚀', '💎', '⭐', '🔥', '💡', '🎯', '⚡', '🌟', '🎨', '🎪',
  '🎭', '🎬', '🎮', '🎲', '🎸', '🎺', '🎻', '🎤', '🎧', '🎵',
  '🏆', '🏅', '🥇', '🥈', '🥉', '🎖️', '🏵️', '🎗️', '🎟️', '🎫',
  '💼', '📊', '📈', '📉', '📋', '📝', '📄', '📃', '📑', '📜',
  '🔧', '🔨', '⚙️', '🛠️', '🔩', '⚒️', '🛡️', '🗡️', '⚔️', '🏹',
  '🌐', '🌍', '🌎', '🌏', '🗺️', '🧭', '⛰️', '🏔️', '🌋', '🏕️',
  '💳', '💰', '💵', '💴', '💶', '💷', '💸', '💹', '🪙', '🏦',
  '🎁', '🎀', '🎊', '🎉', '🎈', '🎂', '🍰', '🧁', '🍭', '🍬',
  '🔐', '🔑', '🗝️', '🔒', '🔓', '🔔', '🔕', '📢', '📣', '📯',
  '🎪', '🎨', '🖼️', '🖌️', '🖍️', '✏️', '✒️', '🖊️', '🖋️', '📝',
  '📱', '💻', '🖥️', '⌨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿',
  '🔮', '🧿', '🔯', '🪄', '✨', '⭐', '🌟', '💫', '⚡', '☄️',
  '🌙', '☀️', '⭐', '🌟', '💫', '✨', '⚡', '🔥', '💧', '🌊',
  '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂',
  '🎃', '🎄', '🎅', '🤶', '🧑‍🎄', '🎁', '🎀', '🎊', '🎉', '🎈',
];

/**
 * Get a deterministic icon for a dApp based on its identifier
 * @param identifier - Unique identifier for the dApp (e.g., name + category)
 * @returns An emoji icon
 */
export function getDAppIcon(identifier: string): string {
  // Create a simple hash from the identifier
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % dAppIcons.length;
  return dAppIcons[index];
}

