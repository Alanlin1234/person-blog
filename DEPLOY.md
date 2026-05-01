# Deployment

This repository’s **primary** deployment target is the **full-stack** application (Node API + MySQL + Redis + static or Vite-built SPA). See:

- [docs/deployment.md](docs/deployment.md) — environment variables, Docker Compose, production checklist  
- [README.md](README.md) — quick start and scripts  

## Historical note — EdgeOne Pages (static)

The root `edgeone.json` file described a **static** build (`npm run build` → `dist/`) for Tencent EdgeOne Pages. That path is **legacy** relative to the dynamic blog in `apps/api` and `apps/web`. You may remove or repurpose `edgeone.json` once you no longer publish a static site from this repo.
