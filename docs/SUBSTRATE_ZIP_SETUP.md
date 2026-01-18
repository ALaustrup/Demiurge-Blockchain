# 📦 Setting Up Substrate from ZIP File

If you've downloaded Substrate as a ZIP file instead of cloning via Git, follow these steps:

## Quick Setup

### Option 1: Using the Setup Script (Recommended)

```powershell
cd x:\Demiurge-Blockchain
.\scripts\setup-substrate-from-zip.ps1 -ZipPath "C:\path\to\substrate.zip"
```

Replace `C:\path\to\substrate.zip` with the actual path to your ZIP file.

### Option 2: Manual Setup

1. **Extract the ZIP** to: `x:\Demiurge-Blockchain\substrate`
   - The final path should be: `x:\Demiurge-Blockchain\substrate\`
   - Make sure it's directly in the `substrate` folder, not `substrate\substrate-main\`

2. **Verify Git Repository**
   ```powershell
   cd x:\Demiurge-Blockchain\substrate
   git status
   ```
   
   If not a Git repo, initialize it:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit from ZIP"
   ```

3. **Set Up Remotes**
   ```powershell
   git remote add origin https://github.com/ALaustrup/substrate.git
   git remote add upstream https://github.com/paritytech/substrate.git
   git fetch upstream
   ```

4. **Create Fix Branch**
   ```powershell
   git checkout -b fix/librocksdb-sys-conflict upstream/master
   ```

5. **Apply the Fix**
   ```powershell
   cd x:\Demiurge-Blockchain
   .\scripts\apply-substrate-fix-in-fork.ps1
   ```

## Directory Structure

After setup, your structure should look like:

```
x:\Demiurge-Blockchain\
├── blockchain\
├── substrate\          ← Substrate repository goes here
│   ├── .git\
│   ├── client\
│   │   └── cli\
│   │       └── Cargo.toml  ← This file gets modified
│   ├── Cargo.toml
│   └── ...
├── scripts\
└── ...
```

## Important Notes

- **Location**: The `substrate` folder must be at the **root** of `Demiurge-Blockchain`
- **Git Required**: The scripts expect a Git repository (for remotes and branches)
- **If ZIP has no Git**: The setup script will initialize Git for you

## Troubleshooting

### "Substrate directory already exists"
- Remove it first: `Remove-Item -Recurse -Force substrate`
- Or use the script's prompt to overwrite

### "Not a Git repository"
- The setup script will initialize Git automatically
- Or run `git init` manually in the substrate directory

### "Could not find substrate directory in ZIP"
- The ZIP might have a different structure
- Extract manually and ensure the path is: `x:\Demiurge-Blockchain\substrate\`

## After Setup

Once the ZIP is extracted and set up:

1. ✅ Run: `.\scripts\apply-substrate-fix-in-fork.ps1`
2. ✅ Test: `cd substrate; cargo build -p sc-cli`
3. ✅ Commit: `git add client/cli/Cargo.toml; git commit -m "fix: ..."`
4. ✅ Push: `git push origin fix/librocksdb-sys-conflict`
5. ✅ Apply to Demiurge: `.\scripts\apply-substrate-fix.ps1`

---

**Prefer Git Clone?** If you have the fork on GitHub, use:
```powershell
.\scripts\fork-substrate.ps1
```
