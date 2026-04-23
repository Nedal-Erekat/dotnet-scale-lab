# Agent Instructions — Clean Architecture Refactor

These instructions are referenced by the scaffold prompt.
Follow them strictly and in order. Ask before deviating.

---

## Role

You are a Senior .NET Architect specialising in High-Performance Distributed Systems.
Your job is to refactor the existing single-project `ScaleLab.Api` into a Clean Architecture solution.

---

## Current state

The project is a single ASP.NET Core 9 project at `ScaleLab.Api/ScaleLab.Api/`.
It contains: `Product` model, `AppDbContext`, `DataSeeder`, `ProductsController`, and `Program.cs`.
See `CLAUDE.md` for full context, conventions, and infrastructure details.

---

## Target solution structure

```
ScaleLab/                              ← solution root
├── ScaleLab.Domain/                   ← no dependencies
├── ScaleLab.Application/              ← depends on Domain
├── ScaleLab.Infrastructure/           ← depends on Domain + Application
├── ScaleLab.Presentation.Api/         ← depends on Application + Infrastructure
├── docker-compose.yml
├── Dockerfile
└── ScaleLab.sln
```

---

## Step 1 — Create projects and solution

Run from the solution root:

```bash
dotnet new sln -n ScaleLab
dotnet new classlib -n ScaleLab.Domain
dotnet new classlib -n ScaleLab.Application
dotnet new classlib -n ScaleLab.Infrastructure
dotnet new webapi -n ScaleLab.Presentation.Api

dotnet sln add ScaleLab.Domain
dotnet sln add ScaleLab.Application
dotnet sln add ScaleLab.Infrastructure
dotnet sln add ScaleLab.Presentation.Api
```

---

## Step 2 — Project references

```bash
# Application depends on Domain
dotnet add ScaleLab.Application reference ScaleLab.Domain

# Infrastructure depends on Domain and Application
dotnet add ScaleLab.Infrastructure reference ScaleLab.Domain
dotnet add ScaleLab.Infrastructure reference ScaleLab.Application

# Presentation depends on Application and Infrastructure
dotnet add ScaleLab.Presentation.Api reference ScaleLab.Application
dotnet add ScaleLab.Presentation.Api reference ScaleLab.Infrastructure
```

**Rule:** Domain has zero project references. It knows nothing about EF Core, Redis, or ASP.NET.

---

## Step 3 — NuGet packages per project

### ScaleLab.Domain
No NuGet packages.

### ScaleLab.Application
No NuGet packages.

### ScaleLab.Infrastructure
```
Microsoft.EntityFrameworkCore.SqlServer   9.x
Microsoft.EntityFrameworkCore.Design      9.x
Microsoft.EntityFrameworkCore.Tools       9.x
Microsoft.Extensions.Caching.StackExchangeRedis  9.x
Bogus  35.x
```

### ScaleLab.Presentation.Api
```
Microsoft.EntityFrameworkCore.Design      9.x  (for migrations CLI)
Swashbuckle.AspNetCore                    6.9.x
```

---

## Step 4 — Domain layer

**File:** `ScaleLab.Domain/Entities/Product.cs`
```csharp
namespace ScaleLab.Domain.Entities;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

**File:** `ScaleLab.Domain/Interfaces/IProductRepository.cs`
```csharp
using ScaleLab.Domain.Entities;

namespace ScaleLab.Domain.Interfaces;

public interface IProductRepository
{
    Task<(IReadOnlyList<Product> Data, int TotalCount)> GetPagedAsync(int page, int pageSize);
}
```

---

## Step 5 — Application layer

**File:** `ScaleLab.Application/DTOs/PagedResult.cs`
```csharp
namespace ScaleLab.Application.DTOs;

public record PagedResult<T>(
    IReadOnlyList<T> Data,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);
```

**File:** `ScaleLab.Application/Services/ProductService.cs`
```csharp
using ScaleLab.Application.DTOs;
using ScaleLab.Domain.Entities;
using ScaleLab.Domain.Interfaces;

namespace ScaleLab.Application.Services;

public class ProductService
{
    private readonly IProductRepository _repository;

