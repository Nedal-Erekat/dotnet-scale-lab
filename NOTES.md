# Learning Notes

Personal notes on patterns and concepts encountered in this project. Add new sections as you learn.

---

## Cache-Aside Pattern (Redis + IDistributedCache)

The cache-aside pattern keeps the database as the source of truth while using Redis to serve repeat reads without hitting SQL Server.

**Flow:**
```
Request → Check Redis
              ├── HIT  → deserialize JSON → return { source: "Cache" }
              └── MISS → query DB → serialize → write to Redis (TTL 5 min) → return { source: "Database" }
```

**Key registration in Program.cs:**
```csharp
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "ScaleLab:";  // prefix all keys: "ScaleLab:products_page_1"
});
```

**Injecting and using IDistributedCache:**
```csharp
// Check
var cached = await _cache.GetStringAsync(cacheKey);

// Write with expiry
await _cache.SetStringAsync(key, JsonSerializer.Serialize(data), new DistributedCacheEntryOptions
{
    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
});
```

**Absolute vs Sliding expiry:**
- `AbsoluteExpirationRelativeToNow` — expires after a fixed duration from when it was written, regardless of access. Guarantees data freshness.
- `SlidingExpiration` — resets the timer on every access. Good for user sessions but can keep stale data alive indefinitely if the key is popular.

**Why InstanceName matters:**
`InstanceName = "ScaleLab:"` is prepended to every key automatically by the framework. Without it, key names are bare strings and can collide if multiple apps share the same Redis instance.

**Connection string environments:**
- `appsettings.json` → `localhost:6379` (running with `dotnet run`)
- `docker-compose.yml` env var → `redis:6379` (Docker service name, overrides appsettings at runtime)

---

## EF Core — Migrations vs EnsureCreated

| | `Migrate()` | `EnsureCreated()` |
|-|-------------|-------------------|
| Requires migration files | Yes | No |
| Tracks schema history | Yes | No |
| Safe for incremental changes | Yes | No — drops and recreates |
| Best for | Production / staging | Quick prototyping only |

**Rule of thumb:** use `EnsureCreated()` when you just want the schema to exist and don't care about history. Switch to `Migrate()` once you start tracking changes over time.

---

## EF Core — Change Tracking and memory bloat

EF Core tracks every entity it loads or inserts in memory (the "change tracker"). When seeding large datasets this causes the process heap to grow without bound.

Two ways to clear tracked entities:

```csharp
// Option 1 — clear after each batch (EF Core 5+)
context.ChangeTracker.Clear();

// Option 2 — never track in the first place (read-only queries)
context.Products.AsNoTracking().ToList();
```

In `DataSeeder.cs` we use `ChangeTracker.Clear()` after every `SaveChanges()` so memory stays flat across all 10 batches.

---

## EF Core — AsNoTracking for read queries

```csharp
context.Products
    .AsNoTracking()   // skip the change tracker entirely
    .OrderBy(p => p.Id)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

Use `AsNoTracking()` on any query where you only need to read data and will not update/delete the returned entities. It is faster and uses less memory because EF Core skips building the identity map.

---

## EF Core — Precision on decimal columns

Without explicit configuration, EF Core maps `decimal` to `decimal(18,2)` on SQL Server by default. You can make it explicit in `OnModelCreating`:

```csharp
entity.Property(e => e.Price).HasPrecision(18, 2);
```

This avoids a migration warning and makes the intent clear.

---

## Pagination pattern

Standard offset-based pagination used in `ProductsController`:

```csharp
.Skip((page - 1) * pageSize)
.Take(pageSize)
```

Response shape returns metadata alongside data so the client knows how many pages exist:

```json
{
  "data": [...],
  "page": 1,
  "pageSize": 50,
  "totalCount": 100000,
  "totalPages": 2000
}
```

**Limitation to revisit:** `COUNT(*)` on every request is expensive at scale. Options: cached count, keyset pagination, or approximate row count from SQL Server system tables.

---

## Bogus — generating realistic fake data

```csharp
var faker = new Faker<Product>()
    .RuleFor(p => p.Name, f => f.Commerce.ProductName())
    .RuleFor(p => p.Category, f => f.Commerce.Categories(1)[0])
    .RuleFor(p => p.Price, f => Math.Round(f.Random.Decimal(0.99m, 9_999.99m), 2))
    .RuleFor(p => p.CreatedAt, f => f.Date.Past(2));

