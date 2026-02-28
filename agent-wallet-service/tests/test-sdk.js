/**
 * Basic SDK request behavior checks
 * Run: node tests/test-sdk.js
 */

import AgentWallet from '../sdk.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({ success: true, url, hasApiKey: Boolean(options?.headers?.['X-API-Key']) });
      }
    };
  };

  const sdk = new AgentWallet({ baseUrl: 'http://localhost:3000', apiKey: 'sk_test_123' });
  const result = await sdk.createWallet('SdkTest', 'base-sepolia');

  assert(result.success === true, 'sdk should return parsed payload');
  assert(calls.length === 1, 'expected one network call');
  assert(calls[0].options.headers['X-API-Key'] === 'sk_test_123', 'sdk should attach X-API-Key');

  const preflight = await sdk.preflight('0xfrom', '0xto', '0.001', 'base-sepolia');
  assert(preflight.success === true, 'preflight should succeed');
  assert(calls[1].url.endsWith('/wallet/0xfrom/preflight'), 'preflight endpoint path mismatch');

  console.log('✅ sdk checks passed');
}

run().catch((error) => {
  console.error('❌ sdk checks failed:', error.message);
  process.exit(1);
});