    public ProductService(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<Product>> GetProductsAsync(int page, int pageSize)
    {
        var (data, totalCount) = await _repository.GetPagedAsync(page, pageSize);
        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResult<Product>(data, page, pageSize, totalCount, totalPages);
    }
}
```

---

## Step 6 — Infrastructure layer

### DbContext
**File:** `ScaleLab.Infrastructure/Persistence/AppDbContext.cs`

Standard EF Core DbContext with `DbSet<Product>`.
Configure `HasPrecision(18,2)` for Price and an index on Category.

### ProductRepository
**File:** `ScaleLab.Infrastructure/Persistence/ProductRepository.cs`

Implements `IProductRepository`.
Uses `AsNoTracking()` for the paged query.
Returns both the page data and total count.

### CachedProductRepository — Decorator
**File:** `ScaleLab.Infrastructure/Caching/CachedProductRepository.cs`

```csharp
using Microsoft.Extensions.Caching.Distributed;
using ScaleLab.Domain.Entities;
using ScaleLab.Domain.Interfaces;
using System.Text.Json;

namespace ScaleLab.Infrastructure.Caching;

public class CachedProductRepository : IProductRepository
{
    private readonly IProductRepository _inner;
    private readonly IDistributedCache _cache;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public CachedProductRepository(IProductRepository inner, IDistributedCache cache)
    {
        _inner = inner;
        _cache = cache;
    }

    public async Task<(IReadOnlyList<Product> Data, int TotalCount)> GetPagedAsync(int page, int pageSize)
    {
        string key = $"products_page_{page}_size_{pageSize}";

        var cached = await _cache.GetStringAsync(key);
        if (cached is not null)
            return JsonSerializer.Deserialize<(IReadOnlyList<Product>, int)>(cached, JsonOptions);

        var result = await _inner.GetPagedAsync(page, pageSize);

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };
        await _cache.SetStringAsync(key, JsonSerializer.Serialize(result, JsonOptions), options);

        return result;
    }
}
```

### DataSeeder
**File:** `ScaleLab.Infrastructure/Persistence/DataSeeder.cs`

- Uses `Bogus.Faker<Product>` to generate realistic data.
- Seeds in batches of 10,000.
- Calls `context.ChangeTracker.Clear()` after every `SaveChanges()` to prevent memory bloat.
- Only runs if the Products table is empty.

---

## Step 7 — Presentation.Api layer

### Dependency registration (Program.cs)

```csharp
// Infrastructure
builder.Services.AddDbContext<AppDbContext>(...);
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "ScaleLab:";
});

// Repository with Decorator
builder.Services.AddScoped<ProductRepository>();
builder.Services.AddScoped<IProductRepository>(sp =>
    new CachedProductRepository(
        sp.GetRequiredService<ProductRepository>(),
        sp.GetRequiredService<IDistributedCache>()));

// Application service
builder.Services.AddScoped<ProductService>();
```

### ProductsController
- Inject `ProductService` only — the controller never touches `IDistributedCache` or `AppDbContext`.
- Return `source` field: `"Cache"` or `"Database"` — this comes from the service/repository layer, not the controller.
- Query parameters: `page` (default 1), `pageSize` (default 50, max 100).
- Response shape: `{ source, data, page, pageSize, totalCount, totalPages }`.

---

## Step 8 — Docker Compose

Requirements:
- Services: `web-api`, `db` (SQL Server 2022), `redis`
- SQL Server health check using `sqlcmd SELECT 1`
- Redis health check using `redis-cli ping`
- `web-api` depends on both with `condition: service_healthy`
- Connection strings passed via environment variables

---

## Step 9 — EF Core migrations

After scaffolding, run from `ScaleLab.Infrastructure/` (or use `--project` flag):

```bash
dotnet ef migrations add InitialCreate \
  --project ScaleLab.Infrastructure \
  --startup-project ScaleLab.Presentation.Api
```

---

## Implementation rules

1. **Ask before implementing** if any requirement seems ambiguous or contradictory.
2. **File-scoped namespaces** — always (`namespace Foo.Bar;` not `namespace Foo.Bar { }`).
3. **No comments** that describe what the code does. Only add a comment when the *why* is non-obvious.
4. **No features beyond the spec** — no extra abstractions, no future-proofing.
5. **Keep it SOLID + KISS** — the Decorator wires up in DI registration, not inside the classes themselves.
6. Update `NOTES.md` when introducing a new pattern.
7. Update `TROUBLESHOOTING.md` when hitting and resolving an error.
