//! Command execution logic.

use crate::chain_spec;
use crate::cli::{Cli, Subcommand};
use crate::service;
use sc_cli::SubstrateCli;

impl SubstrateCli for Cli {
    fn impl_name() -> String {
        "Demiurge Node".into()
    }

    fn impl_version() -> String {
        env!("SUBSTRATE_CLI_IMPL_VERSION").into()
    }

    fn description() -> String {
        "Demiurge Blockchain - The Pleroma Network\n\n\
        A Substrate-based blockchain powering the Demiurge Ecosystem with:\n\
        • Creator God Token (CGT) - Native currency\n\
        • Qor ID - Non-dual identity system\n\
        • Unreal Engine 5 integration ready"
            .into()
    }

    fn author() -> String {
        env!("CARGO_PKG_AUTHORS").into()
    }

    fn support_url() -> String {
        "https://github.com/ALaustrup/Demiurge-Blockchain/issues".into()
    }

    fn copyright_start_year() -> i32 {
        2026
    }

    fn load_spec(&self, id: &str) -> Result<Box<dyn sc_service::ChainSpec>, String> {
        Ok(match id {
            "" | "dev" | "development" => Box::new(chain_spec::development_config()?),
            "local" | "local_testnet" => Box::new(chain_spec::local_testnet_config()?),
            "demiurge" | "demiurge-testnet" => Box::new(chain_spec::demiurge_testnet_config()?),
            path => Box::new(chain_spec::ChainSpec::from_json_file(
                std::path::PathBuf::from(path),
            )?),
        })
    }
}

/// Parse and run command
pub fn run() -> sc_cli::Result<()> {
    let cli = Cli::parse();

    match cli.subcommand {
        Some(Subcommand::BuildSpec(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.sync_run(|config| cmd.run(config.chain_spec, config.network))
        }
        Some(Subcommand::CheckBlock(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.async_run(|config| {
                let (client, _, import_queue, task_manager) = service::new_chain_ops(&config)?;
                Ok((cmd.run(client, import_queue), task_manager))
            })
        }
        Some(Subcommand::ExportBlocks(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.async_run(|config| {
                let (client, _, _, task_manager) = service::new_chain_ops(&config)?;
                Ok((cmd.run(client, config.database), task_manager))
            })
        }
        Some(Subcommand::ExportState(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.async_run(|config| {
                let (client, _, _, task_manager) = service::new_chain_ops(&config)?;
                Ok((cmd.run(client, config.chain_spec), task_manager))
            })
        }
        Some(Subcommand::ImportBlocks(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.async_run(|config| {
                let (client, _, import_queue, task_manager) = service::new_chain_ops(&config)?;
                Ok((cmd.run(client, import_queue), task_manager))
            })
        }
        Some(Subcommand::PurgeChain(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.sync_run(|config| cmd.run(config.database))
        }
        Some(Subcommand::Revert(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.async_run(|config| {
                let (client, backend, _, task_manager) = service::new_chain_ops(&config)?;
                let aux_revert = Box::pin(async { Ok(()) });
                Ok((cmd.run(client, backend, Some(aux_revert)), task_manager))
            })
        }
        Some(Subcommand::Key(cmd)) => cmd.run(&cli),
        Some(Subcommand::Sign(cmd)) => cmd.run(),
        Some(Subcommand::Verify(cmd)) => cmd.run(),
        Some(Subcommand::Vanity(cmd)) => cmd.run(),
        Some(Subcommand::ChainInfo(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.sync_run(|config| cmd.run::<service::Block>(&config))
        }
        #[cfg(feature = "runtime-benchmarks")]
        Some(Subcommand::Benchmark(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.sync_run(|config| {
                // Benchmark logic would go here
                Ok(())
            })
        }
        None => {
            let runner = cli.create_runner(&cli.run)?;
            runner.run_node_until_exit(|config| async move {
                service::new_full(config).map_err(sc_cli::Error::Service)
            })
        }
    }
}
