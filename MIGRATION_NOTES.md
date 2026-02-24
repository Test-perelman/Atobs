# PostgreSQL → MySQL Migration (2026-02-24)

## Changes Made

### 1. **Prisma Configuration**
- ✅ Changed `prisma/schema.prisma` provider from `postgresql` to `mysql`
- ✅ Updated `prisma/migrations/migration_lock.toml` to `provider = "mysql"`
- ✅ Created new MySQL-compatible migration: `20260224_init_mysql/migration.sql`
  - Uses `VARCHAR(191)` for TEXT fields (MySQL best practice)
  - Uses `LONGTEXT` for large content fields (notes, descriptions, etc.)
  - Uses `DATETIME(3)` instead of `TIMESTAMP(3)`
  - All tables use `utf8mb4_unicode_ci` collation

### 2. **Environment Configuration**
- ✅ Created `api/.env` with MySQL connection string:
  ```
  DATABASE_URL="mysql://u758649328_atobs:Atobs@2026@127.0.0.1:3306/u758649328_atobs_intellan"
  ```
- ✅ Updated `api/.env.example` to reflect MySQL format

### 3. **Docker Changes**
- ✅ Modified `api/Dockerfile`:
  - Keeps `npm install openssl` (needed for Prisma)
  - **NEW:** CMD now runs `npx prisma migrate deploy` before starting the app
  - This ensures migrations are applied on container startup

### 4. **Documentation**
- ✅ Updated `CLAUDE.md` with:
  - Stack now uses MySQL instead of PostgreSQL
  - Local dev cannot connect to Hostinger MySQL (firewall)
  - Database section explains MySQL provider + migration workflow
  - Infrastructure section updated with MySQL details

## Deployment Instructions

### On VPS (via SSH or during docker compose up):
```bash
# Option 1: Automatic (during docker compose up)
cd /docker/atobs
docker compose up -d --build

# Option 2: Manual migration deploy (if needed)
docker exec atobs-api npx prisma migrate deploy
```

### To push code changes:
```bash
# 1. From local machine (d:\Atobs)
git add -A
git commit -m "Switch database from PostgreSQL to MySQL for Hostinger"
git push origin master

# 2. SSH to VPS and redeploy
ssh root@72.61.224.142
cd /docker/atobs && bash deploy.sh
```

## Important Notes

- **Local Dev:** Cannot test with actual database (Hostinger MySQL not accessible from dev machine)
  - Frontend dev still works (port 5173)
  - API dev works but requires mocked/stubbed database for testing
  
- **Migrations:** Automatically applied on Docker startup via Dockerfile CMD
  - No manual migration step needed in deploy script
  
- **Existing Data:** If the Hostinger database already has schema:
  - First deployment may fail if tables exist
  - Can either:
    1. Drop and recreate via phpMyAdmin/Hostinger panel
    2. Or manually apply migration SQL if needed

## Files Changed
```
api/prisma/schema.prisma                    ← provider: mysql
api/prisma/migrations/migration_lock.toml   ← provider: mysql
api/prisma/migrations/20260224_init_mysql/  ← NEW: MySQL migration
api/.env                                     ← NEW: MySQL DATABASE_URL
api/.env.example                             ← Updated to MySQL URL
api/Dockerfile                               ← CMD includes prisma migrate deploy
CLAUDE.md                                    ← Updated documentation
```

## Testing Checklist

After deployment:
- [ ] SSH to VPS: `ssh root@72.61.224.142`
- [ ] Check container status: `docker compose ps`
- [ ] Check logs: `docker compose logs atobs-api | tail -50`
- [ ] Verify migrations ran: Should see "All migrations have been successfully applied" in logs
- [ ] Test API: `curl https://atobs.srv1396863.hstgr.cloud/api/jobs`
- [ ] Test login: `curl -X POST https://atobs.srv1396863.hstgr.cloud/api/auth/login -d '...'`
