# 🚀 DEMIURGE WEB PIVOT: QUICK START GUIDE

> *Immediate actionable steps to begin implementation*

---

## ⚡ Phase 1: Immediate Setup (Week 1)

### Step 1: Initialize Monorepo

```bash
# Create new monorepo directory
mkdir demiurge-ecosystem
cd demiurge-ecosystem

# Initialize Turborepo
npx create-turbo@latest . --package-manager npm

# Create directory structure
mkdir -p apps/{hub,social,games}
mkdir -p packages/{blockchain,qor-sdk,ui-shared,wallet-wasm}
mkdir -p services/{qor-auth,blockchain-node}
mkdir -p docker/nginx
```

### Step 2: Set Up Next.js Hub

```bash
cd apps/hub

# Create Next.js 15 app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Install dependencies
npm install @tanstack/react-query axios zustand
npm install -D @types/node
```

**Key Files to Create:**

1. **`apps/hub/src/middleware.ts`** - Auth middleware
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('qor_token');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*']
};
```

2. **`apps/hub/src/app/layout.tsx`** - Root layout
```typescript
import { PersistentHUD } from '@demiurge/ui-shared';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <PersistentHUD />
        {children}
      </body>
    </html>
  );
}
```

3. **`apps/hub/tailwind.config.ts`** - Glassmorphism theme
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'demiurge-cyan': '#00f2ff',
        'demiurge-violet': '#7000ff',
        'demiurge-gold': '#ffd700',
        'demiurge-dark': '#0a0a0f',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'border-pulse': 'border-pulse 6s infinite alternate',
      },
      keyframes: {
        'border-pulse': {
          '0%': { filter: 'hue-rotate(0deg) brightness(1)' },
          '100%': { filter: 'hue-rotate(45deg) brightness(1.5)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

4. **`apps/hub/src/app/globals.css`** - Global styles
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass-panel {
    @apply bg-[rgba(15,15,15,0.85)] backdrop-blur-[20px];
    @apply border border-transparent;
    @apply bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-cyan;
    @apply bg-clip-border;
    @apply animate-border-pulse;
  }
  
  .glass-panel::before {
    content: '';
    @apply absolute inset-0 rounded-lg;
    @apply bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-cyan;
    @apply opacity-50 blur-sm;
    @apply -z-10;
  }
}
```

### Step 3: Create QOR SDK Package

```bash
cd packages/qor-sdk

# Initialize package
npm init -y

# Install dependencies
npm install axios
npm install -D typescript @types/node

# Create tsconfig.json
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

**Create `packages/qor-sdk/src/index.ts`:**
```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

export interface QorId {
  username: string;
  discriminator: number;
}

export interface User {
  id: string;
  qor_id: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'god';
}

export class QorAuthClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  async login(email: string, password: string) {
    const response = await axios.post(
      `${this.baseURL}/api/v1/auth/login`,
      { email, password },
      { headers: this.getHeaders() }
    );
    this.token = response.data.token;
    return response.data;
  }

  async register(email: string, password: string, username: string) {
    const response = await axios.post(
      `${this.baseURL}/api/v1/auth/register`,
      { email, password, username },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await axios.get(
      `${this.baseURL}/api/v1/profile`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async isGod(): Promise<boolean> {
    try {
      const profile = await this.getProfile();
      return profile.role === 'god';
    } catch {
      return false;
    }
  }
}

export const qorAuth = new QorAuthClient();
```

### Step 4: Create UI Shared Package

```bash
cd packages/ui-shared

npm init -y
npm install react react-dom
npm install -D typescript @types/react @types/react-dom

# Create basic components
mkdir -p src/components
```

**Create `packages/ui-shared/src/components/PersistentHUD.tsx`:**
```typescript
'use client';

import { WalletDropdown } from './WalletDropdown';
import { QorIdHeader } from './QorIdHeader';

export function PersistentHUD() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel p-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <QorIdHeader />
        <div className="flex gap-6">
          <WalletDropdown />
          <button className="text-demiurge-cyan hover:text-demiurge-violet">
            Social
          </button>
        </div>
      </div>
    </nav>
  );
}
```

**Create `packages/ui-shared/src/components/WalletDropdown.tsx`:**
```typescript
'use client';

