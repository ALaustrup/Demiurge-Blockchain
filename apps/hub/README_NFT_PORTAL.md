# NFT Portal Integration - Quick Start

## ✅ Integration Complete

The DRC-369 NFT Portal has been successfully integrated into the Demiurge Hub ecosystem.

## Access Points

1. **Homepage Card**: New "NFT Portal" card on main page (`/`)
2. **User Menu**: Added to QOR ID header dropdown
3. **Direct Route**: `/nft-portal`

## Quick Start

### Development

1. **Start NFT Portal** (Terminal 1):
   ```bash
   cd apps/nft/drc-369portal/apps/web
   npm install
   npm run dev
   # Runs on http://localhost:4000
   ```

2. **Start Hub** (Terminal 2):
   ```bash
   cd apps/hub
   npm install
   npm run dev
   # Runs on http://localhost:3000
   ```

3. **Access**: Navigate to `http://localhost:3000/nft-portal`

### Environment Setup

Add to `apps/hub/.env.local`:
```bash
NEXT_PUBLIC_NFT_PORTAL_URL=http://localhost:4000
```

## Files Created/Modified

### Created
- `apps/hub/src/app/nft-portal/page.tsx` - Portal embedding page
- `apps/hub/src/lib/app-registry.ts` - Application registry system
- `docs/NFT_PORTAL_INTEGRATION.md` - Full integration guide

### Modified
- `apps/hub/src/app/page.tsx` - Added NFT Portal card
- `apps/hub/src/components/QorIdHeaderWrapper.tsx` - Added menu item
- `apps/hub/.env.example` - Added NFT Portal URL
- `apps/hub/.env.production` - Added NFT Portal URL

## Features

- ✅ Embedded iframe integration
- ✅ Loading states and error handling
- ✅ Exit button to return to hub
- ✅ App registry entry
- ✅ Navigation integration
- ✅ Environment variable configuration

## Next Steps

1. Configure production URL in `.env.production`
2. Set up reverse proxy or subdomain for production
3. Test blockchain connectivity from portal
4. Implement shared authentication (QOR ID SSO)

For detailed documentation, see `docs/NFT_PORTAL_INTEGRATION.md`.
