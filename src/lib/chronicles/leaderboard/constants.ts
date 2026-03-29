/** Chronicles leaderboard on-chain payload prefix (UTF-8 text, hex-encoded into tx payload). */
export const CHRONICLES_LB_PAYLOAD_PREFIX = 'kxc1:';

/** Slot activation cost per slot (slots 2-3). */
export const CHRONICLES_LB_SLOT_ACTIVATION_KAS = 5;

/** Anti-spam fee for setting/clearing a slot placement. */
export const CHRONICLES_LB_SLOT_CHANGE_KAS = 0.1;

/** Fee to confirm a read event for an entity. */
export const CHRONICLES_LB_READ_CONFIRM_KAS = 5;

/** Points awarded per filled active slot. */
export const CHRONICLES_LB_POINTS_PER_FILLED_SLOT = 10;

/** Points awarded per confirmed read action. */
export const CHRONICLES_LB_POINTS_PER_READ_CONFIRM = 50;

export type ChroniclesLbEntityType = 'chapter' | 'character' | 'location' | 'vehicle';

