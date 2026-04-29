FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ScaleLab.Gateway/ScaleLab.Gateway.csproj ScaleLab.Gateway/
RUN dotnet restore ScaleLab.Gateway/ScaleLab.Gateway.csproj
COPY ScaleLab.Gateway/ ScaleLab.Gateway/
WORKDIR /src/ScaleLab.Gateway
RUN dotnet publish ScaleLab.Gateway.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ScaleLab.Gateway.dll"]
