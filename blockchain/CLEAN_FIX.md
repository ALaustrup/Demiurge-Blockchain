# Fixing Cargo Clean Access Denied Error

## Problem
Windows file locking prevents `cargo clean` from deleting files.

## Solutions

### Option 1: Close IDEs/Editors
Close VS Code, Cursor, or any other editors that might have files open in the `target/` directory.

### Option 2: Kill Cargo Processes
```powershell
# Kill any running cargo processes
Get-Process | Where-Object {$_.ProcessName -like "*cargo*"} | Stop-Process -Force
```

### Option 3: Manual Clean (if needed)
```powershell
# Close all IDEs first, then:
Remove-Item -Recurse -Force target\debug\build\wasm-opt-cxx-sys-*
```

### Option 4: Skip Clean and Build Anyway
You can skip `cargo clean` and just run `cargo check` or `cargo build`. Cargo will rebuild what's needed.

## Recommended: Just Build
Since we've fixed the code errors, you can skip cleaning and just build:
```powershell
cd blockchain
cargo check
```

The rust-toolchain.toml file will ensure Rust 1.75.0 is used, which should fix the sp-io `#[no_mangle]` errors.
