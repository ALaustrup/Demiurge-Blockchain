# 📁 FileZilla Setup Guide - Substrate Sync

**Purpose**: Sync the `substrate/` directory from your local machine to the server for Docker builds.

---

## 🔧 Step 1: Configure FileZilla Connection

1. **Open FileZilla** (FileZilla Client)

2. **Click "File" → "Site Manager"** (or press `Ctrl+S`)

3. **Click "New Site"** and name it: `Demiurge Server`

4. **Configure the connection:**
   ```
   Protocol:        SFTP - SSH File Transfer Protocol
   Host:            pleroma (or 51.210.209.112)
   Port:            22
   Logon Type:      Normal
   User:            ubuntu (or your SSH username)
   Password:        [Your SSH password - leave blank if using key auth]
   ```

5. **For SSH Key Authentication** (recommended):
   - Click "Advanced" tab
   - Under "SSH key file", browse to your private key file (usually `~/.ssh/id_rsa` or similar)
   - Leave password blank

6. **Click "Connect"**

---

## 📂 Step 2: Navigate to Directories

### Local Side (Left Panel):
- Navigate to: `X:\Demiurge-Blockchain\substrate`
- You should see folders like: `frame/`, `primitives/`, `client/`, etc.

### Remote Side (Right Panel):
- Navigate to: `/opt/demiurge-blockchain/substrate`
- If the directory doesn't exist, create it:
  - Right-click in the remote panel → "Create directory" → Name: `substrate`
  - Then navigate into it

---

## 🚀 Step 3: Sync Substrate Directory

### Option A: Copy Everything (Simple but includes build artifacts)

1. **Select all files/folders** in the local `substrate` directory (Ctrl+A)
2. **Right-click → Upload**
3. **Wait for transfer to complete** (this may take 10-30 minutes depending on size)

### Option B: Selective Copy (Recommended - Excludes build artifacts)

**Before uploading, exclude these in FileZilla:**

1. **Go to "View" → "Filename filters"** (or press `Ctrl+I`)
2. **Add filters to exclude:**
   ```
   target
   .git
   *.lock
   Cargo.lock
   ```
3. **Apply the filter**
4. **Select visible files/folders** and upload

**Or manually exclude:**
- Don't upload `target/` directories (build artifacts - very large)
- Don't upload `.git/` directory
- Don't upload `*.lock` files

---

## ✅ Step 4: Verify Sync

After upload completes, verify on the server:

```bash
ssh pleroma "ls -la /opt/demiurge-blockchain/substrate/frame/benchmarking/"
```

You should see `Cargo.toml` in that directory.

**Check directory size:**
```bash
ssh pleroma "du -sh /opt/demiurge-blockchain/substrate"
```

Should be several GB (not just 4KB).

---

## 🔨 Step 5: Build Blockchain Node

Once substrate is synced, build the node:

```bash
ssh pleroma "cd /opt/demiurge-blockchain/docker && \
POSTGRES_PASSWORD=demiurge_temp_pass \
JWT_ACCESS_SECRET=temp_access_secret \
JWT_REFRESH_SECRET=temp_refresh_secret \
docker compose -f docker-compose.production.yml build demiurge-node"
```

---

## 💡 Tips

1. **Use Queue**: FileZilla can queue transfers if connection drops
2. **Resume**: If transfer fails, you can resume from where it stopped
3. **Speed**: The transfer may be slow - be patient
4. **Exclude target/**: Saves significant time and space (target directories are huge)
5. **Check Logs**: View → "Message Log" to see transfer progress

---

## 🐛 Troubleshooting

**Connection Refused:**
- Verify SSH is enabled on server
- Check firewall allows port 22
- Try using IP address instead of hostname

**Permission Denied:**
- Ensure you have write access to `/opt/demiurge-blockchain/`
- May need to use `sudo` or change ownership

**Transfer Slow:**
- Normal for large directories
- Consider excluding `target/` directories
- Use compression if available in FileZilla settings

---

**Once substrate is synced, the blockchain node Docker build should work!**
