//! Authentication handlers.

use axum::{
    extract::State,
    http::StatusCode,
    Json,
    routing::post,
};
use chrono::{Duration, Utc};
use serde_json::{json, Value};
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::models::{
    ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordWithBackupRequest,
    ResetPasswordWithTokenRequest, TokenPair, User,
};
use crate::services::{auth_service::AuthService, session_service::SessionService};
use crate::state::AppState;

/// Register a new user
pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    // Validate username
    if !crate::models::QorId::is_valid_username(&req.username) {
        return Err(AppError::ValidationError(
            "Username must be 3-20 characters, alphanumeric and underscores only".into(),
        ));
    }

    // Validate password strength (safe word - minimum 6 characters)
    if req.password.len() < 6 {
        return Err(AppError::ValidationError(
            "Safe word must be at least 6 characters".into(),
        ));
    }

    // Validate email format if provided
    if let Some(ref email) = req.email {
        if !email.contains('@') || !email.contains('.') {
            return Err(AppError::ValidationError("Invalid email format".into()));
        }
    }

    let auth_service = AuthService::new(state.db.clone());
    let username_lower = req.username.to_lowercase();

    // Check if username already exists
    if let Some(_existing) = auth_service.find_by_username(&username_lower).await? {
        return Err(AppError::ValidationError(
            "Username already taken".into(),
        ));
    }

    // Check if email already exists (if provided)
    if let Some(ref email) = req.email {
        if let Some(_existing) = auth_service.find_by_email(email).await? {
            return Err(AppError::ValidationError(
                "Email already registered".into(),
            ));
        }
    }

    // Generate discriminator
    let discriminator = auth_service.generate_discriminator(&username_lower).await?;

    // Hash password
    let password_hash = AuthService::hash_password(&req.password)?;

    // Generate backup code for username-only accounts
    let backup_code = if req.email.is_none() {
        Some(AuthService::generate_backup_code())
    } else {
        None
    };

    // Generate email verification token if email provided
    let (email_verification_token, email_verification_expires_at) = if req.email.is_some() {
        let token = AuthService::generate_verification_token();
        let expires_at = Utc::now() + Duration::hours(24);
        (Some(token.clone()), Some(expires_at))
    } else {
        (None, None)
    };

    // Insert user
    let user_id = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO users (
            email, username, discriminator, password_hash, 
            email_verified, backup_code, email_verification_token, email_verification_expires_at,
            role, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'user', 'active')
        RETURNING id
        "#,
    )
    .bind(&req.email)
    .bind(&username_lower)
    .bind(discriminator)
    .bind(&password_hash)
    .bind(req.email.is_some()) // email_verified is false initially, true if no email
    .bind(&backup_code)
    .bind(&email_verification_token)
    .bind(&email_verification_expires_at)
    .fetch_one(&state.db)
    .await?;

    // TODO: Send verification email if email provided
    // For now, just return the token in response (in production, send email)
    let response = if req.email.is_some() {
        json!({
            "qor_id": format!("{}#{:04}", username_lower, discriminator),
            "email_verified": false,
            "email_verification_token": email_verification_token, // TODO: Remove in production, send email instead
            "message": "Please check your email to verify your account"
        })
    } else {
        json!({
            "qor_id": format!("{}#{:04}", username_lower, discriminator),
            "backup_code": backup_code,
            "email_verified": true, // No email to verify
            "message": "Account created successfully. Save your backup code!"
        })
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// Login with email OR username
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<TokenPair>> {
    let auth_service = AuthService::new(state.db.clone());
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    // Determine if identifier is email or username
    let user = if AuthService::is_email(&req.identifier) {
        // Try to find by email
        auth_service.find_by_email(&req.identifier).await?
    } else {
        // Try to find by username
        auth_service.find_by_username(&req.identifier).await?
    };

    let user = match user {
        Some(u) => u,
        None => {
            // If username doesn't exist, return error indicating signup option
            if !AuthService::is_email(&req.identifier) {
                return Err(AppError::ValidationError(
                    format!("Username '{}' not found. Would you like to sign up?", req.identifier)
                ));
            }
            return Err(AppError::Unauthorized("Invalid credentials".into()));
        }
    };

    // Check if account is locked
    if user.is_locked() {
        return Err(AppError::ValidationError(
            "Account is temporarily locked due to too many failed login attempts".into(),
        ));
    }

    // Check account status
    if user.status != crate::models::UserStatus::Active {
        return Err(AppError::ValidationError(
            "Account is not active".into(),
        ));
    }

    // Verify password
    if !AuthService::verify_password(&req.password, &user.password_hash)? {
        // Increment login attempts
        auth_service
            .increment_login_attempts(
                user.id,
                state.config.security.max_login_attempts,
                state.config.security.lockout_duration_secs,
            )
            .await?;

        return Err(AppError::Unauthorized("Invalid credentials".into()));
    }

    // Reset login attempts on successful login
    auth_service.reset_login_attempts(user.id).await?;

    // Create session
    let device_id = req.device_id.unwrap_or_else(|| "unknown".to_string());
    let (session, tokens) = session_service
        .create_session(
            user.id,
            &user.qor_id(),
            Some(&format!("{:?}", user.role)),
            &device_id,
            "0.0.0.0", // TODO: Extract from request headers
            None,      // TODO: Extract user agent
            crate::models::Session::default_scopes(),
        )
        .await?;

    Ok(Json(tokens))
}

/// Refresh access token
pub async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(req): Json<crate::models::RefreshRequest>,
) -> AppResult<Json<TokenPair>> {
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    // Validate refresh token
    let claims = session_service.validate_refresh_token(&req.refresh_token)?;

    // Get session
    let session_id = uuid::Uuid::parse_str(&claims.sid)
        .map_err(|_| AppError::InvalidToken)?;
    
    let session = session_service
        .get_session(session_id)
        .await?
        .ok_or(AppError::InvalidToken)?;

    if session.is_expired() {
        return Err(AppError::TokenExpired);
    }

    // Generate new tokens
    let tokens = session_service.generate_tokens(&session, claims.role.as_deref())?;

    Ok(Json(tokens))
}

