//! Authentication middleware.

use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

use crate::error::AppResult;
use crate::models::Claims;
use crate::services::SessionService;
use crate::state::AppState;

/// Helper to extract state from request (for use in nested routes)
fn get_state_from_request(request: &Request) -> Option<Arc<AppState>> {
    request.extensions().get::<Arc<AppState>>().cloned()
}

/// Extract user ID from request extensions (set by auth middleware)
pub fn get_user_id(request: &Request) -> Option<uuid::Uuid> {
    request.extensions().get::<uuid::Uuid>().copied()
}

/// Extract user role from request extensions
pub fn get_user_role(request: &Request) -> Option<String> {
    request.extensions().get::<String>().cloned()
}

/// Middleware to require authentication (with state)
pub async fn require_auth_with_state(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Store state in extensions for nested routes
    request.extensions_mut().insert(state.clone());
    
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // Validate token
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    let claims = match session_service.validate_access_token(token) {
        Ok(claims) => claims,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    // Attach user info to request extensions
    if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
        request.extensions_mut().insert(user_id);
    }
    if let Some(role) = &claims.role {
        request.extensions_mut().insert(role.clone());
    }
    request.extensions_mut().insert(claims.qor_id.clone());

    Ok(next.run(request).await)
}

/// Middleware to require authentication (without state - for nested routes)
pub async fn require_auth(
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Get state from extensions (set by parent router)
    let state = get_state_from_request(&request)
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // Validate token
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    let claims = match session_service.validate_access_token(token) {
        Ok(claims) => claims,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    // Attach user info to request extensions
    if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
        request.extensions_mut().insert(user_id);
    }
    if let Some(role) = &claims.role {
        request.extensions_mut().insert(role.clone());
    }
    request.extensions_mut().insert(claims.qor_id.clone());

    Ok(next.run(request).await)
}

/// Middleware to require admin role (admin, god, or system)
pub async fn require_admin(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Get state from extensions
    let state = get_state_from_request(&request)
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    // First check authentication
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // Validate token
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    let claims = match session_service.validate_access_token(token) {
        Ok(claims) => claims,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    // Check admin role
    let role = claims.role.as_deref().unwrap_or("user");
    let is_admin = matches!(role, "admin" | "god" | "system");

    if !is_admin {
        return Err(StatusCode::FORBIDDEN);
    }

    Ok(next.run(request).await)
}

/// Middleware to require God-level access
pub async fn require_god(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Get state from extensions
    let state = get_state_from_request(&request)
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    // First check authentication
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // Validate token
    let session_service = SessionService::new(
        state.redis.clone(),
        state.config.jwt.clone(),
    );

    let claims = match session_service.validate_access_token(token) {
        Ok(claims) => claims,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    // Check God role
    let role = claims.role.as_deref().unwrap_or("user");
    if role != "god" {
        return Err(StatusCode::FORBIDDEN);
    }

    // Attach user info to request extensions for handlers
    if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
        request.extensions_mut().insert(user_id);
    }
    request.extensions_mut().insert(claims.qor_id.clone());

    Ok(next.run(request).await)
}
