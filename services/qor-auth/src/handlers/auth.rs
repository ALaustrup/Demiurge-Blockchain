//! Authentication handlers.

use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::models::{LoginRequest, RegisterRequest, RefreshRequest, TokenPair};
use crate::state::AppState;

/// Register a new user
pub async fn register(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    // Validate username
    if !crate::models::QorId::is_valid_username(&req.username) {
        return Err(AppError::ValidationError(
            "Username must be 3-20 characters, alphanumeric and underscores only".into()
        ));
    }

    // Validate password strength (safe word - minimum 6 characters)
    if req.password.len() < 6 {
        return Err(AppError::ValidationError(
            "Safe word must be at least 6 characters".into()
        ));
    }

    // TODO: Implement full registration logic
    // 1. Check if email/username exists
    // 2. Hash password with Argon2id
    // 3. Generate discriminator
    // 4. Insert user
    // 5. Send verification email
    // 6. Register on-chain (optional)

    Ok((StatusCode::CREATED, Json(json!({
        "qor_id": format!("{}#0001", req.username.to_lowercase()),
        "email_verified": false,
        "message": "Please check your email to verify your account"
    }))))
}

/// Login with email and password
pub async fn login(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<LoginRequest>,
) -> AppResult<Json<TokenPair>> {
    // TODO: Implement full login logic
    // 1. Find user by email
    // 2. Check if account is locked
    // 3. Verify password
    // 4. Create session
    // 5. Generate tokens
    // 6. Store session in Redis

    Ok(Json(TokenPair {
        access_token: "placeholder_access_token".into(),
        refresh_token: "placeholder_refresh_token".into(),
        expires_in: 900,
        token_type: "Bearer".into(),
    }))
}

/// Refresh access token
pub async fn refresh_token(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<RefreshRequest>,
) -> AppResult<Json<TokenPair>> {
    // TODO: Implement token refresh
    // 1. Validate refresh token
    // 2. Find session
    // 3. Generate new access token
    // 4. Optionally rotate refresh token

    Ok(Json(TokenPair {
        access_token: "placeholder_new_access_token".into(),
        refresh_token: "placeholder_refresh_token".into(),
        expires_in: 900,
        token_type: "Bearer".into(),
    }))
}

/// Logout and invalidate session
pub async fn logout(
    State(_state): State<Arc<AppState>>,
) -> AppResult<StatusCode> {
    // TODO: Implement logout
    // 1. Extract session from token
    // 2. Delete session from Redis
    // 3. Optionally revoke refresh token

    Ok(StatusCode::NO_CONTENT)
}

/// Verify email address
pub async fn verify_email(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<Value>,
) -> AppResult<Json<Value>> {
    // TODO: Implement email verification
    
    Ok(Json(json!({
        "message": "Email verified successfully"
    })))
}

/// Request password reset
pub async fn forgot_password(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<Value>,
) -> AppResult<Json<Value>> {
    // TODO: Implement password reset request
    
    Ok(Json(json!({
        "message": "If an account exists with this email, a reset link will be sent"
    })))
}

/// Reset password with token
pub async fn reset_password(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<Value>,
) -> AppResult<Json<Value>> {
    // TODO: Implement password reset
    
    Ok(Json(json!({
        "message": "Password reset successfully"
    })))
}

/// Check username availability
#[derive(serde::Deserialize)]
pub struct CheckUsernameRequest {
    username: String,
}

pub async fn check_username(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CheckUsernameRequest>,
) -> AppResult<Json<Value>> {
    // Validate username format
    if !crate::models::QorId::is_valid_username(&req.username) {
        return Ok(Json(json!({
            "available": false,
            "reason": "invalid_format"
        })));
    }

    // Check if username exists in database
    let username_lower = req.username.to_lowercase();
    let exists: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM users WHERE LOWER(username) = $1"
    )
    .bind(&username_lower)
    .fetch_optional(&state.db)
    .await?;

    let available = exists.map(|count| count == 0).unwrap_or(true);

    Ok(Json(json!({
        "available": available,
        "username": username_lower,
    })))
}
