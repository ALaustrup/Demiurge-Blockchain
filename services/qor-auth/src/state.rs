//! Application state management.
//! 
//! Shared state across all request handlers.

use sqlx::PgPool;
use deadpool_redis::Pool as RedisPool;

use crate::config::AppConfig;

/// Shared application state
pub struct AppState {
    /// Application configuration
    pub config: AppConfig,
    /// PostgreSQL connection pool
    pub db: PgPool,
    /// Redis connection pool
    pub redis: RedisPool,
}

impl AppState {
    /// Create new application state
    pub fn new(config: AppConfig, db: PgPool, redis: RedisPool) -> Self {
        Self { config, db, redis }
    }
}
