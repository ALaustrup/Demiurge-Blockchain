//! # Qor Auth Service
//! 
//! The Non-Dual Identity System for the Demiurge Ecosystem.
//! 
//! ## Architecture
//! 
//! - **Framework**: Axum (Rust 2024)
//! - **Database**: PostgreSQL 18
//! - **Cache**: Redis 7.4+
//! - **Auth**: JWT + Refresh Tokens
//! 
//! ## Features
//! 
//! - Battle.Net-style `username#discriminator` identity
//! - ZK-proof verification for privacy-preserving attestations
//! - On-chain identity linking via Substrate
//! - Session management with device tracking

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    Router,
    routing::{get, post},
    extract::{Request, State},
    middleware::{Next, from_fn, from_fn_with_state},
};
use sqlx::postgres::PgPoolOptions;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;
mod state;

use crate::config::AppConfig;
use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "qor_auth=debug,tower_http=debug,axum=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("🎭 Qor Auth Service - Genesis Activation");

    // Load configuration
    let config = AppConfig::load()?;
    
    // Database connection pool
    let db_pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    tracing::info!("✅ Connected to PostgreSQL");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await?;

    tracing::info!("✅ Database migrations applied");

    // Redis connection
    let redis_cfg = deadpool_redis::Config::from_url(&config.redis.url);
    let redis_pool = redis_cfg.create_pool(Some(deadpool_redis::Runtime::Tokio1))?;

    tracing::info!("✅ Connected to Redis");

    // Build application state
    let state = Arc::new(AppState::new(config.clone(), db_pool, redis_pool));

    // Build router
    let app = Router::new()
        // Health endpoints
        .route("/health", get(handlers::health::health_check))
        .route("/ready", get(handlers::health::readiness_check))
        
        // Public auth endpoints
        .nest("/api/v1/auth", auth_routes())
        
        // Protected profile endpoints
        .nest("/api/v1/profile", profile_routes())
        
        // ZK verification endpoints
        .nest("/api/v1/zk", zk_routes())
        
        // Admin endpoints (protected - God-level)
        .nest("/api/v1/admin", admin_routes())
        
        // Middleware - inject state into extensions for nested routes
        .layer(from_fn_with_state(
            state.clone(),
            move |State(state): State<Arc<AppState>>, mut request: Request, next: Next| async move {
                request.extensions_mut().insert(state);
                next.run(request).await
            }
        ))
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    // Bind and serve
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server.port));
    tracing::info!("🚀 Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

/// Authentication routes (public)
fn auth_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register", post(handlers::auth::register))
        .route("/login", post(handlers::auth::login))
        .route("/refresh", post(handlers::auth::refresh_token))
        .route("/logout", post(handlers::auth::logout))
        .route("/verify-email", post(handlers::auth::verify_email))
        .route("/forgot-password", post(handlers::auth::forgot_password))
        .route("/reset-password", post(handlers::auth::reset_password))
        .route("/check-username", post(handlers::auth::check_username))
}

/// Profile routes (protected)
fn profile_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(handlers::profile::get_profile))
        .route("/", post(handlers::profile::update_profile))
        .route("/avatar", post(handlers::profile::upload_avatar))
        .route("/sessions", get(handlers::profile::list_sessions))
        .route("/sessions/{id}", axum::routing::delete(handlers::profile::revoke_session))
        .route("/link-wallet", post(handlers::profile::link_wallet))
        .layer(from_fn(crate::middleware::auth::require_auth))
}

/// ZK-proof verification routes
fn zk_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/verify", post(handlers::zk::verify_proof))
        .route("/attestations", get(handlers::zk::get_attestations))
        .route("/attestations", post(handlers::zk::create_attestation))
}

/// Admin routes (protected - God-level access)
fn admin_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/users", get(handlers::admin::list_users))
        .route("/users/{id}", get(handlers::admin::get_user))
        .route("/users/{id}/ban", post(handlers::admin::ban_user))
        .route("/users/{id}/unban", post(handlers::admin::unban_user))
        .route("/users/{id}/role", post(handlers::admin::update_role))
        .route("/tokens/transfer", post(handlers::admin::transfer_tokens))
        .route("/tokens/refund", post(handlers::admin::refund_tokens))
        .route("/stats", get(handlers::admin::get_stats))
        .route("/audit", get(handlers::admin::get_audit_log))
        .layer(from_fn(crate::middleware::auth::require_god))
}

/// Graceful shutdown signal handler
async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("🛑 Shutdown signal received, starting graceful shutdown");
}
