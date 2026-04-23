using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using ScaleLab.Api.Data;
using ScaleLab.Api.Models;
using System.Text.Json;

namespace ScaleLab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IDistributedCache _cache;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ProductsController(AppDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        string cacheKey = $"products_page_{page}_size_{pageSize}";

        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached is not null)
        {
            var cachedPage = JsonSerializer.Deserialize<CachedProductPage>(cached, JsonOptions)!;
            return Ok(new
            {
                source = "Cache",
                data = cachedPage.Data,
                page = cachedPage.Page,
                pageSize = cachedPage.PageSize,
                totalCount = cachedPage.TotalCount,
                totalPages = cachedPage.TotalPages
            });
        }

        var totalCount = await _context.Products.CountAsync();
        var products = await _context.Products
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var payload = new CachedProductPage(products, page, pageSize, totalCount, totalPages);
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(payload, JsonOptions), cacheOptions);

        return Ok(new
        {
            source = "Database",
            data = products,
            page,
            pageSize,
            totalCount,
            totalPages
        });
    }

    private record CachedProductPage(
        List<Product> Data,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);
}
