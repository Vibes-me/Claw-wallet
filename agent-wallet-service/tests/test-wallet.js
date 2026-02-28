/**
 * Smoke tests for Agent Wallet Service
 * Run: node tests/test-wallet.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3000';

function resolveApiKey() {
  if (process.env.TEST_API_KEY) return process.env.TEST_API_KEY;

  const keysPath = join(process.cwd(), 'api-keys.json');
  const keys = JSON.parse(readFileSync(keysPath, 'utf-8'));
  return keys?.[0]?.key;
}

const API_KEY = resolveApiKey();

if (!API_KEY) {
  throw new Error('No API key available. Set TEST_API_KEY or create api-keys.json.');
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...(options.headers || {})
    }
  });

  const body = await response.json();
  return { response, body };
}

async function testHealth() {
  console.log('\n📊 Testing health endpoint...');
  const res = await fetch(`${API_URL}/health`);
  const data = await res.json();
  console.log('Health:', data.status, data.version);
  return res.ok;
}

async function testCreateWallet() {
  console.log('\n🔐 Testing wallet creation...');
  const { response, body } = await request('/wallet/create', {
    method: 'POST',
    body: JSON.stringify({
      agentName: 'TestAgent',
      chain: 'base-sepolia'
    })
  });

  if (!response.ok) {
    throw new Error(`Wallet creation failed: ${JSON.stringify(body)}`);
  }

  console.log('Wallet created:', body.wallet.address);
  return body.wallet.address;
}

async function testGetBalance(address) {
  console.log('\n💰 Testing balance check...');
  const { response, body } = await request(`/wallet/${address}/balance`);

  if (!response.ok) {
    throw new Error(`Balance check failed: ${JSON.stringify(body)}`);
  }

  console.log('Balance:', body.balance.eth, body.balance.chain);
}

async function testCreateIdentity(walletAddress) {
  console.log('\n🆔 Testing identity creation...');
  const { response, body } = await request('/identity/create', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress,
      agentName: 'Test Agent',
      description: 'A test AI agent',
      agentType: 'assistant'
    })
  });

  if (!response.ok) {
    throw new Error(`Identity creation failed: ${JSON.stringify(body)}`);
  }

  console.log('Identity created:', body.identity.agentId);
}

async function runTests() {
  console.log('🦞 Agent Wallet Service Smoke Tests');
  console.log('===================================');

  const healthy = await testHealth();
  if (!healthy) {
    throw new Error('Server not running. Start with: npm start');
  }

  const address = await testCreateWallet();
  await testGetBalance(address);
  await testCreateIdentity(address);

  console.log('\n✅ All tests completed!');
}

runTests().catch((error) => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
