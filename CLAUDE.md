# ATOBS — Claude Project Instructions

## Project Overview
ATOBS is a two-module app: ATS (private recruiter dashboard) + Job Board (public).
Phase 1: Local dev with SQLite. Phase 2: PostgreSQL on Hostinger VPS.

## Structure
- `api/` — Fastify + TypeScript + Prisma backend (port 3001)
- `web/` — React + Vite + Tailwind frontend (port 5173, proxies /api to :3001)

## Key Commands
```bash
# Backend
cd api && npm install
cd api && npx prisma migrate dev --name init
cd api && npx prisma db seed
cd api && npm run dev

# Frontend
cd web && npm install
cd web && npm run dev
```

## Database
- SQLite in `api/prisma/dev.db` (Phase 1)
- Schema in `api/prisma/schema.prisma`
- Do NOT manually edit dev.db — use Prisma migrations
- Browse data: `cd api && npx prisma studio`

## Auth
- JWT access token (15min) returned in JSON response body
- Refresh token (7d) stored in httpOnly Secure cookie
- Roles: `admin` | `recruiter` | `hiring_manager` | `viewer`
- All `/api/ats/*` routes require valid JWT
- Public routes: GET `/api/jobs`, GET `/api/jobs/:id`, POST `/api/jobs/:id/apply`

## File Uploads
- Phase 1: stored at `api/uploads/{candidateId}/{uuid}.{ext}`
- API streams files — never expose raw storage paths to clients
- Max size: 10MB per file
- Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png

## Pipeline Stages (in order)
```
resume_received → screened → vetted → interview_scheduled → interview_completed
→ client_submitted → client_interview → offer_awaiting → offer_released
→ h1b_filed → hired / rejected
```

## Important Conventions
- Stage changes REQUIRE a note body (`noteContent` field) — enforced in API + frontend modal
- All stage changes write an AuditLog record
- `Candidate` = the person. `Application` = candidate × job link with pipeline state.
- One candidate can apply to multiple jobs (separate Application records)
- `isProcessed = false` → "Not Processed" tab in job view
- `isProcessed = true` → "Processed" tab (set automatically on first stage change beyond resume_received)
- Skills stored as JSON string in SQLite: `'["React","Node.js"]'`

## Seed Credentials
- Admin: `admin@atobs.com` / `admin123`
- Recruiter: `recruiter@atobs.com` / `recruiter123`

## Phase 2 Migration Notes
1. Change `provider = "sqlite"` → `provider = "postgresql"` in `api/prisma/schema.prisma`
2. Change `DATABASE_URL` to PostgreSQL connection string in `api/.env`
3. Run `npx prisma migrate deploy`
4. Update `api/src/services/storage.ts` to use MinIO instead of local filesystem
5. Update `api/.env` with MinIO credentials
