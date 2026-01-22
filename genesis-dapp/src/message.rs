use borsh::{BorshDeserialize, BorshSerialize};

/// A Genesis Message - permanently stored on-chain
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct GenesisMessage {
    /// Unique message ID
    pub id: u64,
    /// The message content (max 280 characters)
    pub message: String,
    /// Author address/identifier
    pub author: String,
    /// Unix timestamp
    pub timestamp: u64,
}

impl GenesisMessage {
    /// Create a new Genesis Message
    pub fn new(id: u64, message: String, author: String, timestamp: u64) -> Self {
        Self {
            id,
            message,
            author,
            timestamp,
        }
    }
}

/// Genesis Dapp program type
/// This follows vProgs program structure
pub type GenesisDapp = genesis_dapp::GenesisDappState;
