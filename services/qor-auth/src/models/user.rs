//! User model for Qor ID system.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Authentication method for the user
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, Default)]
#[sqlx(type_name = "VARCHAR")]
#[serde(rename_all = "lowercase")]
pub enum AuthMethod {
    #[default]
    Password,
    Keypair,
    Both,
}

impl AuthMethod {
    pub fn as_str(&self) -> &'static str {
        match self {
            AuthMethod::Password => "password",
            AuthMethod::Keypair => "keypair",
            AuthMethod::Both => "both",
        }
    }
}

/// Account type (human or agent)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, Default)]
#[sqlx(type_name = "VARCHAR")]
#[serde(rename_all = "lowercase")]
pub enum AccountType {
    #[default]
    Human,
    Agent,
}

/// Agent autonomy level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR")]
#[serde(rename_all = "lowercase")]
pub enum AgentAutonomy {
    Supervised, // Requires approval for all actions
    Bounded,    // Pre-approved actions + spending limit
    Autonomous, // Full signing authority
    Sovereign,  // Can spawn sub-agents
}

/// User entity stored in PostgreSQL
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: Option<String>, // Optional for username-only accounts
    pub username: String,
    pub discriminator: i16,
    pub password_hash: String,
    pub email_verified: bool,
    pub avatar_url: Option<String>,
    pub role: UserRole,
    pub status: UserStatus,
    pub on_chain_address: Option<String>,
    pub backup_code: Option<String>, // For username-only password reset
    pub email_verification_token: Option<String>,
    pub email_verification_expires_at: Option<DateTime<Utc>>,
    pub login_attempts: i32,
    pub locked_until: Option<DateTime<Utc>>,
    pub primary_pubkey: Option<String>, // Primary public key for keypair auth
    pub auth_method: Option<String>, // password, keypair, or both
    // Agent-specific fields
    pub account_type: Option<String>, // human or agent
    pub controller_id: Option<Uuid>, // Human owner of this agent
    pub agent_did: Option<String>, // did:demiurge:agent:...
    pub agent_capabilities: Option<serde_json::Value>, // JSON array of capabilities
    pub agent_autonomy: Option<String>, // supervised, bounded, autonomous, sovereign
    pub agent_spending_limit: Option<i64>, // CGT spending limit
    pub agent_model: Option<String>, // AI model identifier
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
    pub email: Option<String>, // Optional - if provided, will send confirmation email
    pub password: String,
    pub username: String,
}

/// Login request DTO - accepts email OR username
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    #[serde(alias = "email", alias = "username")]
    pub identifier: String, // Can be email or username
    pub password: String,
    pub device_id: Option<String>,
}

/// Password reset request DTO
#[derive(Debug, Deserialize)]
pub struct ForgotPasswordRequest {
    pub identifier: String, // Username or email
}

/// Password reset with backup code DTO
#[derive(Debug, Deserialize)]
pub struct ResetPasswordWithBackupRequest {
    pub username: String,
    pub backup_code: String,
    pub new_password: String,
}

/// Password reset with token DTO (for email-based reset)
#[derive(Debug, Deserialize)]
pub struct ResetPasswordWithTokenRequest {
    pub token: String,
    pub new_password: String,
}

/// Request for a signature challenge (keypair auth step 1)
#[derive(Debug, Deserialize)]
pub struct ChallengeRequest {
    pub pubkey: String,
}

/// Response containing the challenge to sign
#[derive(Debug, Serialize)]
pub struct ChallengeResponse {
    pub challenge: String,
    pub expires_at: DateTime<Utc>,
}

/// Login with keypair signature (keypair auth step 2)
#[derive(Debug, Deserialize)]
pub struct KeypairLoginRequest {
    pub pubkey: String,
    pub challenge: String,
    pub signature: String,
    pub device_id: Option<String>,
}

/// Register with keypair (creates account from pubkey)
#[derive(Debug, Deserialize)]
pub struct KeypairRegisterRequest {
    pub pubkey: String,
    pub username: Option<String>, // Optional username, will be auto-generated if not provided
    pub challenge: String,
    pub signature: String,
}

/// Link keypair to existing account
#[derive(Debug, Deserialize)]
pub struct LinkKeypairRequest {
    pub pubkey: String,
    pub challenge: String,
    pub signature: String,
}

// =============================================================================
// Agent Types
// =============================================================================

/// Register a new AI agent
#[derive(Debug, Deserialize)]
pub struct RegisterAgentRequest {
    pub name: String,
    pub capabilities: Vec<String>,
    pub autonomy: String, // supervised, bounded, autonomous, sovereign
    pub spending_limit: Option<i64>,
    pub model: Option<String>,
}

/// Agent registration response
#[derive(Debug, Serialize)]
pub struct AgentRegistrationResponse {
    pub agent_id: Uuid,
    pub qor_id: String,
    pub did: String,
    pub pubkey: String,
    pub on_chain_address: String,
    pub capabilities: Vec<String>,
    pub autonomy: String,
}

/// Update agent capabilities
#[derive(Debug, Deserialize)]
pub struct UpdateAgentCapabilitiesRequest {
    pub capabilities: Vec<String>,
}

/// Agent info response
#[derive(Debug, Serialize)]
pub struct AgentInfo {
    pub id: Uuid,
    pub qor_id: String,
    pub did: String,
    pub pubkey: Option<String>,
    pub on_chain_address: Option<String>,
    pub capabilities: Vec<String>,
    pub autonomy: String,
    pub spending_limit: Option<i64>,
    pub model: Option<String>,
    pub status: String,
    pub controller_id: Uuid,
    pub created_at: DateTime<Utc>,
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
