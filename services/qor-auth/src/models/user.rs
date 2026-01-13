//! User model for Qor ID system.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// User entity stored in PostgreSQL
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub discriminator: i16,
    pub password_hash: String,
    pub email_verified: bool,
    pub avatar_url: Option<String>,
    pub role: UserRole,
    pub status: UserStatus,
    pub on_chain_address: Option<String>,
    pub login_attempts: i32,
    pub locked_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User role for RBAC
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    User,
    Moderator,
    Admin,
    System,
    God, // God-level access - full system control
}

impl UserRole {
    /// Check if role has admin privileges
    pub fn is_admin(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::God | UserRole::System)
    }

    /// Check if role has God-level access
    pub fn is_god(&self) -> bool {
        matches!(self, UserRole::God)
    }
}

/// User account status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum UserStatus {
    Active,
    Inactive,
    Suspended,
    Banned,
}

/// Registration request DTO
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub username: String,
}

/// Login request DTO
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub device_id: Option<String>,
}

/// Public user profile (safe to expose)
#[derive(Debug, Serialize)]
pub struct UserProfile {
    pub qor_id: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub on_chain: Option<OnChainInfo>,
}

/// On-chain identity info
#[derive(Debug, Serialize)]
pub struct OnChainInfo {
    pub address: String,
    pub cgt_balance: String,
}

impl User {
    /// Format as Qor ID (username#discriminator)
    pub fn qor_id(&self) -> String {
        format!("{}#{:04}", self.username.to_lowercase(), self.discriminator)
    }

    /// Convert to public profile
    pub fn to_profile(&self, on_chain: Option<OnChainInfo>) -> UserProfile {
        UserProfile {
            qor_id: self.qor_id(),
            display_name: self.username.clone(),
            avatar_url: self.avatar_url.clone(),
            created_at: self.created_at,
            on_chain,
        }
    }

    /// Check if account is locked
    pub fn is_locked(&self) -> bool {
        if let Some(locked_until) = self.locked_until {
            Utc::now() < locked_until
        } else {
            false
        }
    }
}
