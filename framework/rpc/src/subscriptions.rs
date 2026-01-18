//! WebSocket subscriptions

use crate::RpcError;
use demiurge_core::{Block, Transaction};
use std::collections::HashMap;

/// Subscription manager for WebSocket events
pub struct SubscriptionManager {
    block_subscribers: HashMap<u64, Vec<String>>, // subscription_id -> connection_ids
    transaction_subscribers: HashMap<u64, Vec<String>>,
    next_subscription_id: u64,
}

impl SubscriptionManager {
    /// Create a new subscription manager
    pub fn new() -> Self {
        Self {
            block_subscribers: HashMap::new(),
            transaction_subscribers: HashMap::new(),
            next_subscription_id: 0,
        }
    }

    /// Subscribe to new blocks
    pub fn subscribe_blocks(&mut self, connection_id: String) -> u64 {
        let id = self.next_subscription_id;
        self.next_subscription_id += 1;
        self.block_subscribers
            .entry(id)
            .or_insert_with(Vec::new)
            .push(connection_id);
        id
    }

    /// Subscribe to transactions
    pub fn subscribe_transactions(&mut self, connection_id: String) -> u64 {
        let id = self.next_subscription_id;
        self.next_subscription_id += 1;
        self.transaction_subscribers
            .entry(id)
            .or_insert_with(Vec::new)
            .push(connection_id);
        id
    }

    /// Unsubscribe
    pub fn unsubscribe(&mut self, subscription_id: u64) -> Result<(), RpcError> {
        self.block_subscribers.remove(&subscription_id);
        self.transaction_subscribers.remove(&subscription_id);
        Ok(())
    }

    /// Notify block subscribers
    pub fn notify_block(&self, block: &Block) {
        // TODO: Send block to all subscribers via WebSocket
    }

    /// Notify transaction subscribers
    pub fn notify_transaction(&self, tx: &Transaction) {
        // TODO: Send transaction to all subscribers via WebSocket
    }
}

impl Default for SubscriptionManager {
    fn default() -> Self {
        Self::new()
    }
}
