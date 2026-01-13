# Cursor-Safe Development Workflow

## ⚠️ CRITICAL: Do NOT Run These in Cursor

These commands cause Cursor to crash or hang:
- ❌ `cargo build` / `cargo build --release`
- ❌ `cargo check` (on large projects)
- ❌ `cargo test` (on large projects)
- ❌ Any command that downloads many dependencies
- ❌ Long-running compilation processes

## ✅ Safe to Run in Cursor

- ✅ `cargo --version`
- ✅ `rustc --version`
- ✅ File editing and code review
- ✅ Git operations (`git status`, `git add`, `git commit`)
- ✅ Reading files and documentation
- ✅ Small, quick commands

## 🔧 External Terminal Workflow

### For Rust/Substrate Builds

**Use External PowerShell Terminal:**

1. Open PowerShell (outside Cursor)
2. Navigate to project:
   ```powershell
   cd x:\Demiurge-Blockchain\blockchain\node
   ```
3. Run build:
   ```powershell
   cargo build --release
   ```
4. Monitor output in that terminal
5. Return to Cursor for code editing

### For UE5 Work

**Use Unreal Editor:**

1. Open Unreal Engine 5.7.1 Launcher version
2. Open project: `x:\Demiurge-Blockchain\client\DemiurgeClient\DemiurgeClient.uproject`
3. Let Editor generate Visual Studio files if needed
4. Compile C++ modules from Editor (Build → Compile)
5. Create Blueprints in Editor
6. Return to Cursor for C++ code editing

---

## Current Status

### Node Service Build
- **Status:** Blocked by `schnorrkel` version conflict
- **Issue:** `sp-core` expects 0.9.1, but `substrate-bip39` pulls 0.11.5
- **Solution:** Needs dependency resolution (run in external terminal)
- **Action:** Defer to external build, focus on UE5 integration

### UE5 Integration
- **Status:** ✅ Ready to proceed
- **Engine:** Installed via Launcher (5.7.1)
- **Next:** Generate project files, compile C++ modules, create Blueprints

---

## Recommended Next Steps

1. **UE5 Project Setup** (in Unreal Editor)
   - Open `DemiurgeClient.uproject`
   - Generate Visual Studio project files
   - Compile C++ modules
   - Verify all modules compile

2. **Blueprint Widget Creation** (in Unreal Editor)
   - Create `WBP_QorIDLogin` Blueprint
   - Create `WBP_Wallet` Blueprint
   - Create `WBP_Inventory` Blueprint
   - Follow `docs/BLUEPRINT_UI_GUIDE.md`

3. **Node Service Build** (in External Terminal)
   - Resolve `schnorrkel` conflict
   - Build node binary
   - Test node startup

---

*Last Updated: January 12, 2026*
