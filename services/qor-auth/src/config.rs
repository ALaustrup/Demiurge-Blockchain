//! Application configuration module.
//! 
//! Loads configuration from environment variables and config files.

use serde::Deserialize;
use config::{Config, Environment, File};

/// Main application configuration
#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub jwt: JwtConfig,
    pub security: SecurityConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub environment: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    /// Secret for signing access tokens
    pub access_secret: String,
    /// Secret for signing refresh tokens
    pub refresh_secret: String,
    /// Access token expiry in seconds (default: 900 = 15 minutes)
    pub access_expiry_secs: i64,
    /// Refresh token expiry in seconds (default: 2592000 = 30 days)
    pub refresh_expiry_secs: i64,
    /// Issuer claim
    pub issuer: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SecurityConfig {
    /// Maximum login attempts before lockout
    pub max_login_attempts: u32,
    /// Lockout duration in seconds
    pub lockout_duration_secs: i64,
    /// Maximum concurrent sessions per user
    pub max_sessions: usize,
    /// Password minimum length
    pub password_min_length: usize,
}

impl AppConfig {
    /// Load configuration from environment and files
    pub fn load() -> anyhow::Result<Self> {
        // Load .env file if present
        dotenvy::dotenv().ok();

        let env = std::env::var("RUN_ENV").unwrap_or_else(|_| "development".into());

        let config = Config::builder()
            // Start with default values
            .set_default("server.host", "0.0.0.0")?
            .set_default("server.port", 3000)?
            .set_default("server.environment", &env)?
            .set_default("database.max_connections", 10)?
            .set_default("jwt.access_expiry_secs", 900)?
            .set_default("jwt.refresh_expiry_secs", 2592000)?
            .set_default("jwt.issuer", "qor-auth")?
            .set_default("security.max_login_attempts", 5)?
            .set_default("security.lockout_duration_secs", 900)?
            .set_default("security.max_sessions", 10)?
            .set_default("security.password_min_length", 12)?
            // Load config file based on environment
            .add_source(File::with_name(&format!("config/{}", env)).required(false))
            // Override with environment variables (QOR_AUTH_*)
            .add_source(
                Environment::with_prefix("QOR_AUTH")
                    .separator("__")
                    .try_parsing(true),
            )
            .build()?;

        Ok(config.try_deserialize()?)
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".into(),
                port: 3000,
                environment: "development".into(),
            },
            database: DatabaseConfig {
                url: "postgres://localhost/qor_auth".into(),
                max_connections: 10,
            },
            redis: RedisConfig {
                url: "redis://localhost:6379".into(),
            },
            jwt: JwtConfig {
                access_secret: "CHANGE_ME_ACCESS_SECRET".into(),
                refresh_secret: "CHANGE_ME_REFRESH_SECRET".into(),
                access_expiry_secs: 900,
                refresh_expiry_secs: 2592000,
                issuer: "qor-auth".into(),
            },
            security: SecurityConfig {
                max_login_attempts: 5,
                lockout_duration_secs: 900,
                max_sessions: 10,
                password_min_length: 12,
            },
        }
    }
}
