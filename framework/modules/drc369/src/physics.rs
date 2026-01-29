//! Physics-Ready Metadata for DRC-369
//!
//! Standardized physics properties ensure consistent behavior across all game engines.
//! Physics data is stored as JSON and serialized to bytes for on-chain storage.

use serde::{Deserialize, Serialize};
use crate::error::{Drc369Error, Result};

/// Rigid body properties for physics simulation
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct RigidBodyProperties {
    /// Mass in kilograms
    pub mass_kg: f32,
    
    /// Center of mass offset from origin [x, y, z]
    #[serde(default)]
    pub center_of_mass: [f32; 3],
    
    /// Collision shape for physics
    #[serde(default)]
    pub collision_shape: CollisionShape,
    
    /// Whether the body is static (immovable)
    #[serde(default)]
    pub is_static: bool,
    
    /// Linear damping (air resistance)
    #[serde(default)]
    pub linear_damping: f32,
    
    /// Gravity scale (1.0 = normal, 0.0 = no gravity)
    #[serde(default = "default_gravity_scale")]
    pub gravity_scale: f32,
}

fn default_gravity_scale() -> f32 { 1.0 }

/// Collision shape types
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum CollisionShape {
    Box { half_extents: [f32; 3] },
    Sphere { radius: f32 },
    Capsule { radius: f32, height: f32 },
    ConvexHull { mesh_uri: String },
}

impl Default for CollisionShape {
    fn default() -> Self {
        Self::Box { half_extents: [0.5, 0.5, 0.5] }
    }
}

/// Physical material properties
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct MaterialPhysics {
    /// Static friction coefficient
    #[serde(default)]
    pub static_friction: f32,
    
    /// Dynamic friction coefficient  
    #[serde(default)]
    pub dynamic_friction: f32,
    
    /// Coefficient of restitution (bounciness) 0-1
    #[serde(default)]
    pub restitution: f32,
    
    /// Density in kg/m³
    pub density_kg_m3: Option<f32>,
    
    /// Material preset
    pub preset: Option<MaterialPreset>,
}

/// Common material presets
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum MaterialPreset {
    Wood, Metal, Stone, Glass, Rubber, Ice, Flesh, Cloth, Water, Custom,
}

impl MaterialPreset {
    pub fn default_physics(&self) -> MaterialPhysics {
        match self {
            Self::Metal => MaterialPhysics {
                static_friction: 0.6,
                dynamic_friction: 0.4,
                restitution: 0.2,
                density_kg_m3: Some(7850.0),
                preset: Some(Self::Metal),
            },
            Self::Wood => MaterialPhysics {
                static_friction: 0.5,
                dynamic_friction: 0.4,
                restitution: 0.3,
                density_kg_m3: Some(600.0),
                preset: Some(Self::Wood),
            },
            _ => MaterialPhysics::default(),
        }
    }
}

/// Thermal physics properties
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ThermalProperties {
    pub conductivity_w_mk: Option<f32>,
    pub melting_point_k: Option<f32>,
    pub flammable: bool,
}

/// Destruction/damage properties
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct DestructionProperties {
    pub destructible: bool,
    pub health: Option<f32>,
    pub max_health: Option<f32>,
    pub break_force_n: Option<f32>,
    pub debris_assets: Vec<String>,
}

/// Damage types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum DamageType {
    Physical, Fire, Ice, Lightning, Poison, Magic, Custom(String),
}

/// Fluid interaction properties
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct FluidInteraction {
    pub buoyant: bool,
    pub drag_coefficient: f32,
}

/// Complete physics properties for a DRC-369 asset
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct PhysicsProperties {
    pub rigid_body: Option<RigidBodyProperties>,
    pub material: Option<MaterialPhysics>,
    pub thermal: Option<ThermalProperties>,
    pub destruction: Option<DestructionProperties>,
    pub fluid: Option<FluidInteraction>,
    #[serde(default)]
    pub physics_layer: u32,
    #[serde(default)]
    pub physics_tags: Vec<String>,
}

impl PhysicsProperties {
    /// Create physics for a simple box
    pub fn simple_box(mass_kg: f32, half_extents: [f32; 3]) -> Self {
        Self {
            rigid_body: Some(RigidBodyProperties {
                mass_kg,
                collision_shape: CollisionShape::Box { half_extents },
                ..Default::default()
            }),
            material: Some(MaterialPreset::Wood.default_physics()),
            ..Default::default()
        }
    }
    
    /// Validate the physics properties
    pub fn validate(&self) -> Result<()> {
        if let Some(rb) = &self.rigid_body {
            if rb.mass_kg < 0.0 {
                return Err(Drc369Error::PhysicsValidationFailed("Mass cannot be negative".to_string()));
            }
        }
        if let Some(mat) = &self.material {
            if mat.restitution < 0.0 || mat.restitution > 1.0 {
                return Err(Drc369Error::PhysicsValidationFailed("Restitution must be 0-1".to_string()));
            }
        }
        Ok(())
    }
    
    /// Serialize to JSON bytes for on-chain storage
    pub fn to_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(self).unwrap_or_default()
    }
    
    /// Deserialize from JSON bytes
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        serde_json::from_slice(bytes).ok()
    }
    
    /// Convert to JSON-LD format
    pub fn to_json_ld(&self) -> serde_json::Value {
        serde_json::json!({
            "@context": "https://demiurge.io/physics/v1",
            "@type": "drc:PhysicsProperties",
            "rigidBody": self.rigid_body,
            "material": self.material,
            "thermal": self.thermal,
            "destruction": self.destruction,
            "fluid": self.fluid,
        })
    }
}

/// Storage key prefix for physics data
pub const PHYSICS_STATE_PREFIX: &[u8] = b"DRC369:Physics:";

/// Get storage key for NFT physics
pub fn physics_key(nft_id: &[u8; 32]) -> Vec<u8> {
    let mut key = PHYSICS_STATE_PREFIX.to_vec();
    key.extend_from_slice(nft_id);
    key
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_physics_validation() {
        let mut props = PhysicsProperties::simple_box(1.0, [0.5, 0.5, 0.5]);
        assert!(props.validate().is_ok());
        
        props.rigid_body.as_mut().unwrap().mass_kg = -1.0;
        assert!(props.validate().is_err());
    }
    
    #[test]
    fn test_serialization() {
        let props = PhysicsProperties::simple_box(2.5, [1.0, 0.5, 0.3]);
        let bytes = props.to_bytes();
        let restored = PhysicsProperties::from_bytes(&bytes).unwrap();
        assert_eq!(restored.rigid_body.unwrap().mass_kg, 2.5);
    }
}
