//! Profile management handlers.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::error::AppResult;
use crate::state::AppState;

/// Get current user's profile
pub async fn get_profile(
    State(_state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    // TODO: Extract user from auth middleware
    // TODO: Fetch profile from database
    // TODO: Fetch on-chain balance

    Ok(Json(json!({
        "qor_id": "placeholder#0001",
        "display_name": "Placeholder",
        "avatar_url": null,
        "created_at": "2026-01-12T00:00:00Z",
        "on_chain": {
            "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            "cgt_balance": "0.00000000"
        }
    })))
}

/// Update user profile
pub async fn update_profile(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<Value>,
) -> AppResult<Json<Value>> {
    // TODO: Validate and update profile fields

    Ok(Json(json!({
        "message": "Profile updated successfully"
    })))
}

/// Upload avatar image
pub async fn upload_avatar(
    State(_state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    // TODO: Handle multipart upload
    // TODO: Resize and optimize image
    // TODO: Store in object storage
    // TODO: Update user record

    Ok(Json(json!({
        "avatar_url": "https://cdn.demiurge.io/avatars/placeholder.png"
    })))
}

/// List all active sessions
pub async fn list_sessions(
    State(_state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    // TODO: Fetch sessions from Redis

    Ok(Json(json!({
        "sessions": []
    })))
}

/// Revoke a specific session
pub async fn revoke_session(
    State(_state): State<Arc<AppState>>,
    Path(_session_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    // TODO: Delete session from Redis

    Ok(StatusCode::NO_CONTENT)
}

/// Link on-chain wallet to Qor ID
pub async fn link_wallet(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<Value>,
) -> AppResult<Json<Value>> {
    // TODO: Verify wallet signature
    // TODO: Submit on-chain transaction
    // TODO: Update user record

    Ok(Json(json!({
        "message": "Wallet linked successfully",
        "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    })))
}
