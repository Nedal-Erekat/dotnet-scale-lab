using Microsoft.EntityFrameworkCore;
using ScaleLab.Domain.Entities;
using ScaleLab.Domain.Interfaces;

namespace ScaleLab.Infrastructure.Persistence;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _context;

    public ProductRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Product> Data, int TotalCount, string Source)> GetPagedAsync(int page, int pageSize)
    {
        var totalCount = await _context.Products.CountAsync();
        var data = await _context.Products
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (data, totalCount, "Database");
    }
}
