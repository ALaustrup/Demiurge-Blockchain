# 🔐 Admin Portal Access Guide

## Admin Portal URL

**Admin Portal**: http://localhost:3000/admin

---

## Prerequisites

### 1. Services Running

The admin portal requires two services:

1. **Next.js Hub** (port 3000) - ✅ Starting...
2. **QOR Auth Service** (port 8080) - ⚠️ Needs to be started

### 2. God-Level Account

You need a God-level QOR ID account to access the admin portal.

---

## Starting Services

### Option A: Using Docker Compose (Recommended)

```bash
cd x:\Demiurge-Blockchain
docker-compose -f docker/docker-compose.yml up -d
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- QOR Auth Service (port 8080)
- Next.js Hub (port 3000)

### Option B: Manual Start

#### 1. Start QOR Auth Service

```bash
cd x:\Demiurge-Blockchain\services\qor-auth
cargo run
```

The service will run on `http://localhost:8080`

#### 2. Start Next.js Hub (Already Starting)

```bash
cd x:\Demiurge-Blockchain\apps\hub
npm run dev
```

The hub will run on `http://localhost:3000`

---

## Creating a God Account

### Step 1: Run Migration

```bash
# Connect to PostgreSQL
psql -U qor_auth -d qor_auth

# Run migration
\i services/qor-auth/migrations/002_add_god_role.sql
```

### Step 2: Create God User

You can either:

**A. Use the seed script** (update email/password first):
```bash
psql -U qor_auth -d qor_auth -f services/qor-auth/scripts/seed-god-account.sql
```

**B. Create manually** (after generating password hash):
```sql
INSERT INTO users (
    email,
    username,
    discriminator,
    password_hash,
    email_verified,
    role,
    status
) VALUES (
    'admin@demiurge.cloud',
    'god',
    1,
    '$argon2id$v=19$m=65536,t=3,p=4$YOUR_HASH_HERE',
    true,
    'god',
    'active'
);
```

### Step 3: Login

1. Go to http://localhost:3000/login
2. Login with your God account credentials
3. You'll be redirected to `/admin` automatically

---

## Admin Portal Features

Once logged in as a God account, you can access:

### Users Tab
- List all users with pagination
- View user details
- Ban/unban users
- Update user roles

### Tokens Tab
- Transfer CGT tokens (for customer support)
- Refund CGT tokens
- View transaction history

### Stats Tab
- Total users
- Active sessions
- Registrations (24h)
- Logins (24h)
- Users by role

---

## Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in with a God-level account
- Check that your JWT token includes `role: "god"`

### "Failed to fetch" Error
- Ensure QOR Auth service is running on port 8080
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_QOR_AUTH_URL` in `.env` is correct

### Admin Portal Not Loading
- Ensure Next.js hub is running on port 3000
- Check that all dependencies are installed (`npm install`)
- Verify the `/admin` route exists

---

## Quick Start Checklist

- [ ] PostgreSQL running (port 5432)
- [ ] Redis running (port 6379)
- [ ] QOR Auth service running (port 8080)
- [ ] Next.js hub running (port 3000)
- [ ] God account created in database
- [ ] Logged in with God account
- [ ] Access http://localhost:3000/admin

---

**Status**: Next.js hub is starting. QOR Auth service needs to be started separately.
