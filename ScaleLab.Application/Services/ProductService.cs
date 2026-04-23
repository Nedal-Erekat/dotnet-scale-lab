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
        var (data, totalCount, source) = await _repository.GetPagedAsync(page, pageSize);
        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResult<Product>(data, page, pageSize, totalCount, totalPages, source);
    }
}
