# dotnet-scale-lab

A self-directed lab for practising high-performance backend patterns in ASP.NET Core 9. Each iteration adds a new scalability technique on top of the same product catalogue domain.

## Tech stack

| Layer | Technology |
|-------|-----------|
| API | ASP.NET Core 9 — controller-based |
| ORM | Entity Framework Core 9 |
| Database | SQL Server 2022 |
| Cache | Redis |
| Fake data | Bogus |
| Container | Docker Compose |

## Project structure

```
dotnet-scale-lab/
├── ScaleLab.Api/
│   └── ScaleLab.Api/
│       ├── Controllers/        # API controllers
│       ├── Data/               # DbContext, DataSeeder
│       ├── Models/             # Domain models
│       ├── Migrations/         # EF Core migrations (generated)
│       ├── Program.cs
│       └── appsettings.json
├── Dockerfile
├── docker-compose.yml
├── TROUBLESHOOTING.md
└── NOTES.md
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker + Compose in Codespaces)
- [.NET 9 SDK](https://dotnet.microsoft.com/download) — only needed for migration commands
- EF Core CLI tool — install once per machine:

```bash
dotnet tool install --global dotnet-ef
```

> **Codespaces / Linux:** if `dotnet ef` is not found after installing, run:
> `export PATH="$PATH:$HOME/.dotnet/tools"`

## Getting started

Run these steps in order. Skipping any one of them is the most common source of startup errors.

**1. Navigate to the project directory**

```bash
cd ScaleLab.Api/ScaleLab.Api
```

**2. Restore NuGet packages**

```bash
dotnet restore
```

**3. Create the initial migration**

```bash
dotnet ef migrations add InitialCreate
```

**4. Start the full stack**

From the repo root:

```bash
cd ../..
docker-compose up --build
```

On first boot the API will:
- Wait for SQL Server to pass its health check
- Apply pending migrations automatically
- Seed 100,000 products in batches of 10,000 (~30–60 seconds)

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | Paginated product list |
| GET | `/swagger` | Swagger UI (Development only) |

**Pagination query parameters:**

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | — | Page number (1-based) |
| `pageSize` | 50 | 100 | Records per page |

Example: `GET /api/products?page=3&pageSize=100`

## Ports

| Port | Service | Notes |
|------|---------|-------|
| 5000 | ASP.NET Core API | HTTP |
| 1433 | SQL Server | TDS protocol — not browsable |
| 6379 | Redis | — |

> In GitHub Codespaces, replace `localhost` with your forwarded hostname (e.g. `https://<name>-5000.app.github.dev`). Port 1433 will never open in a browser — use a SQL client instead.

## Connecting to SQL Server

```bash
# Via running container
docker exec -it dotnet-scale-lab-db-1 \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourPassword123' -C
```

Or connect with Azure Data Studio / SSMS:
- **Server:** `localhost,1433`
- **Login:** `sa`
- **Password:** `YourPassword123`
- **Encrypt:** Mandatory / Trust server certificate

## Adding a new migration

After changing a model, run from `ScaleLab.Api/ScaleLab.Api`:

```bash
dotnet ef migrations add <MigrationName>
```

The migration is picked up and applied automatically on the next API startup.

## Reference docs

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — errors encountered and their fixes
- [NOTES.md](NOTES.md) — learning notes on patterns and concepts used in this project
