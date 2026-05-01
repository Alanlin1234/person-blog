# Person Blog — Monorepo

Full-stack personal blog: **NestJS + Prisma + MySQL** API (`apps/api`) and **React + Vite + Tailwind + TipTap** SPA (`apps/web`).

## Requirements

- **Node.js 20+** (LTS recommended; Prisma 6 and Vite 6 expect modern Node).
- **MySQL 8** and optional **Redis** (view dedupe + recommended for production throttling).
- npm registry: project `.npmrc` points to Alibaba mirror; override if needed.

## Quick start

1. Copy [.env.example](.env.example) to `apps/api/.env` and adjust `DATABASE_URL`, `JWT_*`, `APP_URL`, `API_URL`.
2. Start databases: `docker compose up -d` (MySQL + Redis).
3. From repo root:

```powershell
npm install
npm run db:push
npm run db:seed
npm run dev:api
```

4. In another terminal: `npm run dev:web` — open http://localhost:5173  
   Default admin (after seed): `admin@example.com` / `Admin123!@#` (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

- API: http://localhost:3000/api  
- Swagger: http://localhost:3000/api/docs  

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:api` | Nest watch mode |
| `npm run dev:web` | Vite dev server (proxies `/api` and `/uploads`) |
| `npm run build` | Build API + web |
| `npm run db:push` | Prisma `db push` (dev schema sync) |
| `npm run db:migrate` | Prisma migrations (when configured) |
| `npm run db:seed` | Seed roles + admin user |

## Legacy static site

The earlier **EdgeOne static** flow (`edgeone.json`, old `DEPLOY.md` static-only) is superseded by this stack. Static assets for uploads are served from `UPLOAD_DIR` (default `./uploads`) at `/uploads`.

## Documentation

- [docs/SRS.md](docs/SRS.md) — product SRS (dynamic)  
- [docs/database-design.md](docs/database-design.md) — ER and indexes  
- [docs/deployment.md](docs/deployment.md) — Docker / production  
- [docs/user-manual.md](docs/user-manual.md) — end-user guide  

## License

Private / your choice.
