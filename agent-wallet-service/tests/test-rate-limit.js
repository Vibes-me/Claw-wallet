/**
 * Rate limiting integration tests (burst + sustained)
 * Run: node tests/test-rate-limit.js
 */

import { spawn } from 'child_process';
import { setTimeout as delay } from 'timers/promises';
import { readFileSync } from 'fs';
import { join } from 'path';

const DEFAULT_TEST_PORT = Number(process.env.TEST_SERVER_PORT || '3101');
const TEST_SERVER_TIMEOUT_MS = Number(process.env.TEST_SERVER_TIMEOUT_MS || '120000');
const API_URL = process.env.API_URL || `http://127.0.0.1:${DEFAULT_TEST_PORT}`;
const HEALTH_URL = new URL('/health', API_URL).toString();

let serverProcess = null;
let ownsServer = false;

function resolveApiKey() {
  if (process.env.TEST_API_KEY) return process.env.TEST_API_KEY;

  const keysPath = join(process.cwd(), 'api-keys.json');
  try {
    const keys = JSON.parse(readFileSync(keysPath, 'utf-8'));
    return keys?.[0]?.key;
  } catch {
    return null;
  }
}

async function waitForHealth(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(HEALTH_URL);
      if (response.ok) return true;
    } catch {
      // ignore while waiting for startup
    }
    await delay(500);
  }
  return false;
}

async function stopServer() {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => serverProcess.once('exit', resolve)),
    delay(5000)
  ]);
  if (!serverProcess.killed) serverProcess.kill('SIGKILL');
}

async function ensureServer() {
  if (process.env.API_URL) return;

  try {
    const response = await fetch(HEALTH_URL);
    if (response.ok) return;
  } catch {}

  serverProcess = spawn(process.execPath, ['src/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(DEFAULT_TEST_PORT),
      TEST_WALLET_ENCRYPTION_KEY: 'local-test-wallet-key',
      RATE_LIMIT_STRATEGY: process.env.RATE_LIMIT_STRATEGY || 'memory',
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '1200',
      RATE_LIMIT_MAX_POINTS_FREE: process.env.RATE_LIMIT_MAX_POINTS_FREE || '10',
      RATE_LIMIT_COST_READ: process.env.RATE_LIMIT_COST_READ || '1',
      RATE_LIMIT_COST_WRITE: process.env.RATE_LIMIT_COST_WRITE || '2'
    },
    stdio: 'inherit'
  });
  ownsServer = true;

  const ready = await waitForHealth(TEST_SERVER_TIMEOUT_MS);
  if (!ready) {
    throw new Error('Server failed to start for rate-limit tests');
  }
}

async function authRequest(path, options = {}, apiKey) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...(options.headers || {})
    }
  });

  let body = {};
  try {
    body = await response.json();
  } catch {
    // noop
  }

  return { response, body };
}

async function testBurst(apiKey) {
  console.log('\n🔥 Burst pattern test...');
  const probe = await authRequest('/api-keys', {}, apiKey);
  const limitHeader = Number(probe.response.headers.get('ratelimit-limit'));
  const remainingHeader = Number(probe.response.headers.get('ratelimit-remaining'));

  if (!Number.isFinite(limitHeader) || !Number.isFinite(remainingHeader)) {
    throw new Error('Unable to determine active rate limit from response headers.');
  }

  const burstSize = Math.max(remainingHeader + 10, 25);
  const results = [probe];
  const batchSize = 100;
  let requestsRemaining = burstSize;

  while (requestsRemaining > 0) {
    const currentBatchSize = Math.min(batchSize, requestsRemaining);
    const batchResults = await Promise.all(
      Array.from({ length: currentBatchSize }, () => authRequest('/api-keys', {}, apiKey))
    );
    results.push(...batchResults);
    requestsRemaining -= currentBatchSize;
  }

  const limited = results.filter(({ response }) => response.status === 429);
  if (limited.length === 0) {
    throw new Error('Expected burst pattern to trigger 429 responses, but none were returned.');
  }

  const sample = limited[0];
  const body = sample.body || {};
  if (typeof body.limit !== 'number' || typeof body.remaining !== 'number' || typeof body.reset !== 'number') {
    throw new Error(`Rate-limit observability fields missing on 429 payload: ${JSON.stringify(body)}`);
  }

  const limitedHeader = sample.response.headers.get('ratelimit-limit');
  const remainingLimitedHeader = sample.response.headers.get('ratelimit-remaining');
  const resetHeader = sample.response.headers.get('ratelimit-reset');
  if (!limitedHeader || !remainingLimitedHeader || !resetHeader) {
    throw new Error('Expected standard rate-limit headers were not present on 429 response.');
  }

  console.log(`✅ Burst limited as expected (${limited.length}/${burstSize} responses were 429)`);
}

async function testSustained(apiKey) {
  console.log('\n🌊 Sustained pattern test...');
  await delay(1300);

  for (let i = 0; i < 9; i++) {
    const { response, body } = await authRequest('/api-keys', {}, apiKey);
    if (!response.ok) {
      throw new Error(`Expected sustained request ${i + 1} to pass, got ${response.status}: ${JSON.stringify(body)}`);
    }
    await delay(250);
  }

  console.log('✅ Sustained requests stayed under limit and all passed');
}

async function main() {
  try {
    await ensureServer();
    const apiKey = resolveApiKey();
    if (!apiKey) {
      throw new Error('No API key available. Set TEST_API_KEY or create api-keys.json.');
    }

    await testBurst(apiKey);
    await testSustained(apiKey);

    console.log('\n✅ Rate limiting integration tests completed');
  } finally {
    if (ownsServer) {
      await stopServer();
    }
  }
}

main().catch((error) => {
  console.error('\n❌ Rate limiting tests failed:', error.message);
  process.exit(1);
});
