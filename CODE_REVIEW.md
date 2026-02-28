# Agent Wallet Service – Quick Review & Fix Suggestions

I reviewed the code packaged in `agent-wallet-service.tar.gz` and identified a few high-impact issues to fix first.

## 1) Missing import causes runtime failure in wallet route
- In `src/routes/wallet.js`, `getWalletByAddress(...)` is used but not imported from `src/services/viem-wallet.js` in one version of the route file.
- **Impact:** `GET /wallet/:address` can throw at runtime (ReferenceError) and return 500 instead of valid 404/200 behavior.
- **Fix:** Import `getWalletByAddress` explicitly from the wallet service.

## 2) Test script does not match secured API behavior
- `tests/test-wallet.js` calls write endpoints (`/wallet/create`, identity creation) without an API key.
- Current middleware requires `X-API-Key` for protected routes.
- **Impact:** test script fails in normal environments and gives false signals.
- **Fix:**
  - Add support for `TEST_API_KEY` env variable (or load from `api-keys.json` for local smoke tests).
  - Send `X-API-Key` on protected requests.

## 3) Identity test endpoint mismatch
- The test script calls `/identity/register`, but routes expose `/identity/create`.
- **Impact:** guaranteed 404 in tests.
- **Fix:** change test endpoint to `/identity/create` and match request body fields (`walletAddress`, `agentName`, etc.).

## 4) Version metadata drift
- Root endpoint and health endpoint report different versions in some snapshots (`0.3.0` vs `0.4.0`).
- **Impact:** operational confusion and noisy monitoring/docs mismatch.
- **Fix:** centralize version in `package.json` and reference it from handlers.

## 5) Security hardening for API key transport
- Middleware accepts API key via query string (`?apiKey=`) as well as header.
- **Impact:** key leakage risk through logs, browser history, and referrer headers.
- **Fix:** prefer header-only (`X-API-Key`) in production; keep query param only behind explicit dev flag.

## 6) Operational reliability improvements
- `createClientWithFallback` retries RPC endpoints but only validates public clients with `getBlockNumber()`.
- **Impact:** wallet-client failures can still surface later at send time.
- **Fix:** optionally probe wallet paths too (or validate selected RPC once per chain and cache health state).

## Suggested implementation order
1. Runtime correctness: missing import + endpoint mismatch.
2. Test reliability: auth-aware smoke test updates.
3. Security: deprecate query-param API keys.
4. DX/ops polish: version unification and RPC health improvements.
