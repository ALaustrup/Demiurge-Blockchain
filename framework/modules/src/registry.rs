//! Module registry - manages all loaded modules

use std::collections::HashMap;
use crate::traits::{Module, ModuleError};
use demiurge_storage::Storage;
use thiserror::Error;

pub struct ModuleRegistry {
    modules: HashMap<String, Box<dyn Module>>,
}

impl ModuleRegistry {
    pub fn new() -> Self {
        Self {
            modules: HashMap::new(),
        }
    }

    pub fn register<M: Module + 'static>(&mut self, module: M) {
        self.modules.insert(M::name().to_string(), Box::new(module));
    }

    pub fn execute(
        &self,
        module_name: &str,
        call: Vec<u8>,
        storage: &mut dyn Storage,
    ) -> Result<(), RegistryError> {
        let module = self.modules
            .get(module_name)
            .ok_or_else(|| RegistryError::ModuleNotFound(module_name.to_string()))?;

        // Need mutable reference - this is a design issue we'll fix
        // For now, return error
        Err(RegistryError::ExecutionError("Module execution not yet implemented".to_string()))
    }
}

#[derive(Error, Debug)]
pub enum RegistryError {
    #[error("Module not found: {0}")]
    ModuleNotFound(String),
    #[error("Execution error: {0}")]
    ExecutionError(String),
}
