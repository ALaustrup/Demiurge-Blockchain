//! Agent management handlers.
//! 
//! Endpoints for registering and managing AI agents.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use rand::Rng;
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::{
    AgentInfo, AgentRegistrationResponse, RegisterAgentRequest,
    UpdateAgentCapabilitiesRequest,
};
use crate::services::auth_service::AuthService;
use crate::state::AppState;

/// Valid agent capabilities
const VALID_CAPABILITIES: &[&str] = &[
    "read",      // Read blockchain data
    "analyze",   // Analyze patterns
    "trade",     // Execute trades
    "transfer",  // Transfer CGT
    "bounty",    // Submit bounty bids
    "nft",       // Interact with NFTs
    "vote",      // Participate in governance
    "stake",     // Staking operations
];

/// Validate agent capabilities
fn validate_capabilities(capabilities: &[String]) -> Result<(), AppError> {
    for cap in capabilities {
        if !VALID_CAPABILITIES.contains(&cap.as_str()) {
            return Err(AppError::ValidationError(format!(
                "Invalid capability '{}'. Valid options: {:?}",
                cap, VALID_CAPABILITIES
            )));
        }
    }
    Ok(())
}

/// Validate autonomy level
fn validate_autonomy(autonomy: &str) -> Result<(), AppError> {
    match autonomy {
        "supervised" | "bounded" | "autonomous" | "sovereign" => Ok(()),
        _ => Err(AppError::ValidationError(
            "Autonomy must be: supervised, bounded, autonomous, or sovereign".into(),
        )),
    }
}

/// Generate agent DID
fn generate_agent_did() -> String {
    let random_bytes: [u8; 16] = rand::thread_rng().gen();
    format!("did:demiurge:agent:mainnet:{}", hex::encode(random_bytes))
}

/// Register a new AI agent
/// POST /api/v1/agents/register
/// 
/// Requires authentication - creates an agent owned by the authenticated user.
pub async fn register_agent(
    State(state): State<Arc<AppState>>,
    // TODO: Extract user from JWT middleware - for now placeholder
    Json(req): Json<RegisterAgentRequest>,
) -> AppResult<(StatusCode, Json<AgentRegistrationResponse>)> {
    // Validate input
    if req.name.len() < 3 || req.name.len() > 32 {
        return Err(AppError::ValidationError(
            "Agent name must be 3-32 characters".into(),
        ));
    }
    
    validate_capabilities(&req.capabilities)?;
    validate_autonomy(&req.autonomy)?;
    
    // Bounded agents require spending limit
    if req.autonomy == "bounded" && req.spending_limit.is_none() {
        return Err(AppError::ValidationError(
            "Bounded agents require a spending_limit".into(),
        ));
    }
    
    let auth_service = AuthService::new(state.db.clone());
    
    // Generate agent identity
    let agent_name = format!("agent_{}", req.name.to_lowercase().replace(' ', "_"));
    let discriminator = auth_service.generate_discriminator(&agent_name).await?;
    let agent_did = generate_agent_did();
    
    // Generate keypair for agent
    let private_key: [u8; 32] = rand::thread_rng().gen();
    let pubkey = hex::encode(&private_key[..32]); // Simplified - real impl would derive properly
    let on_chain_address = format!("0x{}", &pubkey[0..40]);
    
    // Placeholder password hash (agents don't use password auth)
    let password_hash = AuthService::hash_password(&hex::encode(private_key))?;
    
    // TODO: Get controller_id from JWT claims
    // For now, we'll create without a controller (needs auth middleware integration)
    let controller_id: Option<Uuid> = None;
    
    let capabilities_json = serde_json::to_value(&req.capabilities)
        .map_err(|_| AppError::ValidationError("Invalid capabilities".into()))?;
    
    // Insert agent
    let agent_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO users (
            username, discriminator, password_hash,
            email_verified, role, status,
            primary_pubkey, auth_method, on_chain_address,
            account_type, controller_id, agent_did,
            agent_capabilities, agent_autonomy, agent_spending_limit, agent_model
        )
        VALUES ($1, $2, $3, TRUE, 'user', 'active', $4, 'keypair', $5,
                'agent', $6, $7, $8, $9, $10, $11)
        RETURNING id
        "#,
    )
    .bind(&agent_name)
    .bind(discriminator)
    .bind(&password_hash)
    .bind(&pubkey)
    .bind(&on_chain_address)
    .bind(controller_id)
    .bind(&agent_did)
    .bind(&capabilities_json)
    .bind(&req.autonomy)
    .bind(req.spending_limit)
    .bind(&req.model)
    .fetch_one(&state.db)
    .await?;
    
    Ok((
        StatusCode::CREATED,
        Json(AgentRegistrationResponse {
            agent_id,
            qor_id: format!("{}#{:04}", agent_name, discriminator),
            did: agent_did,
            pubkey,
            on_chain_address,
            capabilities: req.capabilities,
            autonomy: req.autonomy,
        }),
    ))
}

