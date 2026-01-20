# 📂 FileZilla Navigation Guide - Finding /opt Directory

**Issue**: Can't see `/opt` directory in FileZilla

---

## 🔍 How to Navigate to /opt in FileZilla

### Step 1: Start from Root Directory

In FileZilla's **RIGHT panel** (Remote/Server side):

1. **Click in the path bar** at the top of the right panel
2. **Type**: `/` and press Enter
   - This takes you to the root directory
3. **You should now see** folders like:
   - `bin/`
   - `boot/`
   - `dev/`
   - `etc/`
   - `home/`
   - `opt/` ← **This is what you need!**
   - `usr/`
   - `var/`
   - etc.

### Step 2: Navigate to /opt/demiurge-blockchain/substrate

1. **Double-click** the `opt/` folder
2. **Double-click** the `demiurge-blockchain/` folder
3. **Double-click** the `substrate/` folder (or create it if it doesn't exist)

**Full path**: `/opt/demiurge-blockchain/substrate`

---

## 🎯 Alternative: Use Quick Connect Path

**In FileZilla's right panel path bar**, you can directly type:

```
/opt/demiurge-blockchain/substrate
```

Then press Enter - FileZilla will navigate there directly.

---

## 📋 Visual Guide

```
FileZilla Right Panel (Remote):
┌─────────────────────────────────┐
│ Path: /opt/demiurge-blockchain │ ← Type here or navigate
├─────────────────────────────────┤
│ 📁 substrate/                   │ ← Upload destination
│ 📁 .git/                        │
│ 📁 apps/                        │
│ 📁 blockchain/                  │
│ ...                             │
└─────────────────────────────────┘
```

---

## ✅ Quick Check

**To verify you're in the right place:**

1. Right-click in the remote panel
2. Select "Create directory"
3. If you can create directories, you're in the right location
4. The path bar should show: `/opt/demiurge-blockchain/substrate`

---

## 🚨 If /opt Still Doesn't Appear

**Option 1: Check Permissions**
- You might not have permission to see `/opt`
- Try navigating to `/home/ubuntu/` first, then use the path bar to go to `/opt`

**Option 2: Use Absolute Path**
- In the path bar, type: `/opt/demiurge-blockchain/substrate`
- Press Enter

**Option 3: Verify via SSH**
```bash
ssh pleroma "ls -la /opt/demiurge-blockchain/"
```

If this works, the directory exists and FileZilla should be able to access it.

---

**Once you're in `/opt/demiurge-blockchain/substrate`, you're ready to upload!**
