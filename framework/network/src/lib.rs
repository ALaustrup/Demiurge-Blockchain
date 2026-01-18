//! # Demiurge Network - P2P Networking Layer
//!
//! Efficient block propagation, transaction pool, and peer discovery.
//! Built on LibP2P for maximum compatibility.


pub mod service;
pub mod protocol;
pub mod pool;
pub mod discovery;
pub mod error;

pub use service::NetworkService;
pub use protocol::{Protocol, Message};
pub use pool::TransactionPool;
pub use discovery::PeerDiscovery;
pub use error::{NetworkError, Result};
