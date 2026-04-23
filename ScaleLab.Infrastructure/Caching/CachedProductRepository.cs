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

    public async Task<(IReadOnlyList<Product> Data, int TotalCount, string Source)> GetPagedAsync(int page, int pageSize)
    {
        string key = $"products_page_{page}_size_{pageSize}";

        var cached = await _cache.GetStringAsync(key);
        if (cached is not null)
        {
            var hit = JsonSerializer.Deserialize<CachedPage>(cached, JsonOptions)!;
            return (hit.Data, hit.TotalCount, "Cache");
        }

        var (data, totalCount, source) = await _inner.GetPagedAsync(page, pageSize);

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };
        await _cache.SetStringAsync(
            key,
            JsonSerializer.Serialize(new CachedPage(data.ToList(), totalCount), JsonOptions),
            options);

        return (data, totalCount, source);
    }

    private record CachedPage(List<Product> Data, int TotalCount);
}
