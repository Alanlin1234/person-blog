# Software Requirements Specification — Dynamic Personal Blog

**Version:** 2.0  
**Status:** Active  
**Implementation:** `apps/api` (NestJS + Prisma + MySQL), `apps/web` (React + Vite + TipTap).

## 1. Purpose

Full-stack personal blog: authentication (JWT + refresh cookie), RBAC (`user` / `admin`), rich-text posts with drafts and versioning, taxonomy (multi-level categories, tags, many-to-many), nested comments with moderation, search, profile and themes, view counts with deduplication, backups, and API documentation (Swagger).

The previous **static EdgeOne** specification is archived in [SRS-static-archive.md](./SRS-static-archive.md).

## 2. Core modules (summary)

| Module | Highlights |
|--------|----------------|
| Auth | Register with email verification token, password complexity, Argon2, login with optional remember-me, refresh rotation, password reset mail |
| Posts | Draft autosave (client 30s), publish/archive, pin/hide, soft delete, 5 `post_versions`, DOMPurify sanitize, public slug routes, `POST .../views` with Redis/DB dedupe |
| Comments | Nested (max depth 5), likes, reports, pending + admin approve/reject/delete, email + in-app notifications |
| Taxonomy | Category tree + sort; tags; admin CRUD |
| Search | Title/content/tags `LIKE` + snippet highlight; suggestions; search history for logged-in users |
| Profile | Display name, bio, JSON contacts/social, theme (`light` / `dark` / `sepia`), avatar upload (jpg/png ≤2MB) |
| Ops | Daily mysqldump backup (when client available), manual admin trigger, Swagger at `/api/docs` |

## 3. Non-functional

Responsive UI, lazy images where applicable, Helmet + throttling (auth routes skipped), CORS with credentials for refresh cookie, indexed DB fields per [database-design.md](./database-design.md).

## 4. Deployment

See [deployment.md](./deployment.md) and root [README.md](../README.md).
