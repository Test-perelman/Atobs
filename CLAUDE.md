# ATOBS — Claude Instructions

## Stack
- `api/` — Fastify + TypeScript + Prisma, port **3005**
- `web/` — React + Vite + Tailwind, port **5173** (proxies `/api` → `:3005`)
- DB — **MySQL 8.0** on Hostinger (`u758649328_atobs_intellan`)
- Deployed at **https://atobs.srv1396863.hstgr.cloud** (Docker + Traefik on VPS)

## Local Dev
```bash
cd api && npm run dev      # starts API on :3005
cd web && npm run dev      # starts frontend on :5173
```
**Note:** Local dev currently cannot connect to Hostinger MySQL (firewall restrictions). Use staging/production deployments to test database functionality.

## Production Deployment
App runs on VPS as Docker containers. Traefik handles HTTPS + routing.

```
/docker/atobs/
├── api/           ← cloned from GitHub + .env written manually
├── web/
├── docker-compose.yml
└── deploy.sh      ← run this to redeploy
```

### To deploy after making code changes:
```bash
# 1. Commit and push to GitHub
git add <files>
git commit -m "description"
git push origin master

# 2. SSH to VPS and run deploy script
ssh root@72.61.224.142    # passphrase in credentials.md
cd /docker/atobs && bash deploy.sh
```
`deploy.sh` does: `git pull` → `docker compose build --no-cache` → `docker compose up -d`

### To update environment variables on VPS:
```bash
ssh root@72.61.224.142
nano /docker/atobs/api/.env    # edit in place (this file is NOT in git)
cd /docker/atobs && docker compose restart atobs-api
```
Note: `.env` is gitignored. The VPS copy was written manually. See `credentials.md` for all values.

## Database
- Provider: **MySQL 8.0** (`api/prisma/schema.prisma`)
- Migrations: `api/prisma/migrations/` (auto-generated via Prisma)
- ORM: Prisma — **never edit DB manually**, always use migrations

```bash
# Create a new migration (after schema changes)
cd api && npm run db:migrate -- --name describe_change

# Deploy migrations on VPS during docker compose up
# (Migrations run automatically in the container startup)

# To manually run migrations on VPS (if needed):
ssh root@72.61.224.142 "docker exec atobs-api npx prisma migrate deploy"
```
Migrations are automatically applied when the Docker container starts (via `prisma migrate deploy` in entrypoint).

## Auth
- `POST /api/auth/login` → returns `{ accessToken, user }` in body + httpOnly `refreshToken` cookie
- Access token: 15min JWT. Refresh token: 7d cookie.
- Roles: `admin` | `recruiter` | `hiring_manager` | `viewer`
- Protected: all `/api/ats/*` routes require Bearer token
- Public: `GET /api/jobs`, `GET /api/jobs/:id`, `POST /api/jobs/:id/apply`
- Frontend stores token in `localStorage.accessToken`, auto-refreshes on 401

## Key Conventions
- `Candidate` = person. `Application` = candidate × job with pipeline state (one candidate can have multiple applications across jobs).
- Stage changes **require** `noteContent` in request body — enforced in both API and frontend modal.
- Stage change beyond `resume_received` sets `isProcessed = true` automatically.
- All stage changes write an `AuditLog` record.
- Skills stored as JSON string: `'["React","Node.js"]'`
- File uploads: local path `api/uploads/{candidateId}/{uuid}.ext`, max 10MB, allowed: pdf/doc/docx/jpg/png

## Pipeline Stages
```
resume_received → screened → vetted → interview_scheduled → interview_completed
→ client_submitted → client_interview → offer_awaiting → offer_released
→ h1b_filed → hired | rejected
```

## Seed Accounts
| Email | Password | Role |
|---|---|---|
| admin@atobs.com | admin123 | admin |
| recruiter@atobs.com | recruiter123 | recruiter |
| manager@atobs.com | manager123 | hiring_manager |

## File Map (key files only)
```
api/src/
  app.ts                   ← Fastify entry, registers all routes
  plugins/auth.ts          ← signAccessToken, signRefreshToken, authenticate middleware
  routes/auth/index.ts     ← login, refresh, logout, /me
  routes/public/           ← jobs list, job detail, apply form
  routes/ats/              ← jobs, applications, notes, documents, analytics, users
  services/storage.ts      ← file save/read/delete (local disk)
  services/audit.ts        ← writeAuditLog()

web/src/
  App.tsx                  ← React Router, RequireAuth guard
  lib/api.ts               ← Axios instance, auto-refresh interceptor
  lib/auth.ts              ← localStorage helpers
  lib/types.ts             ← all TS interfaces + STAGE_CONFIG
  components/layout/       ← ATSLayout (sidebar), PublicLayout (navbar + sign in btn)
  pages/ats/               ← Dashboard, Jobs, Candidates, Analytics, Settings
  pages/public/            ← JobBoard, JobDetail, ApplyForm
```

## Infrastructure
- VPS: `72.61.224.142` (Ubuntu 24.04, 2 vCPU, 8GB RAM)
- SSH: `root@72.61.224.142` — key at `D:\VGS\Credentials\Hostinger Vps SSH\id_ed25519`
- **MySQL 8.0** on Hostinger managed hosting (not self-hosted on VPS)
  - Host: Hostinger database server (not VPS IP)
  - Connection: Via Hostinger's internal network
  - Credentials: See `credentials.md`
- Docker network: `n8n_default` (shared with n8n + Traefik)
- App containers connect to Hostinger MySQL via `DATABASE_URL` in `.env`
- Traefik auto-renews TLS via Let's Encrypt; n8n runs alongside at `n8n.srv1396863.hstgr.cloud`
- Sensitive values (DB password, JWT secrets, SSH passphrase) are in `credentials.md` (gitignored, local only)
