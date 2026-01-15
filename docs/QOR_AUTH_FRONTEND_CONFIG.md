# QOR Auth Frontend Configuration

## Overview

The QOR Auth service is now running on the production server at `http://51.210.209.112:8080`. This document explains how the frontend is configured to use it.

## Configuration Status

### ✅ QOR SDK (`packages/qor-sdk/src/index.ts`)

The SDK automatically detects the environment and uses the correct API URL:

1. **Environment Variable** (highest priority):
   - Uses `NEXT_PUBLIC_QOR_AUTH_URL` if set

2. **Hostname Detection** (fallback):
   - If `window.location.hostname === 'demiurge.cloud'` → Uses `http://51.210.209.112:8080`
   - Otherwise → Uses `http://localhost:8080` (development)

### ✅ Production Environment File (`apps/hub/.env.production`)

```env
NEXT_PUBLIC_QOR_AUTH_URL=http://51.210.209.112:8080
NEXT_PUBLIC_BLOCKCHAIN_WS_URL=ws://51.210.209.112:9944
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://51.210.209.112:9933
NODE_ENV=production
```

## Deployment Instructions

### For Next.js Production Build

When building for production, Next.js automatically loads `.env.production`:

```bash
cd apps/hub
npm run build  # Automatically uses .env.production
npm start      # Runs production server
```

### For Docker Deployment

The Dockerfile doesn't hardcode environment variables. You have two options:

#### Option 1: Use .env.production during build

```bash
# Copy .env.production to .env.local before build
cp apps/hub/.env.production apps/hub/.env.local
docker build -t demiurge-hub .
```

#### Option 2: Pass environment variables at runtime

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_QOR_AUTH_URL=http://51.210.209.112:8080 \
  -e NEXT_PUBLIC_BLOCKCHAIN_WS_URL=ws://51.210.209.112:9944 \
  -e NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://51.210.209.112:9933 \
  demiurge-hub
```

#### Option 3: Use docker-compose (Recommended)

Update `docker/docker-compose.production.yml`:

```yaml
services:
  hub:
    environment:
      - NEXT_PUBLIC_QOR_AUTH_URL=http://51.210.209.112:8080
      - NEXT_PUBLIC_BLOCKCHAIN_WS_URL=ws://51.210.209.112:9944
      - NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://51.210.209.112:9933
```

## Verification

### Test the Production API

```bash
# Health check
curl http://51.210.209.112:8080/health

# Expected response:
# {"service":"qor-auth","status":"healthy","version":"0.1.0"}
```

### Test from Frontend

1. Open browser console on `demiurge.cloud`
2. Check network tab for requests to `51.210.209.112:8080`
3. Verify QOR SDK is using the correct URL:
   ```javascript
   // In browser console
   console.log(process.env.NEXT_PUBLIC_QOR_AUTH_URL);
   ```

## Current Status

- ✅ QOR Auth service running on `51.210.209.112:8080`
- ✅ SDK configured with production fallback
- ✅ `.env.production` file configured
- ✅ Service auto-starts on server boot
- ✅ Service auto-restarts on failure

## Next Steps

1. **Deploy Hub to Production**: Build and deploy the Next.js hub app with production environment variables
2. **Test Authentication Flow**: Verify login/registration works with production QOR Auth service
3. **Set up HTTPS** (Future): Consider adding SSL/TLS for production (nginx reverse proxy with Let's Encrypt)
4. **Monitor Logs**: Set up log aggregation/monitoring for the QOR Auth service

## Troubleshooting

### Frontend can't connect to QOR Auth

1. Check if service is running:
   ```bash
   ssh pleroma
   sudo systemctl status qor-auth
   ```

2. Check service logs:
   ```bash
   sudo journalctl -u qor-auth -n 50
   ```

3. Test API directly:
   ```bash
   curl http://51.210.209.112:8080/health
   ```

4. Verify environment variable is set:
   - Check browser console for `process.env.NEXT_PUBLIC_QOR_AUTH_URL`
   - Should be `http://51.210.209.112:8080` in production

### CORS Issues

The QOR Auth service is configured with CORS allowing all origins. If you encounter CORS issues:

1. Check QOR Auth service logs for CORS errors
2. Verify the request is coming from the correct origin
3. Check browser console for CORS error messages

## API Endpoints

The QOR Auth service exposes the following endpoints:

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/profile` - Get user profile (requires auth)
- `POST /api/v1/profile` - Update user profile (requires auth)

Full API documentation: See `docs/QOR_AUTH_DEPLOYMENT.md`
