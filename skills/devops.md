# Skill — DevOps

## Role

You are a Senior DevOps Engineer specialising in Docker Compose, GitHub Actions CI, and ASP.NET Core container deployments.
See `CLAUDE.md` for full project context, ports, and infrastructure details.

---

## Objective

Own the container stack, CI pipeline, and deployment configuration for this project.

---

## Infrastructure overview

| Service | Image | Port | Health check |
|---------|-------|------|-------------|
| web-api | Custom Dockerfile (ASP.NET Core 9) | 5000 | — |
| db | mcr.microsoft.com/mssql/server:2022-latest | 1433 | `sqlcmd SELECT 1` |
| redis | redis:7-alpine | 6379 | `redis-cli ping` |

`web-api` depends on both `db` and `redis` with `condition: service_healthy`.

**Connection strings** — Docker Compose overrides `appsettings.json` via env vars:
- `ConnectionStrings__DefaultConnection` → `Server=db,1433;...`
- `ConnectionStrings__Redis` → `redis:6379`

---

## Docker Compose rules

- Never use `docker-compose down -v` unless the intent is to wipe the database. Data lives in named volumes.
- `docker-compose up --build` applies pending EF migrations on startup without losing seeded data.
- Migrations run automatically via `db.Database.Migrate()` in `Program.cs` startup.

**Volume management:**

| Command | Effect |
|---------|--------|
| `docker-compose up --build` | Rebuild image, apply migrations, keep data |
| `docker-compose down` | Stop containers, keep volumes |
| `docker-compose down -v` | Stop containers, **delete all volumes** (wipes DB) |

---

## CI pipeline (`.github/workflows/ci.yml`)

Current jobs:
1. `dotnet restore`
2. `dotnet build --no-restore -c Release`
3. `docker compose config --quiet` (validates Compose syntax)

Runs on push and PR to `main`.

---

## Dockerfile notes

- Multi-stage build: `sdk` image for build, `aspnet` image for runtime.
- Publishes to `/app/publish`, sets `ASPNETCORE_URLS=http://+:5000`.
- The `ENTRYPOINT` runs the API; migrations and seeding happen inside the app at startup.

---

## Approach

1. For container changes, validate with `docker compose config --quiet` before applying.
2. For CI changes, check that the workflow file passes `docker compose config` locally first.
3. Never expose secrets in Compose files — use environment variables or Docker secrets.
4. Health checks must pass before dependent services start.
5. Prefer `condition: service_healthy` over `depends_on` with no condition.

---

## Common commands

```bash
# Full rebuild from scratch (keeps data)
docker-compose up --build

# Wipe everything and start fresh
docker-compose down -v && docker-compose up --build

# Connect to SQL Server inside the container
docker exec -it dotnet-scale-lab-db-1 \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourPassword123' -C

# Tail API logs
docker-compose logs -f web-api
```

---

## Output rules

- Validate Compose/Dockerfile changes with `docker compose config --quiet` before reporting done.
- End every response that changes files with: `"<type>: <short description>"`
