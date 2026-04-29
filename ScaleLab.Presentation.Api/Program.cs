using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using ScaleLab.Application.Services;
using ScaleLab.Domain.Interfaces;
using ScaleLab.Infrastructure.Caching;
using ScaleLab.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:5000")
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "ScaleLab:";
});

// Decorator: CachedProductRepository wraps ProductRepository transparently
builder.Services.AddScoped<ProductRepository>();
builder.Services.AddScoped<IProductRepository>(sp =>
    new CachedProductRepository(
        sp.GetRequiredService<ProductRepository>(),
        sp.GetRequiredService<IDistributedCache>()));

builder.Services.AddScoped<ProductService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (!db.Products.Any())
        new DataSeeder(db).Seed(100_000);
}

app.Run();