import { useState } from 'react';

export function WalletDropdown() {
  const [balance, setBalance] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel px-4 py-2 rounded-lg"
      >
        CGT: {balance.toFixed(2)}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 glass-panel p-4 rounded-lg min-w-[300px]">
          <h3 className="text-lg font-bold mb-4">Wallet</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Balance:</span>
              <span className="text-demiurge-cyan">{balance} CGT</span>
            </div>
            <button className="w-full glass-panel py-2 rounded">
              Send CGT
            </button>
            <button className="w-full glass-panel py-2 rounded">
              Receive CGT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Create `packages/ui-shared/src/components/QorIdHeader.tsx`:**
```typescript
'use client';

import { useState } from 'react';

export function QorIdHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [qorId, setQorId] = useState<string>('user#0001');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg"
      >
        <div className="w-8 h-8 rounded-full bg-demiurge-cyan" />
        <span>{qorId}</span>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 glass-panel p-4 rounded-lg min-w-[200px]">
          <div className="space-y-2">
            <div className="text-sm">{qorId}</div>
            <button className="w-full glass-panel py-2 rounded">
              Profile
            </button>
            <button className="w-full glass-panel py-2 rounded">
              Settings
            </button>
            <button className="w-full glass-panel py-2 rounded text-red-400">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 5: Configure Turborepo

**Create `turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

**Create root `package.json`:**
```json
{
  "name": "demiurge-ecosystem",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

---

## 🔐 Phase 2: Admin Portal Setup (Week 2)

### Step 1: Extend QOR Auth Service

**Add to `services/qor-auth/migrations/002_add_role.sql`:**
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;
CREATE INDEX idx_users_role ON users(role);

-- Create God account (update with your email)
UPDATE users SET role = 'god' WHERE email = 'admin@demiurge.cloud';
```

**Update `services/qor-auth/src/middleware/auth.rs`:**
```rust
pub async fn require_god(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = extract_token(&request)?;
    let claims = verify_token(&token, &state.config.jwt.secret)?;
    
    // Check if user is God
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1",
        claims.user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match user {
        Some(u) if u.role == "god" => Ok(next.run(request).await),
        _ => Err(StatusCode::FORBIDDEN),
    }
}
```

### Step 2: Create Admin Dashboard

**Create `apps/hub/src/app/admin/page.tsx`:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [isGod, setIsGod] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const hasAccess = await qorAuth.isGod();
      setIsGod(hasAccess);
      setLoading(false);
      
      if (!hasAccess) {
        router.push('/');
      }
    }
    checkAccess();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (!isGod) return null;

  return (
    <div className="min-h-screen pt-20 p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          <p className="text-gray-400">Manage users, roles, and permissions</p>
        </div>
        
        <div className="glass-panel p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Token Management</h2>
          <p className="text-gray-400">CGT transfers, refunds, and support</p>
        </div>
        
        <div className="glass-panel p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">System Stats</h2>
          <p className="text-gray-400">Monitor system health and metrics</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🐳 Phase 3: Docker Setup (Week 2)

### Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: demiurge
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: demiurge
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7.4-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  qor-auth:
    build: ./services/qor-auth
    environment:
      DATABASE_URL: postgresql://demiurge:${POSTGRES_PASSWORD}@postgres:5432/demiurge
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis

  hub:
    build: ./apps/hub
    environment:
      NEXT_PUBLIC_QOR_AUTH_URL: http://localhost:8080
      NODE_ENV: development
    ports:
      - "3000:3000"
    volumes:
      - ./apps/hub:/app
      - /app/node_modules
    depends_on:
      - qor-auth

volumes:
  postgres_data:
  redis_data:
```

---

## ✅ Next Steps Checklist

- [ ] Complete Phase 1 setup
- [ ] Test QOR ID login flow
- [ ] Create God account in database
- [ ] Build admin dashboard UI
- [ ] Set up Docker environment
- [ ] Configure domain DNS
- [ ] Set up SSL certificates
- [ ] Deploy to Monad server

---

**Ready to begin? Start with Phase 1, Step 1!**
