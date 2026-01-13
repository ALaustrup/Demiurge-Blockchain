# 🌐 Demiurge Web Pivot - Phase 1 Complete

## ✅ What's Been Set Up

### Monorepo Structure
- ✅ Turborepo initialized
- ✅ Workspace configuration (`package.json`, `turbo.json`)
- ✅ Directory structure created (`apps/`, `packages/`)

### Next.js Hub (`apps/hub`)
- ✅ Next.js 15 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with Glassmorphism theme
- ✅ Middleware for authentication
- ✅ Landing page (`/`)
- ✅ Login page (`/login`)
- ✅ Portal page (`/portal`)

### Shared Packages
- ✅ `@demiurge/qor-sdk` - QOR ID authentication client
- ✅ `@demiurge/ui-shared` - Shared UI components (PersistentHUD, WalletDropdown, QorIdHeader)

### Docker Configuration
- ✅ Updated `docker-compose.yml` with QOR Auth and Hub services
- ✅ Dockerfile for Next.js hub
- ✅ Health checks configured

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Rust toolchain (for blockchain services)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Build shared packages:**
```bash
cd packages/qor-sdk && npm run build
cd ../ui-shared && npm run build
```

3. **Set up environment variables:**
```bash
cp apps/hub/.env.example apps/hub/.env.local
# Edit .env.local with your configuration
```

4. **Start Docker services:**
```bash
cd docker
docker-compose up -d
```

5. **Start Next.js hub (development):**
```bash
cd apps/hub
npm run dev
```

The hub will be available at `http://localhost:3000`

## 📁 Project Structure

```
Demiurge-Blockchain/
├── apps/
│   ├── hub/              # Next.js main website
│   ├── social/           # Social platform (future)
│   └── games/            # Rosebud.AI game exports
├── packages/
│   ├── qor-sdk/          # QOR ID authentication SDK
│   ├── ui-shared/        # Shared React components
│   └── wallet-wasm/      # WASM wallet (future)
├── services/
│   └── qor-auth/         # Rust authentication service
├── docker/
│   └── docker-compose.yml
├── package.json          # Root workspace config
└── turbo.json            # Turborepo config
```

## 🔗 Key URLs

- **Hub**: http://localhost:3000
- **QOR Auth API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Adminer** (dev): http://localhost:8081

## 📝 Next Steps

1. **Phase 2**: Complete UI foundation and design system
2. **Phase 3**: Build admin portal with God-level access
3. **Phase 4**: Integrate CGT wallet and blockchain
4. **Phase 5**: Add Rosebud.AI game integration

See `docs/WEB_PIVOT_MASTER_PLAN.md` for the complete roadmap.

## 🐛 Troubleshooting

### Port conflicts
If ports 3000, 8080, or 5432 are already in use:
- Change ports in `docker-compose.yml`
- Update `NEXT_PUBLIC_QOR_AUTH_URL` in `.env.local`

### Build errors
- Ensure all packages are built: `npm run build` in each package
- Clear `.next` and `node_modules`: `rm -rf apps/hub/.next apps/hub/node_modules`

### Docker issues
- Check service health: `docker-compose ps`
- View logs: `docker-compose logs -f [service-name]`

## 📚 Documentation

- **Master Plan**: `docs/WEB_PIVOT_MASTER_PLAN.md`
- **Quick Start**: `docs/WEB_PIVOT_QUICK_START.md`
- **Architecture**: `docs/WEB_PIVOT_ARCHITECTURE.md`

---

**Status**: Phase 1 Complete ✅  
**Next**: Phase 2 - UI Foundation & Design System
