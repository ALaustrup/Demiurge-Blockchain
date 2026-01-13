//! Application middleware.

pub mod auth;

pub use auth::{require_auth, require_admin, require_god, get_user_id, get_user_role};
