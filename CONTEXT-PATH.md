# Custom Context Path and Local Compose

This app supports running under a custom context path (e.g. `/r2r-dashboard-dev`, `/r2r-dashboard-stg`, `/r2r-dashboard-prd`) and no longer sends events to PostHog.

## Quick start with Podman Compose

```bash
# Build and run dev (context path /r2r-dashboard-dev)
podman-compose up -d
# Or: docker compose up -d

# Open in browser
open http://localhost:3000/r2r-dashboard-dev
```

## Local development with a context path

```bash
NEXT_PUBLIC_BASE_PATH=/r2r-dashboard-dev pnpm dev
# Open http://localhost:3005/r2r-dashboard-dev
```

## Compose profiles

- **Default:** `r2r-dashboard-dev` on port 3000, path `/r2r-dashboard-dev`
- **Staging:** `podman-compose --profile stg up -d` → port 3001, path `/r2r-dashboard-stg`
- **Production:** `podman-compose --profile prd up -d` → port 3002, path `/r2r-dashboard-prd`

## Full documentation

- **[R2R-APPLICATION-CONTEXT-PATH-CHANGES.md](../R2R-APPLICATION-CONTEXT-PATH-CHANGES.md)** – All changes (context path, PostHog removal, Dockerfile, compose, dependencies)
- **DEPENDENCIES-PATCH.md** – Dependency upgrades for security