var products = faker.Generate(10_000);
```

Key namespaces in Bogus: `Commerce`, `Name`, `Internet`, `Address`, `Date`, `Random`, `Lorem`. Explore them in Swagger or intellisense to see what data each generates.

---

## Docker Compose — health checks and startup order

`depends_on` alone only waits for a container to *start*, not to be *ready*. SQL Server takes ~15–30 seconds to initialise after the container starts. Without a health check the API will attempt to migrate before SQL Server is accepting connections.

```yaml
db:
  healthcheck:
    test: ["/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourPassword123' -Q 'SELECT 1' -b -C"]
    interval: 10s
    timeout: 5s
    retries: 10
    start_period: 30s   # grace period before health checks begin

web-api:
  depends_on:
    db:
      condition: service_healthy   # waits for the health check to pass
```

---

## Docker Compose — connection strings for different environments

The same setting is configured in two places:

| File | Used when |
|------|-----------|
| `appsettings.json` | Running locally with `dotnet run` |
| `docker-compose.yml` environment block | Running inside Docker |

The environment variable `ConnectionStrings__DefaultConnection` (double underscore = section separator) overrides the `appsettings.json` value automatically via ASP.NET Core's configuration system.

---

## Next.js App Router — special file conventions

Next.js treats certain filenames as special within any route segment:

| File | Purpose |
|------|---------|
| `page.tsx` | The UI for the route |
| `layout.tsx` | Shared shell — persists across navigations |
| `loading.tsx` | Automatic Suspense boundary shown while the page loads |
| `error.tsx` | Error boundary — must be `'use client'`; receives `error` + `reset` props |
| `not-found.tsx` | Rendered when `notFound()` is called or the route doesn't exist |
| `route.ts` | API endpoint (no React, returns `Response`) |

`loading.tsx` and `error.tsx` are colocated with `page.tsx` so the boundary scope is clear.

---

## Next.js App Router — Suspense streaming

Suspense streaming lets you send the page shell to the browser immediately and stream in slow sections as they resolve — instead of blocking the entire response on the slowest fetch.

**Pattern:** extract the data-fetching code into a separate async Server Component, then wrap it in `<Suspense>` with a skeleton fallback.

```tsx
// page.tsx — shell renders instantly, no data fetch here
const ProductsPage = async ({ searchParams }) => {
  const { q, page } = await searchParams
  return (
    <main>
      <Header />
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsSection query={q} page={page} />
      </Suspense>
    </main>
  )
}

// _components/products-section.tsx — async Server Component
const ProductsSection = async ({ query, page }: Props) => {
  const data = await getProducts(page)
  return <ProductsGrid products={data.products} />
}
```

**Why it matters:** the user sees the header and skeleton immediately. The products stream in when ready. Without this, the entire page waits on the API.

**With `useTransition`:** when `router.push()` is called inside `startTransition`, React keeps the current tree visible (at `opacity-40` via `ResultsFade`) while the new data resolves. The `<Suspense>` fallback only fires on the initial load — subsequent navigations defer rendering without a flash.

---

## React Context — sharing state between Server Component siblings

Client Components that are siblings inside a Server Component cannot share state via props. Solution: a thin Client Component provider wraps both siblings and exposes state via context.

```
page.tsx (Server Component)
└── SearchProvider (Client — holds useTransition + debounce)
    ├── SearchInput  (Client — calls search() from context)
    └── ResultsFade  (Client — reads isPending from context)
        └── ProductsSection (Server — passed as children, still runs on server)
