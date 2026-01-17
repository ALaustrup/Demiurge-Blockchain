//! Profile management handlers.

use axum::{
    extract::{Multipart, Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;
use sha2::{Sha256, Digest};
use hex;
use base64::engine::general_purpose;
use base64::Engine;

use crate::error::{AppError, AppResult};
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
    mut multipart: Multipart,
) -> AppResult<Json<Value>> {
    // TODO: Extract user from auth middleware
    // For now, we'll use the qor_id from the form data

    let mut avatar_data: Option<Vec<u8>> = None;
    let mut qor_id: Option<String> = None;

    // Parse multipart form data
    while let Some(field) = multipart.next_field().await
        .map_err(|e| AppError::ValidationError(format!("Failed to parse multipart: {}", e)))?
    {
        let name = field.name().unwrap_or("");
        
        match name {
            "avatar" => {
                let data = field.bytes().await
                    .map_err(|e| AppError::ValidationError(format!("Failed to read avatar data: {}", e)))?;
                
                // Validate file size (max 5MB)
                if data.len() > 5 * 1024 * 1024 {
                    return Err(AppError::ValidationError("Avatar file too large (max 5MB)".to_string()));
                }
                
                // Validate file type (check magic bytes)
                if data.len() < 4 {
                    return Err(AppError::ValidationError("Invalid image file".to_string()));
                }
                
                let magic = &data[0..4];
                let is_valid_image = magic == b"\x89PNG" // PNG
                    || magic == [0xFF, 0xD8, 0xFF, 0xE0] // JPEG
                    || magic == [0xFF, 0xD8, 0xFF, 0xE1] // JPEG
                    || magic == [0x47, 0x49, 0x46, 0x38]; // GIF
                
                if !is_valid_image {
                    return Err(AppError::ValidationError("Invalid image format. Only PNG, JPEG, and GIF are supported".to_string()));
                }
                
                avatar_data = Some(data.to_vec());
            }
            "qor_id" => {
                let text = field.text().await
                    .map_err(|e| AppError::ValidationError(format!("Failed to read qor_id: {}", e)))?;
                qor_id = Some(text);
            }
            _ => {}
        }
    }

    let avatar_bytes = avatar_data.ok_or_else(|| 
        AppError::ValidationError("Missing avatar file".to_string())
    )?;

    // Generate hash for filename
    let mut hasher = Sha256::new();
    hasher.update(&avatar_bytes);
    hasher.update(qor_id.as_deref().unwrap_or("").as_bytes());
    let hash = hex::encode(hasher.finalize());
    let _filename = format!("{}.png", &hash[..16]); // Use first 16 chars of hash

    // Detect MIME type from magic bytes (before encoding)
    let mime_type = if avatar_bytes.len() >= 4 {
        match &avatar_bytes[0..4] {
            b"\x89PNG" => "image/png",
            [0xFF, 0xD8, 0xFF, 0xE0] | [0xFF, 0xD8, 0xFF, 0xE1] => "image/jpeg",
            [0x47, 0x49, 0x46, 0x38] => "image/gif",
            _ => "image/png", // Default
        }
    } else {
        "image/png"
    };
    
    // For now, store as base64 data URL
    // In production, upload to IPFS or object storage (S3, etc.)
    let base64_data = general_purpose::STANDARD.encode(&avatar_bytes);
    let avatar_url = format!("data:{};base64,{}", mime_type, base64_data);

    // TODO: Update user record in database
    // For now, return the data URL
    // In production, you would:
    // 1. Upload to IPFS/S3
    // 2. Get the IPFS hash or S3 URL
    // 3. Update the user's avatar_url in the database
    // 4. Return the URL

    Ok(Json(json!({
        "avatar_url": avatar_url,
        "message": "Avatar uploaded successfully. Minting as DRC-369 NFT..."
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
