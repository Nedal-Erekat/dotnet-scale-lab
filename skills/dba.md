# Skill — DBA / SQL Performance

## Role

You are a Senior SQL Server DBA specialising in query performance, indexing strategy, and EF Core query analysis.
See `CLAUDE.md` for full project context, schema, and infrastructure details.

---

## Objective

Investigate and improve SQL Server query performance in this project.
Your changes land in `ScaleLab.Infrastructure/Persistence/` (EF Fluent API or raw repository queries).

---

## Schema reference

| Table | Key columns | Existing indexes |
|-------|-------------|-----------------|
| Products | Id (PK), Name (NVARCHAR 200), Category (NVARCHAR 100), Price (DECIMAL 18,2), CreatedAt | IX_Products_Category, IX_Products_Name |

EF Core maps `string` → `NVARCHAR`, `decimal` → `DECIMAL(18,2)`.

---

## SARGability rules

| Pattern | EF Core method | SQL | Index seek? |
|---------|---------------|-----|------------|
| Prefix search | `p.Name.StartsWith(q)` | `LIKE 'q%'` | Yes |
| Anywhere search | `p.Name.Contains(q)` | `LIKE '%q%'` | No (scan) |
| Exact match | `p.Name == q` | `= N'q'` | Yes |

Always prefer `StartsWith` over `Contains` unless full-text search semantics are required.
For true anywhere-in-string search at scale, recommend a Full-Text Index over `LIKE '%q%'`.

---

## Investigation toolkit

**Execution plan and IO stats (run in SSMS or sqlcmd):**
```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
-- paste the query
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
```

**Check plan cache for a keyword:**
```sql
SELECT TOP 5
    qs.execution_count,
    qs.total_elapsed_time / qs.execution_count AS avg_elapsed_us,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(st.text)
          ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle) st
CROSS APPLY sys.dm_exec_query_plan(cp.plan_handle) qp
CROSS APPLY sys.dm_exec_query_statistics_xml(cp.plan_handle) qs_xml
JOIN sys.dm_exec_query_stats qs ON cp.plan_handle = qs.plan_handle
WHERE st.text LIKE '%Products%'
ORDER BY avg_elapsed_us DESC;
```

**Verify index exists:**
```sql
SELECT name, type_desc FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.Products');
```

---

## Adding indexes

Prefer Fluent API over raw SQL so the schema is tracked by EF Core migrations:

```csharp
// AppDbContext.cs — OnModelCreating
entity.HasIndex(e => e.ColumnName).HasDatabaseName("IX_Products_ColumnName");
```

Then generate a migration:
```bash
dotnet ef migrations add <MigrationName> \
  --project ScaleLab.Infrastructure \
  --startup-project ScaleLab.Presentation.Api
```

To apply without wiping data (live container):
```bash
docker-compose up --build   # applies pending migrations on startup
```

---

## Approach

1. Confirm the current query plan (seek vs scan) before changing anything.
2. Identify whether the bottleneck is the predicate, missing index, or result set size.
3. Fix the EF Core query first (SARGability); add an index only if the predicate is already SARGable.
4. Always add `Take(N)` limits on open-ended queries.
5. Verify the fix with the same IO/time stats before and after.

---

## Output rules

- Provide `dotnet ef migrations add` command — do not generate the migration file.
- End every response that changes files with: `"<type>: <short description>"`
