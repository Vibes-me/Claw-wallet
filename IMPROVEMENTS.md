# Improvement Review: `agent-wallet-service.tar.gz`

I reviewed the code packaged inside `agent-wallet-service.tar.gz` and identified the highest-impact improvements.

## Highest Priority

1. **Fix runtime bug in wallet route import list**
   - `src/routes/wallet.js` calls `getWalletByAddress(...)` but does not import it from `src/services/viem-wallet.js`.
   - Impact: `GET /wallet/:address` can throw `ReferenceError` at runtime.
   - Improvement: add `getWalletByAddress` to the service import list and add a regression test for this endpoint.

2. **Do not accept API keys via query parameters**
   - API keys are accepted through `?apiKey=` in addition to `X-API-Key`.
   - Impact: keys can leak in logs, browser history, proxy caches, and analytics.
   - Improvement: require only header-based credentials and redact auth values in logs.

3. **Harden secret management for API keys and wallet encryption key**
   - API keys are stored in plaintext JSON and the bootstrap admin key is printed to logs.
   - Encryption key derivation can fallback to data file content.
   - Impact: credential disclosure and weak key handling.
   - Improvement: enforce env-provided encryption key in production, hash API keys at rest, and print one-time secrets only in explicit setup mode.

## Medium Priority

4. **Unify and externalize rate limiting**
   - There are two in-memory rate-limiting mechanisms (`auth.js` and `rateLimit.js`) and one is unused by routes.
   - Impact: inconsistent behavior and reset on restart.
   - Improvement: use one middleware and switch backing store to Redis for multi-instance deployments.

5. **Improve input validation and response consistency**
   - Several endpoints do manual checks only; no schema validation layer.
   - Impact: inconsistent errors and less predictable API contracts.
   - Improvement: add request schema validation (e.g., Zod/Joi) and standard error shape.

6. **Fix version drift in API metadata**
   - Health endpoint and root endpoint report different versions.
   - Impact: operational confusion.
   - Improvement: source version from `package.json` at runtime so endpoints are always consistent.

## Lower Priority / Quality

7. **Expand automated tests**
   - Current test coverage appears minimal for auth, permissions, chain fallback behavior, and critical wallet flows.
   - Improvement: add integration tests for create/import/send/sweep + auth/rate-limit edge cases.

8. **Add structured logging and request IDs**
   - Current logs are mostly `console.log`/`console.error`.
   - Improvement: adopt structured logs (pino/winston), include request ID and key prefix only.

9. **Strengthen persistence strategy**
   - Runtime state is persisted to local JSON files.
   - Improvement: move to a proper datastore with atomic writes, locking, and backup strategy.

## Suggested Execution Order

1. Runtime bug + tests.
2. Auth transport hardening (headers only).
3. Secret handling and API key storage hardening.
4. Rate limiting consolidation.
5. Validation + API consistency updates.
6. Observability and persistence upgrades.
