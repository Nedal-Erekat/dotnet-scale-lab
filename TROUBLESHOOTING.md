# Troubleshooting

Problems encountered during development, with root cause and fix. Add new entries at the top.

---

## [2026-04-23] SQL Server port 1433 shows 502 in browser

**Symptom**
Opening `https://<codespace>-1433.app.github.dev/` in the browser returns HTTP 502.

**Root cause**
SQL Server speaks the TDS binary protocol, not HTTP. GitHub Codespaces tries to proxy the connection as HTTP and gets garbage back, so it returns 502.

**Fix**
Port 1433 is not browsable. Connect with a SQL client instead:
```bash
docker exec -it dotnet-scale-lab-db-1 \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourPassword123' -C
```
Or use Azure Data Studio / SSMS with `localhost,1433`.

---

## [2026-04-23] API crashes on startup — SQL Error 208 "Invalid object name 'Products'"

**Symptom**
```
Error Number:208,State:1,Class:16
web-api-1 exited with code 139
```
Crash happens at the `db.Products.Any()` call in `Program.cs`.

**Root cause**
`db.Database.Migrate()` ran successfully but had no migration files to apply — the `Migrations/` folder did not exist. So the schema was never created and the `Products` table did not exist.

**Fix**
Create the initial migration before running the stack:
```bash
cd ScaleLab.Api/ScaleLab.Api
dotnet restore          # must come first
dotnet ef migrations add InitialCreate
```
Then rebuild:
```bash
docker-compose up --build
```

---

## [2026-04-23] `dotnet ef migrations add` — "Assets file not found"

**Symptom**
```
error NETSDK1004: Assets file 'obj/project.assets.json' not found.
Run a NuGet package restore to generate this file.
Unable to retrieve project metadata.
```

**Root cause**
`dotnet restore` had not been run yet, so the `obj/` folder and NuGet lock files were missing.

**Fix**
```bash
dotnet restore
dotnet ef migrations add InitialCreate
```

---

## [2026-04-23] `dotnet ef` — "command or file was not found"

**Symptom**
```
Could not execute because the specified command or file was not found.
dotnet-ef does not exist.
```

**Root cause**
The EF Core CLI global tool was not installed on this machine / Codespace.

**Fix**
```bash
dotnet tool install --global dotnet-ef
```
If still not found after installing, the global tools path is not on `PATH`:
```bash
export PATH="$PATH:$HOME/.dotnet/tools"
```

---

## [2026-04-23] `dotnet ef migrations add` — "No project was found"

**Symptom**
```
No project was found. Change the current working directory or use the --project option.
```

**Root cause**
The command was run from the solution folder (`ScaleLab.Api/`) instead of the project folder that contains the `.csproj`.

**Fix**
Navigate one level deeper:
```bash
cd ScaleLab.Api/ScaleLab.Api   # the folder containing ScaleLab.Api.csproj
dotnet ef migrations add InitialCreate
```

---

## [2026-04-23] Docker Compose — wrong SQL Server connection string format

**Symptom**
API fails to connect to SQL Server. Original connection string used PostgreSQL syntax:
```
Host=db;Database=ProductDb;Username=sa;Password=YourPassword123
```

**Root cause**
SQL Server and PostgreSQL use different connection string formats. `Host=` and `Username=` are PostgreSQL keywords.

**Fix**
SQL Server connection string format:
```
Server=db,1433;Database=ProductDb;User Id=sa;Password=YourPassword123;TrustServerCertificate=True
```
`TrustServerCertificate=True` is required because SQL Server 2022 enforces TLS by default and the container uses a self-signed certificate.