```

- `useTransition` in the provider gives `isPending` while `router.push()` navigates
- 300 ms debounce via `useRef<ReturnType<typeof setTimeout> | undefined>` prevents a request on every keystroke
- Server Components can be passed as `children` to Client Components — they still run on the server

---

## Tailwind CSS v4 — CSS-first configuration

Tailwind v4 removes `tailwind.config.ts` and the separate PostCSS entry. Configuration moves into CSS.

**Before (v3):**
```js
// tailwind.config.ts
export default { content: ['./app/**/*.{ts,tsx}'], theme: { extend: {} } }
// postcss.config.mjs
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
// globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**After (v4):**
```js
// postcss.config.mjs
export default { plugins: { '@tailwindcss/postcss': {} } }
// globals.css
@import "tailwindcss";
```

Content detection is automatic. Autoprefixing is built in. Custom theme overrides go in CSS using `@theme {}`.

---

## YARP — replacing Nginx with a .NET reverse proxy

YARP (Yet Another Reverse Proxy) is a .NET library (`Yarp.ReverseProxy`) that turns an ASP.NET Core app into a configurable reverse proxy. It replaces external tools like Nginx when you want the proxy to live inside the .NET ecosystem.

**Minimal setup (`Program.cs`):**
```csharp
builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

app.MapReverseProxy();
```

**Configuration (`appsettings.json`):**
```json
{
  "ReverseProxy": {
    "Routes": {
      "api-route": {
        "ClusterId": "web-api",
        "Match": { "Path": "{**catch-all}" },
        "Transforms": [{ "RequestHeaderOriginalHost": "true" }]
      }
    },
    "Clusters": {
      "web-api": {
        "LoadBalancingPolicy": "RoundRobin",
        "HttpClient": { "MaxConnectionsPerServer": 32 },
        "Destinations": {
          "api": { "Address": "http://web-api:8080" }
        }
      }
    }
  }
}
```

**Key concepts:**
- **Route** — matches incoming requests by path, host, headers, query string, or method
- **Cluster** — a named group of destination addresses; YARP picks one per request using the chosen policy
- **LoadBalancingPolicy** — `RoundRobin`, `LeastRequests`, `Random`, `PowerOfTwoChoices`
- **Transforms** — rewrite requests/responses on the fly (headers, path, query string)

**YARP vs Nginx in this project:**

| Concern | Nginx | YARP |
|---------|-------|------|
| Config format | `nginx.conf` | `appsettings.json` |
| Runtime changes | Requires reload | Hot-reload via `IOptionsMonitor` |
| Custom logic | Lua modules | C# middleware / transforms |
| Health checks | `proxy_next_upstream` | Built-in active + passive health checks |
| Deployment | Separate container | Same .NET ecosystem, one Dockerfile pattern |

**Load distribution with Docker Compose scaling:**
When `--scale web-api=3` (or `deploy.replicas: 3`) is used, Docker's internal virtual IP for the `web-api` hostname distributes connections across all replicas at the network layer. A single YARP destination of `http://web-api:8080` is equivalent to Nginx's `server web-api:8080` upstream entry — Docker handles the round-robin below YARP.

---

## Docker Compose — `deploy.replicas` for automatic scaling

Setting the replica count inside `docker-compose.yml` removes the need for the `--scale` flag:

```yaml
web-api:
  build: .
  deploy:
    replicas: 3
```

```bash
# Before — replica count specified at runtime
docker-compose up --build --scale web-api=3

# After — replica count baked into the compose file
docker-compose up --build
```

**Requirements:** Docker Compose v2+ (shipped with Docker Desktop). The `deploy` key is ignored in Compose v1. Services with `deploy.replicas > 1` must not bind host ports — only the gateway/load balancer should expose ports externally.

---

## SQL Server — TrustServerCertificate

SQL Server 2022 enforces encrypted connections by default and uses a self-signed certificate inside Docker. Without `TrustServerCertificate=True` in the connection string the client rejects the certificate and the connection fails.

```
Server=db,1433;Database=ProductDb;User Id=sa;Password=...;TrustServerCertificate=True
```

In production you would provide a real certificate instead of trusting blindly.