/// Get agent info by DID
/// GET /api/v1/agents/:did
pub async fn get_agent(
    State(state): State<Arc<AppState>>,
    Path(did): Path<String>,
) -> AppResult<Json<AgentInfo>> {
    let agent: Option<crate::models::User> = sqlx::query_as(
        "SELECT * FROM users WHERE agent_did = $1 AND account_type = 'agent'",
    )
    .bind(&did)
    .fetch_optional(&state.db)
    .await?;
    
    let agent = agent.ok_or(AppError::NotFound("Agent not found".into()))?;
    
    let capabilities: Vec<String> = agent
        .agent_capabilities
        .as_ref()
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();
    
    Ok(Json(AgentInfo {
        id: agent.id,
        qor_id: agent.qor_id(),
        did: agent.agent_did.unwrap_or_default(),
        pubkey: agent.primary_pubkey,
        on_chain_address: agent.on_chain_address,
        capabilities,
        autonomy: agent.agent_autonomy.unwrap_or_else(|| "supervised".to_string()),
        spending_limit: agent.agent_spending_limit,
        model: agent.agent_model,
        status: format!("{:?}", agent.status).to_lowercase(),
        controller_id: agent.controller_id.unwrap_or(Uuid::nil()),
        created_at: agent.created_at,
    }))
}

/// List agents for the authenticated user
/// GET /api/v1/agents
pub async fn list_agents(
    State(state): State<Arc<AppState>>,
    // TODO: Extract user from JWT middleware
) -> AppResult<Json<Vec<AgentInfo>>> {
    // For now, list all agents (needs auth integration for filtering by controller)
    let agents: Vec<crate::models::User> = sqlx::query_as(
        "SELECT * FROM users WHERE account_type = 'agent' ORDER BY created_at DESC LIMIT 100",
    )
    .fetch_all(&state.db)
    .await?;
    
    let agent_infos: Vec<AgentInfo> = agents
        .into_iter()
        .map(|agent| {
            let capabilities: Vec<String> = agent
                .agent_capabilities
                .as_ref()
                .and_then(|v| serde_json::from_value(v.clone()).ok())
                .unwrap_or_default();
            
            AgentInfo {
                id: agent.id,
                qor_id: agent.qor_id(),
                did: agent.agent_did.unwrap_or_default(),
                pubkey: agent.primary_pubkey,
                on_chain_address: agent.on_chain_address,
                capabilities,
                autonomy: agent.agent_autonomy.unwrap_or_else(|| "supervised".to_string()),
                spending_limit: agent.agent_spending_limit,
                model: agent.agent_model,
                status: format!("{:?}", agent.status).to_lowercase(),
                controller_id: agent.controller_id.unwrap_or(Uuid::nil()),
                created_at: agent.created_at,
            }
        })
        .collect();
    
    Ok(Json(agent_infos))
}

/// Update agent capabilities
/// PUT /api/v1/agents/:did/capabilities
pub async fn update_capabilities(
    State(state): State<Arc<AppState>>,
    Path(did): Path<String>,
    Json(req): Json<UpdateAgentCapabilitiesRequest>,
) -> AppResult<Json<Value>> {
    validate_capabilities(&req.capabilities)?;
    
    let capabilities_json = serde_json::to_value(&req.capabilities)
        .map_err(|_| AppError::ValidationError("Invalid capabilities".into()))?;
    
    let result = sqlx::query(
        "UPDATE users SET agent_capabilities = $1, updated_at = NOW() WHERE agent_did = $2 AND account_type = 'agent'",
    )
    .bind(&capabilities_json)
    .bind(&did)
    .execute(&state.db)
    .await?;
    
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Agent not found".into()));
    }
    
    Ok(Json(json!({
        "did": did,
        "capabilities": req.capabilities,
        "message": "Capabilities updated successfully"
    })))
}

/// Deactivate an agent
/// DELETE /api/v1/agents/:did
pub async fn deactivate_agent(
    State(state): State<Arc<AppState>>,
    Path(did): Path<String>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query(
        "UPDATE users SET status = 'inactive', updated_at = NOW() WHERE agent_did = $1 AND account_type = 'agent'",
    )
    .bind(&did)
    .execute(&state.db)
    .await?;
    
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Agent not found".into()));
    }
    
    Ok(Json(json!({
        "did": did,
        "status": "inactive",
        "message": "Agent deactivated successfully"
    })))
}
