# 📤 Substrate Upload Steps - FileZilla

**You're connected!** Now follow these steps to upload the substrate directory.

---

## 📂 Step 1: Navigate to Directories

### Left Panel (Local - Your Computer):
1. Navigate to: `X:\Demiurge-Blockchain\substrate`
2. You should see folders like:
   - `frame/`
   - `primitives/`
   - `client/`
   - `runtime/`
   - etc.

### Right Panel (Remote - Server):
1. Navigate to: `/opt/demiurge-blockchain/substrate`
2. If the directory is empty or doesn't exist:
   - Right-click in the remote panel
   - Select "Create directory"
   - Name it: `substrate`
   - Double-click to enter it

---

## 🚫 Step 2: Exclude Build Files (IMPORTANT!)

**This will save hours of transfer time!**

1. In FileZilla, press `Ctrl+I` (or go to **View → Filename filters**)
2. Click the "Filter sets" dropdown → Select "Local directory" or "Remote directory"
3. Click "Edit filter sets"
4. Add these filters (one per line):
   ```
   target
   .git
   *.lock
   Cargo.lock
   ```
5. Make sure "Enable" is checked
6. Click "OK"

**Result**: FileZilla will hide `target/` directories and other build artifacts, making the transfer much faster.

---

## 📤 Step 3: Upload Substrate

1. **In the LEFT panel** (local), select all files and folders in `substrate`
   - Press `Ctrl+A` to select all
   - Or manually select: `frame/`, `primitives/`, `client/`, etc.

2. **Right-click** on the selected items

3. **Select "Upload"**

4. **Wait for transfer to complete**
   - This may take **10-30 minutes** depending on:
     - Your internet speed
     - Whether you excluded `target/` directories
   - You can see progress in the bottom panel

---

## ✅ Step 4: Verify Upload

After upload completes, verify the substrate directory:

**Check if key files exist:**
```bash
ssh pleroma "ls -la /opt/demiurge-blockchain/substrate/frame/benchmarking/"
```

**Check directory size:**
```bash
ssh pleroma "du -sh /opt/demiurge-blockchain/substrate"
```

**Expected results:**
- Should see `Cargo.toml` in the `frame/benchmarking/` directory
- Directory size should be **several GB** (not just 4KB)

---

## 🔨 Step 5: Build Blockchain Node

Once verified, build the blockchain node:

```bash
ssh pleroma "cd /opt/demiurge-blockchain/docker && \
POSTGRES_PASSWORD=demiurge_temp_pass \
JWT_ACCESS_SECRET=temp_access_secret \
JWT_REFRESH_SECRET=temp_refresh_secret \
docker compose -f docker-compose.production.yml build demiurge-node"
```

---

## 💡 Tips During Upload

- **Monitor Progress**: Check the bottom panel in FileZilla for transfer status
- **Resume if Interrupted**: FileZilla can resume failed transfers
- **Don't Close**: Keep FileZilla open until transfer completes
- **Check Queue**: View → Queue to see pending transfers

---

**Once the upload completes, let me know and I'll verify and start the build!**
