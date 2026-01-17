# QOR Auth Service - Configuration Fix

**Date:** January 17, 2026  
**Issue:** QOR Auth API not accessible via HTTPS

---

## ✅ Status

**QOR Auth Service:** Running and healthy  
**Container:** `demiurge-qor-auth` - Up 13 hours (healthy)  
**Port:** 8080 (exposed externally)  
**Health Check:** `http://localhost:8080/health` ✅

---

## 🔧 Configuration Updates

### 1. Nginx Proxy Configuration ✅

**Fixed:** Added proper proxy routes for QOR Auth API:

```nginx
# QOR Auth API v1
location /api/v1/auth {
    proxy_pass http://qor-auth/api/v1/auth;
    ...
}

# QOR Auth Profile API
location /api/v1/profile {
    proxy_pass http://qor-auth/api/v1/profile;
    ...
}

# QOR Auth API (legacy path)
location /api/auth {
    proxy_pass http://qor-auth/api/v1/auth;
    ...
}
```

### 2. QOR SDK API URL ✅

**Updated:** Changed default API URL to use HTTPS:

```typescript
// Before: http://51.210.209.112:8080
// After: https://demiurge.cloud/api/v1
```

---

## 📋 QOR Auth API Endpoints

**Base URL:** `https://demiurge.cloud/api/v1/auth`

**Available Endpoints:**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/forgot-password` - Forgot password
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/check-username` - Check username availability

**Profile Endpoints:**
- `GET /api/v1/profile` - Get profile (protected)
- `POST /api/v1/profile` - Update profile (protected)
- `POST /api/v1/profile/avatar` - Upload avatar (protected)
- `GET /api/v1/profile/sessions` - List sessions (protected)
- `POST /api/v1/profile/link-wallet` - Link wallet (protected)

**Health Endpoint:**
- `GET /health` - Service health (not under /api/v1)

---

## 🧪 Testing

```bash
# Test health endpoint (direct)
curl http://localhost:8080/health

# Test via HTTPS (through Nginx)
curl https://demiurge.cloud/api/v1/auth/register -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"test123456789"}'

# Test login
curl https://demiurge.cloud/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"test123456789"}'
```

---

## 🔄 Next Steps

1. **Rebuild Hub app** with updated qor-sdk
2. **Restart Hub service** to use new API URL
3. **Test QOR ID login/register** in the Hub app
4. **Verify authentication flow** works end-to-end

---

**Status:** QOR Auth service is running. Nginx proxy configured. Hub app needs rebuild with updated qor-sdk.
