@echo off
REM Simple build script - just works
cd blockchain
cargo build --release --bin demiurge-node
pause
