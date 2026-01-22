use borsh::{BorshDeserialize, BorshSerialize};

mod message;

pub use message::{GenesisMessage, GenesisDapp};

/// Genesis Dapp - The first dApp on Kasparex Hub
/// 
/// A symbolic, historical dApp where users can leave permanent messages
/// on-chain, creating a time capsule of the early Kaspa ecosystem.
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
pub struct GenesisDappState {
    /// Total number of messages
    pub message_count: u64,
    /// Fee for leaving a message (in smallest KAS unit)
    pub message_fee: u64,
    /// Maximum message length (280 characters)
    pub max_message_length: u32,
}

impl Default for GenesisDappState {
    fn default() -> Self {
        Self {
            message_count: 0,
            message_fee: 10_000_000_000_000_000, // 0.01 KAS
            max_message_length: 280,
        }
    }
}

impl GenesisDappState {
    /// Create a new Genesis Dapp state
    pub fn new() -> Self {
        Self::default()
    }

    /// Leave a message (main function)
    pub fn leave_message(
        &mut self,
        message: String,
        author: String, // Address or identifier
    ) -> Result<GenesisMessage, String> {
        // Validate message
        if message.is_empty() {
            return Err("Message cannot be empty".to_string());
        }

        if message.len() > self.max_message_length as usize {
            return Err(format!(
                "Message too long. Maximum {} characters",
                self.max_message_length
            ));
        }

        // Increment message count
        self.message_count += 1;

        // Create message
        let genesis_message = GenesisMessage {
            id: self.message_count,
            message,
            author,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        Ok(genesis_message)
    }

    /// Get message count
    pub fn get_message_count(&self) -> u64 {
        self.message_count
    }

    /// Get message fee
    pub fn get_message_fee(&self) -> u64 {
        self.message_fee
    }
}
