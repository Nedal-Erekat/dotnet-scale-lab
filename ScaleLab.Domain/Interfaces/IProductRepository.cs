using ScaleLab.Domain.Entities;

namespace ScaleLab.Domain.Interfaces;

public interface IProductRepository
{
    Task<(IReadOnlyList<Product> Data, int TotalCount, string Source)> GetPagedAsync(int page, int pageSize);
}
