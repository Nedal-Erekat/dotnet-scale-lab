# Testing Notes

Notes on performance testing tools, patterns, and results in this project.

---

## k6 — What it is

k6 is a developer-focused load testing tool. You write test scripts in JavaScript and k6 executes them with a configurable number of virtual users (VUs). It reports timing metrics, error rates, and threshold pass/fail results in the terminal.

k6 does **not** run in a browser — it sends raw HTTP requests. This makes it fast and deterministic for API benchmarking.

---

## Core k6 concepts

| Concept | What it means |
|---------|--------------|
| Virtual User (VU) | A simulated concurrent user; each VU loops through `export default function` repeatedly |
| Iteration | One execution of `export default function` by one VU |
| Stage | A phase with a target VU count and duration; VU count ramps linearly between stages |
| Threshold | A pass/fail assertion on a metric — the test exits non-zero if any threshold is breached |
| Check | An inline assertion (like `status === 200`) — does not fail the test, only adds to the checks counter |
| Tag | A label attached to a request (`{ tags: { endpoint: 'search' } }`) to filter metrics per endpoint |

---

## Reading k6 terminal output

After a run you'll see a summary block like this:

```
http_req_duration............: avg=42ms  min=8ms  med=35ms  max=810ms  p(90)=90ms  p(95)=120ms
http_req_failed..............: 0.00%  ✓ 0  ✗ 3420
checks.......................: 100.00% ✓ 3420 ✗ 0

✓ http_req_duration{endpoint:search} p(95)<2000
✓ http_req_failed rate<0.01
```

**Key percentiles:**
- `p(90)` — 90% of requests completed faster than this value
- `p(95)` — the standard SLA marker; used in thresholds here
- `avg` — misleading under skewed distributions; always prefer percentiles
- `max` — often a one-off spike; don't use as your benchmark target

A `✓` next to a threshold means the API met the target. A `✗` means it did not.

---

## Stress test (`tests/stress-test.js`)

Tests the paginated `GET /api/products` endpoint under increasing concurrency.

**Scenario:**

```
0 ──ramp 20s──► 50 VUs ──ramp 20s──► 100 VUs ──sustain 1m──► ramp down 20s ──► 0
```

**Thresholds:**
- `p(95) < 500 ms` — 95th percentile response time
- `error rate < 1%` — fraction of failed requests

**What to expect:**
- First requests hit the database (`source: "Database"`)
- Subsequent requests for the same page/size are served from Redis (`source: "Cache"`)
- Under sustained load, nearly all responses should come from cache and stay well under 500 ms

---

## Search benchmark (`tests/search-bench.js`)

Tests the `GET /api/products/search?q={term}` endpoint to measure the impact of SQL indexing.

**Why 20 random search terms?**
The search endpoint deliberately bypasses Redis. Using random terms ensures each VU sends a unique-ish query, so no in-memory result caching can help. Every request goes all the way to SQL Server.

**Scenario:**

```
0 ──ramp 30s──► 50 VUs ──sustain 1m──► ramp down ──► 0
```

**Threshold:**
- `p(95) < 2000 ms` — intentionally loose for the no-index baseline; tighten after adding the index

---

## SQL indexing — baseline vs indexed comparison

### Why `Contains` is slow without an index

`p.Name.Contains(term)` compiles to `WHERE Name LIKE '%term%'` in SQL. A leading wildcard (`%term`) forces SQL Server to read every row in the table (full table scan). On 100,000 rows this is expensive under concurrent load.

### Adding the non-clustered index

```sql
CREATE NONCLUSTERED INDEX IX_Products_Name
ON dbo.Products (Name);
```

Run against the live container — no restart needed:

```bash
docker exec -it dotnet-scale-lab-db-1 \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourPassword123' -C \
  -Q "CREATE NONCLUSTERED INDEX IX_Products_Name ON dbo.Products (Name);"
```

### Important caveat — leading wildcard limitation

A non-clustered index on `Name` helps SQL Server avoid a full scan for `LIKE 'term%'` (no leading wildcard). With `LIKE '%term%'` the engine **still performs a scan** but now scans the (narrower) index pages instead of the full clustered index pages — so it is faster, but not as fast as a prefix-only search.

| Query pattern | EF Core method | SQL | Uses index seek? |
|--------------|----------------|-----|-----------------|
| `StartsWith("term")` | `p.Name.StartsWith(q)` | `LIKE 'term%'` | Yes — full seek |
| `Contains("term")` | `p.Name.Contains(q)` | `LIKE '%term%'` | Partial — index scan |

### What to record

Run the benchmark before and after the index and note:

| Run | `p(95)` | `avg` | Notes |
|-----|---------|-------|-------|
| No index | ___ ms | ___ ms | Full clustered index scan |
| With index | ___ ms | ___ ms | Narrower index scan |
| StartsWith + index | ___ ms | ___ ms | True index seek — fastest |

---

## Running the tests

```bash
# Local Docker
k6 run tests/stress-test.js
k6 run tests/search-bench.js

# Codespaces
k6 run -e BASE_URL=https://<codespace>-5000.app.github.dev tests/stress-test.js
k6 run -e BASE_URL=https://<codespace>-5000.app.github.dev tests/search-bench.js
```

Install k6 once per Codespace:

```bash
bash tests/install-k6.sh
```
