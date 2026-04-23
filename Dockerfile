FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ScaleLab.Api/ScaleLab.Api/ScaleLab.Api.csproj ScaleLab.Api/ScaleLab.Api/
RUN dotnet restore ScaleLab.Api/ScaleLab.Api/ScaleLab.Api.csproj
COPY ScaleLab.Api/ScaleLab.Api/ ScaleLab.Api/ScaleLab.Api/
WORKDIR /src/ScaleLab.Api/ScaleLab.Api
RUN dotnet publish ScaleLab.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ScaleLab.Api.dll"]
