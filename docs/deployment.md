# Deployment — Person Blog

## 1. Docker Compose (development)

From the repository root:

```bash
docker compose up -d
```

Services:

- **MySQL 8** on `3306` — database `person_blog`, user `blog` / `blogpassword` (change in production).
- **Redis 7** on `6379`.

Set `DATABASE_URL` and `REDIS_URL` in `apps/api/.env` to match (see root `.env.example`).

## 2. API (NestJS)

Environment variables (minimum):

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `mysql://blog:blogpassword@localhost:3306/person_blog` |
| `REDIS_URL` | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings |
| `APP_URL` | Public web origin, e.g. `https://blog.example.com` |
| `API_URL` | Public API origin for absolute links in emails, e.g. `https://api.example.com` |
| `UPLOAD_DIR` | `./uploads` (relative to API cwd) |
| `BACKUP_DIR` | `./backups` |
| `MYSQLDUMP_PATH` | `mysqldump` (must exist on host for backups) |

Apply schema:

```bash
npm run db:push
npm run db:seed
```

Production build:

```bash
npm run build -w @person-blog/api
node apps/api/dist/main.js
```

Use **HTTPS** reverse proxy (Nginx / Caddy) terminating TLS; forward `Authorization` and cookies. Set `NODE_ENV=production` and `secure` cookies.

## 3. Web (Vite SPA)

Build static assets:

```bash
npm run build -w @person-blog/web
```

Serve `apps/web/dist` from the same origin as the API **or** configure CORS + `credentials` if split origins (already supported in API).

For local dev, Vite proxies `/api` and `/uploads` to `VITE_API_PROXY` (default `http://localhost:3000`).

## 4. Production checklist

- [ ] Strong JWT secrets and unique `SEED_ADMIN_*` overrides.
- [ ] SMTP for real email delivery (`SMTP_*`).
- [ ] Redis for view dedupe and consistent rate limits.
- [ ] Scheduled DB backups + off-site copy of `BACKUP_DIR`.
- [ ] Object storage (S3/OSS) instead of local disk for avatars if multi-instance.

## 5. Optional: EdgeOne Pages (static SPA only)

`edgeone.json` can publish **only** the Vite bundle to Tencent EdgeOne Pages; see [DEPLOY.md](../DEPLOY.md). The API still needs a normal Node host. For the full stack, prefer VM/Kubernetes/PaaS that can run Node + MySQL + Redis.

