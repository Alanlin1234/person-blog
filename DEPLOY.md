# Deployment

This repository’s **primary** deployment target is the **full-stack** application (Node API + MySQL + Redis + static or Vite-built SPA). See:

- [docs/deployment.md](docs/deployment.md) — environment variables, Docker Compose, production checklist  
- [README.md](README.md) — quick start and scripts  

## EdgeOne Pages (static frontend only)

Root `edgeone.json` is configured for **Tencent EdgeOne Pages** static hosting:

- **Build:** `npm run build:pages` — builds only `@person-blog/web` (Vite → `apps/web/dist`). The full monorepo `npm run build` also compiles the API and is not required here.
- **Output:** `./apps/web/dist` — must match Vite’s `outDir` so Pages does not show `404 NOT_FOUND` with an empty artifact.

The NestJS API is **not** deployed by this file. Point the production SPA at your API origin (e.g. `VITE_API_BASE` / env in the console) so login, posts, and search work.

