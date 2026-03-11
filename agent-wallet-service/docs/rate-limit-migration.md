# Rate Limiter Consolidation Migration Note (Ops)

## What changed

- Consolidated to a single canonical limiter implementation in `src/middleware/auth.js`.
- Removed legacy duplicate middleware: `src/middleware/rateLimit.js`.
- Added `RATE_LIMIT_STRATEGY` environment toggle:
  - `memory` (default): local/single-instance development.
  - `redis`: distributed/production deployments.
- 429 responses now include explicit observability fields: `limit`, `remaining`, and `reset`.

## Required operator actions

1. **Choose a strategy per environment**
   - Local dev: `RATE_LIMIT_STRATEGY=memory`
   - Staging/Prod multi-instance: `RATE_LIMIT_STRATEGY=redis`

2. **For Redis strategy**
   - Set `REDIS_URL` to a reachable Redis endpoint.
   - Ensure network ACL/security group rules allow all service instances to connect.
   - Monitor Redis latency and keyspace memory usage.

3. **Update alerting/parsing for 429s**
   - Parse payload fields: `limit`, `remaining`, `reset`.
   - Continue honoring `Retry-After` header.

## Compatibility notes

- If `RATE_LIMIT_STRATEGY=redis` is set but `REDIS_URL` is missing/unavailable, service falls back to in-memory limiter and logs a warning.
- Existing `RateLimit-*` and `X-RateLimit-*` headers remain available.
