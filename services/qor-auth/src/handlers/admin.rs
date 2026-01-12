//! Admin handlers (protected).

use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::error::AppResult;
use crate::state::AppState;

/// List all users (paginated)
pub async fn list_users(
    State(_state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    // TODO: Implement pagination and filtering

    Ok(Json(json!({
        "users": [],
        "total": 0,
        "page": 1,
        "per_page": 20
    })))
}

/// Get a specific user by ID
pub async fn get_user(
    State(_state): State<Arc<AppState>>,
    Path(_user_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    // TODO: Fetch user details

    Ok(Json(json!({
        "id": "placeholder",
        "qor_id": "placeholder#0001"
    })))
}

/// Ban a user
pub async fn ban_user(
    State(_state): State<Arc<AppState>>,
    Path(_user_id): Path<Uuid>,
    Json(_req): Json<Value>,
) -> AppResult<Json<Value>> {
    // TODO: Update user status to banned
    // TODO: Revoke all sessions
    // TODO: Log admin action

    Ok(Json(json!({
        "message": "User banned successfully"
    })))
}

/// Get system statistics
pub async fn get_stats(
    State(_state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    // TODO: Aggregate statistics

    Ok(Json(json!({
        "total_users": 0,
        "active_sessions": 0,
        "registrations_24h": 0,
        "logins_24h": 0
    })))
}
