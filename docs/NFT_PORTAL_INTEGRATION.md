# NFT Portal Integration Guide

## Overview

The DRC-369 NFT Portal is now integrated into the Demiurge ecosystem as an embedded application accessible through the main hub.

## Location

- **Portal Application**: `apps/nft/drc-369portal/apps/web/`
- **Hub Integration Route**: `apps/hub/src/app/nft-portal/page.tsx`
- **App Registry**: `apps/hub/src/lib/app-registry.ts`

## Access Points

### 1. Homepage Navigation
The NFT Portal is accessible via a card on the main homepage (`/`):
- **Icon**: 🎨
- **Title**: NFT Portal
- **Description**: Manage DRC-369 assets & collections
- **Route**: `/nft-portal`

### 2. User Menu
Added to the QOR ID header dropdown menu:
- Accessible when logged in
- Direct link to `/nft-portal`

### 3. Direct URL
- **Development**: `http://localhost:3000/nft-portal`
- **Production**: `https://demiurge.cloud/nft-portal`

## Configuration

### Environment Variables

Add to `apps/hub/.env` or `apps/hub/.env.production`:

```bash
# NFT Portal URL (for embedded iframe)
NEXT_PUBLIC_NFT_PORTAL_URL=http://localhost:4000
```

**Production Configuration:**
```bash
# If NFT Portal runs on same domain with reverse proxy
NEXT_PUBLIC_NFT_PORTAL_URL=https://demiurge.cloud/nft-portal-app

# Or if running on separate subdomain
NEXT_PUBLIC_NFT_PORTAL_URL=https://nft.demiurge.cloud
```

## Running the NFT Portal

### Development

1. **Start NFT Portal**:
   ```bash
   cd apps/nft/drc-369portal/apps/web
   npm install
   npm run dev
   # Runs on http://localhost:4000
   ```

2. **Start Hub**:
   ```bash
   cd apps/hub
   npm install
   npm run dev
   # Runs on http://localhost:3000
   ```

3. **Access**: Navigate to `http://localhost:3000/nft-portal`

### Production

#### Option 1: Same Server (Recommended)
Run both apps on the same server with reverse proxy:

```nginx
# Nginx configuration
location /nft-portal-app {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Then set:
```bash
NEXT_PUBLIC_NFT_PORTAL_URL=https://demiurge.cloud/nft-portal-app
```

#### Option 2: Separate Subdomain
Run NFT Portal on `nft.demiurge.cloud`:

```bash
NEXT_PUBLIC_NFT_PORTAL_URL=https://nft.demiurge.cloud
```

#### Option 3: Docker Compose
Add to `docker/docker-compose.yml`:

```yaml
services:
  nft-portal:
    build:
      context: ../apps/nft/drc-369portal/apps/web
      dockerfile: Dockerfile
    container_name: demiurge-nft-portal
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    networks:
      - demiurge-network
```

## Features

The NFT Portal provides:

- **Asset Management**: View, create, and manage DRC-369 NFTs
- **Collections**: Organize assets into collections
- **Marketplace Integration**: List and trade NFTs
- **DRC-369 Features**:
  - Nesting & Equipping
  - Multi-Resource Management
  - Delegation & Rental
  - State Management (XP, Level, Durability)

## Blockchain Integration

The portal connects to the Demiurge blockchain via:
- **WebSocket**: `ws://51.210.209.112:9944` (production)
- **DRC-369 Pallet**: `pallet-drc369` for NFT operations
- **QOR ID**: Authentication via QOR Auth service

## App Registry

The portal is registered in `app-registry.ts`:

```typescript
{
  id: 'nft-portal',
  title: 'NFT Portal',
  description: 'Manage DRC-369 assets & collections',
  icon: '🎨',
  route: '/nft-portal',
  url: process.env.NEXT_PUBLIC_NFT_PORTAL_URL || 'http://localhost:4000',
  type: 'embedded',
  category: 'nft',
  minLevel: 1,
  requiresAuth: false,
}
```

## Troubleshooting

### Portal Not Loading

1. **Check NFT Portal is Running**:
   ```bash
   curl http://localhost:4000
   ```

2. **Verify Environment Variable**:
   ```bash
   echo $NEXT_PUBLIC_NFT_PORTAL_URL
   ```

3. **Check Browser Console**: Look for iframe loading errors

4. **CORS Issues**: Ensure NFT Portal allows iframe embedding:
   ```javascript
   // In NFT Portal vite.config.ts or server config
   headers: {
     'X-Frame-Options': 'SAMEORIGIN', // or remove for cross-origin
   }
   ```

### Production Deployment

1. Build NFT Portal:
   ```bash
   cd apps/nft/drc-369portal/apps/web
   npm run build
   ```

2. Configure reverse proxy or subdomain

3. Update `NEXT_PUBLIC_NFT_PORTAL_URL` in production environment

## Next Steps

- [ ] Add NFT Portal to Docker Compose
- [ ] Configure production reverse proxy
- [ ] Add analytics tracking
- [ ] Implement shared authentication (QOR ID SSO)
- [ ] Add blockchain event subscriptions
