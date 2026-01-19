# 📦 Substrate Directory Sync Instructions

The blockchain node requires the Substrate fork directory to build. Since it's excluded from git (due to size), it needs to be synced manually to the server.

---

## ✅ Current Status

- ✅ Substrate folder exists locally
- ✅ Docker configuration updated to use local Substrate paths
- ⚠️ Substrate directory needs to be synced to server

---

## 🚀 Sync Methods

### Option 1: Using rsync (Recommended - Efficient)

**On Windows (PowerShell):**
```powershell
# Install rsync if needed (via WSL or Git Bash)
# Then run:
rsync -avz --progress `
    --exclude='target/' `
    --exclude='.git/' `
    --exclude='*.lock' `
    --exclude='Cargo.lock' `
    substrate/ `
    pleroma:/opt/demiurge-blockchain/substrate/
```

**On Linux/Mac:**
```bash
rsync -avz --progress \
    --exclude='target/' \
    --exclude='.git/' \
    --exclude='*.lock' \
    --exclude='Cargo.lock' \
    substrate/ \
    pleroma:/opt/demiurge-blockchain/substrate/
```

### Option 2: Using tar + ssh (Works on Windows)

**PowerShell:**
```powershell
# Compress and transfer
tar czf - --exclude='target' --exclude='.git' --exclude='*.lock' substrate | ssh pleroma "cd /opt/demiurge-blockchain && tar xzf -"
```

**Bash:**
```bash
tar czf - --exclude='target' --exclude='.git' --exclude='*.lock' substrate | ssh pleroma "cd /opt/demiurge-blockchain && tar xzf -"
```

### Option 3: Using scp (Simple but slower)

```bash
scp -r --exclude='target' --exclude='.git' substrate pleroma:/opt/demiurge-blockchain/
```

---

## ✅ Verification

After syncing, verify the substrate directory:

```bash
ssh pleroma "ls -la /opt/demiurge-blockchain/substrate/frame/benchmarking/"
```

You should see `Cargo.toml` in that directory.

---

## 🔨 Build After Sync

Once substrate is synced:

```bash
ssh pleroma "cd /opt/demiurge-blockchain/docker && \
POSTGRES_PASSWORD=demiurge_temp_pass \
JWT_ACCESS_SECRET=temp_access_secret \
JWT_REFRESH_SECRET=temp_refresh_secret \
docker compose -f docker-compose.production.yml build demiurge-node"
```

---

## 📋 Notes

- The substrate directory is large (several GB), so sync may take time
- Exclude `target/` directories to save space and time
- The Docker build will copy substrate into the image during build

---

**After syncing substrate, the blockchain node should build successfully!**
