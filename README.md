# dotnet-scale-lab

A self-directed lab for practising high-performance backend patterns in ASP.NET Core 9. Each iteration adds a new scalability technique on top of the same product catalogue domain.

**Current iteration:** Clean Architecture + Cache-Aside Pattern with Redis (Decorator)

## Tech stack

| Layer | Technology |
|-------|-----------|
| API | ASP.NET Core 9 — controller-based |
| ORM | Entity Framework Core 9 |
| Database | SQL Server 2022 |
| Cache | Redis via `IDistributedCache` + StackExchange.Redis |
| Fake data | Bogus |
| Container | Docker Compose |

## Project structure

```
dotnet-scale-lab/
├── ScaleLab.sln
├── ScaleLab.Domain/                        ← no dependencies
│   ├── Entities/Product.cs
│   └── Interfaces/IProductRepository.cs
├── ScaleLab.Application/                   ← depends on Domain
│   ├── DTOs/PagedResult.cs
│   └── Services/ProductService.cs
├── ScaleLab.Infrastructure/                ← depends on Domain + Application
│   ├── Caching/CachedProductRepository.cs
│   └── Persistence/
│       ├── AppDbContext.cs
│       ├── DataSeeder.cs
│       ├── Migrations/
│       └── ProductRepository.cs
├── ScaleLab.Presentation.Api/              ← depends on Application + Infrastructure
│   ├── Controllers/ProductsController.cs
│   ├── Program.cs
│   └── appsettings.json
├── Dockerfile
└── docker-compose.yml
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

Run these steps in order from the **repo root**. Skipping any one of them is the most common source of startup errors.

**1. Restore NuGet packages**

```bash
dotnet restore
```

**2. Create the initial migration**

```bash
dotnet ef migrations add InitialCreate \
  --project ScaleLab.Infrastructure \
  --startup-project ScaleLab.Presentation.Api
```

**3. Start the full stack**

```bash
docker-compose up --build
```

On first boot the API will:
- Wait for SQL Server and Redis to pass their health checks
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

**Response shape:**

```json
{
  "source": "Cache",
  "data": [...],
  "page": 3,
  "pageSize": 100,
  "totalCount": 100000,
  "totalPages": 1000
}
```

`source` is `"Database"` on first request and `"Cache"` for the next 5 minutes.

## Ports

| Port | Service | Notes |
|------|---------|-------|
| 5000 | ASP.NET Core API | HTTP |
| 1433 | SQL Server | TDS protocol — not browsable |
| 6379 | Redis | — |

> In GitHub Codespaces, replace `localhost` with your forwarded hostname (e.g. `https://<name>-5000.app.github.dev`). Port 1433 will never open in a browser — use a SQL client instead.

## Connecting to SQL Server

```bash
docker exec -it dotnet-scale-lab-db-1 \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourPassword123' -C
```

Or connect with Azure Data Studio / SSMS:
- **Server:** `localhost,1433`
- **Login:** `sa`
- **Password:** `YourPassword123`
- **Encrypt:** Mandatory / Trust server certificate

## Adding a new migration

After changing a model, run from the repo root:

```bash
dotnet ef migrations add <MigrationName> \
  --project ScaleLab.Infrastructure \
  --startup-project ScaleLab.Presentation.Api
```

The migration is picked up and applied automatically on the next API startup.

## Load testing with k6

### 1. Install k6 (once per Codespace)

```bash
bash tests/install-k6.sh
```

### 2. Start the stack

```bash
docker-compose up --build
```

Wait until seeding finishes (~30–60 seconds) before running the test.

### 3. Run the stress test

**Local Docker:**
```bash
k6 run tests/stress-test.js
```

**GitHub Codespaces** (port is forwarded via HTTPS):
```bash
k6 run -e BASE_URL=https://<your-codespace>-5000.app.github.dev tests/stress-test.js
```

### 4. Reading the results

k6 prints a live summary to the terminal. Key metrics to watch:

| Metric | Threshold | Meaning |
|--------|-----------|---------|
| `http_req_duration p(95)` | < 500 ms | 95% of requests complete within 500 ms |
| `http_req_failed rate` | < 1% | Fewer than 1% of requests error |

A green `✓` next to each threshold means the API passed. A red `✗` means a threshold was breached — check the `http_req_duration` histogram and `http_req_failed` count for clues.

## Reference docs

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — errors encountered and their fixes
- [NOTES.md](NOTES.md) — learning notes on patterns and concepts used in this project
