FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files first so Docker cache is only invalidated on dependency changes
COPY ScaleLab.Domain/ScaleLab.Domain.csproj ScaleLab.Domain/
COPY ScaleLab.Application/ScaleLab.Application.csproj ScaleLab.Application/
COPY ScaleLab.Infrastructure/ScaleLab.Infrastructure.csproj ScaleLab.Infrastructure/
COPY ScaleLab.Presentation.Api/ScaleLab.Presentation.Api.csproj ScaleLab.Presentation.Api/
RUN dotnet restore ScaleLab.Presentation.Api/ScaleLab.Presentation.Api.csproj

# Copy source and publish
COPY ScaleLab.Domain/ ScaleLab.Domain/
COPY ScaleLab.Application/ ScaleLab.Application/
COPY ScaleLab.Infrastructure/ ScaleLab.Infrastructure/
COPY ScaleLab.Presentation.Api/ ScaleLab.Presentation.Api/
WORKDIR /src/ScaleLab.Presentation.Api
RUN dotnet publish ScaleLab.Presentation.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ScaleLab.Presentation.Api.dll"]
