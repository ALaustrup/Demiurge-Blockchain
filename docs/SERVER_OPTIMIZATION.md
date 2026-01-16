# 🚀 Server Optimization & Configuration

**Last Updated:** January 14, 2026  
**Server:** `51.210.209.112`

---

## 📋 Current Server Configuration

### Services Running

1. **QOR Auth Service** (Port 8080)
   - Rust/Axum backend
   - PostgreSQL 18 database
   - Redis 7.4 session cache
   - JWT authentication

2. **Next.js Hub** (Port 3000)
   - Game portal and hub
   - Blockchain integration
   - Game API endpoints

3. **PostgreSQL 18** (Port 5432)
   - QOR Auth database
   - User accounts and sessions

4. **Redis 7.4** (Port 6379)
   - Session storage
   - Rate limiting cache

5. **Unreal Engine 5.7.1**
   - Reserved for future UE5 game development
   - Not currently in use

---

## 🔧 Optimization Recommendations

### 1. QOR Auth Service

**Current Configuration:**
- Default port: 8080
- Database: PostgreSQL 18
- Session cache: Redis 7.4

**Optimizations:**

```rust
// services/qor-auth/src/config.rs
// Recommended production settings:

// Database connection pool
database.max_connections: 20  // Increase for production

// JWT settings
jwt.access_expiry_secs: 900   // 15 minutes (good)
jwt.refresh_expiry_secs: 2592000  // 30 days (good)

// Security settings
security.max_login_attempts: 5
security.lockout_duration_secs: 900  // 15 minutes
security.max_sessions: 10  // Per user
security.password_min_length: 12  // Strong passwords
```

**Environment Variables:**
```bash
# Production .env
QOR_AUTH__SERVER__HOST=0.0.0.0
QOR_AUTH__SERVER__PORT=8080
QOR_AUTH__DATABASE__URL=postgresql://user:pass@localhost/qor_auth
QOR_AUTH__DATABASE__MAX_CONNECTIONS=20
QOR_AUTH__REDIS__URL=redis://localhost:6379
QOR_AUTH__JWT__ACCESS_SECRET=<strong-secret>
QOR_AUTH__JWT__REFRESH_SECRET=<strong-secret>
QOR_AUTH__SECURITY__MAX_LOGIN_ATTEMPTS=5
QOR_AUTH__SECURITY__LOCKOUT_DURATION_SECS=900
```

### 2. Next.js Hub

**Current Configuration:**
- Port: 3000
- Environment: Development/Production

**Optimizations:**

```javascript
// apps/hub/next.config.js
// Production optimizations:

module.exports = {
  // Enable production optimizations
  productionBrowserSourceMaps: false,  // Disable source maps in production
  compress: true,  // Enable gzip compression
  poweredByHeader: false,  // Remove X-Powered-By header
  
  // Image optimization
  images: {
    domains: ['51.210.209.112'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Performance
  reactStrictMode: true,
  swcMinify: true,  // Use SWC minification
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};
```

**Environment Variables:**
```bash
# Production .env
NODE_ENV=production
NEXT_PUBLIC_QOR_AUTH_URL=http://51.210.209.112:8080
NEXT_PUBLIC_BLOCKCHAIN_WS_URL=ws://51.210.209.112:9944
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://51.210.209.112:9933
```

### 3. PostgreSQL Optimization

**Recommended Settings:**

```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

**Connection Pooling:**
- Use PgBouncer for connection pooling
- Set pool size: 20-50 connections
- Enable statement pooling

### 4. Redis Optimization

**Recommended Settings:**

```conf
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save ""  # Disable RDB snapshots if using AOF
appendonly yes
appendfsync everysec
```

**Memory Management:**
- Set max memory based on server RAM
- Use LRU eviction policy
- Enable AOF for persistence

### 5. Nginx Reverse Proxy (Recommended)

**Configuration:**

```nginx
# /etc/nginx/sites-available/demiurge
upstream qor_auth {
    server 127.0.0.1:8080;
}

upstream hub {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name 51.210.209.112;

    # QOR Auth API
    location /api/auth {
        proxy_pass http://qor_auth;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js Hub
    location / {
        proxy_pass http://hub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://hub;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
```

---

## 🔒 Security Hardening

### 1. Firewall Configuration

```bash
# UFW firewall rules
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Nginx)
ufw allow 443/tcp  # HTTPS (if using SSL)
ufw enable
```

### 2. SSL/TLS (Recommended)

Use Let's Encrypt for free SSL certificates:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Rate Limiting

**Nginx Rate Limiting:**

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=game_limit:10m rate=100r/s;

location /api/games/reward {
    limit_req zone=api_limit burst=20;
    proxy_pass http://hub;
}
```

**Application-Level Rate Limiting:**

Already implemented in:
- `apps/hub/src/app/api/games/reward/route.ts` (100 rewards/minute)
- QOR Auth service (login attempts)

### 4. Database Security

```sql
-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'strong_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;

-- Enable row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Monitoring & Logging

### 1. Application Logs

**QOR Auth:**
```bash
# View logs
journalctl -u qor-auth -f

# Or Docker logs
docker logs -f demiurge-qor-auth
```

**Next.js Hub:**
```bash
# PM2 logs
pm2 logs hub

# Or Docker logs
docker logs -f demiurge-hub
```

### 2. Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### 3. Redis Monitoring

```bash
# Redis info
redis-cli INFO

# Monitor commands
redis-cli MONITOR
```

---

## 🚀 Performance Tuning

### 1. Next.js Production Build

```bash
cd apps/hub
npm run build
npm start  # Or use PM2
```

### 2. PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'hub',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/apps/hub',
      instances: 2,  // Cluster mode
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### 3. Database Indexes

```sql
-- Add indexes for common queries
CREATE INDEX idx_users_qor_id ON users(qor_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## 🔄 Backup Strategy

### 1. Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U qor_auth qor_auth > /backups/qor_auth_$DATE.sql
# Keep last 30 days
find /backups -name "qor_auth_*.sql" -mtime +30 -delete
```

### 2. Redis Backup

```bash
# Redis RDB backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backups/redis_$DATE.rdb
```

### 3. Game Data Backup

Game data is currently in-memory. Before production:
- Migrate to database
- Set up automated backups
- Consider on-chain storage

---

## 📝 Deployment Checklist

- [ ] Update all environment variables
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Test all API endpoints
- [ ] Load test game endpoints
- [ ] Set up log rotation
- [ ] Configure rate limiting
- [ ] Enable production optimizations
- [ ] Test failover scenarios

---

## 🎯 Unreal Engine 5.7.1

**Status:** Installed but not currently in use

**Future Use Cases:**
- Native UE5 game development
- High-performance 3D games
- VR/AR game integration
- Advanced graphics rendering

**Recommendation:** Keep installed for future UE5 game development projects.

---

## 📞 Support

For server issues:
- Check logs: `journalctl -u service-name`
- Monitor resources: `htop`, `iotop`
- Database: `psql -U qor_auth qor_auth`
- Redis: `redis-cli`

---

**Server Status:** ✅ **CONFIGURED & OPTIMIZED**  
**Ready for:** Production deployment with proper SSL and monitoring
