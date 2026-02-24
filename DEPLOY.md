# Deployment Guide

## ⚠️ Current Status
The app has been **migrated from PostgreSQL to MySQL** on Hostinger. The deployment has **two failed builds** due to the old configuration. This guide will fix that.

## Step 1: Commit Changes Locally
```bash
cd d:\Atobs
git add -A
git commit -m "Switch database from PostgreSQL to MySQL for Hostinger"
git push origin master
```

## Step 2: Deploy on VPS

### Option A: Full Redeploy (Recommended)
```bash
ssh root@72.61.224.142          # SSH key passphrase in credentials.md
cd /docker/atobs
bash deploy.sh                   # Pulls, builds, and restarts containers
```

### Option B: Quick Restart (if code hasn't changed)
```bash
ssh root@72.61.224.142
cd /docker/atobs
docker compose restart atobs-api
```

## Step 3: Verify Deployment

### Check container logs
```bash
ssh root@72.61.224.142
docker compose logs atobs-api | tail -50
```

### Expected log output (success):
```
Prisma schema loaded from prisma/schema.prisma
✔ Migrations have been successfully applied.
listening on 0.0.0.0:3005
```

### Test the API
```bash
# From your local machine
curl https://atobs.srv1396863.hstgr.cloud/api/jobs

# Should return a JSON array of jobs (or empty array if DB is clean)
```

## Step 4: Database Setup (First Time Only)

If you need to seed data:
```bash
ssh root@72.61.224.142
docker exec atobs-api npm run db:seed
```

## Troubleshooting

### Build Failed / Container won't start
```bash
ssh root@72.61.224.142
docker compose logs atobs-api  # Check for errors
docker compose down            # Stop and remove containers
docker compose up -d --build   # Rebuild from scratch
```

### Migration errors
```bash
# Check if migrations applied:
docker exec atobs-api npx prisma migrate status

# Force re-apply migrations:
docker exec atobs-api npx prisma migrate deploy --skip-generate
```

### Database connection issues
```bash
# SSH to VPS and check MySQL connectivity:
mysql -h [host] -u u758649328_atobs -p u758649328_atobs_intellan

# You'll be prompted for password (in credentials.md)
# If you can't connect, check Hostinger firewall rules
```

## What Changed

- ✅ Prisma now uses MySQL provider
- ✅ Database connection string updated to Hostinger MySQL
- ✅ Docker image now auto-migrates on startup
- ✅ All documentation updated

**No manual database changes needed** — migrations run automatically!

## Next Steps

1. Push changes (`git push`)
2. Run deploy script on VPS
3. Verify logs show successful migration
4. Test API endpoints
5. Done! 🎉