/// Logout and invalidate session
pub async fn logout(
    State(state): State<Arc<AppState>>,
) -> AppResult<StatusCode> {
    // TODO: Extract session from token in middleware
    // For now, this is a placeholder
    Ok(StatusCode::NO_CONTENT)
}

/// Verify email address
#[derive(serde::Deserialize)]
pub struct VerifyEmailRequest {
    token: String,
}

pub async fn verify_email(
    State(state): State<Arc<AppState>>,
    Json(req): Json<VerifyEmailRequest>,
) -> AppResult<Json<Value>> {
    // Find user by verification token
    let user: Option<crate::models::User> = sqlx::query_as::<_, crate::models::User>(
        r#"
        SELECT * FROM users 
        WHERE email_verification_token = $1 
        AND email_verification_expires_at > NOW()
        "#
    )
    .bind(&req.token)
    .fetch_optional(&state.db)
    .await?;

    let user = user.ok_or(AppError::ValidationError("Invalid or expired verification token".into()))?;

    // Update user to verified
    sqlx::query(
        r#"
        UPDATE users 
        SET email_verified = TRUE, 
            email_verification_token = NULL,
            email_verification_expires_at = NULL
        WHERE id = $1
        "#
    )
    .bind(user.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "message": "Email verified successfully",
        "qor_id": user.qor_id()
    })))
}

/// Request password reset
pub async fn forgot_password(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ForgotPasswordRequest>,
) -> AppResult<Json<Value>> {
    let auth_service = AuthService::new(state.db.clone());

    // Find user by email or username
    let user = if AuthService::is_email(&req.identifier) {
        auth_service.find_by_email(&req.identifier).await?
    } else {
        auth_service.find_by_username(&req.identifier).await?
    };

    if let Some(user) = user {
        if user.email.is_some() {
            // Email-based reset: generate token and send email
            let token = AuthService::generate_verification_token();
            let expires_at = Utc::now() + Duration::hours(1);

            // Store reset token
            sqlx::query(
                r#"
                INSERT INTO password_resets (user_id, token, expires_at)
                VALUES ($1, $2, $3)
                "#
            )
            .bind(user.id)
            .bind(&token)
            .bind(expires_at)
            .execute(&state.db)
            .await?;

            // TODO: Send email with reset link
            // For now, return token (remove in production)
            return Ok(Json(json!({
                "message": "If an account exists, a reset link will be sent",
                "reset_token": token, // TODO: Remove in production, send email instead
                "requires_backup_code": false
            })));
        } else {
            // Username-only account: indicate backup code is needed
            return Ok(Json(json!({
                "requires_backup_code": true,
                "message": "This account requires a backup code to reset password"
            })));
        }
    }

    // Don't reveal if account exists (security best practice)
    Ok(Json(json!({
        "message": "If an account exists, a reset link will be sent"
    })))
}

/// Reset password with backup code (username-only accounts)
pub async fn reset_password_with_backup(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ResetPasswordWithBackupRequest>,
) -> AppResult<Json<Value>> {
    // Validate password
    if req.new_password.len() < 6 {
        return Err(AppError::ValidationError(
            "Safe word must be at least 6 characters".into(),
        ));
    }

    // Find user by username
    let auth_service = AuthService::new(state.db.clone());
    let user = auth_service
        .find_by_username(&req.username.to_lowercase())
        .await?
        .ok_or(AppError::ValidationError("User not found".into()))?;

    // Verify backup code
    if user.backup_code.as_ref() != Some(&req.backup_code) {
        return Err(AppError::Unauthorized("Invalid backup code".into()));
    }

    // Hash new password
    let password_hash = AuthService::hash_password(&req.new_password)?;

    // Update password
    sqlx::query(
        "UPDATE users SET password_hash = $1 WHERE id = $2"
    )
    .bind(&password_hash)
    .bind(user.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "message": "Password reset successfully"
    })))
}

/// Reset password with token (email-based accounts)
pub async fn reset_password(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ResetPasswordWithTokenRequest>,
) -> AppResult<Json<Value>> {
    // Validate password
    if req.new_password.len() < 6 {
        return Err(AppError::ValidationError(
            "Safe word must be at least 6 characters".into(),
        ));
    }

    // Find valid reset token
    let reset: Option<(uuid::Uuid, uuid::Uuid)> = sqlx::query_as(
        r#"
        SELECT user_id, id FROM password_resets
        WHERE token = $1 
        AND expires_at > NOW()
        AND used_at IS NULL
        LIMIT 1
        "#
    )
    .bind(&req.token)
    .fetch_optional(&state.db)
    .await?;

    let (user_id, reset_id) = reset.ok_or(AppError::ValidationError("Invalid or expired reset token".into()))?;

    // Hash new password
    let password_hash = AuthService::hash_password(&req.new_password)?;

    // Update password and mark token as used
    sqlx::query(
        r#"
        UPDATE users SET password_hash = $1 WHERE id = $2;
        UPDATE password_resets SET used_at = NOW() WHERE id = $3;
        "#
    )
    .bind(&password_hash)
    .bind(user_id)
    .bind(reset_id)
    .execute(&state.db)
    .await?;

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
