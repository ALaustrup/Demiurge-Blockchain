# QOR ID System Diagnostic

**Date:** January 17, 2026  
**Issue:** QOR ID system not working

---

## ✅ Service Status

### QOR Auth Service
- **Status:** ✅ Running and Healthy
- **Container:** `demiurge-qor-auth`
- **Port:** 8080 (exposed)
- **Health Check:** ✅ Passing
- **Logs:** Only health check requests, no errors

### Nginx Proxy
- **Status:** ✅ Running
- **Routes Configured:**
  - `/api/v1/auth` → `http://qor-auth/api/v1/auth` ✅
  - `/api/v1/profile` → `http://qor-auth/api/v1/profile` ✅
  - `/api/auth` → `http://qor-auth/api/v1/auth` ✅

### Hub (Frontend)
- **Status:** ⚠️ Needs Rebuild
- **Container:** `demiurge-hub`
- **Issue:** May not have latest QOR Auth changes

---

## 🔍 Testing Results

### Backend Endpoints (Direct)
```bash
# Health check - ✅ Working
curl http://localhost:8080/health
# Response: {"service":"qor-auth","status":"healthy","version":"0.1.0"}

# Login endpoint - ✅ Reachable
curl http://localhost:8080/api/v1/auth/login -X POST
# Response: JSON parsing error (expected - needs valid payload)
```

### Frontend Endpoints (Through Nginx)
```bash
# Health check - ❌ 404 (endpoint doesn't exist under /api/v1/auth)
curl https://demiurge.cloud/api/v1/auth/health
# Response: 404

# Login endpoint - ✅ Reachable
curl https://demiurge.cloud/api/v1/auth/login -X POST
# Response: JSON parsing error (expected - needs valid payload)
```

---

## 🐛 Potential Issues

### 1. Hub Container Not Rebuilt
**Problem:** Hub container may not have latest QOR Auth SDK changes  
**Solution:** Rebuild Hub container

```bash
cd /data/Demiurge-Blockchain
docker compose -f docker/docker-compose.production.yml build hub
docker compose -f docker/docker-compose.production.yml up -d hub
```

### 2. API URL Configuration
**Problem:** Frontend might be using wrong API URL  
**Check:** Verify `NEXT_PUBLIC_QOR_AUTH_URL` environment variable

**Current Configuration:**
- `qor-sdk` defaults to: `https://demiurge.cloud/api/v1` (on demiurge.cloud)
- Falls back to: `http://localhost:8080/api/v1` (local dev)

### 3. CORS Issues
**Problem:** Browser might be blocking requests  
**Check:** Browser console for CORS errors

### 4. Database Migration
**Problem:** Database might not have latest schema  
**Check:** Verify migration `003_add_backup_code.sql` was applied

```bash
docker exec demiurge-postgres psql -U qor_auth -d qor_auth -c "\d users"
# Should show: backup_code, email_verification_token columns
```

---

## 🔧 Fix Steps

### Step 1: Verify Database Schema
```bash
ssh pleroma
docker exec demiurge-postgres psql -U qor_auth -d qor_auth -c "\d users"
```

### Step 2: Rebuild Hub Container
```bash
cd /data/Demiurge-Blockchain
git pull origin main
docker compose -f docker/docker-compose.production.yml build hub
docker compose -f docker/docker-compose.production.yml up -d hub
```

### Step 3: Test Login Endpoint
```bash
# Test with valid credentials
curl -X POST https://demiurge.cloud/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"testuser","password":"testpass"}'
```

### Step 4: Check Browser Console
1. Open `https://demiurge.cloud`
2. Open browser DevTools (F12)
3. Check Console for errors
4. Check Network tab for failed requests

---

## 📋 Quick Test Script

```bash
#!/bin/bash
# Test QOR ID System

echo "Testing QOR Auth Service..."
echo ""

# Test health
echo "1. Health Check:"
curl -s http://localhost:8080/health | jq .
echo ""

# Test login endpoint (should return validation error)
echo "2. Login Endpoint (empty payload):"
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
echo ""

# Test through Nginx
echo "3. Login Endpoint (through Nginx):"
curl -s -X POST https://demiurge.cloud/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
echo ""

echo "✅ Tests complete"
```

---

## 🎯 Next Steps

1. **Identify specific issue:**
   - Is login failing?
   - Is registration failing?
   - Is profile loading failing?
   - Are there browser console errors?

2. **Rebuild Hub:**
   ```bash
   ssh pleroma
   cd /data/Demiurge-Blockchain
   docker compose -f docker/docker-compose.production.yml build hub
   docker compose -f docker/docker-compose.production.yml up -d hub
   ```

3. **Check browser console:**
   - Open `https://demiurge.cloud`
   - Open DevTools (F12)
   - Try to login/register
   - Check for errors

---

**Status:** QOR Auth service is running correctly. Issue likely in frontend or Hub container needs rebuild.
